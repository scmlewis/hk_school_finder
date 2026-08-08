import { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchSchoolsCached } from "../shared/dataFetch.js";

const ALLOWED_ORIGINS = [
  "https://hk-school-finder.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
];

function setSecurityHeaders(res: VercelResponse, origin: string | undefined) {
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(self)");
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const origin = req.headers.origin as string | undefined;
  setSecurityHeaders(res, origin);

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const payload = await fetchSchoolsCached();
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.setHeader("X-Data-Updated-At", new Date(payload.updatedAt).toISOString());
    return res.json(payload.data);
  } catch (error: any) {
    console.error("Proxy error fetching schools:", error.name, error.message);
    if (error.code === "ECONNABORTED") {
      return res.status(504).json({ error: "Request to upstream API timed out" });
    }
    return res.status(500).json({ error: "Failed to fetch school data" });
  }
}
