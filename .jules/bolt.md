## 2024-11-20 - Memoizing heavy components to avoid scroll jank
**Learning:** The application tracks its active scroll state (`activeNavSection`) at the root `App.tsx` level, which triggers app-wide re-renders during scrolling. Heavy child components (e.g., those using Three.js like `MediumFeed`) cause significant scroll jank if they re-render on every scroll event.
**Action:** Always wrap heavy child components (especially those with canvas/WebGL or complex animations) with `React.memo` to prevent expensive re-renders when parent state updates.
