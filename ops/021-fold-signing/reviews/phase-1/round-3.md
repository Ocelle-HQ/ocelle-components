---
phase: 1
round: 3
verdict: changes_requested
base: 34ce2afba10b57e4d2df972f1f9497b283c0b75e
head: ef2ac245
tdd_check: pending
reviewer: human:jeroennouwsdev (operator round, recorded by the orchestrator)
---

# Phase 1, round 3: operator round, the landing findings of PR #53

<!-- Not a reviewer-renata review. The landing review of PR #53 (reviews/landing/round-1.md, blocking finding L1-01 and
notes L1-02, L1-03, L1-04) was put to the operator on 2026-11-17 during the /ocelle-land pass. The answer is quoted
verbatim (the option label the operator chose): "L1-01 + L1-02 + L1-04 + L1-03". L1-05 (R2-01, R2-02) stays a
follow-up; L1-06 is documented in the spec; L1-07 is closed (the orchestrator read #51 and it matches what was built).
The fix round that follows (label fix-3) resolves O3-01 to O3-04, and a phase 1 review round covers it. -->

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| O3-01 | blocking | gates/test/integration/fold-history.test.ts; tooling/speckit/bin/fold-history.sh (main guard) | Landing finding L1-01: no test lets a signed fold through while `origin/main` or `main` exists and reaches nothing in `<base>..HEAD`, the normal case for every real fold. Hand mutants MA (refuse whenever a main ref exists) and MB (count from `$base^`) survive. Operator, answering: "L1-01 + L1-02 + L1-04 + L1-03". | Add a test where `origin/main` (or `main`) points at the fold base or an ancestor and the signed fold succeeds; show MA and MB killed in the fix note. |
| O3-02 | blocking | tooling/speckit/bin/fold-history.sh:123 and :146 (the `plants.md` `- base:` match) | Landing note L1-02: the base-line remap still matches at most 40 hex characters, so a SHA-256 fold exits 0 with `ok:true` and leaves `plants.md` stale. Operator, answering: "L1-01 + L1-02 + L1-04 + L1-03". | Red first: give the SHA-256 test a `plants.md` with a `- base:` line and assert it is remapped; then widen both patterns to 64. |
| O3-03 | blocking | gates/test/integration/fold-history.test.ts (scenarios 3 and 4, the R1-02 test) | Landing note L1-04: three tests assert status, `ok` and state but not the problem text. Operator, answering: "L1-01 + L1-02 + L1-04 + L1-03". | Assert the problem text in each of the three tests. |
| O3-04 | blocking | .claude/skills/ocelle-land/SKILL.md:181 | Landing note L1-03: the skill says a failed fold "exits 1" and the old head "stays as" the prefold ref; failures can now exit 2, and a rolled-back remap deletes the prefold ref. Operator, answering: "L1-01 + L1-02 + L1-04 + L1-03". | Correct that sentence to the script's actual contract (exit 1 verification failure, exit 2 could not run; HEAD on the old head; the prefold ref kept only after a successful rebuild). Docs only. |

## Verdict

changes_requested (operator round).
