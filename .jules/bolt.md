## 2024-05-11 - Prevent Scroll-Triggered App-Wide Re-renders
**Learning:** The application tracks active scroll state (`activeNavSection`) at the root `App.tsx` level. This means every time the user scrolls and the active section changes, the entire app re-renders. This is particularly problematic for heavy child components, such as `ScannerCardStream` which uses Three.js.
**Action:** Always wrap heavy child components with `React.memo()` in this architecture to prevent expensive unnecessary re-renders when root scroll state updates.
