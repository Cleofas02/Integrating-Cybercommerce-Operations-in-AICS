import { neon } from "@neondatabase/serverless";

// One shared connection helper. The URL comes from an environment variable,
// never from the code, so the password stays out of GitHub.
export const sql = neon(process.env.DATABASE_URL);
