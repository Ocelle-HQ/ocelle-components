# Implementation Plan: Workflow and Screen Layouts

**Branch**: `009-workflow-layouts` (work on `claude/015-workflow-layouts`) | **Date**: 2026-11-13 | **Spec**:
[spec.md](spec.md)

**Input**: Feature specification from `specs/009-workflow-layouts/spec.md`. The operator approved it at the spec gate
on 2026-11-13, after spec check 3 came back clean (`reviews/spec/check-3.md`).

> **Recheck when #10 lands.** The stories, baselines and axe work of this plan are designed against #10's design as it
> stands on `origin/claude/010-storybook-workbench` (`specs/006-storybook-workbench`: spec FR-025, FR-031,
> `contracts/gates.md`, `contracts/container.md`), which is not merged yet. Implementation waits for #10's merge
> (operator wave planning). The first task of phase 1 re-reads #10 as merged on `main` against research.md R-15's
> list, merges `main` into this branch (never a rebase), and updates R-15, `contracts/elements.md` § Stories and the
> affected tasks where they differ.

## Summary

Four layout elements in `@ocelle/elements` and six tokens in `@ocelle/tokens`, on 005's element conventions:

- **`ocelle-scroller` (P1).** A horizontal strip that is a tab stop, and a named group when labelled (not a landmark;
  operator decision), only while it overflows. It shows a token focus ring, scrolls 40 px per unmodified arrow key with
  no animation, and shows a masked fade, or a 1 px `CanvasText` line in forced colours, on each logical side with
  content off-screen, never over the native scrollbar. It keeps the focus rings of its controls whole and clear of the
  fades.
- **The overflow-region module.** All of that behaviour lives in one internal module with a written contract
  ([contracts/overflow-region.md](contracts/overflow-region.md)), which a test-only host proves. The board uses it,
  and #13's `ocelle-code-block` will.
- **`ocelle-workflow-board` and `ocelle-workflow-lane` (P2).**
  - The board lays out equal, inline-size-contained lanes no narrower than `--ocelle-lane-min-width` (10rem): five
    fit Frame W in 858 of 876 px whatever their cards hold. It scrolls itself through the same module when narrower,
    as a named region.
  - Lanes have a default chrome on a `color-sheet` ground and a `flat` variant.
  - A lane is a group named "<title>, <count>", with no built-in words.
- **`ocelle-list-detail` (P3).** It picks three, two or one columns from its own measured width against
  `collapse-below` and `inspector-below`, whose defaults are tokens. `narrow` forces one column and `detail-open`
  chooses the pane in one column. Focus moves to the shown pane when its pane is hidden. Its intrinsic sizes do not
  depend on the tier, so a shrink-to-fit host cannot make it alternate (spike first, R-13). They are re-measured at
  most once per frame, and a public `remeasure()` covers the changes the element cannot see. This defines the
  container-tier convention that #8 and #12 reuse.

The stories go through #10's `visual` and `axe` gates. Every decision is in [research.md](research.md); the surface is
in [contracts/elements.md](contracts/elements.md).

## Technical Context

**Language/Version**: TypeScript (strict) as pinned, Node 26.13.0 in CI (22.23.4 in this container).

**Primary Dependencies**: `lit` 3.3.3 (pinned by 005). No new runtime or dev dependency. #10 brings its own (axe-core,
the pinned container) before this feature's implementation.

**Storage**: N/A.

**Testing**: 005's harnesses (its research R-11), with the driver extended (R-17):
- shared scenario bodies in `packages/elements/test/scenarios/`, run in-process by the `elements` project (mutated by
  the elements-only Stryker configuration) and on strict-CSP fixture pages from the browser build by
  `elements-browser`; every keyboard and focus scenario runs in both, with real input and a viewport per frame;
- pure helpers (edge state, clearance arithmetic, name resolution, the `*-below` grammar, the count grammar) unit-tested
  in-process;
- token records by the `tokens` project and the token gates;
- the `ocelle/token-only` gradient change by the `gates` project and its plants (contracts/gates.md);
- stories by `storybook-integration`'s story inventory and #10's `visual` and `axe` gates.

**Target Platform**: Chromium measured; WebKit (Kitty Desktop) unmeasured, an open limitation in the README. The engine
floor does not move (R-18).

**Project Type**: library (web components) in a pnpm workspace.

**Performance Goals**: one `ResizeObserver` per element instance. Updates only when an output changes. No timing goal
beyond the spec's one-frame bounds (the twelve-lane, forty-card goal was dropped by the operator after the analysis,
C3).

**Constraints**:
- strict CSP with no exception;
- token-only styles;
- no I/O;
- open shadow roots (#10);
- measured px figures only through one per-instance constructed stylesheet adopted on the shadow root (list-detail's
  intrinsic sizes, R-13; the overflow-region module's mask size, R-05), never through `element.style`, which would
  write a `style` attribute. FR-030 and the README's § Styles name this as the one addition to the shared
  `static styles` (PLAN-FRESH-2-005 (a)).

**Scale/Scope**: four elements, one internal module, six tokens and twenty-three stories in two themes (contracts/elements.md
§ Stories).

## Constitution Check

*Gate: passes before Phase 0 research and again after Phase 1 design, with no Complexity Tracking row. Rechecked after
squad round 1's fixes: II now names the gate change, III to V and VIII the new designs and tests, IV the constructed
stylesheet that replaces `element.style` writes. Rechecked after squad round 2's fixes: II records the reading of
measured layout figures for the operator, III the reduced-motion scope and the handover ring overlay, IV the module's
per-instance sheet. Rechecked after squad round 3's fixes: I names list-detail's one method, VII the addition, VIII
the new US3-12 cases and their plants. Rechecked after the analysis fixes (`analysis-report.md`,
`reviews/analysis/operator-decisions.md`): III and V lose the untestable composition clause with the module's
`isComposing` check (B1 (b), R-02), so every keyboard path left has a test, the board's arrow keys and Tab after a pane
switch included; VIII gains the edge-case pairs and their plants and the forced-colours pane-border case. No
principle's verdict changes, and Complexity Tracking stays empty.*

| Principle | How this plan meets it |
|---|---|
| I. `ocelle-` names, no I/O, small surface, manifest | Four `ocelle-*` elements, no events, no I/O; every property, attribute, slot and method is in the manifest, the one method being list-detail's `remeasure()` (operator decision PLAN-FRESH-3-001 (a), R-13); the module and list-detail's scheduling module, with its test-only pass counter, are internal (contracts/overflow-region.md § Status; R-13). |
| II. Tokens only, brand rules | Six new tokens; element CSS is `token-only`. **Reading for the operator at the plan gate (PLAN-FRESH-2-005 (a)):** list-detail's intrinsic sizes (R-13) and the overflow-region module's mask size (R-05) are px figures the element measures from layout at run time and sets through one per-instance constructed sheet; they are not the design-value literals II forbids (no colour, font, size, radius, shadow or duration is chosen by them), so this is a reading of II, not an exception, and Complexity Tracking stays empty. No such figure comes from an attribute, a property, a token's text or slotted text. FR-030 and the README's § Styles say so, and `sheets()` asserts exactly one per-instance sheet per root. The mask uses `transparent` and a token colour in `linear-gradient()`, which the `ocelle/token-only` rule learns to classify, a gate change with red-first tests and plants (R-05, contracts/gates.md). The default lane's ground is `color-sheet`, a token (R-10). No monospace: the flat title uses `--ocelle-font-sans` with tabular figures and `--ocelle-tracking-caps` (FR-021). `--ocelle-color-rule` borders are decorative only (FR-023). One radius: `radius-row` on the lane chrome. |
| III. Accessible by construction | Tab stop and named group (the board: region) only while overflowing, so repeated chip rows add no landmarks (R-01, R-03). Arrow keys on the box with no animation under any motion setting, and modified arrows left to the platform (R-02). Token focus ring drawn outside the mask, by an overlay that also draws the handover ring (R-05, R-07); the native scrollbar kept and never faded, by a measured mask size (R-04, R-05). Focus rings of slotted controls kept whole and clear of the fades (R-04, R-06). Focus handover finds shadow-hosted controls; with none, an inner node takes focus with an inset ring (R-07). Pane wrappers focusable only while the element moves focus to them, with an inset ring in `Highlight` under forced colours (R-14). The default lane's ground differs from every main ground it sits on (R-10). Forced-colours edge lines, ring in `Highlight`, lane borders and pane borders in `CanvasText`. No ID reference crosses a shadow root: names are copied as text into the shadow node (R-01). Focus moves with the shown pane (R-14). Reduced motion: nothing the element does animates; the browser's own scroll of the strip from a focused slotted control may, which FR-009 and the README state (operator decision PLAN-FRESH-2-003 (a), R-02). Contrast: no new colour token; the colours used are checked pairs (R-10). axe over every story through #10 (R-15). |
| IV. Strict CSP | Adopted stylesheets only. No `style` attribute in templates, in fixtures or in stories (`[data-frame]` and `[data-story]` CSS, R-15, R-17). list-detail's measured figures, and the overflow-region module's mask size, go into a per-instance constructed stylesheet adopted on the shadow root, whose rule declarations are set through the CSSOM; `element.style` is never written, because it creates a `style` attribute (R-13), and a test asserts that no shadow element carries one. The `csp` gate scans built output, and the fixture pages count violations. |
| V. Storybook, behaviour tests | One story per variant and per state that draws different pixels, in light and dark, with baselines from #10's pinned container (R-15). States that draw the same pixels, and focus and forced-colours states (not captured by #10), are proven by tests (R-15). No events, so no payload tests. Every keyboard path is tested with real input in both harnesses (arrows with and without modifiers, Tab, Shift+Tab, focus handover, pane switch; R-17). Fades are asserted on pixels, never on `data-fade` (R-05). |
| VI. Consumer needs, own code | spec-kitty-design #505, #506, #507, #514 and #530 are named in the spec. Nothing is ported. |
| VII. Semantic versioning | Additions only, `remeasure()` included; the changelogs name them (FR-035). |
| VIII. Test-first, non-vacuous | Every phase is red first; the driver extension and the frames are tested too (R-17). Every "does not" outcome is paired with its positive outcome and has its plant (spec table; phases below); each pairing plant is run once and recorded in `reviews/phase-N/plants.md`, and one that does not fail its test stops the phase (R-17). Timing bounds are tested at the bound (R-03), list-detail's unseen changes, the mutation made inside a `ResizeObserver` callback and the once-per-frame pass each have a case and a plant (R-13), the pointer-focus case against a twin oracle (R-06), and px figures at a 20 px root as well (R-17). Pure helpers make the layout arithmetic mutation-testable. Element source is mutated in-process under 007's stricter gate, the upgrade branch included (R-14, R-17); the gate change has its own red-first tests and gate plants (contracts/gates.md). Documentation-only items (changelog, README prose with no tested item) take the exemption, with the reason stated in review. |

## Decisions the operator should see at the plan gate

1. **The roles live in the shadow root, not on the host** (R-01, measured). A non-empty host `aria-label` therefore
   also leaves a named `generic` host node beside the group, region or lane group. Putting the role on the host
   through `ElementInternals` would lose the role whenever the host `aria-label` is blank, which the spec treats as
   absent.
2. **The element handles the arrow keys itself** (R-02, measured). Chromium's own keyboard scrolling animates even
   under reduced motion. Home, End and Page keys, and every modified arrow, are left to the browser, as are keys from
   a focused slotted control, whose browser scroll may animate (operator decision PLAN-FRESH-2-003 (a)).
3. **Focus clearance belongs to the module and applies to focus that shows a ring** (`:focus-visible`: keyboard focus,
   and any focus of a text-entry control), not to pointer focus on a button or link (R-06). The forced-colours line
   follows the same suppression as the fade. FR-001 and FR-011 say so since the plan gate.
4. **Nested images in a lane rely on `base.css`** for their width cap (R-08), since `::slotted()` reaches only direct
   children. Content that cannot shrink visibly overflows into the next lane; the README tells hosts to use a
   scroller (SPEC-2-06).
5. **list-detail's intrinsic sizes come from a measurement pass and a per-instance constructed stylesheet** (R-13).
   This is the one risky design, and phase 4 starts with a spike. If the spike fails, the operator gets a fork: relax
   US3-12's exact size. The pass is scheduled once per animation frame, `attributes` are not observed, and the host
   calls the public `remeasure()` after a change the element cannot see (squad round 3).
6. **Upgrade focus** (R-14): if a server-rendered page's focus is inside a pane that the first layout hides, focus
   moves. FR-028 and the Edge Case say so since the plan gate.
7. **`inspector-below`** stays as the approved spec has it (SPEC-1-17; R-19).

**Decided at squad round 1** (`reviews/plan/round-1/refute.md`, Decision column):

| Finding | Decision | Where |
|---|---|---|
| PLAN-A11Y-SECURITY-1-006 | (b) the scroller is a named `group`; only the board is a `region` | spec FR-002, FR-010, FR-014; R-01; contracts |
| PLAN-A11Y-SECURITY-1-007 | (a) the handover with no focusable content focuses `.region-frame`, inset ring | spec FR-004, US1-4; R-07 |
| PLAN-CORRECTNESS-1-002 | (a) `ocelle/token-only` classifies `linear-gradient()` arguments: a gate change | R-05; contracts/gates.md; phase 2 |
| PLAN-CORRECTNESS-1-003 | (a) pane widths include their rule; US3-12 is 1073 px | spec FR-023, US3-12; R-11, R-13 |
| PLAN-CORRECTNESS-1-005 | (a) README § Host ARIA scoped per element | spec FR-010, FR-034; R-01; phase 2 |
| PLAN-CORRECTNESS-1-006 | (a) the spec amended to the plan's five readings | spec FR-001, FR-011, FR-018, FR-025, FR-028, SC-001, Edge Cases |
| PLAN-CORRECTNESS-1-011 | (b) the default lane's ground is `color-sheet` | spec US2-4, US2-11; R-10; contracts/elements.md |
| PLAN-FRESH-1-003 | (a) the native scrollbar is kept, counted in the block size and never faded | spec FR-001, FR-007, US1-13; R-04, R-05 |
| PLAN-FRESH-1-006 | (b) a width-only change inside a lane waits for the next size, slot or scroll event | spec FR-014; R-03, R-08 |
| PLAN-TESTABILITY-1-004 | (a) US1-3's one-frame bound tested at the bound | R-03 |

**Decided at squad round 2** (`reviews/plan/round-2/refute.md`, Decision column):

| Finding | Decision | Where |
|---|---|---|
| PLAN-FRESH-2-001 | (a) FR-007 kept; the fade layer's block size is the measured client height, set in the module's per-instance sheet, so the scrollbar stays unmasked | R-03, R-04, R-05; contracts/overflow-region.md; phase 2 |
| PLAN-FRESH-2-002 | (a) list-detail re-measures on a `MutationObserver` over every pane, never in a `ResizeObserver` callback; a size change with no mutation waits | spec FR-025, US3-12, FR-034; R-13; data-model; phase 4 |
| PLAN-FRESH-2-003 | (a) FR-009 and US1-11 amended: the browser's scroll from a focused slotted control is outside the element | spec FR-009, US1-11, FR-034; R-02; phase 2 records |
| PLAN-FRESH-2-005 | (a) one per-instance sheet of measured figures, read under II as not a design literal; no exception | spec FR-030, FR-034; R-05, R-13; Constitution Check II; phase 2 records |

**Decided at squad round 3** (`reviews/plan/round-3/refute.md`, Decision column):

| Finding | Decision | Where |
|---|---|---|
| PLAN-FRESH-3-001 | (a) a public `remeasure(): void` on list-detail; content in a slotted element's shadow root named as unseen | spec FR-025, FR-030, FR-034, FR-035, US3-12, operator decisions (round 3); R-13; data-model; contracts/elements.md; Constitution Check I, VII; phase 4 |
| PLAN-FRESH-3-003 | (b) `attributes` dropped from the observed records; attribute-only changes named as unseen; the per-pass cost recorded | spec FR-025, FR-034, US3-12, operator decisions (round 3); R-13; data-model; contracts/elements.md; phase 4 |

PLAN-FRESH-3-002 was a fix: the pass is scheduled in one animation-frame callback, at most once per frame (spec
FR-025, FR-034, US3-12; R-13; data-model; contracts/elements.md; phase 4).

**Decided after the analysis of the tasks** (`analysis-report.md`; `reviews/analysis/operator-decisions.md`):

| Finding | Decision | Where |
|---|---|---|
| B1 | (b) composition cannot reach the non-editable box: the clause and the `isComposing` check are removed, the reason recorded | spec US1-5, FR-006, operator decisions; R-02; contracts/overflow-region.md, contracts/elements.md |
| F2 | FR-032 takes the contract's 23 stories | spec FR-032, operator decisions |
| C3 | each spec edge case gets a browser case, paired where it is a "does not"; the twelve-lane timing goal is dropped | spec pairing table, operator decisions; Performance Goals; phases 3 and 4 |

The other findings (C1, C2, C4, F1, A1, F3, F4, C5, C6, C7) are fixed as the report recommends (tasks.md; F1 also in
R-08 and contracts/elements.md; A1 in spec FR-015 and FR-016).

## Project Structure

### Documentation (this feature)

```text
specs/009-workflow-layouts/
├── spec.md, plan.md, research.md, data-model.md, quickstart.md
├── contracts/overflow-region.md, contracts/elements.md, contracts/gates.md
├── sources/issues.md
├── checklists/requirements.md
└── reviews/ (spec checks; plan squad rounds; phase reviews, each with plants.md)
```

### Source Code (repository root)

```text
packages/elements/
├── src/
│   ├── overflow-region.ts       # OverflowRegion controller, overflowRegionStyles, pure helpers (internal)
│   ├── tiers.ts                 # *-below grammar and resolution, tier choice (internal; the container-tier convention)
│   ├── list-detail-measure.ts   # per-frame pass scheduling and the test-only pass counter (internal, not exported; R-13)
│   ├── ocelle-scroller.ts
│   ├── ocelle-workflow-board.ts
│   ├── ocelle-workflow-lane.ts
│   ├── ocelle-list-detail.ts
│   ├── index.ts, browser.ts     # + the four elements (shared file: merge conflicts resolved by merging main)
├── test/
│   ├── scenarios/driver.ts                               # Driver interface + the methods of R-17 (driver task, phase 2)
│   ├── in-process.ts, browser/driver.ts, browser/serve.ts # both implementations; viewport option for visit()
│   ├── driver.test.ts, browser/driver.test.ts            # the driver task's own tests
│   ├── frames.test.ts, browser/frames.test.ts            # each frame's inline size at its viewport (phase 1)
│   ├── fixtures/frames.css                               # Frames W, R, N, S: the one frame source (R-17)
│   ├── overflow-region.test.ts, tiers.test.ts            # pure helpers (in-process, mutated)
│   ├── scroller.test.ts, workflow-board.test.ts, workflow-lane.test.ts, list-detail.test.ts
│   ├── list-detail-upgrade.test.ts                       # upgrade in place, in-process (R-14)
│   ├── entry-scroller.test.ts, entry-workflow-board.test.ts, entry-workflow-lane.test.ts, entry-list-detail.test.ts
│   ├── scenarios/{scroller,board,lane,list-detail}.ts    # shared bodies
│   ├── fixtures/overflow-host.ts                         # test-only element on the module (US1-16)
│   ├── browser/*.test.ts                                 # elements-browser runs, + scrollbar.test.ts (--hide-scrollbars off)
│   └── node/readme.test.ts                               # + FR-034 items, § Host ARIA scoped
├── custom-elements.json        # regenerated (shared file)
├── package.json                # + four exports
├── README.md, CHANGELOG.md
packages/tokens/src/source.ts   # six records (R-16); generated docs and pinned counts in the token tests and gates
packages/tokens/CHANGELOG.md
gates/stylelint/token-only.ts   # linear-gradient() arguments classified (contracts/gates.md)
gates/test/token-only.test.ts   # + the gradient cases
gates/plants/style-lint/        # + pass-linear-gradient-tokens, fail-gradient-hex, -angle, -length, fail-radial-gradient
gates/README.md                 # style-lint row
storybook/stories/{scroller,workflow-board,workflow-lane,list-detail}.stories.ts
storybook/.storybook/stories-layout.css   # [data-frame] frames from the one source, [data-story] rules
storybook/baselines/*.png                 # from #10's visual:update
storybook/test/integration/elements-stories.test.ts  # + story ids (+ the frame copy check if a copy is needed)
```

**Structure Decision**: as 005, everything for elements is in `packages/elements`, the tokens are in the token source,
and the stories are in the existing Storybook. One gate changes: `style-lint`'s `ocelle/token-only` rule classifies
`linear-gradient()` arguments (contracts/gates.md). The `manifest`, `csp` and `mutation` gates and #10's gates apply
as they are.

## Phases (user stories) for `/speckit-tasks`

Every phase runs each pairing plant it names once against its test and records the output in
`reviews/phase-N/plants.md`; a plant that does not make its test fail stops the phase (R-17).

1. **Setup.**
   - **Recheck #10** (exempt, a record). Read #10 as merged on `main` against R-15's list, merge `main` (never
     rebase), and record the result in `reviews/phase-1/recheck-10.md`. Update R-15 and `contracts/elements.md`
     § Stories if anything differs. Check `main` for sibling 011's (#8) letter-spacing token and container-tier
     convention, and adopt them if present (R-16).
   - **Tokens** (not exempt). Tests first: the six records and their values in the token tests, the pinned counts in
     the token and gates tests, and the generated documentation rows; a token test that `color-sheet` differs from
     `color-canvas`, `color-panel`, `color-inspector` and `color-pane` in both themes (R-10). Then `source.ts`.
   - **Frames** (not exempt, PLAN-TESTABILITY-1-008). Tests first: in both harnesses, each frame's measured inline
     size (876, 1196, 636, 288 px) at its viewport, which needs the driver's `viewport()`; that method is the one
     driver method done here, test first, ahead of the rest of the driver task. Then `test/fixtures/frames.css`, the
     one frame source, read by both drivers and by the story stylesheet (R-17).
2. **US1 `ocelle-scroller` and the overflow-region module (P1).**
   - **Driver, tests first** (PLAN-TESTABILITY-1-001, 1-002). The methods of R-17 in `test/scenarios/driver.ts`,
     `test/in-process.ts` and `test/browser/driver.ts`: real keys and chords, real click and wheel, deep active
     element, tab walk, `scrollLeft`, last keydown prevented, reduced motion, frame record, and a two-frame `settle()`.
     Each is proven against a plain fixture.
   - **Gate change, tests first** (PLAN-CORRECTNESS-1-002 (a), contracts/gates.md). The gradient cases in
     `gates/test/token-only.test.ts`, red against the current rule; then `token-only.ts`; then the plants and the
     `gates/README.md` row. Done before the scroller's styles.
   - **Pure helpers, tests first.** `edgeState` (tolerance, RTL sign), `clearanceScroll` (LTR and RTL; a control that
     fits, one too wide for the clearance, one wider than the box) and `resolveName` (blank host label, trimming).
   - **Module and scroller, tests first.** US1 scenarios 1 to 16 as shared bodies in both harnesses, with real input.
     Each pair names its plant:
     - US1-1 (`tabindex` and role whatever the overflow);
     - US1-3 (the state write moved into a `requestAnimationFrame`; asserted in a later-registered observer's
       callback, R-03);
     - US1-4 (the light-DOM-only walk, with a slotted element whose button is in its open shadow root and one that
       delegates focus; the frame's ring rule removed, and the ring as an outline of the frame, asserted on pixels
       inside an `overflow: hidden` container, at rest and after the content overflows again while the frame holds
       focus, and `Highlight` in forced colours; R-07, PLAN-FRESH-2-004);
     - US1-5 (no modifier check: Alt+ArrowLeft, Ctrl+ArrowRight, Meta+ArrowRight and Shift+ArrowRight are not
       prevented and do not scroll; R-02);
     - US1-6 and US1-7 (both fades always; the `rtl` mirror removed; the ring overlay inside the masked box), asserted
       on pixels on `color-canvas` and `color-pane`, in both themes, `ltr` and `rtl`, never on `data-fade` (R-05);
       US1-6 also asserts that a fitting box has no `data-fade` and a computed `mask-image` of `none` (plant:
       `data-fade=""` bound with the mask on attribute presence; PLAN-FRESH-2-006);
     - US1-8 (both lines always), asserted on each edge element's computed border, side and box;
     - US1-10 (`preventDefault` on every arrow key); US1-11 asserts the box-focused key and the fades only, and not
       the browser's scroll from a focused slotted control (FR-009, R-02);
     - US1-13:
       - no ring room;
       - no fade clearance;
       - the wide-button fallback, held over at least two animation frames, and restored by a wheel scroll, by an
         arrow key on the box and when focus leaves the button (plant: the synchronous flag, R-06);
       - pointer focus against a twin plain `overflow-x: auto` box, with the Tab case paired in the same test (plant:
         clearance on every `focusin`, R-06);
       - the text input cleared on a click while a button is not moved (R-06);
     - US1-14 (`:host([hidden])` removed).

     US1-5 asserts the 40 px step reached within one frame under `reducedMotion: "reduce"` and without it (R-02), and
     that Home and End are not prevented. `sheets()` asserts, over two scrollers, the shared sheets plus exactly one
     per-instance sheet per root (R-13 § The conventions; PLAN-FRESH-2-005). US1-12 asserts the exact tree of the
     unlabelled scroller (SPEC-1-10). SC-001's fallback case is asserted on the forced-colours line too (R-06). A
     20 px root case asserts the 40 px clearance, and 24 px with a `calc(1rem + 4px)` fade override (R-17).
   - **Scrollbar** (PLAN-FRESH-1-003 (a), PLAN-FRESH-2-001 (a)). `test/browser/scrollbar.test.ts`, launched with
     `ignoreDefaultArgs: ["--hide-scrollbars"]`: block size includes the scrollbar; at a faded edge the scrollbar's
     pixels equal a twin plain box's while the content just above it is faded; the scrollbar appearing (content grown
     past the box) updates the mask size within one frame; and the handover ring shows over the scrollbar band
     (R-04, R-05, R-07). Plant: the fade layer sized to the whole box (no measured block size).
   - **US1-16.** `test/fixtures/overflow-host.ts` and its run of scenarios 1, 3, 4 and 12.
   - **Stories.** Story test ids first, then `scroller.stories.ts`, the frame rules and the baselines through
     `visual:update`. axe through the gate.
   - **Records.** Manifest, entry point, `index.ts`, `browser.ts`, changelog. README, red first in `readme.test.ts`:
     the scroller (a named group, the per-item naming guidance, the scrollbar, a definite or maximum inline size in a
     shrink-to-fit host); the module under the element
     conventions; § Host ARIA scoped per element (icon and brand mark: blank decides; scroller, board and lane: blank
     counts as absent, with R-01's reason; list-detail: no name), replacing the package-wide sentence the test pins
     (PLAN-CORRECTNESS-1-005 (a)); § Styles: the shared `static styles` plus at most one per-instance sheet of measured
     px figures, never values from attributes, properties, token text or slotted text, with the module and
     list-detail named, replacing the "one shared stylesheet" sentence the test pins (FR-030, PLAN-FRESH-2-005 (a));
     the reduced-motion statement for keys from a focused slotted control (FR-009, PLAN-FRESH-2-003 (a)); the mask
     properties on the engine list (R-18).
3. **US2 `ocelle-workflow-board` and `ocelle-workflow-lane` (P2).**
   - **Count grammar, tests first** (R-09). Then US2 scenarios 1 to 15 in both harnesses, with sentence-length cards
     in US2-1, US2-3, US2-14 and US2-15, each pair with its plant:
     - US2-1 (always region; the board's `::slotted(*)` containment removed, R-08);
     - US2-2 and US2-10: ArrowRight and ArrowLeft reach the board's hidden end in 40 px steps in `ltr` and `rtl`,
       modified arrows are not prevented, and the board's fades show on the sides with content off-screen (SC-002);
     - US2-4 (the lane ground set to `color-panel`: its computed ground no longer differs from canvas, panel,
       inspector and pane in both themes, R-10), with the title's and the count's computed type and colour;
     - US2-5 (visible title not hidden);
     - US2-6 (count "0" when absent; separator always);
     - US2-9 (a board without its own overflow: the page scrolls at 320 px);
     - US2-14 (min-content minimum; the board's `::slotted(*)` without inline-size containment), with `base.css`
       (R-08);
     - US2-15 (no ring room);
     - US2-12 (`:host([hidden])` removed);
     - the edge cases (C3): many lanes (twelve in Frame W keep the minimum and the board scrolls); one lane (full
       inline size less the ring room); no lanes (paired with a five-lane twin in Frame N; plant: always region);
       non-lane children (a `div` child with sentence text is equal to the lanes; plant: containment on the lane host
       only, F1); lane count updates (the visible count and the name follow; no live region; plant: `aria-live` on the
       header); content removed while scrolled to the end (the fades and the tab stop follow the clamped position;
       plant: the state not recomputed on `slotchange` or the track's resize).

     The board's region role is asserted on the board (the test host and the scroller cover `group`). `sheets()`
     asserts one per-instance sheet per board root and none on the lane (R-13 § The conventions). A 20 px root
     case: lanes at 200 px, and five overflow Frame W (R-17).
   - **Plan-level test of SPEC-2-06** (R-08): wide fixed content overlaps the next lane, and, added after the first
     render as a card that grows the last lane, makes the board overflow within one frame (FR-014, R-03).
   - **Forced colours.** A lane-border test (US2-11).
   - **Stories, baselines and records** as in phase 2. The README covers the board's ground and the default lane's
     (R-10), and wide content.
4. **US3 `ocelle-list-detail` (P3).**
   - **Spike first** (R-13), recorded in `reviews/phase-4/spike.md`: the measurement pass and the sizer give US3-12's
     figures (1073 px three columns in a 1196 px row; 636 px one column in a 636 px row; a dialog in a 1280 px
     viewport: three columns; a table cell in a 636 px table: one column), the stale content case (1196 px, three
     columns) and the two content-change cases (a 35rem detail, taller and same height: 1153 px in the first frame
     record after the change, PLAN-FRESH-2-002 (a)), the two unseen cases (1073 px until `remeasure()`, then 1196 px)
     and the `ResizeObserver` callback case (1153 px after settle), with `driver.messages()` empty, stable over ten
     frames, with the frame record never showing the measurement grid (R-13, PLAN-FRESH-3-001 (a), PLAN-FRESH-3-002,
     PLAN-FRESH-3-003 (b)). If it fails: stop and ask the operator (fork in R-13).
   - **Grammar and tier choice, tests first** (`tiers.ts`, R-12). It includes `56REM` accepted and `+56rem`, `.5rem`,
     `56.rem`, `5.6e1rem` and `-0` rejected, and the token default and its fallback constants compared with the token
     source.
   - **Scenarios.** US3 scenarios 1 to 16 in both harnesses, each frame at its viewport, each pair with its plant:
     - US3-4 (`detail-open` in every tier);
     - US3-1 and US3-2 in forced colours: the pane borders in `CanvasText`, side by side and stacked (plant: the
       border rule inside `@media not (forced-colors: active)`; FR-023, C1);
     - US3-6 (focus moved on every switch; wrappers focusable at all times, with the tree at rest and a click on pane
       text; the default outset ring, in Frame N inside an `overflow: hidden` container, and `Highlight` in forced
       colours; after the switch the next Tab reaches the detail's first focusable element and the wrapper has no
       `tabindex`; R-14);
     - the edge case "list-detail with an empty list slot": the list track keeps 288 px in Frame R (C3);
     - US3-8 (inspector always rendered; the slot rendered only when an inspector is present, with an inspector
       added after the first render and removed again; R-11);
     - US3-9 (page scroll);
     - US3-10 (any resolvable length accepted; both attributes), asserting the 1280 px viewport for the `vw` case;
     - US3-12 (intrinsic size follows the tier; the measurement pass split across a `requestAnimationFrame`, caught
       by the frame record; the shown-pane `ResizeObserver` as the trigger, caught by the same-height case and by
       `driver.messages()`; the shadow-content and class-swap cases with `remeasure()`, plants `remeasure()` as a
       no-op and `attributes` observed; a slotted element appending content from its own `ResizeObserver` with the
       detail shown in one column, plant the pass run in the `MutationObserver` callback; R-13);
     - the once-per-frame pass (FR-025), in-process only: three tasks before one frame run one pass, read from the
       test-only counter, plant one pass per `MutationObserver` delivery (R-13);
     - US3-15 (`:host([hidden])` removed).

     US3-6 adds the ring cases (keyboard, then pointer; R-14). A test asserts that no shadow element carries a
     `style` attribute, and `sheets()` asserts one per-instance sheet per root over two instances (R-13). A 20 px root
     case: one column in a 720 px frame, two at 16 px (R-17). The upgrade cases of R-14 run in-process in
     `test/list-detail-upgrade.test.ts` (mutated), and on a server-rendered fixture page as the built-output check.
   - **Stories, baselines and records.** The README covers the container-tier convention, checked item by item
     (FR-034, SC-009), including its re-measure triggers, that the unseen changes (images, fonts, shadow-rendered
     content, attribute-only changes) wait for the next one or for `remeasure()`, the cost of one pass, and that
     content mutated inside a consumer's own `ResizeObserver` callback can still bring the browser's loop message
     through layout alone (FR-025, PLAN-FRESH-2-002 (a), PLAN-FRESH-3-001 (a), PLAN-FRESH-3-002, PLAN-FRESH-3-003 (b)).
     The manifest declares `remeasure()`, and the changelog names it (FR-035).
5. **Polish.**
   - The README documentation test for every FR-034 item.
   - Both changelogs.
   - `quickstart.md`'s commands run once, with the results in `reviews/phase-5/`.
   - A final merge of `main` if the siblings have landed.

## Complexity Tracking

No exceptions. #10 is merged before implementation, so 005's "no baselines and axe" row does not recur.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
