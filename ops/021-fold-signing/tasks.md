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

- [ ] T001 [US1] In `gates/test/integration/fold-history.test.ts`, add the shared setup of plan.md *Test approach* as local helpers: the temporary repository with a rewritable phase base, the throwaway key file and signing program (`gpg.format ssh`, `user.signingkey`, `gpg.ssh.program`, `commit.gpgsign true`) with its always-fail and fail-on-remap variants, and the `git` wrapper directory that strips `-S` from `commit-tree`. Leave the existing test's assertions unchanged.
- [ ] T002 [US1] In the same file, add the five tests of plan.md *Test approach*, each one `toEqual` on observable facts: (1) every commit of `<foldBase>..HEAD` signed after a fold; (2) an unsigned rebuild exits 1 with an `is not signed` problem and no change; (3) an always-failing signer exits 2 with `ok:false` JSON and no change; (4) a signer failing on the remap commit exits 1, `HEAD` on the old head, no prefold ref; (5) a `main` branch inside the range exits 2 with an `on main` problem and no change.
- [ ] T003 [US1] Commit T001 and T002 alone (`test(op-021): phase 1 red — the fold signs what it rebuilds`, signed off). Run `red.sh 1 phase` and check in `red-phase.log` that each of the five new tests fails on its assertion (not on setup) and that the existing test passes.

### Implementation

- [ ] T004 [US1] In `tooling/speckit/bin/fold-history.sh`, add the signing switch and the main guard (plan.md *Approach* 1 and 2).
- [ ] T005 [US1] In `tooling/speckit/bin/fold-history.sh`, pass `"${sign[@]}"` to `git commit-tree` with the `|| die` on failure, and add the `is not signed` check of every new commit in `map` to the `problems` block (plan.md *Approach* 3 and 4).
- [ ] T006 [US1] In `tooling/speckit/bin/fold-history.sh`, make the remap `git commit` the condition of an `if` and roll back (reset to the old head, delete the prefold ref, `ok:false`, exit 1) when it fails or, with signing on, has no signature header (plan.md *Approach* 5). Update the header comment (*Approach* 6).
- [ ] T007 [P] [US1] In `tooling/speckit/README.md`, add the one phrase of plan.md *Files to change* to the `bin/fold-history.sh` description. Change no other line.

### Checks

- [ ] T008 [US1] Run `pnpm test`, `gate:typecheck`, `gate:lint` and `gate:test-lint`. Record in the phase review that no TypeScript source changed, so `gate:mutation` has nothing to mutate, and that no CI gate changed, so no plant was added.
- [ ] T009 [US1] Run `pnpm run gate:plants -- --affected $(cat ops/021-fold-signing/reviews/phase-1/base.sha)` and save its output in `ops/021-fold-signing/reviews/phase-1/plants.md`.
- [ ] T010 [US1] Check that the op's diff touches only `gates/test/integration/fold-history.test.ts`, `tooling/speckit/bin/fold-history.sh`, `tooling/speckit/README.md` and `ops/021-fold-signing/` (`git diff --stat <base>`): no skill, no `gates/bin/signoff.ts`, no `.github/`, no re-sign script, no other branch.

**Checkpoint**: the five new tests pass after being seen red, the existing fold test still passes, and the diff is
limited to the files above.
