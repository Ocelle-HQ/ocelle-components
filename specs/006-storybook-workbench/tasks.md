# Tasks: Storybook workbench and visual regression baselines

**Input**: design documents in `specs/006-storybook-workbench/`, as approved at the plan gate on 2026-11-10 after three
plan-squad rounds:
- spec.md (FR-001 to FR-031, US1 to US4);
- plan.md, decisions 1 to 18, § Phases, Complexity Tracking (decisions 19 and 20 and the FR-029 exception rows added
  by the operator's decisions on the phase 1 spike, 2026-11-10; decision 21 added by the operator's decision on CI run
  43064614842, 2026-11-11; decisions 22 to 25 and the updated row "Plant roots hold every repository story" added by
  the operator's decisions on CI run 43072665056, 2026-11-11; decisions 26 and 27 added by the operator's answers of
  2026-11-12; decision 28 added by the operator's decision on CI run 43211645709, 2026-11-12; decision 29 added by
  the operator's decisions on the merge of mission 005, 2026-11-12);
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
  **Raised by CI run 43064614842 and decided by the operator (2026-11-11, human:jeroennouwsdev)**: under podman the
  pin check exited 2, `podman manifest inspect` refusing the pin's single image manifest. **"skopeo inspect --raw"**:
  under podman the pin check reads the media type with `skopeo inspect --raw docker://<image>@<digest>`; docker's
  reader is unchanged; a podman run without skopeo exits 2 (research R-06; plan decision 21; contracts/container.md
  § The pin check). Carried by T044a, T044b and T045.
- **A CI runner without skopeo** (T045): installing it in the workflow is a CI change; the operator decides.
- **T045** (CI run 43072665056 on `07c97ef`, reviews/phase-3/ci-run.md: Visual regression 24/24 under docker+podman,
  the Plants gate 37 min 13 s with 241 plants, 4.2G free at the end of both visual jobs, no podman or skopeo output in
  the logs). **Raised by that run and decided by the operator (2026-11-11, human:jeroennouwsdev)**:
  1. podman's inspect output, skopeo's raw manifest and `skopeo --version` are not in the logs: **"Add the CI step"**.
     The "Visual regression" job gains, after the gate step, a step that writes the three outputs to files and uploads
     them as the artifact `pin-record`; the gate's output stays as its contract says; the next run's record replaces
     T022's podman fixture and T044a's skopeo fixtures, test-first if they differ (research R-02; plan decision 22).
     Carried by T046a, T046b, T045, T046f and T046g.
  2. the Plants job is over 30 minutes: **"In phase 3 now"**. The Plants job is split in this mission, before phase 4,
     keeping every guarantee of the single job (research R-07; plan decision 23; contracts/gates.md § The registry;
     contracts/plants.md § Shards). Carried by T046c, T046d and T045.
  3. the split count of 9 stories, estimated without a time per plant: **"Measure first"**, not approved. The plant job
     prints each plant's time (a stderr note; the summary line unchanged), and the count is derived from the next run
     and proposed again (research R-07; plan decision 24). Carried by T046c, T046d, T045 and T046h.
  4. 4.2G free disk: **"Apply now"**. The gate's `--remove-docker-image` in "Visual regression" (docker's copy removed
     after run 1, before podman's pull; each engine's pin check just before its first run) and the toolset removal in
     each Plants shard (research R-07; plan decision 25). Carried by T046a to T046d and T045.
  **Asked after that design and decided by the operator (2026-11-12, human:jeroennouwsdev)**:
  5. build decisions 23 and 25 as designed? **"Build as designed"**: the three-job Plants split with the verdict job
     and the provisional shard size 8, and the opt-in `--remove-docker-image` with the run order docker's pin check,
     build, run 1, removal, podman's pin check, run 2; the design is not changed (plan decision 26). Carried by T046a
     to T046d.
  6. the pin record reads no index, so `skopeo-inspect-raw-index.json` could not be replaced: **"Add the tag read"**.
     The pin record step also runs `skopeo inspect --raw docker://<image>:<tag>`, the tag from
     `storybook/visual/container.json`, and saves it in `pin-record` as `skopeo-inspect-raw-index.json`; T046f replaces
     that fixture too, test-first (research R-02; plan decision 27). Carried by T046a, T046b, T045, T046f and T046g.
  **Raised by CI run 43211645709 (head `1b6ddd5`, reviews/phase-3/ci-run-43211645709.md) and decided by the operator
  (2026-11-12)**:
  7. Plants shard (7) took 11 min 5 s (151 s toolset removal, 200.6 s first plant pulling both images); "Which plant
     shard setup do you choose?": **"Measure disk, then B'"**. A `df -h /` before the toolset removal in
     `plants-shard`, test-first; one more CI run; the measured free disk brought to the operator; then B' (no toolset
     removal, `size` 6, 9 shards, split count 21 stories) if the disk allows, else A' (removal kept, `size` 4, 13
     shards, split count 19 stories), on the disk condition of plan decision 28. No split count is approved before
     the operator's answer to T046l (plan decision 28). Carried by T046i to T046p, T045 and T046h. The B' and A'
     figures here (size 6 with 9 shards and split count 21; size 4 with 13 shards and split count 19) were estimated
     at 12 stories and **no longer hold** since the merge of mission 005 (21 stories): decision 29 below.
  **Raised by the merge of origin/main `476602e` (mission 005, icons and the Ocelle brand mark) in `39763c7` and
  decided by the operator (2026-11-12)**: the repository goes from 12 to 21 stories (`icon.stories.ts`,
  `brand-mark.stories.ts`), 24 to 42 story-themes; the 18 new story-themes have no baseline (`gate:visual`: 18
  `missing-baseline`), and the tests and plants that name the repository's stories fail on the 12/24 counts.
  8. "How should the 18 new baselines be made?": **"Generate locally"**. `visual:update` under docker in the pinned
     container, as for the first 24; then, test-first, the tests and plants that name the repository's stories; CI
     confirms the bytes under docker and podman (plan decision 29). Carried by T046q, T046r, T046s and T046k.
  9. "What size should the measuring run use?": **"Size 4, keep removal"**. The measuring run of decision 28 uses
     shard `size` 4 (about 13 shards) and keeps the toolset removal; its `A_k`, `B_k`, `E_k` and per-shard times at
     21 stories come from that one run, and the B'/A' options and the split count are re-derived from it for the
     operator (plan decision 29). Size 4 here is the measuring run's size, not an approved size. Carried by T046t,
     T046u, T046v, T046k and T046l to T046p.
- **Any mutation shard over 10 minutes**; **the Plants job near 30 minutes** (research R-07); since the split, **any
  Plants shard near 10 minutes**, and **a job short of disk after the measures of decision 25** (T045); **the
  measured free disk of every Plants shard, before the choice between B' and A'** (T046l, plan decisions 28 and 29);
  **the split count and size re-derived from the measuring run at 21 stories** (T046l, plan decision 29).
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
contracts/gates.md § `visual`, contracts/container.md, data-model § Verdict), the 24 baselines (42 with mission 005's
stories, T046q), the plants, and the CI
jobs.

**Independent Test**: `pnpm run gate:visual` prints `visual: 24 captures match their baselines (docker only: no
cross-engine comparison)` here (42 since the merge of mission 005 and T046q, plan decision 29); `pnpm run visual:update` on an unchanged tree leaves `git diff` empty; every `visual`
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
- [X] T044 [US2] Ask the operator (stop-and-ask) to push the branch and start CI (pull request or dispatch) for T045
- [x] T044a [US2] Red for plan decision 21 (operator decision 2026-11-11, "skopeo inspect --raw"; contracts/container.md § The pin check), test files and fixtures only: in `gates/test/container.test.ts`, T022's expectations of `podman manifest inspect` and of `podman-manifest-inspect.json` are replaced (not loosened; the reason, this decision, in the commit message), and the pin commands under podman read the media type with `skopeo inspect --raw docker://<image>@<digest>` (pull and identity still `podman pull` and `podman image inspect`), docker's three commands unchanged, an engine path whose base name holds `podman` counted as podman; the skopeo check as a pure function of the resolved engines and the tools found: `podman` without skopeo, and `both` without skopeo, exit 2 `the pin check under podman needs skopeo: skopeo not found`, `docker` alone without skopeo and `podman` or `both` with it pass; `mediaTypeProblem` on `skopeo-inspect-raw-manifest.json` (no problem) and `skopeo-inspect-raw-index.json` (`the pin names an index, not the linux/amd64 manifest`). Under `gates/test/fixtures/container/`: add those two fixtures as byte copies of T004's recorded `docker-imagetools-manifest.json` and `docker-imagetools-tag-index.json` (the registry's raw bytes, whichever tool reads them) until T045 records skopeo's own output; remove `podman-manifest-inspect.json` and every test use of it; update the fixtures' `README.md` (what each skopeo fixture is a copy of, and that T045 replaces them). In `gates/test/integration/visual.test.ts`: with `PATH` holding only a directory with a stub `podman` executable that writes a marker file when run, the gate spawned by `process.execPath` with `--engine podman` and `CI` and `GITHUB_ACTIONS` stripped exits 2 with `visual: could not run: the pin check under podman needs skopeo: skopeo not found` and the marker file does not exist (the check runs before any engine command). Commit alone (`test(006-storybook-workbench): phase 3 CI red — podman's pin check reads with skopeo`) and record the red run: each new test fails on the missing behaviour
- [x] T044b [US2] Green for T044a: `gates/lib/container.ts` (`pinCommands` under podman with skopeo's media type command, the skopeo check), `gates/lib/visual-host.ts` (the lookup of `skopeo` on `PATH` and the check once, before the pin check of the first engine), each process-boundary `Stryker disable` comment naming T044a's integration test; the phase's checks of T043 that the change touches, one at a time; then ask the operator (stop-and-ask, as T044) to push the branch for T045's run
- [ ] T045 [US2] Record the CI run in the phase review (FR-026, plan decision 7), on a head that holds T044b, and (operator decisions 2026-11-11) T046b and T046d; CI run 43072665056 on `07c97ef` is recorded in reviews/phase-3/ci-run.md and does not close it: Visual regression and Plants under docker and podman, podman's inspect outputs and skopeo's raw manifest output with `skopeo --version` (replace the written fixtures of T022 and the skopeo fixtures of T044a with them, test-first if they differ; a runner without skopeo is a stop-and-ask), job times, the time per story-theme of `visual` and `axe` plants and the split count derived from it, the runner's free disk after both pulls; propose the split count's Complexity Tracking row for the operator's approval. Extended by the operator's decisions of 2026-11-11: from the run that holds T046b and T046d, record the `pin-record` artifact (its four files, `skopeo --version` and, by plan decision 27, skopeo's raw index of the tag among them; the fixtures are replaced by T046f and T046g), the time of each job, Plants plan, every Plants shard and Plants among them, the `note: plant time:` lines of every shard (the split count and the shard size are derived from them by T046h), the free disk of each Plants shard after the toolset removal and at the end and of Visual regression at the end (after the removal of docker's copy), the absence or text of the note `docker's copy of the pinned image was not removed`, and the Plants check's verdict line; a shard near 10 minutes or a job short of disk is a stop-and-ask. CI run 43211645709 on `1b6ddd5` is recorded in reviews/phase-3/ci-run-43211645709.md and does not close it either (operator decision 2026-11-12, "Measure disk, then B'", plan decision 28): T045 closes when T046k records the run that holds T046j and, by plan decision 29 (operator decisions 2026-11-12, "Generate locally" and "Size 4, keep removal"), T046q to T046u (the 42 baselines, the story-count follow-ups and shard `size` 4), with every item above and each Plants shard's free disk before the toolset removal; Visual regression in that run is 42/42 under docker+podman, which confirms T046q's 18 locally made baselines
- [x] T046 [US2] If CI's captures differ from the local baselines, commit CI's artifact files (CI is the producer of record, plan decision 7) with the reason in the commit message

#### After CI run 43072665056 (operator decisions 2026-11-11, plan decisions 22 to 25)

Order: T046a, T046b, T046c, T046d, T046e, then T045's run, then T046f, T046g and T046h.

- [x] T046a [US2] Red for plan decisions 22 and 25 in the Visual regression job (operator decisions 2026-11-11, "Add the CI step" and "Apply now"; contracts/gates.md § `visual`, § The registry; contracts/container.md § The pin check), test files only: in `gates/test/container.test.ts`, `runSteps` (the order of a run): `both` with the option gives pin check under `docker`, build, run 1 under `docker`, removal, pin check under `podman`, run 2 under `podman`; `both` without it the same without the removal; one engine (`auto` resolving to docker, or `docker`) gives one pin check before the build and both runs under it; `host` gives no pin check (as today); `removeCommand` of the pin is `docker image rm mcr.microsoft.com/playwright@sha256:ee15…b1d0` (the full digest written out); the option check as a pure function of the resolved engines: `both` passes, and `docker`, `podman`, `auto` resolving to one engine and `host` with the option exit 2 `--remove-docker-image needs both engines (docker for run 1, podman for run 2)`. In `gates/test/integration/visual.test.ts`: with `PATH` holding only a directory with a stub `docker` executable that writes a marker file when run, the gate spawned with `--engine docker --remove-docker-image` and `CI` and `GITHUB_ACTIONS` stripped exits 2 with `visual: could not run: --remove-docker-image needs both engines (docker for run 1, podman for run 2)` and the marker file does not exist. In `gates/test/ci-workflow.test.ts`: the `visual` job's exact lines with the gate step `pnpm run gate:visual -- --engine both --remove-docker-image`, then the pin record step (reads `<image>@<digest>` from `storybook/visual/container.json`; writes `skopeo --version` to `skopeo-version.txt`, `skopeo inspect --raw docker://<image>@<digest>` to `skopeo-inspect-raw-manifest.json` and `podman image inspect <image>@<digest>` to `podman-inspect.json`, and, by plan decision 27 (operator decision 2026-11-12, "Add the tag read"), reads `<image>` and `tag` from the same file and writes `skopeo inspect --raw docker://<image>:<tag>` to `skopeo-inspect-raw-index.json`, all in `$RUNNER_TEMP/pin-record/`) and its upload as the artifact `pin-record` with the SHA-pinned `actions/upload-artifact`, then `df -h /` always and the `visual` upload on failure as today. Commit alone (`test(006-storybook-workbench): phase 3 CI red — pin record and docker's copy`) and record the red run: each new test fails on the missing behaviour
- [x] T046b [US2] Green for T046a: `gates/lib/container.ts` (`runSteps`, `removeCommand`, the option check), `gates/lib/visual-host.ts` and `gates/bin/visual.ts` (`--remove-docker-image`, the run in `runSteps`' order, the removal with the note `note: docker's copy of the pinned image was not removed: <last stderr line>` on failure), each process-boundary `Stryker disable` comment naming T046a's integration test or, for the removal itself, which only CI's two engines reach, the Visual regression job of T045's run; `.github/workflows/ci.yml` (the `visual` job of T046a, the pin record step with its four reads, the tag read of plan decision 27 among them); the phase's checks of T043 that the change touches, one at a time (`gate:visual` and `visual:update` with no diff, here under `--engine auto`)
- [x] T046c [US2] Red for plan decisions 23 and 24 and the toolset part of 25 (operator decisions 2026-11-11, "In phase 3 now", "Measure first", "Apply now"; contracts/plants.md § Shards, § Plant runner changes; contracts/gates.md § The registry), test files only: in `gates/test/plant-runner.test.ts`, `plantShards` on hand-written plant lists: 3 registry plants, 5 `lint` plants, 2 `storybook-build` plants and 17 `visual` plants with `size` 8 give 4 shards (shard 1 the registry, `lint` and `storybook-build` plants; shards 2 and 3 the first 8 and next 8 `visual` plants by name; shard 4 the last), adding 9 `axe` plants gives 6, no `visual` or `axe` plant gives 1, and every plant is in exactly one shard; the repository's `size` is 8. In `gates/test/plants.test.ts` (recorded runs, injected clock): one `note: plant time: <gate>/<case>: <seconds> s` per plant, registry plants included (`plants/<case>`), with one decimal (1,250 ms → `1.3 s`), the summary line unchanged; `--plan` prints `[1,2,3,4]`; `--shard 2` judges only shard 2's plants, runs no registry check, prints `plants: shard 2 of 4: 8 plants judged, every plant as expected` and writes `storybook/.visual/plant-shards/2.json` with `shard`, `of`, `plants` (`plant`, `asExpected`, `lines`, `seconds`), `skipped` and `notRun`, also when a plant is not as expected (exit 1); `--shard 5` exits 2 `there is no shard 5; the plan has 4`; `--verdict` on hand-written reports: a complete, as-expected set prints exactly the single run's summary line; shard 3 missing exits 2 naming `shard 3 of 4 reported no result`; a report with `of` 3 exits 2; a report holding a plant of another shard exits 2 `shard 2 judged other plants than the partition gives it: visual/<case>`; a report with a skipped plant exits 2; a report's problem lines are printed with the summary `plants: <p> problems in <n> plants` (exit 1); a registry finding and a structural problem (a gate without a breaking plant) are reported by `--verdict` and not by `--shard`. In `gates/test/registry.test.ts`: `plants-plan` and `plants-shard` are not gate jobs; `skip-container-in-ci` on a `--skip-container` step of `plants-shard` and of `plants-plan`; `shard-in-plant-check` on a `plants` step with `--shard 1` and with `--plan`, and none for `--shard "$SHARD"` in `plants-shard`. In `gates/test/ci-workflow.test.ts`: the exact lines of the three plant jobs of contracts/gates.md § The registry (the plan output `shards`; the matrix from it with `fail-fast: false`; the toolset removal step `sudo rm -rf /usr/local/lib/android /usr/share/dotnet /opt/ghc /usr/local/.ghcup /opt/hostedtoolcache/CodeQL` then `df -h /`; `OCELLE_VISUAL_ENGINE: both` and `SHARD` from the matrix for `pnpm run gate:plants -- --shard "$SHARD"`; `df -h /` always; the report uploaded always as `plant-shard-${{ matrix.shard }}`; `storybook/.visual/plants/` on failure as `plants-${{ matrix.shard }}`; `plants` named Plants with `needs`, `if: always()`, the SHA-pinned `actions/download-artifact` of `plant-shard-*` into `storybook/.visual/plant-shards/` and `pnpm run gate:plants -- --verdict storybook/.visual/plant-shards`). In `gates/test/integration/plants.test.ts`: the run with `PATH` holding neither docker nor podman prints a `note: plant time:` line for each plant it judged; `--verdict` on an empty directory exits 2 naming every shard `1..n` of the repository's plan. Commit alone (`test(006-storybook-workbench): phase 3 CI red — plant shards and plant times`) and record the red run: each new test fails on the missing behaviour
- [x] T046d [US2] Green for T046c: `gates/lib/plant-runner.ts` (`plantShards`, `size` 8, the note's text), `gates/bin/plants.ts` (the time notes, `--plan`, `--shard`, the report, `--verdict`), `gates/lib/registry.ts` (the plant job's helper jobs, `skip-container-in-ci` over the three plant jobs, `shard-in-plant-check`); registry plants `gates/plants/plants/fail-skip-container-in-shard/`, `fail-shard-in-plant-check/` and `pass-split-plant-jobs/` (contracts/plants.md § `plants`); `gates/README.md` § the plant job and the `plants` row of its gates table (the three modes, the helper jobs, the new registry rule and plants; the required check stays "Plants"); `.github/workflows/ci.yml` (the three plant jobs; `actions/download-artifact` pinned by commit SHA, its release passing the pins gate's release-age rule); each process-boundary `Stryker disable` comment naming T046c's integration test; the phase's checks of T043 that the change touches, one at a time, the plant run as `--plan`, each `--shard <k>` under `OCELLE_VISUAL_ENGINE=auto`, then `--verdict`, with the times recorded
- [ ] T046e [US2] Ask the operator (stop-and-ask, as T044) to push the branch with T046b and T046d for T045's run
- [x] T046f [US2] Fixtures from T045's `pin-record` artifact (plan decision 22), test fixtures only: replace `gates/test/fixtures/container/podman-inspect.json`, `skopeo-inspect-raw-manifest.json` and, by plan decision 27 (operator decision 2026-11-12, "Add the tag read"), `skopeo-inspect-raw-index.json` with the artifact's bytes; the tests' expected values stay written from the pin, not read from the fixtures; the mismatch cases (a wrong digest, an arm64 image) are made from the recorded file with only that field changed; the index fixture's test still expects `the pin names an index, not the linux/amd64 manifest` (the recorded bytes are the tag's index on the day of the run, which may differ from the spike's); the fixtures' `README.md` names the run, the head, the tag and skopeo's version, and that no skopeo fixture is a copy any more. Run `gates/test/container.test.ts` against the code as it is: if any test fails, commit alone (`test(006-storybook-workbench): phase 3 CI red — recorded podman and skopeo outputs`) and record the red run; if none fails, commit the fixtures with that result in the commit message, and T046g records that no code change was needed
- [x] T046g [US2] Green for T046f, if it was red: the parsers of `gates/lib/container.ts` accept the recorded outputs (the tag's raw index among them) without loosening any T022 or T044a expectation; the phase's checks of T043 that the change touches; a change the gate's behaviour on the runner depends on goes back to CI through the operator (stop-and-ask, as T044)
- [ ] T046h [US2] From T045's `note: plant time:` lines: the time of each `visual` plant and its time per story-theme (its time over its root's story-themes), the time of each shard, and from them the shard `size` that keeps a shard under 10 minutes and the **split count**, the number of repository stories at which one shard of that `size` would pass 10 minutes; propose both, with the updated Complexity Tracking row "Plant roots hold every repository story", for the operator's approval (stop-and-ask; plan decision 24; the 9-story estimate stays unapproved). After approval, a `size` other than 8 is red first in T046c's `plantShards` test of the repository's `size`, then the constant. Proposed from CI run 43211645709 (options A, A', B and B' in reviews/phase-3/ci-run-43211645709.md); the operator chose "Measure disk, then B'" (2026-11-12, plan decision 28), which approves neither a `size` nor a split count. T046h stays open until the operator approves both in answer to T046l, after the measuring run of T046k, and the chosen branch (T046m and T046n, or T046o and T046p) is done; the `size` change is made there. By plan decision 29 (operator decision 2026-11-12, "Size 4, keep removal") the measuring run uses `size` 4 (T046t, T046u); that is the measuring run's size and approves no `size` and no split count; the size and count T046h proposes are the ones T046l re-derives from T046k's run at 21 stories, not those of reviews/phase-3/ci-run-43211645709.md, which were estimated at 12 stories and no longer hold

#### After CI run 43211645709 (operator decision 2026-11-12, "Measure disk, then B'", plan decision 28)

Order: T046i, T046j, then (plan decision 29) T046q, T046r, T046s, T046t, T046u and T046v, then T046k (the measuring
run, which closes T045), T046l, then either T046m and T046n (B') or T046o and T046p (A'), never both. T046j's request
to push is superseded by T046v: the measuring run must hold T046q to T046u too. T046h closes with the operator's
answer to T046l and the chosen branch.

- [x] T046i [US2] Red for plan decision 28's measuring step (contracts/gates.md § The registry), test files only: in `gates/test/ci-workflow.test.ts`, the exact lines of `plants-shard` gain `- run: df -h /` as the job's first step, before the toolset removal step `sudo rm -rf /usr/local/lib/android /usr/share/dotnet /opt/ghc /usr/local/.ghcup /opt/hostedtoolcache/CodeQL`; the removal, the `df -h /` after it and every later step stay as T046c pinned them. Commit alone (`test(006-storybook-workbench): phase 3 CI red — free disk before the toolset removal`) and record the red run: the test fails on the missing step
- [x] T046j [US2] Green for T046i: `.github/workflows/ci.yml` (the `df -h /` step first in `plants-shard`); the same step in the plant copies of `ci.yml` (`gates/plants/plants/fail-skip-container-in-shard/ci.yml`, `pass-split-plant-jobs/ci.yml`, `fail-shard-in-plant-check/ci.yml`), so each stays the repository's `ci.yml` with only its own change; `gates/README.md` § the plant job if it lists the steps; `size` stays 8; the phase's checks of T043 that the change touches, one at a time (`pnpm test` for `ci-workflow.test.ts`, the registry plants through `gate:plants`); then ask the operator (stop-and-ask, as T044) to push the branch for T046k's run

#### After the merge of mission 005 (operator decisions 2026-11-12, "Generate locally" and "Size 4, keep removal", plan decision 29)

The merge `39763c7` of origin/main `476602e` brings `icon.stories.ts` and `brand-mark.stories.ts`: 21 repository
stories, 42 story-themes, 18 of them without a baseline. Story ids, counts and story-theme lists in tests and
`plant.json` files are written by hand from the story files and from Storybook's id rule, never read from the gate's
output.

- [x] T046q [US2] The 18 new baselines (plan decision 29, "Generate locally"; as T039): Docker per § Environment, then `pnpm run visual:update` under docker in the pinned container (`--engine auto`, resolving to docker here); it prints `baselines: wrote 18 files (18 added, 0 changed, 0 removed), <bytes> bytes in total`, and `git status` shows exactly the 18 new files under `storybook/baselines/`, two per new story (`<id>.light.png`, `<id>.dark.png`), and no change to the 24 existing ones (any change or removal is a stop-and-ask); then `pnpm run gate:visual` prints `visual: 42 captures match their baselines (docker only: no cross-engine comparison)` and `visual:update` again leaves `git diff` empty. Commit the baselines alone (`feat(006-storybook-workbench): phase 3 — baselines of mission 005's stories`), the run, the total size and the reason (baselines are data, no behaviour; recorded with T039's) in the phase review and `reviews/phase-3/tdd-exempt.md` (created if absent); CI's run in T046k confirms the bytes under docker and podman, and if CI's captures differ, T046 applies (CI's artifact files committed with the reason)
- [x] T046r [US2] Red for the story-count follow-ups (plan decision 29), test files only: every test that names the repository's stories or their counts gets the merged repository's values, written by hand: `gates/test/integration/storybook-build.test.ts` (`storybook-build: built 21 stories`), `gates/test/storybook-index.test.ts` where it names the repository's stories, `gates/test/integration/visual.test.ts` (42 captures; `visual:update` on an unchanged tree `wrote 0 files`; the kept-outputs fixture's "no file under `storybook/.visual/` names any other story-theme" over the 42), and the plants tests (`gates/test/plants.test.ts`, `gates/test/integration/plants.test.ts`, the plan's shard numbers where they come from the repository's plants) wherever they count or list the repository's stories; no expectation is loosened, and each changed expected value names this decision in the commit message. Commit alone (`test(006-storybook-workbench): phase 3 red — mission 005's stories`) and record the red run against the tree with T046q: each test that fails on a `plant.json` still naming 12 stories or 24 story-themes is the red; a test whose new value the merge and T046q already make true is listed in the commit message and the review as an expectation update with that reason (the counts were made true by the merged stories, not by code); if none fails, say so in the commit message and T046s's plants are checked by `gate:plants` only
- [x] T046s [US2] Green for T046r: every `plant.json` with an exact repository list or count gets the merged repository's values: `gates/plants/storybook-build/pass-repository/` (`built 21 stories` if its expectation names the count), `gates/plants/visual/fail-token-changed/` (the `differs` lines of every light story-theme that shows `color-ink`, the twelve of the phase 1 spike plus each of the 18 new story-themes that shows it, measured in the pinned container the way T004 measured, by capturing the new stories with and without the token change and comparing the bytes, recorded in the phase review; its `why` text updated), and any other plant whose findings or summary name the repository's stories or counts (found by `grep` over `gates/plants/` for the 12 story ids, `12 stories`, `24 captures` and `24 story-themes`, each listed in the review); contracts/plants.md's `fail-token-changed` row already says the list is measured again (plan decision 29). Then the phase's checks one at a time: `pnpm test`, `gate:typecheck`, `gate:lint`, `gate:test-lint`, `gate:storybook-build` (`built 21 stories`), `gate:visual` (42 captures), `visual:update` (no diff), and `OCELLE_VISUAL_ENGINE=auto pnpm run gate:plants` as `--plan`, each `--shard <k>` and `--verdict` (still `size` 8), with the times recorded
- [ ] T046t [US2] Red for the measuring run's shard size (plan decision 29, "Size 4, keep removal"; contracts/plants.md § Shards), test files only: in `gates/test/plant-runner.test.ts`, T046c's test of the repository's `size` expects 4 (T046c's hand-written `plantShards` cases at `size` 8 stay); `ci-workflow.test.ts` unchanged (the toolset removal and T046i's two `df -h /` steps stay). Commit alone (`test(006-storybook-workbench): phase 3 CI red — shard size 4 for the measuring run`) and record the red run: the test fails on `size` 8
- [ ] T046u [US2] Green for T046t: `gates/lib/plant-runner.ts` (`size` 4); `gates/README.md` § the split plant job, which names the size ("groups of at most 8", "8 is provisional"): 4, provisional, the measuring run's size until the operator approves one at T046l; the phase's checks of T043 that the change touches, one at a time: `pnpm test`, `OCELLE_VISUAL_ENGINE=auto pnpm run gate:plants -- --plan` (13 shards: shard 1 and the 48 `visual` plants in 12 shards of 4; any other count is recorded with the plant list), each `--shard <k>`, then `--verdict`, with each shard's time recorded (at about 62 s per `visual` plant at 21 stories, about 250 s of plants per shard here before CI's fixed part)
- [ ] T046v [US2] Ask the operator (stop-and-ask, as T044) to push the branch with T046j and T046q to T046u for T046k's measuring run (`size` 4, toolset removal kept, 21 stories)
- [ ] T046k [US2] Record the CI run that holds T046j and T046q to T046u (plan decisions 28 and 29) in the phase review (`reviews/phase-3/ci-run-<run id>.md`), with every item T045 names and: Visual regression 42/42 under docker+podman (CI's confirmation of T046q's bytes; a difference is T046); for each Plants shard k at `size` 4, `A_k` (free disk before the removal), `B_k` (after it), `E_k` (at the end), `U_k = B_k − E_k` and `A_k − U_k` (plan decision 28); each shard's time with its toolset removal, first plant and setup times; each `visual` plant's time and its time per story-theme at 21 stories (its time over its root's story-themes); this record closes T045; a shard near 10 minutes or a job short of disk is raised in T046l, not decided here
- [ ] T046l [US2] Stop-and-ask, on T046k's run only (plan decision 29): re-derive and bring to the operator (a) the table of `A_k`, `B_k`, `E_k`, `U_k` and `A_k − U_k` per shard, the worst shard, and that the records measure the end of a shard, not its peak, and that `U_k` is measured on shards of 4 `visual` plants, so a larger `size` is not measured by this run; (b) from the run's per-story-theme time and each shard's fixed part (setup, first plant, and the removal time, which B' drops), the options at 21 stories: B' (no toolset removal) and A' (removal kept), each with the largest `size` that keeps a shard under 10 minutes, its shard count, and its **split count**, the number of repository stories at which one shard of that `size` would pass 10 minutes, which must be above 21 (an option with no such `size` is reported as not viable); the arithmetic in the review. The B'/A' figures of reviews/phase-3/ci-run-43211645709.md and plan decision 28 (B': `size` 6, 9 shards, split count 21; A': `size` 4, 13 shards, split count 19; from 1.47 s per story-theme at 12 stories) no longer hold and are not brought as options: the repository already holds 21 stories, B''s count, and is past A''s 19. Ask: (1) the free disk `M` a shard must keep at its end, since no record gives one; (2) whether the end-of-shard use `U_k` may stand for the peak during a shard, or a peak measure is wanted first; (3) B' (`min(A_k − U_k) ≥ M`: drop the toolset removal, with its re-derived `size`) or A' (keep the removal, with its re-derived `size`); (4) approval of the chosen branch's re-derived split count and of its Complexity Tracking row "Plant roots hold every repository story", which a plan fix then writes; no `size` and no split count is approved and no row is written before this answer
- [ ] T046m [US2] B' only (operator's answer to T046l), red, test files only: in `gates/test/ci-workflow.test.ts`, `plants-shard`'s exact lines without the toolset removal step and with a single `df -h /` before checkout (the two `df -h /` steps around the removal become one), the later steps unchanged; in `gates/test/plant-runner.test.ts`, T046c's test of the repository's `size` expects the `size` approved at T046l (decision 28's 6 no longer holds; if the approved `size` is 4, this test is unchanged and the red is the workflow test alone). Commit alone (`test(006-storybook-workbench): phase 3 CI red — no toolset removal, shard size <size>`) and record the red run: each changed test fails on the missing behaviour
- [ ] T046n [US2] B' only, green for T046m: `.github/workflows/ci.yml` (`plants-shard` without the removal) and the three plant copies of `ci.yml` alike; `gates/lib/plant-runner.ts` (the approved `size`); `gates/README.md` § the split plant job (the approved size, no longer provisional); the phase's checks of T043 that the change touches, one at a time, the plant run as `--plan` (the shard count T046l derived for the 21 repository stories), each `--shard <k>` under `OCELLE_VISUAL_ENGINE=auto`, then `--verdict`; then ask the operator (stop-and-ask, as T044) to push the branch, and record that run's shard times and free disk in the phase review; a shard near 10 minutes or a job short of disk is a stop-and-ask
- [ ] T046o [US2] A' only (operator's answer to T046l), red, test files only: in `gates/test/plant-runner.test.ts`, T046c's test of the repository's `size` expects the `size` approved at T046l; `ci-workflow.test.ts` unchanged (the removal and T046i's `df -h /` stay). If the approved `size` is 4, T046t already made it: this task is skipped with that reason in the review and T046p is only the README text and the CI run. Otherwise commit alone (`test(006-storybook-workbench): phase 3 CI red — shard size <size>`) and record the red run: the test fails on `size` 4
- [ ] T046p [US2] A' only, green for T046o: `gates/lib/plant-runner.ts` (the approved `size`, if not 4); `gates/README.md` § the split plant job (the approved size, no longer provisional); the phase's checks of T043 that the change touches, one at a time, the plant run as `--plan` (the shard count T046l derived for the 21 repository stories), each `--shard <k>` under `OCELLE_VISUAL_ENGINE=auto`, then `--verdict`; then ask the operator (stop-and-ask, as T044) to push the branch, and record that run's shard times and free disk in the phase review; a shard near 10 minutes or a job short of disk is a stop-and-ask

---

## Phase 4: User Story 3 - axe runs on every story and blocks serious and critical findings (Priority: P3)

**Goal**: the `axe` gate (FR-013 to FR-016, FR-029; contracts/gates.md § `axe`; data-model § axe result, § Exception).

**Independent Test**: `pnpm run gate:axe` prints `axe: 42 story-theme runs, 0 serious or critical; …` (21 stories since the merge of mission 005, plan decision 29); every `axe`
plant is judged correctly; `tdd-check.sh 4` reports `pass`.

### Tests (red, one commit)

- [ ] T047 [P] [US3] `gates/test/axe-rules.test.ts`: selection on fixture metadata (default rules plus every rule tagged `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`, minus `experimental`, minus the harness-document rules of FR-016); a test deriving the 4.14.0 lists from axe-core's own metadata (every document-element rule is a harness-document rule, `experimental`, or one of `frame-focusable-content`, `frame-tested`)
- [ ] T048 [P] [US3] `gates/test/axe-verdict.test.ts`: serious and critical violations one finding per node; serious and critical incomplete `<rule>-incomplete`; moderate and minor notes on stderr; `outside-root` per element; `printSelector` (shadow levels ` >>> `, frames ` >>frame>> `)
- [ ] T049 [P] [US3] `gates/test/story-checks.test.ts` (additions): `empty` (no descendant of the story root with a non-zero box and no non-whitespace text), `outside-root`
- [ ] T050 [P] [US3] `gates/test/a11y-exceptions.test.ts`: entries `{ story, theme, rule, selector, reason, sunset, plan }`, "Every field a non-empty string"; honoured only when `plan` exists and its `## Complexity Tracking` holds a row naming story, theme, rule and selector in backticks (escaped `\|`) and the sunset, else `unrecorded-exception`; per-node match; `stale-exception`; malformed file "could not run"
- [ ] T051 [P] [US3] `gates/test/axe-context.test.ts`: the axe gate's context options equal `contextOptions(theme)` for each theme
- [ ] T052 [P] [US3] `gates/test/integration/axe.test.ts`: the gate on the repository (exit 0, 42 runs (21 stories since mission 005, plan decision 29), 10 excepted: the Prose document's `color-contrast-incomplete` entries of plan.md § Complexity Tracking, and no `scrollable-region-focusable`) and on a fixture with an unlabelled button (exit 1, two findings)
- [ ] T053a [P] [US3] `storybook/test/unit/render.test.ts` (FR-029, operator decision on spike § 7): every table of the Prose document is rendered `<table tabindex="0">` (update the exact-markup expectations of the prose tests to it); red against today's render code as an assertion failure
- [ ] T053 [P] [US3] `gates/test/registry.test.ts` and `gates/test/ci-workflow.test.ts`: `axe` in `gates.json`, the FR-020 list and `ci.yml` (job `axe`, "Accessibility")
- [ ] T054 [US3] Commit T047 to T053a alone (`test(006-storybook-workbench): phase 4 red — accessibility`) and run `.specify/extensions/story/scripts/red.sh 4 phase`; confirm each fails on its missing behaviour

### Implementation (green)

- [ ] T055 [P] [US3] `gates/lib/axe-rules.ts`, `gates/lib/axe-verdict.ts`, `gates/lib/a11y-exceptions.ts`; `gates/lib/story-checks.ts` empty and outside-root
- [ ] T056 [US3] `gates/bin/axe.ts`: build, serve, a fresh context per story-theme from `contextOptions(theme)`, pointer state, axe injected by `page.addScriptTag({ path })` on the story area, findings and notes per contracts/gates.md
- [ ] T057 [US3] Story fix and exceptions for the existing findings (FR-029, T004, operator decision on spike § 7): `storybook/stories/render.ts` renders the Prose document's wide tables with `tabindex="0"` (T053a passes; this clears `scrollable-region-focusable` at `table:nth-child(12)`); `storybook/a11y-exceptions.json` holds ten entries, one per row of plan.md § Complexity Tracking (axe exceptions under FR-029), in that order: `story` `base-styles--prose-document`, `theme`, `rule` `color-contrast-incomplete`, `selector`, `reason` and `sunset` exactly as the row, `plan` `specs/006-storybook-workbench/plan.md`. Before writing them, re-measure the story's axe results after the `tabindex` fix with the gate (`gate:axe`, file still `[]`): exactly the ten rows' nodes as `color-contrast-incomplete` findings and nothing else (the 18 story-themes of mission 005's stories were never audited by T004: any serious or critical result on them is a stop-and-ask under FR-029 too); any other result (a moved selector, a vanished or new one) is a stop-and-ask, since the rows approve those exact nodes. Then `gate:axe` exits 0 with 10 excepted
- [ ] T058 [US3] Plants under `gates/plants/axe/`: every row of contracts/plants.md § `axe`, each with `delta.json` `exceptions: "repository"`, `fail-two-low-contrast` and `fail-incomplete` from T004's measured candidates
- [ ] T059 [US3] `gates/gates.json` entry (contracts/gates.md § `axe`), `gates/lib/registry.ts` FR-020 list, `.github/workflows/ci.yml` job `axe` ("Accessibility")
- [ ] T060 [US3] Run the phase's checks one at a time: `pnpm test`, typecheck, lint, test-lint, `gate:axe`, `gate:visual` (T057's `tabindex` must leave the 42 baselines matching; a `differs` is a stop-and-ask), `OCELLE_VISUAL_ENGINE=auto pnpm run gate:plants`, `gate:mutation -- --base <phase base>`; record times

---

## Phase 5: User Story 4 - The CSP check targets the packages only; exceptions closed; element issues know how to add stories (Priority: P4)

**Goal**: FR-020 to FR-025 (research R-10): `csp` on the packages only, prefix across lines, the externaliser cut
down to `<style>`, the render test, the documentation and the closed exceptions.

**Independent Test**: `pnpm --filter "./packages/*" -r build && pnpm run gate:csp` passes and ignores Storybook files;
`pnpm -r build && pnpm run gate:prefix` passes; `pnpm test` passes the render and readme tests; `gates/README.md`
lists seventeen required checks (FR-023; main's list is fifteen since mission 005, so see T071 for the count); `tdd-check.sh 5` reports `pass`.

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
- [ ] T071 [US4] `gates/gates.json` scope texts of `csp` and `prefix`; `gates/README.md` (FR-023: the three gates and plants, no Storybook CSP scope or exceptions, deferred table without the three gates and with the `@ocelle/elements` run-time CSP test row, the manifest row naming the first element feature (#17 or #7), seventeen required checks). Since the merge of mission 005 (`39763c7`), `gates/README.md` § Required checks on `main` lists fifteen checks, not fourteen: "Custom-elements manifest" is the fourteenth and Plants the fifteenth. FR-023 and plan.md § Constitution Check say seventeen, counted from fourteen; the docs change starts from main's fifteen and adds Storybook build, Visual regression and Accessibility, which gives eighteen. Before T067's red is written, raise the count with the operator (stop-and-ask; FR-023 and the plan say seventeen, the list would hold eighteen), and T071 and the phase's Independent Test use the count the operator confirms
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
- **Increment 2**: Phase 3: baselines and the visual gate, confirmed in CI under both engines (T044 to T046, with
  T044a and T044b for plan decision 21, T046a to T046h for plan decisions 22 to 27, T046i to T046p for plan
  decision 28, and T046q to T046v for plan decision 29).
- **Increment 3**: Phase 4: axe.
- **Increment 4**: Phase 5: CSP retarget, the closed exceptions and the contributor note.
- Each phase is reviewed and folded before the next starts.
