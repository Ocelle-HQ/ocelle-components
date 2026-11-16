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
  is named from the host `aria-label`, then `label`, then the caption's text, hidden parts skipped and image `alt`
  read (R-04). One host rule sizes the module's track to `fit-content`, so cells wrap before the table scrolls
  (decision 1 (a), decided at the plan gate; R-03). `:host { min-inline-size: 0 }` lets it shrink as a flex or grid item
  (R-02). No box sets `container-type`, so the element keeps its table's width in a shrink-to-fit host such as a
  dialog (R-02, R-07). The caption is not sticky until 009's module has an option, requested of 009's owner, that
  keeps a pinned start box out of the start fade (R-17; Q-F decided (b)). Until then it scrolls with the table, starts
  at the table's start edge, and is capped by the box's measured width, less the end fade only while it shows, so it
  wraps inside the box at rest. The exact (unrounded) width is read through an empty `block-size: 0` measuring
  element, and the end fade's share is written one animation frame after the fade changes, outside 009's
  `ResizeObserver` delivery, so writing the cap raises no `ResizeObserver` loop, and the caption has no inline size containment, so its longest word widens a
  fitting table instead of making it overflow (R-07).
- **Timeline and chain.** Each renders a shadow `<ol role="list">` with one `<li role="listitem">` per visible item,
  assigned manually (R-08). Each list is named on the `<ol>`, and a blank host `aria-label` counts as absent (R-09).
  The name comes from 009's exported `resolveName`. Markers, connectors and ordinals are `aria-hidden`; markers and
  connectors are real spans drawn with borders, so they are measurable and visible in forced colours (R-08, R-10,
  R-12). Markers are round (`border-radius: 50%`, Q-D decided).
  - **Timeline.** Each event has a time line above its content (Q-C (a)), and a dot marker is centred on the event's
    first line with `1lh`. The time is the event's named `time` slot when that has visible non-blank content, else the
    reflected `time` attribute (Q-E, "Yes: named time slot"); the slotted time is styled through `::slotted()` and the
    item text stays time first. One internal `hasTime(event)` predicate, with `hasSlottedTime(event)`, in a module
    outside the manifest and the exports map, decides the time box and the marker's line, in the event and in the
    timeline (R-10). Each connector is gapped: it runs from its own dot's end
    to the next dot's start and never crosses a dot, with its end taken from the next event's type (R-10).
  - **Chain.** The chain is a wrapping flex row. Connectors sit in each step's trailing padding, and a line end is
    measured from layout, so no connector dangles or crosses lines (R-12). Every step reserves a `size-step` line box,
    so all connectors share the marker's centre line. A chip step is drawn by the container through `::slotted()`:
    `radius-2`, outline only (Q-A (a)), 20.4 px tall.
  - **Before upgrade.** Four (0,0,0) `@ocelle/styles` rules put one visible item per line and hide `aria-hidden="true"`
    items, as the upgraded containers do (R-08).
- **Tokens and contrast.** No new token and no new contrast row. Contrast is checked twice: a node check ties each
  painted colour to a `checked` row of `pairs.json`, and the browser bodies tie each rendered colour to its token
  (R-13).
- **Decided at the plan gate (2026-11-16).** Decision 1 (a), Q-A (a), Q-B (a) and Q-C (a) confirm the plan's
  defaults. Q-E is "Yes: named time slot", a change to FR-023 now in the spec. Q-D was decided at squad round 1, Q-F
  at squad round 2 as (b), through PLAN-FRESH-2-002's option (c). Q-G, whether an empty or hidden slotted time lets
  the `time` attribute apply, was decided (a) after the gate (`reviews/plan/operator-gate.md`, 2026-11-16): the
  attribute applies, as FR-023 and US2-13 read.
- **Decided after the analysis (2026-11-16).** C1 (c): a story for a standalone `ocelle-timeline-event` and one for a
  standalone `ocelle-evidence-step`, and one Principle V exception for the states named by a host `aria-label`
  (Complexity Tracking). I7 (a): the caption cap's `--data-table-box-size` and `--data-table-end-fade` are a
  documented base-style hook between `@ocelle/elements` and `@ocelle/styles` (constitution VII). See § Decisions after
  the analysis.

Implementation waits for 009, 013 and op 016 on `main`. The first task rechecks the plan against `main` as merged
(R-14), including whether 009's pinned-start option (R-17) has landed.

## Technical Context

**Language/Version**: TypeScript 6.0.3 (strict, `erasableSyntaxOnly`); Node 26.13.0 in CI, 22.23.4 in this container.

**Primary Dependencies**: `lit` 3.3.3. No new dependency. Internal: 009's `src/overflow-region.ts` (branch): the
data table uses `OverflowRegion` (R-02), and the timeline and chain import its `resolveName` (R-09). Requested of
009's owner, not built here: a module option that keeps a pinned start box out of the start fade (R-17).

**Storage**: N/A.

**Testing**:
- The two harnesses of 005 and 013: shared scenario bodies run in process (the `elements` project, mutated) and on
  the built browser build on strict-CSP fixture pages (`elements-browser`).
- The harness paths are 013's: `packages/elements/test/in-process.ts`, `test/browser/driver.ts` and
  `test/scenarios/driver.ts`.
- Driver addition, with its own test in both harnesses: `itemTexts` (R-11). Everything else is reused as merged: 013's
  `viewport`, `scrollWidth`, `copy`, `pressTab`, `focused`, `layout` and `text`, and 009's `press`, `focus`,
  `activeElement`, `scrollLeft`, `setScrollLeft`, `frameRecord` and `settle`. T001 records how `main` reconciled the
  two drivers' `computed`, `reducedMotion` and focus readers, and checks.md names the helper each keyboard body uses
  (R-14).
- `@ocelle/styles` tests in the package's own layout: browser bodies in `test/browser/data-table.test.ts` (the
  data-table block and the override) and `test/browser/list-items.test.ts` (block 3's pre-upgrade list rules, phases
  2 and 3; analysis I5); a node test `test/prose-override.test.ts` that the
  override restates every property of every 003 prose rule that can match a table part (R-06); a contrast node test
  `test/data-table-pairs.test.ts` (R-13); and the change to 003's `test/source.test.ts` that each phase's red commit
  makes for the rules its green adds (R-06).
- `packages/elements/test/node/records-pairs.test.ts`, the contrast node check for the five templates (R-13).
- The story test in `storybook-integration`, extended per phase with 320 px reflow per container story.
- #10's gates on the stories: `storybook-build`, `visual` (light and dark baselines from the pinned container) and
  `axe`.
- Gate plant runs through op 016's `--affected` selection (R-15). Element plants (CSS-only behaviour) run after each
  phase's green and are recorded in `reviews/phase-<N>/element-plants.md` (contracts/checks.md § Element plants).
- Details: [contracts/checks.md](contracts/checks.md).

**Target Platform**: evergreen Chromium, measured. WebKit 16.4+ is unmeasured (the README's Engines note). No new
engine-floor feature: manual slot assignment (013) and the module's features (009) are already listed.

**Project Type**: library (web components) in a pnpm workspace.

**Performance Goals**: none specific.
- Each class adopts one shared stylesheet. The data table also gets the module's one per-instance sheet (009) and its
  own per-instance sheet, which holds the measured caption width (R-07).
- Per container: one `MutationObserver` (the timeline's on its events' subtrees too, for the slotted time). Per
  event: one `MutationObserver` on its own subtree, for the slotted time (R-10). The chain also has one `ResizeObserver`, on its list and its items. The data
  table has one `ResizeObserver` of its own, on its `block-size: 0` measuring element (not on `.region-box`), for
  the caption's cap, and at most one pending animation frame request per instance, for the end fade's share of the
  cap (R-07).

**Constraints**: strict CSP with no exception; token-only styles with no new `style-lint` allowance (every value is a
token, a keyword, a system colour in forced colours, `0`, a `%` (which `token-only.ts` allows: the table's
`inline-size: 100%` and the markers' `border-radius: 50%`), `1lh`, or `calc()` over tokens); no `sk-` names; no
monospace; no I/O; one heavy job at a time in this container.

**Scale/Scope**: 5 elements, 0 tokens, 0 contrast rows, 3 `@ocelle/styles` blocks (the data-table rules, their prose
override, and the four pre-upgrade list-item rules), 1 base-style hook (two custom properties, I7 (a)), 1 driver
addition, 35 stories (12 in phase 1, 11 in phase 2, 12 in phase 3, each with two baselines: 70 PNGs).

## Constitution Check

*Gate: passes before Phase 0 and again after Phase 1 design (rechecked after squad rounds 1 and 2, and after the plan
gate's answers of 2026-11-16: decision 1, Q-A, Q-B and Q-C (a), Q-E a named `time` slot; Q-D and Q-F decided at squad
rounds 1 and 2; Q-G decided (a)), and after the analysis decisions of 2026-11-16 (C1 (c), I7 (a)). One Principle V
exception is recorded, chosen by the operator as C1 (c) (Complexity Tracking).*

| Principle | How this plan meets it |
|---|---|
| I. Names, no I/O, small interface, manifest | **Tags**: `ocelle-data-table`, `ocelle-event-timeline`, `ocelle-timeline-event`, `ocelle-evidence-chain`, `ocelle-evidence-step`. **Events**: none. **I/O**: none. **Properties**: `label`, `wrap` (data table); `label` (timeline, chain); `time`, `wrap` (event); `variant`, `wrap` (step). Every property is `\| undefined` with `@default undefined`; `wrap`, `variant` and `time` reflect, because the styles or the container's observer read them (`time`: PLAN-CORRECTNESS-1-003). **Parts**: `list` on the two containers; `time` and `content` on the event; `content` on the step. **CSS hooks**: one base-style hook between the packages, `--data-table-box-size` and `--data-table-end-fade`, written by the data table and read by `@ocelle/styles`' caption cap (analysis I7 (a); row VII); no element declares a CSS custom property in the manifest. **Slots**: the default slot of each element, and the event's named `time` slot (Q-E), which the manifest declares. The manifest declares everything, with every list stated ([contracts/](contracts/)). No element module exports a function: the internal `hasTime` and `hasSlottedTime` live in `src/timeline-time.ts`, outside the manifest glob and the exports map, and a manifest test statement pins that (R-10). The caption's measured width and the end fade's depth are custom properties with no `--ocelle-` prefix (the prefix is the tokens'), documented as the base-style hook above, not manifest members: the element writes them and its styles never read them (R-07). |
| II. Tokens only, brand rules | **Tokens**: every value is a token (R-06, R-10, R-12); no new token (R-13). **No monospace**: cells, times, ordinals and chips use `font-sans` with `figures`. **`color-rule`**: only on decorative lines (the row and header rules, the connectors; FR-013). **Radius**: `radius-2` on the chip (the one radius, never `radius-pill`). The dot and the step marker are round, `border-radius: 50%` with no token: a mark shape, not a corner radius, so the one-radius rule is not engaged and no radius token is added (FR-031, FR-040; Q-D, operator decision (a) on PLAN-CORRECTNESS-1-004). **Ochre**: none. |
| III. Accessible by construction | **ID references**: none across a root. The table's references stay in the consumer's tree (R-01), and the region is named by copied text (R-04). **Roles**: the table's own roles; a `group` on the region while it overflows (009); `list` and `listitem` on the shadow lists, explicit for WebKit (R-08). **Hidden**: markers, connectors and ordinals are `aria-hidden`; item text is asserted by `itemTexts` (R-11). **Keyboard**: the overflowing region is the only added tab stop, with arrows, clearance and handover from the module; slotted links keep theirs. **Contrast**: text and structural marks use ink tokens with text declarations on the nine main grounds (a slotted time takes the attribute time's `ink-muted` through `::slotted()`); decorative lines are exempt (FR-013), checked by a node check against `pairs.json` and by rendered-colour bodies (R-13). **Forced colours**: every mark is a border drawn in `CanvasText`; the chip's box rule sits outside the variant block (R-10, R-12). **Reflow**: 320 px tests per container, the data table as a flex and a grid item, and in three shrink-to-fit hosts (a dialog, an inline-block, a start-aligned column flex), where it is never 0 px wide (R-02); the caption wraps inside the box's unmasked width at rest (R-07). **Naming**: a blank host `aria-label` counts as absent on the lists, through 009's `resolveName` (R-09); the region's caption name skips hidden parts and reads image `alt` (R-04). **axe**: #10's `axe` gate on every story, with no exception entry planned. |
| IV. Strict CSP, offline | Adopted stylesheets and `base.css` only. No `style` attribute; the module's mask figures use its per-instance sheet (009), and the data table's measured caption width uses its own (R-07). Fixture pages assert zero violations. |
| V. Storybook, behaviour tests | A story per variant and state, light and dark ([contracts/checks.md](contracts/checks.md) § Stories). The item elements' states are stories in their container's file, the standalone event and the standalone step included (analysis C1 (c)). Every spec'd state has a story, the hidden item, the unnamed overflowing table, the table-less data table and the empty containers included (PLAN-CORRECTNESS-1-007, operator decision (a)), except the states named by a host `aria-label` (the data table's region, the timeline, the chain): one exception row in Complexity Tracking, chosen by the operator (C1 (c)), proven by browser bodies, with a sunset each phase's spike checks. |
| VI. Consumer-driven, own code | Needs: kitty-mission-ui's `.sk-data-table` family and the Desktop V2 primitives (#470, #517, #533). The issues are unread, so their points were the plan gate's questions Q-A to Q-C and Q-E (spec SPEC-1-06 (b)), which the operator answered on 2026-11-16 (Q-E's answer, the `time` slot, is in FR-023). The inventory is an operator input before each red commit (R-16). Nothing is copied, and the README mapping names roles only. |
| VII. Semver | **MINOR**: five elements, five entry points, three `base.css` blocks and one base-style hook (`--data-table-box-size`, `--data-table-end-fade`, analysis I7 (a)), which couples the two separately versioned packages and so is surface: both CHANGELOGs and both READMEs name it, and a rename or removal is MAJOR from 1.0.0. CHANGELOG entries go in `@ocelle/elements` and `@ocelle/styles`. `@ocelle/tokens` is unchanged. |
| VIII. Test-first, non-vacuous | A scaffold comes before each red commit. The red commit holds the phase's scenario bodies, the driver test, the node and styles tests and the story-test extension (operator decision I3), and `red.sh` keeps one red record per phase. The red log is read per body: every scenario body fails on an assertion, never on an import or setup error, and each body the platform alone could pass carries a paired assertion only the element gives (contracts/checks.md). Each phase's red commit changes one existing test, 003's `source.test.ts`, for the `base.css` rules that phase's green adds (phase 1 blocks 1 and 2, phase 2 the timeline's two pre-upgrade rules, phase 3 the chain's two), and its message says so (R-06). Item-text bodies also assert a non-empty text (FR-016). Each CSS-only behaviour has a named element plant or a stated reason, because Stryker does not mutate `css` templates or `base.css`; element plants mutate green source, so they run after green, are never committed, and are recorded in `reviews/phase-<N>/element-plants.md` (contracts/checks.md § Element plants). Spikes run before the scaffolds of phases 1 to 3, and a failing spike result goes to the operator. |
| Licence, supply chain | No new dependency or asset. |
| Workflow gates | No gate changes. The gates run unchanged; the gate plants run by op 016's selection locally and in full in CI (R-15). |

## Decisions at the plan gate

Answered by the operator on 2026-11-16 (`reviews/plan/operator-gate.md`); the changes are listed in
`reviews/plan/gate-answers.md`.

1. **The track's inline size (R-03). Decided: (a).** `:host .region-track { inline-size: fit-content }` in the data
   table's own styles. It overrides one property of 009's module stylesheet, so cells wrap before the table scrolls.
   (b), a sizing option in 009's module, and (c), max-content with a changed US1-9, are not taken.
2. **Q-A, the chip step's look** (#517). **Decided: (a)**, an outline with no fill.
3. **Q-B, the column headers' weight and colour** (#533). **Decided: (a)**, medium weight in `ink-muted`.
4. **Q-C, the event's time position** (#470). **Decided: (a)**, the time on its own line above the content, with the
   marker on that line.
5. **Q-D, the markers' shape.** Decided at squad round 1: `border-radius: 50%` for both markers, no token (R-10,
   R-12).
6. **Q-E, marked-up times** (#470). **Decided: "Yes: named time slot".** `ocelle-timeline-event` gets a named `time`
   slot that takes precedence over the `time` attribute, styled through `::slotted()`, the item text still time
   first. FR-023 is changed in the spec, with US2-11 to US2-14; the contracts, data model, research R-08 and R-10
   (the shared `hasTime(event)` and the connector's `next-has-time`), checks, stories and phase 2 follow.
   - **Q-G, an empty or hidden slotted time beside a `time` attribute. Decided: (a)** (`reviews/plan/operator-gate.md`,
     2026-11-16). The attribute applies when the slot has no visible non-blank content (FR-023, US2-13). The
     alternative, that any `slot="time"` child silences the attribute, is not taken.
7. **Q-F, the caption until 009's option exists (R-17).** Decided at squad round 2 as (b) (PLAN-FRESH-2-002,
   operator decision (c), 2026-11-16). The caption is not sticky until 009's option lands: it scrolls with the table,
   with no inset, and is capped by the box's measured width (R-07). It becomes sticky at inset 0 once the option is on
   `main`, a later MINOR. Round 1's default (a), a fade-depth inset, is withdrawn: that inset applied at rest too.
8. **Dependencies.** Implementation waits for 009, 013 and op 016 on `main`. T001 rechecks the plan and tasks
   against `main` as merged and stops for the operator on any difference (R-14). One request goes to 009's owner
   through the operator: a module option that keeps a pinned start box (the caption, sticky once it lands) out of the
   start fade's mask (R-17, PLAN-A11Y-SECURITY-1-002 operator decision (c)). This mission does not change 009's module.
9. **The inventory (R-16).** The operator supplies kitty-mission-ui's variant inventory before each phase's red
   commit, as in 013. A gap goes to the operator.

## Decisions after the analysis

Answered by the operator on 2026-11-16 (`reviews/analysis/operator-decisions.md`); the changes are listed in
`reviews/analysis/fixes.md`.

1. **C1, states without a story. Decided: (c).** A story for a standalone `ocelle-timeline-event` in the timeline's
   file and one for a standalone `ocelle-evidence-step` in the chain's (stories 35, baselines 70). One Principle V
   exception row (Complexity Tracking) covers only the states named by a host `aria-label`: the data table's region,
   the timeline and the chain (R-09's axe risk), proven by browser bodies.
2. **I7, the caption cap's custom properties across packages. Decided: (a).** `--data-table-box-size` and
   `--data-table-end-fade` are a documented base-style hook between `@ocelle/elements` (the writer) and
   `@ocelle/styles` (the reader): public surface under constitution VII, named in both CHANGELOGs and READMEs, with a
   README test statement in each package (T011, T013).

## Project Structure

### Documentation (this feature)

```text
specs/019-data-records/
├── plan.md              # this file
├── research.md          # R-01 to R-17, the plan gate's questions Q-A to Q-G, decision 1
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
├── reviews/              # spec checks, plan squad, phases (spike, element-plants, plants), recheck.md
└── tasks.md              # /speckit-tasks
```

### Source Code (repository root)

```text
packages/elements/
├── src/
│   ├── ocelle-data-table.ts       # new (uses overflow-region.ts)
│   ├── ocelle-event-timeline.ts   # new (imports ocelle-timeline-event.ts and timeline-time.ts; resolveName from overflow-region.ts)
│   ├── ocelle-timeline-event.ts   # new (imports timeline-time.ts; exports only its class)
│   ├── timeline-time.ts           # new, internal: hasTime(event) and hasSlottedTime(event), outside the manifest glob and the exports map (R-10)
│   ├── ocelle-evidence-chain.ts   # new (imports ocelle-evidence-step.ts; resolveName from overflow-region.ts)
│   ├── ocelle-evidence-step.ts    # new
│   ├── index.ts, browser.ts       # re-export / define the five
├── test/
│   ├── scenarios/{data-table,event-timeline,evidence-chain}.ts
│   ├── scenarios/driver.ts, in-process.ts, browser/driver.ts   # + itemTexts
│   ├── {data-table,event-timeline,evidence-chain}.test.ts      # in process (mutated); the chain's no-loop test
│   ├── browser/{data-table,event-timeline,evidence-chain}.test.ts
│   ├── define.test.ts                                          # the define-twice fixture gains the five
│   ├── entry-*.test.ts                                         # the five entry points
│   ├── node/readme.test.ts, node/manifest.test.ts, node/chain-no-pill.test.ts
│   ├── node/records-pairs.test.ts, node/records-pairs-check.ts # contrast source check (R-13)
│   └── build/build.test.ts                                     # container import rule for the two containers
├── custom-elements.json           # regenerated
├── package.json                   # exports
├── README.md, CHANGELOG.md
packages/styles/
├── src/base.css                   # the data-table block, the prose override, the pre-upgrade list rules
├── test/browser/data-table.test.ts, test/browser/list-items.test.ts, test/prose-override.test.ts, test/data-table-pairs.test.ts
├── test/source.test.ts (changed: the new rules after the wrap rule, R-06), test/readme.test.ts
├── README.md, CHANGELOG.md
storybook/stories/{data-table,event-timeline,evidence-chain}.stories.ts
storybook/.storybook/stories-layout.css                        # wrapper widths on data-story selectors
storybook/baselines/elements-ocelle-{data-table,event-timeline,evidence-chain}--<story>.{light,dark}.png
storybook/test/integration/elements-stories.test.ts
```

**Structure Decision**: the existing workspace layout, with every file where 005's and 013's conventions put it, and
each package's own test layout (`packages/styles/test` has `browser/` and top-level tests, no `node/`). The test file
names follow 013's on `main` after the recheck (T001).

## Phases (user stories) for `/speckit-tasks`

Each phase is one unit for `/ocelle-run` step 4 and is folded after its approval. Phases 1 to 3 run in this order:

1. **Spike.** Run before the scaffold, recorded in `reviews/phase-<N>/spike.md`. A failing result goes to the operator.
2. **Scaffold.** The phase's modules with `define`, `@tagname`, declared properties and an empty `render()`, plus
   their exports and entries. `scaffold.sh` records it, so the red bodies fail on their assertions.
3. **Red commit** (operator decision I3; `red.sh`). It holds the phase's scenario bodies, its edge-case bodies
   (FR-052), driver tests, node and styles tests, README test statements and the story-test extension. It changes
   test files only, and holds no plant (a plant mutates green source). The README mapping rows' statements need
   R-16's inventory recorded first. The red log is read per body: each scenario body fails on an assertion, not on an
   import or setup error, and the review checks contracts/checks.md § Bodies that the platform alone could pass against
   that log.
4. **Green.** The phase's source, `base.css` rules, manifest, stories and baselines, README sections and CHANGELOG.

Every phase with stories also does the following:

- **Baselines.** It commits its stories' light and dark baselines, produced by `pnpm run visual:update` in #10's
  pinned container under docker. The command must report `<n> added, 0 changed, 0 removed`. Conflicting PNGs are
  regenerated, never hand-picked. When CI's captures differ from the local ones, CI's are committed
  (`storybook/README.md`).
- **Gates.** It passes `gate:storybook-build`, `gate:visual` and `gate:axe` with no exception entry.
- **Gate plants.** It runs the gate plants its diff affects: `pnpm run gate:plants -- --affected <phase base>` (op
  016), recorded in `reviews/phase-<N>/plants.md` in op 016's form, never a full local `gate:plants` (FR-059, R-15).
- **Element plants.** After green, each element plant of contracts/checks.md for the phase is applied to the green
  source or `base.css`, its guard bodies run in process, and the source is restored; nothing is committed. The results
  go in `reviews/phase-<N>/element-plants.md`. A plant that does not make its guard fail stops the phase for the
  operator.
- **Index rules.** Its stories follow #10's index rules and contributor note.

0. **Setup (no stories).**
   - **T001, the recheck (R-14).** Compare this plan and the tasks with `main` as merged and write
     `reviews/recheck.md`. The flow stops for the operator on any difference. The recheck covers:
     - 009's module interface, `resolveName`, its `.region-track` rule and its fade mask rules;
     - whether 009's module has the pinned-start option requested in R-17 (if so, the caption is sticky through it at
       inset 0; if not, it is not sticky, Q-F (b));
     - `--ocelle-tracking-caps`, `--ocelle-measure-container` and `--ocelle-scroller-fade-size`;
     - 013's README conventions;
     - both drivers as merged: 009's additions, and how `computed`, `reducedMotion` and the focus readers were
       reconciled with 013's (R-14);
     - 011's or 012's eyebrow tokens;
     - op 016's `--affected` and its record file;
     - #10's commands and container.
   - The operator's inventory for R-16 is not a phase 0 item: it is one step per phase, before that phase's red
     commit (decision 9; tasks T005, T028, T054).
   - The `itemTexts` driver addition belongs to phase 2's red commit, not here, so it is proven red first.
1. **US1 Data table** (P1, MVP).
   - **Spike.** R-01, R-03, R-05 and R-07:
     - the accessibility tree and axe in and out of the element, fitting and overflowing;
     - the track at `fit-content` at 1280, 600 and 320 px, with and without `wrap="anywhere"`;
     - the swaps of a `tbody` or the whole table, a cell edit and a late web font, each against a fresh load;
     - the caption at 320 px, not sticky and capped by the measured box width, and the measured property reaching the
       slotted caption through the flat tree (R-07);
     - the element in a `<dialog>`, an inline-block and a start-aligned column flex: never 0 px wide, one observer
       callback, a stable width (the cap equals the table's width, so no shrink step) and no `ResizeObserver` loop
       error; and no loop error in a block host on first load with a caption that rewraps between the fallback and the
       measured cap, in the narrow-column resize, when a `hidden` host is shown, or when a cell edit takes a
       block-host table from fitting to overflowing and back with a caption that rewraps across the end fade's depth
       (one end fade write per change); the one-long-word inline-block with a caption text (or test-only
       `letter-spacing`) whose box width has a fractional part between 0.1 and 0.4 px, written unrounded (R-02,
       R-07);
     - the prose override in Chromium;
     - print to PDF;
     - axe on an overflowing element named by a non-blank host `aria-label` (the exception row's sunset check);
     - any change of R-05 the module does not observe (FR-014), named in R-05 and sent to the operator.
   - **Red.**
     - US1-1 to US1-16 as shared bodies.
     - US1-7 with a blank caption (SPEC-3-05).
     - FR-010's host `aria-label` (non-blank decides, blank counts as absent), the state the exception row covers.
     - US1-11's forced colours with the header rule as well as the row rules (analysis G2).
     - US1-10 comparing every property of R-06's list on every target (SPEC-3-01).
     - US1-3 with "011's or 012's eyebrow tokens" (SPEC-3-04).
     - US1-16 twice: the caption's text node edited (`characterData`) and the caption replaced (`childList`).
     - The caption-text bodies of R-04: a `hidden` span, an `aria-hidden="true"` span, an `<img alt>`.
     - Edge-case bodies: no table, two tables, a nested table not styled, no `thead`, a `<thead>` with an empty
       `<tbody>` (rendered unchanged, no added text), two `<tbody>` groups and a `<tfoot>` (the row rule between every
       pair of consecutive rows, none below the last, R-06), row and corner headers, a `colspan` header, a hidden host
       (`hidden`, and `aria-hidden="true"`; analysis G3), pre-upgrade, 640 px.
     - The caption bodies of R-07: at 320 px at rest (inside the unmasked extent, start equal to the table's), scrolled
       to the middle and the end (start still equal to the table's), a fitting table (no `data-fade`, a long caption
       wrapping at the table's width), a narrow column resized from 400 to 600 px whose table overflows and whose
       caption is longer than the box at both widths (`data-fade="end"` asserted at rest before the line boxes), and
       the end-fade body (a 400 px block-host table that fits, a cell edit making it overflow and the edit undone:
       `data-fade="end"` at rest and a two-line caption inside the unmasked extent, then no `data-fade` and one line),
       and the no-`ResizeObserver`-loop check around a block host on first load with a caption that rewraps between
       the fallback and the measured cap, the narrow-column resize, a `hidden` host shown, both edits of the end-fade
       body, and the shrink-to-fit bodies (the one-long-word body with its rounding-down precondition asserted first).
     - The element as a default flex item and as a `1fr` grid item at 320 px (R-02).
     - The shrink-to-fit bodies of R-02: in an open `<dialog>`, an inline-block and a start-aligned column flex, the
       host as wide as the table plus the ring room on both sides (never 0 px), the caption not narrower than its
       longest word, a long caption wrapping at a narrow table's width, and a two-column narrow table in an
       inline-block whose caption's words are wider than the grid: the table widens to the longest word and the
       region does not overflow (no tab stop, no `data-fade`).
     - The five elements in 013's define-twice fixture (two copies of the package: the first definition wins); the
       data table's entry goes in here, and phases 2 and 3 add theirs to the same body.
     - The change to 003's `packages/styles/test/source.test.ts` (R-06): blocks 1 and 2 after the wrap rule, the
       last-rule assertion "the wrap rule, block 1, block 2"; named with its reason in the commit message.
     - The `@ocelle/styles` browser tests, the prose-override node test and the data-table contrast node test.
     - The data table's part of `test/node/records-pairs.test.ts` (R-13).
     - README statements for the data-table section, the conventions amendment (FR-056), its mapping rows, the Host
       ARIA list (the data table added beside 009's elements, with the module's blank-counts-as-absent rule), the
       Sizing line (a wrapper that is the flex or grid item needs `min-inline-size: 0`; in a shrink-to-fit host the
       data table takes its table's width and overflows only when its own inline size is bounded), the caption rules
       (the `hidden` attribute, not CSS, hides part of a caption from the name; the caption scrolls with the table
       until 009's option lands; its longest word widens the table, and in a bounded host a caption word wider than
       the box overflows it and the region scrolls), and the base-style hook in both packages' README tests (analysis
       I7 (a)).
     - The story-test extension.
   - **Green.** `ocelle-data-table.ts`, the `base.css` blocks, exports and the manifest, the stories with baselines,
     the README (section, conventions, overflow-region users, Host ARIA list, sizing, prose specificity, the
     `<tfoot>` order, print, pre-upgrade, the base-style hook) and the CHANGELOGs, which name the hook as surface. Then the data table's element plants.
2. **US2 Event timeline** (P2).
   - **Spike.** R-08, R-09, R-10 and R-11: the tree with `role="list"`, the item-text oracle, the empty connector and
     marker spans, the host `aria-label` against 009's lane (axe's verdict is the exception row's sunset check), and
     the `time` slot (a slotted `<time>` after the content
     read first, an unrendered slot leaving an empty or hidden slotted node out of the tree and layout, and
     `::slotted(*)` setting the type over a `<b>`'s UA bold).
   - **Red.**
     - `itemTexts` and its test, in both harnesses.
     - US2-1 to US2-14, with US2-8's forced-colours and rendered-contrast halves (R-10, R-13).
     - The `time` bodies of R-10: set, changed and cleared by property after mount, `time=""` and `time=" "`.
     - The `time` slot bodies of R-10 (Q-E): US2-11 to US2-14 (a slotted `<time datetime>` after the content shown
       above it and read first, with the attribute time's type, a `<b slot="time">` included; the attribute ignored
       while the slot has content and shown again when the slotted node is removed; an empty, white-space-only,
       `hidden` and `aria-hidden="true"` slotted time, with and without a `time` attribute; filled, emptied, hidden and
       shown after mount; a child's `slot` attribute set to `time` and removed, analysis G1), with the paired
       assertions of checks.md § Bodies.
     - The connector geometry bodies of R-10: three timed events and a mixed timeline (timed, untimed, timed by its
       slot, untimed with an empty slotted time), with each connector clear of both dots and both gaps `space-1`
       within 0.5 px, and `elementFromPoint` inside each dot returning the marker.
     - The manifest test statements that the `ocelle-timeline-event` module declares only its class, and that the
       event declares the default slot and the `time` slot (R-10).
     - Edge-case bodies: an event outside the timeline (with an attribute time and with a slotted time), an empty
       timeline (no `<ol>`), `aria-hidden` items, `lang` and `dir` on an event and on a slotted time, two slotted time
       nodes of which one is `aria-hidden="true"`, two visible slotted time nodes of which one is blank (analysis A1),
       order kept, no live region, landmark or heading (FR-026), a hidden timeline and a hidden standalone event
       (analysis G3), pre-upgrade (the `base.css` list-item
       rules: a `hidden` and an `aria-hidden="true"` event not shown; a slotted time's text shown before the
       content's), 640 px.
     - The change to 003's `packages/styles/test/source.test.ts` (R-06): the timeline's two pre-upgrade rules after
       block 2, the last-rule assertion "the wrap rule, block 1, block 2, the timeline's rules"; named with its reason
       in the commit message.
     - The timeline's entries in the define-twice body and in `test/node/records-pairs.test.ts`.
     - README statements (the section, the Host ARIA list, the overflow-region users of `resolveName`, "Before
       upgrade" with the slotted time shown inline, and the `time` slot of Q-E: it takes precedence over the
       attribute, carries `datetime`, `title`, `lang`, `dir` or an htmx target, which the attribute cannot, one time
       element per event, and a consumer rule on the slotted node beating the `::slotted()` type), mapping rows and
       the story-test extension.
   - **Green.** `timeline-time.ts` (`hasTime(event)`, `hasSlottedTime(event)`), `ocelle-timeline-event.ts` (the `time`
     slot, its `::slotted()` rules and its own observer) and `ocelle-event-timeline.ts` (its observer on the events'
     subtrees), the two pre-upgrade rules in `base.css`, exports, the manifest (the `time` slot included), the 11
     stories with baselines (the standalone event among them), the README section (with the Host ARIA list update and the `time` slot) and the
     CHANGELOGs (the `time` slot named as surface). Then the timeline's element plants, the slot plants of checks.md
     among them.
3. **US3 Evidence chain** (P3).
   - **Spike.** R-12: line ends at 1280, 600 and 320 px and after the R-12 changes, two-digit fit for ordinal 20, the
     chip's block size, the shared centre line with chips, `dir="rtl"`, and axe on a chain named by a host
     `aria-label` (the exception row's sunset check).
   - **Red.**
     - US3-1 to US3-10, with US3-6 per SPEC-3-02 (ordinals are positions among visible steps, chip steps counted;
       includes a chip hidden and shown again), the ordinal-fit body for twenty steps (SPEC-3-03), and US3-8's
       forced-colours and rendered-contrast halves (R-12, R-13).
     - The mixed-chips geometry body (each connector's centre on the row's marker centre within 0.5 px, R-12).
     - The in-process no-`ResizeObserver`-loop test with its synthetic self-check (R-12).
     - Edge-case bodies: a step outside the chain, an empty chain, mixed chips, a link in a step (FR-011), `lang` and
       `dir`, no live region, landmark or heading (FR-026), a hidden chain and a hidden standalone step (analysis G3),
       pre-upgrade (a `hidden` and an `aria-hidden="true"` step not shown), 640 px.
     - The change to 003's `packages/styles/test/source.test.ts` (R-06): the chain's two pre-upgrade rules after the
       timeline's, the final last-rule assertion "the wrap rule, block 1, block 2, block 3 (the timeline's rules, the
       chain's rules)"; named with its reason in the commit message.
     - The chain's entries in the define-twice body and in `test/node/records-pairs.test.ts`.
     - The no-pill node test, README statements ("Before upgrade" among them), mapping rows and the story-test
       extension.
   - **Green.** `ocelle-evidence-step.ts` and `ocelle-evidence-chain.ts`, the two pre-upgrade rules in `base.css`,
     exports, the manifest, the 12 stories with baselines (the standalone step among them), the README section and the CHANGELOGs. Then the chain's element
     plants, the no-pill plant among them.
4. **Polish.** Documentation only:
   - the final CHANGELOG surface lists;
   - the review check that the mapping rows cover R-16's inventory (SC-001);
   - the quickstart run, recorded in `reviews/phase-4/`, with the three Storybook gates on all the mission's stories
     and 013's baselines unchanged (SC-007), its plants and mutation steps on the mission's base (phase 1's base),
     since phase 4 changes no source.

Phases 2 and 3 do not depend on phase 1 and run in order, so the README, exports and driver change one phase at a
time. Phase 3 reuses phase 2's `itemTexts`; both containers import 009's `resolveName` (R-09).

## Complexity Tracking

| Exception | Principle | Scope | Rationale | Sunset | Approval |
|---|---|---|---|---|---|
| The states named by a host `aria-label` have no story | V (a story per variant and per state) | `ocelle-data-table`'s region, `ocelle-event-timeline` and `ocelle-evidence-chain`, each with a host `aria-label`, blank or not (FR-010, FR-022, FR-032; US2-10, US3-10). Each is proven instead by shared browser bodies in both harnesses: T006's FR-010 host `aria-label` body, T030's US2-10 and T055's US3-10. No other state of the five elements is excepted (the standalone event and step have stories, analysis C1 (c)), and no `storybook/a11y-exceptions.json` entry is added. | Each of these hosts keeps the consumer's `aria-label` on a generic host node while the name sits on a shadow node (the region's box or the `<ol>`), so axe may report `aria-prohibited-attr` (serious) on the host, which a story would turn into a failing `axe` gate or an exception entry (R-09). The naming itself is asserted on the Chromium AX tree in both harnesses, so the behaviour has evidence without a story. | Per element: the pinned axe-core reports no serious or critical finding on that element named by a host `aria-label`. Each phase's spike measures it (T003, T026, T052) and the check is repeated on every axe-core upgrade. A clean result is a stop-and-ask point: the operator decides whether that phase adds the state's story and its two baselines (and the row's scope shrinks) or the row stays. | Operator, 2026-11-16, analysis decision C1 (c) (`reviews/analysis/operator-decisions.md`). |

- A story the `axe` gate fails is fixed in the story or the element. An exception entry, or any further state without
  a story, needs a row here and the operator's approval.
- The host rule on `.region-track` (R-03) is a styling override inside the data table's own stylesheet, and the
  measured caption width (R-07) is written by the data table's own observer into its own per-instance sheet. Neither
  changes 009's module. The operator chose the first at the plan gate (decision 1 (a), 2026-11-16).
- The markers' `border-radius: 50%` is recorded under constitution II as a mark shape, not a corner radius (Q-D,
  operator decision (a) on PLAN-CORRECTNESS-1-004); it is not an exception and adds no token.
- Every other spec'd state has a story (contracts/checks.md § Stories), so FR-050 records no further state without
  one.
- The base-style hook `--data-table-box-size` / `--data-table-end-fade` (analysis I7 (a)) is surface under
  constitution VII, not an exception: it is documented in both packages' READMEs and CHANGELOGs.
