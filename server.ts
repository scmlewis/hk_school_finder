import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import axios from "axios";

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
    console.log('GET /api/schools - Request received');
    const EDB_JSON_URL = 'https://www.edb.gov.hk/attachment/en/student-parents/sch-info/sch-search/sch-location-info/SCH_LOC_EDB.json';
    
    try {
      console.log('Fetching schools from EDB using axios:', EDB_JSON_URL);
      const response = await axios.get(EDB_JSON_URL, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        timeout: 45000, // 45s timeout
        maxContentLength: 50 * 1024 * 1024, // 50MB
        maxBodyLength: 50 * 1024 * 1024,
        responseType: 'text' // Fetch as text first to handle potential BOM or parsing issues
      });
      
      console.log('EDB Response status:', response.status);
      
      if (response.status !== 200) {
        throw new Error(`EDB API returned ${response.status}`);
      }
      
      let rawData = response.data;
      
      // Remove potential UTF-8 BOM
      if (typeof rawData === 'string' && rawData.charCodeAt(0) === 0xFEFF) {
        console.log('Removing UTF-8 BOM from EDB data');
        rawData = rawData.slice(1);
      }
      
      let data;
      try {
        data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      } catch (parseError) {
        console.error('Failed to parse EDB data as JSON:', parseError);
        throw new Error('Invalid JSON format from EDB');
      }
      
      console.log('Successfully fetched schools. Type:', typeof data, 'IsArray:', Array.isArray(data));
      
      if (Array.isArray(data)) {
        console.log('School count:', data.length);
        
        // Map new API field names to expected format
        const mappedData = data.map((school: any) => ({
          "School No.": school["SCHOOL NO."],
          "School Name": school["中文名稱"] || school["ENGLISH NAME"],
          "English Name": school["ENGLISH NAME"],
          "School Address": school["中文地址"] || school["ENGLISH ADDRESS"],
          "English Address": school["ENGLISH ADDRESS"],
          "Telephone": school["TELEPHONE"],
          "Fax Number": school["FAX NUMBER"],
          "Website": school["WEBSITE"],
          "Religion": school["RELIGION"],
          "School Level": school["SCHOOL LEVEL"],
          "Session": school["SESSION"],
          "School Type": school["ENGLISH CATEGORY"],
          "Financing Type": school["FINANCE TYPE"],
          "Student Gender": school["STUDENTS GENDER"],
          "District": school["DISTRICT"],
          "Longitude": school["LONGITUDE"],
          "Latitude": school["LATITUDE"],
          "East": school["EASTING"],
          "North": school["NORTHING"],
          // Keep original fields for reference
          ...school
        }));
        
        if (mappedData.length > 0) {
          console.log('First school keys:', Object.keys(mappedData[0]));
          console.log('First school sample:', JSON.stringify(mappedData[0]).substring(0, 500));
        }
        res.json(mappedData);
      } else if (data && typeof data === 'object') {
        // Sometimes APIs wrap the array in an object
        const possibleArray = Object.values(data).find(val => Array.isArray(val));
        if (possibleArray) {
          console.log('Found array inside object. Count:', possibleArray.length);
          res.json(possibleArray);
        } else {
          console.error('Data is an object but no array found inside:', Object.keys(data));
          res.status(500).json({ error: 'Data format mismatch: Expected array' });
        }
      } else {
        res.status(500).json({ error: 'Data format mismatch: Expected array' });
      }
    } catch (error: any) {
      console.error('Proxy error fetching schools:', error.name, error.message);
      if (error.code === 'ECONNABORTED') {
        res.status(504).json({ error: 'Request to EDB timed out' });
      } else if (error.response) {
        console.error('EDB Error response:', error.response.status, error.response.data?.substring?.(0, 200));
        res.status(error.response.status).json({ error: `EDB API error: ${error.response.status}` });
      } else {
        res.status(500).json({ error: `Failed to fetch school data: ${error.message}` });
      }
    }
  });

  // Proxy route for School Net GeoJSON
  app.get("/api/school-nets", async (req, res) => {
    try {
      // Updated URL for Primary School Net boundaries from CSDI (removed version suffix for stability)
      const GEOJSON_URL = 'https://api.csdi.gov.hk/apim/dataquery/v1/dataset/edb_rcd_1629267205213?format=geojson';
      console.log('Fetching school nets from CSDI:', GEOJSON_URL);
      
      const response = await axios.get(GEOJSON_URL, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        },
        timeout: 20000,
        validateStatus: (status) => status < 500 // Don't throw on 404, handle it manually
      });
      
      console.log('CSDI Response status:', response.status);
      
      if (response.status === 404) {
        console.warn('CSDI School Net dataset not found (404). Using empty fallback.');
        return res.json({ type: "FeatureCollection", features: [] });
      }

      if (response.status !== 200) {
        throw new Error(`CSDI API returned ${response.status}`);
      }
      
      res.json(response.data);
    } catch (error: any) {
      console.error('Proxy error fetching school nets:', error.message);
      res.json({ type: "FeatureCollection", features: [] }); // Fallback to empty
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
