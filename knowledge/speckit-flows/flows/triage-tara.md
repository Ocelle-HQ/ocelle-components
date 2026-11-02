---
type: Agent Profile
title: triage-tara
description: The triage profile - reads issues and related work, decides the kind and scope of work, writes a triage record, never touches code or GitHub
resource: /.claude/agents/triage-tara.md
tags: [agent-profile, triage, governance]
generated: { by: claude-code/agent, at: 2026-11-02T15:15:00Z }
status: draft
---

# Role

A Claude Code subagent, named in Spec Kitty's style (Spec Kitty projects its profiles, such as planner-priti or reviewer-renata, into `.claude/agents/` the same way).

# Decision rules

mission when public surface changes (semver minor or major), a design decision is open, more than one user story, accessibility or security behaviour, or several packages; op for one bounded change with neither; fold when work in progress covers it; none for duplicates, done or out of scope; decision-needed when only the operator can unblock it. In doubt, mission.

# What to watch

- Ops that turn into missions during op-setup (the plan finds new surface): the rules may be too loose.
- Missions that end with a single small phase: the rules may be too strict.
