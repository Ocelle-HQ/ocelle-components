---

description: "Task list for op 023: public repository hygiene (sandbox paths and SECURITY.md)"
---

# Tasks: Public repository hygiene (sandbox paths and SECURITY.md)

**Input**: `ops/023-public-repo-hygiene/` (op.md, spec.md, plan.md)

**Tests**: Required. They are written test-first, per constitution VIII and plan.md *Test approach*. The story's
tests go in the phase's red commit. The gate check is test-first and has plants.

**Operator constraints**: no git history rewrite. CI first: locally only the fast gates and
`pnpm run gate:plants -- --affected <phase base>`. Every commit is signed off (`git commit -s`). No file of the op
holds a line that matches the rule (op.md *The rule*). Every sandbox path in a test is built at run time.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, the op's one story

---

## Phase 1: Public repository hygiene (sandbox paths and SECURITY.md)

**Goal**: the branch's tracked files hold no sandbox path outside the four allowed files. The `Sandbox paths`
check refuses new ones, the story scripts write redacted logs and records, and `SECURITY.md` names GitHub private
vulnerability reporting as its only channel.

**Independent Test**: the tests of plan.md *Test approach* pass after they are seen red, and
`pnpm run gate:sandbox-paths` exits 0 on the branch.

### Scaffold (only if a missing module would make the red tests fail to load)

- [X] T001 [US1] Run `base.sh 1`. Commit the scaffold of plan.md *Test approach*. It holds `gates/lib/sandbox-paths.ts` and `gates/bin/sandbox-paths.ts` with neutral bodies, `expandMarkers` and `buildTrackedTree` stubs in `gates/lib/plant-repo.ts`, and a pass-through `tooling/speckit/bin/redact-sandbox-paths.sh` (executable). It changes no test file and holds no registry, CI, plant or story-script change. Use `chore(op-023): phase 1 scaffold`, signed off, and run `scaffold.sh 1`.

### Tests (red first, one test-only commit)

- [X] T002 [P] [US1] Write `gates/test/sandbox-paths.test.ts` (plan.md *Test approach* 1): the rule table as one `toEqual`, `allowedFiles`, `grepArgs`, `parseGrep` (a path with `:` and one with a space, with no echoed text) and `verdict` for git exits 0, 1 and 128 and for zero tracked files.
- [X] T003 [P] [US1] Write `gates/test/integration/sandbox-paths.test.ts` (*Test approach* 2). The fail case expects exactly two findings at `:2` and `:5`. The pass cases cover the four allowed files, an untracked file, an ignored file and a binary file. The exit 2 cases are no tracked file and a root that is not the top of its work tree, each with its cause text. The `git grep -E` run of the rule table must agree with T002's table.
- [X] T004 [P] [US1] Extend `gates/test/plant-repo.test.ts` with `expandMarkers`, and `gates/test/integration/plant-repo.test.ts` with `buildTrackedTree`: the expanded tree is committed, and an empty or missing `tree/` gives no tracked file (*Test approach* 3).
- [X] T005 [P] [US1] Update `gates/test/registry.test.ts`, `gates/test/registry-parts.test.ts`, `gates/test/ci-workflow.test.ts` and `gates/test/gates-readme.test.ts` (*Test approach* 4). The changes are eighteen gates with `sandbox-paths` and the `tracked-tree` form with the new error text, the registry entry, the `Sandbox paths` job, and nineteen required checks with `Sandbox paths` before `Plants`, plus the gate's README row with its seven plants. Change each count test's title with its count. Drop no other expected value.
- [X] T006 [P] [US1] Write `gates/test/integration/redact-sandbox-paths.test.ts` (*Test approach* 5): the three placeholders in order, the kept preceding character, every other byte unchanged, `--in-place` on two files, JSON still parsing, no output line matching the rule, exit 2 on a bad argument, and the script's own source not matching.
- [X] T007 [P] [US1] Write `gates/test/integration/story-redaction.test.ts` (*Test approach* 6), `describe.each` over `.specify/extensions/story` and `tooling/speckit/extensions/story`. It covers the `red.sh` log, the `tdd-check.sh` logs, `tdd-check.json` and its stdout through a `red-commits` label holding a sandbox path, and exit 2 with no log written when the redaction script is missing.
- [X] T008 [P] [US1] Change the FR-032 test in `gates/test/governance.test.ts` (*Test approach* 7). It expects GitHub private vulnerability reporting and none of `@MOES-Media`, "Until then", "Once the repository is public" or "1.0.0". Leave the working-days test and the CODEOWNERS test as they are.
- [X] T009 [US1] Commit T002 to T008 alone (`test(op-023): phase 1 red — sandbox paths and SECURITY.md`, signed off). Run `red.sh 1 phase`. In `red-phase.log`, check that each new or changed test fails on its assertion (not on loading or setup) and that the unchanged tests pass. If a test fails for setup reasons, fix the test, amend the red commit and run `red.sh` again. Do not loosen an assertion.

### Implementation: the gate and the plant form

- [X] T010 [US1] Implement `gates/lib/sandbox-paths.ts` and `gates/bin/sandbox-paths.ts` (plan.md *Files to change*, *The gate*), with the rule text exactly as in op.md and the four allowed files.
- [X] T011 [US1] Implement `expandMarkers` and `buildTrackedTree` in `gates/lib/plant-repo.ts`, add `tracked-tree` to `gates/lib/registry.ts` (the type, `forms` and the error text), and wire `build["tracked-tree"]` in `gates/bin/plants.ts`. Give each process-boundary line its `// Stryker disable next-line all: process boundary, covered by gates-integration: …` record, naming the T004 test.
- [X] T012 [US1] Register the gate: add the `gates/gates.json` entry, `fr020` with its comment, the registry header comment (nineteen checks), the `package.json` script `gate:sandbox-paths`, and the `ci.yml` job `sandbox-paths` (`Sandbox paths`, the same shape as `config-copies`).
- [X] T013 [US1] Add the seven plants of plan.md *Plants* under `gates/plants/sandbox-paths/`, each with its `plant.json` (`why` names the case, fail plants list exactly their `path:line` findings, and the error plant names the cause `no tracked file`). No plant file may hold a sandbox path: use the markers `@SANDBOX_ROOT@` and `@SANDBOX_HOME_USER@`.
- [X] T014 [US1] Commit T010 to T013 (`feat(op-023): sandbox-paths gate and the tracked-tree plant form`, signed off). Run `pnpm run gate:sandbox-paths` on the checkout. It must exit 1 and name only files outside the allowed four. Keep its output in `ops/023-public-repo-hygiene/reviews/phase-1/sandbox-paths-before.txt`, with the finding count on the first line. That is the red evidence of acceptance check 9. The gate does not echo lines, so the file holds no sandbox path.

### Implementation: redaction

- [X] T015 [US1] Implement `tooling/speckit/bin/redact-sandbox-paths.sh` (plan.md *Redaction script*). Its source must not match the rule.
- [X] T016 [US1] Change `common.sh`, `red.sh` and `tdd-check.sh` in `.specify/extensions/story/scripts/` (plan.md *Story scripts*), then copy the three files byte for byte to `tooling/speckit/extensions/story/scripts/`. `diff -r` of the two `scripts/` directories must print nothing.
- [X] T017 [US1] Commit T015 and T016 (`feat(op-023): redact sandbox paths when the story scripts write`, signed off).
- [X] T018 [US1] The one-time redaction (FR-008). Run the command of plan.md *Redaction script* over the tracked files outside the allowed list. Then check three things: `pnpm run gate:sandbox-paths` exits 0; every changed `.json` file parses; and `git diff --word-diff=porcelain` shows only removed matched prefixes and added placeholders. Commit these files alone (`chore(op-023): redact sandbox paths in committed evidence`, signed off). Write the number of files and lines changed into `ops/023-public-repo-hygiene/reviews/phase-1/redaction.md` in the next evidence commit, not in this one.

### Implementation: SECURITY.md and records

- [X] T019 [P] [US1] Rewrite "Reporting a vulnerability" in `SECURITY.md` (plan.md *SECURITY.md*). Leave the other sections unchanged.
- [X] T020 [P] [US1] Add the dated amendments (2026-11-20, op 023, #60) to `specs/001-repository-foundation/spec.md`: FR-020, FR-032 (citing Q1 (a) and Q3 (a) and `triage/decisions/023-q1-q3-security-scope.md`), US4 scenario 3 and SC-006. Each follows the text it amends, and the original text stays.
- [X] T021 [P] [US1] Update `specs/001-repository-foundation/contracts/ci-checks.md`, `contracts/gate-cli.md` and `contracts/plants.md`, and `gates/README.md` (plan.md *Files to change*). The changes are the gate's rows, the `tracked-tree` form, the normal-mode exception for `gates/plants/` and `gates/test/fixtures/`, eighteen gates, nineteen required checks, and the dated note that the ruleset must add `Sandbox paths`.
- [X] T022 [US1] Commit T019 to T021 (`docs(op-023): SECURITY.md and spec 001 for the public repository`, signed off).

### Checks and record

- [X] T023 [US1] Redact the phase's own evidence (plan.md *Own evidence*): run `tooling/speckit/bin/redact-sandbox-paths.sh --in-place` on every file under `ops/023-public-repo-hygiene/reviews/phase-1/` that matches the rule (at least `red-phase.log`). Run the fast gates locally: `pnpm test`, `pnpm run gate:typecheck`, `gate:lint`, `gate:test-lint`, `gate:config-copies` and `gate:sandbox-paths`. Each must exit 0.
- [ ] T024 [US1] Run `pnpm run gate:plants -- --affected $(cat ops/023-public-repo-hygiene/reviews/phase-1/base.sha)` and keep its output in `ops/023-public-repo-hygiene/reviews/phase-1/plants.md`, redacted as in T023. The exit must be 0. If a plant cannot run here for want of a container engine, record that line as it is. CI's Plants check is the verdict. Do not run mutation testing or the full plant job locally (operator constraint: CI first). The review reads CI's Mutation testing and Plants results.
- [X] T025 [US1] Commit the evidence (`docs(op-023): phase 1 evidence`, signed off). Run `pnpm run gate:sandbox-paths` once more at the head. It must exit 0. Draft the run-summary lines for the operator: add `Sandbox paths` to the ruleset on `main` (nineteen names), and give the in-flight branches (missions 018, 019 and 020, op 022 or #57, and #54) one redaction pass before they land.

### Redaction at landing (operator decision 2026-11-20, `triage/decisions/023-landing-redaction.md`)

Added after T001 to T025 were done. The verify mode is test-first: T026 and T027 come before T028. T024 stays open
for its own reason, and these tasks do not depend on it.

- [ ] T026 [US1] Extend `gates/test/integration/redact-sandbox-paths.test.ts` with `describe("--verify")` (plan.md *Test approach* 8, acceptance check 11). Use temporary git repositories with an RFC 2606 identity, `commit.gpgsign=false` and sandbox paths built at run time. The pass cases are `--verify <commit>` and `--verify <from>..<to>` over a commit made by `--in-place` (exit 0, the summary with `2 files changed`). The fail cases each exit 1 with exactly one finding `redact-sandbox-paths: verify: <path>: <reason>`: a wrong placeholder, another word changed, a partial redaction, an added file, a deleted file and a mode change. The exit 2 cases each assert their cause text: an empty commit, a revision that does not resolve, the root commit, `--verify` alone and `--verify` with two arguments. Every case also asserts that no output line matches the rule and that `git status --porcelain` is empty afterwards. Use one `toEqual` per case. Change no existing assertion in the file.
- [ ] T027 [US1] Commit T026 alone (`test(op-023): phase 1 red — redaction verify mode`, signed off). Then run `red.sh 1 <label>` with the label the orchestrator names (plan.md *Risks*, "Red label for T027"). Never use `phase`, which would replace the recorded red commit `25ecc2d`. It must report `"recorded": true`. In `red-<label>.log`, check that each new case fails on its assertion (exit code or cause text) and that the existing cases of the file still pass. If a case fails for setup reasons, fix the test and amend this red commit only, then run `red.sh` again. Do not loosen an assertion.
- [ ] T028 [US1] Implement `--verify` in `tooling/speckit/bin/redact-sandbox-paths.sh` (plan.md *Verify mode*, spec.md FR-011). It reuses the script's `program` for the comparison, compares whole blobs with `cmp`, writes no file or index, and prints no line of a file. Update the usage line and the header comment. Leave the stdin and `--in-place` modes byte for byte as they behave now. The source must still not match the rule (`pnpm run gate:sandbox-paths` exits 0). Then run T026's tests, which must pass. Commit (`feat(op-023): verify mode of the redaction script`, signed off).
- [ ] T029 [US1] Record the sanctioned landing step (plan.md *Landing redaction*, spec.md FR-012, acceptance check 12). It is documentation and has no red test: its check is T028's verify mode. In `.claude/skills/ocelle-land/SKILL.md`, add step 2.9 "Redact the merged tree" with its six points, the sentence in step 2.3 about a `Sandbox paths` red on a branch from before op 023, and the sentence in rule 8 about the step's commit. In `.claude/skills/ocelle-run/SKILL.md` rule 6, add the exception to "Never edit a review, verdict or check file a profile wrote". Also update the **Landing** paragraph of `tooling/speckit/README.md` and the `sandbox-paths` row of `gates/README.md` (the landing step for branches in flight, with `--verify` as its proof). Write no literal sandbox path: use the rule and the placeholders only. `implementer-ivan` does this task, because the two `.claude/skills/` files are outside the planner's scope. Commit (`docs(op-023): the sanctioned landing redaction step`, signed off).
- [ ] T030 [US1] Redact the new evidence as in T023, and run the fast gates of T023 again. Each must exit 0. Redraft the second run-summary line of T025 as in plan.md *Landing redaction*, "Run-summary lines": `/ocelle-land` redacts each in-flight branch's merged tree with the sanctioned step and `--verify HEAD`, and no branch is redacted on its own. Commit the evidence (`docs(op-023): phase 1 evidence for the landing redaction`, signed off). Run `pnpm run gate:sandbox-paths` at the head, which must exit 0.

**Checkpoint**: `Sandbox paths` passes on the branch and fails on each of its fail plants. The story scripts write
redacted logs, and `SECURITY.md` names one private channel. `redact-sandbox-paths.sh --verify` proves that a commit
is only placeholder substitutions, and the landing flow records the sanctioned step that uses it. No commit rewrites
history.
