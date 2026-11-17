---

description: "Task list for op 021: the history fold signs the commits it rebuilds"
---

# Tasks: The history fold signs the commits it rebuilds

**Input**: `ops/021-fold-signing/` (op.md, spec.md, plan.md)

**Tests**: Required. Write them test-first, per constitution VIII and plan.md *Test approach*. The story's tests go
in the phase's red commit.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, the op's one story

---

## Phase 1: The history fold signs the commits it rebuilds

**Goal**: with `commit.gpgsign` on, `fold-history.sh` signs every commit it rebuilds, refuses an unsigned or
unsignable result without moving the branch, and refuses a range that holds commits reachable from main. With
signing off it behaves as today.

**Independent Test**: `gates/test/integration/fold-history.test.ts` passes after its five new tests are seen red.

### Tests (red first, one test-only commit)

- [X] T001 [US1] In `gates/test/integration/fold-history.test.ts`, add the shared setup of plan.md *Test approach* as local helpers: the temporary repository with a rewritable phase base, the throwaway key file and signing program (`gpg.format ssh`, `user.signingkey`, `gpg.ssh.program`, `commit.gpgsign true`) with its always-fail and fail-on-remap variants, and the `git` wrapper directory that strips `-S` from `commit-tree`. Leave the existing test's assertions unchanged.
- [X] T002 [US1] In the same file, add the five tests of plan.md *Test approach*, each one `toEqual` on observable facts: (1) every commit of `<foldBase>..HEAD` signed after a fold; (2) an unsigned rebuild exits 1 with an `is not signed` problem and no change; (3) an always-failing signer exits 2 with `ok:false` JSON and no change; (4) a signer failing on the remap commit exits 1, `HEAD` on the old head, no prefold ref; (5) a `main` branch inside the range exits 2 with an `on main` problem and no change.
- [X] T003 [US1] Commit T001 and T002 alone (`test(op-021): phase 1 red — the fold signs what it rebuilds`, signed off). Run `red.sh 1 phase` and check in `red-phase.log` that each of the five new tests fails on its assertion (not on setup) and that the existing test passes.

### Implementation

- [X] T004 [US1] In `tooling/speckit/bin/fold-history.sh`, add the signing switch and the main guard (plan.md *Approach* 1 and 2).
- [X] T005 [US1] In `tooling/speckit/bin/fold-history.sh`, pass `"${sign[@]}"` to `git commit-tree` with the `|| die` on failure, and add the `is not signed` check of every new commit in `map` to the `problems` block (plan.md *Approach* 3 and 4).
- [X] T006 [US1] In `tooling/speckit/bin/fold-history.sh`, make the remap `git commit` the condition of an `if` and roll back (reset to the old head, delete the prefold ref, `ok:false`, exit 1) when it fails or, with signing on, has no signature header (plan.md *Approach* 5). Update the header comment (*Approach* 6).
- [X] T007 [P] [US1] In `tooling/speckit/README.md`, add the one phrase of plan.md *Files to change* to the `bin/fold-history.sh` description. Change no other line.

### Checks

- [X] T008 [US1] Run `pnpm test`, `gate:typecheck`, `gate:lint` and `gate:test-lint`. Record in the phase review that no TypeScript source changed, so `gate:mutation` has nothing to mutate, and that no CI gate changed, so no plant was added.
- [X] T009 [US1] Run `pnpm run gate:plants -- --affected $(cat ops/021-fold-signing/reviews/phase-1/base.sha)` and save its output in `ops/021-fold-signing/reviews/phase-1/plants.md`.
- [X] T010 [US1] Check that the op's diff touches only `gates/test/integration/fold-history.test.ts`, `tooling/speckit/bin/fold-history.sh`, `tooling/speckit/README.md` and `ops/021-fold-signing/` (`git diff --stat <base>`): no skill, no `gates/bin/signoff.ts`, no `.github/`, no re-sign script, no other branch.

### Operator round 3 (from the landing review)

Source: `reviews/phase-1/round-3.md` (O3-01 to O3-04, operator answer of 2026-11-17: "L1-01 + L1-02 + L1-04 +
L1-03"), from `reviews/landing/round-1.md` (L1-01 to L1-04). Run through the fix procedure (phase 1, round 3). The
round's tests go first, in one test-only commit recorded as `fix-3`. O3-02 makes that commit red. O3-01 and O3-03
add coverage for behaviour that is already right, so they pass at the red commit. O3-04 is docs only. plan.md
*Operator round 3* holds the detail.

#### Tests (red first, one test-only commit, label `fix-3`)

- [ ] T011 [US1] O3-01: in `gates/test/integration/fold-history.test.ts`, add a test where the main guard passes with main refs present (spec.md edge case "never refuses wrongly"). Use `signedRepo("ok")`, then `git update-ref refs/remotes/origin/main <foldBase>` and `git branch main <foldBase>`, so both refs exist and neither reaches a commit of `<foldBase>..HEAD`. Run the fold and assert, in one `toEqual`: exit 0, `ok:true`, `problems` `[]`, base.sha rewritten, both main refs still at `foldBase`, and no unsigned commit in `<foldBase>..HEAD`. The test passes against the phase's code. It must fail under hand mutants MA (`(( on_main == 0 )) || die …` -> `die …`) and MB (`"$base..$old_head"` -> `"$base^..$old_head"` in the first count). T017 records both.
- [ ] T012 [US1] O3-02: in the same file, give `signedRepo` an optional `plants` flag. It defaults to off, so the earlier tests run exactly as before. When it is on, `${reviews}/plants.md` is written with the base.sha evidence, before the green commit, and holds a `- base: <phaseBase>` line between two fixed other lines. Call `signedRepo("ok", "sha256", …)` with the flag in the SHA-256 test (R1-03) and add two fields to its `toEqual`: `plants.md`'s `- base:` line equals `- base: <new base.sha>`, and every other line of `plants.md` is unchanged. Keep its other expected values (`commits: 4` included). The test is red today: the fold exits 0 with `ok:true` and leaves the 64-character base line stale.
- [ ] T013 [US1] O3-03: in the same file, add the problem text to the `toEqual` of three tests. Scenario 3 gets a problem matching `could not build the folded commit`. Scenario 4 and the R1-02 test get a problem matching `the remap commit could not be signed`. Use the same form as scenario 5 (`problems.some((p) => p.includes(…))` asserted `true`). Change no other expected value. These pass against the phase's code.
- [ ] T014 [US1] Commit T011 to T013 alone (`test(op-021): phase 1 review round 3 red`, signed). Run `.specify/extensions/story/scripts/red.sh 1 fix-3`. It must report `"recorded": true`. Check in `red-fix-3.log` that the only failing test is the SHA-256 test, and that it fails on its `toEqual` because the `plants.md` base line is stale, not on a setup error. Every other test passes, T011 and T013 included.

#### Fixes (one fix commit)

- [ ] T015 [US1] O3-02: in `tooling/speckit/bin/fold-history.sh`, widen the `- base:` patterns from `{7,40}` to `{7,64}`. That is the `sed` match of the remap (`:123`) and both `grep` matches of `base_line_only` (`:146`). Change nothing else in the script. T012 now passes.
- [ ] T016 [P] [US1] O3-04: in `.claude/skills/ocelle-land/SKILL.md`, replace the sentence at `:181` ("On failure it leaves HEAD on the old head and exits 1. The old head stays as `refs/ocelle/prefold/landing/<branch>`.") with the script's contract. On failure HEAD is on the old head: exit 1 when a verification failed, exit 2 when the fold could not run. The old head is kept as `refs/ocelle/prefold/landing/<branch>` only once the rebuilt commits have passed their checks, and a failed or unsigned remap commit removes it again. Change no other line of the skill, and no other skill (`ocelle-run` stays as it is).

#### Checks and record

- [ ] T017 [US1] Run the checks of T008. Run the hand mutants against `fold-history.test.ts` on a throwaway copy, then revert or remove it: MA and MB (T011), each widened pattern of T015 put back to `{7,40}` one at a time (T012), and an early unrelated `die` in place of the `commit-tree` one plus another problem text in place of the remap one (T013). Each must be killed. Run T009 again. `plants.md` changes only if its output changes.
- [ ] T018 [US1] Check the op's diff as in T010, with `.claude/skills/ocelle-land/SKILL.md` added to the allowed files. The skill's diff must be the one sentence of T016. Every other skill, `gates/bin/signoff.ts` and `.github/` are untouched.
- [ ] T019 [US1] Write `ops/021-fold-signing/reviews/phase-1/round-3-fixes.md` (`| ID | Resolution | Red test | Where |`, one row for each of O3-01 to O3-04, and the hand mutant table of T017). Commit the fixes, the note and any new evidence together (`fix(op-021): phase 1 review round 3`, signed and signed off). Do not edit `round-3.md` and do not write a verdict: the next phase 1 review round decides.

**Checkpoint**: the five new tests pass after being seen red, the existing fold test still passes, the round 3
tests pass after `fix-3` is seen red, and the diff is limited to the files above.
