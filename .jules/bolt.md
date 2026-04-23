## 2025-03-08 - ScannerCardStream continuous rendering
**Learning:** The `ScannerCardStream` component uses a `requestAnimationFrame` loop that continuously updates WebGL and Canvas 2D without checking if the component is actually visible in the viewport. This causes unnecessary CPU/GPU usage even when the component is off-screen.
**Action:** Use `IntersectionObserver` to track visibility and early-return from animation loops when components are not visible to save resources. Update timestamps appropriately when returning to view to prevent time-jumping glitches.
