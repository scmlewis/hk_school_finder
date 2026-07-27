# Design Spec: Three New Features for HK School Finder

Date: 2026-07-27
Status: Approved

---

## Overview

Three new features to enhance the HK School Finder app:

1. **School Comparison Tool** — 4th tab, side-by-side comparison of 2 schools
2. **Saved Filter Presets** — Save and load filter combinations by name
3. **Save Home Address** — Persist home location to auto-fill Google Maps directions

---

## Feature 1: School Comparison Tool

### Purpose

Let parents compare 2 shortlisted schools side-by-side without mentally juggling between detail cards.

### Store Changes (`store.ts`, `types.ts`)

Add to `AppState`:

```ts
comparisonList: string[];  // school IDs, max 2
addToComparison: (schoolId: string | undefined) => void;
removeFromComparison: (schoolId: string) => void;
clearComparison: () => void;
```

Behavior:
- `addToComparison` — pushes ID if not already present and list < 2. No-op if list is full.
- `removeFromComparison` — filters out the ID.
- `clearComparison` — empties the list.
- Persist `comparisonList` via `partialize` in Zustand.

### Component: `CompareView.tsx` (new)

Lazy-loaded, same pattern as `StatsTab` and `FavoritesView`.

**States:**
1. **Empty** — "Add schools from the map to compare them" prompt with back-to-map button.
2. **One school** — Shows that school's info card + "Add another school" prompt.
3. **Two schools** — Side-by-side comparison table.

**Comparison Table Layout:**

Mobile (< 768px): Two columns, stacked info cards.

```
┌─────────────┬─────────────┐
│  School A    │  School B    │
├─────────────┼─────────────┤
│  Level       │  Level       │
│  Gender      │  Gender      │
│  District    │  District    │
│  Religion    │  Religion    │
│  Session     │  Session     │
│  School Type │  School Type │
└─────────────┴─────────────┘
```

Each column header shows: level badge, school name, secondary name, with a remove (X) button.

**Fields displayed (all bilingual via existing utils):**

| Row | Getter |
|-----|--------|
| Level | `getSchoolLevelByLanguage()` + `getLevelBadgeColor()` |
| Gender | `getLocalizedGenderLabel()` |
| District | `getLocalizedDistrictLabel()` |
| Religion | `getLocalizedReligionLabel()` |
| Session | `getSchoolSessionByLanguage()` + `getLocalizedSessionLabel()` |
| School Type | `school["School Type"]` raw value |

**Bottom of comparison:**
- "Directions" button for each school (Google Maps link)
- "Clear Comparison" button

### BottomSheet Changes (`BottomSheet.tsx`)

Add a "Compare" button in the 4-button action grid (row with Directions, Website, Call, Favorite).

- Icon: `GitCompare` from lucide-react
- Behavior: toggles school in/out of `comparisonList`
- Visual: highlighted (primary color) when school is in comparison list
- Label: localized "Compare" / "比較"

The grid becomes 5 buttons. Use `grid-cols-5` on desktop, `grid-cols-5` on mobile with smaller icon/text sizes to fit. If too tight, fall back to a 2-row layout: top row (Directions, Website, Call), bottom row (Compare, Favorite, Share).

### Navigation Changes (`App.tsx`)

Add 4th tab "Compare" (比較) in the top nav bar, between Stats and Favorites.

- Badge shows `comparisonList.length` when > 0
- Lazy-load `CompareView`

### Localization

Add to translation objects:

| Key | EN | ZH |
|-----|----|----|
| compareTab | Compare | 比較 |
| compareTitle | Compare Schools | 學校比較 |
| compareEmpty | Add schools from the map to compare them | 從地圖新增學校以進行比較 |
| compareAddAnother | Add another school | 新增另一所學校 |
| compareHint | Tap Compare on any school detail card | 在學校詳情卡點擊比較 |
| compareClear | Clear Comparison | 清除比較 |
| compareRemove | Remove | 移除 |
| backToMap | Back to Map | 返回地圖 |

---

## Feature 2: Saved Filter Presets

### Purpose

Let users save a filter combination (e.g., "Primary + Co-ed + Sha Tin") with a custom name and reload it later.

### Store Changes (`store.ts`, `types.ts`)

Add to `AppState`:

```ts
filterPresets: Array<{ id: string; name: string; filters: FilterState }>;
saveFilterPreset: (name: string) => void;
loadFilterPreset: (id: string) => void;
deleteFilterPreset: (id: string) => void;
```

Where `FilterState` captures the current filter snapshot:

```ts
interface FilterState {
  levelFilter: string[];
  genderFilter: string[];
  financingTypeFilter: string[];
  religionFilter: string[];
  districtFilter: string | null;
  distanceFilter: number | null;
}
```

Behavior:
- `saveFilterPreset(name)` — reads current filter values from state, generates a UUID (`crypto.randomUUID()`), pushes `{ id, name, filters }` to `filterPresets`.
- `loadFilterPreset(id)` — finds preset by ID, calls each setter (`setLevelFilter`, `setGenderFilter`, etc.) with saved values.
- `deleteFilterPreset(id)` — filters out by ID.
- Max 10 presets. If user tries to save an 11th, oldest is dropped.
- Persist `filterPresets` via `partialize` in Zustand.

### FilterBar Changes (`FilterBar.tsx`)

**UI Addition (at top of filter panel, below "Clear Filters" button):**

1. **"Save Preset" row**: Button with `BookmarkPlus` icon. Toggles an inline input field + confirm (check) + cancel (X) buttons. No modal.
2. **Presets list**: Horizontal scrollable row of chips below the save button. Each chip shows the preset name. Tap to load. Small X on each chip to delete.

**Visual:**
```
[Clear Filters]                    [Save Preset]
[✓] Primary Schools  [×]           ← saved presets row
```

### Localization

| Key | EN | ZH |
|-----|----|----|
| savePreset | Save Preset | 儲存篩選 |
| presetName | Preset name | 篩選名稱 |
| loadPreset | Load | 載入 |
| deletePreset | Delete | 刪除 |
| maxPresets | Maximum 10 presets | 最多10個篩選 |
| noPresets | No saved presets | 尚未儲存篩選 |

---

## Feature 3: Save Home Address

### Purpose

Save a home address/coordinates so the Google Maps directions link auto-fills the origin, saving parents from re-typing their address every time.

### Store Changes (`store.ts`, `types.ts`)

Add to `AppState`:

```ts
homeAddress: { lat: number; lng: number } | null;
setHomeAddress: (location: { lat: number; lng: number } | null) => void;
```

Persist `homeAddress` via `partialize` in Zustand.

### FilterBar Changes (`FilterBar.tsx`)

**Add below the "Locate Me" button:**

1. **"Set Home" button** — `Home` icon from lucide-react
2. When tapped, shows two options inline:
   - "Use current location" — uses browser Geolocation (same logic as Locate Me)
   - "Enter address" — text input + "Find" button
3. **Geocoding**: Nominatim API (`https://nominatim.openstreetmap.org/search?q={address}&format=json&limit=1&countrycodes=hk`)
   - Free, no API key required
   - Must include `User-Agent` header (e.g., `HKSchoolFinder/1.0`) per Nominatim usage policy
   - Extract `lat`, `lon` from first result
   - Show error if no results found
4. **When home is set**: Show a small indicator "Home set" with a "Clear" button, below the Locate Me button

### Directions Link Updates

**BottomSheet.tsx** — line 188:

Current:
```
https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}
```

Updated:
```
https://www.google.com/maps/dir/?api=1&origin=${homeLat},${homeLng}&destination=${lat},${lng}
```

When `homeAddress` is null, omit the `origin` parameter (falls back to Google Maps default behavior).

**FavoritesView.tsx** — line 125: Same change.

### Localization

| Key | EN | ZH |
|-----|----|----|
| setHome | Set Home | 設置地址 |
| useCurrentLocation | Use current location | 使用目前位置 |
| enterAddress | Enter address | 輸入地址 |
| findAddress | Find | 搜尋 |
| homeSet | Home set | 地址已設定 |
| clearHome | Clear | 清除 |
| geocodingError | Address not found | 找不到地址 |
| geocodingLoading | Searching... | 搜尋中... |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/types.ts` | Add `comparisonList`, `filterPresets`, `homeAddress` to `AppState`; add `FilterState` interface |
| `src/store.ts` | Add actions and persistence for all 3 features |
| `src/components/BottomSheet.tsx` | Add Compare button in action grid |
| `src/components/FilterBar.tsx` | Add preset save/load UI + home address UI |
| `src/components/FavoritesView.tsx` | Update directions link to include home origin |
| `src/components/CompareView.tsx` | New file — comparison tab |
| `src/App.tsx` | Add 4th tab, lazy-load CompareView |

## Testing

- Unit tests for store actions (comparison toggle, preset CRUD, home address set/clear)
- Verify localStorage persistence survives page reload
- Verify comparison tab renders correctly with 0, 1, and 2 schools
- Verify preset save/load applies correct filter state
- Verify directions links include origin when home is set
- Verify Nominatim geocoding works with sample HK addresses
