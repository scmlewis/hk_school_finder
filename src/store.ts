import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppState, School } from './types';
import { getDistance } from './services';

type IndexedSchool = School & {
  __searchName: string;
  __searchEnglishName: string;
  __levelUpper: string;
  __netId: string;
  __genderUpper: string;
  __financingUpper: string;
  __religionUpper: string;
  __districtUpper: string;
};

export const useStore = create<AppState>()(persist((set) => ({
  schools: [],
  filteredSchools: [],
  loading: true,
  error: null,
  selectedSchool: null,
  searchQuery: '',
  levelFilter: ['KINDERGARTEN', 'PRIMARY', 'SECONDARY'],
  userLocation: null,
  distanceFilter: null,
  activeSchoolNet: null,
  onlyShowInNet: false,
  mapZoom: 11,
  language: 'en' as const,
  genderFilter: null,
  financingTypeFilter: null,
  religionFilter: null,
  districtFilter: null,

  setSchools: (schools) => set((state) => {
    if (!Array.isArray(schools)) {
      console.error('setSchools: Expected array, got:', typeof schools);
      return { schools: [], filteredSchools: [] };
    }
    const indexedSchools = schools.map(indexSchool);
    const filtered = filterSchools(indexedSchools, state.searchQuery, state.levelFilter, state.activeSchoolNet, state.onlyShowInNet, state.userLocation, state.distanceFilter, state.mapZoom, state.genderFilter, state.financingTypeFilter, state.districtFilter, state.religionFilter);
    return { schools: indexedSchools, filteredSchools: filtered };
  }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSelectedSchool: (school) => set({ selectedSchool: school }),
  setSearchQuery: (query) => set((state) => ({
    searchQuery: query,
    filteredSchools: filterSchools(state.schools, query, state.levelFilter, state.activeSchoolNet, state.onlyShowInNet, state.userLocation, state.distanceFilter, state.mapZoom, state.genderFilter, state.financingTypeFilter, state.districtFilter, state.religionFilter)
  })),
  setLevelFilter: (levels) => set((state) => ({
    levelFilter: levels,
    filteredSchools: filterSchools(state.schools, state.searchQuery, levels, state.activeSchoolNet, state.onlyShowInNet, state.userLocation, state.distanceFilter, state.mapZoom, state.genderFilter, state.financingTypeFilter, state.districtFilter, state.religionFilter)
  })),
  setUserLocation: (location) => set((state) => ({
    userLocation: location,
    filteredSchools: filterSchools(state.schools, state.searchQuery, state.levelFilter, state.activeSchoolNet, state.onlyShowInNet, location, state.distanceFilter, state.mapZoom, state.genderFilter, state.financingTypeFilter, state.districtFilter, state.religionFilter)
  })),
  setActiveSchoolNet: (net) => set((state) => ({
    activeSchoolNet: net,
    filteredSchools: filterSchools(state.schools, state.searchQuery, state.levelFilter, net, state.onlyShowInNet, state.userLocation, state.distanceFilter, state.mapZoom, state.genderFilter, state.financingTypeFilter, state.districtFilter, state.religionFilter)
  })),
  setOnlyShowInNet: (only) => set((state) => ({
    onlyShowInNet: only,
    filteredSchools: filterSchools(state.schools, state.searchQuery, state.levelFilter, state.activeSchoolNet, only, state.userLocation, state.distanceFilter, state.mapZoom, state.genderFilter, state.financingTypeFilter, state.districtFilter, state.religionFilter)
  })),
  setDistanceFilter: (distance) => set((state) => ({
    distanceFilter: distance,
    filteredSchools: filterSchools(state.schools, state.searchQuery, state.levelFilter, state.activeSchoolNet, state.onlyShowInNet, state.userLocation, distance, state.mapZoom, state.genderFilter, state.financingTypeFilter, state.districtFilter, state.religionFilter)
  })),
  setMapZoom: (zoom) => set((state) => ({
    mapZoom: zoom,
    filteredSchools: filterSchools(state.schools, state.searchQuery, state.levelFilter, state.activeSchoolNet, state.onlyShowInNet, state.userLocation, state.distanceFilter, zoom, state.genderFilter, state.financingTypeFilter, state.districtFilter, state.religionFilter)
  })),
  setLanguage: (lang) => set({ language: lang }),
  setGenderFilter: (gender) => set((state) => ({
    genderFilter: gender,
    filteredSchools: filterSchools(state.schools, state.searchQuery, state.levelFilter, state.activeSchoolNet, state.onlyShowInNet, state.userLocation, state.distanceFilter, state.mapZoom, gender, state.financingTypeFilter, state.districtFilter, state.religionFilter)
  })),
  setFinancingTypeFilter: (financingType) => set((state) => ({
    financingTypeFilter: financingType,
    filteredSchools: filterSchools(state.schools, state.searchQuery, state.levelFilter, state.activeSchoolNet, state.onlyShowInNet, state.userLocation, state.distanceFilter, state.mapZoom, state.genderFilter, financingType, state.districtFilter, state.religionFilter)
  })),
  setDistrictFilter: (district) => set((state) => ({
    districtFilter: district,
    filteredSchools: filterSchools(state.schools, state.searchQuery, state.levelFilter, state.activeSchoolNet, state.onlyShowInNet, state.userLocation, state.distanceFilter, state.mapZoom, state.genderFilter, state.financingTypeFilter, district, state.religionFilter)
  })),
  setReligionFilter: (religion) => set((state) => ({
    religionFilter: religion,
    filteredSchools: filterSchools(state.schools, state.searchQuery, state.levelFilter, state.activeSchoolNet, state.onlyShowInNet, state.userLocation, state.distanceFilter, state.mapZoom, state.genderFilter, state.financingTypeFilter, state.districtFilter, religion)
  })),
  clearFilters: () => set((state) => {
    const nextLevelFilter = ['KINDERGARTEN', 'PRIMARY', 'SECONDARY'];
    const nextDistance = null;
    const nextGender = null;
    const nextFinancing = null;
    const nextReligion = null;
    const nextDistrict = null;
    const nextQuery = '';

    return {
      searchQuery: nextQuery,
      levelFilter: nextLevelFilter,
      distanceFilter: nextDistance,
      genderFilter: nextGender,
      financingTypeFilter: nextFinancing,
      religionFilter: nextReligion,
      districtFilter: nextDistrict,
      filteredSchools: filterSchools(
        state.schools,
        nextQuery,
        nextLevelFilter,
        state.activeSchoolNet,
        state.onlyShowInNet,
        state.userLocation,
        nextDistance,
        state.mapZoom,
        nextGender,
        nextFinancing,
        nextDistrict,
        nextReligion
      )
    };
  }),
}), {
  name: 'hk-school-finder-preferences',
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({
    language: state.language,
    searchQuery: state.searchQuery,
    levelFilter: state.levelFilter,
    distanceFilter: state.distanceFilter,
    genderFilter: state.genderFilter,
    financingTypeFilter: state.financingTypeFilter,
    religionFilter: state.religionFilter,
    districtFilter: state.districtFilter,
  }),
}));


function filterSchools(
  schools: School[],
  query: string,
  levels: string[],
  activeNet: string | null,
  onlyInNet: boolean,
  userLocation: [number, number] | null,
  distanceFilter: number | null,
  mapZoom: number,
  genderFilter: string | null,
  financingTypeFilter: string | null,
  districtFilter: string | null,
  religionFilter: string | null
) {
  if (!Array.isArray(schools)) return [];

  const typedSchools = schools as IndexedSchool[];
  const lowerQuery = query.trim().toLowerCase();
  const hasQuery = lowerQuery.length > 0;

  // Zoom rule still overrides level selection for broad map views.
  let effectiveLevels = levels;
  // Only apply zoom-based level fallback when the user has not customized levels
  const isDefaultLevelSelection = levels.length === 3 && levels.includes('PRIMARY') && levels.includes('SECONDARY') && levels.includes('KINDERGARTEN');
  if (isDefaultLevelSelection) {
    if (mapZoom < 12) {
      effectiveLevels = ['PRIMARY'];
    } else if (mapZoom < 15) {
      effectiveLevels = ['PRIMARY', 'SECONDARY'];
    }
  }
  const hasLevelFilter = effectiveLevels.length > 0;
  const shouldCheckDistance = !!distanceFilter && !!userLocation;
  
  const filtered = typedSchools.filter((school) => {
    const matchesQuery = !hasQuery ||
      school.__searchName.includes(lowerQuery) ||
      school.__searchEnglishName.includes(lowerQuery);
    
    const matchesLevel = !hasLevelFilter || effectiveLevels.some(level =>
      school.__levelUpper.includes(level)
    );

    const matchesNet = !onlyInNet || !activeNet || school.__netId === activeNet;
    const matchesGender = matchesCategoryFilter(school.__genderUpper, genderFilter);
    const matchesFinancing = matchesCategoryFilter(school.__financingUpper, financingTypeFilter);
    const matchesReligion = matchesCategoryFilter(school.__religionUpper, religionFilter);
    const matchesDistrict = matchesCategoryFilter((school as any).__districtUpper || '', districtFilter);

    let matchesDistance = true;
    if (shouldCheckDistance) {
      const lat = parseFloat(school.Latitude || school.latitude || "");
      const lng = parseFloat(school.Longitude || school.longitude || "");
      if (!isNaN(lat) && !isNaN(lng)) {
        const distance = getDistance(userLocation![0], userLocation![1], lat, lng);
        matchesDistance = distance <= distanceFilter!;
      } else {
        matchesDistance = false;
      }
    }

    return matchesQuery && matchesLevel && matchesNet && matchesDistance && matchesGender && matchesFinancing && matchesDistrict && matchesReligion;
  });

  console.log('filterSchools: Input count:', schools.length, 'Output count:', filtered.length, 'Filters:', { query, levels, activeNet, onlyInNet, mapZoom, hasUserLocation: !!userLocation, distanceFilter });
  if (schools.length > 0 && filtered.length === 0) {
    console.log('filterSchools: Sample school level:', schools[0]["School Level"], 'Keys:', Object.keys(schools[0]));
  }

  return filtered;
}

function matchesCategoryFilter(sourceUpper: string, filterValue: string | null): boolean {
  if (!filterValue) return true;

  if (filterValue === 'NOT_APPLICABLE') {
    return (
      sourceUpper.includes('N.A.') ||
      sourceUpper.includes('N/A') ||
      sourceUpper.includes('NA') ||
      sourceUpper.includes('NOT APPLICABLE') ||
      sourceUpper.includes('不適用')
    );
  }

  return sourceUpper.includes(filterValue.toUpperCase());
}

function indexSchool(school: School): IndexedSchool {
  const searchName = `${school["School Name"] || ''} ${school["中文名稱"] || ''}`.toLowerCase();
  const searchEnglishName = `${school["English Name"] || ''} ${school["ENGLISH NAME"] || ''}`.toLowerCase();
  const levelUpper = `${school["School Level"] || ''} ${school["SCHOOL LEVEL"] || ''} ${school["學校類型"] || ''}`.toUpperCase();
  const netId = school["Primary One Admission School Net"] || "";
  const genderUpper = `${school["Student Gender"] || ''} ${school["STUDENTS GENDER"] || ''} ${school["就讀學生性別"] || ''}`.toUpperCase();
  const financingUpper = `${school["Financing Type"] || ''} ${school["FINANCE TYPE"] || ''} ${school["資助種類"] || ''}`.toUpperCase();
  const religionUpper = `${school["Religion"] || ''} ${school["宗教"] || ''}`.toUpperCase();
  const districtUpper = `${school["District"] || ''}`.toUpperCase();

  return {
    ...school,
    __searchName: searchName,
    __searchEnglishName: searchEnglishName,
    __levelUpper: levelUpper,
    __netId: netId,
    __genderUpper: genderUpper,
    __financingUpper: financingUpper,
    __religionUpper: religionUpper,
    __districtUpper: districtUpper,
  };
}
