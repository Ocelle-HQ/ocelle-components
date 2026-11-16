---
phase: 1
round: 1
verdict: approved
base: 13259eea0ef407d6994e9250fa5d2de94b941f17
head: f61e7e9e4bcaaca150384884ac85e30d2739c758
tdd_check: pass
---

# Phase 1 review, round 1

Change under review: `git diff 13259eea..f61e7e9e` (red commit `b54f1860`, green commit `eaf489ff`, check outputs
`f61e7e9e`; no uncommitted change). Read against `op.md`, `spec.md`, `plan.md`, `tasks.md`, the constitution and
`reviews/triage/operator-decisions.md` (triage Q1 A to Q3 A, op gate, "T002 commit guard", "T002 permission
refusal").

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | `ops/015-mutation-shard-timeout/measurement/README.md:97-102, 126-131` | The mixed shard `overlay.ts:781-798,packages/tokens/src/source.ts` (job 132691676007) was not measured: its default-configuration run failed on 008's own `timeout-minutes: 10` pin, so its elements dry run never ran. N = 45 rests on 37 measured elements shards plus an estimate for this one (about 27 minutes, still under 45 after × 1.5 rounding). The README says a rerun is requested from the operator, and the plan allows marking it "not a measurement". The estimate is reasonable (default run under 1 minute, 007's 480 s bound for `source.ts`), so this does not block, but the first CI run after this op lands is the real measurement of a mixed shard. | None for this phase. The operator may want to confirm the mixed shard's job time on the first element PR after merge. |
| R1-02 | note | `measurement/README.md:146-152`; `specs/001-repository-foundation/spec.md:327-328, 546-547` | Stryker's dry-run line was not relayed for any shard (the gate does not print it), so op.md acceptance check 3's "Stryker's dry-run time" is recorded as an upper bound (the `gate:mutation` step, at most 1049 s) rather than a figure. The gap is stated openly in the README and in both 001 amendments, and the bound is enough to show no dry run approached 30 minutes. | None. |
| R1-03 | note | `gates/test/ci-workflow.test.ts:43, 57-68`; spec.md acceptance scenario 3 | Scenario 3 (a mixed shard gets N; `packages/elements/test/` does not match) is evaluated by GitHub's expression engine and cannot run locally. The tests pin the exact expression string with an anchored regex, which is the strongest local evidence available; the CI run confirms the `matrix` context works at job level (28 elements shards ran past 600 s without cancellation). Not a missing test in the Principle VIII sense. | None. |

No blocking finding.

## Test quality

- **Red evidence.** `red-phase.log` and `check-red-phase.log` (red commit `b54f1860`, exit 1) show exactly the three
  expected failures and nothing else: `ci-workflow.test.ts:35` (`slice(0, 10)` deep-equal on the limit line),
  `ci-workflow.test.ts:57` (new N test, "expected [] to have a length of 1": no line matches the anchored regex), and
  `vitest-config.test.ts:75` (elements configuration `{…13}` vs `{…14}`, the missing `dryRunTimeoutMinutes`). No
  import, parse or setup error. 3 of 3113 failed.
- **Red commit is test-only.** `git show --stat b54f1860`: only `gates/test/ci-workflow.test.ts` and
  `gates/test/vitest-config.test.ts`.
- **No weakening after red.** `git diff b54f1860..HEAD -- gates/test` is empty.
- **Proven against the old code.** `tdd-check.json`: `status: pass`, `final_tests_on_base_exit: 1`, `head_exit: 0`,
  no problems; `check-final-tests-on-base.log` shows the same three failures on base. No `scaffold.sha` exists.
- **Assertions can fail.** The new N test asserts `toHaveLength(1)` on the regex matches before reading the capture
  (no conditional assertion; `?.` only types the access after the length assertion), checks the type of
  `dryRunTimeoutMinutes` read from the real `stryker.elements.config.json`, then `N >= 45` and
  `N > dryRunTimeoutMinutes`. Both files are read from disk; no mocks, no snapshot. The regex is anchored on the whole
  line (`^ {4}…$`), so a looser expression fails it. `not.toContain("dryRunTimeoutMinutes")` on
  `stryker.config.json` passes before and after by design (plan.md *Test approach*); the red evidence for OR-001 is
  the `toEqual`.
- **Scenarios covered.** Acceptance scenarios 1 and 2 have tests; scenario 3 see R1-03; scenarios 4 and 5 are
  evidence and records (op.md *Acceptance*: checks 3 to 5 are not tests). No events or keyboard paths in this op.
- **Mutation.** `pnpm run gate:mutation -- --base 13259eea…` exit 0: "nothing to mutate: no package or gate source
  line changed since 13259eea…". This matches the plan: the op changes only a JSON configuration, the workflow, tests
  and records. No equivalent-mutant records, timeouts, compile errors or zero-mutant lines to read.

## Checks run

All on HEAD `f61e7e9e`, in this session:

| Check | Result |
|---|---|
| `pnpm test` | pass, 3113 tests in 138 files |
| `gate:typecheck` | pass |
| `gate:lint` | pass, 263 files |
| `gate:test-lint` | pass, 173 files |
| `gate:style-lint` | pass |
| `gate:prefix` | pass |
| `gate:csp` | pass |
| `gate:pins` | pass |
| `gate:brand-rules` | pass |
| `gate:config-copies` | pass |
| `gate:signoff -- --range 13259eea..HEAD` | pass, 5 commits |
| `gate:mutation -- --base 13259eea…` | pass, nothing to mutate |

Not run: `gate:plants`, `gate:storybook-build`, `gate:visual`, `gate:axe`, `gate:contrast`, `gate:manifest`. No
element, story, token or gate source changed (`git diff --stat 13259eea..HEAD -- gates/lib 'gates/*.ts'
stryker.config.json 'vitest*' gates/plants` lists only the two test files), so these have no changed input. The
plants copy both Stryker configurations and so pick up the raised dry-run limit, which can only lengthen, not
shorten, the time before a plant's dry run is cut off.

**Tasks.** T001 to T015 are ticked and present: T001 to T005 in `measurement/README.md` and `t003-relay.txt` (T002
and T003 by the operator's orchestrator session per the "T002 permission refusal" decision, scratch head
`860bdd2`); T006 to T008 in `b54f1860` and `red-phase.log`; T009 `stryker.elements.config.json:10`; T010
`.github/workflows/ci.yml:64-66, 90` (only `timeout-minutes` and the comment changed; it is the only
`timeout-minutes` in the file); T011 checks above; T012 `specs/001-repository-foundation/spec.md:318-332, 543-550`;
T013 `contracts/ci-checks.md:40` and `gates/README.md:184`; T014 `knowledge/speckit-flows/log.md:3-4`; T015
`eaf489ff` and `tdd-check.json`. The derivation checks: W = 1082 s = 18.03 min, 1.5 × W = 27.05, rounded up to 30,
max(45, 30) = 45; 28 of 37 shards over 600 s is correct from the per-job figures (the relay's 27 is a miscount, and
the README notes this). No stop condition holds.

**Operator decisions.** Q1 A: the expression keys on `packages/elements/src/` in the files value. Q2 A: draft PR
#36 of 008's head `78fe475` plus the one-line provisional change, closed unmerged. Q3 A: rule applied as above. The
later T002 decisions explain why the scratch branch was built outside this session and why plan.md's `ecb51e8`
differs from the measured `78fe475`.

**Constitution.** I to IV and V's Storybook part: not touched. VII: no public surface, semver `none`. VIII: red
first, not weakened, proven against base; per-mutant limits (`timeoutMS`, `timeoutFactor`) unchanged, so no verdict
changes; no gate code changed, so no new plant is required. Workflow: **Mutation testing** stays required, and
shards without element source keep 10 minutes, so 007's 480 s bound is unaffected. OR-006 holds:
`stryker.config.json`, `gates/lib/**`, `gates/*.ts`, Vitest configurations and plants are unchanged.

**Plan.** Files to change match plan.md's table, plus the evidence files it names. The 001 amendments keep the
earlier text and say what now reads differently. The README line was edited in place, as the plan asks.

## Earlier findings

None; this is round 1.
