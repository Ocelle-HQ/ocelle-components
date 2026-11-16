# Squad round 1: fixes 2

Fix pass 2 of batch 1: the two rows `verify-1.md` marks unresolved.

| ID | Resolution | Where |
|----|------------|-------|
| PLAN-A11Y-SECURITY-1-001 | fixed | research R-06 § Indeterminate (WCAG 2.2.2): total stated as `--ocelle-motion-base` × 21, override limit corrected from 1666 ms to 238 ms (5000 / 21); contracts/elements.md README sections (`ocelle-progress`: the README states the × 21 total and the 238 ms limit) |
| PLAN-FRESH-1-009 | fixed | research R-01 § Before upgrade and R-07: selector wrapped whole, `:where(ocelle-facts:not(:defined) > ocelle-fact)`, specificity (0,0,0) as `base.css`' header requires; contracts/elements.md (`@ocelle/styles` README section states the selector and its (0,0,0) override claim) |
