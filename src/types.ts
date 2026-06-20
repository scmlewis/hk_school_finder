export interface School {
  "School No."?: string;
  "School Name"?: string;
  "English Name"?: string;
  "School Address"?: string;
  "English Address"?: string;
  "Telephone"?: string;
  "Fax Number"?: string;
  "Website"?: string;
  "Religion"?: string;
  "School Level"?: string;
  "Session"?: string;
  "School Type"?: string;
  "Financing Type"?: string;
  "Student Gender"?: string;
  "District"?: string;
  "Primary One Admission School Net"?: string;
  "Longitude"?: string;
  "Latitude"?: string;
  "East"?: string;
  "North"?: string;
  [key: string]: any;
}

export type CachedPayload<T> = {
  data: T;
  updatedAt: number;
};

export interface AppState {
  schools: School[];
  filteredSchools: School[];
  loading: boolean;
  error: string | null;
  selectedSchool: School | null;
  searchQuery: string;
  levelFilter: string[];
  userLocation: { lat: number; lng: number } | null;
  distanceFilter: number | null; // in km: 1, 3, 5, or null (no limit)
  activeSchoolNet: string | null;
  mapZoom: number;
  language: 'en' | 'zh';
  genderFilter: string[];
  financingTypeFilter: string[];
  religionFilter: string[];
  districtFilter: string | null;
  favorites: string[];
  
  setSchools: (schools: School[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedSchool: (school: School | null) => void;
  setSearchQuery: (query: string) => void;
  setLevelFilter: (levels: string[]) => void;
  setUserLocation: (location: { lat: number; lng: number } | null) => void;
  setDistanceFilter: (distance: number | null) => void;
  setActiveSchoolNet: (net: string | null) => void;
  setMapZoom: (zoom: number) => void;
  setLanguage: (lang: 'en' | 'zh') => void;
  setGenderFilter: (gender: string[]) => void;
  setFinancingTypeFilter: (financingType: string[]) => void;
  setReligionFilter: (religion: string[]) => void;
  setDistrictFilter: (district: string | null) => void;
  toggleFavorite: (schoolId: string | undefined) => void;
  clearFilters: () => void;
}
