---
phase: 3
round: 7
verdict: changes_requested
base: 4ac76fd7fb68ba7c8f15b4bc4177e64b518d56c8
head: 39616dc
tdd_check: pass
reviewer: human:jeroennouwsdev (operator round, recorded by the orchestrator)
---

# Phase 3, round 7: operator round from the landing review

<!-- Not a reviewer-renata phase review. The /ocelle-land landing review of PR #18 (reviews/landing/round-1.md) found
L1-01 (blocking) and L1-02 (note) in the mutation gate, which phase 3 built. On 2026-11-03 the operator chose to fix
both in this pull request. The orchestrator records the decision as an operator round so that the fix procedure
(label fix-7) and a round 8 review apply. The operator's answers are quoted verbatim. -->

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| O7-01 | blocking | gates/lib/mutation/ranges.ts:55-57 (`changedFiles`), used by `--plan` and `--files` | Landing review L1-01: git writes `+++ b/<path>\t` for a path with a space and `+++ "b/<escaped>"` for non-ASCII or special characters; those paths fail `inScope` and are dropped silently, so the gate can pass with changed lines unmutated. Operator: "Fix now, test-first (Recommended)": "The implementer writes a red test on recorded diff output with a tab-suffixed and a quoted header, then decodes the git quoting, or exits 2 on any header it can't parse." | Red test on recorded diff output with a tab-suffixed header and a quoted (octal-escaped) header; then parse both correctly; any `+++` header that is neither a parsable `b/<path>` nor `/dev/null` makes the gate exit 2 (could not run). |
| O7-02 | blocking | gates/lib/mutation/report.ts (changed file absent from the Stryker report) | Landing review L1-02: a changed in-scope file missing from Stryker's report counts as zero mutants and passes. Operator, on which notes to fold: "L1-02 missing file (Recommended)": "A changed file absent from Stryker's report fails the gate instead of counting as 0 mutants." | Red test first; a changed in-scope file with changed lines that is absent from the report makes the gate fail with a located finding (or exit 2 if that is the contract's "could not run"; follow contracts/gate-cli.md and say which). |

## Verdict

changes_requested (operator round).
