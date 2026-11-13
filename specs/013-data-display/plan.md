# Implementation Plan: Data Display, First Slice (Facts, Empty State, Progress)

**Branch**: `013-data-display` (work on `claude/013-data-display`) | **Date**: 2026-11-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/013-data-display/spec.md` (approved at the spec gate after check 2,
2026-11-13).

## Summary

This mission adds four elements to `@ocelle/elements`, under 005's element conventions: `ocelle-facts` with its pair
child `ocelle-fact`, `ocelle-empty-state` and `ocelle-progress`. They replace kitty-mission-ui's three largest class
families: 183 uses of `.sk-facts`, `.sk-empty-state` and `.sk-progress`.

Measurements in this container ([spike/RESULTS.md](spike/RESULTS.md)) drove three designs:

- **Facts semantics.** `ocelle-facts` renders the description list itself and places each `ocelle-fact` into its
  `<dd>` by manual slot assignment. This is the only structure that gives one clean Chromium description list and
  passes axe's `definition-list` and `dlitem` rules (R-01). So FR-004 can stand as written; see the decision at the
  plan gate.
- **Facts stacking.** The sheet stacks on its own inline size through a `ResizeObserver` and a token-sized probe, with
  no `container-type`. A size container collapses to 0 px in dialogs and flex items (R-02).
- **Progress naming.** `ocelle-progress` is the progressbar itself through `ElementInternals`. This is one node, and a
  host `aria-label` still names it (R-05). Its fill always carries an `accent-strong` edge, at 4.1:1 or more against
  the track and every ground (R-06). The indeterminate loop is `calc(var(--ocelle-motion-base) * 7)`, which needs no
  new token and is 0 ms under reduced motion, where a still mid-track mark replaces the motion.

No token is added. `@ocelle/tokens` gains 12 contrast rows (R-07). Nothing depends on #15. Baselines and axe follow
#10's design and are rechecked when #10 lands (R-08).

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
- A new browser command, `emulateReducedMotion`.
- The story test in `storybook-integration`.
- Contrast rows and a pairing test.
- Details: [contracts/checks.md](contracts/checks.md).

**Target Platform**: evergreen Chromium, measured. WebKit 16.4+ is unmeasured, as the README states. The engine floor
is unchanged (R-08).

**Project Type**: library (web components) in a pnpm workspace.

**Performance Goals**: none specific. Each element class adopts one shared stylesheet. Facts uses one
`ResizeObserver` and one `MutationObserver` per sheet.

**Constraints**:
- strict CSP with no exception (the fill's width is a CSSOM write, R-06);
- token-only styles;
- no `sk-` names and no monospace;
- no I/O;
- one heavy job at a time in this container.

**Scale/Scope**: 4 elements, 0 tokens, 12 contrast rows, 1 browser command, about 23 stories.

## Constitution Check

*Gate: passes before Phase 0. Re-checked after Phase 1 design: passes, with the one inherited exception in Complexity
Tracking.*

| Principle | How this plan meets it |
|---|---|
| I. Names, no I/O, small interface, manifest | **Tags**: `ocelle-facts`, `ocelle-fact`, `ocelle-empty-state`, `ocelle-progress`. **Events**: none, since no element has a user intent to report. **I/O**: none. **Interfaces**: `density`; `label` and `wrap`; `variant`; and `value`, `max`, `value-text`, `label`, `show-label`, `size`. One CSS hook, `--ocelle-facts-stack-below`, named after the element. The manifest declares everything, each list stated even when empty ([contracts/elements.md](contracts/elements.md)). |
| II. Tokens only, brand rules | **Lint**: every style is a `css` template checked by `token-only`, with no new allowance (`%`, `fr`, numbers in `calc()`, `scale: -1 1` and `0` are allowed today). **No monospace**: values use `font-sans` with `figures`. **Ochre fill never the only mark**: the `accent-strong` inset edge on every fill and mark, in both themes (R-06). **Ochre text on bone**: none. **`color-rule`**: not used. **Radius**: `radius-1` on the progress track (a small mark). |
| III. Accessible by construction | **ID references**: none. Facts has no cross-root reference because the sheet renders `dt`/`dd` itself (R-01). Progress takes its name through ElementInternals, so a host `aria-label` names it (R-05). **Headings**: the empty state never adds one; the level is the consumer's. **Motion**: the indeterminate animation stops under reduced motion and a still mark replaces it. **Contrast**: 12 new non-text rows. **Forced colours**: a track outline, `Highlight` fill and `CanvasText` text. **Reflow**: at 320 px and 640 px. **Accessibility-tree tests** in both harnesses. **axe**: see Complexity Tracking. Under #10, axe cannot check the progress name (R-05); the AX-tree tests prove it. |
| IV. Strict CSP, offline | **Styles**: adopted stylesheets, with no `style` attribute in any template. The progress fill's width is set through the CSSOM, which `style-src` does not block (R-06). **Fixture pages** assert zero violations with each element rendered. **Network**: none. |
| V. Storybook, behaviour tests | **Stories**: one per variant and state, light and dark (R-08). The unnamed progress and the host-`aria-label` progress are excepted and proven by tests (FR-050, R-05). **Events**: none to assert. **Keyboard**: no element is focusable, and focus passing through slotted content is tested (US2-6). **Baselines**: see Complexity Tracking. |
| VI. Consumer-driven, own code | **Needs**: kitty-mission-ui's three class families; spec-kitty-design #280, #498, #510, #523, #531, #535 (unread from this session, R-03). Nothing copied. The README mapping names roles only (FR-058). |
| VII. Semver | **MINOR**: four elements, four entry points, one CSS hook, contrast rows. CHANGELOG entries for `@ocelle/elements` and `@ocelle/tokens` (FR-057). |
| VIII. Test-first, non-vacuous | **Red first**: each phase starts with a red commit holding the scenario bodies and, per I3, the story-test extension. `red.sh` records one red record per phase. **Pairing**: "does not" outcomes are paired with a positive one, and plants are named for the vacuous-risk oracles ([contracts/checks.md](contracts/checks.md)). **Mutation**: element source is mutated in process (005 R-12 and decision 16's reading); Timeout and CompileError are reported and pass (#23). **Spikes** are recorded before red commits (phase 1: facts structure under Lit and axe 4.14.0, and stacking; phase 3: the valuetext oracle). |
| Licence, supply chain | No new dependency or asset. |
| Workflow gates | No gate added. Existing gates run on the new source (contracts/checks.md § Gates touched). |

## Decisions the operator should see at the plan gate

1. **FR-004 (SPEC-1-04 "D"): measured achievable as written.** With manual slot assignment the Chromium tree is
   `DescriptionList > term, definition, …`, and axe is clean (R-01). The plan proposes confirming FR-004 unchanged.
   The rechecks under Lit and axe-core 4.14.0 in phase 1's spike precede the red commit.
2. **Stacking mechanism (R-02).** `ResizeObserver` and a probe instead of a container query, with a public CSS hook
   `--ocelle-facts-stack-below` (24rem by default).
3. **Progress basis (R-05).** ElementInternals, so axe cannot test the name. No story sets a host `aria-label` (that
   would be an axe false positive), and the AX-tree tests carry the evidence.
4. **Track boundary on inset and accent-low grounds** is below 3:1 (2.80 to 2.95). The spec requires 3:1 for the fill
   only. The README states it (R-06).
5. **The upstream spec-kitty-design issues were not readable** from this session (R-03). FR-008's compact rule keeps
   its default. If the operator can supply #531's text, the compact value size is rechecked.
6. **`value-text` while indeterminate** is not exposed (R-05).

## Project Structure

### Documentation (this feature)

```text
specs/013-data-display/
├── plan.md              # this file
├── research.md          # R-01 to R-09
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── elements.md      # the public surface
│   └── checks.md        # tests, plants, contrast rows, story test, gates
├── spike/               # measurement scripts and RESULTS.md (phase 0)
├── checklists/requirements.md
├── reviews/             # spec checks, plan squad, phases
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
packages/elements/
├── src/
│   ├── ocelle-facts.ts          # new
│   ├── ocelle-fact.ts           # new
│   ├── ocelle-empty-state.ts    # new
│   ├── ocelle-progress.ts       # new
│   ├── index.ts, browser.ts     # re-export / define the four
├── test/
│   ├── scenarios/{facts,empty-state,progress}.ts
│   ├── {facts,empty-state,progress}.test.ts           # in process (mutated)
│   ├── browser/{facts,empty-state,progress}.test.ts   # built browser build, strict CSP
│   ├── commands.ts, commands.test.ts                  # + emulateReducedMotion
│   ├── entry-*.test.ts                                # entry points of the four
│   └── node/readme.test.ts, node/progress-pairs.test.ts
├── custom-elements.json         # regenerated
├── package.json                 # exports
├── README.md, CHANGELOG.md
packages/tokens/
├── src/source.ts                # accent-strong declared grounds
├── contrast/pairs.json          # +12 rows
└── CHANGELOG.md
gates/ (tests with pinned contrast counts, bin/contrast.ts comment)
storybook/stories/{facts,empty-state,progress}.stories.ts
storybook/test/integration/elements-stories.test.ts
```

**Structure Decision**: the existing workspace layout. Every new file sits where 005's conventions put it.

## Phases (user stories) for `/speckit-tasks`

Each phase is one unit for `/ocelle-run` step 4. The red commit holds the phase's scenario bodies, unit tests, node
tests and the story-test extension (I3), changes only test files, and is recorded by `red.sh`. Each phase is folded
after its approval.

1. **US1 Facts** (P1, MVP):
   - **spike** (`reviews/phase-1/spike.md`, before the red commit):
     - the A5 structure built with Lit (`createRenderRoot` with `slotAssignment: "manual"`, assignment in `updated()`);
     - axe-core 4.14.0 on it;
     - FR-009's bound in a dialog, a popover, a float and a flex item;
     - the stacked and two-column states, and right-to-left;
     - whether an empty `<dt>` stays a term node (R-01);
   - **red**:
     - US1 scenarios 1 to 10 as shared bodies;
     - the extra bodies of contracts/checks.md (dynamic children and labels, right-to-left, 640 px, `ocelle-fact` alone,
       non-fact children hidden, shrink-to-fit hosts);
     - `entry-facts` and `entry-fact` tests;
     - US1-4's copy check;
     - the README test statements for the facts section, the slotted-item convention and the engines line;
     - the story-test extension for the facts stories;
     - the named plants (probe removed, `<dl><slot>` structure);
   - **green**:
     - `ocelle-fact.ts` and `ocelle-facts.ts`;
     - `index.ts` and `browser.ts`;
     - `exports`;
     - the regenerated manifest;
     - the facts stories;
     - the README sections (facts, conventions, engines);
     - the CHANGELOG entry.
2. **US2 Empty state** (P2):
   - **red**:
     - US2 scenarios 1 to 6 and 8 as shared bodies;
     - US2-7 with an `ocelle-progress` stand-in: a plain element in `visual`, since progress comes in phase 3;
       phase 3 extends US2-7 to the real `ocelle-progress`;
     - the slots filled and emptied later, and several actions at 320 px;
     - the entry test, the README statements and the story-test extension;
   - **green**:
     - `ocelle-empty-state.ts`;
     - exports;
     - the manifest;
     - the stories (the panel-loading story arrives in phase 3);
     - the README section and its heading rule (FR-056);
     - the CHANGELOG.
3. **US3 Progress** (P3):
   - **spike** (`reviews/phase-3/spike.md`): the `valuetext` oracle (R-05).
   - **red**:
     - the `emulateReducedMotion` command test;
     - US3 scenarios 1 to 11 as shared bodies;
     - SPEC-2-02's bodies;
     - US2-7 extended to `ocelle-progress`;
     - the contrast counts in the pinned tests (328 → 340) and the pairing test `test/node/progress-pairs.test.ts`;
     - the entry test, the README statements and the story-test extension (progress stories and the empty-state
       panel-loading story);
     - plants (no `animation: none` under reduced motion; no `accent-strong` edge);
   - **green**:
     - `ocelle-progress.ts` and the `emulateReducedMotion` command;
     - the 12 rows in `pairs.json` and the `accent-strong` grounds in `source.ts`;
     - the `gates/bin/contrast.ts` comment;
     - exports and the manifest;
     - the stories;
     - the README section (naming, busy vocabulary, the inset-ground note, axe and the name);
     - the CHANGELOGs for both packages.
4. **Polish and cross-cutting** (no new behaviour unless named):
   - not exempt: the README mapping (FR-058), with readme-test statements red first;
   - exempt (documentation): the final CHANGELOG surface lists (FR-057) and the quickstart run, recorded in
     `reviews/phase-4/`;
   - #10 recheck: if #10 is on `main` at this point, the baselines and the axe run per research R-08 (that part not
     exempt: the story test and gates). If not, a note in `reviews/phase-4/` saying the recheck is open.

Phases 2 and 3 depend on nothing from phase 1, but run in order so the README and exports change one phase at a time.
Phase 3 extends one phase 2 scenario (US2-7). No phase needs #15 merged.

## Complexity Tracking

| Exception | Scope | Rationale | Sunset |
|---|---|---|---|
| No visual baselines and no axe run for the new stories (constitution III, V) | the facts, empty-state and progress stories of this feature | 001's recorded exception "Storybook build, visual regression and axe gates absent" still applies while #10 is unmerged; the stories follow #10's design (R-08) | the merge of #10, when phase 4 or #10's rebase commits the baselines and runs axe |

The progress stories' axe pass not covering the accessible name is a property of axe with ElementInternals, not an
exception: the requirement (FR-030) is proven by the AX-tree tests (R-05). The unnamed and host-`aria-label` progress
states having no story is the spec's own exception (FR-050) and R-05's reasoning, recorded there.
