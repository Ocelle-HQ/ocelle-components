---
type: Spec Kit Extension
title: triage extension
description: Commands and scripts for issue triage and ops
resource: /tooling/speckit/extensions/triage/extension.yml
tags: [spec-kit, extension]
version: 1.0.0
generated: { by: claude-code/agent, at: 2026-11-02T15:15:00Z }
status: draft
---

# Commands

| Command | Writes |
|---|---|
| `/speckit-triage-assess <issues>` | `triage/NNN-slug.md` (status proposed) |
| `/speckit-triage-op-setup` | `ops/NNN-slug/` with `op.md`, `spec.md`, `plan.md`, `tasks.md` |

# Scripts

`status.sh` (latest record as JSON), `decide.sh approved|rejected` (records the operator's answer and commits), `op-new.sh <slug>` (creates the op directory and points `.specify/feature.json` at it).
