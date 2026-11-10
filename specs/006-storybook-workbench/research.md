# Research: Storybook workbench and visual regression baselines

Feature: `specs/006-storybook-workbench` · Plan: [plan.md](plan.md) · Date: 2026-11-10

Facts marked **measured** were measured in this sandbox on 2026-11-10 by the plan session; the rest are decisions with
their reasons. Spec check 2's plan notes (SPEC-2-01 to SPEC-2-08) are answered where marked.

## R-01 The pinned container: Microsoft's published Playwright image, by its linux/amd64 digest (SPEC-2-08)

**Decision.** The pinned container is `mcr.microsoft.com/playwright:v1.64.1-noble`, used only by the digest of its
linux/amd64 image manifest, `sha256:ee15712262f017b8157421b212b12099146645f44b1bc5c0514cbbe6a229b1d0`, committed in
`storybook/visual/container.json` with the platform `linux/amd64`, the image name, the tag it was taken from (for
humans only, never used to pull), the Node version and the browser build it holds. No image is built or published by
this repository, so no registry, token or repository setting is needed.

**Measured.**
- The tag resolves to a multi-platform index with two manifests: linux/amd64 `sha256:ee15712…b1d0` and linux/arm64
  `sha256:f609973e…6197`. FR-007 forbids the index; the amd64 manifest digest is pulled directly.
- `docker pull mcr.microsoft.com/playwright@sha256:ee15712…b1d0` works through this sandbox's proxy.
- The image holds Node `v26.13.0` (the repository's `.node-version`), `/ms-playwright/chromium-1248` and
  `chromium_headless_shell-1248` (the build Playwright 1.64.1 expects; browser version 156.0.8078.80), and 50 font
  files from the Ubuntu packages. It holds no `playwright` npm package; the capture uses the repository's own
  (R-03).

**Alternatives.** A Dockerfile in this repository built on each run: the bytes then depend on the apt mirrors at build
time, so it is not pinned. An image this repository publishes to GHCR: pinned, but it needs a registry, write
permissions and a publish workflow, which are operator settings (SPEC-2-08). Using the tag: not immutable.

## R-02 Container engines here and in CI

**Measured.** This sandbox has `dockerd`, `containerd` and `runc` installed but not running. Started as root
(`dockerd &`), the daemon comes up (overlayfs, cgroup v1) and runs containers, `--network none` included. Podman is
not installed and is not in the apt sources. So locally only docker can be used, and only after starting the
daemon; every profile that runs the container must start it first (plan § Environment).

**Decision.** GitHub's `ubuntu-24.04` runners carry both docker (daemon running) and podman (rootless). The CI jobs
that run the visual gate pass `--engine both` (R-06); the first job run on a pull request confirms both are present
(the gate exits 2 naming a missing one, FR-026), and phase 3's review records that run. Emulated arm64 hosts are not
available here or in CI; their equality rests on the platform being forced (FR-007) and is stated, not measured.

## R-03 What runs inside the container, and what is mounted (SPEC-2-05, SPEC-2-06)

**Decision.**
- The **Storybook is built on the host**, by the same build function the `storybook-build` gate uses (R-09), into
  `storybook/dist/` of the root under test. The build output is plain HTML, JavaScript, CSS, fonts and JSON, so it
  does not depend on the host's platform. A failed build makes `visual` and `axe` exit 2 with the cause "the Storybook
  build failed; run pnpm run gate:storybook-build" (breaking plants for both gates).
- The container runs only the **capture script**, `gates/visual/capture.ts`, with Node 26's type stripping, which
  needs no build step. It imports only pure-JavaScript packages from the repository's `node_modules`: `playwright`
  (`playwright-core` carries no native binary; the browsers come from the image's `/ms-playwright`) and `pngjs`.
  So a `node_modules` installed on an arm64 host works inside the amd64 container.
- **Mounts**: the root under test, read-only, at the same absolute path, plus the real path of its `node_modules`
  (a plant's `node_modules` is a symlink to the repository's, `gates/lib/plant-repo.ts`), read-only; and one
  writable directory, the capture output under the root (`storybook/.visual/run-<n>/`). The capture writes nothing
  else.
- **Users and file ownership (SPEC-2-06)**: under docker the container runs `--user <uid>:<gid>` of the host user,
  so files it writes belong to that user; under podman, rootless, `--userns=keep-id` does the same. "Without root"
  means the contributor runs no command as root; membership of the `docker` group is the usual docker setup and is
  allowed. `HOME` is set to a directory inside the writable mount.

**Measured.** With the repository mounted read-only at its own path, the repository's Playwright 1.64.1 launches the
image's Chromium 1248 under `--network none`; the same page captured twice in one container, in two containers, and
with `--user 1000:1000` and as root gave the same SHA-256 (`db312a98…`), 6010 bytes, every time.

## R-04 Determinism of a capture (FR-006, FR-026; SPEC-2-01)

**Decision.** Each capture is made in a new browser context (FR-028) with:
- viewport 1280 × 800, device scale factor 1, `colorScheme` light or dark matching the theme, `reducedMotion:
  "reduce"`, `forcedColors: "none"`, locale `en-GB`, timezone `UTC`;
- the story opened at `iframe.html?id=<id>&viewMode=story&globals=theme:<theme>` (the theme global the preview
  already reads), served by a local HTTP server inside the container on `127.0.0.1`;
- readiness: Storybook's `storyRendered` signal (the `STORY_RENDERED` channel event), then `document.fonts.ready`,
  then two animation frames;
- the screenshot of the story root `#storybook-root` clipped to its full bounding box (`fullPage` capture with a
  clip, so content below the fold is included, FR-012), with `animations: "disabled"` and `caret: "hide"`;
- the PNG decoded and re-encoded by `pngjs` with fixed options (RGBA, 8 bits, deflate level 9, filter type fixed),
  no ancillary chunk, so no timestamp, gamma or text chunk can enter the file. The baseline file is exactly these
  bytes.

**Two captures and the baseline (SPEC-2-01).** Every story-theme is captured in run 1 and run 2. When their bytes
differ, the gate reports one `nondeterministic` finding for that story-theme and does **not** compare it with its
baseline (one finding, not two); otherwise run 1's bytes are compared with the baseline. The baseline command
writes nothing at all when any story-theme is nondeterministic.

**Plants.** A random value in a story (`Math.random()` in its markup) is nondeterministic (fail); a running CSS
animation and a focused text field are deterministic after the fixes above (pass); a story that changes its markup
on a second render in the same page passes because each capture has a fresh page (pass, FR-028).

## R-05 Fonts (FR-027)

**Decision.** After readiness, the capture walks every text node below the story root, open shadow roots included,
and asks the DevTools protocol (`CSS.getPlatformFontsForNode`) which platform fonts drew it. Every family must be
`Schibsted Grotesk` (the face `@ocelle/tokens` vendors as `SchibstedGrotesk-wght.woff2` and declares as
`font-family: "Schibsted Grotesk"`); any other family, including a per-glyph fallback, gives one `font` finding per
story-theme naming the families found, and no capture of that story-theme is compared or written. A face listed in
`document.fonts` for the page whose `status` is not `loaded` when the capture is taken gives the same finding.

**To be measured (phase 3 spike).** Whether any of the 12 existing stories draws a glyph Schibsted Grotesk lacks
(for example an arrow or a dash in a story label). Any such story is fixed in its story file (FR-029 by analogy);
the font rule is not relaxed.

## R-06 The host entry point and its engines (FR-009, FR-018, FR-026)

**Decision.** `gates/bin/visual.ts` (gate) and `gates/bin/baselines.ts` (baseline command) share one host module,
`gates/lib/container.ts`:
- `--engine <docker|podman|both|auto|host>`, default `auto`. `auto` uses docker when `docker info` succeeds, else
  podman, else exits 2 "no container engine (docker or podman) is available"; run 1 and run 2 then use that engine.
  `both` runs run 1 under docker and run 2 under podman and exits 2 naming the one that is missing; CI's "Visual
  regression" and "Plants" jobs pass `both`. Any other engine name is looked up on `PATH` as an executable and exits
  2 "no container engine: <name> not found" when absent. `host` runs the capture script directly on the host
  without a container: it exists only so the capture's own refusal can be proven (below), and can never produce a
  capture.
- Before starting a run, the entry point checks the committed pin (`container.json`): an image reference that is a
  tag or an index, a platform other than `linux/amd64`, or a digest the local engine reports differently after the
  pull (`docker image inspect --format {{.Id}}`/`podman image inspect`) exits 2 naming the cause.
- The run arguments: `run --rm --platform linux/amd64 --network none --user <uid>:<gid>` (docker) or
  `--userns=keep-id` (podman), the mounts of R-03, `-e OCELLE_VISUAL_PIN=<digest>`, the image by digest, and
  `node gates/visual/capture.ts <request.json>`.
- **The capture refuses outside the pinned image** (FR-009, second layer): it exits 2 with "not the pinned
  container" unless all hold: `process.platform` is `linux` and `process.arch` is `x64`, Node is `.node-version`,
  `OCELLE_VISUAL_PIN` equals the digest in `container.json`, and `/ms-playwright/chromium-<build>` exists for the
  browser build `container.json` names and is the one Playwright resolves. The breaking plant runs the gate with
  `--engine host` on the runner, where `/ms-playwright` and the pin variable are absent.

**How a plant presents its engine.** `plant.json` gains an optional key `engine`, allowed only for plants of the
`visual` gate, with one of the values `both`, `host` or `missing`; the plant runner substitutes it for `{engine}` in
the gate's plant command (`node gates/bin/visual.ts --root {root} --engine {engine}`), with `both` when the key is
absent. `missing` becomes the engine name `ocelle-no-such-engine`, so the gate's real lookup fails. Like `base`, it is
an input presented to the gate, not gate configuration; the plant-judge tests cover the new key.

## R-07 Plants without a container, and the registry guard (FR-018)

**Decision.** `gate:plants` gains `--skip-container`: it runs every plant except the `visual` plants, prints
`plants: skipped (no container): <plant>` on stderr for each, ends its summary with "partial run: N visual plants not
run", and exits by the others' result. Without the option and with no engine, the `visual` plants are run and exit 2
for "no container engine", which the plant job reports as plants not run, naming each, and exits 2. The registry
check fails when any step of the `plants` job of `.github/workflows/ci.yml` contains `--skip-container`; a registry
plant proves it.

**CI cost.** Each `visual` plant builds the Storybook (2.2 s measured here for 12 stories) and captures twice. The
`Plants` job also pulls the image under both engines (about 2 GB each). The phase 3 review records the job's time;
when it nears the 30-minute mark, the plant job's `visual` plants are moved to a matrix job, which needs a registry
change and so is the operator's.

## R-08 axe: where it runs, on what, with which rules (FR-013 to FR-016; SPEC-2-02, SPEC-2-03, SPEC-2-04)

**Decision.**
- axe runs on the **host** browser (Playwright's Chromium 1248 in CI, `OCELLE_CHROMIUM_PATH` locally), not in the
  container: its results do not need to be byte-stable, and the gate stays runnable without a container engine.
- `axe-core` 4.14.0 is pinned exactly as a root devDependency (released 2026-10-05, older than the 7-day release
  age; no dependencies). It is injected with `page.addScriptTag({ path })`; with the Storybook no longer under a CSP
  (FR-020, FR-021) nothing blocks it.
- **Context**: the story root `#storybook-root`. The gate judges stories, not Storybook's preview page, so the
  page-level rules (`document-title`, `html-has-lang`, `landmark-one-main`, `region`, `page-has-heading-one`) about
  the harness document are out of its context. Each story-theme gets a new context and page (FR-028) in the theme
  the visual gate uses (`colorScheme` and `globals=theme:`).
- **Rules (FR-016)**: `axe.getRules()` lists every rule; the run enables every rule axe enables by default and every
  rule tagged `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` or `wcag22aa`, and disables every rule tagged
  `experimental`. A unit test pins the resulting rule id list for 4.14.0, so an axe upgrade shows its rule changes in
  review.
- **Output (SPEC-2-02)**: findings on stdout in the gate format, one per node:
  `<story-id>/<theme>: axe: <rule-id>: <impact>: <selector>`; the stdout summary is one line on exit 0 and exit 1, as
  every gate. Notes go to **stderr**, one per node, `note: <story-id>/<theme>: <rule-id>: <impact>: <selector>`, so
  the plant judge, which reads findings from stdout only (`gates/lib/plant-judge.ts`), never confuses them.
- **Incomplete results (SPEC-2-03)**: axe's `incomplete` (needs review) results of any impact are notes,
  `note: … incomplete …`, and do not fail the gate; the summary counts them. Constitution III speaks of findings;
  an `incomplete` result is axe saying it could not decide. A plant shows a serious `incomplete` result (text over a
  background image, `color-contrast`) is a note and passes. Plan gate decision 4.
- **Exceptions (SPEC-2-04, FR-029)**: `storybook/a11y-exceptions.json`, committed as `[]`. Each entry is
  `{ "story", "theme", "rule", "reason", "sunset" }`, all non-empty strings, `theme` `light` or `dark`. The gate
  turns a matching serious or critical node into a note `note: … excepted (<reason>)`; an entry that matches no
  violation is a finding `stale-exception` (so an exception ends when its cause does); a malformed file is exit 2.
  Each entry must have its row in this plan's Complexity Tracking with the operator's approval; the phase review
  checks that pairing, since no gate reads the plan. Plants: an honoured exception (pass), a stale exception (fail),
  a malformed file (breaking).
- **Empty story (FR-014)**: evaluated in the page before axe runs: no descendant element of the root with a client
  rect of non-zero width and height and no non-whitespace text node → finding `empty`.
- **Render failure**: Storybook marks a failed story by the class `sb-show-errordisplay` on `<body>` (module that
  throws, render that throws); the gate reports `render-failed` and runs no axe on it. Phase 4's spike confirms the
  class for both kinds of failure in Storybook 10.6.5.

## R-09 The Storybook build gate (FR-001, FR-002)

**Decision.** `gates/bin/storybook-build.ts` runs the workspace's own build, `pnpm --dir storybook run build`, in the
root under test, after checking that `storybook/package.json` has a `build` script (exit 2 otherwise). The packages
the Storybook reads (`@ocelle/tokens`, `@ocelle/styles`) are built by the job beforehand
(`pnpm --filter "./packages/*" -r build`), as the `csp` job does today. Output is parsed into findings by a pure
module, `gates/lib/storybook-build.ts`:
- a Vite/esbuild syntax error or an unresolved import names the file: finding `<file>: storybook-build: build-error:
  <first line of the error>`;
- an indexer error names the file: `<file>: storybook-build: index-error: <message>`;
- a successful build whose `dist/index.json` holds no entry of type `story`: `storybook/dist/index.json:
  storybook-build: empty-index: …`;
- a failed build whose output names no file: one finding at `storybook/package.json` with rule `build-error`.
The exact output forms of Storybook 10.6.5 are captured in phase 2's spike and become fixtures of the parser's unit
tests. Exit 0 prints `storybook-build: built <n> stories`.

**Spec delta for the squad.** FR-017 names "missing dependencies" as the breaking plant. A plant cannot present
missing dependencies: its `node_modules` is a symlink to the repository's (`plant-repo.ts`). The plan proposes the
breaking plant "a Storybook workspace without a build script" (cause "storybook/package.json has no build script"),
which is the gate's real "could not run" path; the missing-tool path (`pnpm` or `storybook` not found) is covered by
a unit test of the spawn error mapping. The spec's FR-017 wording is the squad's to align.

## R-10 The CSP retarget (FR-020, FR-021, FR-022) and the externaliser

**Decision.**
- `gates/bin/csp.ts` drops every Storybook input from its scope; its Storybook plants (`fail-storybook-*`,
  `pass-storybook-*`, `error-storybook-unparsable-ts`) are removed, and one pass plant, `pass-storybook-out-of-scope`,
  holds an inline script in `storybook/dist/index.html` and a `style` attribute in a story's markup: the gate passes
  (US4 scenario 1). The `csp` job builds the packages only (`pnpm --filter "./packages/*" -r build`).
- `storybook/scripts/externalise.ts` and its unit test are removed, and the build script loses its last step: it
  existed only to move inline scripts and styles out of the HTML for the CSP. The `prefix` gate still reads
  `storybook/dist/*.html` (FR-022), inline content included.
- `storybook/test/integration/csp.test.ts` becomes `storybook/test/integration/render.test.ts`: no CSP header, no
  violation collector and its control; it keeps preview-only (with its control, `iframe.html` present), the
  no-network preload of the build and no request outside the origin while each story renders, the monospace walk
  with its control, and each token story's token list in both themes.
- The mutation gate's Storybook scope loses `storybook/scripts/externalise.ts` only because the file is gone.

**Alternative.** Keeping the externaliser: harmless but dead weight, and its tests and mutants would keep a CSP
purpose the operator removed.

## R-11 Baselines: location, names, command (FR-008, FR-010, FR-011)

**Decision.** `storybook/baselines/<story-id>.<theme>.png`, for example `storybook/baselines/tokens--colour.dark.png`.
Story ids are Storybook's (`[a-z0-9-]` and `--`), so the name is unambiguous. `pnpm run visual:update` runs
`gates/bin/baselines.ts`: the same two runs as the gate, then, when both agree and no font finding exists, it writes
every baseline, removes stray ones, and prints `baselines: wrote <n> files, <bytes> bytes in total`. Differing
captures and the diff images go to `storybook/.visual/` (ignored), uploaded by the "Visual regression" job as an
artifact on failure (`actions/upload-artifact`, pinned by SHA). The 24 baselines are expected around 0.5 to 2 MB in
total; phase 3 records the figure.

## R-12 Test projects and mutation

**Decision.**
- `gates` (node): unit tests of every pure module (index parsing, build output parsing, comparison and finding
  lists, container argument building and pin checks, axe result mapping, exception file parsing, the rule list).
  These kill the mutants of the new source.
- `gates-integration` (node, real processes): the `storybook-build` gate on fixture trees; the `axe` gate on fixture
  Storybooks with the host browser; the `visual` gate and the baseline command against the real container. The
  container tests need docker: in CI the `Unit tests` job's runner has it; locally the daemon is started first.
  They never skip (constitution VIII): with no engine they fail with the gate's exit 2 cause.
- Process boundaries (spawning the engine, the capture inside the container) carry the repository's
  `// Stryker disable next-line all: process boundary, covered by …` comments naming the integration test, as in
  `gates/lib/plant-repo.ts`.

## R-13 Collisions with the parallel features

`#17` may add stories and change `storybook/.storybook/`. Whichever feature lands second merges `main`, reruns
`pnpm run visual:update` and commits the new baselines with a pull request description that says why. `#20` changes
`packages/tokens/src/source.ts` without changing token values, so token baselines are unaffected.
