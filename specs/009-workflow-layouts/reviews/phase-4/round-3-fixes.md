# Phase 4 review round 3: fixes

Fixes for `reviews/phase-4/round-3.md` (changes requested), with the operator's decision G1
(`reviews/phase-4/operator-decisions.md`, "more-rounds": R3-01 fixed and `gate:plants` rerun in full, R3-02 guarded
red-first, R3-04's wording fixed). Red commit `e64b987` (tests only), recorded by
`.specify/extensions/story/scripts/red.sh 4 fix-3` as `fix-3` in `red-commits` (`"tests_only": true`, `"red": true`,
`"recorded": true`, exit 1). Its log `red-fix-3.log` shows exactly the two new tests failing, each with an
`AssertionError` on observed values (3763 tests, 2 failed).

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R3-01 | fixed | none: gate fixtures, not element behaviour (as the review says, no red test is needed) | The eight JSON manifest copies in `gates/plants/manifest/*/tree/packages/elements/custom-elements.json` (`fail-lost-attribute`, the six `fail-undescribed-*`, `pass-reordered`) take the committed `remeasure()` description, as round 3's code makes it (see R3-02), by an exact replacement of the one JSON string, so each file keeps its own key order (reversed in `pass-reordered`) and formatting. The ninth copy, `break-not-json`, is not JSON and holds no `remeasure` entry, so it is unchanged. Checked by parsing each copy against the committed manifest: `pass-reordered` equals it; each `fail-undescribed-*` equals it plus its one planted `src/ocelle-plant.ts` module; `fail-lost-attribute` differs only by its planted lost `label` attribute. `fail-lost-attribute` was not among the seven failing plants: the gate gives its whole-file `stale` finding (a difference outside the six member kinds, such as a method's description) only when no member differs, and this plant's lost attribute is a member finding. Its copy also held the old text, so it was brought in line too. `OCELLE_VISUAL_ENGINE=docker gate:plants` was run in full (Gates) |
| R3-02 | fixed | `list-detail-pass.test.ts` "review R3-02: remeasure() on a list-detail that is not in a document runs no pass and reports no error, never connected or removed from the page" (in process). Red: `errors: ["Uncaught TypeError: Cannot read properties of undefined (reading 'querySelector')"]` with the same error in `messages`, from the never-connected element, and `passes.removed: 1`, the pass a removed element ran on its detached grid | `ocelle-list-detail.ts` `remeasure()`: returns at once while the element is not connected (`isConnected`). Never connected, the element has no shadow root yet, and the pass threw in the frame. Removed, the pass measured a detached grid, whose figures are 0 px, and wrote them to the sheet (the existing guard "a list-detail removed from the page runs no pass" already covered the light-DOM path; `remeasure()` now matches it). A never-connected element's first render schedules its first pass anyway (`firstUpdated`). What it does before connection is stated in `remeasure()`'s JSDoc and the regenerated manifest, the contract's `remeasure()` row, spec.md FR-025 and the README's `remeasure()` item (asserted by `readme.test.ts`) |
| R3-03 | fixed (note) | `list-detail-first-render.test.ts` (new, in process) "review R3-03: the first render of a list-detail with three panes in Frame R requests no second update, so the console reports nothing and the layout is three columns". Red: `messages: ["console.warn: Element ocelle-list-detail scheduled an update … after an update completed … https://lit.dev/msg/change-in-update …"]` | `ocelle-list-detail.ts` `#observeSlots`: `requestUpdate()` only when `#hasInspector` changed, so `firstUpdated` brings no second update. It is in a file of its own because Lit warns once per class and each test file has its own iframe: the first list-detail rendered in the file is the only one that can show it. The scenarios the review named now pass alone: `-t "US3-12, 1196 px row"` (1 passed) and `-t "R2-01"` (2 passed) on `list-detail.test.ts` |
| R3-04 | fixed (note) | none: wording only | (a) The contract's `remeasure()` row now qualifies the narrow-host case: "a percentage padding there, since a px or em padding or a border change is seen there". (b) "No observer reports it" is replaced by "may go unseen", with the condition: the edge box resolves the percentage against its own containing block (the nearest positioned ancestor, or else the initial containing block), so the change is seen only when that box changes size with the host's container, for example when the host's container is positioned and the host is not. The same wording in spec.md FR-025, contracts/elements.md § Container-tier convention "Unseen changes", the README's § Container tiers (asserted by `readme.test.ts`), data-model.md `measured`, research.md R-13, and the JSDoc of `#remeasured`. The narrow-host items say "only a percentage padding may go unseen, as above" |
| R3-05 | no change (note) | none | Phase 2's R2-02, carried as instructed |

## Tests changed after red

None. The two red tests are unchanged from `e64b987`. In the fix commit `readme.test.ts` gained the README's new
sentences (the `remeasure()` item's sentence on an element not in a document, and the "may go unseen" wording of the
two limitations), which replace the three sentences it asserted before with their new text. No test was skipped,
weakened or deleted.

## Gates (on the fixed working tree)

Each gate below was run on the fixed working tree (the Docker daemon was started for the red run and the docker
gates; `docker info` answered before `gate:plants`).

- `gate:typecheck`: no type error. `gate:lint`: 307 files, no finding. `gate:test-lint`: 209 files, no finding.
- `gate:style-lint`: 20 files, no finding. `gate:csp`: 18 files, no finding. `gate:prefix`: 265 files, no finding.
- `gate:manifest`: 6 elements, no finding (custom-elements.json regenerated for `remeasure()`'s new sentence).
- `gate:config-copies`: identical. `gate:pins`: 5 manifests, no finding. `gate:brand-rules`: 7 rules.
  `gate:contrast`: 160 pairs in light, 168 in dark.
- `pnpm test`: 3763 tests passed in 162 files (the 3763 of the red run, now all passing; the new file
  `list-detail-first-render.test.ts` is the 162nd).
- `gate:mutation -- --base 2caad68`: 292 mutants on the changed lines of 4 files, none survived; 2 timeouts
  (`connectedCallback`, as before), 96 compile errors (`tiers.ts`), 1 zero-mutant entry (`src/index.ts`); 8 equivalent
  records, unchanged in reason (the record of `#hasInspector`'s initial value still holds: `connectedCallback` sets it
  before the first update, and that update is requested either way); exit 0.
- `OCELLE_VISUAL_ENGINE=docker gate:visual`: 88 captures match their baselines.
- `OCELLE_VISUAL_ENGINE=docker gate:axe`: 88 story-theme runs, 0 serious or critical, 10 excepted notes (003's prose
  story, as before).
- `OCELLE_VISUAL_ENGINE=docker gate:plants`, the full job in one run (about 80 minutes): exit 0, "306 plants of 17
  gates and the registry judged, every plant as expected". The seven manifest plants of R3-01 are among them.
- `gate:signoff -- --range 2caad68..HEAD`: run on the fix commit (reported by the implementer to the orchestrator).
