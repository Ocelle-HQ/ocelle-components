---
phase: 1
round: 1
verdict: changes_requested
base: 34ce2afba10b57e4d2df972f1f9497b283c0b75e
head: 458ef6662b49603ad3292d2a6fa5ac981000bc84
tdd_check: pass
---

# Phase 1 review, round 1

The change is small, follows plan.md *Approach* 1 to 6 closely, and the five red tests are good: each failed on
its assertion against the old script, none was touched after the red commit, and every check passes. The
blocking findings are all the same kind of gap. `gate:mutation` only mutates TypeScript, so it had nothing to
mutate here. I mutated the changed shell script by hand, and three non-equivalent mutants in new code survive
the phase's tests (constitution VIII, *Mutation testing*). Each one is a requirement the spec states explicitly
that no test pins.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | tooling/speckit/bin/fold-history.sh:39; gates/test/integration/fold-history.test.ts:270 | The main guard's `refs/remotes/origin/main` is never exercised. Only `refs/heads/main` is tested (`r.git("branch", "main", r.unkept)`). Mutant M9 drops `refs/remotes/origin/main` from the list, and all 6 tests still pass. Spec scenario 5 and FR-005 name `origin/main`, and in a fresh clone or an agent worktree it is often the only main ref there is. | Add a test (red against the base script) where only `refs/remotes/origin/main` points inside `<foldBase>..HEAD` (for example `git update-ref refs/remotes/origin/main <unkept>`, with no local `main`). Assert exit 2, `ok:false`, an `on main` problem, unchanged state and no prefold ref. |
| R1-02 | blocking | tooling/speckit/bin/fold-history.sh:135-137 | The second half of the remap check, "signing on and `git commit` succeeded but HEAD has no signature header" (FR-004, op.md intent 2), is untested. Mutant M6 removes `\|\| { (( ${#sign[@]} )) && ! has_sig HEAD; }`, and all 6 tests still pass, because scenario 4 only reaches the rollback through a failing `git commit`. The mutant is not equivalent: a `git` wrapper on `PATH` that adds `--no-gpg-sign` to `commit` (the same technique as test 2's `commit-tree` wrapper) produces a successful, unsigned remap commit. | Add a test where the remap `git commit` succeeds unsigned (wrapper adds `--no-gpg-sign` to `commit` only, so `commit-tree` still signs). Assert exit 1, `ok:false`, HEAD and evidence files unchanged, and no prefold ref. |
| R1-03 | blocking | tooling/speckit/bin/fold-history.sh:101 | Accepting `gpgsig-sha256` (spec *Edge Cases*: "A commit signed with SHA-256 objects carries `gpgsig-sha256`; it counts as signed") is untested. Mutant M10 changes the pattern to `^gpgsig `, and all 6 tests still pass. In a SHA-256 repository that mutant makes every signed fold fail with "is not signed". | Add a test for the signed fold (scenario 1) in a repository made with `git init --object-format=sha256`. Assert exit 0, `ok:true`, and that every commit of the range carries a signature header. If the runner's git cannot sign SHA-256 objects, record that as an equivalent or unreachable mutant with the evidence, and do not skip the test. |
| R1-04 | note | tooling/speckit/bin/fold-history.sh:101 | `has_sig` pipes `git cat-file commit` into `grep -q` under `set -o pipefail`. When a commit object is bigger than the pipe buffer (about 64 KiB, so a very long folded message), `grep -q` exits on the early `gpgsig` line and `cat-file` gets SIGPIPE (141). The pipeline then fails and a signed commit is reported as unsigned. The error is on the safe side (the fold refuses rather than accepting unsigned work) and unlikely in practice. | Optional: `git cat-file commit "$1" \| sed -n '/^$/q;p' \| grep -qE ...` or capture the header first (`hdr=$(git cat-file commit "$1")`) and match on the variable. |
| R1-05 | note | tooling/speckit/bin/fold-history.sh:135-140 | The rollback message is always "the remap commit could not be signed". With signing off, a failing `git commit` (plan.md *Approach* 5 accepts this behaviour change) takes the same path, and that message is then misleading. No test covers the signing-off rollback. The plan names this as a small, deliberate change. | Optional: word the problem as "the remap commit failed or is not signed". |
| R1-06 | note | ops/021-fold-signing/reviews/phase-1/tdd-check.json | `tdd-check.json` records head `2db3ccc`. HEAD is `458ef66`, which adds only the four check evidence files (`git show --stat 458ef66`), so the check still applies to the code under review. | None. |

## Test quality

- **Red evidence.** `red-commits` has `phase c38d610`, which changes only `gates/test/integration/fold-history.test.ts`.
  `red-phase.log` shows exactly the five new tests failing, each on its `toEqual` assertion (for example scenario 2:
  `expected { status: +0, ok: true … } to deeply equal { status: 1, ok: false … }`; scenarios 3 and 4: status 128
  with no JSON, which is the old script dying in the remap commit). None fails on setup. The existing test passes in
  the red run (5 of 3848 failed). `check-final-tests-on-base.log` shows the same five failing against the base.
- **No weakening.** `git diff c38d610..HEAD -- gates/test/` is empty. The existing test (`commit.gpgsign false`,
  line 163) is unchanged and stands guard for FR-006 / scenario 6.
- **Assertions.** Each new test has one `toEqual` on an object of observable facts: exit status, `ok`, the problem
  text, HEAD, the evidence files, every ref, the prefold ref, and the per-commit `gpgsig` header. There is no
  conditional assertion, `skip`/`only`, snapshot, or mock assertion. The `try/catch` around `JSON.parse` in
  `runFold` does not swallow a failure: unparsable output becomes `ok: undefined`, and every test asserts `ok`.
- **Scenario coverage.** Spec scenarios 1 to 6 each have a test. The gaps are within FR-004, FR-005 and the
  SHA-256 edge case (R1-01 to R1-03).
- **Mutation.** `pnpm run gate:mutation -- --base 34ce2af` reports "nothing to mutate: no package or gate source
  line changed", because the gate covers TypeScript only and no equivalent-mutant records apply. Constitution VIII
  still says changed source is mutation-tested, so I ran eleven hand mutants of `fold-history.sh` against
  `fold-history.test.ts` in a throwaway clone (removed afterwards):

  | Mutant | Change | Result |
  |---|---|---|
  | M1 | `sign=(-S)` -> `sign=()` | killed (3 tests) |
  | M2 | drop the `is not signed` check of rebuilt commits | killed |
  | M3 | `\|\| die` on `commit-tree` -> `\|\| true` | killed |
  | M4 | drop `update-ref -d` of the prefold ref in rollback | killed |
  | M5 | drop `reset --hard "$old_head"` in rollback | killed |
  | M6 | drop the `! has_sig HEAD` clause of the remap check | **survived** (R1-02) |
  | M7 | `on_main == 0` -> `on_main >= 0` | killed |
  | M8 | main refs list without `refs/heads/main` | killed |
  | M9 | main refs list without `refs/remotes/origin/main` | **survived** (R1-01) |
  | M10 | `^gpgsig(-sha256)? ` -> `^gpgsig ` | **survived** (R1-03) |
  | M11 | rollback `exit 1` -> `exit 2` | killed |

  None of the three survivors is equivalent (see the findings).

## Checks run

All on HEAD `458ef66`, working tree clean:

- `pnpm test`: exit 0, 3848 tests passed in 153 files.
- `pnpm run gate:typecheck`: exit 0, no type error.
- `pnpm run gate:lint`: exit 0, 297 files, no finding.
- `pnpm run gate:test-lint`: exit 0, 203 files, no finding.
- `pnpm run gate:mutation -- --base 34ce2af…`: exit 0, nothing to mutate (see *Test quality*).
- `pnpm run gate:plants -- --affected 34ce2af… --list`: exit 0, "0 of 309 plants selected", no `note: affected:`
  line. `plants.md` records the same base as `base.sha`, the same empty selection, and exit 0. This matches.
- `tdd-check.json`: `pass`. The red commit exited 1, the final tests on base exited 1, and head exited 0, with no
  problems.
- Tasks: T001 to T010 are all ticked and their work is present. The diff since base touches only
  `gates/test/integration/fold-history.test.ts`, `tooling/speckit/bin/fold-history.sh`,
  `tooling/speckit/README.md` (one phrase, one line) and `ops/021-fold-signing/`. No skill, no `gates/bin/signoff.ts`,
  no `.github/` change and no re-sign script, as plan.md requires.
- Plan: approach steps 1 to 6 are implemented as described. `commit-tree` stays a direct `git` argument, `die`
  runs in the main shell (so it exits even though `emit_group` is called inside `&&` lists), and the main-guard
  message has no double quote.
- Constitution: I to VII are not touched (no element, token, story, baseline or package change). No CI gate
  changed, so no plant is needed (VIII *Gates are proven*). The three phase commits carry `Signed-off-by` (DCO) and
  a `gpgsig` header.
- Interaction, visual, axe and CSP checks: not affected by a shell script and an integration test, so I did not run
  them separately. `pnpm test` covers the unit and integration projects.

## Earlier findings

None. This is round 1.
