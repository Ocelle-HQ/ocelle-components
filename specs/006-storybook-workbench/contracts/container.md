# Contract: the pinned container and the capture

Sources: research.md R-01 to R-06, R-14, R-15.

## `storybook/visual/container.json`

```json
{
  "image": "mcr.microsoft.com/playwright",
  "digest": "sha256:ee15712262f017b8157421b212b12099146645f44b1bc5c0514cbbe6a229b1d0",
  "platform": "linux/amd64",
  "tag": "v1.64.1-noble",
  "node": "26.13.0",
  "browser": "chromium_headless_shell-1248"
}
```

- `digest` is the linux/amd64 **image manifest** digest, never an index digest. The entry point pulls and runs only
  `<image>@<digest>` with `--platform linux/amd64`.
- `tag` is for people; it is never used to pull.
- `browser` names the build the capture launches: a headless launch without a channel runs
  `chromium-headless-shell` (research.md R-04), so the directory is `chromium_headless_shell-<revision>`.
- **The pin test** (`gates/test/container-pin.test.ts`): its first assertion is that `container.json` exists (so the
  red, while the file is absent, is an assertion failure, not a read error); then that `node` equals `.node-version`
  and that `browser` equals `chromium_headless_shell-<revision>` with the revision of the `chromium-headless-shell`
  entry of the repository's `playwright-core/browsers.json`. A second case runs the same checks on a fixture copy with
  a wrong `node` and a wrong `browser` and asserts each is reported, so both assertions are shown able to fail. A
  Playwright or Node upgrade fails the test until the pin is moved with it.
- Moving the pin is a baseline change: the same pull request regenerates every baseline and says why.

## The pin check on the host (research.md R-06)

| Step | docker | podman | Exit 2 cause |
|---|---|---|---|
| reference form | `<image>@sha256:<64 hex>` | same | `not pinned by digest` |
| the media type reader is present | `docker buildx` (part of docker; no separate check) | `skopeo` found on `PATH`, checked for every podman engine the run resolved, before any step below runs under any engine | `the pin check under podman needs skopeo: skopeo not found` |
| media type of the reference (from the registry) | `docker buildx imagetools inspect --raw <image>@<digest>` → `mediaType` | `skopeo inspect --raw docker://<image>@<digest>` → `mediaType` | `the pin names an index, not the linux/amd64 manifest` (`application/vnd.oci.image.index.v1+json`, `application/vnd.docker.distribution.manifest.list.v2+json`) |
| pull | `docker pull --platform linux/amd64 <image>@<digest>` | `podman pull --platform linux/amd64 <image>@<digest>` | `the image cannot be obtained: …` |
| identity after the pull | `docker image inspect <image>@<digest>`: `RepoDigests` contains `<image>@<digest>`, `Os` `linux`, `Architecture` `amd64` | `podman image inspect <image>@<digest>`: `RepoDigests` contains `<image>@<digest>` (and `.Digest` equals `<digest>`), `Os` `linux`, `Architecture` `amd64` | `the pulled image does not match the pin: <field>` |

**The media type under podman (operator decision 2026-11-11, on CI run 43064614842).** The pin is a single linux/amd64
image manifest, and podman refuses to read one with `podman manifest inspect` ("Treating single images as manifest
lists is not implemented"), so the check could never pass under podman. Under podman the gate reads the registry's raw
manifest with `skopeo inspect --raw docker://<image>@<digest>` (the `docker://` transport is skopeo's name for a
registry reference) and takes its `mediaType` as on docker; a non-zero exit of skopeo is `the image cannot be obtained:
<last stderr line>`, as a failed read is on docker. This adds skopeo to the host tools wherever the gate runs under
podman: on the CI runner and on a contributor's machine that uses podman. Docker's reader is unchanged: in that run,
under `--engine both`, docker's three steps (media type, pull, identity) passed before podman's media type read
failed, and `docker buildx imagetools inspect --raw` prints the raw manifest of a single image as of an index (the
phase 1 spike recorded it on this pin). `pull` and the identity check under podman still use podman. The skopeo check
is a pure function of the resolved engines and the tools found on `PATH`, unit-tested; it runs once, before the pin
check of the first engine, so `both` without skopeo exits 2 before docker pulls anything.

**When each engine's steps run, and docker's copy (operator decision 2026-11-11, "Apply now"; research.md R-07).** The
reference form and the skopeo check run once before any engine command. The media type, pull and identity steps run
under an engine just before that engine's first run: under `both`, docker's steps, the build and run 1, then podman's
steps and run 2. With the gate's `--remove-docker-image` (CI's "Visual regression" job only), the gate runs
`docker image rm <image>@<digest>` after run 1 and before podman's steps, so the runner never holds both unpacked copies
at once; the option is exit 2 `--remove-docker-image needs both engines (docker for run 1, podman for run 2)` unless
the resolved engines are docker then podman, and a failed removal is the note `note: docker's copy of the pinned image
was not removed: <last stderr line>`. No capture runs from an image whose steps have not passed in that engine's store:
docker's copy is removed only after the last docker run, and podman's run uses podman's own checked pull. The order and
the removal command are pure functions of `gates/lib/container.ts` (`runSteps`, `removeCommand`), unit-tested.

**The pin record (operator decision 2026-11-11, "Add the CI step"; research.md R-02).** After the gate passes, the
"Visual regression" job writes `skopeo --version`, `skopeo inspect --raw docker://<image>@<digest>` and `podman image
inspect <image>@<digest>` to `skopeo-version.txt`, `skopeo-inspect-raw-manifest.json` and `podman-inspect.json`, and
(operator decision 2026-11-12, "Add the tag read") `skopeo inspect --raw docker://<image>:<tag>`, `<image>` and `tag`
from `container.json`, to `skopeo-inspect-raw-index.json`, and uploads them as the artifact `pin-record`. The tag is
only read for this record, never pulled or run. Those bytes replace the fixtures of the same names, the index fixture
included (tasks.md T046f).

`.Id` is never compared: it is the manifest digest on docker's containerd image store and the config digest on
docker's classic store and on podman. The parsers are pure functions, unit-tested on recorded inspect outputs of docker
with the containerd store, docker with the classic overlay2 store and podman (fixtures; podman's real output is recorded
by phase 3's CI run), each with a match, a mismatching digest, an arm64 image and an index media type. The raw
manifests read under podman are skopeo's (`gates/test/fixtures/container/skopeo-inspect-raw-manifest.json` and
`skopeo-inspect-raw-index.json`): until the CI run's `pin-record` records skopeo's real output of both they are copies of the spike's recorded
`docker buildx imagetools inspect --raw` outputs of the pin and of the tag's index, since a raw manifest is the
registry's bytes whichever tool fetches it. `podman-manifest-inspect.json` is removed with the command it stood for.

## Engine resolution (research.md R-06)

`resolveEngine(choice, env, available)`: `auto` → docker if available, else podman, else exit 2; `both` → docker for
run 1, podman for run 2, exit 2 naming a missing one; a name → looked up on `PATH`; `host` → the capture on the host,
and an exit 0 of it becomes exit 2 `the host engine never produces a capture`. When `CI` or `GITHUB_ACTIONS` is `true`:
`auto` → `both`, and `docker`, `podman` or another name found on `PATH` → exit 2 `in CI the visual gate runs under both
docker and podman`; `both`, `host` and a name not found are unchanged.

## Run arguments (built by `gates/lib/container.ts`, unit-tested)

`<repo>` is the gate's own repository (the directory holding the running `gates/`), `<root>` the root under test.

```text
<engine> run --rm --platform linux/amd64 --network none
  docker:  --user <uid>:<gid>
  podman:  --userns=keep-id
  -v <repo>:<repo>:ro
  -v <root>:<root>:ro                                   (only when <root> is not <repo>)
  -v <root>/storybook/.visual/run-<n>:<root>/storybook/.visual/run-<n>
  -e HOME=<root>/storybook/.visual/run-<n>/home
  -e OCELLE_VISUAL_PIN=<digest>
  -w <repo>
  <image>@<digest>
  node <repo>/gates/visual/capture.ts <root>/storybook/.visual/run-<n>/request.json
```

The argument builder's unit tests cover root equal to the repository and root different from it.

## Capture request and result

`request.json` (written by the host):

```json
{ "dist": "<root>/storybook/dist", "out": "<root>/storybook/.visual/run-1",
  "stories": ["tokens--colour", "…"], "themes": ["light", "dark"] }
```

`result.json` (written by the capture), one entry per story-theme, in request order:

```json
[{ "story": "tokens--colour", "theme": "dark", "status": "captured", "file": "tokens--colour.dark.png" },
 { "story": "x--y", "theme": "light", "status": "render-failed", "message": "STORY_THREW_EXCEPTION: …" },
 { "story": "x--t", "theme": "light", "status": "render-timeout", "message": "no render signal within 15 s" },
 { "story": "x--s", "theme": "light", "status": "closed-shadow-root", "hosts": ["ocelle-x"] },
 { "story": "x--p", "theme": "light", "status": "pointer-target", "message": "hover: no element matches .trigger" },
 { "story": "x--q", "theme": "light", "status": "pointer-target", "message": "hover: target outside the viewport: .menu-item" },
 { "story": "x--z", "theme": "light", "status": "font", "families": ["DejaVu Sans"] },
 { "story": "x--w", "theme": "light", "status": "network", "urls": ["https://example.com/a.png"] },
 { "story": "x--v", "theme": "light", "status": "io", "calls": ["fetch /api/items", "localStorage.setItem", "localStorage set k", "cookie set", "indexedDB.open d"] }]
```

Each entry has exactly one `status`. When a story-theme meets several conditions (a face whose source is a path not in
`dist` is both `io` and `font`; a face from another origin both `network` and `font`), the capture records them all
and writes the first in the order of data-model.md § Verdict per story-theme, steps 1 to 7: `render-failed`,
`render-timeout`, `closed-shadow-root`, `pointer-target`, `font`, `network`, `io` (`captureStatus` in
`gates/lib/capture-plan.ts`, research.md R-05). The entry's details (`families`, `urls`, `calls`, `message`) are the
chosen status's.

`request.json` may hold one story and one theme only (a single-story-theme request, made by `visual:update -- --plant
… --story <id>`, research.md R-11); the capture treats it as any other request.

The capture exits 0 when it wrote `result.json` (whatever the statuses), 2 with one stderr line when it cannot run:
`not the pinned container: <check>: <detail>`, browser launch failure, unreadable request. The host maps statuses
to findings (contracts/gates.md) in a pure function.

## The capture's checks before any page (FR-009, second layer)

Each must hold, else exit 2 with its own cause (research.md R-06): `platform` (`process.platform === "linux"`),
`arch` (`process.arch === "x64"`), `node` (`process.version === "v" + node`), `pin` (`OCELLE_VISUAL_PIN === digest`),
`browser` (`/ms-playwright/<browser>` exists and holds the executable Playwright resolves for the headless launch). A
pure predicate over injected facts, one unit test per check.

## Per story-theme (FR-006, FR-012, FR-026 to FR-028, FR-030, FR-031)

New context with `contextOptions(theme)` of `gates/lib/capture-plan.ts` (viewport 1280 × 800, scale 1, `colorScheme`
= theme, `reducedMotion: "reduce"`, `forcedColors: "none"`, locale `en-GB`, timezone `UTC`; the axe gate opens its
context with the same function, research.md R-08) → init scripts (readiness recorder, closed `attachShadow` recorder,
and the I/O recorder: `Storage.prototype` methods, `localStorage` and `sessionStorage` returned as recording `Proxy`
objects for named-property gets, sets and deletes, the `document.cookie` accessor, `indexedDB.open` and
`deleteDatabase`, `caches` calls, clipboard writes including `execCommand("copy"|"cut")`, and `sendBeacon`, research.md
R-14) → route every request: `127.0.0.1` served from `dist` (same-origin fetch, xhr, websocket,
eventsource and ping other than Storybook's own files, and paths not in `dist`, recorded as `io`), anything else aborted
and recorded as `network` → open `iframe.html?id=<story>&viewMode=story&globals=theme:<theme>` → wait for the first
render signal (`STORY_RENDERED`, `STORY_THREW_EXCEPTION`, `STORY_ERRORED`, `STORY_MISSING`, `body.sb-show-errordisplay`)
up to 15 s: failure signal → `render-failed`, none → `render-timeout` → scroll check: `scrollX` and `scrollY` read,
`window.scrollTo(0, 0)` when either is not 0 (research.md R-04) → the story's pointer state, if declared, by
`page.mouse` only (`pointer-target` when its parameter is malformed, its selector matches no element or several, or
its target's box is not wholly inside `contextOptions(theme).viewport`, 1280 × 800: `target outside the viewport`,
research.md R-15) → `document.fonts.ready`, two frames → closed shadow root check → font check (research.md R-05):
every non-whitespace text node of the story area found by CDP `DOM.getDocument({ depth: -1, pierce: true })`, open
and user-agent shadow roots included, so form-control text (an input's value and placeholder, a button-type input's
label) is checked, each user-agent shadow text node attributed to its host control and given the host's computed
family, and its platform fonts read by `CSS.getPlatformFontsForNode` → storage left behind: `context.storageState({
indexedDB: true })` and the page's `sessionStorage` keys, any cookie, storage key or IndexedDB database not on
Storybook's allow-list recorded as `io` (research.md R-14) → scroll check again →
full-page screenshot (`fullPage: true`, no clip), `animations: "disabled"`, `caret: "hide"`
→ decode and re-encode with `pngjs` (fixed options, no ancillary chunks) → write `<story>.<theme>.png` → close the
context. A story-theme with any status other than `captured` writes no PNG. Every capture is therefore taken at
scroll position (0, 0) (FR-006).
