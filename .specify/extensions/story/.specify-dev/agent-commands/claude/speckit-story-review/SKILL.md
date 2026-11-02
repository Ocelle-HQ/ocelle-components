---
name: speckit-story-review
description: Review one implemented phase against its spec, plan, tasks and the constitution; write a verdict, change no code
compatibility: Requires spec-kit project structure with .specify/ directory
metadata:
  author: Ocelle-HQ
  source: story:commands/speckit.story.review.md
---

# Review One Phase

Review the work of **one** phase as an independent reviewer and write the verdict. You did not write this code;
judge it on the evidence. **Do not change any source, test, story or task file.** The only file you write is the
review.

## User Input

```text
$ARGUMENTS
```

The input names the phase: `phase=<N>` or a bare number. If it names none, stop with an error.

## Steps

1. Run `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` and read `FEATURE_DIR`.
   Read `spec.md`, `plan.md`, `tasks.md`, `.specify/memory/constitution.md` and the earlier review rounds of this
   phase in `FEATURE_DIR/reviews/phase-<N>/`, if any.
2. The change under review is `git diff $(cat FEATURE_DIR/reviews/phase-<N>/base.sha)..HEAD` plus any uncommitted
   change. If `base.sha` is missing, stop with an error: the phase was not started through the story workflow.
3. Check, and cite file and line for every finding:
   - **Tasks:** every task of `## Phase <N>:` is ticked and its work is actually present; nothing outside this
     phase was changed without a reason.
   - **Story:** for a user-story phase, each acceptance scenario of that story in `spec.md` is met and covered by
     a test that would fail without the change.
   - **Constitution:** each principle that applies (`ocelle-` names and events, no I/O in elements, tokens only
     and the brand rules, accessibility including the shadow-root ID rule and keyboard models, strict CSP and no
     network requests, stories and baselines per state, tests for every event).
   - **Plan:** the structure and decisions of `plan.md` are followed.
   - **Checks:** run the project's checks that exist (typecheck, lint, unit, interaction, visual, axe, CSP). A
     failing check is a blocking finding.
   - **Earlier rounds:** every blocking finding of the previous round is resolved, as the fix note claims.
4. Classify each finding as `blocking` (must change before the phase is accepted) or `note` (worth doing, does not
   block). Do not invent findings to look thorough; an empty list is a valid result.
5. Write `FEATURE_DIR/reviews/phase-<N>/round-<k>.md`, where `<k>` is one more than the highest existing round
   (1 for the first review). Use exactly this frontmatter, then the body:

   ```markdown
   ---
   phase: <N>
   round: <k>
   verdict: approved | changes_requested
   base: <base sha>
   head: <HEAD sha>
   ---

   # Phase <N> review, round <k>

   ## Findings

   | ID | Severity | Where | Finding | Required change |
   |----|----------|-------|---------|-----------------|
   | R<k>-01 | blocking | path:line | ... | ... |

   ## Checks run

   ## Earlier findings
   (each blocking finding of round <k-1>: resolved or not, with evidence)
   ```

   `verdict` is `approved` only when there is no blocking finding and every check passes; otherwise
   `changes_requested`.
6. Commit only the review file: `docs(review): phase <N> round <k> — <verdict>`, signed off. Do not push.

## Report

The verdict, the number of blocking findings and notes, and the review file path.