## 2025-05-29 - Memoize Heavy App.tsx Components
**Learning:** The root `App.tsx` has state changes that occur frequently due to scroll tracking (`activeNavSection`). These state changes cause re-renders down the tree, which can be extremely expensive, especially for heavy components like those using `Three.js` directly or via nested children (like `MediumFeed` using `ScannerCardStream`).
**Action:** When a top-level component maintains scroll/event state that changes frequently, ensure expensive child components are wrapped in `React.memo` so they aren't re-rendered unnecessarily on scroll.
