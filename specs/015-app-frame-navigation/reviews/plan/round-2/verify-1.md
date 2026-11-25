# Squad round 2: verify 1

| ID | Status | Reason |
| --- | --- | --- |
| PLAN-FRESH-2-001 | resolved | Spec focus rule 5 and FR-004 cover same-tier layout changes. They preserve surviving focus and define first destination, main and drawer close fallbacks. The state model captures focus before reprojection without emitting a tier event. Source validation item 3 exercises a fixed-width mission-to-project switch with a focused rail link outside and inside the drawer, and checks retention, drawer persistence and fallbacks. |
| PLAN-FRESH-2-002 | resolved | Spec focus rule 1 now qualifies retention on the control surviving collapse. It chooses the first focusable destination in sequential order or main when collapse hides the active control. The state model and source validation item 3 cover an actual interactive sidebar head or footer control, its resulting visibility and the fallback focus target. |
