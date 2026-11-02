---
name: speckit-triage-op-setup
description: 'Set up an approved op: op.md record, a short spec, plan and one-phase tasks under ops/NNN-slug'
compatibility: Requires spec-kit project structure with .specify/ directory
metadata:
  author: Ocelle-HQ
  source: triage:commands/speckit.triage.op-setup.md
---

# Set Up an Op

An op is a small governed change: no new public surface, no open design question, one phase of work. It skips the
spec check and the plan squad, but it is implemented test-first and reviewed exactly like a mission phase
(`ocelle-implement`). Its record keeps the governance trail.

## User Input

```text
$ARGUMENTS
```

None needed: the op comes from the latest triage record.

## Steps

1. Run `.specify/extensions/triage/scripts/status.sh`. Continue only if `decision` is `op` and `status` is
   `approved`; otherwise stop with an error.
2. Read the triage record, its issues (`gh issue view`), `.specify/memory/constitution.md`, and the code the op
   touches.
3. Run `.specify/extensions/triage/scripts/op-new.sh <slug>` with a short slug for the op. It creates
   `ops/NNN-<slug>/` and makes it the current Spec Kit feature.
4. Write in that directory:
   - `op.md`, the op record:

     ```markdown
     ---
     op: <NNN>
     triage: <triage record path>
     issues: [<numbers>]
     mode_of_work: task_execution
     accountable: "<decided_by from the triage record>"
     semver: patch | none
     status: started
     ---

     # Op <NNN>: <title>

     ## Intent
     ## Acceptance
     (observable checks, each one a test that will fail before the change)
     ## Constitution principles touched
     ```
   - `spec.md`: intent, one user story with acceptance scenarios (Given/When/Then), and the requirements, in the
     shape of the spec template but only as long as the op needs.
   - `plan.md`: files to change, approach, test approach (red first), and a Constitution Check. If the plan turns
     out to need new public surface or a design decision, stop: write that into `op.md` and tell the operator
     the work is a mission.
   - `tasks.md`: exactly one `## Phase 1: <op title>` section with test tasks before implementation tasks, in the
     tasks template's `- [ ] T001 ...` form.
5. Commit the op directory: `docs(op): <NNN> — <title>`, signed off. Do not push.

## Report

The op directory, the acceptance checks and the tasks.