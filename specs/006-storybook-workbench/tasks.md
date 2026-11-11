# Tasks: Storybook workbench and visual regression baselines

**Input**: design documents in `specs/006-storybook-workbench/`, as approved at the plan gate on 2026-11-10 after three
plan-squad rounds:
- spec.md (FR-001 to FR-031, US1 to US4);
- plan.md, decisions 1 to 18, § Phases, Complexity Tracking (decisions 19 and 20 and the FR-029 exception rows added
  by the operator's decisions on the phase 1 spike, 2026-11-10);
- research.md R-01 to R-16;
- data-model.md;
- contracts/gates.md, contracts/container.md, contracts/plants.md;
- quickstart.md.

**Tests**: required. Constitution VIII applies to every phase. The phase flow is `base.sh`, an optional `scaffold.sh`,
one red commit of test files only proven by `red.sh`, then green, `tdd-check.sh` and an independent review. Expected
values are written by hand from the spec, the contracts and the spike's records, never read from the code under test.
Every guard ("does not", "refuses", "writes nothing") shares its test with the positive assertion it guards. Every new
pure module is mutation-tested (`gates` project); process boundaries carry
`// Stryker disable next-line all: process boundary, covered by <integration test>` comments naming a real test
(research R-12).

**Environment** (every task; plan.md § Environment):
- Docker: `pgrep dockerd || (dockerd > "$SCRATCH/dockerd.log" 2>&1 &)`, then wait until `docker info` succeeds; pull the
  pin by digest if absent. Podman is not available here: local runs use `--engine auto` and
  `OCELLE_VISUAL_ENGINE=auto`; leave `CI` and `GITHUB_ACTIONS` unset.
- Host browser: `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`. For Stryker and plant
  runs alias the browsers directory as `knowledge/speckit-flows/findings/frontend-missions.md` § Browser path says.
- Node 22 here, 26.13.0 in CI and in the container: never assert Node's error texts.
- One heavy job at a time (browser suites, the container, mutation, plants). Never `git stash`.
- `packages/tokens/src/source.ts` (since PR #22): records and ground lists are written without `as const`, `as`,
  `satisfies` or `<T>` (`packages/tokens/test/source-form.test.ts`).

**Organization**: Phase 1 is Setup with the feature's only spike. Phases 2 to 5 are User Stories 1 to 4, one review
unit each, folded after approval (`/ocelle-run` step 4.3). There is no polish phase.

**Stop-and-ask points** (record the question in the phase review, do not work around it):
- **T004 spike outcomes**: Storybook emits no distinguishable signal for one of the failure kinds; a build still
  writes under `storybook/node_modules` with both caches moved; two captures of an existing story differ in the
  container; an existing story draws a glyph Schibsted Grotesk lacks and cannot be fixed in its story file; an
  existing story has a serious or critical axe result whose fix needs a token or base-style change (FR-029: a
  Complexity Tracking row needs the operator); a planned plant candidate does not produce its finding.
  **Raised by the spike and decided by the operator (2026-11-10, human:jeroennouwsdev)**:
  - spike § 4 (a plant-root build rewrites the repository's `node_modules` through pnpm's `verify-deps-before-run`):
    **"Flag in the build fn"**. The gates' build function runs
    `pnpm --config.verify-deps-before-run=false --dir storybook run build`; the repository's pnpm configuration is not
    changed (research R-09, R-16; plan decision 19; contracts/gates.md § `storybook-build`). Carried by T009, T010,
    T015 and T016.
  - spike § 7 (FR-029, `base-styles--prose-document`): **"tabindex + exceptions"**. The story's wide tables get
    `tabindex="0"` in `storybook/stories/render.ts`, clearing `scrollable-region-focusable`; the ten serious
    `color-contrast` incomplete results (five nodes × two themes) are per-node exceptions, one plan.md Complexity
    Tracking row each, with the sunset "the op that fixes the color-contrast incomplete results of base.css's prose
    table scroll box (003 surface), to be opened by the operator" (research R-08; plan decision 20). Carried by
    T052, T053a, T057 and T060.
- **T044** (phase 3's CI run of the branch): it needs the operator to push and start CI (pull request or dispatch).
- **Any mutation shard over 10 minutes**; **the Plants job near 30 minutes** (research R-07).
- **A pins-gate refusal** of `axe-core` 4.14.0 or `pngjs` 7.0.0.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: the user story of the task (US1 to US4)
- Paths are relative to the repository root.

---

## Phase 1: Setup

**Purpose**: pins, the container pin and the spike every later phase rests on. The pin test is behaviour (red
first); the pins, scripts, ignores and the spike record have no behaviour and are listed in
`specs/006-storybook-workbench/reviews/phase-1/tdd-exempt.md` with the reason.

**Independent Test**: `pnpm run gate:pins` passes with the two new pins; `gates/test/container-pin.test.ts` passes;
`reviews/phase-1/spike.md` holds every item of T004; `tdd-check.sh 1` reports `pass`.

### Tests (red, one commit)

- [X] T001 `gates/test/container-pin.test.ts` (contracts/container.md § The pin test): first assertion that `storybook/visual/container.json` exists (so the red is an assertion failure, not a read error); then `node` equals `.node-version`, `platform` is `"linux/amd64"`, `digest` matches `^sha256:[0-9a-f]{64}$`, and `browser` equals `chromium_headless_shell-<revision>` with the revision of the `chromium-headless-shell` entry of `playwright-core/browsers.json`; a second case runs the same check function on a fixture copy with a wrong `node` and a wrong `browser` and asserts each is reported. Commit it alone (`test(006-storybook-workbench): phase 1 red — container pin`) and run `.specify/extensions/story/scripts/red.sh 1 phase`; confirm it fails on the existence assertion

### Implementation

- [X] T002 `storybook/visual/container.json` exactly as contracts/container.md § `storybook/visual/container.json` (image `mcr.microsoft.com/playwright`, digest `sha256:ee15712262f017b8157421b212b12099146645f44b1bc5c0514cbbe6a229b1d0`, platform `linux/amd64`, tag `v1.64.1-noble`, node `26.13.0`, browser `chromium_headless_shell-1248`); T001 passes
- [X] T003 [P] Root `package.json`: devDependencies `axe-core` `4.14.0` and `pngjs` `7.0.0` (exact); scripts `gate:storybook-build`, `gate:visual`, `gate:axe` and `visual:update` pointing at `gates/bin/storybook-build.ts`, `visual.ts`, `axe.ts`, `baselines.ts` (entry stubs that exit 2 "not implemented" until their phase); `.gitignore` gains `storybook/.visual/` and `storybook/.cache/`; run a non-frozen `pnpm install` and commit `pnpm-lock.yaml`; `pnpm run gate:pins` passes
- [X] T004 The spike (plan.md § Phases 1; scratch scripts in the scratchpad only), recorded in `specs/006-storybook-workbench/reviews/phase-1/spike.md` with commands and outputs:
  - Storybook 10.6.5's build output (stdout, stderr, exit) for a syntax error, an unresolved import, a non-CSF file and missing `storybook/node_modules`; kept as fixtures under `gates/test/fixtures/storybook-build/` for T010;
  - the render signals (`STORY_RENDERED`, `STORY_THREW_EXCEPTION`, `STORY_ERRORED`, `STORY_MISSING`) and `body.sb-show-errordisplay` for a module that throws, a render that throws and a missing id;
  - Storybook's harness nodes in the preview, its own fetch, xhr, Web Storage, cookies, IndexedDB and Cache API use and the storage state it leaves (the I/O allow-list of R-14), whether the `execCommand` wrap records copy and cut, and the access path to the current story's `parameters`;
  - that a build writes nothing under `storybook/node_modules` with Vite's `cacheDir` and `CACHE_DIR` moved (R-09, R-16);
  - the 12 stories captured twice in the container, full page (sha256 per capture, sizes, fonts found by the CDP walk of R-05, glyphs Schibsted Grotesk lacks), and the exact story-themes `fail-token-changed` changes (`color-ink`, light);
  - `docker image inspect` and `docker buildx imagetools inspect --raw` outputs of the pin (fixtures under `gates/test/fixtures/container/`) and the tag's index digest (for `error-index-pin`);
  - axe-core 4.14.0 on the 12 stories in both themes with R-08's context and rules (any serious or critical result: stop-and-ask per FR-029);
  - measured candidates for `fail-two-low-contrast` and `fail-incomplete`.
  - The spike is done and its two stop-and-ask questions (§§ 4 and 7) are decided (§ Stop-and-ask points above); T004
    is closed by recording both decisions, with their date and the operator, under each question in `spike.md`.
- [X] T005 [P] `specs/006-storybook-workbench/reviews/phase-1/tdd-exempt.md`: T003 and T004 have no behaviour (pins, scripts, ignores, a record); T001 is the phase's red

---

## Phase 2: User Story 1 - The Storybook build is a merge gate (Priority: P1) 🎯 MVP

**Goal**: a "Storybook build" check that fails on syntax errors, unresolved imports, unreadable story files and an
empty index, and exits 2 when Storybook is not installed or has no build script (FR-001, FR-002, FR-017; contracts/
gates.md § `storybook-build`). Plant roots hold the Storybook workspace (R-16).

**Independent Test**: `pnpm run gate:storybook-build` prints `storybook-build: built 12 stories`; every
`storybook-build` plant of contracts/plants.md is judged correctly by `pnpm run gate:plants`; the registry check passes
with the new job; `tdd-check.sh 2` reports `pass`.

### Tests (red, one commit)

- [X] T006 [P] [US1] `gates/test/plant-repo.test.ts` and `gates/test/integration/plant-repo.test.ts`: the configuration set holds the Storybook workspace inputs of R-16 (`storybook/package.json`, `.storybook/`, `stories/`, `scripts/`, `visual/container.json`, `baselines/`, `.node-version`, `packages/tokens/fonts/`, `packages/styles/src/base.css`), `storybook/node_modules` is linked, `unlinked: ["storybook/node_modules"]` removes only that link, any other `unlinked` value or gate is invalid; the root's `storybook/a11y-exceptions.json` is `[]` unless the tree supplies one, and `exceptions: "repository"` appends the repository's entries after the plant's own and copies the plan files they name (data-model § Plant keys)
- [X] T007 [P] [US1] `gates/test/plants.test.ts`: plants of `storybook-build`, `visual` and `axe` run one at a time after the others (contracts/plants.md § Plant runner changes)
- [X] T008 [P] [US1] `gates/test/storybook-index.test.ts`: entries of type `story` in index order, `docs` ignored; a missing `entries`, or an entry without `id` or `type`, is "could not run" (data-model § Story)
- [X] T009 [P] [US1] `gates/test/storybook-build.test.ts` on T004's fixtures: `build-error` at the named file, else at `storybook/package.json`; `index-error` at the story file; `empty-index` at `storybook/dist/index.json`; the CLI check: no `storybook/package.json`, no `build` script (`storybook/package.json has no build script`), Storybook not resolvable (`storybook is not installed; run pnpm install`) each "could not run"; the build environment sets `CACHE_DIR=<root>/storybook/.cache` and keeps the rest; the build command is exactly `pnpm` with `--config.verify-deps-before-run=false`, `--dir`, `storybook`, `run`, `build` (research R-09); the `missing-deps-no-verify` fixture (exit 127 `storybook: not found`, no file named) parses as `build-error` at `storybook/package.json`, which is why the CLI check comes first
- [X] T010 [P] [US1] `gates/test/integration/storybook-build.test.ts`: the gate on fixture trees: the repository (exit 0, `storybook-build: built 12 stories`), a syntax error (exit 1, one finding), no `storybook/node_modules` (exit 2 with the cause `storybook is not installed; run pnpm install`, from the CLI check: pnpm would otherwise reinstall the dependencies and the build pass, spike § 1); a build in a plant root leaves the repository's `storybook/node_modules` **and its root `node_modules`** unchanged: no entry added, removed or changed (path, size and modification time listed before and after, as spike § 4 did; R-16)
- [X] T011 [P] [US1] `gates/test/registry.test.ts` and `gates/test/ci-workflow.test.ts`: `storybook-build` is in `gates.json`, the FR-020 list and `ci.yml` (job `storybook-build`, name "Storybook build", step `pnpm run gate:storybook-build`)
- [X] T012 [US1] Commit T006 to T011 alone (`test(006-storybook-workbench): phase 2 red — storybook build gate`) and run `.specify/extensions/story/scripts/red.sh 2 phase`; confirm each fails on its missing behaviour

### Implementation (green)

- [X] T013 [US1] `gates/lib/plant-repo.ts`: the extended configuration set, the `storybook/node_modules` link, `unlinked`, the exceptions file rule and `exceptions: "repository"` with its plan files (R-16); `gates/lib/plant-judge.ts` the new keys' validity; `gates/lib/plant-runner.ts` serial Storybook plants
- [X] T014 [P] [US1] `gates/lib/storybook-index.ts`
- [X] T015 [US1] `gates/lib/storybook-build.ts` (parser, CLI check, build environment, build command with `--config.verify-deps-before-run=false`) and `gates/bin/storybook-build.ts` (gate CLI contract); `storybook/.storybook/main.ts` sets Vite's `cacheDir` inside `storybook/.cache/`; the repository's pnpm configuration (`pnpm-workspace.yaml`, `.npmrc`) is not changed (operator decision on spike § 4)
- [X] T016 [US1] Plants under `gates/plants/storybook-build/`: every row of contracts/plants.md § `storybook-build` (`fail-syntax-error`, `fail-unresolved-import`, `fail-not-csf`, `fail-empty-index`, `pass-repository`, `pass-type-error-only`, `error-missing-dependencies`, `error-no-build-script`), each `plant.json` with exact findings or cause (`error-missing-dependencies`'s cause comes from the CLI check, R-09)
- [X] T017 [US1] `gates/gates.json` entry (contracts/gates.md § `storybook-build`), `gates/lib/registry.ts` FR-020 list, `.github/workflows/ci.yml` job `storybook-build` ("Storybook build": checkout, setup, `pnpm run gate:storybook-build`)
- [X] T018 [US1] Run the phase's checks one at a time: `pnpm test`, `pnpm run gate:typecheck`, `gate:lint`, `gate:test-lint`, `gate:storybook-build`, `gate:plants` (with `--skip-container` if the visual gate is still a stub, recording that), `gate:mutation -- --base <phase base>`; record times in the review

---

## Phase 3: User Story 2 - Every story has an exact, byte-stable visual baseline in light and dark (Priority: P2)

**Goal**: the `visual` gate and `visual:update` (FR-003 to FR-012, FR-018, FR-019, FR-026 to FR-028, FR-030, FR-031;
contracts/gates.md § `visual`, contracts/container.md, data-model § Verdict), the 24 baselines, the plants, and the CI
jobs.

**Independent Test**: `pnpm run gate:visual` prints `visual: 24 captures match their baselines (docker only: no
cross-engine comparison)` here; `pnpm run visual:update` on an unchanged tree leaves `git diff` empty; every `visual`
plant is judged correctly; the CI run of T045 passes Visual regression and Plants under docker and podman;
`tdd-check.sh 3` reports `pass`.

### Tests (red, one commit)

- [X] T019 [P] [US2] `gates/test/mutation-ranges.test.ts`: `gates/visual/capture.ts` is inside the mutation scope (`gates/lib/mutation/ranges.ts`)
- [X] T020 [P] [US2] `gates/test/png.test.ts`: normalise gives the same bytes for the same pixels whatever the input encoding (deflate levels, ancillary chunks), with no ancillary chunk; the diff image marks exactly the differing pixels; one changed pixel gives one differing pixel (SC-006)
- [X] T021 [P] [US2] `gates/test/visual-verdict.test.ts`: the verdict order of data-model § Verdict per story-theme (steps 1 to 11, first match wins, one finding at most), stray baselines (names that do not parse, story-themes not in the index), `updatePlan` (refuses on steps 1 to 8, writes added and changed, removes stray), the plant mode plan (`--plant`, `--story`; a `captureAlone` plant without `--story` exits 2 `<plant> is captured alone: give --story <id>`); the summary line of contracts/gates.md § `visual:update` from an `updatePlan` result, its counts and bytes written by hand (analysis G1): a plan with one existing baseline whose bytes changed (a file of known size) and one stray baseline prints `baselines: wrote 1 files (0 added, 1 changed, 1 removed), <that size> bytes in total`, a plan with one story-theme that has no baseline (a capture of known size) and nothing else to write prints `baselines: wrote 1 files (1 added, 0 changed, 0 removed), <that size> bytes in total` (operator decision 2026-11-11), and a plan with nothing to write prints `baselines: wrote 0 files (0 added, 0 changed, 0 removed), 0 bytes in total`
- [X] T022 [P] [US2] `gates/test/container.test.ts`: `resolveEngine` for `auto`, `both`, a name, `host`, and the CI rule (`CI` or `GITHUB_ACTIONS` true: `auto` → `both`, a single engine → exit 2 `in CI the visual gate runs under both docker and podman`); the pin check steps of contracts/container.md § The pin check (reference form, index media type, pull, identity by `RepoDigests`, `Os`, `Architecture`; never `.Id`) on T004's recorded docker fixtures and written fixtures for docker's classic store and podman, each with a match, a wrong digest, an arm64 image and an index media type; run arguments for docker and podman with root equal to and different from the repository (contracts/container.md § Run arguments)
- [X] T023 [P] [US2] `gates/test/capture-plan.test.ts`: the refusal predicate, one test per check (`platform`, `arch`, `node`, `pin`, `browser`); `contextOptions(theme)` (1280 × 800, scale 1, colour scheme, `reducedMotion: "reduce"`, `forcedColors: "none"`, `en-GB`, `UTC`); screenshot options (`fullPage: true`, `animations: "disabled"`, `caret: "hide"`); readiness classification of each render signal and the 15 s timeout; request classification (`127.0.0.1` from `dist`, Storybook's own files allowed per T004, other same-origin `io`, other origins `network`); recorded-call and storage-state classification per kind (Web Storage by method and by property, cookie, IndexedDB, Cache API, clipboard, `execCommand`, beacon; R-14); the pointer parameter (exactly one of `hover`, `press`; one matching element) and `targetInViewport` with the viewport of `contextOptions`; `scrollAction`; `captureStatus` order (data-model § Capture)
- [X] T024 [P] [US2] `gates/test/story-checks.test.ts`: fonts (every text node, user-agent shadow text of form controls attributed to its host control, families other than `Schibsted Grotesk`, faces in use not `loaded`, unused declared faces not findings; R-05), closed shadow roots
- [X] T025 [P] [US2] `gates/test/plant-repo.test.ts` and `gates/test/plants.test.ts` (additions): `delta.json` `baselines` edits `one-pixel`, `reencode`, `remove` applied to the current repository baseline; `treeProblems` refuses a tree file whose name `storybook/baselines/` holds; `baselinesOf` and `captureAlone` validity; `engine` substitution (`plant.json`, else `$OCELLE_VISUAL_ENGINE`, else `both`; `missing` → `ocelle-no-such-engine`; invalid on other gates); `--skip-container` (skipped lines, partial summary); the engine probe (`plants: not run (no container engine): <plant>`, exit 2); the copy of failing pass plants' captures (run 1's in tree layout; for `captureAlone`, captures made alone, never run 1's, an equal one not copied with the freshness line)
- [X] T026 [P] [US2] `gates/test/registry.test.ts` and `gates/test/ci-workflow.test.ts`: `visual` in `gates.json`, the FR-020 list and `ci.yml` (job `visual`, "Visual regression", `--engine both`, artifact upload of `storybook/.visual/` on failure); the Plants job sets `OCELLE_VISUAL_ENGINE=both` and uploads `storybook/.visual/plants/` on failure; the registry check fails on `--skip-container` in the Plants job
- [X] T027 [P] [US2] `gates/test/integration/visual.test.ts` (needs docker): the gate on the repository (exit 0, 24 captures), `--engine host` (exit 2 `not the pinned container`), a missing engine name (exit 2); `visual:update` writes nothing on an unchanged tree and prints `baselines: wrote 0 files (0 added, 0 changed, 0 removed), 0 bytes in total` (analysis G1); the plant mode regenerates one plant's baseline; the kept outputs of FR-005 (contracts/gates.md § `visual`, analysis G2), in one fixture tree whose `tokens--colour.light.png` has one pixel changed and whose `tokens--colour.dark.png` is removed: the run exits 1 with `differs` at `tokens--colour/light` and `missing-baseline` at `tokens--colour/dark`; `storybook/.visual/tokens--colour.light.actual.png` and `.diff.png` exist, `storybook/.visual/baselines/tokens--colour.light.png` and `tokens--colour.dark.png` exist with bytes equal to the run's capture (the `.actual.png` for light; for dark, the repository's committed `tokens--colour.dark.png`, which an unchanged story captures byte for byte), and, in the same test, no `.actual.png` or `.diff.png` exists for `tokens--colour/dark` and no file under `storybook/.visual/` names any other story-theme; freshness (a story captured alone equals its capture in the full run), animation control and page height (a 2000 px story's capture is 2000 px tall); `CI` and `GITHUB_ACTIONS` stripped except in the test of the CI rule
- [X] T028 [US2] Commit T019 to T027 alone (`test(006-storybook-workbench): phase 3 red — visual regression`) and run `.specify/extensions/story/scripts/red.sh 3 phase`; confirm each fails on its missing behaviour

### Implementation (green)

- [X] T029 [P] [US2] `gates/lib/mutation/ranges.ts`: `gates/visual/` in scope
- [X] T030 [P] [US2] `gates/lib/png.ts` (pngjs, fixed options, no ancillary chunks; diff image)
- [X] T031 [P] [US2] `gates/lib/visual-verdict.ts` (verdicts, `updatePlan`, its summary line `baselines: wrote <n> files (<added> added, <changed> changed, <removed> removed), <bytes> bytes in total` with `<n>` = added + changed, a baseline written for a story-theme that had none before counted as added, plant mode plan)
- [X] T032 [P] [US2] `gates/lib/container.ts` (engine resolution with the CI rule, pin and inspect parsers, run arguments)
- [X] T033 [P] [US2] `gates/lib/capture-plan.ts` (every pure function of T023)
- [X] T034 [P] [US2] `gates/lib/story-checks.ts` (fonts, closed shadow roots) and `gates/lib/storybook-serve.ts` (local server over `dist`)
- [X] T035 [US2] `gates/lib/plant-repo.ts`, `plant-judge.ts`, `plant-runner.ts`, `gates/bin/plants.ts`: `baselines` and `exceptions` deltas, `treeProblems`, `baselinesOf`, `captureAlone`, `engine`, `--skip-container`, the engine probe, the captures copy; `gates/lib/registry.ts` the `--skip-container` guard
- [X] T036 [US2] `gates/lib/story-page.ts` (init scripts: readiness recorder, closed `attachShadow` recorder, I/O recorder with the storage `Proxy`, cookie, IndexedDB, Cache API, clipboard, `execCommand` and beacon wraps; CDP text collection with `pierce: true`; storage-state read) and `gates/visual/capture.ts` (wiring only, contracts/container.md § Per story-theme); each `Stryker disable` comment on a wrap, request hook or the storage-state read names the `visual` plant that exercises it (`fail-same-origin-fetch`, `fail-xhr`, `fail-websocket`, `fail-local-storage`, `fail-storage-property`, `fail-session-storage`, `fail-cookie`, `fail-indexeddb`, `fail-cache-api`, `fail-clipboard-write`, `fail-exec-copy`, `fail-beacon`, `fail-storage-left-by-worker`; analysis C1)
- [X] T037 [US2] `gates/bin/visual.ts` (host entry point: pin check, build, run 1, run 2, verdicts, `storybook/.visual/` images and `storybook/.visual/baselines/`) and `gates/bin/baselines.ts` (`visual:update`, plant mode)
- [X] T038 [US2] Story fixes the font rule needs (T004), in `storybook/stories/` only
- [X] T039 [US2] `storybook/baselines/`: the 24 baselines from `pnpm run visual:update`; record the total size in the review
- [X] T040 [US2] Plants under `gates/plants/visual/`: every row of contracts/plants.md § `visual`, pass plants' baselines made with `visual:update -- --plant visual/<name>` (`pass-second-render` with `--story` per story-theme), `fail-token-changed`'s findings from T004's list, `error-index-pin` with T004's index digest; the rows added by the analysis (operator decision 2026-11-10/11, "Fix C1 + G1–G4 first"): the run-time I/O plants `fail-xhr`, `fail-websocket`, `fail-session-storage`, `fail-cache-api`, `fail-clipboard-write`, `fail-exec-copy`, `fail-beacon` and `fail-storage-left-by-worker` (C1; each `io` on both themes, the last with the storage-state message and its stop-and-ask), `fail-popover-changed` (G3) and `fail-press-style-changed` (G4), each `differs` on both themes
- [X] T041 [US2] Plant `gates/plants/plants/fail-skip-container-in-ci/`
- [X] T042 [US2] `gates/gates.json` entry (contracts/gates.md § `visual`), `gates/lib/registry.ts` FR-020 list, `.github/workflows/ci.yml`: job `visual` ("Visual regression": `pnpm run gate:visual -- --engine both`, `actions/upload-artifact` pinned by SHA for `storybook/.visual/` on failure), the Plants job's `OCELLE_VISUAL_ENGINE=both` and artifact upload of `storybook/.visual/plants/`
- [X] T043 [US2] Run the phase's checks one at a time: `pnpm test`, typecheck, lint, test-lint, `gate:visual`, `visual:update` (no diff), `OCELLE_VISUAL_ENGINE=auto pnpm run gate:plants`, `gate:mutation -- --base <phase base>`; record times
- [ ] T044 [US2] Ask the operator (stop-and-ask) to push the branch and start CI (pull request or dispatch) for T045
- [ ] T045 [US2] Record the CI run in the phase review (FR-026, plan decision 7): Visual regression and Plants under docker and podman, podman's inspect outputs (replace the written fixtures of T022 with them, test-first if they differ), job times, the time per story-theme of `visual` and `axe` plants and the split count derived from it, the runner's free disk after both pulls; propose the split count's Complexity Tracking row for the operator's approval
- [ ] T046 [US2] If CI's captures differ from the local baselines, commit CI's artifact files (CI is the producer of record, plan decision 7) with the reason in the commit message

---

## Phase 4: User Story 3 - axe runs on every story and blocks serious and critical findings (Priority: P3)

**Goal**: the `axe` gate (FR-013 to FR-016, FR-029; contracts/gates.md § `axe`; data-model § axe result, § Exception).

**Independent Test**: `pnpm run gate:axe` prints `axe: 24 story-theme runs, 0 serious or critical; …`; every `axe`
plant is judged correctly; `tdd-check.sh 4` reports `pass`.

### Tests (red, one commit)

- [ ] T047 [P] [US3] `gates/test/axe-rules.test.ts`: selection on fixture metadata (default rules plus every rule tagged `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`, minus `experimental`, minus the harness-document rules of FR-016); a test deriving the 4.14.0 lists from axe-core's own metadata (every document-element rule is a harness-document rule, `experimental`, or one of `frame-focusable-content`, `frame-tested`)
- [ ] T048 [P] [US3] `gates/test/axe-verdict.test.ts`: serious and critical violations one finding per node; serious and critical incomplete `<rule>-incomplete`; moderate and minor notes on stderr; `outside-root` per element; `printSelector` (shadow levels ` >>> `, frames ` >>frame>> `)
- [ ] T049 [P] [US3] `gates/test/story-checks.test.ts` (additions): `empty` (no descendant of the story root with a non-zero box and no non-whitespace text), `outside-root`
- [ ] T050 [P] [US3] `gates/test/a11y-exceptions.test.ts`: entries `{ story, theme, rule, selector, reason, sunset, plan }`, "Every field a non-empty string"; honoured only when `plan` exists and its `## Complexity Tracking` holds a row naming story, theme, rule and selector in backticks (escaped `\|`) and the sunset, else `unrecorded-exception`; per-node match; `stale-exception`; malformed file "could not run"
- [ ] T051 [P] [US3] `gates/test/axe-context.test.ts`: the axe gate's context options equal `contextOptions(theme)` for each theme
- [ ] T052 [P] [US3] `gates/test/integration/axe.test.ts`: the gate on the repository (exit 0, 24 runs, 10 excepted: the Prose document's `color-contrast-incomplete` entries of plan.md § Complexity Tracking, and no `scrollable-region-focusable`) and on a fixture with an unlabelled button (exit 1, two findings)
- [ ] T053a [P] [US3] `storybook/test/unit/render.test.ts` (FR-029, operator decision on spike § 7): every table of the Prose document is rendered `<table tabindex="0">` (update the exact-markup expectations of the prose tests to it); red against today's render code as an assertion failure
- [ ] T053 [P] [US3] `gates/test/registry.test.ts` and `gates/test/ci-workflow.test.ts`: `axe` in `gates.json`, the FR-020 list and `ci.yml` (job `axe`, "Accessibility")
- [ ] T054 [US3] Commit T047 to T053a alone (`test(006-storybook-workbench): phase 4 red — accessibility`) and run `.specify/extensions/story/scripts/red.sh 4 phase`; confirm each fails on its missing behaviour

### Implementation (green)

- [ ] T055 [P] [US3] `gates/lib/axe-rules.ts`, `gates/lib/axe-verdict.ts`, `gates/lib/a11y-exceptions.ts`; `gates/lib/story-checks.ts` empty and outside-root
- [ ] T056 [US3] `gates/bin/axe.ts`: build, serve, a fresh context per story-theme from `contextOptions(theme)`, pointer state, axe injected by `page.addScriptTag({ path })` on the story area, findings and notes per contracts/gates.md
- [ ] T057 [US3] Story fix and exceptions for the existing findings (FR-029, T004, operator decision on spike § 7): `storybook/stories/render.ts` renders the Prose document's wide tables with `tabindex="0"` (T053a passes; this clears `scrollable-region-focusable` at `table:nth-child(12)`); `storybook/a11y-exceptions.json` holds ten entries, one per row of plan.md § Complexity Tracking (axe exceptions under FR-029), in that order: `story` `base-styles--prose-document`, `theme`, `rule` `color-contrast-incomplete`, `selector`, `reason` and `sunset` exactly as the row, `plan` `specs/006-storybook-workbench/plan.md`. Before writing them, re-measure the story's axe results after the `tabindex` fix with the gate (`gate:axe`, file still `[]`): exactly the ten rows' nodes as `color-contrast-incomplete` findings and nothing else; any other result (a moved selector, a vanished or new one) is a stop-and-ask, since the rows approve those exact nodes. Then `gate:axe` exits 0 with 10 excepted
- [ ] T058 [US3] Plants under `gates/plants/axe/`: every row of contracts/plants.md § `axe`, each with `delta.json` `exceptions: "repository"`, `fail-two-low-contrast` and `fail-incomplete` from T004's measured candidates
- [ ] T059 [US3] `gates/gates.json` entry (contracts/gates.md § `axe`), `gates/lib/registry.ts` FR-020 list, `.github/workflows/ci.yml` job `axe` ("Accessibility")
- [ ] T060 [US3] Run the phase's checks one at a time: `pnpm test`, typecheck, lint, test-lint, `gate:axe`, `gate:visual` (T057's `tabindex` must leave the 24 baselines matching; a `differs` is a stop-and-ask), `OCELLE_VISUAL_ENGINE=auto pnpm run gate:plants`, `gate:mutation -- --base <phase base>`; record times

---

## Phase 5: User Story 4 - The CSP check targets the packages only; exceptions closed; element issues know how to add stories (Priority: P4)

**Goal**: FR-020 to FR-025 (research R-10): `csp` on the packages only, prefix across lines, the externaliser cut
down to `<style>`, the render test, the documentation and the closed exceptions.

**Independent Test**: `pnpm --filter "./packages/*" -r build && pnpm run gate:csp` passes and ignores Storybook files;
`pnpm -r build && pnpm run gate:prefix` passes; `pnpm test` passes the render and readme tests; `gates/README.md`
lists seventeen required checks; `tdd-check.sh 5` reports `pass`.

### Tests (red, one commit)

- [ ] T061 [P] [US4] `gates/test/csp.test.ts`: Storybook files are outside the scope (a Storybook inline script and a story `style` attribute report nothing, the same construct in a package's `dist/` still does)
- [ ] T062 [P] [US4] `gates/test/prefix.test.ts`: a `font-family:` declaration whose value ends in `monospace` on the next line is one finding at the line where the declaration starts
- [ ] T063 [P] [US4] `storybook/test/unit/externalise.test.ts`: `<style>` elements are moved to external files and a `<script>` stays inline
- [ ] T064 [P] [US4] `storybook/test/integration/render.test.ts` (from `csp.test.ts`): `iframe.html` holds Storybook's inline `<script>` elements and `dist/` holds no `inline-<hash>.js`; no CSP header and no violation collector; kept, each with its control: preview-only, the build's no-network preload and no request outside the origin while each story renders, the monospace walk, each token story's tokens in both themes (FR-021)
- [ ] T065 [P] [US4] `storybook/test/unit/readme.test.ts`: `storybook/README.md` holds every item of FR-025 and plan.md § Phases 5 (where stories go, one story per variant and state, themes captured by the harness, open shadow roots, surfaces inside the host, the font of form controls set in an element's shadow styles, pointer states and their viewport rule, how to produce, inspect and commit baselines and the one command, arm64 under emulation, CI's captures as the record, plant baselines with the plant mode and the Plants job's artifact, `pass-second-render`'s record, a baseline change needs a pull request description saying why, element run-time CSP)
- [ ] T066 [P] [US4] `gates/test/ci-workflow.test.ts`: the `csp` job builds the packages only (`pnpm --filter "./packages/*" -r build`)
- [ ] T067 [US4] Commit T061 to T066 alone (`test(006-storybook-workbench): phase 5 red — CSP retarget and documentation`) and run `.specify/extensions/story/scripts/red.sh 5 phase`; confirm each fails on its missing behaviour

### Implementation (green)

- [ ] T068 [P] [US4] `gates/bin/csp.ts`: Storybook scope removed; plants: remove the seven Storybook plants of contracts/plants.md § `csp`, add `pass-storybook-out-of-scope`; `.github/workflows/ci.yml` `csp` job builds the packages only
- [ ] T069 [P] [US4] `gates/bin/prefix.ts`: declarations matched across lines; plant `gates/plants/prefix/fail-storybook-html-multiline-monospace`
- [ ] T070 [P] [US4] `storybook/scripts/externalise.ts` cut down to `<style>` elements; `storybook/test/integration/csp.test.ts` renamed to `render.test.ts` and rewritten per T064
- [ ] T071 [US4] `gates/gates.json` scope texts of `csp` and `prefix`; `gates/README.md` (FR-023: the three gates and plants, no Storybook CSP scope or exceptions, deferred table without the three gates and with the `@ocelle/elements` run-time CSP test row, the manifest row naming the first element feature (#17 or #7), seventeen required checks)
- [ ] T072 [P] [US4] `specs/001-repository-foundation/plan.md` and `specs/002-design-tokens/plan.md` Complexity Tracking: the three rows marked closed by feature 006 (FR-024)
- [ ] T073 [P] [US4] `storybook/README.md`: the contributor note (FR-025, every item of T065)
- [ ] T074 [US4] Run the phase's checks one at a time: `pnpm test`, typecheck, lint, test-lint, `gate:csp`, `gate:prefix`, `gate:plants`, `gate:mutation -- --base <phase base>`; the phase review records one walk-through of the contributor note on a scratch story (SC-005)

---

## Dependencies & Execution Order

- Phase 1 first: T004's fixtures and records feed T009, T022, T023, T038, T040, T057 and T058.
- Phase 2 (US1) before Phases 3 and 4: both build the Storybook through T015 and run plants in the roots of T013.
- Phase 3 (US2) before Phase 4 (US3): the axe gate uses `contextOptions`, `story-page.ts`, `storybook-serve.ts` and the
  pointer functions of Phase 3.
- Phase 5 (US4) depends only on Phase 1 and can follow any phase; it is last by priority.
- Within a phase: the red tests, their commit and `red.sh`, then the implementation; `[P]` tasks touch different files.

## Parallel Opportunities

- Phase 2: T006 to T011 (tests) are independent; T014 alongside T013.
- Phase 3: T019 to T027 (tests) are independent; T029 to T034 (pure modules) are independent.
- Phase 4: T047 to T053a; T055's modules.
- Phase 5: T061 to T066; T068, T069, T070, T072, T073.
- Heavy runs (browser suites, the container, plants, mutation) are never parallel.

## Implementation Strategy

- **MVP**: Phases 1 and 2: the Storybook build is a merge gate and plant roots hold the Storybook workspace.
- **Increment 2**: Phase 3: baselines and the visual gate, confirmed in CI under both engines (T044 to T046).
- **Increment 3**: Phase 4: axe.
- **Increment 4**: Phase 5: CSP retarget, the closed exceptions and the contributor note.
- Each phase is reviewed and folded before the next starts.
