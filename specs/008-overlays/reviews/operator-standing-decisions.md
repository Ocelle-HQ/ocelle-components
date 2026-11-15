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
