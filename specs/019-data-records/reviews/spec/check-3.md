---
check: 3
verdict: clean
---

# Spec check 3

Inputs: `spec.md` (draft, 2026-11-15, after the fixes of `check-2-fixes.md`), `checklists/requirements.md`, the
constitution (1.3.1), and `reviews/spec/check-1.md`, `check-1-fixes.md`, `check-2.md`, `check-2-fixes.md`. Read for
reference on this branch: `packages/styles/src/base.css` lines 88-232 (003's prose rules) and
`packages/tokens/src/source.ts` (contrast declarations, type, space, shape and size tokens).

**Earlier checks.** The one blocking finding of check 2 is resolved as `check-2-fixes.md` says:

- SPEC-2-01: FR-013 now names the nine main grounds. A structural mark uses a token whose contrast declaration, text
  or non-text, covers all nine. It must be an ink token, and the focus, current, link and state colours are excluded.
  FR-021, FR-031 and FR-036 refer to this rule, and US2-8 and US3-8 test the same nine grounds. The tokens confirm
  it: `color-ink`, `-ink-soft` and `-ink-muted` declare `text` on `main` in both themes. `color-control-border` and
  `color-accent-strong` do not cover all nine, as the spec says.

The notes are taken up as the fix note says. SPEC-2-02 is in FR-035 and US3-4 (the scale is xs < sm < md < lg < xl <
2xl, and the plan shows the padding sum). SPEC-2-03 is in FR-012 and US1-10 (`border-collapse` and both `text-align`
values). SPEC-2-04 is in FR-031 and US3-8 (no fill unless the plan names one). SPEC-2-05 is in FR-006 (precedence),
FR-003 (slot re-assignment), US1-15, US1-16, FR-052 (edge cases tested) and the Edge Case "Loading". Items 11 and 12
of SPEC-2-05 are left out with reasons recorded. No `[NEEDS CLARIFICATION]` marker remains, and the checklist has no
open item.

Arithmetic check of FR-035's bound. With the chip at `xs` (12 px) and `line-height-tight` (13.8 px), plus two
`ring-step` outlines (3 px), the chip is 16.8 px. That is under `size-step` (22.4 px), leaving about 2.8 px of block
padding per side. So the bound can be met. `space-1` (4 px) on each side would not fit, and the plan's sum has to
show this.

The rows below are notes only. None blocks planning, and none needs the operator.

| ID | Severity | Where | Finding | Fix |
|----|----------|-------|---------|-----|
| SPEC-3-01 | note | spec.md FR-012 (property list), US1-10; `packages/styles/src/base.css` lines 127-129, 204-223 | FR-012 says "every property" governs, but its list of "the properties 003's rules set today" is not complete. It leaves out the table's `margin-block` (`0 var(--ocelle-space-4)`), which the shared `:where(p, ul, ol, blockquote, pre, table, hr)` rule sets. US1-10 also compares only part of the list. It does not compare the header cells' `font-size`, `font-variant-numeric` or `border-block-end-color`, any cell's `border-block-end`, the table's `max-inline-size` or `margin-block`, or the caption's `inset-inline-start` or `max-inline-size`. A prose override that misses the header size (so the eyebrow is lost inside prose) or the rule colour would still pass every scenario. The caption also inherits the prose container's `line-height-prose`, because FR-005 does not say the data table sets the caption's type. | Add the table's `margin-block` to FR-012's list. In US1-10, compare every property FR-012 lists, on the elements it lists, with the same table outside prose. Or have FR-052 require one test per listed property. The plan can say whether the caption's font size and line height are set by the data table's rules. |
| SPEC-3-02 | note | spec.md US3-6, FR-033, Edge Case "Chip steps mixed with default steps" | In US3-6, "the visible ordinals stay 1 to N in source order of the visible steps" is unclear when chip steps are present. Chips are counted but show no ordinal, so the numbers shown can skip (for example 1, 2, 4, 6). A test written to "1 to N" without gaps would wrongly fail on the Independent Test's chain, which has two chips. | Reword US3-6 as: "each default step's ordinal is its 1-based position among the visible steps, chip steps counted". Add one case with a chip step hidden, then shown again. |
| SPEC-3-03 | note | spec.md FR-033, Edge Case "A very long chain" | "Fitting two digits inside the marker" does not say how it is measured. With `size-step` at 22.4 px and the ring at 1.5 px, a two-digit ordinal at `sm` fits, but the spec does not name the check. | Say how fit is measured. For example: the ordinal's rendered box lies inside the marker's inner box (ring excluded), with no overflow and no clipping, for ordinal 20 in the twenty-step chain. |
| SPEC-3-04 | note | spec.md US1-3, FR-006 | FR-006 lets the headers use 011's or 012's eyebrow tokens if either is on `main`. US1-3 names only 011's. | Make US1-3 say "011's or 012's eyebrow tokens", as FR-006 does. |
| SPEC-3-05 | note | spec.md FR-010, US1-7 | FR-010 takes the caption's trimmed text as the region's name. It does not say what happens when the caption is there but its trimmed text is empty (for example `<caption> </caption>`). The name rules for `aria-label` and `label` say a blank value counts as absent, but the caption rule does not. | Add: "a caption whose trimmed text is empty counts as absent". Add a case to US1-7 for it. |

No row is `blocking` or `operator`, so there are no questions for the operator in this check.
