## 2024-03-08 - App-wide Re-renders on Scroll State Changes
**Learning:** `App.tsx` manages scroll state (`activeNavSection`) and causes full tree re-renders when crossing section boundaries. This causes expensive child components (especially those using `Three.js` or heavy DOM like `MediumFeed`) to re-render, creating noticeable jank during scrolling.
**Action:** Always wrap heavy child components in `React.memo()` when the parent manages scroll or frequent event state, to ensure state changes skip unnecessary deep re-renders.
