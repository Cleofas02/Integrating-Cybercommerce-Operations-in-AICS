import { sql } from "./_db.js";
import { getUser } from "./_auth.js";

// GET /api/menu  ->  the menu for the logged-in person.
// Students only see items that are available. Admins also see hidden (unavailable) ones.
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed." });

  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Please log in." });

  const rows =
    user.role === "admin"
      ? await sql`SELECT id, name, category, price, emoji, is_available FROM menu_items WHERE NOT archived ORDER BY id`
      : await sql`SELECT id, name, category, price, emoji, is_available FROM menu_items WHERE NOT archived AND is_available ORDER BY id`;

  // Postgres NUMERIC arrives as text ("55.00"), so turn it into a real number.
  res.status(200).json({ items: rows.map((r) => ({ ...r, price: Number(r.price) })) });
}
