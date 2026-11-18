# Verification: 009-workflow-layouts

The GitHub-side checks of this mission's pull request. The orchestrator drafted this file from CI evidence on
2026-11-17 during the landing pass. An item is done only when it is marked **done** and its evidence is filled in. The
operator signs it off at the end.

Pull request: https://github.com/Ocelle-HQ/ocelle-components/pull/46 (base `main` at `13af7a9`, closes #15).

## 1. The checks green

Run https://github.com/Ocelle-HQ/ocelle-components/actions/runs/44080933084 ran on head `93365f8`. That head comes
after the landing fold and the merges of `main` with missions 013 (#43), 011 (#44) and 008 (#47). All 96 of 96 jobs
succeeded:

1. Typecheck
2. Code lint
3. Style lint
4. Unit tests (this proves T072: the scroller's *Overflowing in the middle* and *Overflowing at the end* stories
   pass in both themes, the failure of run 43791016532 that became O3-01)
5. Test lint
6. Mutation testing (helper `Mutation plan` and 47 `Mutation shard` jobs)
7. Content security
8. Prefix
9. Story config copies
10. Install and pins
11. Sign-off
12. Plants (helper `Plants plan` and 29 `Plants shard` jobs)
13. Contrast
14. Brand rules
15. Custom-elements manifest
16. Storybook build
17. Visual regression (this confirms B2: the baselines generated in the pinned docker container match CI)
18. Accessibility

This mission adds no check, so the check names and the ruleset do not change.

The mutation shards took 18 to 36 minutes each (landing note L1-06, op 015's shard limit). Every shard finished.

Status: **done**. Re-confirm on the final head if anything is pushed before the merge.

## 2. Required checks on `main`

No new check, so nothing changes in the ruleset `main-required-checks`.

Status: **done** (nothing to change).

## 3. Merge method and evidence home

Squash-merge this pull request, as for the earlier missions. The history was folded per phase and once in landing,
so the SHAs that the review files name live on the branch `claude/015-workflow-layouts` and its archive refs. After
the squash, those refs are the only home of those commits, so keep them all:
- `archive/claude/015-workflow-layouts-prefold-phase-1` to `-phase-5`;
- `archive/claude/015-workflow-layouts-prefold-landing`.

`reviews/history-map.txt` resolves the old SHAs to the new ones.

The commits that `fold-history.sh` recreated carry no signature, so GitHub shows them as *Unverified*. They all
carry `Signed-off-by`, and the Sign-off check passes. The operator accepted this on 2026-11-17 ("Push as is").

Status: **open** (operator, at merge).

## Sign-off

Operator: _pending_
