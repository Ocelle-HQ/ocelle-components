# Phase 3 plants (T044; R-17)

Each plant was applied to the working tree on top of the green implementation (uncommitted at the time, the same
source as the phase 3 green commit), its tests run, and every file it touched restored byte for byte (compared with
the bytes read before the change) before the next plant. Nothing planted was committed. The runner applied each plant
as an exact text replacement and ran the named Vitest project and file in process (`elements`, the project Stryker
mutates); the output is summarised below (Vitest truncates long test names).

| # | Guard | Plant | Result |
|---|---|---|---|
| B1 | US2-1 (Frame W) and US2 no lanes (T032) | `packages/elements/src/overflow-region.ts`: the board always applies its region role and tab stop | `elements packages/elements/test/workflow-board.test.ts`: 10 failed | 10 passed (20); fails: US2-1: five lanes of sentence cards in …; US2-3: three lanes in Frame W share the…; US2-12: a hidden board and a hidden lan…; US2-14 (with base.css): in Frame W five…; SPEC-2-06: a fixed 400 px block in the …; US2 slot change: a child assigned to th…; US2 one lane: one lane in Frame W is th…; US2 no lanes: an empty board in Frame N…; US2 non-lane children: three lanes and …; US2 content changes while scrolled: fiv… |
| B2 | US2-1 (Frame W) and US2-14 (T032) | `packages/elements/src/ocelle-workflow-board.ts`: the board's `::slotted(*)` `contain: inline-size` removed | `elements packages/elements/test/workflow-board.test.ts`: 13 failed | 7 passed (20); fails: US2-1: five lanes of sentence cards in …; US2-2: in Frame N the board is one tab …; US2-3: three lanes in Frame W share the…; US2-9: in Frame S at 320 px the page ha…; US2-10: right to left in Frame N, the f…; US2-12: a hidden board and a hidden lan…; US2-14 (with base.css): in Frame W five…; US2-15: in Frame W five flat lanes of b…; SPEC-2-06: a fixed 400 px block in the …; US2 slot change: a child assigned to th…; US2 at a 20 px root font size: the lane…; US2 many lanes: twelve lanes in Frame W…; US2 non-lane children: three lanes and …<br>`elements packages/elements/test/workflow-lane.test.ts`: 1 failed | 7 passed (8); fails: US2-8: a title longer than its lane wra… |
| B3 | US2-2 and US2-10 (T032) | `packages/elements/src/overflow-region.ts`: no modifier check on the arrow keys | `elements packages/elements/test/workflow-board.test.ts`: 2 failed | 18 passed (20); fails: US2-2: in Frame N the board is one tab …; US2-10: right to left in Frame N, the f… |
| B4 | US2-4, light and dark (T032) | `packages/elements/src/ocelle-workflow-lane.ts`: the default lane's ground set to `--ocelle-color-panel` | `elements packages/elements/test/workflow-lane.test.ts`: 2 failed | 6 passed (8); fails: US2-4 in light: a default lane has a co…; US2-4 in dark: a default lane has a col… |
| B5 | US2-5 (T032) | `packages/elements/src/ocelle-workflow-lane.ts`: the visible header not hidden from the tree (`aria-hidden` removed) | `elements packages/elements/test/workflow-lane.test.ts`: 5 failed | 3 passed (8); fails: US2-5: <ocelle-workflow-lane label="Rea…; US2-6: every count and title case of th…; US2-7 in light: a flat lane has no grou…; US2-7 in dark: a flat lane has no groun…; US2 lane count updates: setting count t… |
| B6 | US2-6 (T032) | `packages/elements/src/ocelle-workflow-lane.ts`: the count rendered as "0" when absent (shown and named) | `elements packages/elements/test/workflow-lane.test.ts`: 1 failed | 7 passed (8); fails: US2-6: every count and title case of th… |
| B7 | US2-6 (T032) | `packages/elements/src/ocelle-workflow-lane.ts`, `packages/elements/src/lane-count.ts`: the group role and the ", " separator always applied | `elements packages/elements/test/workflow-lane.test.ts`: 1 failed | 7 passed (8); fails: US2-6: every count and title case of th… |
| B8 | US2-9 (T032) | `packages/elements/src/ocelle-workflow-board.ts`: a board without its own overflow (`.region-frame > .region-box { overflow: visible; }` in the board's styles) | `elements packages/elements/test/workflow-board.test.ts`: 7 failed | 13 passed (20); fails: US2-2: in Frame N the board is one tab …; US2-9: in Frame S at 320 px the page ha…; US2-10: right to left in Frame N, the f…; US2-15: in Frame W five flat lanes of b…; US2-15: in Frame N each keyboard-focuse…; US2 many lanes: twelve lanes in Frame W…; US2 content changes while scrolled: fiv… |
| B9 | US2-12, the board (T032) | `packages/elements/src/ocelle-workflow-board.ts`: `:host([hidden])` removed from the board | `elements packages/elements/test/workflow-board.test.ts`: 1 failed | 19 passed (20); fails: US2-12: a hidden board and a hidden lan… |
| B10 | US2-12, the lane (T032) | `packages/elements/src/ocelle-workflow-lane.ts`: `:host([hidden])` removed from the lane | `elements packages/elements/test/workflow-board.test.ts`: 1 failed | 19 passed (20); fails: US2-12: a hidden board and a hidden lan… |
| B11 | US2-14, Frame N half (T032) | `packages/elements/src/ocelle-workflow-board.ts`: a lane whose minimum inline size is its content's min-content (`min-inline-size: min-content` in the board's `::slotted(*)`) | `elements packages/elements/test/workflow-board.test.ts`: 11 failed | 9 passed (20); fails: US2-1: five lanes of sentence cards in …; US2-2: in Frame N the board is one tab …; US2-9: in Frame S at 320 px the page ha…; US2-10: right to left in Frame N, the f…; US2-11: in forced colours a default lan…; US2-14 (with base.css): in Frame W five…; US2-15: in Frame N each keyboard-focuse…; US2 at a 20 px root font size: the lane…; US2 many lanes: twelve lanes in Frame W…; US2 no lanes: an empty board in Frame N…; US2 content changes while scrolled: fiv…<br>`elements packages/elements/test/workflow-lane.test.ts`: 8 passed (8) |
| B12 | US2-15, Frame W and Frame N (T032) | `packages/elements/src/overflow-region.ts`: no ring room (the module's block and inline ring room 0) | `elements packages/elements/test/workflow-board.test.ts`: 12 failed | 8 passed (20); fails: US2-1: five lanes of sentence cards in …; US2-2: in Frame N the board is one tab …; US2-3: three lanes in Frame W share the…; US2-10: right to left in Frame N, the f…; US2-12: a hidden board and a hidden lan…; US2-14 (with base.css): in Frame W five…; US2-15: in Frame W five flat lanes of b…; US2-15: in Frame N each keyboard-focuse…; US2 one lane: one lane in Frame W is th…; US2 no lanes: an empty board in Frame N…; US2 non-lane children: three lanes and …; US2 content changes while scrolled: fiv… |
| B13 | US2-15, Frame N (T032; strengthened by operator decision P2) | `packages/elements/src/overflow-region.ts`: no fade clearance (the focused card is not scrolled and nothing is suppressed) | first run, on `12ebc36`: `elements packages/elements/test/workflow-board.test.ts`: 20 passed (20), did not bite<br>rerun, on `b9dbccf`: `elements packages/elements/test/workflow-board.test.ts`: 1 failed, 20 passed (21); fails: US2-15: in Frame N each keyboard-focuse… |
| B14 | US2 non-lane children (T032) | `packages/elements/src/ocelle-workflow-board.ts`, `packages/elements/src/ocelle-workflow-lane.ts`: `contain: inline-size` on the lane's host only, not in the board's `::slotted(*)` | `elements packages/elements/test/workflow-board.test.ts`: 2 failed | 18 passed (20); fails: US2 slot change: a child assigned to th…; US2 non-lane children: three lanes and …<br>`elements packages/elements/test/workflow-lane.test.ts`: 8 passed (8) |
| B15 | US2 lane count updates (T032) | `packages/elements/src/ocelle-workflow-lane.ts`: `aria-live="polite"` on the lane's header | `elements packages/elements/test/workflow-lane.test.ts`: 1 failed | 7 passed (8); fails: US2 lane count updates: setting count t… |
| B16 | US2 content changes while scrolled (T032) | `packages/elements/src/overflow-region.ts`: the fades and the tab stop computed from a cached `scrollLeft`, the value the last scroll event read, instead of the box's clamped one | `elements packages/elements/test/workflow-board.test.ts`: 1 failed | 19 passed (20); fails: US2 content changes while scrolled: fiv… |
| B17 | US2 slot change, the guard of the phase 2 review's R1-03 (T032) | `packages/elements/src/overflow-region.ts`: the module's `slotchange` listener removed | `elements packages/elements/test/workflow-board.test.ts`: 1 failed | 19 passed (20); fails: US2 slot change: a child assigned to th… |

## Judgement

- **B1 to B12 and B14 to B17 bite**: each makes its guard fail.
- **B13 did not bite at first** (stop-and-ask, `stop-and-ask.md`). With the module's fade clearance removed, US2-15 in
  Frame N still passed: the four cards it focused were each either at an end of the scroll range, where that side does
  not fade, or fully inside the box at least a fade's depth from the fading side, so Chromium's own focus scrolling
  already left them clear. The operator answered "Strengthen test, rerun" (decision P2, `operator-decisions.md`).
  `b9dbccf` adds to the Frame N walk `l3c0` by Tab after `l2c2` and `l1c2` by Shift+Tab after `l2c0`, each in a lane
  partly off-screen when it takes focus. The strengthened test passes on the green code in both harnesses (21 of 21
  in process, 31 of 31 on the fixture). B13 was then run once more, the file restored byte for byte (`git diff
  --exit-code` clean): it **bites**, failing US2-15 in Frame N only. T044 is done.
- **B17 answers the phase 2 review's R1-03.** The `slotchange` listener of the overflow-region module is not
  equivalent for the board: a child assigned after the first render whose fixed content reaches past the box changes
  neither the box's nor the track's size, and only the slot change shows the overflow. The listener's two
  `Stryker disable` records are removed from `src/overflow-region.ts`, so its mutants are run, and the guard is the
  "US2 slot change" scenario.

## Guards

The first `gate:mutation -- --base 6f92f5f` run (105 mutants on the changed lines of 5 files) left 12 mutants alive,
on paths no red scenario reached. Each is now either covered by a guard added after the green implementation, whose
surviving mutants are its proof that it can fail (they are its plants, run by Stryker), or shown equivalent and marked
with a `Stryker disable` comment that gives the reason. The second run: 105 mutants, none survived, 0 timeouts,
20 compile errors, 2 zero-mutant entries (`src/index.ts`, and `src/overflow-region.ts`, whose changed lines are the
comments of the `slotchange` listener), 5 equivalent records.

| Guard | Test | Mutants it kills (first run) |
|---|---|---|
| a host `aria-label` set on an overflowing board after it renders renames its region; blank or removed falls back to `label` | `boardGuards` (both harnesses) | `ocelle-workflow-board.ts:30` `"aria-label"` → `""` in `observedAttributes`; `:72` `this.requestUpdate()` removed |
| a host `aria-label` set on a lane after it renders names its group; blank or removed falls back to the title and count | `laneGuards` (both harnesses) | `ocelle-workflow-lane.ts:34` `"aria-label"` → `""`; `:153` `this.requestUpdate()` removed |
| `variant` set by property is reflected, and the flat lane drops its ground | `laneGuards` (both harnesses) | `ocelle-workflow-lane.ts:29` `reflect: true` → `false`, and the options object → `{}` |

Equivalent, with the reason in the source:

- `ocelle-workflow-lane.ts`, the title part: `title === undefined` → `false` renders an empty title span for an untitled
  lane, which shows nothing and adds no text.
- `ocelle-workflow-lane.ts`, the separator: `title !== undefined && count !== undefined` → `true`, either side `true`,
  or `||` puts a space beside only the title or only the count, at the end or the start of the header's line, where it
  collapses.
- `lane-count.ts`, `value?.trim() ?? ""`: any other text for an absent attribute is rejected as the empty text is.

The render was split into one statement per part for these records, so no killed mutant of the count part shares a
disabled line.

The 20 compile errors include the `typeof value === "number"` guard of `validCount` (TypeScript's narrowing breaks
when it is mutated); `lane-count.test.ts` covers it with `"3"`, `null`, `undefined` and `true`.
