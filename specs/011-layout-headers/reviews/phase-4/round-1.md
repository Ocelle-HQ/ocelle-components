---
phase: 4
round: 1
verdict: approved
base: f679e025061cb53bddd43a23120fc6613a41a524
head: 8da74a8b2fd1fd989f37ca31375fc690c1fcaca8
tdd_check: pass
---

# Phase 4 review, round 1

Scope: `git diff f679e02..8da74a8`. That range holds the scaffold `73b12a2`, the red commit `1933641`, the green
commit `9af0d50`, the operator decision record `90c6428` (decision 8, which touches only
`reviews/operator-decisions-implementation.md`) and the check outputs `8da74a8`. Before this review was written, the
working tree had no uncommitted change.

I judged the change against:

- spec.md US3-1 to US3-13, FR-020 to FR-023, FR-028, FR-033 to FR-036 and the common FRs (FR-001 to FR-008);
- research.md R-09, R-11 and R-17;
- contracts/checks.md (the role probe, the pairing plants and the story test);
- tasks.md Phase 4 (T033 to T040, with T035a);
- the constitution;
- operator decisions 4, 6, 7 and 8.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | specs/011-layout-headers/reviews/phase-4/red-phase.log (the `browser/context-sidebar.test.ts` lines); packages/elements/test/scenarios/context-sidebar.ts:509-529 | In the red run, US3-10 failed in process but **passed** on the strict-CSP fixture: 24 of the 25 fixture tests failed, and US3-10 was the one that passed. With the element undefined, its block children neither scroll nor clip at 320 px, and they still stack and wrap. So the fixture half of that scenario was not seen failing at red. It can fail, though. The same body failed at red in process, and two plants fail it in both harnesses (`overflow: hidden` with `white-space: nowrap`, and `flex-direction: column` dropped from `:host`; plants.md:74, :122). Principle VIII is met at the unit level: the final tests fail against the scaffold (`check-final-tests-on-scaffold.log`). | None. Recorded so the rail's US4-7 reflow scenario in phase 5 is checked the same way. |
| R1-02 | note | specs/011-layout-headers/reviews/phase-4/plants.md:119, :133-134; contracts/checks.md (the "Footer does not overlap the last section" row) | The contract's plant for US3-4, `max-block-size: 100%` on the layout container, fails no test. plants.md records it as equivalent, and I accept the reason. The host's block size is never definite: `block-size` is auto, `min-block-size` is only a minimum, and `align-self: start` stops a flex row or grid from stretching it. A percentage `max-block-size` on its flex item therefore resolves to `none`. Two stronger plants take its place, `max-block-size: 100%` on the host and the footer absolutely positioned at the block end, and each fails US3-4 in both harnesses. | None. The equivalence is recorded here as R-17 asks. |
| R1-03 | note | specs/011-layout-headers/reviews/phase-4/plants.md:120; contracts/checks.md (the US3-11 row, "border on the sections wrapper's text lines") | Shadow CSS cannot style a slotted text node, so the contract's planted defect for US3-11 cannot be applied as worded. The plant actually run moves each section's divider to its block end, except on the last section, which puts a divider between a section and the text after it. It fails US3-11 in both harnesses, so it is a faithful realisation. plants.md does not say which contract row it stands for. | None. Phase 5 could name the contract row a substitute plant replaces. |
| R1-04 | note | packages/elements/README.md (the `ocelle-context-sidebar` section, the inline-size sentence) | The README says: "In a flex row or a flex column the container sets the sidebar's inline size (...): there `align-self: start` leaves it at its content's inline size." In a flex row the inline axis is the main axis, and `align-self` has no effect on it there. The sidebar takes its content's inline size in a flex row whatever `align-self` is (flex-column-probe.log, rows 1 and 2). The words required by operator decisions 6 and 7 are present and asserted (readme.test.ts), and the clause after the colon is the implementer's own. It is accurate for the flex column. For the flex row it attributes the behaviour to the wrong property. | None required. A later documentation pass could say "there it takes its content's inline size". |
| R1-05 | note | storybook/stories/context-sidebar.stories.ts:16; storybook/baselines/elements-ocelle-context-sidebar--*.png | The stories slot bare `<a href>` links. base.css colours links only inside `[data-ocelle-prose]`, so the baselines show the UA link colours: blue in light and the UA's dark-scheme link colour in dark, not `--ocelle-color-link`. The element correctly leaves the colour of its slotted items to the page (the spec gives the sidebar no link styling), and axe reports no contrast finding. Still, the visual source of truth shows a non-brand link colour. | None for this phase. When `ocelle-nav-item` (#12) or a story stylesheet exists, the sidebar stories could use it. |

There are no blocking findings.

## Test quality

**Red/green check.**

- `tdd-check.json` reports `pass` with no problems:
  - base exit 2;
  - scaffold exit 1;
  - head exit 0;
  - one red commit (`phase`, `1933641`, exit 1).
- `head` in the JSON is `90c6428`. The only later commit, `8da74a8`, adds the check outputs themselves.
- The base run stops with "no test file found", as it did in phases 2 and 3, because the tool runs the final tests
  against a tree without them. The meaningful run is the scaffold run, which fails on assertions. The JSON and its logs
  match what the tool records.

**Red evidence.**

- `red-phase.log` has 115 failures out of 3486 tests. Every failure is an `AssertionError`, with no import, load or
  setup error.
- `check-final-tests-on-scaffold.log` lists exactly the same failures.
- The failures are spread across:
  - the two scenario harnesses (25 in process, 24 on the fixture; see R1-01);
  - the entry, root, exports, manifest and build tests;
  - 22 README statements;
  - 33 story-test cases;
  - the visual and plant-repo counts.
- The axe, manifest and storybook-build count changes passed at red. That is expected: the scaffold's regenerated
  manifest already lists six classes, and the story file, which counts as a test file, is in the red commit.

**Scaffold.**

- `73b12a2` adds only `export class OcelleContextSidebar extends LitElement {}` and its manifest entry.
- It has no definition, property, style, template or export, and adds no test file.

**No weakening.**

- `git diff 1933641..HEAD` touches none of these:
  - `packages/elements/test`;
  - `storybook/test`;
  - `storybook/stories`;
  - `gates/test`.
- The tests at HEAD are therefore the red commit's tests.

**Assertions.**

- Every one of the 25 bodies in `test/scenarios/context-sidebar.ts` returns one observation, compared with `toEqual`
  against values written by hand from the spec.
- Both harnesses run every body:
  - in process: `test/context-sidebar.test.ts`;
  - on the fixture: `test/browser/context-sidebar.test.ts`, which also asserts a clean CSP, request and console record.
- I found none of these:
  - a conditional assertion;
  - `skip` or `only`;
  - a snapshot;
  - a mock;
  - a swallowed error.
- Two constructs could look like a skipped or swallowed check, but are neither:
  - The `throw` in US3-11 (line 538) turns a missing text read into a failure.
  - The `try/finally` blocks in US3-9 and US3-10 only reset the forced-colours mode and the viewport.

**Divider read.**

- Dividers are read from pixels: a run of rows in which every pixel of the host's border box is the rule colour, so
  each counted divider spans the full width.
- The colour and thickness are matched by token name.
- This makes "four dividers across the whole inline size" a real check.
- The token-sentinel body shows that the colour, thickness, padding and ground follow the tokens.

**Coverage.** Every acceptance scenario has a body, and US3-3 has all of its variants:

- US3-1, with the two-sidebar page;
- US3-2, plus a whitespace label;
- US3-3:
  - in light and dark;
  - with `ocelle-section-header` and `span` sections;
  - with `ul` and `p` sections and edge `p hidden` elements;
  - under both page resets, plus a page rule on block margins, padding and display;
  - with hidden sections, including a hidden first section;
- US3-4:
  - block, flex-row and grid containers 100 px tall;
  - 600 px flex-row and grid containers;
- US3-5 to US3-8;
- US3-9 with both forced-colours palettes;
- US3-10;
- US3-11, both cases;
- US3-12:
  - the four naming cases;
  - "no other node carries the name";
  - the host `aria-label` kept, then removed;
- US3-13.

Beyond the acceptance scenarios there are:

- a token-sentinel body;
- a hidden-host and border-box body, including the padded-host twin added for the `box-sizing` plant;
- a no-event body, in which each step changes the layout or the name.

The element has no keyboard model of its own, and US3-8 shows it adds no tab stop.

**Plants (T040).**

- `plants.md` covers all 25 declarations of the template and the 6 selectors of its 3 grouped rules. Each of these
  fails at least one scenario in each harness.
- Every pairing plant in contracts/checks.md that names US3, the sidebar or its landmark fails its scenario, with three
  exceptions, each with a reason:
  - the CSP plant fails only on the fixture, which is where the policy is served;
  - the layout-container `max-block-size` plant is equivalent (R1-02);
  - the US3-11 plant is realised as noted in R1-03.
- The control run fails nothing.
- The `@internal`-removed plant fails the manifest test.

**Role probe.**

- I re-ran `role-probe.mjs` at HEAD. It gives `{"axeCore":"4.14.0","roles":{"labelled":"navigation","host":"navigation","neither":"navigation"}}`, the same as `role-probe.log`.
- The `#private` plant reading `null` is recorded there.

**Mutation.**

- I ran `pnpm run gate:mutation -- --base f679e02` myself: "28 mutants on the changed lines of 3 files, none survived;
  0 timeouts, 2 compile errors, 2 zero-mutant entries; 1 equivalent record".
- The 2 compile errors are at ocelle-context-sidebar.ts:149 and :152, where the mutated code no longer type-checks.
- The 2 zero-mutant entries are `src/index.ts` (an export) and `src/naming.ts` (a constant).
- The equivalent record, at ocelle-context-sidebar.ts:42, says `{ type: String }` → `{}` gives Lit's default
  options. That is correct: the default is type String, attribute `label`, the default converter, not reflected.
  It is the same record `ocelle-icon` carries.

## Checks run

All checks ran at `8da74a8`, with:

- `OCELLE_CHROMIUM_PATH` set to Chromium 1243;
- `OCELLE_VISUAL_ENGINE=docker`, with dockerd running (docker 29.9.2);
- podman absent.

| Check | Result |
|---|---|
| `gate:typecheck` | no type error |
| `gate:lint` | 297 files, no finding |
| `gate:style-lint` | 18 files, no finding |
| `gate:test-lint` | 201 files, no finding |
| `gate:csp` | 23 files, no finding |
| `gate:prefix` | 260 files, no finding |
| `gate:pins` | 5 manifests, no finding |
| `gate:config-copies` | identical |
| `gate:manifest` | 6 elements checked, no finding |
| `gate:signoff -- --range f679e02..HEAD` | 5 commits checked, no finding |
| `gate:storybook-build` | built 49 stories |
| `gate:axe` | 98 story-theme runs, 0 serious or critical; 10 notes (0 incomplete, 10 excepted, all on the Prose document as before) |
| `gate:visual -- --engine docker` | "98 captures match their baselines (docker only: no cross-engine comparison)" |
| `gate:mutation -- --base f679e02` | 28 mutants, none survived (see above) |
| `gate:plants` (`OCELLE_VISUAL_ENGINE=docker`, no `--skip-container`) | Partial; see below. The full run hit my 90-minute background limit during the axe plants and was stopped. That run prints its verdicts only at the end, so it gave none. I then ran these shards: |
| | shards 1 to 3 (every plant except the visual and axe plants, among them the manifest plants and the storybook-build plant this phase regenerated): "76 plants judged, every plant as expected" each |
| | shard 16 (`visual/fail-token-changed`, which this phase extended, with `fail-websocket` and `fail-xhr`): "3 plants judged, every plant as expected" |
| | shards 20 to 28 (the 25 axe plants): every plant as expected |
| | In all, 256 of 301 plants were judged and all were as expected. Not judged by me: the other 45 visual plants (shards 4 to 15 and 17 to 19), none changed by this phase, and the whole-run registry checks. notes.md records a full run at the green state as "301 plants … every plant as expected". |
| `pnpm test` | 3486 tests passed in 155 files |
| `role-probe.mjs` | navigation for all three hosts, axe-core 4.14.0 |

**Baselines (operator decision 4).**

- The phase adds exactly 22 PNGs and changes or removes none: `storybook/baselines/elements-ocelle-context-sidebar--*.{light,dark}.png`, the eleven stories in two themes.
- The baseline directory now holds 98 files, matching the 98 story-themes.
- notes.md records that they were made under docker in #10's pinned container, and that no podman cross-check was
  possible. CI confirms them at landing.
- `gate:visual` matches all 98 captures under docker.
- The four naming-case stories share their PNGs with `full`, byte for byte. That is expected: the name changes nothing
  that is drawn.
- I inspected `full.light`, `full.dark`, `empty-sections.dark` and `text-in-the-slot.light`:
  - the rail ground;
  - four full-width rules in `full`, and one rule between head and footer in `empty-sections`;
  - the footer directly after the content, because the story has no tall container;
  - in `text-in-the-slot`, the loose text set at the inline padding, with a rule directly beneath it and none above it.
- The `visual/fail-token-changed` plant gains the eleven new light story-themes.

**Tasks.**

- T033 to T040 and T035a are ticked, and their work is present:
  - the shared scenarios and both harnesses;
  - the entry, root, exports, manifest, build and pack tests;
  - the FR-036 README statements, one assertion each, including the decision-6/7 inline-size statement;
  - the CHANGELOG MINOR entry under Unreleased / Added;
  - the story test over the eleven stories;
  - the pinned lists, re-listed in notes.md and changed in the red commit;
  - `internalsKey` in `naming.ts`, `@internal`, not exported;
  - the element;
  - the root export and the `exports` key in the pinned place;
  - the eleven stories and their baselines;
  - the README section and Entry points row;
  - `plants.md` and the role probe.
- T038 names `src/browser.ts`. It needs no change, because it imports `./index.ts`.
- Each change outside `packages/elements` and `storybook` has its reason in notes.md:
  - the gate tests' pinned counts;
  - the manifest plants' copies;
  - the storybook-build plant's story file;
  - the visual plant list.

**Constitution and plan.**

- **I:**
  - The `ocelle-` tag is used.
  - There is no event, and the no-event body and its plant show it.
  - There is no I/O.
  - The interface is `label` and three slots.
  - The manifest lists exactly that, with no member for the internals key.
- **II:**
  - Every value in the template is a token, apart from the allowed `100%`, `auto` and `calc(-1 * …)`.
  - The `!important` section rules are the ones R-09 and the plan's Constitution Check name.
  - The ground is `--ocelle-color-rail`.
  - `--ocelle-color-rule` is used only for decorative dividers.
- **III:**
  - The host is the navigation landmark through `ElementInternals` under `internalsKey` (R-11), with no inner `<nav>`
    and no ID reference.
  - The host `aria-label` is never written. US3-1, US3-2 and US3-12 show this, as do their plants.
  - There is no tab stop.
  - The dividers are borders, drawn in a system colour in forced colours (US3-9).
  - axe passes on each US3-12 case story, each rendered alone.
- **IV:**
  - The template has no style attribute, and styles are adopted.
  - The fixture runs record no CSP violation or extra request.
  - `gate:csp` passes.
- **V:**
  - There is a story per state the spec names, in light and dark, with baselines (decision 4).
- **VII:**
  - The CHANGELOG names the element and its entry point as additions.
- **Plan:**
  - The host box follows R-09: `display: flex`, a column, `min-block-size: 100%` and `align-self: start`, kept as
    decisions 6 and 7 settle.
  - The internals are held under `internalsKey`, set in `updated()`. notes.md gives the reason: in a constructor, the
    manifest analyzer would read the role as a field.
  - The `classMap` change after the first mutation run uses the existing `lit` dependency and adds no dependency.

## Earlier findings

This is round 1 of phase 4; there are no earlier findings.
