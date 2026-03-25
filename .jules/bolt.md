
## 2025-05-15 - [Layout Thrashing Optimization in Canvas Animation Loop]
**Learning:** Found a severe layout thrashing bottleneck inside a `requestAnimationFrame` loop in `src/components/ui/scanner-card-stream.tsx`. The `updateCardEffects` function was looping through multiple elements, reading their positions via `getBoundingClientRect()`, and immediately applying a CSS style update using `style.setProperty()` within the same iteration. Because this ran 60 times a second, it forced the browser to recalculate layout repeatedly every frame, consuming excessive CPU.

**Action:** Optimized the bottleneck by separating DOM reads from DOM writes. I implemented a batched approach where I first map over all card elements to read and cache their dimensions, and then iterate through them again to apply the style updates. Always batch DOM read operations before write operations in animation loops to avoid layout thrashing.
