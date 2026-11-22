# Fixes for spec check 3

Operator decision at the spec gate (2026-11-13, human:jeroennouwsdev): "approve after a final fix". This is the final
spec fix; no further spec check follows. The decision is recorded in spec.md under "Operator decision at spec check 3".

| ID | Resolution | Where |
|----|------------|-------|
| SPEC-3-01 | fixed | spec.md FR-010a (new "Precedence" clause: in every selection tabs and the segmented choice make without user action, on first render, in FR-011a's fallbacks and when a child becomes enabled while none was, the first enabled child with the remembered value is picked if present, else the rule's own target; children added or enabled in one operation are taken together); FR-010 (first-render pick subject to FR-010a); FR-011 (focus goes with the selection when precedence picks the remembered child); FR-011a (a parent with no children counts as "no child is enabled"; appended children count as a child becoming enabled; refers to FR-010a precedence); FR-021 and FR-027 (refer to FR-010a precedence); User Story 2 scenario 18 (enabling again defers to a remembered value); new User Story 2 scenario 20 (empty tabs, `value = "tasks"`, all tabs appended at once: `Tasks` selected, panel shown, tab stop, no event; plus enabling `Spec` and `Tasks` at once); new User Story 3 scenario 17 (empty segmented choice, all segments appended at once: `Blocked` pressed, tab stop, no event); Edge Cases (parent with no children); checklists/requirements.md |

Notes SPEC-3-02 to SPEC-3-04 are not changed in this fix; by the operator's instruction they are left for the plan
squad to answer in its decisions or research.
