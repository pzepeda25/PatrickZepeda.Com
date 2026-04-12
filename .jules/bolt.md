## 2025-04-12 - App-level Scroll State Re-renders
**Learning:** The application tracks the active scroll section (`activeNavSection`) in the root `App.tsx` state. Because heavy, complex components like `MediumFeed` (Three.js canvas) and `YouTubeLatestVideos` (3D stack) are children of `App`, they re-render entirely every time the user crosses a scroll boundary, causing jank.
**Action:** Always memoize heavy section components (`React.memo`) when they are children of a component that manages frequent scroll/navigation state, or move the scroll-spy state down into a specialized Nav component.
