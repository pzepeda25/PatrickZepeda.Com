## 2026-07-06 - Root Scroll State Re-renders
**Learning:** The app tracks active scroll state at the root level, causing all child components to re-render on scroll if not memoized.
**Action:** Always memoize heavy child components in apps with root-level scroll tracking.
