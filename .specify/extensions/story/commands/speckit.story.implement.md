---
description: "Implement the open tasks of one tasks.md phase (a user story) and commit them"
---

# Implement One Phase

Implement the open tasks of **one** phase of the current feature's `tasks.md`, then commit. A phase is one
`## Phase N: ...` section; user-story phases are the unit of review in this project. Do not touch tasks of any
other phase.

## User Input

```text
$ARGUMENTS
```

The input names the phase: `phase=<N>` or a bare number. If it names none, stop with an error: this command
never picks a phase itself.

## Steps

1. Run `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` from the repository
   root and read `FEATURE_DIR`. Read `tasks.md`, `plan.md`, `spec.md`, and, if present, `data-model.md`,
   `contracts/`, `research.md`, `quickstart.md`, and `.specify/memory/constitution.md`.
2. Run `.specify/extensions/story/scripts/base.sh <N>` once, before any change. It records the commit this phase
   starts from in `FEATURE_DIR/reviews/phase-<N>/base.sha`; the review diffs from there.
3. Find the `## Phase <N>:` section. Its open tasks (`- [ ] T...`) are the work. If it has none, report that and
   stop without a commit.
4. For a user-story phase, read that story's section of `spec.md` (priority, acceptance scenarios, independent
   test). The phase is done when that story's acceptance scenarios pass, not merely when its tasks are ticked.
5. Execute the tasks in order. Respect `[P]` markers and file dependencies. Write tests before the code they
   cover where the tasks say so, and keep to the constitution (tokens only, `ocelle-` names, accessibility,
   strict CSP, a story per state).
6. Tick each finished task as `- [X]` in `tasks.md`. Leave a task open if it is not finished, and say why.
7. Run the project's fast checks that exist (typecheck, lint, unit and interaction tests). Fix what this phase
   broke. Report any check that still fails; do not hide it.
8. Commit all changes of this phase in one commit: `feat(<feature>): phase <N> — <phase title>` with the task ids
   in the body, signed off (`git commit -s`). Do not push.

## Report

Tasks done, tasks left open (with reasons), checks run and their result, and the commit id.
