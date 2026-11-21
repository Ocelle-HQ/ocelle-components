---
phase: 4
round: 1
verdict: changes_requested
base: 29ae41cd83ce3da6d317c5304bd628df3648c149
head: adffe66
tdd_check: pass
---

# Phase 4 review, round 1

User Story 3: `ocelle-segmented-choice` and `ocelle-segment`. Reviewed `git diff 29ae41c..adffe66`. The working tree was
clean before the review and is clean after it.

These operator decisions are in force and are not findings:
- docker baselines with a podman note;
- one axe exception (the scrolling listbox);
- tabs named from `label` only;
- the engine floor raised to Chromium 125 / WebKit 17.4 for custom states, with T062a, T064a, T066a and T067a skipped
  and ticked with a note.

They are recorded in `reviews/phase-{1,2,3}/operator-decisions.md` and `reviews/phase-4/decision-1.md`.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | `packages/elements/test/scenarios/segmented-choice.ts:703-708`, `:726` (US3-11) | After the red commit, the forced-colours read of the joined pressed bar changed from pixels to computed style only: `::before` `content`, `border-block-end-width`, `border-block-end-color`, `inset-block-end`, plus the host's 1 px line. Nothing in the body now shows that the bar is painted. I applied three plants alone to `src/ocelle-segment.ts:196-199` (the forced-colours `::before` rule), each run with `-t "US3-11"`, and US3-11 **passes** with each: `display: none`, `visibility: hidden` and `position: static`. In the first two, no `Highlight` edge is painted in forced colours. Spec US3-11 requires that "the pressed segment shows a `Highlight` edge of `--ocelle-bar-width`". The red form (a 3 px `Highlight` pixel run) would have failed these plants. So the replacement is looser than the red test, which Principle VIII forbids: a replacement must be stricter. The stated reason is true but does not force a computed-only read. I measured the emulated palette's `Highlight` at `rgba(5, 0, 73, 0.8)`; painted over white it gives the opaque pixel `rgb(55, 51, 109)`. A pixel read is therefore possible against `Highlight` composited over the ground behind the bar. | Keep the computed reads, and add back a pixel read of the bar's paint in the joined forced-colours case. For example: a run of 3 CSS px just above the 1 px `ButtonBorder` line, in the colour of `Highlight` (as `resolveColour` gives it) composited over the ground that `driver.resolveColour("Canvas")` or the segment's forced background gives. It may not be the ground colour. Run the `display: none` and `visibility: hidden` plants on the bar's forced-colours rule, record them in `plants.md`, and update the notes entry "Tests changed after the red commit". |
| R1-02 | note | `specs/014-selection-input/research.md:254-256`; `src/ocelle-segment.ts:255-265` | The deviation from R-06: only `joined`, `row-start` and `row-end` are built, with no `first-row` or `last-row`. This is consistent with the spec, because US3-10 rounds each row on its own, both corners of a row end. `first-row` and `last-row` would change no paint. `contracts/elements.md:102-104` names no state, and the states are not manifest or README surface. `joined` is needed because the segment's own sheet cannot see the parent's attribute. `notes.md` records the deviation, but R-06 still names four states. | At the next documentation pass, align R-06's list (`joined`, `row-start`, `row-end`) with what was built. No code change. |
| R1-03 | note | `specs/014-selection-input/research.md:14-15`; `src/ocelle-segmented-choice.ts:275-278` (a1323c4) | R-01 says the toolbar is set with `ariaOrientation` `"horizontal"`. The refactor drops it and relies on the toolbar's implicit horizontal orientation. The exposed outcome is the same: US3-1 and every `exposed(...)` read `orientation: "horizontal"` from the accessibility tree, and they pass. The same refactor also moves the regroup after a child batch from the microtask to the next `ResizeObserver` delivery, by re-observing. That still rounds in the frame that renders the batch, as US3-10 and US3-18 measure it, and the reorder body covers it. Neither change alters spec behaviour, but R-01 and R-06's "regroups after each child batch" wording now describe the code loosely. | Align the R-01 and R-06 wording at the next documentation pass. |
| R1-04 | note | `src/ocelle-segment.ts:59`; `src/ocelle-segmented-choice.ts:206`, `:297` | Some disable records name whole mutator kinds that include mutants the tests kill. I applied every mutant: only the claimed ones survive (see Test quality). No survivor is hidden. Still, the reasons read as if every mutant of the kind were equivalent, and some are not: `useDefault: false` (line 59) fails US3-14, `if (true) return` (line 206) fails 6 tests, and every `focusLeft` mutant except `active === null` → `false` (line 297) fails 1 to 13 tests. | Optional: narrow each reason to the mutant it covers. |
| R1-05 | note | `reviews/phase-4/plants.md` ("Plants corrected after their first run", second item); `scenarios/segmented-choice.ts:1236-1237` | The record says no element-side defect can make the "host `aria-label` decides alone" read fail in Chromium. That is too strong. A plant that has the element remove a blank host `aria-label` in `updated()` (`if (this.getAttribute("aria-label")?.trim() === "") this.removeAttribute("aria-label");`) makes the FR-006 body fail, with `hostBlank` named by the label. So the read is testable and the guard is real. Only defects that go through the internals are invisible in Chromium, because Chromium ignores the internals' name while the attribute is present. | Optional: add this plant to `plants.md` and soften the record. |

## Test quality

**Red evidence.** In `red-phase.log`, 185 of 3811 tests fail, every one with an `AssertionError`: missing behaviour, not
setup. `tdd-check.json` gives `pass`: red exit 1, the final tests on the base exit 2, the final tests on the scaffold
exit 1, and head exit 0. The scaffold (`035865d`) adds only signatures. The tdd-check head (`f32391a`) differs from
HEAD only by the check commit.

**Tests changed after red** (`git diff 9d793c4..HEAD -- <tests>`):
- **`resized()` / `measured()` now wait for a task first.** This is not loosened. The wait comes before the resize, so
  the element gets no extra time after it. The resize is still made in an ordinary task with no frame wait, then read
  at `afterResizeDelivery`, which is what US3-10 states. `plants.md` records that the plant "state update deferred one
  extra frame" still fails US3-10. The continuous-resize body still asserts no console message and no error event.
- **US3-11, the joined bar read from computed style.** This is loosened (R1-01).
- **Comment-only edits** in 2ef22f2 and 1587ae0. No assertion changed.
- **Added after green** (2ef22f2, 2b056a1): six scenario bodies and `segmented-choice-copies.test.ts`. They are
  additions, and each kills a named mutant (`mutant-2.log`, `plants.md`).

**The four corrected plant forms:**
- **Forced-colours boundary.** The final plant, `forced-color-adjust: none` with the `control-border` lines kept, is a
  real defect against the spec ("visible in a system colour"). The first form (falling back to `CanvasText`) meets the
  spec, so it was rightly not counted as a defect.
- **Host `aria-label` decides alone.** The guard is real and testable (R1-05).
- **FR-027, two paths.** Two code paths each pick the first enabled segment. The final plant drops both, which is the
  defect that produces the failure the body guards against. That is a real guard.

**8edc6e3 (aria-label fix).** It came from the mutation run, and its red evidence is in `red-mutation.log`. The body
added in test-only commit 2ef22f2 fails on the green source `0f13127` in both harnesses (`removed` named "Filter by
lane" instead of "Lanes"). The fix commit changes only `src/ocelle-segmented-choice.ts` and adds the log. It is a fix
found during implementation, not after a review, so no `fix-<round>` entry is expected.

**refactor/test commits:**
- a1323c4 changes source with no spec-visible behaviour (R1-03).
- 57699e8 removes a false disable record and changes only a comment.
- 2ef22f2 and 2b056a1 are test-only.

**Equivalent records.** I applied every mutant of every Stryker disable record alone, running in-process
`segmented-choice.test.ts`, `segmented-choice-copies.test.ts`, `tabs.test.ts` and both entry tests (125 tests; the
baseline passes 125). Results:

| Record | Mutant | Result | Judgement |
|---|---|---|---|
| segment.ts:59 | `value: {}` | survives | equivalent: the accessor writes the attribute itself, and the segment's `attributeChangedCallback` drops `value` |
| segment.ts:59 | `reflect: false` | survives | equivalent |
| segment.ts:59 | `noAccessor: false` | survives | equivalent |
| segment.ts:59 | `useDefault: false` | killed (US3-14) | not hidden |
| segmented-choice.ts:49 | `label: {}` | survives | equivalent: same defaults as type String |
| segmented-choice.ts:52 | `value: {}` | survives | equivalent |
| segmented-choice.ts:52 | `noAccessor: false` | survives | equivalent |
| segmented-choice.ts:160 | `getAttribute("")` | survives | equivalent in Chromium, which uses a present host `aria-label`, blank or not, over the internals (recorded caveat: WebKit is not measured) |
| segmented-choice.ts:206 | `if (false)` | survives | equivalent: a non-joined group regroups to `null` states |
| segmented-choice.ts:206 | `&&` | survives | equivalent: a non-joined group regroups to `null` states |
| segmented-choice.ts:206 | `false \|\| !isConnected` | survives | equivalent: a non-joined group regroups to `null` states |
| segmented-choice.ts:206 | `!joined \|\| false` | survives | equivalent: a disconnected group is observed again at `connectedCallback` |
| segmented-choice.ts:206 | `if (true)` | killed (6 tests) | not hidden |
| segmented-choice.ts:297 | `false \|\| active === body` | survives | equivalent in Chromium (the body, never null) |
| segmented-choice.ts:297 | `false` | killed (13 tests) | not hidden |
| segmented-choice.ts:297 | `&&` | killed (13 tests) | not hidden |
| segmented-choice.ts:297 | `active === null \|\| false` | killed (13 tests) | not hidden |
| segmented-choice.ts:297 | `true` | killed (1 test) | not hidden |
| segmented-choice.ts:297 | `null \|\| true` | killed (1 test) | not hidden |
| segmented-choice.ts:297 | `true \|\| body` | killed (1 test) | not hidden |

Every surviving mutant is equivalent with the reason recorded; R1-04 notes that the records are broader than needed.

**Mutation gate.** `pnpm run gate:mutation -- --base 29ae41c` exits 0:
- 271 mutants on the changed lines of 4 files, none survived;
- 0 timeouts;
- 80 compile errors, read: type-checker rejections such as `#isDisabled(null)`, not hidden behaviour;
- zero-mutant entries for `src/index.ts` and `src/internals.ts`;
- 6 equivalent records, judged above.

**US2-21 with the real element** (`scenarios/tabs.ts`, T062b). The body follows spec US2-21 clause by clause, run in
both harnesses:
- Enter and Space activate the button (2 clicks);
- ArrowLeft, Home and End move the caret, unhandled;
- ArrowRight on segment 0 moves focus to segment 1 only, with the press and `value` unchanged;
- Plan stays selected, its panel is shown, and no `ocelle-tabs-change` is emitted;
- it is paired with ArrowRight on a tab, which moves focus and selection;
- the `defaultPrevented` record is `[false ×5, true, true]`.

It failed in the red run (`red-phase.log`), and `plants.md` records that the plant "controller without the target check"
makes it fail. The phase 3 stand-in body stays, as T062b asks.

**Coverage.** US3-1 to US3-19, the segmented-choice Edge Cases named in T062, the pairings and every key and event
path each have a body. I found no assertion-free, conditional, skipped or snapshot-only test (test-lint is clean).

## Checks run

All were run one at a time with `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` and
`OCELLE_VISUAL_ENGINE=docker` on `adffe66`.

| Check | Result |
|---|---|
| gate:typecheck | exit 0 |
| gate:lint | exit 0, 305 files |
| gate:test-lint | exit 0, 205 files |
| gate:style-lint | exit 0, 22 files |
| gate:brand-rules | exit 0, 7 rules |
| gate:pins | exit 0 |
| gate:config-copies | exit 0 |
| gate:prefix | exit 0, 277 files |
| gate:contrast | exit 0: 166 pairs in light, 174 in dark |
| gate:manifest | exit 0, 9 elements |
| gate:signoff `--range 29ae41c..HEAD` | exit 0, 13 commits |
| gate:unit-tests | exit 0, 3822 tests in 160 files |
| gate:csp | exit 0, 27 files |
| gate:storybook-build | exit 0, 45 stories |
| gate:visual | exit 0: 90 captures match (docker only; no podman here, CI confirms at landing per the operator decision) |
| gate:axe | exit 0: 90 runs, 0 serious or critical, 22 excepted notes, no new exception |
| gate:mutation `--base 29ae41c` | exit 0 (above) |
| gate:plants | exit 0: 301 plants of 17 gates and the registry, every plant as expected (run detached, about 2 h) |

Other checks:
- **Mutants and plants applied by hand.** Each was applied alone and the file restored with `git checkout`.
- **Engine floor.**
  - The README Engines section (`packages/elements/README.md:414-425`) states Chromium 125+ / WebKit 17.4+, with
    custom states as the feature.
  - The CHANGELOG (`:44`) records the raise.
  - `readme.test.ts:66-74,298-299` asserts both.
  - spec, plan, research R-06 and contracts state the decided floor.
  - No other file in the repository (root README, other packages, build configs) states an engine floor, so nothing
    is stale.
- **Tasks.** Every task of Phase 4 is ticked. T062a, T064a, T066a and T067a are ticked as skipped with the decision
  noted. The work of the others is present. The changes outside `packages/elements` are:
  - the stories and the layout rule;
  - the baselines;
  - the gate test counts and the `fail-token-changed` plant (T068);
  - the empty-index plant copy (c52c507).
  Each has its reason in `notes.md`.
- **Constitution.**
  - `ocelle-` names and the `ocelle-segmented-choice-change` event (bubbles, composed);
  - no I/O, and no `style` attribute is written (asserted);
  - tokens only (style-lint, brand-rules);
  - the internals are kept where axe reads them;
  - the toolbar keyboard model with roving tabindex;
  - the `target-min` height;
  - forced-colours paint: a gap in the test (R1-01), not in the code;
  - strict CSP on the fixture;
  - a story per state in light and dark, with baselines.

## Earlier findings

None: this is round 1.
