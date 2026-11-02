---
type: Agent Profile
title: Agent profiles
description: The eight Claude Code subagents that run the flow's roles, each following the matching command file
resource: /.claude/agents/
tags: [agent-profile]
generated: { by: claude-code/agent, at: 2026-11-02T15:40:00Z }
status: draft
---

| Profile | Roles | Tools | Scope role |
|---|---|---|---|
| [triage-tara](/flows/triage-tara.md) | triage | Read, Grep, Glob, Write, Bash | triage |
| analyst-anouk | spec check, analysis after tasks | Read, Grep, Glob, Write, Bash | spec-check, analyze |
| planner-pim | spec fix, squad fix, op setup | Read, Grep, Glob, Edit, Write, Bash | planner |
| lens-lotte | one squad lens | Read, Grep, Glob, Write, Bash | lens |
| refuter-rik | refute | Read, Grep, Glob, Write, Bash | refute |
| verifier-vera | verify | Read, Grep, Glob, Write, Bash | verify |
| implementer-ivan | implement, fix after review | Read, Grep, Glob, Edit, Write, Bash | implement |
| reviewer-renata | review | Read, Grep, Glob, Write, Bash | review |

Named in Spec Kitty's style. A profile's procedure is the command file it names (`.claude/skills/speckit-*/SKILL.md`), so the interactive and the engine runner share it. No Edit tool for read-only roles; Write remains (they write their report), which is why the scope check exists.
