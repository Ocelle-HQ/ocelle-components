# Phase 1 plants (T021 step 1, T021a)

Each plant of contracts/checks.md (§ Oracles and § CSS-only behaviours) for facts, run once on 2026-11-14 against the
green source: the source (or `base.css`) edited as named, the guarding bodies run in process
(`packages/elements/test/facts.test.ts`, with the 2-frame layout wait) or, for the `@ocelle/styles` rules, in
`packages/styles/test/browser/facts.test.ts`, then the file restored. Scratch runner in the session scratchpad; no
plant is committed.

| Plant | Guard run | Result |
|---|---|---|
| the A1 `<dl><slot>` structure | US1-6 | bites: US1-6 fails |
| slots assigned in reverse order | US1-6, US1-7, US1-10, dynamic (reorder) | bites: all four fail |
| U+200B every 16 characters in the value (in `ocelle-fact`) | US1-4 | bites: US1-4 fails |
| the extra triggers removed (no window `resize`, no measure from the `MutationObserver`, none in `updated()`) | US1-12 widen, relabel | bites: both fail |
| `characterData` removed from the observer | US1-12 value text | bites: fails |
| class not restored after the measure (toggled only when the decision changes) | the 300 → 290 px body | bites: fails |
| the measure pass run synchronously inside the `ResizeObserver` callback (T006a) | the no-loop-error test | bites: fails |
| `fit-content(50%)` replaced by `auto` | the very long label body | bites: fails |
| **`minmax(0, 1fr)` replaced by `1fr`** (two-column value track and stacked track) | US1-3 | **does not bite: US1-3 passes** (stop-and-ask, below) |
| the `stacked` one-column rule removed | US1-2, resize | bites: both fail |
| the hook probe ignored | the valid-hook body | bites: fails |
| the default probe removed | the hook-fallback body | bites: fails |
| the probes not observed | the hook-change body (450 px) | bites: fails |
| probe `block-size: 1px` | the hook-fallback body (page scroll width at 320 px) | bites: fails |
| the compact hooks removed from `base.css` | US1-9 and the compact-region body | bites: fails |
| the `wrap` rule removed | US1-3, the standalone wrap body | bites: both fail |
| the styles pre-upgrade rule removed | the styles pre-upgrade test, light and dark | bites: both fail |
| `:not([hidden])` removed from the styles rule | the styles pre-upgrade test, light and dark | bites: both fail |
| grid: the groups not rendered | US1-13 | bites: fails |
| grid: the four-column rule removed | US1-13 | bites: fails |
| grid: the grid layout's two-column rule removed | US1-14 | bites: fails |
| grid: the four-column point at T instead of 2 × T | US1-14 | bites: fails |
| grid: the grid measure read in the decided layout (column classes not removed) | US1-18 | bites: fails |
| grid: the grid `<dt>`'s `margin-block-end` removed | US1-13 | bites: fails |
| grid: a divider as a `border-block-end` on each group | US1-13 | bites: fails |

## Stop-and-ask: the `minmax(0, 1fr)` → `1fr` plant does not bite

tasks.md § Stop-and-ask points, "Plants: a plant that does not bite". The phase stops at T021 step 1; the gate runs of
step 2 (`gate:plants`, `gate:mutation`, …) are not run.

**What was measured.** With the value track `1fr` (in the two-column rule and the stacked rule), US1-3 still passes,
and so does every one of the 52 facts bodies. Also with the `<dd>`'s `min-inline-size: 0` removed as well, all 52 pass.

**Why.** `1fr` is `minmax(auto, 1fr)`: the track's minimum is the value's automatic minimum, its min-content size.
Two things keep it from widening in every body:
- the `<dd>` has `min-inline-size: 0` (R-03, "cells with `min-inline-size: 0`"; in the two-column layout too), which
  sets the grid item's automatic minimum to 0, so the track function never sees the value's min-content;
- every body whose value would be wider than its column carries `wrap="anywhere"` (US1-3, US1-16, the 640 px body),
  and `overflow-wrap: anywhere` makes the value's min-content one character wide, so even without the `<dd>` rule the
  track is not widened.
No body has an unbroken value without the wrap policy in the value column, which is the only content `1fr` would
widen the column for (FR-009 as qualified lets such a value overflow its box; FR-005 says its content never widens the
value column).

**Options for the operator.**
- **(a) Record the plant as an equivalent change.** With `min-inline-size: 0` on the `<dd>`, `1fr` and `minmax(0,
  1fr)` give the same track for every content; record it in contracts/checks.md § CSS-only behaviours as an equivalent,
  as `animation: none` is for reduced motion, and keep US1-3 as the body for "value column never widened". No code or
  test change.
- **(b) Add a body and plant both rules.** A body with a 600 px two-column sheet whose value is an unbroken 64-character
  identifier without `wrap`: the value column's inline size equals the sheet less the label column and the gap, and
  the label column keeps its size (the value overflows its box, FR-009 as qualified). The plant becomes "`minmax(0,
  1fr)` → `1fr` and the `<dd>`'s `min-inline-size: 0` removed", which that body must fail; a second plant, the `<dd>`
  rule alone removed, is recorded as equivalent while the track is `minmax(0, 1fr)`. A test change (red first, a
  `fix-1` red commit).
- **(c) Add the body of (b) and keep the plant as written.** The body asserts the column; the plant as named would
  still not bite (the `<dd>` rule holds), so this also needs the `<dd>` rule dropped from the element (relying on the
  track function alone) — a source change against R-03's "cells with `min-inline-size: 0`".
