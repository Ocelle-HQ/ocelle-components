---
description: "Fix every blocking finding of the latest review of one phase, test-first, and record how each was resolved"
---

# Fix One Phase After Review, Test-First

Resolve the blocking findings of the latest review round of **one** phase. Change only what the findings require.
Principle VIII (Test-First, Proven Non-Vacuous) applies to fixes too.

## User Input

```text
$ARGUMENTS
```

The input names the phase: `phase=<N>` or a bare number. If it names none, stop with an error.

## Steps

1. Run `.specify/extensions/story/scripts/verdict.sh <N>` and read `round`, `verdict` and `file`. If the verdict is
   not `changes_requested`, report that and stop without a change.
2. Read the review file, `tdd-check.json`, `spec.md`, `plan.md`, `tasks.md` and `.specify/memory/constitution.md`.
3. **Red for behaviour defects.** For each blocking finding that the code behaves wrongly (a missing scenario, a
   wrong event, a broken keyboard path), first write tests that fail because of the defect. Commit them alone
   (`test(<feature>): phase <N> review round <k> red`, signed off), then run
   `.specify/extensions/story/scripts/red.sh <N> fix-<k>`; it must report `"recorded": true`, failing for the
   right reason. For findings that a **test** is vacuous, weak or weakened, strengthen the test in the fix commit
   instead: the code may already be right, so the stronger test can pass at once, and the automatic check proves
   it by running the final tests against the code from before the phase. Skip red only for non-behavioural
   findings (naming, docs), and say so in the fix note.
4. Make the changes the findings require. If you disagree with a finding, leave the code as it is and give the
   reason, so the next review round can decide. Never weaken a test to make a finding go away.
5. Run the project's fast checks that exist; all tests must pass.
6. Write `FEATURE_DIR/reviews/phase-<N>/round-<k>-fixes.md` with one row per finding:
   `| ID | Resolution | Red test | Where |`, where Resolution is `fixed`, `disputed: <reason>` or
   `deferred: <reason>` (notes only; a blocking finding is never deferred).
7. Commit the fixes and the note together: `fix(<feature>): phase <N> review round <k>`, signed off. Do not push.
   Do not edit the review file and do not write a verdict: the next review round decides.

## Report

Each finding with its resolution and red test, the checks run, and the commit ids.
