# Operator decision: op 023, verify-mode red label and skill edits (2026-11-21)

About tasks T026–T030 of `ops/023-public-repo-hygiene/tasks.md`:

- **Red label for T027:** `fix-0`. red.sh accepts it, it cannot clash with review rounds (they start at 1), and
  tdd-check.sh checks it like any other red commit. The `phase` record (`25ecc2d`) stays.
- **Skill edits in T029:** yes, as planned. The implementer changes `.claude/skills/ocelle-land/SKILL.md` and
  rule 6 of `.claude/skills/ocelle-run/SKILL.md` with the text in `plan.md` ("Landing redaction"), and the review
  checks them.

Source: the operator (jeroennouwsdev), answered at a gate of the /ocelle-run session for #60.
