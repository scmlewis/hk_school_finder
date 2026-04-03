import axios from 'axios';

const SCHOOL_NETS_URL = 'https://api.csdi.gov.hk/apim/dataquery/v1/dataset/edb_rcd_1629267205213?format=geojson';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

let cachedSchoolNets = null;

function isFresh(cache, ttlMs) {
  if (!cache) return false;
  return Date.now() - cache.updatedAt < ttlMs;
}

async function fetchSchoolNetsCached() {
  if (isFresh(cachedSchoolNets, ONE_DAY_MS)) {
    return cachedSchoolNets;
  }

  const response = await axios.get(SCHOOL_NETS_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    },
    timeout: 20000,
    validateStatus: (status) => status < 500,
  });

  if (response.status === 404) {
    const data = { type: 'FeatureCollection', features: [] };
    cachedSchoolNets = { data, updatedAt: Date.now() };
    return cachedSchoolNets;
  }

  if (response.status !== 200) {
    throw new Error(`CSDI API returned ${response.status}`);
  }

  cachedSchoolNets = { data: response.data, updatedAt: Date.now() };
  return cachedSchoolNets;
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
    const payload = await fetchSchoolNetsCached();
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('X-Data-Updated-At', new Date(payload.updatedAt).toISOString());
    return res.json(payload.data);
  } catch (error) {
    console.error('Proxy error fetching school nets:', error.message);
    return res.json({ type: 'FeatureCollection', features: [] });
  }
}
