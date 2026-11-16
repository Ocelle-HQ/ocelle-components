# Quickstart: validating the status elements (018)

## Prerequisites

- Missions 012 and 008 and op 016 merged into the branch (from `main`, by `/ocelle-land`); T001 done (including the
  recheck of the tasks against op 016 as merged) and the phase-1 harness self-tests passing.
- Node 26.13.0 and pnpm 12.16.1 as pinned; `pnpm install --frozen-lockfile`.
- Chromium: `export OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` (or as the frontend
  findings say for the container at hand).
- For baselines and plants: dockerd running as root (`nohup dockerd > /tmp/dockerd.log 2>&1 &`; after a container
  restart also `pnpm run setup:online`) and `OCELLE_VISUAL_ENGINE=docker`.

## Run

```bash
pnpm run gate:typecheck && pnpm run gate:lint && pnpm run gate:style-lint
pnpm run test                                   # element scenarios in process and on the strict-CSP fixtures
pnpm run gate:manifest && pnpm run gate:csp && pnpm run gate:prefix
pnpm run gate:contrast && pnpm run gate:brand-rules
OCELLE_VISUAL_ENGINE=docker pnpm run visual:update   # only in a phase that adds or changes stories
pnpm run gate:storybook-build && OCELLE_VISUAL_ENGINE=docker pnpm run gate:visual && pnpm run gate:axe
# the affected plants only (op 016's mode); the full plant set is never run locally
OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --affected "$(cat specs/018-status-elements/reviews/phase-N/base.sha)"
pnpm run gate:mutation                          # alone, never beside plants
```

## Expected outcomes

- Every scenario of [contracts/checks.md](contracts/checks.md) passes in process and on the CSP fixture, with zero CSP
  violations and no serious or critical axe finding.
- `custom-elements.json` lists every member of [contracts/elements-status.md](contracts/elements-status.md);
  `gate:manifest` reports nothing stale.
- In the Storybook: the indicator stories show solid dots, `Tones` with and without `pulse` (captures run with reduced
  motion); the metric labels are uppercase; the pill stories show wrapping static pills, outlined badges, compact
  pills, interactive pills with their resting border, pressed pills and badges, disabled interactive pills and a
  truncated pill, focused inside a clipping container with its ring whole.
- By hand in Chromium (not a gate): an indicator with `pulse` pulses about 4.8 s and stops; hovering or tabbing to a
  truncated interactive pill shows its full text in the tooltip, Escape hides it; a screen reader reads a metric's
  label as written.
- Mutation: no surviving mutant in new or changed source without a recorded equivalent.
