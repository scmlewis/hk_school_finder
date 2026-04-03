import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import { fetchSchoolsCached, fetchSchoolNetsCached } from "./shared/dataFetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());

  // Test route
  app.get("/api/test", (req, res) => {
    res.json({ status: "ok", message: "Server is reachable" });
  });

  // Proxy route for EDB School Data to bypass CORS
  app.get("/api/schools", async (req, res) => {
    try {
      const payload = await fetchSchoolsCached();
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.setHeader("X-Data-Updated-At", new Date(payload.updatedAt).toISOString());
      res.json(payload.data);
    } catch (error: any) {
      if (error.code === "ECONNABORTED") {
        res.status(504).json({ error: "Request to EDB timed out" });
      } else if (error.response) {
        res.status(error.response.status).json({ error: `EDB API error: ${error.response.status}` });
      } else {
        res.status(500).json({ error: `Failed to fetch school data: ${error.message}` });
      }
    }
  });

  // Proxy route for School Net GeoJSON
  app.get("/api/school-nets", async (req, res) => {
    try {
      const payload = await fetchSchoolNetsCached();
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.setHeader("X-Data-Updated-At", new Date(payload.updatedAt).toISOString());
      res.json(payload.data);
    } catch (error: any) {
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
