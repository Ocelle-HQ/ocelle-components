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

## Baselines under docker (T027a; replaces the known gap above)

By the operator's decision of 2026-11-14 (`reviews/phase-2/operator-decisions.md`), phase 2's baselines were produced
in #10's pinned container (`mcr.microsoft.com/playwright@sha256:ee15712262f017b8157421b212b12099146645f44b1bc5c0514cbbe6a229b1d0`)
under docker with `pnpm run visual:update`: 14 files added (the seven listbox stories, light and dark), no shared
baseline changed or removed, the token stories included. `pnpm run gate:visual` then reported "56 captures match their
baselines (docker only: no cross-engine comparison)". No podman cross-engine check was possible in this session (no
podman); CI's `visual` gate, which runs both engines, confirms the baselines at landing. The story-theme and baseline
counts that `gates/test/integration/visual.test.ts` and `gates/test/integration/plant-repo.test.ts` pin moved from 42 to
56, and the seven light listbox stories, each showing its options' `color-ink` text, joined the findings of the
`visual/fail-token-changed` plant and its note. The container-engine tests of `visual.test.ts` now run and pass.

## The axe exception (T027b; answers the open question above)

The operator chose option (a): the twelve `color-contrast-incomplete` nodes of the scrolling listbox story are entries
of `storybook/a11y-exceptions.json`, each with its row in plan.md's Complexity Tracking. `gate:axe` exits 0 with 22
notes, all excepted (the Prose document's ten and these twelve).

## The gate run (T028)

Run one at a time on `f06a493` with `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`:
typecheck, lint, test-lint, style-lint, brand-rules, pins, config-copies, contrast (166 light, 174 dark, 155 required
per theme), manifest (4 elements), csp, prefix, storybook-build (28 stories), unit-tests (3444 tests in 150 files),
visual (56 captures match, docker only), axe (56 story-theme runs, 22 notes all excepted), plants (301 plants of 17
gates and the registry, every plant as expected) and `mutation -- --base 4980f66` (613 mutants on the changed lines,
none surviving, 10 equivalent records) each exit 0. `gate:plants` was run with `OCELLE_VISUAL_ENGINE=docker`: its
default engine choice `both` needs podman as well, which this session has not, so without it the 46 visual plants are
not run; this is the same docker-only limit as the `visual` gate's.

`gate:signoff -- --range 4980f66..HEAD` reports two findings, on `cd034d1` and `50ff132`, the orchestrator's
operator-decision commits, which carry no Signed-off-by line; every commit of this phase's implementation is signed off
(`gate:signoff -- --range a01cd1f..HEAD`: no finding). Rewriting those two commits is outside the implementer's role.
