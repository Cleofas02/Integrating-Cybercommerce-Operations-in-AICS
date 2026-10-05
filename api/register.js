import bcrypt from "bcryptjs";
import { sql } from "./_db.js";
import { createToken, setCookie } from "./_auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });

  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: "Fill in every field." });
  if (password.length < 8) return res.status(400).json({ error: "Use a password with at least 8 characters." });

  const hash = await bcrypt.hash(password, 10);

  // The role is ALWAYS 'student' here. We never accept a role from the browser,
  // otherwise anyone could register themselves as an admin.
  // ON CONFLICT: if the email already exists, insert nothing and return no row.
  const rows = await sql`
    INSERT INTO users (name, email, password_hash, role)
    VALUES (${name.trim()}, ${email.trim().toLowerCase()}, ${hash}, 'student')
    ON CONFLICT (email) DO NOTHING
    RETURNING id, name, role
  `;
  const user = rows[0];
  if (!user) return res.status(409).json({ error: "That email is already registered. Try logging in." });

  setCookie(res, await createToken(user));
  res.status(201).json({ user });
}
