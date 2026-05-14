## 2024-05-24 - Root-level Scroll State Re-render Cascade
**Learning:** Tracking `activeNavSection` scroll state at the root `App.tsx` level without memoizing child components causes expensive components (like `FeaturedProject`, `MediumFeed`, `YouTubeLatestVideos`) to re-render constantly while scrolling.
**Action:** Always wrap heavy child components (especially those fetching data, rendering complex SVGs, or using Three.js) with `React.memo` if they sit under a component that tracks high-frequency state like scroll position.
