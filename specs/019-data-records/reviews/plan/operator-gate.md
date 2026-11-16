# Plan gate, 019-data-records

- **Date:** 2026-11-16
- **Decided by:** human:jeroennouwsdev
- **Squad:** round 1 (4 lenses, 38 findings, 27 confirmed: 15 fixes, 12 forks; 2 fix passes), round 2 (fresh, 5
  confirmed: 1 fix, 4 forks; 1 pass), round 3 (fresh, 3 confirmed: 1 fix, 2 forks; 3 passes); 0 unresolved, cap of
  three rounds reached.
- **Decision:** approve.

## Answers to the plan-gate questions (research.md § Open questions for the plan gate)

- **Decision 1 (R-03), the track's inline size:** (a) the data table's host rule
  `:host .region-track { inline-size: fit-content }`; 009's module unchanged.
- **Q-A, the chip step's look (#517):** (a) outline only, no fill.
- **Q-B, the column headers' weight and colour (#533):** (a) `--ocelle-font-weight-medium` in
  `--ocelle-color-ink-muted`.
- **Q-C, the event's time position (#470):** (a) the time on its own line above the content, the marker centred on
  the time's line.
- **Q-E, marked-up times (#470):** "Yes: named time slot". A named `time` slot that takes precedence over the `time`
  attribute; a spec change to FR-023 (and the contract, manifest, data model and tests) before tasks are generated.
