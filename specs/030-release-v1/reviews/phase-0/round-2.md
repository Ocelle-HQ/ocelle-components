---
phase: 0
round: 2
verdict: approved
base: 7af6180b2ac3027f565c296db3c03facfea86aaa
head: 3bf2754dea2e139fbae44576e7d2b734b9ce7f84
tdd_check: exempt
---

# Phase 0 review, round 2

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R2-01 | note | specs/030-release-v1/reviews/phase-0/plants.md:5 | The recorded local plant run still exits 2. Under the operator's decision "CI decides plants" (`operator-plants-decision.md:8-10`), that is accepted for the phase record. As a result, no local run of this phase judges the 46 visual plants, the 12 unit-tests plants, the 22 axe plants or the 4 element mutation plants. The required Plants check on the pull request is their only judge. | None for this phase. The pull request must not merge before the required Plants check passes on its head. |

No blocking finding.

## Test quality

- tdd-check: `exempt` (`tdd-check.json`, head `e986c30c`). HEAD `3bf2754d` changes only `tdd-check.json` itself.
  The exemption in `tdd-exempt.md` still holds. Since round 1 (`git diff --name-only bf535303..HEAD`), only five
  records under `specs/030-release-v1/reviews/phase-0/` changed: `operator-plants-decision.md`, `plants.md`,
  `round-1-fixes.md`, `round-1.md` and `tdd-check.json`. No source, gate, workflow or test file changed, so no test
  could fail for this round's change.
- No test file was added or changed by the phase's own commits. There is no `scaffold.sha`, no `red-commits` and no
  `deferred_ci`.
- The round 1 fix is a record, not a behaviour change, so it needs no `fix-1` red entry.
- Mutation: the plan is unchanged from round 1.
  - `gate:mutation -- --base 7af6180b... --plan` gives 147 shards, 146 cuts. All of it is source brought in by the
    merge of `main`, which passed the required "Mutation testing" check there.
  - `--base d45efd57... --plan` (against the merged `main` commit) gives 0 shards.
  - No surviving mutant can be attributed to this phase. I did not run the 147 shards, for the reason recorded in
    round 1: the element shards need the pinned Chromium, which this environment lacks.

## Checks run

On HEAD `3bf2754d`, in this environment (no container engine, no Chromium of the pinned Playwright revision), under
the CI-first rule of `tasks.md:33-35`:

- `gate:typecheck`: no type error. `gate:lint`: 759 files, no finding. `gate:test-lint`: 577 files, no finding.
- `gate:pins`: 5 manifests, no finding. `gate:prefix`: 875 files, no finding.
- `gate:sandbox-paths`: 6618 tracked files, none holds a sandbox path.
- `gate:signoff -- --range d45efd57..HEAD`: 48 commits, no finding. All three commits since round 1 (`a169cf18`,
  `e986c30c`, `3bf2754d`) carry a `Signed-off-by` trailer.
- Plants:
  - `gate:plants -- --affected 7af6180b... --list` exits 0 with `note: affected: every plant, by
    .github/workflows/evidence-reuse-shadow.yml (not mapped)` and selects 326 of 326 plants.
  - That is the same selection as `plants.md:19`, and the record's base (`plants.md:3`) equals `base.sha`.
  - The record's exit of 2 is accepted by the operator's decision (see R2-01 and Earlier findings).
- Not run here: browser unit and interaction projects, `gate:visual`, `gate:axe`, the full mutation run and the
  full plant run. By CI-first, the required CI checks on the pull request decide them. No input of theirs changed
  since round 1.

Operator decisions:

- `operator-recheck-decision.md` (decision (a) on recheck item 2b) is still applied in `plan.md` and `tasks.md`, as
  checked in round 1. Neither file changed since then.
- `operator-plants-decision.md` falls within the constitution's rule that gate plants are "run in CI"
  (`.specify/memory/constitution.md:138-139`). It needs no Complexity Tracking exception.

Tasks T001 to T003 are still ticked and present. Nothing outside the phase changed since round 1.

## Earlier findings

- **R1-01 (blocking): resolved** by the operator's decision, as `round-1-fixes.md` claims.
  - Round 1 gave two ways to resolve it: re-run the plants in a capable environment, or take the question to the
    operator and record the decision under `reviews/phase-0/`. The second was done:
    `operator-plants-decision.md` (2026-11-27, human:jeroennouwsdev, commit `a169cf18`).
  - The decision accepts a local exit 2 only when every cause is environmental and every other plant was judged as
    expected. `plants.md:47-414` bears that out: every failing line is "Chromium not found", "no browser", "Stryker
    wrote no report" (its initial test run needs the browser) or "not run (no container engine)", and no other
    plant reports a mismatch.
  - `plants.md:39-44` now cites the decision. The reason not to repeat the run holds: since `deb0de86`, only files
    under `specs/030-release-v1/` changed, and the selection is unchanged.
  - No red test is needed: this is a record, not behaviour, and the phase is exempt.
- R1-02 (note): deferred to phase 4 or 6, as recorded. No action needed in this phase.
- R1-03 (note): no change needed. The PR range `d45efd57..HEAD` has no sign-off finding (48 commits).
