## 2024-04-24 - Prevent Expensive App-wide Re-renders During Scrolling

**Learning:** This codebase tracks its active scroll state (`activeNavSection`) at the root `App.tsx` level. This means that every time the user scrolls and the section changes, the entire app re-renders. This is particularly problematic for heavy child components, such as `MediumFeed` which uses Three.js. If these components are not memoized, they re-render on every scroll threshold, leading to jank and performance degradation.

**Action:** Always wrap heavy, pure child components (like visualizers, feeds, or anything with 3D/complex animations) in `React.memo` if they are mounted in a component that frequently re-renders due to scroll tracking or global state updates.
