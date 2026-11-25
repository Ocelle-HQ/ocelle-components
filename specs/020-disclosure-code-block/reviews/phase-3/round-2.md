---
phase: 3
round: 2
verdict: approved
base: e39524c54f643a19315489db7c19f9773e1bf5a9
head: 92e9f04
tdd_check: pass
---

# Phase 3 review, round 2

Scope: `git diff e39524c..92e9f04`. That is the round 1 scope (c13c3c5, 463e160, 88f4c9a), the round 1 review 4021b03,
the fix round (ce77dd8 README back to e39524c, 4d1c3a1 test-only red, cf43c18 README restored and records) and the
operator record 92e9f04. The working tree had no uncommitted change. Binding decisions applied:
`reviews/operator-ci-first.md`, `reviews/phase-2/operator-late-font.md`, `reviews/phase-3/operator-tdd-limit.md`.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R2-01 | note | reviews/phase-3/tdd-check.json:1 | **The red/green record is stale.** It still reads `exempt` for head 463e160 and points at `tdd-exempt.md`, which cf43c18 removed. It is not the evidence for this round (see Test quality). Under `operator-tdd-limit.md` the check runs again on the folded history after approval. If it hits the limit again, it is split. | None in this phase. The post-fold tdd-check replaces the file. |
| R2-02 | note | packages/elements/test/scenarios/personal-rail.ts:37 | **The README is read by a browser scenario too.** It reads the `ocelle-personal-rail` section's example (US4-10). The phase changes that section in no way, and the full suite at 4d1c3a1 passed it. HEAD's README is the 463e160 text, and the full suite at HEAD is left to CI (operator-tdd-limit.md). | None. CI's Unit tests check decides. |

No blocking finding.

## Test quality

- **Red evidence (fix-1, 4d1c3a1).** `red-commits` records `fix-1 4d1c3a1…`. The commit touches only
  `packages/elements/test/node/readme.test.ts`: three fragments added to `codeBlockFragments` (lines 989-993) and a
  doc comment extended. The one removed line is the old last line of the doc comment, and no fragment is changed.
  `red-fix-1.log` (full `pnpm test` at 4d1c3a1) shows "3 of 8156 tests failed", exactly the three new fragments, each
  an `AssertionError` from `toContain` on the README text. That is the right reason: the sentences are missing, and
  this is not a setup error. My own run of `readme.test.ts` at 4d1c3a1 (a detached worktree, offline install) gave 3
  failed, 725 passed, with the same three titles.
- **Red against the phase base.** The README blob at ce77dd8 and at 4d1c3a1 is the blob at e39524c (`a9bb5f1`). So the
  red run is the new tests against the base README. `operator-tdd-limit.md` records that tdd-check's run at the phase
  base also failed exactly these three.
- **Green at HEAD.** `readme.test.ts` at HEAD: 728 passed. `vitest run --project elements-node` at HEAD: 6 files, 784
  passed (781 before the round, plus 3). HEAD differs from 4d1c3a1 only in `packages/elements/README.md`, `tasks.md`
  and records under `reviews/`. The full-suite run at HEAD is left to CI, as the operator decided. I do not block on
  it.
- **README restored byte for byte.** `git rev-parse 463e160:packages/elements/README.md` and `HEAD:…` are the same
  blob, `615feae`, and `git diff 463e160 HEAD -- packages/elements/README.md` is empty. The restored sentences are
  README:1334-1338 and README:1695-1697.
- **Can the fragments fail?** Yes. They are unconditional `toContain` assertions in `it.each`, they failed at 4d1c3a1,
  and deleting either sentence or the qualifier "That holds once the block has laid out in its font" now fails a test.
  No `skip`/`only`, no snapshot, no mock.
- **Weakened tests.** `git diff 4d1c3a1..HEAD -- packages/elements/test` is empty. No test was loosened after the red
  commit. `test-lint` passes on 338 files.
- **Mutation.** `pnpm run gate:mutation -- --base e39524c…`: "nothing to mutate: no package or gate source line
  changed". That matches the phase.
- **Basis of `tdd_check: pass`.** This is my judgement from the evidence above (red at the red commit, red at the
  base, the changed test project green at HEAD), under `operator-tdd-limit.md`. It is not a `tdd-check.json` result
  (R2-01).

## Checks run

Locally, under `operator-ci-first.md`:

- `gate:typecheck`: no type error. `gate:lint`: 459 files, no finding. `gate:style-lint`: 43 files, no finding.
  `gate:test-lint`: 338 files, no finding. `gate:manifest`: 22 elements, no finding. `gate:config-copies`: identical.
  `gate:prefix`: 486 files, no finding.
- `gate:signoff --range e39524c…..HEAD`: 9 commits, no finding.
- `vitest run --project elements-node`: 784 passed. `readme.test.ts` alone: 728 passed at HEAD, and 3 failed / 725
  passed at 4d1c3a1.
- **Plants.** `plants.md` base equals `base.sha`, recorded exit 0, "no plant selected". `gate:plants -- --affected
  e39524c… --list` gives "0 of 317 plants selected", the same selection. CI's Plants check judges every plant.
- `gate:csp` and the manifest regeneration were not rerun. Since round 1 (where both passed), no source or build input
  changed, only the README, a test and records.
- Left to CI: full `pnpm test` at HEAD (operator-tdd-limit.md), the browser projects, `gate:contrast`, full mutation,
  full plants, `gate:storybook-build`, `gate:axe`, `gate:visual`.

Other checks:

- **Tasks.** T040, T042 and T041 stay ticked (tasks.md:422, 430, 441), and their work is present as round 1 found.
  cf43c18 adds a review note to T042 (tasks.md:437-440). It records that Principle VIII overrides the task's "no test
  changes" and that the fragments were added test-first. That is the reason for the test change, and the note is
  accurate.
- **Records.** `tdd-exempt.md` is removed. `notes.md` marks its exemption section superseded and keeps the original
  reasoning. `round-1-fixes.md` matches the commits as described. `red-fix-1.log` has its machine paths replaced by
  placeholders. None of the new records holds a sandbox path.
- **Constitution.** No element, event, style, token, I/O or network change. Principle VIII is now met for the phase's
  two README statements.
- **Operator late-font decision.** The README caveat is back (README:1334-1338), and it is now asserted. The element
  does not change. The known-gap entry for the ALL PHASES DONE message stays in notes.md.

## Earlier findings

- **R1-01 (blocking): resolved.** Two fragments assert the late-font caveat, one for the qualifier and one for the
  preload advice (readme.test.ts:989-990). A third asserts the WebKit sentence (readme.test.ts:993). No existing
  fragment changed. The red commit is test-only and recorded as `fix-1`. It is shown red against the README at
  e39524c, both in `red-fix-1.log` and in my own run. The README at HEAD is byte-identical to 463e160. The exemption
  file is gone, so the phase is no longer treated as exempt.
- **R1-02 (note):** no change, as allowed. `contracts/elements.md` is left as it is.
