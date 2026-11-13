---
phase: 5
round: 2
verdict: changes_requested
base: 0023ed66085eb5d7e6fda93cfd50b3ca3f47e932
head: 212ce29
tdd_check: pass
reviewer: human:jeroennouwsdev (operator round, recorded by the orchestrator)
---

# Phase 5, round 2: operator round from the landing review

<!-- Not a reviewer-renata phase review. The /ocelle-land landing review of PR #24 (reviews/landing/round-1.md)
raised findings about what this phase built. On 2026-11-13 the operator chose how to handle them. Recorded as an
operator round so that the fix procedure (label fix-1) and a review round apply. The operator's answers are quoted
verbatim. -->

Operator's answer at phase 5's fold gate (2026-11-13) to "Phase 5's review note R1-01: decision 32's wording \"the
first element feature (#17 or #7)\" is stale. … How should this be handled?": **"Fix at landing (Recommended)"**
("Leave phase 5 as approved. At landing (/ocelle-land), amend decision 32 to say the row and the sunset are closed by
005 (#17), drop the deferred row and correct research.md, test-first, so CI on this push stays as is.").

Operator's answer to "Which of the six notes should also be folded in these rounds?" (the landing notes): **"L1-04 axe plan path, L1-05 visual command, L1-07 regex timeouts, L1-08 baselines in PR body"**.
Of these, L1-05 belongs to this phase.

The question also stated, and the operator did not object: "L1-01: specs/001-repository-foundation/contracts/ci-checks.md
lacks the three new checks, the plants jobs and the 17→18 counts. This goes to phase 5 with the #17 wording."

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| O2-01 | blocking | gates/README.md:194 ("Deferred gates" row), research.md:676, specs/001-repository-foundation/plan.md manifest sunset; plan.md decision 32 (phase-5/round-1.md R1-01) | Mission 005 (#17) already delivered the manifest gate and a strict-CSP browser test for the elements (packages/elements/test/browser/serve.ts), so "the first element feature (#17 or #7)" is stale. | Amend decision 32 to say the row and the sunset are closed by 005 (#17); drop the deferred row; correct research.md; test-first. |
| O2-02 | blocking | specs/001-repository-foundation/contracts/ci-checks.md:14-28, :49-57, :59-67 (landing L1-01) | The CI checks contract lacks Storybook build, Visual regression and Accessibility, the split plant job (plants-plan, plants-shard as helper jobs), and the counts (eighteen required checks), and has no note that the operator adds the three checks to main's ruleset. | Bring the contract in line, with a test where the repository's contract tests reach it. |
| O2-03 | blocking | gates/gates.json:126, gates/README.md:39 (landing L1-05) | The visual command is given without the `--remove-docker-image` that ci.yml:217 and contracts/gates.md:38 pass. | Match the command, test-first where a test reaches it. |
