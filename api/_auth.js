import { SignJWT, jwtVerify } from "jose";

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET);

// A token is a signed note saying "this is user 2, a student".
// Only our server can sign it, so the browser can't fake it.
export async function createToken(user) {
  return new SignJWT({ role: user.role, name: user.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setExpirationTime("7d")
    .sign(secret());
}

// Read the token from the cookie and check the signature.
export async function getUser(req) {
  const match = (req.headers.cookie || "").match(/(?:^|;\s*)token=([^;]+)/);
  if (!match) return null;
  try {
    const { payload } = await jwtVerify(match[1], secret());
    return { id: Number(payload.sub), role: payload.role, name: payload.name };
  } catch {
    return null; // expired or tampered
  }
}

// HttpOnly = JavaScript in the browser can't read the cookie (protects against theft).
export function setCookie(res, token) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `token=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800${secure}`);
}

export function clearCookie(res) {
  res.setHeader("Set-Cookie", "token=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0");
}
