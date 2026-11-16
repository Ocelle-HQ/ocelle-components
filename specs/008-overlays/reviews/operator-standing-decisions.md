# Standing operator decisions — 008-overlays

## Phase folds approved in advance (2026-11-15)

- **Decided by:** the operator (MOES-Media), in this session on 2026-11-15: "the folds are approved from here on". It confirms the standing decision relayed by the orchestrator session (session_01NUfZSc26YwQLeow31d6R6X) on 2026-11-15.
- **Applies from:** Phase 4 onward.
- **What it approves:** once a phase's review is approved (or accepted), the orchestrator goes ahead without asking:
  1. it folds the history with `tooling/speckit/bin/fold-history.sh`;
  2. it re-runs `tdd-check.sh` on the folded commit IDs;
  3. it pushes the pre-fold head to `archive/claude/016-overlays-prefold-phase-N`;
  4. it force-pushes `claude/016-overlays` with `--force-with-lease`.
- **Limits:**
  - It covers only this mission's own branch, and only those four steps.
  - If `fold-history.sh` reports a problem, or the folded commits fail `tdd-check.sh`, the orchestrator pushes nothing and reports to the operator.
  - Every other gate and question still goes to the operator as a multiple-choice question.

## No merge of main during the run (2026-11-15)

- **Decided by:** the operator, in the orchestrator session (session_01NUfZSc26YwQLeow31d6R6X). They confirmed it in this session as a multiple-choice question: "Don't merge; /ocelle-land".
- **What it decides:** 008 does not merge `main` during its run. This replaces the run's original "merge main when it moves" instruction, and the orchestrator's request to merge op 015 (ce1d9c72).
- **Who merges, and how:** /ocelle-land merges main, never by rebase, with the resolutions already agreed:
  - take main's `stryker.elements.config.json`;
  - take main's `gates/test/vitest-config.test.ts`;
  - regenerate any conflicting baseline PNG in the pinned container.
- **Reported as:** a known gap in ALL PHASES DONE.

## Feature gate approved (2026-11-16)

- **Decided by:** the operator, asked in this session as a multiple-choice question.
- **Answer:** "Approve". The operator approved the feature at cfef8c0 (all 5 phases reviewed, approved, folded and pushed).
- **Next:** ALL PHASES DONE goes to the orchestrator, and the orchestrator opens the draft PR.

## Merge resolution for gates/test/vitest-config.test.ts (2026-11-16, landing #47)

- **Decided by:** the operator, asked in this session as a multiple-choice question about landing finding L1-02.
- **Answer:** "Take the branch's version".
- **Why:** main's version pins the mutation projects without the branch's `elements-touch` project, so two of its tests fail on the merge.
- **What the branch's version holds:** op 015's two assertions, plus the branch's R-14 tests.
- **What changes:** for this file only, this replaces the 2026-11-15 rule "take main's version". `stryker.elements.config.json` merges cleanly and still equals main's.

## Merge resolution for emulateReducedMotion (2026-11-16, landing #47, landing note L2-01)

- **Decided by:** the operator, asked in this session as a multiple-choice question.
- **Answer:** "Keep main's, convert ours".
- **The clash:** main (mission 013, 23ba5c5) and this branch both add a browser command `emulateReducedMotion`. Main's takes `(mode: "reduce" | "no-preference")`; the branch's takes `(on: boolean)`.
- **What changes:** the merge keeps main's command. The branch's calls are rewritten: `true` becomes `"reduce"` and `false` becomes `"no-preference"`. In the other conflicting files the merge keeps both sides, and `vitest-config.test.ts` follows the decision above.

## Re-sign done, landing fold skipped (2026-11-16, landing #47)

- **Re-sign:** the operator chose "Go ahead, push after checks". 07cf18b was re-signed with `reviews/landing/resign-history.sh`: the archive ref `archive/claude/016-overlays-pre-resign` holds the old head e80215d, and the remap commit is 69561d6. gate:signoff and tdd-check (phases 1-4 pass, phase 5 exempt) were green, recorded in 8d27bc9, before the force-push with lease.
- **Fold:** asked whether to fold the 24 landing commits since the phase 5 fold, the operator chose "Skip the fold". The PR is squash-merged.
