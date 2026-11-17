# Phase 4 review round 1: fixes

Fixes for `reviews/phase-4/round-1.md` (changes requested), with the operator's decision P3
(`reviews/phase-4/operator-decisions.md`). Red commit `172e572` (tests only), recorded by
`.specify/extensions/story/scripts/red.sh 4 fix-1` as `fix-1` in `red-commits` (`"recorded": true`, exit 1). Its log
`red-fix-1.log` shows exactly the eight new tests failing, each on the defect and on nothing else (3747 tests, 8 failed).

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R1-01 | fixed | `list-detail-upgrade.test.ts` "review R1-01: in Frame N / in Frame R, where the first layout shows the inspector, focus inside the inspector is not moved at upgrade" (red: `in >> div.pane.detail`, `ir >> div.pane.list`); `browser/list-detail.test.ts` upgrade cases `#u-i0` in Frame N and Frame R (red: `u >> div.pane.detail`, `u >> div.pane.list`) | `packages/elements/src/ocelle-list-detail.ts` `#observeSlots`: `#hasInspector` is read from the host's element children with `slot="inspector"` (the elements the slot is assigned), so `connectedCallback` sets it before the first update. The `:205` equivalent record now gives that reason; the mutant stays equivalent (`connectedCallback` always overwrites the initial value before the first `willUpdate`). data-model.md `hasInspector` |
| R1-02 | fixed | scenario "US3 review R1-02: a list-detail inside another component's open shadow root" (`scenarios/list-detail.ts` `listDetailFixes`, both harnesses; red: `opened: "body"`, `closed: "body"`), with the test-only `test-shadow-frame` (`test/fixtures/list-detail-controls.ts`) | `ocelle-list-detail.ts` `#focusedPane`: the active element is read from `this.getRootNode()` (the document, or the shadow root that holds the element). data-model.md § Focus rule, research.md R-14 § When the element moves focus |
| R1-03 | fixed (operator decision P3) | scenario "US3 review R1-03: the tier follows a change of the host's inline padding or borders alone" (`listDetailFixes`, both harnesses: a 630 px content-box host with `collapse-below="640px"`, 10 px inline padding gives two columns and removing it one, 5 px inline borders give two and removing them one; red: `one: list` at 650 px and at 640 px) | `ocelle-list-detail.ts`: a second zero-height `aria-hidden` block, `.edges`, beside the probe, inheriting the host's `padding-inline`, `border-inline-width` and `border-inline-style`; the one `ResizeObserver` observes both, and only the probe's content box enters the size sum. data-model.md `measured`, spike.md § Changed after the spike, research.md R-13 |
| R1-04 | fixed (note, settled under P3; docs only, no red) | none: non-behavioural | research.md R-11 grid table now `1fr`, with the reason and a pointer to spike.md item 1; R-13's observer wording ("the element's `ResizeObserver`", on the probe and the edge box, with pointers to spike.md item 2 and this note); R-13's Recorded-cost sentence now says the figures stay stale in every tier, the panes being contained in inline size (spike.md item 3). data-model.md's "host's `ResizeObserver`" corrected the same way |
| R1-05 | no change (note) | none | Advice for later phases (have the scaffold regenerate the manifest); nothing to change in this phase |
| R1-06 | no change (note) | none | Accepted by the review |
| R1-07 | no change (note) | none | Phase 2's R2-02, carried; out of this phase |

## Design of the R1-03 fix

Observing the host's own border box was not taken: spike.md item 2 records the "ResizeObserver loop" message it brings
when a slotted element grows the host inside its own `ResizeObserver` delivery. Instead the edge box is a direct child
of the shadow root (so it inherits from the host) with `block-size: 0` and content-box sizing; its border box fills the
host's content box, so its content box is the host's content box less the host's inline padding and borders, and it
changes when those change alone. The probe still gives the host's content box exactly, so the size sum is unchanged
(the "876px gives two, 877px one" guard still passes) and a percentage padding is still read as the host resolves it.
Neither block's block size ever changes, so the US3-12 case "a mutation inside a ResizeObserver callback" reports no
message in both harnesses. Recorded costs are in spike.md § Changed after the spike (the edge box's padding and borders
as a floor of the host's content size; a host narrower than its own padding and borders).

## Plants re-run on the changed guarded code

In process (`elements`, `list-detail.test.ts` and `list-detail-upgrade.test.ts`), each applied as an exact text
replacement to `ocelle-list-detail.ts` and the file restored byte for byte after it (compared with a saved copy):

| # | Plant | Fails |
|---|---|---|
| L3 | focus moved on every switch | US3-6 focus not moved; US3-16; the upgrade case with focus in the list |
| L4 | the pane wrappers focusable at all times | US3-6 at rest; US3-6 by keyboard, light and dark; US3-6 focus not moved; US3-7; the guard with focus on a pane |
| L6 | the inspector always present (`#hasInspector` always true) | US3-8; the empty list-detail guard |
| L7 | the `inspector` slot rendered only when an inspector is present | US3-8; US3-16 |
| L18 (new) | the host's own border box observed beside the probe, in place of the edge box | US3-12 1196 px row, dialog, content change, a mutation inside a ResizeObserver callback; US3-16 |
| L19 (new) | the edge box not observed | US3 review R1-03 |

Every plant bites. R1-01's and R1-02's defects are the code before the fix, shown failing by the red commit.

## Gates (on the fixed working tree)

- `gate:typecheck`: no type error. `gate:lint`: 306 files, no finding. `gate:test-lint`: 208 files, no finding.
- `gate:style-lint`: 20 files, no finding. `gate:csp`: 18 files, no finding. `gate:prefix`: 280 files, no finding.
- `gate:manifest`: 6 elements, no finding.
- `gate:mutation -- --base 2caad68`: 274 mutants on the changed lines of 4 files, none survived; 2 timeouts
  (`connectedCallback`, as in round 1), 95 compile errors, 1 zero-mutant entry; 8 equivalent records; exit 0.
- `OCELLE_VISUAL_ENGINE=docker gate:visual`: 88 captures match their baselines. `OCELLE_VISUAL_ENGINE=docker gate:axe`:
  88 story-theme runs, 0 serious or critical, 10 excepted notes.
- `pnpm test`: 3747 tests passed in 161 files.

## Tests changed after red

None. The red tests of `172e572` pass unchanged at the fix.
