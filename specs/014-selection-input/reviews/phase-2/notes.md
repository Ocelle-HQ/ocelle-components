# Phase 2 notes

## Known gap: visual baselines and the `visual` gate (T027)

By the operator's decision of 2026-11-14 (`reviews/phase-1/operator-decisions.md`; FR-053, SC-007, plan Complexity
Tracking), no visual baseline is produced or committed in this phase, the shared token-story baselines included, and
`gate:visual` is not run: these sessions have no docker or podman, so #10's pinned container cannot capture. The seven
listbox stories (`elements-ocelle-listbox--no-selection`, `--selected`, `--disabled-option`, `--focused-option`,
`--hovered-option`, `--scrolling-listbox`, `--option-with-icon`) therefore have no light or dark baseline yet. At
`/ocelle-land` the baselines are produced from CI's pinned-container captures and committed under
`storybook/baselines/`, and the `visual` gate must pass before the pull request merges. Landing must also move the
story-theme counts that `gates/test/integration/visual.test.ts` pins (42 story-themes; the repository now has 56) and
add the light listbox stories that show `color-ink` to the `fail-token-changed` visual plant's list, as that plant's
note asks for each new story; both belong with the baselines and the docker run. The container-engine tests of
`gates/test/integration/visual.test.ts` fail here and at the phase base for lack of a docker daemon: environment-only.

## A figure of research R-17 corrected

R-17 gives the light `color-accent-strong` on `color-sheet` figure as 5.30, the value #5 records for `color-focus` on
`color-sheet`. The contrast gate computes 5.3283 and requires the figure to two decimals, so `pairs.json` records 5.33
(source `computed`). The other eleven figures are R-17's.

## Tests changed after the red commit

- `gates/test/manifest.test.ts` and `gates/test/integration/manifest.test.ts` pin the number of elements the manifest
  gate checks; it moves from 2 to 4 with the listbox and the option. The red commit missed the count; the assertion is
  as strict as before.
- `storybook/stories/listbox.stories.ts`: the scrolling story's export is `ScrollingListbox`, so its id is
  `elements-ocelle-listbox--scrolling-listbox` as the story test names it (Storybook takes the id from the export
  name, not from `name`).
- `gates/test/integration/token-gates.test.ts` pins the number of required pairs `contrast --print` lists; it moves
  from 298 to 310 with R-17's twelve pairs (the red commit moved the other pinned counts and missed this one).
- R-05's body and the two harnesses' test names: see `plants.md`.
