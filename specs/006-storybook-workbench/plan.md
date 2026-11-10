# Implementation Plan: Storybook workbench and visual regression baselines

**Branch**: `006-storybook-workbench` (work on `claude/010-storybook-workbench`) | **Date**: 2026-11-10 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/006-storybook-workbench/spec.md`, approved by the operator at gate
"spec" after two checks (check 2 clean). Spec check 2's eight plan notes (SPEC-2-01 to SPEC-2-08) are answered in
[research.md](research.md), where each is marked.

## Summary

Three new gates make the Storybook a checked visual source of truth:

- **`storybook-build`** ("Storybook build") runs the Storybook workspace's own build and reports syntax errors,
  unresolved imports, unreadable story files and an empty index as findings.
- **`visual`** ("Visual regression") builds the Storybook on the host. It then runs a capture script twice inside
  Microsoft's published Playwright image, pinned by its linux/amd64 manifest digest (Node 26.13.0, Chromium 1248, the
  versions this repository pins). In CI one run uses docker and the other podman. Every story is captured in light
  and dark as a normalised PNG, and each capture is compared byte for byte with `storybook/baselines/`. A story fails
  if its two runs differ, if it draws text in any face but Schibsted Grotesk, if it makes a request, or if it fails to
  render. `pnpm run visual:update` writes the baselines from the same two runs.
- **`axe`** ("Accessibility") runs axe-core 4.14.0 on every story root, in both themes, on the host browser. Serious
  and critical nodes are findings; moderate and minor nodes, incomplete results and recorded exceptions are notes.

Each gate has fail, pass and breaking plants. Following the operator's answer Q1 (a), the `csp` gate goes back to
covering only the packages' built output. The Storybook loses its CSP header test and its externaliser, and 002's two
Storybook exceptions and 001's "gates absent" exception are closed. A contributor note in `storybook/README.md` tells
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

**Testing**: `gates` (unit, pure modules, mutation-tested); `gates-integration` (real processes: the three gates on
fixture trees, the container); `storybook` (unit, the readme test); `storybook-integration` (the render test, as
before). Research R-12.

**Target Platform**: captures on linux/amd64 in the pinned image, on every host (operator SPEC-1-06); axe on the host
Chromium (1248 in CI). CI on `ubuntu-24.04` runners, which have docker and podman.

**Project Type**: repository gates and the private Storybook workspace; nothing published changes (semver none).

**Performance Goals**: each new job well under 10 minutes; the Storybook build takes 2.2 s here (measured). Phase 3's
review records the `Plants` job time (research R-07).

**Constraints**: byte-exact baselines; no network inside a capture (`--network none`, plus request routing); no root
needed on the host; one heavy job at a time locally.

**Scale/Scope**: 3 gates, 1 command, about 34 plants, 12 stories, 24 baselines, about 8 new source modules.

## Environment (for every role in this feature)

- Start the docker daemon before any container work: `pgrep dockerd || (dockerd > "$SCRATCH/dockerd.log" 2>&1 &)`,
  then wait until `docker info` succeeds. Podman is not available here, so local runs use `--engine auto`
  (docker), and plants run with `OCELLE_VISUAL_ENGINE=auto`.
- `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` for host-browser tests (the axe
  gate's tests, the render test). The container brings its own Chromium 1248.
- The container's Node is 26.13.0. The sandbox's Node is 22, so the host side runs on 22 locally. Avoid asserting
  Node error texts (frontend findings).
- One heavy job at a time: browser suites, the container, mutation and plants never run in parallel.

## Constitution Check

*Pre-design and post-design: PASS. No new exception. Two exceptions are closed (Complexity Tracking).*

| Principle | How this plan meets it |
|---|---|
| I. Names, no I/O | No element is added. The gates' names carry no `sk-`. The prefix gate's Storybook scope does not change (FR-022). |
| II. Tokens, brand rules | The `font` rule makes "no face but Schibsted Grotesk" a merge gate for every story (research R-05). The monospace walk stays in the render test. |
| III. Accessible | axe runs on every story in both themes. Serious and critical nodes fail the gate, empty stories are not passes, and the rule set is pinned by a test (R-08). Forced colours stay with the element tests (spec Edge Cases). |
| IV. Strict CSP | `csp` covers the packages' built output "with no exception" again: the Storybook is not built output of a package (operator Q1 (a)), so 002's exceptions 1 and 2 close. Elements remain bound to IV through their package output. |
| V. Storybook, baselines | Every story has two committed baselines made in a pinned container. The gate fails on a missing or stray baseline. Baselines change only in a pull request whose description says why; the contributor note says so and landing checks it. |
| VI. Own code | The gates and the capture are this repository's code. The container image and axe-core are third-party tools used in CI and development only, not shipped (plan-gate decision 1). |
| VII. Semver | No published surface changes. |
| VIII. Test-first, proven | Every phase starts red. Every pure module is mutation-tested. Process boundaries carry `Stryker disable` comments naming their integration test (R-12). Every gate has fail, pass and breaking plants, and the plant job cannot skip the container plants in CI (R-07). The capture's refusal outside the pinned image is a breaking plant (R-06). |
| Supply chain | `axe-core` and `pngjs` are pinned exactly and pass the release-age rule. The image is pinned by digest. A test ties `container.json` to `.node-version` and to Playwright's expected browser build (contracts/container.md). |
| Workflow gates | The registry gains three gates (`gates.json`, FR-020 list, `ci.yml` jobs). The required checks go from fourteen to seventeen in `gates/README.md`; the ruleset change is the operator's. |

## Decisions the operator should see at the plan gate

1. **The pinned image** is Microsoft's published `mcr.microsoft.com/playwright:v1.64.1-noble`, by its linux/amd64
   digest `sha256:ee15712…b1d0`. No image is built or published here, so no registry is needed (R-01, SPEC-2-08).
2. **Docker works in this sandbox** once its daemon is started; podman is not available. Local runs prove
   determinism with docker only, and the docker-against-podman comparison happens only in CI (R-02). Two pulls of a
   2 GB image are added to the Plants and Visual regression jobs, and the Unit tests job pulls it once (R-07, R-12).
3. **axe runs on the host browser, scoped to the story root.** The preview page's own landmarks, title and language
   are not judged (R-08).
4. **axe `incomplete` results are notes**, not findings (R-08, SPEC-2-03).
5. **The externaliser is removed** along with the CSP header test, since it existed only for the CSP. The Storybook
   HTML now carries Storybook's inline scripts. Prefix still reads it (R-10).
6. **Spec delta**: the `storybook-build` breaking plant becomes "no build script" instead of "missing dependencies",
   because a plant cannot remove `node_modules` (R-09). The squad aligns FR-017.
7. **Baselines are produced locally in this run** (docker here) and confirmed by CI with podman at landing, when the
   pull request first runs CI.

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
├── bin/plants.ts, lib/plant-judge.ts, lib/plant-runner.ts       # `engine` key, --skip-container, registry guard
├── lib/storybook-index.ts, storybook-build.ts, storybook-serve.ts
├── lib/container.ts, visual-verdict.ts, png.ts                  # pin, run args, verdicts, normalise and diff
├── lib/axe-rules.ts, axe-verdict.ts, a11y-exceptions.ts
├── lib/registry.ts, gates.json                                  # three gates added
├── visual/capture.ts                                            # runs inside the container
├── plants/storybook-build/, visual/, axe/                       # new plants (contracts/plants.md)
├── plants/csp/, plants/plants/                                  # changed plants
├── test/…                                                       # unit and integration tests
└── README.md
storybook/
├── baselines/*.png                                              # 24 baselines
├── visual/container.json
├── a11y-exceptions.json                                         # []
├── README.md                                                    # contributor note (FR-025)
├── package.json                                                 # build script without externalise
├── scripts/externalise.ts                                       # removed
└── test/integration/render.test.ts (was csp.test.ts), test/unit/readme.test.ts, externalise.test.ts removed
.github/workflows/ci.yml                                         # 3 jobs; csp job builds packages only; plants env
package.json, pnpm-lock.yaml, .gitignore                         # scripts, pins, storybook/.visual/
specs/001-repository-foundation/plan.md, specs/002-design-tokens/plan.md   # exception rows marked closed
```

**Structure Decision**: the gates live in `gates/` as every gate does. The capture is a separate entry
(`gates/visual/capture.ts`) because it runs in another process and on another platform. The Storybook workspace
holds the data the gates read (baselines, pin, exceptions).

## Phases (user stories) for `/speckit-tasks`

1. **Setup** (exempt, no behaviour, except where noted):
   - pins `axe-core` 4.14.0 and `pngjs` 7.0.0 as root devDependencies; root scripts; `.gitignore` gains
     `storybook/.visual/`;
   - `storybook/visual/container.json`, with the pin test written first and shown red (it fails while the file is
     absent);
   - the spike, recorded in `reviews/phase-1/spike.md`:
     - Storybook 10.6.5's output for a syntax error, an unresolved import and a non-CSF file;
     - the 12 stories captured twice in the container (determinism, sizes, fonts found);
     - the render-failure class for a module that throws and for a render that throws;
     - axe 4.14.0 on the 12 stories in both themes (findings to fix under FR-029);
     - two-node `color-contrast` and `incomplete` plant candidates, measured.
2. **US1 Storybook build** (P1): `storybook-index.ts`, `storybook-build.ts` (parser, from the spike's fixtures), the
   gate, its plants, the registry entries, the `storybook-build` CI job.
3. **US2 Visual regression** (P2):
   - `png.ts` (normalise, diff image), `visual-verdict.ts`, `container.ts` (pin checks, engine selection, run args),
     `storybook-serve.ts`;
   - `capture.ts`, the gate, `baselines.ts`;
   - the `engine` plant key and `--skip-container` with the registry guard and its plant;
   - the `visual` plants and the 24 baselines;
   - the `visual` CI job with the artifact upload, and the Plants job's engine environment;
   - any story fix the font rule needs.
4. **US3 Accessibility** (P3):
   - `axe-rules.ts` (with the pinned rule list test), `axe-verdict.ts`, `a11y-exceptions.ts`;
   - the gate, its plants and `storybook/a11y-exceptions.json`;
   - the `axe` CI job;
   - story fixes for any existing finding (FR-029).
5. **US4 CSP retarget and documentation** (P4):
   - `csp.ts` scope and its plants, and the `csp` job's packages-only build;
   - removing the externaliser and `csp.test.ts` → `render.test.ts` (red first: the render test asserts no CSP
     header is sent and no `Content-Security-Policy` meta is present, which fails against the old test server);
   - `gates.json` scope texts, `gates/README.md` (FR-023);
   - the exception rows in 001's and 002's plans (FR-024);
   - `storybook/README.md` with its readme test, red first (FR-025).

Each phase is folded after its approval (`/ocelle-run` step 4.3).

## Complexity Tracking

No new exception. Closed by this feature:

| Exception | Where | Closed because |
|---|---|---|
| Storybook build, visual regression and axe gates absent | 001 plan | the three gates exist (US1 to US3) |
| 002 exception 1: the Storybook page's CSP header with `font-src 'self'`, `connect-src 'self'` | 002 plan | the Storybook is not a CSP target (operator Q1 (a), FR-020, FR-021) |
| 002 exception 2: the static `csp`/`prefix` scope widened to the Storybook inputs and HTML entries | 002 plan | `csp` no longer reads the Storybook; `prefix`'s Storybook scope is coverage, not an exception to IV (FR-022) |

axe exceptions under FR-029, if phase 1's spike finds one that needs a token or base-style change, are added here as
rows, with the operator's approval, before phase 4 records them in `storybook/a11y-exceptions.json`.
