# Tasks: Data Display, First Slice (Facts, Empty State, Progress)

**Input**: design documents in `specs/013-data-display/`, approved at the plan gate on 2026-11-13 after three plan-squad
rounds (`reviews/plan/round-1..3/`) and the plan-gate decisions in `reviews/plan/operator-gate.md`:
- spec.md: FR-001 to FR-058, SC-001 to SC-007, and US1 to US3 with their scenarios;
- plan.md: its Decisions and § Phases;
- research.md: R-01 to R-11;
- data-model.md;
- contracts/elements.md: the public surface;
- contracts/checks.md: bodies, oracles, plants, driver additions, scaffold, story test, styles tests and gates;
- quickstart.md;
- spike/RESULTS.md.

Amended after the analysis of the tasks (`analysis-report.md`) with the operator's decisions at the tasks gate
(2026-11-13, `reviews/analysis/operator-decisions.md`); the resolution of each finding is in
`reviews/analysis/fixes-1.md`. Added tasks: T002a, T022a, T036a.

Amended after the operator's decisions on the input questions (2026-11-14, `reviews/analysis/inputs-decisions.md`,
IQ-01 to IQ-15): `layout="grid"` (IQ-05 (b)), the empty state's `eyebrow` slot (IQ-08 (c)) and body spacing (IQ-09
(b)), the progress value text at the row's inline end (IQ-13 (b)), the fallback-text test (IQ-15 (b)), and README
statements for the rest. Added tasks: T001a, T004a, T008a, T010a, T014a, T018a, T020a, T021a (phase 1); T024a,
T026a, T029a, T031a, T033a, T034a (phase 2); T038a, T043a, T046a, T051a, T052a (phase 3); T053a (phase 4).

Amended after the second analysis of the tasks (`analysis-report.md`, head d221dd5) with the operator's decision at
the second tasks gate (2026-11-14, "approve + fix all", `reviews/analysis/operator-decisions.md`): wording and added
test bodies only, with no new public surface; the resolution of each finding is in `reviews/analysis/fixes-2.md`. The
added bodies and plants are folded into T004a, T021a and T024a, and the story statement into T049; no task is
added.

Amended after the operator's decisions at the phase 1 spike stop (2026-11-14,
`reviews/phase-1/operator-spike-decisions.md`, measurements in `reviews/phase-1/spike.md`): "(a) Defer + 2-frame wait"
(the observer's measure pass runs one animation frame after the callback; the layout wait polls at least 2 frames
before it compares), "Widen the margin" (the round 3 content at least 16 px either side of the 384 px threshold), and
the one unobserved change the spike found (a CSS grid `auto` track whose neighbour is removed) copied into R-02, the
README statement task and the unobserved-change bodies. Added tasks: T001b, T006a.

**Tests**: required. Constitution Principle VIII applies to every phase.

**Phase flow**: `base.sh`, then `scaffold.sh` (phases 1 to 3), then one red commit of test files only proven by
`red.sh`, then green, `tdd-check.sh` and an independent review. Following operator decision I3, the story-test
extension for each phase is written in that phase's red commit, before green, and `red.sh` keeps one red record per
phase.

**Red log**: the red log is checked per body, not only by exit code (contracts/checks.md § Scenario bodies). A body
that passes in the red run is a finding: its oracle is changed before green.

**Expected values**: written by hand from the spec, data-model and research, never read from the source under test.
Token values come from `packages/tokens/src/source.ts`, through the token names the spec names.

**Guard rules**:
- A "does not" assertion never stands alone: it shares its body with the positive assertion it guards.
- Each named plant (contracts/checks.md § Oracles and § CSS-only behaviours) is run once by the implementer and
  recorded in `reviews/phase-N/plants.md`.
- A plant that does not make its guard fail stops the phase (stop-and-ask).

**Shared scenario bodies** (R-08, contracts/checks.md § Scenario bodies):
- Every browser scenario is written once in `packages/elements/test/scenarios/*.ts` against the `Driver` interface.
- Each runs in two harnesses: in process (`elements`, mutated) and on the built browser build on the strict-CSP
  fixture (`elements-browser`).
- Fixture runs also assert zero CSP violations, only allowed requests and no console message.

**Environment**:
- Node 22 in this container, 26.13.0 in CI. Browser runs set `OCELLE_CHROMIUM_PATH` as the elements README says.
- Baselines come from `pnpm run visual:update` in #10's pinned linux/amd64 container (`storybook/visual/container.json`).
- One heavy job (browser suites, mutation, plants, visual capture) at a time. Never `git stash`.

**Dependencies**: no phase needs #15 merged, and #10 is merged on `main` and merged into this branch. Phases run in
order 1 → 2 → 3 → 4:
- Phase 2 needs only phase 1's driver additions.
- Phase 3 extends phase 2's US2-7 body.
- Phase 4 is documentation and gate runs.

**Stop-and-ask points**: the implementer stops, records the question in the phase review and does not work around it:
- **T001 (phase 1 spike)**:
  - the A5 structure under Lit 3.3.3 or axe-core 4.14.0 fails FR-004, or an empty `<dt>` is not exposed as a term
    (PLAN-CORRECTNESS-1-014 (b));
  - the two-column measure shows a state dependence that the cheap triggers do not cover and that is not one of the
    unobserved changes FR-009 is narrowed for (R-02);
  - a flip raises the `ResizeObserver` loop error with the observer's pass deferred one frame (the synchronous pass's
    error was decided at the spike stop, "(a) Defer + 2-frame wait"), or the deferred pass gives a layout that differs
    from the synchronous pass's after the 2-frame wait;
  - **T001a**: the grid layout's `<div>` groups inside the shadow `<dl>` fail FR-004 (an axe `definition-list` or
    `dlitem` violation, a Chromium tree that is not one description list with each definition after its term, or an
    empty term pruned) (IQ-05 (b), research R-01);
  - **T001b**: no round 3 content meets the 16 px margin in the harness's fonts with the value or label lengthened.
- **T035 (phase 3 spike)**: no platform read exposes `valuetext`. US3-3 goes to the operator (R-05). Reached and
  decided: (a) "Prove the wiring, not the exposure" (`reviews/phase-3/operator-spike-decisions.md`).
- **R-11 inventory** (T002a, T022a, T036a): a phase's `.sk-*` family is missing from research R-11 before that phase's
  red commit, or has a variant that no element or variant covers (Decision 5, operator: "proceed, inputs later"). All
  three families are recorded and their gaps decided by the operator (IQ-01 to IQ-15, 2026-11-14, plan Decision 10),
  so this no longer blocks T012, T028 and T045; a new gap found while writing the mapping statements still goes to the
  operator.
- **Plants**: a plant that does not bite.
- **axe**: the `axe` gate fails on a new story in a way that would need a `storybook/a11y-exceptions.json` entry.
- **Baselines**: `visual:update` reports a changed or removed baseline.
- **Mutation**: any mutation shard over 10 minutes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task).
- **[Story]**: the user story of the task (US1 to US3).
- Paths are relative to the repository root.

---

## Phase 1: User Story 1 - A label and value sheet without classes (Priority: P1) 🎯 MVP

**Goal**: `ocelle-facts` and `ocelle-fact`, covering:
- US1 scenarios 1 to 19 (13 to 19: `layout="grid"`, IQ-05 (b));
- FR-001 to FR-014 for facts, FR-050 to FR-058 for facts;
- the `token-only` grid-function allowance (R-10);
- `base.css`'s compact-region hooks and pre-upgrade rule (R-07);
- the phase's driver additions, the facts stories and their baselines.

**Independent Test**: on the strict-CSP fixture, `<ocelle-facts>` with five `ocelle-fact` children (one a
64-character identifier with `wrap="anywhere"`) passes these checks:
- at 1280 px, two columns sharing one label column;
- at 320 px, one column with the page scroll width equal to the viewport width;
- the Chromium AX tree is one description list with term and definition pairs in source order;
- with `layout="grid"` and four of those pairs: four cells in one row at 1280 px, one cell per row at 320 px with the page scroll width equal to the viewport width, and one description list in the Chromium AX tree;
- zero violations;
- `gate:manifest`, `gate:style-lint`, `gate:storybook-build`, `gate:visual` and `gate:axe` pass.

### Spike (first)

- [X] T001 [US1] Spike before the scaffold, scratch files only, recorded in `specs/013-data-display/reviews/phase-1/spike.md`. Every item is per plan § Phases 1 and research R-01/R-02:
  - the A5 structure built with Lit 3.3.3 (`createRenderRoot` with `slotAssignment: "manual"`, `slot.assign()` in `updated()`): the Chromium AX tree, axe-core 4.14.0 (`definition-list`, `dlitem`, full run) and whether an empty `<dt>` stays a term node;
  - the two-column measure with its probes, in a `showModal()` dialog, a popover, a float, a default flex item, a flex row with a 400 px fixed sibling, a grid `auto` track and a table cell:
    - FR-009's bound;
    - a short sheet in a dialog at 1280 px, stacked without `layout` and two columns with `layout="columns"`;
    - the "Created by op" / "Ada Lovelace and Charles Babbage" sheet loaded at 360 px then widened to 1200 px;
    - whether a flip raises the `ResizeObserver` loop error;
  - the round 3 cases: widen, relabel from "Id", and value text changed in place, each against a fresh load, with the content fixed so it crosses the threshold in this harness's fonts; and with the extra triggers removed, both named cases stay stacked;
  - the unobserved changes: a fixed flex sibling shrunk, a grid neighbour removed, a table column widened, a dialog reopened at another width, a late web font, each against a fresh load. The cases that differ are FR-009's narrowing, recorded into research R-02 § Changes the pass does not observe;
  - the 300 → 290 px measure-pass case;
  - the probes with an invalid (`24 rem`), a percentage and a 0 hook, valid 15rem and 40rem hooks, and a hook changed at a fixed 450 px width;
  - the `layout` settle wait in both harnesses;
  - right-to-left;
  - the `data-ocelle-density="compact"` hooks in Chromium.

  Any failing FR-004 result or unexplained state dependence stops for the operator.

- [X] T001a [US1] Spike items for the input decisions, scratch files only, recorded in `specs/013-data-display/reviews/phase-1/spike.md` (research R-01 § The grid layout's structure, R-02 § The grid layout's column count and § A sheet as a `1fr` grid item):
  - the grid structure: the shadow `<dl>` with each pair in a `<div>` group (`<div><dt></dt><dd><slot></slot></dd></div>`), built with Lit 3.3.3 and manual assignment; the Chromium AX tree (one description list, each definition after its term, the groups ignored or generic), axe-core 4.14.0 (`definition-list`, `dlitem`, full run) and an empty `<dt>` in a group. Any failure stops for the operator (IQ-05 (b));
  - the grid measure as laid out in four columns, in the hosts of T001 and in 300, 600, 800 and 1280 px block containers (one, two, four, four columns), the US1-18 widen case in a dialog with the content T001 fixes (lengthened if its four-column size at 1280 px is below 2 × T or its size at 360 px is not below T), a hook changed at a fixed width moving both points, and whether a flip raises the `ResizeObserver` loop error; the unobserved changes of T001 for the grid, each against a fresh load;
  - the `1fr` grid item (IQ-02 (a)): a sheet with a long unbroken value as the item of a `1fr` grid track at 320 and 600 px, with and without `min-inline-size: 0` on the host, recording the track's and the page's overflow.

- [X] T001b [US1] Spike resumption after the operator's spike decisions (`specs/013-data-display/reviews/phase-1/operator-spike-decisions.md`), scratch files only, before the scaffold, recorded in `specs/013-data-display/reviews/phase-1/spike.md` and research R-02 (§ To measure, Margin):
  - choose the round 3 content (widen, relabel, value text) so that each two-column size is at most 368 px where the body expects one column and at least 400 px where it expects two (16 px either side of the 384 px threshold), lengthening the value or label of "Created by op" / "Ada Lovelace and Charles Babbage" as needed; re-measure each case in the harness's fonts against a fresh load, with the plant (extra triggers removed) still keeping the widen and relabel cases stacked;
  - check the same content for US1-18 in the grid (four-column size at 1280 px at least 2 × T, size at 360 px below T);
  - with the observer's pass deferred one animation frame: no loop error and the same layouts as recorded in §§ 2 to 7, with the layout wait polling at least 2 frames before it compares;
  - the layout wait's frame count in the in-process harness (Vitest browser mode), and confirm that harness logs the synchronous pass's loop error as `console.error`;
  - record the chosen content and its sizes in `spike.md` and in research R-02.

### Scaffold

- [X] T002 [US1] Scaffold commit (no behaviour, constitution VIII exemption stated in the phase review), recorded by `.specify/extensions/story/scripts/scaffold.sh 1`:
  - `packages/elements/src/ocelle-fact.ts` and `packages/elements/src/ocelle-facts.ts`, each with `define`, `@tagname`, the declared properties of contracts/elements.md (`label`, `wrap`; `density`, `layout`), each `| undefined` with `@default undefined`, and an empty `render()`;
  - `ocelle-facts.ts` imports `./ocelle-fact.ts` (PLAN-CORRECTNESS-1-012 (a));
  - exports in `packages/elements/src/index.ts`, `src/browser.ts` and `packages/elements/package.json` `exports` (`./ocelle-facts.js`, `./ocelle-fact.js`);
  - no test file.

### Inventory (operator step, before the red tasks)

- [x] T002a [US1] Operator step, recorded by the planner: the operator supplies the `.sk-facts` modifiers and states with a count for each (role names only, no code), and the planner records them in the R-11 table of `specs/013-data-display/research.md` (role names without the `sk-` prefix, each with its element and variant) in a documentation commit of its own, before T010 is written. A row no element or variant covers goes to the operator. While the family is pending, T010's mapping statements and T012 are blocked: stop and ask. Done: recorded from `specs/013-data-display/sources/013-inputs.md` Part A; its open questions (IQ-01 to IQ-05) were decided by the operator on 2026-11-14 (`specs/013-data-display/reviews/analysis/inputs-decisions.md`), and the rows carry the decisions.

### Tests (red, one commit, test files only)

- [X] T003 [P] [US1] Driver additions `viewport`, `scrollWidth`, `layout`, `copy`, `move`, `text`, as contracts/checks.md § Driver additions specifies:
  - declared in `packages/elements/test/scenarios/driver.ts`;
  - implemented in `packages/elements/test/in-process.ts` and `packages/elements/test/browser/driver.ts`;
  - their own tests in `packages/elements/test/commands.test.ts` and the driver tests. Behaviour to test: `layout` waits at least 2 animation frames before it compares, then polls once per frame until two consecutive equal frames and fails after 10; a geometry change made in a `requestAnimationFrame` scheduled from a `ResizeObserver` callback (the deferred pass's shape) is read by the wait, never the geometry before it; `copy` returns the copy event's `text/plain`; `text` makes a `characterData` change.
- [X] T004 [US1] `packages/elements/test/scenarios/facts.ts`: the facts scenario bodies with the oracles of contracts/checks.md § Oracles (Facts). Every "does not" is paired:
  - US1 scenarios 1 to 10 as shared bodies:
    - US1-6 asserts the AX description list and the flat-tree `<dl>` children (`<dt>`/`<dd>` alternating, one pair per visible fact);
    - US1-6, US1-7, US1-10 and the reorder body read `axSubtree` with a distinct value per pair;
    - US1-3 and US1-4 use the 64-character identifier, with the copy oracle;
    - US1-1 to US1-3 and US1-9 use the `layout` wait;
    - US1-5 also reads a label's type in the same sheet (`--ocelle-font-sans`, `--ocelle-font-size-sm`, `--ocelle-font-weight-medium`, `--ocelle-color-ink-muted`), each of size, weight and colour asserted different from the value's (FR-006, contracts/checks.md § Oracles, label type);
    - US1-8 checks forced colours with system colours read beside the token colours;
    - the FR-011 link sits inside the value column.
  - US1-11, the `layout` property (FR-013): a short sheet in a dialog at 1280 px, one column without `layout` and two columns with `layout="columns"`; `stacked` in a 600 px block; `columns` at 320 px with no page overflow; `layout="table"` acts as unset (`grid` is a value now, FR-014); removing `layout` returns to automatic.
  - US1-12's re-decide bodies (widen, relabel, value text, each compared with a fresh load), with the content T001b fixed: each two-column size at least 16 px either side of the 384 px threshold (at most 368 px where one column is expected, at least 400 px where two are), as recorded in `spike.md` and research R-02; the plant bodies wait for the first decision before they act.
  - The 300 → 290 px measure-pass body.
  - The unobserved-change bodies for the case T001 recorded (research R-02 § The unobserved case the spike found): a sheet in the `auto` track of a 600 px consumer CSS grid whose neighbour is removed, once with `layout="columns"` and once with an inline size on the sheet, each giving two columns after the change, paired with a fresh load without the neighbour (two columns).
- [X] T004a [US1] `packages/elements/test/scenarios/facts.ts` (continued): the `layout="grid"` bodies (FR-014, IQ-05 (b)) with the oracles of contracts/checks.md § Oracles (grid structure, grid geometry), every "does not" paired:
  - US1-13 (four cells at 1280 px; the AX description list; the flat-tree `<dl>` children only `<div>` groups, each one `<dt>` then one `<dd>`; the label-to-value gap exactly `--ocelle-space-1` (the `<dt>`'s block end to the `<dd>`'s block start) and the column gap exactly `--ocelle-space-4` (one group's inline end to the next one's inline start), each value from `packages/tokens/src/source.ts`; the `<dl>`, each group, `<dt>` and `<dd>` with a transparent computed `background-color` and every border style `none`, beside a sibling `<div>` given a ground and a border by a page rule in the same body, read as non-default, FR-014);
  - US1-14 (two columns at 600 px and one at 320 px in one body, page scroll width equal to the viewport width);
  - US1-15 (one, three and eight facts at 1280 px: four equal tracks, empty tracks kept, no spanning);
  - US1-16 (a long label and the 64-character identifier with `wrap="anywhere"` at 600 px and at a 640 px viewport: wrapping inside the cells, no intersecting group boxes, no page overflow);
  - US1-17 (right-to-left, paired with left-to-right in one body);
  - US1-18 (widen in a dialog from 360 px to 1280 px against a fresh load, with T001a's content);
  - US1-19 (a link, a status text and "Not recorded" as values: shown as given, each inside its own cell; the link's tab stop);
  - the extra grid bodies of contracts/checks.md § Extra scenario bodies: `layout` from `grid` to `columns` and back, `density="compact"` with `grid`, a hidden fact in the grid, the 15rem hook on a 600 px grid sheet;
  - the unobserved change T001a recorded for the grid (research R-02): a `layout="grid"` sheet with the US1-18 content in a consumer CSS grid `auto` track at a 1000 px viewport whose neighbour is removed, with an inline size on the sheet (at least 2 × T): four columns after the change, paired with a fresh load without the neighbour (four columns).
- [X] T005 [US1] `packages/elements/test/scenarios/facts.ts` (continued): the extra facts bodies of contracts/checks.md § Extra scenario bodies:
  - no pairs (FR-010): empty and whitespace-only sheets render no sized box, expose no list, term or definition, and report no error, paired in the same body with one `ocelle-fact` added giving one description list with one term and one definition;
  - a very long label (FR-005, edge case): in a 600 px two-column sheet, the label column equals 50% of the sheet's content box, the label wraps between words inside it, and the value column takes the rest, beside a short-label pair in the same columns (the guard of T021's `fit-content(50%)`→`auto` plant);
  - dynamic add, remove, reorder and label change;
  - hidden facts: at first render, toggled after render, and `aria-hidden="true"`;
  - `lang` on a fact, read from its `<dt>`;
  - right-to-left columns;
  - the 640 px "200% zoom" case;
  - a standalone `ocelle-fact` with `wrap="anywhere"` (value wraps anywhere, label between words);
  - a fact moved into and out of `ocelle-facts`;
  - a non-`ocelle-fact` child is hidden;
  - the shrink-to-fit and shared hosts, with FR-009's bound and widen-after-load;
  - the resize body (600 → 300 → 600);
  - the hook fallbacks at 320 px, and the probe-overflow body;
  - the valid-hook bodies (15rem at 300 px gives two columns, 40rem at 600 px gives one column);
  - the hook changed at 450 px with no resize;
  - the compact-region bodies (14 px and 1.5 in a compact region, 17 px and 1.45 in a nested regular region, `density="compact"` alone with 17 px and a row gap of `--ocelle-space-1`);
  - unset properties write no attribute (`density`, `layout`, `label`, `wrap`).
- [X] T006 [P] [US1] Test files for facts:
  - `packages/elements/test/facts.test.ts`: the in-process harness over T004/T005;
  - `packages/elements/test/browser/facts.test.ts`: the fixture harness over T004/T005, which also asserts zero violations, allowed requests and no console message;
  - `packages/elements/test/entry-facts.test.ts`: importing `src/ocelle-facts.ts` alone defines `ocelle-facts` and `ocelle-fact` and no other element;
  - `packages/elements/test/entry-fact.test.ts`: importing `src/ocelle-fact.ts` defines `ocelle-fact` only;
  - `packages/elements/test/entry-root.test.ts`: extended to the two tags and their exported classes.
- [X] T006a [US1] `packages/elements/test/facts.test.ts` (in-process harness only; Playwright's `console` and `pageerror` events do not record the error): the no-`ResizeObserver`-loop-error test of contracts/checks.md § Oracles. Around the flips (600 → 300 → 600 px block resize, the dialog widen 360 → 1200 px, the hook 15rem → 40rem → 15rem at 450 px, a grid sheet 300 → 600 → 800 px), each read with the `layout` wait, record `window` `error` events (capture) and `console.error` calls and assert none carries "ResizeObserver loop"; paired with each flip's layout asserted and a synthetic `ErrorEvent` with that message seen by the recorder. Its plant (T021 step 1): the measure pass run synchronously inside the observer callback; the test must fail.
- [X] T007 [P] [US1] `packages/elements/test/build/build.test.ts`: the container import rule. `dist/ocelle-facts.js` imports `./ocelle-fact.js` and no other element module, and `dist/ocelle-fact.js` imports no element module (PLAN-CORRECTNESS-1-012 (a)).
- [X] T008 [P] [US1] `gates/test/` `token-only` unit tests for the R-10 grid allowance, plus the `gates/README.md` statement test:
  - `fit-content(<percentage>)` and `minmax(0, <flex>)` in `grid-template-columns` pass;
  - other arguments, other properties, and nested functions are each a finding.
- [X] T008a [US1] `gates/test/token-only.test.ts`: four `minmax(0, 1fr)` tracks in one `grid-template-columns` value pass (the grid layout needs no further allowance, research R-10), and `repeat(4, minmax(0, 1fr))` is a finding.
- [X] T009 [P] [US1] `@ocelle/styles` tests (contracts/checks.md § `@ocelle/styles` tests):
  - `packages/styles/test/browser/compact.test.ts`: the facts hooks inside compact and nested regular regions;
  - a browser test on an undefined `ocelle-facts`: each `ocelle-fact` is a block; a `hidden` child computes `display: none`, has no client rects and is absent from `innerText`; the rule stops matching once the elements are defined;
  - `packages/styles/test/readme.test.ts`: statements for both rules.
- [X] T010 [P] [US1] `packages/elements/test/node/readme.test.ts`: statements for the `ocelle-facts` section, one assertion per statement:
  - usage, `layout` and the threshold hook `--ocelle-facts-stack-below` (absolute lengths only, with the fallback);
  - FR-009's narrowing as recorded by T001 (research R-02 § The unobserved case the spike found): in a consumer's CSS grid `auto` track whose neighbour can be removed, the layout may stay as it was; set `layout` or give the sheet an inline size there (for `layout="grid"`, an inline size);
  - only `ocelle-fact` children; the wrap policy; digests are the consumer's; compact regions; before upgrade; tokens read;
  - the slotted-item convention with the container import rule (FR-056);
  - the Builds correction, and the Engines line for manual slot assignment (Chromium 86, WebKit 16.4, floor unchanged).

  Also the facts mapping-row statements (FR-058), one per row of the `.sk-facts` inventory in research R-11 (T002a), each keyed by the row's role name (for example "facts compact" names `ocelle-facts` and `density="compact"`). No `sk-` string appears in test code, built directly or indirectly; the README table holds the `.sk-*` names, Markdown being outside `gate:prefix` (operator decision I1, research R-11, contracts/checks.md § Gates touched). If the inventory is missing or has a gap, stop and ask the operator (Decision 5).
- [X] T010a [US1] `packages/elements/test/node/readme.test.ts`: statements for the facts input decisions, one assertion per statement (contracts/elements.md § README sections):
  - `layout="grid"`: cells with the label above the value, four columns from twice `--ocelle-facts-stack-below`, two from it, one below it; one description list; give a grid sheet in a shrink-to-fit host an inline size; set `wrap="anywhere"` on machine values in a cell (IQ-05 (b)); in every layout, an unbroken value without the policy can overflow its value box or cell, so machine values take `wrap="anywhere"` (FR-009 as qualified, operator decision "Grid limits");
  - do not set `grid-template-columns` through `ocelle-facts::part(list)` (IQ-01 (a));
  - in a consumer's CSS grid, set `min-inline-size: 0` on the `ocelle-facts` host (IQ-02 (a));
  - labels at weight 500; `::part(label)` sets another weight (IQ-03 (a));
  - no truncation; `break-word`, break-anywhere and an ellipsis map to `wrap="anywhere"` with the full value shown (IQ-04 (b));
  - the updated facts mapping rows of research R-11 ("facts stacked", "facts two-col", "facts term regular", "facts value wrap", "facts value ellipsis", "facts value tooltip"), keyed by role name with no `sk-` string in test code.
- [X] T011 [P] [US1] `storybook/test/integration/elements-stories.test.ts` (I3, contracts/checks.md § Story test): each facts story of research R-08 is in the built index and renders its `ocelle-facts` in light and dark with no outside request. Each facts story at a 320 px viewport has a page scroll width equal to the viewport width, paired with a non-zero sheet size. Each facts story under reduced motion has no running animation, read on a fresh load and timed by the clock with the `matchMedia` assertion. No facts story animates, so this check is paired only with the `matchMedia` assertion until the animation positive on the indeterminate progress story arrives in T044 (contracts/checks.md § Story test).
- [X] T012 [US1] Red commit of T003 to T011 with T004a, T006a, T008a and T010a (test files only). Run `.specify/extensions/story/scripts/red.sh 1 phase` and confirm per body in the red log that each fails on an assertion against the scaffold.

### Implementation (green)

- [X] T013 [US1] `packages/elements/src/ocelle-fact.ts` (R-01, R-03, data-model § `ocelle-fact`):
  - `label` reflected; `wrap` reflected (`"anywhere" | undefined`);
  - inside `ocelle-facts`, a single `<slot>`; outside it, `<span part="label">` plus the slot as two blocks;
  - placement decided in `connectedCallback`;
  - `:host([wrap="anywhere"]) { overflow-wrap: anywhere }`;
  - `:host([hidden]) { display: none; }`;
  - static styles from tokens only.
- [X] T014 [US1] `packages/elements/src/ocelle-facts.ts` (R-01, R-02, R-03, data-model § `ocelle-facts`):
  - shadow root and pairs:
    - `slotAssignment: "manual"`;
    - `<dl part="list">` with `<dt part="label">{label}</dt><dd part="value"><slot></slot></dd>` per visible `ocelle-fact` child;
    - `slot.assign()` in `updated()`;
    - no `<dl>` with no pairs;
    - hidden or `aria-hidden` facts skipped;
    - `lang` and `dir` carried to the `<dt>`.
  - `MutationObserver` on `childList`, `characterData`, and the `label`/`hidden`/`aria-hidden`/`lang`/`dir` attributes (subtree).
  - Stacking:
    - the probes `part="probe"`, observed by one `ResizeObserver` with the host;
    - the measure pass alone owns the `stacked` class and is re-run after every render, on value text changes and on window resize, and from the `ResizeObserver` one animation frame after the callback (a `requestAnimationFrame` scheduled in it), never synchronously inside the callback (research R-02, operator decision "(a) Defer + 2-frame wait");
    - `--ocelle-facts-stack-below`, defaulting to `calc(var(--ocelle-space-10) * 6)`, with its fallback.
  - `layout` override (FR-013).
  - The two-column tracks `fit-content(50%) minmax(0, 1fr)` on the `<dl>`, row gaps `--ocelle-space-3` (compact `--ocelle-space-1`).
  - Label and value type and colours per R-03; values read `--ocelle-facts-value-size` and `--ocelle-facts-value-line-height`.
  - Forced-colours rules; `:host([hidden])`.
- [X] T014a [US1] `packages/elements/src/ocelle-facts.ts`: `layout="grid"` (research R-01, R-02, R-03, data-model § `ocelle-facts`):
  - the grouped template (`<div class="item">` holding the `<dt>` and `<dd>`) when `layout` is `grid`, the slots re-assigned after a structure change;
  - the measure pass in grid: column classes removed, the host read as laid out in four columns, `cols-2` or `cols-1` set unconditionally from T and 2 × T, on the existing triggers;
  - four `minmax(0, 1fr)` tracks (two with `cols-2`, one with `cols-1`), cells with `min-inline-size: 0`, label-to-value gap `--ocelle-space-1`, column gap `--ocelle-space-4`, row gap `--ocelle-space-3` (compact `--ocelle-space-1`); no divider or ground.
- [X] T015 [US1] `gates/stylelint/token-only.ts`: the R-10 allowance for `fit-content(<percentage>)` and `minmax(0, <flex>)` in `grid-template-columns`. Add its style-lint plants in `gates/plants/style-lint/` (a pass plant and fail plants for other arguments and properties) and its `gates/README.md` row.
- [X] T016 [US1] `packages/styles/src/base.css`: in the density rules, the compact and regular `--ocelle-facts-value-size`/`--ocelle-facts-value-line-height` hooks; the pre-upgrade rule `:where(ocelle-facts:not(:defined) > ocelle-fact:not([hidden])) { display: block; }`; plus `packages/styles/README.md` and `packages/styles/CHANGELOG.md` (R-07, FR-012).
- [X] T017 [US1] Manifest: run `pnpm --filter @ocelle/elements run manifest` and commit `packages/elements/custom-elements.json` with the two declarations of contracts/elements.md (`layout` typed `"columns" | "stacked" | "grid" | undefined`). Every list is stated and every member described.
- [X] T018 [US1] `storybook/stories/facts.stories.ts`, the facts stories of research R-08 (`title: "Elements/ocelle-facts"`):
  - Latin text only;
  - right-to-left stories with `dir="rtl"`;
  - wrapper widths from `data-story` rules in `storybook/.storybook/stories-layout.css`;
  - no `style` attribute, no pointer state.
- [X] T018a [US1] `storybook/stories/facts.stories.ts`: the `layout="grid"` stories of research R-08 (four-field strip, two columns, one column, one fact, three facts, eight facts, long label and identifier, link and status value, explicit unavailable value, compact, right-to-left), with their wrapper widths as `data-story` rules in `storybook/.storybook/stories-layout.css`; Latin text only, no `style` attribute, no pointer state. Their baselines are part of T019's `visual:update` run.
- [X] T019 [US1] Baselines: run `pnpm run visual:update` in the pinned container. It must print `(<n> added, 0 changed, 0 removed)`, with `<n>` twice the new facts stories. Commit `storybook/baselines/elements-ocelle-facts--*.{light,dark}.png`. If CI's "Visual regression" captures differ, commit CI's artifact instead (`storybook/README.md` § Baselines).
- [X] T020 [US1] Documentation in `packages/elements/README.md`:
  - the `ocelle-facts` section, the slotted-item convention, the Builds correction and the Engines line, with the statements of T010;
  - the `.sk-facts` mapping rows (roles only, no code).

  Also a `packages/elements/CHANGELOG.md` entry for `ocelle-facts` and `ocelle-fact`.
- [X] T020a [US1] `packages/elements/README.md`: the facts statements of T010a (the grid layout, the wrap policy on machine values in every layout, the columns not restyled, `min-inline-size: 0` in a consumer's CSS grid, the label weight, no truncation and the wrap mapping) and the updated `.sk-facts` mapping rows of research R-11; the `packages/elements/CHANGELOG.md` entry names `layout="grid"`.
- [X] T021 [US1] Checks, one heavy job at a time:
  1. Run each facts plant of contracts/checks.md once (§ Oracles and § CSS-only behaviours: the A1 `<dl><slot>` structure, slots in reverse order, the U+200B copy, the extra triggers removed, `characterData` removed, class not restored after the measure, the pass run synchronously inside the observer callback (T006a), `fit-content(50%)`→`auto`, the value tracks' `minmax(0, 1fr)`→`1fr` together with the `<dd>`'s `min-inline-size: 0` removed (guarded by the unbroken-value body; each change alone is equivalent, operator decision (b)), the `stacked` rule removed, the hook probe ignored, the default probe removed, probes not observed, probe `block-size: 1px`, the compact hooks removed, the `wrap` rule removed, the styles rule removed, `:not([hidden])` removed) and record the results in `specs/013-data-display/reviews/phase-1/plants.md`.
  2. Run `pnpm run gate:manifest`, `gate:style-lint`, `gate:csp`, `gate:prefix`, `gate:test-lint`, `gate:contrast` (unchanged; US1-8 relies on the existing text rows), `gate:storybook-build`, `gate:visual`, `gate:axe` (no `storybook/a11y-exceptions.json` entry added), `gate:plants`, then `gate:mutation -- --base <phase base>`.
  3. Record the three Storybook gates' summary lines and the `visual:update` line in the phase review.

- [X] T021a [US1] Run the grid plants of contracts/checks.md once (the groups not rendered, the four-column rule removed, the grid layout's two-column rule removed, the four-column point at T instead of 2 × T, the grid measure read in the decided layout, the grid `<dt>`'s `margin-block-end` removed, a divider added as a `border-block-end` on each group) and record them in `specs/013-data-display/reviews/phase-1/plants.md`, with T021's step 1 and before its gate runs.
- [x] T021b [US1] O3-01 (operator round 3, `specs/013-data-display/reviews/phase-1/round-3.md`; landing L1-01): in `packages/elements/test/facts.test.ts` (in-process harness, so Stryker's mutants of the cleanup meet it), the removed-sheet body of contracts/checks.md § Oracles: a sheet removed from the document does not re-decide its layout on a window resize (after `window.dispatchEvent(new Event("resize"))` and the layout wait, the removed sheet's `<dl>` class list is the one it had at removal), paired with the same dispatch on a connected sheet re-running the pass. Then delete the two equivalent-mutant records in `packages/elements/src/ocelle-facts.ts:220-233` that the test now covers: the `BlockStatement` record on `disconnectedCallback` and the `StringLiteral, CallExpression` record on `window.removeEventListener("resize", …)` (comment lines only; no other source change). The shipped code already cleans up, so the test cannot be red: show that it bites by removing the cleanup by hand, once with the `disconnectedCallback` body emptied and once with the `removeEventListener` line removed (the test must fail each time, and pass on the restored source), and record both runs in the fix note. `gate:mutation` on the changed lines leaves no survivor.
- [x] T021c [US1] O3-02 (operator round 3; landing L1-02): `packages/elements/src/ocelle-facts.ts:309`, remove the redundant `size >= threshold &&` operand from the `cols-2` toggle and delete its `ConditionalExpression` record (line 308); the other `ConditionalExpression` records stay. Behaviour-neutral: no test changes, the existing tests pass unchanged, and `gate:mutation` on the changed lines leaves no survivor (record the result in the fix note).
- [x] T021d [US1] O3-03 (operator round 3; landing L1-03): `gates/stylelint/token-only.ts:286`, complete the `StringLiteral` record's reason: `classify()` (through `functionRaw`) also reads the property for `grid-template-columns` and `transform`, so the reason names those reads too and states why the record still holds with them. Comment only; no code or test changes.

**Checkpoint**: `tdd-check.sh 1` reports `pass`; quickstart steps 1 to 6 pass for facts.

---

## Phase 2: User Story 2 - An empty or loading panel without classes (Priority: P2)

**Goal**: `ocelle-empty-state`, covering:
- US2 scenarios 1 to 11 (US2-7 with a stand-in until phase 3; US2-10 the `eyebrow` slot, US2-11 the body spacing);
- FR-020 to FR-026;
- its stories and baselines.

**Independent Test**: on the strict-CSP fixture, `ocelle-empty-state` passes these checks:
- with an `<h3>`, a body and a button written out of slot order, it exposes heading 3, paragraph, button in slot order;
- `variant="panel"` has a larger padding and gaps and a lighter weight;
- empty and hidden parts add no gap;
- the gates pass.

### Scaffold

- [X] T022 [US2] Scaffold commit, recorded by `scaffold.sh 2`:
  - `packages/elements/src/ocelle-empty-state.ts` with `define`, `@tagname`, `variant` (`"panel" | undefined`, `@default undefined`) and an empty `render()` (the `eyebrow` slot, like the other slots, arrives with the template in green);
  - its exports in `src/index.ts`, `src/browser.ts` and `package.json` (`./ocelle-empty-state.js`);
  - no test file.

### Inventory (operator step, before the red tasks)

- [x] T022a [US2] Operator step, recorded by the planner: the `.sk-empty-state` modifiers and states with counts (role names only) recorded in the R-11 table of `specs/013-data-display/research.md` in a documentation commit of its own, before T026 is written. A gap goes to the operator; while the family is pending, T026's mapping statements and T028 are blocked. Done: recorded from `specs/013-data-display/sources/013-inputs.md` Part A; its open questions (IQ-06 to IQ-11) were decided by the operator on 2026-11-14 (`specs/013-data-display/reviews/analysis/inputs-decisions.md`), and the rows carry the decisions.

### Tests (red, one commit, test files only)

- [X] T023 [P] [US2] Driver additions `pressTab()` and `focused()` (contracts/checks.md § Driver additions), in the `Driver` interface, both harnesses and their tests.
- [X] T024 [US2] `packages/elements/test/scenarios/empty-state.ts`, with the element-only assertions of contracts/checks.md § Bodies that the platform alone could pass:
  - US2 scenarios 1 to 6 and 8 as shared bodies:
    - US2-1 with consumer markup out of slot order;
    - US2-2 with the heading's geometry in the column;
    - US2-3/US2-4 read R-04's padding, gaps and weights (600 vs 500) in one body each;
    - US2-6 asserts the button's position in the actions part, paired with no added tab stop;
    - US2-8 checks forced colours.
  - US2-7 with a plain stand-in element in `visual` (phase 3 extends it).
  - The present-parts bodies (heading only, actions only, visual plus text: the first and last present parts at the padding edge, each gap R-04's).
  - Slots filled and emptied after first render.
  - US2-9, hidden slotted content: a hidden action; `hidden` removed; a hidden only-visual; whitespace changed to words.
  - Several actions at 320 px, with a long heading and a long body in the same element: no page overflow, heading and body wrap between words inside the element's content box.
  - Unset `variant` writes no attribute.
- [X] T024a [US2] `packages/elements/test/scenarios/empty-state.ts` (continued), with the oracles of contracts/checks.md:
  - US2-10, the `eyebrow` slot (FR-025, IQ-08 (c)): markup written with the eyebrow after the heading; the eyebrow first present part at the block padding, the eyebrow-to-heading gap, its computed type (`--ocelle-font-size-xs`, `--ocelle-font-weight-medium`, `--ocelle-color-ink-muted`, `text-transform: uppercase`), the AX order eyebrow, heading 1, paragraph, button, no role added; the panel's gaps in the same body;
  - US2-11, the body (FR-026, IQ-09 (b)): two `<p>` paragraphs with no user-agent margin and `--ocelle-space-2` between them, the first at the default-slot area's block start and the last at its end, the body-to-actions gap unchanged; one paragraph at both edges. The oracle reads the internal `.text` wrapper's box (or the first and last slotted element's edges against it), not `part="body"`, which is the whole column and holds the heading and the block padding before the first paragraph;
  - the eyebrow present-parts bodies: eyebrow only, eyebrow plus actions (the eyebrow-to-actions gap), in both variants;
  - the visual and eyebrow body (FR-025): a visual, an eyebrow, a heading and a body paragraph written in markup as heading, body, eyebrow, visual; the order visual, eyebrow, heading, body in the column (each part's block start below the previous part's block end) and in the AX tree; the visual-to-eyebrow gap `--ocelle-space-3`, panel `--ocelle-space-5`, in one body;
  - the eyebrow and text body (FR-025): an eyebrow and a body paragraph with no heading; the eyebrow at the block padding and the eyebrow-to-text gap `--ocelle-space-2`, panel `--ocelle-space-3`, in one body;
  - the inline-content body (edge case "Empty-state body with inline content", FR-026): the default slot holding a text run, an `<a>` and a text run directly gives three block boxes, one below the other, separated by `--ocelle-space-2`; paired in the same body with a single `<p>` holding the same text and link on one line box.
- [X] T025 [P] [US2] Test files for the empty state:
  - `packages/elements/test/empty-state.test.ts` (in process) and `packages/elements/test/browser/empty-state.test.ts` (fixture) over T024;
  - `packages/elements/test/entry-empty-state.test.ts`;
  - `entry-root.test.ts` extended.
- [X] T026 [P] [US2] `packages/elements/test/node/readme.test.ts`: statements for the `ocelle-empty-state` section, one assertion per statement:
  - the heading rule (the consumer's own heading, no `level`, FR-056);
  - slots, variants, the cascade note, the loading panel, tokens read.

  Also the empty-state mapping-row statements (FR-058), one per row of research R-11's `.sk-empty-state` inventory (T022a), each keyed by the row's role name, with no `sk-` string in test code (operator decision I1, research R-11). If the inventory is missing or has a gap, stop and ask the operator.
- [X] T026a [US2] `packages/elements/test/node/readme.test.ts`: statements for the empty-state input decisions, one assertion per statement:
  - the `eyebrow` slot: a short line above the heading, not a heading, its type and gaps (IQ-08 (c));
  - the body: margins reset, `--ocelle-space-2` between children, each a block, so inline content goes in one `<p>`; a page rule on slotted content wins (IQ-09 (b));
  - the panel heading at 500, #510's text (IQ-06 (a));
  - no card, border or busy look on the element; a card around it is the consumer's; the dashed card belongs to the #509 family (IQ-07 (a));
  - a focusable loading heading is the consumer's `<h2 tabindex="-1">` in `heading` with the bar in `visual` (IQ-11 (b));
  - the updated empty-state mapping rows of research R-11 ("empty-state panel", "empty-state refusal", "empty-state heading paragraph", "empty-state body multiple", "empty-state busy", "empty-state message", "empty-state card", "empty-state card dashed", "empty-state ops card", "empty-state focus target"), keyed by role name with no `sk-` string in test code.
- [X] T027 [P] [US2] `storybook/test/integration/elements-stories.test.ts`: the empty-state stories of research R-08, present, in light and dark, with no outside request; under reduced motion, no running animation, using the same clock-timed fresh-load read. As in T011, the animation positive arrives in T044; until then the check is paired with the `matchMedia` assertion only.
- [X] T028 [US2] Red commit of T023 to T027 with T024a and T026a. Run `red.sh 2 phase`, and check the red log per body.

### Implementation (green)

- [X] T029 [US2] `packages/elements/src/ocelle-empty-state.ts` (R-04, data-model § `ocelle-empty-state`):
  - `<div part="body">` with the visual, heading, text and actions wrappers;
  - a part is present only if an assigned element's computed `display` is not `none` or it has non-whitespace text, recomputed on `slotchange` and by a `MutationObserver` (`hidden`, text);
  - absent parts are `display: none`;
  - per-part margins with the "last present part has no margin" rule;
  - the default and panel values of R-04;
  - `::slotted([slot="heading"])` weights;
  - the actions wrapper wraps;
  - `::slotted(ocelle-progress)` spans the column up to `--ocelle-measure-reading`;
  - no ground painted;
  - forced-colours rules; `:host([hidden])`.
- [X] T029a [US2] `packages/elements/src/ocelle-empty-state.ts` (research R-04, data-model § `ocelle-empty-state`):
  - the `eyebrow` slot and wrapper between the visual and the heading, with `has.eyebrow` from the same `slotchange` and `MutationObserver` rules;
  - `::slotted([slot="eyebrow"])` type (`--ocelle-font-sans`, `--ocelle-font-size-xs`, `--ocelle-font-weight-medium`, `--ocelle-color-ink-muted`, `text-transform: uppercase`, `margin: 0`);
  - the eyebrow's margins from R-04's table, with the internal class marking a following heading, in both variants;
  - the body: `::slotted(:not([slot]))` with `margin-block: 0`, the text wrapper `display: flex; flex-direction: column; gap: var(--ocelle-space-2)`.
- [X] T030 [US2] Regenerate and commit the manifest with the `ocelle-empty-state` declaration (slots `visual`, `eyebrow`, `heading`, default and `actions`).
- [X] T031 [US2] `storybook/stories/empty-state.stories.ts` (`title: "Elements/ocelle-empty-state"`): the stories of research R-08 except panel loading, which comes in phase 3.
- [X] T031a [US2] `storybook/stories/empty-state.stories.ts`: the refusal story with an eyebrow (an eyebrow, an `<h1>`, a sentence, a path with `data-ocelle-wrap="anywhere"`, an action) and the several-body-paragraphs story (research R-08). Their baselines are part of T032's `visual:update` run.
- [X] T032 [US2] Baselines: run `pnpm run visual:update` in the pinned container (`<n>` added, 0 changed, 0 removed) and commit `storybook/baselines/elements-ocelle-empty-state--*.{light,dark}.png`.
- [X] T033 [US2] Documentation:
  - `packages/elements/README.md`: the `ocelle-empty-state` section and the `.sk-empty-state` mapping rows;
  - `packages/elements/CHANGELOG.md` entry.
- [X] T033a [US2] `packages/elements/README.md`: the empty-state statements of T026a (the `eyebrow` slot, the body spacing and its inline-content note, the panel heading, the consumer's card, the focusable loading heading) and the updated `.sk-empty-state` mapping rows of research R-11; the `packages/elements/CHANGELOG.md` entry names the `eyebrow` slot.
- [X] T034 [US2] Checks:
  1. Run the empty-state plants once: the "last present part has no margin" rule removed and the `hidden` observer removed. Record them in `reviews/phase-2/plants.md`. The `::slotted(ocelle-progress)` plant is not run here: the stand-in is not an `ocelle-progress`, so the rule cannot match it; it runs in T052 against the real bar.
  2. Run `gate:manifest`, `gate:style-lint`, `gate:csp`, `gate:prefix`, `gate:test-lint`, `gate:contrast` (unchanged; US2-8 relies on the existing text rows), `gate:storybook-build`, `gate:visual`, `gate:axe`, `gate:plants`, then `gate:mutation -- --base <phase base>`, and record the summary lines.

- [X] T034a [US2] Run the empty-state plants for the input decisions once, with T034's step 1 (contracts/checks.md § CSS-only behaviours: the eyebrow type rule removed, the eyebrow's heading-dependent class ignored, the body `margin-block: 0` removed, the body gap removed), and record them in `specs/013-data-display/reviews/phase-2/plants.md`.

**Checkpoint**: `tdd-check.sh 2` reports `pass`.

---

## Phase 3: User Story 3 - A progress bar that names itself and respects motion (Priority: P3)

**Goal**: `ocelle-progress`, covering:
- US3 scenarios 1 to 15;
- FR-030 to FR-039;
- US2-7 with the real bar;
- the `token-only` translate and iteration-count allowance (R-10);
- the progress stories and the panel-loading story, with their baselines.

**Independent Test**: on the strict-CSP fixture, these hold with zero violations:
- `<ocelle-progress value="7" max="12" label="Tasks done">` exposes one progressbar named "Tasks done" with value 7, min 0 and max 12, and its fill is 7/12 of the track at once;
- the indeterminate bar sweeps for less than 5 s per loading episode, and not at all under reduced motion, where it shows the still mark.

### Spike (first)

- [X] T035 [US3] Spike before the scaffold, recorded in `specs/013-data-display/reviews/phase-3/spike.md`: the `valuetext` oracle among platform reads only (`locator.ariaSnapshot()`, CDP `Accessibility.getPartialAXTree`, other CDP reads) on an ElementInternals bar with `ariaValueText` (R-05). If none exposes it, stop: US3-3 goes to the operator.

### Scaffold

- [X] T036 [US3] Scaffold commit, recorded by `scaffold.sh 3`:
  - `packages/elements/src/ocelle-progress.ts` with `define`, `@tagname`, the properties of contracts/elements.md (`value`, `max`, `valueText`, `label`, `showLabel`, `size`, `ground`), each `| undefined` with `@default undefined`, and an empty `render()`;
  - its exports (`./ocelle-progress.js`);
  - no test file.

### Inventory (operator step, before the red tasks)

- [x] T036a [US3] Operator step, recorded by the planner: the `.sk-progress` modifiers and states with counts (role names only) recorded in the R-11 table of `specs/013-data-display/research.md` in a documentation commit of its own, before T043 is written. A gap goes to the operator; while the family is pending, T043's mapping statements and T045 are blocked. Done: recorded from `specs/013-data-display/sources/013-inputs.md` Part A; its open questions (IQ-10 to IQ-15) were decided by the operator on 2026-11-14 (`specs/013-data-display/reviews/analysis/inputs-decisions.md`), and the rows carry the decisions.

### Tests (red, one commit, test files only)

- [X] T037 [P] [US3] Driver additions from contracts/checks.md § Driver additions, with their tests:
  - `reducedMotion(mode)`: the `emulateReducedMotion` command through `page.emulateMedia` in `emulate()`, reset in each progress test file's `afterEach`. Its test in `packages/elements/test/commands.test.ts` asserts `matchMedia` after the command, after a later `emulateForcedColors`, and after the reset.
  - `animations(id)`, returning kind, target part, property, play state and end time.
  - AX value properties (`value`, `valuemin`, `valuemax`, `valuetext`) on `AxNode`, `axNodes` and `axSubtree`; `value`, `valuemin` and `valuemax` tested present and absent on a native `<progress>` and an ElementInternals bar; `valuetext` reads `""` in Chromium and is not asserted (T035).
  - `replace`, `remove`, `frames`.
  - The loading-episode reset in `mount`.
- [X] T038 [US3] `packages/elements/test/scenarios/progress.ts`, with the oracles of contracts/checks.md § Oracles (Progress):
  - US3 scenarios 1 to 15 as shared bodies:
    - US3-2 reads 75% at once, with `animations()` empty;
    - US3-3 proves the wiring, not the exposure (operator decision on T035, (a)): with `value-text="7 of 12"` and `show-label`, the visible `value-text` part reads "7 of 12", paired with the progressbar's name, value, min and max read from the accessibility tree; no `internals` reflection read;
    - US3-4 pairs absence with a determinate read;
    - US3-5 reads reduced motion first, inside the first iteration, then motion, plus the still mark at 30% to 70%;
    - US3-6 also sets `value=""`, `value="   "` and, after a value, the property to `null`: each indeterminate (no current value, not a 0 fill), paired with a determinate read, nothing thrown (FR-032);
    - US3-7 checks the `accent-strong` edge;
    - US3-8 checks forced colours (system colours that differ, fill `box-shadow: none`);
    - US3-9 checks 8 px and 4 px, and with `show-label` the label's box above the track at the default size and beside it on the same line at compact size, in one body (FR-035); its compact value-text placement is T038a's;
    - US3-10 checks the host `aria-label` override and visible label figures; its value-text placement is T038a's;
    - US3-11 checks the unnamed bar;
    - US3-12 checks the end time below 5000 ms and the still mark after `finished`;
    - US3-13 checks `ground="tinted"`;
    - US3-14 is the shared episode with `replace`;
    - US3-15 is a new episode after `remove` + `frames(2)`.
  - SPEC-2-02's bodies: `value-text` ignored while indeterminate and kept when clamped, read on the visible `value-text` part with `show-label` (absent while indeterminate, "7 of 12" when clamped), paired with a determinate bar's part read.
  - The value-removed body: a 40% mark, no `CSSTransition`, with and without reduced motion.
  - The determinate-then-indeterminate within one task after the window.
  - The right-to-left indeterminate and determinate bodies.
  - The 320 px sweep body: page scroll width sampled at several animation times.
  - The compact long-label body at 320 px: `size="compact"`, `show-label` and a long label; the track's inline size is at least the `--ocelle-measure-cell` value, the label wraps between words, and the page scroll width equals the viewport width.
  - The no-tab-stop body (FR-039): from a button before the bar, one Tab focuses the button after it (`pressTab`, `focused`), paired with the bar's named progressbar node in the same body.
  - Unset properties write no attribute (`size`, `ground`).
- [X] T038a [US3] `packages/elements/test/scenarios/progress.ts` (continued), with the oracles of contracts/checks.md § Oracles (Progress):
  - in US3-10's body: at the default size with `value-text`, the label's inline start at the track's and the value text's inline end at the track's, both above the track, mirrored under `dir="rtl"` in the same body (FR-035, IQ-13 (b));
  - in US3-9's body: on the compact bar with `value-text`, the value text's box on the same line after the track's inline end;
  - the fallback-text body (FR-039, IQ-15 (b)): "7/12" inside a named bar has no client rect, is absent from `innerText` and from the AX tree after upgrade, paired with the bar's progressbar node named "Tasks done" with value 7;
  - the inline-placement body (IQ-12 (a)): the host's computed `display` is `block`; a bar given `display: inline-block; inline-size: 12rem` by a page rule sits on the paragraph's first line at 12rem.
- [X] T039 [US3] `packages/elements/test/scenarios/empty-state.ts`: extend US2-7 to a real `ocelle-progress` in `visual`:
  - above the heading at the panel's visual-to-heading gap;
  - the screen reader reaches the bar first;
  - the bar spans the column up to `--ocelle-measure-reading`.
- [X] T040 [P] [US3] Test files for progress:
  - `packages/elements/test/progress.test.ts` (in process) and `packages/elements/test/browser/progress.test.ts` (fixture) over T038;
  - `packages/elements/test/entry-progress.test.ts`;
  - `entry-root.test.ts` extended.
- [X] T041 [P] [US3] The pairing test in two halves (contracts/checks.md § Contrast):
  - `packages/elements/test/node/progress-pairs.test.ts`: from `src/ocelle-progress.ts`, the mark and edge token is `color-accent-strong`, the track `color-inset`, and the boundaries `color-control-border` and, under `ground="tinted"`, `color-accent-strong`. Against `packages/tokens/src/source.ts` and `packages/tokens/contrast/pairs.json`: `color-focus` `ref` is `color-accent-strong` in both themes, and each (token, ground) pair the README assigns is a `checked` row.
  - `packages/elements/test/build/build.test.ts`: `dist/ocelle-progress.js` uses the same tokens.
- [X] T042 [P] [US3] `gates/test/` `token-only` unit tests for the R-10 phase 3 allowance, plus the `gates/README.md` statement test:
  - `translateX(<percentage>)` in `transform` and a bare integer `animation-iteration-count` pass;
  - other functions, non-integers and other properties are findings.
- [X] T043 [P] [US3] `packages/elements/test/node/readme.test.ts`: statements for the `ocelle-progress` section, one per statement:
  - naming (`label` or host `aria-label`, an unnamed bar is a consumer error, axe does not check the name);
  - the value rules and `value-text`;
  - the library's tests do not verify the value text's exposure to assistive technology (operator decision on T035, (a));
  - the bounded sweep, once per loading episode, with the 238 ms `--ocelle-motion-base` limit;
  - reduced motion; no fill transition; `ground="tinted"`;
  - the busy vocabulary (FR-033); tokens read.

  Also the progress mapping-row statements (FR-058), one per row of research R-11's `.sk-progress` inventory (T036a), each keyed by the row's role name, with no `sk-` string in test code (operator decision I1, research R-11). If the inventory is missing or has a gap, stop and ask the operator.
- [X] T043a [US3] `packages/elements/test/node/readme.test.ts`: statements for the progress input decisions, one assertion per statement:
  - a bar named after a nearby heading takes the heading's text as `label` (IQ-10 (a));
  - a `role` or `tabindex` on the host replaces or alters the progressbar, so set neither; a focusable loading heading goes in the empty state (IQ-11 (b));
  - the host is a block; to place a bar inline, set its `display` and inline size from outside (IQ-12 (a));
  - the value text sits at the inline end of the label row (IQ-13 (b));
  - the label is text only, with no slot (IQ-14 (a));
  - text inside the element shows only before upgrade and is neither shown nor exposed after it (IQ-15 (b));
  - the updated progress mapping rows of research R-11 ("progress meta", "progress label", "progress labelled by heading", "progress fallback text", "progress heading", "progress inline", "progress grid layout"), keyed by role name with no `sk-` string in test code.
- [X] T044 [P] [US3] `storybook/test/integration/elements-stories.test.ts`: the progress stories and the empty-state panel-loading story of research R-08, present, in light and dark, with no outside request. Also:
  - each motion read on its own fresh story load within the first iteration: without reduced motion, a running animation on the indeterminate story, guarded by `currentTime` under 1400 ms; under reduced motion, no running animation, timed by `performance.now()`, with `matchMedia("(prefers-reduced-motion: reduce)").matches` asserted first;
  - every progressbar in every story has a non-empty name, paired with a count above 0 in the progress and panel-loading stories.
- [X] T045 [US3] Red commit of T037 to T044 with T038a and T043a. Run `red.sh 3 phase` and check the red log per body.

### Implementation (green)

- [X] T046 [US3] `packages/elements/src/ocelle-progress.ts` (R-05, R-06, data-model § `ocelle-progress`):
  - ElementInternals:
    - `role="progressbar"`;
    - `ariaValueMin` `"0"`, `ariaValueMax` the effective max (100 when `max` is not finite and above 0);
    - `ariaValueNow` the value clamped to [0, max], or null when indeterminate (absent, empty or whitespace attribute, null, or not finite);
    - `ariaValueText` only while determinate;
    - `ariaLabel` from `label`; a host `aria-label` overrides it.
  - Parts `track`, `fill`, `label`, `value-text` (the last two `aria-hidden="true"`, shown with `show-label`).
  - Fill width set in `updated()` through the CSSOM, with no transition.
  - Track `overflow: clip`, sizes 8 px / compact 4 px.
  - `accent-strong` inset edge; `ground="tinted"` boundary.
  - Indeterminate sweep:
    - `translateX` keyframes, mirrored for right-to-left;
    - duration `calc(var(--ocelle-motion-base) * 7)`, iteration count 3;
    - the loading-episode start kept on `document` under `Symbol.for("ocelle.progress.sweepStart")` and applied through `startTime`;
    - the episode ends when no indeterminate bar is connected at the next frame.
  - The still mark (inset 30%, 40% wide) under reduced motion and after the sweep.
  - Forced-colours rules; `:host([hidden])`.
- [X] T046a [US3] `packages/elements/src/ocelle-progress.ts` (research R-05, R-06, data-model § `ocelle-progress`):
  - `:host { display: block }`;
  - the label row at the default size as `display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--ocelle-space-2)` with the value text's `margin-inline-start: auto`; the compact row in the order label, track (`flex: 1`), value text;
  - no `<slot>` in the shadow root, so light-DOM content is not rendered or exposed after upgrade.
- [X] T047 [US3] `gates/stylelint/token-only.ts`: the R-10 phase 3 allowance (`translateX(<percentage>)`, integer `animation-iteration-count`), its plants in `gates/plants/style-lint/`, and its `gates/README.md` row.
- [X] T048 [US3] Regenerate and commit the manifest with the `ocelle-progress` declaration (`aria-label` observed, not declared).
- [X] T049 [US3] Stories, following research R-08:
  - `storybook/stories/progress.stories.ts` (`title: "Elements/ocelle-progress"`): every bar named; no host `aria-label` story and no unnamed story; the "value text" story is a labelled bar (`label`, `show-label`) at the default size with a determinate `value` and `value-text`, and the "labelled compact" story carries a determinate `value` and `value-text`, so both label rows of FR-035 have a baseline (research R-08);
  - the panel-loading story added to `storybook/stories/empty-state.stories.ts`.
- [X] T050 [US3] Baselines: run `pnpm run visual:update` in the pinned container (`<n>` added, 0 changed, 0 removed). The indeterminate stories are captured on the still mark under reduced motion. Commit the new `storybook/baselines/*.png`.
- [X] T051 [US3] Documentation:
  - `packages/elements/README.md`: the `ocelle-progress` section (including that the library's tests do not verify the value text's exposure to assistive technology, T043) and the `.sk-progress` mapping rows;
  - `packages/elements/CHANGELOG.md` entry.
- [X] T051a [US3] `packages/elements/README.md`: the progress statements of T043a (naming after a nearby heading, no `role` or `tabindex` on the host, the block host placed inline from outside, the value text at the row's end, text-only labels, the fallback text) and the updated `.sk-progress` mapping rows of research R-11.
- [X] T052 [US3] Checks:
  1. Run each progress plant of contracts/checks.md once and record it in `reviews/phase-3/plants.md`:
     - still-mark inset removed;
     - `infinite` restored;
     - track clip removed;
     - track `min-inline-size` removed (the compact long-label body must fail);
     - inset shadow removed;
     - tinted rule removed;
     - forced-colours `box-shadow: none` removed;
     - right-to-left keyframes removed;
     - the shared start dropped;
     - the episode never ends;
     - a 200 ms fill `inline-size` transition added;
     - the `::slotted(ocelle-progress)` rule removed, against the real bar (run here only, not in phase 2);
     - a story's `label` removed.
  2. Run `gate:manifest`, `gate:style-lint`, `gate:csp`, `gate:prefix`, `gate:test-lint`, `gate:contrast` (unchanged), `gate:storybook-build`, `gate:visual`, `gate:axe`, `gate:plants`, then `gate:mutation -- --base <phase base>`. Timeout and CompileError mutants are reported and pass (#23).

- [X] T052a [US3] Run the progress plants for the input decisions once, with T052's step 1 (the value text's `margin-inline-start: auto` removed, which US3-10 must fail; a default `<slot>` added to the shadow root, which the fallback-text body must fail), and record them in `specs/013-data-display/reviews/phase-3/plants.md`.

**Checkpoint**: `tdd-check.sh 3` reports `pass`.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Goal**: the final records and a full-mission check. No new behaviour; every task here is exempt (documentation and
gate runs), and the phase review states why no test can fail for them.

- [X] T053 Final surface lists in `packages/elements/CHANGELOG.md` and `packages/styles/CHANGELOG.md` (FR-057): the four elements, their entry points, the `--ocelle-facts-stack-below` hook and the two facts value hooks, `base.css`'s two rules, and the `token-only` allowance. Mark this exempt (documentation).
- [X] T053a Add to T053's surface lists in `packages/elements/CHANGELOG.md` the operator's two additions, the `grid` value of `ocelle-facts`' `layout` and `ocelle-empty-state`'s `eyebrow` slot (IQ-05 (b), IQ-08 (c); constitution VII, MINOR). Mark this exempt (documentation).
- [X] T054 Review check, recorded in `specs/013-data-display/reviews/phase-4/coverage.md`: the three README mapping sections together cover every variant in research R-11's inventory, each with a row that names the element and variant, the consumer's remedy, or "not this mission" with the operator's decision, with each row's `.sk-*` family name checked here, since the readme tests key the rows by role name only (SC-001, operator decision I1; the rows themselves landed red first in phases 1 to 3). A gap goes to the operator. Mark this exempt.
- [X] T055 Run quickstart.md steps 1 to 7 on the whole mission, one heavy job at a time. `gate:storybook-build`, `gate:visual` and `gate:axe` must pass on all the mission's stories (SC-003, FR-051), and the summary lines are recorded in `specs/013-data-display/reviews/phase-4/quickstart.md`. Mark this exempt.

**Checkpoint**: the phase 4 review approves; `summary.sh` follows in `/ocelle-run` step 4.4.

---

## Dependencies and parallel work

- **Phase order**: phase 1 → phase 2 → phase 3 → phase 4. Phase 2 uses phase 1's driver additions. Phase 3 extends
  T024's US2-7 (T039) and adds the panel-loading story to phase 2's stories file.
- **Within each phase**: spike, then scaffold, then the R-11 inventory step (T002a, T022a, T036a; an operator step, committed apart from the red commit), then red tasks. Red tasks marked [P] write different files and can be
  written in parallel, but land in one red commit. Green tasks run in order: element, lint allowance, manifest,
  stories, baselines, docs, checks.
- **Parallel examples**:
  - Phase 1: T003, T006, T007, T008, T009, T010 and T011 are independent files; T008a and T010a are written with T008 and T010, whose files they extend.
  - Phase 2: T023, T025, T026 and T027; T026a with T026.
  - Phase 3: T037, T040, T041, T042, T043 and T044; T043a with T043.

## Implementation strategy

- **MVP**: phase 1, `ocelle-facts` with `ocelle-fact`, which replaces 8 rendered `.sk-facts` uses (34 text matches, research R-11) and sets the slotted-item
  convention the follow-on missions reuse.
- **Then**: the empty state, then progress, each folded after approval (`/ocelle-run` step 4.3).
- **Last**: phase 4 closes the records.
