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

- **`ocelle-scroller` (P1).** A horizontal strip that is a tab stop, and a named region when labelled, only while it
  overflows. It shows a token focus ring, scrolls 40 px per arrow key with no animation, and shows a masked fade, or a
  1 px `CanvasText` line in forced colours, on each logical side with content off-screen. It keeps the focus rings of
  its controls whole and clear of the fades.
- **The overflow-region module.** All of that behaviour lives in one internal module with a written contract
  ([contracts/overflow-region.md](contracts/overflow-region.md)), which a test-only host proves. The board uses it,
  and #13's `ocelle-code-block` will.
- **`ocelle-workflow-board` and `ocelle-workflow-lane` (P2).**
  - The board lays out equal lanes no narrower than `--ocelle-lane-min-width` (10rem): five fit Frame W in 858 of
    876 px. It scrolls itself through the same module when narrower.
  - Lanes have a default chrome and a `flat` variant.
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

**Testing**: 005's harnesses (its research R-11):
- shared scenario bodies in `packages/elements/test/scenarios/`, run in-process by the `elements` project (mutated by
  the elements-only Stryker configuration) and on strict-CSP fixture pages from the browser build by
  `elements-browser`;
- pure helpers (edge state, clearance arithmetic, name resolution, the `*-below` grammar, the count grammar) unit-tested
  in-process;
- token records by the `tokens` project and the token gates;
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
- CSSOM writes of computed px figures on shadow elements only (R-13), never a markup `style` attribute.

**Scale/Scope**: four elements, one internal module, six tokens and twenty-three stories in two themes (contracts/elements.md
§ Stories).

## Constitution Check

*Gate: passes before Phase 0 research and again after Phase 1 design, with no Complexity Tracking row.*

| Principle | How this plan meets it |
|---|---|
| I. `ocelle-` names, no I/O, small surface, manifest | Four `ocelle-*` elements, no events, no I/O; every property, attribute and slot is in the manifest; the module is internal (contracts/overflow-region.md § Status). |
| II. Tokens only, brand rules | Six new tokens; element CSS is `token-only`. The mask uses `transparent` and a token colour (R-05). No monospace: the flat title uses `--ocelle-font-sans` with tabular figures and `--ocelle-tracking-caps` (FR-021). `--ocelle-color-rule` borders are decorative only (FR-023). One radius: `radius-row` on the lane chrome. |
| III. Accessible by construction | Tab stop and region only while overflowing (R-01, R-03). Arrow keys with no animation under any motion setting (R-02). Token focus ring drawn outside the mask (R-05). Focus rings of slotted controls kept whole and clear of the fades (R-04, R-06). Forced-colours edge lines, ring in `Highlight`, lane borders and pane borders in `CanvasText`. No ID reference crosses a shadow root: names are copied as text into the shadow node (R-01). Focus moves with the shown pane (R-14). Reduced motion: nothing animates. Contrast: no new colour token; the colours used are checked pairs (R-10). axe over every story through #10 (R-15). |
| IV. Strict CSP | Adopted stylesheets only. No `style` attribute in templates, in fixtures or in stories (`[data-story]` CSS, R-15). CSSOM writes of computed figures are allowed under the policy and create no markup (R-13). The `csp` gate scans built output, and the fixture pages count violations. |
| V. Storybook, behaviour tests | One story per variant and per state that draws different pixels, in light and dark, with baselines from #10's pinned container (R-15). States that draw the same pixels, and focus and forced-colours states (not captured by #10), are proven by tests (R-15). No events, so no payload tests. Every keyboard path is tested (arrows, Tab, Shift+Tab, focus handover, pane switch). |
| VI. Consumer needs, own code | spec-kitty-design #505, #506, #507, #514 and #530 are named in the spec. Nothing is ported. |
| VII. Semantic versioning | Additions only; the changelogs name them (FR-035). |
| VIII. Test-first, non-vacuous | Every phase is red first. Every "does not" outcome is paired with its positive outcome and has its plant (spec table; phases below). Pure helpers make the layout arithmetic mutation-testable. Element source is mutated in-process under 007's stricter gate (R-17). Documentation-only items (changelog, README prose with no tested item) take the exemption, with the reason stated in review. |

## Decisions the operator should see at the plan gate

1. **The roles live in the shadow root, not on the host** (R-01, measured). A non-empty host `aria-label` therefore
   also leaves a named `generic` host node beside the region or group. Putting the role on the host through
   `ElementInternals` would lose the region whenever the host `aria-label` is blank, which the spec treats as absent.
2. **The element handles the arrow keys itself** (R-02, measured). Chromium's own keyboard scrolling animates even
   under reduced motion. Home, End and Page keys are left to the browser.
3. **Focus clearance belongs to the module and applies to keyboard (`:focus-visible`) focus only, not pointer focus**
   (R-06). The forced-colours line follows the same suppression as the fade. This widens FR-011's written outputs
   (`fadeStart` and `fadeEnd`).
4. **Nested images in a lane rely on `base.css`** for their width cap (R-08), since `::slotted()` reaches only direct
   children. Content that cannot shrink visibly overflows into the next lane; the README tells hosts to use a
   scroller (SPEC-2-06).
5. **list-detail's intrinsic sizes come from a measurement pass and CSSOM writes** (R-13). This is the one risky
   design, and phase 4 starts with a spike. If the spike fails, the operator gets a fork: relax US3-12's exact size.
6. **Upgrade focus** (R-14): if a server-rendered page's focus is inside a pane that the first layout hides, focus
   moves. "No focus on a node without a box" wins.
7. **`inspector-below`** stays as the approved spec has it (SPEC-1-17; R-19).

## Project Structure

### Documentation (this feature)

```text
specs/009-workflow-layouts/
├── spec.md, plan.md, research.md, data-model.md, quickstart.md
├── contracts/overflow-region.md, contracts/elements.md
├── sources/issues.md
├── checklists/requirements.md
└── reviews/ (spec checks; plan squad rounds; phase reviews)
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
│   ├── overflow-region.test.ts, tiers.test.ts            # pure helpers (in-process, mutated)
│   ├── scroller.test.ts, workflow-board.test.ts, workflow-lane.test.ts, list-detail.test.ts
│   ├── entry-scroller.test.ts, entry-workflow-board.test.ts, entry-workflow-lane.test.ts, entry-list-detail.test.ts
│   ├── scenarios/{scroller,board,lane,list-detail}.ts    # shared bodies
│   ├── fixtures/overflow-host.ts                         # test-only element on the module (US1-16)
│   ├── browser/fixtures/frames.css                       # Frames W, R, N, S as fixture CSS (no inline style)
│   ├── browser/*.test.ts                                 # elements-browser runs
│   └── node/readme.test.ts                               # + FR-034 items
├── custom-elements.json        # regenerated (shared file)
├── package.json                # + four exports
├── README.md, CHANGELOG.md
packages/tokens/src/source.ts   # six records (R-16); generated docs and pinned counts in the token tests and gates
packages/tokens/CHANGELOG.md
storybook/stories/{scroller,workflow-board,workflow-lane,list-detail}.stories.ts
storybook/.storybook/stories-layout.css   # [data-story] frames
storybook/baselines/*.png                 # from #10's visual:update
storybook/test/integration/elements-stories.test.ts  # + story ids
```

**Structure Decision**: as 005, everything for elements is in `packages/elements`, the tokens are in the token source,
and the stories are in the existing Storybook. No gate changes: the `manifest`, `csp`, `style-lint` and `mutation` gates
and #10's gates apply as they are.

## Phases (user stories) for `/speckit-tasks`

1. **Setup.**
   - **Recheck #10** (exempt, a record). Read #10 as merged on `main` against R-15's list, merge `main` (never
     rebase), and record the result in `reviews/phase-1/recheck-10.md`. Update R-15 and `contracts/elements.md`
     § Stories if anything differs. Check `main` for sibling 011's (#8) letter-spacing token and container-tier
     convention, and adopt them if present (R-16).
   - **Tokens** (not exempt). Tests first: the six records and their values in the token tests, the pinned counts in
     the token and gates tests, and the generated documentation rows. Then `source.ts`.
   - **Frames** (exempt). Add Frames W, R, N and S as fixture CSS to the `elements-browser` harness, and as
     `[data-story]` rules, with no behaviour.
2. **US1 `ocelle-scroller` and the overflow-region module (P1).**
   - **Pure helpers, tests first.** `edgeState` (tolerance, RTL sign), `clearanceScroll` (LTR and RTL; a control that
     fits, one too wide for the clearance, one wider than the box) and `resolveName` (blank host label, trimming).
   - **Module and scroller, tests first.** US1 scenarios 1 to 16 as shared bodies in both harnesses. Each pair names
     its plant:
     - US1-1 (`tabindex` and role whatever the overflow);
     - US1-6 (both fades always);
     - US1-8 (both lines always);
     - US1-10 (`preventDefault` on every arrow key);
     - US1-13 (no ring room; no fade clearance; and a separate test that a pointer-focused chip is not moved beyond
       the browser's own scroll, R-06);
     - US1-14 (`:host([hidden])` removed).

     US1-5 asserts the 40 px step reached within one frame under `reducedMotion: "reduce"` and without it (R-02), and
     that Home and End are not prevented. US1-12 asserts the exact tree of the unlabelled scroller (SPEC-1-10).
     SC-001's fallback case is asserted on the forced-colours line too (R-06).
   - **US1-16.** `test/fixtures/overflow-host.ts` and its run of scenarios 1, 3, 4 and 12.
   - **Stories.** Story test ids first, then `scroller.stories.ts`, the frame rules and the baselines through
     `visual:update`. axe through the gate.
   - **Records.** Manifest, entry point, `index.ts`, `browser.ts`, README (scroller; the module under the element
     conventions; `mask-image` on the engine list), changelog.
3. **US2 `ocelle-workflow-board` and `ocelle-workflow-lane` (P2).**
   - **Count grammar, tests first** (R-09). Then US2 scenarios 1 to 15 in both harnesses, each pair with its plant:
     - US2-1 (always region);
     - US2-5 (visible title not hidden);
     - US2-6 (count "0" when absent; separator always);
     - US2-14 (min-content minimum), with `base.css` (R-08);
     - US2-15 (no ring room);
     - US2-12 (`:host([hidden])` removed).
   - **Plan-level test of SPEC-2-06** (R-08): wide fixed content overlaps the next lane, and makes the board overflow
     when it is in the last lane.
   - **Forced colours.** A lane-border test (US2-11).
   - **Stories, baselines and records** as in phase 2. The README covers the board's ground (R-10) and wide content.
4. **US3 `ocelle-list-detail` (P3).**
   - **Spike first** (R-13), recorded in `reviews/phase-4/spike.md`: the measurement pass and the sizer give US3-12's
     figures (1074 px three columns in a 1196 px row; 636 px one column in a 636 px row; a dialog in a 1280 px
     viewport: three columns; a table cell in a 636 px table: one column), stable over ten frames, with no
     intermediate frame painted. If it fails: stop and ask the operator (fork in R-13).
   - **Grammar and tier choice, tests first** (`tiers.ts`, R-12). It includes `56REM` accepted and `+56rem`, `.5rem`,
     `5.6e1rem` and `-0` rejected, and the token default and its fallback constants compared with the token source.
   - **Scenarios.** US3 scenarios 1 to 16 in both harnesses, each pair with its plant:
     - US3-4 (`detail-open` in every tier);
     - US3-8 (inspector always rendered);
     - US3-10 (any resolvable length accepted; both attributes);
     - US3-12 (intrinsic size follows the tier);
     - US3-6 (focus moved on every switch);
     - US3-9 (page scroll);
     - US3-15 (`:host([hidden])` removed).

     US3-6 adds the ring cases (keyboard, then pointer; R-14). The upgrade cases of R-14 run on a server-rendered
     fixture page.
   - **Stories, baselines and records.** The README covers the container-tier convention, checked item by item
     (FR-034, SC-009).
5. **Polish.**
   - The README documentation test for every FR-034 item, and the frames as tested sizes.
   - Both changelogs.
   - `quickstart.md`'s commands run once, with the results in `reviews/phase-5/`.
   - A final merge of `main` if the siblings have landed.

## Complexity Tracking

No exceptions. #10 is merged before implementation, so 005's "no baselines and axe" row does not recur.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
