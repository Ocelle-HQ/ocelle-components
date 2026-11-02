---
type: Skill
title: /ocelle-run
description: The interactive runner of the flow - the session orchestrates, every role runs as a subagent, every loop decision comes from a script
resource: /.claude/skills/ocelle-run/SKILL.md
tags: [claude-code, skill, orchestration]
version: 1.0.0
generated: { by: claude-code/agent, at: 2026-11-02T15:40:00Z }
status: draft
---

# Why

The operator asked why the flow starts `claude -p` processes when Claude Code has subagents. Trade-off: the Spec Kit engine enforces loops, caps and gates in code and can resume a run; an interactive session with subagents answers permissions live, asks gates in the chat and lets each profile carry its own tool list. Chosen: both, sharing commands, scripts and records, with the hard rules enforced outside the model (scope check, commit hook) so an orchestrating model cannot quietly skip them.

# How it stays honest

- Every role is delegated to its [agent profile](/flows/agent-profiles.md); the orchestrator does not do a role's work.
- Every loop decision comes from a script's JSON; caps are counted from record files.
- [Role scope and commit guard](/guards/role-scope.md) after each delegation and on every commit.
- Gates are AskUserQuestion with fixed options; operator decisions are committed records.

# What to watch

- Steps the orchestrator skipped or merged (compare its records with an engine run of similar size).
- Scope-check failures per profile: a profile that strays needs a sharper prompt or fewer tools.
- Context size on long missions: if the orchestrator loses track, resume from the records.
