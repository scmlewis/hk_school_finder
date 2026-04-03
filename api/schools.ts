import { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchSchoolsCached } from "../shared/dataFetch.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    const payload = await fetchSchoolsCached();
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.setHeader("X-Data-Updated-At", new Date(payload.updatedAt).toISOString());
    return res.json(payload.data);
  } catch (error: any) {
    console.error("Proxy error fetching schools:", error.name, error.message);
    if (error.code === "ECONNABORTED") {
      return res.status(504).json({ error: "Request to EDB timed out" });
    } else if (error.response) {
      return res
        .status(error.response.status)
        .json({ error: `EDB API error: ${error.response.status}` });
    } else {
      return res.status(500).json({ error: "Failed to fetch schools data" });
    }
  }
}
