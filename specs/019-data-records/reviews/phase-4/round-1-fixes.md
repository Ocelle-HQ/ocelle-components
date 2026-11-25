# Phase 4, review round 1: fixes

Review: `round-1.md` (changes_requested, fead651). Operator decisions: `operator-round-1-decisions.md` and
`operator-coverage-decision.md` (G-1 (b)), at bbb5822.
Red commit: ce23bd9 (`red-commits`: `fix-1`), recorded by `red.sh 4 fix-1`, log `red-fix-1.log`.

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R1-01 | fixed | ce23bd9: "maps the role data table light mode to its element, attribute or hook, or the consumer's remedy, in the kitty-mission-ui mapping (019 FR-058)" and the role-list test "maps every data-table role and none reads pending inventory", in `packages/elements/test/node/readme.test.ts`; both red at ce23bd9 on their assertions | `packages/elements/README.md` (the row `.sk-data-table` \| data table light mode \| built in: the light and dark themes, after the tone row); `research.md` R-16's phase 1 table (the light-mode row); `coverage.md` (G-1 closed, T076 ticked); `tasks.md` T076 ticked |
| R1-02 | fixed | ce23bd9: in `packages/elements/test/node/changelog.test.ts`, "the data records are a minor change": the elements CHANGELOG's paragraph (its two sentences) under Unreleased, and in the data table's entry `` `wrap` (reflected) `` and "the property `stickyHeader` as `sticky-header` (reflected)"; in `packages/styles/test/readme.test.ts`, the styles CHANGELOG's four-blocks paragraph under Unreleased. They pass at ce23bd9 (T075's text predates them); against the base's CHANGELOGs (4106d7d) all five fail (see below) | `tdd-exempt.md` (T075 removed; T076 to T078 stay exempt); `tasks.md` (the phase 4 goal and T075's "Exempt" marking) |
| R1-03 | fixed | none (record) | `plants.md` run 1: "the 22 of the elements' gates and 18 mutation plants" |
| R1-04 | fixed | none (record) | `quickstart.md`: "`connectedCallback`'s body and its `observe()` call", the wording of `reviews/phase-3/mutation.md` |
| R1-05 | no change asked | none (note) | none |
| R1-06 | no change asked | none (note) | none; `tdd-check.json` is rewritten by the next TDD check, which now runs in full (a `red-commits` file exists) |

## The red

At ce23bd9 the whole suite (`pnpm test`) fails; the new failures are the README row's two tests, on their assertions
(`red-fix-1.log`). The CHANGELOG tests pass at ce23bd9: T075 wrote the CHANGELOG text in 7160e2e, before these tests,
and the red commit changes test files only. `red.sh` records a commit when the suite fails at it and the commit is
tests-only; it does not require every new test to fail there. For the CHANGELOG tests the proof is the TDD check's run
of the final test files against the base (`check-final-tests-on-base.log`), which takes the CHANGELOGs from 4106d7d.

Checked by hand before the red commit, the three test files at ce23bd9's versions against 4106d7d's two CHANGELOGs:
`Tests 5 failed | 90 passed (95)`, the five being the four-blocks paragraph, the two sentences of the elements
paragraph, `` `wrap` (reflected) `` and `stickyHeader` as `sticky-header` in the data table's entry. At the fix commit
the three files pass: `Tests 793 passed (793)`.

The suite run at ce23bd9 (`red-fix-1.log`, "7 of 7779 tests failed") also has five failures in
`gates/test/integration/visual.test.ts`, the visual gate's and the baseline command's integration tests, which exit 2
here because the docker daemon is not reachable in this environment (`docker info` exits 1), so the gate has no visual
engine; they do not depend on this commit; under the CI-first decision
(`reviews/operator-ci-first-decision.md`) they are left to CI. The log's two environment paths (the pnpm store and the
Chromium binary) are redacted to `<pnpm store>` and `<chromium>`.

## Checks run

| Check | Exit | Summary |
|---|---|---|
| `vitest run` README and CHANGELOG tests (`elements-node` readme and changelog, `styles` readme) | 0 | 3 files, 793 tests passed |
| `gate:test-lint` | 0 | 337 files checked, no finding |
| `gate:lint` | 0 | 458 files checked, no finding |
| `gate:typecheck` | 0 | no type error in the files of tsconfig.json |
| `gate:plants -- --affected 4106d7d` | 0 | 1 of 315 judged (`storybook-build/fail-empty-index`), every plant as expected; appended to `plants.md` |

Not run here: the whole suite at the fix commit and the TDD check (`tdd-check.sh 4`), which the orchestrator runs
before the next review round; the full plant, visual and unit runs stay with CI (CI-first).
