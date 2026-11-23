---
triage: 021
issues: [51]
decision: op
target: "ops/021-fold-signing"
in_scope: [51]
out_of_scope: [1]
semver: none
spec_prompt: "Op for #51 (triage/021-fold-signing.md): make tooling/speckit/bin/fold-history.sh sign every commit it rebuilds (git commit-tree -S when commit.gpgsign is on), fail (exit 1, branch reset to the old head, no prefold ref, no remap commit) when a rebuilt commit lacks a gpgsig header while commit.gpgsign is on, and refuse or exclude any commit of <base>..HEAD that is reachable from main, so main's commits are never rewritten; red first in gates/test/integration/fold-history.test.ts with a throwaway SSH signing key; branches already folded unsigned are left as they are; the mission 011 and 008 re-sign scripts, the skills and the Sign-off gate are unchanged."
status: approved
decided_by: "human:jeroennouwsdev"
decided_at: 2026-11-16T16:57:18Z
---

# Triage 021: sign the commits the history fold rebuilds (#51)

## Issues read

- **#51.** This session could not read GitHub. The proxy refuses GraphQL (`gh issue view`, `gh search issues`)
  and `gh api` was denied. So the body, comments, labels, milestone, parent and linked PRs of #51 are not read here.
  What this record knows of #51 comes from the operator's brief and from the repository:
  - The operator has chosen the remedy. `tooling/speckit/bin/fold-history.sh` must sign every commit it rebuilds
    (`git commit-tree -S`). It must fail when a rebuilt commit has no `gpgsig` header while `commit.gpgsign` is on.
  - If the fold script has the same `rev-list` range problem as the re-sign scripts, it must also leave main's
    commits out of the rewrite.
  - Branches that were already folded stay as they are. The change is to be kept small.
- **The defect, seen in the repository.** I counted `gpgsig` headers with `git cat-file commit` on the last 50
  commits of each branch:
  - `origin/claude/016-overlays` (mission 008): each phase's folded commits have no signature. The scaffold, red and
    `feat` commits of phases 1 to 5 all lack one: `c51d6a6`, `0e72b53`, `7cc7aa3`, `0f427ea`, `39006c3`, `f953298`,
    `af4edf9`, `813ae74`, `c3fd06c`, `294a51d`, `ff0c90f` and `35fb858`. So do the `docs(plan)` commits folded
    between the phases. The script's own remap commit after each fold (`da56698`, `e46d139`, `adf4603`, `dcd4bf2`,
    `1c4f46f`) is signed, and so is every commit made after it. This fits the script: the rebuilt commits come from
    `git commit-tree` with no `-S` (`fold-history.sh:72-73`), and `commit-tree` does not sign on `commit.gpgsign`.
    The remap commit comes from `git commit`, which does sign.
  - `origin/claude/008-layout-headers` (mission 011): every commit from the PR base `3828d2f` to `3dcf288` is
    unsigned. That range was rebuilt by mission 011's `resign-history.sh`, which forces
    `git -c commit.gpgsign=false commit-tree --no-gpg-sign`. The branch head `285ae9d` is the same commit as
    `archive/claude/008-layout-headers-resign-unsigned`.
  - `origin/main`: every commit is signed (squash merges).
  - In this environment, `commit.gpgsign` is `true` and `gpg.format` is `ssh`.

## Related work found

| Ref | Kind | Relation | Reason |
|---|---|---|---|
| #51 | issue | in scope | The issue being triaged. |
| #1 | epic | out of scope | The component epic. This is tooling, not a component. |
| `tooling/speckit/bin/fold-history.sh` | script on main | in scope (the change) | Builds each folded commit with `git commit-tree "$tree" -p "$parent"` and no `-S` (`:72-73`). It checks trees and evidence, but not signatures. |
| `gates/test/integration/fold-history.test.ts` | test on main | in scope (to extend) | The only fold test. It sets `commit.gpgsign false` (`:38`), so signing is never exercised. The red test goes here. |
| `ops/016-plants-affected` (triage 016, #41) | op, landed (`c4c0af4`) | precedent, no conflict | Last change to `fold-history.sh` (the `plants.md` base remap, O3-04). It is the model for a small op on this script plus its integration test. |
| `specs/011-layout-headers/reviews/landing/resign-history.sh` on `claude/008-layout-headers` | mission 011 one-off script | reference, out of scope | Operator decision 11 of mission 011 (`reviews/operator-decisions-implementation.md:65-74`). It rebuilds `3828d2f..HEAD` while keeping merges, and it explicitly turns signing off. The copy on the branch is still the unsigned version (the branch head equals the `-resign-unsigned` archive ref). The fixed version the operator mentions is not on any remote ref I could find. The op should take the range and signing lessons from it, not its code. |
| mission 008 patched copy on `claude/016-overlays` | reference | out of scope | I found no `resign*` script in the tree or the fetched history (depth 50) of `origin/claude/016-overlays`. It may be uncommitted or on a ref I could not see. See the open questions. |
| `claude/016-overlays`, `claude/008-layout-headers` and the other `claude/*` mission branches already folded | branches | out of scope (operator: left as they are) | Their folded commits stay unsigned. Re-signing them is not part of this op. |
| `.claude/skills/ocelle-run/SKILL.md`, `.claude/skills/ocelle-land/SKILL.md`, `tooling/speckit/README.md` | callers and docs | out of scope unless the interface changes | They call the script as `fold-history.sh <base> <feature> [label]`. This op keeps that interface. Only a new failure message needs mentioning, and the README line can say the fold signs. |
| `gate:signoff` (`gates/bin/signoff.ts`) | gate | unrelated | It checks `Signed-off-by` trailers (DCO), not cryptographic signatures. The fold already keeps the union of trailers. |
| `knowledge/speckit-flows/log.md:130` | finding | related, not covered | That finding is about a missing `Signed-off-by` trailer. It is not about signatures. |

I could not search open or closed issues and PRs on GitHub. A duplicate of #51, or an issue about the re-sign
scripts, may exist and was not seen.

## Decision

**op.** The rule applies because this is one bounded change to a tooling script, with a clear expected behaviour:
every commit the fold creates is signed, and the fold refuses a result that is not. There is no new public surface,
since no element, attribute, event, slot, part, token or package API changes, so the semver is `none`. There is no
open design question, because the operator has already chosen the remedy. It fits in one phase: one script, one
integration test, and a line of the README.

The other decisions do not fit:

- **mission**: nothing public changes, only one story is involved, it does not span packages, and it involves no
  accessibility or component security behaviour.
- **fold**: no feature or op in progress owns `fold-history.sh`. Op 016 has landed.
- **none**: no commit on main fixes this. `fold-history.sh` on main still calls `commit-tree` without `-S`.
- **decision-needed**: the remedy is decided. The one sub-choice left (exclude main's commits or refuse them) is
  small enough to settle in the op's plan. See below.

## Scope

In scope (#51), on `tooling/speckit/bin/fold-history.sh`:

1. **Sign the rebuilt commits.** When `git config --bool commit.gpgsign` is true, every `git commit-tree` call that
   builds a folded commit passes `-S`. It uses the configured `user.signingkey` and `gpg.format`, so SSH signing as
   in this environment works the same way. When `commit.gpgsign` is off, behaviour stays as it is now: unsigned,
   and no failure.
2. **Verify before moving the branch.** Add a `problems` check next to the existing tree checks: each new commit in
   `map` must have a `gpgsig` header (`git cat-file commit <sha>`) when `commit.gpgsign` is on. A missing header
   gives `ok:false`, exit 1, `HEAD` left on the old head, and no prefold ref and no remap commit, as the other
   verification failures do now. The remap commit is made with `git commit`, and the op should check that it is
   signed too, so the whole new range `<base>..new_head` is covered. A signing failure in `commit-tree` itself
   (for example, no key) must also end without moving the branch. Under `set -e` it would end with exit 2 from
   inside a command substitution. The plan should make that path report JSON as `die` does.
3. **Keep main's commits out of the rewrite.** The fold already refuses merge commits in `<base>..HEAD`
   (`:31`). So main's commits can enter the range only through a linear history that contains them, for example a
   branch moved forward onto main, or a `base` older than a main commit the branch contains. The re-sign scripts
   had the same weakness, through the merge's second parent. The op adds a guard: any commit of `<base>..HEAD` that
   is reachable from main (`origin/main`, or the ref the plan picks) is either excluded from the range or makes the
   script refuse to run. Rewriting such a commit would strip GitHub's signature from a commit already on main.
4. **Test first.** Add to `gates/test/integration/fold-history.test.ts`, or a sibling test, a temporary repository
   with a throwaway SSH signing key: `ssh-keygen -t ed25519 -N ''`, `gpg.format ssh`, `user.signingkey`,
   `commit.gpgsign true`, and `gpg.ssh.allowedSignersFile` if verification is used. It asserts these points:
   (a) after a fold, every commit in `<base>..HEAD` has a `gpgsig` header; (b) a forced unsigned rebuild is
   reported as a problem and leaves `HEAD` and the evidence files unchanged; (c) with `commit.gpgsign` off, the
   current behaviour holds, so the existing test still passes; (d) a range containing a commit reachable from the
   main ref is excluded or refused, as decided. Each test is red against the current script.
5. A one-line note in `tooling/speckit/README.md` that the fold signs what it rebuilds.

Out of scope:

- Re-signing branches already folded (`claude/016-overlays`, `claude/008-layout-headers` and the others). The
  operator decided to leave them as they are.
- Mission 011's and mission 008's one-off re-sign scripts. They stay as they are, under their missions' `reviews/`.
- Any change to `gate:signoff`, the commit guard, the CI rulesets, or the fold's interface and evidence remapping.
- Adding signature verification to CI.

## Risks and open questions

- **Q1: exclude or refuse main's commits?** Refusing is safer and smaller: the operator sees the problem and can
  pick a later base. Excluding silently changes what `base` means. I lean towards refuse, but the plan's approval
  should settle it. The plan must also choose the ref (`origin/main` after a fetch, or local `main`) and say what
  happens when that ref is missing. A test repository has no `origin/main`.
- **Q2: the reference scripts.** The operator's references are the fixed re-sign script of mission 011 and the
  patched copy of mission 008. The copy I can read on `origin/claude/008-layout-headers` still has
  `--no-gpg-sign`, and I found no copy on `origin/claude/016-overlays`. If the fixed versions exist only in other
  sessions' working trees, the op's planner should get them from the operator. Otherwise the planner should work
  from this record's description, which is enough on its own.
- **The test needs a signer.** CI and local runs need `ssh-keygen` and git 2.34 or newer for SSH signing. If CI
  lacks `ssh-keygen`, the test must make that visible rather than skip silently, because a silent skip would be a
  vacuous test.
- **Signing when the original commit was unsigned.** Every rebuilt commit gets the folder's signature, but the
  author and committer names and dates are copied from the original. So a folded commit can be signed by a key
  that is not its committer's. That is the operator's choice and matches what the remap commit already does, but
  it is worth stating in the op's spec.
- **Parallel missions.** Missions in flight fold after each phase. Once this lands, their next fold signs; their
  earlier folds stay unsigned (accepted). The shallow fetches in this session could not show whether any branch
  has its own change to `fold-history.sh`. The op's landing merge from main will show it.
- **#51 was not read.** If the issue asks for more, such as re-signing existing branches or a CI check for
  signatures, this record's scope is narrower than the issue's.

## What would change this decision

- If #51, or the operator, also asks to re-sign the branches already folded, or to require signed commits in CI,
  this becomes several independent changes. Those parts should be split out, as a separate op each, or a mission
  if the CI ruleset needs a design decision.
- If signing must also change the re-sign scripts and the skills (`/ocelle-land`'s one-exception rule), this is
  still an op, but its scope grows by those files.
- If the operator wants excluded main commits remapped in a special way, the record becomes `decision-needed` on
  Q1.
- If #51 turns out to describe a different defect from the unsigned `commit-tree` output seen here, the record
  must be redone with the issue read.
