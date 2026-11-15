---

description: "Task list for op 015: mutation shards of element source get a CI-measured time limit"
---

# Tasks: Mutation shards of element source get a CI-measured time limit

**Input**: `ops/015-mutation-shard-timeout/` (op.md, spec.md, plan.md, reviews/triage/operator-decisions.md)

**Tests**: Required. Test-first per constitution VIII and plan.md *Test approach*. The story's tests go in the
phase's red commit.

**Outside this session**: this session never pushes, opens pull requests or reads GitHub. T003 is done by the
operator's orchestration. The implementer prepares its input (T002) and records its figures (T004).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, the op's one story

---

## Phase 1: Mutation shards of element source get a CI-measured time limit

**Goal**: A shard with `packages/elements/src/` entries runs under a job limit of N minutes. N is measured on CI by
the Q3 A rule. Stryker's elements dry run runs under a 30-minute limit. Every other shard keeps 10 minutes, and the
records say so.

**Independent Test**: `gates/test/vitest-config.test.ts` and `gates/test/ci-workflow.test.ts` pass, after being seen
red. `ops/015-mutation-shard-timeout/measurement/README.md` shows that no elements shard was cancelled on the draft
PR's run, and it shows N derived from the worst elements shard job time.

### CI measurement (before the red commit, no commit on the op branch)

- [ ] T001 [US1] Run `git fetch` and record `origin/claude/016-overlays`'s head SHA. Confirm that its `stryker.elements.config.json` has `"dryRunTimeoutMinutes": 30` and that `git merge-tree --write-tree origin/main origin/claude/016-overlays` is clean.
- [ ] T002 [US1] Prepare the scratch branch locally (plan.md *CI measurement*, step 1). Create `claude/015-measure-elements-shards` from `origin/claude/016-overlays`. Make one signed-off commit that changes only `.github/workflows/ci.yml:89`, to `    timeout-minutes: ${{ contains(matrix.shard.files, 'packages/elements/src/') && 90 || 10 }}`. Do not push. Switch back to `claude/035-mutation-shard-timeout`, then hand back to the orchestrator: the branch name, its head SHA, and the list of figures T003 needs.
- [ ] T003 [US1] **Done outside this session, by the operator's orchestration** (plan.md *CI measurement*, step 2):
  - push `claude/015-measure-elements-shards` and open a draft PR from it against `main`, marked not for merge;
  - wait for the mutation jobs to finish;
  - relay the PR number, the run id or URL, and the head SHA;
  - for every `mutation-shard` job, relay its `files` value, conclusion, job time (started to completed) and `gate:mutation` step time;
  - for every shard with element source, relay Stryker's elements dry-run line;
  - relay the elements shards' job logs, if they can be downloaded;
  - then close the PR unmerged and delete the remote branch.

  If the PR cannot be merged because of a conflict, the implementer merges `origin/main` into the scratch branch locally, and T003 repeats.
- [ ] T004 [US1] Record the relayed figures in `ops/015-mutation-shard-timeout/measurement/README.md` (plan.md *CI measurement*, step 3):
  - who relayed them, and when;
  - the PR, run id, scratch head SHA and 008 base SHA;
  - a table of every shard (files, element source yes/no, conclusion, job time, step time, dry-run time);
  - the logs, if any, under `measurement/logs/`.

  Mark any elements shard that ended before its dry run completed as not a measurement, and ask for a rerun of that job.
- [ ] T005 [US1] Derive N = max(45, ⌈1.5 × W / 5⌉ × 5), with W the worst elements shard job time in minutes. Write the derivation in the README. Check the stop conditions of plan.md *CI measurement*, step 5. If one holds, write it into `op.md` and stop: report to the operator, and make no red commit. Record any dry run over 20 minutes as a risk.

### Tests for User Story 1

- [ ] T006 [P] [US1] In `gates/test/vitest-config.test.ts`, the test "is stryker.config.json with its own Vitest config and its own report file" also expects `dryRunTimeoutMinutes: 30` in the elements configuration, and `expect(Object.keys(general)).not.toContain("dryRunTimeoutMinutes")`. Cite 008 R-15 and op 015 in its comment (OR-001).
- [ ] T007 [P] [US1] In `gates/test/ci-workflow.test.ts`, change the 6th line of `mutation-shard`'s `slice(0, 10)` to `"    timeout-minutes: ${{ contains(matrix.shard.files, 'packages/elements/src/') && <N> || 10 }}"`, with N from T005. Add an `it` that finds that line in `job("mutation-shard")` and matches it against an anchored regular expression that captures N. The `it` expects the match to be non-null, and then expects N ≥ 45 and N > `dryRunTimeoutMinutes` read from `stryker.elements.config.json`. Update the header comment: op 015, Q1 A to Q3 A, the measurement README (OR-002, OR-003).
- [ ] T008 [US1] Commit T006 and T007 as the red commit, test files only and signed off. Run `.specify/extensions/story/scripts/red.sh 1 phase`. Confirm that the failures are the missing behaviour, with no import or parse error:
  - the elements-configuration `toEqual` fails on the missing key;
  - the `slice(0, 10)` fails on `timeout-minutes: 10`;
  - the new N test fails on a null match.

### Implementation for User Story 1

- [ ] T009 [US1] In `stryker.elements.config.json`, add `"dryRunTimeoutMinutes": 30`. No other key changes, and `stryker.config.json` stays unchanged (OR-001, OR-006).
- [ ] T010 [US1] In `.github/workflows/ci.yml`, change line 89 to the expression with N. Update the comment at lines 64-65 to name both limits and op 015 (OR-002). No other line changes.
- [ ] T011 [US1] Run `pnpm test`, `gate:typecheck`, `gate:lint`, `gate:test-lint` and `pnpm run gate:mutation -- --base <op base>`. All pass, and the mutation gate has no package or gate source to mutate.
- [ ] T012 [P] [US1] Add the dated amendments (2026-11-15, op 015) after FR-013's and SC-005's 2026-11-11 amendments in `specs/001-repository-foundation/spec.md` (plan.md *Record amendments*). Each cites Q1 A, Q2 A and Q3 A, the sandbox figure, W, the worst CI dry run and the run id. Each also states that shards without element source, and 007's 480 s bound, are unchanged. The original text stays.
- [ ] T013 [P] [US1] Change the limits cell of the `mutation-shard` row in `specs/001-repository-foundation/contracts/ci-checks.md`, and the sentence at `gates/README.md:184`. Both name the two limits and op 015 (OR-005).
- [ ] T014 [P] [US1] Add a `* **Finding**:` entry under `## 2026-11-15` in `knowledge/speckit-flows/log.md`. It records that every elements shard repeats the whole elements dry run (with the measured dry-run time), and it lists a cheaper dry run as an operator candidate, with no issue filed.
- [ ] T015 [US1] Commit the green work (configuration, workflow, measurement evidence, records) signed off, then run `tdd-check`.

**Checkpoint**: acceptance checks 1 to 5 of `op.md` are met, and the phase is ready for review. Mission 008 drops its
own `dryRunTimeoutMinutes` change when it merges main. That happens on 008's branch, not in this op.
