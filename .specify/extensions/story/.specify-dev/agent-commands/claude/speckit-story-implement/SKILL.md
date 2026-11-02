---
name: speckit-story-implement
description: Implement the open tasks of one tasks.md phase (a user story) test-first and commit them
compatibility: Requires spec-kit project structure with .specify/ directory
metadata:
  author: Ocelle-HQ
  source: story:commands/speckit.story.implement.md
---

# Implement One Phase, Test-First

Implement the open tasks of **one** phase of the current feature's `tasks.md`, red first. A phase is one
`## Phase N: ...` section; user-story phases are the unit of review in this project. Do not touch tasks of any
other phase. Principle VIII of `.specify/memory/constitution.md` (Test-First, Proven Non-Vacuous) is
non-negotiable here.

## User Input

```text
$ARGUMENTS
```

The input names the phase: `phase=<N>` or a bare number. If it names none, stop with an error: this command
never picks a phase itself.

## Steps

1. Run `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` from the repository
   root and read `FEATURE_DIR`. Read `tasks.md`, `plan.md`, `spec.md`, `.specify/memory/constitution.md` and, if
   present, `data-model.md`, `contracts/`, `research.md` and `quickstart.md`.
2. Run `.specify/extensions/story/scripts/base.sh <N>` once, before any change. It records the commit this phase
   starts from; the red/green check and the review diff from there.
3. Find the `## Phase <N>:` section. Its open tasks (`- [ ] T...`) are the work. If it has none, report that and
   stop without a commit. For a user-story phase, read that story in `spec.md` (acceptance scenarios,
   independent test): the phase is done when those scenarios pass, not merely when its tasks are ticked.
4. **Red.** Write the tests for the whole phase first: one or more tests per acceptance scenario and per
   behaviour the tasks name (rendered DOM and accessibility tree, events and payloads, keyboard paths, token
   styles). Each test asserts something that is false today. No assertion-free tests, no assertions in
   conditionals, no `skip`/`only`, no snapshot as the only assertion, no assertion on a mock instead of the unit.
   Change only test files (the `test_pathspec` of `.specify/extensions/story/story-config.yml`).
   - Commit them alone: `test(<feature>): phase <N> red — <phase title>`, signed off (`git commit -s`).
   - Run `.specify/extensions/story/scripts/red.sh <N> phase`. It must report `"tests_only": true` and
     `"red": true`. Read `red-phase.log`: every new test must fail **because the behaviour is missing**, not
     because of a syntax, import or setup error. If any test passes or fails for the wrong reason, fix the
     tests, amend the red commit, and run `red.sh` again.
   - If `red.sh` reports `unavailable` (no test runner yet), the phase must be the one that sets the runner up,
     or a phase without behaviour: in that case write `FEATURE_DIR/reviews/phase-<N>/tdd-exempt.md` saying
     why no test could fail for it, and skip the red step.
5. **Green.** Implement the tasks in order, respecting `[P]` markers and file dependencies, keeping to the
   constitution. Do not weaken, skip, delete or loosen any test written in the red step. If a red test is
   wrong, replace it with a stricter one and record the reason in the commit body.
6. Tick each finished task as `- [X]` in `tasks.md`. Leave a task open if it is not finished, and say why.
7. Run the project's fast checks that exist (typecheck, lint, unit and interaction tests). All tests must pass.
8. Commit: `feat(<feature>): phase <N> — <phase title>` with the task ids in the body, signed off. Do not push.

## Report

The red commit and what failed in it, tasks done, tasks left open (with reasons), checks run and their result,
and the commit ids.