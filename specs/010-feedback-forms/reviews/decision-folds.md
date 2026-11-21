# Standing operator decision: phase history folds

decided_by: human:jeroennouwsdev
date: 2026-11-15
source: the operator in this session ("the folds are approved from here on"), confirming the standing decision the
orchestrator session (session_01NUfZSc26YwQLeow31d6R6X) relayed on 2026-11-15.

From phase 2 on, once a phase's review is approved, these steps go ahead without a gate question:
- the history fold with `tooling/speckit/bin/fold-history.sh`;
- the archive ref of the pre-fold history (`archive/claude/009-feedback-forms-prefold-phase-N`), pushed;
- the force-push with lease of `claude/009-feedback-forms`.

It covers nothing else. Every other gate and question still goes to the operator as multiple choice. A force-push
of any other branch, or one without a lease, is not covered.
