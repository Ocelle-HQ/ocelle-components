# Phase 4, review round 3: fixes

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| OP4-01 | fixed: `admittedLine()` keeps, for each nested function's nodes, the function and the group it sits in; when the group of the one `1lh` holds no other operand (spaces and comments aside), the `1lh` is read as that group, outward while the group holds the one operand, and the `+`/`-` check runs on the neighbours there. `calc((1lh) * 3 + …)`, `calc(calc(1lh) * 3 + …)`, `calc(3 * (1lh) + …)`, `calc(((1lh)) * 3 + …)`, `calc((1lh) / 2 + …)`, `calc(… * (1lh))` and `calc(… - calc((1lh)) / 2)` now report `1lh`; `calc((1lh) + …)`, `calc(… - calc(1lh))`, `calc(… + ((1lh)))` and the row's `calc((var(--ocelle-icon-size) - 1lh) / 2)` still pass. Any function is climbed, not only a group or `calc()`: a `1lh` inside another function is never classified on its own, so it makes no difference (comment at the function). Fail plant `gates/plants/style-lint/fail-lh-paren-factor` added (T067); it did not hold before the fix and holds after it (`plants.md`). | `fix-3` b65dabf (`red-fix-3.log`: 7 of 2532 tests failed on assertions, `expected [] to deeply equal [ '1lh' ]`, one per factor case above) | `gates/stylelint/token-only.ts` (`admittedLine`, `operandsOf`, file header), `gates/test/token-only.test.ts`, `gates/plants/style-lint/fail-lh-paren-factor/` |

`calc((1lh) + (1lh) + var(--ocelle-space-1))` (T067) was already reported before the fix: it holds two `lh` lengths,
and an expression with more than one admits none. Its row is in the red commit as a guard, and it passed there; it is
not counted among the red tests.

## Checks after the fix

Node 22, `OCELLE_CHROMIUM_PATH` set (red.sh included); `PLAYWRIGHT_BROWSERS_PATH` set for the plant and Stryker runs;
one heavy job at a time.

| Check | Result |
|---|---|
| `gate:typecheck`, `gate:lint` (223 files), `gate:test-lint` (152 files), `gate:prefix` (206 files) | exit 0 |
| `gate:style-lint` | exit 0, 12 files, no finding |
| `pnpm test` | exit 0, 2532 tests in 119 files |
| `gate:plants` | exit 0, 218 plants of 14 gates and the registry judged, every plant as expected |
| `gate:mutation -- --base b65dabf` | exit 0, 24 mutants on the changed lines of 1 file, none survived; 0 equivalent records |
