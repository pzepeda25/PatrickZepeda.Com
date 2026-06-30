## 2026-06-30 - Prevent scroll-based re-renders
**Learning:** The application tracks active scroll state at the root level which causes heavy child components (like those using Three.js) to re-render during scrolling.
**Action:** Use memo() to memoize heavy components to prevent unnecessary re-renders when scroll state changes.
