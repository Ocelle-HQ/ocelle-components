---
phase: 2
round: 1
verdict: approved
base: bb27aa5facb477ad327691c796ad025bc1f9ce88
head: f6b4124912a121513a1201ff4ef46abe334b64f8
tdd_check: pass
---

# Phase 2 review, round 1

Scope: `git diff bb27aa5..f6b4124` (User Story 2, `ocelle-empty-state`). There is no uncommitted change apart from
this file. The commits are c137b57 (base), 03b8d24 (scaffold), 96784d3 (red), 7883ce4 (green), af4e217 (two bodies
for mutation survivors), ad4152b (refactor and equivalent-mutant records) and f6b4124 (TDD-check outputs). The binding
operator decisions I applied are I3 and the decision blocks of spec.md (lines 55-183) and plan.md, IQ-06 to IQ-11 in
particular. I judged the implementer's `notes.md` and `plants.md` against the artifacts, not taken on trust.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | packages/elements/src/ocelle-empty-state.ts:204 | The reason given for the equivalent `CallExpression` record on `super.disconnectedCallback()` is "Lit's own disconnection only notifies reactive controllers". That is incomplete. In lit-element 4.2.2 (`node_modules/.pnpm/lit-element@4.2.2/.../lit-element.js:174-177`), `LitElement.disconnectedCallback` also calls `this.__childPart?.setConnected(false)`, which notifies async directives in the template. ReactiveElement's part (reactive-element.js:595-597) only notifies controllers. The template (lines 252-258) has no directive, only `class` and `@slotchange` bindings, and the element has no controller. So the mutant is still equivalent. The same holds for the BlockStatement record at :202, which covers this call. | Optional: add "and the root part's connection, which no directive in this template reads" to the reason. |
| R1-02 | note | packages/elements/test/commands.ts:10-55, 102, 123 | The AX readers now report an optional `level` on heading nodes. This is not one of the driver additions named in contracts/checks.md § Driver additions (:393-415). It is test-only and needed by US2-1, US2-2 and US2-10 ("a heading of level 3/2/1"). Its own test is at test/commands.test.ts:71-82; it covers `<h1>`, `<h3>` and an ARIA `role="heading" aria-level="5"`, with no level on a paragraph or a button. Only headings get the field, so no existing expectation changes: every phase 1 suite passes at HEAD. Accepted. | Optional: record the row in contracts/checks.md § Driver additions in a later documentation pass, so phase 3's AX value properties extend a listed reader. |
| R1-03 | note | packages/elements/test/build/build.test.ts (the `::slotted(ocelle-progress)` test) | The only phase 2 oracle for FR-021's "progress spans the column up to the reading measure" is a regex on the shipped stylesheet of `dist/ocelle-empty-state.js`. That checks the rule's shape, not its behaviour. This is acceptable for now: tasks.md T034 step 1 moves the behavioural plant to T052, and the US2-7 stand-in (a `role="img"` div, scenarios/empty-state.ts:307-325) cannot be matched by `::slotted(ocelle-progress)`. The stand-in body asserts what it can reach: the panel's visual-to-heading gap, that the visual part spans the column, and the AX order. It does not yet assert US2-7's "smaller of the column and `--ocelle-measure-reading`". | Phase 3 (T052 and the US2-7 extension): slot a real `ocelle-progress` and assert its inline size against both the column and the measure, and run the `::slotted(ocelle-progress)` plant. No phase 2 change. |
| R1-04 | note | packages/elements/test/scenarios/empty-state.ts:391-424 (af4e217) | Two bodies were added after green to kill mutation survivors: "No content and formatting whitespace" and "Moved after render". They are tests written after the code, not red-first. They only add assertions (`git diff 96784d3..HEAD` on the test paths is insertions only), they assert observable layout, and `check-final-tests-on-scaffold.log` shows both failing on the scaffold in both harnesses. That meets Principle VIII's "proven against the old code" rule. Accepted. | None. |

No blocking finding.

## Test quality

- **TDD check.** `tdd-check.json` reports `pass` with no problems:
  - red record `phase` 96784d3 exits 1;
  - the final tests exit 2 on the base (no test file found, as for every phase base before its tests) and 1 on the
    scaffold;
  - HEAD exits 0.

  The JSON names head ad4152b. The only later commit is f6b4124, which adds just those check outputs, so I did not
  re-run it.
- **Scaffold (03b8d24).** It adds only signatures:
  - `src/ocelle-empty-state.ts` with `define`, `@tagname`, the declared `variant` and an empty `render()`;
  - the exports in `index.ts` and `package.json`.

  There is no test file and no behaviour, and the final tests fail against it (above).
- **Red evidence (`red-phase.log`).** `unit-tests: 115 of 3532 tests failed`. Every failure is an `AssertionError`;
  there is no import, syntax or setup error. By file:
  - all 18 bodies fail in each harness (in-process `empty-state.test.ts` and fixture `browser/empty-state.test.ts`);
  - 39 readme statements and mapping rows;
  - 21 story tests (7 stories × light, dark, reduced motion);
  - the manifest declaration, the entry and root tests, and the build test's `::slotted(ocelle-progress)` half;
  - the pinned gate counts.

  Per the notes, these pass at red: the driver-addition body and the AX-level command test (both test harness code
  the red commit itself adds), the root-exports test and the build test's import half (the scaffold already exports
  the class). None is a scenario body, so the per-body red rule of tasks.md is met. I3 holds: the story-test
  extension (`storybook/test/integration/elements-stories.test.ts`) is in the red commit, and the stories themselves
  land in green, as research.md R-08 states.
- **Weakening.** `git diff 96784d3..HEAD` on the test pathspecs:
  - `scenarios/empty-state.ts`: +34 lines, the two bodies of R1-04;
  - the story file and the storybook-build plant's story file: new, in green.

  No test was weakened, skipped, deleted or loosened.
- **Vacuity.** I read every added or changed test:
  - Each body returns one observation that the harness compares with `toEqual` against expected values written
    from tokens (`source.ts` through R-04's token names, `tokenColour`, the system colours).
  - No assertion is conditional, and there is no `skip`/`only`, no snapshot and no swallowed error. The `?? 0` /
    `?? Infinity` fallbacks in US2-4 and US2-7 make the comparison fail when a value is missing.
  - Each "does not" outcome shares its body with a positive one:
    - the reading lists come with the heading and paragraph nodes;
    - `ground: transparent` comes with the heading and body type;
    - "no tab stop" comes with the Tab sequence reaching the button;
    - `height > 0` / `width > 0` guards come with the geometry they guard.
  - `test-lint` passes.
- **Coverage of the story.** Every scenario has a body in both harnesses:
  - US2-1 to US2-11;
  - US2-8's contrast half through the unchanged `gate:contrast` rows;
  - the edge cases tasks.md T024/T024a lists: present parts, filled and emptied slots, hidden content, 320 px with
    several actions, unset variant, the eyebrow bodies, the inline-content body.

  The element has no event (FR-024) and no keyboard model of its own. The only keyboard path is Tab through the
  slotted action, which US2-6 covers with the token focus ring and the absence of an added tab stop. The manifest
  test pins an empty event list.
- **Plants (`plants.md`).** Six plants were run once, recorded with the bodies they hit, and each one bites:
  - the "last present part has no margin" rule;
  - the `hidden` observer;
  - the eyebrow type rule;
  - the eyebrow's heading class;
  - the body `margin-block: 0`;
  - the body gap.

  The `::slotted(ocelle-progress)` plant is deferred to T052, as tasks.md T034 step 1 directs (R1-03).
- **Mutation.** `pnpm run gate:mutation -- --base bb27aa5` (my run):
  `mutation: 81 mutants on the changed lines of 2 files, none survived; 2 timeouts, 16 compile errors, 1 zero-mutant
  entry; 5 equivalent records`.
  - The 2 timeouts are `connectedCallback` emptied (:196-197): the element never renders.
  - The compile errors are type errors.
  - The zero-mutant entry is `index.ts`.

  I read each equivalent record against the source and Lit 4.2.2:
  - :188 `BooleanLiteral` on the initial `#has` flags: accepted. With nothing assigned no `slotchange` fires, so a
    flag wrongly `true` makes one empty wrapper the last present part. That wrapper is an empty flex box with
    `margin-block-end: 0` and zero size, so the element is still its block padding only, which the "No content" body
    checks. With anything assigned, the first-render `slotchange` recomputes all five flags from the slots.
  - :202 `BlockStatement` on `disconnectedCallback` and :206 `CallExpression` on `#observer.disconnect()`:
    accepted. A kept observer only calls `#refresh()` on an element out of the document. That recomputes the flags
    and requests a render of a box that is not laid out, and `connectedCallback` re-targets the observer on
    reconnection (the "Moved after render" body).
  - :204 `CallExpression` on `super.disconnectedCallback()`: accepted. It is equivalent, but the reason is
    incomplete (R1-01).
  - :224 `CallExpression` on the `disconnect()` before re-targeting: accepted. A stale observation of a node no
    longer assigned only triggers a recompute from the current slots, which gives the same flags. `observe()` on a
    node already observed replaces its options.
- **The ad4152b refactor (no behaviour change).** I checked each removed branch:
  - The observer callback now also re-targets. It reads the same slots, so it gives the same flags and the same
    observed set.
  - The `hasUpdated` guard is dropped from `connectedCallback`. Before the first render, `#slots()` finds no slot,
    so the refresh changes no flag and requests the update that is already pending.
  - `requestUpdate()` now runs on every refresh. Lit coalesces renders and commits only changed bindings, so the
    light DOM is not touched and the observer cannot loop.
  - The `nodeType === TEXT_NODE` test is dropped. `assignedNodes()` returns only slottables (elements and text),
    and elements are handled first.
  - The eyebrow's `before-heading` mark moved into `render()` with the same condition.

  The suite (`unit-tests: 3536 tests passed`) and the 100 visual captures pass after it.

## Other checks

- **Tasks.** Every task of `## Phase 2:` (T022 to T034a) is ticked, and its work is present:
  - scaffold, red and green commits;
  - the source, the manifest declaration (`custom-elements.json`, 5 elements);
  - the 7 stories with 14 baselines;
  - README section and 19 mapping rows (matching research.md R-11:1152-1170 row by row), and the CHANGELOG entry
    naming the `eyebrow` slot;
  - the plants and the recorded gate runs.

  The tasks.md diff only ticks boxes. Changes outside the element are reasoned in notes.md:
  - eight `manifest` plant trees gain the declaration their copies need;
  - `storybook-build/fail-empty-index` also replaces the new story file;
  - `visual/fail-token-changed` adds the six light empty-state story-themes that show `color-ink` (42 + 6 = 48 in
    its `why`; the actions-only story has no ink text);
  - `stories-layout.css` adds two `data-story` wrappers.

  `gate:plants` judges every one as expected. Phase 1's R1-04 (a Tab read for the facts links) has no phase 2 task;
  it stays open as a note, as notes.md says.
- **Constitution.**
  - I: only `ocelle-` names, no event, no I/O; the manifest declares the property, five slots and the part.
  - II: tokens only (style-lint, brand-rules); the eyebrow stays sans.
  - III:
    - no role, landmark, live region, heading or tab stop added;
    - no ID reference;
    - forced-colour text is CanvasText (US2-8), with the colour rules under `@media not (forced-colors: active)`;
    - axe reports 0 serious or critical findings on the 14 new story-themes, with no exception entry added.
  - IV: CSP 13 files clean, and the fixture bodies record zero violations and requests.
  - V: R-08's stories, panel loading excepted until phase 3, with light and dark baselines produced in the pinned
    docker container.
  - VI: the README mapping is by role and copies no code.
  - VII: the CHANGELOG entry is MINOR.
  - VIII: as above.
- **Plan and research.** The source follows R-04:
  - the structure and wrapper order;
  - the present-part rule, with `slotchange` plus a `MutationObserver` on `hidden` and on character data;
  - the margin table, default and panel, read off ocelle-empty-state.ts:56-131 against research.md:563-580;
  - the `.last` and `.before-heading` classes;
  - the heading and eyebrow type;
  - the body reset and the `.text` flex gap;
  - `::slotted(ocelle-progress)`, no ground, `:host([hidden])`.

  The public surface matches contracts/elements.md:63-75.
- **Story ids** (implementer's choice). `default`, `panel`, `heading-only`, `actions-only`, `several-actions-narrow`,
  `refusal-with-eyebrow` and `several-body-paragraphs` map one to one onto R-08's list minus panel loading. The
  refusal story has R-08's content: eyebrow, `<h1>`, sentence, path with `data-ocelle-wrap="anywhere"`, action.
  Accepted.

## Checks run

All on HEAD f6b4124 with `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` and
`OCELLE_VISUAL_ENGINE=docker`, one heavy job at a time.

| Check | Result |
|---|---|
| `gate:lint` | `lint: 287 files checked, no finding` |
| `gate:prefix` | `prefix: 227 files checked, no finding` |
| `gate:test-lint` | `test-lint: 194 files checked, no finding` |
| `gate:config-copies` | the two `story-config.yml` copies are identical |
| `gate:style-lint` | `style-lint: 15 files checked, no finding` |
| `gate:manifest` | `manifest: 5 elements checked, no finding` |
| `gate:csp` | `csp: 13 files checked, no finding` |
| `gate:signoff -- --range bb27aa5..HEAD` | `signoff: 7 commits checked, no finding` |
| `gate:pins` | `pins: 5 manifests checked, no finding` |
| `gate:brand-rules` | `brand-rules: 7 rules checked` |
| `gate:contrast` | `contrast: 160 pairs checked in light, 168 in dark (149 required per theme)` |
| `gate:typecheck` | `typecheck: no type error in the files of tsconfig.json` |
| `gate:plants` (docker only; podman absent) | `plants: 304 plants of 17 gates and the registry judged, every plant as expected` |
| `pnpm test` | `unit-tests: 3536 tests passed in 148 files` |
| `gate:storybook-build` | `storybook-build: built 50 stories` |
| `gate:visual` | `visual: 100 captures match their baselines (docker only: no cross-engine comparison)` |
| `gate:axe` | `axe: 100 story-theme runs, 0 serious or critical; 10 notes (0 incomplete, 10 excepted)` |
| `gate:mutation -- --base bb27aa5` | `mutation: 81 mutants on the changed lines of 2 files, none survived; 2 timeouts, 16 compile errors, 1 zero-mutant entry; 5 equivalent records` |

Not run: a podman cross-engine visual or plants comparison, because the container has no podman. CI's "Visual
regression" job remains the record for that.

## Earlier findings

None: this is round 1. An earlier attempt was lost to a container restart before it wrote anything. It left no stale
worktree (`git worktree prune -v` found none).
