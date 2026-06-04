## 2025-02-12 - Prevent Scroll-Spy Re-renders
**Learning:** `App.tsx` tracking active scroll section state (`activeNavSection`) can cause massive performance issues if heavy child components (like `ScannerCardStream` with Three.js) are not memoized, as they will re-render constantly on scroll.
**Action:** Always wrap heavy, state-independent child components with `React.memo()` when the parent component implements a scroll-spy or global event listener that updates state frequently.
