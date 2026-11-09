# Spec check 1: fixes

| ID | Resolution | Where |
|----|------------|-------|
| SPEC-1-01 | fixed | FR-012 (on the root element the compact hook does not change the root font size; body and descendants get the compact scale, `rem` tokens keep their value); FR-008 (regular scale unless the body or an ancestor carries the compact hook); US2 scenario 4 (root 16 px, body 14 px / 1.5, `--ocelle-target-min` 44 px, prose `h1` 30 px); Edge case "Root font size changed by the user"; US2 summary |
| SPEC-1-02 | fixed | New FR-024 (nearest hook wins for size and line height; prose sets `--ocelle-font-size-md`; prose does not override a nested compact region; other prose styles still apply); FR-015 (prose container sets `--ocelle-font-size-md`); US2 scenario 5 (16 px / 26.4 px and 14 px / 21 px); Edge case "Nested hooks" |
| SPEC-1-03 | fixed | SC-002 (a guard assertion shares its test with the positive assertion it guards and is proven by a named plant; plants listed); FR-007 (guards paired with reset assertions and plants); US1 scenario 4 (borders paired with the forced-colours focus outline), US1 scenario 6 rewritten (SPEC-1-05), US3 scenario 5 (inside and outside on one page, plant: leaked prose rule), US4 scenario 2 (hooked and unhooked copy on one page, plant: wrap on every element) |
| SPEC-1-04 | fixed | FR-010 (base stylesheet declares no `transition`, `animation` or `scroll-behavior`; source-level check proven by a planted `transition`); US1 scenario 3 rewritten as that check; US1 summary and Independent Test; FR-022 (reduced-motion emulation no longer needed) |
| SPEC-1-05 | fixed | US1 scenario 6 (without `tokens.css`: `box-sizing: border-box`, body margin `0`, focus outline style not `none`; README order statement by a documentation check); FR-009 (outline style survives missing tokens); FR-022 |
| SPEC-1-06 | fixed | FR-002 (line heights in `packages/styles` must be token references; token-only lint tightened for `packages/styles/**/*.css` to reject a literal line height; planted `line-height: 1.65`); SC-002 plant list |
| SPEC-1-07 | fixed | FR-017 (role `table`, rows, column headers, cells and header-to-cell association in the accessibility tree, both themes, overflowing or not; wrapper fallback as an operator fork); new US3 scenario 7; Assumptions "Table scroll box" refers to FR-017 |
| SPEC-1-08 | fixed | FR-019 (underline in every state, WCAG 2.2 1.4.1); US3 scenario 6 (underline at rest, hover and focus); Assumptions "Link contrast against text" (link against ink is about 2.9:1 light and 1.8:1 dark, so the contrast-pair route is not available) |
| SPEC-1-09 | fixed | FR-016 (`pre` wraps with `white-space: pre-wrap` and `overflow-wrap: anywhere`, does not scroll, copy unchanged); new US3 scenario 8 at 320 px; Edge case "Zoom to 200% and 320 px width" (code blocks named; only tables scroll, so it stays correct) |
| SPEC-1-10 | fixed | FR-015 (`h1` > `h2` >= `h3` >= `h4` >= prose text size); US3 scenario 1; Assumptions "h3 and h4 sizes" (example now `--ocelle-font-size-fact` 17 px and `--ocelle-font-size-md` 16 px) |
| SPEC-1-11 | answered | Operator, 2026-11-09, human:jeroennouwsdev, "Add all five (Recommended)": new paragraph "Operator decision at the spec check" under Issues; FR-021 (none of the five snaps to an existing token) |
| SPEC-1-12 | fixed | FR-015 (every element in prose other than `h1` to `h4` takes the prose line height, list of elements incl. block-quote paragraphs and table cells); US3 scenario 1 |
| SPEC-1-13 | fixed | FR-015 (the plan fixes the weight per heading level; tests assert it per level); US3 scenario 1 |
| SPEC-1-14 | fixed | FR-013 (size is `--ocelle-font-size-sm`, parenthesis removed); US2 scenario 3 asserts the size |
| SPEC-1-15 | fixed | FR-005 and Assumptions "Hook form" (classes only with operator approval at a plan fork); FR-004 (allowed values fixed in the plan, including whether `data-ocelle-density="regular"` resets a nested region) |
| SPEC-1-16 | fixed | FR-001 ("no `@import` and no `url()`"; inline style now refers to stories and fixtures); US1 scenario 5 uses the same rule |
| SPEC-1-17 | fixed | FR-020 (MUST NOT set `word-break`, `hyphens: auto`, `text-overflow: ellipsis` or `white-space: nowrap`; copy test as behavioural check) |
| SPEC-1-18 | fixed | US4 scenario 1 and SC-005 (column with the identifier as wide as the same column with a short text, `auto` or `minmax(0, 1fr)` track) |
| SPEC-1-19 | fixed | FR-020 (sets no font property; ids combine it with the value hook); US4 scenario 4 |
| SPEC-1-20 | fixed | New FR-025 (stylesheet order, specificity bounds (0,0,1) and (0,1,1), logical properties for RTL, forced-colours borders and `hr`); new US1 scenarios 7 and 8, US3 scenarios 9 and 10; Edge cases point to them, "should be easy to override" removed |
| SPEC-1-21 | fixed | US1 scenario 2 (keyboard and pointer in the same test; on click the text input shows the ring, the link, button and `tabindex="0"` element do not) |
| SPEC-1-22 | fixed | SC-006 (README mapping of E-23, E-37, E-39, checked by a documentation test) |
| SPEC-1-23 | fixed | Consumer need ("headings" removed; prose headings stay under rendered Markdown) |
| SPEC-1-24 | fixed | FR-017 (tab stop only when it overflows, arrow-key scrolling, FR-009 focus ring); US3 scenario 3; Assumptions "Table scroll box" |
| SPEC-1-25 | fixed | US3 scenario 6 (`--ocelle-color-link-hover` on hover) |
| SPEC-1-26 | fixed | Assumptions "Comments of #6" (not read for this spec; the plan session confirms or records it before planning). GitHub was not read in this fix step. |
| SPEC-1-27 | fixed | No change needed; mechanisms stay marked as examples (Assumptions "Table scroll box", Edge case "Host CSS") |
