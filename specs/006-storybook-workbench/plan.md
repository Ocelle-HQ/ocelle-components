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
  (linux/amd64 manifest of `v1.64.1-noble`), run by docker or podman;
- host tools: docker (with buildx) or podman; under podman also skopeo, which reads the pin's raw manifest for the
  pin check's media type (operator decision 2026-11-11, decision 21; research R-06).

**Storage**: files: `storybook/baselines/*.png` (24 at first, 42 with mission 005's stories, decision 29), `storybook/visual/container.json`,
`storybook/a11y-exceptions.json`; ignored output in `storybook/.visual/`.

**Testing**: `gates` (unit, pure modules, mutation-tested: every decision of the capture and of the in-page checks
lives in a pure module); `gates-integration` (real processes: the three gates on fixture trees, the container, the
plant job without an engine); `storybook` (unit, the readme test, the externaliser test); `storybook-integration` (the
render test, as before). The mutation scope gains `gates/visual/`. Research R-12.

**Target Platform**: captures on linux/amd64 in the pinned image, on every host (operator SPEC-1-06), with
`chromium_headless_shell-1248`; axe on the host Chromium (1248 in CI). CI on `ubuntu-24.04` runners, which have docker
and podman, and are expected to have skopeo (confirmed by phase 3's CI run, research R-06).

**Project Type**: repository gates and the private Storybook workspace; nothing published changes (semver none).

**Performance Goals**: each new job well under 10 minutes; the Storybook build takes 2.2 s here (measured). The image
is about 1 GB to pull and 3.6 GB unpacked per engine store (measured). Phase 3's review records the `Plants` job time
and the runner's free disk after both pulls (research R-07). CI run 43072665056 measured the single Plants job at
37 min 13 s and 4.2G free in both visual jobs, so the Plants job is split into shards, each a new job under the
10-minute goal, and both disk measures are taken (decisions 23 to 25, operator decisions 2026-11-11). After CI run
43242674392, the shards are `size` 3 with the toolset removal kept, and the non-visual plants are split over 3 shards:
19 Plants shards in all, each under 10 minutes, with at least 4G free at its end (decision 30).

**Constraints**: byte-exact baselines; no network inside a capture (`--network none`, plus request routing); no root
needed on the host; one heavy job at a time locally.

**Scale/Scope**: 3 gates, 1 command (with a plant mode), about 70 plants (new and changed), 12 stories, 24 baselines (21 stories and 42 baselines since the merge of mission 005, decision 29),
about 14 new source modules.

## Environment (for every role in this feature)

- Start the docker daemon before any container work: `pgrep dockerd || (dockerd > "$SCRATCH/dockerd.log" 2>&1 &)`,
  then wait until `docker info` succeeds. Podman and skopeo are not available here, so local runs use `--engine auto`
  (docker), and plants run with `OCELLE_VISUAL_ENGINE=auto`.
- `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` for host-browser tests (the axe
  gate's tests, the render test). The container brings its own Chromium 1248.
- The container's Node is 26.13.0. The sandbox's Node is 22, so the host side runs on 22 locally. Avoid asserting
  Node error texts (frontend findings).
- Leave `CI` and `GITHUB_ACTIONS` unset locally: with either `true`, the visual gate requires docker and podman
  (research R-06). Integration tests not about that rule remove both from the gate's environment.
- Podman behaviours (run arguments, rootless writes, inspect output, skopeo's raw manifest, cross-engine bytes) are
  proven by the CI run of the branch that phase 3's review holds (research R-02); the operator pushes the branch for it.
  The inspect output and skopeo's raw manifests (the pin's and the tag's index) come from that run's `pin-record`
  artifact (decisions 22 and 27); the removal
  of docker's copy and the Plants shards (decisions 23, 25) are proven only there too.
- One heavy job at a time: browser suites, the container, mutation and plants never run in parallel.

## Constitution Check

*Pre-design and post-design: PASS. Three exceptions are closed, one accepted cost with a sunset is recorded, the
plant job's growth with the repository's stories (Complexity Tracking, operator decision on PLAN-FRESH-2-007 (b)),
and ten per-node exceptions to III are recorded under FR-029 with scope, rationale, the operator's approval and a
sunset: the Prose document's serious `color-contrast` incomplete results, which the axe gate counts as findings and
whose cause is base.css's prose table scroll box (003 surface; operator decision on the phase 1 spike § 7,
2026-11-10). No other new exception to a principle. Updated after the plan squad's
rounds 1 and 2 and the phase 1 spike.*

| Principle | How this plan meets it |
|---|---|
| I. Names, no I/O | No element is added. The gates' names carry no `sk-`. The prefix gate's Storybook scope does not change (FR-022); it now matches declarations across lines. Run-time I/O of a story (same-origin fetch, XHR, WebSocket, EventSource, ping, storage by method or named property, cookies, IndexedDB, the Cache API, clipboard, beacon, and storage left when the render ends) fails the visual gate as `io` (FR-030, R-14), so the no-I/O rule has a check from the first element on. |
| II. Tokens, brand rules | The `font` rule makes "no face but Schibsted Grotesk" a merge gate for every story (research R-05), the text of form controls (values, placeholders, button-type input labels, in user-agent shadow roots) included, and the contributor note says an element's shadow styles set its form controls' font. The monospace walk stays in the render test. |
| III. Accessible | axe runs on every story in both themes, on the whole document minus Storybook's harness, so surfaces anywhere are audited, and a surface outside the story root, or a closed shadow root axe cannot enter, fails. Serious and critical violations and serious and critical incomplete results fail the gate, so rendered contrast that axe cannot decide is not passed silently; empty stories are not passes. The rule set and the harness-document rules not run are named in FR-016 and checked against axe-core's own metadata (R-08). An exception covers one node and is honoured only with its Complexity Tracking row (FR-029); the spike's one existing violation is fixed in the story's render code (`tabindex="0"` on its wide tables), and only the incomplete results whose fix is a 003 change are excepted, node by node. Pointer states can be stories and are audited (R-15), in a browser context with the capture's options (1280 × 800, reduced motion), so axe audits the page the capture shows (R-08). Forced colours stay with the element tests (spec Edge Cases). |
| IV. Strict CSP | `csp` covers the packages' built output "with no exception" again: the Storybook is not built output of a package (operator Q1 (a)), so 002's exceptions 1 and 2 close. Elements remain bound to IV through their package output; their run-time strict-CSP browser test is recorded in `gates/README.md`'s deferred table as the first element feature's (#17 or #7), and the contributor note says element packages prove it in their own browser tests (R-10). |
| V. Storybook, baselines | Every story has two committed baselines made in a pinned container, covering the full page at scroll position (0, 0). The gate fails on a missing or stray baseline. CI's captures are the record when local and CI disagree (R-02), for the plants' baselines too: the baseline command's plant mode regenerates them and the Plants job uploads its captures in tree layout, for `pass-second-render` (`captureAlone`) captures made alone by single-story-theme requests so its freshness reference never comes from a full run (R-11). A story per state includes pointer states, whose target must lie inside the initial viewport so a state is never silently not applied (R-15). Baselines change only in a pull request whose description says why; the contributor note says so and landing checks it. |
| VI. Own code | The gates and the capture are this repository's code. The container image and axe-core are third-party tools used in CI and development only, not shipped (plan-gate decision 1); so are the host tools the gate calls (docker, podman, and skopeo under podman, decision 21). |
| VII. Semver | No published surface changes. |
| VIII. Test-first, proven | Every phase starts red, each red an assertion of the missing behaviour (the pin test asserts the file exists first; the render test's red is taken from the build output). Every decision, the capture's and the in-page checks' included, is a pure module, mutation-tested; only collection and process wiring carry `Stryker disable` comments naming their integration test, and `gates/visual/` is in the mutation scope (R-12). Every gate has fail, pass and breaking plants, with controls where a pass plant alone could not fail (R-04, R-11); the plant job cannot skip or silently drop the container plants (R-07). Plants stay meaningful as the repository changes: edited repository baselines are generated from the current files, never stored, fail plants take the baselines of their pass plant, and plant roots carry the repository's exceptions with their plan files (R-11, R-16). Each capture has one status by a tested order, so a plant's exact expectation does not rest on an unwritten choice (R-05); axe is shown to audit inside open shadow roots (R-08). Each capture refusal check has its own unit test and cause (R-06). The podman behaviours are proven in a CI run of the branch before phase 3 is approved (R-02). Split into shards, the plant job still cannot drop a plant: the "Plants" check recomputes the partition and fails on a shard with no report or other plants than its own, and the registry check covers every plant job (decision 23, R-07). |
| Supply chain | `axe-core` and `pngjs` are pinned exactly and pass the release-age rule. The image is pinned by its manifest digest, pulled and run only by digest, checked by media type and `RepoDigests` on every engine (R-06). A test ties `container.json` to `.node-version` and to Playwright's expected headless-shell build (contracts/container.md). `actions/download-artifact`, new with the split plant job, is pinned by commit SHA as `upload-artifact` is (decision 23). |
| Workflow gates | The registry gains three gates (`gates.json`, FR-020 list, `ci.yml` jobs). The required checks go from fifteen to eighteen in `gates/README.md` (main's list holds fifteen since the merge of mission 005, "Custom-elements manifest" added; the three gates make eighteen, decision 31); the ruleset change is the operator's. In CI the visual gate requires both engines whatever the workflow passes (R-06). The split plant job keeps the one required check "Plants" (its verdict job); `plants-plan` and `plants-shard` are helper jobs, not required (decision 23). |

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
   before building (exit 2 "storybook is not installed; run pnpm install"), the only signal of that case, since the
   build itself does not fail on it (spike § 1). The earlier decision 6 is dropped (R-09, R-16).
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
    (PLAN-FRESH-2-007 (b)) (R-07). Since the operator's decisions of 2026-11-11 the split is phase 3's (decision 23)
    and the count is derived from measured per-plant times (decision 24).
16. **The font check reads form-control text**: text nodes are collected through CDP with `pierce: true`, user-agent
    shadow roots included and attributed to their host control (spec delta to FR-027 and FR-025, PLAN-FRESH-3-001)
    (R-05).
17. **Storage I/O is recorded in every form**: named-property Web Storage through a recording `Proxy`, cookies,
    IndexedDB, the Cache API and `execCommand` copy and cut, with the storage left after the render read as a
    backstop for writes (spec delta to FR-030, PLAN-FRESH-3-002) (R-14).
18. **The axe gate opens its context with the capture's options**, from one function that also gives the pointer
    rule its viewport (PLAN-FRESH-3-003) (R-08, R-15).
19. **The build function turns off pnpm's dependency check before `run`**: it runs
    `pnpm --config.verify-deps-before-run=false --dir storybook run build`, because the check re-links the
    repository's `node_modules` from a plant root (measured, spike § 4); the repository's pnpm configuration is not
    changed, and the gate's CLI check is the only signal of missing Storybook dependencies (operator decision on the
    phase 1 spike § 4, "flag in the build fn", 2026-11-10) (R-09, R-16).
20. **The Prose document story's tables get `tabindex="0"`** in the story's render code, clearing its
    `scrollable-region-focusable` violation, and its ten serious `color-contrast` incomplete results (five nodes, two
    themes) are per-node exceptions in Complexity Tracking with a 003 sunset (operator decision on the phase 1 spike
    § 7, "tabindex + exceptions", 2026-11-10) (R-08).
21. **Under podman, the pin check reads the media type with skopeo**: `skopeo inspect --raw
    docker://<image>@<digest>`, because `podman manifest inspect` refuses the single image manifest the pin is (CI run
    43064614842). Docker's reader is unchanged. Skopeo is required wherever the gate runs under podman, and its
    absence is exit 2 "the pin check under podman needs skopeo: skopeo not found", checked before any engine's pin
    check (operator decision 2026-11-11, "skopeo inspect --raw") (R-06, contracts/container.md § The pin check).

Decisions 22 to 25 are the operator's of 2026-11-11 (human:jeroennouwsdev) on CI run 43072665056 (head `07c97ef`,
reviews/phase-3/ci-run.md: Visual regression 24/24 under docker+podman, the Plants gate 37 min 13 s with 241 plants,
4.2G free at the end of both visual jobs, no podman or skopeo output in the logs).

22. **A pin record step in "Visual regression"** ("Add the CI step"): after the gate step, `skopeo --version`,
    `skopeo inspect --raw docker://<image>@<digest>` and `podman image inspect <image>@<digest>` are written to files
    and uploaded as the artifact `pin-record`; the gate's output stays as its contract says. The next run's record
    replaces T022's podman fixture and T044a's skopeo manifest fixture, test-first if the bytes differ (R-02,
    contracts/container.md § The pin record). Extended by decision 27.
23. **The Plants job is split in phase 3** ("In phase 3 now"), before phase 4: `plants-plan` prints the shard numbers,
    `plants-shard` (a matrix) judges one shard each under both engines and writes a report, and `plants` ("Plants", the
    required check) recomputes the partition and accepts only a complete set of reports, as expected. Chosen over a
    matrix on `plants` itself (it would rename the required check, a ruleset change) and over a verdict job that trusts
    the shard jobs' results as "Mutation testing" does (that every plant was judged would rest on the matrix text). The
    shard size is 8 `visual` (or `axe`) plants, provisional until measured (R-07; contracts/gates.md § The registry;
    contracts/plants.md § Shards). By decision 30, the approved `size` is 3, and the non-visual plants are dealt over
    shards of at most 80 instead of one shard 1.
24. **Each plant's time is printed** ("Measure first"): `note: plant time: <gate>/<case>: <seconds> s` on stderr per
    plant, in every mode, and in each shard report; the summary line is unchanged. The 9-story split count estimated
    from run 43072665056 is not approved; the count and the shard size are derived from the first run with the notes
    and proposed again (R-07; contracts/plants.md § Plant runner changes).
25. **The disk measures now** ("Apply now"): the "Visual regression" job runs the gate with `--remove-docker-image`,
    which removes docker's copy after run 1 and before podman's pull, each engine's pin check now running just before
    that engine's first run so no capture comes from an unchecked image; each Plants shard first removes the runner's
    unused toolsets. Neither the docker-podman comparison nor the pin checks are weakened (R-07; contracts/gates.md §
    `visual`; contracts/container.md § The pin check). Whether the Plants shards keep the toolset removal is open
    again by decision 28: it stays until the operator decides after the disk measurement. **Settled by decision 30**
    (A'): each Plants shard keeps the toolset removal.

Decisions 26 and 27 are the operator's of 2026-11-12 (human:jeroennouwsdev), on the design of decisions 22 to 25.

26. **Decisions 23 and 25 are built as designed** ("Build as designed"): the three-job Plants split with the verdict
    job (`plants-plan`, `plants-shard`, `plants`) and the provisional shard size 8, and the opt-in
    `--remove-docker-image` with the run order docker's pin check, build, run 1, removal, podman's pin check, run 2.
    The design is not changed; the shard size and the split count are still derived by T046h and approved then.
27. **The pin record also reads the tag's index** ("Add the tag read"): the pin record step of decision 22 also runs
    `skopeo inspect --raw docker://<image>:<tag>`, the tag from `container.json`, and saves it in the `pin-record`
    artifact as `skopeo-inspect-raw-index.json`; T046f replaces that fixture too, test-first (R-02;
    contracts/container.md § The pin record).

Decision 28 is the operator's of 2026-11-12, on CI run 43211645709 (head `1b6ddd5`,
reviews/phase-3/ci-run-43211645709.md): Plants shard (7) took 11 min 5 s, over the 10-minute goal, with a 151 s
toolset removal and a 200.6 s first plant that pulls both images; the record's T046h proposal gives options A, A', B
and B'. The question was "Which plant shard setup do you choose?".

28. **Measure disk, then B'** ("Measure disk, then B'"). In this order:
    1. `plants-shard` gains a `df -h /` step before the toolset removal, so each shard prints its free disk before
       the removal, after it (the existing step) and at the end (the existing `if: always()` step). The step is red
       first in `gates/test/ci-workflow.test.ts`, which pins the job's lines, and the plant copies of `ci.yml`
       (`fail-skip-container-in-shard`, `pass-split-plant-jobs`, `fail-shard-in-plant-check`) gain it with
       `ci.yml` (tasks.md T046i, T046j). Shard `size` stays 8 for that run.
    2. A CI run holding that step, recorded in the phase review (T046k).
    3. A stop-and-ask brings the measured free disk to the operator (T046l). The operator then chooses the branch
       and approves its split count; until then no split count is approved and the Complexity Tracking row
       "Plant roots hold every repository story" keeps its current text.
    4. Then one branch:
       - **B'** if the disk allows: `plants-shard` drops the toolset removal (decision 25's toolset part ends), and
         `size` becomes 6: 9 shards with the 12 repository stories, split count 21 stories (record's estimate,
         about 210 s fixed part per shard) (T046m, T046n);
       - **A'** otherwise: the removal stays, and `size` becomes 4: 13 shards, split count 19 stories (about 360 s
         fixed part per shard) (T046o, T046p).

    **No longer holds (decision 29).** The B' and A' figures above (`size` 6, 9 shards, split count 21; `size` 4,
    13 shards, split count 19) were estimated from run 43211645709's 1.47 s per story-theme with 12 repository
    stories. Since the merge of mission 005 the repository holds 21 stories: B''s split count is already reached and
    A''s is passed (at 1.47 s × 44 story-themes per plant root, A' gives about 360 + 4 × 65 ≈ 620 s per shard, B'
    about 210 + 6 × 65 ≈ 600 s). Step 1's "`size` stays 8 for that run" is replaced by decision 29's `size` 4. The
    disk condition below stands; the options, sizes and split counts are re-derived by T046l from the measuring run.

    **The disk condition.** For each shard k of the measuring run:
    - `A_k`, the free disk before the removal (the new first `df -h /`);
    - `B_k`, the free disk after the removal;
    - `E_k`, the free disk at the end of the shard;
    - `U_k = B_k − E_k`, the disk the shard used. The records measure the end of the shard only, not a peak inside
      the gate step. Run 43211645709 gives 35G − 34G = 1G for shard 1 and 35G − 26G = 9G for shards 2 to 7, all at
      `size` 8, which holds more `visual` plants per shard than 6.

    Without the removal, shard k would end with `A_k − U_k` free, since the shard does not use the removed toolsets
    (decision 25). The disk allows B' when, for every shard, `A_k − U_k` is at least the free disk `M` that a shard must
    keep. The records give no value for `M`, and none for the gap between the end-of-shard use and the peak, so
    T046l asks the operator for both. The branch is the operator's answer to T046l; this plan does not choose it
    from the numbers alone.

    **Answered by decision 30.** `M` is 4G and `U_k` stands for the peak. The disk allowed B' (the worst
    `A_k − U_k` is 4G, shard 12), but the operator chose A': step 4's branch is A' at `size` 3, and B' (T046m,
    T046n) does not apply.

Decision 29 is the operator's of 2026-11-12, on the merge `39763c7` of origin/main `476602e` (mission 005, icons and
the Ocelle brand mark) into this branch. Mission 005 adds 9 stories (`icon.stories.ts`, `brand-mark.stories.ts`): the
repository goes from 12 to 21 stories, 24 to 42 story-themes. The 18 new story-themes have no baseline, so
`gate:visual` reports 18 `missing-baseline` findings, and the tests and plants that name the repository's stories
(the `storybook-build`, `storybook-index`, `visual` and plants tests; plants with exact repository lists such as
`fail-token-changed` and `pass-repository`) fail on the 12/24 counts. At 1.47 s per story-theme a `visual` plant now
takes about 62 s, against 38 s before, so decision 28's measuring run at `size` 8 would take about 12 to 14 minutes
per shard. The questions were "How should the 18 new baselines be made?" and "What size should the measuring run
use?".

29. **The 21 stories: baselines made locally, and the measuring run at `size` 4** ("Generate locally"; "Size 4, keep
    removal"). It amends decision 28:
    1. The 18 new baselines are made with `visual:update` under docker in the pinned container, as the first 24 were
       (decision 7: CI's captures stay the record, so CI then confirms the bytes under docker and podman in the
       measuring run). Then, test-first, the tests and plants that name the repository's stories take the merged
       repository's values, written by hand: `fail-token-changed`'s list is measured again for the new story-themes,
       as the phase 1 spike measured the first (contracts/plants.md) (tasks.md T046q, T046r, T046s).
    2. The measuring run of decision 28 uses shard `size` 4 and keeps the toolset removal: about 13 shards (shard 1
       and the 48 `visual` plants in groups of 4). `size` 4 is red first in `plantShards`' test of the repository's
       `size`, then `plant-runner.ts`, and `gates/README.md` names it (T046t, T046u). It is the measuring run's size,
       provisional; it approves no `size` and no split count. The operator pushes for that run (T046v).
    3. That one run gives each shard's `A_k`, `B_k` and `E_k` (decision 28's disk condition, unchanged) and its time
       at 21 stories, with the per-story-theme time and each shard's fixed part (T046k).
    4. From those measurements alone the B' (no toolset removal) and A' (removal kept) options are re-derived: for
       each, the largest `size` that keeps a shard under 10 minutes, its shard count, and its split count, which must
       lie above the 21 stories the repository holds. They go to the operator with decision 28's four questions:
       `M`, whether the end-of-shard use stands for the peak, B' or A', and approval of the split count with its
       Complexity Tracking row (T046l). Until that answer no split count is approved and the row "Plant roots hold
       every repository story" keeps its text. The branch's tasks then use the approved `size` (T046m to T046p).

    **Answered by decision 30.** A' with `size` 3 and split count 25. `size` 3 replaces the measuring run's
    provisional 4.

Decision 30 is the operator's of 2026-11-12 (human:jeroennouwsdev), on CI run 43242674392 (head `72a393b`,
reviews/phase-3/ci-run-43242674392.md, T046k). All 132 jobs passed. The worst `A_k − U_k` was 4G (shard 12). Plants
shard (1) took 12 min 34 s and Plants shard (8) 10 min 29 s. Shard 1 holds the 232 plants of the gates other than
`visual` and `axe` plus the registry's plants. The questions were T046l's four and the record's fifth (shard 1).

30. **A' at `size` 3, split count 25, and shard 1's plants split** ("M = 4G"; "End = peak is fine"; "A' size 3";
    "Split its plants"). It answers T046l and closes the choice that decisions 28 and 29 left open:
    1. **`M` is 4G.** This is the free disk every Plants shard must keep at its end.
    2. **The end-of-shard use stands for the peak.** `U_k = B_k − E_k` is taken as a shard's peak use, and no peak
       measure is added.
    3. **A', `size` 3.** `plants-shard` keeps the toolset removal. `size` is 3, approved and no longer provisional.
       The record's model gives:
       - the worst `visual` shard at 387 + 3 × 60.6 ≈ 568 s at 21 stories;
       - 16 `visual` shards for the 48 `visual` plants.

       B' was allowed under `M` = 4G (the smallest `A_k − U_k` is 4G, shard 12, give or take 1G of rounding). The
       operator chose A' anyway, so B' (T046m, T046n) does not apply.
    4. **Split count 25, approved.** At `size` 3 and r = 1.377 s per story-theme, a `visual` shard takes 594 s at
       24 stories and 602 s at 25. The Complexity Tracking row "Plant roots hold every repository story" now holds
       25. At the record's slowest r (1.457 s) the count would be 26; the approved count is the lower one, 25.
    5. **Shard 1's plants are split** ("Split its plants"). No `size` changes shard 1, since it holds no `visual`
       plant. Its plants are spread over more shards, test-first (tasks.md T046w, T046x). The operator chose the
       split; the rule and the number of shards are this plan's design:
       - **The rule.** The signature becomes `plantShards(plants, size, otherSize)`. Take the plants of the gates
         other than `visual` and `axe`, plus the registry's plants. Sort them by `<gate>/<case>`; there are n of them.
         Deal them in turn over k = max(1, ⌈n / `otherSize`⌉) shards: the plant at index i (from 0) goes to shard
         (i mod k) + 1, and each shard keeps the sorted order. The `visual` shards follow, then the `axe` shards, as
         before. Every plant is in exactly one shard, and shards 1 to k differ in size by at most one plant.
       - **Deterministic.** The partition depends only on the set of plants. It is sorted first, so neither the
         order of `gates.json` nor a directory listing changes it.
       - **The size.** `otherSize` is 80 (`otherShardSize` in `gates/lib/plant-runner.ts`). The 232 plants give
         k = 3 shards of 78, 77 and 77.
       - **Why dealt in turn, not in consecutive groups.** Plants of one gate cost about the same, but gates cost
         very differently. The 8 `storybook-build` plants each build every story, one at a time after the other
         plants. The `mutation` plants run Stryker. Consecutive groups by name would put a whole gate in one shard.
         Dealing in turn puts ⌊g/k⌋ or ⌈g/k⌉ of a gate's g plants in each shard. The record holds no per-plant
         times that would support a balance by time: shard 1's plants run concurrently, so their times overlap.
         This rule needs none.
       - **Why 3 shards.** Shard 1's gate step took 584 s for 232 plants. The estimates below scale that by plant
         count. They add the run's worst non-gate part of a Plants shard: shard 8's 218 s removal plus up to 39 s of
         set-up, checkout, `df` and upload, about 257 s.
         - Three shards (78 plants each): about 584 × 78 / 232 ≈ 196 s per gate step, so about 453 s per job.
         - Two shards (116 plants each): about 292 + 257 ≈ 549 s per job.

         Two shards leave little margin, and they do not account for the `storybook-build` plants growing with the
         stories. Three shards leave room. Each extra shard costs one job with its own set-up and removal, but no
         image pull, since it holds no `visual` plant.
       - **What does not change.** `--plan`, `--shard`, `--verdict` and the report keep their contract
         (contracts/plants.md § Shards). The verdict recomputes the same partition. `ci.yml` and the registry
         plants' copies of it are unchanged, because the matrix follows `--plan`. `gate:plants` without a mode
         still judges every plant in one process.
       - **The shard count.** The repository's plan becomes 3 + ⌈48 / 3⌉ = **19 shards**. The record's 17 counted
         one shard for the non-visual plants.
    6. **The confirming run** (tasks.md T046y, T046z) holds T046o to T046x. It must show:
       - `size` 3 in the tree;
       - the plan printing `[1,2,…,19]`;
       - every Plants shard job under 10 minutes, including shards 1 to 3;
       - the verdict `plants: 280 plants of 16 gates and the registry judged, every plant as expected`;
       - `E_k` ≥ 4G (`M`) at the end of every Plants shard.

       If any of these fails, that is a stop-and-ask.
    7. **"Near 10 minutes" means above 570 s** (operator decision 2026-11-12, "Above 570 s (Recommended)"). The
       stop-and-ask fires when any Plants shard job takes more than 570 s, non-visual shards included. The worst
       `visual` shard's modelled 568 s passes. This defines tasks.md's stop-and-ask "any Plants shard near
       10 minutes".

    What it settles:
    - **Decision 25.** The toolset part is settled: each Plants shard keeps the removal.
    - **Decision 28.** Step 3 is answered, and step 4's branch is A'. The disk condition stays on record as the
      reason B' was allowed. `M` now checks the end-of-shard disk of every A' shard.
    - **Decision 29.** Step 4 is answered: `size` 3 and split count 25 replace the measuring run's provisional
      `size` 4. T046h closes with T046o and T046p.
    - **The split count's scope.** The count of 25 is set by the `visual` shards. The non-visual shards also grow
      with the stories, through the `storybook-build` plants, but the record cannot separate that growth from the
      growth in their number (shard 1 went from 384 s with 198 plants at 12 stories to 584 s with 232 at 21). The
      confirming run records each non-visual shard's time, under the same stop-and-ask rule.

    What it reopens: nothing. Decision 23's partition rule for shard 1 (one shard for every non-visual plant) is
    replaced by item 5. The rule for the `visual` and `axe` groups is unchanged.

Decisions 31 and 32 are the operator's of 2026-11-13, before phase 5's red. Decision 31 answers T071's stop-and-ask:
since the merge of mission 005 (`39763c7`), `gates/README.md` § Required checks on `main` lists fifteen checks, not the
fourteen FR-023 counted from. Decision 32 answers analysis finding D1: 001's "Custom-elements manifest gate absent"
row has the sunset "the first element feature (#7) or #10", and this feature is #10.

31. **Eighteen required checks.** `gates/README.md` § Required checks on `main` lists main's fifteen plus
    "Storybook build", "Visual regression" and "Accessibility": eighteen. FR-023, US4 scenario 4, § Constitution Check
    (Workflow gates), tasks.md T071 and phase 5's Independent Test say eighteen. The operator adds the three checks to
    main's ruleset.
32. **001's manifest sunset moves with the README's manifest row.** T072 also rewrites the sunset of 001's
    "Custom-elements manifest gate absent" row in its Complexity Tracking to "the first element feature (#17 or #7)",
    the wording T071 uses for `gates/README.md`'s manifest row (FR-024, US4 scenario 5). The spec prompt
    ("the custom-elements manifest check stays with the first element feature (#17 or #7)") is the approval. 001's
    plan is edited by T072 in phase 5, not by this decision.

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
│                                                                #   engine probe and not-run, serial Storybook plants,
│                                                                #   plant time notes, --plan, --shard, --verdict and
│                                                                #   plantShards (decisions 23, 24)
├── lib/plant-repo.ts                                            # configuration set with the Storybook workspace,
│                                                                #   storybook/node_modules link, delta `baselines`
│                                                                #   and `exceptions`, `baselinesOf`, `captureAlone` (R-11, R-16)
├── lib/storybook-index.ts, storybook-build.ts, storybook-serve.ts   # index, build parser and CLI check, local server
├── lib/container.ts                                             # engine resolution (CI rule), pin and inspect parsers, run args,
│                                                                #   runSteps and removeCommand (decision 25)
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
├── baselines/*.png                                              # 24 baselines; 42 with mission 005's stories (decision 29)
├── visual/container.json
├── a11y-exceptions.json                                         # the 10 Complexity Tracking entries (phase 4)
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
   - the Vite cache directory in `.storybook/main.ts`, `CACHE_DIR` in the build function's environment and
     `--config.verify-deps-before-run=false` on its pnpm call (the repository's pnpm configuration unchanged;
     operator decision on the phase 1 spike § 4), with the integration test that a plant-root build leaves the
     repository's `storybook/node_modules` and root `node_modules` unchanged (R-09, R-16).
3. **US2 Visual regression** (P2):
   - `ranges.ts`: `gates/visual/` in the mutation scope, red first in `gates/test/mutation-ranges.test.ts`;
   - `png.ts` (normalise, diff image, the one-pixel unit test), `visual-verdict.ts` (verdicts, `updatePlan`),
     `container.ts` (engine resolution with the CI rule, pin and inspect parsers on the recorded and written fixtures,
     the media type read with skopeo under podman and the skopeo check (decision 21), run args for root equal to and
     different from the repository), `capture-plan.ts` (refusal predicate with one test
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
     inspect outputs and skopeo's raw manifest output with `skopeo --version`, the job time, the time per story-theme of `visual` and `axe` plants with the split count derived
     from it, and the runner's free disk after both pulls), the operator pushing the branch; the split count goes into
     Complexity Tracking with the operator's approval;
   - after CI run 43072665056 (decisions 22 to 25, operator decisions 2026-11-11): the pin record step; the gate's
     `--remove-docker-image` with `runSteps` and `removeCommand`, red first in `container.test.ts` and
     `ci-workflow.test.ts`; the plant job's `--plan`, `--shard`, `--verdict`, `plantShards`, the shard report and the
     plant time notes, red first in `plants.test.ts`, `registry.test.ts`, `ci-workflow.test.ts` and the plants
     integration test, with the registry rule `shard-in-plant-check` and its plants; the three plant jobs with the
     toolset removal; then a CI run holding them (T045), the fixtures replaced from its `pin-record` artifact (the
     index fixture among them, decision 27), and the
     split count and shard size derived from its plant times for the operator's approval;
   - after CI run 43211645709 (decision 28, operator decision 2026-11-12, "Measure disk, then B'"): the `df -h /`
     step before the toolset removal in `plants-shard`, red first in `ci-workflow.test.ts`, with the plant copies of
     `ci.yml`; a CI run that measures the free disk; the operator's choice between B' (no toolset removal, `size` 6)
     and A' (the removal kept, `size` 4) on the disk condition of decision 28, with the split count approved then;
     the chosen branch red first in `ci-workflow.test.ts` (B' only) and in `plantShards`' test of the repository's
     `size`, then a CI run of it;
   - after the merge of mission 005 (decision 29, operator decisions 2026-11-12, "Generate locally" and "Size 4, keep
     removal"): the 18 new baselines from `visual:update` under docker; the tests and plants that name the
     repository's stories, red first; `size` 4 for the measuring run, red first in `plantShards`' test; the
     measuring run itself (CI's confirmation of the 42 baselines and the disk and time records at 21 stories); the
     B'/A' options and the split count re-derived from that run for the operator;
   - after CI run 43242674392 (decision 30, operator decisions 2026-11-12: "M = 4G", "End = peak is fine",
     "A' size 3", "Split its plants"):
     - A' at `size` 3, red first in `plantShards`' test of the repository's `size`;
     - the non-visual plants dealt in turn over ⌈n / 80⌉ shards, red first in `plant-runner.test.ts`;
     - `gates/README.md` naming both;
     - a confirming CI run, which must show 19 shards, every Plants shard under 10 minutes, the 280-plant verdict and
       at least 4G free at the end of every shard.
4. **US3 Accessibility** (P3):
   - `axe-rules.ts` (selection on fixture metadata, and the test that derives the 4.14.0 lists from axe-core's own
     metadata), `axe-verdict.ts` (incomplete findings, outside-root, `printSelector`), `story-checks.ts` (empty,
     outside-root), `a11y-exceptions.ts` (per-node entries, plan pairing with ` >>> ` and escaped `|` selectors);
   - the gate, its context from `contextOptions(theme)` with the unit test that its options equal the capture's for
     each theme (R-08), its plants (`fail-hover-near-fold` included) and `storybook/a11y-exceptions.json`;
   - the `axe` CI job;
   - story fixes for any existing finding (FR-029): `tabindex="0"` on the Prose document's wide tables in
     `storybook/stories/render.ts`, red first in `storybook/test/unit/render.test.ts`, which clears
     `scrollable-region-focusable` (spike § 7); the ten `color-contrast-incomplete` entries of Complexity Tracking in
     `storybook/a11y-exceptions.json`, the gate on the repository then exiting 0 with them excepted.
5. **US4 CSP retarget and documentation** (P4):
   - `csp.ts` scope and its plants, and the `csp` job's packages-only build;
   - `prefix.ts` matching declarations across lines, red first with `fail-storybook-html-multiline-monospace` and a
     unit case;
   - the externaliser cut down to `<style>` elements, red first in its unit test (a `<script>` stays inline);
     `csp.test.ts` → `render.test.ts`, red first from the build output: `iframe.html` holds Storybook's inline
     `<script>` elements and `dist/` holds no `inline-<hash>.js` file, which fails against the old build script;
   - `gates.json` scope texts, `gates/README.md` (FR-023, the deferred row for the `@ocelle/elements` run-time CSP test);
   - the exception rows in 001's and 002's plans, and the sunset of 001's manifest row (FR-024, decision 32);
   - `storybook/README.md` with its readme test, red first (FR-025, every item including open shadow roots, surfaces
     inside the host, the font of form controls set in an element's shadow styles, pointer states and their viewport rule, element run-time CSP, CI's captures, and plant
     baselines: the plant mode and the Plants job's artifact, and that `pass-second-render`'s record is CI's captures
     made alone).

Each phase is folded after its approval (`/ocelle-run` step 4.3).

## Complexity Tracking

Closed by this feature:

| Exception | Where | Closed because |
|---|---|---|
| Storybook build, visual regression and axe gates absent | 001 plan | the three gates exist (US1 to US3) |
| 002 exception 1: the Storybook page's CSP header with `font-src 'self'`, `connect-src 'self'` | 002 plan | the Storybook is not a CSP target (operator Q1 (a), FR-020, FR-021) |
| 002 exception 2: the static `csp`/`prefix` scope widened to the Storybook inputs and HTML entries | 002 plan | `csp` no longer reads the Storybook; `prefix`'s Storybook scope is coverage, not an exception to IV (FR-022) |

Opened by this feature, an accepted cost with a sunset (operator decision on PLAN-FRESH-2-007, option (b), 2026-11-10;
scope and sunset updated by the operator's decisions on CI run 43072665056, 2026-11-11, and on CI run 43242674392,
2026-11-12 (decision 30), human:jeroennouwsdev):

| Item | Scope | Rationale | Sunset |
|---|---|---|---|
| Plant roots hold every repository story | the Plants shards: every `storybook-build`, `visual` and `axe` plant builds, captures (twice) or audits all repository stories, so a shard's time grows with its plants × the stories; since the operator's decision of 2026-11-11 ("In phase 3 now", decision 23) the plant job is split into shards; since decision 30 (operator decisions 2026-11-12, "A' size 3", "Split its plants") the `visual` (and `axe`) plants are in shards of at most `size` 3, approved, the non-visual plants and the registry's are dealt in turn over ⌈n / 80⌉ shards (3 at 232 plants), and each shard keeps the toolset removal: 19 shards at 21 stories | plants keep the whole configuration set, so no plant can miss a repository input (research R-16); the growth is measured, not guessed (research R-07): CI run 43072665056 took 37 min 13 s for the single Plants gate with 12 stories; CI run 43242674392 (21 stories, `size` 4) measured 1.377 s per story-theme (median) and a worst fixed part of 387 s per `visual` shard, so a `size` 3 shard takes about 387 + 3 × 1.377 × (2s + 2) s at s stories, about 568 s at 21 (reviews/phase-3/ci-run-43242674392.md) | the change that lowers `size` (with its `plantShards` test) before the repository holds the **split count, 25 stories** (approved by the operator 2026-11-12, decision 30): the number of stories at which one `visual` shard of `size` 3 would pass 10 minutes (594 s at 24 stories, 602 s at 25); the non-visual shards' times are recorded by the confirming run (tasks.md T046z), and one near 10 minutes is a stop-and-ask |

axe exceptions under FR-029, if phase 1's spike finds one that needs a token or base-style change, are added here as
rows, with the operator's approval, before phase 4 records them in `storybook/a11y-exceptions.json`. Each row names
the story, theme, rule and selector in backticks and the sunset (the op that fixes it), and the file's entry names this
plan (`specs/006-storybook-workbench/plan.md`) as its `plan`, since the gate honours an entry only with its row
(FR-029, research R-08).

Opened by this feature, axe exceptions under FR-029 (operator decision on the phase 1 spike § 7, "tabindex +
exceptions", 2026-11-10, human:jeroennouwsdev). The spike found, in `base-styles--prose-document` in both themes,
five serious `color-contrast` incomplete results, reason `elmPartiallyObscured`: the twelfth column of both wide
tables is clipped by base.css's prose table scroll box (`display: block; overflow-x: auto`, 003 surface), so axe
cannot decide its contrast. The story's `scrollable-region-focusable` violation is fixed in the story instead
(`tabindex="0"`, phase 4) and has no row. Each row below is one entry of `storybook/a11y-exceptions.json` (same story,
theme, rule, selector and sunset; `plan` `specs/006-storybook-workbench/plan.md`). Selectors are the spike's (host
Chromium 1243); phase 4 re-measures them after the `tabindex` fix, and any difference goes back to the operator.

| Story | Theme | Rule | Selector | Reason | Approval | Sunset |
|---|---|---|---|---|---|---|
| `base-styles--prose-document` | `light` | `color-contrast-incomplete` | `table:nth-child(12) > thead > tr > th:nth-child(12)` | clipped column of the wide table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-10 | the op that fixes the color-contrast incomplete results of base.css's prose table scroll box (003 surface), to be opened by the operator |
| `base-styles--prose-document` | `light` | `color-contrast-incomplete` | `table:nth-child(12) > tbody > tr:nth-child(1) > td:nth-child(12)` | clipped column of the wide table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-10 | the op that fixes the color-contrast incomplete results of base.css's prose table scroll box (003 surface), to be opened by the operator |
| `base-styles--prose-document` | `light` | `color-contrast-incomplete` | `tr:nth-child(2) > td:nth-child(12)` | clipped column of the wide table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-10 | the op that fixes the color-contrast incomplete results of base.css's prose table scroll box (003 surface), to be opened by the operator |
| `base-styles--prose-document` | `light` | `color-contrast-incomplete` | `table:nth-child(14) > thead > tr > th:nth-child(12)` | clipped column of the linked wide table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-10 | the op that fixes the color-contrast incomplete results of base.css's prose table scroll box (003 surface), to be opened by the operator |
| `base-styles--prose-document` | `light` | `color-contrast-incomplete` | `table:nth-child(14) > tbody > tr > td:nth-child(12)` | clipped column of the linked wide table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-10 | the op that fixes the color-contrast incomplete results of base.css's prose table scroll box (003 surface), to be opened by the operator |
| `base-styles--prose-document` | `dark` | `color-contrast-incomplete` | `table:nth-child(12) > thead > tr > th:nth-child(12)` | clipped column of the wide table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-10 | the op that fixes the color-contrast incomplete results of base.css's prose table scroll box (003 surface), to be opened by the operator |
| `base-styles--prose-document` | `dark` | `color-contrast-incomplete` | `table:nth-child(12) > tbody > tr:nth-child(1) > td:nth-child(12)` | clipped column of the wide table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-10 | the op that fixes the color-contrast incomplete results of base.css's prose table scroll box (003 surface), to be opened by the operator |
| `base-styles--prose-document` | `dark` | `color-contrast-incomplete` | `tr:nth-child(2) > td:nth-child(12)` | clipped column of the wide table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-10 | the op that fixes the color-contrast incomplete results of base.css's prose table scroll box (003 surface), to be opened by the operator |
| `base-styles--prose-document` | `dark` | `color-contrast-incomplete` | `table:nth-child(14) > thead > tr > th:nth-child(12)` | clipped column of the linked wide table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-10 | the op that fixes the color-contrast incomplete results of base.css's prose table scroll box (003 surface), to be opened by the operator |
| `base-styles--prose-document` | `dark` | `color-contrast-incomplete` | `table:nth-child(14) > tbody > tr > td:nth-child(12)` | clipped column of the linked wide table's scroll box (`elmPartiallyObscured`) | operator, 2026-11-10 | the op that fixes the color-contrast incomplete results of base.css's prose table scroll box (003 surface), to be opened by the operator |

The page-level axe rules that are not run (decision 3) are not an exception: FR-016 names them as rules that judge the
Storybook harness document, not a story (spec delta of the plan squad's round 1).
