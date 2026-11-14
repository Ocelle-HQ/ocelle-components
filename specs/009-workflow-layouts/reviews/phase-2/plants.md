# Phase 2 plants (T030; R-17)

Each plant was applied to the working tree on top of the green implementation (`077efe2`), its tests
run, and every file it touched restored byte for byte (compared with the bytes read before the change) before the next
plant. Nothing planted was committed. S4, S5 and S9 change the ring rule, which `46c5742` gave a `display: block`
(the overlay is laid out only while it shows a ring, for axe); they were run again on `46c5742` with that rule, with
the same results as on `077efe2`. The runner applied each plant as an exact text replacement and ran the named
Vitest project and file with `OCELLE_CHROMIUM_PATH` set; the output is summarised below (Vitest truncates long test
names).

| # | Test | Plant | Result |
|---|---|---|---|
| G1 | T011 rows `radial-gradient()`, `repeating-linear-gradient()`, `conic-gradient()` (raw whole) in `gates/test/token-only.test.ts` | `gates/stylelint/token-only.ts`: every function whose name ends in `gradient` classified as `linear-gradient()` is | `gates gates/test/token-only.test.ts`: 3 failed, 279 passed (282); fails: mask-image: radial-gradient(transparent, var(--ocel… is raw: [ …(1) ]; mask-image: repeating-linear-gradient(transparent, … is raw: [ …(1) ]; mask-image: conic-gradient(transparent, var(--ocell… is raw: [ …(1) ] |
| D1 | T010 `messages()` in both driver tests | `messages()` returns `[]` in both drivers | `elements packages/elements/test/driver.test.ts -t messages`: 1 failed, 23 skipped (24); fails: messages() lists the console messages since the last mount, and a mount starts a new list<br>`elements-browser packages/elements/test/browser/driver.test.ts -t messages`: 1 failed, 23 skipped (24); fails: messages() lists the console messages since the last mount, and a mount starts a new list |
| D2 | T010 `sheets(selector)` in both driver tests | `perRoot` reports the number of roots instead of the sheets per root, in both drivers | `elements packages/elements/test/driver.test.ts -t sheets`: 1 failed, 23 skipped (24); fails: sheets(selector) counts the adopted sheets per shadow root, the distinct sheets and the <style> elements<br>`elements-browser packages/elements/test/browser/driver.test.ts -t sheets`: 1 failed, 23 skipped (24); fails: sheets(selector) counts the adopted sheets per shadow root, the distinct sheets and the <style> elements |
| D3 | T010 `settle()` in both driver tests | `settle()` waits one animation frame instead of two, in both drivers | `elements packages/elements/test/driver.test.ts -t settle`: 1 failed, 23 skipped (24); fails: settle() waits at least two animation frames, then for every ocelle-* element to render<br>`elements-browser packages/elements/test/browser/driver.test.ts -t settle`: 1 failed, 23 skipped (24); fails: settle() waits at least two animation frames, then for every ocelle-* element to render |
| S1 | US1-1 (T013), in process and on the test host (T015) | `#apply`: the tab stop and the role set whatever the overflow | `elements packages/elements/test/scroller.test.ts`: 3 failed, 19 passed (22); fails: US1-1 (ocelle-scroller): a fitting stri…; US1-3 (ocelle-scroller): the tab stop a…; US1-4 (ocelle-scroller): when overflow …<br>`elements packages/elements/test/overflow-host.test.ts`: 3 failed, 1 passed (4); fails: US1-1 (ocelle-test-overflow-host): a fi…; US1-3 (ocelle-test-overflow-host): the …; US1-4 (ocelle-test-overflow-host): when… |
| S2 | US1-3 (T013), in process and on the test host (T015) | the module's state write moved into a `requestAnimationFrame` inside its `ResizeObserver` callback | `elements packages/elements/test/scroller.test.ts`: 2 failed, 20 passed (22); fails: US1-3 (ocelle-scroller): the tab stop a…; US1-4 (ocelle-scroller): when overflow …<br>`elements packages/elements/test/overflow-host.test.ts`: 2 failed, 2 passed (4); fails: US1-3 (ocelle-test-overflow-host): the …; US1-4 (ocelle-test-overflow-host): when… |
| S3 | US1-4 (T013), in process and on the test host (T015) | the light-DOM-only walk: `firstFocusable` never searches a shadow root | `elements packages/elements/test/scroller.test.ts`: 1 failed, 21 passed (22); fails: US1-4 (ocelle-scroller): when overflow …<br>`elements packages/elements/test/overflow-host.test.ts`: 1 failed, 3 passed (4); fails: US1-4 (ocelle-test-overflow-host): when… |
| S4 | US1-4 (T013), in process and on the test host (T015) | the frame's ring rule removed (`.region-frame:focus-visible > .region-ring`) | `elements packages/elements/test/scroller.test.ts`: 1 failed, 21 passed (22); fails: US1-4 (ocelle-scroller): when overflow …<br>`elements packages/elements/test/overflow-host.test.ts`: 1 failed, 3 passed (4); fails: US1-4 (ocelle-test-overflow-host): when… |
| S5 | US1-4 (T013), in process and on the test host (T015) | the ring as an outline of the frame (`.region-frame:focus-visible { outline … }`), the ring overlay not used for the frame | `elements packages/elements/test/scroller.test.ts`: 1 failed, 21 passed (22); fails: US1-4 (ocelle-scroller): when overflow …<br>`elements packages/elements/test/overflow-host.test.ts`: 1 failed, 3 passed (4); fails: US1-4 (ocelle-test-overflow-host): when… |
| S6 | US1-5 (T013) | no modifier check on the arrow keys | `elements packages/elements/test/scroller.test.ts`: 1 failed, 21 passed (22); fails: US1-5: with the box focused, the arrow … |
| S7 | US1-6 (T013) | both fades always (`fadeStart` and `fadeEnd` = `overflowing`) | `elements packages/elements/test/scroller.test.ts`: 9 failed, 13 passed (22); fails: US1-6 and US1-7 on color-canvas in ligh…; US1-6 and US1-7 on color-canvas in dark…; US1-6 and US1-7 on color-pane in light:…; US1-6 and US1-7 on color-pane in dark: …; US1-8: in forced colours each edge with…; US1-11: the box-focused key and the fad…; US1-13: tabbing through twelve links an…; US1-13: a focused button wider than the…; US1-13: a button clicked half under the… |
| S8 | US1-6 (T013) | the `:host(:dir(rtl))` mirror selectors removed | `elements packages/elements/test/scroller.test.ts`: 4 failed, 18 passed (22); fails: US1-6 and US1-7 on color-canvas in ligh…; US1-6 and US1-7 on color-canvas in dark…; US1-6 and US1-7 on color-pane in light:…; US1-6 and US1-7 on color-pane in dark: … |
| S9 | US1-7 (T013) | the ring overlay inside the masked box: the box's own `:focus-visible` outline instead of the overlay | `elements packages/elements/test/scroller.test.ts`: 5 failed, 17 passed (22); fails: US1-6 and US1-7 on color-canvas in ligh…; US1-6 and US1-7 on color-canvas in dark…; US1-6 and US1-7 on color-pane in light:…; US1-6 and US1-7 on color-pane in dark: …; US1-9: the focused box shows the token … |
| S10 | US1-6 (T013) | `data-fade=""` bound without `ifDefined`, with the mask selected on attribute presence (`[data-fade]`, `[data-fade=""]`) | `elements packages/elements/test/scroller.test.ts`: 4 failed, 18 passed (22); fails: US1-6 and US1-7 on color-canvas in ligh…; US1-6 and US1-7 on color-canvas in dark…; US1-6 and US1-7 on color-pane in light:…; US1-6 and US1-7 on color-pane in dark: … |
| S11 | US1-8 (T013) | both forced-colours lines always (`.region-box ~ .region-edge.start`, `.end`) | `elements packages/elements/test/scroller.test.ts`: 2 failed, 20 passed (22); fails: US1-8: in forced colours each edge with…; US1-13: a focused button wider than the… |
| S12 | US1-10 (T013) | `preventDefault` and the scroll on every arrow key, whatever its composed target | `elements packages/elements/test/scroller.test.ts`: 1 failed, 21 passed (22); fails: US1-10: an arrow key on a focused link … |
| S13 | US1-13 (T013) | no ring room: the box's block padding and the track's inline padding 0 | `elements packages/elements/test/scroller.test.ts`: 6 failed, 16 passed (22); fails: US1-5: with the box focused, the arrow …; US1-13: the box scrolls in the inline d…; US1-13: tabbing through twelve links an…; US1-13: a focused button wider than the…; US1-13: a button clicked half under the…; US1-13 at a 20 px root font size: the c… |
| S14 | US1-13 (T013) | no fade clearance: the focused control is not scrolled and nothing is suppressed | `elements packages/elements/test/scroller.test.ts`: 5 failed, 17 passed (22); fails: US1-13: the box scrolls in the inline d…; US1-13: tabbing through twelve links an…; US1-13: a focused button wider than the…; US1-13: a button clicked half under the…; US1-13 at a 20 px root font size: the c… |
| S15 | US1-13 wide button (T013) | the synchronous flag: `#writing` set around the module's own `scrollTo`, and the suppression dropped on any `scroll` while it is false | `elements packages/elements/test/scroller.test.ts`: 1 failed, 21 passed (22); fails: US1-13: a focused button wider than the… |
| S16 | US1-13 pointer focus (T013) | clearance on every `focusin`: the `:focus-visible` check removed | `elements packages/elements/test/scroller.test.ts`: 1 failed, 21 passed (22); fails: US1-13: a button clicked half under the… |
| S17 | US1-14 (T013) | `:host([hidden]) { display: none; }` removed from `ocelle-scroller` | `elements packages/elements/test/scroller.test.ts`: 1 failed, 21 passed (22); fails: US1-14: a hidden scroller has no box, n… |
| L1 | `test/scroller-lifecycle.test.ts` (a guard added in green, below) | `hostConnected` does not follow the box again when the host connects again | `elements packages/elements/test/scroller-lifecycle.test.ts`: 1 failed (1); fails: ocelle-scroller moved to another place of the page follows its box after it is connected again |
| L2 | the same test | the per-instance sheet adopted on every connect (the `includes` check removed) | `elements packages/elements/test/scroller-lifecycle.test.ts`: 1 failed (1); fails: the same test (four sheets per root) |

## Guards that pass before the phase

- **G1.** The `radial-gradient()`, `repeating-linear-gradient()` and `conic-gradient()` rows of T011 are raw whole
  under the rule as it was, so they pass in the red commit (`ec2e003`), as contracts/gates.md keeps them raw. G1 is
  their proof that they can fail.
- **D1, D2.** `messages()` and `sheets()` are 005's driver methods; their T010 tests pass in the red commit. D1 and D2
  are their proof that they can fail.
- **L1, L2.** `test/scroller-lifecycle.test.ts` was added after the green implementation: a scroller moved to another
  place of the page (disconnected and connected again) follows its box there, scrolls one 40 px step per key and keeps
  one per-instance sheet. No red test covered the module's reconnect path (`hostConnected` with a known box, and the
  sheet adopted once), so it is a guard on the green code, and L1 and L2 are its proof that it can fail. It fails on the
  phase base too (no `ocelle-scroller` there).

## Guards

The first `gate:mutation -- --base 247991d` run left 63 mutants alive, on paths no red test reached. Each was either
covered by a guard added after the green implementation, in `fd3f397`, whose surviving mutants are its proof that it
can fail (they are its plants, run by Stryker), or shown equivalent and simplified away or marked with a
`Stryker disable` comment that gives the reason:

| Guard | Test | Mutants it kills (first run, `overflow-region.ts` unless named) |
|---|---|---|
| clearanceScroll at its bounds (twelve cases) | `test/overflow-region.test.ts` | the comparisons and arithmetic of lines 71 to 84: `>` / `>=` at 1 px from either end and at a fade's edge, `- fade` / `+ fade`, `range - 1` / `range + 1`, `end <= endRoom(position)` / `true`, the suppression conditions |
| a label set by property renames the group | `scrollerGuards` (both harnesses) | `this.#apply()` in `setLabel` |
| overflow ending with focus outside moves no focus | `scrollerGuards` | `focused` / `true` in `#measure` |
| keyboard focus on the box does not scroll it | `scrollerGuards` | `target === box` / `false` in `#onFocusIn` |
| the suppression ends when focus leaves the strip, holds over 1 px, ends on 2 px; a wide button focused by script where it sits is suppressed at once | `scrollerGuards` | the `#onFocusOut` body, `> 1` / `>= 1` in `#onScroll`, `this.#measure()` in `#onFocusIn` |
| a unitless number inside `linear-gradient()` is raw | `gates/test/token-only.test.ts` | `token-only.ts:146` `false` / `true` (the gradient's arguments read as inside `calc()`) |
| `driver.focus(target)`, the script focus the last guard needs | `test/driver.test.ts`, `test/browser/driver.test.ts` | (driver; not mutated) |

The final run (`gate:mutation -- --base 247991d` on the green head): 432 mutants on the changed lines of 4 files, none
survived; 0 timeouts, 130 compile errors, 1 zero-mutant entry (`src/index.ts`, an export line); 20 equivalent records,
each with its reason in the source. The whole run took about 10 minutes on this machine for all 18 CI shards together,
so no shard comes near the 10-minute stop-and-ask bound.

## The scrollbar plant of T016

Not in this table: it is the stop-and-ask point of T030 (see `stop-and-ask.md`).
