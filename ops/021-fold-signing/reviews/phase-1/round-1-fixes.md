# Phase 1 review round 1: fixes

Red commit: `fix-1 63d4745` in `red-commits`, log `red-fix-1.log` (`red.sh 1 fix-1`: tests only, red, recorded; 1 of
3851 tests failed, the R1-03 test, on its `toEqual` assertion: `{ status: 2, ok: false, … }` against
`{ status: 0, ok: true, … }`).

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R1-01 | fixed | No red needed: the finding is a missing test, and the script already lists `refs/remotes/origin/main`, so the new test passes at once against the phase's code (fix procedure step 3). It is in the red commit `63d4745` and fails against the base script, which has no main guard and folds (the automatic check runs the final tests on base). Hand mutant M9 (main refs list without `refs/remotes/origin/main`) now fails it. | gates/test/integration/fold-history.test.ts "refuses with exit 2 a range that holds a commit reachable from origin/main when there is no local main (op 021, scenario 5, R1-01)": `git update-ref refs/remotes/origin/main <unkept>`, no local main; asserts exit 2, `ok:false`, no `refs/heads/main`, an `on main` problem, HEAD, evidence files and refs unchanged, no prefold ref. |
| R1-02 | fixed | No red needed, for the same reason: the script already rolls back an unsigned remap commit, so the test passes against the phase's code. It fails against the base script (exit 0). Hand mutant M6 (drop `\|\| { (( ${#sign[@]} )) && ! has_sig HEAD; }`) now fails it. | gates/test/integration/fold-history.test.ts "rolls back with exit 1 and no prefold ref when the remap commit succeeds but is not signed (op 021, FR-004, R1-02)", with a new helper `unsignedRemapGit`: a `git` wrapper first on `PATH` that adds `--no-gpg-sign` only when the first argument is `commit`, so `commit-tree` still signs. Asserts exit 1, `ok:false`, HEAD, evidence files and refs unchanged, no prefold ref. |
| R1-03 | fixed | `63d4745` (red): the test showed a behaviour defect beyond the finding. In a SHA-256 repository the fold could not run at all: `pr-base` was checked against `^[0-9a-f]{7,40}$`, so a 64-character base died with exit 2 (`pr-base must be a commit sha`). | tooling/speckit/bin/fold-history.sh:27: the `pr-base` check accepts 7 to 64 hex characters. gates/test/integration/fold-history.test.ts: `signedRepo` takes an `objectFormat` (default `sha1`, so the earlier tests are unchanged) and the new test "signs every commit of the folded range in a SHA-256 repository, whose signature header is gpgsig-sha256 (op 021, edge case, R1-03)" asserts exit 0, `ok:true`, base rewritten, object format `sha256`, 4 commits, none unsigned. git 2.43 signs SHA-256 objects with the test signer, so the mutant is reachable; hand mutant M10 (`^gpgsig `) now fails it. |
| R1-04 | deferred: a note, optional; the failure is on the safe side (the fold refuses), and the op's constraint is to keep the change small. Left for the next review round to decide. | none | none |
| R1-05 | deferred: a note, optional; the message wording is not asserted by any test, and plan.md *Approach* 5 names this message. Left for the next review round to decide. | none | none |
| R1-06 | no change (note, no change required) | none | none |

Remaining limit, not in a finding: the `- base:` line of a phase's `plants.md` is still matched as `[0-9a-f]{7,40}`
(fold-history.sh:123 and :146, op 016 code), so in a SHA-256 repository that line would not be remapped. No test
covers it and no finding asks for it, so it is unchanged here.

## Hand mutants

Each run against `gates/test/integration/fold-history.test.ts` on a temporary copy of the change, then reverted:

| Mutant | Change | Result |
|---|---|---|
| M6 | drop the `! has_sig HEAD` clause of the remap check | killed by the R1-02 test |
| M9 | main refs list without `refs/remotes/origin/main` | killed by the R1-01 test |
| M10 | `^gpgsig(-sha256)? ` -> `^gpgsig ` | killed by the R1-03 test |

## Checks run

- `pnpm test`: exit 0, 3851 tests passed in 153 files.
- `pnpm run gate:typecheck`, `gate:lint` (297 files), `gate:test-lint` (203 files): exit 0, no finding.
- `pnpm run gate:plants -- --affected 34ce2afba10b57e4d2df972f1f9497b283c0b75e`: exit 0, no plant selected, 0 of
  309 plants judged. The output is the same as the one in `plants.md`, so `plants.md` is unchanged.
