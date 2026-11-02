---
description: "Check, finding by finding, that the squad round's fixes resolved what was confirmed"
---

# Squad Verify

Check every confirmed finding of the current squad round against the artifacts as they are now. You did not make
the fixes; judge the result, not the fix note. **Change no artifact.**

## User Input

```text
$ARGUMENTS
```

No input is needed.

## Steps

1. Run `.specify/extensions/squad/scripts/status.sh` and read `round` and `dir`. Read `refute.md`, the lens files,
   the fix notes `fixes-*.md`, and the artifacts.
2. For each `confirmed` row of `refute.md` (forks included, judged against the chosen option): `resolved` when the
   artifacts now make the claim false and the change introduced no new contradiction; otherwise `unresolved`,
   saying what is still wrong.
3. Write `<dir>/verify-<k>.md`, `<k>` one more than the highest existing verify:

   ```markdown
   # Squad round <R>: verify <k>

   | ID | Status | Reason |
   |----|--------|--------|
   | PLAN-CORRECTNESS-1-001 | resolved | plan.md § Tokens now ... |
   ```

   One row per confirmed finding.
4. Commit only the verify file: `docs(plan): squad round <R> verify <k> — <unresolved> unresolved`, signed off.
