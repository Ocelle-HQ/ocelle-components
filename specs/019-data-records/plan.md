# Implementation Plan: Data Records (Data Table, Event Timeline, Evidence Chain)

**Branch**: `019-data-records` (work on `claude/013-data-display-2`) | **Date**: 2026-11-15 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/019-data-records/spec.md`, approved by the operator at the spec gate on
2026-11-15 after three checks (`reviews/spec/operator-gate.md`). Spec check 3's notes SPEC-3-01 to SPEC-3-05 are
taken up in research R-04, R-06 and R-12 and in the red commits' bodies (below).

## Summary

This mission adds five elements to `@ocelle/elements`: `ocelle-data-table`, `ocelle-event-timeline` with its item
`ocelle-timeline-event`, and `ocelle-evidence-chain` with its item `ocelle-evidence-step`. It also adds a data-table
block to `@ocelle/styles`. It replaces kitty-mission-ui's `.sk-data-table` family and the Desktop V2 prototype's event
history and evidence chain.

- **Data table.** The consumer's own `<table>` is slotted unchanged into a scroll region built on 009's
  `OverflowRegion` (R-01, R-02). Its caption, headers and cells keep the platform's table semantics in the consumer's
  tree. The cells are styled by zero-specificity rules in `@ocelle/styles`, because shadow styles cannot reach them,
  with a prose override at (0,1,0) (R-06). The region is a named `group` tab stop only while the table overflows. It
  is named from the host `aria-label`, then `label`, then the caption's text (R-04). One host rule sizes the module's
  track to `fit-content`, so cells wrap before the table scrolls. This needs the operator's decision 1 (R-03).
- **Timeline and chain.** Each renders a shadow `<ol role="list">` with one `<li role="listitem">` per visible item,
  assigned manually (R-08). Each list is named on the `<ol>`, and a blank host `aria-label` counts as absent (R-09).
  Markers, connectors and ordinals are `aria-hidden` (R-10, R-12).
  - **Timeline.** Each event has a time line above its content, and a dot marker is centred on the event's first line
    with `1lh`.
  - **Chain.** The chain is a wrapping flex row. Connectors sit in each step's trailing padding, and a line end is
    measured from layout, so no connector dangles or crosses lines (R-12). A chip step is drawn by the container
    through `::slotted()`: `radius-2`, outline only, 20.4 px tall.
- **Tokens and contrast.** No new token and no new contrast row (R-13).
- **What is not decided yet.** Four open questions from the unread #470, #517 and #533 (Q-A to Q-D) and decision 1
  go to the operator at the plan gate.

Implementation waits for 009, 013 and op 016 on `main`. The first task rechecks the plan against `main` as merged
(R-14).

## Technical Context

**Language/Version**: TypeScript 6.0.3 (strict, `erasableSyntaxOnly`); Node 26.13.0 in CI, 22.23.4 in this container.

**Primary Dependencies**: `lit` 3.3.3. No new dependency. Internal: 009's `src/overflow-region.ts` (branch, R-02).

**Storage**: N/A.

**Testing**:
- The two harnesses of 005 and 013: shared scenario bodies run in process (the `elements` project, mutated) and on
  the built browser build on strict-CSP fixture pages (`elements-browser`).
- Driver additions, each with its own test: `itemTexts` (R-11), and anything 013's and 009's drivers do not already
  provide. 013's `viewport`, `scrollWidth`, `copy`, `pressTab`, `focused` and `text` and 009's keyboard and scroll
  helpers are reused as merged (R-14).
- `@ocelle/styles` browser tests for the data-table block and its prose override, and a node test that the override
  restates every property of 003's prose table rules (R-06).
- The story test in `storybook-integration`, extended per phase with 320 px reflow per container story.
- #10's gates on the stories: `storybook-build`, `visual` (light and dark baselines from the pinned container) and
  `axe`.
- Plant runs through op 016's `--affected` selection (R-15).
- Details: [contracts/checks.md](contracts/checks.md).

**Target Platform**: evergreen Chromium, measured. WebKit 16.4+ is unmeasured (the README's Engines note). No new
engine-floor feature: manual slot assignment (013) and the module's features (009) are already listed.

**Project Type**: library (web components) in a pnpm workspace.

**Performance Goals**: none specific.
- Each class adopts one shared stylesheet; the data table also gets the module's one per-instance sheet (009).
- Per container: one `MutationObserver`. The chain also has one `ResizeObserver`, on its list and its items.

**Constraints**: strict CSP with no exception; token-only styles with no new `style-lint` allowance (every value is a
token, a keyword, `0`, a `%`-free length from a token, `1lh`, or `calc()` over tokens); no `sk-` names; no
monospace; no I/O; one heavy job at a time in this container.

**Scale/Scope**: 5 elements, 0 tokens, 0 contrast rows, 2 `@ocelle/styles` blocks (the data-table rules and their
prose override), 1 driver addition, about 34 stories (each with two baselines).

## Constitution Check

*Gate: passes before Phase 0 and again after Phase 1 design, with the open questions Q-A to Q-D and decision 1 for
the operator at the plan gate. No exception is planned (Complexity Tracking).*

| Principle | How this plan meets it |
|---|---|
| I. Names, no I/O, small interface, manifest | **Tags**: `ocelle-data-table`, `ocelle-event-timeline`, `ocelle-timeline-event`, `ocelle-evidence-chain`, `ocelle-evidence-step`. **Events**: none. **I/O**: none. **Properties**: `label`, `wrap` (data table); `label` (timeline, chain); `time`, `wrap` (event); `variant`, `wrap` (step). Every property is `\| undefined` with `@default undefined`; `wrap` and `variant` reflect, because the styles select on them. **Parts**: `list` on the two containers; `time` and `content` on the event; `content` on the step. **CSS hooks**: none. **Slots**: the default slot of each element. The manifest declares everything, with every list stated ([contracts/](contracts/)). |
| II. Tokens only, brand rules | **Tokens**: every value is a token (R-06, R-10, R-12); no new token (R-13). **No monospace**: cells, times, ordinals and chips use `font-sans` with `figures`. **`color-rule`**: only on decorative lines (the row and header rules, the connectors; FR-013). **Radius**: `radius-2` on the chip (the one radius, never `radius-pill`); `radius-1` on the dot and the step marker, the small-mark radius of the tokens README (Q-D). **Ochre**: none. |
| III. Accessible by construction | **ID references**: none across a root. The table's references stay in the consumer's tree (R-01), and the region is named by copied text (R-04). **Roles**: the table's own roles; a `group` on the region while it overflows (009); `list` and `listitem` on the shadow lists, explicit for WebKit (R-08). **Hidden**: markers, connectors and ordinals are `aria-hidden`; item text is asserted by `itemTexts` (R-11). **Keyboard**: the overflowing region is the only added tab stop, with arrows, clearance and handover from the module; slotted links keep theirs. **Contrast**: text and structural marks use ink tokens with text declarations on the nine main grounds; decorative lines are exempt but visible in forced colours (FR-013, R-13). **Reflow**: 320 px tests per container. **Naming**: a blank host `aria-label` counts as absent on the lists (R-09), as on the 009 elements. **axe**: #10's `axe` gate on every story, with no exception entry planned. |
| IV. Strict CSP, offline | Adopted stylesheets and `base.css` only. No `style` attribute; the module's mask figures use its per-instance sheet (009). Fixture pages assert zero violations. |
| V. Storybook, behaviour tests | A story per variant and state, light and dark ([contracts/checks.md](contracts/checks.md) § Stories). The item elements' states are stories in their container's file. Their behaviour outside the container is proven by browser bodies only, as 013 did for `ocelle-fact`. FR-050 names that as the spec's own rule, not an exception. The data-table stories include a fitting table, an overflowing table, row headers, one named by its caption, `wrap="anywhere"`, prose and right-to-left. |
| VI. Consumer-driven, own code | Needs: kitty-mission-ui's `.sk-data-table` family and the Desktop V2 primitives (#470, #517, #533). The issues are unread, so their points are the plan gate's questions Q-A to Q-D (spec SPEC-1-06 (b)). The inventory is an operator input before each red commit (R-16). Nothing is copied, and the README mapping names roles only. |
| VII. Semver | **MINOR**: five elements, five entry points and two `base.css` blocks. CHANGELOG entries go in `@ocelle/elements` and `@ocelle/styles`. `@ocelle/tokens` is unchanged. |
| VIII. Test-first, non-vacuous | A scaffold comes before each red commit. The red commit holds the phase's scenario bodies, the driver test, the node and styles tests and the story-test extension (operator decision I3), and `red.sh` keeps one red record per phase. Item-text bodies also assert a non-empty text (FR-016). Each CSS-only behaviour has a named plant or a stated reason, because Stryker does not mutate `css` templates or `base.css` (contracts/checks.md § Plants). Spikes run before the scaffolds of phases 1 to 3, and a failing spike result goes to the operator. |
| Licence, supply chain | No new dependency or asset. |
| Workflow gates | No gate changes. The gates run unchanged; the plants run by op 016's selection locally and in full in CI (R-15). |

## Decisions the operator should see at the plan gate

1. **The track's inline size (R-03).**
   - The plan's default is (a): `:host .region-track { inline-size: fit-content }` in the data table's own styles. It
     overrides one property of 009's module stylesheet, so cells wrap before the table scrolls.
   - (b) adds a sizing option to 009's module. That changes 009's interface.
   - (c) keeps max-content, which changes US1-9.
2. **Q-A, the chip step's look** (#517). The plan uses an outline with no fill.
3. **Q-B, the column headers' weight and colour** (#533). The plan uses medium weight in `ink-muted`.
4. **Q-C, the event's time position** (#470). The plan puts the time on its own line above the content, with the
   marker on that line.
5. **Q-D, the markers' shape.** The plan uses `radius-1` for both markers and adds no new token.
6. **Dependencies.** Implementation waits for 009, 013 and op 016 on `main`. T001 rechecks the plan and tasks
   against `main` as merged and stops for the operator on any difference (R-14).
7. **The inventory (R-16).** The operator supplies kitty-mission-ui's variant inventory before each phase's red
   commit, as in 013. A gap goes to the operator.

## Project Structure

### Documentation (this feature)

```text
specs/019-data-records/
├── plan.md              # this file
├── research.md          # R-01 to R-16, open questions Q-A to Q-D, decision 1
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── ocelle-data-table.md
│   ├── ocelle-event-timeline.md
│   ├── ocelle-timeline-event.md
│   ├── ocelle-evidence-chain.md
│   ├── ocelle-evidence-step.md
│   ├── styles-data-table.md  # the @ocelle/styles rules and their prose override
│   └── checks.md             # tests, oracles, plants, stories, gates
├── checklists/requirements.md
├── reviews/              # spec checks, plan squad, phases, recheck.md
└── tasks.md              # /speckit-tasks
```

### Source Code (repository root)

```text
packages/elements/
├── src/
│   ├── ocelle-data-table.ts       # new (uses overflow-region.ts)
│   ├── ocelle-event-timeline.ts   # new (imports ocelle-timeline-event.ts)
│   ├── ocelle-timeline-event.ts   # new
│   ├── ocelle-evidence-chain.ts   # new (imports ocelle-evidence-step.ts)
│   ├── ocelle-evidence-step.ts    # new
│   ├── list-name.ts               # new, internal: the blank-counts-as-absent list name (R-09), if 009 has none
│   ├── index.ts, browser.ts       # re-export / define the five
├── test/
│   ├── scenarios/{data-table,event-timeline,evidence-chain}.ts
│   ├── scenarios/driver.ts, in-process.ts, browser/driver.ts   # + itemTexts
│   ├── {data-table,event-timeline,evidence-chain}.test.ts      # in process (mutated)
│   ├── browser/{data-table,event-timeline,evidence-chain}.test.ts
│   ├── entry-*.test.ts                                         # the five entry points
│   ├── node/readme.test.ts, node/manifest.test.ts, node/chain-no-pill.test.ts
│   └── build/build.test.ts                                     # container import rule for the two containers
├── custom-elements.json           # regenerated
├── package.json                   # exports
├── README.md, CHANGELOG.md
packages/styles/
├── src/base.css                   # the data-table block and the prose override
├── test/browser/data-table.test.ts, test/node/prose-override.test.ts, test/readme.test.ts
├── README.md, CHANGELOG.md
storybook/stories/{data-table,event-timeline,evidence-chain}.stories.ts
storybook/.storybook/stories-layout.css                        # wrapper widths on data-story selectors
storybook/baselines/elements-ocelle-{data-table,event-timeline,evidence-chain}--<story>.{light,dark}.png
storybook/test/integration/elements-stories.test.ts
```

**Structure Decision**: the existing workspace layout, with every file where 005's and 013's conventions put it. The
test file names follow 013's on `main` after the recheck (T001).

## Phases (user stories) for `/speckit-tasks`

Each phase is one unit for `/ocelle-run` step 4 and is folded after its approval. Phases 1 to 3 run in this order:

1. **Spike.** Run before the scaffold, recorded in `reviews/phase-<N>/spike.md`. A failing result goes to the operator.
2. **Scaffold.** The phase's modules with `define`, `@tagname`, declared properties and an empty `render()`, plus
   their exports and entries. `scaffold.sh` records it, so the red bodies fail on their assertions.
3. **Red commit** (operator decision I3; `red.sh`). It holds the phase's scenario bodies, its edge-case bodies
   (FR-052), driver tests, node and styles tests, README test statements and the story-test extension. It changes
   test files only. The README mapping rows' statements need R-16's inventory recorded first.
4. **Green.** The phase's source, `base.css` rules, manifest, stories and baselines, README sections and CHANGELOG.

Every phase with stories also does the following:

- **Baselines.** It commits its stories' light and dark baselines, produced by `pnpm run visual:update` in #10's
  pinned container under docker. The command must report `<n> added, 0 changed, 0 removed`. Conflicting PNGs are
  regenerated, never hand-picked. When CI's captures differ from the local ones, CI's are committed
  (`storybook/README.md`).
- **Gates.** It passes `gate:storybook-build`, `gate:visual` and `gate:axe` with no exception entry.
- **Plants.** It runs the plants its diff affects: `pnpm run gate:plants -- --affected <phase base>` (op 016),
  recorded in `reviews/phase-<N>/plants.md`, never a full local `gate:plants` (FR-059, R-15).
- **Index rules.** Its stories follow #10's index rules and contributor note.

0. **Setup (no stories).**
   - **T001, the recheck (R-14).** Compare this plan and the tasks with `main` as merged and write
     `reviews/recheck.md`. The flow stops for the operator on any difference. The recheck covers:
     - 009's module interface and its `.region-track` rule;
     - `--ocelle-tracking-caps`;
     - 013's README conventions and driver;
     - 011's or 012's eyebrow tokens;
     - op 016's `--affected` and its record file;
     - #10's commands and container.
   - The operator's inventory for R-16 (`.sk-data-table`, event history, evidence chain), recorded in R-16.
   - The `itemTexts` driver addition belongs to phase 2's red commit, not here, so it is proven red first.
1. **US1 Data table** (P1, MVP).
   - **Spike.** R-01, R-03, R-05 and R-07:
     - the accessibility tree and axe in and out of the element, fitting and overflowing;
     - the track at `fit-content` at 1280, 600 and 320 px, with and without `wrap="anywhere"`;
     - the swaps of a `tbody` or the whole table, a cell edit and a late web font, each against a fresh load;
     - the caption at 320 px, sticky;
     - the prose override in Chromium;
     - print to PDF.
   - **Red.**
     - US1-1 to US1-16 as shared bodies.
     - US1-7 with a blank caption (SPEC-3-05).
     - US1-10 comparing every property of R-06's list on every target (SPEC-3-01).
     - US1-3 with "011's or 012's eyebrow tokens" (SPEC-3-04).
     - Edge-case bodies: no table, two tables, a nested table not styled, no `thead`, row and corner headers, a
       `colspan` header, pre-upgrade, 640 px.
     - The `@ocelle/styles` browser tests and the prose-override node test.
     - README statements for the data-table section, the conventions amendment (FR-056) and its mapping rows.
     - The story-test extension.
     - The plants of contracts/checks.md for the data table.
   - **Green.** `ocelle-data-table.ts`, the `base.css` blocks, exports and the manifest, the stories with baselines,
     the README (section, conventions, overflow-region users, prose specificity, print, pre-upgrade) and the
     CHANGELOGs.
2. **US2 Event timeline** (P2).
   - **Spike.** R-08, R-09 and R-11: the tree with `role="list"`, the item-text oracle, and the host `aria-label`
     against 009's lane.
   - **Red.**
     - `itemTexts` and its test, in both harnesses.
     - US2-1 to US2-10.
     - Edge-case bodies: an event outside the timeline, an empty timeline (no `<ol>`), `aria-hidden` items, `lang` and
       `dir` on an event, order kept, no live region, 640 px.
     - README statements, mapping rows, the story-test extension and the plants.
   - **Green.** `ocelle-timeline-event.ts` and `ocelle-event-timeline.ts`, exports, the manifest, stories with
     baselines, the README section (with the Host ARIA list update) and the CHANGELOG.
3. **US3 Evidence chain** (P3).
   - **Spike.** R-12: line ends at 1280, 600 and 320 px and after the R-12 changes, two-digit fit for ordinal 20, the
     chip's block size, and `dir="rtl"`.
   - **Red.**
     - US3-1 to US3-10, with US3-6 per SPEC-3-02 (ordinals are positions among visible steps, chip steps counted;
       includes a chip hidden and shown again) and the ordinal-fit body for twenty steps (SPEC-3-03).
     - Edge-case bodies: a step outside the chain, an empty chain, mixed chips, `lang` and `dir`, 640 px.
     - The no-pill node test, README statements, mapping rows, the story-test extension and the plants.
   - **Green.** `ocelle-evidence-step.ts` and `ocelle-evidence-chain.ts`, exports, the manifest, stories with
     baselines, the README section and the CHANGELOG.
4. **Polish.** Documentation only:
   - the final CHANGELOG surface lists;
   - the review check that the mapping rows cover R-16's inventory (SC-001);
   - the quickstart run, recorded in `reviews/phase-4/`, with the three Storybook gates on all the mission's stories
     and 013's baselines unchanged (SC-007).

Phases 2 and 3 do not depend on phase 1 and run in order, so the README, exports and driver change one phase at a
time. Phase 3 reuses phase 2's `itemTexts` and list-name helper.

## Complexity Tracking

No exception to the constitution is planned.
- FR-050 states, as the spec's own rule, that the item elements' standalone behaviour is proven by browser bodies,
  with no story.
- A story the `axe` gate fails is fixed in the story or the element. An exception entry, or any further state without
  a story (for example a host `aria-label` story that axe rejects, R-09), needs a row here and the operator's approval.
- The host rule on `.region-track` (R-03) is a styling override inside the data table's own stylesheet, not a change
  to 009's module. The operator decides it at the plan gate (decision 1).
