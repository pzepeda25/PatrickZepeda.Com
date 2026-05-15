## 2024-05-18 - App-Wide Scroll Re-Renders
**Learning:** The application tracks active scroll state (`activeNavSection`) at the root `App.tsx` level using a `scroll` event listener. This causes the entire `App` component, including heavy child components (like `FeaturedProject`, `MediumFeed` containing Three.js, and `YouTubeLatestVideos`), to re-render constantly during scrolling.
**Action:** Heavy child components in this codebase must always be wrapped in `React.memo` to prevent expensive app-wide re-renders during scroll.
