## 2024-05-07 - React.memo for Three.js Components
**Learning:** Found that the app uses an overarching scroll observer `activeNavSection` which triggers root re-renders. Heavy child components like Three.js canvases re-render completely unless wrapped in `React.memo`.
**Action:** Always verify if high-cost canvas or 3D components are memoized if their props do not frequently change, especially in an app with top-level context or state changes like scroll spy.
