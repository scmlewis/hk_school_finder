import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import { fetchSchoolsCached, fetchSchoolNetsCached } from "./shared/dataFetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://hk-school-finder.vercel.app",
];

function isProduction() {
  return process.env.NODE_ENV === "production";
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: false,
    })
  );

  app.use(express.json({ limit: "1kb" }));

  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "geolocation=(self)");
    if (isProduction()) {
      res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    }
    next();
  });

  // Test route
  app.get("/api/test", (req, res) => {
    res.json({ status: "ok", message: "Server is reachable" });
  });

  const apiRequestCounts = new Map<string, { count: number; resetAt: number }>();
  const RATE_LIMIT_WINDOW_MS = 60_000;
  const RATE_LIMIT_MAX = 30;

  function rateLimit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const entry = apiRequestCounts.get(ip);
    if (!entry || now > entry.resetAt) {
      apiRequestCounts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
      return next();
    }
    entry.count++;
    if (entry.count > RATE_LIMIT_MAX) {
      res.setHeader("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({ error: "Too many requests. Please try again later." });
    }
    next();
  }

  app.get("/api/schools", rateLimit, async (req, res) => {
    try {
      const payload = await fetchSchoolsCached();
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.setHeader("X-Data-Updated-At", new Date(payload.updatedAt).toISOString());
      res.json(payload.data);
    } catch (error: any) {
      if (error.code === "ECONNABORTED") {
        res.status(504).json({ error: "Request to upstream API timed out" });
      } else if (error.response) {
        res.status(error.response.status).json({ error: "Failed to fetch school data" });
      } else {
        res.status(500).json({ error: "Failed to fetch school data" });
      }
    }
  });

  app.get("/api/school-nets", rateLimit, async (req, res) => {
    try {
      const payload = await fetchSchoolNetsCached();
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.setHeader("X-Data-Updated-At", new Date(payload.updatedAt).toISOString());
      res.json(payload.data);
    } catch {
      res.json({ type: "FeatureCollection", features: [] });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, isProduction() ? "0.0.0.0" : "127.0.0.1", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
