## 2024-05-24 - Initial Bundle Size Optimization
**Learning:** The initial bundle includes heavy dependencies like `three.js` (used in `MediumFeed` via `ScannerCardStream`) which block the main thread and delay the first contentful paint.
**Action:** Always lazy load below-the-fold components that bring in heavy 3D or animation libraries to reduce the initial JS payload.
