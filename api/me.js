import { getUser } from "./_auth.js";

// The app calls this when it opens, to find out if someone is already logged in.
export default async function handler(req, res) {
  const user = await getUser(req);
  res.status(200).json({ user });
}
