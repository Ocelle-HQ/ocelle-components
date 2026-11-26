# Spec Kit tooling: test-first by user story, with review rounds

Spec Kit's `/speckit-implement` runs every task in one go, with no review. This directory adds a
test-first implement → check → review → fix loop: `tasks.md` is worked one `## Phase N` section at a
time (Spec Kit's tasks template already gives each user story its own phase). Each phase is written red
first, an automatic red/green check proves the tests can fail, an independent review follows, and fix
rounds run until the review approves (constitution Principle VIII).

Sources live here; `specify` installs copies into `.specify/` and `.claude/skills/`, which are
committed so a fresh clone works without a reinstall. After editing a source, reinstall it:

```bash
specify extension remove story && specify extension add --dev tooling/speckit/extensions/story
specify workflow remove ocelle-story && specify workflow add --dev tooling/speckit/workflows/ocelle-story
# likewise ocelle-implement and ocelle-sdd
```

## Two ways to run the same flow

| | Interactive: `/ocelle-run` | Unattended: Spec Kit workflows |
|---|---|---|
| Start | `/ocelle-run #4` or `/ocelle-run resume` in Claude Code | `specify workflow run ocelle-triage -i issues="#4"` |
| Roles | subagents (agent profiles in `.claude/agents/`) | one `claude -p` process per command step |
| Gates | questions in the chat | terminal prompts or `specify workflow resume` |
| Loops and caps | the skill, deciding only from the scripts' JSON | the Spec Kit engine |
| Permissions | the session's, answered live | the `.claude/settings.json` allowlist only |

Both use the same commands, scripts and record files, so run summaries and the diary compare across them.

**Landing:** `/ocelle-land <PR>` (`.claude/skills/ocelle-land/`) is the maintainer pass after a mission or op PR
is ready, or on a contributor PR: viability triage, bring the branch up to date by merging `main` (never a rebase,
which would break the red/green evidence SHAs), classify every red check, a fresh `reviewer-renata` landing review
(scope role `landing`), test-first folds through operator rounds, an evidence-preserving history fold of what came after the last phase fold (`bin/fold-history.sh`: keeps
every base, scaffold and red commit and its parent, folds the rest, remaps the evidence SHAs and verifies the trees; signs every commit it rebuilds when `commit.gpgsign` is on and refuses an unsigned result or a range that holds main's commits;
`/ocelle-run` runs it after each approved phase, with the label `phase-N`, and pushes the pre-fold head as
`archive/<branch>-prefold-phase-N`),
after the history fold and the last merge of `main` the sanctioned redaction of the merged tree (step 2.9, op 023,
operator decision 2026-11-20: `bin/redact-sandbox-paths.sh --in-place` on the files `pnpm run gate:sandbox-paths`
finds, one `chore(landing)` commit of those files alone, proved by `bin/redact-sandbox-paths.sh --verify HEAD` and the
gate's exit 0; it is skipped when the merged tree has no redaction script or the gate already passes),
deliverable hygiene, then hand-off. The operator merges.

**Agent profiles:** `triage-tara`, `analyst-anouk` (spec check, analysis), `planner-pim` (spec and squad fixes, op
setup; never code), `lens-lotte`, `refuter-rik`, `verifier-vera`, `implementer-ivan`, `reviewer-renata`. Each
follows the matching command file, so both runners share one procedure. Read-only roles have no Edit tool.

**Enforced outside the model:**
- After merging `main`, run `.specify/extensions/story/scripts/base.sh N --with-main <merged-main-sha>`
  for each phase being replayed. Commit `replay-upstream.sha` with the review evidence. The replay compares the
  final head to the phase base with that exact main revision integrated, and replays the original red commits on
  their historical revisions. The synthesized base, scaffold and fix-parent snapshots live locally. A conflicting
  snapshot is a replay failure that needs to be resolved before review.
- `bin/scope-check.sh <role> <base>`: after each delegated step, the files changed since `<base>` must be ones the
  role may touch (for example a review only under `reviews/phase-N/`); `/ocelle-run` redoes a step that strays.
  Exit 0 allows the step, exit 1 reports out-of-scope paths in JSON, and exit 2 means the check could not run.
- `bin/guard-commit.sh`, a PreToolUse hook in `.claude/settings.json`: blocks `git commit --no-verify`, and blocks
  a commit that changes code unless the current feature links to an approved triage record (`triage.ref` for a
  mission, written by `link.sh`; the `triage:` field of `op.md` for an op).

## What runs

| Workflow | Does |
|---|---|
| `ocelle-triage` | `triage-tara` decides mission / op / fold / none / decision-needed for the given issues → operator gate (recorded) → a mission runs `ocelle-sdd`; an op is set up under `ops/` and runs `ocelle-implement` |
| `ocelle-sdd` | specify → `ocelle-spec-check` → plan → `ocelle-plan-squad` → gate → tasks → analyze (saved as `analysis-report.md`) → gate → `ocelle-implement` |
| `ocelle-spec-check` | spec-only check after specify; fixes blocking findings (up to three checks); operator gate |
| `ocelle-plan-squad` | adversarial squad on spec and plan: lenses → refute → forks → fix → verify; fresh-eyes rounds until clean (three rounds at most) |
| `ocelle-implement` | for every phase that still needs work, in order: `ocelle-story`; then a final gate |
| `ocelle-story` | one phase: red → green, then batches of up to three rounds of check → review → fix; after a batch without approval the operator picks more rounds, accept or stop |

```bash
specify workflow run ocelle-triage -i issues="#4"                  # start here: triage, then mission or op
specify workflow run ocelle-sdd -i spec="Design tokens package"   # the whole cycle
specify workflow run ocelle-implement                              # tasks.md exists already
specify workflow run ocelle-story -i phase=3                       # one phase
specify workflow status                                            # runs and paused gates
specify workflow resume <run-id>                                   # answer a gate (needs a terminal)
```

Each agent step (`claude -p`) is a fresh session, so the reviewer has seen only the code, the
spec, the plan and the constitution, never the implementer's reasoning. The commands can also be
run by hand in Claude Code: `/speckit-story-implement 3`, `/speckit-story-review 3`,
`/speckit-story-fix 3`.

## The loop for one phase

1. `base.sh N` records the commit the phase starts from (`reviews/phase-N/base.sha`).
2. `/speckit-story-implement N`:
   - **red**: writes the phase's tests, commits them alone, and runs `red.sh N phase`, which runs the
     tests at that commit and records it in `red-commits` only if it changed nothing but tests **and**
     the tests fail. A vacuous red is not recorded; the agent must strengthen and amend.
   - **green**: implements, ticks the tasks, runs the checks, commits.
   - A phase without behaviour writes `tdd-exempt.md` instead; the review judges the reason.
3. Batches of up to three rounds:
   - `tdd-check.sh N` (no agent, clean worktrees) checks every recorded red commit is tests-only and
     red, that **the final tests fail against the code from before the phase**, and that they pass at
     HEAD. Writes `tdd-check.json`; any problem is a blocking finding.
   - `/speckit-story-review N` writes `reviews/phase-N/round-K.md` with `verdict` and `tdd_check` and
     a findings table (blocking or note), including a test-quality section (weakened tests, vacuous
     assertions, mutation results). It changes no code.
   - On `changes_requested`, `/speckit-story-fix N` fixes test-first: a behaviour defect gets a red
     test first (`red.sh N fix-K`); a weak test is strengthened and proven by the next check. It writes
     `round-K-fixes.md` and commits. The next round re-checks and re-reviews.
4. After a batch without approval the gate offers **more-rounds** (another batch of three),
   **accept** (records `operator-accepted.md`, continues) or **reject** (stops). After five batches
   (15 rounds) only accept or reject remain.

## Triage and ops (before anything else)

The `triage-tara` agent profile (`.claude/agents/triage-tara.md`) reads the issues, searches related issues,
pull requests, `specs/`, `ops/` and earlier triage records, and writes `triage/NNN-slug.md`: the decision, the
issues in and out of scope, the semver impact and a one-line spec prompt. It never touches GitHub. The operator
approves or rejects at the gate; `decide.sh` writes `status`, `decided_by` (git user.name) and `decided_at`
into the record and commits it.

| Decision | Then |
|---|---|
| mission | `ocelle-sdd` with the record's spec prompt |
| op | `/speckit-triage-op-setup` writes `ops/NNN-slug/` (`op.md` record, short spec, plan, one-phase tasks) and makes it the current feature; after the op gate, `ocelle-implement` runs it test-first with review rounds |
| fold | a note naming the feature whose spec must grow |
| none, decision-needed | nothing starts |

## Spec check (after specify)

`/speckit-analyze` needs `tasks.md`, so the spec gets its own check (`squad` extension):
`/speckit-squad-spec-check` writes `reviews/spec/check-K.md` (blocking / operator / note findings, a
`clean` or `issues` verdict); `/speckit-squad-spec-fix` fixes the blocking ones. The loop stops when no
blocking finding is left (three checks at most); operator questions go to the gate, where the operator
answers them in `spec.md` or with `/speckit-clarify`.

## Adversarial plan squad (after plan)

Per round, under `reviews/plan/round-R/`:

1. **Lenses** (`/speckit-squad-lens`, four fresh sessions in parallel, no commits):
   `correctness`, `a11y-security`, `testability`, `fresh`. Each writes `lens-<name>.yaml` with
   evidence-backed findings and one remedy (a fix) or several (a fork).
2. **Refute** (`/speckit-squad-refute`): tries to knock every finding down against the artifacts and the
   repository; writes `refute.md` with confirmed / refuted / duplicate and fix / fork; commits the round.
3. **Forks**: the operator writes the chosen letter in the Decision column; the gate asks again until
   every fork is decided.
4. **Fix → verify** (`/speckit-squad-fix`, then `/speckit-squad-verify` in a fresh session), up to three
   passes per batch; after a batch with unresolved findings: more-rounds, accept (recorded) or reject.
5. Round 1 runs every lens; rounds 2 and 3 run only `fresh`, attacking the fixes. A round that confirms
   nothing ends the squad.

## Guards against vacuous tests

| Guard | Catches |
|---|---|
| `red.sh` records only tests-only, failing commits | tests that pass before the code exists |
| `tdd-check.sh`: final tests vs the old code | tests rewritten after red so they pass regardless |
| `tdd-check.sh`: red commit is in HEAD's history | a red commit that was rebased away |
| Review: `git diff <red>..HEAD -- tests` | tests weakened, skipped or deleted after red |
| Review: assertion rules (Principle VIII) | assertion-free, conditional, snapshot-only, mock-only tests |
| Mutation testing (`mutation_command`) | tests that run the code but would not notice it changing |
| Gate plants in CI | a gate that passes everything |

## Focused phase verification and complete CI

The repository's story runner uses Vitest's configured project/file inventory. It runs the phase's changed test files
at each red commit and the phase head. For the final proof, it runs the related cases with the final test files overlaid
on the phase base, any scaffold, or the parent of a red review-fix commit. Red evidence records the changed assertion site
and its diagnostic. A shared assertion can provide red evidence when the stack maps it to a changed caller in the selected
test. The caller and helper assertion must both match on replay. A missing implementation module is accepted on a pre-scaffold base only when the scaffold supplies that
module and the assertions fail on the scaffold. Setup, collection, non-assertion, unrelated and incomplete failures
block review.

When a phase changes shared test helpers or fixtures, list every additional runnable consumer, one repository-relative
path per line, in `reviews/phase-N/test-scope.txt`. The reviewer checks the list against the shared changes. A shared
change without a list triggers the full suite for that sub-check. Completed, matching sub-checks can resume from the
local `reports/story-evidence/` directory. The check logs say which project and files ran, which inputs were tested, and
whether evidence was reused. Remove that local directory for a fresh execution.

When a Storybook story implements the requested behavior, add a reviewed `implementation-story <path>`
line to the same file. For example, `implementation-story storybook/stories/change-list-plan.stories.ts`
keeps that file at its base, scaffold, review-fix parent, or head revision during replay. The phase's
separate test must supply the named red assertion, including when `tdd-exempt.md` exists. Use an exact
repository-relative `.stories.ts` path under `storybook/stories/`. The runner rejects conflicting local or
CI-only declarations and red commits that change a declared implementation story. Ordinary story fixtures
retain the usual test-overlay behavior.

Use `ci-only <repository-relative path>` in the same file to run a changed collateral integration test in required
CI. The eligible suites in the `gates-integration` project are:

- `gates/test/integration/visual.test.ts`
- `gates/test/integration/visual-findings.test.ts`
- `gates/test/integration/visual-cli.test.ts`
- `gates/test/integration/visual-capture.test.ts`
- `gates/test/integration/axe.test.ts`

Use this for maintenance of existing assertions such as exact story or baseline
counts. A suite with a recorded red assertion or helper, a build or browser behavior proof, or a suite also listed
as a local consumer must stay local. At least one changed runnable test must remain in the focused head run.
The phase report lists the deferred project/file identities in `tdd-check.json` under `deferred_ci`. The reviewer verifies each against
the successful required `Unit tests` inventory and shard results for the same candidate and checks the corresponding
required visual or accessibility job before approval.

Start the review handoff when the tested merge revision and Unit inventory artifact are available. Include the
revision, project, file and shard for each deferred suite. Reviewers can inspect the implementation and completed
receipt artifacts as the matching shards finish. Record approval after the exact required Unit and dedicated gate
results pass. Collect evidence changes before the final fold, then run all required checks on the final revision.

For an approved parallel task group, run
`tooling/speckit/bin/worktree-return-check.sh REPO BASE WORKTREE PATH... [--worker WORKTREE PATH...]`
as each worker returns and again for the group before staging. Use the exact returned head from a successful JSON
receipt. The check verifies the common repository, pin, clean return, signed commits, historical paths and disjoint
ownership. Record worker return and staging times with the combined red or green receipt.

The required GitHub `Unit tests` check verifies the complete discovered inventory across isolated runners, with timing-sensitive
projects retaining their Vitest settings. The local `pnpm test` command still runs the complete suite. To compare both paths
on a same-repository PR, include `<!-- verify-unit-test-parity -->` in its description before opening or pushing to the PR.
That run requires the normal full gate to pass too and compares project, file, test identity and outcome with the shards.

## Verification pilots

For a component change, run the preflight as soon as the canonical manifest and the focused Storybook tests are ready.

- Run `node tooling/speckit/bin/component-preflight.ts manifest` to list full custom-elements manifest Plant overlays and check each overlay's exact expected findings. Assign the listed paths before capture and preserve the intended seeded findings when updating the generated declarations.
- For a changed shared Storybook host, run `node tooling/speckit/bin/component-preflight.ts host --source <host> --test <file> --project <project>` for each assigned focused file. Check the listed owners in normal and default mutation discovery, then record the actual scoped mutation result for the host on the same source candidate. Keep the built browser, accessibility, visual and CSP proofs in the plan.

On a same-repository PR, `<!-- verify-mutation-config-shadow -->` starts the pinned #87 comparison. The mixed arm and the separate element and default arms run the original selectors. Read the comparison artifact for the exact mutant inventory, verdict, setup and baseline times, slowest job, runner minutes and retries.

For the Visual evidence reuse trial, first collect successful control CI on a source candidate and its evidence-only successor. Once the successor's exact run has completed, add `<!-- verify-evidence-reuse: RUN_ID/ATTEMPT -->` to the same-repository PR body using the earlier run and attempt. Read `visual-evidence-reuse-shadow` for eligibility on the current head, verified inputs, and the reason for any mismatch. Both candidates have their own required CI and the current candidate needs fresh Sign-off and Sandbox paths results. Count possible savings separately from executed runner time.

After each pilot ticket, attach the control and pilot links to its retrospective. Record elapsed time from issue pickup, time to the first actionable failure and to verified green, runner minutes, failures and retries, verdict and coverage parity, and preflight misses or rework. Apply and verify any workflow adjustment on its own evidence before selecting the next eligible ticket. When no adjustment is warranted, record the observed results that support continuing.

## Configuration

`.specify/extensions/story/story-config.yml` (source copy in `extensions/story/`): `test_command`,
`focused_runner`, `setup_command`, `test_pathspec`, `mutation_command`. Until `test_command` is set the check reports
`unavailable`, which the review treats as blocking for any phase with behaviour, so the first feature
must set up the test runner and fill these in.

## Running the agent steps headless

Each agent step is `claude -p`, which cannot answer permission prompts. `.claude/settings.json` allows
what the commands need (file edits, local git without push, the Spec Kit and story scripts, the pnpm
scripts) and denies push, publish, `reset --hard`, `clean` and reading `.env` files. When a new script
or command joins the flows, add it to the allowlist. Spec Kit also passes extra flags through
`SPECKIT_INTEGRATION_CLAUDE_EXTRA_ARGS` (for example a permission mode) for a one-off run.

Reviews live in the feature directory (`specs/NNN-name/reviews/`), so they are part of the
project record. A rerun of `ocelle-implement` skips phases that are done and approved (or accepted).

## Limits (Spec Kit 1.2.5)

- Gates are answered on a terminal; a run without one pauses and is resumed with
  `specify workflow resume`.
- Phases run one after another (`max_concurrency: 1`): later phases build on earlier ones.
- Rounds per batch (3) and the batch cap (5) are literals in `ocelle-story`; change them there.
- The scripts are bash only.
