# Quickstart: validating the status elements (018)

## Prerequisites

- Missions 012 and 008 and op 016 merged into the branch (from `main`, by `/ocelle-land`); T001 done.
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
OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --affected "$(cat specs/018-status-elements/reviews/phase-N/base.sha)"
pnpm run gate:mutation                          # alone, never beside plants
```

## Expected outcomes

- Every scenario of [contracts/checks.md](contracts/checks.md) passes in process and on the CSP fixture, with zero CSP
  violations and no serious or critical axe finding.
- `custom-elements.json` lists every member of [contracts/elements-status.md](contracts/elements-status.md);
  `gate:manifest` reports nothing stale.
- In the Storybook: the indicator stories show solid dots (captures run with reduced motion); the pill stories show
  wrapping static pills, outlined badges, compact pills, pressed and disabled interactive pills and a truncated pill.
- By hand in Chromium (not a gate): an indicator with `pulse` pulses about 4.8 s and stops; hovering or tabbing to a
  truncated interactive pill shows its full text in the tooltip, Escape hides it.
- Mutation: no surviving mutant in new or changed source without a recorded equivalent.
