## 2026-04-19 - Scroll State Triggering App-Wide Re-renders
**Learning:** `App.tsx` tracks active scroll state (`activeNavSection`) at the root level. This triggers re-renders of the entire app tree on scroll, which is disastrous for performance when child components contain expensive operations (like the Three.js scenes in `MediumFeed` -> `ScannerCardStream` or complex animations).
**Action:** Always wrap heavy child components with `React.memo()` (e.g., `export default React.memo(MyComponent)`) in this architecture to prevent unnecessary re-renders when parent scroll state updates.
