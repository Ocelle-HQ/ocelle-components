# Implementation Plan: Phase replay and review handoffs

## Approach

- Extend the installed and source `base.sh` with `--with-main <full-sha>` to record an already integrated main commit. Use temporary deterministic integrated snapshots for the final replay base and applicable scaffold and fix bases. Validate the pin before using it. Compare the integrated replay base to the branch head, so a shared file remains selected if the phase still changes it. Rerun historical red commits at their original revisions. Keep `base.sha` and the red records intact.
- Extend the shard verifier's existing failed result with missing and unexpected project/file identities and the runner error. Update landing guidance to start with the exact candidate's plan and result artifacts and verify the tested revision's complete named check set.
- Harden the scope script to inspect committed, staged, unstaged and non-ignored untracked paths and report them in JSON. Account for both sides of a rename and fail if the check cannot inspect Git.
- Extend Planner Pim's guidance for Storybook file and inventory ownership and with the observed pointer-gesture testing pattern. Keep task ordering and one owner per generated result.

## Verification

Record assertions against the previous replay, shard and role-check behavior before implementation. Use disposable Git fixtures for merged replay, invalid main pins, conflicts, and role scope. Run final focused check suites, quality gates applicable to the changed files and a review of the two guidance changes against the triage. Record hosted results for the exact candidate when available.

## Constitution Check

**Pass.** This is internal verification and planning work. The existing assertion-proof requirements, full suite, required checks and product contracts apply. No complexity exception is requested.
