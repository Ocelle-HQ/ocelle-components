---
type: Workflow
title: ocelle-triage
description: Triage issues into a mission, an op, a fold, no work or an operator decision, then start the right flow
resource: /tooling/speckit/workflows/ocelle-triage/workflow.yml
tags: [spec-kit, workflow, triage, governance]
version: 1.0.0
generated: { by: claude-code/agent, at: 2026-11-02T15:15:00Z }
status: draft
---

# Steps

1. `speckit.triage.assess` with the issue numbers, run as the [triage-tara](/flows/triage-tara.md) profile: writes `triage/NNN-slug.md`.
2. `status.sh`; an invalid or missing record fails the run.
3. Gate: approve or reject; `decide.sh` records the answer in the record and commits it.
4. On approval, by decision: mission → [ocelle-sdd](/flows/ocelle-sdd.md); op → `speckit.triage.op-setup`, an op gate, [ocelle-implement](/flows/ocelle-implement.md); fold → a note; none and decision-needed → nothing.

# Why

The operator wanted a profile that checks the issues and everything related before deciding how much goes into a mission, or whether a mission is needed at all, or something like a Spec Kitty Op, so governance stays intact. An op keeps the governance trail (a triage record approved by a named human, an `op.md` record, red-first tests, an independent review) without the spec check and plan squad.

# Evidence

- 2026-11-02, stubbed engine run: op (approved, op set up, stopped at the op gate), none (approved, nothing started), rejected (recorded, stopped), invalid decision (failed).
