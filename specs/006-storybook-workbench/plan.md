# Implementation Plan: Storybook workbench and visual regression baselines

**Branch**: `006-storybook-workbench` (work on `claude/010-storybook-workbench`) | **Date**: 2026-11-10 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/006-storybook-workbench/spec.md`, approved by the operator at gate
"spec" after two checks (check 2 clean). Spec check 2's eight plan notes (SPEC-2-01 to SPEC-2-08) are answered in
[research.md](research.md), where each is marked. The plan squad's round 1 (`reviews/plan/round-1/`) and the
operator's fork decisions of 2026-11-10 changed this plan and, as spec deltas, FR-005, FR-012, FR-013, FR-014, FR-016,
FR-023, FR-025, FR-026, FR-027 and FR-029, and added FR-030 and FR-031 (fixes note `reviews/plan/round-1/fixes-1.md`).
The plan squad's round 2 (`reviews/plan/round-2/`) and the operator's fork decisions of 2026-11-10 changed this plan
and, as spec deltas, FR-006 and FR-031 (fixes note `reviews/plan/round-2/fixes-1.md`).
The plan squad's round 3 (`reviews/plan/round-3/`, no forks) changed this plan and, as spec deltas, FR-025, FR-027
and FR-030 (fixes note `reviews/plan/round-3/fixes-1.md`).

## Summary

Three new gates make the Storybook a checked visual source of truth:

- **`storybook-build`** ("Storybook build") runs the Storybook workspace's own build and reports syntax errors,
  unresolved imports, unreadable story files and an empty index as findings; missing Storybook dependencies are exit 2.
- **`visual`** ("Visual regression") builds the Storybook on the host. It then runs the repository's capture script
  twice inside Microsoft's published Playwright image, pinned by its linux/amd64 manifest digest (Node 26.13.0,
  Chromium headless shell 1248, the versions this repository pins). In CI one run uses docker and the other podman,
  and the gate itself requires both there. Every story is captured in light and dark as a full-page normalised PNG,
  with an optional declared pointer state, and each capture is compared byte for byte with `storybook/baselines/`. A
  story fails if its two runs differ, if it draws text in any face but Schibsted Grotesk, if it attaches a closed
  shadow root, if it makes a request outside the origin or any run-time I/O, or if it fails to render.
  Every capture and pointer state is taken at scroll position (0, 0), and a pointer target must lie inside the
  initial viewport. `pnpm run visual:update` writes the baselines from the same two runs, and with `--plant` the
  baselines of a visual pass plant; CI's captures, kept as job artifacts in baseline and plant-tree layout, are the
  record when a local run and CI disagree.
- **`axe`** ("Accessibility") runs axe-core 4.14.0 on the whole story document minus Storybook's harness, in both
  themes, on the host browser, without the rules that judge the harness document (FR-016). Serious and critical
  violations and serious and critical incomplete results are findings, one per node, as are surfaces rendered outside
  the story root and closed shadow roots; moderate and minor results are notes; an exception honoured only with its
  Complexity Tracking row turns one node into a note.

Each gate has fail, pass and breaking plants, and plant roots now hold the Storybook workspace. Following the
operator's answer Q1 (a), the `csp` gate goes back to covering only the packages' built output. The Storybook loses
its CSP header test, its externaliser is cut down to moving `<style>` elements only, and 002's two Storybook
exceptions and 001's "gates absent" exception are closed. The `@ocelle/elements` run-time CSP browser test is recorded
as the first element feature's. A contributor note in `storybook/README.md` tells
element issues how to add stories and baselines, and a documentation test checks the note's items.

## Technical Context

**Language/Version**: TypeScript 6.0.3 strict on Node 26.13.0 (gates, capture script, tests); Node runs `.ts`
directly (type stripping), inside the container too.

**Primary Dependencies**:
- existing: Storybook 10.6.5 (`@storybook/html-vite`), Playwright 1.64.1, Vitest 5.0.5, `pngjs` 7.0.0 (already in the
  lockfile, now an explicit root devDependency);
- new: `axe-core` 4.14.0 (exact pin, no dependencies, released 2026-10-05);
- container: `mcr.microsoft.com/playwright@sha256:ee15712262f017b8157421b212b12099146645f44b1bc5c0514cbbe6a229b1d0`
  (linux/amd64 manifest of `v1.64.1-noble`), run by docker or podman.

**Storage**: files: `storybook/baselines/*.png` (24 at first), `storybook/visual/container.json`,
`storybook/a11y-exceptions.json`; ignored output in `storybook/.visual/`.

**Testing**: `gates` (unit, pure modules, mutation-tested: every decision of the capture and of the in-page checks
lives in a pure module); `gates-integration` (real processes: the three gates on fixture trees, the container, the
plant job without an engine); `storybook` (unit, the readme test, the externaliser test); `storybook-integration` (the
render test, as before). The mutation scope gains `gates/visual/`. Research R-12.

**Target Platform**: captures on linux/amd64 in the pinned image, on every host (operator SPEC-1-06), with
`chromium_headless_shell-1248`; axe on the host Chromium (1248 in CI). CI on `ubuntu-24.04` runners, which have docker
and podman.

**Project Type**: repository gates and the private Storybook workspace; nothing published changes (semver none).

**Performance Goals**: each new job well under 10 minutes; the Storybook build takes 2.2 s here (measured). The image
is about 1 GB to pull and 3.6 GB unpacked per engine store (measured). Phase 3's review records the `Plants` job time
and the runner's free disk after both pulls (research R-07).

**Constraints**: byte-exact baselines; no network inside a capture (`--network none`, plus request routing); no root
needed on the host; one heavy job at a time locally.

**Scale/Scope**: 3 gates, 1 command (with a plant mode), about 70 plants (new and changed), 12 stories, 24 baselines,
about 14 new source modules.

## Environment (for every role in this feature)

- Start the docker daemon before any container work: `pgrep dockerd || (dockerd > "$SCRATCH/dockerd.log" 2>&1 &)`,
  then wait until `docker info` succeeds. Podman is not available here, so local runs use `--engine auto`
  (docker), and plants run with `OCELLE_VISUAL_ENGINE=auto`.
- `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` for host-browser tests (the axe
  gate's tests, the render test). The container brings its own Chromium 1248.
- The container's Node is 26.13.0. The sandbox's Node is 22, so the host side runs on 22 locally. Avoid asserting
  Node error texts (frontend findings).
- Leave `CI` and `GITHUB_ACTIONS` unset locally: with either `true`, the visual gate requires docker and podman
  (research R-06). Integration tests not about that rule remove both from the gate's environment.
- Podman behaviours (run arguments, rootless writes, inspect output, cross-engine bytes) are proven by the CI run of
  the branch that phase 3's review holds (research R-02); the operator pushes the branch for it.
- One heavy job at a time: browser suites, the container, mutation and plants never run in parallel.

## Constitution Check

*Pre-design and post-design: PASS. No new exception to a principle. Three exceptions are closed, and one accepted cost
with a sunset is recorded, the plant job's growth with the repository's stories (Complexity Tracking, operator
decision on PLAN-FRESH-2-007 (b)). Updated after the plan squad's rounds 1 and 2.*

| Principle | How this plan meets it |
|---|---|
| I. Names, no I/O | No element is added. The gates' names carry no `sk-`. The prefix gate's Storybook scope does not change (FR-022); it now matches declarations across lines. Run-time I/O of a story (same-origin fetch, XHR, WebSocket, EventSource, ping, storage by method or named property, cookies, IndexedDB, the Cache API, clipboard, beacon, and storage left when the render ends) fails the visual gate as `io` (FR-030, R-14), so the no-I/O rule has a check from the first element on. |
| II. Tokens, brand rules | The `font` rule makes "no face but Schibsted Grotesk" a merge gate for every story (research R-05), the text of form controls (values, placeholders, button-type input labels, in user-agent shadow roots) included, and the contributor note says an element's shadow styles set its form controls' font. The monospace walk stays in the render test. |
| III. Accessible | axe runs on every story in both themes, on the whole document minus Storybook's harness, so surfaces anywhere are audited, and a surface outside the story root, or a closed shadow root axe cannot enter, fails. Serious and critical violations and serious and critical incomplete results fail the gate, so rendered contrast that axe cannot decide is not passed silently; empty stories are not passes. The rule set and the harness-document rules not run are named in FR-016 and checked against axe-core's own metadata (R-08). An exception covers one node and is honoured only with its Complexity Tracking row (FR-029). Pointer states can be stories and are audited (R-15), in a browser context with the capture's options (1280 × 800, reduced motion), so axe audits the page the capture shows (R-08). Forced colours stay with the element tests (spec Edge Cases). |
| IV. Strict CSP | `csp` covers the packages' built output "with no exception" again: the Storybook is not built output of a package (operator Q1 (a)), so 002's exceptions 1 and 2 close. Elements remain bound to IV through their package output; their run-time strict-CSP browser test is recorded in `gates/README.md`'s deferred table as the first element feature's (#17 or #7), and the contributor note says element packages prove it in their own browser tests (R-10). |
| V. Storybook, baselines | Every story has two committed baselines made in a pinned container, covering the full page at scroll position (0, 0). The gate fails on a missing or stray baseline. CI's captures are the record when local and CI disagree (R-02), for the plants' baselines too: the baseline command's plant mode regenerates them and the Plants job uploads its captures in tree layout, for `pass-second-render` (`captureAlone`) captures made alone by single-story-theme requests so its freshness reference never comes from a full run (R-11). A story per state includes pointer states, whose target must lie inside the initial viewport so a state is never silently not applied (R-15). Baselines change only in a pull request whose description says why; the contributor note says so and landing checks it. |
| VI. Own code | The gates and the capture are this repository's code. The container image and axe-core are third-party tools used in CI and development only, not shipped (plan-gate decision 1). |
| VII. Semver | No published surface changes. |
| VIII. Test-first, proven | Every phase starts red, each red an assertion of the missing behaviour (the pin test asserts the file exists first; the render test's red is taken from the build output). Every decision, the capture's and the in-page checks' included, is a pure module, mutation-tested; only collection and process wiring carry `Stryker disable` comments naming their integration test, and `gates/visual/` is in the mutation scope (R-12). Every gate has fail, pass and breaking plants, with controls where a pass plant alone could not fail (R-04, R-11); the plant job cannot skip or silently drop the container plants (R-07). Plants stay meaningful as the repository changes: edited repository baselines are generated from the current files, never stored, fail plants take the baselines of their pass plant, and plant roots carry the repository's exceptions with their plan files (R-11, R-16). Each capture has one status by a tested order, so a plant's exact expectation does not rest on an unwritten choice (R-05); axe is shown to audit inside open shadow roots (R-08). Each capture refusal check has its own unit test and cause (R-06). The podman behaviours are proven in a CI run of the branch before phase 3 is approved (R-02). |
| Supply chain | `axe-core` and `pngjs` are pinned exactly and pass the release-age rule. The image is pinned by its manifest digest, pulled and run only by digest, checked by media type and `RepoDigests` on every engine (R-06). A test ties `container.json` to `.node-version` and to Playwright's expected headless-shell build (contracts/container.md). |
| Workflow gates | The registry gains three gates (`gates.json`, FR-020 list, `ci.yml` jobs). The required checks go from fourteen to seventeen in `gates/README.md`; the ruleset change is the operator's. In CI the visual gate requires both engines whatever the workflow passes (R-06). |

## Decisions the operator should see at the plan gate

Updated after the plan squad's round 1; the operator's fork decisions of 2026-11-10 are named where they apply.

1. **The pinned image** is Microsoft's published `mcr.microsoft.com/playwright:v1.64.1-noble`, by its linux/amd64
   manifest digest `sha256:ee15712…b1d0`, launched as `chromium_headless_shell-1248`. No image is built or published
   here, so no registry is needed (R-01, SPEC-2-08).
2. **Docker works in this sandbox** once its daemon is started; podman is not available. Local runs prove determinism
   with docker only. The docker-against-podman comparison and every podman behaviour are proven by a **CI run of the
   branch held by phase 3's review**, before phase 3 is approved, the operator pushing the branch (R-02;
   PLAN-TESTABILITY-1-010 (a)). Each pull of the image is about 1 GB and unpacks to 3.6 GB per engine store; the Plants and
   Visual regression jobs pull it under both engines and the Unit tests job once (R-07, R-12).
3. **axe runs on the host browser, on the whole document minus Storybook's harness nodes**, and fails `outside-root`
   for any other element a story adds to `<body>` (PLAN-A11Y-SECURITY-1-003 (a)). The rules that judge the harness
   document (`bypass`, `document-title`, `html-has-lang`, `html-lang-valid`, `html-xml-lang-mismatch`,
   `landmark-one-main`, `page-has-heading-one`, `region`) are not run, and FR-016 names them (spec delta,
   PLAN-CORRECTNESS-1-010 (a)) (R-08).
4. **axe `incomplete` results of serious or critical impact are findings** (`<rule>-incomplete`), clearable only by an
   exception; moderate and minor ones are notes (spec delta to FR-013, PLAN-A11Y-SECURITY-1-005 (a)) (R-08).
5. **The externaliser is cut down to `<style>` elements** (PLAN-FRESH-1-009 (a)), so Storybook's multi-line vendor
   monospace stack stays out of the HTML the prefix gate reads, and the prefix gate matches declarations across lines;
   the CSP header test is removed and Storybook's inline scripts stay in the HTML (R-10).
6. **FR-017's "missing dependencies" breaking plant stays** (PLAN-CORRECTNESS-1-007 (a)): plant roots now hold the
   Storybook workspace and its `node_modules` link, a plant can omit the link, and the gate resolves the Storybook CLI
   before building (exit 2 "storybook is not installed; run pnpm install"). The earlier decision 6 is dropped (R-09,
   R-16).
7. **Baselines are produced locally in this run** (docker here), confirmed by phase 3's CI run of the branch; **CI is
   the producer of record** when a local run and CI disagree: the Visual regression job uploads its captures in
   baseline layout, and the contributor note says to commit those (PLAN-FRESH-1-006 (a)) (R-02, R-11).
8. **In CI the visual gate requires both engines** whenever `CI` or `GITHUB_ACTIONS` is `true`, whatever `--engine`
   says (PLAN-TESTABILITY-1-008 (b)) (R-06).
9. **Exceptions are per node and checked against the plan** (spec delta to FR-029, PLAN-A11Y-SECURITY-1-006 (a),
   PLAN-CORRECTNESS-1-009 (a)): each entry names its node's selector and the plan whose Complexity Tracking holds its
   row; the gate honours it only when that row exists (R-08).
10. **Run-time I/O of a story fails the visual gate** as `io` (new FR-030, PLAN-A11Y-SECURITY-1-008 (a)) (R-14).
11. **Captures are full pages** at the 1280 px width, so overflow and top-layer content are captured (spec delta to
    FR-012, PLAN-FRESH-1-008 (a)) (R-04).
12. **Pointer states are stories**: a story parameter for hover or press, applied by the capture and by axe (new
    FR-031, PLAN-FRESH-1-010 (a)) (R-15).
13. **A pointer target must lie inside the initial 1280 × 800 viewport**, else `pointer-target`, and every capture is
    taken at scroll position (0, 0), the page scrolled back when a story moved it (spec deltas to FR-006 and FR-031,
    PLAN-FRESH-2-001 (a)) (R-04, R-15).
14. **Plant roots get an empty exceptions file**, and every axe plant carries the repository's entries and their plan
    files through `delta.json` `exceptions: "repository"`, so a recorded exception never breaks the axe plants
    (PLAN-FRESH-2-004 (b)); the rule for the axe plants other than `pass-repository`, which option (b) left open, is
    this plan's (R-16).
15. **Plant roots keep every repository story**; phase 3 measures the Plants job's time per story-theme in CI and sets
    the story count at which the job is split, recorded with the operator's approval in Complexity Tracking
    (PLAN-FRESH-2-007 (b)) (R-07).
16. **The font check reads form-control text**: text nodes are collected through CDP with `pierce: true`, user-agent
    shadow roots included and attributed to their host control (spec delta to FR-027 and FR-025, PLAN-FRESH-3-001)
    (R-05).
17. **Storage I/O is recorded in every form**: named-property Web Storage through a recording `Proxy`, cookies,
    IndexedDB, the Cache API and `execCommand` copy and cut, with the storage left after the render read as a
    backstop for writes (spec delta to FR-030, PLAN-FRESH-3-002) (R-14).
18. **The axe gate opens its context with the capture's options**, from one function that also gives the pointer
    rule its viewport (PLAN-FRESH-3-003) (R-08, R-15).

## Project Structure

### Documentation (this feature)

```text
specs/006-storybook-workbench/
├── plan.md, research.md, data-model.md, quickstart.md
├── contracts/ (gates.md, container.md, plants.md)
├── reviews/
└── tasks.md            (/speckit-tasks)
```

### Source Code (repository root)

```text
gates/
├── bin/storybook-build.ts, visual.ts, baselines.ts, axe.ts      # new gate entries and the baseline command
├── bin/csp.ts                                                   # Storybook scope removed
├── bin/prefix.ts                                                # declarations matched across lines
├── bin/plants.ts, lib/plant-judge.ts, lib/plant-runner.ts       # `engine` and `unlinked` keys, --skip-container,
│                                                                #   engine probe and not-run, serial Storybook plants
├── lib/plant-repo.ts                                            # configuration set with the Storybook workspace,
│                                                                #   storybook/node_modules link, delta `baselines`
│                                                                #   and `exceptions`, `baselinesOf`, `captureAlone` (R-11, R-16)
├── lib/storybook-index.ts, storybook-build.ts, storybook-serve.ts   # index, build parser and CLI check, local server
├── lib/container.ts                                             # engine resolution (CI rule), pin and inspect parsers, run args
├── lib/capture-plan.ts                                          # refusal predicate, context and screenshot options,
│                                                                #   readiness classification, request and I/O
│                                                                #   classification, pointer parameter and viewport
│                                                                #   rule, scroll decision, capture status order,
│                                                                #   storage-state classification (both gates'
│                                                                #   context options: contextOptions)
├── lib/story-checks.ts                                          # empty, fonts, closed shadow roots, outside-root
├── lib/story-page.ts                                            # in-page and CDP collection, init scripts (wiring)
├── lib/visual-verdict.ts, png.ts                                # verdicts, updatePlan, plant mode plan, normalise and diff
├── lib/axe-rules.ts, axe-verdict.ts, a11y-exceptions.ts         # rule selection, result mapping, printed selector,
│                                                                #   exceptions and plan pairing
├── lib/mutation/ranges.ts                                       # gates/visual/ in scope
├── lib/registry.ts, gates.json                                  # three gates added
├── visual/capture.ts                                            # runs inside the container; wiring only
├── plants/storybook-build/, visual/, axe/                       # new plants (contracts/plants.md)
├── plants/csp/, plants/prefix/, plants/plants/                  # changed plants
├── test/…                                                       # unit and integration tests, inspect-output fixtures
└── README.md                                                    # gates, deferred table (elements run-time CSP test)
storybook/
├── baselines/*.png                                              # 24 baselines
├── visual/container.json
├── a11y-exceptions.json                                         # []
├── README.md                                                    # contributor note (FR-025)
├── .storybook/main.ts                                           # Vite cacheDir inside the workspace root
│                                                                #   (Storybook's CACHE_DIR set by the build function)
├── package.json                                                 # build script, externaliser kept
├── scripts/externalise.ts                                       # cut down to <style> elements
└── test/integration/render.test.ts (was csp.test.ts), test/unit/readme.test.ts, externalise.test.ts (changed)
.github/workflows/ci.yml                                         # 3 jobs; csp job builds packages only; plants env
│                                                                #   and the plants' captures artifact
package.json, pnpm-lock.yaml, .gitignore                         # scripts, pins, storybook/.visual/, storybook/.cache/
specs/001-repository-foundation/plan.md, specs/002-design-tokens/plan.md   # exception rows marked closed
```

**Structure Decision**: the gates live in `gates/` as every gate does. The capture is a separate entry
(`gates/visual/capture.ts`) because it runs in another process and on another platform; it is always the gate's own
repository's file, mounted into the container, and holds no decision of its own. The Storybook workspace holds the
data the gates read (baselines, pin, exceptions).

## Phases (user stories) for `/speckit-tasks`

1. **Setup** (exempt, no behaviour, except where noted):
   - pins `axe-core` 4.14.0 and `pngjs` 7.0.0 as root devDependencies; root scripts; `.gitignore` gains
     `storybook/.visual/` and `storybook/.cache/`;
   - `storybook/visual/container.json`, with the pin test written first and shown red: its first assertion is that
     the file exists, so the red is an assertion failure, and a second case on a fixture copy with a wrong `node` and a
     wrong `browser` shows both assertions fail (contracts/container.md);
   - **the spike, the only one of this feature**, recorded in `reviews/phase-1/spike.md`:
     - Storybook 10.6.5's output for a syntax error, an unresolved import, a non-CSF file and missing dependencies;
     - the render signals and the error display for a module that throws, a render that throws and a missing id;
     - Storybook's harness nodes in the preview, its own fetch, xhr and storage use, cookies, IndexedDB and caches included, and the storage state it leaves
       (the I/O allow-list), whether the `execCommand` wrap records copy and cut, and the
       access path to the current story's parameters;
     - that a build writes nothing under `storybook/node_modules` with Vite's `cacheDir` and Storybook's `CACHE_DIR`
       moved;
     - the 12 stories captured twice in the container, full page (determinism, sizes, fonts found, glyphs Schibsted
       Grotesk lacks);
     - docker's `image inspect` and `buildx imagetools inspect --raw` outputs (fixtures) and the tag's index digest;
     - axe 4.14.0 on the 12 stories in both themes with the planned context and rules (findings to fix under FR-029);
     - two-node `color-contrast` and serious `incomplete` plant candidates, measured.
2. **US1 Storybook build** (P1):
   - `plant-repo.ts`: the extended configuration set, the `storybook/node_modules` link and the `unlinked` key, the
     plant root's exceptions file (`[]`, and `exceptions: "repository"` with `exceptionPlans`), red first in
     `gates/test/plant-repo.test.ts` and its integration test; the plant runner's serial Storybook plants;
   - `storybook-index.ts`, `storybook-build.ts` (parser, from the spike's fixtures, and the CLI check), the gate, its
     plants (`error-missing-dependencies` included), the registry entries, the `storybook-build` CI job;
   - the Vite cache directory in `.storybook/main.ts` and `CACHE_DIR` in the build function's environment, with the
     integration test that a plant-root build leaves `storybook/node_modules` unchanged (R-09, R-16).
3. **US2 Visual regression** (P2):
   - `ranges.ts`: `gates/visual/` in the mutation scope, red first in `gates/test/mutation-ranges.test.ts`;
   - `png.ts` (normalise, diff image, the one-pixel unit test), `visual-verdict.ts` (verdicts, `updatePlan`),
     `container.ts` (engine resolution with the CI rule, pin and inspect parsers on the recorded and written fixtures,
     run args for root equal to and different from the repository), `capture-plan.ts` (refusal predicate with one test
     per check, `contextOptions`, screenshot options, readiness, request, recorded-call and storage-state
     classification, pointer parameter and `targetInViewport` with the viewport of `contextOptions`,
     `scrollAction`, `captureStatus`), `story-checks.ts` (fonts, user-agent shadow text of form controls included, and closed shadow roots),
     `storybook-serve.ts`;
   - `plant-repo.ts`: the `delta.json` `baselines` edits and the `treeProblems` refusal of tree copies of repository
     baselines, red first; the `baselinesOf` and `captureAlone` keys; the plant runner's copy of failing pass plants' captures (captures
     made alone for a `captureAlone` plant, never run 1's);
   - `story-page.ts` and `capture.ts` (wiring: the CDP text collection with `pierce: true`, the I/O recorder with the
     storage `Proxy`, cookie, IndexedDB, Cache API and clipboard wraps, the storage-state read), the gate, `baselines.ts` with its plant mode (`--plant`, `--story`)
     and the integration test that regenerates one plant's baseline;
   - the `engine` plant key, `--skip-container` with the registry guard and its plant, and the engine probe with its
     not-run lines;
   - the `visual` plants and the 24 baselines; the freshness, animation-control and page-height integration tests;
   - the `visual` CI job with the artifact upload (captures in baseline layout), and the Plants job's engine
     environment and artifact upload (plant captures in tree layout);
   - any story fix the font rule needs;
   - **the review holds a CI run of the branch** (Visual regression and Plants under docker and podman, the podman
     inspect outputs, the job time, the time per story-theme of `visual` and `axe` plants with the split count derived
     from it, and the runner's free disk after both pulls), the operator pushing the branch; the split count goes into
     Complexity Tracking with the operator's approval.
4. **US3 Accessibility** (P3):
   - `axe-rules.ts` (selection on fixture metadata, and the test that derives the 4.14.0 lists from axe-core's own
     metadata), `axe-verdict.ts` (incomplete findings, outside-root, `printSelector`), `story-checks.ts` (empty,
     outside-root), `a11y-exceptions.ts` (per-node entries, plan pairing with ` >>> ` and escaped `|` selectors);
   - the gate, its context from `contextOptions(theme)` with the unit test that its options equal the capture's for
     each theme (R-08), its plants (`fail-hover-near-fold` included) and `storybook/a11y-exceptions.json`;
   - the `axe` CI job;
   - story fixes for any existing finding (FR-029).
5. **US4 CSP retarget and documentation** (P4):
   - `csp.ts` scope and its plants, and the `csp` job's packages-only build;
   - `prefix.ts` matching declarations across lines, red first with `fail-storybook-html-multiline-monospace` and a
     unit case;
   - the externaliser cut down to `<style>` elements, red first in its unit test (a `<script>` stays inline);
     `csp.test.ts` → `render.test.ts`, red first from the build output: `iframe.html` holds Storybook's inline
     `<script>` elements and `dist/` holds no `inline-<hash>.js` file, which fails against the old build script;
   - `gates.json` scope texts, `gates/README.md` (FR-023, the deferred row for the `@ocelle/elements` run-time CSP test);
   - the exception rows in 001's and 002's plans (FR-024);
   - `storybook/README.md` with its readme test, red first (FR-025, every item including open shadow roots, surfaces
     inside the host, the font of form controls set in an element's shadow styles, pointer states and their viewport rule, element run-time CSP, CI's captures, and plant
     baselines: the plant mode and the Plants job's artifact, and that `pass-second-render`'s record is CI's captures
     made alone).

Each phase is folded after its approval (`/ocelle-run` step 4.3).

## Complexity Tracking

No new exception. Closed by this feature:

| Exception | Where | Closed because |
|---|---|---|
| Storybook build, visual regression and axe gates absent | 001 plan | the three gates exist (US1 to US3) |
| 002 exception 1: the Storybook page's CSP header with `font-src 'self'`, `connect-src 'self'` | 002 plan | the Storybook is not a CSP target (operator Q1 (a), FR-020, FR-021) |
| 002 exception 2: the static `csp`/`prefix` scope widened to the Storybook inputs and HTML entries | 002 plan | `csp` no longer reads the Storybook; `prefix`'s Storybook scope is coverage, not an exception to IV (FR-022) |

Opened by this feature, an accepted cost with a sunset (operator decision on PLAN-FRESH-2-007, option (b), 2026-11-10):

| Item | Scope | Rationale | Sunset |
|---|---|---|---|
| Plant roots hold every repository story | the Plants job: every `storybook-build`, `visual` and `axe` plant builds, captures (twice) or audits all repository stories, so its time grows with plants × stories | plants keep the whole configuration set, so no plant can miss a repository input (research R-16); the growth is measured, not guessed (research R-07) | the op that splits the Plants job (a matrix, the operator's registry change) before the repository holds the **split count** of stories, the count phase 3's review derives from the CI run's time per story-theme and records here with the operator's approval |

axe exceptions under FR-029, if phase 1's spike finds one that needs a token or base-style change, are added here as
rows, with the operator's approval, before phase 4 records them in `storybook/a11y-exceptions.json`. Each row names
the story, theme, rule and selector in backticks and the sunset (the op that fixes it), and the file's entry names this
plan (`specs/006-storybook-workbench/plan.md`) as its `plan`, since the gate honours an entry only with its row
(FR-029, research R-08).

The page-level axe rules that are not run (decision 3) are not an exception: FR-016 names them as rules that judge the
Storybook harness document, not a story (spec delta of the plan squad's round 1).
