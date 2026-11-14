# Implementation Plan: Data Display, First Slice (Facts, Empty State, Progress)

**Branch**: `013-data-display` (work on `claude/013-data-display`) | **Date**: 2026-11-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/013-data-display/spec.md` (approved at the spec gate after check 2,
2026-11-13), amended by the operator's fork decisions of squad rounds 1 to 3 (2026-11-13,
`reviews/plan/round-1/refute.md`, `reviews/plan/round-2/refute.md`, `reviews/plan/round-3/refute.md`), and by the
operator's decisions at the plan gate (2026-11-13, `reviews/plan/operator-gate.md`): FR-004 confirmed, #10 merged
into this branch and the plan updated for it, and the upstream inputs to follow. The analysis after tasks
(`analysis-report.md`) is resolved with the operator's decisions at the tasks gate (2026-11-13,
`reviews/analysis/operator-decisions.md`; resolution note `reviews/analysis/fixes-1.md`). The operator's inputs
(`sources/013-inputs.md`) and the operator's decisions on the questions they raised (2026-11-14,
`reviews/analysis/inputs-decisions.md`, IQ-01 to IQ-15) are applied here: `layout="grid"` (IQ-05 (b)), the empty
state's `eyebrow` slot (IQ-08 (c)) and body spacing (IQ-09 (b)), the progress value text at the row's inline end
(IQ-13 (b)), and README statements and tests for the rest. The second analysis after tasks (head d221dd5) is
resolved with the operator's decision at the second tasks gate (2026-11-14, "approve + fix all"; resolution note
`reviews/analysis/fixes-2.md`): wording and added test bodies only, with no new public surface. The Constitution
Check is unchanged by it.

## Summary

This mission adds four elements to `@ocelle/elements`, under 005's element conventions: `ocelle-facts` with its pair
child `ocelle-fact`, `ocelle-empty-state` and `ocelle-progress`. They replace kitty-mission-ui's three largest class
families, `.sk-facts`, `.sk-empty-state` and `.sk-progress`: 8, 25 and 14 rendered uses (47 in all) at
kitty-mission-ui `c994c8ea`. The triage record's "183 uses" were raw text matches in its source (34, 75 and 74; 34, 75
and 76 at that commit), not uses (R-11).

Measurements in this container ([spike/RESULTS.md](spike/RESULTS.md)) and squad rounds 1 to 3 drove these designs:

- **Facts semantics.** `ocelle-facts` renders the description list itself and places each `ocelle-fact` into its
  `<dd>` by manual slot assignment. This is the only structure that gives one clean Chromium description list and
  passes axe's `definition-list` and `dlitem` rules (R-01). So FR-004 can stand as written; see the decision at the
  plan gate. A hidden fact is no pair, before upgrade as after, and a fact's `lang` and `dir` reach its label.
- **Facts stacking.** The sheet stacks when its own inline size, as laid out in two columns, is below a token-sized
  threshold, with no `container-type` (a size container collapses to 0 px in dialogs and flex items). One measure
  pass, which alone owns the `stacked` class, decides; it runs from a `ResizeObserver` on the host and the threshold
  probes, after every render, on value text changed in place, and on window resize (PLAN-FRESH-3-001 (c),
  PLAN-FRESH-3-002). The measure never reads the stacked layout, so for those changes the layout does not depend on
  history; changes of the offered space the pass does not observe are named by phase 1's spike, and there the README
  asks for `layout` or an inline size. In a shrink-to-fit host a short sheet stacks; a public
  `layout="columns" | "stacked"` lets the consumer choose (R-02, PLAN-FRESH-2-001 (c)); `layout="grid"` is the third
  value (IQ-05 (b), below).
- **Facts grid (IQ-05 (b), #280).** `layout="grid"` renders each pair as one `<div>` group (`<dt>` above `<dd>`)
  inside the same shadow `<dl>`, in four, two or one equal columns. The column count is decided by the same measure
  pass and probes as the stacking, on the sheet's own inline size as laid out in four columns: four columns from
  twice the `--ocelle-facts-stack-below` threshold, two from the threshold, one below it. No new hook, token or
  `token-only` allowance (the four tracks are spelled out as `minmax(0, 1fr)`). Phase 1's spike measures the `<div>`
  groups against FR-004 (Chromium tree, axe `definition-list` and `dlitem`) and stops for the operator if they fail
  (R-01, R-02, R-03).
- **Facts density.** `density="compact"` tightens the gaps; inside 003's compact region the values take the region's
  14 px / 1.5 scale (#531), through two hooks `@ocelle/styles` sets (R-03).
- **Progress naming.** `ocelle-progress` is the progressbar itself through `ElementInternals`. This is one node, and a
  host `aria-label` still names it (R-05). Its fill always carries an `accent-strong` edge, at 4.1:1 or more against
  the track and every ground, and its track boundary uses `accent-strong` on inset, accent-low, hover-bg and state
  grounds with `ground="tinted"` (R-06).
- **Progress motion.** The indeterminate sweep is `calc(var(--ocelle-motion-base) * 7)` three times (4.2 s), then the
  mark rests as a still mid-track mark (WCAG 2.2.2); under reduced motion the still mark shows at once. The sweep is
  anchored to a loading episode through the Web Animations API, so a replaced or re-shown bar does not start another,
  and a later episode, after no indeterminate bar has been connected at a frame boundary, gets its own sweep (R-06,
  PLAN-FRESH-2-005 (a), PLAN-FRESH-3-004 (a)). The fill has no width transition (PLAN-FRESH-3-003 (b)).
- **Empty-state parts.** A part is present only while something slotted into it renders; `hidden` on slotted content
  is observed (R-04, PLAN-FRESH-2-007 (a)). An `eyebrow` slot sits between the visual and the heading, at
  `--ocelle-font-size-xs`, medium, ink-muted, upper case, with its own gaps (IQ-08 (c)). The element zeroes the
  block margins of the default slot's elements and separates them by `--ocelle-space-2` inside the default-slot area
  (the internal `.text` wrapper, not `part="body"`, which is the whole column) (IQ-09 (b)).
- **Progress label row.** With `show-label`, the value text sits at the inline end of the label row, the label at its
  start (IQ-13 (b)). The host is `display: block` (IQ-12 (a)). Text inside the element is not slotted, so after upgrade
  it is neither shown nor exposed, which a browser test proves (IQ-15 (b)).
- **README statements from the inputs (R-11).** Facts: no restyling of the columns through `::part(list)` (IQ-01 (a)),
  `min-inline-size: 0` from the consumer in a consumer's CSS grid (IQ-02 (a)), labels at 500 with `::part(label)` for another
  weight (IQ-03 (a)), no truncation and the wrap mapping (IQ-04 (b)). Empty state: the card, message and ops card stay
  the consumer's, the dashed card is the #509 family's (IQ-07 (a)); the panel heading stays at 500 (IQ-06 (a)).
  Progress: a nearby heading's text as `label` (IQ-10 (a)), the focusable loading heading in the empty state with no
  `role` or `tabindex` on the host (IQ-11 (b)), the inline placement from outside (IQ-12 (a)), the label as text only
  (IQ-14 (a)), and the fallback text (IQ-15 (b)).

No token is added and `@ocelle/tokens` does not change: every contrast pair is an existing row (R-06, R-07).
`@ocelle/styles` gains two rules (R-07). The `style-lint` gate gains one recorded allowance (R-10). Nothing depends on
#15. #10 (the Storybook workbench) is on `main` (3828d2f) and merged into this branch: each phase commits its
stories' light and dark baselines from #10's pinned container and passes the `storybook-build`, `visual` and `axe`
gates with them (R-08).

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
  and focus, reduced motion (`page.emulateMedia({ reducedMotion })`), running animations, AX value properties,
  replace, text (a character-data change), remove, frames, and a loading-episode reset in `mount`.
- The story test in `storybook-integration` (`storybook/test/integration/elements-stories.test.ts`), with three
  story-level checks (320 px reflow, reduced motion, progress names).
- #10's gates on the stories: `storybook-build`, `visual` (light and dark baselines in `storybook/baselines/`, made by
  `pnpm run visual:update` in the pinned container `storybook/visual/container.json`) and `axe` (axe-core 4.14.0,
  pinned in the root `package.json`), per `specs/006-storybook-workbench/contracts/gates.md`.
- `@ocelle/styles` browser tests for its two new rules; `token-only` unit tests and plants for the allowance.
- A pairing test of the progress stylesheet against the existing contrast rows.
- Details: [contracts/checks.md](contracts/checks.md).

**Target Platform**: evergreen Chromium, measured. WebKit 16.4+ is unmeasured, as the README states. The engine floor
is unchanged (R-08).

**Project Type**: library (web components) in a pnpm workspace.

**Performance Goals**: none specific. Each element class adopts one shared stylesheet. Facts uses one
`ResizeObserver`, one `MutationObserver` and one `window` `resize` listener per sheet; one `MutationObserver` per
empty state.

**Constraints**:
- strict CSP with no exception (the fill's width is a CSSOM write, R-06);
- token-only styles, with the one allowance of R-10;
- no `sk-` names and no monospace;
- no I/O;
- one heavy job at a time in this container.

**Scale/Scope**: 4 elements, 0 tokens, 0 contrast rows, 2 `@ocelle/styles` rules, 1 `token-only` allowance (4
forms), 13 driver additions (1 of them the browser command `emulateReducedMotion`) and a change to `mount`, about 40
stories (11 of them the facts grid's, 2 the empty state's eyebrow and several-paragraph body), each with two
baselines.

## Constitution Check

*Gate: passes before Phase 0. Re-checked after Phase 1 design, after squad rounds 1 to 3's fixes, after #10's merge
(plan gate, 2026-11-13), after the analysis of the tasks (tasks gate, 2026-11-13) and after the operator's input
decisions (IQ-01 to IQ-15, 2026-11-14): passes, with one recorded exception to Principle V, the three story-less
states, approved by the operator (Complexity Tracking). The two surface additions of the input decisions (the `grid`
value of `layout`, the `eyebrow` slot) were chosen by the operator (Principle VII, MINOR before 1.0.0).*

| Principle | How this plan meets it |
|---|---|
| I. Names, no I/O, small interface, manifest | **Tags**: `ocelle-facts`, `ocelle-fact`, `ocelle-empty-state`, `ocelle-progress`. **Events**: none, since no element has a user intent to report. **I/O**: none. **Interfaces**: `density` and `layout` (`"columns" | "stacked" | "grid"`, PLAN-FRESH-2-001 (c), IQ-05 (b)); `label` and `wrap`; `variant` and the slots `visual`, `eyebrow` (IQ-08 (c)), `heading`, default and `actions`; and `value`, `max`, `value-text`, `label`, `show-label`, `size`, `ground`. Every property `| undefined` with `@default undefined`, so no unset property writes an attribute (PLAN-CORRECTNESS-1-011 (a)). Three CSS hooks named after the element: `--ocelle-facts-stack-below`, `--ocelle-facts-value-size`, `--ocelle-facts-value-line-height`; the grid's four-column point is twice `--ocelle-facts-stack-below`, so no hook is added for it. The manifest declares everything, each list stated even when empty ([contracts/elements.md](contracts/elements.md)). |
| II. Tokens only, brand rules | **Lint**: every style is a `css` template or `base.css` rule checked by `token-only`. One recorded allowance (R-10): `fit-content(<percentage>)` and `minmax(0, <flex>)` in grid columns, `translateX(<percentage>)` in `transform`, and a bare integer `animation-iteration-count`, each with unit tests and plants. **No monospace**: values use `font-sans` with `figures`; the empty state's eyebrow is sans (`font-size-xs`, `font-weight-medium`, `color-ink-muted`, upper case), not the inventory's mono eyebrow. **The grid layout** needs no further allowance: its four tracks are four `minmax(0, 1fr)` values, already in the allowance. **Ochre fill never the only mark**: the `accent-strong` inset edge on every fill and mark, in both themes (R-06). **Ochre text on bone**: none. **`color-rule`**: not used. **Radius**: `radius-1` on the progress track, a small mark under the token contract's radius rule (`packages/tokens/README.md`: `radius-1` for small marks), argued in R-06. |
| III. Accessible by construction | **ID references**: none. Facts has no cross-root reference because the sheet renders `dt`/`dd` itself (R-01); a hidden fact is no pair and a fact's `lang`/`dir` reach its term. In `layout="grid"` each pair is a `<div>` group inside the same `<dl>`, which HTML allows; phase 1's spike measures it against the Chromium tree and axe's `definition-list` and `dlitem` and stops for the operator if it fails (R-01, IQ-05 (b)). The empty state's eyebrow and body are the consumer's content, with no role added. Text inside a progress bar is neither shown nor exposed after upgrade (IQ-15 (b)), and the README warns against a `role` or `tabindex` on the host (IQ-11 (b)). Progress takes its name through ElementInternals, so a host `aria-label` names it (R-05). **Headings**: the empty state never adds one; the level is the consumer's. **Motion**: the sweep ends by itself in 4.2 s on the still mark (WCAG 2.2.2), once per loading episode, so a polled or re-shown bar does not restart it, and a later episode in a single-page or webview shell gets its own bounded sweep (PLAN-FRESH-2-005 (a), PLAN-FRESH-3-004 (a)); the fill has no width transition (PLAN-FRESH-3-003 (b)); under reduced motion only the still mark shows (R-06). **Contrast**: the fill's edge and the track boundary meet 3:1 on every main and state ground (`ground="tinted"` on inset, accent-low, hover-bg and state grounds), all through existing rows. **Forced colours**: a track outline, `Highlight` fill with no author shadow, and `CanvasText` text. **Reflow**: at 320 px and 640 px; the track clips the mark; the facts probes take no block size. **Accessibility-tree tests** in both harnesses, with value properties. **Story names**: the story test asserts every progressbar in every story is named. **axe**: #10's `axe` gate runs on every story of the four elements in light and dark with no serious or critical violation or incomplete result, in each phase, and no `storybook/a11y-exceptions.json` entry is added (R-08). axe cannot check the progress name (R-05); the AX-tree tests prove it. |
| IV. Strict CSP, offline | **Styles**: adopted stylesheets, with no `style` attribute in any template. The progress fill's width is set and removed through the CSSOM, which `style-src` does not block (R-06). **Fixture pages** assert zero violations with each element rendered. **Network**: none. |
| V. Storybook, behaviour tests | **Stories**: one per variant and state, light and dark (R-08), with one recorded exception (Complexity Tracking, approved by the operator at the tasks gate): three states have no story and are proven by browser tests instead, the unnamed progress (US3-11), the progress named by a host `aria-label` (US3-10) and `ocelle-fact` outside `ocelle-facts` (FR-050, R-05, R-08). The grid layout has a story per column count and per #280 case that fits the library (R-08), and the eyebrow and the several-paragraph body each have one. Text inside a progress bar is a consumer error with no look, proven by a browser body, not a state needing a story. **Events**: none to assert. **Keyboard**: no element is focusable, and focus passing through slotted content is tested (US2-6). **Baselines**: each phase commits its stories' light and dark baselines (`storybook/baselines/<story-id>.<theme>.png`), produced by `pnpm run visual:update` in #10's pinned linux/amd64 container, and passes #10's `visual` gate; CI's captures are the record when they differ from a local run (R-08). The stories meet #10's index rules (`empty`, `outside-root`, `closed-shadow-root`, `pointer-target`, `font`, render) and its contributor note (`storybook/README.md`, 006 FR-025). |
| VI. Consumer-driven, own code | **Needs**: kitty-mission-ui's three class families, with the inventory of their modifiers and states (with counts, role names only) supplied by the operator after the plan gate ("Proceed, inputs later") and recorded in R-11 for all three families; its gaps go to the operator before each phase's red commit (Decision 5, PLAN-FRESH-2-006; `reviews/analysis/inputs-questions.md`). spec-kitty-design #531 and #535 read from 003's verbatim copy, and #280, #498, #510 and #523 from the operator's verbatim copy in `sources/013-inputs.md` (R-03); the operator decided their gaps (IQ-01 to IQ-15, 2026-11-14), and #280's grid is met by `layout="grid"`. Nothing copied. The README mapping names roles only (FR-058) and each element's rows land in its own phase, red first: the README table holds the `.sk-*` family names (Markdown is outside the `prefix` gate), and the readme tests assert the rows by their role names, with no `sk-` string in test code (operator decision I1, tasks gate; R-11). |
| VII. Semver | **MINOR**: four elements, four entry points, three CSS hooks, two base-style rules; the `grid` value of `layout` and the `eyebrow` slot are part of the new elements' surface, chosen by the operator (IQ-05 (b), IQ-08 (c)). CHANGELOG entries for `@ocelle/elements` and `@ocelle/styles` (FR-057). `@ocelle/tokens` is unchanged. |
| VIII. Test-first, non-vacuous | **Scaffold** before each red commit in phases 1 to 3 (`scaffold.sh`), so bodies fail on assertions; the red log is checked per body. **Red first**: each phase's red commit holds the scenario bodies, the driver tests, the story-test extension (I3), and the `token-only` and `@ocelle/styles` tests. `red.sh` records one red record per phase. **Pairing**: "does not" outcomes are paired with a positive one; bodies the light DOM could pass also assert what only the element gives. **Plants**: every CSS-only behaviour has a plant or a stated reason, since Stryker does not mutate `css` templates ([contracts/checks.md](contracts/checks.md)); the gate allowance has its plants. **Mutation**: element source is mutated in process (005 R-12 and decision 16's reading); Timeout and CompileError are reported and pass (#23). **Spikes** are recorded before red commits (phase 1: facts structure under Lit and axe 4.14.0, the empty term, the `<div>` groups of the grid layout, the two-column and four-column measures in every shrink-to-fit and shared host and a `1fr` grid item, the round 3 re-decide cases and the unobserved changes, and the layout-settle wait; phase 3: the `valuetext` oracle), and a failing spike result goes to the operator, not to review, except the unobserved changes of R-02, whose narrowing the operator has already decided (PLAN-FRESH-3-001 (c)). **Story test**: the reduced-motion read is timed by the clock and asserts the emulation applied (PLAN-FRESH-3-005). |
| Licence, supply chain | No new dependency or asset. |
| Workflow gates | No gate added. The `style-lint` gate gains one allowance with plants (R-10); the other gates, #10's `storybook-build`, `visual` and `axe` among them, run unchanged on the new source and stories (contracts/checks.md § Gates touched). |

## Decisions the operator should see at the plan gate

1. **FR-004 (SPEC-1-04 "D"): measured achievable as written, confirmed.** With manual slot assignment the Chromium
   tree is `DescriptionList > term, definition, …`, and axe is clean (R-01). The operator confirmed FR-004 as written
   at the plan gate ("Confirm FR-004", 2026-11-13, `reviews/plan/operator-gate.md`), so tasks are generated against
   it. The rechecks under Lit 3.3.3 and axe-core 4.14.0, and of the empty term in that structure, run in phase 1's spike
   before the red commit (operator decision PLAN-CORRECTNESS-1-014 (b)). Any failing result stops the flow for the
   operator; FR-003, FR-004 and US1-10 are not reworded by review.
2. **Stacking (R-02, PLAN-FRESH-2-001 (c), amending PLAN-CORRECTNESS-1-003 (a)).** With `layout` unset the sheet
   stacks on its own inline size as laid out in two columns, read in one `ResizeObserver` that also observes the
   threshold probes, against a public hook `--ocelle-facts-stack-below` (`calc(var(--ocelle-space-10) * 6)`, 24rem, by
   default; an absolute length only, with a fallback for anything else). A short sheet in a shrink-to-fit host stacks
   even with room; the new public `layout="columns" | "stacked"` (FR-013) is the consumer's choice there, and the
   README says so. FR-005 and FR-009 are amended accordingly and US1-11 added. Round 3 (PLAN-FRESH-3-001 (c),
   PLAN-FRESH-3-002): the decision is one measure pass that alone owns the `stacked` class, run from the observer, after
   every render, on value text changed in place and on window resize (FR-005, US1-12); phase 1's spike names the
   changes of the offered space it does not observe, and for those FR-009 is narrowed as the operator decided: the
   README asks for `layout` or an inline size there, and the bodies assert that remedy. Any other spike result that
   shows the measure is not state-independent comes back to the operator before the red commit.
3. **Progress basis (R-05).** ElementInternals, so axe cannot test the name. No story sets a host `aria-label` (that
   would be an axe false positive), the AX-tree tests carry the evidence, and the story test checks every bar in every
   story is named.
4. **Track boundary (R-06, PLAN-A11Y-SECURITY-1-002 (a)).** `ground="tinted"` draws it in `accent-strong` on inset,
   accent-low, hover-bg and the state grounds, where `control-border` is below 3:1.
5. **Upstream inputs (R-03, R-11, PLAN-CORRECTNESS-1-002, PLAN-FRESH-2-006): "Proceed, inputs later"** (operator, plan
   gate, 2026-11-13). #531 and #535 are read from `specs/003-base-styles/sources/spec-kitty-design-issues.md`; FR-008
   follows #531 inside a compact region (operator option (b)). spec-kitty-design #280, #498, #510 and #523 were
   unread at the plan gate: the orchestrator's request for read access was denied by the permission classifier, and
   the plan proceeded without them. **Update (operator inputs, `sources/013-inputs.md`):** the operator has since
   supplied the four issues verbatim; R-03 records what each states for this mission. Every gap or conflict with the
   spec or plan (among them #510's text against the E-13 code for FR-022 and US2, #498's label slot for US3, #280's
   grouped grid and its no-hidden-truncation non-goal, #523's term weight) was an open question in
   `reviews/analysis/inputs-questions.md`; the operator decided them on 2026-11-14 (Decision 10). The inventory of kitty-mission-ui's `.sk-facts`, `.sk-empty-state` and
   `.sk-progress` modifiers and states, with a count for each, naming roles only and copying no code, stayed pending
   in research R-11 at the plan gate (kitty-mission-ui is outside this session's GitHub scope); it has since been supplied and
   recorded in R-11 for all three families (T002a, T022a, T036a), with its gaps in
   `reviews/analysis/inputs-questions.md`. Tasks are generated now; each phase's
   README-mapping task needs its family's inventory recorded in R-11 before that phase's red commit, and the phase
   does not take its red commit without it. A variant that no element or variant covers goes to the operator; the
   surface is not widened by review.
6. **Squad round 2 (`reviews/plan/round-2/refute.md`).** The facts `layout` property (PLAN-FRESH-2-001 (c)), one
   sweep per page (PLAN-FRESH-2-005 (a), amended to one sweep per loading episode in round 3) and hidden slotted parts observed (PLAN-FRESH-2-007 (a)), as decided; the
   spec's FR-005, FR-009, FR-013, FR-023, FR-033 and FR-058, and US1-11, US2-9 and US3-14, record them.
7. **Squad round 3 (`reviews/plan/round-3/refute.md`).** Stacking re-decided on the cheap triggers with FR-009
   narrowed for unobserved changes (PLAN-FRESH-3-001 (c)); no fill width transition (PLAN-FRESH-3-003 (b)); one sweep
   per loading episode (PLAN-FRESH-3-004 (a)), as decided. FR-005, FR-009 and FR-033, US1-12, US3-2 and US3-15, and
   the edge cases "Facts inside a shrink-to-fit host", "Progress replaced or re-shown" and "Rapid value changes" record
   them. Fixes: the measure pass owns the `stacked` class (PLAN-FRESH-3-002) and the story test's reduced-motion read
   is timed by the clock (PLAN-FRESH-3-005).
8. **`value-text` while indeterminate** is not exposed (R-05).
9. **The `token-only` allowance (R-10, PLAN-CORRECTNESS-1-001 (a))** and **no new contrast rows (R-06,
   PLAN-CORRECTNESS-1-007 (b))**, as decided.
10. **The input decisions (IQ-01 to IQ-15, operator, 2026-11-14, `reviews/analysis/inputs-decisions.md`).**
    - Surface widened by the operator: `layout="grid"` (IQ-05 (b); FR-013, FR-014, US1-13 to US1-19; R-01, R-02,
      R-03) and the empty state's `eyebrow` slot (IQ-08 (c); FR-020, FR-025, US2-10; R-04).
    - Behaviour with tests, no surface: the body's margins reset and `--ocelle-space-2` between body children (IQ-09
      (b); FR-026, US2-11; R-04); the value text at the inline end of the label row (IQ-13 (b); FR-035, US3-9, US3-10;
      R-06); text inside the bar neither shown nor exposed after upgrade (IQ-15 (b); FR-039; R-06).
    - Plan and README only: FR-005's tracks with a warning against restyling them (IQ-01 (a)); the consumer's
      `min-inline-size: 0` in a consumer's CSS grid, with a `1fr` grid case in phase 1's spike (IQ-02 (a)); labels at 500
      (IQ-03 (a)); no truncation, and the wrap rules mapped to `wrap="anywhere"` (IQ-04 (b)); the panel heading at 500
      as #510's text (IQ-06 (a)); no card chrome, the dashed card to the #509 family (IQ-07 (a)); a nearby heading's
      text as `label` (IQ-10 (a)); the focusable loading heading in the empty state, with a warning against a `role`
      or `tabindex` on the bar's host (IQ-11 (b)); `:host { display: block }` with the inline placement from outside
      (IQ-12 (a)); the label as a property only (IQ-14 (a)).
    - R-11's gap rows now name the decided element, variant or consumer remedy; the red commits T012, T028 and T045
      no longer wait on these questions. A grid spike result that fails FR-004 still stops phase 1 for the operator.

## Project Structure

### Documentation (this feature)

```text
specs/013-data-display/
├── plan.md              # this file
├── research.md          # R-01 to R-11
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
storybook/.storybook/stories-layout.css               # the stories' wrapper widths, on data-story selectors
storybook/baselines/elements-ocelle-{facts,empty-state,progress}--<story>.{light,dark}.png   # #10's baselines
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

Every phase that adds stories (1 to 3) also, in its green commit with the stories (R-08):
- commits the stories' light and dark baselines in `storybook/baselines/`, produced by `pnpm run visual:update` in
  #10's pinned linux/amd64 container (`storybook/visual/container.json`; docker in this container, one heavy job at a
  time). The command must print `(<n> added, 0 changed, 0 removed)` with `<n>` twice the phase's new stories: no
  existing baseline moves. When the branch's CI "Visual regression" captures differ from the local ones, CI's
  captures from the job's `visual` artifact are committed instead (`storybook/README.md` § Baselines). The pull
  request description says the baselines are the new stories' (constitution V);
- passes `pnpm run gate:storybook-build`, `pnpm run gate:visual` and `pnpm run gate:axe` with its stories, with no
  `storybook/a11y-exceptions.json` entry added, and `gate:plants`, whose `pass-repository` plants of the three gates
  run on the repository's stories and baselines, the new ones included;
- holds its stories to #10's index rules and contributor note: open shadow roots, nothing rendered outside the story
  root, every story rendering a box or text, no pointer state declared, text in Latin script only (the `font` rule:
  the right-to-left stories set `dir="rtl"` on Latin content, as `icon.stories.ts` does), wrapper widths from
  `data-story` rules in `stories-layout.css` (no `style` attribute).

The phase review records the three gates' summary lines and the `visual:update` line. A story the `axe` gate fails is
fixed in the story or the element; an exception entry would need a Complexity Tracking row and goes to the operator.

1. **US1 Facts** (P1, MVP):
   - **spike** (`reviews/phase-1/spike.md`, before the scaffold):
     - the A5 structure built with Lit 3.3.3 (`createRenderRoot` with `slotAssignment: "manual"`, assignment in
       `updated()`), axe-core 4.14.0 on it, and whether an empty `<dt>` stays a term node; any failure stops the flow
       for the operator (R-01);
     - the grid structure (IQ-05 (b), R-01): the same `<dl>` with each pair in a `<div>` group (`<div><dt><dd>
       </dd></div>`), under Lit and axe-core 4.14.0 (`definition-list`, `dlitem`, full run), and the Chromium tree
       (`DescriptionList > term, definition, …` with the groups ignored or generic, each definition after its term),
       with an empty term; any failure stops the flow for the operator;
     - the grid measure (R-02): the sheet as laid out in four columns in the same hosts as below, its column count at
       300, 600, 800 and 1280 px block containers, the widen case in a dialog, and the thresholds T and 2T read from
       the probes;
     - the `1fr` grid item (IQ-02 (a)): a sheet with a long unbroken value as the item of a `1fr` grid track at 320
       and 600 px, with and without the consumer's `min-inline-size: 0` on the host: with the rule, no overflow of the
       track or the page; the result is recorded for the README;
     - the two-column measure of R-02 in a dialog, a popover, a float, a default flex item, a flex row with a fixed
       sibling, a grid `auto` track and a table cell: FR-009's bound, a short sheet in a dialog at 1280 px (stacked
       without `layout`, two columns with `layout="columns"`), a sheet with named content loaded at 360 px then
       widened, and whether a flip raises the `ResizeObserver` loop error;
     - the round 3 cases (R-02, PLAN-FRESH-3-001 (c)): widen from 360 px in a dialog, relabel from "Id", value text
       changed in place, each against a fresh load, with the content fixed so it crosses the threshold in the
       harness's fonts; and with the extra triggers removed, both named cases stacked;
     - the unobserved changes (a fixed flex sibling shrunk, a grid neighbour removed, a table column widened, a dialog
       reopened at another width, a late web font), each against a fresh load: the cases that differ are the FR-009
       narrowing, recorded in R-02 and carried into the README and the bodies; any other state dependence goes to
       the operator;
     - the 300 → 290 px measure-pass case (PLAN-FRESH-3-002);
     - the probes with an invalid, a percentage and a 0 hook, a valid 15rem and 40rem hook, and a hook changed at a
       fixed width;
     - the layout-settle wait in both harnesses;
     - the stacked and two-column states, the four-, two- and one-column grid states, and right-to-left;
     - the compact-region hooks in Chromium;
   - **scaffold**: `ocelle-fact.ts`, `ocelle-facts.ts`, their exports and entries;
   - **red**:
     - US1 scenarios 1 to 10 as shared bodies (US1-11 and US1-12 below), with the oracles of contracts/checks.md (flat-tree structure,
       each-definition-its-own-value, layout settle, copy);
     - US1 scenarios 13 to 19 (`layout="grid"`, IQ-05 (b)) as shared bodies, with the grid oracles of
       contracts/checks.md (grouped flat-tree structure, cell geometry with the label-to-value and column gaps as
       exact token values, no ground, divider or border, column count, no overlap) and the grid plants;
     - the extra facts bodies of contracts/checks.md (no pairs, a very long label, dynamic children and labels,
       hidden facts, `lang`, right-to-left,
       640 px, `ocelle-fact` alone and moved, non-fact children, shrink-to-fit and shared hosts and history, `layout`
       (US1-11), resize, the hook fallbacks, the valid-hook and hook-change bodies and the probes' overflow, compact
       region, unset properties);
     - US1-12's re-decide bodies (widen, relabel, value text), the 300 → 290 px measure-pass body and the
       unobserved-change bodies (PLAN-FRESH-3-001 (c), PLAN-FRESH-3-002);
     - the driver additions `viewport`, `scrollWidth`, `layout`, `copy`, `move` and `text`, with their tests;
     - `entry-facts` and `entry-fact` tests; the build test of the container import rule;
     - the `token-only` unit tests for the grid functions, and their `gates/README.md` statements;
     - the `@ocelle/styles` tests (compact-region hooks, pre-upgrade rule with a hidden fact, README statements);
     - the README test statements for the facts section (with `layout`, `grid` included), the slotted-item convention
       (with the container import rule), the Builds correction and the engines line, and the input decisions' facts
       statements: no restyling of the columns through `::part(list)` (IQ-01 (a)), `min-inline-size: 0` in a grid
       parent (IQ-02 (a)), labels at 500 and `::part(label)` for another weight (IQ-03 (a)), no truncation and the
       wrap mapping (IQ-04 (b)), the wrap policy on machine values in the grid;
     - the readme-test statements for the facts mapping rows of R-11's inventory (FR-058, PLAN-FRESH-2-006), keyed
       by role names with no `sk-` string in test code (operator decision I1, R-11); the `.sk-facts` inventory must be
       recorded in R-11 before this red commit (an operator step before the red tasks), and a gap goes to the
       operator (Decision 5);
     - the story-test extension for the facts stories (presence, light and dark, 320 px reflow, reduced motion);
     - the named plants of contracts/checks.md for facts (among them the extra triggers removed, `characterData`
       removed and the class not restored after the measure, and for the grid: the groups not rendered, the
       four-column rule removed, the four-column point at the threshold instead of twice it, the grid layout's
       two-column rule removed, the grid `<dt>`'s label-to-value margin removed, a divider added on each group);
   - **green**:
     - `ocelle-fact.ts` and `ocelle-facts.ts`;
     - the `token-only` allowance for the grid functions, its plants and its `gates/README.md` row;
     - `base.css`'s two rules, the styles README and CHANGELOG;
     - the regenerated manifest;
     - the facts stories, the grid stories included, and their light and dark baselines (above);
     - the README sections (facts, conventions, Builds, engines) and the `.sk-facts` mapping rows;
     - the CHANGELOG entry.
2. **US2 Empty state** (P2):
   - **scaffold**: `ocelle-empty-state.ts`, its exports and entries;
   - **red**:
     - US2 scenarios 1 to 6 and 8 as shared bodies, with the element-only assertions of contracts/checks.md (markup
       out of slot order, geometry in the column);
     - US2-7 with an `ocelle-progress` stand-in: a plain element in `visual`, since progress comes in phase 3; phase 3
       extends US2-7 to the real `ocelle-progress` and its width. The `::slotted(ocelle-progress)` rule's plant runs
       in phase 3 only, against the real bar, since a stand-in of another tag cannot be matched by the rule;
     - the present-parts bodies (heading only, actions only, visual plus text, eyebrow only, eyebrow plus actions,
       a visual with an eyebrow written out of order, an eyebrow followed by body text with no heading), the
       inline-content body (text, a link and text as three blocks),
       the slots filled and emptied later, hidden slotted content (US2-9), several actions and a long heading and body
       at 320 px, unset `variant`;
     - US2-10 (the `eyebrow` slot, IQ-08 (c)) and US2-11 (body margins and gap, IQ-09 (b)), with their plants;
     - the driver additions `pressTab` and `focused`, with their tests;
     - the entry test, the README statements (with the `eyebrow` slot, the body's block layout and its inline-content
       note, the consumer's card around the element, IQ-07 (a), and the panel heading at 500, IQ-06 (a)), the
       readme-test statements for the empty-state mapping rows (FR-058,
       keyed by role names with no `sk-` string in test code; the `.sk-empty-state` inventory recorded in R-11 before
       this red commit, a gap to the operator) and the story-test extension;
     - the named plants for the empty state (the "last present part has no margin" rule removed, the `hidden` observer
       removed, the eyebrow type rule removed, the body margin reset removed, the body gap removed);
   - **green**:
     - `ocelle-empty-state.ts`;
     - exports;
     - the manifest;
     - the stories, the eyebrow and several-paragraph stories included, and their baselines (the panel-loading story
       arrives in phase 3);
     - the README section and its heading rule (FR-056), and the `.sk-empty-state` mapping rows;
     - the CHANGELOG.
3. **US3 Progress** (P3):
   - **spike** (`reviews/phase-3/spike.md`, before the scaffold): the `valuetext` oracle among platform reads (R-05);
     if none exposes it, US3-3 goes to the operator;
   - **scaffold**: `ocelle-progress.ts`, its exports and entries;
   - **red**:
     - the driver additions `reducedMotion` (`emulateReducedMotion`), `animations`, the AX value properties,
       `replace`, `remove`, `frames` and the loading-episode reset in `mount`, with their tests;
     - US3 scenarios 1 to 15 as shared bodies, with the oracles of contracts/checks.md (US3-2 read at once with no
       transition running, PLAN-FRESH-3-003 (b); US3-15 a new episode, PLAN-FRESH-3-004 (a));
     - SPEC-2-02's bodies, the value-removed body, the right-to-left indeterminate body, the 320 px sweep body, the
       tinted-ground body, the compact long-label body at 320 px, the no-tab-stop body (FR-039), unset properties;
     - the label-row bodies inside US3-9 and US3-10 (value text at the row's inline end, IQ-13 (b)), the fallback-text
       body (IQ-15 (b)) and the inline-placement body (IQ-12 (a));
     - US2-7 extended to `ocelle-progress` and its width in the column;
     - the pairing test in two halves (`test/node/progress-pairs.test.ts`, `test/build/build.test.ts`);
     - the `token-only` unit tests for the translate and the iteration count, and their `gates/README.md`
       statements;
     - the entry test, the README statements (with the input decisions' progress statements: a nearby heading's text as
       `label`, IQ-10 (a); no `role` or `tabindex` on the host and the focusable heading in the empty state, IQ-11 (b);
       the block host placed inline from outside, IQ-12 (a); text-only labels, IQ-14 (a); the fallback text, IQ-15
       (b)), the readme-test statements for the progress mapping rows (FR-058, keyed
       by role names with no `sk-` string in test code; the `.sk-progress` inventory recorded in R-11 before this red
       commit, a gap to the operator) and the
       story-test extension (progress stories and the empty-state panel-loading story, with the
       progressbar-name check, and the motion reads each on its own fresh story load within the first iteration, the
       reduced-motion read timed by the clock and asserting the emulation, PLAN-FRESH-3-005);
     - the named plants of contracts/checks.md for progress (still-mark inset removed, `infinite` restored, clip
       removed, inset shadow removed, tinted rule removed, track `min-inline-size` removed, forced-colours
       `box-shadow: none` removed, right-to-left
       keyframes removed, the value text's inline-end placement removed, a default slot added to the shadow root, the shared start dropped, the episode never ends, a fill `inline-size` transition added, the
       `::slotted(ocelle-progress)` rule removed, a story's `label` removed);
   - **green**:
     - `ocelle-progress.ts`, the `emulateReducedMotion` command and the other driver additions;
     - the `token-only` allowance for the translate and the iteration count, its plants and its `gates/README.md` row;
     - exports and the manifest;
     - the stories, the panel-loading story included, and their baselines;
     - the README section (naming and the axe false positive, the bounded sweep once per loading episode, no fill
       transition, `ground="tinted"`, the busy vocabulary) and the `.sk-progress` mapping rows;
     - the CHANGELOG.
4. **Polish and cross-cutting** (no new behaviour unless named):
   - exempt (documentation): the final CHANGELOG surface lists (FR-057), the review check that the three mapping
     sections together cover R-11's inventory (SC-001; the rows themselves landed red first in phases 1 to 3,
     PLAN-FRESH-2-006), and the quickstart run, recorded in `reviews/phase-4/`, with the `storybook-build`, `visual`
     and `axe` gates passing on all the mission's stories (SC-003, FR-051).

Phases 2 and 3 depend on nothing from phase 1 but the driver additions, and run in order so the README, exports and
driver change one phase at a time. Phase 3 extends one phase 2 scenario (US2-7). No phase needs #15 merged.

## Complexity Tracking

| Exception | Principle | Scope | Rationale | Sunset | Approval |
|---|---|---|---|---|---|
| Three supported states have no story | V (a story per variant and per state) | `ocelle-progress` with neither `label` nor a host `aria-label` (US3-11); `ocelle-progress` named by a host `aria-label` (US3-10); `ocelle-fact` outside `ocelle-facts` (spec edge case, FR-050). Each is proven instead by shared browser bodies in both harnesses (T038's US3-10 and US3-11, T005's standalone and moved-fact bodies). No other state of the four elements is excepted, and no `storybook/a11y-exceptions.json` entry is added. | The unnamed bar fails axe's `aria-progressbar-name` by design (it is a consumer error the element must not hide, FR-030). A host `aria-label` on an ElementInternals bar makes axe report a false `aria-prohibited-attr` (serious), which a story would turn into a failing `axe` gate or an exception entry (R-05). `ocelle-fact` alone is a fallback rendering with no layout of its own to baseline; its behaviour (plain text, no term or definition role, the wrap policy) is asserted on the accessibility tree and computed style in both harnesses (R-08). | The two progress states get stories when the pinned axe-core reads ElementInternals ARIA (role, name and attributes set through `ElementInternals`), so neither state fails or falsely fails the `axe` gate; the unnamed state then gets a story only if the gate can carry it as a known consumer error without an exception entry. The standalone fact gets a story when a consumer needs `ocelle-fact` outside `ocelle-facts` as a supported layout (it would then become a variant with its own look). | Operator, tasks gate, 2026-11-13 (`reviews/analysis/operator-decisions.md`, C1 "Record exception row"). |

The row for missing baselines and axe is dropped: #10 is merged (3828d2f), 001's exception "Storybook build, visual
regression and axe gates absent" is closed by it, and every story of this feature gets its baselines and its axe run
in its own phase (R-08). No `storybook/a11y-exceptions.json` entry is planned; an entry would need a row here and the
operator's approval.

The progress stories' axe pass not covering the accessible name is a property of axe with ElementInternals, not a
further exception: the requirement (FR-030) is proven by the AX-tree tests and the story test's name check (R-05). The
`token-only` allowance (R-10) is a recorded gate change with plants, not a constitution exception: it admits no raw
colour, font, size, radius, shadow or duration.
