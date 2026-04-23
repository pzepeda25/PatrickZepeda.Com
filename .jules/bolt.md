## 2026-04-14 - React.memo for Scroll State Immunity
**Learning:** In a single-page portfolio app tracking global scroll state (`activeNavSection` in `App.tsx`), heavy animated components (`Three.js` canvas in `ScannerCardStream`, complex motion animations) will re-render continuously during scrolling if not properly memoized.
**Action:** Always wrap heavy, pure visual/data-fetching components (`MediumFeed`, `FeaturedProject`, `YouTubeLatestVideos`) in `React.memo` when they are direct children of a component that updates its state frequently on scroll events.
