---
check: 2
---

# Fixes for spec check 2

Operator answers applied: 2026-11-13, human:jeroennouwsdev (SPEC-2-03; FR-009 role rows, "Keep: role implies
announce").

| ID | Resolution | Where |
|----|------------|-------|
| SPEC-2-01 | fixed | spec.md "What 'announced' means here" ("The region's text": non-ignored StaticText and `img` names in tree order, an `img`'s descendants and other nodes' names not taken, inline text boxes skipped, each name space-surrounded, whitespace collapsed and trimmed, ignored nodes contribute nothing whatever the snapshot options; equals FR-008's notice text; politeness is the region node's live politeness in the later snapshot, "politely" = `polite`, "assertively" = `assertive`) |
| SPEC-2-02 | fixed | spec.md "What 'announced' means here" (live region node defined by live politeness in the tree, whatever its source); FR-009 table (first row narrowed to roles that give no live politeness; rows added for `log` and other live roles, and for a host `aria-live`, `aria-atomic` or `aria-relevant`, both not supported: README, not specified, not tested); US1 scenario 15; Edge Cases; FR-035; SC-002 ("each supported host role row") |
| SPEC-2-03 | answered | spec.md "Operator answers at spec check 2"; FR-027 (inserted control with `error` announces politely once, each control once, a move in one task is not an insertion); "What 'announced' means here" (insertion case covers the control); US2 scenario 20; US3 scenario 7; Edge Cases; Key Entities "Announcement" |
| FR-009 (operator, check 1 fix role rows) | answered | spec.md "Operator answers at spec check 2"; FR-009 (paragraph after the table records the decision); US1 scenario 15 |
