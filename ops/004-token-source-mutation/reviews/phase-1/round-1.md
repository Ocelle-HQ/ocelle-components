---
phase: 1
round: 1
verdict: approved
base: 7cb34304e8d4e096fbdcd869367b7906c7e971c1
head: ac207279317142bd9a8de2082857ff6cf92d9903
tdd_check: pass
---

# Phase 1 review, round 1

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | ops/004-token-source-mutation/mutation/README.md:31-32, :115-125 | Entries `121-180` (578 s) and `181-230` (188 s) exceed the 176 s local bound. OR-006 and op.md acceptance 4 allow this if the time goes to the operator as a CI risk, and the README does that in § CI risk. This op's own gate run is not affected (69 s, changed lines only). A later change that touches most of lines 121-180 would exceed the 10-minute `mutation-shard` limit in CI. | None for this phase. The operator decides on a per-shard mutant bound (outside OR-008). |
| R1-02 | note | ops/004-token-source-mutation/mutation/README.md:46-75 | The 121 Timeouts are explained with one hand-applied mutant for each of the three groups, as plan.md *Timeouts* and T010 ask. I checked the grouping against the JSON reports. All 121 are `StringLiteral -> ""`: 65 on `group`, 53 on `value` of type/space/shape/size/shell/motion records, and 3 on elevation themed values (lines 209 and 224). That matches the README. `source-table.test.ts` asserts every token's group and value, so every member of each group is covered by the same assertion that fails for its representative. | None. |
| R1-03 | note | packages/tokens/test/source-form.test.ts:33 | An offender is reported at the line where the asserted expression starts, not where the `as`/`satisfies` keyword is. Against the base, `records` reports "line 27", the opening `[`, while the `as const satisfies` is at the end of the list. The test still names each offender and fails correctly. | Optional: report `child.type`'s position or the keyword's position. |
| R1-04 | note | ops/004-token-source-mutation/reviews/phase-1/tdd-check.json | `head` is `90b1b6a`, and HEAD is `ac20727`. `ac20727` only adds the check's own evidence files (`git show --stat ac20727`), so the check is current for the code. | None. |

No blocking finding.

## Test quality

- **Red evidence.** Red commit `b5059d2` (`red-commits`: `phase`) adds only `packages/tokens/test/source-form.test.ts`. `red-phase.log`, `check-red-phase.log` and `check-final-tests-on-base.log` show exactly one failure, at `source-form.test.ts:53`. I reran the red test against the base in a scratch worktree. It fails on the assertion with all four declarations named, `records: SatisfiesExpression`, `records: AsExpression`, `main: AsExpression`, `stateGrounds: AsExpression`, `chrome: AsExpression`, and with no import or parse error. That is the missing behaviour, which acceptance 1 and T005 require.
- **Unchanged since red.** `git diff b5059d2..HEAD -- packages/tokens/test` is empty. No other test file changed since base, so SC-001's "no existing test changed" holds.
- **Non-vacuity.** The test fails when a declaration is missing, because a missing initializer becomes an offender rather than a skip. It also asserts that the `records` initializer holds `"color-canvas"` and `"#F1EEE8"`, so it cannot pass on an empty or wrong subtree. It has no conditional assertion, no `skip`/`only`, no snapshot and no mock.
- **Under Stryker.** Each entry's initial test run passed (README:41-42, and every `entry-*.txt` ends `exit=0`), so the test also holds on the instrumented sandbox copy.
- **Kill-tests.** None were needed. The pre-red measurement (`mutation/pre-red/`) had 681 mutants: 552 Killed, 129 Timeout, 0 Survived. I recounted this from the JSON reports.
- **Whole-file run (acceptance 2, OR-005).** I recounted from the four JSON reports: `1-60` 135 Killed; `61-120` 202 Killed; `121-180` 127 Killed and 97 Timeout; `181-230` 96 Killed and 24 Timeout. There are 0 Survived, 0 NoCoverage and 0 CompileError, as the README says. The `source` embedded in every report is byte-identical to the HEAD `source.ts`, so the runs used the final source.
- **SC-001.** I checked this independently. Every line of `source.ts` that holds a string literal outside a comment carries at least one mutant in the reports. The only exceptions are the three import lines (8-10) and the doc comment at line 12.
- **Mutation gate.** `pnpm run gate:mutation -- --base 7cb34304…` exits 0: "10 mutants on the changed lines of 1 file, none survived; 0 equivalent records". There are no equivalent-mutant records to judge.
- **TDD check.** `tdd-check.json` is `pass`, with no problems. The red commit exits 1, the final tests exit 1 on the base and 0 on HEAD. There is no scaffold.

## Checks run

All runs used Node 22 in the container, with `OCELLE_CHROMIUM_PATH` set and `PLAYWRIGHT_BROWSERS_PATH` pointing at the scratchpad alias. They ran one at a time.

| Check | Result |
|---|---|
| `pnpm test` (all Vitest projects, including browser) | exit 0, 2038 tests in 97 files |
| `gate:typecheck` | exit 0. The `@ts-expect-error` at `packages/tokens/test/index.test.ts:27` is still used, so `TokenName` is still a literal union (acceptance 3, OR-002) |
| `gate:lint`, `gate:style-lint`, `gate:test-lint` | exit 0, no finding |
| `pnpm -r build && gate:csp`, `gate:prefix` | exit 0, no finding |
| `gate:config-copies`, `gate:pins`, `gate:contrast`, `gate:brand-rules` | exit 0 |
| `gate:signoff -- --range 7cb3430..HEAD` | exit 0, 3 commits |
| `gate:mutation -- --base 7cb34304…` | exit 0, 10 mutants, none survived |
| `gate:plants` | exit 0, 184 plants of 13 gates as expected |
| OR-004 rebuild | I built `@ocelle/tokens` at the base in a scratch worktree and ran `cmp` against HEAD's `dist/`. `tokens.css`, `tokens.json` and `index.d.ts` are identical |

**Tasks.** T001 to T015 are all ticked, and I found each one's work present. T004 was skipped with a reason: no pre-red survivor.

**Scope.** Every changed file is in plan.md *Files to change*. Nothing changed under `gates/`, and no Stryker, Vitest or `package.json` file changed (OR-008). `packages/tokens/src/index.ts` is unchanged.

**Source change.** It matches plan.md *Approach* (`source.ts:22-34`, `:228`). The identity function `tokenRecords<const N extends string>` is unexported. The three ground lists are plain arrays. No record, value or comment beside a record changed. OR-003 was checked by hand: README:89-99 records the TS2561 error for `contrats` and the TS2820 error for `colours`.

**Records (acceptance 5 and 6, OR-007).**
- `specs/002-design-tokens/reviews/phase-2/notes.md` quotes `round-1.md:39` correctly; I compared the line. `round-1.md` itself is unchanged.
- The dated addenda in `data-model.md` (after § Token and after the § Expected tables paragraph) and in `research.md` *Mutation path* keep the original text.
- The `knowledge/speckit-flows/log.md` Update under 2026-11-10 closes the finding and keeps the zero-mutant gate flag open as a candidate.

**Constitution.** II: outputs are byte-identical. VII: semver `none`, and `TokenName` is unchanged. VIII: the red test is first, and every Timeout is explained. I, III, IV and V are not touched. No violation.

## Earlier findings

None: this is round 1.
