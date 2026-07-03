## 2024-03-05 - App-wide Scroll State Re-renders
**Learning:** Root components that track scroll intersection state (like `App.tsx` with `activeSection`) cause the entire tree to re-render on scroll. This is especially problematic with heavy child components like WebGL/Three.js or complex animations, leading to severe scroll jank.
**Action:** Always wrap static or purely prop-driven sections in `memo()` when the root component tracks active scroll state, and memoize callback props (like `onContact`) with `useCallback` to maintain referential equality.
