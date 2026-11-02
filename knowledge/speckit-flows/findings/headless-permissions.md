---
type: Finding
title: Headless agent steps need permissions
description: claude -p cannot answer permission prompts, so agent steps stall without an allowlist
tags: [spec-kit, claude-code, permissions]
generated: { by: claude-code/agent, at: 2026-11-02T14:00:00Z }
status: stable
---

# Observed

2026-11-02: in a scratch copy, two real `claude -p` steps ran (implement and review). Both read the repository but could not run scripts, write files or commit, and reported what they would have done. Nothing changed.

# Cause

Spec Kit runs each command step as `claude -p <prompt>`, which cannot answer permission prompts.

# Options

- A narrow allowlist in `.claude/settings.json`: file edits, local git without push, the Spec Kit and story scripts, the pnpm scripts; deny push, publish, `reset --hard`, `clean` and reading `.env` files. Chosen.
- `SPECKIT_INTEGRATION_CLAUDE_EXTRA_ARGS` with a permission mode, for a single run.

# Status

Resolved 2026-11-02: the operator approved the allowlist and it is committed as `.claude/settings.json`. Not yet confirmed by a real agent run; the first feature run is the check. Extend the allowlist when a new script or command is added to the flows.
