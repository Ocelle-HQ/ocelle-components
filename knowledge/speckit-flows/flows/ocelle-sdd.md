---
type: Workflow
title: ocelle-sdd
description: specify, plan, tasks and analyze with operator gates, then implementation by user story with review rounds
resource: /tooling/speckit/workflows/ocelle-sdd/workflow.yml
tags: [spec-kit, workflow]
version: 1.0.0
generated: { by: claude-code/agent, at: 2026-11-02T14:00:00Z }
status: draft
---

# Steps

1. `speckit.specify`, then a gate to review the spec (run `/speckit-clarify` first when it has open questions).
2. `speckit.plan`, then a gate to review the plan and its Constitution Check.
3. `speckit.tasks` and `speckit.analyze`, then a gate to review `tasks.md`.
4. [ocelle-implement](/flows/ocelle-implement.md).

# Run

`specify workflow run ocelle-sdd -i spec="<what to build>"`

# Open questions

- Whether `/speckit-clarify` should be a workflow step rather than advice in the gate message.
