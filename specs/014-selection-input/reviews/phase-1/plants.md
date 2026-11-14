# Phase 1 plants (T008a)

One named plant per driver command and recorder (tasks.md T008a; analysis U2), each applied alone to the green
implementation, run against the test files named, and reverted. Runs: `pnpm exec vitest run --project elements
packages/elements/test/driver-commands.test.ts packages/elements/test/driver-recorders.test.ts` (in-process plants),
`--project elements packages/elements/test/ax-states.test.ts packages/elements/test/commands.test.ts` (the command
plants) and `--project elements-browser packages/elements/test/browser/driver.test.ts` (the fixture plants), with
`OCELLE_CHROMIUM_PATH` set. Every plant made at least one test fail; the table names them.

**The red proof of T002 and T003.** The driver is test code: it lives under `packages/elements/test/`, which
`story-config.yml`'s `test_pathspec` counts as a test path. `tdd-check.sh`'s run of the phase's final test files against
the base therefore overlays the finished driver as well, and at the base the phase fails only through T004
(`commands.axStates` is registered in `vitest.config.ts`, not a test path) and T005 (the Vitest configuration). The red
proof of T002 and T003 is `red.sh 1` (T005a): at the red commit `3cf8b51` the drivers declared every new method and
rejected with "not implemented", and every new test failed (`red-phase.log`: 50 failing tests, 45 of them this phase's;
the other 5 are the pinned-container tests of `gates/test/integration/visual.test.ts`, which fail in this sandbox at the
base too). Of the 45, 40 failed on "not implemented" or on `commands.axStates` not being a command, 3 on the Vitest
configuration's assertions, and the two "write, read and readText" bodies on Chromium's `NotAllowedError` from the real
`navigator.clipboard.read()`: with no observer installed the call reached the clipboard, which is the missing behaviour
itself. The plants below are the proof that the tests bite on each command's behaviour.

| Plant | Where | Failing test |
|---|---|---|
| `press` dropping modifiers | `in-process.ts` `press` | driver-commands: press sends the key with its modifiers held … |
| `press` dropping modifiers (fixture) | `browser/driver.ts` `press` | browser/driver: press sends the key with its modifiers held … |
| `click` ignoring `button` | `in-process.ts` `click` | driver-commands: click presses the button it is given … |
| `click` ignoring `modifiers` | `in-process.ts` `click` | driver-commands: click presses the button it is given … |
| `click` ignoring `count` | `in-process.ts` `click` | driver-commands: click gives one trusted left click by default, and count 2 … |
| `click` ignoring `count` (fixture) | `browser/driver.ts` `click` | browser/driver: click gives one trusted left click by default … |
| child addressing off by one | `page-helpers.ts` `resolve` | driver-commands: a child target is the index-th child …; activeElement follows focus … |
| `activeElement` stopping at the first shadow host | `page-helpers.ts` `focused` | driver-commands: activeElement follows focus through nested shadow roots … |
| `mutate` running its steps in separate tasks | `in-process.ts` `mutate` | driver-commands: mutate applies every step in one task … |
| `mutate` running its steps in separate tasks (fixture) | `browser/driver.ts` `mutate` | browser/driver: mutate applies every step in one task … |
| `resize` that settles past the frame that renders it (a frame, then a task) | `in-process.ts` `resize` | driver-commands: resize sets the inline size at once and does not wait for a frame … |
| `afterResizeDelivery` resolving before the delivery | `in-process.ts` `afterResizeDelivery` | driver-commands: afterResizeDelivery resolves after …; resize sets the inline size at once … |
| `computedPart` reading the host | `in-process.ts` `computedPart` | driver-commands: computedPart reads a shadow part … |
| a constant page scroll offset | `in-process.ts` `scrollOffset` | driver-commands: scrollOffset is the page's scroll position … |
| a constant viewport size (`viewportSize` does nothing) | `in-process.ts` `viewportSize` | driver-commands: scrollOffset is the page's scroll position and viewportSize … |
| the keydown recorder in the capture phase | `page-helpers.ts` keydown listener | driver-recorders: keydownRecord gives each key and whether it was handled … |
| the clipboard observer not installed on fixture pages | `page-helpers.ts` (skipped on the fixture's `.html` pages) | browser/driver: clipboardCalls records navigator.clipboard.writeText …; … write, read and readText (in process all pass) |
| the clipboard observer not observing `writeText` | `page-helpers.ts` | driver-recorders: clipboardCalls records navigator.clipboard.writeText … |
| the clipboard observer not observing `write` | `page-helpers.ts` | driver-recorders: clipboardCalls records navigator.clipboard.write, read and readText |
| the clipboard observer not observing `execCommand('copy')` | `page-helpers.ts` | driver-recorders: clipboardCalls records document.execCommand copy, cut and paste … |
| `activationRecord` without the first frame | `page-helpers.ts` `activation` | driver-recorders: activationRecord orders a deferred request …; … puts a synchronous request … |
| `axUpdates` dropping updates (only the last kept) | `commands.ts` `recordAxUpdates` | driver-recorders: axUpdates records the region emptied in one frame and filled in the next … |
| `axStates` without `pressed` | `commands.ts` `withStates` | ax-states: gives pressed as true, false or mixed …; leaves axTree's nodes exactly { role, name } … |
| `axTree` with an extra field (`ignored`) | `commands.ts` `axNodes` | ax-states: leaves axTree's nodes exactly { role, name } …; the four `axTree(id)` tests of commands.test.ts |

**An equivalent variant, recorded.** A `resize` that awaits the driver's own `settle()` (every element's
`updateComplete`, then one `requestAnimationFrame` callback) passed all tests. It is equivalent with respect to what the
command promises: `requestAnimationFrame` callbacks run before the same frame's style, layout and `ResizeObserver`
steps, so such a resize still returns before any observer has seen the new size, and a scenario's
`afterResizeDelivery` (whose observer is registered after that callback) is delivered in the same frame. The plant that
does break the promise, waiting past the frame that renders the resize, is in the table.
