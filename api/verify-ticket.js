import { sql } from "./_db.js";
import { getUser } from "./_auth.js";

// POST /api/verify-ticket  { code, reference }   (admins only)
// Two-step check: the ticket code AND the 6-digit reference number must belong to the SAME order.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });

  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Please log in." });
  if (user.role !== "admin") return res.status(403).json({ error: "Admins only." });

  const code = String(req.body?.code ?? "").trim().toUpperCase();
  const reference = String(req.body?.reference ?? "").trim();

  try {
    const rows = await sql`SELECT code, status FROM orders WHERE code = ${code} AND reference_no = ${reference}`;

    // One message for "wrong code" and "wrong reference", so nobody can guess one part at a time.
    if (!rows[0]) return res.status(404).json({ error: "The ticket code and reference number don't match any order." });

    const order = rows[0];
    if (order.status === "Claimed") return res.status(409).json({ error: `${order.code} was already claimed.` });
    if (order.status === "Preparing") {
      return res.status(409).json({ error: `${order.code} is valid but still being prepared. Mark it ready first.` });
    }

    // "AND status = 'Ready'" makes the claim safe if the admin taps twice: only one update can win.
    const done = await sql`
      UPDATE orders SET status = 'Claimed', claimed_at = now()
      WHERE code = ${code} AND status = 'Ready'
      RETURNING code, total`;
    if (!done[0]) return res.status(409).json({ error: `${order.code} was already claimed.` });

    return res.status(200).json({ code: done[0].code, total: Number(done[0].total) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error. Try again." });
  }
}
