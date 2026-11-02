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

## What runs

| Workflow | Does |
|---|---|
| `ocelle-sdd` | specify → `ocelle-spec-check` → plan → `ocelle-plan-squad` → gate → tasks → analyze → gate → `ocelle-implement` |
| `ocelle-spec-check` | spec-only check after specify; fixes blocking findings (up to three checks); operator gate |
| `ocelle-plan-squad` | adversarial squad on spec and plan: lenses → refute → forks → fix → verify; fresh-eyes rounds until clean (three rounds at most) |
| `ocelle-implement` | for every phase that still needs work, in order: `ocelle-story`; then a final gate |
| `ocelle-story` | one phase: red → green, then batches of up to three rounds of check → review → fix; after a batch without approval the operator picks more rounds, accept or stop |

```bash
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

## Configuration

`.specify/extensions/story/story-config.yml` (source copy in `extensions/story/`): `test_command`,
`setup_command`, `test_pathspec`, `mutation_command`. Until `test_command` is set the check reports
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
