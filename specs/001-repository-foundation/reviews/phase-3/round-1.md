---
phase: 3
round: 1
verdict: changes_requested
base: 4ac76fd7fb68ba7c8f15b4bc4177e64b518d56c8
head: 9d47f70ca4530314defc598ec9312450d1e03e26
tdd_check: pass
---

# Phase 3 review, round 1

Change under review: `git diff 4ac76fd..9d47f70` (scaffold a160859, red 4e9e27a, green ee60010, T049 885d9bb, T050
fa44df4, tdd-check evidence 9d47f70). The working tree was clean.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | gates/bin/mutation.ts:137-138 (record and `await rm(join(root, reportFile), { force: true })`) | The record on line 137 says "process boundary, covered by gates-integration". That is not true for line 138. Deleting the stale report before each Stryker run is the only thing that stops the gate from deciding on an earlier run's report, and no test covers it. The integration fixture repository is always fresh, and `.gitignore` keeps `reports/` out of it. Removing that call is therefore a surviving, non-equivalent mutant hidden behind a record (constitution VIII, FR-011, FR-012; R-08 limits records to the entry guard and the spawn call). I reproduced it. In a scratch clone with line 138 deleted, every `gates` and `gates-integration` test passes (16 files, 168 tests, `mutation.test.ts` included). Then, on a fixture repository from `gates/test/fixtures/mutation-repo/`, run 1 (`--files gates/lib/other.ts`) passed and wrote `reports/mutation/mutation.json`. I then set `testRunner` in `stryker.config.json` to a runner that does not exist. The HEAD gate exits 2 ("Stryker wrote no report (... Cannot find TestRunner plugin "nonexistent" ...)"). The mutant gate exits 0 ("2 mutants on the changed lines of 1 file, none survived"). This is a false pass of the mutation gate. Line 142 (`output: ...`) has the same kind of gap: it only shapes the error text of a failed run, which no test exercises. | Fix test-first: commit a test that fails while the stale report is still used, then the fix. Either move the report lifecycle (remove, run, read) behind the in-process `MutationTools` seam, where a double with a stale report can show it, or add a `gates-integration` case with a stale report and a Stryker run that writes none (exit 2). Keep a next-line record only on lines whose mutants a test actually kills or that are truly equivalent. |
| R1-02 | note | gates/bin/test.ts:105-118, gates/bin/setup-offline.ts:96, gates/bin/mutation.ts:121-142, gates/lib/spawn.ts:14-30, gates/lib/cli.ts:68-78 | R-08 limits the "process boundary" records to the `import.meta.main` guard and the call that spawns the tool. The 56 records cover whole adapter functions: `run()`, `realTools`, `runVitest`, `processIo`, `main` and the spawn helper. For most of these lines the reason holds: a mutant either breaks every integration run (paths, arguments, stdout wiring) or cannot be observed (temp-dir name and cleanup). A few mutants change only diagnostics and no test kills them. At test.ts:114, `existsSync(...) ? ... : undefined` mutated to `true` turns "no Vitest report (...)" into an `entry()` crash message, still exit 2. At test.ts:118 and mutation.ts:142, the output join is mutated to an empty string. At setup-offline.ts:96, the `\n` join is the phase 2 R1-03 fix, and mutating it reverts the fix without any test noticing. None of these changes a pass/fail decision, so I record them here as accepted, with this reason, not as findings. | Optional: when fixing R1-01, narrow these records, or extract the remaining logic into the tested seam, so that "covered by gates-integration" is true line by line. |
| R1-03 | note | eslint.test.config.ts:14-24 | Point 4, judged. The test lint does not report `void p.then((v) => expect(v).toBe(2))`, an assertion inside a `setTimeout` callback, or `try { expect(...) } catch {}`. I probed this with the repository's config in a scratch workspace; only the plain and assigned `.then` forms and the un-awaited `.resolves` were reported. The first is a form of FR-010's "assertion not awaited". In practice it cannot pass silently: Vitest reports the failed assertion as an unhandled rejection and exits 1, and `classifyVitest` turns that into exit 2 (gates/lib/vitest-report.ts:116-119). I checked the Vitest half of that in a scratch run ("Tests 1 passed", "Errors 1 error", exit 1). The seven SC-004 patterns are each covered by a fixture with its rule. This is not blocking. | Operator decision, optional: add a rule to the test lint, for example `no-restricted-syntax` on `void` and an assertion inside a timer callback in test code, with a plant in phase 4. |
| R1-04 | note | vitest.mutation.config.ts, stryker.config.json | Point 5, judged. All package source is `export {};` (packages/*/src/index.ts), so this phase has no package mutants, and the gate's output cannot show whether Stryker's dry run runs the `elements` browser project. The gate fails closed: a package mutant that no Stryker-run test covers is a `NoCoverage` finding, and a failed dry run exits 2 (report.ts:60-63). R-08's Risk already gives this check to the first element feature. Acceptance scenario 3 is proven end to end for gate source only (integration/mutation.test.ts:44). For package source it is covered only by the in-process scope tests (mutation-ranges.test.ts:12-63). | None for this phase. The phase 4 package-source mutation plants should show a package-source `NoCoverage` finding end to end. |
| R1-05 | note | .specify/extensions/.registry:53, .specify/extensions/.backup/story/story-config.yml:11-15 | Point 6, judged. The `--force` reinstall changed only the registry's `installed_at` timestamp and refreshed the installer backup of the story configuration. FR-006 says the workflow does not read that backup and the config-copies check does not cover it. Both copies of the story configuration and both copies of the review command are byte-identical. `.claude/skills/speckit-story-review/SKILL.md` is a symlink to `.specify/extensions/story/.specify-dev/agent-commands/claude/speckit-story-review/SKILL.md`, which has the step 4 change (T047). | None. |

## Test quality

**Red evidence.** red-phase.log (red commit 4e9e27a, against scaffold a160859) has 77 of 137 tests failing. Every
failure is an `AssertionError`: `toEqual`/`toBe` mismatches on the scaffold's empty returns, and RuleTester "Should
have N errors but had 0". None is an import, syntax or setup error. tdd-check.json: `pass`. Final tests on the base
exit 2 (the new modules do not exist yet, a load error, as expected for new modules). Final tests on the scaffold fail
on assertions (93 of 172). HEAD passes (172).

**T042, recorded under constitution VIII.** T035 (integration/test-lint.test.ts:64, 78, 92), T040
(integration/vitest-mutation-config.test.ts:24) and T041 (integration/mutation.test.ts:46, 65, 82) fail at the red
commit on their existence assertions for `eslint.test.config.ts`, `vitest.mutation.config.ts` and
`stryker.config.json` ("expected false to be true", "expected [ false, false ] to deeply equal [ true, true ]"). Only
the green commit ee60010 creates those files. They are part of the phase's missing behaviour: FR-010's rule set
(R-06) and R-08's runner split. A missing configuration is not a setup error, because the tests load nothing before
the assertion: T040 loads the config with a dynamic `import()` only after it. Point 1:
`git diff --exit-code 4e9e27a..HEAD -- gates/test/integration/` is empty. All three files are byte-identical to the
red commit, so every rule-level assertion is kept unchanged: the eight one-finding fixtures, the pass fixture, the
parse error, the exact project list, the NoCoverage finding, `--files` and the unresolvable base.

**Tests changed after red** (`git diff 4e9e27a..HEAD -- gates/test`):
- Point 2, mutation-records.test.ts:49. The red test "does not list a record two lines or more away" expected the
  record on line 2 to be listed for changed ranges 1 and 8-9. That record's own line (2) did not change, and neither
  did its mutated line (3). The expectation contradicted the rule its two sibling tests state (lines 30 and 40) and
  FR-012's "records in the changed code". The replacement uses changed lines 3 and 6. It expects records 2 and 6 and
  excludes record 4, which sits one line after a changed line and whose mutated line sits one line before one. This
  pins `changedAt` at both edges: widening either bound by one line lists record 4 and fails the test. The old test
  pinned neither edge. The reason is in the green commit message. Judgement: a stricter replacement with a recorded
  reason, not a weakening.
- Additions only, each marked "added: mutation run" or "mutation catch-up": eslint-report.test.ts:141,
  mutation-records.test.ts:99-117, mutation-report.test.ts:134-156, mutation-ranges.test.ts, mutation-shards.test.ts
  (two cases), no-snapshot-only.test.ts, and the T049 cases in cli.test.ts, config-copies.test.ts,
  setup-offline.test.ts and test-command.test.ts. No assertion was removed or loosened.

**Vacuous patterns.** The test lint reports nothing on the 22 test-code files (the full FR-028 test-code set
outside plants and fixtures, counted with `git ls-files`). I found no skip, only, conditional `expect`, snapshot or
assertion on a double. The `if (... === undefined) throw` guards in test-command.test.ts are fixture checks, not
conditional assertions. mutation-fakes.ts doubles answer only the exact git calls and `mutate` entries the gate must
make, and the tests assert the gate's exit code and output.

**Acceptance scenarios.**
- Scenario 1 and 2: test-lint.test.ts, eight fixtures, one per rule.
- Scenario 3: mutation.test.ts:44 (gate source, NoCoverage) and mutation-report.test.ts:25 (Survived and NoCoverage).
  Package source is covered in-process only (R1-04).
- Scenario 4: mutation-records.test.ts:114.
- Scenario 5: mutation-ranges.test.ts:148.
- FR-013: mutation-shards.test.ts.

There are no events or keyboard paths in this phase.

**Scaffold.** a160859 adds the eight modules of T032 with signatures only. Each function returns 0 or an empty value,
the rule reports nothing, the commit adds no test file, and nothing is wired.

**Mutation** (`pnpm run gate:mutation -- --base 4ac76fd`, run by this review): exit 0, "750 mutants on the changed
lines of 15 files, none survived; 61 equivalent records", 3 min 57 s. Point 3, the records, read one by one:
- The 5 empty-catch `BlockStatement` records are true equivalents. With the catch block emptied, control falls
  through to the same result:
  - config-copies.ts:68: implicit `return undefined`.
  - setup-offline.ts:32: `record` stays undefined, and `fields?.level !== "error"` skips it.
  - vitest-report.ts:59, eslint-report.ts:39 and mutation/report.ts:53: `value` stays undefined, which the following
    shape check rejects.
- The 56 "process boundary, covered by gates-integration" records are allowed by R-08 for entry guards and spawn
  calls. Their reason does not hold for mutation.ts:138, which is R1-01 (blocking), and holds only loosely for the
  diagnostic lines listed in R1-02.

**Shard timing (T050).** mutation-shards.md shows three shards (372, 434 and 431 lines) at 108, 106 and 139 s.
None is near 10 minutes.

## Checks run

All checks ran with `PATH=/opt/node26/bin:$PATH` and `OCELLE_CHROMIUM_PATH` set to the preinstalled headless shell
(R-03).

| Check | Result |
|-------|--------|
| `pnpm run setup:offline` | exit 0 |
| `pnpm test` | exit 0, "172 tests passed in 20 files" |
| `pnpm run gate:test-lint` | exit 0, "22 files checked, no finding" |
| `pnpm run gate:config-copies` | exit 0, both story-config copies identical |
| `pnpm exec tsc -p tsconfig.json --noEmit` | exit 0 (no typecheck script yet, run for information) |
| `pnpm run gate:mutation -- --base 4ac76fd` | exit 0, as above |
| Prefix check by grep on the changed non-spec files | no `sk-` name, no `monospace` |
| Mutant probe for R1-01 (scratch clone) | `gates` and `gates-integration` pass with mutation.ts:138 removed; stale-report run exits 0 instead of 2 |
| Test-lint probe for R1-03 (scratch workspace) | `void`, timer and try/catch forms not reported |

**Tasks.** T032 to T050 are all ticked, and their work is present. Nothing outside phase 3 changed except the T049
catch-up of phase 2 gate source, which T049 asks for. T049 is a refactor plus killing tests. It also changes
setup-offline's output join (phase 2 note R1-03, optional, at the process boundary; see R1-02).

**Constitution.** I (`ocelle/` rule id, no `sk-`) holds. II to V do not apply (no elements, styles or stories).
VIII is met except R1-01.

**Plan.** The R-06 config and rules match. R-08 steps 1 to 5 and the runner split match, and so do the
FR-007/T047 story command change and reinstall. The deviation is the scope of the process-boundary records
(R1-01, R1-02).

## Earlier findings

None: this is the first review round of phase 3.
