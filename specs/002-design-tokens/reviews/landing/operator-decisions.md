# Operator decisions, landing pass of PR #19

Decided by: human:jeroennouwsdev, 2026-11-04.

## History fold (step 2.8)

Decision: **skip the history fold for PR #19.** Operator: "we should allready do the folds during development we will
lose too much time right now so you can skip the folds". The branch keeps its full history, so every SHA the evidence
names stays on the branch; no force-push. The flow now folds each phase after its approval (`/ocelle-run` step 4.3,
commit "feat(speckit): fold each phase after its approval").
