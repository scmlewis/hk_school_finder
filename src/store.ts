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

interface FilterOptions {
  query: string;
  levels: string[];
  activeNet: string | null;
  userLocation: { lat: number; lng: number } | null;
  distanceFilter: number | null;
  mapZoom: number;
  genderFilter: string[];
  financingTypeFilter: string[];
  districtFilter: string | null;
  religionFilter: string[];
}

function getFilterOptions(state: AppState): FilterOptions {
  return {
    query: state.searchQuery,
    levels: state.levelFilter,
    activeNet: state.activeSchoolNet,
    userLocation: state.userLocation,
    distanceFilter: state.distanceFilter,
    mapZoom: state.mapZoom,
    genderFilter: state.genderFilter,
    financingTypeFilter: state.financingTypeFilter,
    districtFilter: state.districtFilter,
    religionFilter: state.religionFilter,
  };
}

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
  mapZoom: 11,
  language: 'en' as const,
  genderFilter: [] as string[],
  financingTypeFilter: [] as string[],
  religionFilter: [] as string[],
  districtFilter: null,
  favorites: [],
  filterPresets: [],
  homeAddress: null,
  listPanelOpen: false,

  setSchools: (schools) => set((state) => {
    if (!Array.isArray(schools)) {
      console.error('setSchools: Expected array, got:', typeof schools);
      return { schools: [], filteredSchools: [] };
    }
    const indexedSchools = schools.map(indexSchool);
    const filtered = filterSchools(indexedSchools, getFilterOptions(state));
    return { schools: indexedSchools, filteredSchools: filtered };
  }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSelectedSchool: (school) => set({ selectedSchool: school }),
  setSearchQuery: (query) => set((state) => ({
    searchQuery: query,
    filteredSchools: filterSchools(state.schools, getFilterOptions({ ...state, searchQuery: query }))
  })),
  setLevelFilter: (levels) => set((state) => {
    // Normalize empty selection to mean "all levels" to avoid duplicate semantics between 0 and all selected
    const normalizedLevels = (Array.isArray(levels) && levels.length > 0)
      ? levels
      : ['KINDERGARTEN', 'PRIMARY', 'SECONDARY'];
    return {
      levelFilter: normalizedLevels,
      filteredSchools: filterSchools(state.schools, getFilterOptions({ ...state, levelFilter: normalizedLevels }))
    };
  }),
  setUserLocation: (location) => set((state) => ({
    userLocation: location,
    filteredSchools: filterSchools(state.schools, getFilterOptions({ ...state, userLocation: location }))
  })),
  setActiveSchoolNet: (net) => set((state) => ({
    activeSchoolNet: net,
    filteredSchools: filterSchools(state.schools, getFilterOptions({ ...state, activeSchoolNet: net }))
  })),
  setDistanceFilter: (distance) => set((state) => ({
    distanceFilter: distance,
    filteredSchools: filterSchools(state.schools, getFilterOptions({ ...state, distanceFilter: distance }))
  })),
  setMapZoom: (zoom) => set((state) => ({
    mapZoom: zoom,
    filteredSchools: filterSchools(state.schools, getFilterOptions({ ...state, mapZoom: zoom }))
  })),
  setLanguage: (lang) => set({ language: lang }),
  setGenderFilter: (gender) => set((state) => ({
    genderFilter: gender,
    filteredSchools: filterSchools(state.schools, getFilterOptions({ ...state, genderFilter: gender }))
  })),
  setFinancingTypeFilter: (financingType) => set((state) => ({
    financingTypeFilter: financingType,
    filteredSchools: filterSchools(state.schools, getFilterOptions({ ...state, financingTypeFilter: financingType }))
  })),
  setDistrictFilter: (district) => set((state) => ({
    districtFilter: district,
    filteredSchools: filterSchools(state.schools, getFilterOptions({ ...state, districtFilter: district }))
  })),
  setReligionFilter: (religion) => set((state) => ({
    religionFilter: religion,
    filteredSchools: filterSchools(state.schools, getFilterOptions({ ...state, religionFilter: religion }))
  })),
  toggleFavorite: (schoolId) => set((state) => {
    if (!schoolId) return {};
    const exists = state.favorites.includes(schoolId);
    return {
      favorites: exists
        ? state.favorites.filter((id) => id !== schoolId)
        : [...state.favorites, schoolId],
    };
  }),
  saveFilterPreset: (name) => set((state) => {
    const newPreset = {
      id: crypto.randomUUID(),
      name,
      filters: {
        levelFilter: state.levelFilter,
        genderFilter: state.genderFilter,
        financingTypeFilter: state.financingTypeFilter,
        religionFilter: state.religionFilter,
        districtFilter: state.districtFilter,
        distanceFilter: state.distanceFilter,
      },
    };
    const updated = [...state.filterPresets, newPreset];
    const trimmed = updated.length > 10 ? updated.slice(updated.length - 10) : updated;
    return { filterPresets: trimmed };
  }),
  loadFilterPreset: (id) => set((state) => {
    const preset = state.filterPresets.find((p) => p.id === id);
    if (!preset) return {};
    const f = preset.filters;
    const next = {
      levelFilter: f.levelFilter,
      genderFilter: f.genderFilter,
      financingTypeFilter: f.financingTypeFilter,
      religionFilter: f.religionFilter,
      districtFilter: f.districtFilter,
      distanceFilter: f.distanceFilter,
    };
    return {
      ...next,
      filteredSchools: filterSchools(state.schools, getFilterOptions({ ...state, ...next })),
    };
  }),
  deleteFilterPreset: (id) => set((state) => ({
    filterPresets: state.filterPresets.filter((p) => p.id !== id),
  })),
  setHomeAddress: (location) => set({ homeAddress: location }),
  setListPanelOpen: (open) => set({ listPanelOpen: open }),
  clearFilters: () => set((state) => {
    const nextLevelFilter = ['KINDERGARTEN', 'PRIMARY', 'SECONDARY'];
    const nextQuery = '';

    return {
      searchQuery: nextQuery,
      levelFilter: nextLevelFilter,
      distanceFilter: null,
      activeSchoolNet: null,
      genderFilter: [],
      financingTypeFilter: [],
      religionFilter: [],
      districtFilter: null,
      filteredSchools: filterSchools(
        state.schools,
        getFilterOptions({
          ...state,
          searchQuery: nextQuery,
          levelFilter: nextLevelFilter,
          distanceFilter: null,
          activeSchoolNet: null,
          genderFilter: [],
          financingTypeFilter: [],
          religionFilter: [],
          districtFilter: null,
        })
      )
    };
  }),
}), {
  name: 'hk-school-finder-preferences',
  storage: createJSONStorage(() => localStorage),
  merge: (persistedState: any, currentState: AppState) => {
    // Migrate old null values to arrays for multi-select filters
    const merged = { ...currentState, ...persistedState };
    if (!Array.isArray(merged.genderFilter)) merged.genderFilter = [];
    if (!Array.isArray(merged.financingTypeFilter)) merged.financingTypeFilter = [];
    if (!Array.isArray(merged.religionFilter)) merged.religionFilter = [];
    return merged;
  },
  partialize: (state) => ({
    language: state.language,
    searchQuery: state.searchQuery,
    levelFilter: state.levelFilter,
    distanceFilter: state.distanceFilter,
    genderFilter: state.genderFilter,
    financingTypeFilter: state.financingTypeFilter,
    religionFilter: state.religionFilter,
    districtFilter: state.districtFilter,
    favorites: state.favorites,
    filterPresets: state.filterPresets,
    homeAddress: state.homeAddress,
    listPanelOpen: state.listPanelOpen,
  }),
}));


function filterSchools(
  schools: School[],
  opts: FilterOptions
) {
  if (!Array.isArray(schools)) return [];

  const typedSchools = schools as IndexedSchool[];
  const lowerQuery = opts.query.trim().toLowerCase();
  const hasQuery = lowerQuery.length > 0;

  // Zoom rule still overrides level selection for broad map views.
  let effectiveLevels = opts.levels;
  // Only apply zoom-based level fallback when the user has not customized levels
  const isDefaultLevelSelection = opts.levels.length === 3 && opts.levels.includes('PRIMARY') && opts.levels.includes('SECONDARY') && opts.levels.includes('KINDERGARTEN');
  if (isDefaultLevelSelection) {
    if (opts.mapZoom < 12) {
      effectiveLevels = ['PRIMARY'];
    } else if (opts.mapZoom < 15) {
      effectiveLevels = ['PRIMARY', 'SECONDARY'];
    }
  }
  const hasLevelFilter = effectiveLevels.length > 0;
  const shouldCheckDistance = !!opts.distanceFilter && !!opts.userLocation;
  
  const filtered = typedSchools.filter((school) => {
    const matchesQuery = !hasQuery ||
      school.__searchName.includes(lowerQuery) ||
      school.__searchEnglishName.includes(lowerQuery);
    
    const matchesLevel = !hasLevelFilter || effectiveLevels.some(level =>
      school.__levelUpper.includes(level)
    );

    const matchesNet = !opts.activeNet || school.__netId === opts.activeNet;
    const matchesGender = matchesMultiFilter(school.__genderUpper, opts.genderFilter);
    const matchesFinancing = matchesMultiFilter(school.__financingUpper, opts.financingTypeFilter);
    const matchesReligion = matchesMultiFilter(school.__religionUpper, opts.religionFilter);
    const matchesDistrict = matchesCategoryFilter((school as any).__districtUpper || '', opts.districtFilter);

    let matchesDistance = true;
    if (shouldCheckDistance) {
      const lat = parseFloat(school.Latitude || school.latitude || "");
      const lng = parseFloat(school.Longitude || school.longitude || "");
      if (!isNaN(lat) && !isNaN(lng)) {
        const distance = getDistance(opts.userLocation!.lat, opts.userLocation!.lng, lat, lng);
        matchesDistance = distance <= opts.distanceFilter!;
      } else {
        matchesDistance = false;
      }
    }

    return matchesQuery && matchesLevel && matchesNet && matchesDistance && matchesGender && matchesFinancing && matchesDistrict && matchesReligion;
  });

  return filtered;
}

function matchesMultiFilter(sourceUpper: string, filterValues: string[]): boolean {
  if (!filterValues || filterValues.length === 0) return true;

  return filterValues.some(filterValue => {
    if (filterValue === 'NOT_APPLICABLE') {
      return (
        sourceUpper.includes('N.A.') ||
        sourceUpper.includes('N/A') ||
        sourceUpper.includes('NA') ||
        sourceUpper.includes('NOT APPLICABLE') ||
        sourceUpper.includes('不適用') ||
        sourceUpper.includes('無')
      );
    }
    return sourceUpper.includes(filterValue.toUpperCase());
  });
}

function matchesCategoryFilter(sourceUpper: string, filterValue: string | null): boolean {
  if (!filterValue) return true;

  if (filterValue === 'NOT_APPLICABLE') {
    return (
      sourceUpper.includes('N.A.') ||
      sourceUpper.includes('N/A') ||
      sourceUpper.includes('NA') ||
      sourceUpper.includes('NOT APPLICABLE') ||
      sourceUpper.includes('不適用') ||
      sourceUpper.includes('無')
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
