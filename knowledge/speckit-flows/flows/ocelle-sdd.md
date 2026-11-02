---
type: Workflow
title: ocelle-sdd
description: specify, spec check, plan, plan squad, tasks and analyze with operator gates, then implementation by user story with review rounds
resource: /tooling/speckit/workflows/ocelle-sdd/workflow.yml
tags: [spec-kit, workflow]
version: 1.3.0
generated: { by: claude-code/agent, at: 2026-11-02T14:00:00Z }
status: draft
---

# Steps

1. `speckit.specify`, then [ocelle-spec-check](/flows/ocelle-spec-check.md) (ends with the spec gate).
2. `speckit.plan`, then [ocelle-plan-squad](/flows/ocelle-plan-squad.md), then a gate to review the plan, its Constitution Check and the squad results.
3. `speckit.tasks`, then `speckit.squad.analyze` (the `/speckit-analyze` analysis, saved as `analysis-report.md`), then the tasks gate showing the severity counts and coverage.
4. [ocelle-implement](/flows/ocelle-implement.md).

# Gates

| Gate | When | Review |
|---|---|---|
| spec (in ocelle-spec-check) | after the spec check | `spec.md`, operator questions in `reviews/spec/` |
| plan | after the plan squad | `plan.md` and its Constitution Check, design artifacts, `reviews/plan/` |
| tasks | after tasks and analyze | `tasks.md`, `analysis-report.md` (resolve critical findings first) |

Approve continues, reject stops; edit files before approving to change anything.

# Run

`specify workflow run ocelle-sdd -i spec="<what to build>"`

# History

- 1.3.0: `link.sh` after specify: the run stops unless an approved mission triage record exists.
- 1.2.0: the analysis is saved to `analysis-report.md` and summarised in the tasks gate.
- 1.1.0: spec check after specify; adversarial plan squad after plan.
- 1.0.0: specify, plan, tasks, analyze with gates, then ocelle-implement.

# Open questions

- Whether `/speckit-clarify` should be a workflow step rather than advice in the spec gate message.
