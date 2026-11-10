# Research: Storybook workbench and visual regression baselines

Feature: `specs/006-storybook-workbench` · Plan: [plan.md](plan.md) · Date: 2026-11-10

Facts marked **measured** were measured in this sandbox on 2026-11-10 by the plan session or by the plan squad's round
1 (reviews/plan/round-1/); the rest are decisions with their reasons. Spec check 2's plan notes (SPEC-2-01 to
SPEC-2-08) are answered where marked. Everything still to be measured is measured by the **one spike of phase 1**
(plan § Phases), recorded in `reviews/phase-1/spike.md`; no later phase has a spike of its own.

## R-01 The pinned container: Microsoft's published Playwright image, by its linux/amd64 digest (SPEC-2-08)

**Decision.** The pinned container is `mcr.microsoft.com/playwright:v1.64.1-noble`, used only by the digest of its
linux/amd64 image manifest, `sha256:ee15712262f017b8157421b212b12099146645f44b1bc5c0514cbbe6a229b1d0`, committed in
`storybook/visual/container.json` with the platform `linux/amd64`, the image name, the tag it was taken from (for
humans only, never used to pull), the Node version and the browser build the capture launches (R-04). No image is
built or published by this repository, so no registry, token or repository setting is needed.

**Measured.**
- The tag resolves to a multi-platform index with two manifests: linux/amd64 `sha256:ee15712…b1d0` and linux/arm64
  `sha256:f609973e…6197`. FR-007 forbids the index; the amd64 manifest digest is pulled directly. The phase 1 spike
  records the index digest itself, which the `error-index-pin` plant uses.
- The amd64 manifest's config digest is `sha256:a0d7b2b49ffa0e99787a00b7ec2af46eca58020082713f002ca9f0f1cfd1a017`.
- `docker pull mcr.microsoft.com/playwright@sha256:ee15712…b1d0` works through this sandbox's proxy.
- Size: the manifest's layers total **0.99 GB compressed** (what a pull transfers), and the unpacked image is
  **3.61 GB** in one engine's store (`docker images`).
- The image holds Node `v26.13.0` (the repository's `.node-version`), `/ms-playwright/chromium-1248` and
  `/ms-playwright/chromium_headless_shell-1248` (the builds Playwright 1.64.1 expects; browser version
  156.0.8078.80), and 50 font files from the Ubuntu packages. It holds no `playwright` npm package; the capture uses
  the repository's own (R-03).

**Alternatives.** A Dockerfile in this repository built on each run: the bytes then depend on the apt mirrors at build
time, so it is not pinned. An image this repository publishes to GHCR: pinned, but it needs a registry, write
permissions and a publish workflow, which are operator settings (SPEC-2-08). Using the tag: not immutable.

## R-02 Container engines here and in CI; what only CI can prove

**Measured.** This sandbox has `dockerd`, `containerd` and `runc` installed but not running. Started as root
(`dockerd &`), the daemon comes up (containerd image store, `docker info` driver-type
`io.containerd.snapshotter.v1`; cgroup v1) and runs containers, `--network none` included. Podman is not installed and
is not in the apt sources. So locally only docker can be used, and only after starting the daemon; every profile that
runs the container must start it first (plan § Environment).

**Decision.** GitHub's `ubuntu-24.04` runners carry both docker (daemon running) and podman (rootless). In CI the gate
itself requires both engines (R-06, "CI requires both engines"); the CI jobs also pass `--engine both`.

**What only CI proves, and when (operator decision on PLAN-TESTABILITY-1-010, option (a)).** These behaviours of this
feature cannot fail in this sandbox, since podman is absent:
- podman's run arguments (`--userns=keep-id`) and its rootless writes into the bind-mounted
  `storybook/.visual/run-<n>/`;
- the parsing of podman's `image inspect` and `manifest inspect` output (R-06), whose unit tests use fixtures until a
  real output is recorded;
- byte equality between a docker capture and a podman capture (FR-026, SC-002).
Phase 3's review therefore holds a **CI run of the branch** in which the "Visual regression" and "Plants" jobs ran
under both engines, with their logs and the podman inspect outputs (which then replace any written fixture). The
operator pushes the branch for it (agents never push); phase 3 is not approved without that run. Landing confirms it
again but is no longer the first evidence.

**Other hosts' CPUs (operator decision on PLAN-FRESH-1-006, option (a)).** FR-026's two captures run on one CPU, and
Chromium's rasteriser (Skia) picks SIMD code paths at run time by CPU feature level, so a contributor's machine
(another x86 generation, or an arm64 host emulating amd64) may produce bytes CI does not. That equality is stated, not
measured. **CI is therefore the producer of record**: on `missing-baseline` and `differs` the "Visual regression" job
uploads run 1's captures in baseline layout (R-11), and the contributor note says to commit those files when a local
run and CI disagree. `pnpm run visual:update` stays the local command for iterating.

## R-03 What runs inside the container, and what is mounted (SPEC-2-05, SPEC-2-06)

**Decision.**
- The **Storybook is built on the host**, by the same build function the `storybook-build` gate uses (R-09), into
  `storybook/dist/` of the root under test. The build output is plain HTML, JavaScript, CSS, fonts and JSON, so it
  does not depend on the host's platform. A failed build makes `visual` and `axe` exit 2 with the cause "the Storybook
  build failed; run pnpm run gate:storybook-build" (breaking plants for both gates).
- The container runs only the **capture script** of the **gate's own repository**, `<repo>/gates/visual/capture.ts`
  (`<repo>` resolved from the gate's `import.meta.url`), never a file of the root under test, which for a plant or a
  fixture tree holds no `gates/` at all. It runs with Node 26's type stripping, which needs no build step, and imports
  only pure-JavaScript code: the repository's `gates/lib/` modules, `playwright` (`playwright-core` carries no native
  binary; the browsers come from the image's `/ms-playwright`) and `pngjs`, all resolved from `<repo>`. So a
  `node_modules` installed on an arm64 host works inside the amd64 container.
- **Mounts**: the gate's repository `<repo>`, read-only, at its own absolute path (its `node_modules` included); the
  root under test `<root>`, read-only, at its own path, when it is not `<repo>`; and one writable directory, the
  capture output under the root (`<root>/storybook/.visual/run-<n>/`). The working directory is `<repo>`. The capture
  reads only `<root>/storybook/dist/` and the request, and writes only the output directory.
- **Users and file ownership (SPEC-2-06)**: under docker the container runs `--user <uid>:<gid>` of the host user,
  so files it writes belong to that user; under podman, rootless, `--userns=keep-id` does the same. "Without root"
  means the contributor runs no command as root; membership of the `docker` group is the usual docker setup and is
  allowed. `HOME` is set to a directory inside the writable mount.

**Measured.** With the repository mounted read-only at its own path, the repository's Playwright 1.64.1 launches the
image's Chromium 1248 (headless shell) under `--network none`; the same page captured twice in one container, in two
containers, and with `--user 1000:1000` and as root gave the same SHA-256 (`db312a98…`), 6010 bytes, every time.

## R-04 Determinism and extent of a capture (FR-006, FR-012, FR-026; SPEC-2-01)

**Decision.** Each capture is made in a new browser context and page (FR-028), with the browser launched headless
without a channel, which runs **`chromium_headless_shell-1248`** (playwright-core 1.64.1's `getExecutableName`
resolves `chromium-headless-shell` for a headless launch without a channel; this is the launch the determinism
measurement of R-03 used). The context has:
- viewport 1280 × 800, device scale factor 1, `colorScheme` light or dark matching the theme, `reducedMotion:
  "reduce"`, `forcedColors: "none"`, locale `en-GB`, timezone `UTC`;
- init scripts installed before navigation: the readiness recorder (below), the closed-shadow-root recorder (R-05)
  and the I/O recorder (R-14);
- the story opened at `iframe.html?id=<id>&viewMode=story&globals=theme:<theme>` (the theme global the preview
  already reads), served by a local HTTP server inside the container on `127.0.0.1`.

**Readiness.** Storybook 10.6.5 emits `STORY_RENDERED` only when a story completes; a story whose render throws
emits `STORY_THREW_EXCEPTION`, an errored load `STORY_ERRORED`, an unknown id `STORY_MISSING`, and the error display
sets the class `sb-show-errordisplay` on `<body>`. The readiness recorder is an init script that subscribes to the
preview's channel as soon as it exists and observes `<body>`'s class, so no event that fires early is missed, and
records the **first** of these five signals. The capture waits for it with a timeout of **15 s per story-theme**; the
signals and the timeout map to statuses in a pure function: `STORY_RENDERED` → go on; the four failure signals →
`render-failed` (message names the signal); no signal within the timeout → `render-timeout`, a finding, never exit 2.
After `STORY_RENDERED`: the pointer state if the story declares one (R-15), then `document.fonts.ready`, then two
animation frames. The phase 1 spike records the signals for a module that throws, a render that throws and a missing
id, and becomes the classifier's fixtures.

**Extent (operator decision on PLAN-FRESH-1-008, option (a)).** The screenshot is the **full page** at the fixed
viewport width: `fullPage: true`, no clip, so its height is the document's scroll height. Content below the fold,
content that overflows the story root (an absolutely positioned tooltip, an outer shadow) and top-layer content (a
`<dialog>` or `popover`) are all inside the capture (FR-012). Screenshot options: `animations: "disabled"` and `caret:
"hide"`; `"hide"` is Playwright's default and is set explicitly, so the options test catches a change of the default.

**Encoding.** The PNG is decoded and re-encoded by `pngjs` with fixed options (RGBA, 8 bits, deflate level 9, filter
type fixed), no ancillary chunk, so no timestamp, gamma or text chunk can enter the file. The baseline file is exactly
these bytes.

**Two captures and the baseline (SPEC-2-01).** Every story-theme is captured in run 1 and run 2. When their bytes
differ, the gate reports one `nondeterministic` finding for that story-theme and does **not** compare it with its
baseline (one finding, not two); otherwise run 1's bytes are compared with the baseline. The baseline command
writes nothing at all when any story-theme is nondeterministic.

**Where the decisions live (PLAN-TESTABILITY-1-001, -003, -014).** The context options, the screenshot options, the
readiness classification and the request classification are pure functions in `gates/lib/capture-plan.ts`, unit-tested
in node: one test per determinism option (viewport, scale, colour scheme, reduced motion, forced colours, locale,
timezone, `fullPage` without clip, `animations`, `caret`), each failing when only that option is dropped. The
animation fix also has a control: an integration test captures the `pass-animation-and-caret` story twice with
`reducedMotion` and `animations` left at Playwright's defaults and asserts the two captures differ, beside the plant
that shows they agree with the options set.

**Plants.** A random value in a story (`Math.random()` in its markup) is nondeterministic (fail); a running CSS
animation and a focused text field are deterministic after the fixes above (pass); a story that changes its markup
on a second render in the same page passes because each capture has a fresh page (pass, FR-028; its reference is
independent of the full run, R-11); a story taller than the viewport fails when only content below y = 800 changes;
a story with an overflowing child and a top-layer popover passes, and fails when only the overflow changes.

## R-05 Fonts and closed shadow roots (FR-027)

**Decision.** After readiness, the capture collects, for every text node in the document's story area (every node
that is not one of Storybook's harness nodes, R-08), open shadow roots included, the platform fonts the DevTools
protocol (`CSS.getPlatformFontsForNode`) reports for it. Every family must be `Schibsted Grotesk` exactly (the face
`@ocelle/tokens` vendors as `SchibstedGrotesk-wght.woff2` and declares as `font-family: "Schibsted Grotesk"`); any
other family, including a per-glyph fallback, gives one `font` finding per story-theme naming the families found, and
no capture of that story-theme is compared or written.

**Faces not loaded (PLAN-CORRECTNESS-1-005).** `document.fonts` holds every face the page declares, and a declared
face no text uses stays `unloaded` after `document.fonts.ready` (measured: Storybook's preview head declares four
Nunito Sans faces that stay `unloaded` on every story). So a face is a `font` finding only when, at capture time, its
status is `loading` or `error`, or it is a face of a family the story's text uses (the families of the computed
`font-family` of the collected text nodes) and its status is not `loaded`. Declared but unused faces are not findings.

**Closed shadow roots (PLAN-A11Y-SECURITY-1-002).** The walk, like axe, cannot enter a closed shadow root. An init
script wraps `Element.prototype.attachShadow` before navigation and records every call with `mode: "closed"` on an
element of the story area. Any such call gives the finding `closed-shadow-root` (naming the host element's tag) in
the visual gate and in the axe gate (R-08), and no capture of that story-theme is compared or written. The contributor
note says elements use open shadow roots (FR-025).

**Where the decisions live (PLAN-TESTABILITY-1-003).** The page only collects plain data (per text node: the families
CDP returned and its computed family; the `FontFace` list with family and status; the recorded `attachShadow` calls).
The decisions are pure functions in `gates/lib/story-checks.ts`, unit-tested in node with: shadow-root text, a
per-glyph fallback family, a family that only starts with `Schibsted` (`Schibsted Grotesk Fallback`), an unused
`unloaded` face (not a finding), a used face still `loading`, a face in `error`, and a closed and an open
`attachShadow` call. The collection code carries `Stryker disable` comments naming its integration test.

**To be measured (phase 1 spike).** Whether any of the 12 existing stories draws a glyph Schibsted Grotesk lacks
(for example an arrow or a dash in a story label). Any such story is fixed in its story file (FR-029 by analogy);
the font rule is not relaxed.

## R-06 The host entry point and its engines (FR-009, FR-018, FR-026)

**Decision.** `gates/bin/visual.ts` (gate) and `gates/bin/baselines.ts` (baseline command) share one host module,
`gates/lib/container.ts`:
- `--engine <docker|podman|both|auto|host>`, default `auto`. `auto` uses docker when `docker info` succeeds, else
  podman, else exits 2 "no container engine (docker or podman) is available"; run 1 and run 2 then use that engine.
  `both` runs run 1 under docker and run 2 under podman and exits 2 naming the one that is missing. Any other engine
  name is looked up on `PATH` as an executable and exits 2 "no container engine: <name> not found" when absent.
  `host` runs the capture script directly on the host without a container: it exists only so the capture's own
  refusal can be proven (below). The host entry point turns any exit 0 of a `host` run into exit 2 "the host engine
  never produces a capture", so `host` cannot produce a capture whatever the host machine holds.
- **CI requires both engines (operator decision on PLAN-TESTABILITY-1-008, option (b)).** When the environment
  variable `CI` or `GITHUB_ACTIONS` is `true`, the entry point resolves `auto` to `both`, and exits 2 "in CI the
  visual gate runs under both docker and podman" for any engine choice that would run every capture under one engine
  (`docker`, `podman`, or another name found on `PATH`). `both` is unchanged; `host` (which never captures) and a name
  not found keep their own causes, so the breaking plants behave the same in CI. The rule is a pure function
  `resolveEngine(choice, env, available)`, unit-tested for every choice with and without each variable. A workflow edit
  that drops `--engine both` or sets `OCELLE_VISUAL_ENGINE=auto` therefore cannot downgrade CI to one engine.
  Integration tests that are not about this rule spawn the gate with `CI` and `GITHUB_ACTIONS` removed from its
  environment.
- **The pin check (PLAN-CORRECTNESS-1-003).** Before starting a run, the entry point checks the committed pin
  (`container.json`, contracts/container.md) and the image the engine holds:
  1. the reference is `<image>@<digest>` with a digest of the form `sha256:<64 hex>`; a tag is exit 2 "not pinned by
     digest";
  2. the pinned reference's media type, read from the registry by the engine (`docker buildx imagetools inspect
     --raw <image>@<digest>`; `podman manifest inspect <image>@<digest>`), is an image manifest; an image index or
     manifest list is exit 2 "the pin names an index, not the linux/amd64 manifest";
  3. the image is pulled and run only by `<image>@<digest>` with `--platform linux/amd64` (the engine verifies the
     content against the digest on pull);
  4. after the pull, the engine's `image inspect` must list `<image>@<digest>` in `RepoDigests` (docker, both image
     stores; podman also reports it as `.Digest`), and report `Os` `linux` and `Architecture` `amd64`; otherwise exit
     2 naming the field. `.Id` is **not** compared: it is the manifest digest on docker's containerd image store and
     the config digest (`sha256:a0d7b2b4…a017`) on docker's classic store and on podman.
  The inspect outputs are parsed by pure functions unit-tested on recorded outputs of docker with the containerd
  store (recorded here), docker with the classic overlay2 store and podman (fixtures written from the engines'
  documented formats until phase 3's CI run records real ones, R-02), each with a matching case, a mismatching
  digest, an arm64 image and an index media type.
- The run arguments (contracts/container.md): `run --rm --platform linux/amd64 --network none --user <uid>:<gid>`
  (docker) or `--userns=keep-id` (podman), the mounts of R-03, `-e OCELLE_VISUAL_PIN=<digest>`, the image by digest,
  and `node <repo>/gates/visual/capture.ts <request.json>`. The argument builder is unit-tested with root equal to the
  repository and root different from it (the plant and fixture case).
- **The capture refuses outside the pinned image** (FR-009, second layer): it exits 2 with "not the pinned
  container: <check>" unless all hold, each check with its own cause text:
  - `platform`: `process.platform` is `linux` ("platform darwin, expected linux");
  - `arch`: `process.arch` is `x64` ("arch arm64, expected x64");
  - `node`: `process.version` is `v` + `.node-version` ("node v22.…, expected v26.13.0");
  - `pin`: `OCELLE_VISUAL_PIN` equals the digest in `container.json` ("pin variable absent" or "pin variable
    differs");
  - `browser`: `/ms-playwright/<browser>` exists for the browser build `container.json` names
    (`chromium_headless_shell-1248`), and the executable Playwright resolves for the headless launch lies in that
    directory ("browser <resolved path>, expected /ms-playwright/chromium_headless_shell-1248").
  The refusal is a pure predicate in `gates/lib/capture-plan.ts` over injected facts (`platform`, `arch`, `version`,
  the environment, a directory-exists function, the resolved executable), with one unit test per check that varies
  only that check and asserts the cause names it (PLAN-TESTABILITY-1-002). The breaking plant `error-host` runs the gate
  with `--engine host` on the runner, where the pin variable and `/ms-playwright` are absent.

**How a plant presents its engine.** `plant.json` gains an optional key `engine`, allowed only for plants of the
`visual` gate, with one of the values `both`, `host` or `missing`; the plant runner substitutes it for `{engine}` in
the gate's plant command (`node gates/bin/visual.ts --root {root} --engine {engine}`), else
`$OCELLE_VISUAL_ENGINE`, else `both`. `missing` becomes the engine name `ocelle-no-such-engine`, so the gate's real
lookup fails. Like `base`, it is an input presented to the gate, not gate configuration; the plant-judge tests cover
the new key.

## R-07 Plants without a container, the registry guard, and the cost (FR-018)

**Decision.**
- `gate:plants` gains `--skip-container`: it runs every plant except the `visual` plants, prints
  `plants: skipped (no container): <plant>` on stderr for each, ends its summary with "partial run: N visual plants not
  run", and exits by the others' result. The registry check fails when any step of the `plants` job of
  `.github/workflows/ci.yml` contains `--skip-container`; the registry plant `fail-skip-container-in-ci` proves it.
- **No engine, without the option (PLAN-TESTABILITY-1-009).** Before the `visual` plants, `plants.ts` probes for an
  engine once, with the same resolution the gate uses for the engine the plants will be given
  (`$OCELLE_VISUAL_ENGINE`, else `both`; `resolveEngine`, R-06). When the probe finds the engines missing, it runs no
  `visual` plant, prints `plants: not run (no container engine): <plant>` on stderr for each, and exits 2 after the
  other plants, whatever their result, so the run is never reported as passed. The plants whose `engine` key is `host`
  or `missing` need no engine and still run. The decision (which plants run, which are not run, the exit) is a pure
  function in `gates/lib/plant-runner.ts` with unit tests; an integration test runs `gate:plants` with `PATH` holding
  neither docker nor podman and asserts exit 2 and one `not run` line per `visual` plant that needs an engine.
- **Plants that build the Storybook run one at a time.** `plants.ts` runs plants concurrently today; the plants of
  `storybook-build`, `visual` and `axe` each run a Storybook build (and the `visual` ones two container runs), so the
  plant runner runs those three gates' plants one after another, after the others (the one-heavy-job rule, and no
  two builds writing at once through the shared `storybook/node_modules` link, R-16).

**CI cost.** Each `visual` plant builds the Storybook (2.2 s measured here for 12 stories) and captures twice. The
`Plants` and `Visual regression` jobs each pull the image under both engines: about **1 GB transferred per pull**, and
**3.6 GB unpacked in each engine's store**, so about 7.2 GB of disk beside the checkout and the pnpm store. Phase 3's
review records the `Plants` job's time and the runner's free disk after both pulls (`df -h /` in a job step). If the
disk runs short, the `Visual regression` job prunes the docker copy (`docker image rm`) after run 1, before the podman
pull, and the `Plants` job first removes the runner's unused preinstalled toolsets; when the job's time nears the
30-minute mark, the `visual` plants are moved to a matrix job, which needs a registry change and so is the operator's.

## R-08 axe: where it runs, on what, with which rules (FR-013 to FR-016; SPEC-2-02, SPEC-2-03, SPEC-2-04)

**Decision.**
- axe runs on the **host** browser (Playwright's default headless Chromium 1248 in CI, `OCELLE_CHROMIUM_PATH`
  locally), not in the container: its results do not need to be byte-stable, and the gate stays runnable without a
  container engine.
- `axe-core` 4.14.0 is pinned exactly as a root devDependency (released 2026-10-05, older than the 7-day release
  age; no dependencies). It is injected with `page.addScriptTag({ path })`; with the Storybook no longer under a CSP
  (FR-020, FR-021) nothing blocks it.
- Each story-theme gets a new context and page (FR-028) in the theme the visual gate uses (`colorScheme` and
  `globals=theme:`), with the same init scripts and readiness as the capture (R-04: `render-failed`,
  `render-timeout`), and the story's pointer state applied before axe runs (R-15).
- **Context (operator decision on PLAN-A11Y-SECURITY-1-003, option (a)).** axe runs on the **whole document**, with an
  `exclude` list of Storybook's own harness nodes (the error display, the "preparing" and "no preview" placeholders,
  `#storybook-docs`; the phase 1 spike records the exact list from Storybook 10.6.5's preview), so any node a story
  adds anywhere is audited. After readiness, every element child of `<body>` that is neither `#storybook-root`, nor a
  harness node, nor a non-rendered element (`script`, `style`, `link`, `template`, `noscript`) is a finding
  `outside-root` (one per element, naming its tag), so a story that renders a surface outside its root (a portal to
  `document.body`) fails even though axe audits it. Top-layer elements inside the root (`<dialog>`, `popover`) are
  inside the root. The decision is a pure function over the collected list of body children. The contributor note
  says elements render every surface inside their own host (FR-025).
- **Rules (FR-016; operator decision on PLAN-CORRECTNESS-1-010, option (a)).** `axe.getRules()` lists every rule; the
  run enables every rule axe enables by default and every rule tagged `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` or
  `wcag22aa`, and disables every rule tagged `experimental`, except the **harness-document rules**, which judge the
  preview document Storybook supplies rather than the story, and are not run: for axe-core 4.14.0 `bypass`,
  `document-title`, `html-has-lang`, `html-lang-valid`, `html-xml-lang-mismatch`, `landmark-one-main`,
  `page-has-heading-one` (rules whose selector is the document element, `html…:not(html *)`) and `region` (all page
  content inside landmarks; a component story is not a page). The other rules whose selector is the document element
  (`css-orientation-lock`, `frame-focusable-content`, `frame-tested`) judge content a story brings and stay. The spec
  names this list in FR-016 (spec delta of this round).
- **Rule tests (PLAN-TESTABILITY-1-012).** The selection is a pure function over rule metadata (`id`, `tags`,
  `enabled`, `selector`), tested on fixture metadata: a default-enabled best-practice rule kept; a rule not enabled by
  default and tagged `wcag22aa` enabled; a rule not enabled by default with none of the listed tags left off; a rule
  tagged both `experimental` and `wcag2a` disabled; a harness-document rule left off. A second test reads axe-core
  4.14.0's own rule metadata from `node_modules/axe-core` (not the module's output) and derives from it, independently,
  the expected enabled list and the list of rules whose selector is the document element; it asserts the module's
  enabled list equals the derived one, and that every document-element rule is either a harness-document rule or in the
  named list of rules that stay, so an axe upgrade that adds a rule of either kind fails the test until it is sorted.
- **Output (SPEC-2-02)**: findings on stdout in the gate format, one per node:
  `<story-id>/<theme>: axe: <rule>: <impact>: <selector>`; the stdout summary is one line on exit 0 and exit 1, as
  every gate. Notes go to **stderr**, one per node, `note: <story-id>/<theme>: <rule-id>: <impact>: <selector>`, so
  the plant judge, which reads findings from stdout only (`gates/lib/plant-judge.ts`), never confuses them.
- **Incomplete results (SPEC-2-03; operator decision on PLAN-A11Y-SECURITY-1-005, option (a)).** axe's `incomplete`
  (needs review) results of impact `serious` or `critical` are **findings**, one per node, with the rule
  `<axe rule id>-incomplete` (for example `color-contrast-incomplete`): ordinary patterns (text over a `::before`
  background, text under a translucent overlay token) give a serious `color-contrast` incomplete, and the `contrast`
  gate checks token pairs only, so rendered compositions would otherwise have no contrast check (constitution III).
  Such a finding is cleared only by an exception (below). Incomplete results of impact `moderate` or `minor` are
  notes, `note: … incomplete …`. Plan gate decision 4 changes accordingly.
- **Exceptions (SPEC-2-04, FR-029; operator decisions on PLAN-A11Y-SECURITY-1-006 and PLAN-CORRECTNESS-1-009,
  option (a) each).** `storybook/a11y-exceptions.json`, committed as `[]`. Each entry is `{ "story", "theme", "rule",
  "selector", "reason", "sunset", "plan" }`, all non-empty strings, `theme` `light` or `dark`, `rule` an axe rule id
  or `<axe rule id>-incomplete`, `selector` the node's selector exactly as the gate prints it, `plan` the
  repository-relative path of the plan whose Complexity Tracking records the exception. An entry matches only the one
  node of that rule with that selector in that story-theme; another node of the same rule stays a finding. The gate
  honours an entry only when the `plan` file exists in the root under test and its `## Complexity Tracking` section
  holds a table row naming the same story, theme, rule and selector (each in backticks) and the entry's sunset;
  otherwise the entry gives the finding `unrecorded-exception` at `storybook/a11y-exceptions.json#<index>` and the node
  stays a finding. An honoured entry turns its node into a note `note: … excepted (<reason>)`; an entry that matches
  no node is a finding `stale-exception` (so an exception ends when its cause does); a malformed file is exit 2. The
  parsing, matching and the Complexity Tracking pairing are pure functions in `gates/lib/a11y-exceptions.ts`
  (unit-tested on plan texts with and without the row, with a row differing in each field, and with the row outside
  the Complexity Tracking section). Plants: an honoured exception and an honoured incomplete exception (pass), a stale
  exception, an unrecorded exception and an excepted story with a second node of the same rule (fail), a malformed
  file (breaking).
- **Empty story (FR-014)**: no element of the story area (`#storybook-root` and its descendants, open shadow roots
  included) other than the root itself has a client rect of non-zero width and height, and no non-whitespace text node
  exists there → finding `empty`, and axe is not run. The page collects the boxes and texts; the decision is a pure
  function in `gates/lib/story-checks.ts` with unit cases for whitespace-only text, a zero-width but tall box, a
  zero-height but wide box, text only inside an open shadow root, and an empty root.
- **Closed shadow roots**: `closed-shadow-root` as in R-05; axe is not run on that story-theme, since it cannot see
  inside.
- **Render failure**: as in R-04's readiness (`render-failed` or `render-timeout`); the gate runs no axe on it.

## R-09 The Storybook build gate (FR-001, FR-002)

**Decision.** `gates/bin/storybook-build.ts` runs the workspace's own build, `pnpm --dir storybook run build`, in the
root under test. Before building, it checks, in this order, each an exit 2 with its cause:
1. `storybook/package.json` exists and has a `build` script ("storybook/package.json has no build script");
2. the Storybook CLI resolves from the Storybook workspace (`storybook/node_modules/storybook/package.json` and
   `storybook/node_modules/.bin/storybook`, PLAN-CORRECTNESS-1-007): "storybook is not installed; run pnpm install".
   Without this check, missing dependencies would surface as the script's shell failing "storybook: not found", which
   names no file and would be parsed as a `build-error` (exit 1), contrary to US1 scenario 5;
3. `pnpm` is found (a spawn error).
The packages need no build first: the Storybook reads `packages/tokens/src/`, `packages/tokens/fonts/` and
`packages/styles/src/base.css` (storybook/scripts/swatches.ts, storybook/stories/render.ts, tokens.stories.ts), never a
package's `dist/` (PLAN-CORRECTNESS-1-011), so none of the three gates' commands builds the packages.

Output is parsed into findings by a pure module, `gates/lib/storybook-build.ts`:
- a Vite/esbuild syntax error or an unresolved import names the file: finding `<file>: storybook-build: build-error:
  <first line of the error>`;
- an indexer error names the file: `<file>: storybook-build: index-error: <message>`;
- a successful build whose `dist/index.json` holds no entry of type `story`: `storybook/dist/index.json:
  storybook-build: empty-index: …`;
- a failed build whose output names no file: one finding at `storybook/package.json` with rule `build-error`.
The exact output forms of Storybook 10.6.5 are captured in the phase 1 spike and become fixtures of the parser's unit
tests. Exit 0 prints `storybook-build: built <n> stories`.

**The breaking plants (operator decision on PLAN-CORRECTNESS-1-007, option (a)).** FR-017's "missing dependencies"
breaking plant stays: `error-missing-dependencies` is a plant whose root has no `storybook/node_modules` link (the
`unlinked` plant key, R-16), and the gate exits 2 "storybook is not installed; run pnpm install". `error-no-build-script`
stays as a second breaking plant for check 1. The earlier plan decision 6 ("no build script" instead of "missing
dependencies") is dropped, and FR-017 needs no change.

## R-10 The CSP retarget (FR-020, FR-021, FR-022), the externaliser and the prefix scan

**Decision.**
- `gates/bin/csp.ts` drops every Storybook input from its scope; its Storybook plants (`fail-storybook-*`,
  `pass-storybook-*`, `error-storybook-unparsable-ts`) are removed, and one pass plant, `pass-storybook-out-of-scope`,
  holds an inline script in `storybook/dist/index.html` and a `style` attribute in a story's markup: the gate passes
  (US4 scenario 1). The `csp` job builds the packages only (`pnpm --filter "./packages/*" -r build`).
- **The externaliser is cut down to `<style>` only (operator decision on PLAN-FRESH-1-009, option (a)).** Storybook's
  preview head holds a vendor stylesheet whose `font-family:` declaration ends in `monospace` over three lines
  (`base-preview-head.html:219-221`). If it stayed inline it would land in `storybook/dist/iframe.html`, which `prefix`
  covers (FR-022), and pass only because prefix matches line by line. So `storybook/scripts/externalise.ts` keeps moving
  each inline `<style>` element of `storybook/dist/*.html` to an external `inline-<hash>.css` file linked in its place,
  and no longer touches `<script>` elements: inline scripts stay in the HTML (nothing needs them out, the Storybook is
  not a CSP target). Its unit test is changed red first: a `<script>` stays inline, a `<style>` is moved. Storybook's
  vendor stylesheet thus stays out of the scanned HTML, as it is today.
- **Prefix matches declarations across lines.** So that the HTML scan has no line-break blind spot, the prefix gate
  matches a `font`/`font-family` declaration up to its terminating `;` or `}` across line breaks, reporting the line
  where the declaration starts. Red first: the prefix plant `fail-storybook-html-multiline-monospace` (a
  `storybook/dist/iframe.html` with an inline `<style>` whose `font-family:` value ends in `monospace` on the next line)
  and a unit case in the prefix tests. The prefix `pass-repository` plant shows the repository still passes.
- `storybook/test/integration/csp.test.ts` becomes `storybook/test/integration/render.test.ts`: no CSP header, no
  violation collector and its control; it keeps preview-only (with its control, `iframe.html` present), the
  no-network preload of the build and no request outside the origin while each story renders, the monospace walk
  with its control, and each token story's token list in both themes. **Its red (PLAN-TESTABILITY-1-005)** is taken
  from the build output under test, not from the test's own server: the render test's build must give a
  `storybook/dist/iframe.html` that holds Storybook's inline `<script>` elements and a `dist/` with no
  `inline-<hash>.js` file, and still no inline `<style>` element. Against the old build script (externaliser moving
  scripts too) this fails. That the test's server sends no CSP header is a statement of the test, not a red claim.
- The mutation gate's Storybook scope is unchanged: `storybook/scripts/externalise.ts` stays in it, with its smaller
  behaviour.

**Elements' run-time CSP (PLAN-A11Y-SECURITY-1-007).** The removed CSP header test was the only place a rendered story
was observed under the strict policy; `packages/elements` has no run-time CSP test yet. So `gates/README.md`'s deferred
table gains a row naming the first element feature (#17 or #7) as the deliverer of the `@ocelle/elements` run-time
strict-CSP browser test (served with the header and a `securitypolicyviolation` collector, as
`packages/tokens/test/browser/serve.ts` does), and the contributor note (FR-025) says each element package proves
run-time strict CSP in its own browser tests, not in the Storybook. The Storybook page is not brought back under a CSP
(operator Q1).

**Alternative.** Removing the externaliser entirely: the vendor monospace stack then sits in a prefix-covered file
(operator chose to keep a cut-down externaliser instead).

## R-11 Baselines: location, names, command, CI artifact (FR-005, FR-008, FR-010, FR-011)

**Decision.** `storybook/baselines/<story-id>.<theme>.png`, for example `storybook/baselines/tokens--colour.dark.png`.
Story ids are Storybook's (`[a-z0-9-]` and `--`), so the name is unambiguous. `pnpm run visual:update` runs
`gates/bin/baselines.ts`: the same two runs as the gate, then it applies an **update plan**: when no story-theme has a
refusing status, it writes every baseline whose bytes changed, removes stray ones, and prints `baselines: wrote <n>
files (<changed> changed, <removed> removed), <bytes> bytes in total`; otherwise it writes nothing and exits 1.

**The update plan (PLAN-TESTABILITY-1-013)** is a pure function `updatePlan(results, baselines)` in
`gates/lib/visual-verdict.ts` returning either `{ write, remove }` or `{ refuse: findings }`, unit-tested for each
refusing status (`render-failed`, `render-timeout`, `closed-shadow-root`, `pointer-target`, `font`, `network`, `io`,
`nondeterministic`), for one refusing story-theme among many good ones (nothing written), for unchanged bytes (not
rewritten) and for stray deletion. `baselines.ts` only applies the plan.

**Local output and the CI artifact.** Differing captures, diff images (differing pixels in magenta, the rest dimmed)
and the captures of nondeterministic story-themes go to `storybook/.visual/` (ignored). In addition, for every
`missing-baseline` and `differs` story-theme, run 1's capture is written to `storybook/.visual/baselines/<story-id>.
<theme>.png`, in baseline layout. The "Visual regression" job uploads `storybook/.visual/` as an artifact on failure
(`actions/upload-artifact`, pinned by SHA); the contributor note says to copy the files of its `baselines/` folder into
`storybook/baselines/` (and delete the stray files the job names) when a local run and CI disagree (R-02, CI is the
producer of record). The 24 baselines are expected around 0.5 to 2 MB in total; phase 3 records the figure.

**One pixel is one finding (SC-006, PLAN-TESTABILITY-1-011).** `png.ts` and `visual-verdict.ts` are unit-tested on two
fixture images that differ in exactly one pixel: one `differs` finding, and a diff image with exactly one marked pixel.
The plant `fail-one-pixel` changes one pixel of one baseline (a valid normalised PNG) and expects exactly one `differs`
finding at that story-theme.

**Freshness has an independent reference (FR-028, PLAN-TESTABILITY-1-007).** The `pass-second-render` story shows a
visibly different state (a coloured block) on any render after the first in a page. Its committed baselines are made
by single-story-theme requests (a capture request holding only that story and one theme), not by a full run. In
addition, an integration test captures that story alone in each theme and asserts byte equality with its captures
from a full request in which it comes after other stories. The axe counterpart is the pass plant `pass-second-render`
of the axe gate, whose story loses a button's label on any render after the first.

## R-12 Test projects and mutation (FR-019)

**Decision.**
- `gates` (node): unit tests of every pure module: index parsing, build output parsing and CLI resolution, comparison,
  verdicts and the update plan, PNG normalisation and the diff image, container argument building, engine resolution
  and the pin and inspect parsers, the capture plan (refusal predicate, context and screenshot options, readiness
  classification, request and I/O classification, pointer parameter), the story checks (empty, fonts, closed shadow
  roots, outside-root), axe rule selection and result mapping, exception parsing, matching and plan pairing, and the
  plant runner's not-run and serial decisions. These kill the mutants of the new source.
- `gates-integration` (node, real processes): the `storybook-build` gate on fixture trees; the `axe` gate on fixture
  Storybooks with the host browser; the `visual` gate and the baseline command against the real container; the
  freshness and animation-control tests (R-04, R-11); the PNG height of a capture of a story taller than the viewport
  equals the document's scroll height; `gate:plants` with no engine on `PATH` (R-07). The container tests need docker:
  in CI the `Unit tests` job's runner has it; locally the daemon is started first. They never skip (constitution
  VIII): with no engine they fail with the gate's exit 2 cause.
- **The capture script is wiring only (PLAN-TESTABILITY-1-001).** Every decision of the capture lives in
  `gates/lib/` (`capture-plan.ts`, `story-checks.ts`, `visual-verdict.ts`, `png.ts`); `gates/visual/capture.ts` only
  launches the browser, collects page data and writes files, and each such line carries the repository's
  `// Stryker disable next-line all: process boundary, covered by …` comment naming its integration test, as in
  `gates/lib/plant-repo.ts`. The page collection code shared by the capture and the axe gate
  (`gates/lib/story-page.ts`) is wiring in the same way.
- **The mutation scope gains `gates/visual/`.** `gates/lib/mutation/ranges.ts` adds `:(glob)gates/visual/**/*.ts` to
  `scopePathspecs` and `visual` to its `source` pattern, red first in `gates/test/mutation-ranges.test.ts`, so a change
  to the capture's wiring is in scope like any gate source (its disabled lines then need their comments).

## R-13 Collisions with the parallel features

`#17` may add stories and change `storybook/.storybook/`. Whichever feature lands second merges `main`, reruns
`pnpm run visual:update` (or takes CI's captures, R-11) and commits the new baselines with a pull request description
that says why. `#20` changes `packages/tokens/src/source.ts` without changing token values, so token baselines are
unaffected.

## R-14 Run-time I/O of a story (constitution I; operator decision on PLAN-A11Y-SECURITY-1-008, option (a))

**Decision.** The capture already routes every request. Beyond `network` (any request outside `127.0.0.1`, aborted and
recorded), the visual gate records **run-time I/O** as the finding `io`, one per story-theme naming each call or URL:
- every same-origin request whose Playwright `resourceType()` is `fetch`, `xhr`, `websocket`, `eventsource` or `ping`,
  other than Storybook's own requests (the allow-list holds `index.json` and `project.json` as the phase 1 spike finds
  them, and nothing else), and every same-origin request for a path that is not a file of `dist`;
- every call, after navigation starts, of `Storage.prototype` `getItem`, `setItem`, `removeItem`, `clear` or `key`,
  `navigator.clipboard.write` or `writeText`, and `navigator.sendBeacon`, recorded by an init script; Storybook's own
  storage use, if the spike finds any, is allowed by its exact key in the same allow-list.
The request classification and the allow-list are pure functions in `gates/lib/capture-plan.ts`, unit-tested (each
resource type, Storybook's own files, a missing path, an allowed and a disallowed storage key). Fail plants: a story
that fetches a same-origin path (`fail-same-origin-fetch`) and a story that writes `localStorage`
(`fail-local-storage`). The baseline command refuses on `io`. The axe gate does not repeat the check: a story with I/O
fails the required "Visual regression" check.

## R-15 Pointer states (operator decision on PLAN-FRESH-1-010, option (a))

**Decision.** `:hover` and `:active` match only real pointer input, so a story can declare one pointer state in its
parameters: `parameters: { ocelle: { pointer: { hover: "<selector>" } } }` or `{ press: "<selector>" }`, the selector
resolved in the story area (open shadow roots pierced, as Playwright's CSS selectors do). After `STORY_RENDERED` the
capture and the axe gate read the parameter from the preview's current story (the access path is recorded by the
phase 1 spike), then `hover` moves the mouse to the centre of the element, and `press` also holds the primary button
down (`mouse.down()` without `up`). Fonts and two animation frames follow, then the capture or axe run. A parameter that
is malformed, names both states or names a selector matching no element or more than one gives the finding
`pointer-target`. The parameter parsing and the target decision are pure functions in `gates/lib/capture-plan.ts`
with unit tests. Plants: `pass-hover-and-press` (two stories, one hovered, one pressed, with their baselines),
`fail-hover-style-changed` (the tree changes only the `:hover` rule: `differs` on both themes, which a capture without
the hover could not show), `fail-pointer-target-missing` (`pointer-target` on both themes), and in the axe gate
`fail-hover-reveals-unlabelled` (an unlabelled button shown only on hover: `button-name` on both themes). The
contributor note documents the parameter (FR-025).

## R-16 Plant roots that hold a Storybook (PLAN-CORRECTNESS-1-001)

**Decision.** Every plant of the three gates builds the Storybook in a repo-tree plant root, which today holds none of
it. `gates/lib/plant-repo.ts` changes, test-first in `gates/test/plant-repo.test.ts` and its integration test:
- `configurationSet` adds `.node-version`, `packages/styles/src/base.css`, `packages/tokens/fonts/` and the Storybook
  workspace: `storybook/package.json`, `storybook/.storybook/`, `storybook/scripts/`, `storybook/stories/`,
  `storybook/baselines/`, `storybook/visual/container.json` and `storybook/a11y-exceptions.json` (never `dist/`,
  `.generated/`, `.visual/` or `node_modules/`). This changes the configuration set of every existing repo-tree plant;
  the existing plants' expectations are rerun in the phase that makes the change, and any that shifts is recorded.
- Besides the root `node_modules`, it links `<root>/storybook/node_modules` to the real path of the repository's
  `storybook/node_modules`, unless the plant's `plant.json` lists it in the new optional key `unlinked` (a list whose
  only allowed value is `"storybook/node_modules"`, valid for plants of `storybook-build`, `visual` and `axe`). Like
  `engine`, `unlinked` presents an input (dependencies not installed), not gate configuration.
- Workspace links inside `storybook/node_modules` (`@ocelle/tokens`) resolve to the repository's packages, not the
  plant's; the stories read the plant's packages through relative paths (as today), so a plant's token change is seen.
- **Caches.** So that builds in different roots never write into the shared `storybook/node_modules`, the Storybook
  configuration sets Vite's `cacheDir` to `storybook/.cache/vite` of the root being built (ignored), and the phase 1
  spike checks that a build writes nothing under `storybook/node_modules` (recorded). With the Storybook plants run one
  at a time (R-07), no two builds run at once.
- A plant's `tree/` story files replace or add to `storybook/stories/`; a plant that needs fewer stories replaces the
  story files it keeps and removes none of the configuration set.
