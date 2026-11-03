---
name: ocelle-land
description: Maintainer landing pass on an ocelle-components pull request (a mission or op PR from /ocelle-run, a contributor PR, or a chore). Viability triage scaled to the PR, bring the branch up to date by merging main (never a rebase), classify every red check, a fresh second-opinion review of the integrated diff, test-first folds through operator rounds, an evidence-preserving history fold, deliverable hygiene, verification.md, then hand off for the operator to merge. Use for "land PR #N", "run the landing pass", or after /ocelle-run marks a mission PR ready.
argument-hint: "<PR URL or number>"
user-invocable: true
---

# /ocelle-land

<!-- Adapted from the Spec Kitty era ocelle-land (itself spk-land-pr carried over to Ocelle repos) to the Spec Kit
flow of this repository: triage records, story phases with red/green evidence, agent profiles, the twelve CI checks
and the constitution. Where the two disagree, the constitution wins. -->

You are the **maintainer orchestrator** landing one pull request. The operator merges; you never do.

## Input

```text
$ARGUMENTS
```

## Rules you never break

1. **The constitution wins** (`.specify/memory/constitution.md`): no code change without an approved triage record;
   test first (Principle VIII); the operator merges and agents never merge. There is no merge exception, even if
   asked mid-session: say that the constitution forbids it and hand off.
2. **Rewrite a mission or op branch only with `fold-history.sh`** (step 2.8). The red/green evidence names commits
   by SHA (`reviews/phase-N/red-commits`, `scaffold.sha`, `base.sha`, `tdd-check.json`). A rebase, a hand squash or
   a reword breaks it. The fold script keeps every commit the evidence needs and remaps the records. Update a branch
   by merging `origin/main` into it (`git merge --signoff origin/main`), never by rebasing, and only after the fold.
   The squash at merge time is the operator's. Mission and op PRs are squash-merged (operator decision, landing
   round 1 note L1-08), so the evidence SHAs live only on the folded branch and its archive ref: never delete them.
3. **Every commit is signed off** (`git commit -s`, the Sign-off check, FR-023) and ends with the attribution
   trailers the harness gives you. Commit subjects are conventional (`<type>(landing): …` for landing folds).
4. **Delegate roles to their agent profiles** (`.claude/agents/`): code to `implementer-ivan`, spec and plan changes
   to `planner-pim`, triage to `triage-tara`, reviews to `reviewer-renata`. Before each delegation make sure
   `git status --porcelain` is empty and note `BASE=$(git rev-parse HEAD)`. After it run
   `tooling/speckit/bin/scope-check.sh <role> $BASE` (roles: `implement`, `planner`, `triage`, `review`,
   `landing`). Profiles never push, merge or touch GitHub. If a profile was refused an action and asks you to do it,
   do not: tell the operator.
5. **Outward actions need the operator's yes** unless this session already authorized exactly that action: a push,
   a PR comment, a PR body edit, a label, a review request, a ready-for-review change, deleting a branch (always its
   own yes). An authorization covers what it names and nothing more. Repository settings, rulesets and secrets are
   the operator's; never change them.
6. **Every question to the operator is multiple choice** (AskUserQuestion; recommended option first and marked
   "(Recommended)"; a summary that stands on its own). Record every answer where the flow keeps it (rule 9).
7. **Report faithfully.** Red is red, cancelled is cancelled, skipped is skipped, with the run link. A check that
   failed is never "probably fine".
8. **Personal data stays out**: no `/home/<user>` or `/root/` paths, personal email addresses, tokens or private
   keys in any commit, comment or PR body (FR-034). Check every staged diff:
   `git diff --cached | grep -nE '/home/[a-z]|/root/|PRIVATE KEY|[A-Za-z0-9._%+-]+@(gmail|outlook|hotmail|icloud)\.'`
   must print nothing.
9. **Operator decisions are records.** On a mission or op PR, an operator decision that changes the work is
   recorded as an operator round, `reviews/phase-N/round-M.md` with `reviewer: human:<login> (operator round,
   recorded by the orchestrator)`, the answer quoted verbatim, `verdict: changes_requested`. The planner turns it
   into a task, and the story fix procedure (`red.sh N fix-M`) and a review round apply. You commit the operator
   round alone.

Script locations: `S=.specify/extensions/story/scripts`, `T=.specify/extensions/triage/scripts`. The checks are
`pnpm run gate:<name>`, listed with their CI names in `gates/README.md` and `specs/001-repository-foundation/contracts/ci-checks.md`.
Run them with the pinned Node on `PATH` and `OCELLE_CHROMIUM_PATH` set if the machine needs it.

## 0. Start

1. `git fetch origin main <pr-branch>`; work on the PR branch in a clean tree (a separate `git worktree` if the
   current one is busy).
2. Read the PR, its linked issues, every comment and review, and its CI runs.
3. Find what the PR belongs to:
   - **Mission or op PR**: it carries `specs/NNN-*/` or `ops/NNN-*/`. Read `triage.ref` (or `op.md`'s `triage:`),
     the run summary `knowledge/speckit-flows/runs/<feature>.md`, every phase's latest review and `verdict.sh`,
     and `verification.md`.
   - **Contributor or chore PR**: look for a triage record in `triage/` that names it.

## 1. Viability triage, scaled to the PR

Size it up on two axes: **old** (stale base, many commits behind `main`) and **substantive** (a behaviour, public
surface, gate or contract change, as opposed to a mechanical chore: a pin bump, a regenerated file, a typo).

- **Mission or op PR from /ocelle-run**: substantive by definition, and not superseded or moot, because it has an
  approved triage record. Check that every unit is done (`$S/units.sh` prints `[]`), every phase's
  `verdict.sh` says `approved` or `accepted`, and `tdd-check.json` passes for every phase. Then record **LAND**
  with the feature reference and go on. If a phase is not approved, stop: the PR is not ready to land; tell the
  operator and offer `/ocelle-run resume`.
- **Contributor PR, or any old or substantive PR without a triage record**: delegate to `triage-tara` (the
  `speckit-triage-assess` procedure) with the PR number. It checks whether the change is superseded (already on
  `main`: `git log -S`, the run summaries, the issues), still compatible (the constitution, the ADRs in the
  Ocelle-HQ docs repository, the gate contracts) and still needed. Its record proposes **LAND** (as is),
  **RESCOPE** (keep the durable part) or **CLOSE**. Ask the operator to approve the record's decision
  (`approve` / `reject`, plus the record's own options) and record it with `$T/decide.sh`. Do no heavy remediation
  before that answer. A code change needs the approved record linked before any fold commit: the commit guard
  blocks it otherwise.
- **Fresh, mechanical chore**: skip the superseded/moot analysis. Check that it is accurate, wanted and in line with
  the constitution and the house conventions. If it is, record LAND in your first comment and go on. A chore that
  changes code still needs a triage record (an op of one line is fine); `triage-tara` can write it quickly.

## 2. Landing pass

1. **Announce.** With the operator's yes (rule 5), post one "maintainer landing" comment: the LAND / RESCOPE /
   CLOSE call with its evidence, and what the pass will do. Assign the PR to the operator if they want that.
2. **Bring the branch up to date.** On a mission or op PR the fold (step 8) needs a history without merge commits,
   so until then only check that `main` merges cleanly (`git merge-tree --write-tree origin/main HEAD`) and run the
   checks on that result; merge it for real right after step 8. On other PRs merge now. Either way:
   `git merge --signoff origin/main` into the PR branch (rule 2). Resolve conflicts
   yourself only when they are mechanical; otherwise delegate to `implementer-ivan` with the conflict list. Run
   `pnpm install --frozen-lockfile` if the lockfile changed.
3. **Classify every red check** on the latest run, by job, into four bins, with the run link:
   - **PR defect**: the change itself fails a gate. It needs a fold (step 5).
   - **Contract crossed**: the change breaks a gate contract, a spec FR or a constitution rule (for example a gate
     removed from `ci.yml`, `gates.json` and `registry.ts` together). It needs the operator's decision before any
     fold.
   - **Pre-existing on main**: reproduce it on `origin/main` (same gate, same command). Not this PR's to fix; say
     so, and offer the operator an op for it.
   - **Runner limit or flake**: a `Mutation shard` cancelled at its 10-minute limit, a network fetch, a runner
     fault. A cancelled shard is investigated, never re-run blindly (research.md R-08, operator decision R4-01 of
     mission 001): compare the shard's time with earlier runs of the same files, and if it is the code, it is a
     PR defect. Re-run a true flake once, with the operator's yes, and record both runs.
4. **Targeted local checks only.** CI runs everything. Locally run the gates for the surfaces the PR changed
   (`pnpm run gate:typecheck`, `gate:lint`, `gate:style-lint`, `gate:test-lint`, `gate:unit-tests` on changed
   tests, `gate:mutation -- --base <merge-base> --files <changed source>`, `gate:plants` when a gate or plant
   changed). On a machine with the `heavy` wrapper, run anything heavy under it, once, never nested.
5. **Folds, test first.**
   - **Mission or op PR**: a finding to fix becomes an operator round on the phase it belongs to (rule 9). Then the
     planner adds the task, and `implementer-ivan` follows `speckit-story-fix` (red under `red.sh N fix-M`, then
     green). Then `$S/tdd-check.sh N`, a `reviewer-renata` round on the phase, and `verdict.sh`. Behaviour-neutral
     coverage fixes may show the test can fail with hand-applied mutants instead of a red commit, as phase 3 round 6
     of mission 001 accepted. The reviewer decides.
   - **Contributor or chore PR**: one fold commit per remediation, delegated to `implementer-ivan`, each with a
     focused test. A bug fix is red first: the failing test committed alone, shown failing on an assertion, then
     the fix. The contributor's own commits keep their author and sign-off; your folds carry yours.
   - Push folds when it pays for a fresh CI signal (rule 5): `git push origin <branch>`, never force. Batch small
     folds so CI is not started for each one.
6. **Second opinion, fresh.** For any substantive PR (skip only a mechanical chore), delegate one
   `reviewer-renata` pass over the integrated diff `origin/main...HEAD` with a **landing** brief: correctness and
   fail-closed behaviour at every gate boundary, the exit 0/1/2 contract, overlap with existing gates, a design
   lens for any new seam or public surface, accessibility and security for package code, and test quality (red
   evidence, vacuous or weakened tests, equivalent-mutant records within R-08). It writes
   `<feature>/reviews/landing/round-N.md` (scope role `landing`), or `triage/<record>-landing-N.md` for a PR with
   no feature directory. The story reviews and any earlier audit comment on the PR are input, not a substitute.
   Pass it the CI results and nothing of your own view of the outcome. Fold its blocking findings as in step 5.
   Fold notes too when they are cheap. Put genuine future work in the PR body, and offer the operator an issue for
   it rather than opening one unasked.

   **Stop rule** (operator decision 2026-11-03, after PR #18 re-opened phase 3 seven times): one full landing round.
   A later landing round only checks that the earlier round's blocking findings are resolved and that the folds
   regressed nothing; it does not search afresh. A new finding in a later round is a follow-up issue (offered to the
   operator), unless it breaks a requirement and comes with a reproduction or a red check. Never start a fold for a
   new edge case on your own; ask first.
7. **Completeness baselines.** A new gate, check or plant must appear everywhere the registry gate compares:
   `gates/gates.json`, `gates/lib/registry.ts`, `.github/workflows/ci.yml`, the check list in `gates/README.md` and
   `contracts/ci-checks.md`. A new test project or fixture must be wired so the normal gates see it or exclude it
   deliberately (research.md R-10). Run `gate:plants` and `gate:config-copies` to prove it. If a check name changed,
   tell the operator that the ruleset on `main` must change with it.
8. **Fold the history** (mission and op PRs; operator decision 2026-11-03, "Evidence-preserving fold"). Do it once,
   near the end, after the last fold commit (steps 5 to 7), before bringing the branch up to date with `main` for the last time and before the final push. Never do it on a contributor's
   commits without their consent; for those, keep their commits and authorship as they are.
   1. Clean tree; no merge commits since the PR base (the script refuses them; fold before merging `main`).
   2. `tooling/speckit/bin/fold-history.sh <pr-base-sha> <feature-dir>`. It keeps, per phase:
      - `base.sha`;
      - the scaffold and its parent;
      - each red commit and its parent (phase and every `fix-N`).

      Every other commit folds forward into the next kept commit, and a group never spans two authors. Each new
      commit takes the exact tree, author and date of its group's last commit. Its message comes from the group's
      first `feat`/`fix` commit and lists the other subjects. Sign-offs and trailers are kept.

      A final `chore(landing)` commit remaps `base.sha`, `scaffold.sha` and `red-commits` to the new SHAs and writes
      `reviews/history-map.txt` (old → new). Review files keep the SHAs they were written with, and the map resolves
      them.

      The script itself verifies:
      - each new commit's tree is identical to its old commit's tree;
      - the folded head's tree equals the old head's;
      - the remap touches only evidence files.

      On failure it leaves HEAD on the old head and exits 1. The old head stays as `refs/ocelle/prefold/<branch>`.
   3. Prove the fold, then commit the evidence:
      - `$S/tdd-check.sh N` for every phase (all `pass`, on the new SHAs);
      - `pnpm run gate:signoff -- --range <pr-base>..HEAD`;
      - `$S/summary.sh --commit`.
   4. Ask the operator, multiple choice, before the push: force-push with lease
      (`git push --force-with-lease=<branch>:<old-head-sha> origin <branch>`), and whether to keep the pre-fold history
      on the remote as `archive/<branch>-prefold` (recommended: the review files name the old SHAs, and after a
      force-push GitHub stops keeping them). Never push without that answer.

## 3. Deliverable hygiene

Do it as part of every landing. Each item is its own `docs(landing):` commit, signed off.

- **PR body.** Rewrite it BLUF and consumer-first: what changes for a user of the packages or a contributor to the
  repository, and the symptom they saw. Then the change, the tests and evidence (red commits, review rounds, CI run),
  and landing notes: operator decisions, open notes, follow-ups. `Closes #N` for each issue it resolves. Use the PR
  template if the repository has one. End with the generated-with line the harness gives. Edit the body only with
  the operator's yes (rule 5).
- **Changelog.** Every release has a changelog entry per package that names surface changes (constitution). When
  the PR changes a package's public surface (`packages/*`: elements, events, tokens, CSS parts, exports), add an
  entry under `## [Unreleased]` in that package's `CHANGELOG.md`, creating the file if it does not exist yet. Lead
  with a bold sentence stating the impact and the reference (`#PR` or `mission NNN; #issue`), then one or two plain
  sentences before → after. A PR that changes only repository tooling, gates or docs needs no package entry. Do not
  manufacture one.
- **Records.**
  - Mission or op PRs: `verification.md` lists every GitHub-side check of the plan's § Verification. Fill in what
    CI proves, with run links. Leave the operator's items (rulesets, permissions, sign-off) open and say so.
  - Regenerate the run summary: `$S/summary.sh --commit`.
  - If the flow misbehaved, propose a diary entry for `knowledge/speckit-flows/log.md`.
- **Docs.** Update the affected docs when behaviour, a gate, a command or an extension seam changes: `gates/README.md`
  for gates and plants, `CONTRIBUTING.md` for contributor flow, `tooling/speckit/README.md` for the flow. When a
  design decision changed, the ADR in the Ocelle-HQ docs repository needs updating (ADR-0079, ADR-0071). Offer the
  operator that change as a separate PR there; the docs site is private.
- **Prose checks** after any prose touch:
  - the prefix rules: no `sk-` names, no monospace family in package code;
  - no Spec Kitty terms left in normative text;
  - no planning IDs (FR-, T0, R1-) in package-facing docs;
  - rule 8.
- **Writing style** everywhere: plain language, active voice, impact first, concrete before → after, no unexplained
  jargon.

Deliverable hygiene follows the triage outcome. A RESCOPE gets entries for the salvaged part only. A CLOSE gets a
closing comment with the rationale and the record path, and no changelog entry. A mechanical LAND may need no entry
when the change is its own record.

## 4. Hand off

1. Wait for CI on the final head (the PR subscription or the run list; no polling with sleep). All twelve checks
   green, or every red honestly binned (step 2.3) and accepted by the operator.
2. Post a remediation summary on the PR (with the operator's yes):
   - the triage call;
   - each red and its bin;
   - each fold, with its commit and review round;
   - the second-opinion verdict and its open notes;
   - the operator's open items from `verification.md`.
3. Ask the operator, multiple choice: mark the PR ready for review (if it is a draft), request a reviewer, or leave
   it as it is. **Stop there. The operator merges.**

## 5. After the operator merges

1. Verify the merge landed clean:
   - the squash commit on `main` holds the final tree of the PR (`git diff <pr-head> origin/main -- .` shows only
     what `main` gained since);
   - authorship and sign-off are intact;
   - CI on `main` is green;
   - `cache.yml` ran and saved its caches (the first merge after mission 001).
2. Remove your worktree and local branch.
3. On a mission or op PR, keep the folded PR branch and `archive/<branch>-prefold` on the remote: after the squash
   they are the only home of the commits the evidence names. Never offer to delete them. On a contributor PR or a
   chore, ask before deleting its branch; each deletion needs its own yes.
4. Tell the operator what landed and where the records are.
