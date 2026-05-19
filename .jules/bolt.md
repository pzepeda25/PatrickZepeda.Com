## 2024-05-18 - Prevent Unnecessary Re-renders from Root State Updates
**Learning:** The root `App.tsx` component manages scroll spy state (`activeNavSection`) which updates frequently on scroll. This triggers re-renders for all child components, including heavy components like `ScannerCardStream` (Three.js).
**Action:** Always wrap heavy, pure child components in `React.memo()` if they are descendants of a component that frequently updates state based on scroll or other rapid events.
