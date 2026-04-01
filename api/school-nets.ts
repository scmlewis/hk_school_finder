import { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";

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
    const GEOJSON_URL =
      "https://api.csdi.gov.hk/apim/dataquery/v1/dataset/edb_rcd_1629267205213?format=geojson";
    console.log("Fetching school nets from CSDI:", GEOJSON_URL);

    const response = await axios.get(GEOJSON_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
      },
      timeout: 20000,
      validateStatus: (status) => status < 500
    });

    console.log("CSDI Response status:", response.status);

    if (response.status === 404) {
      console.warn(
        "CSDI School Net dataset not found (404). Using empty fallback."
      );
      return res.json({ type: "FeatureCollection", features: [] });
    }

    if (response.status !== 200) {
      throw new Error(`CSDI API returned ${response.status}`);
    }

    res.json(response.data);
  } catch (error: any) {
    console.error("Proxy error fetching school nets:", error.message);
    res.json({ type: "FeatureCollection", features: [] });
  }
}
