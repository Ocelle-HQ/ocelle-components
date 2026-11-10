# Phase 1 spike (T004): Storybook 10.6.5, the pinned container and axe-core 4.14.0

Run on 2026-11-10 by the implementer, in this sandbox: Node v22.23.4 on the host, docker 29.9.2 (containerd image
store, `driver-type io.containerd.snapshotter.v1`), host Chromium 1243 through `OCELLE_CHROMIUM_PATH`, the pinned
image `mcr.microsoft.com/playwright@sha256:ee15712262f017b8157421b212b12099146645f44b1bc5c0514cbbe6a229b1d0`
(already in the local store). Scratch scripts and trees lived in the session scratchpad only; every tree under test was
a copy of `HEAD` (`git archive HEAD | tar -x`) with `node_modules` and `storybook/node_modules` linked to the
repository's, as `plant-repo.ts` will do (R-16), and the case's change applied.

**Two stop-and-ask outcomes** (tasks.md § Stop-and-ask points): § 4 (a build in another root writes under
`storybook/node_modules` with both caches moved) and § 7 (serious axe results on an existing story, FR-029). Both are
stated as questions at the end of their sections, each followed by the operator's decision (2026-11-10). Every other
item came out as the plan expects.

## 1. Build output for each failure kind (fixtures for T009 and T010)

Command, as the gate will run it (R-09), from the tree's root: `pnpm --dir storybook run build > stdout 2> stderr`.
Fixtures: `gates/test/fixtures/storybook-build/<case>/{stdout.txt,stderr.txt,exit}`, recorded bytes with two path
substitutions only: the case's tree root is written `/work/root` and the repository `/work/repo` (both are absolute
paths of this sandbox). `ok/index.json` and `empty-index/index.json` are the builds' `storybook/dist/index.json`.

| Case (fixture) | Change | Exit | Signal |
|---|---|---|---|
| `ok` | none | 0 | stdout ends `—  Storybook build completed successfully`; index has the 12 stories |
| `syntax-error` | `export const Broken = { render: () => { return ( ; } };` appended to `stories/tokens.stories.ts` | 1 | the **indexer** reports it, not Vite: stdout `!  🚨 Unable to index ./stories/tokens.stories.ts:` then `\|  SyntaxError: Unexpected token (26:49)`, and `x  Error: Unable to index ./stories/tokens.stories.ts` |
| `syntax-error-imported` | a new `stories/helper.ts` holding `export const broken = ( ;`, imported by `base.stories.ts` | 1 | **Vite** reports it: `x  Build failed with 1 error:` then `\|  [builtin:vite-transform] Unexpected token` and `╭─[ stories/helper.ts:1:25 ]` (path relative to `storybook/`) |
| `unresolved-import` | `import "./no-such-module.ts";` first line of `stories/base.stories.ts` | 1 | Vite: `x  Build failed with 1 error:`, `\|  [UNRESOLVED_IMPORT] Could not resolve './no-such-module.ts' in` / `\|  stories/base.stories.ts`, `╭─[ stories/base.stories.ts:1:8 ]` |
| `not-csf` | `stories/not-csf.stories.ts` = `export const notAStory = 1;` | 1 | indexer: `!  🚨 Unable to index ./stories/not-csf.stories.ts:` then `\|  NoMetaError: CSF: missing default export`, and `x  Error: Unable to index ./stories/not-csf.stories.ts` |
| `empty-index` | every `stories/*.stories.ts` removed | 0 | build succeeds; `dist/index.json` is `{"v":5,"entries":{}}` |
| `type-error-only` | `const n: number = "not a number";` in `tokens.stories.ts` | 0 | no signal; the build does not type-check (`pass-type-error-only`) |
| `missing-deps` | `storybook/node_modules` link removed | **0** | **pnpm installs before running the script**: stderr shows `devDependencies: + @ocelle/tokens <- ../packages/tokens`, `+ @storybook/html-vite 10.6.5`, `+ storybook 10.6.5`, then the build succeeds. No failure signal at all |
| `missing-deps-no-verify` | same, run with `pnpm --config.verify-deps-before-run=false --dir storybook run build` | 127 | stderr `sh: 1: storybook: not found`, `[ELIFECYCLE] Command failed with exit code 127.`; no file named |

Notes for the parser (T009, T015):
- The Storybook CLI writes its log to **stdout**, prefixed by `|`, `x`, `!`, `o`, `•`, `—`; pnpm's lines and the
  `[ELIFECYCLE]` line go to **stderr**.
- Rolldown's error block carries ANSI colour codes even with stdout not a terminal, and `NO_COLOR=1` does not remove
  them (13 escape sequences left in the `unresolved-import` stdout with `NO_COLOR=1`); the indexer's lines carry none.
  The parser must strip ANSI sequences (and the OSC 8 hyperlinks, `ESC]8;;…`, seen in the not-CSF "More info" line).
- File names come in two forms: `./stories/<file>` (indexer, relative to `storybook/`) and `stories/<file>:<line>:<col>`
  inside `╭─[ … ]` (Vite), both relative to `storybook/`, so the finding's file is `storybook/` + that path.
- A syntax error in a **story file** is an indexer error (`Unable to index`), so it is distinguishable from the not-CSF
  case only by the second line (`SyntaxError:` against `NoMetaError:`). Every failure kind has its own signal.
- A syntax error in `stories/render.ts` fails earlier, in the `prebuild` script (`node scripts/swatches.ts` imports
  it): a Node `SyntaxError [ERR_INVALID_TYPESCRIPT_SYNTAX]` on stderr naming the file as a `file://` URL. Its text is
  Node's (v22 here, v26 in CI), so no test may assert it (plan § Environment); it falls under "a failed build whose
  output names no file it can parse", `build-error` at `storybook/package.json`, unless phase 2 chooses to read the
  `file://` line.
- **Missing dependencies:** the R-09 pre-check (`storybook/node_modules/storybook/package.json` and
  `storybook/node_modules/.bin/storybook`) is the only way to see this case, since pnpm 12.16.1 repairs the install
  before the script runs. Without the pre-check the build passes (it does not fail as "storybook: not found", which
  R-09 assumed). And the repair is not harmless: it rewrote the repository's `node_modules/.modules.yaml` and
  `node_modules/.pnpm/lock.yaml` through the root `node_modules` link (mtimes 10:37:08, the moment of that build).
  See § 4.

## 2. Render signals and the error display (fixture for T023)

Tree: `HEAD` plus `stories/spike.stories.ts` (a story whose `render` throws, a fine story with
`parameters: { ocelle: { pointer: { hover: ".target" } } }`, a story calling `document.execCommand("copy")` and
`("cut")`) and `stories/spike-module.stories.ts` (throws at module evaluation). Built with
`--config.verify-deps-before-run=false`, served from `storybook/dist` on `127.0.0.1`, opened on host Chromium with
the R-04 context (1280 × 800, scale 1, `reducedMotion: "reduce"`, `forcedColors: "none"`, `en-GB`, `UTC`) at
`iframe.html?id=<id>&viewMode=story&globals=theme:light`. An init script trapped the assignment of
`window.__STORYBOOK_ADDONS_CHANNEL__` with a setter and subscribed to the four events at once, and a
`MutationObserver` watched `<body>`'s class. Fixture: `gates/test/fixtures/storybook-signals/signals.json` (signals in
order, body class and children, the Storybook I/O and requests, storage state).

| Case | Signals, in order | `<body>` class |
|---|---|---|
| module that throws (`spike-module--module-throws`) | `storyMissing` (arg the id), then `sb-show-errordisplay` | `sb-show-errordisplay` |
| render that throws (`spike--render-throws`) | `storyThrewException` (message `render throws on purpose`), then `sb-show-errordisplay` | `sb-main-padded sb-show-errordisplay` |
| missing id (`no-such--story`) | `storyMissing` (arg the id), then `sb-show-errordisplay` | `sb-show-errordisplay` |
| a story that renders (`spike--fine`, `tokens--colour`) | `storyRendered` (arg the id) only | `sb-main-padded sb-show-main` |

- A module that throws is reported as `STORY_MISSING`, not `STORY_ERRORED`; no case of the spike produced
  `storyErrored`. The classifier keeps all four failure signals (R-04); the first signal is always one of the events,
  the body class follows within the same task (0 to 2 ms).
- The channel setter trap works: no event was missed in any case (the first signal arrived 200 to 350 ms after the
  init script ran).
- The error display's `#error-stack` holds the thrown message and stack, usable as the `render-failed` message.

## 3. The preview's harness nodes, Storybook's own I/O, `execCommand`, the parameters path

- **Body children** of the preview after a render, in order: `div.sb-preparing-story.sb-wrapper`,
  `div.sb-preparing-docs.sb-wrapper`, `div.sb-nopreview.sb-wrapper`, `div.sb-errordisplay.sb-wrapper`,
  `div#storybook-root`, `div#storybook-docs`, `script`, and, **added at run time after a story renders**,
  `div#scripts-root` (the HTML renderer's container for scripts of story markup, `Oq="scripts-root"` in the bundled
  preview; 1248 × 0, `display: block`). On a failed render `#scripts-root` is absent.
  **So the harness list is** `.sb-preparing-story`, `.sb-preparing-docs`, `.sb-nopreview`, `.sb-errordisplay`,
  `#storybook-docs` **and `#scripts-root`**: without the last, R-08's `outside-root` check reports `div` (`#scripts-root`)
  on every one of the 24 story-themes (measured, § 7).
- **Requests** of Storybook itself (Playwright `resourceType()`, same origin): `document` `iframe.html`, `script`
  (`vite-inject-mocker-entry.js`, `inline-*.js`, `assets/*`), `stylesheet` (`inline-*.css`, `tokens.css`, `base.css`,
  `swatches.css`, `assets/*`), `font` (`fonts/SchibstedGrotesk-wght.woff2`; on the error display also
  `sb-common-assets/nunito-sans-bold.woff2` and `nunito-sans-regular.woff2`), and exactly one `fetch`:
  **`/index.json`** (called as `fetch("./index.json")` from `getStoryIndexFromServer`). `project.json` is **not**
  requested. No `xhr`, `websocket`, `eventsource` or `ping`. So the R-14 allow-list of Storybook's own requests is
  `index.json` only. The browser also asked the server for `/favicon.ico` once per browser (a path not in `dist`); it
  is not a page request (no `page.on("request")` event), so the capture's route never sees it.
- **Storage**: Storybook made no Web Storage call (by method or by named property, through the recording `Proxy`), no
  cookie read or write, no `indexedDB.open` or `deleteDatabase`, no Cache API call, no clipboard write and no
  `sendBeacon`. Storage left behind after each render: `context.storageState({ indexedDB: true })` gave 0 cookies and
  no origin, `sessionStorage` had no key. So the storage allow-list is empty.
- **`execCommand`**: the wrap of `Document.prototype.execCommand` recorded both calls of `spike--copies`,
  `execCommand copy` and `execCommand cut`, in order.
- **Parameters**: the current story's parameters are at
  `window.__STORYBOOK_PREVIEW__.currentRender.story.parameters` (`spike--fine` gave `ocelle: { pointer: { hover:
  ".target" } }`); `window.__STORYBOOK_PREVIEW__.currentRender.id` is the story id. On the missing id
  `currentRender` has no story (`parameters` absent), on the module that throws `currentRender.id` is set but
  `story` is absent; both are failures before any pointer step.

## 4. Caches: does a build write under `storybook/node_modules`? (R-09, R-16) — stop-and-ask

Method: a fresh tree copy; `find <repo>/storybook/node_modules/ <repo>/node_modules/ -printf '%p %s %T@\n'` before
and after the build, diffed.

| Run | Vite `cacheDir` | `CACHE_DIR` | pnpm | Changed entries under the repository's `node_modules` | of them under `storybook/node_modules` |
|---|---|---|---|---|---|
| `cache-default` | default | unset | `pnpm --dir storybook run build` | 256 (512 diff lines) | `.bin/storybook`, `.bin/vite`, `.bin` |
| `cache-moved` | `storybook/.cache/vite` (`viteFinal` in the copy's `main.ts`) | `<root>/storybook/.cache` | `pnpm --dir storybook run build` | 256 | `.bin/storybook`, `.bin/vite`, `.bin` |
| `cache-moved-noverify` | `storybook/.cache/vite` | `<root>/storybook/.cache` | `pnpm --config.verify-deps-before-run=false --dir storybook run build` | **0** | **0** |

- **Cause**: not the caches. pnpm 12.16.1 checks the install before `run` (`verify-deps-before-run`, unset in this
  repository, so pnpm's default) and, in a root other than the repository, re-links the workspace: it rewrites every
  `.bin` shim of the repository's `node_modules/.bin`, `storybook/node_modules/.bin` and
  `node_modules/.pnpm/*/node_modules/*/node_modules/.bin`, and `node_modules/.pnpm-workspace-state-v1.json`, through
  the plant root's `node_modules` links. The rewritten shims carry the plant root's path
  (`export NODE_PATH=…:<scratch root>/node_modules/.pnpm/node_modules`, `# cmd-shim-target=<scratch
  root>/node_modules/typescript/./bin/tsc`), and their sizes change with the root's path length. A later
  `pnpm install --frozen-lockfile --offline` in the repository restored them (checked: no shim names the scratch
  path any more).
- **Caches themselves**: with both moved, the build wrote nothing anywhere (`storybook/.cache/` of the tree stayed
  empty: Vite's `cacheDir` is not used by `vite build` of this Storybook, and Storybook's file cache writes nothing
  with telemetry off on this run). The pre-existing `storybook/node_modules/.cache/storybook/default` (from the
  install, 08:03) was not touched in the default run either.
- **Measured fix candidate**: `--config.verify-deps-before-run=false` (or the environment variable
  `npm_config_verify_deps_before_run=false`, untested) on the gate's pnpm call: then nothing is written, the build
  output is unchanged, and the missing-deps case gives exit 127 `storybook: not found` (§ 1), which the R-09 pre-check
  turns into exit 2 before the build anyway.

**Question for the operator**: R-16 requires that a build in a plant root writes nothing under
`storybook/node_modules`; moving both caches is not enough, because pnpm's dependency check before `run` rewrites
the repository's shims (also under the root `node_modules`). Should the build function run
`pnpm --config.verify-deps-before-run=false --dir storybook run build` (a plan change to R-09 and R-16, and the
T010 integration test then also checks the root `node_modules` shims), or another way (for example running the
Storybook CLI without pnpm's `run`)?

**Operator decision (2026-11-10, human:jeroennouwsdev)**: "Flag in the build fn". The gates' build function runs
`pnpm --config.verify-deps-before-run=false --dir storybook run build`; the repository's pnpm configuration is not
changed (research R-09, R-16; plan decision 19; contracts/gates.md § `storybook-build`). Carried by T009, T010, T015
and T016.

## 5. The 12 stories captured twice in the container (R-03, R-04, R-05)

Command, per run `n` (two separate containers):

```text
docker run --rm --platform linux/amd64 --network none --user 0:0 \
  -v <repo>:<repo>:ro -v <probe>:<probe>:ro -v <dist>:<dist>:ro -v <out-n>:<out-n> -e HOME=<out-n>/home -w <repo> \
  mcr.microsoft.com/playwright@sha256:ee15712262f017b8157421b212b12099146645f44b1bc5c0514cbbe6a229b1d0 \
  node <probe>/capture.mjs <dist> <out-n>
```

The scratch `capture.mjs` used the repository's `playwright` and `pngjs` (resolved from `<repo>/package.json`),
`chromium.launch()` without a channel or path, the R-04 context per story-theme, readiness by the channel trap,
`document.fonts.ready` and two frames, the CDP font walk (`DOM.getDocument({ depth: -1, pierce: true })`, every
non-whitespace text node outside `head`, `script`, `style`, `template`, `noscript` and the harness nodes, user-agent
shadow roots included, `CSS.getPlatformFontsForNode` each), `page.screenshot({ fullPage: true, animations:
"disabled", caret: "hide" })`, and `PNG.sync.write(PNG.sync.read(shot), { colorType: 6, inputColorType: 6, bitDepth:
8, deflateLevel: 9, filterType: 4 })`. Every request outside the server was aborted (none was made).

- Inside the container: `process.version` `v26.13.0`, `linux`, `x64`, `browser.version()` `156.0.8078.80`.
  `/ms-playwright` holds `chromium_headless_shell-1248`, `ffmpeg-1013`, `firefox-1555`, `webkit-2370` and **no
  `chromium-1248`** (R-01 said both; `chromium.executablePath()` names the absent `chromium-1248` path, while the
  headless launch runs the headless shell). `container.json`'s `browser` is right.
- Run 1 took 34 s (first start), run 2 15 s, for 24 captures each.
- **All 24 captures are byte-identical across the two runs.** Every one started and ended at scroll (0, 0). Every
  text node's platform font is `Schibsted Grotesk`; **no fallback family, so no glyph Schibsted Grotesk lacks**. Faces:
  `Schibsted Grotesk 400 900 normal: loaded` and the four Nunito Sans faces `unloaded` (R-05: declared, unused, not
  findings).
- Record: `spike-captures.json` (beside this file), with both runs' sha256.

| Story | Theme | Size (px) | Bytes | sha256 (both runs) |
|---|---|---|---|---|
| base-styles--base-page | light | 1280 × 800 | 81557 | `d8474eb7cc1390fc6b2068ad409060d6bdd4c3ceee02d1708b6206b3112085d7` |
| base-styles--base-page | dark | 1280 × 800 | 84596 | `6bc58984c962fa0c8c9cad244c9ab6d8f54f4b2b8f2968f8198d00bd4ea7118c` |
| base-styles--compact-screen | light | 1280 × 800 | 57292 | `eb3b98ed46f230d332b750db1198754c3db6d2fa70378727f93f63463dc86457` |
| base-styles--compact-screen | dark | 1280 × 800 | 59426 | `0964b06140917e07816f964d3e3f6e50cb3e18aae410d9a3a5aba09bcada12c9` |
| base-styles--prose-document | light | 1280 × 1083 | 196069 | `d9c5b298f585bd24501648b5508689e959bccb5e01c10f820106bf914e8c785a` |
| base-styles--prose-document | dark | 1280 × 1083 | 201126 | `c9779b23d5f1b8f0b429ca9e5b1501b90027fb35c7e2a23f8ec59f8836750bca` |
| base-styles--identifier-wrap | light | 1280 × 800 | 100869 | `2cbe5fe88ec932a3982e448ba99100f96dfb7e84a226a0edca0b092537ead38d` |
| base-styles--identifier-wrap | dark | 1280 × 800 | 104814 | `0d95d2c5d3de085d2e1dd4f163e96a99ea50998a9d44d054f5cfdc363044e96a` |
| tokens--colour | light | 1280 × 1919 | 219007 | `e607c7a2f6ae0e14477382a1f1123c768c9b4583c5256c11bf58875783c7b72d` |
| tokens--colour | dark | 1280 × 1919 | 232580 | `aaa3e317b29d247693255e21e9717fc8b2f6498b135f1fb98a15a10cb3bd314f` |
| tokens--type | light | 1280 × 1038 | 124565 | `d50cd39a759f9369f6e8bb586f8edff03a83401aaa2ad78717c0d6ce64c3e43d` |
| tokens--type | dark | 1280 × 1038 | 129736 | `edbf9203745d6163420e5a60328f3eeceb39e4637f32052d8eb7fe82a57ba25d` |
| tokens--space | light | 1280 × 800 | 47270 | `75792f7593fcb15d06a04ef8b46c39a8bae33b14d00e43a49135c8ab8db2ce6e` |
| tokens--space | dark | 1280 × 800 | 48750 | `9cf5471f5e6743758857e1c2394e054407269af2b87d5036f27e3773d04adbad` |
| tokens--shape | light | 1280 × 800 | 44411 | `a86b87017a7e0e14bd32e8a3633d5c94361559b7c8dc051c2dce56f8b5493a00` |
| tokens--shape | dark | 1280 × 800 | 46087 | `9ac6f9703c2f3d711bc5d2f3364eb0d86103bca958ce38c633f7b6c7dce0f201` |
| tokens--size | light | 1280 × 800 | 35882 | `fbb8d3215b166d91a9b74c21d2474ce784322f72558442bb9846574650570624` |
| tokens--size | dark | 1280 × 800 | 36928 | `e68d3fc26091623f7d68a8a72cc05df2f008af39dda827710d711b2507bda87c` |
| tokens--shell | light | 1280 × 899 | 105384 | `f595eef4b9ffe3f0bb0525fc1bb423fcd663cbc7dabb3dd8d892c87e09014705` |
| tokens--shell | dark | 1280 × 899 | 109482 | `094243e5783dd6f559c9225d3b021545fc0bc15aa723ff2d12eac32e207e9d89` |
| tokens--elevation | light | 1280 × 800 | 60152 | `8e3c3aa03cbc5db1f6b9ec0ed4f3517c68d55adefd09cde7cab10f343975ed8d` |
| tokens--elevation | dark | 1280 × 800 | 39481 | `ddea41801ae9a1f4e231c739b115ab0cbdc343b07e347d6c059bf82eca223d24` |
| tokens--motion | light | 1280 × 800 | 24090 | `7049432de1a046b76c3faac03196dba639cfad2d3391f5806a3e0400b204102b` |
| tokens--motion | dark | 1280 × 800 | 24901 | `79c7fc94e590c13e5ca4e56c8544b8c2829a65f2dfc85db2b379e595ff9ee58f` |

These are captures of today's Storybook (still under its CSP and externaliser); phase 3's baselines come from the
gate itself and may differ if phases 2 to 5 change the build.

**`fail-token-changed`** (`color-ink`, light): a tree with `color-ink` light `#15130F` → `#5A1E1E` in
`packages/tokens/src/source.ts`, built and captured once in the container, compared with run 1: **the 12 light
story-themes change, the 12 dark ones do not**: `base-styles--base-page`, `base-styles--compact-screen`,
`base-styles--prose-document`, `base-styles--identifier-wrap`, `tokens--colour`, `tokens--type`, `tokens--space`,
`tokens--shape`, `tokens--size`, `tokens--shell`, `tokens--elevation`, `tokens--motion`, each `/light`. So the plant
expects `differs` on exactly those 12 (T040 may pick another value; any visible change of the light ink should give
the same list, since every story draws body text).

The same capture on the host (Chromium 1243, Node 22) gave other bytes for every story-theme (for example
`base-styles--base-page` light 87087 bytes, `263352aa…`), as expected: only the container's bytes count.

## 6. The pin in docker (fixtures for T022)

Fixtures: `gates/test/fixtures/container/`:
- `docker-containerd-inspect.json`: `docker image inspect mcr.microsoft.com/playwright@sha256:ee15…b1d0` on the
  containerd image store. `Id` `sha256:ee15712262f0…b1d0` (the manifest digest on this store, R-06),
  `RepoDigests` `["mcr.microsoft.com/playwright@sha256:ee15…b1d0"]`, `RepoTags` the same reference, `Os` `linux`,
  `Architecture` `amd64`.
- `docker-imagetools-manifest.json`: `docker buildx imagetools inspect --raw <image>@<digest>` (buildx v0.38.1):
  `mediaType` `application/vnd.oci.image.manifest.v1+json`, config `sha256:a0d7b2b49ffa0e99787a00b7ec2af46eca58020082713f002ca9f0f1cfd1a017`.
- `docker-imagetools-tag-index.json`: `docker buildx imagetools inspect --raw mcr.microsoft.com/playwright:v1.64.1-noble`:
  `mediaType` `application/vnd.oci.image.index.v1+json`, manifests linux/amd64 `sha256:ee15…b1d0` and linux/arm64
  `sha256:f609973e8fd93f38a5ddfd706a65805294247dae8d81b2541c0afe2787746197`.
- **The tag's index digest** (for `error-index-pin`): `sha256:2f05f8a734509a7b3f26a912639488ee08f58a7b292d14d62271bcff9038768f`
  (`docker buildx imagetools inspect` `Digest:` line; equal to the sha256 of the raw bytes recorded).

The classic overlay2 store and podman are not available here; their fixtures are written in phase 3 (T022) and
podman's real output comes from phase 3's CI run (R-02).

## 7. axe-core 4.14.0 on the 12 stories, both themes (R-08) — stop-and-ask

Host Chromium 1243 (CI runs 1248), the R-04 context, readiness as above, `document.fonts.ready` and two frames, then
`page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") })` and
`axe.run({ include: [document], exclude: [[".sb-preparing-story"], [".sb-preparing-docs"], [".sb-nopreview"],
[".sb-errordisplay"], ["#storybook-docs"]] }, { rules, resultTypes: ["violations", "incomplete"] })`, with `rules`
enabling exactly the R-08 selection over `axe._audit.rules` (default-enabled or tagged `wcag2a`, `wcag2aa`,
`wcag21a`, `wcag21aa`, `wcag22aa`; not `experimental`; not `bypass`, `document-title`, `html-has-lang`,
`html-lang-valid`, `html-xml-lang-mismatch`, `landmark-one-main`, `page-has-heading-one`, `region`): **85 rules**,
listed in `spike-axe.json` with every result.

- Rules whose selector is the document element in 4.14.0: `bypass`, `css-orientation-lock` (tagged `experimental`),
  `document-title`, `frame-focusable-content`, `frame-tested` (`html:not(html *), frame, iframe`), `html-has-lang`,
  `html-lang-valid`, `html-xml-lang-mismatch`, `landmark-one-main`, `page-has-heading-one`, as R-08 lists them.
- **22 of 24 story-themes have no violation and no incomplete result.**
- **`base-styles--prose-document`, light and dark, each:**
  - violation `scrollable-region-focusable`, **serious**, at `table:nth-child(12)` (the "A wide table" table: a
    horizontal scroll box, `display: block; overflow-x: auto` from base.css, with no focusable content; the second
    wide table, `table:nth-child(14)`, holds a link and passes);
  - five `color-contrast` **incomplete**, **serious**, reason `elmPartiallyObscured`, at
    `table:nth-child(12) > thead > tr > th:nth-child(12)`, `table:nth-child(12) > tbody > tr:nth-child(1) > td:nth-child(12)`,
    `tr:nth-child(2) > td:nth-child(12)`, `table:nth-child(14) > thead > tr > th:nth-child(12)` and
    `table:nth-child(14) > tbody > tr > td:nth-child(12)`: the twelfth column of both wide tables, clipped by the
    scroll box. Under R-08 these are `color-contrast-incomplete` findings.
- `outside-root`: with the five harness selectors above, `div#scripts-root` is outside the root on every one of the
  24 story-themes (§ 3); it must join the harness list.

**Question for the operator (FR-029)**: the Prose document story has, in both themes, one serious violation and five
serious incomplete results, all caused by base.css's table scroll box (003 surface: a table is its own scroll box,
`overflow-x: auto`, no wrapper, no `tabindex`; the styles README says Chromium hosts need no `tabindex` and WebKit
hosts add `tabindex="0"`). Possible story-file fixes, each changing what the story demonstrates: give the story's
tables `tabindex="0"` in `storybook/stories/render.ts` (clears `scrollable-region-focusable` only; the clipped
column's `elmPartiallyObscured` stays as long as the table overflows), or make the tables narrow enough not to scroll
(clears all six, but the story then no longer shows a wide table). Otherwise these are exceptions under FR-029 (a
Complexity Tracking row each, with the operator's approval and the op that fixes the base style as sunset): 2 × 6 = 12
entries. Which does the operator choose?

**Operator decision (2026-11-10, human:jeroennouwsdev)**: "tabindex + exceptions". The story's wide tables get
`tabindex="0"` in `storybook/stories/render.ts`, clearing `scrollable-region-focusable`; the ten serious
`color-contrast` incomplete results (five nodes × two themes) become per-node exceptions, one plan.md Complexity
Tracking row each, with the sunset "the op that fixes the color-contrast incomplete results of base.css's prose table
scroll box (003 surface), to be opened by the operator" (research R-08; plan decision 20). Carried by T052, T053a, T057
and T060.

## 8. Plant candidates for the axe gate (T058)

Tree: `HEAD` plus `stories/candidates.stories.ts`, whose styles come from a constructed stylesheet adopted by the
document (no style attribute), selectors on data attributes, token colours only:

```ts
sheet.replaceSync(`
  [data-candidate="low"] { color: var(--ocelle-color-rule); }
  [data-candidate="image"] { background-image: linear-gradient(var(--ocelle-color-canvas), var(--ocelle-color-inset)); padding: 8px; }
`);
```

- **`fail-two-low-contrast`**: two `<p data-candidate="low">` (`First faint line`, `Second faint line`) in a `div`:
  `color-contrast`, **serious**, on exactly two nodes, `p[data-candidate="low"]:nth-child(1)` and
  `p[data-candidate="low"]:nth-child(2)`, in **both** themes (`color-rule` on the canvas: light `#D9D3C7` on
  `#F1EEE8`, dark `#3A342B` on `#15130F`). No other result.
- **`fail-incomplete`**: one `<div data-candidate="image">Text over a background image</div>`: its only result is
  `color-contrast` **incomplete**, **serious**, reason `bgGradient`, at `div[data-candidate="image"]`, in **both**
  themes. A gradient is the background image here, so the plant needs no image file.

Both candidates give exactly their planned finding; they ran on host Chromium 1243, and CI's 1248 re-measures them
when the plants run.

## Repository state after the spike

Restored and checked: the repository's `node_modules` shims name no scratch path (`pnpm install --frozen-lockfile
--offline` after § 4's first two runs; checked again at the end), `git status` shows only this phase's files.
