# Operator decision: plant runs for the rest of 018

Decided by human:jeroennouwsdev, 2026-11-20, at phase 2's T023. Op 016's `--affected` mode selects all 317 plants
whenever a phase changes a path `affectedPlants` does not map (phase 1: `vitest.config.ts`; phase 2:
`packages/elements/package.json`, `README.md`, `CHANGELOG.md`, which every element phase changes).

For phase 2 and every later phase of 018 in which `--affected` selects every plant through such an unmapped path: the
phase's `plants.md` records the `--list` output and this decision as the reason, no plant is judged locally, and
CI's Plants check judges every plant on the pull request. A phase whose `--affected` selection is narrower runs it as
the tasks say. This is the phase-1 exception (`phase-1/operator-decisions.md`) extended to the rest of the feature.
