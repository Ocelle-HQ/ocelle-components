---
type: Workflow
title: ocelle-spec-check
description: Spec-only check after specify, with a fix loop for blocking findings and an operator gate
resource: /tooling/speckit/workflows/ocelle-spec-check/workflow.yml
tags: [spec-kit, workflow, analyze]
version: 1.0.0
generated: { by: claude-code/agent, at: 2026-11-02T14:30:00Z }
status: draft
---

# Steps

1. Up to three times: `speckit.squad.spec-check` → `spec-status.sh` → `speckit.squad.spec-fix` while blocking findings remain.
2. Gate: the operator answers operator questions in `spec.md` (or with `/speckit-clarify`) and approves.

# Why

The operator asked for an analysis after every specify. `/speckit-analyze` needs `tasks.md`, so the spec stage got its own check; the full analyze still runs after tasks.

# Output

`specs/<feature>/reviews/spec/check-K.md` and `check-K-fixes.md`.
