---
type: Workflow
title: ocelle-sdd
description: specify, spec check, plan, plan squad, tasks and analyze with operator gates, then implementation by user story with review rounds
resource: /tooling/speckit/workflows/ocelle-sdd/workflow.yml
tags: [spec-kit, workflow]
version: 1.1.0
generated: { by: claude-code/agent, at: 2026-11-02T14:00:00Z }
status: draft
---

# Steps

1. `speckit.specify`, then [ocelle-spec-check](/flows/ocelle-spec-check.md) (ends with the spec gate).
2. `speckit.plan`, then [ocelle-plan-squad](/flows/ocelle-plan-squad.md), then a gate to review the plan, its Constitution Check and the squad results.
3. `speckit.tasks` and `speckit.analyze`, then a gate to review `tasks.md`.
4. [ocelle-implement](/flows/ocelle-implement.md).

# Run

`specify workflow run ocelle-sdd -i spec="<what to build>"`

# History

- 1.1.0: spec check after specify; adversarial plan squad after plan.
- 1.0.0: specify, plan, tasks, analyze with gates, then ocelle-implement.

# Open questions

- Whether `/speckit-clarify` should be a workflow step rather than advice in the spec gate message.
