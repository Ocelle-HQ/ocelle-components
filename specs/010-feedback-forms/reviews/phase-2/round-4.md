---
phase: 2
round: 4
verdict: changes_requested
base: 6c9400cbaa1da7d2b1ce96d496e65101942524a0
head: 684f21a
tdd_check: pending
reviewer: human:jeroennouwsdev (operator round, recorded by the orchestrator)
---

# Phase 2, round 4: operator round, two landing notes on `ocelle-notice`

<!-- Not a reviewer-renata review. The landing review of PR #49 (reviews/landing/round-1.md, notes L1-03 and L1-04)
was put to the operator on 2026-11-17 during the /ocelle-land pass, together with L1-01 (phase 4, round 2). The
answer is quoted verbatim (the option label the operator chose). The fix round that follows (label fix-4) resolves
O4-01 and O4-02, and a phase 2 review round covers it. -->

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| O4-01 | blocking | packages/elements/src/ocelle-notice.ts:343-344 | Landing note L1-03: the equivalent-mutant reason on `super.disconnectedCallback()` says LitElement's method "only tells reactive controllers"; it also calls `__childPart?.setConnected(false)`, which disconnects async directives. The mutant stays equivalent (the notice's template uses no async directive). Operator, answering: "Fold with two notes (Recommended)". | Reword the reason as src/form-control.ts:478 gives it (comment only, no behaviour change). |
| O4-02 | blocking | packages/elements/README.md:160-163 | Landing note L1-04: the tone is shown only by colour (the bar and the ground), and not at all in forced colours; the spec's assumption puts the tone in the host's text, but the README never tells hosts so, and "the ground is never the only mark of the tone" can be read as colour not being the only carrier. Operator, answering: "Fold with two notes (Recommended)". | Test-first: a README assertion in test/node/readme.test.ts that the text must state the tone, because the bar and the ground differ only by colour and not at all in forced colours, red on the current README; then the README sentence. |

## Verdict

changes_requested (operator round).
