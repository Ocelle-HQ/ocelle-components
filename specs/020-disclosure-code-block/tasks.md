# Tasks: Disclosure and Code Block (the last of #13)

**Input**: design documents in `specs/020-disclosure-code-block/`, approved at the plan gate on 2026-11-20 after three
plan-squad rounds (`reviews/plan/round-1..3/`, fork decisions in each `refute.md`) and `reviews/plan/operator-gate.md`:
- spec.md: FR-001 to FR-060, SC-001 to SC-008, US1 scenarios 1 to 23 and US2 scenarios 1 to 21, Edge Cases;
- plan.md: Constitution Check, Decisions, § Phases, Complexity Tracking;
- research.md: R-01 to R-12 and § Repository-wide notes;
- data-model.md;
- contracts/elements.md: the public surface, README statements and the digest convention;
- contracts/checks.md: bodies, platform-passable bodies, oracles, plants, driver additions, gates;
- quickstart.md;
- the tasks-gate analysis (`analysis-report.md`, head 33751a9) and the operator's decision "approve + fix all"
  (`reviews/analysis/operator-decisions.md`, 2026-11-20), resolved in these artifacts by
  `reviews/analysis/fixes-1.md`. The decision also approves plan.md's Complexity Tracking exception (the story-less
  states T008 and T028 leave out), the unnamed overflowing scroll block subject to T021a. The operator's T021a
  decision (`reviews/phase-2/operator-axe-decision.md`, 2026-11-21), "add exceptions and keep the story", gives that
  state the `ScrollUnlabelled` story and approves the `color-contrast-incomplete` exception entries of plan.md
  § Complexity Tracking for the overflowing scroll stories.

**Tests**: required. Constitution Principle VIII applies to every phase.

**Phase flow**: `base.sh`, then `scaffold.sh` (phases 1 and 2), then one red commit of test files only proven by
`red.sh`, then green, `tdd-check.sh` and an independent review. Operator decision I3: each phase's story tests (its
stories file and the story-test extension) are written in that phase's red commit, before green; `red.sh` keeps one
red record per phase.

**Red log**: checked per body, not only by exit code. A body that passes in the red run is a finding: its oracle is
changed before green (contracts/checks.md § Bodies the platform alone could pass).

**Expected values**: written by hand from the spec, data-model and research, never read from the source under test.
Token values come from `packages/tokens/src/source.ts` through the token names the plan names.

**Guard rules**:
- A "does not" assertion never stands alone: it shares its body with the positive outcome it guards, and every body
  whose event count is 0 ends with a positive control counted as exactly 1.
- Event counts are read after the element's `updateComplete` and then the driver's `settle()`, never after a bare
  `setTimeout(0)` (contracts/checks.md).
- Each plant of contracts/checks.md § Plants is run once by the implementer against the green source in a scratch
  copy and recorded in `reviews/phase-N/plants.md`; no plant is committed. A plant that does not bite stops the phase
  (stop-and-ask).

**Shared scenario bodies**: every browser scenario is written once in `packages/elements/test/scenarios/*.ts` against
the `Driver` interface and runs in process (`elements`, mutated) and on the built browser build on the strict-CSP
fixture (`elements-browser`); fixture runs also assert zero CSP violations, only allowed requests and no console
message.

**Environment**:
- Install first: `pnpm run setup:online` (this container had no `node_modules` at plan time). Browser runs set
  `OCELLE_CHROMIUM_PATH` as the elements README says.
- Baselines only from `pnpm run visual:update` in #10's pinned container under docker (`nohup dockerd >
  /tmp/dockerd.log 2>&1 &` as root; after a container restart, `pnpm run setup:online` again). No podman
  cross-check is possible here; the phase review records it. Conflicting baseline PNGs are regenerated, never
  hand-picked.
- One heavy job (browser suites, mutation, plants, visual capture) at a time. Never `git stash`. Never merge `main`.
- Plants locally: per contracts/checks.md § Plants; gate runs use `pnpm run gate:plants -- --affected <phase base>`
  (op 016) for the gates' own plants; CI runs the full set.

**Scope guards**: no change to `packages/elements/src/overflow-region.ts`, its contract
(`specs/009-workflow-layouts/contracts/overflow-region.md`), `src/focusable.ts`, `src/overlay.ts`, or any element,
story or test of missions 013 and 019 (SC-007, SC-008, plan Constraints). A need to change one stops for the operator;
a repository-wide problem is recorded in research.md § Repository-wide notes and reported through the orchestrator.

**Stop-and-ask points** (the implementer records the question in the phase review and does not work around it):
- **T001 (phase 1 spike)**: the summary is not a `DisclosureTriangle` with `expanded` in the CDP tree; a
  `#:~:text=` navigation does not open a closed shadow `details` in either harness; `style-lint` rejects
  `::-webkit-details-marker` (then the WebKit marker becomes a recorded limitation, the operator confirms).
- **T020 (phase 2 operator stop)**: always (FR-060).
- **T021 (phase 2 spike)**: R-07's copy, AX-text or break-position measure fails under the repository's pinned
  browser (FR-031, FR-032; the operator decides).
- **T021a (phase 2 axe measure)**: axe reports a serious or critical finding on the unnamed overflowing scroll block
  (the operator confirms that the state keeps the Complexity Tracking exception before T028). Raised and answered:
  `reviews/phase-2/operator-axe-decision.md` (2026-11-21), "add exceptions and keep the story".
- **Plants**: a plant that does not bite.
- **axe**: a new story would need a `storybook/a11y-exceptions.json` entry, other than the 36
  `color-contrast-incomplete` entries the operator approved for the overflowing scroll code-block stories
  (`reviews/phase-2/operator-axe-decision.md` and `reviews/phase-2/operator-digest-axe-decision.md`, 2026-11-21; plan.md
  § Complexity Tracking). Those are not a stop; a
  difference from their rows (another selector, rule or node, or an overflowing story without the result) is.
- **Baselines**: `visual:update` reports a changed or removed baseline of an existing story.
- **Mutation**: a shard over op 015's limit.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task).
- **[Story]**: the user story of the task (US1, US2).
- Paths are relative to the repository root.

---

## Phase 1: User Story 1 - A disclosure that keeps its state through server swaps (Priority: P1) 🎯 MVP

**Goal**: `ocelle-disclosure`: US1 scenarios 1 to 23, FR-001 to FR-017 and FR-050 to FR-057 for the disclosure, the
phase's driver additions (`findText`, `setProperties`), the disclosure stories and their baselines. Built on the
branch as cut from `main` (4911fd0b), with no merge (FR-060).

**Independent Test**: on the strict-CSP fixture, a closed and an open `<ocelle-disclosure>` with a summary and a panel
holding a link: click, Enter, Space, `open` property and attribute, `findText`, a morph and `element.click()` toggle
it with exactly the events of data-model.md § State transitions; the Chromium tree shows one named summary with
`expanded`; zero CSP violations; `gate:manifest`, `gate:style-lint`, `gate:storybook-build`, `gate:visual` and
`gate:axe` pass.

### Spike (first)

- [X] T001 [US1] Spike before the scaffold, scratch files only (outside `packages/`), recorded in
  `specs/020-disclosure-code-block/reviews/phase-1/spike.md`, per plan § Phases and research R-01, R-02, R-08:
  - a Lit 3 element with the R-01 shadow tree (no `delegatesFocus`): the summary's CDP role and `expanded` in both
    states, its name with a slotted text summary, with a host `aria-label` moved onto it, and with a slotted bare
    `<svg><title>` icon under an `aria-hidden` icon wrapper (the name is the summary text alone);
  - the R-02 handler order: a native `toggle` after a summary click, after `open = true`, after `[true, false]` and
    `[false, true]` in one task (`setProperties` shape), and the event count under the contracts/checks.md wait;
  - `#:~:text=` reveal of a closed shadow `details` in the in-process harness (Vitest browser iframe) and on a
    fixture page;
  - `summary::-webkit-details-marker` under `pnpm run gate:style-lint` on a scratch stylesheet.

  Any failure stops for the operator.

### Scaffold

- [X] T002 [US1] Scaffold commit (no behaviour; constitution VIII exemption stated in the phase review), recorded by
  `.specify/extensions/story/scripts/scaffold.sh 1`:
  - `packages/elements/src/ocelle-disclosure.ts` with `define("ocelle-disclosure", …)`, `@tagname ocelle-disclosure`,
    the declared property `open` (`boolean | undefined`, `@default undefined`) and an empty `render()`;
  - its exports in `packages/elements/src/index.ts`, `packages/elements/src/browser.ts` and
    `packages/elements/package.json` `exports` (`./ocelle-disclosure.js`);
  - no test file.

### Tests (red, one commit, test files only)

- [X] T003 [P] [US1] Driver additions `findText(word)` and `setProperties(id, name, values)` as contracts/checks.md §
  Driver additions specifies: declared in `packages/elements/test/scenarios/driver.ts`, implemented in
  `packages/elements/test/in-process.ts` and `packages/elements/test/browser/driver.ts`, with their own tests in
  `packages/elements/test/driver.test.ts` and `packages/elements/test/browser/driver.test.ts` (a plain `details`
  opened by `findText`; native `toggle` counted for `setProperties(…, [true, false])`).
- [X] T004 [US1] `packages/elements/test/scenarios/disclosure.ts`: one body per US1 scenario 1 to 23 (US1-7 as
  US1-7a, -7b, -7c; US1-19 as three bodies: light-DOM link, `ocelle-button`, nested summary), with the oracles of
  contracts/checks.md § Oracles (AX tree, find in page, forced colours `CanvasText` on `Canvas` and `Highlight` ring,
  RTL mirror by painted extent, first-line icon by the slot measure, motion read one frame after a pointer toggle,
  reflow at 320 px). Each "does not" paired; each platform-passable body carries its element-only assertion
  (contracts/checks.md table). US1-23: host `aria-expanded` `"true"` opens, `"false"` closes, another value changes
  nothing, the attribute is always removed from the host with no mirror, and `<ocelle-disclosure open
  aria-expanded="false">` upgrades closed with no event. A closed panel (US1-1, US1-3, US1-5; FR-008) is read by the
  contracts/checks.md § Oracles "Closed panel" oracle: `checkVisibility()` false for the panel's content, the content
  absent from the tab order and from the CDP tree; never `getClientRects().length === 0`, which Chromium's
  content-visibility skip does not give (R-08).
- [X] T005 [US1] `packages/elements/test/scenarios/disclosure.ts`: the FR and edge-case bodies of contracts/checks.md
  for the disclosure: host `display: block` containing summary and open panel (FR-003); marker not shown (FR-003); a
  panel click does not toggle and reaches a `document` listener (FR-004); `element.click()` toggles once and a
  `dispatchEvent(new MouseEvent("click"))` on the host toggles nothing (FR-004); summary border box at least 24 × 24
  CSS px (FR-014); hover background equals `--ocelle-color-hover-bg` while hovered and transparent otherwise
  (FR-014); `:state(open)` exactly while open (FR-011); focus out of a closing panel (FR-013); the moved
  `aria-labelledby`, `aria-describedby` and `title` with their mirrors, `cloneNode(true)` and a morph that removes a
  mirror (FR-007); the summary named from `.label` (FR-006, contracts/checks.md: `ariaLabelledByElements` is `[.label]`
  with no host label; a host `aria-label` clears it and names the summary; a host `aria-labelledby` wins over both;
  removing each restores the next, ending at `.label`); nested disclosures (Edge Cases); the empty summary with no
  name, the `.label` reference still set (story-less, Complexity Tracking); the chevron box `--ocelle-icon-size`
  square (FR-005).
- [X] T006 [P] [US1] Harness files: `packages/elements/test/disclosure.test.ts` (in process) and
  `packages/elements/test/browser/disclosure.test.ts` with `packages/elements/test/browser/fixtures/disclosure.html`
  (strict CSP, as the existing fixtures), each running every body of T004 and T005; `packages/elements/test/
  entry-disclosure.test.ts`: importing `src/ocelle-disclosure.ts` defines `ocelle-disclosure` and `ocelle-icon` and no
  other tag.
- [X] T007 [P] [US1] Node tests: `packages/elements/test/node/manifest.test.ts` asserts the `ocelle-disclosure` entry
  of contracts/elements.md (`open`; the moved attributes `aria-label`, `aria-labelledby`, `aria-describedby`, `title`
  and their four mirrors; slots `summary`, `icon`, default; event `ocelle-disclosure-toggle`; parts `details`,
  `summary`, `panel`; no CSS custom property; `aria-expanded` not listed as a property); `packages/elements/test/node/
  readme.test.ts` asserts the `ocelle-disclosure` section and each README statement of contracts/elements.md (by
  phrase); `packages/elements/test/node/changelog.test.ts` asserts the entry.
- [X] T008 [US1] `storybook/stories/disclosure.stories.ts` (`title: "Elements/ocelle-disclosure"`): Closed, Open,
  Focused (declared focus state), Hovered (declared hover state), LongSummary (288 px frame through a `data-story`
  rule in `storybook/.storybook/stories-layout.css`), ConsumerIcon, RightToLeft, Nested (research R-09); no `style`
  attribute; and the story-test extension under `storybook/test/` that #10's index rules apply to every new story,
  with the checks of contracts/checks.md § Story tests for every disclosure story: named summary; keyboard use, Tab
  to the summary, Enter and Space toggling it (SC-005); no running animation under reduced motion and without it, on
  load and one frame after a pointer toggle (SC-006); and for `LongSummary` the page scroll width 320 at a 320 px
  viewport (SC-002). The unnamed disclosure has no story (plan Complexity Tracking, approved at the tasks gate,
  `reviews/analysis/operator-decisions.md`).

### Implementation (green)

- [X] T009 [US1] `packages/elements/src/ocelle-disclosure.ts` (research R-01 to R-04, data-model § `ocelle-disclosure`):
  - open shadow root **without** `delegatesFocus`; `focus(options)` overridden to focus the summary; `click()`
    overridden to click the summary; no `guardHost`;
  - the R-01 template: `<details part="details">`, `<summary class="control" part="summary">` holding the `.icon-row`
    (labelled, never `bare`) with an `aria-hidden="true"` icon wrapper whose `icon` slot falls back to `ocelle-icon`
    `chevron-end` (closed) / `chevron-down` (open), the `.label` wrapper around the `summary` slot, and
    `<div class="panel" part="panel">` around the default slot; template text bindings only;
  - `open` `{ type: Boolean, reflect: true }`; render `?open=${this.open === true}`; the native `toggle` handler of
    R-02 (sync property, await `updateComplete`, dispatch `ocelle-disclosure-toggle` `{ open }` bubbles, composed, not
    cancelable, only when the final state differs from the last reported; last reported set at the first `updated()`);
  - focus rescue (R-02): in `willUpdate` on true → false, note whether the host's shadow-including focus is inside
    the panel (the host's root `activeElement` is the host and the summary is not the shadow root's active element,
    as `ocelle-list-detail.ts` reads it); in `updated`, focus the summary;
  - `MovedAttributes` for `aria-label`, `aria-labelledby`, `aria-describedby`, `title` onto the summary
    (`ariaLabelledByElements`, `ariaDescribedByElements` from `resolveIds`, re-resolved on connect); the summary's
    name from `.label` (R-01, R-03, phase 1 operator decision (a)): wherever the moved attributes change, the
    summary's `ariaLabelledByElements` is the host `aria-labelledby`'s resolved list if given, else `null` if a host
    `aria-label` is given, else `[.label]` (the wrapper around the `summary` slot, same shadow root); host
    `aria-expanded` read in `attributeChangedCallback`: `"true"` sets `open = true`, `"false"` sets `open = false`,
    any other value changes nothing; the attribute is removed from the host, no mirror;
  - `ElementInternals` state `open` exactly while open;
  - styles: `:host { display: block }`, `:host([hidden]) { display: none; }`; `iconSlotStyles`, `controlStyles`; the
    chevron box rule; `summary { list-style: none }` (and `::-webkit-details-marker` per T001); the R-04 tokens; hover
    inside `@media not (forced-colors: active)`; forced colours `summary.control { color: CanvasText;
    background-color: Canvas }`; no `transition` or `animation`.
- [X] T010 [US1] Manifest: `pnpm --filter @ocelle/elements run manifest`; commit
  `packages/elements/custom-elements.json` with the entry of contracts/elements.md, every list stated and every member
  described.
- [X] T011 [US1] Documentation: the `ocelle-disclosure` section of `packages/elements/README.md` with every README
  statement of contracts/elements.md (the open state is the attribute; listen to `ocelle-disclosure-toggle`; host
  `aria-expanded` maps onto `open` and is removed; no interactive summary content; nested disclosures by
  `event.target`; panel clicks reach the page, no host guard, no `delegatesFocus`; do not place a disclosure last in
  an `ocelle-dialog` or `ocelle-drawer` (research § Repository-wide notes); before upgrade; no animation; tokens read);
  `packages/elements/CHANGELOG.md` entry (MINOR) for `ocelle-disclosure`.
- [X] T012 [US1] Baselines: `pnpm run visual:update` in the pinned container under docker; it must print `(<n> added,
  0 changed, 0 removed)` with `<n>` twice the new stories; commit `storybook/baselines/elements-ocelle-disclosure--*.
  {light,dark}.png`. If CI's captures differ, regenerate, never hand-pick.
- [X] T013 [US1] Checks, one heavy job at a time:
  1. run each disclosure plant of contracts/checks.md § Plants once and record the results in
     `specs/020-disclosure-code-block/reviews/phase-1/plants.md`;
  2. `pnpm run gate:unit-tests`, `gate:typecheck`, `gate:lint`, `gate:test-lint`, `gate:style-lint`, `gate:csp`,
     `gate:prefix`, `gate:manifest`, `gate:contrast`, `gate:plants -- --affected <phase base>`, `gate:storybook-build`,
     `gate:visual`, `gate:axe` (no exception entry), then `gate:mutation` on the phase's changed source under op 015's
     shards;
  3. `git diff 4911fd0b -- packages/elements/src/overflow-region.ts specs/009-workflow-layouts/contracts/
     packages/elements/src/focusable.ts packages/elements/src/overlay.ts` and the same diff over mission 013's and
     019's element sources, stories and tests are empty (SC-007, SC-008 for phase 1, against its base 4911fd0b);
  4. record the Storybook gates' summary lines, the `visual:update` line and that no podman cross-check was possible
     in the phase review.
  Left to CI by the operator's CI-first decision (`reviews/operator-ci-first.md`): the full plant set (the affected
  selection is every plant), `gate:storybook-build`, `gate:visual` and `gate:axe` on the full Storybook, and
  `gate:mutation`. Run locally: the disclosure plants (step 1), the fast gates and the full unit tests (step 2), the
  scope diff (step 3, `notes.md` § Gates) and the records of step 4 (`notes.md`).

- [X] T014 [US1] Phase 1 landing, operator round 4. Op 022 (#64) fixed the focus trap on the integrated branch.
  Remove the obsolete closed-disclosure limitation from the `ocelle-disclosure` README section and remove only its
  fragment from `packages/elements/test/node/readme.test.ts`. Keep Op 022's existing native `details` cases for
  dialog and drawer. This mission's research § Repository-wide notes calls for the distinct composition where an
  actual `ocelle-disclosure` holding a link is the final control of an open `ocelle-dialog`. Add only that case:
  from the closed disclosure's summary, Tab wraps to the dialog's first focus stop. Demonstrate that the new
  assertion catches the pre-Op 022 focus walk in a disposable checkout and passes with the integrated code. Note
  in the round fix record that Op 022 already supplied the green production change. Run the focused README and
  browser cases and record their results.

- [ ] T015 [US1] Phase 1 landing, operator round 5. Commit the focused regression first: separately invoke
  `focus()` and `click()` on a newly created, disconnected `ocelle-disclosure` before its first render.
  Assert that both return without throwing and that the disclosure stays closed. Record the failure on the existing
  uninitialized render-root lookup, then make that lookup tolerate the missing root. Preserve the existing rendered
  summary focus and one-toggle behavior. Run the focused disclosure cases and record red and green evidence.

**Checkpoint**: `tdd-check.sh 1` reports `pass`; quickstart steps 1 to 4 pass for the disclosure.

---

## Phase 2: User Story 2 - A code block in the sans that wraps or scrolls, and shows digests in groups (Priority: P2)

**Goal**: `ocelle-code-block`: US2 scenarios 1 to 21, FR-001, FR-002, FR-020 to FR-035 and FR-050 to FR-057 for the
code block, the README § Element conventions "Digests" rule, the phase's driver additions (`copyShadow`,
`copyShadowRun`, `ariaSnapshot`), the code-block stories and their baselines.

**Independent Test**: on the strict-CSP fixture, a short block, a 200-character line in wrap and scroll mode at
288 px and 1280 px, and a `sha256:` digest: computed sans with tabular figures, page scroll width equal to the
viewport at 320 px in wrap mode, a tab stop and named group only while a scroll block overflows, the shadow copy and
AX text unbroken; zero CSP violations; the gates of phase 1 pass.

### Operator stop (first)

- [X] T020 [US2] Operator stop (FR-060, research R-12), before any phase 2 work: the orchestrator reports to the
  operator whether mission 019 is on `main` and what it changed in `packages/elements/src/overflow-region.ts` and
  shared files; the operator decides how phase 2 proceeds (for example build on the branch as it is, or have
  `/ocelle-land` integrate first). Recorded alone in `specs/020-disclosure-code-block/reviews/phase-2/
  operator-019.md`, which names phase 2's base: the full sha phase 2 builds on (the phase 1 head if the branch is
  built on as it is, the integrated commit if `/ocelle-land` integrates first). That base is the branch base of
  SC-007 and SC-008 for phases 2 and 3 (T033, T041). No task merges `main`.
  Done: `reviews/phase-2/operator-019.md` (proceed on main without waiting for 019; phase 2's base
  `8ebbe439b08562e3832fbe996645d4ff714f0874`).

### Spike

- [X] T021 [US2] Spike, scratch files only, recorded in `specs/020-disclosure-code-block/reviews/phase-2/spike.md`:
  R-07's measures re-run under the repository's pinned browser in both harnesses (copy by triple click and by a range
  over the units, CDP StaticText join, `ariaSnapshot` of the shadow `pre`, break positions with `nowrap` groups and the
  `margin-inline-end` gap, base64url and base64 sweeps 60 to 300 px); R-06's `rtl` opening write
  (`scrollLeft` after `scrollTo({ left: -(scrollWidth - clientWidth), behavior: "instant" })`, `data-fade` `start`).
  A failure stops for the operator.
  Done: run and recorded in `reviews/phase-2/spike.md`; two measures failed (the whole-block copy's newline, the
  prefix breaking inside where it fits), answered in `reviews/phase-2/operator-spike-decisions.md` (Q1 (c): two
  whole-block copy bodies; Q2 (c): the prefix's threshold is its width plus `--ocelle-space-1`), applied to spec
  FR-031, FR-033, US2-10, US2-12 and SC-004, research R-06 and R-07, data-model.md and the contracts.
- [X] T021a [US2] Axe measure of the unnamed overflowing scroll block (analysis D1, operator decision at the tasks
  gate), scratch files only, before T028, recorded in `specs/020-disclosure-code-block/reviews/phase-2/
  axe-unnamed-scroll.md`: a scratch element (outside `packages/`) rendering research R-06's scroll structure
  (`.block > .region-frame > .region-box > .region-track > pre.code`) through the unchanged `OverflowRegion` module
  and `overflowRegionStyles`, holding a line longer than the box so it overflows, with no `label` and no host
  `aria-label`, mounted in a scratch story and run through the `axe` gate's runner, pinned axe-core and rule set in
  light and dark; record the box's role, name and `tabindex`, and every axe result (rule id, impact, target).
  - **axe reports no serious or critical finding**: T028 adds the `ScrollUnlabelled` story and its story test; the
    planner, through the orchestrator, removes the state from plan.md's Complexity Tracking row and records the
    result in research R-09 and spec FR-050 in a documentation commit of its own, before T028.
  - **axe reports one**: stop for the operator (Stop-and-ask points). On the operator's confirmation the planner
    records the measured rule in research R-09 in a documentation commit of its own, the state keeps the exception,
    and T028 adds no story for it.

  The scratch files and the scratch story are not committed.
  Done: run and recorded in `reviews/phase-2/axe-unnamed-scroll.md`. The unnamed box is a `generic` tab stop
  (`tabindex="0"`) with no name and has no violation. axe reports one serious result in light and dark:
  `color-contrast` incomplete (`elmPartiallyObscured`) on `x-code-block >>> .code`. A labelled control block gets the
  same result. This is a stop for the operator before T028.
  Decision: `reviews/phase-2/operator-axe-decision.md` (2026-11-21), "add exceptions and keep the story". It replaces
  the "axe reports one" branch above: T028 adds the `ScrollUnlabelled` story and its story test and the exception
  entries of plan.md § Complexity Tracking; the state has left the Complexity Tracking row; research R-09, spec
  FR-050 and FR-051 record the result.

### Scaffold

- [X] T022 [US2] Scaffold commit, recorded by `.specify/extensions/story/scripts/scaffold.sh 2`:
  `packages/elements/src/ocelle-code-block.ts` with `define("ocelle-code-block", …)`, `@tagname ocelle-code-block`,
  the declared properties `overflow` (`string | undefined`), `label` (`string | undefined`), `digest`
  (`boolean | undefined`), each `@default undefined`, and an empty `render()`; exports in `src/index.ts`,
  `src/browser.ts` and `package.json` (`./ocelle-code-block.js`); no test file.

### Tests (red, one commit, test files only)

- [X] T023 [P] [US2] Driver additions `copyShadow(id, inner)`, `copyShadowRun(id, inner, from, to)` and
  `ariaSnapshot(id, inner)` as contracts/checks.md § Driver additions specifies, in `test/scenarios/driver.ts`,
  `test/in-process.ts`, `test/browser/driver.ts`, with their own driver tests (sentinel cleared and replaced; a host's
  light text told apart from its shadow `pre`).
- [X] T024 [US2] `packages/elements/test/scenarios/code-block.ts`: one body per US2 scenario 1 to 21 with the oracles of
  contracts/checks.md (no monospace on `.code` and every unit, the host not read; the cap at
  `--ocelle-measure-reading` in px; reflow; the module's tab stop, role `group`, name, arrow keys, fades and handover;
  two whole-block copy bodies, the block last on the page copying exactly the trimmed digest and a block followed by
  a `<p>` copying the trimmed digest plus one `\n`, and a run of groups copies exactly; `ariaSnapshot` of the shadow
  `pre` equals `- text: <trimmed digest>` and the CDP StaticText join equals it; break positions; empty block one line
  tall; text changes after the mutation record, `updateComplete` and `settle()`). US2-8 as the visual-order body and the
  three line-start bodies (`rtl` at rest, `rtl` after a text change, `ltr` control). US2-12's oracle is
  contracts/checks.md's (§ Oracles "Break positions" and the US2-12 bullets), as aligned with R-07: one rect per
  group; one rect for the prefix only where its width plus `--ocelle-space-1` fits the line; more than one line only
  where the digest is wider than the `pre`; the named base64url and base64 sweep strings at every width from 60 to
  300 px (the base64url body guards the groups' `nowrap`, the base64 body does not); and the wide-prefix body
  (`ni:sha-256:` at 60 px, the prefix breaking inside). US2-6's handover is asserted with US2-21's oracle.
- [X] T025 [US2] `packages/elements/test/scenarios/code-block.ts`: the FR and edge-case bodies of contracts/checks.md
  for the code block: leading newline shown (FR-020); child markup adds no style and markup-like text stays text in
  wrap and digest mode (FR-020, PLAN-A11Y-SECURITY-1-005); `characterData` changes of the host's text and of a text
  node in a child `<b>` (FR-020); `overflow` parsing (`" SCROLL "` is scroll, `"auto"` and `""` are wrap) (FR-022);
  the run-time switch both ways leaving no tab stop, role or name, and the two focus-on-switch bodies with the `.block`
  ring (FR-025); a non-blank host `aria-label` over `label` in scroll mode and a blank one counting as absent
  (FR-026); prefix only, several colons (`ni:sha-256:`), no colon, remainder groups, astral code points
  (`x:ab😀cdef`), whitespace inside gives no groups (FR-029); the unnamed overflowing scroll block (also the
  `ScrollUnlabelled` story, T028) and the wrap-mode host `aria-label` (story-less, Complexity Tracking); a
  scroll block in a shrink-to-fit flex item (Edge Cases).
- [X] T026 [P] [US2] Harness files: `packages/elements/test/code-block.test.ts`, `packages/elements/test/browser/
  code-block.test.ts` with `packages/elements/test/browser/fixtures/code-block.html`, each running every body of T024
  and T025; `packages/elements/test/entry-code-block.test.ts`: importing `src/ocelle-code-block.ts` defines
  `ocelle-code-block` and no other tag.
- [X] T027 [P] [US2] Node tests: the `ocelle-code-block` manifest entry (`overflow`, `label`, `digest`; no slot; no event;
  parts `block`, `code`; no CSS custom property) in `test/node/manifest.test.ts`; the `ocelle-code-block` README
  section, its statements and the § Element conventions "Digests" paragraph of contracts/elements.md in
  `test/node/readme.test.ts`; the changelog entry in `test/node/changelog.test.ts`.
- [X] T028 [US2] `storybook/stories/code-block.stories.ts` (`title: "Elements/ocelle-code-block"`): Short,
  WrapLongLine (288 px frame), ScrollOverflowing, ScrollMiddle and ScrollEnd (overflowing, scrolled after render to
  half and to all of the box's range, as `ocelle-scroller`'s `OverflowingInTheMiddle` and `OverflowingAtTheEnd` do:
  fades at both ends, fade at the start only), ScrollFocused (declared focus state: the module's ring on the scroll
  box), ScrollFitting, Digest, DigestWrapping (288 px frame), DigestScroll, RightToLeft (wrap) and
  RightToLeftScroll, Empty (research R-09), and ScrollUnlabelled (overflowing, no `label`, no host `aria-label`;
  operator's T021a decision, `reviews/phase-2/operator-axe-decision.md`); with `data-story` frame rules in
  `storybook/.storybook/stories-layout.css`, no `style` attribute, every other scroll story with a `label`; and the
  story-test extension for the new stories with the checks of contracts/checks.md § Story tests: page scroll width
  320 at a 320 px viewport for every wrap-mode story (SC-002); for every overflowing scroll story, Tab reaches the
  scroll box and the arrow keys scroll it end to end with no pointer (SC-005); no running animation in every story
  under reduced motion and without it (SC-006); `ScrollUnlabelled` a tab stop with no role and no name.
  The wrap-mode host `aria-label` has no story (plan Complexity Tracking, approved at the tasks gate).
  With the stories, the axe exception entries of plan.md § Complexity Tracking (contracts/checks.md § Gates touched):
  in `storybook/a11y-exceptions.json`, one `color-contrast-incomplete` entry per overflowing scroll story
  (ScrollOverflowing, ScrollMiddle, ScrollEnd, ScrollFocused, RightToLeftScroll, ScrollUnlabelled) and theme, selector
  `ocelle-code-block >>> .code`, and for DigestScroll one per clipped group and theme, selector
  `ocelle-code-block >>> .group:nth-child(<n>)` for n = 11, 13, … 33 (operator decision
  `reviews/phase-2/operator-digest-axe-decision.md`, 2026-11-21), 36 in all, reason "clipped line of the code block's scroll box
  (`elmPartiallyObscured`)", the Prose entries' sunset verbatim and `plan` `specs/020-disclosure-code-block/plan.md`;
  run `gate:axe` on them and confirm each story-theme gives exactly that node (a difference goes to the operator);
  and the counts and excepted notes of `gates/test/integration/axe.test.ts` (notes and excepted 10 to 46, the
  story-theme runs, the excepted list in run order).
  Stop raised and answered (2026-11-21): the first axe run gave the planned `.code` node for six of the seven stories
  and 12 `.group:nth-child(<n>)` nodes per theme for DigestScroll (`reviews/phase-2/notes.md` § Stop for the
  operator); the operator chose 24 per-group rows (`reviews/phase-2/operator-digest-axe-decision.md`, applied to
  plan.md in 0df133c). Done: 36 code-block entries; `gate:axe` on the code-block stories and the Prose document gives
  `axe: 30 story-theme runs, 0 serious or critical; 46 notes (0 incomplete, 46 excepted)`, none stale.

### Implementation (green)

- [X] T029 [US2] `packages/elements/src/ocelle-code-block.ts` (research R-05 to R-07, data-model § `ocelle-code-block`):
  - text from `this.textContent ?? ""` at each render; a `MutationObserver` (`childList`, `characterData`,
    `subtree`) on the host from `connectedCallback` to `disconnectedCallback` calling `requestUpdate()`; no slot;
    text and units as Lit text bindings only, no whitespace inside the `pre` template;
  - wrap: `<div class="block" part="block"><pre class="code" part="code">…</pre></div>`; scroll (`overflow` trimmed
    and ASCII-lower-cased equals `scroll`): the module's `.region-frame` structure inside `.block` with the `pre` in
    `.region-track`, `data-fade` through `ifDefined`; one `OverflowRegion` created in the constructor with
    `box: () => this.renderRoot.querySelector(".region-box")`; `setLabel(this.label)` in `updated()`; `aria-label`
    in `observedAttributes` with `requestUpdate()`; no module option of mission 019;
  - digest (data-model § Digest derivation): prefix through the last `:`, groups of four code points, units as
    spans joined by `<wbr>`, groups `white-space: nowrap`, the gap as `margin-inline-end: var(--ocelle-space-1)` on
    every unit but the last;
  - the run-time switch to wrap with focus inside `.block` (other than `.block`): `.block` gets `tabindex="-1"`, is
    focused, and loses the attribute on its `focusout`; `.block:focus-visible` the token ring, `Highlight` in forced
    colours;
  - the `rtl` opening write: when the scroll box computes `rtl` and is a new box or the shown text changed, one
    `box.scrollTo({ left: -(box.scrollWidth - box.clientWidth), behavior: "instant" })` in `updated`; none under
    `ltr` and none after a resize;
  - styles: `:host { display: block; max-inline-size: var(--ocelle-measure-reading) }`, `:host([hidden])`;
    `.block` ground, padding, radius and the transparent border; `.code` margin 0, `font-sans`, `figures`,
    `font-size-md`, `line-height-relaxed`, `min-block-size: 1lh`, `direction: ltr; unicode-bidi: isolate;
    text-align: left`, `pre-wrap` and `anywhere` (wrap) or `pre` (scroll); `overflowRegionStyles`; forced colours.
- [X] T030 [US2] Manifest: regenerate and commit `packages/elements/custom-elements.json` with the entry of
  contracts/elements.md.
- [X] T031 [US2] Documentation: the `ocelle-code-block` section of `packages/elements/README.md` with every statement of
  contracts/elements.md (start text on the tag's line; markup not rendered; always label a scroll block; no host
  `aria-label` in wrap mode; shrink-to-fit hosts; the `ocelle-scroller` statements by reference; `rtl` opens at the
  line starts, not after a resize; print; no copy control, no highlighting; tokens read); the § Element conventions
  "Digests" paragraph verbatim from contracts/elements.md; `packages/elements/CHANGELOG.md` entry (MINOR).
- [X] T032 [US2] Baselines: `pnpm run visual:update` in the pinned container under docker, `(<n> added, 0 changed, 0
  removed)`; commit `storybook/baselines/elements-ocelle-code-block--*.{light,dark}.png`.
  Done: 28 added, 0 changed, 0 removed (432 baselines); no podman cross-check possible (`reviews/phase-2/notes.md`).
- [X] T033 [US2] Checks as T013 for the code-block plants (recorded in `reviews/phase-2/plants.md`) and the gates,
  `gate:axe` with no exception entry beyond T028's 36 (each reported as excepted, none stale);
  `git diff <phase 2 base> -- packages/elements/src/overflow-region.ts specs/009-workflow-layouts/contracts/` is
  empty (SC-007), `<phase 2 base>` being the sha T020's record names, never a fixed sha.
  Left to CI by the operator's CI-first decision (`reviews/operator-ci-first.md`): `pnpm test` (the full unit-tests
  gate), the full plant set (the affected selection is every plant), `gate:visual` and `gate:axe` on the full
  Storybook, the axe and visual integration tests and `gate:mutation`. Run locally: the fast gates with `gate:signoff`,
  the code-block plants (all bite), the affected plant run (stopped, full set), the phase's tests, `gate:axe` on the
  code-block stories and the Prose document (46 excepted, none stale) and the scope diff (`reviews/phase-2/notes.md`
  § Gates, `plants.md`).

**Checkpoint**: `tdd-check.sh 2` reports `pass`; quickstart steps 1 to 4 pass for both elements.

---

## Phase 3: Polish & Cross-Cutting Concerns

- [X] T040 README cross-checks in `packages/elements/README.md`: § Engines needs no floor change (record so in the
  phase review, or add the feature if one is newer than the floor); the WebKit line "WebKit is not measured for the
  layout elements either" adds `ocelle-code-block`'s scroll mode (its tab stop while it overflows, arrow keys, focus
  handover, the focus move on a switch to wrap and the `rtl` opening write untested there; research R-06 § WebKit);
  and, only if T001 found that `style-lint` rejects `::-webkit-details-marker`, the WebKit limitation names the
  disclosure's native marker (research R-01; otherwise the marker gets no line). The spec's FR-033, US2-12, FR-007,
  FR-008 and the Consumers reference were already aligned by the analysis fixes (`reviews/analysis/fixes-1.md`);
  T040 changes no spec text.
- [X] T042 Late-font caveat (phase 2 review R1-01; operator decision `reviews/phase-2/operator-late-font.md`): in the
  `ocelle-code-block` section of `packages/elements/README.md`, qualify "the start of every line is in view" as FR-021
  and contracts/elements.md now state it: the `rtl` opening write puts every line's start in view once the block has
  laid out in its font; on a page where the sans face arrives after the first layout, the line starts can end up out
  of view, so preload the sans face (`--ocelle-font-sans`) for `rtl` scroll blocks. No element code, story or test
  changes. The late font is listed as a known gap in the ALL PHASES DONE message (the operator's decision). The spec,
  research R-06, contracts/elements.md and contracts/checks.md § Driver additions (R1-03, R1-04) were aligned by the
  planner's documentation commit before phase 3; T042 changes no spec text. Review note (phase 3 review round 1,
  R1-01): Principle VIII overrides "no test changes" here. The review required `readme.test.ts` fragments for this
  caveat (with the "That holds once the block has laid out in its font" qualifier) and for T040's WebKit sentence;
  they were added test-first in the fix round (`reviews/phase-3/round-1-fixes.md`).
- [X] T041 Full quickstart run (`specs/020-disclosure-code-block/quickstart.md` steps 1 to 4) and SC-007/SC-008 diffs
  against the branch base T020's record names (no change to `src/overflow-region.ts`, its contract,
  `src/focusable.ts`, `src/overlay.ts`, or any file of missions 013 and 019's elements; phase 1's own range was
  checked against 4911fd0b by T013), recorded in `specs/020-disclosure-code-block/reviews/phase-3/checks.md`. Also
  remove or fill the empty `text` code block in `reviews/phase-2/plants.md` (lines 13-14; phase 2 review R1-07), the
  implementer's own record.

---

## Dependencies and parallel work

- Phase 1 → Phase 2 → Phase 3. Phase 2 starts only after T020's operator decision.
- T021a before T028: its result (and, if axe fails, the operator's answer) decides T028's story list and the planner's
  documentation commit of the result. Done: the operator's answer (`reviews/phase-2/operator-axe-decision.md`) adds
  `ScrollUnlabelled` and the exception entries to T028.
- Within a phase: spike → scaffold → red (T003/T023, T006/T026, T007/T027 in parallel; scenario files and stories
  after the driver additions) → green (element, then manifest, docs, baselines, checks).
- Phase 2 needs phase 1 only for shared driver files (no element dependency).

## Implementation strategy

MVP is phase 1: `ocelle-disclosure` stands alone and ships no dependency on mission 019. Phase 2 follows the
operator's decision at T020. Phase 3 is documentation and the final checks.
