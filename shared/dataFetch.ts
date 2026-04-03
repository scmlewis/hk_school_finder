import axios from "axios";

type CachedPayload<T> = {
  data: T;
  updatedAt: number;
};

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

let cachedSchools: CachedPayload<any[]> | null = null;
let cachedSchoolNets: CachedPayload<any> | null = null;

const EDB_JSON_URL =
  "https://www.edb.gov.hk/attachment/en/student-parents/sch-info/sch-search/sch-location-info/SCH_LOC_EDB.json";

const SCHOOL_NETS_URL =
  "https://api.csdi.gov.hk/apim/dataquery/v1/dataset/edb_rcd_1629267205213?format=geojson";

function nowMs() {
  return Date.now();
}

function isFresh(cache: CachedPayload<any> | null, ttlMs: number) {
  if (!cache) return false;
  return nowMs() - cache.updatedAt < ttlMs;
}

function mapSchoolFields(raw: any) {
  return {
    "School No.": raw["SCHOOL NO."],
    "School Name": raw["中文名稱"] || raw["ENGLISH NAME"],
    "English Name": raw["ENGLISH NAME"],
    "School Address": raw["中文地址"] || raw["ENGLISH ADDRESS"],
    "English Address": raw["ENGLISH ADDRESS"],
    Telephone: raw["TELEPHONE"],
    "Fax Number": raw["FAX NUMBER"],
    Website: raw["WEBSITE"],
    Religion: raw["RELIGION"],
    "School Level": raw["SCHOOL LEVEL"],
    Session: raw["SESSION"],
    "School Type": raw["ENGLISH CATEGORY"],
    "Financing Type": raw["FINANCE TYPE"],
    "Student Gender": raw["STUDENTS GENDER"],
    District: raw["DISTRICT"],
    Longitude: raw["LONGITUDE"],
    Latitude: raw["LATITUDE"],
    East: raw["EASTING"],
    North: raw["NORTHING"],
    ...raw,
  };
}

function normalizeSchoolsPayload(rawData: any) {
  if (Array.isArray(rawData)) {
    return rawData.map(mapSchoolFields);
  }
  if (rawData && typeof rawData === "object") {
    const possibleArray = Object.values(rawData).find((val) => Array.isArray(val));
    if (possibleArray) {
      return possibleArray.map(mapSchoolFields);
    }
  }
  throw new Error("Data format mismatch: Expected array");
}

export async function fetchSchoolsCached() {
  if (isFresh(cachedSchools, SIX_HOURS_MS)) {
    return cachedSchools!;
  }

  const response = await axios.get(EDB_JSON_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
    timeout: 45000,
    maxContentLength: 50 * 1024 * 1024,
    maxBodyLength: 50 * 1024 * 1024,
    responseType: "text",
  });

  if (response.status !== 200) {
    throw new Error(`EDB API returned ${response.status}`);
  }

  let rawData = response.data;
  if (typeof rawData === "string") {
    try {
      rawData = JSON.parse(rawData);
    } catch (error) {
      rawData = JSON.parse(rawData.replace(/^\uFEFF/, ""));
    }
  }

  const data = normalizeSchoolsPayload(rawData);
  cachedSchools = { data, updatedAt: nowMs() };
  return cachedSchools;
}

export async function fetchSchoolNetsCached() {
  if (isFresh(cachedSchoolNets, ONE_DAY_MS)) {
    return cachedSchoolNets!;
  }

  const response = await axios.get(SCHOOL_NETS_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    },
    timeout: 20000,
    validateStatus: (status) => status < 500,
  });

  if (response.status === 404) {
    const data = { type: "FeatureCollection", features: [] };
    cachedSchoolNets = { data, updatedAt: nowMs() };
    return cachedSchoolNets;
  }

  if (response.status !== 200) {
    throw new Error(`CSDI API returned ${response.status}`);
  }

  cachedSchoolNets = { data: response.data, updatedAt: nowMs() };
  return cachedSchoolNets;
}
