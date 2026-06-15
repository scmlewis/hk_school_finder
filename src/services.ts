import axios from 'axios';
import { School } from './types';

// EDB API URL for School Location and Information (JSON)
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
};

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '');

const API_BASE = normalizeBaseUrl(
  (import.meta.env.VITE_API_BASE as string | undefined) || getBaseUrl()
);

const EDB_API_URL = `${API_BASE}/api/schools`;

// GeoJSON for Primary School Nets
export const SCHOOL_NET_GEOJSON_URL = `${API_BASE}/api/school-nets`;

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

// MTR Stations Data — all 98 heavy rail stations
export const MTR_STATIONS = [
  { name: "金鐘", nameEn: "Admiralty", lat: 22.279421, lng: 114.164348, line: ["Island", "Tsuen Wan", "South Island", "East Rail"] },
  { name: "機場", nameEn: "Airport", lat: 22.315917, lng: 113.936483, line: ["Airport Express"] },
  { name: "博覽館", nameEn: "AsiaWorld-Expo", lat: 22.321749, lng: 113.941236, line: ["Airport Express"] },
  { name: "柯士甸", nameEn: "Austin", lat: 22.304915, lng: 114.166315, line: ["Tuen Ma"] },
  { name: "銅鑼灣", nameEn: "Causeway Bay", lat: 22.280189, lng: 114.184239, line: ["Island"] },
  { name: "中環", nameEn: "Central", lat: 22.282148, lng: 114.157681, line: ["Island", "Tsuen Wan"] },
  { name: "柴灣", nameEn: "Chai Wan", lat: 22.264582, lng: 114.237105, line: ["Island"] },
  { name: "車公廟", nameEn: "Che Kung Temple", lat: 22.374766, lng: 114.185885, line: ["Tuen Ma"] },
  { name: "長沙灣", nameEn: "Cheung Sha Wan", lat: 22.335545, lng: 114.156053, line: ["Tsuen Wan"] },
  { name: "彩虹", nameEn: "Choi Hung", lat: 22.334966, lng: 114.209044, line: ["Kwun Tong"] },
  { name: "第一城", nameEn: "City One", lat: 22.382964, lng: 114.203626, line: ["Tuen Ma"] },
  { name: "鑽石山", nameEn: "Diamond Hill", lat: 22.340033, lng: 114.201648, line: ["Kwun Tong", "Tuen Ma"] },
  { name: "迪士尼", nameEn: "Disneyland Resort", lat: 22.31549, lng: 114.044848, line: ["Disneyland Resort"] },
  { name: "尖東", nameEn: "East Tsim Sha Tsui", lat: 22.295306, lng: 114.174652, line: ["Tuen Ma"] },
  { name: "會展", nameEn: "Exhibition Centre", lat: 22.281655, lng: 114.175316, line: ["East Rail", "Tuen Ma"] },
  { name: "粉嶺", nameEn: "Fanling", lat: 22.492104, lng: 114.138673, line: ["East Rail"] },
  { name: "火炭", nameEn: "Fo Tan", lat: 22.395824, lng: 114.198501, line: ["East Rail"] },
  { name: "炮台山", nameEn: "Fortress Hill", lat: 22.287909, lng: 114.193594, line: ["Island"] },
  { name: "香港大學", nameEn: "HKU", lat: 22.284049, lng: 114.135557, line: ["Island"] },
  { name: "坑口", nameEn: "Hang Hau", lat: 22.315737, lng: 114.264313, line: ["Tseung Kwan O"] },
  { name: "杏花邨", nameEn: "Heng Fa Chuen", lat: 22.276637, lng: 114.239711, line: ["Island"] },
  { name: "恆安", nameEn: "Heng On", lat: 22.417862, lng: 114.225875, line: ["Tuen Ma"] },
  { name: "顯徑", nameEn: "Hin Keng", lat: 22.363726, lng: 114.170744, line: ["Tuen Ma"] },
  { name: "何文田", nameEn: "Ho Man Tin", lat: 22.309387, lng: 114.182595, line: ["Kwun Tong", "Tuen Ma"] },
  { name: "香港", nameEn: "Hong Kong", lat: 22.284667, lng: 114.158224, line: ["Tung Chung", "Airport Express"] },
  { name: "紅磡", nameEn: "Hung Hom", lat: 22.302993, lng: 114.182188, line: ["East Rail", "Tuen Ma"] },
  { name: "佐敦", nameEn: "Jordan", lat: 22.304807, lng: 114.171653, line: ["Tsuen Wan"] },
  { name: "啟德", nameEn: "Kai Tak", lat: 22.330419, lng: 114.199352, line: ["Tuen Ma"] },
  { name: "錦上路", nameEn: "Kam Sheung Road", lat: 22.435131, lng: 114.063182, line: ["Tuen Ma"] },
  { name: "堅尼地城", nameEn: "Kennedy Town", lat: 22.281211, lng: 114.128397, line: ["Island"] },
  { name: "九龍", nameEn: "Kowloon", lat: 22.304255, lng: 114.161444, line: ["Tung Chung", "Airport Express"] },
  { name: "九龍灣", nameEn: "Kowloon Bay", lat: 22.32346, lng: 114.214001, line: ["Kwun Tong"] },
  { name: "九龍塘", nameEn: "Kowloon Tong", lat: 22.337118, lng: 114.175777, line: ["Kwun Tong", "East Rail", "Tuen Ma"] },
  { name: "葵芳", nameEn: "Kwai Fong", lat: 22.356797, lng: 114.127788, line: ["Tsuen Wan"] },
  { name: "葵興", nameEn: "Kwai Hing", lat: 22.363075, lng: 114.131223, line: ["Tsuen Wan"] },
  { name: "觀塘", nameEn: "Kwun Tong", lat: 22.312087, lng: 114.226498, line: ["Kwun Tong"] },
  { name: "康城", nameEn: "LOHAS Park", lat: 22.295587, lng: 114.268726, line: ["Tseung Kwan O"] },
  { name: "荔枝角", nameEn: "Lai Chi Kok", lat: 22.337251, lng: 114.147957, line: ["Tsuen Wan"] },
  { name: "荔景", nameEn: "Lai King", lat: 22.348344, lng: 114.126189, line: ["Tsuen Wan", "Tung Chung"] },
  { name: "藍田", nameEn: "Lam Tin", lat: 22.306829, lng: 114.232737, line: ["Kwun Tong", "Tseung Kwan O"] },
  { name: "利東", nameEn: "Lei Tung", lat: 22.241849, lng: 114.155999, line: ["South Island"] },
  { name: "羅湖", nameEn: "Lo Wu", lat: 22.527639, lng: 114.113235, line: ["East Rail"] },
  { name: "樂富", nameEn: "Lok Fu", lat: 22.338012, lng: 114.187028, line: ["Kwun Tong"] },
  { name: "落馬洲", nameEn: "Lok Ma Chau", lat: 22.514465, lng: 114.065693, line: ["East Rail"] },
  { name: "朗屏", nameEn: "Long Ping", lat: 22.447626, lng: 114.025449, line: ["Tuen Ma"] },
  { name: "馬鞍山", nameEn: "Ma On Shan", lat: 22.424912, lng: 114.231978, line: ["Tuen Ma"] },
  { name: "美孚", nameEn: "Mei Foo", lat: 22.337935, lng: 114.136385, line: ["Tsuen Wan", "Tuen Ma"] },
  { name: "旺角", nameEn: "Mong Kok", lat: 22.319301, lng: 114.169352, line: ["Tsuen Wan", "Kwun Tong"] },
  { name: "旺角東", nameEn: "Mong Kok East", lat: 22.322019, lng: 114.172594, line: ["East Rail"] },
  { name: "南昌", nameEn: "Nam Cheong", lat: 22.326885, lng: 114.153501, line: ["Tung Chung", "Tuen Ma"] },
  { name: "牛頭角", nameEn: "Ngau Tau Kok", lat: 22.315502, lng: 114.218978, line: ["Kwun Tong"] },
  { name: "北角", nameEn: "North Point", lat: 22.291178, lng: 114.200387, line: ["Island", "Tseung Kwan O"] },
  { name: "海洋公園", nameEn: "Ocean Park", lat: 22.248706, lng: 114.174324, line: ["South Island"] },
  { name: "奧運", nameEn: "Olympic", lat: 22.317792, lng: 114.160248, line: ["Tung Chung"] },
  { name: "寶琳", nameEn: "Po Lam", lat: 22.322559, lng: 114.257872, line: ["Tseung Kwan O"] },
  { name: "太子", nameEn: "Prince Edward", lat: 22.324412, lng: 114.168284, line: ["Tsuen Wan", "Kwun Tong"] },
  { name: "鰂魚涌", nameEn: "Quarry Bay", lat: 22.288566, lng: 114.208703, line: ["Island", "Tseung Kwan O"] },
  { name: "馬場", nameEn: "Racecourse", lat: 22.400194, lng: 114.202775, line: ["East Rail"] },
  { name: "西灣河", nameEn: "Sai Wan Ho", lat: 22.282179, lng: 114.22182, line: ["Island"] },
  { name: "西營盤", nameEn: "Sai Ying Pun", lat: 22.285514, lng: 114.142698, line: ["Island"] },
  { name: "沙田", nameEn: "Sha Tin", lat: 22.382126, lng: 114.186915, line: ["East Rail"] },
  { name: "沙田圍", nameEn: "Sha Tin Wai", lat: 22.376915, lng: 114.194809, line: ["Tuen Ma"] },
  { name: "深水埗", nameEn: "Sham Shui Po", lat: 22.330886, lng: 114.16212, line: ["Tsuen Wan"] },
  { name: "筲箕灣", nameEn: "Shau Kei Wan", lat: 22.279233, lng: 114.228951, line: ["Island"] },
  { name: "石硤尾", nameEn: "Shek Kip Mei", lat: 22.33179, lng: 114.168818, line: ["Kwun Tong"] },
  { name: "石門", nameEn: "Shek Mun", lat: 22.387876, lng: 114.208522, line: ["Tuen Ma"] },
  { name: "上水", nameEn: "Sheung Shui", lat: 22.501619, lng: 114.127533, line: ["East Rail"] },
  { name: "上環", nameEn: "Sheung Wan", lat: 22.286599, lng: 114.152013, line: ["Island"] },
  { name: "兆康", nameEn: "Siu Hong", lat: 22.411526, lng: 113.978801, line: ["Tuen Ma"] },
  { name: "海怡半島", nameEn: "South Horizons", lat: 22.242848, lng: 114.148848, line: ["South Island"] },
  { name: "宋皇臺", nameEn: "Sung Wong Toi", lat: 22.325625, lng: 114.190618, line: ["Tuen Ma"] },
  { name: "欣澳", nameEn: "Sunny Bay", lat: 22.332111, lng: 114.029039, line: ["Tung Chung", "Disneyland Resort"] },
  { name: "太古", nameEn: "Tai Koo", lat: 22.284654, lng: 114.216484, line: ["Island"] },
  { name: "大埔墟", nameEn: "Tai Po Market", lat: 22.444581, lng: 114.170395, line: ["East Rail"] },
  { name: "大水坑", nameEn: "Tai Shui Hang", lat: 22.408191, lng: 114.222599, line: ["Tuen Ma"] },
  { name: "大圍", nameEn: "Tai Wai", lat: 22.372762, lng: 114.17869, line: ["East Rail", "Tuen Ma"] },
  { name: "太和", nameEn: "Tai Wo", lat: 22.451073, lng: 114.161184, line: ["East Rail"] },
  { name: "大窩口", nameEn: "Tai Wo Hau", lat: 22.370758, lng: 114.125006, line: ["Tsuen Wan"] },
  { name: "天后", nameEn: "Tin Hau", lat: 22.282238, lng: 114.191847, line: ["Island"] },
  { name: "天水圍", nameEn: "Tin Shui Wai", lat: 22.447885, lng: 114.004474, line: ["Tuen Ma"] },
  { name: "調景嶺", nameEn: "Tiu Keng Leng", lat: 22.304263, lng: 114.252644, line: ["Kwun Tong", "Tseung Kwan O"] },
  { name: "土瓜灣", nameEn: "To Kwa Wan", lat: 22.317918, lng: 114.187619, line: ["Tuen Ma"] },
  { name: "將軍澳", nameEn: "Tseung Kwan O", lat: 22.30744, lng: 114.260009, line: ["Tseung Kwan O"] },
  { name: "尖沙咀", nameEn: "Tsim Sha Tsui", lat: 22.297699, lng: 114.172177, line: ["Tsuen Wan"] },
  { name: "青衣", nameEn: "Tsing Yi", lat: 22.358397, lng: 114.107283, line: ["Tung Chung", "Airport Express"] },
  { name: "荃灣", nameEn: "Tsuen Wan", lat: 22.373519, lng: 114.118082, line: ["Tsuen Wan"] },
  { name: "荃灣西", nameEn: "Tsuen Wan West", lat: 22.368386, lng: 114.109656, line: ["Tsuen Wan", "Tuen Ma"] },
  { name: "屯門", nameEn: "Tuen Mun", lat: 22.39511, lng: 113.973192, line: ["Tuen Ma"] },
  { name: "東涌", nameEn: "Tung Chung", lat: 22.289175, lng: 113.941274, line: ["Tung Chung"] },
  { name: "大學", nameEn: "University", lat: 22.413657, lng: 114.210043, line: ["East Rail"] },
  { name: "灣仔", nameEn: "Wan Chai", lat: 22.277552, lng: 114.172634, line: ["Island"] },
  { name: "黃埔", nameEn: "Whampoa", lat: 22.304809, lng: 114.189834, line: ["Kwun Tong"] },
  { name: "黃竹坑", nameEn: "Wong Chuk Hang", lat: 22.24798, lng: 114.167996, line: ["South Island"] },
  { name: "黃大仙", nameEn: "Wong Tai Sin", lat: 22.341678, lng: 114.193872, line: ["Kwun Tong"] },
  { name: "烏溪沙", nameEn: "Wu Kai Sha", lat: 22.429152, lng: 114.24385, line: ["Tuen Ma"] },
  { name: "油麻地", nameEn: "Yau Ma Tei", lat: 22.312835, lng: 114.170663, line: ["Tsuen Wan", "Kwun Tong"] },
  { name: "油塘", nameEn: "Yau Tong", lat: 22.298004, lng: 114.237003, line: ["Kwun Tong", "Tseung Kwan O"] },
  { name: "元朗", nameEn: "Yuen Long", lat: 22.446072, lng: 114.035165, line: ["Tuen Ma"] },
];
