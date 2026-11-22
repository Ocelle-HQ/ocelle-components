---
check: 1
---

# Fixes for spec check 1

Operator answers applied: 2026-11-12, human:jeroennouwsdev (SPEC-1-09 to SPEC-1-12).

| ID | Resolution | Where |
|----|------------|-------|
| SPEC-1-01 | fixed | spec.md "What 'announced' means here" (snapshots; announcement defined as a change of a region present in two consecutive snapshots; insertion and reveal: the region first appears empty, then takes the text once; a region that appears with text, as on first load or `announce` set later, has not announced); FR-008; Key Entities "Announcement" |
| SPEC-1-02 | fixed | spec.md FR-009 (table for no role or other role, `alert`, `status`, each with and without `announce`; first load; no nested region whose text also changes); "What 'announced' means here" (counted over every live region node at or inside the host, nested regions count twice); US1 scenarios 7, 15; SC-002 |
| SPEC-1-03 | fixed | spec.md FR-008 ("The notice's text": text nodes, `ocelle-icon` `label`, `img` `alt`, skipped `hidden`, `aria-hidden`, `script`, `style`, `template` subtrees, other accessible names do not count; "A change": any light-DOM, `tone` or `role` mutation that alters text or politeness); US1 scenario 19 (slotted link and icon) |
| SPEC-1-04 | fixed | spec.md FR-006 (heading absent when no element is assigned or the assigned elements' text content is empty or whitespace); US1 scenario 4 (empty `<span>` case, corrected wording); Edge Cases |
| SPEC-1-05 | fixed | spec.md US1 scenario 4 and SC-004 use one measurement: content-box top to the top of the body's first line box is 0, both sizes, with and without forced colours |
| SPEC-1-06 | fixed | spec.md FR-010, FR-025 (`--ocelle-border-width`); FR-028 (error boundary `--ocelle-bar-width`, an existing token; no new token) |
| SPEC-1-07 | fixed | spec.md FR-020 (autofill not measured, README limitation); US2 scenario 16 (history restore by navigating away and back); FR-035 |
| SPEC-1-08 | fixed | spec.md FR-022 (host `aria-label` wins; otherwise external labels in `element.labels` order, then `label`, joined by one space; host `aria-labelledby` not supported and names nothing); US2 scenario 13 (exact strings); Edge Cases |
| SPEC-1-09 | answered | spec.md Issues, "Operator answers at spec check 1", Assumptions (last item); checklists/requirements.md Notes |
| SPEC-1-10 | answered | spec.md "Operator answers at spec check 1", FR-008, US1 scenario 17, Edge Cases, SC-002 |
| SPEC-1-11 | answered | spec.md "Operator answers at spec check 1", FR-027, FR-035, US2 scenario 18 (first-load error), US3 scenario 7, Edge Cases |
| SPEC-1-12 | answered | spec.md "Operator answers at spec check 1", FR-025 (host `display: block`, control fills the inline size), US2 scenario 19, US3 scenario 7 |
| SPEC-1-13 | fixed | spec.md US1 scenarios 7, 8, 10 use "parsing" as FR-008 does |
| SPEC-1-14 | fixed | spec.md FR-003 cites FR-024 only |
