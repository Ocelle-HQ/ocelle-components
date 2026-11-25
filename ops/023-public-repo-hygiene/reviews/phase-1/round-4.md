---
phase: 1
round: 4
verdict: changes_requested
base: ac12998241af8a86f9a88c043654457e41b14b53
head: 15f8a177
tdd_check: pending
reviewer: human:jeroennouwsdev (operator round, recorded by the orchestrator)
---

# Phase 1, round 4: operator round, the focused runner redacts and the gate ignores .gitattributes

<!-- Not a reviewer-renata review. The landing review of PR #80 (reviews/landing/round-1.md, blocking finding L1-01
and note L1-02) was put to the operator on 2026-11-25 during the /ocelle-land pass. The answers are quoted verbatim
(the option labels the operator chose). The fix round that follows (label fix-4) resolves O4-01 and O4-02, and a
phase 1 review round covers it. Notes L1-03 to L1-06 stay notes. -->

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| O4-01 | blocking | gates/bin/story-evidence.ts (its log and JSON writers, `safeLog`); red.sh and tdd-check.sh hand off to it when `focused_runner` is set | Landing finding L1-01: since main's op 025 (#78) set `focused_runner: "gates/bin/story-evidence.ts"`, red.sh and tdd-check.sh (both copies) exec the focused runner before op 023's redaction in `story_run_tests_at` and `emit`. story-evidence.ts writes `red-*.log`, `check-*.log` and `tdd-check.json` itself and strips only the worktree and repository paths, so the pnpm store path under the sandbox home leaks into new evidence again (FR-007, SC-003, scenario 6). Operator, answering: "Fold, test-first (Recommended)". | Red test first (label fix-4) with `focused_runner` set, asserting that every log and the JSON record the focused path writes hold only the op's placeholders; then make the focused path redact with the same rule and placeholders as `tooling/speckit/bin/redact-sandbox-paths.sh` (one rule, not a second copy that can drift). |
| O4-02 | blocking | gates/lib/sandbox-paths.ts (the `git grep` arguments) | Landing note L1-02: `git grep -I` also skips any file a `.gitattributes` marks `binary` or `-diff`, or one starting with a NUL byte, so one committed `*.log -diff` line turns a finding into exit 0 and widens the exemption beyond the four allowed files. Operator, answering: "Fold L1-02 too". | Red test first (in the same fix-4 red commit): a tracked text file holding a sandbox path under a `.gitattributes` that marks it `-diff` or `binary` must still give exit 1. Then scan so that `.gitattributes` cannot exempt a file (for example `--text`/`-a`, or by deciding binary from content alone), keeping true binary files out and the exit 0/1/2 contract. Update the rule's description where the op records it (op.md, spec FR, gates/README.md, ci-checks contract) if its wording changes. |

## Verdict

changes_requested (operator round).
