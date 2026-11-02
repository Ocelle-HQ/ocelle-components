---
description: "Resolve the blocking findings of the latest spec check in spec.md"
---

# Spec Fix

Resolve the `blocking` findings of the latest spec check in `spec.md`. Do not answer `operator` findings yourself:
the operator answers them at the gate.

## User Input

```text
$ARGUMENTS
```

Optional: answers from the operator to `operator` findings, by finding id. Apply those as given.

## Steps

1. Run `.specify/extensions/squad/scripts/spec-status.sh` and read `file`. Read it, `spec.md`,
   `checklists/requirements.md` and `.specify/memory/constitution.md`.
2. For each `blocking` finding, change `spec.md` as the Fix column asks, or better if you can justify it. Keep the
   spec free of implementation detail. For each `operator` finding with an answer in the input, apply the answer.
3. Update `checklists/requirements.md` to match the spec.
4. Write `FEATURE_DIR/reviews/spec/check-<k>-fixes.md`: `| ID | Resolution | Where |`, Resolution `fixed`,
   `answered` (operator) or `disputed: <reason>`.
5. Commit the spec, the checklist and the note: `docs(spec): fixes for check <k>`, signed off. Do not push.
