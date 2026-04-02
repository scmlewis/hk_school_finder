export interface School {
  "School No.": string;
  "School Name": string;
  "English Name": string;
  "School Address": string;
  "English Address": string;
  "Telephone": string;
  "Fax Number": string;
  "Website": string;
  "Religion": string;
  "School Level": string;
  "Session": string;
  "School Type": string;
  "Financing Type": string;
  "Student Gender": string;
  "District": string;
  "Primary One Admission School Net": string;
  "Longitude": string;
  "Latitude": string;
  "East": string;
  "North": string;
  [key: string]: any;
}

export interface MTRStation {
  name: string;
  nameEn: string;
  lat: number;
  lng: number;
  line: string[];
}

export interface AppState {
  schools: School[];
  filteredSchools: School[];
  loading: boolean;
  error: string | null;
  selectedSchool: School | null;
  searchQuery: string;
  levelFilter: string[];
  userLocation: [number, number] | null;
  distanceFilter: number | null; // in km: 1, 3, 5, or null (no limit)
  activeSchoolNet: string | null;
  onlyShowInNet: boolean;
  mapZoom: number;
  language: 'en' | 'zh';
  genderFilter: string | null;
  financingTypeFilter: string | null;
  religionFilter: string | null;
  districtFilter: string | null;
  
  setSchools: (schools: School[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedSchool: (school: School | null) => void;
  setSearchQuery: (query: string) => void;
  setLevelFilter: (levels: string[]) => void;
  setUserLocation: (location: [number, number] | null) => void;
  setDistanceFilter: (distance: number | null) => void;
  setActiveSchoolNet: (net: string | null) => void;
  setOnlyShowInNet: (only: boolean) => void;
  setMapZoom: (zoom: number) => void;
  setLanguage: (lang: 'en' | 'zh') => void;
  setGenderFilter: (gender: string | null) => void;
  setFinancingTypeFilter: (financingType: string | null) => void;
  setReligionFilter: (religion: string | null) => void;
  setDistrictFilter: (district: string | null) => void;
  clearFilters: () => void;
}
