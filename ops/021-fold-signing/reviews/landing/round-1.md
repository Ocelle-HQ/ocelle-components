---
scope: landing
phase: landing
round: 1
verdict: changes_requested
base: 23ba5c57a1db18ca7f935fefdce77d156e86e8f5
head: 58ffad21182a530b6b503721b91b35b5cf311e2c
tdd_check: pass
---

# Landing review, round 1 (PR #53, op 021-fold-signing, #51)

This is a fresh review of the integrated diff `origin/main...HEAD` (`23ba5c5...58ffad2`, 10 commits). The code is
26 changed lines in `tooling/speckit/bin/fold-history.sh`, one phrase in `tooling/speckit/README.md`, and eight new
tests in `gates/test/integration/fold-history.test.ts`. The rest is op records and evidence. The phase reviews
(`reviews/phase-1/round-1.md`, `round-2.md`) were input, not a substitute. I re-derived each boundary below myself,
in throwaway repositories and with hand mutants of my own.

The script change is correct at every boundary I probed, and every failure path fails closed. One gap blocks: the
main guard's pass path is never tested with a main ref present, yet every real caller has one. Two non-equivalent
mutants of the new guard survive the whole test file (L1-01). The rest are notes.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| L1-01 | blocking | tooling/speckit/bin/fold-history.sh:38-43; gates/test/integration/fold-history.test.ts:222-356 | No test runs the fold with a main ref that does **not** reach into `<base>..HEAD`. The spec's edge case says the guard "never refuses wrongly", and that is the production setup: every `/ocelle-run` and `/ocelle-land` fold runs in a clone with `origin/main` at or below the base. The ok-path tests have no main ref at all, so the guard is skipped there, and the two refusal tests only check refusing. Two hand mutants survive all 9 tests. **MA** refuses whenever a main ref exists (`(( on_main == 0 )) \|\| die` -> `die`). **MB** counts the base itself (`"$base..$old_head"` -> `"$base^..$old_head"` in the first count), so every fold whose base is on main is refused. Neither is equivalent. Both would make every real fold exit 2, and no test would catch it. The current code is right: in a throwaway repository with `refs/remotes/origin/main` at the fold base, the signed fold exits 0 with `ok:true`. This branch's own phase-1 fold also succeeded with `origin/main` present (`history-map.txt`). | Add a test where `refs/remotes/origin/main` (or `main`) points at `foldBase` (or an ancestor of it) and the signed fold succeeds: exit 0, `ok:true`, base rewritten, every commit of the range signed. Show MA and MB killed in the fix note. It is a coverage test, so it may pass at its red commit. |
| L1-02 | note | tooling/speckit/bin/fold-history.sh:27, :123, :146 | SHA-256 is only half supported. Fix R1-03 widened the `pr-base` check to 64 hex characters, but the `plants.md` base remap (op 016 code) still matches `{7,40}`. Before this op, a SHA-256 fold stopped at the `pr-base` check (exit 2, fail closed). Now it reaches the end and reports `ok:true`, but with a stale `plants.md`. I reproduced this: SHA-256 repository, phase with a `plants.md`, exit 0, `base.sha` remapped to `7ebc353…`, while `plants.md` still says `- base: 98f2d50…`. The phase review would catch the mismatch later, and this repository is SHA-1. The spec puts evidence remapping out of scope (round-2 note R2-03 accepted that). But it is this op's change that makes the path reachable. | Optional and cheap: widen `:123` and `:146` to `{7,64}`, and add a `plants.md` to the SHA-256 test (`:342`). Or record it as a follow-up issue. |
| L1-03 | note | .claude/skills/ocelle-land/SKILL.md:181 | The caller's text now drifts from the script. It says "On failure it leaves HEAD on the old head and exits 1. The old head stays as `refs/ocelle/prefold/landing/<branch>`." Now a failure can exit 2 (main guard, signer failure in `commit-tree`), and the remap rollback deletes the prefold ref. The sentence was already loose before this op: verification failures exit 1 before the ref is written. `/ocelle-run` (`.claude/skills/ocelle-run/SKILL.md:138`, "Not ok: report its problems and stop; HEAD is back on `OLD`") is still accurate, because it keys on `ok`. The interface (`<base> <feature> [label]`) and the JSON keys are unchanged. Spec *Out of scope* excludes the skills. | Optional: a follow-up that rewords the line to "Not ok (exit 1 or 2): HEAD is on the old head; the prefold ref exists only when the fold got past its checks". |
| L1-04 | note | gates/test/integration/fold-history.test.ts:257-271, :273-287, :326-340 | Scenario 3 (signer fails), scenario 4 (remap signer fails) and the R1-02 test assert exit status, `ok`, state and prefold, but not the problem text. Any other `die` would satisfy scenario 3's `{status: 2, ok: false}`. That is not vacuous today: the setup is shared with the passing scenario-1 test, so an early unrelated `die` would also break that test. | Optional: add `problems` matches (`could not build the folded commit`, `remap commit`) to the three `toEqual` objects. |
| L1-05 | note | tooling/speckit/bin/fold-history.sh:140, :101 | Carried from R2-02 and R2-01, still deferred. With signing off, a failing remap `git commit` reports "the remap commit could not be signed". `has_sig` under `pipefail` can call a very large signed commit unsigned, but only on the safe side. | Optional, as in round 2. |
| L1-06 | note | tooling/speckit/bin/fold-history.sh:39-40 | When neither `origin/main` nor `main` exists, the guard is skipped silently, and the JSON gives no sign of it. The spec documents this edge case, and the plan accepts it (test repositories). It is not a gap for the callers, whose clones always have `origin/main`. | None. |
| L1-07 | note | triage/021-fold-signing.md:17-28 | Nobody in this op read issue #51 itself. The triage record says GitHub was unreadable and works from the operator's brief. What was built matches that brief exactly: `commit-tree -S` when `commit.gpgsign` is on, a refusal of any unsigned rebuild or remap commit, and main's commits kept out of the rewrite (refuse, per Q1). Already-folded branches are left alone. | At hand-off, check #51's body before writing `Closes #51`. |

## Boundaries checked

- **Signing on/off.** `sign` follows `git config --bool commit.gpgsign` (`:37`). `1` normalizes to `true`, and I
  checked that a fold with `commit.gpgsign 1` signs all 4 commits. Unset or invalid counts as off (spec edge case).
  With signing off, the existing op-016 test (`:167`) passes unchanged. The main guard also applies with signing
  off. That is intended (FR-005 is unconditional), though FR-006's "behaviour of today" reads wider.
- **Unsigned rebuild.** Every value of `map` is checked for a header (`:101-104`) before `update-ref` and `reset`.
  This covers all rebuilt commits, `old_head`'s included. A failure takes the existing exit-1 path, with no ref
  written.
- **Signing failure in `commit-tree`.** `|| die` (`:84`) runs in the main shell, so it exits 2 with valid JSON
  before any ref or working-tree change. Objects already built are left unreachable, which is harmless.
- **Remap commit.** `if ! commit || { sign && ! has_sig HEAD; }` parses as `(! commit) || {…}`, so both a failed
  commit and a successful unsigned one roll back. I checked the rollback in a throwaway repository: exit 1,
  `ok:false`, `git status --porcelain` empty, a first-fold `history-map.txt` removed with the index, and no
  `refs/ocelle/prefold/*`.
- **Main's commits in the range.** `count(range) - count(range --not mains)` counts exactly the range commits that
  main can reach. It runs before anything is built (`:38-43`). The `die` message has no double quote, so the JSON
  stays valid. Both refs are tested for refusal (`:289`, `:307`). The pass path is untested (L1-01).
- **Missing main refs.** The guard is skipped (L1-06). A stale ref can only reach fewer commits.
- **SHA-1 and SHA-256.** `gpgsig` and `gpgsig-sha256` are both accepted, and the SHA-256 test (`:342`) proves the
  header and the 64-character base. The `plants.md` remap does not cover SHA-256 (L1-02).
- **Exit 0/1/2 and JSON.** The keys are unchanged. Exit 1 means a verification failed and HEAD is on the old head.
  Exit 2 means the fold did not run, or a build failed before any change. Both callers branch on `ok`.
- **Gates and guard.** `gate:signoff` checks `Signed-off-by` (DCO), not signatures. The fold still keeps the
  union of trailers, and the remap commit is still `-s`. There is no overlap or conflict, and
  `gates/bin/signoff.ts` is unchanged. The commit guard (`tooling/speckit/bin/guard-commit.sh`, a PreToolUse hook)
  matches `git commit` in the agent's command text. A `git commit` inside the script is not seen by it, as before.
  No interaction with it changed. `git diff origin/main...HEAD -- .claude .github gates/bin` is empty.

## Test quality

- **Red evidence.** `red-commits` has `phase 65a0c7f` and `fix-1 09b6f7e`, remapped (`history-map.txt`: old
  `c38d610` and `63d4745`). Both commits change only the test file. `red-phase.log` shows the five scenario tests
  failing on their `toEqual`, each for the missing behaviour: unsigned commits, exit 0 instead of 1/2, and exit 128
  with no JSON. `red-fix-1.log` shows the SHA-256 test failing on the 40-character `pr-base` limit. The R1-01 and
  R1-02 coverage tests fail against base (`check-final-tests-on-base.log`). `tdd-check.json` is `pass` on the folded
  SHAs.
- **No weakening.** After the red commits, the test file gained only additions and the defaulted `objectFormat`
  parameter: `git diff 65a0c7f..HEAD -- gates/test/` removes only the three lines that parameter replaces. The op-016 test is untouched.
- **Assertions.** Each test has one `toEqual` on observable facts. There is no `skip`/`only`, no conditional
  assertion and no snapshot. The `JSON.parse` catch turns bad output into `ok: undefined`, which every test
  asserts.
- **The throwaway signer.** `gpg.format ssh` with `gpg.ssh.program` set to the script: git runs it as
  `<program> -Y sign -n git -f <key> <buffer>` and reads `<buffer>.sig`. So the script under test calls the real
  `git commit-tree -S` and `git commit` signing path, and only the external signing program is replaced. The fold
  checks that the header is present, not that the signature is valid (validity is out of scope), so the fake
  signature exercises everything the fold decides on. The `unsigningGit` and `unsignedRemapGit` wrappers act on
  real git arguments, and the wrapped commands still run the real git.
- **Mutation.** `gate:mutation` covers TypeScript only, and no TypeScript source changed. The phase reviews ran
  13 hand mutants, all killed after the round-1 fixes. I did not re-run those. I ran four new ones against
  `fold-history.test.ts` in a throwaway worktree (since removed):

  | Mutant | Change | Result |
  |---|---|---|
  | MA | guard refuses whenever a main ref exists | **survived** (L1-01) |
  | MB | first guard count includes the base (`$base^..`) | **survived** (L1-01) |
  | MC | guard tolerates one commit on main (`<= 1`) | killed (2 tests) |
  | MD | remap signature check also with signing off | killed (op-016 test) |

## Checks run

On HEAD `58ffad2`, working tree clean:

- `vitest run gates/test/integration/fold-history.test.ts`: 9 of 9 passed.
- `pnpm test`: exit 0, 3851 tests passed in 153 files.
- `pnpm run gate:typecheck`, `gate:lint`, `gate:test-lint`: exit 0.
- `pnpm run gate:signoff -- --range origin/main..HEAD`: exit 0, 10 commits, no finding.
- Signatures: every commit of `origin/main..HEAD`, including the commits folded by the new script and its remap
  commit `5664fa4`, has one `gpgsig` header (`git cat-file commit`).
- CI run 44036668364 on `58ffad2`, read-only at review time: still `in_progress`. Every finished job had
  succeeded, including Sign-off, Typecheck, Code lint, Test lint and Mutation testing. Unit tests and most Plants
  shards had not finished.

## Earlier findings

Phase 1 round 2 approved, with no blocking finding open. Round 1's R1-01 to R1-03 are resolved: I re-ran the
relevant tests, and the SHA-256 and `origin/main` tests are present and pass. Notes R2-01 and R2-02 are carried as
L1-05, and R2-03 is widened into L1-02.
