# Plan gate: operator decisions

Decided by human:jeroennouwsdev, 2026-11-16, at the plan gate of `/ocelle-run` after squad rounds 1 to 3
(0 unresolved; round 3 still confirmed findings, so the three-round cap ended the squad).

- **Plan**: approved.
- **Plan decision 11** (focus-ring clearance): the cap plus one ring extent (about 5 px) of inline margin on each side
  of an interactive pill is confirmed as the reading of fork PLAN-A11Y-SECURITY-1-007 (a).
- **Plan decisions 12 and 15** (notes for mission 012 / 005: `ocelle-button` sets `:state(pressed)` in link mode; 005's
  `.icon-row` alignment likely puts `ocelle-button` about 3 px off the text baseline): reported to the orchestrator
  session, which routes them; this feature changes neither `ocelle-button` nor 005's slot convention.
