## 2026-04-21 - React Component Memoization
**Learning:** The application tracks its active scroll state (`activeNavSection`) at the root `App.tsx` level. This means `App.tsx` re-renders frequently during scroll. Heavy child components (e.g., `FeaturedProject`, `YouTubeLatestVideos`, `MediumFeed` which uses Three.js) must be memoized using `React.memo` to prevent expensive app-wide re-renders during scrolling.
**Action:** Wrap heavy child components with `React.memo` if they are rendered in a component that frequently updates its state based on scrolling or other frequent events.
