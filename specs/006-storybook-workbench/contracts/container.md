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
| media type of the reference (from the registry) | `docker buildx imagetools inspect --raw <image>@<digest>` → `mediaType` | `podman manifest inspect <image>@<digest>` → `mediaType` | `the pin names an index, not the linux/amd64 manifest` (`application/vnd.oci.image.index.v1+json`, `application/vnd.docker.distribution.manifest.list.v2+json`) |
| pull | `docker pull --platform linux/amd64 <image>@<digest>` | `podman pull --platform linux/amd64 <image>@<digest>` | `the image cannot be obtained: …` |
| identity after the pull | `docker image inspect <image>@<digest>`: `RepoDigests` contains `<image>@<digest>`, `Os` `linux`, `Architecture` `amd64` | `podman image inspect <image>@<digest>`: `RepoDigests` contains `<image>@<digest>` (and `.Digest` equals `<digest>`), `Os` `linux`, `Architecture` `amd64` | `the pulled image does not match the pin: <field>` |

`.Id` is never compared: it is the manifest digest on docker's containerd image store and the config digest on
docker's classic store and on podman. The parsers are pure functions, unit-tested on recorded inspect outputs of docker
with the containerd store, docker with the classic overlay2 store and podman (fixtures; podman's real output is recorded
by phase 3's CI run), each with a match, a mismatching digest, an arm64 image and an index media type.

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
 { "story": "x--v", "theme": "light", "status": "io", "calls": ["fetch /api/items", "localStorage.setItem"] }]
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

New context (viewport 1280 × 800, scale 1, `colorScheme` = theme, `reducedMotion: "reduce"`, `forcedColors: "none"`,
locale `en-GB`, timezone `UTC`) → init scripts (readiness recorder, closed `attachShadow` recorder, storage, clipboard
and beacon recorder) → route every request: `127.0.0.1` served from `dist` (same-origin fetch, xhr, websocket,
eventsource and ping other than Storybook's own files, and paths not in `dist`, recorded as `io`), anything else aborted
and recorded as `network` → open `iframe.html?id=<story>&viewMode=story&globals=theme:<theme>` → wait for the first
render signal (`STORY_RENDERED`, `STORY_THREW_EXCEPTION`, `STORY_ERRORED`, `STORY_MISSING`, `body.sb-show-errordisplay`)
up to 15 s: failure signal → `render-failed`, none → `render-timeout` → scroll check: `scrollX` and `scrollY` read,
`window.scrollTo(0, 0)` when either is not 0 (research.md R-04) → the story's pointer state, if declared, by
`page.mouse` only (`pointer-target` when its parameter is malformed, its selector matches no element or several, or
its target's box is not wholly inside the 1280 × 800 viewport: `target outside the viewport`, research.md R-15) →
`document.fonts.ready`, two frames → closed shadow root check → font check (research.md R-05) → scroll check again →
full-page screenshot (`fullPage: true`, no clip), `animations: "disabled"`, `caret: "hide"`
→ decode and re-encode with `pngjs` (fixed options, no ancillary chunks) → write `<story>.<theme>.png` → close the
context. A story-theme with any status other than `captured` writes no PNG. Every capture is therefore taken at
scroll position (0, 0) (FR-006).
