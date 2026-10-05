import { sql } from "./_db.js";
import { getUser } from "./_auth.js";

// Admins only.
//   GET    -> all orders still on the list + today's numbers + last 7 days of sales
//   PUT    -> { code, status: "Ready" }  mark a Preparing order as Ready
//   DELETE -> { code }                   remove a CLAIMED order from the list (hides it, sales still count it)
// Note: we never send the reference number to the admin screen. It exists only on the
// student's ticket, so typing it at the counter really proves the student has the ticket.
export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Please log in." });
  if (user.role !== "admin") return res.status(403).json({ error: "Admins only." });

  const body = req.body || {};
  const code = String(body.code ?? "").trim().toUpperCase();

  try {
    if (req.method === "GET") {
      const rows = await sql`
        SELECT o.code, o.pickup_time, o.status, o.total, u.name AS buyer
        FROM orders o
        JOIN users u ON u.id = o.user_id
        WHERE NOT o.removed
        ORDER BY o.created_at DESC, o.id DESC`;

      // "Today" means today in the Philippines. Sales = cash actually collected, i.e. CLAIMED orders.
      const [s] = await sql`
        SELECT
          COALESCE(SUM(total) FILTER (WHERE status = 'Claimed'
            AND (claimed_at AT TIME ZONE 'Asia/Manila')::date = (now() AT TIME ZONE 'Asia/Manila')::date), 0) AS sales_today,
          COUNT(*) FILTER (WHERE (created_at AT TIME ZONE 'Asia/Manila')::date = (now() AT TIME ZONE 'Asia/Manila')::date) AS orders_today,
          COUNT(*) FILTER (WHERE status = 'Claimed'
            AND (claimed_at AT TIME ZONE 'Asia/Manila')::date = (now() AT TIME ZONE 'Asia/Manila')::date) AS claimed_today
        FROM orders`;

      // generate_series(0, 6) gives 0..6, so we get the last 7 days even on days with no sales.
      const week = await sql`
        WITH days AS (
          SELECT (now() AT TIME ZONE 'Asia/Manila')::date - n AS d FROM generate_series(0, 6) AS n
        )
        SELECT to_char(days.d, 'Dy') AS day, COALESCE(SUM(o.total), 0) AS total
        FROM days
        LEFT JOIN orders o ON o.status = 'Claimed' AND (o.claimed_at AT TIME ZONE 'Asia/Manila')::date = days.d
        GROUP BY days.d
        ORDER BY days.d`;

      return res.status(200).json({
        orders: rows.map((r) => ({ id: r.code, buyer: r.buyer, pickup: r.pickup_time, status: r.status, total: Number(r.total) })),
        stats: { salesToday: Number(s.sales_today), ordersToday: Number(s.orders_today), claimedToday: Number(s.claimed_today) },
        week: week.map((w) => ({ day: w.day, total: Number(w.total) })),
      });
    }

    if (req.method === "PUT") {
      if (body.status !== "Ready") return res.status(400).json({ error: "Only 'Ready' can be set here." });
      const rows = await sql`UPDATE orders SET status = 'Ready' WHERE code = ${code} AND status = 'Preparing' RETURNING code`;
      if (!rows[0]) return res.status(409).json({ error: "That order is not waiting to be prepared." });
      return res.status(200).json({ ok: true });
    }

    if (req.method === "DELETE") {
      const rows = await sql`UPDATE orders SET removed = true WHERE code = ${code} AND status = 'Claimed' AND NOT removed RETURNING code`;
      if (!rows[0]) return res.status(409).json({ error: "Only claimed orders can be removed." });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error. Try again." });
  }
}
