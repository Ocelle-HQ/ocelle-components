# Operator decisions on the phase 1 spike (reviews/phase-1/spike.md)

- **Date:** 2026-11-18
- **Decided by:** human:jeroennouwsdev

- **Q1, the data table named by a host `aria-label` (Complexity Tracking sunset met, axe-core 4.14.0 clean):** (b)
  add two stories, the overflowing data table named by a non-blank host `aria-label` and by a blank one: 14 stories,
  28 baselines in phase 1; the Principle V exception row drops the data table (the timeline and the chain stay in it
  until their spikes measure them).
- **Q2, uppercase column-header names:** (a) keep `text-transform: uppercase`; US1-1's oracle compares with an
  outside table given the same uppercase by a test-only rule, plus one assertion that header names are upper case;
  both READMEs state that the accessible names of column headers follow the drawn upper-case text.
- **T005, the `.sk-data-table` inventory:** "Proceed, map later": phase 1 proceeds; the README mapping rows (FR-058)
  read "pending inventory", and the inventory is supplied and mapped before the PR lands (SC-001 stays open until
  then).
