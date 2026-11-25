# Verification: op 023, public repository hygiene

The GitHub-side checks of this op's pull request. The orchestrator drafted this file from CI evidence on 2026-11-25
during the landing pass. An item is done only when it is marked **done** and its evidence is filled in. The operator
signs it off at the end.

Pull request: https://github.com/Ocelle-HQ/ocelle-components/pull/80 (base `main` at `6a6d74c`, merged into the branch
at landing; closes #60).

## 1. The nineteen checks green

Run https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45690468028 (head `3e5d75a`, after the second merge
of `main` at `6a6d74c`, mission 029): every job succeeded. The run on `d016b93` (after landing review round 2,
https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45675682015) was green too. These nineteen checks of `specs/001-repository-foundation/contracts/ci-checks.md` are
green:

1. Typecheck
2. Code lint
3. Style lint
4. Unit tests (six shards and the verdict job)
5. Test lint
6. Mutation testing
7. Content security
8. Prefix
9. Story config copies
10. Install and pins
11. Sign-off
12. Contrast
13. Brand rules
14. Custom-elements manifest
15. Storybook build
16. Visual regression
17. Accessibility
18. Sandbox paths (new in this op)
19. Plants

The heads `64875ee`, `95f094a`, `a47b214`, `98f5bbf`, `ac5bebc`, `4e0ba99` and `ee83aae` were green too. Two earlier heads were red on Unit test
shard 4 only (`73c8ba1`, run 45625428767; `f829bcc`, run 45673036035). The artifact of run 45673036035 shows `main`'s
browser test `packages/elements/test/list-detail.test.ts` failing to run in `elements (chromium)` and the seven
chromium files after it never running. Op 023 changes nothing under `packages/`. The operator closed it without a
fix (`triage/decisions/023-landing-shard4.md`); follow-up issue #97.

Status: **done** on `3e5d75a`. Re-confirm on the final head before the merge.

## 2. Required checks on `main`

The ruleset on `main` requires the eighteen checks before this op. **Sandbox paths** is new and must be added to it
(plan § Landing redaction, run-summary lines); until then it runs but does not block a merge.

Status: **open** (operator, after the merge).

## 3. Private vulnerability reporting

`SECURITY.md` now names one channel, GitHub private vulnerability reporting (operator Q1 (a) and Q3 (a),
`triage/decisions/023-q1-q3-security-scope.md`). The setting must be switched on in the repository's Security
settings for that channel to exist.

Status: **open** (operator; confirm it is on).

## 4. Red/green evidence

`tdd-check.sh 1` on `73c8ba1` reports `fail` only because main's op 025 checker runs over this branch's pre-merge
history. The operator accepted the phase's evidence on the pre-merge pass plus the fix-4 red commit
(`triage/decisions/023-landing-red-green.md`); follow-up issue #96. Phase 1 is accepted at round 6
(`reviews/phase-1/operator-accepted.md`).

Status: **done** (by operator decision).

## 5. Merge method and evidence home

Squash-merge this pull request, as for earlier missions and ops. Phase 1 was folded once during the run; its
pre-fold history lives on `archive/claude/060-public-repo-hygiene-prefold-phase-1`, which the review files' older
SHAs need (for example `e77f5bf`, landing note L1-05). Keep that archive branch and the PR branch after the squash.

Status: **open** (operator, at merge).

## Sign-off

Operator: _pending_
