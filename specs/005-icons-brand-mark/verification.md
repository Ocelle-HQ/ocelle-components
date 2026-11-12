# Verification: 005-icons-brand-mark

The GitHub-side checks of this mission's pull request. The orchestrator drafted this file from CI evidence on
2026-11-12 during the landing pass. An item is done only when it is marked **done** and its evidence is filled in. The
operator signs it off at the end.

Pull request: https://github.com/Ocelle-HQ/ocelle-components/pull/26 (base `main` at `e7d7d54`, closes #17).

## 1. The fifteen checks green

Run https://github.com/Ocelle-HQ/ocelle-components/actions/runs/43206816174 (head `a287b02`, after the merge of `main`
with mission 007 and landing round 2): 44 of 44 jobs succeeded. These fifteen checks of
`specs/001-repository-foundation/contracts/ci-checks.md` are green:

1. Typecheck
2. Code lint
3. Style lint
4. Unit tests (on the pinned Node 26.13.0)
5. Test lint
6. Mutation testing
7. Content security
8. Prefix
9. Story config copies
10. Install and pins
11. Sign-off
12. Plants
13. Contrast
14. Brand rules
15. Custom-elements manifest (new in this mission)

The helper job `Mutation plan` and the 28 `Mutation shard` jobs are green too. The slowest shard,
`gates/lib/plant-repo.ts:95-406`, took 5:57 of its 10 minutes. Two shards mix element source and other source and so
run Stryker twice (landing round 2, L2-02); every shard finished within that 5:57. An earlier run on head `147394e`,
before mission 007 reached `main`, was green too (run 43188981994, 28 of 28 jobs).

Status: **done**. Re-confirm on the final head before the merge.

## 2. Required checks on `main`

The ruleset `main-required-checks` (id 26484239) requires the fourteen checks of missions 001 and 002.
**Custom-elements manifest** is new and must be added to it (plan decision 14, R-06); until then it runs but does not
block a merge.

Status: **open** (operator).

## 3. Merge method and evidence home

Squash-merge this pull request, as for missions 001 and 002 (operator decision L1-08). The history was folded per
phase and once in landing, so the SHAs that the review files name live on the branch `claude/017-icons-brand-mark`
and its archive refs `archive/claude/017-icons-brand-mark-prefold-phase-1` to `-phase-5` and
`archive/claude/017-icons-brand-mark-prefold-landing`. After the squash they are the only home of those commits: keep
them all.

Status: **open** (operator, at merge).

## Sign-off

Operator: _pending_
