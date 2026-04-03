import axios from 'axios';

const EDB_JSON_URL = 'https://www.edb.gov.hk/attachment/en/student-parents/sch-info/sch-search/sch-location-info/SCH_LOC_EDB.json';

let cachedSchools = null;
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

function isFresh(cache, ttlMs) {
  if (!cache) return false;
  return Date.now() - cache.updatedAt < ttlMs;
}

function mapSchoolFields(raw) {
  const schoolNameZh = raw['中文名稱'] || raw['SCHOOL NAME'];
  const schoolNameEn = raw['ENGLISH NAME'] || raw['English Name'];
  const primaryNet =
    raw['Primary One Admission School Net'] ||
    raw['PRIMARY ONE ADMISSION SCHOOL NET'] ||
    raw['SCHOOL NET'];

  return {
    ...raw,
    'School No.': raw['SCHOOL NO.'] || raw['School No.'],
    'School Name': schoolNameZh || schoolNameEn,
    'English Name': schoolNameEn || schoolNameZh,
    '中文名稱': raw['中文名稱'] || schoolNameZh,
    'School Address': raw['中文地址'] || raw['School Address'] || raw['ENGLISH ADDRESS'],
    'English Address': raw['ENGLISH ADDRESS'] || raw['English Address'] || raw['中文地址'],
    '中文地址': raw['中文地址'],
    Telephone: raw['TELEPHONE'] || raw['Telephone'],
    'Fax Number': raw['FAX NUMBER'] || raw['Fax Number'],
    Website: raw['WEBSITE'] || raw['Website'],
    Religion: raw['RELIGION'] || raw['Religion'],
    '宗教': raw['宗教'] || raw['RELIGION'] || raw['Religion'],
    'School Level': raw['SCHOOL LEVEL'] || raw['School Level'],
    '學校類型': raw['學校類型'] || raw['SCHOOL LEVEL'] || raw['School Level'],
    Session: raw['SESSION'] || raw['Session'],
    '時段': raw['時段'] || raw['SESSION'] || raw['Session'],
    'School Type': raw['ENGLISH CATEGORY'] || raw['School Type'] || raw['SCHOOL TYPE'],
    '中文種類': raw['中文種類'],
    'Financing Type': raw['FINANCE TYPE'] || raw['Financing Type'],
    '資助種類': raw['資助種類'] || raw['FINANCE TYPE'] || raw['Financing Type'],
    'Student Gender': raw['STUDENTS GENDER'] || raw['Student Gender'],
    '就讀學生性別': raw['就讀學生性別'] || raw['STUDENTS GENDER'] || raw['Student Gender'],
    District: raw['DISTRICT'] || raw['District'],
    '分區': raw['分區'] || raw['DISTRICT'] || raw['District'],
    Longitude: raw['LONGITUDE'] || raw['Longitude'],
    Latitude: raw['LATITUDE'] || raw['Latitude'],
    East: raw['EASTING'] || raw['East'],
    North: raw['NORTHING'] || raw['North'],
    ...(primaryNet ? { 'Primary One Admission School Net': primaryNet } : {}),
  };
}

function normalizeSchoolsPayload(rawData) {
  if (Array.isArray(rawData)) {
    return rawData.map(mapSchoolFields);
  }
  if (rawData && typeof rawData === 'object') {
    const possibleArray = Object.values(rawData).find((val) => Array.isArray(val));
    if (possibleArray) {
      return possibleArray.map(mapSchoolFields);
    }
  }
  throw new Error('Data format mismatch: Expected array');
}

async function fetchSchoolsCached() {
  if (isFresh(cachedSchools, SIX_HOURS_MS)) {
    return cachedSchools;
  }

  const response = await axios.get(EDB_JSON_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
    timeout: 45000,
    maxContentLength: 50 * 1024 * 1024,
    maxBodyLength: 50 * 1024 * 1024,
    responseType: 'text',
  });

  if (response.status !== 200) {
    throw new Error(`EDB API returned ${response.status}`);
  }

  let rawData = response.data;
  if (typeof rawData === 'string') {
    try {
      rawData = JSON.parse(rawData);
    } catch (error) {
      rawData = JSON.parse(rawData.replace(/^\uFEFF/, ''));
    }
  }

  const data = normalizeSchoolsPayload(rawData);
  cachedSchools = { data, updatedAt: Date.now() };
  return cachedSchools;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const payload = await fetchSchoolsCached();
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('X-Data-Updated-At', new Date(payload.updatedAt).toISOString());
    return res.json(payload.data);
  } catch (error) {
    console.error('Proxy error fetching schools:', error.name, error.message);
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'Request to EDB timed out' });
    } else if (error.response) {
      return res.status(error.response.status).json({ error: `EDB API error: ${error.response.status}` });
    } else {
      return res.status(500).json({ error: `Failed to fetch schools data: ${error.message}` });
    }
  }
}
