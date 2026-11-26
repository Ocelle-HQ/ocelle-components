# Operator decision: phase 3 red/green check stopped at the background time limit

Date: 2026-11-22. Operator: jeroennouwsdev.

## What happened

`tdd-check.sh 3` was stopped at the 2-hour limit for a background command. The phase's fix round has a red commit
(`fix-1`, 4d1c3a1), so the check runs the full test suite three times, about 42 minutes each.

- **Finished runs:** the run at the red commit and the run at the phase base. Each failed exactly the three new README
  fragments, out of 8156 tests. The red evidence is in `red-fix-1.log`.
- **Cut-off run:** the run at HEAD (cf43c18) did not finish. Its partial logs were discarded, along with the stopped
  run's leftover worktree.
- **HEAD vs the red commit:** HEAD differs from the red commit only in the README, restored byte for byte, and in
  records. The elements-node project passed 784 tests at HEAD.

## Answer

**Review now, CI for HEAD.**
- Review round 2 goes ahead with the partial evidence.
- The full-suite run at HEAD is left to CI, under the CI-first decision.
- After approval, tdd-check runs again on the folded history. If it hits the limit again, it is split.
