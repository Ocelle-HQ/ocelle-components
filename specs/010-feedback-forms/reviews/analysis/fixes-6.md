# Analysis fixes 6: 010-feedback-forms

Resolves `analysis-report.md` (head f7979c6; 0 critical, 0 high, 0 medium, 2 low). Operator instruction of
2026-11-13 (human:jeroennouwsdev): make everything ready for implementation. Both findings are spec wording; each
change is an addition and no promise is narrowed. Task IDs, tasks and phase headings are unchanged.

The other artifacts were checked against the new wording. tasks.md already does what the spec now says: T016b
restates `readme.test.ts:74` to `:76` in phase 2, before the form controls arrive in phase 3, and T016a, T022a, T030
and T050a keep `hidden` undeclared. contracts/elements.md already lists `hidden` as documented, not declared.
plan.md's Constitution Check, row VIII, said the pinned fragments are restated "in the red commit of the phase that
adds the element", the rule I17 widens, so it gains "or of an earlier phase" to match the spec and T016b.

| ID | Resolution | Where |
|---|---|---|
| I17 | fixed: FR-001's list of README convention text that the new elements contradict gains "a host `aria-label` used as written, surrounding spaces included, against FR-022 item 1" (`readme.test.ts:76`, `packages/elements/README.md:190-191`), and its phase rule now reads "in the phase that adds the element, or earlier", which describes T016b scoping `:74` to `:76` in phase 2. Plan row VIII says the same. | spec.md FR-001 (:597-601); plan.md Constitution Check (row VIII) |
| I18 | fixed: FR-034's list of observed standard attributes that are not declared opens with "`hidden` on all three elements" (FR-008, FR-027), as contracts/elements.md and T016a, T022a, T030 and T050a already have it. | spec.md FR-034 (:914-917) |
