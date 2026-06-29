## 2026-06-29 - Memoize ScannerCardStream Component
**Learning:** The ScannerCardStream component does heavy processing using three.js. In a React application, a heavy component like this one when present in a scrollable or state-rich parent needs to be memoized. Otherwise, it will cause performance issues due to repeated full re-renders whenever the parent component updates its state (e.g. from active scroll section changes in App.tsx).
**Action:** Memoize ScannerCardStream with React.memo() to prevent unnecessary re-renders. Also import memo from 'react'.
