// Local-only helper: runs the files in /api as a tiny web server on port 3001.
// Use it instead of `vercel dev`. Vercel itself does not use this file when you deploy.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const PORT = 3001;

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const name = url.pathname.replace(/^\/api\//, "");
    const file = path.resolve("api", name + ".js");

    // Only allow plain names like "login" (no folders, no files starting with "_")
    if (!name || name.includes("/") || name.startsWith("_") || !fs.existsSync(file)) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({ error: "Not found" }));
    }

    // Read the JSON body, like Vercel does for us in production
    let raw = "";
    for await (const chunk of req) raw += chunk;
    try {
      req.body = raw ? JSON.parse(raw) : {};
    } catch {
      req.body = {};
    }

    // Vercel-style helpers: res.status(...).json(...)
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (data) => {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(data));
    };

    try {
      const mod = await import(pathToFileURL(file).href);
      await mod.default(req, res);
    } catch (err) {
      console.error("API error in /api/" + name + ":", err);
      res.status(500).json({ error: "Server error" });
    }
  })
  .listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
