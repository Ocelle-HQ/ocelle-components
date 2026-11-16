# Implementation Plan: Mutation shards of element source get a CI-measured time limit

**Op**: `ops/015-mutation-shard-timeout` | **Date**: 2026-11-15 | **Spec**: [spec.md](spec.md) | **Record**: [op.md](op.md)
**Branch**: `claude/035-mutation-shard-timeout`

## Summary

Add `"dryRunTimeoutMinutes": 30` to `stryker.elements.config.json`. Make the `mutation-shard` job's limit
conditional on the shard holding element source: N minutes if it does, 10 if not. Measure N on CI first, on a draft
PR of mission 008's branch that carries a provisional limit. Pin both changes in tests that are committed red, and
amend the records that state the 10-minute limit.

## Technical Context

- GitHub Actions, `.github/workflows/ci.yml`, `pull_request` trigger. Stryker 10.1.1 with the Vitest runner.
  The elements runs use `stryker.elements.config.json` and `vitest.mutation.elements.config.ts`.
- The plan job's output is one JSON array of `{ files, lines }`. `files` is a single string of comma-separated
  entries (`gates/lib/mutation/shards.ts` `formatPlan`). So `contains(matrix.shard.files, 'packages/elements/src/')`
  is a substring test on that string. It is true for a shard that holds element source, whether or not it also
  holds other entries.
- Job-level `timeout-minutes` may use the `matrix` context. GitHub's context-availability table lists
  `jobs.<job_id>.timeout-minutes` with `github, needs, strategy, matrix, vars, inputs`. The measurement run checks
  this: an elements shard that runs past 10 minutes without being cancelled shows the expression took effect.
- Environment (as in op 004): Node 22 in the container, CI pins 26.13.0. Run `pnpm run setup:offline` if
  `node_modules` is missing. Set `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` for
  `pnpm test`.
- **This session never opens pull requests, pushes or reads GitHub.** The operator's orchestration does the
  measurement's GitHub side: it pushes the scratch branch, opens and closes the draft PR, and reads the run. This
  session prepares the scratch branch locally and records the figures the orchestration relays. See *CI
  measurement*.

## Files to change

| File | Change |
|---|---|
| `gates/test/vitest-config.test.ts` | Red: the test "is stryker.config.json with its own Vitest config and its own report file" also expects `dryRunTimeoutMinutes: 30` in the elements configuration, and no such key in `stryker.config.json`. This is 008's form (`origin/claude/016-overlays`, lines 75-86). The comment above it cites 008 R-15 and this op. |
| `gates/test/ci-workflow.test.ts` | Red: in `slice(0, 10)` of `mutation-shard`, the limit line becomes the conditional expression with the measured N. A new `it` reads that line, extracts N with an anchored regular expression, and expects N ≥ 45 and N > `dryRunTimeoutMinutes` of `stryker.elements.config.json`. The header comment cites op 015 and Q1 to Q3. |
| `stryker.elements.config.json` | Green: `"dryRunTimeoutMinutes": 30`. The key order follows 008's branch. |
| `.github/workflows/ci.yml` | Green: line 89 becomes the conditional expression with N. The comment at lines 64-65, "(at most 10 minutes each, FR-013)", now names both limits: N for shards with `packages/elements/src/` entries, 10 for the rest, citing op 015. |
| `ops/015-mutation-shard-timeout/measurement/README.md` (new) | The measurement evidence and the derivation of N (*CI measurement*). |
| `specs/001-repository-foundation/spec.md` | Dated amendments after FR-013's 2026-11-11 amendment and after SC-005's (*Record amendments*). |
| `specs/001-repository-foundation/contracts/ci-checks.md` | The `mutation-shard` row: `timeout-minutes: 10` per shard becomes the two limits, with a dated note. |
| `gates/README.md` | Line 184, "runs under a 10-minute limit", names both limits. |
| `knowledge/speckit-flows/log.md` | An entry under 2026-11-15 records the cost. |

Unchanged (OR-006): `gates/lib/**`, `gates/*.ts`, `stryker.config.json`, every Vitest configuration, and the copies
of `ci.yml` under `gates/plants/plants/*/`. Those copies are registry-gate fixtures and already differ from the real
workflow. The registry gate compares job ids and names, not limits. Nothing in `specs/008-overlays` changes either:
008 drops its own key when it merges main, on its own branch (#35).

### Input relayed from 008 R-15, checked against the repository (2026-11-15)

The coordinator relayed these points from 008's research R-15 (commit `acefa0d` on `claude/016-overlays`). That
commit is not in the local clone: `origin/claude/016-overlays` is at `ecb51e8`, and `acefa0d` does not resolve.
Each point was checked against main instead:

- The pinned test is `gates/test/ci-workflow.test.ts`, "mutation-shard runs one job per planned shard and passes its
  files value to --files unchanged", line 38. **Confirmed.** It is the red test of *Files to change*.
- The 10-minute limit is written in 001 FR-013 and SC-005, the `ci.yml` comment above `mutation-plan` (lines 64-65)
  and `gates/README.md:184`. **Confirmed.** All four are amended here. 001's `contracts/ci-checks.md` (the
  `mutation-shard` row) states it too, and is amended as well.
- Mission 007's 480 s bound (`specs/007-mutation-gate-strictness/spec.md:133, 219, 299, 321`) bounds the
  `gate:mutation` step of `source.ts` (tokens) shards, and leaves 2 minutes of the 10-minute limit for the job's
  setup. Those shards have no `packages/elements/src/` entry, so their limit stays 10 minutes and the bound is
  unchanged. Nothing in 007 is amended. The FR-013 amendment says so in one sentence.
- No other `ci.yml` job sets `timeout-minutes`. **Confirmed:** `grep` finds only `ci.yml:89`. So GitHub's
  360-minute default applies to every other job, `unit-tests` included. The relay says `unit-tests` and
  `mutation-shard` are the only jobs that run the elements browser suites. 008 timed a full `pnpm test` at
  11 m 16 s in one log and over 30 minutes in another run. `unit-tests` has no limit to raise, so it is out of scope
  here (spec *Out of scope*, "Limits of the other CI jobs"). The figures do confirm that the elements suite alone
  can take tens of minutes on one machine, which supports the measurement and the floor of 45.

## Approach

### CI measurement (Q2 A), before the red commit

The red test pins N, so N must be known before the red commit. The measurement therefore comes first. It changes
nothing on this op's branch.

1. **Scratch branch, prepared locally by this session.** Create `claude/015-measure-elements-shards` from
   `origin/claude/016-overlays`, after `git fetch`. Record 008's head SHA. Make one signed-off commit
   (`chore(op-015): provisional elements shard limit for the CI measurement, not for merge`). It changes only
   `ci.yml:89`, to `    timeout-minutes: ${{ contains(matrix.shard.files, 'packages/elements/src/') && 90 || 10 }}`.
   008's branch already has `dryRunTimeoutMinutes: 30`, so the configuration under test is the one this op lands.
   Do not change 008's tests. Its pinned `ci-workflow.test.ts` will fail the **Unit tests** check on the draft PR.
   That check, and every check other than the mutation jobs, is ignored for this measurement. Do not push. Switch
   back to `claude/035-mutation-shard-timeout`.
2. **Needed from outside (the operator's orchestration).** Push the scratch branch. Open a **draft** PR from it
   against `main`, titled so that it says it is not for merge. Wait for the CI run's mutation jobs to finish. Relay
   these figures to the implementer:
   - the PR number, the CI run id or URL, and the head SHA the run used;
   - for **every** `mutation-shard` job: its `files` value (from the plan job's output), its conclusion, its job
     time (started to completed, queue time excluded) and its `gate:mutation` step time;
   - for every shard with element source: Stryker's dry-run line under the elements configuration
     ("Initial test run succeeded. Ran <n> tests in <time>"), or the error line if the dry run failed;
   - if they can be downloaded, the job logs of the elements shards.

   Then close the PR unmerged and delete the remote scratch branch. If GitHub cannot create the PR's merge commit
   because of a conflict, the orchestration reports it, and the implementer merges `origin/main` into the scratch
   branch locally (008's files win, the provisional line stays) for a second push. On 2026-11-15
   `git merge-tree origin/main origin/claude/016-overlays` merged cleanly.
3. **Recorded by the implementer** in `ops/015-mutation-shard-timeout/measurement/README.md`:
   - who relayed the figures, and when;
   - the PR number, run id, scratch head SHA and 008 base SHA;
   - a table of every shard (files, element source yes/no, conclusion, job time, step time, dry-run time);
   - the worst elements shard job time;
   - the derivation of N;
   - any job logs, saved under `measurement/logs/`.

   An elements shard that ended before its dry run completed is not a measurement. Mark it so, and ask the
   orchestration for a rerun of that job.
4. **N by Q3 A:** N = max(45, ⌈1.5 × W / 5⌉ × 5), with W the worst elements shard job time in minutes. Examples:
   W = 22 m 40 s gives 34 → 35 → 45, and W = 34 m 10 s gives 51.25 → 55.
5. **Stop conditions.** The measurement stops the op, and the implementer reports to the operator before the red
   commit, if:
   - any elements shard is cancelled at the provisional 90 minutes;
   - W exceeds 60 minutes (the triage record's *What would change this decision*: a cheaper dry run is then needed,
     which is a mission);
   - any dry run hits Stryker's 30-minute limit;
   - a shard without element source gets more than 10 minutes, which would mean the expression did not evaluate as
     planned.

   A dry run over 20 minutes is not a stop. It goes into the README and the op report as a risk for the 30-minute
   limit.

### Workflow and configuration (OR-001, OR-002)

- `ci.yml:89`: `    timeout-minutes: ${{ contains(matrix.shard.files, 'packages/elements/src/') && <N> || 10 }}`.
  N is a bare integer and quoted nowhere. Update the comment at lines 64-65.
- `stryker.elements.config.json`: add `"dryRunTimeoutMinutes": 30`. No other key changes.

### Record amendments (OR-005)

- **001 FR-013:** add `- **Amendment, 2026-11-15 (op 015, #35):**` after the 2026-11-11 amendment. The text above
  stands, except that the job time limit is 10 minutes for a shard none of whose entries is under
  `packages/elements/src/`, and N minutes for one that has such an entry. "The 10-minute limit is not raised" now
  holds for the first kind only. The reason: the elements dry run runs every in-process `elements` row whatever the
  shard holds. Cite the sandbox figure (5 m 31 s, 008), the CI figures (W, the worst dry run, the run id), and the
  operator decisions Q1 A, Q2 A and Q3 A (human:jeroennouwsdev, 2026-11-15,
  `ops/015-mutation-shard-timeout/reviews/triage/operator-decisions.md`). Add one sentence: shards without element
  source, and with them 007's 480 s step bound for `source.ts` shards, are unchanged. Also state that
  `stryker.elements.config.json` sets Stryker's dry-run limit to 30 minutes (008 R-15).
- **001 SC-005:** add a matching amendment. "finishes in under 10 minutes" and "Each shard job's 10-minute limit
  (FR-013) enforces it" hold for shards without element source. A shard with element source finishes in under N
  minutes on the same runner, and its N-minute limit enforces it. Cite the same decisions and run.
- **`contracts/ci-checks.md`**, the `mutation-shard` row's limits cell: `timeout-minutes: 10` per shard becomes
  `timeout-minutes: 10` per shard, or N for a shard with a `packages/elements/src/` entry (op 015, 2026-11-15;
  FR-013 amendment).
- **`gates/README.md:184`**: "runs under a 10-minute limit" becomes "runs under a 10-minute limit, or N minutes when
  its entries include `packages/elements/src/` source, whose Stryker dry run may take up to 30 minutes (op 015)".
- **`knowledge/speckit-flows/log.md`**, under `## 2026-11-15` (create the heading at the top if it is missing):
  `* **Finding**:` every elements shard repeats the whole elements dry run (008: 6 of 12 shards, the dry run timed
  in the measurement). Runner minutes grow with each element mission. A cheaper dry run (only the shard's related
  tests, or one shared dry run) is a candidate for the operator, and no issue is filed. Link the op.

## Test approach (red first)

- **Red commit (test files only):** both pinned tests, in `gates/test/vitest-config.test.ts` and
  `gates/test/ci-workflow.test.ts`, with N from the measurement. Run `.specify/extensions/story/scripts/red.sh 1
  phase`. The expected failures are the missing behaviour, and nothing else:
  - the elements-configuration `toEqual` fails because `dryRunTimeoutMinutes` is missing;
  - the `mutation-shard` `slice(0, 10)` fails on line 6, `timeout-minutes: 10`;
  - the new N test fails because its regular expression does not match the old line.

  `stryker.config.json` already lacks the key, so `not.toContain("dryRunTimeoutMinutes")` passes before the change.
  That is by design: it guards OR-001's second half and is not the red evidence.
- **The new N test** asserts on a value it extracts from the real workflow, and compares it with a value read from
  the real configuration. Its regular expression is anchored on the whole line, so it cannot match a looser
  expression. It reads both files from disk, as the existing tests do. No conditional assertion: the test expects
  the match to be non-null, then compares.
- **Green:** the configuration key and the workflow line, then the records. `pnpm test`, `gate:typecheck`,
  `gate:lint` and `gate:test-lint` pass. `gate:mutation -- --base <op base>` changes no package or gate source, so
  it reports nothing to mutate and passes.
- **`tdd-check`:** the final tests fail against the base, because both pinned expectations are new.
- The measurement is not a test. It is the evidence behind the value the test pins (acceptance check 3).

## Constitution Check

| Principle | Status |
|---|---|
| I Framework-free, `ocelle-` names | Not touched. |
| II Tokens only | Not touched. |
| III Accessible by construction | Not touched. |
| IV Strict CSP, offline | Not touched. |
| V Storybook, tests prove behaviour | Pass: the tests assert the real workflow and configuration files. |
| VI Consumer needs, own code | Pass: the work is in the scope of #35. No copied code. |
| VII Semantic versioning | Pass: no public surface, semver `none`. |
| VIII Test-first, non-vacuous | Pass. Both changes are pinned by tests committed red first. The value is measured on CI, as #35 asks. Per-mutant limits are unchanged, so no Timeout or Survived verdict changes. No gate code changes, so no new plant is needed. The mutation plants copy both Stryker configurations (`gates/lib/plant-repo.ts`). |
| Development workflow, merge gates | Pass: **Mutation testing** stays required. Shards without element source keep 10 minutes, so 001 SC-005 and 007 SC-004 still bound them as written. |

No violation, so there is no Complexity Tracking entry.

## Stop conditions

- Any condition of *CI measurement*, step 5: report to the operator before the red commit, and write it into `op.md`.
- The expression turns out not to be accepted at job level, for example if the run rejects the workflow: stop and
  report. A different shape, such as a fixed limit for all shards (Q1 B), is the operator's choice, not this op's.
