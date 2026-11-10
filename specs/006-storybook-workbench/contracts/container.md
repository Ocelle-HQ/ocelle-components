# Contract: the pinned container and the capture

Sources: research.md R-01 to R-06.

## `storybook/visual/container.json`

```json
{
  "image": "mcr.microsoft.com/playwright",
  "digest": "sha256:ee15712262f017b8157421b212b12099146645f44b1bc5c0514cbbe6a229b1d0",
  "platform": "linux/amd64",
  "tag": "v1.64.1-noble",
  "node": "26.13.0",
  "browser": "chromium-1248"
}
```

- `digest` is the linux/amd64 **image manifest** digest, never an index digest. The entry point pulls
  `<image>@<digest>` with `--platform linux/amd64` and compares the image the engine reports with it.
- `tag` is for people; it is never used to pull.
- `node` must equal `.node-version`; `browser` must equal the Chromium build the repository's pinned Playwright
  expects (from `playwright-core/browsers.json`). A unit test checks both, so a Playwright or Node upgrade fails until
  the pin is moved with it.
- Moving the pin is a baseline change: the same pull request regenerates every baseline and says why.

## Run arguments (built by `gates/lib/container.ts`, unit-tested)

```text
<engine> run --rm --platform linux/amd64 --network none
  docker:  --user <uid>:<gid>
  podman:  --userns=keep-id
  -v <root>:<root>:ro
  -v <real node_modules>:<real node_modules>:ro
  -v <root>/storybook/.visual/run-<n>:<root>/storybook/.visual/run-<n>
  -e HOME=<root>/storybook/.visual/run-<n>/home
  -e OCELLE_VISUAL_PIN=<digest>
  -w <root>
  <image>@<digest>
  node gates/visual/capture.ts <root>/storybook/.visual/run-<n>/request.json
```

## Capture request and result

`request.json` (written by the host):

```json
{ "dist": "<root>/storybook/dist", "out": "<root>/storybook/.visual/run-1",
  "stories": ["tokens--colour", "…"], "themes": ["light", "dark"] }
```

`result.json` (written by the capture), one entry per story-theme, in request order:

```json
[{ "story": "tokens--colour", "theme": "dark", "status": "captured", "file": "tokens--colour.dark.png" },
 { "story": "x--y", "theme": "light", "status": "render-failed", "message": "…" },
 { "story": "x--z", "theme": "light", "status": "font", "families": ["DejaVu Sans"] },
 { "story": "x--w", "theme": "light", "status": "network", "urls": ["https://example.com/a.png"] }]
```

The capture exits 0 when it wrote `result.json` (whatever the statuses), 2 with one stderr line when it cannot run:
`not the pinned container: <which check failed>`, browser launch failure, unreadable request. The host maps statuses
to findings (contracts/gates.md) in a pure function.

## The capture's checks before any page (FR-009, second layer)

All must hold, else exit 2 `not the pinned container: …`: `process.platform === "linux"`, `process.arch === "x64"`,
`process.version === "v" + node`, `OCELLE_VISUAL_PIN === digest`, `/ms-playwright/<browser>` exists and is the
directory of the executable Playwright resolves.

## Per story-theme (FR-006, FR-012, FR-026 to FR-028)

New context (viewport 1280 × 800, scale 1, `colorScheme` = theme, `reducedMotion: "reduce"`, locale `en-GB`,
timezone `UTC`) → route every request: `127.0.0.1` served from `dist`, anything else aborted and recorded → open
`iframe.html?id=<story>&viewMode=story&globals=theme:<theme>` → wait for `storyRendered`, `document.fonts.ready`, two
frames → render-failure check (`body.sb-show-errordisplay`) → font check (research.md R-05) → screenshot of the root's
full bounding box, `animations: "disabled"`, `caret: "hide"` → decode and re-encode with `pngjs` (fixed options, no
ancillary chunks) → write `<story>.<theme>.png` → close the context.
