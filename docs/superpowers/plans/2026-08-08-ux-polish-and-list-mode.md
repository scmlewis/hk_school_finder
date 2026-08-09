# UX Polish & List Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add animated map transitions, skeleton loading states, filter UX improvements, and a Google Maps-style split-view list panel to HK School Finder.

**Architecture:** Four independent features implemented sequentially. C1 (map transitions) modifies Map.tsx. C2 (skeleton loading) adds a new Skeleton component and integrates it into BottomSheet and StatsTab. C4 (filter UX) adds an ActiveFilters component below FilterBar. C5 (list mode) adds ListPanel and SchoolCard components, a toggle button in the nav, and bidirectional scroll sync with the map.

**Tech Stack:** React 19, TypeScript, MapLibre GL 5, Framer Motion (`motion`), Zustand 5, Tailwind CSS 4, Lucide React icons.

## Global Constraints

- TypeScript strict mode enabled
- All components are functional with hooks
- Use existing `cn()` utility from `src/utils.ts` for conditional classes
- Use existing color tokens from `index.css` (e.g., `bg-surface-container-high`, `text-on-surface-variant`)
- Use Framer Motion `motion` package (already installed) for animations
- Use Lucide React (already installed) for icons
- No new external dependencies for C1, C2, C4. C5 requires `react-window` for virtual scrolling.
- All text must be bilingual (English + Traditional Chinese) via the existing `language` state pattern
- Mobile-first responsive design

---

## Task 1: Add Shimmer Animation to CSS

**Files:**
- Modify: `src/index.css`

**Interfaces:**
- Consumes: None
- Produces: CSS classes `.skeleton-shimmer` and `.skeleton-pulse` available to all components

- [ ] **Step 1: Add shimmer animation keyframes and utility classes**

Append to `src/index.css` after the existing `@media (prefers-reduced-motion: reduce)` block:

```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    var(--color-surface-container-high) 25%,
    var(--color-surface-container-highest) 50%,
    var(--color-surface-container-high) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 8px;
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-shimmer {
    animation: none;
    background: var(--color-surface-container-high);
  }
}
```

- [ ] **Step 2: Verify CSS compiles**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat: add skeleton shimmer animation to global CSS"
```

---

## Task 2: Create Skeleton Component

**Files:**
- Create: `src/components/Skeleton.tsx`

**Interfaces:**
- Consumes: None
- Produces: `Skeleton` component (generic), `SkeletonBottomSheet`, `SkeletonStats`, `SkeletonListCard` composites

- [ ] **Step 1: Create the Skeleton component file**

```tsx
import React from 'react';

interface SkeletonProps {
  className?: string;
  count?: number;
}

export function Skeleton({ className = '', count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`skeleton-shimmer ${className}`}
          aria-hidden="true"
        />
      ))}
    </>
  );
}

export function SkeletonBottomSheet() {
  return (
    <div className="p-4 sm:p-5 space-y-4">
      <div className="flex justify-between items-start">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
      <Skeleton className="h-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-10 rounded-xl" />
        <Skeleton className="h-10 rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="p-4 space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 flex-1 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonListCard() {
  return (
    <div className="p-3 border border-outline/10 rounded-xl space-y-2">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/Skeleton.tsx
git commit -m "feat: add Skeleton component with shimmer variants"
```

---

## Task 3: Integrate Skeleton into BottomSheet

**Files:**
- Modify: `src/components/BottomSheet.tsx`

**Interfaces:**
- Consumes: `SkeletonBottomSheet` from `src/components/Skeleton.tsx`
- Produces: BottomSheet shows skeleton while school details are loading (no change to external API)

- [ ] **Step 1: Add skeleton import and loading state**

In `src/components/BottomSheet.tsx`, add import at the top:

```tsx
import { SkeletonBottomSheet } from './Skeleton';
```

- [ ] **Step 2: Replace the bottom sheet content with skeleton support**

The current BottomSheet renders directly when `selectedSchool` exists. Wrap the content in a conditional that shows the skeleton briefly. Since the school data is already in-memory (no async fetch per school), the skeleton will show for a brief moment to demonstrate the pattern. Add a local `isContentLoaded` state:

Inside the `BottomSheet` component, add state:

```tsx
const [isContentLoaded, setIsContentLoaded] = React.useState(false);
```

Add a useEffect to simulate content load (in real use this would be tied to async data fetching):

```tsx
React.useEffect(() => {
  if (selectedSchool) {
    setIsContentLoaded(false);
    const timer = setTimeout(() => setIsContentLoaded(true), 150);
    return () => clearTimeout(timer);
  }
}, [selectedSchool]);
```

Then in the JSX, conditionally render skeleton vs content inside the `motion.div` panel. Replace the content inside the panel's `<div className="rounded-t-2xl ...">` with:

```tsx
{!isContentLoaded ? (
  <SkeletonBottomSheet />
) : (
  <>
    <button 
      onClick={() => setSelectedSchool(null)}
      className="w-full flex justify-center py-2 cursor-pointer"
      aria-label={language === 'zh' ? '收起' : 'Collapse'}
    >
      <div className="w-10 h-1 sm:w-12 sm:h-1.5 bg-outline-variant rounded-full" />
    </button>
  
    {/* ... rest of existing content unchanged ... */}
  </>
)}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/BottomSheet.tsx
git commit -m "feat: add skeleton loading state to BottomSheet"
```

---

## Task 4: Integrate Skeleton into StatsTab

**Files:**
- Modify: `src/components/StatsTab.tsx`

**Interfaces:**
- Consumes: `SkeletonStats` from `src/components/Skeleton.tsx`
- Produces: StatsTab shows skeleton while chart data aggregates

- [ ] **Step 1: Read StatsTab.tsx to understand its structure**

Read `src/components/StatsTab.tsx` to identify where to add the skeleton.

- [ ] **Step 2: Add skeleton import and loading state**

Add import at the top of `StatsTab.tsx`:

```tsx
import { SkeletonStats } from './Skeleton';
```

Add a local loading state that shows skeleton for 200ms on mount or when filters change:

```tsx
const [isStatsLoaded, setIsStatsLoaded] = React.useState(false);

React.useEffect(() => {
  setIsStatsLoaded(false);
  const timer = setTimeout(() => setIsStatsLoaded(true), 200);
  return () => clearTimeout(timer);
}, [filteredSchools]);
```

- [ ] **Step 3: Wrap stats content with skeleton conditional**

Wrap the main chart rendering in a conditional:

```tsx
{!isStatsLoaded ? (
  <SkeletonStats />
) : (
  // existing chart content
)}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/StatsTab.tsx
git commit -m "feat: add skeleton loading state to StatsTab"
```

---

## Task 5: Improve Map flyTo Transitions

**Files:**
- Modify: `src/components/Map.tsx`

**Interfaces:**
- Consumes: `selectedSchool` from Zustand store
- Produces: Smoother flyTo with consistent easing and duration

- [ ] **Step 1: Update the flyTo call in the selectedSchool effect**

In `src/components/Map.tsx`, find the `useEffect` that watches `selectedSchool` (around line 477-491). Replace the `flyTo` options:

```tsx
useEffect(() => {
  if (!isMapLoaded || !selectedSchool || !map.current) return;

  const lng = parseFloat(selectedSchool.Longitude || selectedSchool.longitude || '');
  const lat = parseFloat(selectedSchool.Latitude || selectedSchool.latitude || '');

  if (!isNaN(lng) && !isNaN(lat)) {
    map.current.flyTo({
      center: [lng, lat],
      zoom: Math.max(map.current.getZoom(), 16),
      duration: 1200,
      curve: 1.5,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      offset: getSelectionOffset(),
    });
  }
}, [selectedSchool, isMapLoaded]);
```

- [ ] **Step 2: Update the flyTo in the marker click handler**

In the `SCHOOL_POINTS_LAYER_ID` click handler (around line 335-340), update the flyTo:

```tsx
map.current.flyTo({
  center: coordinates,
  zoom: Math.max(map.current.getZoom(), 16),
  duration: 1200,
  curve: 1.5,
  easing: (t) => 1 - Math.pow(1 - t, 3),
  offset: getSelectionOffset(),
});
```

- [ ] **Step 3: Update the easeTo for school net click**

In the school net click handler (around line 413-416), after `setActiveSchoolNet`, add a fitBounds call. First, find the clicked net's bounds from the GeoJSON feature and fly to it. Replace the net click handler:

```tsx
if (netId) {
  setActiveSchoolNet(String(netId));
  
  const netFeature = geojsonData.current?.features?.find(
    (f: any) => String(f.properties?.NET_ID || f.properties?.Net_ID || f.properties?.NET_NO) === String(netId)
  );
  if (netFeature && map.current) {
    const bounds = new maplibregl.LngLatBounds();
    const geom = netFeature.geometry;
    if (geom.type === 'Polygon') {
      geom.coordinates[0].forEach((coord: number[]) => bounds.extend(coord as [number, number]));
    } else if (geom.type === 'MultiPolygon') {
      geom.coordinates.forEach((polygon: number[][][]) =>
        polygon[0].forEach((coord: number[]) => bounds.extend(coord as [number, number]))
      );
    }
    if (!bounds.isEmpty()) {
      map.current.easeTo({
        center: bounds.getCenter(),
        zoom: Math.min(Math.max(bounds.getNorthEast().lng - bounds.getSouthWest().lng > 0.05 ? 11 : 13, 10), 16),
        duration: 800,
        easing: (t) => 1 - Math.pow(1 - t, 2),
      });
    }
  }
}
```

- [ ] **Step 4: Add marker pulse animation CSS**

Append to `src/index.css`:

```css
@keyframes marker-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

.marker-selected {
  animation: marker-pulse 0.3s ease-in-out;
}

@media (prefers-reduced-motion: reduce) {
  .marker-selected {
    animation: none;
  }
}
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/Map.tsx src/index.css
git commit -m "feat: improve map flyTo transitions with smooth easing"
```

---

## Task 6: Create ActiveFilters Component

**Files:**
- Create: `src/components/ActiveFilters.tsx`

**Interfaces:**
- Consumes: `language`, `levelFilter`, `genderFilter`, `financingTypeFilter`, `religionFilter`, `districtFilter`, `distanceFilter`, `activeSchoolNet`, `searchQuery` from Zustand store; `clearFilters`, `setLevelFilter`, `setGenderFilter`, `setFinancingTypeFilter`, `setReligionFilter`, `setDistrictFilter`, `setDistanceFilter`, `setActiveSchoolNet`, `setSearchQuery` from Zustand store
- Produces: `ActiveFilters` component that renders filter chips with animations

- [ ] **Step 1: Create the ActiveFilters component**

```tsx
import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useStore } from '../store';

interface FilterChip {
  id: string;
  label: string;
  onRemove: () => void;
}

export default function ActiveFilters() {
  const {
    language,
    levelFilter,
    genderFilter,
    financingTypeFilter,
    religionFilter,
    districtFilter,
    distanceFilter,
    activeSchoolNet,
    searchQuery,
    clearFilters,
    setLevelFilter,
    setGenderFilter,
    setFinancingTypeFilter,
    setReligionFilter,
    setDistrictFilter,
    setDistanceFilter,
    setActiveSchoolNet,
    setSearchQuery,
  } = useStore();

  const chips = useMemo<FilterChip[]>(() => {
    const result: FilterChip[] = [];
    const t = language === 'zh' ? {
      level: '級別',
      gender: '性別',
      financing: '資助',
      religion: '宗教',
      district: '地區',
      distance: '距離',
      net: '校網',
      search: '搜尋',
      all: '全部',
    } : {
      level: 'Level',
      gender: 'Gender',
      financing: 'Financing',
      religion: 'Religion',
      district: 'District',
      distance: 'Distance',
      net: 'Net',
      search: 'Search',
      all: 'All',
    };

    if (searchQuery) {
      result.push({
        id: 'search',
        label: `${t.search}: "${searchQuery}"`,
        onRemove: () => setSearchQuery(''),
      });
    }

    const defaultLevels = ['KINDERGARTEN', 'PRIMARY', 'SECONDARY'];
    const isNonDefaultLevels = !(levelFilter.length === 3 && defaultLevels.every(l => levelFilter.includes(l)));
    if (isNonDefaultLevels) {
      const levelLabels = levelFilter.map(l => {
        if (l.includes('KINDERGARTEN')) return language === 'zh' ? '幼稚園' : 'Kindergarten';
        if (l.includes('PRIMARY')) return language === 'zh' ? '小學' : 'Primary';
        if (l.includes('SECONDARY')) return language === 'zh' ? '中學' : 'Secondary';
        return l;
      }).join(', ');
      result.push({
        id: 'level',
        label: `${t.level}: ${levelLabels}`,
        onRemove: () => setLevelFilter(defaultLevels),
      });
    }

    if (genderFilter.length > 0) {
      result.push({
        id: 'gender',
        label: `${t.gender}: ${genderFilter.length}`,
        onRemove: () => setGenderFilter([]),
      });
    }

    if (financingTypeFilter.length > 0) {
      result.push({
        id: 'financing',
        label: `${t.financing}: ${financingTypeFilter.length}`,
        onRemove: () => setFinancingTypeFilter([]),
      });
    }

    if (religionFilter.length > 0) {
      result.push({
        id: 'religion',
        label: `${t.religion}: ${religionFilter.length}`,
        onRemove: () => setReligionFilter([]),
      });
    }

    if (districtFilter) {
      result.push({
        id: 'district',
        label: `${t.district}: ${districtFilter}`,
        onRemove: () => setDistrictFilter(null),
      });
    }

    if (distanceFilter) {
      result.push({
        id: 'distance',
        label: `${t.distance}: ≤${distanceFilter}km`,
        onRemove: () => setDistanceFilter(null),
      });
    }

    if (activeSchoolNet) {
      result.push({
        id: 'net',
        label: `${t.net}: ${activeSchoolNet}`,
        onRemove: () => setActiveSchoolNet(null),
      });
    }

    return result;
  }, [language, levelFilter, genderFilter, financingTypeFilter, religionFilter, districtFilter, distanceFilter, activeSchoolNet, searchQuery, setLevelFilter, setGenderFilter, setFinancingTypeFilter, setReligionFilter, setDistrictFilter, setDistanceFilter, setActiveSchoolNet, setSearchQuery]);

  if (chips.length === 0) return null;

  const t = language === 'zh' ? { clearAll: '全部清除' } : { clearAll: 'Clear All' };

  return (
    <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto scrollbar-none">
      <AnimatePresence mode="popLayout">
        {chips.map((chip) => (
          <motion.button
            key={chip.id}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, x: -20 }}
            transition={{ duration: 0.2 }}
            onClick={chip.onRemove}
            className="flex items-center gap-1 px-2.5 py-1 bg-primary/20 text-primary text-xs font-medium rounded-full whitespace-nowrap flex-shrink-0 cursor-pointer hover:bg-primary/30 transition-colors"
          >
            {chip.label}
            <X className="w-3 h-3" />
          </motion.button>
        ))}
      </AnimatePresence>
      {chips.length > 1 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={clearFilters}
          className="text-xs text-on-surface-variant hover:text-on-surface transition-colors whitespace-nowrap flex-shrink-0 cursor-pointer"
        >
          {t.clearAll}
        </motion.button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ActiveFilters.tsx
git commit -m "feat: add ActiveFilters component with animated chips"
```

---

## Task 7: Integrate ActiveFilters into App Layout

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `ActiveFilters` from `src/components/ActiveFilters.tsx`
- Produces: ActiveFilters rendered below FilterBar in map view

- [ ] **Step 1: Add ActiveFilters import**

In `src/App.tsx`, add import:

```tsx
import ActiveFilters from './components/ActiveFilters';
```

- [ ] **Step 2: Render ActiveFilters below FilterBar**

In the map view section (around line 183), add `ActiveFilters` after `FilterBar`:

```tsx
{activeView === 'map' ? (
  <>
    <SearchBar />
    <FilterBar />
    <ActiveFilters />
    {deferMap ? (
      // ... existing map code
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: integrate ActiveFilters into map view layout"
```

---

## Task 8: Install react-window and Add List Panel State to Store

**Files:**
- Modify: `src/store.ts`
- Modify: `package.json` (via npm install)

**Interfaces:**
- Consumes: None
- Produces: `listPanelOpen` state in Zustand store, `react-window` dependency installed

- [ ] **Step 1: Install react-window**

Run: `npm install react-window && npm install -D @types/react-window`

- [ ] **Step 2: Add listPanelOpen state to Zustand store**

In `src/store.ts`, add to the store interface and initial state. First, add to the `AppState` type in `src/types.ts` (read it first to see the current interface):

After reading types.ts, add these fields to the `AppState` interface:

```tsx
listPanelOpen: boolean;
setListPanelOpen: (open: boolean) => void;
```

In `src/store.ts`, add initial state:

```tsx
listPanelOpen: false,
```

Add the setter action:

```tsx
setListPanelOpen: (open) => set({ listPanelOpen: open }),
```

Add `listPanelOpen` to the `partialize` array so it persists:

```tsx
partialize: (state) => ({
  // ... existing fields
  listPanelOpen: state.listPanelOpen,
}),
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/store.ts src/types.ts package.json package-lock.json
git commit -m "feat: add listPanelOpen state and install react-window"
```

---

## Task 9: Create SchoolCard Component

**Files:**
- Create: `src/components/SchoolCard.tsx`

**Interfaces:**
- Consumes: `School` type, `language` from store, `favorites` + `toggleFavorite` from store, `getDistance` from services
- Produces: `SchoolCard` component, `SchoolCardProps` interface

- [ ] **Step 1: Create SchoolCard component**

```tsx
import React from 'react';
import { Star } from 'lucide-react';
import { useStore } from '../store';
import { School } from '../types';
import { getDistance } from '../services';
import {
  getSchoolNameByLanguage,
  getSchoolSecondaryNameByLanguage,
  getLevelBadgeColor,
  getSchoolLevelByLanguage,
} from '../utils';

interface SchoolCardProps {
  school: School;
  isSelected: boolean;
  onClick: () => void;
  style?: React.CSSProperties;
}

export default function SchoolCard({ school, isSelected, onClick, style }: SchoolCardProps) {
  const { language, favorites, toggleFavorite, homeAddress } = useStore();

  const schoolId = school['School No.'] || '';
  const isFavorited = favorites.includes(schoolId);

  const levelForBadge = getSchoolLevelByLanguage(school, 'en') || getSchoolLevelByLanguage(school, language);
  const levelBadge = getLevelBadgeColor(levelForBadge);

  const lat = parseFloat(school.Latitude || (school as any).latitude || '');
  const lng = parseFloat(school.Longitude || (school as any).longitude || '');

  let distanceText: string | null = null;
  if (homeAddress && !isNaN(lat) && !isNaN(lng)) {
    const dist = getDistance(homeAddress.lat, homeAddress.lng, lat, lng);
    distanceText = dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`;
  }

  return (
    <div
      style={style}
      onClick={onClick}
      className={`p-3 rounded-xl border cursor-pointer transition-colors ${
        isSelected
          ? 'border-primary bg-primary/10'
          : 'border-outline/10 bg-surface-container hover:bg-surface-container-high'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-on-surface truncate">
            {getSchoolNameByLanguage(school, language)}
          </p>
          <p className="text-xs text-on-surface-variant truncate mt-0.5">
            {getSchoolSecondaryNameByLanguage(school, language)}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(schoolId);
          }}
          className="p-1 rounded-full hover:bg-surface-container-highest transition-colors flex-shrink-0"
          aria-label={isFavorited ? 'Unfavorite' : 'Favorite'}
        >
          <Star className={`w-4 h-4 ${isFavorited ? 'text-primary fill-primary' : 'text-on-surface-variant'}`} />
        </button>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${levelBadge.bg} ${levelBadge.text}`}>
          {levelBadge.label}
        </span>
        {distanceText && (
          <span className="text-[10px] text-on-surface-variant">
            {distanceText}
          </span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/SchoolCard.tsx
git commit -m "feat: add SchoolCard component for list panel"
```

---

## Task 10: Create ListPanel Component

**Files:**
- Create: `src/components/ListPanel.tsx`

**Interfaces:**
- Consumes: `filteredSchools` from store, `selectedSchool` + `setSelectedSchool` from store, `language` from store, `SchoolCard` from `src/components/SchoolCard.tsx`, `SkeletonListCard` from `src/components/Skeleton.tsx`
- Produces: `ListPanel` component with virtual scrolling

- [ ] **Step 1: Create ListPanel component**

```tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FixedSizeList as VirtualList } from 'react-window';
import { useStore } from '../store';
import SchoolCard from './SchoolCard';
import { SkeletonListCard } from './Skeleton';

const CARD_HEIGHT = 88;
const PANEL_WIDTH = 360;

export default function ListPanel() {
  const { filteredSchools, selectedSchool, setSelectedSchool, language } = useStore();
  const [isLoaded, setIsLoaded] = useState(false);
  const listRef = useRef<VirtualList>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(600);

  useEffect(() => {
    setIsLoaded(false);
    const timer = setTimeout(() => setIsLoaded(true), 200);
    return () => clearTimeout(timer);
  }, [filteredSchools]);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const selectedIndex = filteredSchools.findIndex(
    (s) => s['School No.'] === selectedSchool?.['School No.']
  );

  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      listRef.current.scrollToItem(selectedIndex, 'smart');
    }
  }, [selectedIndex]);

  const handleSchoolClick = useCallback((school: typeof filteredSchools[0]) => {
    setSelectedSchool(school);
  }, [setSelectedSchool]);

  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const school = filteredSchools[index];
    const isSelected = school['School No.'] === selectedSchool?.['School No.'];
    return (
      <SchoolCard
        school={school}
        isSelected={isSelected}
        onClick={() => handleSchoolClick(school)}
        style={{ ...style, paddingLeft: 12, paddingRight: 12, paddingBottom: 8 }}
      />
    );
  }, [filteredSchools, selectedSchool, handleSchoolClick]);

  const t = language === 'zh'
    ? { noResults: '沒有符合條件的學校', schools: '所學校' }
    : { noResults: 'No schools match your filters', schools: 'schools' };

  return (
    <div
      ref={containerRef}
      className="h-full bg-surface border-l border-outline/10 flex flex-col"
      style={{ width: PANEL_WIDTH }}
    >
      <div className="px-3 py-2 border-b border-outline/10 flex-shrink-0">
        <p className="text-xs text-on-surface-variant font-medium">
          {filteredSchools.length.toLocaleString()} {t.schools}
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        {!isLoaded ? (
          <div className="p-3 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonListCard key={i} />
            ))}
          </div>
        ) : filteredSchools.length === 0 ? (
          <div className="flex items-center justify-center h-full px-4">
            <p className="text-sm text-on-surface-variant text-center">{t.noResults}</p>
          </div>
        ) : (
          <VirtualList
            ref={listRef}
            height={containerHeight - 40}
            itemCount={filteredSchools.length}
            itemSize={CARD_HEIGHT}
            width="100%"
          >
            {Row}
          </VirtualList>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ListPanel.tsx
git commit -m "feat: add ListPanel with virtual scrolling"
```

---

## Task 11: Add List Toggle Button and Panel Layout to App

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `listPanelOpen` + `setListPanelOpen` from store, `ListPanel` from `src/components/ListPanel.tsx`
- Produces: Toggle button in nav, split-view layout with map + list panel

- [ ] **Step 1: Add imports**

In `src/App.tsx`, add:

```tsx
import { List } from 'lucide-react';
import ListPanel from './components/ListPanel';
```

- [ ] **Step 2: Add list toggle button to nav bar**

In the nav bar section, add a toggle button after the favorites button (inside the first `div` with `rounded-full bg-surface-container-high`). Add it as a new group:

After the favorites button group, add:

```tsx
<div className="rounded-full bg-surface-container-high p-1 sm:p-1.5">
  <button
    onClick={() => setListPanelOpen(!listPanelOpen)}
    className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold transition-colors ${listPanelOpen ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
    aria-label={language === 'zh' ? '列表模式' : 'List view'}
  >
    <List className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
  </button>
</div>
```

Also add `listPanelOpen` and `setListPanelOpen` to the destructured store values at the top of the component.

- [ ] **Step 3: Add ListPanel to map view layout**

Modify the map view section to include the list panel in a flex container:

```tsx
{activeView === 'map' ? (
  <>
    <SearchBar />
    <FilterBar />
    <ActiveFilters />
    <div className="flex w-full h-full">
      <div className="flex-1 relative">
        {deferMap ? (
          <Suspense fallback={<div className="p-4 text-on-surface-variant">{language === 'zh' ? '載入地圖...' : 'Loading map...'}</div>}>
            <Map />
          </Suspense>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-on-surface-variant">{language === 'zh' ? '載入地圖中...' : 'Preparing map...'}</div>
        )}
      </div>
      {listPanelOpen && <ListPanel />}
    </div>
    <BottomSheet />
  </>
) : /* ... existing favorites/stats views ... */
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add list panel toggle and split-view layout"
```

---

## Task 12: Add Mobile Drawer Support for List Panel

**Files:**
- Modify: `src/components/ListPanel.tsx`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: Framer Motion `motion` (already installed)
- Produces: Mobile-friendly drawer with drag gesture for list panel

- [ ] **Step 1: Add mobile drawer wrapper to ListPanel**

Update `ListPanel.tsx` to wrap the panel in a responsive container. For mobile (< 768px), render as a swipe-up drawer. For desktop, render as a side panel.

Replace the outer `<div>` of ListPanel with:

```tsx
import { motion } from 'motion/react';

// ... inside the component, replace the return statement:
return (
  <>
    {/* Desktop: side panel */}
    <div
      ref={containerRef}
      className="hidden md:flex h-full bg-surface border-l border-outline/10 flex-col"
      style={{ width: PANEL_WIDTH }}
    >
      {/* ... same content as before ... */}
    </div>

    {/* Mobile: drawer */}
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragEnd={(_, info) => {
        if (info.offset.y > 100) {
          useStore.getState().setListPanelOpen(false);
        }
      }}
      className="md:hidden fixed bottom-0 left-0 right-0 z-45 bg-surface rounded-t-2xl shadow-2xl"
      style={{ height: '60vh' }}
    >
      <div className="flex justify-center py-2">
        <div className="w-10 h-1 bg-outline-variant rounded-full" />
      </div>
      <div ref={containerRef} className="flex-1 overflow-hidden" style={{ height: 'calc(60vh - 32px)' }}>
        {/* ... same inner content (header + list) ... */}
      </div>
    </motion.div>
  </>
);
```

Note: The mobile drawer needs its own `containerRef` for height measurement. Extract the inner content (header + list) into a shared `ListContent` sub-component to avoid duplication.

- [ ] **Step 2: Add z-index utility to CSS**

Append to `src/index.css`:

```css
.z-45 {
  z-index: 45;
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/ListPanel.tsx src/index.css
git commit -m "feat: add mobile drawer support for list panel"
```

---

## Task 13: Run Full Verification

**Files:**
- None (verification only)

**Interfaces:**
- Consumes: All previous tasks
- Produces: Confirmation that all features work together

- [ ] **Step 1: Type check**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Run existing tests**

Run: `npm test`
Expected: All existing tests pass.

- [ ] **Step 4: Manual smoke test**

Run: `npm run dev`
Verify in browser:
1. Map loads with school markers
2. Clicking a marker shows bottom sheet with skeleton briefly, then content
3. flyTo transition is smooth when selecting a school
4. Filter chips appear below the filter bar when filters are active
5. Clicking a filter chip removes that filter
6. "Clear All" removes all filters
7. List toggle button appears in nav
8. Clicking it opens the side panel (desktop) or drawer (mobile)
9. List shows filtered schools with level badges and star buttons
10. Clicking a card selects the school on the map
11. Clicking a map marker scrolls the list to that card
12. Stats tab shows skeleton briefly then charts

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete UX polish and list mode implementation"
```
