---
scope: landing
round: 1
verdict: approved
base: 3828d2fee8dccab6f5c2697f859e2af7247d3378
head: f52e583535d85cff24672c527834024b83e28f7f
tdd_check: pass
---

# Landing review, round 1: PR #37 (op 015, issue #35)

I reviewed the integrated diff `origin/main...HEAD`. Its merge base is `3828d2f`, the tip of `origin/main`, so the
branch is up to date. There are three behaviour-bearing changes:

- `stryker.elements.config.json:10` adds `"dryRunTimeoutMinutes": 30`.
- `.github/workflows/ci.yml:90` changes the `mutation-shard` limit to
  `${{ contains(matrix.shard.files, 'packages/elements/src/') && 45 || 10 }}`. The comment at `ci.yml:64-66` changes
  with it.
- Two gate tests change: `gates/test/ci-workflow.test.ts` and `gates/test/vitest-config.test.ts`.

Everything else is records and evidence: 001 FR-013 and SC-005 amendments, `contracts/ci-checks.md:40`,
`gates/README.md:184`, the op records, the measurement and the flows diary. Nothing under `gates/lib`, `gates/bin`,
`stryker.config.json`, the Vitest configurations, the plants or any `package.json` changed. I read the phase 1
review and the operator decisions as input, and I checked every claim below again on HEAD.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| L1-01 | note | `.github/workflows/ci.yml:90`; `gates/bin/mutation.ts:72-74` | **Two predicates for "element source."** The gate routes a file to `stryker.elements.config.json` with `path.startsWith("packages/elements/src/")`. The workflow picks the limit with GitHub's `contains()` on the comma-joined `files` string (`gates/lib/mutation/shards.ts:111`). That is a case-insensitive substring test. Every path the gate treats as element source also matches `contains()`, so no elements shard can get 10 minutes. The mismatch only works the lenient way: an in-scope path that holds `packages/elements/src/` somewhere other than at its start would get 45 minutes but run the general config. No such path exists, and the only cost would be a longer cancel time. The verdict is unaffected. | None. If the gate's predicate ever changes, the workflow expression has to change with it. One cheap fold would be a comment at `ci.yml:90` naming `elementSource` in `gates/bin/mutation.ts`. |
| L1-02 | note | `ci.yml:90`; CI run 43720951384 | **This PR's own CI does not exercise the new expression.** The diff changes no in-scope source, so `mutation-plan` prints `[]` (locally: `gate:mutation -- --base 3828d2f` gives "nothing to mutate"), and `mutation-shard` is skipped. A green run on f52e583 therefore says nothing about `timeout-minutes` evaluating to 45. The evidence for that is measurement run 43674498025 (`measurement/README.md`). It used the same expression with 90 in place of 45, and 28 elements shards ran past 600 s without being cancelled. That shows the `matrix` context works at job level and the `&&`/`||` form gives a number. Changing 90 to 45 does not change how the expression evaluates. | None. The first element mission PR (009, #15) is the first live run of the 45-minute value. R1-01's mixed shard gets measured there too, as the operator accepted. |
| L1-03 | note | `specs/001-repository-foundation/research.md:405-408` | **R-08 still says every shard job has `timeout-minutes: 10`**, and "the 10-minute shard limit is unchanged". The spec (FR-013, SC-005), `contracts/ci-checks.md` and `gates/README.md` were amended, but research.md was not. op.md's acceptance check 4 does not list research.md, so this is within the approved scope. Still, a reader of R-08 now gets a stale limit. | Optional cheap fold: add one dated amendment line under R-08 pointing to FR-013's 2026-11-15 amendment. |

No blocking finding.

## Correctness and fail-closed behaviour at the gate boundary

- **Timeout ends in failure.** A shard cancelled at either limit ends with result `cancelled` or `failure`. The verdict job
  (`ci.yml:117-123`, unchanged) passes only when `mutation-shard` is `success`, or when it is `skipped` with a plan of
  `[]`. So a shard past 45 minutes fails **Mutation testing**, as FR-013's amendment requires.
- **Expression fallback.** If `matrix.shard.files` were missing or empty, `contains()` would be false and the limit
  would be 10 minutes. That is the stricter value, so the fallback fails closed.
- **The `files` value is a string.** `planOutput` joins the entries with commas (`shards.ts:111`), so `contains()`
  is a substring test. On an array it would be an exact element match, which would never match a path.
- **Mixed shards.** A shard with both element and other entries gets 45 minutes for both of its Stryker runs. That is
  Q1 A as decided. Non-element shards keep 10 minutes, so mission 007's 480 s step bound is untouched.
- **Dry-run key.** `dryRunTimeoutMinutes` is a real option in the pinned Stryker 10.1.1: the schema gives
  `"type": "number", "default": 5`, and `core/dist/src/process/3-dry-run-executor.js:82` reads it. The limit is 30
  and the job limit is 45, so a dry run that hits its own limit fails as a Stryker error inside the job, before the
  job is cancelled. Per-mutant limits (`timeoutMS`, `timeoutFactor`) are unchanged, so no mutant verdict changes.
- **Exit 0/1/2 contract.** No gate code changed. `gate:mutation`'s exit codes and its classification of
  Timeout, CompileError and could-not-run results are as on main.
- **Overlap with existing gates.** `gate:config-copies` passes. The mutation plants copy both Stryker configurations
  (`gates/lib/plant-repo.ts`), so they now run with the 30-minute dry-run limit. That can only delay a plant's
  dry-run cutoff, never make a plant pass that should fail. No gate, check name or job id was added or renamed, so
  `gates.json`, `registry.ts`, the ruleset and the check list need no change.
- **History fold.** The folded commit `a6bf614` has the same tree as the pre-fold head `c4dc602`. `git diff c4dc602
  611d6a7` touches only the remapped evidence files (`base.sha`, `red-commits`, `tdd-check.json`, the check logs).

## Design, accessibility, security

- **Design lens.** There is no new seam or public surface. The one new coupling is L1-01: the workflow's own copy of
  the element-source predicate. Semver `none` is correct, since no package changed.
- **Accessibility.** Not applicable: no package code changed.
- **Security.** The new expression reads `matrix.shard.files` only inside `${{ }}` in `timeout-minutes`. It is not
  interpolated into a script, and `FILES` still reaches the step through the environment (`ci.yml:101-104`). The
  permissions, the pinned actions and `persist-credentials: false` are unchanged.

## Test quality

- **Red evidence.** I recreated the red check on my own: main's tree (`git worktree` at `3828d2f`) with HEAD's two
  test files. Three tests fail, each on an `AssertionError` and none on a setup error:
  - `ci-workflow.test.ts` "passes its files value to --files unchanged" (the deep-equal on the job lines);
  - the new op 015 test ("expected [] to have a length of 1");
  - `vitest-config.test.ts` "is stryker.config.json with its own Vitest config…" (`{…13}` vs `{…14}`).

  This matches `red-phase.log`, `check-final-tests-on-base.log` and `tdd-check.json` (`status: pass`,
  `final_tests_on_base_exit: 1`, `head_exit: 0`, no problems).
- **Red commit has only tests.** `b6a7132` touches only the two test files. `git diff b6a7132..HEAD -- gates/test`
  is empty, so nothing was weakened after red.
- **Assertions can fail.** Both tests read the real files from disk, with no mocks and no snapshots. The job-line
  deep-equal pins the exact expression, and the new test anchors a regex on the whole line, asserts exactly one match
  before reading the capture, and checks `N >= 45` and `N > dryRunTimeoutMinutes`.
  - The `>= 45` check overlaps with the literal pin, but it carries the Q3 A floor and ties N to the config.
  - `not.toContain("dryRunTimeoutMinutes")` on `stryker.config.json` passes on main as well. It is a guard against
    the key spreading to the general config, not red evidence. The plan says so, and the `toEqual` carries the red.
  - Hand-checked mutants of the change: a dry-run value of 50 fails both tests; 10 for elements, `!contains`, or 15
    for the others fails the deep-equal.
- **Mutation.** `gate:mutation -- --base 3828d2f` gives "nothing to mutate": no in-scope source line changed. There
  are no equivalent-mutant records to read, so R-08 is not engaged.
- **Scenario 3** (GitHub's expression engine) cannot run locally. See L1-02 and phase review R1-03.

## Checks run

All on HEAD `f52e583`, in this session:

| Check | Result |
|---|---|
| `vitest run gates/test/ci-workflow.test.ts gates/test/vitest-config.test.ts` | pass, 18 tests |
| the same two final test files on main's tree `3828d2f` | fail, 3 of 18, all assertion failures (expected) |
| `pnpm test` | pass (exit 0) |
| `gate:typecheck` | pass |
| `gate:lint` | pass |
| `gate:test-lint` | pass |
| `gate:config-copies` | pass |
| `gate:pins` | pass |
| `gate:signoff -- --range origin/main..HEAD` | pass, 13 commits |
| `gate:mutation -- --base 3828d2f` | pass, nothing to mutate |

I did not run `gate:plants`, `gate:storybook-build`, `gate:visual`, `gate:axe`, `gate:contrast`, `gate:csp` or
`gate:manifest`. None of their inputs changed, and CI runs them.

**CI.** Run 43720951384 on f52e583 was still in progress when this round was written (18 jobs started, none
finished). This approval assumes that run ends green. A red job in it is a new input for the orchestrator to
classify, not something this round covers. As L1-02 explains, the run's mutation jobs cannot show the 45-minute
branch either way.

## Earlier findings

There is no earlier landing round. I re-checked phase 1 round 1's notes:

- **R1-01** (mixed shard not measured): the operator accepted it on 2026-11-15 (`operator-decisions.md`, "Phase 1
  fold and review note R1-01"). It carries forward in L1-02.
- **R1-02** (no dry-run line relayed): stated openly in the README and both amendments.
- **R1-03** (scenario 3 cannot run locally): it stands, and L1-02 adds that this PR's CI cannot show it either.
