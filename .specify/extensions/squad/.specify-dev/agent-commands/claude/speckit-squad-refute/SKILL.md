---
name: speckit-squad-refute
description: Try to refute every lens finding of the current round; confirm, refute or mark duplicate; split fixes from forks
compatibility: Requires spec-kit project structure with .specify/ directory
metadata:
  author: Ocelle-HQ
  source: squad:commands/speckit.squad.refute.md
---

# Squad Refute

Every finding of the current squad round is a claim. Try to **knock each one down** against the artifacts and the
repository. Keep only what survives. **Change no spec, plan or design file.**

## User Input

```text
$ARGUMENTS
```

No input is needed.

## Steps

1. Run `.specify/scripts/bash/check-prerequisites.sh --json --paths-only` and read `FEATURE_DIR`. The current round
   is the highest `FEATURE_DIR/reviews/plan/round-<R>/`. Read every `lens-*.yaml` in it, the artifacts they cite,
   and the constitution. A lens file without `complete: true` is reported, and its findings are still judged.
2. For each finding, check its evidence yourself: open the cited section, run the probe again where you can.
   - `confirmed`: the evidence holds and the consequence is real.
   - `refuted`: the evidence is wrong, or the artifact already handles it; say where.
   - `duplicate`: the same defect as another finding; name it in the reason (the other stays).
   For confirmed findings, `Kind` is `fix` when one remedy is clearly right, `fork` when two or more are valid and
   choosing is a product or design decision. Write the options of each fork into the reason, lettered (a), (b).
3. Write `FEATURE_DIR/reviews/plan/round-<R>/refute.md`:

   ```markdown
   # Squad round <R>: refute

   | ID | Verdict | Kind | Decision | Reason |
   |----|---------|------|----------|--------|
   | PLAN-CORRECTNESS-1-001 | confirmed | fix | - | ... |
   | PLAN-FRESH-1-002 | confirmed | fork | undecided | (a) ... (b) ... |
   | PLAN-TESTABILITY-1-003 | refuted | - | - | plan.md § Tests already ... |
   ```

   Every finding of every lens file has exactly one row. `Decision` is `undecided` for forks and `-` otherwise;
   the operator writes the chosen letter there.
4. Commit the round's lens files and `refute.md` together: `docs(plan): squad round <R> — <confirmed> confirmed,
   <forks> forks`, signed off. Do not push.

## Report

Counts of confirmed (fixes and forks), refuted and duplicate findings, and each fork with its options.