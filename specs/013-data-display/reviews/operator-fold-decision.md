# Operator decision: phase folds approved from here on

Date: 2026-11-15. Given by the operator in this session ("the folds are approved from here on"), after a relay from the orchestrator session that was not acted on alone.

From phase 3 on, once a phase's review is approved, these steps run without a gate:
- the history fold with `tooling/speckit/bin/fold-history.sh <phase base> specs/013-data-display phase-N`, followed by `tdd-check.sh N` with its outputs committed alone;
- pushing the pre-fold head to `archive/claude/013-data-display-prefold-phase-N`;
- `git push --force-with-lease=claude/013-data-display:<pre-fold head> origin claude/013-data-display`.

If the fold or the tdd-check after it fails, the branch is left unfolded and the operator is asked. Every other gate and question still goes to the operator as multiple choice.
