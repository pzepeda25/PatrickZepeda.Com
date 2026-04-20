## 2024-05-01 - Prevent expensive app-wide re-renders during scrolling
**Learning:** The application tracks active scroll state (`activeNavSection`) at the root `App.tsx` level, which causes the entire app tree to re-render on scroll.
**Action:** Always memoize heavy child components (especially those using Three.js like `ScannerCardStream` inside `MediumFeed`) using `React.memo` to prevent unnecessary re-renders when parent state changes.
