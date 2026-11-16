# Squad round 3: fixes 3

| ID | Resolution | Where |
|----|------------|-------|
| PLAN-FRESH-3-002 | fixed | research.md R-07 "No feedback", *The observed node*: restated so `.box-size`'s block size (0) never depends on the caption or the table, its inline size does not in a bounded host, and in a shrink-to-fit host it follows the table's width (which the caption's longest word can set) and the write leaves it unchanged only because the width written is exact (the next bullet, *The exact width*). research.md R-07 "A measured width" brought into line (it said the size depends on neither the caption nor the table's block size). No design change; contracts, data-model.md, plan.md and checks.md already agree |
