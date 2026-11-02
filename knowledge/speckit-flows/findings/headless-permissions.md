---
type: Finding
title: Headless agent steps need permissions
description: claude -p cannot answer permission prompts, so agent steps stall without an allowlist
tags: [spec-kit, claude-code, permissions]
generated: { by: claude-code/agent, at: 2026-11-02T14:00:00Z }
status: draft
---

# Observed

2026-11-02: in a scratch copy, two real `claude -p` steps ran (implement and review). Both read the repository but could not run scripts, write files or commit, and reported what they would have done. Nothing changed.

# Cause

Spec Kit runs each command step as `claude -p <prompt>`, which cannot answer permission prompts.

# Options

- A narrow allowlist in `.claude/settings.json`: file edits, local git without push, the Spec Kit and story scripts, the pnpm scripts; deny push, publish, `reset --hard` and `clean`. Preferred. Waiting on the operator.
- `SPECKIT_INTEGRATION_CLAUDE_EXTRA_ARGS` with a permission mode, for a single run.

# Status

Open.
