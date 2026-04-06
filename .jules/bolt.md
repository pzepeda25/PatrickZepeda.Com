## 2025-04-06 - Replacing Canvas2D ctx.arc() with ctx.fillRect() for Micro-particles
**Learning:** In high-frequency 2D Canvas rendering loops (e.g. `requestAnimationFrame` drawing 2500+ micro-particles), using `ctx.beginPath(); ctx.arc(); ctx.fill();` is incredibly expensive because it forces the browser to generate complex vector paths. When particles have a radius < 1.5px, they render as sub-pixel squares anyway.
**Action:** Always replace `ctx.arc()` with `ctx.fillRect(x - r, y - r, r * 2, r * 2)` for high-density particle systems where particles are visually indistinguishable from squares, gaining up to a 5x boost in rendering performance.

## 2025-04-06 - Double loop string concatenation optimization
**Learning:** The `generateCode` function used a loop to create a long string, and then a second loop with `substring` to break it up. String concatenation in a loop is slow, and double looping is redundant.
**Action:** Optimize string generation by creating the lines directly in a single loop, or using Array and `join()`, reducing memory allocation overhead.
