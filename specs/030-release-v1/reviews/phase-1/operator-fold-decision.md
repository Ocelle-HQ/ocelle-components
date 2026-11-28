# Operator decision: phase 1 stays unfolded (030)

Asked by the run, answered by the operator (multiple choice), 2026-11-28.

**Situation.** Phase 1 is approved (round-1.md). `fold-history.sh` keeps only the red commits listed in
`red-commits`, and `red.sh` wrote none: the red evidence of `1a24aa0b` was accepted by operator decision
(operator-red-decision.md). A fold would therefore fold `1a24aa0b` into the green commit, and the decision would point
at a commit that no longer exists.

**Options asked:** keep phase 1 unfolded / hand-write a red-commits entry and fold / fold fully, losing the red commit.

**Decision: keep phase 1 unfolded.** This is the same as phase 0. The phase's commits stay as they are and nothing is
force-pushed. Review note 1 (add `storybook/package.json` to the R-15 version-bump list) is carried to US5.
