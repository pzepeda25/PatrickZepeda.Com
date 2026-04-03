## 2026-04-03 - Prevent 60fps re-renders by not updating state in requestAnimationFrame
**Learning:** In the `ScannerCardStream` component, calling `setSpeed` inside the `requestAnimationFrame` loop caused the component to unnecessarily re-render 60 times a second, even though the `speed` state wasn't used for rendering.
**Action:** When creating DOM-driven animations, verify that `setState` calls are not accidentally left inside animation loops unless they are explicitly required for the React render cycle.
