---
description: "Review one implemented phase against its spec, plan, tasks and the constitution; write a verdict, change no code"
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
   Read `spec.md`, `plan.md`, `tasks.md`, `.specify/memory/constitution.md` and the earlier review rounds and fix
   notes of this phase in `FEATURE_DIR/reviews/phase-<N>/`, if any.
2. The change under review is `git diff $(cat FEATURE_DIR/reviews/phase-<N>/base.sha)..HEAD` plus any uncommitted
   change. If `base.sha` is missing, stop with an error: the phase was not started through the story workflow.
3. Read `FEATURE_DIR/reviews/phase-<N>/tdd-check.json`, written by the automatic red/green check just before this
   review (run `.specify/extensions/story/scripts/tdd-check.sh <N>` yourself if it is missing or older than HEAD).
   - `fail`: each listed problem is a blocking finding.
   - `unavailable`: blocking unless this phase sets up the test runner or has no behaviour.
   - `exempt`: read `tdd-exempt.md`; if any test could have failed for this phase, the exemption is a blocking
     finding.
4. **Test quality (Principle VIII).** Read every test added or changed since base, and the red logs:
   - each test failed in the red step for the right reason (missing behaviour, not a setup error);
   - no test was weakened, skipped, deleted or loosened after its red commit
     (`git diff <red sha>..HEAD -- <test files>`); a replacement must be stricter and give a reason;
   - every test asserts observable behaviour and can fail: no assertion-free tests, conditional assertions,
     `skip`/`only`, snapshot-only assertions, assertions on mocks instead of the unit, or swallowed errors;
   - each acceptance scenario of the story and each event and keyboard path has a test.
   - if `scaffold.sha` exists: the scaffold commit (`git show <scaffold sha>`) adds signatures only, with no behaviour
     and no test file, and `tdd-check.json` shows the final tests fail against it.
   - If `mutation_command` is set in `.specify/extensions/story/story-config.yml`, run it on the phase's changed
     source, passing the phase base: `<mutation_command> -- --base $(cat FEATURE_DIR/reviews/phase-<N>/base.sha)`
     (here `pnpm run gate:mutation -- --base <sha>`). A surviving mutant in new or changed code is blocking unless
     you record it as an equivalent mutant with the reason; the command lists the equivalent-mutant records it found
     in the changed code, so read each one and its reason.
5. Check the rest, citing file and line for every finding:
   - **Tasks:** every task of `## Phase <N>:` is ticked and its work is actually present; nothing outside this
     phase was changed without a reason.
   - **Constitution:** each principle that applies (`ocelle-` names and events, no I/O in elements, tokens only
     and the brand rules, accessibility including the shadow-root ID rule and keyboard models, strict CSP and no
     network requests, stories and baselines per state).
   - **Plan:** the structure and decisions of `plan.md` are followed.
   - **Checks:** run the project's checks that exist (typecheck, lint, unit, interaction, visual, axe, CSP). A
     failing check is a blocking finding.
   - **Earlier rounds:** every blocking finding of the previous round is resolved as the fix note claims, and a
     behavioural fix came with a red test (`red-commits` has a `fix-<round>` entry).
6. Classify each finding as `blocking` (must change before the phase is accepted) or `note`. Do not invent
   findings to look thorough; an empty list is a valid result.
7. Write `FEATURE_DIR/reviews/phase-<N>/round-<k>.md`, where `<k>` is one more than the highest existing round
   (1 for the first review). Use exactly this frontmatter, then the body:

   ```markdown
   ---
   phase: <N>
   round: <k>
   verdict: approved | changes_requested
   base: <base sha>
   head: <HEAD sha>
   tdd_check: pass | fail | exempt | unavailable
   ---

   # Phase <N> review, round <k>

   ## Findings

   | ID | Severity | Where | Finding | Required change |
   |----|----------|-------|---------|-----------------|
   | R<k>-01 | blocking | path:line | ... | ... |

   ## Test quality
   (red evidence, weakened tests, vacuous assertions, mutation result)

   ## Checks run

   ## Earlier findings
   (each blocking finding of round <k-1>: resolved or not, with evidence)
   ```

   `verdict` is `approved` only when there is no blocking finding, every check passes and `tdd_check` is `pass`
   (or a justified `exempt`); otherwise `changes_requested`.
8. Commit the review file together with the evidence it rests on, and nothing else: everything new or changed
   under `FEATURE_DIR/reviews/phase-<N>/` (`tdd-check.json`, the `check-*.log` and `red-*.log` files). Message:
   `docs(review): phase <N> round <k> — <verdict>`, signed off. Do not push.

## Report

The verdict, the number of blocking findings and notes, the TDD check status, and the review file path.
