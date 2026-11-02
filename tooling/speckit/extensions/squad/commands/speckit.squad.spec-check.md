---
description: "Check spec.md on its own: ambiguity, testability, acceptance scenarios, constitution conflicts; write a report, change nothing"
---

# Spec Check

Analyse the current feature's `spec.md` on its own, right after `/speckit-specify` and before planning. This is
the spec-stage counterpart of `/speckit-analyze`, which needs `tasks.md` and runs later. **Change no file except
the report.**

## User Input

```text
$ARGUMENTS
```

No input is needed.

## Steps

1. Run `.specify/scripts/bash/check-prerequisites.sh --json --paths-only` and read `FEATURE_DIR`. Read `spec.md`,
   `checklists/requirements.md` if present, `.specify/memory/constitution.md`, and the earlier checks and fix
   notes in `FEATURE_DIR/reviews/spec/`.
2. Check, citing the section or line for every finding:
   - **Ambiguity:** vague words (fast, simple, robust, as needed), undefined terms, `[NEEDS CLARIFICATION]` left in.
   - **Testability:** every functional requirement and success criterion can be shown true or false by a test
     that could fail (constitution Principle VIII). Name the ones that cannot.
   - **Stories:** every user story has a priority, an independent test and acceptance scenarios in
     Given/When/Then form; each scenario is observable (DOM, accessibility tree, events, tokens).
   - **Coverage:** requirements without a story, stories without requirements, edge cases missing for the
     element's states (loading, empty, error, disabled, long text, narrow width, forced colours, both themes).
   - **Constitution:** requirements that conflict with a principle (I/O in an element, raw style values, `sk-`
     names, monospace, inline script or style, a network request).
   - **Scope:** implementation detail in the spec (it belongs in the plan), or a need named with no consumer.
   - **Earlier checks:** each blocking finding of the previous check is resolved as its fix note says.
3. Severity per finding: `blocking` (planning on this spec would build the wrong thing or an untestable thing),
   `operator` (only the operator can answer: a product decision, a priority, a missing fact), or `note`.
   An empty table is a valid result.
4. Write `FEATURE_DIR/reviews/spec/check-<k>.md`, `<k>` one more than the highest existing check:

   ```markdown
   ---
   check: <k>
   verdict: clean | issues
   ---

   # Spec check <k>

   | ID | Severity | Where | Finding | Fix |
   |----|----------|-------|---------|-----|
   | SPEC-<k>-01 | blocking | spec.md FR-003 | ... | ... |
   ```

   `verdict` is `clean` only when no row is `blocking` or `operator`.
5. Commit only the report: `docs(spec): check <k> — <verdict>`, signed off. Do not push.

## Report

The verdict, the counts per severity, and the operator questions word for word.
