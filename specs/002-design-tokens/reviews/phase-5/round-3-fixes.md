# Phase 5 review round 3: fixes

Review: `round-3.md` (operator round from the landing pass of PR #19, landing L1-01, changes_requested, 1 blocking
finding). Task T070.

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| O3-01 | fixed | `fix-3` (2bf1e4b, `red-fix-3.log`): `packages/tokens/test/validate.test.ts` "for exempt on a colour token other than color-disabled-ink" (fixture `color-ink` with `exempt: true`) and "over the real source, for exempt on color-ink-muted by an override" fail on their assertions (the source is accepted); `gates/test/integration/plants-robustness.test.ts` counts 31 plants (30 before the new plant). The same commit renames the fixture token `color-disabled` of `gates/test/contrast.test.ts` (record, pair entries, override, expected lines) to `color-disabled-ink`, and adds the accept cases (fixture and real source with `exempt` on `color-disabled-ink`), which pass | `packages/tokens/src/generate.ts` (`recordProblems`, used by `validateSource`): `contrast.exempt` on any token other than `color-disabled-ink` is the problem `token <name>: exempt is allowed only on color-disabled-ink` (data-model § Token, contracts/gates.md § `contrast`, § `brand-rules`). New breaking plant `gates/plants/contrast/exempt-not-disabled-ink/` (`delta.json`: the `text-below-threshold` delta plus `color-ink-muted`'s `contrast`, kind and grounds as in `source.ts`, with `exempt: true`; `plant.json` `expect: "error"`, cause `contrast: cannot run: packages/tokens/src/source.ts: invalid token source: token color-ink-muted: exempt is allowed only on color-disabled-ink`). With the rule disabled by hand the plant job reports `not-reported-broken: expected exit 2 (could not run), got exit 0` for it, the L1-01 reproduction. `gates/README.md`: the plant in the `contrast` breaking list. |

The green commit changes no test file.

Checks on Node 22.23.4: `pnpm test` (1798 tests), `gate:contrast`, `gate:brand-rules`, `gate:plants` (177 plants as
expected), `gate:typecheck`, `gate:lint`, `gate:test-lint`, `gate:style-lint`, `gate:mutation -- --base eeb95d4`
(`round-3-mutation.log`) pass, and `tdd-check.sh 5` reports `pass`.
