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
  depend on the tier, so a shrink-to-fit host cannot make it alternate (spike first, R-13). This defines the
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

**Performance Goals**: one `ResizeObserver` per element instance. Updates only when an output changes. A board of
twelve lanes with forty cards each updates its state within one frame of a resize.

**Constraints**:
- strict CSP with no exception;
- token-only styles;
- no I/O;
- open shadow roots (#10);
- measured px figures only through a per-instance constructed stylesheet adopted on the shadow root (R-13), never
  through `element.style`, which would write a `style` attribute.

**Scale/Scope**: four elements, one internal module, six tokens and twenty-three stories in two themes (contracts/elements.md
§ Stories).

## Constitution Check

*Gate: passes before Phase 0 research and again after Phase 1 design, with no Complexity Tracking row. Rechecked after
squad round 1's fixes: II now names the gate change, III to V and VIII the new designs and tests, IV the constructed
stylesheet that replaces `element.style` writes.*

| Principle | How this plan meets it |
|---|---|
| I. `ocelle-` names, no I/O, small surface, manifest | Four `ocelle-*` elements, no events, no I/O; every property, attribute and slot is in the manifest; the module is internal (contracts/overflow-region.md § Status). |
| II. Tokens only, brand rules | Six new tokens; element CSS is `token-only`. The mask uses `transparent` and a token colour in `linear-gradient()`, which the `ocelle/token-only` rule learns to classify, a gate change with red-first tests and plants (R-05, contracts/gates.md). The default lane's ground is `color-sheet`, a token (R-10). No monospace: the flat title uses `--ocelle-font-sans` with tabular figures and `--ocelle-tracking-caps` (FR-021). `--ocelle-color-rule` borders are decorative only (FR-023). One radius: `radius-row` on the lane chrome. |
| III. Accessible by construction | Tab stop and named group (the board: region) only while overflowing, so repeated chip rows add no landmarks (R-01, R-03). Arrow keys with no animation under any motion setting, and modified arrows left to the platform (R-02). Token focus ring drawn outside the mask; the native scrollbar kept and never faded (R-04, R-05). Focus rings of slotted controls kept whole and clear of the fades (R-04, R-06). Focus handover finds shadow-hosted controls; with none, an inner node takes focus with an inset ring (R-07). Pane wrappers focusable only while the element moves focus to them, with an inset ring in `Highlight` under forced colours (R-14). The default lane's ground differs from every main ground it sits on (R-10). Forced-colours edge lines, ring in `Highlight`, lane borders and pane borders in `CanvasText`. No ID reference crosses a shadow root: names are copied as text into the shadow node (R-01). Focus moves with the shown pane (R-14). Reduced motion: nothing animates. Contrast: no new colour token; the colours used are checked pairs (R-10). axe over every story through #10 (R-15). |
| IV. Strict CSP | Adopted stylesheets only. No `style` attribute in templates, in fixtures or in stories (`[data-frame]` and `[data-story]` CSS, R-15, R-17). list-detail's measured figures go into a per-instance constructed stylesheet adopted on its shadow root, whose rule declarations are set through the CSSOM; `element.style` is never written, because it creates a `style` attribute (R-13), and a test asserts that no shadow element carries one. The `csp` gate scans built output, and the fixture pages count violations. |
| V. Storybook, behaviour tests | One story per variant and per state that draws different pixels, in light and dark, with baselines from #10's pinned container (R-15). States that draw the same pixels, and focus and forced-colours states (not captured by #10), are proven by tests (R-15). No events, so no payload tests. Every keyboard path is tested with real input in both harnesses (arrows with and without modifiers, Tab, Shift+Tab, focus handover, pane switch; R-17). Fades are asserted on pixels, never on `data-fade` (R-05). |
| VI. Consumer needs, own code | spec-kitty-design #505, #506, #507, #514 and #530 are named in the spec. Nothing is ported. |
| VII. Semantic versioning | Additions only; the changelogs name them (FR-035). |
| VIII. Test-first, non-vacuous | Every phase is red first; the driver extension and the frames are tested too (R-17). Every "does not" outcome is paired with its positive outcome and has its plant (spec table; phases below); each pairing plant is run once and recorded in `reviews/phase-N/plants.md`, and one that does not fail its test stops the phase (R-17). Timing bounds are tested at the bound (R-03), the pointer-focus case against a twin oracle (R-06), and px figures at a 20 px root as well (R-17). Pure helpers make the layout arithmetic mutation-testable. Element source is mutated in-process under 007's stricter gate, the upgrade branch included (R-14, R-17); the gate change has its own red-first tests and gate plants (contracts/gates.md). Documentation-only items (changelog, README prose with no tested item) take the exemption, with the reason stated in review. |

## Decisions the operator should see at the plan gate

1. **The roles live in the shadow root, not on the host** (R-01, measured). A non-empty host `aria-label` therefore
   also leaves a named `generic` host node beside the group, region or lane group. Putting the role on the host
   through `ElementInternals` would lose the role whenever the host `aria-label` is blank, which the spec treats as
   absent.
2. **The element handles the arrow keys itself** (R-02, measured). Chromium's own keyboard scrolling animates even
   under reduced motion. Home, End and Page keys, and every modified arrow, are left to the browser.
3. **Focus clearance belongs to the module and applies to focus that shows a ring** (`:focus-visible`: keyboard focus,
   and any focus of a text-entry control), not to pointer focus on a button or link (R-06). The forced-colours line
   follows the same suppression as the fade. FR-001 and FR-011 say so since the plan gate.
4. **Nested images in a lane rely on `base.css`** for their width cap (R-08), since `::slotted()` reaches only direct
   children. Content that cannot shrink visibly overflows into the next lane; the README tells hosts to use a
   scroller (SPEC-2-06).
5. **list-detail's intrinsic sizes come from a measurement pass and a per-instance constructed stylesheet** (R-13).
   This is the one risky design, and phase 4 starts with a spike. If the spike fails, the operator gets a fork: relax
   US3-12's exact size.
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
       delegates focus; the frame's ring rule removed, asserted inside an `overflow: hidden` container and in forced
       colours; R-07);
     - US1-5 (no modifier check: Alt+ArrowLeft, Ctrl+ArrowRight, Meta+ArrowRight and Shift+ArrowRight are not
       prevented and do not scroll; R-02);
     - US1-6 and US1-7 (both fades always; the `rtl` mirror removed; the ring overlay inside the masked box), asserted
       on pixels on `color-canvas` and `color-pane`, in both themes, `ltr` and `rtl`, never on `data-fade` (R-05);
     - US1-8 (both lines always), asserted on each edge element's computed border, side and box;
     - US1-10 (`preventDefault` on every arrow key);
     - US1-13:
       - no ring room;
       - no fade clearance;
       - the wide-button fallback, held over at least two animation frames, and restored by a wheel scroll and by an
         arrow key on the box (plant: the synchronous flag, R-06);
       - pointer focus against a twin plain `overflow-x: auto` box, with the Tab case paired in the same test (plant:
         clearance on every `focusin`, R-06);
       - the text input cleared on a click while a button is not moved (R-06);
     - US1-14 (`:host([hidden])` removed).

     US1-5 asserts the 40 px step reached within one frame under `reducedMotion: "reduce"` and without it (R-02), and
     that Home and End are not prevented. US1-12 asserts the exact tree of the unlabelled scroller (SPEC-1-10).
     SC-001's fallback case is asserted on the forced-colours line too (R-06). A 20 px root case asserts the 40 px
     clearance, and 24 px with a `calc(1rem + 4px)` fade override (R-17).
   - **Scrollbar** (PLAN-FRESH-1-003 (a)). `test/browser/scrollbar.test.ts`, launched with
     `ignoreDefaultArgs: ["--hide-scrollbars"]`: block size includes the scrollbar, and its pixels at a faded edge
     equal a twin plain box's (R-04, R-05). Plant: the mask without the padding-box clip.
   - **US1-16.** `test/fixtures/overflow-host.ts` and its run of scenarios 1, 3, 4 and 12.
   - **Stories.** Story test ids first, then `scroller.stories.ts`, the frame rules and the baselines through
     `visual:update`. axe through the gate.
   - **Records.** Manifest, entry point, `index.ts`, `browser.ts`, changelog. README, red first in `readme.test.ts`:
     the scroller (a named group, the per-item naming guidance, the scrollbar); the module under the element
     conventions; § Host ARIA scoped per element (icon and brand mark: blank decides; scroller, board and lane: blank
     counts as absent, with R-01's reason; list-detail: no name), replacing the package-wide sentence the test pins
     (PLAN-CORRECTNESS-1-005 (a)); the mask properties on the engine list (R-18).
3. **US2 `ocelle-workflow-board` and `ocelle-workflow-lane` (P2).**
   - **Count grammar, tests first** (R-09). Then US2 scenarios 1 to 15 in both harnesses, with sentence-length cards
     in US2-1, US2-3, US2-14 and US2-15, each pair with its plant:
     - US2-1 (always region; lane containment removed, R-08);
     - US2-4 (the lane ground set to `color-panel`: its computed ground no longer differs from canvas, panel and
       inspector in both themes, R-10);
     - US2-5 (visible title not hidden);
     - US2-6 (count "0" when absent; separator always);
     - US2-9 (a board without its own overflow: the page scrolls at 320 px);
     - US2-14 (min-content minimum; a lane without inline-size containment), with `base.css` (R-08);
     - US2-15 (no ring room);
     - US2-12 (`:host([hidden])` removed).

     The board's region role is asserted on the board (the test host and the scroller cover `group`). A 20 px root
     case: lanes at 200 px, and five overflow Frame W (R-17).
   - **Plan-level test of SPEC-2-06** (R-08): wide fixed content overlaps the next lane, and, added after the first
     render as a card that grows the last lane, makes the board overflow within one frame (FR-014, R-03).
   - **Forced colours.** A lane-border test (US2-11).
   - **Stories, baselines and records** as in phase 2. The README covers the board's ground and the default lane's
     (R-10), and wide content.
4. **US3 `ocelle-list-detail` (P3).**
   - **Spike first** (R-13), recorded in `reviews/phase-4/spike.md`: the measurement pass and the sizer give US3-12's
     figures (1073 px three columns in a 1196 px row; 636 px one column in a 636 px row; a dialog in a 1280 px
     viewport: three columns; a table cell in a 636 px table: one column) and the stale content case (1196 px, three
     columns), stable over ten frames, with the frame record never showing the measurement grid. If it fails: stop
     and ask the operator (fork in R-13).
   - **Grammar and tier choice, tests first** (`tiers.ts`, R-12). It includes `56REM` accepted and `+56rem`, `.5rem`,
     `56.rem`, `5.6e1rem` and `-0` rejected, and the token default and its fallback constants compared with the token
     source.
   - **Scenarios.** US3 scenarios 1 to 16 in both harnesses, each frame at its viewport, each pair with its plant:
     - US3-4 (`detail-open` in every tier);
     - US3-6 (focus moved on every switch; wrappers focusable at all times, with the tree at rest and a click on pane
       text; the default outset ring, in Frame N inside an `overflow: hidden` container, and `Highlight` in forced
       colours; R-14);
     - US3-8 (inspector always rendered; the slot rendered only when an inspector is present, with an inspector
       added after the first render and removed again; R-11);
     - US3-9 (page scroll);
     - US3-10 (any resolvable length accepted; both attributes), asserting the 1280 px viewport for the `vw` case;
     - US3-12 (intrinsic size follows the tier; the measurement pass split across a `requestAnimationFrame`, caught
       by the frame record; R-13);
     - US3-15 (`:host([hidden])` removed).

     US3-6 adds the ring cases (keyboard, then pointer; R-14). A test asserts that no shadow element carries a
     `style` attribute (R-13). A 20 px root case: one column in a 720 px frame, two at 16 px (R-17). The upgrade
     cases of R-14 run in-process in `test/list-detail-upgrade.test.ts` (mutated), and on a server-rendered fixture
     page as the built-output check.
   - **Stories, baselines and records.** The README covers the container-tier convention, checked item by item
     (FR-034, SC-009).
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
