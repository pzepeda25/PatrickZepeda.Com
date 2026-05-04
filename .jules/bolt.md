## 2024-05-04 - Prevent heavy app-wide re-renders during scrolling
**Learning:** The application tracks active scroll state (`activeNavSection`) at the root `App.tsx` level, causing the entire app to re-render constantly during scrolling. Because child components contain expensive 3D / animation logic (like Three.js), this results in significant scroll jank.
**Action:** Wrap heavy child components (e.g., `FeaturedProject`, `YouTubeLatestVideos`, `MediumFeed`) in `React.memo()` to prevent them from participating in `App`'s scroll-triggered re-renders.
