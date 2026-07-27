# Three Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add school comparison tool (4th tab), saved filter presets, and home address persistence to HK School Finder.

**Architecture:** Extend Zustand store with 3 new state slices (comparisonList, filterPresets, homeAddress). Add one new component (CompareView.tsx) and modify BottomSheet, FilterBar, FavoritesView, and App to wire everything together.

**Tech Stack:** React 19, TypeScript, Zustand 5 (persist middleware), Tailwind CSS 4, Lucide React icons, MapLibre GL (read-only for geocoding context).

## Global Constraints

- Follow existing Material Design 3 dark theme with CSS custom properties
- All UI text must be bilingual (EN + Traditional Chinese) via translation objects
- Zustand persist middleware with localStorage for all new state
- Lazy-load new view components via `React.lazy()`
- Mobile-first responsive design (sm/md breakpoints)

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/types.ts` | Modify | Add `FilterState` interface, extend `AppState` with 3 new slices |
| `src/store.ts` | Modify | Add actions for comparison, presets, home address; extend `partialize` |
| `src/components/CompareView.tsx` | Create | New comparison tab component |
| `src/components/BottomSheet.tsx` | Modify | Add Compare button in action grid |
| `src/components/FilterBar.tsx` | Modify | Add preset save/load UI + home address UI |
| `src/components/FavoritesView.tsx` | Modify | Update directions link to include home origin |
| `src/App.tsx` | Modify | Add 4th tab, lazy-load CompareView |

---

### Task 1: Types & Store Foundation

**Files:**
- Modify: `src/types.ts`
- Modify: `src/store.ts`

**Interfaces:**
- Produces: `FilterState`, `FilterPreset`, extended `AppState` with `comparisonList`, `filterPresets`, `homeAddress` and their actions

- [ ] **Step 1: Add FilterState and FilterPreset types to `src/types.ts`**

Add the following after the `School` interface (after line 23):

```ts
export interface FilterState {
  levelFilter: string[];
  genderFilter: string[];
  financingTypeFilter: string[];
  religionFilter: string[];
  districtFilter: string | null;
  distanceFilter: number | null;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: FilterState;
}
```

- [ ] **Step 2: Extend AppState with new state slices in `src/types.ts`**

Add these fields to the `AppState` interface (after `favorites: string[];` on line 47):

```ts
  comparisonList: string[];
  filterPresets: FilterPreset[];
  homeAddress: { lat: number; lng: number } | null;
```

Add these action signatures (after `clearFilters: () => void;` on line 65):

```ts
  addToComparison: (schoolId: string | undefined) => void;
  removeFromComparison: (schoolId: string) => void;
  clearComparison: () => void;
  saveFilterPreset: (name: string) => void;
  loadFilterPreset: (id: string) => void;
  deleteFilterPreset: (id: string) => void;
  setHomeAddress: (location: { lat: number; lng: number } | null) => void;
```

- [ ] **Step 3: Add state initializers in `src/store.ts`**

In the `create<AppState>()(persist((set) => ({` block, add these initial values after `favorites: [],` (line 62):

```ts
  comparisonList: [],
  filterPresets: [],
  homeAddress: null,
```

- [ ] **Step 4: Add comparison actions in `src/store.ts`**

Add after the `toggleFavorite` action (after line 131):

```ts
  addToComparison: (schoolId) => set((state) => {
    if (!schoolId) return {};
    if (state.comparisonList.includes(schoolId)) return {};
    if (state.comparisonList.length >= 2) return {};
    return { comparisonList: [...state.comparisonList, schoolId] };
  }),
  removeFromComparison: (schoolId) => set((state) => ({
    comparisonList: state.comparisonList.filter((id) => id !== schoolId),
  })),
  clearComparison: () => set({ comparisonList: [] }),
```

- [ ] **Step 5: Add filter preset actions in `src/store.ts`**

Add after the comparison actions:

```ts
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
    // Keep max 10 presets, drop oldest if exceeded
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
```

- [ ] **Step 6: Add home address action in `src/store.ts`**

Add after the preset actions:

```ts
  setHomeAddress: (location) => set({ homeAddress: location }),
```

- [ ] **Step 7: Extend partialize in `src/store.ts`**

Update the `partialize` function (line 172-182) to include the new fields:

```ts
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
    comparisonList: state.comparisonList,
    filterPresets: state.filterPresets,
    homeAddress: state.homeAddress,
  }),
```

- [ ] **Step 8: Verify store compiles**

Run: `npx tsc --noEmit`
Expected: No errors related to new store fields.

- [ ] **Step 9: Commit**

```bash
git add src/types.ts src/store.ts
git commit -m "feat: add comparison, presets, and home address to store"
```

---

### Task 2: CompareView Component

**Files:**
- Create: `src/components/CompareView.tsx`

**Interfaces:**
- Consumes: `useStore` (schools, comparisonList, removeFromComparison, clearComparison, language, setSelectedSchool)
- Consumes: utils (`getSchoolNameByLanguage`, `getSchoolSecondaryNameByLanguage`, `getSchoolLevelByLanguage`, `getLevelBadgeColor`, `getLocalizedGenderLabel`, `getLocalizedDistrictLabel`, `getLocalizedReligionLabel`, `getSchoolSessionByLanguage`, `getLocalizedSessionLabel`)

- [ ] **Step 1: Create `src/components/CompareView.tsx`**

```tsx
import React from 'react';
import { X, MapPin, GitCompare } from 'lucide-react';
import { useStore } from '../store';
import {
  getSchoolNameByLanguage,
  getSchoolSecondaryNameByLanguage,
  getSchoolLevelByLanguage,
  getLevelBadgeColor,
  getLocalizedGenderLabel,
  getLocalizedDistrictLabel,
  getLocalizedReligionLabel,
  getSchoolSessionByLanguage,
  getLocalizedSessionLabel,
} from '../utils';

interface CompareViewProps {
  onBack: () => void;
}

const CompareView: React.FC<CompareViewProps> = ({ onBack }) => {
  const {
    schools,
    comparisonList,
    removeFromComparison,
    clearComparison,
    language,
    setSelectedSchool,
  } = useStore();

  const t = language === 'zh'
    ? {
        title: '學校比較',
        empty: '從地圖新增學校以進行比較',
        hint: '在學校詳情卡點擊比較',
        backToMap: '返回地圖',
        clearAll: '清除比較',
        addAnother: '新增另一所學校',
        level: '學校級別',
        gender: '學生性別',
        district: '地區',
        religion: '宗教',
        session: '授課時間',
        schoolType: '學校類別',
        directions: '導航',
        noValue: '未提供',
      }
    : {
        title: 'Compare Schools',
        empty: 'Add schools from the map to compare them',
        hint: 'Tap Compare on any school detail card',
        backToMap: 'Back to Map',
        clearAll: 'Clear Comparison',
        addAnother: 'Add another school',
        level: 'Level',
        gender: 'Gender',
        district: 'District',
        religion: 'Religion',
        session: 'Session',
        schoolType: 'School Type',
        directions: 'Directions',
        noValue: 'N/A',
      };

  const comparedSchools = schools.filter((s) => comparisonList.includes(s['School No.']));
  const rows = [
    { label: t.level, getValue: (s: any) => {
      const level = getSchoolLevelByLanguage(s, language);
      const badge = getLevelBadgeColor(level);
      return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>{badge.label}</span>;
    }},
    { label: t.gender, getValue: (s: any) => getLocalizedGenderLabel(s, language) || t.noValue },
    { label: t.district, getValue: (s: any) => getLocalizedDistrictLabel(s, language) || t.noValue },
    { label: t.religion, getValue: (s: any) => getLocalizedReligionLabel(s, language) || t.noValue },
    { label: t.session, getValue: (s: any) => getLocalizedSessionLabel(getSchoolSessionByLanguage(s, 'en'), language) || t.noValue },
    { label: t.schoolType, getValue: (s: any) => s['School Type'] || t.noValue },
  ];

  if (comparedSchools.length === 0) {
    return (
      <div className="absolute inset-0 pt-40 sm:pt-44 md:pt-28 px-3 sm:px-4 md:px-6 pb-6 md:pb-8 overflow-y-auto overflow-x-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-2xl bg-surface-container p-8 text-center">
            <GitCompare className="w-12 h-12 text-on-surface-variant mx-auto mb-3" />
            <p className="text-on-surface-variant font-medium">{t.empty}</p>
            <p className="text-outline text-sm mt-1">{t.hint}</p>
            <button
              onClick={onBack}
              className="mt-4 px-4 py-2 bg-primary text-on-primary rounded-full font-medium text-sm cursor-pointer"
            >
              {t.backToMap}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pt-40 sm:pt-44 md:pt-28 px-3 sm:px-4 md:px-6 pb-6 md:pb-8 overflow-y-auto overflow-x-hidden">
      <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
        {/* Header */}
        <div className="rounded-2xl bg-surface-container p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-on-surface">{t.title}</h2>
              <p className="text-sm text-on-surface-variant mt-1">
                {comparedSchools.length} {language === 'zh' ? '所學校已選擇' : 'schools selected'}
              </p>
            </div>
            <div className="flex gap-2">
              {comparedSchools.length < 2 && (
                <button
                  onClick={onBack}
                  className="px-3 py-1.5 bg-surface-container-high border border-outline-variant text-on-surface-variant rounded-full text-xs font-medium cursor-pointer"
                >
                  {t.addAnother}
                </button>
              )}
              <button
                onClick={clearComparison}
                className="px-3 py-1.5 bg-surface-container-high border border-outline-variant text-on-surface-variant rounded-full text-xs font-medium cursor-pointer"
              >
                {t.clearAll}
              </button>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        {comparedSchools.length >= 1 && (
          <div className="rounded-2xl bg-surface-container overflow-hidden">
            {/* School Headers */}
            <div className={`grid ${comparedSchools.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} divide-x divide-outline-variant`}>
              {comparedSchools.map((school) => {
                const level = getSchoolLevelByLanguage(school, language);
                const badge = getLevelBadgeColor(level);
                return (
                  <div key={school['School No.']} className="p-4 sm:p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-medium text-xs ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </div>
                        <div className="min-w-0">
                          <h3
                            className="text-sm sm:text-base font-semibold text-on-surface truncate cursor-pointer hover:underline"
                            onClick={() => setSelectedSchool(school)}
                          >
                            {getSchoolNameByLanguage(school, language)}
                          </h3>
                          <p className="text-[11px] sm:text-xs text-on-surface-variant truncate">
                            {getSchoolSecondaryNameByLanguage(school, language)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromComparison(school['School No.'])}
                        className="p-1 text-on-surface-variant hover:text-error transition-colors cursor-pointer flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {school.Longitude && school.Latitude && (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${school.Latitude},${school.Longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-primary hover:underline"
                      >
                        <MapPin className="w-3 h-3" />
                        {t.directions}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Comparison Rows */}
            <div className={`grid ${comparedSchools.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} divide-x divide-outline-variant border-t border-outline-variant`}>
              {rows.map((row, i) => (
                <div key={i} className={`grid ${comparedSchools.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} divide-x divide-outline-variant ${i % 2 === 0 ? 'bg-surface-container-high/30' : ''}`}>
                  {comparedSchools.map((school) => (
                    <div key={school['School No.']} className="px-4 py-3">
                      <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-on-surface-variant font-medium mb-0.5">{row.label}</p>
                      <p className="text-xs sm:text-sm text-on-surface font-medium break-words">{row.getValue(school)}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompareView;
```

- [ ] **Step 2: Verify component compiles**

Run: `npx tsc --noEmit`
Expected: No errors related to CompareView.

- [ ] **Step 3: Commit**

```bash
git add src/components/CompareView.tsx
git commit -m "feat: add CompareView component for school comparison"
```

---

### Task 3: BottomSheet Compare Button

**Files:**
- Modify: `src/components/BottomSheet.tsx`

**Interfaces:**
- Consumes: `useStore` (addToComparison, comparisonList)
- Consumes: `GitCompare` icon from lucide-react

- [ ] **Step 1: Add `GitCompare` import in `src/components/BottomSheet.tsx`**

Update the import on line 3 to include `GitCompare`:

```tsx
import { X, Globe, Phone, MapPin, Train, Navigation, Share2, Star, GitCompare } from 'lucide-react';
```

- [ ] **Step 2: Add store destructuring in `src/components/BottomSheet.tsx`**

Update the useStore call on line 25 to include comparison:

```tsx
  const { selectedSchool, setSelectedSchool, language, favorites, toggleFavorite, addToComparison, comparisonList } = useStore();
```

- [ ] **Step 3: Add localized labels in `src/components/BottomSheet.tsx`**

Add `compare` label to both `t` objects.

In the zh object (after line 41, after `favorite: '收藏',`):

```ts
        compare: '比較',
```

In the en object (after line 60, after `favorite: 'Save',`):

```ts
        compare: 'Compare',
```

- [ ] **Step 4: Add Compare button in the action grid in `src/components/BottomSheet.tsx`**

After the Favorite button block (after line 227), add:

```tsx
                <button
                  onClick={() => addToComparison(selectedSchool['School No.'])}
                  className={`flex flex-col items-center justify-center gap-0.5 sm:gap-1 py-2 sm:py-2.5 rounded-full font-medium text-[10px] sm:text-xs transition-colors ${
                    comparisonList.includes(selectedSchool['School No.'])
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-high text-on-surface'
                  }`}
                >
                  <GitCompare className={`w-3.5 sm:w-4 h-3.5 sm:h-4 ${comparisonList.includes(selectedSchool['School No.']) ? 'fill-current' : ''}`} />
                  {t.compare}
                </button>
```

- [ ] **Step 5: Update the grid layout to accommodate 5 buttons**

Change `grid-cols-4` to `grid-cols-5` on line 185:

```tsx
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2 pt-1 sm:pt-2">
```

- [ ] **Step 6: Verify component compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/BottomSheet.tsx
git commit -m "feat: add Compare button to BottomSheet action grid"
```

---

### Task 4: Navigation 4th Tab

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `useStore` (comparisonList)
- Consumes: `CompareView` component (lazy-loaded)

- [ ] **Step 1: Add lazy import for CompareView in `src/App.tsx`**

Add after the FavoritesView lazy import (after line 8):

```tsx
const CompareView = React.lazy(() => import('./components/CompareView'));
```

- [ ] **Step 2: Add comparisonList to store destructuring in `src/App.tsx`**

Update the useStore call on line 15 to include `comparisonList`:

```tsx
  const { setSchools, setLoading, setError, loading, error, schools, language, setLanguage, favorites, comparisonList } = useStore();
```

- [ ] **Step 3: Add `compare` translation keys in `src/App.tsx`**

In the zh translation object (after `favorites: '收藏',` on line 36):

```ts
          compare: '比較',
```

In the en translation object (after `favorites: 'Favorites',` on line 56):

```ts
          compare: 'Compare',
```

- [ ] **Step 4: Add Compare tab button in `src/App.tsx`**

In the nav bar tabs section, add a Compare button after the Favorites button (after line 154). The full tab row becomes:

```tsx
          <div className="rounded-full bg-surface-container-high p-1 sm:p-1.5 flex gap-0.5 sm:gap-1">
            <button
              onClick={() => setActiveView('map')}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold transition-colors ${activeView === 'map' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              {t.map}
            </button>
            <button
              onClick={() => setActiveView('stats')}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold transition-colors ${activeView === 'stats' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              {t.stats}
            </button>
            <button
              onClick={() => setActiveView('compare')}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold transition-colors relative ${activeView === 'compare' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              {t.compare}
              {comparisonList.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-error rounded-full text-[8px] font-bold text-on-error-container flex items-center justify-center">{comparisonList.length}</span>
              )}
            </button>
            <button
              onClick={() => setActiveView('favorites')}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold transition-colors relative ${activeView === 'favorites' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              {t.favorites}
              {favorites.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-error rounded-full text-[8px] font-bold text-on-error-container flex items-center justify-center">{favorites.length}</span>
              )}
            </button>
          </div>
```

- [ ] **Step 5: Update activeView type and rendering in `src/App.tsx`**

Change the `activeView` state type (line 17):

```tsx
  const [activeView, setActiveView] = useState<'map' | 'stats' | 'favorites' | 'compare'>('map');
```

Add the compare view rendering block. Update the view rendering section (lines 181-202) to:

```tsx
      {activeView === 'map' ? (
        <>
          <SearchBar />
          <FilterBar />
          {deferMap ? (
            <Suspense fallback={<div className="p-4 text-on-surface-variant">{language === 'zh' ? '載入地圖...' : 'Loading map...'}</div>}>
              <Map />
            </Suspense>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-on-surface-variant">{language === 'zh' ? '載入地圖中...' : 'Preparing map...'}</div>
          )}
          <BottomSheet />
        </>
      ) : activeView === 'compare' ? (
        <Suspense fallback={<div className="p-4 text-on-surface-variant">{language === 'zh' ? '載入比較...' : 'Loading comparison...'}</div>}>
          <CompareView onBack={() => setActiveView('map')} />
        </Suspense>
      ) : activeView === 'favorites' ? (
        <Suspense fallback={<div className="p-4 text-on-surface-variant">{language === 'zh' ? '載入收藏...' : 'Loading favorites...'}</div>}>
          <FavoritesView onBack={() => setActiveView('map')} />
        </Suspense>
      ) : (
        <Suspense fallback={<div className="p-4 text-on-surface-variant">{language === 'zh' ? '載入統計資料...' : 'Loading statistics...'}</div>}>
          <StatsTab />
        </Suspense>
      )}
```

- [ ] **Step 6: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add Compare 4th tab to navigation"
```

---

### Task 5: FilterBar Presets UI

**Files:**
- Modify: `src/components/FilterBar.tsx`

**Interfaces:**
- Consumes: `useStore` (filterPresets, saveFilterPreset, loadFilterPreset, deleteFilterPreset)

- [ ] **Step 1: Add imports in `src/components/FilterBar.tsx`**

Update the lucide-react import (line 2) to include `BookmarkPlus` and `Check`:

```tsx
import { MapPin, Locate, SlidersHorizontal, X, BookmarkPlus, Check } from 'lucide-react';
```

- [ ] **Step 2: Add store destructuring in `src/components/FilterBar.tsx`**

Update the useStore call (line 7) to include preset fields:

```tsx
  const {
    schools,
    levelFilter,
    setLevelFilter,
    userLocation,
    setUserLocation,
    distanceFilter,
    setDistanceFilter,
    genderFilter,
    setGenderFilter,
    financingTypeFilter,
    setFinancingTypeFilter,
    religionFilter,
    setReligionFilter,
    districtFilter,
    setDistrictFilter,
    clearFilters,
    language,
    filterPresets,
    saveFilterPreset,
    loadFilterPreset,
    deleteFilterPreset,
  } = useStore();
```

- [ ] **Step 3: Add preset UI state in `src/components/FilterBar.tsx`**

After the existing state declarations (after line 28), add:

```tsx
  const [isPresetInputOpen, setIsPresetInputOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
```

- [ ] **Step 4: Add localized labels in `src/components/FilterBar.tsx`**

Add to the zh `t` object (after `clearFilters: '清除篩選',` on line 48):

```ts
        savePreset: '儲存篩選',
        presetName: '篩選名稱',
        noPresets: '尚未儲存篩選',
```

Add to the en `t` object (after `clearFilters: 'Clear Filters',` on line 67):

```ts
        savePreset: 'Save Preset',
        presetName: 'Preset name',
        noPresets: 'No saved presets',
```

- [ ] **Step 5: Add presets UI to FilterBar panel content in `src/components/FilterBar.tsx`**

In the `panelContent` JSX, after the "Clear Filters" button section (after line 483, after the closing `</div>` of the clear filters div), add:

```tsx
          {/* Filter Presets */}
          <div className="border-t border-outline-variant pt-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] sm:text-xs font-semibold text-on-surface-variant uppercase">
                {language === 'zh' ? '篩選預設' : 'Filter Presets'}
              </p>
              <button
                type="button"
                onClick={() => setIsPresetInputOpen(!isPresetInputOpen)}
                className="text-[10px] sm:text-xs font-semibold px-2 py-1 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer flex items-center gap-1"
              >
                <BookmarkPlus className="w-3 h-3" />
                {t.savePreset}
              </button>
            </div>

            {isPresetInputOpen && (
              <div className="flex gap-1.5 mb-2">
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder={t.presetName}
                  className="flex-1 bg-surface-container-high border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-on-surface placeholder:text-outline"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && presetName.trim()) {
                      saveFilterPreset(presetName.trim());
                      setPresetName('');
                      setIsPresetInputOpen(false);
                    }
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    if (presetName.trim()) {
                      saveFilterPreset(presetName.trim());
                      setPresetName('');
                      setIsPresetInputOpen(false);
                    }
                  }}
                  className="p-1.5 bg-primary text-on-primary rounded-lg cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPresetInputOpen(false);
                    setPresetName('');
                  }}
                  className="p-1.5 bg-surface-container-high text-on-surface-variant rounded-lg cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {filterPresets.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {filterPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-center gap-1 bg-surface-container-high rounded-lg pl-2.5 pr-1 py-1"
                  >
                    <button
                      type="button"
                      onClick={() => loadFilterPreset(preset.id)}
                      className="text-[10px] sm:text-xs font-medium text-on-surface hover:text-primary transition-colors cursor-pointer"
                    >
                      {preset.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteFilterPreset(preset.id)}
                      className="p-0.5 text-on-surface-variant hover:text-error transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[9px] sm:text-[10px] text-outline italic">{t.noPresets}</p>
            )}
          </div>
```

- [ ] **Step 6: Verify component compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/FilterBar.tsx
git commit -m "feat: add filter presets save/load UI to FilterBar"
```

---

### Task 6: FilterBar Home Address UI

**Files:**
- Modify: `src/components/FilterBar.tsx`

**Interfaces:**
- Consumes: `useStore` (homeAddress, setHomeAddress)
- Consumes: Nominatim geocoding API

- [ ] **Step 1: Add `Home` import in `src/components/FilterBar.tsx`**

Update the lucide-react import to include `Home`:

```tsx
import { MapPin, Locate, SlidersHorizontal, X, BookmarkPlus, Check, Home } from 'lucide-react';
```

- [ ] **Step 2: Add store destructuring in `src/components/FilterBar.tsx`**

Update the useStore call to include home address:

```tsx
  const {
    schools,
    levelFilter,
    setLevelFilter,
    userLocation,
    setUserLocation,
    distanceFilter,
    setDistanceFilter,
    genderFilter,
    setGenderFilter,
    financingTypeFilter,
    setFinancingTypeFilter,
    religionFilter,
    setReligionFilter,
    districtFilter,
    setDistrictFilter,
    clearFilters,
    language,
    filterPresets,
    saveFilterPreset,
    loadFilterPreset,
    deleteFilterPreset,
    homeAddress,
    setHomeAddress,
  } = useStore();
```

- [ ] **Step 3: Add home address UI state in `src/components/FilterBar.tsx`**

After the existing state declarations, add:

```tsx
  const [isHomeInputOpen, setIsHomeInputOpen] = useState(false);
  const [homeInput, setHomeInput] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);
```

- [ ] **Step 4: Add geocoding function in `src/components/FilterBar.tsx`**

Add the geocoding handler after the `handleLocateMe` function (after line 253):

```tsx
  const handleSetHomeFromAddress = async () => {
    if (!homeInput.trim()) return;
    setIsGeocoding(true);
    setGeocodingError(null);
    try {
      const query = encodeURIComponent(homeInput.trim());
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=hk`,
        { headers: { 'User-Agent': 'HKSchoolFinder/1.0' } }
      );
      const results = await res.json();
      if (results.length > 0) {
        setHomeAddress({ lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) });
        setIsHomeInputOpen(false);
        setHomeInput('');
      } else {
        setGeocodingError(t.geocodingError);
      }
    } catch {
      setGeocodingError(t.geocodingError);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSetHomeFromLocation = () => {
    if (!navigator.geolocation) return;
    setIsGeocoding(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setHomeAddress({ lat: position.coords.latitude, lng: position.coords.longitude });
        setIsGeocoding(false);
        setIsHomeInputOpen(false);
      },
      () => {
        setGeocodingError(t.geocodingError);
        setIsGeocoding(false);
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  };
```

- [ ] **Step 5: Add localized labels in `src/components/FilterBar.tsx`**

Add to the zh `t` object:

```ts
        setHome: '設置地址',
        useCurrentLocation: '使用目前位置',
        enterAddress: '輸入地址',
        findAddress: '搜尋',
        homeSet: '地址已設定',
        clearHome: '清除',
        geocodingError: '找不到地址',
        geocodingLoading: '搜尋中...',
```

Add to the en `t` object:

```ts
        setHome: 'Set Home',
        useCurrentLocation: 'Use current location',
        enterAddress: 'Enter address',
        findAddress: 'Find',
        homeSet: 'Home set',
        clearHome: 'Clear',
        geocodingError: 'Address not found',
        geocodingLoading: 'Searching...',
```

- [ ] **Step 6: Add home address UI below Locate Me button in `src/components/FilterBar.tsx`**

In the `panelContent` JSX, after the "Location Status" section (after line 651), add:

```tsx
          {/* Home Address */}
          <div>
            <button
              onClick={() => setIsHomeInputOpen(!isHomeInputOpen)}
              className="w-full py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer bg-surface-container-high text-on-surface hover:bg-surface-container-highest active:scale-95"
            >
              <Home className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
              {homeAddress ? t.homeSet : t.setHome}
            </button>

            {isHomeInputOpen && !homeAddress && (
              <div className="mt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleSetHomeFromLocation}
                  disabled={isGeocoding}
                  className="w-full py-2 rounded-lg font-medium text-xs bg-primary text-on-primary cursor-pointer disabled:opacity-50"
                >
                  {isGeocoding ? t.geocodingLoading : t.useCurrentLocation}
                </button>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={homeInput}
                    onChange={(e) => setHomeInput(e.target.value)}
                    placeholder={t.enterAddress}
                    className="flex-1 bg-surface-container-high border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-on-surface placeholder:text-outline"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSetHomeFromAddress();
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSetHomeFromAddress}
                    disabled={isGeocoding || !homeInput.trim()}
                    className="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-medium cursor-pointer disabled:opacity-50"
                  >
                    {isGeocoding ? t.geocodingLoading : t.findAddress}
                  </button>
                </div>
                {geocodingError && (
                  <p className="text-[10px] sm:text-xs text-error">{geocodingError}</p>
                )}
              </div>
            )}

            {homeAddress && (
              <div className="mt-2 flex items-center justify-between bg-secondary-container/20 border border-secondary-container/30 rounded-lg px-2.5 py-1.5">
                <div className="flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-secondary-container" />
                  <p className="text-[10px] sm:text-xs text-secondary-container font-medium">
                    {homeAddress.lat.toFixed(4)}, {homeAddress.lng.toFixed(4)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setHomeAddress(null)}
                  className="text-[10px] sm:text-xs text-error hover:underline cursor-pointer"
                >
                  {t.clearHome}
                </button>
              </div>
            )}
          </div>
```

- [ ] **Step 7: Verify component compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 8: Commit**

```bash
git add src/components/FilterBar.tsx
git commit -m "feat: add home address set/clear with Nominatim geocoding"
```

---

### Task 7: Directions Link Updates

**Files:**
- Modify: `src/components/BottomSheet.tsx`
- Modify: `src/components/FavoritesView.tsx`

**Interfaces:**
- Consumes: `useStore` (homeAddress)

- [ ] **Step 1: Add homeAddress to store destructuring in `src/components/BottomSheet.tsx`**

Update the useStore call (line 25):

```tsx
  const { selectedSchool, setSelectedSchool, language, favorites, toggleFavorite, addToComparison, comparisonList, homeAddress } = useStore();
```

- [ ] **Step 2: Update directions link in `src/components/BottomSheet.tsx`**

Update the directions `href` (line 188) to include origin when home is set:

```tsx
                    href={homeAddress
                      ? `https://www.google.com/maps/dir/?api=1&origin=${homeAddress.lat},${homeAddress.lng}&destination=${selectedSchool.Latitude},${selectedSchool.Longitude}`
                      : `https://www.google.com/maps/dir/?api=1&destination=${selectedSchool.Latitude},${selectedSchool.Longitude}`
                    }
```

- [ ] **Step 3: Add homeAddress to store destructuring in `src/components/FavoritesView.tsx`**

Update the useStore call (line 19):

```tsx
  const { schools, favorites, toggleFavorite, setSelectedSchool, language, homeAddress } = useStore();
```

- [ ] **Step 4: Update directions link in `src/components/FavoritesView.tsx`**

Update the directions `href` (line 125) to include origin when home is set:

```tsx
                    href={homeAddress
                      ? `https://www.google.com/maps/dir/?api=1&origin=${homeAddress.lat},${homeAddress.lng}&destination=${school.Latitude},${school.Longitude}`
                      : `https://www.google.com/maps/dir/?api=1&destination=${school.Latitude},${school.Longitude}`
                    }
```

- [ ] **Step 5: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/BottomSheet.tsx src/components/FavoritesView.tsx
git commit -m "feat: auto-fill directions origin from saved home address"
```

---

### Task 8: Final Build Verification

**Files:** None (verification only)

- [ ] **Step 1: Run full type check**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds without errors.

- [ ] **Step 3: Run dev server and manual smoke test**

Run: `npm run dev`
Manual checks:
1. Open Map tab → click a school → verify Compare button appears in action grid
2. Tap Compare → verify button highlights
3. Switch to Compare tab → verify school appears with info
4. Go back to Map → click another school → tap Compare → verify 2 schools shown side-by-side
5. Open FilterBar → set some filters → tap Save Preset → enter name → verify preset chip appears
6. Tap preset chip → verify filters are applied
7. In FilterBar → tap Set Home → enter an address → verify coordinates shown
8. Click Directions on a school → verify Google Maps opens with origin parameter
9. Toggle language → verify all new text is bilingual

- [ ] **Step 4: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "chore: final build fixes for comparison, presets, and home address"
```
