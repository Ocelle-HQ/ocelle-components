---
phase: 2
round: 2
verdict: changes_requested
base: d8dba6010eda61df1d65c618df6b713fb3c29640
head: 4b4d41b
tdd_check: pass
reviewer: human:jeroennouwsdev (operator round, recorded by the orchestrator)
---

# Phase 2, round 2: operator round from the landing review

<!-- Not a reviewer-renata phase review. The /ocelle-land landing review of PR #21 (reviews/landing/round-1.md)
raised L1-01 and L1-03 as notes, in code that phase 2 built (T016 packages/styles/scripts/build.ts, T018 the
lineHeight: "token" option of gates/stylelint/token-only.ts). On 2026-11-09 the operator chose to fold both into this
pull request, test-first. Recorded as an operator round so that the fix procedure (label fix-2) and a round 3 review
apply. The operator's answer is quoted verbatim. -->

Operator's answer to "How should they be handled?" (L1-01 and L1-03): **"Fold now, test-first"** ("An operator round
on the phase, a red commit, a fix and a new review round before handoff.").

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| O2-01 | blocking | gates/stylelint/token-only.ts (lineHeight: "token") | Landing review L1-01: under `lineHeight: "token"`, (a) a `font` shorthand with no `/` passes although it resets `line-height` to `normal`; (b) any `var(--ocelle-*)` passes as a line height, so `line-height: var(--ocelle-space-4)` is accepted. FR-002 says every `line-height` in `packages/styles` must be a token reference. | Red test first. Under the option: report a `font` value that is not a CSS-wide keyword and has no `/` part; accept only `--ocelle-line-height-*` token names as a line height (in `line-height` and after the `/` of `font`). Add a fail plant for each case under `gates/plants/style-lint/` (tree `packages/styles/src/x.css`, one `ocelle/token-only` finding at its line). Without the option, behaviour is unchanged. Update research R-07 and the tasks to match. |
| O2-02 | blocking | packages/styles/scripts/build.ts:22-30 | Landing review L1-03: five `Stryker disable next-line all: I/O boundary` records sit on lines that the in-process packages/styles/test/build.test.ts covers, so their mutants could be killed rather than recorded. | Drop the records on those lines (keep the two `import.meta.main` process-boundary records) and make sure build.test.ts kills every resulting mutant; strengthen the test first where a mutant survives. |

## Verdict

changes_requested (operator round).
