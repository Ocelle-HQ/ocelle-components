# Implementation Plan: The history fold signs the commits it rebuilds

**Op**: `ops/021-fold-signing` | **Date**: 2026-11-16 | **Spec**: `spec.md` | **Record**: `op.md`
**Input**: triage `triage/021-fold-signing.md` (#51); operator constraints of 2026-11-16 (small change, test-first,
a plant if a gate is touched, already folded branches left as they are)

## Summary

Four small changes to `tooling/speckit/bin/fold-history.sh`: a main guard before the rewrite, `-S` on
`commit-tree` when `commit.gpgsign` is on, a signature check beside the existing tree checks, and a signature check
of the remap commit with a full rollback. Five red integration tests in the existing fold test file, and one phrase
in `tooling/speckit/README.md`.

## Technical Context

- **Language**: Bash (`set -euo pipefail`), git 2.34 or newer; the test is TypeScript (Vitest,
  `gates-integration` project) running the script as a child process.
- **Gates that judge this op**: `pnpm test` (the integration test), `gate:typecheck`, `gate:lint`,
  `gate:test-lint`. No CI gate changes: `fold-history.sh` is not registered in `gates/gates.json`, so no plant is
  added (operator constraint: a plant only if a gate is touched). `gate:mutation` mutates TypeScript source only;
  the op changes no source it covers. `gate:plants -- --affected <base>` selects nothing for `tooling/**` and
  `gates/test/**` (op 016 class 1), and the phase records that run.

## Files to change

| File | Change |
|---|---|
| `gates/test/integration/fold-history.test.ts` | Red: the five tests of *Test approach*. The existing test stays as it is. |
| `tooling/speckit/bin/fold-history.sh` | The four changes of *Approach*, and three lines in the header comment. |
| `tooling/speckit/README.md` | In the `bin/fold-history.sh` description (lines 33 to 36), one phrase: "signs every commit it rebuilds when `commit.gpgsign` is on and refuses an unsigned result or a range that holds main's commits". |

Unchanged, and the review checks it: `.claude/skills/**` (`ocelle-run`, `ocelle-land`), `gates/bin/signoff.ts`,
`.github/**`, the re-sign scripts under other missions' `reviews/`, and the script's interface and JSON shape.

## Approach

All in `fold-history.sh`. Line numbers are those on main (`c97da54`).

1. **Signing switch** (after `old_head` and `base`, `:31-32`):
   `sign=(); [[ "$(git config --bool commit.gpgsign || true)" == true ]] && sign=(-S)`.
2. **Main guard** (after the merge check, `:33`): for each of `refs/remotes/origin/main` and `refs/heads/main` that
   `git rev-parse -q --verify` resolves, collect it. If any, compare
   `git rev-list --count "$base..$old_head"` with `git rev-list --count "$base..$old_head" --not <refs>`. If they
   differ: `die "<n> commits of pr-base..HEAD are on main; pick a base after them"` (the message has no double
   quote, since `die` writes it into JSON unescaped). The fold has built nothing yet. Q1 is settled as refuse
   (`op.md`).
3. **Sign the rebuild** (`:72-73`): `git commit-tree "${sign[@]}" "$tree" -p "$parent"`, and the assignment gets
   `|| die "could not build the folded commit for $last (git commit-tree failed; is the signing key usable?)"`.
   `emit_group` runs in the main shell, so `die` ends the script with exit 2 before `update-ref` and `reset`. Keep
   `commit-tree` as a direct `git` argument (no `git -c …` before it): the test's wrapper looks for it by name.
4. **Check the rebuilt commits** (in the `problems` block, `:83-90`): when `sign` is set, for each value of `map`,
   `git cat-file commit "$n" | grep -qE '^gpgsig(-sha256)? '` or add `folded commit $n is not signed`. The existing
   exit-1 path prints them and leaves `HEAD` unmoved, with no prefold ref.
5. **Check the remap commit** (`:120-121`): run the `git commit` as the condition of an `if`, so `set -e` does not
   end the script on a signing failure. When it fails, or when `sign` is set and `HEAD` has no signature header:
   `git reset -q --hard "$old_head"`, `git update-ref -d "refs/ocelle/prefold/$label/$branch"`, print
   `{"ok":false,"old_head":…,"problems":["the remap commit could not be signed"]}` and exit 1. With signing off, a
   failing `git commit` takes this same rollback path (a small behaviour change for a case that today leaves the
   branch half folded; no test depends on the old behaviour).
6. **Header comment**: add that the fold signs with `-S` when `commit.gpgsign` is on, refuses unsigned results, and
   refuses (exit 2) a range with commits reachable from `origin/main` or `main`.

The existing outside-evidence failure path (`:129-132`) is not changed (out of scope).

## Test approach (red first)

All five tests go in `gates/test/integration/fold-history.test.ts`, in one test-only commit, run against the
current script. Shared setup, extracted into a local helper in the file (not changing the existing test's
assertions):

- a temporary repository as in the existing test (`GIT_CONFIG_GLOBAL=/dev/null`, `GIT_CONFIG_NOSYSTEM=1`), with a
  base commit, an unkept commit, a phase base, a red commit with `reviews/phase-1/base.sha` and `red-commits`, and a
  green commit, so the fold rewrites the phase base;
- signing: `gpg.format ssh`, `user.signingkey <tmp>/key` (a throwaway file), `commit.gpgsign true`, and
  `gpg.ssh.program <tmp>/signer`, a shell script the test writes. Git runs it as `ssh-keygen -Y sign … <file>` and
  reads `<file>.sig`; the script writes a fixed `-----BEGIN SSH SIGNATURE-----` block there. Variants: one that
  exits 1 always, and one that exits 1 when `<file>` contains `remap evidence SHAs`. The signer is set after the
  setup commits where a variant needs it.

  **Why not a real SSH key (triage item 4).** `ssh-keygen` is not installed here, and CI's setup is not known to
  have it. A test that needs it would fail for setup reasons (forbidden by VIII as a red reason) or have to skip
  (vacuous). The fold checks the `gpgsig` header, and git writes that header from whatever the signing program
  returns, so the throwaway program exercises the same code path in the script. Signature verification is out of
  scope (triage).
- a wrapper directory for test 2: an executable `git` that, when its arguments contain `commit-tree`, drops every
  argument starting with `-S` and runs the real git (`command -v git` resolved by the test) with `--no-gpg-sign`
  after `commit-tree`; otherwise it runs the real git unchanged. It is put first on `PATH` for the fold run only.

Each assertion is one `toEqual` on an object of observable facts (exit code, `ok`, a problem matched by text, `HEAD`,
the prefold ref's existence, the evidence files, and per-commit `gpgsig` presence):

1. Signed fold: exit 0, `ok:true`, base.sha rewritten, and every commit of `<foldBase>..HEAD` has a signature
   header. Red: the rebuilt commits have none.
2. Unsigned rebuild (wrapper): exit 1, `ok:false`, a problem matching `is not signed`, `HEAD` and base.sha
   unchanged, no prefold ref. Red: exit 0, `ok:true`.
3. Signer always fails: exit 2, `ok:false`, `HEAD` and base.sha unchanged, no prefold ref. Red: the script moves
   `HEAD`, creates the prefold ref, then dies in the remap commit with no JSON.
4. Signer fails on the remap buffer: exit 1, `ok:false`, `HEAD` is the old head, no prefold ref. Red: `HEAD` moved,
   prefold ref present, no output.
5. Main guard: `git branch main <the unkept commit>`, then the fold from the base commit: exit 2, `ok:false`, a
   problem matching `on main`, `HEAD` unchanged, no prefold ref. Red: exit 0.

The existing test (`commit.gpgsign false`) is the guard for FR-006 and stays green before and after.

The red log (`red.sh 1 phase`) must show each of the five failing on its assertion, not on setup. If the fake signer
does not work on the runner, that is a setup failure: stop and report it, do not loosen the test.

## Constitution Check

| Principle | Status |
|---|---|
| I to VII | Not touched: no element, token, story, baseline, manifest or package change. |
| VIII Test-first | Five red tests first, in a test-only commit; each fails on behaviour. No test weakened; the existing one is untouched. |
| VIII Gates are proven | No CI gate changes, so no plant (operator constraint). |
| VIII Mutation | No TypeScript source changes; nothing for Stryker to mutate. Recorded in the phase review. |
| DCO / supply chain | Trailers kept as today. No secret: the test's key file and signer are throwaway files in a temporary directory. |
| Workflow | Approved triage 021; op, one phase, reviewed like a mission phase. No new public surface, no open design question (Q1 settled as refuse, reversible at review). |

No Complexity Tracking entry.

## Stop conditions

- If the change needs a new option or argument of the script, or a change to a skill, stop and record in `op.md`
  that the work has grown beyond the op.
- If the operator rejects "refuse" for Q1 and wants excluded commits remapped, the triage becomes
  `decision-needed` (triage *What would change this decision*).
