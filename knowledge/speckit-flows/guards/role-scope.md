---
type: Guard
title: Role scope and commit guard
description: Deterministic checks that a delegated role touched only its files, and that no code is committed without an approved triage record
tags: [governance]
generated: { by: claude-code/agent, at: 2026-11-02T15:40:00Z }
status: draft
---

| Check | Where | Catches |
|---|---|---|
| `scope-check.sh <role> <base>` | after every delegation in /ocelle-run | a reviewer, lens, refuter or verifier that edited code or artifacts; a planner that wrote source |
| `guard-commit.sh` (PreToolUse hook) | every `git commit` in any Claude Code session in this repository | code committed without an approved triage record linked to the feature; `--no-verify` |
| `link.sh` | after specify, in both runners | a mission feature with no approved mission triage record (the run stops) |

# Evidence

2026-11-02, script tests: the hook passed a docs-only commit and an approved one, and blocked a code commit with no record, with a proposed record, and with `--no-verify`. The scope check flagged files outside the review role and rejected an unknown role. `link.sh` refused without an approved mission record and linked when one existed.

# Known gaps

- The hook matches `git commit` in the command text; a commit made another way (a script the agent writes and runs) is not seen. The allowlist does not allow arbitrary scripts in headless runs.
- The engine runner has no scope check yet.
