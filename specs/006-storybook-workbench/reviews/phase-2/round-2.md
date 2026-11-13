---
phase: 2
round: 2
verdict: changes_requested
base: 9ae430ccee2cf60beba6dab5a24f4b4a2a2a4908
head: 212ce29
tdd_check: pass
reviewer: human:jeroennouwsdev (operator round, recorded by the orchestrator)
---

# Phase 2, round 2: operator round from the landing review

<!-- Not a reviewer-renata phase review. The /ocelle-land landing review of PR #24 (reviews/landing/round-1.md)
raised findings about what this phase built. On 2026-11-13 the operator chose how to handle them. Recorded as an
operator round so that the fix procedure (label fix-1) and a review round apply. The operator's answers are quoted
verbatim. -->

Operator's answer to "Landing review L1-03 (blocking, FR-001): when the storybook-build gate can't read `.storybook/main.ts` (Storybook raises MainFileEvaluationError), the gate exits 1 with \"storybook/package.json … named no file\". FR-001 asks for exit 2 when the configuration can't be read. A build killed by a signal also exits 1. Which fix?": **"(a) Exit 2 + plant (Recommended)"** ("An unreadable config, or a build ended by a signal, exits 2 (could not run), as FR-001 says. Adds a breaking plant for it. No spec change.")

Operator's answer to "Which of the six notes should also be folded in these rounds?": **"L1-04 axe plan path, L1-05 visual command, L1-07 regex timeouts, L1-08 baselines in PR body"**. Of these, L1-07 belongs
to this phase; L1-04 is phase 4's (its round 3), L1-05 is phase 5's (its round 2) and L1-08 is the PR body.

The question also stated, and the operator did not object: "L1-02 … needs a red test only. This goes to phase 2 with
L1-03."

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| O2-01 | blocking | gates/lib/storybook-build.ts:81 (landing L1-02) | A regex mutant (`\d+` → `\d` in the Vite error location) survives locally and ends as a timeout in CI run 43445129460 (job "Mutation shard (gates/lib/storybook-build.ts:61-90, 30)"). No test has a location with a line of two or more digits. | A test that kills it; no source change expected. |
| O2-02 | blocking | gates/lib/storybook-build.ts:113-115, :150-161; FR-001 (landing L1-03) | An unreadable `.storybook/main.ts` (Storybook's MainFileEvaluationError) exits 1 with a finding that names no file, and a build ended by a signal exits 1. | Operator choice (a): both exit 2 (could not run) as FR-001 says, test-first, plus a breaking plant for it. No spec change. |
| O2-03 | blocking | gates/lib/storybook-build.ts:75, :77, :79 (landing L1-07) | Four regex mutants end as timeouts, both locally and in CI, which count as detected and can hide survivors. | Tests that kill them outright (no timeout). |
