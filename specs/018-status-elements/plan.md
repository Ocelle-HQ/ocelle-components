# Implementation Plan: Status Elements, `ocelle-status-indicator`, `ocelle-metric` and `ocelle-pill-tag`

**Branch**: `claude/007-status-elements` (feature `018-status-elements`) | **Date**: 2026-11-15 | **Spec**:
[spec.md](spec.md)

**Input**: Feature specification from `specs/018-status-elements/spec.md` (approved after spec check 3 and a final
fix); triage record `triage/018-status-elements.md`.

## Summary

Three status elements for #7, in `@ocelle/elements`, on mission 005's conventions: a status indicator whose solid dot
is never animated and whose ring pulses for at most 4.8 s per start (three iterations of `motion-pulse`), by CSS alone
(R-03, R-04); a metric rendered as
one term and its definition with an eyebrow label (R-05); and a pill tag that is a wrapping state mark when static
(R-06) and, when interactive, a native button or link on mission 012's control conventions and helpers, with
`ocelle-pill-tag-activate`, passthrough that follows mode changes (three additive `MovedAttributes` methods and an
additive `guardHost` parameter, R-08), a 24 px minimum target, and an ellipsis whose full text #16's `ocelle-tooltip`
shows while truncated (R-07, R-09). One
status vocabulary module serves the indicator and the pill (R-02). Tokens added: `size-indicator`, `motion-pulse`,
`line-height-snug`, `target-small`; 011's four eyebrow tokens are on `main` and used as merged (R-10). Implementation starts after 012, 008 and op 016 are on `main`; T001 rechecks every dependency fact, the merged
test driver and the task list against op 016 as merged (R-01), and phase 1 adds and self-tests the driver methods the
scenarios need (R-11). Per-phase plant runs are always the affected plants (op 016's `--affected` mode); the full
plant set is never run locally. Revised after plan squad round 1 (`reviews/plan/round-1/fixes-1.md`) and round 2
(`reviews/plan/round-2/fixes-1.md`: a `<details>` opened is not a start case, a static pill or metric keeps its
longest word in a flex row, the flex-row sibling rule, hover and active stories, the `Truncated` baseline's bubble, and
the metric's find-in-page limitation) and round 3 (`reviews/plan/round-3/fixes-1.md`: a one-line pill on the
surrounding text's baseline, a short static pill not stretched by a grid track or a flex column, `flex: none` on the
sibling recommended, the overflow of a capped long word beside a sibling, and a `Truncated` baseline with the ring and
no bubble). Amended after the analysis (`reviews/analysis/fixes-1.md`): decision 3 confirmed by the operator at the
tasks gate, § US3's interactive twins moved to phase 5, two more phase-1 measurements, a runner for the SC-001
bodies, phase 7's plant base, and the test tree's paths. Amended after the phase-1 recheck
(`reviews/phase-1/recheck.md`, operator decisions in `reviews/phase-1/operator-decisions.md`, changes in
`reviews/phase-1/design-amendments.md`): no `motion-pulse-count` token, the count a literal 3 (Q1); the pill on the slot
convention as merged, decision 15's override dropped (Q2); 21 stories kept (Q3); phase 1 adds only the four driver
methods `main` lacks (Q4); 011's tokens used as merged; decision 12's note moot; the merged driver's names; the
environment as found.

## Technical Context

**Language/Version**: TypeScript (strict), Node 26.13.0 and pnpm 12.16.1 as pinned (the container's Node 22 is not
used for gates; T001 found only Node 22.23.4 installed in this container, `reviews/phase-1/recheck.md` (f)).

**Primary Dependencies**: Lit 3 (pinned); mission 012's `packages/elements/src/control.ts`; mission 008's
`ocelle-tooltip`; mission 005's `naming.ts`, `icon-slot.ts`, `define.ts`. No new dependency.

**Storage**: N/A (no I/O, constitution I).

**Testing**: Vitest 5 browser mode on Chromium (`@vitest/browser-playwright`), projects `elements` (in process,
mutated by Stryker under `stryker.elements.config.json`), `elements-browser` (strict-CSP fixture pages),
`elements-node`; axe-core 4.14.0 through 006's rule selection; Storybook with 006's baselines and story axe; the test
driver as merged on `main` (005's, 012's, 009's, 008's, 011's and 013's methods in one `Driver`, 008's same-named
methods renamed at the merge), extended by four methods and self-tested in phase 1 (R-11). Browser runs use
`OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` (Chrome for Testing 153.0.8010.12; the
pinned Playwright's revision 1248 is not installed, T001 (f)).

**Target Platform**: evergreen browsers at the engine floor 012 and 008 set (Chromium 135, WebKit 17.4); behaviour
measured in Chromium only (R-14).

**Project Type**: library (web components) in a pnpm workspace.

**Performance Goals**: no script work while idle; one `ResizeObserver` and one `MutationObserver` per connected
interactive pill for truncation (R-09); per pill, in every mode, one `MutationObserver` for the slot convention's
label read, as `ocelle-button` has (R-06); none for indicators or metrics.

**Constraints**: tokens only (constitution II), strict CSP (IV), no I/O (I), WCAG 2.2 AA incl. 2.2.2, 2.4.3, 2.5.8,
1.4.13 (III), red-first and mutation-tested (VIII), plants run locally only in op 016's `--affected` mode (R-13).

**Scale/Scope**: 3 elements, 1 internal module, 3 additive helper methods and 1 additive helper parameter,
4 tokens, 21 stories with light and dark baselines, a phase-1 harness step of four driver methods.

## Constitution Check

*Gate: passes before Phase 0 and after Phase 1 design, with no exception (Complexity Tracking).*

| Principle | How this plan meets it |
|---|---|
| I. Names, events, no I/O, small interface, manifest | Tags `ocelle-status-indicator`, `ocelle-metric`, `ocelle-pill-tag`; the pill's user intent goes out as `ocelle-pill-tag-activate` (`bubbles`, `composed`, `cancelable`) beside the native `click`, on the same terms as `ocelle-button-activate` (operator decision SPEC-1-01). No I/O: observers only read layout. Every member in the manifest, mirrors and custom states included (contracts/elements-status.md, R-15). |
| II. Tokens only, brand rules | All values tokens, every declaration written to pass `gate:style-lint` (no `0s` delay, the ring grown by `inset` from `size-indicator`, the visually hidden label copy from keywords and 0, R-04, R-05); new tokens listed (R-10); no monospace (badge in Schibsted Grotesk with `--ocelle-figures`); the pill radius only on state pills, every pill variant being one (operator decision SPEC-1-04) and the indicator dot a state mark under the same reading (plan decision 3, confirmed by the operator at the tasks gate and written into the spec's Terms and FR-003, I1); `color-rule` never used; no ochre text or fill; `color-accent-strong` only as the resting border of an interactive pill on its state ground, as 002's rule for controls on state grounds requires (R-07). |
| III. Accessible by construction | Indicator: role `img` with its label or hidden, `label` the only name source (R-03), state never by colour alone (README), pulse ≤ 5 s and none under reduced motion (2.2.2, R-04), forced colours. Metric: term and definition, the term named by the label as written while it is shown uppercase, its written copy a second, invisible find-in-page match recorded as a limitation (R-05); a static pill or metric not shrunk below its longest word in a flex row (R-05, R-06). Pill: one native inner control on 012's conventions that fills the host, ARIA moved and no ID reference across the shadow root (R-07), a static pill inert for clicks and focus (R-06, R-07), focus and the tooltip kept across a mode switch (2.4.3, R-08), token focus ring kept inside a clipping container, a resting control border, a disabled look beyond text colour and system colours for a disabled link in forced colours, a pressed look kept distinct in forced colours (a `Highlight` fill, R-07), 24 px targets (2.5.8), full text by tooltip only while truncated, measured to the sub-pixel, and never needed while disabled (1.4.13, R-09). Contrast: every pair used already checked (R-06, R-07); axe on every story. |
| IV. Strict CSP, offline | Adopted stylesheets, the pill's interactive host sheet included (added and removed in `adoptedStyleSheets`, R-07); no inline style; every scenario also on the strict-CSP fixture; `gate:csp` on built output. |
| V. Storybook, behaviour tests | A story per variant and state in light and dark with baselines from 006's pinned container (R-12), the hover and active looks of the interactive pill and badge included through 006's pointer parameter, one pill per such story; the `Truncated` baseline showing the focus ring and no tooltip bubble, focused as 012's `StoryFocus` does so that it does not race 006's capture, the bubble proven by scenarios (R-12); interaction tests for `click` and `ocelle-pill-tag-activate` with every flag, order and every keyboard path (contracts/checks.md). |
| VI. Consumer-driven, own code | #7 and spec-kitty-design #498, #509, #524, #526; kitty-mission-ui's recorded attributes (SC-001). Nothing copied from Spec Kitty. |
| VII. Semver | Additions only (MINOR): three elements and entry points, an event, custom states, mirror attributes, tokens; three additive methods and one additive, defaulted parameter on internal helpers; changelog entries in both packages. |
| VIII. Test-first, non-vacuous | Each phase starts with one red commit holding its scenario bodies, node tests, story test entries and token expectations (I3), recorded by `red.sh`; new driver methods self-tested on stand-ins in phase 1 before any element, the methods already
on `main` used as merged (R-11); every "does not" paired with a positive assertion and a measured plant (contracts/checks.md § bodies), negatives read after the layout settles and the tooltip delay passes; each SC-001 row in the phase of its element, so each is seen failing; each truncation trigger proven alone; CSS-only pulse avoids timer mutants; element and token source mutated with 007's verdicts and op 015's limit, equivalent mutants recorded with reasons (R-09, R-13). |
| Licence and supply chain | No new dependency. |
| Workflow gates | No new gate; plants locally only in op 016's `--affected` mode (the affected plants of each phase, never the full set), CI's Plants check unchanged; T001 rechecks the tasks against op 016 as merged. |

Re-checked after Phase 1 design and after plan squad round 1 (rows II, III, IV, VII, VIII and Workflow gates
updated for the round's fixes and decisions): no violation. Re-checked after plan squad round 2 (rows III and V
updated; VIII unchanged, the pulse staying CSS-only by the operator's decision on PLAN-FRESH-2-001): no violation.
Re-checked after the phase-1 recheck amendments (row VIII updated for Q4; the pulse count a literal integer, which
`gate:style-lint` allows for `animation-iteration-count` since 013, so row II holds): no violation.

## Decisions the operator should see at the plan gate

Decisions 4, 6, 7, 9, 11 and 12 were revised or added after plan squad round 1; the operator's fork decisions of that
round are recorded in spec.md's header and in `reviews/plan/round-1/fixes-1.md`. Decisions 5 and 9 were revised and 13
and 14 added after plan squad round 2 (`reviews/plan/round-2/fixes-1.md`), whose fork decisions are in spec.md's
header too.

1. **Implementation waits** (R-01): for 012, 008 and op 016 on `main`, merged into this branch by `/ocelle-land`; T001
   rechecks every fact marked **recheck** in research.md, the merged test driver's signatures (012 and 008
   reconciled) and the task list against op 016 as merged, and stops on an interface difference.
2. **New tokens and names** (R-10): `size-indicator` 0.5rem (8 px dot; `size-dot` stays 7.2 px), `motion-pulse` 1600ms
   (0ms under reduced motion), `line-height-snug` 1.2, `target-small` 1.5rem (24 px; 012 has no 24 px target token).
   011's eyebrow tokens are on `main` (T001 (c)) and used as merged. No ring-extent token: the ring grows by `inset` to
   half of `size-indicator` (R-04). No iteration-count token (amended at the phase-1 recheck, operator decision Q1
   (a)): the planned `motion-pulse-count` is refused by the token generator and reported by brand rule (f) as merged,
   so the ring writes `animation-iteration-count: 3`, a bare positive integer that 013's `token-only` rule allows,
   and 3 × `motion-pulse` = 4.8 s.
3. **Indicator dot radius** (R-03): the dot uses `--ocelle-radius-pill` (a circle on a square box), read as a state
   mark under constitution II like the pill (SPEC-1-04); the pulse ring around it, part of the same mark, uses it too
   (R-04). Confirmed by the operator at the tasks gate (2026-11-16, analysis finding I1); the spec's Terms ("State
   pill") and FR-003 now say so. Built in phase 2 (T020).
4. **Indicator naming** (R-03; operator decision on PLAN-CORRECTNESS-1-005, (b)): `label` is the only name source; a
   host `aria-label` is unsupported and not read; US1-8 pins what Chromium exposes.
5. **Pill sizes** (R-06): default density `font-size-sm`, `line-height-tight`, padding `space-1` / `space-3`; compact
   `font-size-xs`, `line-height-snug`, `space-1` / `space-2`; `.icon-row` nested inside `.pill`, the icon scaled to
   `1lh`, so a pill with and without an icon has one height. A static pill's host is `inline-block`, its row capped
   and its text `overflow-wrap: break-word`, so a flex row does not shrink it below its longest word; the
   `inline-grid` host is the interactive host sheet's (operator decision on PLAN-FRESH-2-002, (a); R-06, R-07), and an
   interactive pill truncates through the merged `min-inline-size: 0` chain: the text span's `min-inline-size: 0`, the
   row's `max-inline-size: 100%` and the control's `--ocelle-target-small` minimum (FR-043), with no `min-inline-size:
   0` on the host, the control or the `.icon-row` and no `overflow-wrap: anywhere` on the disabled text (operator
   decision Q-P6-1 (a): no Chromium layout tells them apart from the merged rules). The static `.pill:not(.control)`
   is `inline-size: fit-content; max-inline-size: 100%; box-sizing: border-box`, so a grid track or a flex column that
   stretches the host does not stretch the visible pill (PLAN-FRESH-3-002); the interactive control still fills its
   host (012 FR-001).
6. **Interactive looks** (R-07; operator decisions on PLAN-A11Y-SECURITY-1-005 (a) and -006 (a)): an interactive
   `pill` has a resting `color-accent-strong` border, a badge its status border; hover takes the status colour on a
   pill's border and the status ground as a badge's fill; active and pressed add an inset `bar-width` cue, and a pressed
   badge keeps the status-ground fill; no state changes the box; no underline in link mode. In forced colours, where
   the inset cue and the status fill are dropped, a pressed and enabled control fills with `Highlight` and sets its
   text and border in `HighlightText` and `Highlight`, so pressed stays distinct from unpressed with the box unchanged.
7. **Disabled look** (R-07, settled): text and border `color-disabled-ink` on `color-disabled-bg` (a declared, exempt
   pair), and `GrayText` for a disabled pill of either mode in forced colours; no stop.
8. **`title` on an interactive pill** (R-09): moved and applied as 012 FR-004 says, so a truncated pill with a `title`
   shows both; the README tells hosts not to set it.
9. **Story count and plant shards** (R-12): 21 stories (`Pulse` folded into `Tones`, operator decision on
   PLAN-TESTABILITY-1-011, (b); `PillHovered`, `BadgeHovered`, `PillActive` and `BadgeActive` added after squad round
   2, PLAN-FRESH-2-004, since FR-004 and constitution V allow no exception), more than the headroom 012 estimates to the
   plant split count; if no plant design
   that does not grow with the story count has landed by T001, the run stops and asks. *Answered at the phase-1
   recheck* (operator decision Q3): T001 found 194 stories on `main` against a split count of 76 and no such plant
   design landed; the feature proceeds with its 21 stories (215 in all), and the shard question stays with the pending
   plant-design triage.
10. **012 helper extension** (R-08): three additive `MovedAttributes` methods, `capture()`, `release()` and
    `adoptMirrors()`, and an additive, defaulted `active` parameter of `guardHost`; no existing method or parameter
    changes; 012's tests stay as they are.
11. **Focus-ring clearance** (R-07; operator decision on PLAN-A11Y-SECURITY-1-007, (a)): an interactive pill's host is
    capped at `calc(100% - 2 * (focus-offset + focus-width))` and, so that the ring also clears the inline start, has
    one ring extent of inline margin; both come from an interactive-only adopted stylesheet. The margin is this plan's
    reading of option (a) (the cap alone keeps the inline-start ring outside the container), and it puts 5 px of space
    on each side of every interactive pill.
12. **`aria-pressed` on a link** (R-07; operator decision on PLAN-CORRECTNESS-1-007, (a)): no `:state(pressed)` in
    link mode. *Phase-1 recheck*: `ocelle-button` as merged on `main` sets `pressed` in button mode only
    (`ocelle-button.ts` 525-526, 012 plan decision 32, routed from this mission), so the pill's rule now matches it and
    the triage note to mission 012 this decision called for is moot (already done); no note is filed.
13. **`<details>` and the pulse** (R-04; operator decision on PLAN-FRESH-2-001, (b)): opening a `<details>` is not a
    start case; Chromium keeps the run going while closed and starts none on opening, the README says so and a
    scenario pins it; the pulse stays CSS-only, with no observer and no script state.
14. **Siblings of a truncating pill in a flex row** (R-09; operator decision on PLAN-FRESH-2-003, (a)): the element
    does not take the overflow for itself; the sibling keeps its size only if it is `flex: none` or the pill is given
    `flex: 1 1 0` by the host, which the README and the contract say and a check pins beside the shared-shrink twin.
    The README recommends `flex: none` (or `flex-shrink: 0`) on the sibling: `flex: 1 1 0` also stretches a fitting
    pill's visible box to the remaining width, since the control fills its host, which the README states and the
    check pins with the measured width (squad round 3, PLAN-FRESH-3-004).
15. **The pill's text baseline** (R-06, R-07; operator decision on PLAN-FRESH-3-001, (a), as amended at the phase-1
    recheck, operator decision Q2 (a)): a one-line pill, static or interactive, sits on the baseline of the text around
    it through the slot convention as merged (012 plan decision 33): the pill renders its text in the convention's
    label wrapper `<span class="label">` and puts `bare` on its `.icon-row` when the pill has no text, and
    `iconSlotStyles`' `.icon-row:not(.bare) > .label { align-self: baseline; }` gives the row, and the host, the
    text's first line as baseline with no position inside the row moved. The earlier override, `.icon-row {
    align-items: baseline } .icon-slot { align-self: flex-start }` in the pill's own styles, is dropped: it is the rule
    012 measured and rejected for its own row because it moves the items inside the row. Whether the pill has text is
    read as `ocelle-button` reads it (non-whitespace text in the default slot's flattened assignment, on `slotchange`
    and on text changes through a `MutationObserver` held for the element's lifetime). The § US3 and § US4 baseline
    bodies stay and measure the convention's rule on the pill, with plants in the pill's own source; T002 measures the
    pill box on the convention first (the enabled interactive label has `overflow: hidden`).
    The icon-only pill's box is pinned to T002's pixel values only on the strict-CSP fixture, where the real font
    loads; in process, whose token sheet drops `@font-face`, the § US3 body asserts only font-independent facts (the
    `bare` row, the pill's top above the surrounding text's, its height and width equal to the one-line pill's padding
    plus the icon's size), since the pin depends on the fallback font (operator decision on phase-4 round 2, O2-01;
    T044a). The triage note on
    `ocelle-button`'s offset this decision called for is moot: 012 decision 33 fixed it.
16. **The `Truncated` baseline** (R-12; operator decision on PLAN-FRESH-3-003, (b)): the story focuses its truncated
    pill after `updateComplete`, as 012's `StoryFocus` does, and its baseline shows the ring and no tooltip bubble; the
    bubble is proven by the § US5 scenarios alone, and the baseline does not depend on 008's bubble styling.

## Project Structure

### Documentation (this feature)

```text
specs/018-status-elements/
├── spec.md, triage.ref, checklists/requirements.md, reviews/spec/
├── plan.md              # this file
├── research.md          # R-01 … R-15
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── elements-status.md
│   └── checks.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
packages/elements/
├── src/
│   ├── status.ts                       # new, internal (R-02)
│   ├── control.ts                      # 012's; + capture(), release(), adoptMirrors(), guardHost `active` (R-08)
│   ├── ocelle-status-indicator.ts      # new
│   ├── ocelle-metric.ts                # new
│   ├── ocelle-pill-tag.ts              # new (imports ./ocelle-tooltip.js)
│   └── index.ts                        # re-exports
├── test/
│   ├── harness/{animation,text,layout}.test.ts + browser twin  # phase-1 driver self-tests (R-11)
│   ├── scenarios/driver.ts             # merged driver interface, extended (R-11)
│   ├── in-process.ts, commands.ts      # merged in-process driver and browser commands, extended (R-11)
│   ├── browser/driver.ts               # merged CSP-fixture driver, extended (R-11)
│   ├── scenarios/{status-indicator,metric,pill-tag,pill-tag-interactive,pill-tag-truncation,consumers}.ts
│   ├── {status,control,consumers,status-indicator,metric,pill-tag,pill-tag-interactive,pill-tag-truncation,entry-*}.test.ts
│   ├── browser/{status-indicator,metric,pill-tag}.test.ts + fixtures/*.html
│   └── node/{manifest,readme}.test.ts  # extended
├── custom-elements.json                # regenerated
├── README.md                           # three element sections
├── package.json                        # three entry points
└── CHANGELOG.md
packages/tokens/
└── src/source.ts, test/expected.ts, CHANGELOG.md   # R-10 (contrast/pairs.json unchanged: 011's tokens on main)
storybook/stories/{status-indicator,metric,pill-tag}.stories.ts
storybook/baselines/elements-ocelle-{status-indicator,metric,pill-tag}--*.{light,dark}.png
```

**Structure Decision**: the existing workspace layout; one module per element (005), shared code in internal
modules (`status.ts`, 012's `control.ts`).

## Phases (user stories) for `/speckit-tasks`

Every phase: one red commit (tests only: scenario bodies, unit and node tests, the phase's story test entries and
token expectations, contracts/checks.md rows) recorded by `red.sh`, then green; then the gates of contracts/checks.md
§ Gates per phase; plants with op 016's `--affected` mode against the phase's `base.sha` (phase 7: phase 2's; the
affected plants only, never the full set locally), recorded in `reviews/phase-N/plants.md`; the phase's baselines in
006's pinned container (dockerd as root; conflicting PNGs regenerated, never hand-picked); then mutation, alone.

1. **Setup and harness**: T001 (no behaviour; review states why no test could fail) rechecks R-01's facts on `main`
   (012, 008, op 016 merged; 011's state; `control.ts` exports; the tooltip's properties; the merged driver's
   signatures, 012 and 008 reconciled; rule (f) as generalised; the plant split count and story total, decision 9)
   and the task list against op 016 as merged (its command, `--list` output and record format), and records them in
   `reviews/phase-1/recheck.md`; spikes, recorded: R-04 (d) (`hidden`, a `display: none` ancestor, and the
   `<details>` behaviour to pin: closed for less and for more than one run, an indicator connected or given `pulse`
   inside a closed one), `moveBefore()` and `hidden="until-found"` (R-04 (b), (d)), R-05's term name with the visually
   hidden copy and a token-only hiding that find-in-page skips, R-08 (focus-visible after a programmatic focus,
   and the refocus order relative to the tooltip's slotchange), R-07's forced-colours pressed fill (an author
   `Highlight` background kept under forced-colours emulation), R-09's fractional measure under `text-overflow:
   ellipsis`; and, so that no pinned value is first measured in a red step, Chromium's tree for a host `aria-label`
   on a stand-in `ElementInternals` element of role `img` (US1-8), whether a tooltip trigger whose truncation
   begins while it is focused shows the tooltip then or only when focus re-enters (the README rule of T057), and the
   pill box's baseline on the slot convention as merged (decision 15 as amended);
   stops on any interface difference (T001 stopped on four, answered by the operator on 2026-11-19, Q1 to Q4). Then
   the harness step (red first): the four driver methods of contracts/checks.md § Test harness that `main` lacks
   (rows 1, 2, 7 and 8) with their self-tests on stand-ins, in both harnesses; rows 3 to 6 exist on `main` and are
   used as merged, with no new method and no self-test (operator decision Q4 (a)).
2. **US1 `ocelle-status-indicator`** (P1, MVP): `status.ts`; tokens `size-indicator`, `motion-pulse` (rule (f) covers
   it; the iteration count is the literal 3, decision 2); the element, its dot and ring with `--ocelle-radius-pill`
   (decision 3), entry point, manifest, README section, CHANGELOGs; stories `Tones` (with its `pulse` row),
   `Labelled`; scenarios US1-1 … US1-8 and § US1 bodies; SC-001's indicator row, with `test/consumers.test.ts`, the
   runner of the SC-001 bodies, extended in phases 3 and 4.
3. **US2 `ocelle-metric`** (P2): no token (011's eyebrow tokens are on `main`, used as merged; T001 (c)); the
   element, entry point, manifest, README, stories `Stack`, `Row`, `EmptyValue`;
   scenarios US2-1 … US2-7 and § US2 bodies (the flex row, find in page); SC-001's metric row.
4. **US3 static `ocelle-pill-tag`** (P3): token `line-height-snug`; the element in static mode, entry point, manifest
   (static members), README; stories `Statuses`, `Badge`, `Compact`, `WithIcon`, `LongTextWraps`; scenarios
   US3-1 … US3-8 and § US3 bodies (the stretched grid track and flex column, the long word beside a sibling, the
   baseline on the slot convention as merged, plan decision 15 as amended); SC-001's pill rows. Its bodies are static-only, compared with plain-element twins:
   this phase builds no interactive mode, so the interactive twins of the § US3 static click, static focus and seven
   names bodies, and the "became static" half of US3-7, are phase 5's (§ US4). Of 012 it uses only `linkHref`.
5. **US4 interactive pill** (P4): token `target-small`; `MovedAttributes.capture()`, `release()`, `adoptMirrors()`
   and `guardHost`'s `active` parameter (red first in `control.test.ts`, 012's cases untouched); button and link
   modes, activate event, passthrough and mode changes with focus, looks, the interactive host sheet; manifest (moved
   attributes, mirrors, `label` attribute, methods, events, states, `control` part); README rules; stories `Button`,
   `Pressed`, `Link`, `Disabled`, `Focus`, `PillHovered`, `BadgeHovered`, `PillActive`, `BadgeActive`; scenarios
   US4-1 … US4-12 and § US4 bodies (the interactive baseline included, and the interactive twins of § US3's static
   click, static focus and seven names, each beside its static twin).
6. **US5 truncation and tooltip** (P5): truncation state, fractional measure and observers, the tooltip wrapper,
   disabled wrapping; stories `Truncated` (focused after `updateComplete`, its baseline showing the ring and no
   bubble, plan decision 16, R-12; the phase-6 review checks both captured themes for that), `DisabledWraps`; scenarios US5-1 … US5-6 and § US5 bodies; the observer
   teardown mutants recorded as equivalent with their reason.
7. **Polish**: README cross-links and engines check, CHANGELOG review, quickstart run end to end, full gate set
   (plants still in `--affected` mode, against phase 2's base, `reviews/phase-2/base.sha`, so the run covers the
   whole feature's diff and not the docs-only diff of phase 7; recorded in `reviews/phase-7/plants.md` with that base),
   SC-001 to SC-006 checked.

## Complexity Tracking

No exception.
