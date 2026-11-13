# Implementation Plan: Data Display, First Slice (Facts, Empty State, Progress)

**Branch**: `013-data-display` (work on `claude/013-data-display`) | **Date**: 2026-11-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/013-data-display/spec.md` (approved at the spec gate after check 2,
2026-11-13), amended by the operator's fork decisions of squad round 1 (2026-11-13, `reviews/plan/round-1/refute.md`).

## Summary

This mission adds four elements to `@ocelle/elements`, under 005's element conventions: `ocelle-facts` with its pair
child `ocelle-fact`, `ocelle-empty-state` and `ocelle-progress`. They replace kitty-mission-ui's three largest class
families: 183 uses of `.sk-facts`, `.sk-empty-state` and `.sk-progress`.

Measurements in this container ([spike/RESULTS.md](spike/RESULTS.md)) and squad round 1 drove these designs:

- **Facts semantics.** `ocelle-facts` renders the description list itself and places each `ocelle-fact` into its
  `<dd>` by manual slot assignment. This is the only structure that gives one clean Chromium description list and
  passes axe's `definition-list` and `dlitem` rules (R-01). So FR-004 can stand as written; see the decision at the
  plan gate. A hidden fact is no pair, and a fact's `lang` and `dir` reach its label.
- **Facts stacking.** The sheet stacks when the inline space available to it is below a token-sized threshold, through
  a `ResizeObserver`, with no `container-type` (a size container collapses to 0 px in dialogs and flex items). The
  measure does not depend on the sheet's own state, so the layout does not depend on history; phase 1's spike picks
  the mechanism (R-02).
- **Facts density.** `density="compact"` tightens the gaps; inside 003's compact region the values take the region's
  14 px / 1.5 scale (#531), through two hooks `@ocelle/styles` sets (R-03).
- **Progress naming.** `ocelle-progress` is the progressbar itself through `ElementInternals`. This is one node, and a
  host `aria-label` still names it (R-05). Its fill always carries an `accent-strong` edge, at 4.1:1 or more against
  the track and every ground, and its track boundary uses `accent-strong` on inset, accent-low, hover and state grounds
  with `ground="tinted"` (R-06).
- **Progress motion.** The indeterminate sweep is `calc(var(--ocelle-motion-base) * 7)` three times (4.2 s), then the
  mark rests as a still mid-track mark (WCAG 2.2.2); under reduced motion the still mark shows at once (R-06).

No token is added and `@ocelle/tokens` does not change: every contrast pair is an existing row (R-06, R-07).
`@ocelle/styles` gains two rules (R-07). The `style-lint` gate gains one recorded allowance (R-10). Nothing depends on
#15. Baselines and axe follow #10's design and are rechecked when #10 lands (R-08).

## Technical Context

**Language/Version**: TypeScript 6.0.3 (strict, `erasableSyntaxOnly`). Node 26.13.0 in CI, 22.23.4 in this
container.

**Primary Dependencies**: `lit` 3.3.3 (pinned by 005). No new dependency. Already pinned: Vite 8.3.5, Vitest 5.0.5
with `@vitest/browser-playwright`, Playwright 1.64.1, Stryker 10.1.1, Stylelint 17.16.0 with `postcss-lit`,
`@custom-elements-manifest/analyzer` 0.11.0, Storybook 10.6.5.

**Storage**: N/A.

**Testing**:
- 005's two harnesses: shared scenario bodies run in process (the `elements` project, mutated) and on the built
  browser build on strict-CSP fixture pages (`elements-browser`).
- Driver additions in both harnesses, each with its own test: viewport, scroll width, layout settle, copy, move, Tab
  and focus, reduced motion (`page.emulateMedia({ reducedMotion })`), running animations, and AX value properties.
- The story test in `storybook-integration`, with three story-level checks (320 px reflow, reduced motion, progress
  names).
- `@ocelle/styles` browser tests for its two new rules; `token-only` unit tests and plants for the allowance.
- A pairing test of the progress stylesheet against the existing contrast rows.
- Details: [contracts/checks.md](contracts/checks.md).

**Target Platform**: evergreen Chromium, measured. WebKit 16.4+ is unmeasured, as the README states. The engine floor
is unchanged (R-08).

**Project Type**: library (web components) in a pnpm workspace.

**Performance Goals**: none specific. Each element class adopts one shared stylesheet. Facts uses one
`ResizeObserver` and one `MutationObserver` per sheet.

**Constraints**:
- strict CSP with no exception (the fill's width is a CSSOM write, R-06);
- token-only styles, with the one allowance of R-10;
- no `sk-` names and no monospace;
- no I/O;
- one heavy job at a time in this container.

**Scale/Scope**: 4 elements, 0 tokens, 0 contrast rows, 2 `@ocelle/styles` rules, 1 `token-only` allowance (4
forms), 9 driver additions (1 of them the browser command `emulateReducedMotion`), about 25 stories.

## Constitution Check

*Gate: passes before Phase 0. Re-checked after Phase 1 design and after squad round 1's fixes: passes, with the one
inherited exception in Complexity Tracking.*

| Principle | How this plan meets it |
|---|---|
| I. Names, no I/O, small interface, manifest | **Tags**: `ocelle-facts`, `ocelle-fact`, `ocelle-empty-state`, `ocelle-progress`. **Events**: none, since no element has a user intent to report. **I/O**: none. **Interfaces**: `density`; `label` and `wrap`; `variant`; and `value`, `max`, `value-text`, `label`, `show-label`, `size`, `ground`. Every property `| undefined` with `@default undefined`, so no unset property writes an attribute (PLAN-CORRECTNESS-1-011 (a)). Three CSS hooks named after the element: `--ocelle-facts-stack-below`, `--ocelle-facts-value-size`, `--ocelle-facts-value-line-height`. The manifest declares everything, each list stated even when empty ([contracts/elements.md](contracts/elements.md)). |
| II. Tokens only, brand rules | **Lint**: every style is a `css` template or `base.css` rule checked by `token-only`. One recorded allowance (R-10): `fit-content(<percentage>)` and `minmax(0, <flex>)` in grid columns, `translateX(<percentage>)` in `transform`, and a bare integer `animation-iteration-count`, each with unit tests and plants. **No monospace**: values use `font-sans` with `figures`. **Ochre fill never the only mark**: the `accent-strong` inset edge on every fill and mark, in both themes (R-06). **Ochre text on bone**: none. **`color-rule`**: not used. **Radius**: `radius-1` on the progress track (a small mark). |
| III. Accessible by construction | **ID references**: none. Facts has no cross-root reference because the sheet renders `dt`/`dd` itself (R-01); a hidden fact is no pair and a fact's `lang`/`dir` reach its term. Progress takes its name through ElementInternals, so a host `aria-label` names it (R-05). **Headings**: the empty state never adds one; the level is the consumer's. **Motion**: the sweep ends by itself in 4.2 s on the still mark (WCAG 2.2.2), and under reduced motion only the still mark shows (R-06). **Contrast**: the fill's edge and the track boundary meet 3:1 on every main and state ground (`ground="tinted"` on inset, accent-low, hover-bg and state grounds), all through existing rows. **Forced colours**: a track outline, `Highlight` fill with no author shadow, and `CanvasText` text. **Reflow**: at 320 px and 640 px; the track clips the mark; the facts probes take no block size. **Accessibility-tree tests** in both harnesses, with value properties. **Story names**: the story test asserts every progressbar in every story is named. **axe**: see Complexity Tracking. Under #10, axe cannot check the progress name (R-05); the AX-tree tests prove it. |
| IV. Strict CSP, offline | **Styles**: adopted stylesheets, with no `style` attribute in any template. The progress fill's width is set and removed through the CSSOM, which `style-src` does not block (R-06). **Fixture pages** assert zero violations with each element rendered. **Network**: none. |
| V. Storybook, behaviour tests | **Stories**: one per variant and state, light and dark (R-08). The unnamed progress and the host-`aria-label` progress are excepted and proven by tests (FR-050, R-05). **Events**: none to assert. **Keyboard**: no element is focusable, and focus passing through slotted content is tested (US2-6). **Baselines**: see Complexity Tracking. |
| VI. Consumer-driven, own code | **Needs**: kitty-mission-ui's three class families; spec-kitty-design #531 and #535 read from 003's verbatim copy (R-03); #280, #498, #510 and #523 unread, with a read-only fetch requested (Decision 5). Nothing copied. The README mapping names roles only (FR-058). |
| VII. Semver | **MINOR**: four elements, four entry points, three CSS hooks, two base-style rules. CHANGELOG entries for `@ocelle/elements` and `@ocelle/styles` (FR-057). `@ocelle/tokens` is unchanged. |
| VIII. Test-first, non-vacuous | **Scaffold** before each red commit in phases 1 to 3 (`scaffold.sh`), so bodies fail on assertions; the red log is checked per body. **Red first**: each phase's red commit holds the scenario bodies, the driver tests, the story-test extension (I3), and the `token-only` and `@ocelle/styles` tests. `red.sh` records one red record per phase. **Pairing**: "does not" outcomes are paired with a positive one; bodies the light DOM could pass also assert what only the element gives. **Plants**: every CSS-only behaviour has a plant or a stated reason, since Stryker does not mutate `css` templates ([contracts/checks.md](contracts/checks.md)); the gate allowance has its plants. **Mutation**: element source is mutated in process (005 R-12 and decision 16's reading); Timeout and CompileError are reported and pass (#23). **Spikes** are recorded before red commits (phase 1: facts structure under Lit and axe 4.14.0, the empty term, the available-space mechanism and the layout-settle wait; phase 3: the `valuetext` oracle), and a failing spike result goes to the operator, not to review. |
| Licence, supply chain | No new dependency or asset. |
| Workflow gates | No gate added. The `style-lint` gate gains one allowance with plants (R-10); the other gates run unchanged on the new source (contracts/checks.md § Gates touched). |

## Decisions the operator should see at the plan gate

1. **FR-004 (SPEC-1-04 "D"): measured achievable as written.** With manual slot assignment the Chromium tree is
   `DescriptionList > term, definition, …`, and axe is clean (R-01). The plan proposes confirming FR-004 unchanged.
   The rechecks under Lit 3.3.3 and axe-core 4.14.0, and of the empty term in that structure, run in phase 1's spike
   before the red commit (operator decision PLAN-CORRECTNESS-1-014 (b)). Any failing result stops the flow for the
   operator; FR-003, FR-004 and US1-10 are not reworded by review.
2. **Stacking (R-02, PLAN-CORRECTNESS-1-003 (a)).** The sheet stacks on the inline space available to it, not on its
   own resolved size, with a `ResizeObserver` and a public hook `--ocelle-facts-stack-below` (24rem by default; an
   absolute length only, with a fallback for anything else). Phase 1's spike picks the measuring mechanism; if none
   meets FR-005 and FR-009 in every shrink-to-fit host, the result comes back to the operator before the red commit.
3. **Progress basis (R-05).** ElementInternals, so axe cannot test the name. No story sets a host `aria-label` (that
   would be an axe false positive), the AX-tree tests carry the evidence, and the story test checks every bar in every
   story is named.
4. **Track boundary (R-06, PLAN-A11Y-SECURITY-1-002 (a)).** `ground="tinted"` draws it in `accent-strong` on inset,
   accent-low, hover-bg and the state grounds, where `control-border` is below 3:1.
5. **Upstream issues (R-03, PLAN-CORRECTNESS-1-002).** #531 and #535 are read from
   `specs/003-base-styles/sources/spec-kitty-design-issues.md`; FR-008 follows #531 inside a compact region (operator
   option (b)). **Request to the orchestrator:** fetch #280, #498, #510 and #523 read-only from
   spec-kitty/spec-kitty-design before the plan gate, as for triage; #510 bears on FR-022 and US2, #498 on US3.
   Anything in them that changes a requirement goes to the operator.
6. **`value-text` while indeterminate** is not exposed (R-05).
7. **The `token-only` allowance (R-10, PLAN-CORRECTNESS-1-001 (a))** and **no new contrast rows (R-06,
   PLAN-CORRECTNESS-1-007 (b))**, as decided.

## Project Structure

### Documentation (this feature)

```text
specs/013-data-display/
├── plan.md              # this file
├── research.md          # R-01 to R-10
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── elements.md      # the public surface
│   └── checks.md        # tests, plants, driver additions, story test, gates
├── spike/               # measurement scripts and RESULTS.md (phase 0)
├── checklists/requirements.md
├── reviews/             # spec checks, plan squad, phases
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
packages/elements/
├── src/
│   ├── ocelle-facts.ts          # new (imports ocelle-fact.ts)
│   ├── ocelle-fact.ts           # new
│   ├── ocelle-empty-state.ts    # new
│   ├── ocelle-progress.ts       # new
│   ├── index.ts, browser.ts     # re-export / define the four
├── test/
│   ├── scenarios/{facts,empty-state,progress}.ts
│   ├── scenarios/driver.ts                            # + the driver additions
│   ├── in-process.ts                                  # + the driver additions, layout settle
│   ├── {facts,empty-state,progress}.test.ts           # in process (mutated)
│   ├── browser/{facts,empty-state,progress}.test.ts   # built browser build, strict CSP
│   ├── browser/driver.ts, browser/serve.ts            # + the driver additions, viewport
│   ├── commands.ts, commands.test.ts                  # + emulateReducedMotion, AX value properties
│   ├── entry-*.test.ts                                # entry points of the four
│   ├── node/readme.test.ts, node/manifest.test.ts, node/progress-pairs.test.ts
│   └── build/build.test.ts                            # container import rule, progress tokens in dist
├── custom-elements.json         # regenerated
├── package.json                 # exports
├── README.md, CHANGELOG.md
packages/styles/
├── src/base.css                 # compact-region facts hooks, pre-upgrade facts rule
├── test/browser/compact.test.ts, test/browser/facts-upgrade.test.ts, test/readme.test.ts
├── README.md, CHANGELOG.md
gates/
├── stylelint/token-only.ts      # the R-10 allowance
├── test/token-only.test.ts, test/gates-readme.test.ts
├── plants/style-lint/           # the R-10 plants
└── README.md                    # style-lint row
storybook/stories/{facts,empty-state,progress}.stories.ts
storybook/test/integration/elements-stories.test.ts
```

**Structure Decision**: the existing workspace layout. Every new file sits where 005's conventions put it; tests that
read the build are in `test/build/`, node tests of the source in `test/node/`.

## Phases (user stories) for `/speckit-tasks`

Each phase is one unit for `/ocelle-run` step 4. Phases 1 to 3 start with a **scaffold** commit (the phase's modules
with `define`, `@tagname`, declared properties and an empty `render()`, their exports and entries, no test file),
recorded by `scaffold.sh` after `base.sh` and before the red commit, so the red tests fail on their assertions
(contracts/checks.md § Scaffold). The red commit holds the phase's scenario bodies, unit tests, node tests, driver
tests and the story-test extension (I3), changes only test files, and is recorded by `red.sh`; its log is checked per
body. Each phase is folded after its approval.

1. **US1 Facts** (P1, MVP):
   - **spike** (`reviews/phase-1/spike.md`, before the scaffold):
     - the A5 structure built with Lit 3.3.3 (`createRenderRoot` with `slotAssignment: "manual"`, assignment in
       `updated()`), axe-core 4.14.0 on it, and whether an empty `<dt>` stays a term node; any failure stops the flow
       for the operator (R-01);
     - the available-space mechanism of R-02 in a dialog, a popover, a float and a flex item: FR-009's bound, a short
       sheet in a dialog at 1280 px, and a sheet loaded at 360 px then widened; if no candidate meets the rule, the
       operator decides;
     - the probes with an invalid, a percentage and a 0 hook;
     - the layout-settle wait in both harnesses;
     - the stacked and two-column states, and right-to-left;
     - the compact-region hooks in Chromium;
   - **scaffold**: `ocelle-fact.ts`, `ocelle-facts.ts`, their exports and entries;
   - **red**:
     - US1 scenarios 1 to 10 as shared bodies, with the oracles of contracts/checks.md (flat-tree structure,
       each-definition-its-own-value, layout settle, copy);
     - the extra facts bodies of contracts/checks.md (dynamic children and labels, hidden facts, `lang`, right-to-left,
       640 px, `ocelle-fact` alone and moved, non-fact children, shrink-to-fit hosts and history, resize, the hook
       fallbacks and the probes' overflow, compact region, unset properties);
     - the driver additions `viewport`, `scrollWidth`, `layout`, `copy` and `move`, with their tests;
     - `entry-facts` and `entry-fact` tests; the build test of the container import rule;
     - the `token-only` unit tests for the grid functions, and their `gates/README.md` statements;
     - the `@ocelle/styles` tests (compact-region hooks, pre-upgrade rule, README statements);
     - the README test statements for the facts section, the slotted-item convention (with the container import
       rule), the Builds correction and the engines line;
     - the story-test extension for the facts stories (presence, light and dark, 320 px reflow, reduced motion);
     - the named plants of contracts/checks.md for facts;
   - **green**:
     - `ocelle-fact.ts` and `ocelle-facts.ts`;
     - the `token-only` allowance for the grid functions, its plants and its `gates/README.md` row;
     - `base.css`'s two rules, the styles README and CHANGELOG;
     - the regenerated manifest;
     - the facts stories;
     - the README sections (facts, conventions, Builds, engines);
     - the CHANGELOG entry.
2. **US2 Empty state** (P2):
   - **scaffold**: `ocelle-empty-state.ts`, its exports and entries;
   - **red**:
     - US2 scenarios 1 to 6 and 8 as shared bodies, with the element-only assertions of contracts/checks.md (markup
       out of slot order, geometry in the column);
     - US2-7 with an `ocelle-progress` stand-in: a plain element in `visual`, since progress comes in phase 3; phase 3
       extends US2-7 to the real `ocelle-progress` and its width;
     - the present-parts bodies (heading only, actions only, visual plus text), the slots filled and emptied later,
       several actions at 320 px, unset `variant`;
     - the driver additions `pressTab` and `focused`, with their tests;
     - the entry test, the README statements and the story-test extension;
   - **green**:
     - `ocelle-empty-state.ts`;
     - exports;
     - the manifest;
     - the stories (the panel-loading story arrives in phase 3);
     - the README section and its heading rule (FR-056);
     - the CHANGELOG.
3. **US3 Progress** (P3):
   - **spike** (`reviews/phase-3/spike.md`, before the scaffold): the `valuetext` oracle among platform reads (R-05);
     if none exposes it, US3-3 goes to the operator;
   - **scaffold**: `ocelle-progress.ts`, its exports and entries;
   - **red**:
     - the driver additions `reducedMotion` (`emulateReducedMotion`), `animations` and the AX value properties, with
       their tests;
     - US3 scenarios 1 to 13 as shared bodies, with the oracles of contracts/checks.md;
     - SPEC-2-02's bodies, the value-removed body, the right-to-left indeterminate body, the 320 px sweep body, the
       tinted-ground body, unset properties;
     - US2-7 extended to `ocelle-progress` and its width in the column;
     - the pairing test in two halves (`test/node/progress-pairs.test.ts`, `test/build/build.test.ts`);
     - the `token-only` unit tests for the translate and the iteration count, and their `gates/README.md`
       statements;
     - the entry test, the README statements and the story-test extension (progress stories and the empty-state
       panel-loading story, with the progressbar-name check);
     - the named plants of contracts/checks.md for progress (still-mark inset removed, `infinite` restored, clip
       removed, inset shadow removed, tinted rule removed, forced-colours `box-shadow: none` removed, right-to-left
       keyframes removed, the `::slotted(ocelle-progress)` rule removed, a story's `label` removed);
   - **green**:
     - `ocelle-progress.ts`, the `emulateReducedMotion` command and the other driver additions;
     - the `token-only` allowance for the translate and the iteration count, its plants and its `gates/README.md` row;
     - exports and the manifest;
     - the stories;
     - the README section (naming and the axe false positive, the bounded sweep, `ground="tinted"`, the busy
       vocabulary);
     - the CHANGELOG.
4. **Polish and cross-cutting** (no new behaviour unless named):
   - not exempt: the README mapping (FR-058), with readme-test statements red first;
   - exempt (documentation): the final CHANGELOG surface lists (FR-057) and the quickstart run, recorded in
     `reviews/phase-4/`;
   - #10 recheck: if #10 is on `main` at this point, the baselines and the axe run per research R-08 (that part not
     exempt: the story test and gates). If not, a note in `reviews/phase-4/` saying the recheck is open.

Phases 2 and 3 depend on nothing from phase 1 but the driver additions, and run in order so the README, exports and
driver change one phase at a time. Phase 3 extends one phase 2 scenario (US2-7). No phase needs #15 merged.

## Complexity Tracking

| Exception | Scope | Rationale | Sunset |
|---|---|---|---|
| No visual baselines and no axe run for the new stories (constitution III, V) | the facts, empty-state and progress stories of this feature | 001's recorded exception "Storybook build, visual regression and axe gates absent" still applies while #10 is unmerged; the stories follow #10's design (R-08) | the merge of #10, when phase 4 or #10's rebase commits the baselines and runs axe |

The progress stories' axe pass not covering the accessible name is a property of axe with ElementInternals, not an
exception: the requirement (FR-030) is proven by the AX-tree tests and the story test's name check (R-05). The unnamed
and host-`aria-label` progress states having no story is the spec's own exception (FR-050) and R-05's reasoning,
recorded there. The `token-only` allowance (R-10) is a recorded gate change with plants, not a constitution exception:
it admits no raw colour, font, size, radius, shadow or duration.
