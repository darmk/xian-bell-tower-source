# Design QA

## 2026-09-07 viewing layout follow-up

- Replaced the duplicate Home/Architecture navigation with Overview/Focus modes. Focus hides introduction and inspector; Escape returns to overview.
- Header, model content and dock now occupy separate layout rows. At 1920 x 920 the canvas ends at y=812 and the dock starts at y=820, including after zooming. Expanding all 11 views scrolls within the dock instead of overlaying the canvas.
- Enlarged available canvas height and tightened overview framing from 88% to 94%. The reset overview screenshot shows a roughly 650px-tall model. Zoom remains a detail-view operation and may crop at the viewport edge; the new Fit action restores the full building without resetting lighting or component visibility.
- Desktop 1920 x 920 and mobile 390 x 844 checked with browser screenshots and DOM bounds; no horizontal document overflow. Focus, zoom, reset and all-view expansion checked.
- Evidence: `outputs/viewer-overview-v2.png`, `outputs/viewer-focus-v2.png`, `outputs/viewer-mobile-v2.png`.
- `npm test`: 7/7 pass, includes production build. Lint: 0 errors, 4 existing image-optimization warnings. Browser: 0 errors, one shader precision warning.

source visual truth: `C:/Users/Administrator/.codex/generated_images/01a0798a-49c6-75f0-a4b2-6555493661c6/exec-51948489-fa6c-4f87-97d0-0c9f85982ae7.png` (selected warm ivory 西安钟楼 concept)
implementation route: `http://localhost:3000/xianBellTower`
intended viewport: desktop 1440 x 1024; responsive fallback included for widths below 900px
state: initial full model view, day lighting, all roof and enclosure components visible

## Evidence

The source concept was opened and inspected before implementation. The existing browser-rendered implementation was captured before the redesign at the same local route. After implementation, build output, source asset responses, route response, and interaction wiring were checked locally.

Browser verification completed on 2026-09-07 after access became available. Actual rendered screenshots were inspected at the default desktop viewport, 1366 x 768, and 390 x 844. The screenshots were returned inline by the browser tool; a later attempt to save a standalone screenshot was interrupted when that browser connection became unavailable.

## Implemented checks

- Warm ivory exhibition layout with 西安钟楼 branding, serif display type, vermilion primary action, compact component drawer, and bottom camera filmstrip.
- The GLB uses its original materials. Removed the earlier stone overrides that assigned a material array to meshes without groups. Wall, platform, arch openings and railings were visually confirmed.
- Replaced the illuminated 500 x 500 ground material with a transparent shadow catcher and enabled canvas alpha. The paper background is now continuous in day and night modes, without a white ground rectangle.
- Overview framing fits actual model vertices to the viewport; reset uses the same framing. Desktop filmstrip and controls are compact; mobile controls collapse and expand in the document flow.
- Development, build and component-test Vite caches use separate directories, preventing tests from overwriting live optimized React dependencies.
- Existing camera presets, roof and door visibility, dimensions, layer explode, night lighting, auto rotation, reset, and fallback rendered views remain wired.
- `npm run build` passes.
- `npm test` passes all 7 tests, including a full production build.
- `npm run lint` passes with four existing Next.js `<img>` optimization warnings and no errors.

## Final result

final result: functional and visual checks passed for the reported white-ground and missing-platform issues.

Verified live: full model rendering, roof visibility, day/night colors, reset, rotation button/switch synchronization, desktop and mobile layout, and page reload after running the test suite. Browser error-level console log was empty during the final checks. Four existing image-optimization lint warnings remain. Historical shader precision warnings are distinct from runtime errors; the deprecated shadow-map type was replaced. Standalone screenshot export and temporary viewport cleanup were interrupted by browser disconnection at the end.
