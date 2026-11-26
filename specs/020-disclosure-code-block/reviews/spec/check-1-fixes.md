# Spec check 1 fixes

| ID | Resolution | Where |
|----|------------|-------|
| SPEC-1-01 | answered (operator, "Copy textContent always", 2026-11-20): one model, the shadow root renders a copy of `textContent` in every mode with no default slot; a mutation observer follows text changes; the module's `slotchange` trigger never fires and its focus handover goes to the frame | spec.md header (operator decisions); FR-020; FR-024; FR-029; FR-035; Edge Cases "Markup inside a code block"; US2 scenarios 20 and 21; Key Entities |
| SPEC-1-02 | fixed: three cases with stated start states and exact counts (0, 0, 1 with `detail.open === true`), counted after a later task and `updateComplete` | US1 scenario 7 |
| SPEC-1-03 | fixed: one rule (breaks only between the prefix and the first group or between groups, never inside the prefix or a group), measured as one `getClientRects()` rect per prefix and group | US2 scenario 12; FR-033 (and its README rule) |
| SPEC-1-04 | fixed: the measure is the `name` values of the StaticText nodes under the block in CDP `Accessibility.getFullAXTree`, concatenated in tree order, equal to the trimmed digest, plus Playwright's `ariaSnapshot` as one text run; the node count is not asserted; the fallback applies only when this measure fails | US2 scenario 11; FR-032; SC-004 |
| SPEC-1-05 | answered (operator, "Go ahead on recorded copy", 2026-11-20): plan on #13's recorded copy; disabled disclosure and exclusive accordion group stay out of scope; a requirement read later goes back to the operator | spec.md Issues paragraph; header (operator decisions); Scope "Out of scope"; Assumptions 1 and 2 |
| SPEC-1-06 | fixed: "as native `details` coalesces" removed, the explicit rule is the definition, the event is dispatched in a later task after the host reflects the final state | FR-012 |
| SPEC-1-07 | fixed: scenarios for the consumer icon (both states, hidden from assistive technology), `:state(open)`, focus out of a closing panel, and the empty code block | US1 scenarios 17 to 19; US2 scenario 19; FR-005; FR-011; Edge Cases |
| SPEC-1-08 | fixed: the custom-states sentence removed from FR-007; FR-011 says `:state(open)` is the only custom state | FR-007; FR-011 |
| SPEC-1-09 | fixed: hover changes the summary's background colour to a token the plan names, with a scenario | FR-014; US1 scenario 21 |
| SPEC-1-10 | fixed: if the measure fails, the run stops and the operator decides whether FR-010 and US1 scenario 10 are dropped | FR-010; Assumptions (find in page) |
| SPEC-1-11 | fixed: copied text is the trimmed content; the FR-032 fallback must still meet FR-031 | US2 scenario 10; FR-031; FR-032; SC-004 |
| SPEC-1-12 | fixed: a character is a Unicode code point | FR-029; FR-033 (README rule) |
| SPEC-1-13 | fixed: `element.click()` clicks the summary and toggles once; a click dispatched on the host does not toggle, and the element stops no host click (unlike rule 1) because panel clicks must reach the page | FR-004; FR-054; US1 scenario 20 |
| SPEC-1-14 | fixed: the README advises against a host `aria-label` on a code block (use `label`), and no story sets one | FR-026 |
