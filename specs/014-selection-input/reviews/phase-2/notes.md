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

## The mutation gate (T028)

`pnpm run gate:mutation -- --base 4980f66` on the green commit reported 71 surviving mutants. They were handled in the
commit after it:
- killed by new tests: in `test/selection.test.ts` (a disabled node moved in the same batch; a focused selected tab
  whose siblings all become disabled or are removed), `test/roving-controller.test.ts` (the controller on the inline
  axis left to right and right to left, Enter and Space to `choose`, a letter left alone), `test/listbox.test.ts`
  (axe-core in process: no `aria-allowed-attr` violation, and the role axe reads through the internals symbol, none on
  an option outside a listbox) and nine bodies added to `test/scenarios/listbox.ts` (the states written on the options
  and removed from a disabled option that leaves; an option's value changed by attribute and by property, and its value
  attribute removed; a child that is not an option; the origin filter; option listeners that stop focus events from
  propagating; a host that focuses elsewhere while removing the focused option; a press on the list part's padding; the
  value attribute removed; a blank host `aria-label`);
- removed by simplifying the source where the mutant was equivalent by construction: `hostSet`'s empty-value test (no
  child's value is empty), the fallback's step arithmetic (two slices instead), `selectionAfter`'s null guard,
  `batch`'s redundant comparison, `afterBlur`'s redundant `hadFocus` test, `owns`' null-target test, the controller's
  `preventScroll` and `scrollIntoView` (focus scrolls the option into view with its scroll margin), the listbox's
  `disconnectedCallback`, its `old !== value` test and the composed-path walk of its focus listeners;
- recorded as equivalent where no test can tell them apart, each with a `Stryker disable next-line` comment giving the
  reason, as mission 005 does: Lit's property options for `label` and `value` on the listbox and `value` on the option
  (the accessors do the work), the listbox's handling of its `value` attribute (Lit's own path sets the same accessor),
  the replacement string for a removed `value` attribute, the host `aria-label` read for the internals name (Chromium
  names the host from a present `aria-label` whatever the internals say; WebKit is not measured), a `focusout` from a
  descendant that is not an option, the controller's `hostDisconnected` (a duplicate listener finds the key handled),
  the `focusVisible` option of the keyboard focus move (Chromium's heuristic shows the ring anyway), and the
  `behind` list of a wrapping move (read only after every child ahead was found disabled).

## Open question for the operator: the scrolling listbox story and the `axe` gate

`gate:axe` reports 12 findings, all on `elements-ocelle-listbox--scrolling-listbox` (6 per theme): a serious
`color-contrast-incomplete` on each option scrolled out of the list part (`epsilon` to `kappa`). axe-core 4.14.0 gives
`elmPartiallyObscured` for text clipped by a scroll container: it treats only `overflow: hidden` ancestors as hiding
content, so text an `overflow: auto` scroller clips is "partially obscured" and its contrast "cannot be determined".
Every other story, both themes, has no finding. FR-050 asks for a scrolling listbox story; FR-051 forbids a serious
finding and a new entry in `storybook/a11y-exceptions.json`. The same findings make `gates/test/integration/axe.test.ts`'s
two repository runs and the `axe` gate plants run on the repository fail (`gate:plants`, which also cannot run its 46
visual plants without a container engine). The story test (`storybook-integration`) passes: it asserts no serious
violation, not incompletes. Phase 2 stops here for the decision; T028 stays open.
