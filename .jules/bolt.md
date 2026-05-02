## 2025-05-02 - Prevent App-Wide Re-renders from Scroll Spy
**Learning:** The root `App.tsx` uses a scroll spy to update the `activeNavSection` state on window scroll. This architecture causes the entire app, including heavy child components (like `MediumFeed` which uses Three.js), to re-render constantly during scrolling.
**Action:** When working in this codebase, ensure that heavy child components are wrapped in `React.memo()` so they do not unnecessarily re-render on every scroll event when their props haven't changed.
