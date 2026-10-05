import bcrypt from "bcryptjs";
import { sql } from "./_db.js";
import { createToken, setCookie } from "./_auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });

  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Enter your email and password." });

  // ${...} inside sql`...` is sent to Postgres as a separate value, not pasted into the text.
  // That is what protects us from SQL injection.
  const rows = await sql`
    SELECT id, name, role, password_hash FROM users WHERE email = ${email.trim().toLowerCase()}
  `;
  const user = rows[0];

  // Same error for "no such email" and "wrong password", so nobody can probe which emails exist.
  const ok = user && (await bcrypt.compare(password, user.password_hash));
  if (!ok) return res.status(401).json({ error: "Wrong email or password." });

  setCookie(res, await createToken(user));
  res.status(200).json({ user: { id: user.id, name: user.name, role: user.role } });
}
