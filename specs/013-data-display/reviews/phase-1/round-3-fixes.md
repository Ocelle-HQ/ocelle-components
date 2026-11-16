# Phase 1 review, round 3 (operator round): fixes

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| O3-01 | fixed: in-process test "a sheet removed from the document keeps the classes it had at removal after a window resize, while a connected sheet re-runs the pass on the same dispatch" (two 300 px stacked sheets; one removed, the other's `stacked` cleared by hand so no `ResizeObserver` callback restores it; `window` gets a `resize` event; after the layout wait the removed sheet's `<dl>` is still `["stacked"]` and the connected one is `["stacked"]` again). The `BlockStatement` record on `disconnectedCallback` and the `StringLiteral, CallExpression` record on `window.removeEventListener("resize", …)` are deleted (comment lines only) | none recorded: the shipped code already cleans up, so the test cannot be red against the source (a missing test, as phase 3's R1-01); the hand plants below show it bites | packages/elements/test/facts.test.ts; packages/elements/src/ocelle-facts.ts |
| O3-02 | fixed: the redundant `size >= threshold &&` operand of the `cols-2` toggle and its `ConditionalExpression` record removed; the other `ConditionalExpression` records stay. Behaviour-neutral (below the threshold `cols-1` is set too and its one-track rule wins); no test changed | none: behaviour-neutral, no red | packages/elements/src/ocelle-facts.ts (grid branch of `#measure`) |
| O3-03 | fixed: the `StringLiteral` record's reason now names the `grid-template-columns` and `transform` reads in `functionRaw` and states why it still holds: the mutant `""` is, like `animation-iteration-count`, none of the unitless properties, the fonts, `grid-template-columns` or `transform`, so each read gives the same result (checked against `wordAllowed`, `isFont` and `functionRaw` before writing) | none: comment only | gates/stylelint/token-only.ts:286 |

## O3-01 hand plants (not committed)

Run each time: `pnpm exec vitest run packages/elements/test/facts.test.ts -t "removed sheet"`.

1. `disconnectedCallback` body emptied: **fails**. `"removed": []`, expected `["stacked"]` (facts.test.ts:69).
2. The `window.removeEventListener("resize", this.#resized);` line removed, the rest of the cleanup kept: **fails**.
   `"removed": []`, expected `["stacked"]` (facts.test.ts:69).
3. Source restored: **passes** (and the whole file, 60 tests, passes).

## Checks

- `pnpm test`: `unit-tests: 3793 tests passed in 152 files` (with the Docker daemon started; before it was started
  the five docker-engine tests of gates/test/integration/visual.test.ts failed on "Cannot connect to the Docker daemon").
- `gate:typecheck`: `typecheck: no type error in the files of tsconfig.json`
- `gate:lint`: `lint: 296 files checked, no finding`
- `gate:test-lint`: `test-lint: 202 files checked, no finding`
- `gate:prefix`: `prefix: 252 files checked, no finding`
- `gate:style-lint`: `style-lint: 16 files checked, no finding`
- `gate:mutation -- --base 30e5130 --files packages/elements/src/ocelle-facts.ts,gates/stylelint/token-only.ts`:
  `mutation: 372 mutants on the changed lines of 2 files, none survived; 0 timeouts, 98 compile errors, 0 zero-mutant entries; 13 equivalent records`.
  The `disconnectedCallback` block, the `removeEventListener` call and string, and the `cols-2` toggle line no longer
  carry a record and none of their mutants survived.
