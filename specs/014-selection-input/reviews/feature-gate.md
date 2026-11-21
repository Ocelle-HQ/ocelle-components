# Feature gate — 014-selection-input

- Date: 2026-11-17
- Operator: human:jeroennouwsdev
- Head at the gate: 785889d
- State: 7 phases approved and folded; 12 review rounds; 8 blocking findings, all resolved; every phase's tdd-check passes (run summary: knowledge/speckit-flows/runs/014-selection-input.md).
- Known gaps put to the operator: docker-only visual baselines (CI confirms them at landing); the WebKit clipboard user-activation question (R-07) open; the upstream axe-core two-line report not filed; the composed ocelle-dialog + ocelle-listbox story deferred to /ocelle-land (phase 7 decision 1).
- Answer: **approved**. The run hands off to the orchestrator for a draft pull request; /ocelle-land runs only after the operator confirms it.
