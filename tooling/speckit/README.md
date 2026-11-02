# Spec Kit tooling: implement by user story, with review rounds

Spec Kit's `/speckit-implement` runs every task in one go, with no review. This directory adds the
implement → review → fix loop: `tasks.md` is worked one `## Phase N` section at a time (Spec Kit's
tasks template already gives each user story its own phase), and after each phase an independent
review runs, followed by fix rounds until the review approves.

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
| `ocelle-sdd` | specify → gate → plan → gate → tasks → analyze → gate → `ocelle-implement` |
| `ocelle-implement` | for every phase that still needs work, in order: `ocelle-story`; then a final gate |
| `ocelle-story` | one phase: implement, then up to three rounds of review → fix; asks the operator if still not approved |

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
2. `/speckit-story-implement N` does the phase's open tasks, ticks them, runs the fast checks and
   commits.
3. Up to three rounds:
   - `/speckit-story-review N` writes `reviews/phase-N/round-K.md` with `verdict: approved` or
     `verdict: changes_requested` and a findings table (blocking or note). It changes no code.
   - `verdict.sh N` reads that verdict.
   - On `changes_requested`, `/speckit-story-fix N` fixes every blocking finding, writes
     `round-K-fixes.md` (fixed, disputed with a reason), and commits. The next round re-reviews.
4. If the latest verdict is still not `approved`, a gate asks the operator. Approve records
   `operator-accepted.md` and continues; reject stops the run.

Reviews live in the feature directory (`specs/NNN-name/reviews/`), so they are part of the
project record. A rerun of `ocelle-implement` skips phases that are done and approved (or accepted).

## Limits (Spec Kit 1.2.5)

- Gates are answered on a terminal; a run without one pauses and is resumed with
  `specify workflow resume`.
- Phases run one after another (`max_concurrency: 1`): later phases build on earlier ones.
- The round cap (3) is a literal in `ocelle-story`; change it there.
- The scripts are bash only.
