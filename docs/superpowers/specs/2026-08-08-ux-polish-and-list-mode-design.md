# Design Spec: UX Polish & List Mode

**Date:** 2026-08-08
**Status:** Approved
**Scope:** C1 (Map Transitions), C2 (Skeleton Loading), C4 (Filter UX), C5 (List Mode)

---

## 1. Animated Map Transitions (C1)

### Goal
Smooth, intentional camera movements when interacting with the map.

### Behavior
- **School selection:** `flyTo` with 1.2s duration, ease-out curve, zoom level 16. Centers the school marker with padding for the bottom sheet.
- **Search result navigation:** `flyTo` to the selected school coordinates with the same easing profile.
- **School net click:** `easeTo` with 0.8s duration, zoom to fit the net polygon bounds using `map.fitBounds` with padding.
- **Marker selection:** CSS scale transform (1.0 to 1.2 to 1.0) on the selected marker element, 200ms.

### Implementation
- Use MapLibre GL `flyTo` and `easeTo` methods in `Map.tsx`.
- Extract a shared `flyToSchool(school: School)` utility function.
- Add a `selectedMarkerScale` CSS class with `@keyframes` for the pulse animation.

---

## 2. Skeleton Loading States (C2)

### Goal
Replace the full-screen Loading overlay with per-section shimmer placeholders so users see content progressively.

### Behavior
- **Initial app load:** Keep the existing full-screen Loading component (data must load first).
- **Bottom sheet (school details):** Show 3-4 shimmer rows (name, address, MTR info, actions) while details render.
- **Stats tab:** Show 5 shimmer bars per chart while data aggregates.
- **List panel:** Show 6-8 shimmer cards while the filtered list populates.

### Implementation
- Create a generic `Skeleton` component with configurable width/height and shimmer animation (CSS `@keyframes` with linear-gradient sweep).
- Create `SkeletonBottomSheet`, `SkeletonStats`, `SkeletonListCard` composite components.
- Use React `Suspense` or conditional rendering to show skeletons during data loading.
- Add shimmer animation to `index.css`.

---

## 3. Filter UX Improvements (C4)

### Goal
Make active filters more visible, easier to manage, and visually polished.

### Behavior
- **Collapsible chips:** Each active filter renders as a chip below the filter bar. Chips show the filter type and count (e.g., "Level: 2", "District: 3"). Clicking a chip expands it to show selected values.
- **Swipe-to-dismiss (mobile):** Horizontal swipe on a filter chip removes that filter. Animated slide-out with opacity fade.
- **Clear All:** A "Clear All" button appears when 1 or more filters are active. Clicking it removes all filters with a staggered chip-collapse animation.
- **Sticky summary bar:** When filters are active, a thin bar appears below the nav showing "X filters active" with a count badge. Tapping it opens/collapses the full filter panel.

### Implementation
- Add an `ActiveFilters` component rendered below `FilterBar`.
- Use Framer Motion `AnimatePresence` and `motion.div` for chip enter/exit animations.
- Add `onSwipe` handler using touch event tracking or a lightweight gesture library.
- Store active filter count in Zustand for the summary bar.

---

## 4. List Mode - Split View Panel (C5)

### Goal
A Google Maps-style side panel showing filtered schools as interactive cards alongside the map.

### Layout

**Desktop (768px and above):**
- Panel on the right side, 360px wide, full height below the nav bar.
- Map fills the remaining width.
- Panel has a subtle left border shadow.
- Toggle button (list icon) in the top nav shows/hides the panel. Map resizes smoothly.

**Mobile (below 768px):**
- Swipe-up drawer from the bottom, covering 60% of the screen by default, expandable to full screen.
- Drag handle at the top of the drawer.
- Map remains visible behind the semi-transparent drawer at 60% height.

### School Card Design
Each card in the list shows:
- **School name** (English and Chinese, bilingual)
- **Level badge** (color-coded: pink for kindergarten, blue for primary, teal for secondary)
- **Gender** icon or text
- **Distance from home** (if home address is set, shows km and walking time)
- **Star button** (favorite toggle, synced with existing favorites system)
- **School net** label

### Interactions
- **Card click:** Selects the school, triggers `flyTo` on the map, opens the bottom sheet.
- **Map marker click:** Scrolls the list to the corresponding card and highlights it.
- **Scroll sync:** Scrolling the list updates a subtle highlight on the corresponding map marker. Clicking a marker scrolls the list to that card.
- **Filter sync:** List updates in real-time as filters change. Empty state shows "No schools match your filters".

### Toggle Button
- Located in the top navigation bar, to the right of the Stats/Favorites toggle.
- Icon: `List` from Lucide React.
- Active state: highlighted background.
- Clicking toggles the panel visibility. Map container width animates to accommodate.

### Implementation
- Create `ListPanel.tsx` component with virtual scrolling (react-window or similar) for performance with 1000+ schools.
- Create `SchoolCard.tsx` for individual card rendering.
- Add panel visibility state to Zustand store (persisted).
- Use CSS transitions on the map container width for smooth resize.
- On mobile, use Framer Motion for the drawer slide-up with drag gesture support.
- Wire up scroll-to and highlight-to-marker bidirectional sync via Zustand (selected school ID).

---

## Data Requirements

No new external data sources required. All features work with the existing EDB school dataset and current Zustand store state.

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/components/Skeleton.tsx` | Create | Generic skeleton + composite variants |
| `src/components/ActiveFilters.tsx` | Create | Filter chip bar with animations |
| `src/components/ListPanel.tsx` | Create | Split-view list panel |
| `src/components/SchoolCard.tsx` | Create | Individual school card |
| `src/components/Map.tsx` | Modify | Add flyTo transitions, marker animation, list sync |
| `src/components/BottomSheet.tsx` | Modify | Add skeleton loading state |
| `src/components/StatsTab.tsx` | Modify | Add skeleton loading state |
| `src/components/FilterBar.tsx` | Modify | Integrate ActiveFilters below |
| `src/App.tsx` | Modify | Add list panel layout, toggle button |
| `src/index.css` | Modify | Add shimmer animation, skeleton styles |
| `src/store.ts` | Modify | Add listPanelOpen state |

---

## Success Criteria

1. Map transitions feel smooth and intentional (no jank, consistent easing).
2. Skeleton states appear within 100ms of a loading trigger and disappear seamlessly when content renders.
3. Active filter chips are immediately visible and easy to dismiss.
4. List panel renders 1000+ schools without frame drops (virtual scrolling).
5. Bidirectional sync (list scroll to map marker, marker click to list scroll) works reliably.
6. All features work on both desktop and mobile viewports.
7. Existing tests continue to pass. New components have unit tests.
