# Implementation Plan: Disclosure and Code Block (the last of #13)

**Branch**: `020-disclosure-code-block` (work on `claude/013-disclosure-code-block`, cut from `main` at 4911fd0b) |
**Date**: 2026-11-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/020-disclosure-code-block/spec.md` (spec gate approved 2026-11-20,
`reviews/spec/operator-gate.md`), triage record `triage/020-disclosure-code-block.md`.

## Summary

Two new elements in `@ocelle/elements`, the last two of #13:

- **`ocelle-disclosure` (P1)**: a native `details` and `summary` in an open shadow root without `delegatesFocus`
  (`focus()` overridden to focus the summary, so a click on panel content moves no focus), a block host. The summary
  is the one inner control and holds a slot-convention icon row (012 decision 33) with a `chevron-end` /
  `chevron-down` fallback icon in an `aria-hidden` wrapper. `open` is reflected and is the state; the native `toggle`
  is turned into one `ocelle-disclosure-toggle` (`{ open }`, composed, not cancelable) after the attribute is
  reflected, coalesced as the platform's native `toggle` coalesces and silent at upgrade. Host ARIA moves to the
  summary through `MovedAttributes` (control conventions rule 4); a host `aria-expanded` is mapped onto `open`. In
  forced colours the summary is `CanvasText` on `Canvas`. No animation (research R-01 to R-04, R-08).
- **`ocelle-code-block` (P2)**: a copy of the host's `textContent` in a shadow `pre` (no slot), followed by a
  `MutationObserver`; on `color-inset` in the sans with tabular figures at `line-height-relaxed`, a block capped at
  `measure-reading`. Wrap by default (003's `pre-wrap` and `anywhere`); `overflow="scroll"` renders 009's
  overflow-region structure around the `pre`, used exactly as its contract states, with focus handed to the block
  when a run-time switch to wrap removes a focused scroll box or frame, the block showing the library's ring. Each line
  of code is shown left to right while the block and its scroll box keep the page direction, so the module's fade is
  on the hidden side; under `rtl` the element opens a scroll block at the line starts with one instant scroll write
  when the box first appears or the text changes, and the fade is then at the right (operator decision PLAN-FRESH-3-001
  (a)); an empty block keeps one line. `digest` renders a prefix and `nowrap` groups of four code points as inline spans joined by `<wbr>`, with
  a `space-1` gap after every unit but the last, which the measures in R-07 show copy and read as the unbroken digest
  (R-05 to R-07).

Phase order (operator decision Q1, spec FR-060): phase 1 is the disclosure on the branch as cut from `main`; phase 2
opens with an operator stop on mission 019 before its scaffold. Nothing merges `main`.

## Technical Context

**Language/Version**: TypeScript 5 (repository pin), ES2022 modules, run by Node 24's type stripping in gates.

**Primary Dependencies**: Lit 3 (repository pin). No new dependency.

**Storage**: N/A.

**Testing**: Vitest browser mode with Playwright Chromium: scenario bodies in `test/scenarios/`, run in process
(`elements` project, mutated by Stryker) and on the built browser build on strict-CSP fixture pages
(`elements-browser`); node tests for the README and manifest; Storybook stories through #10's `visual` and `axe` gates.

**Target Platform**: browsers at the engine floor (Chromium 135+, WebKit 17.4+); only Chromium measured.

**Project Type**: library (custom elements).

**Performance Goals**: none beyond the platform; the code block re-renders once per mutation batch.

**Constraints**: strict CSP (no `style` attribute, no `<style>`); tokens only; no monospace; no clipboard I/O; no
change to `src/overflow-region.ts`, its contract, or any element of missions 013 and 019.

**Scale/Scope**: 2 elements, 2 phases, about 60 scenario and FR bodies.

## Constitution Check

*Gate: passes before Phase 0, re-checked after Phase 1 design: passes, with the one exception of Complexity Tracking
for the operator at the tasks gate. Re-checked after squad round 1: the Principle III exception for `aria-expanded`
is gone (a host `aria-expanded` is mapped onto `open`, operator decision PLAN-CORRECTNESS-1-008 (a)). Re-checked
after squad round 2: still passes; the overlay focus-containment gap a disclosure exposes in mission 008's modules is
a recorded limitation for a separate op, not fixed here (operator decision PLAN-FRESH-2-002 (b)). Re-checked after
the analysis fixes (`reviews/analysis/fixes-1.md`): still passes; the Complexity Tracking exception is approved at the
tasks gate, its unnamed-scroll-block state subject to T021a's axe measure; row III states why `target-min` does not
apply to the summary. Re-checked after T021a (`reviews/phase-2/operator-axe-decision.md`): still passes; the unnamed
overflowing scroll block gets a story and leaves the story-less exception, and the operator-approved
`color-contrast-incomplete` entries for the overflowing scroll stories are recorded in Complexity Tracking.*

| Principle | How this plan meets it |
|---|---|
| I. Names, no I/O, small interface, manifest | **Tags**: `ocelle-disclosure`, `ocelle-code-block`. **Event**: `ocelle-disclosure-toggle` only. **I/O**: none (no clipboard; copy is the browser's). **Interfaces**: `open`; four moved attributes with mirrors; a mapped `aria-expanded`; slots `summary`, `icon`, default; parts `details`, `summary`, `panel`; state `open` / `overflow`, `label`, `digest`; parts `block`, `code`; no slot. Every property `@default undefined`. Manifest lists everything ([contracts/elements.md](contracts/elements.md)). |
| II. Tokens only, brand rules | Every value a token (R-10); no new token. **No monospace**: the shadow `pre` sets `font-sans` and `figures` itself (R-06). **Digests in groups of four**: R-07, recorded as a README convention. No ochre, no raw colour. |
| III. Accessible by construction | **No ID reference across a root**: the summary and panel are in one `details`; host ID references resolved by element reference (R-03). **Host ARIA** moved to the summary; a host `aria-expanded` mapped onto `open`, the summary exposing the state (R-03). A slotted icon, a bare svg included, is hidden by an `aria-hidden` wrapper (R-01). **Keyboard**: native Enter and Space; panel content in tab order only while open; scroll block a tab stop only while it overflows (module). **Focus**: never lost when a panel closes, also from inside a panel control's shadow root (R-02), or when a run-time switch removes a focused scroll box or frame, the block then showing the token ring (R-06); a click on panel content moves no focus (no `delegatesFocus`, R-01). **Motion**: none in the disclosure; instant scroll writes in the module and in the code block's `rtl` opening write (R-06). **Reflow**: 320 px bodies for both. **Forced colours**: the summary `CanvasText` on `Canvas` with the `Highlight` ring (R-04), a transparent border on the block. **RTL**: the chevron mirrors; each line of code is shown left to right, the block and its scroll box in the page direction, so the fade is on the hidden side; an `rtl` scroll block opens at the line starts, every line's first character in view (R-06, PLAN-FRESH-3-001 (a)). **Overlays**: a closed disclosure as the last control of an `ocelle-dialog` or `ocelle-drawer` lets Tab leave the overlay through mission 008's focus walk; operator decision PLAN-FRESH-2-002 (b) leaves 008's modules unchanged, records the case for a separate op (research.md § Repository-wide notes) and states it in the README. **Target size**: `--ocelle-target-min` (44 px) applies where the element is a primary action; the disclosure's summary is not one (it shows or hides secondary content inline and submits, navigates or commits nothing), so it meets WCAG 2.5.8's 24 × 24 CSS px (FR-014), and the code block has no target. **AX-tree tests** in both harnesses; axe on every story. |
| IV. Strict CSP, offline | Adopted stylesheets; the module's per-instance sheet is the only other (README Styles). Fixture pages assert zero violations. No network. |
| V. Storybook, behaviour tests | A story per variant and state, light and dark (R-09), with the story-less states of Complexity Tracking (approved at the tasks gate; the unnamed overflowing scroll block has the `ScrollUnlabelled` story after T021a, and the overflowing scroll stories carry the operator-approved `color-contrast-incomplete` entries of Complexity Tracking). Every story's test also reads the page scroll width at 320 px (SC-002), keyboard use (SC-005) and no running animation (SC-006) (contracts/checks.md § Story tests). Every event and payload has interaction tests (FR-054). Baselines in #10's pinned container under docker; no podman cross-check possible here. |
| VI. Consumer-driven, own code | #13 and the Desktop V2 disclosure family; no kitty-mission-ui inventory for these families was supplied (R-11, plan-gate decision). Nothing copied. No duplicated control logic: the shared `control.ts` and `icon-slot.ts` are reused. |
| VII. Semver | MINOR: two elements, two entry points, one event, one README convention. CHANGELOG for `@ocelle/elements`. |
| VIII. Test-first, non-vacuous | A scaffold then a red commit per phase with the story tests (I3); paired "does not" bodies; platform-passable bodies carry an element-only assertion ([contracts/checks.md](contracts/checks.md)); plants for CSS-only behaviour, motion included, run per phase and recorded in `reviews/phase-N/plants.md`; zero-count bodies end with a positive control; driver additions with their own tests in the red step ([contracts/checks.md](contracts/checks.md) § Driver additions); mutation with op 015's shards; the R-01, R-07 and R-08 measures re-run as tests before green, a failure going to the operator. |
| Licence, supply chain | No new dependency or asset. |
| Workflow gates | No gate added or changed. |

## Decisions the operator should see at the plan gate

1. **Two departures from control conventions rule 1** (R-01, R-03), both because the host holds the panel's content:
   no host click guard, so clicks on panel content reach the page (a click dispatched on the host toggles nothing;
   `element.click()` is overridden to toggle); and no `delegatesFocus`, `focus()` being overridden to focus the summary,
   so a click on panel content moves no focus (operator decision at squad round 1, PLAN-FRESH-1-001 (a)).
2. **Host `aria-expanded` is mapped onto `open`** (R-03, SPEC-2-09; operator decision at squad round 1,
   PLAN-CORRECTNESS-1-008 (a)): `"true"` opens, `"false"` closes, other values change nothing, removed from the host
   with no mirror. No exception to Principle III remains.
3. **Digest layout** (R-07): inline spans with `<wbr>`, chosen by measure; a unit wider than the line breaks inside, so
   the never-break-inside rule yields to 1.4.10 (SPEC-2-08). The spec's FR-033 and US2-12 wording was aligned with
   R-07 by the analysis fixes (`reviews/analysis/fixes-1.md`, C1), before T024 writes the US2-12 bodies.
4. **Code block sizing** (R-06, SPEC-2-07): a block that fills its container, capped at `measure-reading`.
5. **No inventory** (R-11): the README gets no kitty-mission-ui mapping rows for these two unless the operator supplies
   one.
6. **A disclosure last in an overlay** (squad round 2, PLAN-FRESH-2-002, operator decision (b)): mission 008's
   `focusable.ts` and `overlay.ts` are not changed by this mission; the Tab escape is recorded in research.md §
   Repository-wide notes for a separate op and stated in the README's disclosure section.
7. **Spec-check-2 notes** SPEC-2-01 to SPEC-2-09: answered in research (R-02, R-03, R-06 to R-08, R-11) and
   [contracts/checks.md](contracts/checks.md) (SPEC-2-06: a body per unscenarioed FR and edge case). The spec's own text
   for SPEC-2-01, -03, -04, -05, -07, -08 and -09 is updated by the first squad fix if the squad confirms them;
   SPEC-2-01 (the Consumers paragraph's "FR-048", meaning FR-058) was corrected by the analysis fixes (F3).

## Project Structure

### Documentation (this feature)

```text
specs/020-disclosure-code-block/
├── spec.md
├── plan.md              # this file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   ├── elements.md      # public surface, README statements, the digest convention
│   └── checks.md        # test layout, oracles, plants, gates
├── checklists/requirements.md
├── reviews/             # spec checks, squad rounds, phase reviews
├── triage.ref
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
packages/elements/
├── src/
│   ├── ocelle-disclosure.ts      # phase 1 (imports ocelle-icon.ts, control.ts, icon-slot.ts)
│   ├── ocelle-code-block.ts      # phase 2 (imports overflow-region.ts)
│   ├── index.ts, browser.ts      # exports (both phases)
├── package.json                  # entry points (both phases)
├── custom-elements.json          # regenerated (both phases)
├── README.md                     # two sections; § Element conventions: Digests (phase 2)
├── CHANGELOG.md
└── test/
    ├── scenarios/disclosure.ts, scenarios/code-block.ts
    ├── disclosure.test.ts, code-block.test.ts
    ├── entry-disclosure.test.ts, entry-code-block.test.ts
    ├── browser/disclosure.test.ts, browser/code-block.test.ts
    ├── browser/fixtures/disclosure.html, browser/fixtures/code-block.html
    ├── scenarios/driver.ts, in-process.ts, browser/driver.ts   # § Driver additions of contracts/checks.md
    └── node/ (README and manifest tests, extended)
storybook/
├── stories/disclosure.stories.ts, stories/code-block.stories.ts
└── baselines/<story-id>.<theme>.png
```

Plants are not committed: they are run per phase and recorded in `specs/020-disclosure-code-block/reviews/phase-N/
plants.md` ([contracts/checks.md](contracts/checks.md) § Plants).

**Structure Decision**: the library's existing layout (README § Files and tests); nothing new.

## Phases (user stories) for `/speckit-tasks`

### Phase 1: US1 `ocelle-disclosure` (P1), on the branch as cut from `main`

1. Spike (before red): R-01's summary role and `expanded` in the CDP tree; R-08's fragment reveal of a shadow
   `details`; `::-webkit-details-marker` under `style-lint`. Recorded in `reviews/phase-1/`; a failure goes to the
   operator.
2. Scaffold: module, exports, empty render.
3. Red: first the driver additions of phase 1 (`findText`, `setProperties`) with their driver tests; then
   `test/scenarios/disclosure.ts` bodies US1-1 to US1-23 and the FR bodies; the in-process and fixture tests;
   the entry test; the README and manifest node tests; `disclosure.stories.ts` and its story-test extension (I3).
4. Green: the element (R-01 to R-04); README section; manifest; CHANGELOG; baselines in the pinned container; the
   plants of [contracts/checks.md](contracts/checks.md) run against the green source and recorded in
   `reviews/phase-1/plants.md`.
5. Gates locally: unit tests, typecheck, lint, style-lint, csp, prefix, manifest, contrast, mutation (shards),
   storybook-build, visual, axe.

### Phase 2: US2 `ocelle-code-block` (P2), after the operator's decision on mission 019

0. **Operator stop (FR-060)**: report whether mission 019 is on `main` and what it changed in
   `src/overflow-region.ts`; the operator decides how to proceed, and the record names phase 2's base, against which
   SC-007 and SC-008 are diffed in phases 2 and 3. No merge of `main` without that answer.
0a. Spike (before the scaffold): R-07's and R-06's measures under the pinned browser, and the axe measure of an
   unnamed overflowing scroll block (T021a), whose result decides whether that state gets a story or keeps the
   Complexity Tracking exception; if axe fails it, the run stops for the operator. Done: axe reports nothing on the
   unnamed tab stop and one serious `color-contrast` incomplete result on every overflowing scroll block; the
   operator decided to add exception entries and keep the story (Complexity Tracking, research R-09).
1. Scaffold, then red: first the driver additions of phase 2 (`copyShadow`, `copyShadowRun`, `ariaSnapshot`) with
   their driver tests; then `test/scenarios/code-block.ts` US2-1 to US2-21 and the FR bodies (with R-07's copy, AX and
   break-position measures as tests), tests, entry test, node tests, `code-block.stories.ts` (I3).
2. Green: the element (R-05 to R-07); README section and § Element conventions "Digests"; manifest; CHANGELOG;
   baselines; plants run and recorded in `reviews/phase-2/plants.md`.
3. Gates locally as phase 1.

## Complexity Tracking

| Exception | Principle | Scope | Rationale | Sunset | Approval |
|---|---|---|---|---|---|
| Two supported states have no story | V | (1) the disclosure with no name (empty summary, no host label); (2) the wrap-mode code block with a host `aria-label`, which the README advises against. Each proven by browser bodies in both harnesses (T005, T025). The overflowing scroll block with no `label` and no host `aria-label` left this row after T021a: it gets the `ScrollUnlabelled` story (T028; operator decision `reviews/phase-2/operator-axe-decision.md`, 2026-11-21). | (1): axe fails the unnamed disclosure by design (a consumer error the element must not hide), and a story would need an `a11y-exceptions.json` entry. (2): a story would show consumers a use the README advises against. | (1): when the `axe` gate can carry a known consumer error without an exception entry. (2): when the README stops advising against it. | Operator, tasks gate 2026-11-20 (`reviews/analysis/operator-decisions.md`); the scroll-block state removed after T021a (`reviews/phase-2/operator-axe-decision.md`, 2026-11-21). |

axe exceptions under FR-051 (operator decision on T021a, "add exceptions and keep the story", 2026-11-21,
`reviews/phase-2/operator-axe-decision.md`; measure `reviews/phase-2/axe-unnamed-scroll.md`, research R-09). On every
overflowing scroll block, labelled or not, in light and dark, axe-core 4.14.0 with the FR-016 rule set reports one
serious `color-contrast` incomplete result, reason `elmPartiallyObscured`, on the shadow `pre.code`: the line is
clipped by the scroll box, so axe cannot decide its contrast. It follows the Prose document's entries (spec 006
plan.md § Complexity Tracking) and takes their sunset verbatim, as the operator decided. T028 adds each row below as
one entry of `storybook/a11y-exceptions.json`, with the same story, theme, rule, selector, reason and sunset and
`plan` `specs/020-disclosure-code-block/plan.md`; the gate honours an entry only with its row here (spec 006 FR-029,
research R-08), and an entry that matches no node is a `stale-exception` finding.

The selector is the gate's printed form (`printSelector` in `gates/lib/axe-verdict.ts`: shadow levels joined by
` >>> `), compared exactly with the entry's `selector` (`matchExceptions` in `gates/lib/a11y-exceptions.ts`). The
measure printed `x-code-block >>> .code` for the stand-in, one block per story; with the real tag it is expected to be
`ocelle-code-block >>> .code`. T028 runs the gate on the new stories with the entries and confirms that each story-theme
gives exactly this one node; a different selector (for example a host selector with `:nth-child` in a story with more
than one block, or a digest unit instead of `.code`), another rule, a further node, or an overflowing story without
the result goes back to the operator before any row or entry is changed. Adding the entries also changes the axe
gate's integration test (`gates/test/integration/axe.test.ts`): its story-theme counts, its notes and excepted counts
(10 to 24) and its list of excepted notes, in run order.

| Story | Theme | Rule | Selector | Reason | Approval | Sunset |
|---|---|---|---|---|---|---|
| `elements-ocelle-code-block--scroll-overflowing` | `light` | `color-contrast-incomplete` | `ocelle-code-block >>> .code` | clipped line of the code block's scroll box (`elmPartiallyObscured`) | operator, 2026-11-21 | the op that fixes the color-contrast incomplete results of base.css's prose table scroll box (003 surface), to be opened by the operator |
| `elements-ocelle-code-block--scroll-middle` | `light` | `color-contrast-incomplete` | `ocelle-code-block >>> .code` | clipped line of the code block's scroll box (`elmPartiallyObscured`) | operator, 2026-11-21 | the op that fixes the color-contrast incomplete results of base.css's prose table scroll box (003 surface), to be opened by the operator |
| `elements-ocelle-code-block--scroll-end` | `light` | `color-contrast-incomplete` | `ocelle-code-block >>> .code` | clipped line of the code block's scroll box (`elmPartiallyObscured`) | operator, 2026-11-21 | the op that fixes the color-contrast incomplete results of base.css's prose table scroll box (003 surface), to be opened by the operator |
| `elements-ocelle-code-block--scroll-focused` | `light` | `color-contrast-incomplete` | `ocelle-code-block >>> .code` | clipped line of the code block's scroll box (`elmPartiallyObscured`) | operator, 2026-11-21 | the op that fixes the color-contrast incomplete results of base.css's prose table scroll box (003 surface), to be opened by the operator |
| `elements-ocelle-code-block--digest-scroll` | `light` | `color-contrast-incomplete` | `ocelle-code-block >>> .code` | clipped line of the code block's scroll box (`elmPartiallyObscured`) | operator, 2026-11-21 | the op that fixes the color-contrast incomplete results of base.css's prose table scroll box (003 surface), to be opened by the operator |
| `elements-ocelle-code-block--right-to-left-scroll` | `light` | `color-contrast-incomplete` | `ocelle-code-block >>> .code` | clipped line of the code block's scroll box (`elmPartiallyObscured`) | operator, 2026-11-21 | the op that fixes the color-contrast incomplete results of base.css's prose table scroll box (003 surface), to be opened by the operator |
| `elements-ocelle-code-block--scroll-unlabelled` | `light` | `color-contrast-incomplete` | `ocelle-code-block >>> .code` | clipped line of the code block's scroll box (`elmPartiallyObscured`) | operator, 2026-11-21 | the op that fixes the color-contrast incomplete results of base.css's prose table scroll box (003 surface), to be opened by the operator |
| `elements-ocelle-code-block--scroll-overflowing` | `dark` | `color-contrast-incomplete` | `ocelle-code-block >>> .code` | clipped line of the code block's scroll box (`elmPartiallyObscured`) | operator, 2026-11-21 | the op that fixes the color-contrast incomplete results of base.css's prose table scroll box (003 surface), to be opened by the operator |
| `elements-ocelle-code-block--scroll-middle` | `dark` | `color-contrast-incomplete` | `ocelle-code-block >>> .code` | clipped line of the code block's scroll box (`elmPartiallyObscured`) | operator, 2026-11-21 | the op that fixes the color-contrast incomplete results of base.css's prose table scroll box (003 surface), to be opened by the operator |
| `elements-ocelle-code-block--scroll-end` | `dark` | `color-contrast-incomplete` | `ocelle-code-block >>> .code` | clipped line of the code block's scroll box (`elmPartiallyObscured`) | operator, 2026-11-21 | the op that fixes the color-contrast incomplete results of base.css's prose table scroll box (003 surface), to be opened by the operator |
| `elements-ocelle-code-block--scroll-focused` | `dark` | `color-contrast-incomplete` | `ocelle-code-block >>> .code` | clipped line of the code block's scroll box (`elmPartiallyObscured`) | operator, 2026-11-21 | the op that fixes the color-contrast incomplete results of base.css's prose table scroll box (003 surface), to be opened by the operator |
| `elements-ocelle-code-block--digest-scroll` | `dark` | `color-contrast-incomplete` | `ocelle-code-block >>> .code` | clipped line of the code block's scroll box (`elmPartiallyObscured`) | operator, 2026-11-21 | the op that fixes the color-contrast incomplete results of base.css's prose table scroll box (003 surface), to be opened by the operator |
| `elements-ocelle-code-block--right-to-left-scroll` | `dark` | `color-contrast-incomplete` | `ocelle-code-block >>> .code` | clipped line of the code block's scroll box (`elmPartiallyObscured`) | operator, 2026-11-21 | the op that fixes the color-contrast incomplete results of base.css's prose table scroll box (003 surface), to be opened by the operator |
| `elements-ocelle-code-block--scroll-unlabelled` | `dark` | `color-contrast-incomplete` | `ocelle-code-block >>> .code` | clipped line of the code block's scroll box (`elmPartiallyObscured`) | operator, 2026-11-21 | the op that fixes the color-contrast incomplete results of base.css's prose table scroll box (003 surface), to be opened by the operator |
