import { randomInt } from "node:crypto";
import { sql } from "./_db.js";
import { getUser } from "./_auth.js";

// Must match the choices on the Checkout page.
const PICKUP = ["Recess (9:30 AM)", "Lunch (12:00 PM)", "After class (3:30 PM)"];

// GET  /api/orders  ->  the logged-in student's own orders (their tickets).
// POST /api/orders  ->  place a new order.
export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Please log in." });
  if (user.role !== "student") return res.status(403).json({ error: "Students only." });

  try {
    if (req.method === "GET") {
      // json_agg packs each order's items into one JSON list, so we need only one query.
      const rows = await sql`
        SELECT o.code, o.reference_no, o.pickup_time, o.status, o.total, o.created_at,
               COALESCE(
                 json_agg(
                   json_build_object('id', m.id, 'name', m.name, 'emoji', m.emoji, 'qty', oi.quantity, 'price', oi.unit_price)
                   ORDER BY oi.id
                 ) FILTER (WHERE oi.id IS NOT NULL),
                 '[]'::json
               ) AS items
        FROM orders o
        LEFT JOIN order_items oi ON oi.order_id = o.id
        LEFT JOIN menu_items m ON m.id = oi.menu_item_id
        WHERE o.user_id = ${user.id}
        GROUP BY o.id
        ORDER BY o.created_at DESC, o.id DESC`;

      const orders = rows.map((r) => ({
        id: r.code, // the ticket code, e.g. "ORD-1004"
        ref: r.reference_no,
        pickup: r.pickup_time,
        status: r.status,
        total: Number(r.total),
        items: r.items.map((i) => ({ ...i, price: Number(i.price) })),
      }));
      return res.status(200).json({ orders });
    }

    if (req.method === "POST") {
      const body = req.body || {};

      // Never trust the browser: check the pickup time and every cart line.
      if (!PICKUP.includes(body.pickup)) return res.status(400).json({ error: "Pick a valid claim time." });
      if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 30) {
        return res.status(400).json({ error: "Your cart is empty." });
      }

      // Merge repeated items (same id twice) into one line.
      const merged = new Map();
      for (const it of body.items) {
        const id = Number(it?.id);
        const qty = Number(it?.qty);
        if (!Number.isInteger(id) || !Number.isInteger(qty) || qty < 1) {
          return res.status(400).json({ error: "Invalid item in the cart." });
        }
        merged.set(id, (merged.get(id) || 0) + qty);
      }
      const lines = [...merged].map(([id, qty]) => ({ id, qty }));
      if (lines.some((l) => l.qty > 20)) return res.status(400).json({ error: "Up to 20 of each item per order." });

      // The browser only sends item ids + quantities. The PRICES come from the database.
      // One statement does everything, so it either fully works or does nothing:
      //   priced     = the cart joined with menu_items (only items that still exist and are available)
      //   new_order  = the order row; HAVING count(*) = N means "only if EVERY item was found"
      //   new_items  = one order_items row per line, saving the price at this moment
      // The reference number is random, so on the (very rare) clash we just try again.
      for (let attempt = 0; attempt < 5; attempt++) {
        const reference = String(randomInt(100000, 1000000)); // 6 digits
        try {
          const rows = await sql`
            WITH priced AS (
              SELECT m.id, m.price, l.qty
              FROM jsonb_to_recordset(${JSON.stringify(lines)}::jsonb) AS l(id int, qty int)
              JOIN menu_items m ON m.id = l.id
              WHERE NOT m.archived AND m.is_available
            ),
            new_order AS (
              INSERT INTO orders (code, user_id, pickup_time, payment_method, total, reference_no, created_at)
              SELECT 'ORD-' || nextval('order_code_seq'), ${user.id}::int, ${body.pickup}::text,
                     'Cash at the counter', SUM(price * qty), ${reference}::text, now()
              FROM priced
              HAVING count(*) = ${lines.length}::int
              RETURNING id, code
            ),
            new_items AS (
              INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price)
              SELECT new_order.id, priced.id, priced.qty, priced.price
              FROM new_order CROSS JOIN priced
            )
            SELECT code FROM new_order`;

          if (!rows[0]) {
            return res.status(409).json({ error: "Some items are no longer available. Please check your cart." });
          }
          return res.status(201).json({ code: rows[0].code });
        } catch (err) {
          if (err.code === "23505") continue; // reference number clash -> new random number
          throw err;
        }
      }
      return res.status(500).json({ error: "Could not create the order. Try again." });
    }

    return res.status(405).json({ error: "Method not allowed." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error. Try again." });
  }
}
