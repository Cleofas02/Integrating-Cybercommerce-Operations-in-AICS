import { sql } from "./_db.js";
import { getUser } from "./_auth.js";

const CATEGORIES = ["Meals", "Snacks", "Drinks", "Events & Fees"];

// Never trust what the browser sends: check every field.
function clean(body) {
  const name = String(body.name ?? "").trim();
  const price = Number(body.price);
  const emoji = String(body.emoji ?? "").trim() || "🍽️";
  if (!name || name.length > 80) return { error: "Enter a name (up to 80 characters)." };
  if (!CATEGORIES.includes(body.category)) return { error: "Pick a valid category." };
  if (!Number.isFinite(price) || price < 0 || price > 100000) return { error: "Enter a valid price." };
  if (emoji.length > 8) return { error: "Use a single emoji." };
  return { name, category: body.category, price: Math.round(price * 100) / 100, emoji, available: body.is_available !== false };
}

const out = (r) => ({ ...r, price: Number(r.price) });

// POST = add an item, PUT = edit it, DELETE = remove it (hide it). Admins only.
export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Please log in." });
  if (user.role !== "admin") return res.status(403).json({ error: "Admins only." });

  const body = req.body || {};
  const id = Number(body.id);

  try {
    if (req.method === "POST") {
      const v = clean(body);
      if (v.error) return res.status(400).json({ error: v.error });
      const rows = await sql`
        INSERT INTO menu_items (name, category, price, emoji, is_available)
        VALUES (${v.name}, ${v.category}, ${v.price}, ${v.emoji}, ${v.available})
        RETURNING id, name, category, price, emoji, is_available`;
      return res.status(201).json({ item: out(rows[0]) });
    }

    if (req.method === "PUT") {
      const v = clean(body);
      if (v.error) return res.status(400).json({ error: v.error });
      if (!Number.isInteger(id)) return res.status(400).json({ error: "Missing item id." });
      const rows = await sql`
        UPDATE menu_items
        SET name = ${v.name}, category = ${v.category}, price = ${v.price}, emoji = ${v.emoji}, is_available = ${v.available}
        WHERE id = ${id} AND NOT archived
        RETURNING id, name, category, price, emoji, is_available`;
      if (!rows[0]) return res.status(404).json({ error: "Item not found." });
      return res.status(200).json({ item: out(rows[0]) });
    }

    if (req.method === "DELETE") {
      if (!Number.isInteger(id)) return res.status(400).json({ error: "Missing item id." });
      const rows = await sql`UPDATE menu_items SET archived = true WHERE id = ${id} AND NOT archived RETURNING id`;
      if (!rows[0]) return res.status(404).json({ error: "Item not found." });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed." });
  } catch (err) {
    if (err.code === "23505" || /duplicate key/i.test(err.message || "")) {
      return res.status(409).json({ error: "An item with that name already exists." });
    }
    console.error(err);
    return res.status(500).json({ error: "Server error. Try again." });
  }
}
