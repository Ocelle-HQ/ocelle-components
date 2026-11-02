---
name: speckit-squad-fix
description: Apply the confirmed fixes and the operator's fork decisions to spec, plan and design artifacts
compatibility: Requires spec-kit project structure with .specify/ directory
metadata:
  author: Ocelle-HQ
  source: squad:commands/speckit.squad.fix.md
---

# Squad Fix

Apply the confirmed findings of the current squad round to the feature's spec and design artifacts: `spec.md`,
`plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`. No source code exists yet and none is
written here.

## User Input

```text
$ARGUMENTS
```

No input is needed.

## Steps

1. Run `.specify/extensions/squad/scripts/status.sh` and read `round`, `undecided` and `dir`. If `undecided` is not 0,
   stop with an error: the operator has not decided every fork.
2. Read `refute.md`, the lens files, the latest `verify-*.md` of the round if any (its `unresolved` rows are the
   work of this pass), and the artifacts.
3. For each confirmed `fix` (and each unresolved row of the latest verify), apply the remedy. For each `fork`, apply
   the option the operator chose in `Decision`. Keep the artifacts consistent with each other; a change to a
   requirement updates its acceptance scenarios and the plan's tests.
4. If the plan's Constitution Check changes, update it.
5. Write `<dir>/fixes-<k>.md`, `<k>` one more than the highest existing: `| ID | Resolution | Where |`,
   Resolution `fixed`, `decided: (<letter>)` or `disputed: <reason>`.
6. Commit the artifacts and the note together: `docs(plan): squad round <R> fixes <k>`, signed off. Do not push.