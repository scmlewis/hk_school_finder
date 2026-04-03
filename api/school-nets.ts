import { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchSchoolNetsCached } from "@/shared/dataFetch";

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
    const payload = await fetchSchoolNetsCached();
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("X-Data-Updated-At", new Date(payload.updatedAt).toISOString());
    return res.json(payload.data);
  } catch (error: any) {
    return res.json({ type: "FeatureCollection", features: [] });
  }
}
