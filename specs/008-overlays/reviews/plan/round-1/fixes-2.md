# Squad round 1: fixes 2

Applied to the artifacts at the commit that adds this note. This pass resolves the rows that verify 1 marks
unresolved.

| ID | Resolution | Where |
|----|------------|-------|
| PLAN-A11Y-SECURITY-1-009 | decided: (a) | spec FR-037 (touch shows no bubble except on a text-field trigger, FR-029); research R-12 "Touch" (tap on a text field matches `:focus-visible`); checks § Tooltip "Touch" names a button trigger |
| PLAN-FRESH-1-003 | fixed | research R-05 "Host focus moves" (page inert during the exit, a `focus()` there has no effect, move focus in the `…-close` listener, README text); spec FR-009, Edge Cases "Focus moved before the close ends"; contract § Focus; plan Decision 14; checks § Dialog "Focus return is conditional" rows (b) move in the `…-close` listener is kept, (c) `focus()` during the exit has no effect and focus lands on the opener |
