---
description: "Fix every blocking finding of the latest review of one phase and record how each was resolved"
---

# Fix One Phase After Review

Resolve the blocking findings of the latest review round of **one** phase. Change only what the findings require.

## User Input

```text
$ARGUMENTS
```

The input names the phase: `phase=<N>` or a bare number. If it names none, stop with an error.

## Steps

1. Run `.specify/extensions/story/scripts/verdict.sh <N>` and read `round`, `verdict` and `file`. If the verdict is
   not `changes_requested`, report that and stop without a change.
2. Read the review file, `spec.md`, `plan.md`, `tasks.md` and `.specify/memory/constitution.md`.
3. For each `blocking` finding, make the required change. If you disagree with a finding, do not ignore it: leave
   the code as it is and give the reason, so the next review round can decide.
4. Run the project's fast checks that exist and fix what the changes broke.
5. Write `FEATURE_DIR/reviews/phase-<N>/round-<k>-fixes.md` with one row per finding:
   `| ID | Resolution | Where |`, where Resolution is `fixed`, `disputed: <reason>` or `deferred: <reason>`
   (notes only; a blocking finding is never deferred).
6. Commit the fixes and the note together: `fix(<feature>): phase <N> review round <k>`, signed off. Do not push.
   Do not edit the review file and do not write a verdict: the next review round decides.

## Report

Each finding with its resolution, the checks run, and the commit id.
