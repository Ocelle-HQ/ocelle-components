# Phase 1: operator decisions on the T001 stop

Decided by human:jeroennouwsdev, 2026-11-19, on the questions of `recheck.md`.

- **Q1, pulse count**: (a) no count token. The pulse uses the literal `animation-iteration-count: 3` (allowed by the
  style lint since 013) with `motion-pulse` as its duration; FR-041, R-04, R-10, data-model, contracts and tasks are
  amended (no `motion-pulse-count` token).
- **Q2, the pill's baseline**: (a) use 012's slot convention as merged (decision 33): the pill's text in `.label`, with
  `bare` when there is no label; plan decision 15's `.icon-row { align-items: baseline }` override is dropped; the
  baseline checks stay.
- **Q3, plant shards** (plan decision 9): proceed with the 21 stories; the shard question stays with the pending
  plant-design triage.
- **Q4, harness rows**: (a) phase 1 adds only rows 1, 2, 7 and 8 of contracts/checks.md § Test harness (animation
  record, `seek`, `settleLayout`, the fractional overflow measure); rows 3 to 6 are recorded as existing methods on
  `main` (`text`/`textData`, `topLayer`, `focusVisible`/`focusPath`, `click` with `position`/`clickAt`).
