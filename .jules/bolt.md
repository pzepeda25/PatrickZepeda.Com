
## 2026-03-27 - [Lazy Loading Large Dependencies & Routes]
**Learning:** The application bundles an entire 3D library (`three.js`) and admin route logic into the main chunk, which bloats the initial load size (~887kB minified/gzipped).
**Action:** Always verify if heavy libraries (like `three`) are needed on the initial render. If they are part of below-the-fold components (`MediumFeed`) or separate routes (`Admin`), dynamically import them using `React.lazy()` to shrink the main bundle.
