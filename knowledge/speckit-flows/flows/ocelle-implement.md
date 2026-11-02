---
type: Workflow
title: ocelle-implement
description: Runs the per-phase loop for every tasks.md phase that still needs work, one at a time, in order
resource: /tooling/speckit/workflows/ocelle-implement/workflow.yml
tags: [spec-kit, workflow]
version: 1.1.0
generated: { by: claude-code/agent, at: 2026-11-02T14:00:00Z }
status: draft
---

# Steps

1. `units.sh` lists the phases with open tasks or without an approved (or operator-accepted) review.
2. A fan-out with `max_concurrency: 1` runs [ocelle-story](/flows/ocelle-story.md) for each, in `tasks.md` order.
3. `summary.sh --commit` writes the feature's [run summary](/runs/) and commits it.
4. A final operator gate that names the summary.

A rerun skips finished phases, so a stopped run can be started again.

# History

- 1.1.0: run summary step.
- 1.0.0: fan-out over phases and a final gate.
