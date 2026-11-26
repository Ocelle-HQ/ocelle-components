# Phase 2 recipe negative controls

Tested the recipe at `01462a841ed6502381a041d8479aab5dc43fa621`. Both temporary builds retained all four story IDs.

- Navigation control. The real primary event still fired, but its handler left the same screen selected. The light Storybook case failed the assertion that one heading titled Confirm appears after Enter. It observed zero.
- Responsive control. The active footer was set to 72 px with hidden overflow while the test doubled the real step and button text at a fixed 1440 px viewport. The test failed the assertion that the footer grows to accommodate wrapped actions. It observed 72 px before and after the change.

Both temporary source changes were restored. The two normal focused suites then passed all 11 tests.
