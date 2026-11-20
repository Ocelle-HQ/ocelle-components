---
op: 021
triage: triage/021-fold-signing.md
issues: [51]
mode_of_work: task_execution
accountable: "human:jeroennouwsdev"
semver: none
status: started
---

# Op 021: The history fold signs the commits it rebuilds

## Intent

`tooling/speckit/bin/fold-history.sh` rebuilds each folded commit with `git commit-tree "$tree" -p "$parent"`
(`:72-73`). `git commit-tree` ignores `commit.gpgsign`, so every folded commit is unsigned. Only the remap commit,
made with `git commit`, is signed. On `claude/016-overlays` every folded commit of phases 1 to 5 lacks a `gpgsig`
header (triage 021).

This op makes the fold:

1. **sign** every commit it rebuilds (`git commit-tree -S`) when `git config --bool commit.gpgsign` is true;
2. **refuse an unsigned result**: when signing is on and a rebuilt commit or the remap commit has no `gpgsig`
   header, or signing itself fails, the branch stays on the old head, with no prefold ref and no remap commit;
3. **never rewrite main's commits**: if any commit of `<base>..HEAD` is reachable from `origin/main` or `main`, the
   fold refuses to run (exit 2) and changes nothing.

With `commit.gpgsign` off, the fold behaves as it does today. The interface (`fold-history.sh <base> <feature>
[label]`), the evidence remapping and the JSON shape do not change. No element, attribute, event, slot, part, token
or package changes (semver `none`).

Operator constraints (2026-11-16): keep the change small; test-first (constitution VIII), with a plant if a gate is
touched; branches already folded are left as they are.

### Choices the plan makes (triage open questions)

- **Q1: refuse, not exclude.** A range that contains a commit reachable from main makes the fold exit 2 before it
  builds anything. Excluding would silently change what `<base>` means. The triage leaned to refuse; the operator
  can overrule this at the phase review.
- **The main refs.** `refs/remotes/origin/main` and `refs/heads/main`, each one that exists. The fold does not
  fetch. When neither exists (a temporary test repository), there is no guard.
- **Q2: the reference re-sign scripts** are not used. The plan works from the triage record's description alone.
- **The test signer.** `ssh-keygen` is not installed in this environment, so the test uses a throwaway signing
  program (`gpg.ssh.program`, a shell script the test writes) instead of a real SSH key. The fold's check is the
  `gpgsig` header, which that program produces exactly as a real key does. See plan.md *Test approach*.

## Acceptance

Checks 1 to 5 are tests in `gates/test/integration/fold-history.test.ts`. Each fails against the current script.
Every run uses a temporary repository with `gpg.format ssh`, `user.signingkey` (a throwaway file),
`gpg.ssh.program` (the test's signing program) and `commit.gpgsign true`, unless the check says otherwise.

1. **Every commit of the folded range is signed.** After a fold that rewrites at least one commit, every commit of
   `<foldBase>..HEAD` (the rebuilt ones and the remap commit) has a `gpgsig` header. Today the rebuilt commits have
   none.
2. **An unsigned rebuild is refused.** With a `git` wrapper first on `PATH` that removes `-S` from `commit-tree`
   and adds `--no-gpg-sign`, the fold exits 1 with `ok:false` and a problem naming an unsigned folded commit.
   `HEAD`, the evidence files and the refs are unchanged, and there is no `refs/ocelle/prefold/<label>/<branch>`.
   Today it exits 0.
3. **A signing failure while rebuilding changes nothing.** With a signing program that always fails, the fold exits
   2 and prints JSON with `ok:false`. `HEAD` and the evidence files are unchanged and there is no prefold ref.
   Today the rebuild succeeds unsigned, the branch moves, and the remap commit then fails with `HEAD` on the
   folded history.
4. **An unsigned remap commit changes nothing.** With a signing program that fails only for the remap commit's
   buffer (it contains `remap evidence SHAs`), the fold exits 1 with `ok:false`. `HEAD` is the old head and there
   is no prefold ref. Today `HEAD` stays on the folded history, the prefold ref exists, and nothing is printed.
5. **Main's commits are never rewritten.** With a `main` branch at a commit inside `<foldBase>..HEAD`, the fold
   exits 2 with `ok:false` and a problem naming main. `HEAD` is unchanged and there is no prefold ref. Today it
   folds that commit.
6. **Signing off keeps today's behaviour (no red).** The existing test (`commit.gpgsign false`) still passes
   unchanged.
7. **Docs and scope (records, no test).** `tooling/speckit/README.md` says in one phrase that the fold signs what
   it rebuilds and refuses main's commits. The op's diff does not touch the skills, `gates/bin/signoff.ts`, the CI
   workflow, the mission 011 and 008 re-sign scripts, or any already folded branch.

## Constitution principles touched

- **VIII Test-first, proven non-vacuous.** Checks 1 to 5 are written red first in one test-only commit, and each
  fails on its assertion against the current script (not on setup). "Gates are proven, too": this op changes no
  CI gate (`fold-history.sh` is tooling, not a gate in `gates/gates.json`), so no plant is needed. Mutation testing
  covers TypeScript source; the op changes only a shell script and a test.
- **Technology, Licence and Supply Chain (DCO).** The fold already keeps the union of `Signed-off-by` trailers;
  that is unchanged. Signing adds a cryptographic signature beside it.
- **I to VII.** Not touched: no element, token, story, baseline or package surface changes.
