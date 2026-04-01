import axios from 'axios';
import { School } from './types';

// EDB API URL for School Location and Information (JSON)
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
};

const EDB_API_URL = `${getBaseUrl()}/api/schools`;

// GeoJSON for Primary School Nets
export const SCHOOL_NET_GEOJSON_URL = `${getBaseUrl()}/api/school-nets`;

export async function fetchSchools(retries = 3): Promise<School[]> {
  try {
    console.log('services: Fetching from', EDB_API_URL);
    const response = await axios.get(EDB_API_URL, {
      headers: {
        'Accept': 'application/json',
      },
      timeout: 30000, // 30s timeout
    });
    
    console.log('services: Response status', response.status);
    const data = response.data;
    console.log('services: Data received', Array.isArray(data) ? data.length : 'not an array');
    return data;
  } catch (error: any) {
    console.error(`Error fetching schools (Retries left: ${retries}):`, error.name, error.message);
    
    if (retries > 0) {
      console.log(`Retrying fetch in 2 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return fetchSchools(retries - 1);
    }

    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please check your connection.');
      }
      if (!error.response) {
        throw new Error('Network error: Could not reach the server. Please check your connection or try again later.');
      }
      throw new Error(error.response.data?.error || `Failed to fetch school data (Status: ${error.response.status})`);
    }
    
    throw error;
  }
}

// Haversine formula for distance calculation
export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

// MTR Stations Data (Phase 2)
// This is a subset of major MTR stations for commute logic
export const MTR_STATIONS = [
  { name: "中環", nameEn: "Central", lat: 22.2819, lng: 114.1581, line: ["Island", "Tsuen Wan"] },
  { name: "金鐘", nameEn: "Admiralty", lat: 22.2795, lng: 114.1645, line: ["Island", "Tsuen Wan", "South Island", "East Rail"] },
  { name: "尖沙咀", nameEn: "Tsim Sha Tsui", lat: 22.2975, lng: 114.1722, line: ["Tsuen Wan"] },
  { name: "旺角", nameEn: "Mong Kok", lat: 22.3191, lng: 114.1694, line: ["Tsuen Wan", "Kwun Tong"] },
  { name: "九龍塘", nameEn: "Kowloon Tong", lat: 22.3370, lng: 114.1761, line: ["East Rail", "Kwun Tong"] },
  { name: "沙田", nameEn: "Sha Tin", lat: 22.3831, lng: 114.1870, line: ["East Rail"] },
  { name: "元朗", nameEn: "Yuen Long", lat: 22.4455, lng: 114.0355, line: ["Tuen Ma"] },
  { name: "將軍澳", nameEn: "Tseung Kwan O", lat: 22.3074, lng: 114.2599, line: ["Tseung Kwan O"] },
  { name: "東涌", nameEn: "Tung Chung", lat: 22.2890, lng: 113.9413, line: ["Tung Chung"] },
  { name: "銅鑼灣", nameEn: "Causeway Bay", lat: 22.2801, lng: 114.1851, line: ["Island"] },
  { name: "太古", nameEn: "Tai Koo", lat: 22.2845, lng: 114.2158, line: ["Island"] },
  { name: "荃灣", nameEn: "Tsuen Wan", lat: 22.3737, lng: 114.1177, line: ["Tsuen Wan"] },
  { name: "大圍", nameEn: "Tai Wai", lat: 22.3724, lng: 114.1785, line: ["East Rail", "Tuen Ma"] },
  { name: "紅磡", nameEn: "Hung Hom", lat: 22.3028, lng: 114.1813, line: ["East Rail", "Tuen Ma"] },
  { name: "美孚", nameEn: "Mei Foo", lat: 22.3375, lng: 114.1404, line: ["Tsuen Wan", "Tuen Ma"] },
];
