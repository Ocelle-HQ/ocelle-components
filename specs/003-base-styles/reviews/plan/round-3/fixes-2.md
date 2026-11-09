# Squad round 3: fixes 2

| ID | Resolution | Where |
|----|------------|-------|
| PLAN-FRESH-3-001 | fixed | research.md R-06 (caption test: `Range.getClientRects()` gives one rect per text-direction run; rects merged per line, same `top` within 1 px, smallest left, largest right, before the containment and start-edge checks; verify-1 rtl measurement recorded; fixture caption ends in a full stop so the merge is exercised), R-06 spike step 5 (same merge); plan.md decision 17 (line box defined as the merged rects) |
| PLAN-FRESH-3-002 (note) | fixed | spec.md Assumptions "Print": "about seven columns" to "about eight columns", as measured |
| PLAN-FRESH-3-003 (note) | fixed | "a default flex item" to "a default item of a row flex container" in spec.md Edge Cases, plan.md decision 14, research.md R-06 host requirement and R-14 README text, contracts/styles-package.md prose hook row |
