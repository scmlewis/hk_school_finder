import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './store';

function resetStore() {
  useStore.setState({
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
    language: 'en',
    genderFilter: [],
    financingTypeFilter: [],
    religionFilter: [],
    districtFilter: null,
    favorites: [],
    filterPresets: [],
    homeAddress: null,
    listPanelOpen: false,
  });
}

describe('listPanelOpen state', () => {
  beforeEach(() => {
    resetStore();
  });

  it('defaults to false', () => {
    expect(useStore.getState().listPanelOpen).toBe(false);
  });

  it('setListPanelOpen toggles to true', () => {
    useStore.getState().setListPanelOpen(true);
    expect(useStore.getState().listPanelOpen).toBe(true);
  });

  it('setListPanelOpen toggles back to false', () => {
    useStore.getState().setListPanelOpen(true);
    useStore.getState().setListPanelOpen(false);
    expect(useStore.getState().listPanelOpen).toBe(false);
  });
});

describe('filter clearing', () => {
  beforeEach(() => {
    resetStore();
  });

  it('clearFilters resets all filters', () => {
    useStore.getState().setSearchQuery('test');
    useStore.getState().setGenderFilter(['BOYS']);
    useStore.getState().setDistrictFilter('CENTRAL');
    useStore.getState().setDistanceFilter(3);
    useStore.getState().setActiveSchoolNet('1');

    useStore.getState().clearFilters();

    const state = useStore.getState();
    expect(state.searchQuery).toBe('');
    expect(state.genderFilter).toEqual([]);
    expect(state.districtFilter).toBeNull();
    expect(state.distanceFilter).toBeNull();
    expect(state.activeSchoolNet).toBeNull();
  });
});

describe('favorites', () => {
  beforeEach(() => {
    resetStore();
  });

  it('toggleFavorite adds a school', () => {
    useStore.getState().toggleFavorite('001');
    expect(useStore.getState().favorites).toContain('001');
  });

  it('toggleFavorite removes a school', () => {
    useStore.getState().toggleFavorite('001');
    useStore.getState().toggleFavorite('001');
    expect(useStore.getState().favorites).not.toContain('001');
  });

  it('toggleFavorite ignores undefined', () => {
    useStore.getState().toggleFavorite(undefined);
    expect(useStore.getState().favorites).toEqual([]);
  });
});

describe('language', () => {
  beforeEach(() => {
    resetStore();
  });

  it('setLanguage switches to zh', () => {
    useStore.getState().setLanguage('zh');
    expect(useStore.getState().language).toBe('zh');
  });

  it('setLanguage switches back to en', () => {
    useStore.getState().setLanguage('zh');
    useStore.getState().setLanguage('en');
    expect(useStore.getState().language).toBe('en');
  });
});
