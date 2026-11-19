# Mutation of phase 1 (T025), in progress

Command: `pnpm run gate:mutation -- --base 8d104af23ce177ec4acbbfaba59bf433f9520d6d` (the phase base), Stryker on the
in-process `elements` and `elements-touch` projects (vitest.mutation.elements.config.ts). T025 is open: the gate still
exits 1, and two points are for the operator (below).

## Runs

| Run | Tree | Result |
|---|---|---|
| 1 | 14c0ca2 | exit 1: 30 findings, 467 mutants on changed lines, 288 compile errors. 28 survivors, all in `overflow-region.ts`; every one of the 238 mutants of `ocelle-data-table.ts` a CompileError |
| 2 | f1e112c (uncommitted then) | exit 1: 2 findings; `overflow-region.ts:660` (`#release`'s `this.#axis = false`) survives; the data table still all compile errors |
| 3 | 425f115 | exit 1: 48 findings, 455 mutants, 1 timeout, 125 compile errors. `overflow-region.ts`: 149 killed, 1 survivor (`:660`). `ocelle-data-table.ts`: 115 killed, 46 survived, 1 no coverage, 1 timeout |

## overflow-region.ts (T081), commit f1e112c

- **Killed by new tests**, each checked by applying its mutant by hand and running the bodies:
  - six pure `blockClearanceScroll` cases at the edges: the room rule not met (95 px) and met at exactly twice the
    depth (96 px), the fade off 1 px from the range's end (two cases), a clear position exactly 1 px before the end,
    and a ring box at the block start ending exactly at the fade's edge. They kill lines 153 (four mutants), 154, 159,
    161 (two) and 166;
  - five shared bodies in `test/scenarios/overflow-block.ts`, which run in both harnesses. The fallback's 1 px
    tolerance kills 832. A host added already bounded kills 537. Letting go of a box and getting it back kills 649,
    650 and 652. A host built without the option kills 548. With the option off, no block clearance happens for a
    link tabbed to under the pinned box (791).
- **Removed by a behaviour-neutral refactor**: `blockClearanceScroll`'s first branch (line 158, four survivors) and its
  `clear()` bottom check. The fallback already computes the same result. The new form was compared with the old on
  400,000 random inputs and gave no difference.
- **Recorded as equivalent** (Stryker disable comments with the reason):
  - the upper-bound check's `>` variant;
  - the initial `offBlockEnd`, `fadeBlockEnd`, `#axis` and `#blockOn`;
  - the `true` variants of the run-time switch's two conditions;
  - the CONTAINS test's `true` variant in the element-before rule;
  - `box.bottom`, which `blockClearanceScroll` does not read.
- **Not killed: `#release`'s `this.#axis = false` (line 660, `true`). Not equivalent; for the operator (Q-M1).**

## ocelle-data-table.ts (T016), commit 425f115

In run 1, Stryker's type checker reported TS7022/TS7023 for every mutant of the file: a circular inference through
`#region`'s initializer, on lines no mutant touched. So the element was not mutation-tested at all, and the gate
passed over it silently, counting its mutants as compile errors. The fix is type annotations only: `#region:
OverflowRegion` and `blockStartBox`'s `Element | null`. Run 3's survivors were triaged but not yet acted on:

- **Killable by new shared bodies:**
  - lines 25 and 26 (`img` test and `walk`), plus the no-coverage `?? ""`: a caption with a visible nested element and
    an `<img>` without `alt`;
  - lines 45 to 47 (reflection of `wrap`, `sticky-header` and `striped` when set as properties);
  - line 143 (the box size rewritten on a resize with no fade change);
  - line 162 (`hidden`, `aria-hidden` and `alt` changed at run time in the caption);
  - line 220 (a blank `label` with a caption);
  - line 237 (fade `both` when a frame runs after the bound is lifted mid-scroll);
  - line 161 (a reconnect adopting the per-instance sheet twice).
- **Equivalent (to be recorded):**
  - lines 31 and 32 (`resolveName` trims and treats blank as absent);
  - line 44 (`String` is the default type);
  - line 125 (without `sticky-header` the box is never bounded in the block axis);
  - line 150 (an extra frame writing the state already there);
  - line 177 (an extra update on another attribute);
  - line 214 (assigning the same node fires no `slotchange`);
  - line 223 (extra frames only);
  - line 255 (setting an equal value).
- **The block-axis scrollbar's room**, 0 in process: lines 224, 225, 244, 245, 252 and 253. T025 wants each recorded
  with the classic-scrollbar suite's body that kills it (`test/browser/data-table-scrollbar.test.ts`, the sticky
  caption body) and T024's plant run. Each still needs that run with its mutant applied.
- **`disconnectedCallback` (lines 167 to 171).** These survive because the mutants keep observing a detached element.
  That exposed a defect in the green element, reproduced in process: detach the element, replace its `<table>`,
  reattach it, and the slot assigns nothing, so no table shows. `connectedCallback` observes again but does not
  re-assign, and nothing requests an update. **For the operator (Q-M2).**

## Also

- The plant run of `plants.md` was at ef50a1b. The later source changes are a behaviour-neutral refactor, comments and
  type annotations; the in-process and fixture suites of the module and the data table pass (158 and 79 tests), as do
  `gate:typecheck`, `gate:lint`, `gate:test-lint` and `gate:style-lint`. `gate:unit-tests` has not been rerun in full
  since the new bodies.
- Gate note, not decided here: `gate:mutation` passes a file whose every mutant is a compile error.
