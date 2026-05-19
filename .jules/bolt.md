## 2024-04-16 - Memoize Heavy Components During Scroll
**Learning:** In a React application tracking active scroll state at the root level (e.g. `App.tsx`), frequent state updates cause expensive app-wide re-renders. This is particularly problematic for heavy child components, such as those using Three.js or complex animations.
**Action:** Always wrap heavy child components with `React.memo()` when the parent component has frequent state updates (like scroll tracking) to prevent unnecessary re-renders and preserve performance.
