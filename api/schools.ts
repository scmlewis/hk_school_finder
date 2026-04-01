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

  console.log("GET /api/schools - Request received");
  const EDB_JSON_URL =
    "https://www.edb.gov.hk/attachment/en/student-parents/sch-info/sch-search/sch-location-info/SCH_LOC_EDB.json";

  try {
    console.log("Fetching schools from EDB using axios:", EDB_JSON_URL);
    const response = await axios.get(EDB_JSON_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        Pragma: "no-cache"
      },
      timeout: 45000,
      maxContentLength: 50 * 1024 * 1024,
      maxBodyLength: 50 * 1024 * 1024,
      responseType: "text"
    });

    console.log("EDB Response status:", response.status);

    if (response.status !== 200) {
      throw new Error(`EDB API returned ${response.status}`);
    }

    let rawData = response.data;

    if (typeof rawData === "string") {
      try {
        rawData = JSON.parse(rawData);
      } catch (error) {
        console.error("JSON Parse error, attempting to fix BOM...");
        rawData = JSON.parse(rawData.replace(/^\uFEFF/, ""));
      }
    }

    if (Array.isArray(rawData)) {
      const mappedData = rawData.map((school: any) => ({
        "School No.": school["SCHOOL NO."],
        "School Name": school["中文名稱"] || school["ENGLISH NAME"],
        "English Name": school["ENGLISH NAME"],
        "School Address": school["中文地址"] || school["ENGLISH ADDRESS"],
        "English Address": school["ENGLISH ADDRESS"],
        Telephone: school["TELEPHONE"],
        "Fax Number": school["FAX NUMBER"],
        Website: school["WEBSITE"],
        Religion: school["RELIGION"],
        "School Level": school["SCHOOL LEVEL"],
        Session: school["SESSION"],
        "School Type": school["ENGLISH CATEGORY"],
        "Financing Type": school["FINANCE TYPE"],
        "Student Gender": school["STUDENTS GENDER"],
        District: school["DISTRICT"],
        Longitude: school["LONGITUDE"],
        Latitude: school["LATITUDE"],
        East: school["EASTING"],
        North: school["NORTHING"],
        ...school
      }));

      if (mappedData.length > 0) {
        console.log("First school keys:", Object.keys(mappedData[0]));
      }
      res.json(mappedData);
    } else if (rawData && typeof rawData === "object") {
      const possibleArray = Object.values(rawData).find((val) =>
        Array.isArray(val)
      );
      if (possibleArray) {
        console.log("Found array inside object. Count:", possibleArray.length);
        res.json(possibleArray);
      } else {
        console.error("Data is an object but no array found inside");
        res.status(500).json({ error: "Data format mismatch: Expected array" });
      }
    } else {
      res.status(500).json({ error: "Data format mismatch: Expected array" });
    }
  } catch (error: any) {
    console.error("Proxy error fetching schools:", error.name, error.message);
    if (error.code === "ECONNABORTED") {
      res.status(504).json({ error: "Request to EDB timed out" });
    } else if (error.response) {
      res
        .status(error.response.status)
        .json({ error: `EDB API error: ${error.response.status}` });
    } else {
      res.status(500).json({ error: "Failed to fetch schools data" });
    }
  }
}
