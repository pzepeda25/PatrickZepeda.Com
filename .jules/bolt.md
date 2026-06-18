## 2026-06-18 - App-wide Re-renders from Scroll State
**Learning:** The application tracks active scroll state (`activeNavSection`) at the root App level. This causes the entire application tree to re-render whenever the user scrolls into a new section. Components rendering heavy canvas/WebGL scenes (like Three.js in `MediumFeed`) stutter during scroll if they re-render needlessly.
**Action:** Always wrap heavy child components (especially those using Three.js or complex animations) with `React.memo()` if they do not depend on the parent's scroll state.
