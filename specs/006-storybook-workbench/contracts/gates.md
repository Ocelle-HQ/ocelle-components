# Contract: the three new gates and the baseline command

All three gates follow `gates/README.md` § How a gate runs and `specs/001-repository-foundation/contracts/gate-cli.md`:
`--root <dir>`; exit 0 with one stdout summary line; exit 1 with one stdout line per finding
`<location>: <gate-id>: <rule>: <message>` then the summary; exit 2 with one stderr line naming the cause and the fix.
Notes, where a gate has them, go to stderr and start with `note: `. Sources: research.md R-03 to R-16.

None of the three gates needs the packages built: the Storybook reads the packages' source, fonts and base stylesheet,
never a package's `dist/` (research.md R-09).

## `storybook-build` (check "Storybook build")

| | |
|---|---|
| Command | `pnpm run gate:storybook-build` |
| Plant command | `node gates/bin/storybook-build.ts --root {root}` (form `repo-tree`) |
| Scope | the Storybook workspace's build (`storybook/`), through its own `build` script |
| Exit 0 | `storybook-build: built <n> stories` |

| Rule | Location | When |
|---|---|---|
| `build-error` | the file the build names, else `storybook/package.json` | the build fails (syntax error, import that does not resolve, any other build error) |
| `index-error` | the story file | the indexer cannot read a story file (not valid CSF) |
| `empty-index` | `storybook/dist/index.json` | the build succeeds and the index holds no entry of type `story` |

Exit 2, checked before the build in this order: `storybook/package.json` missing or without a `build` script; the
Storybook CLI not resolvable from `storybook/node_modules` ("storybook is not installed; run pnpm install"); `pnpm` not
found. After a successful build: `dist/index.json` missing or not JSON.

## `visual` (check "Visual regression")

| | |
|---|---|
| Command | `pnpm run gate:visual -- --engine both` (CI; in CI the gate requires both engines in any case, research.md R-06) |
| Plant command | `node gates/bin/visual.ts --root {root} --engine {engine}` (form `repo-tree`; `{engine}`: research.md R-06) |
| Scope | every story of the built index, in `light` and `dark`, against `storybook/baselines/` |
| Options | `--engine <docker\|podman\|both\|auto\|host\|<name>>`, default `auto` (`both` in CI) (research.md R-06) |
| Exit 0 | `visual: <n> captures match their baselines (<engines>)`, where `<engines>` is `docker+podman`, or `<engine> only: no cross-engine comparison` (never in CI) |

Order of a run: engine resolution → pin check → build (R-03) → run 1 → run 2 → per story-theme the verdict
(data-model.md § Verdict per story-theme) → stray baselines.

| Rule | Location | When |
|---|---|---|
| `render-failed` | `<story-id>/<theme>` | the story module throws, its render throws, or its id is missing (message names the signal) |
| `render-timeout` | `<story-id>/<theme>` | no render signal within 15 s |
| `closed-shadow-root` | `<story-id>/<theme>` | an element of the story attaches a closed shadow root (message names the host tag) |
| `pointer-target` | `<story-id>/<theme>` | the story's pointer parameter is malformed or its selector matches no element or more than one |
| `font` | `<story-id>/<theme>` | text drawn by a face other than Schibsted Grotesk, or a face that is `loading` or `error`, or a used face not `loaded` (message lists the families) |
| `network` | `<story-id>/<theme>` | the story requested anything outside `127.0.0.1` (message names the URL) |
| `io` | `<story-id>/<theme>` | same-origin fetch, xhr, websocket, eventsource or ping other than Storybook's own files, a request for a path not in `dist`, or a storage, clipboard or beacon call (message names each) |
| `nondeterministic` | `<story-id>/<theme>` | run 1 and run 2 differ in any byte; no baseline comparison for it |
| `missing-baseline` | `<story-id>/<theme>` | no baseline file for a story-theme |
| `differs` | `<story-id>/<theme>` | run 1 differs in any byte from `storybook/baselines/<story-id>.<theme>.png` |
| `stray-baseline` | `storybook/baselines/<file>` | a baseline file names no story-theme of the index, or its name does not parse |

Written to `storybook/.visual/` (ignored; uploaded by the CI job on failure): for each `differs`,
`<story-id>.<theme>.actual.png` and `.diff.png` (differing pixels in magenta, the rest dimmed); for `nondeterministic`,
`.run-1.png` and `.run-2.png`; for each `differs` and `missing-baseline`, run 1's capture in baseline layout at
`storybook/.visual/baselines/<story-id>.<theme>.png`, the files a contributor commits when a local run and CI disagree.

Exit 2: no engine, a missing engine under `both`, a named engine not found; a single engine in CI; a `host` run that
exits 0; a pin that is a tag, names an index, or whose pulled image does not list the pinned digest or is not
linux/amd64; the image cannot be obtained; the capture's refusal "not the pinned container: <check>"; the Storybook
build failed ("the Storybook build failed; run pnpm run gate:storybook-build").

## `visual:update` (the baseline command, not a gate)

`pnpm run visual:update [-- --engine <…>]` (`gates/bin/baselines.ts`). Same engine resolution, pin check, build and two
runs as `visual`. Applies `updatePlan` (research.md R-11): writes nothing and exits 1 when any `render-failed`,
`render-timeout`, `closed-shadow-root`, `pointer-target`, `font`, `network`, `io` or `nondeterministic` result exists
(printed as by the gate); exit 2 as the gate. Otherwise writes every baseline whose bytes changed, deletes stray ones,
and prints `baselines: wrote <n> files (<changed> changed, <removed> removed), <bytes> bytes in total`.

## `axe` (check "Accessibility")

| | |
|---|---|
| Command | `pnpm run gate:axe` |
| Plant command | `node gates/bin/axe.ts --root {root}` (form `repo-tree`) |
| Scope | every story of the built index, in `light` and `dark`; context the whole document minus Storybook's harness nodes; axe-core 4.14.0 with the FR-016 rule set (harness-document rules not run) |
| Exit 0 | `axe: <runs> story-theme runs, 0 serious or critical; <notes> notes (<incomplete> incomplete, <excepted> excepted)` where `<runs>` = 2 × stories |

| Rule | Location | When |
|---|---|---|
| `<axe rule id>` | `<story-id>/<theme>` | a node of a violation of impact `serious` or `critical` not excepted; message `<impact>: <selector>` (one finding per node) |
| `<axe rule id>-incomplete` | `<story-id>/<theme>` | a node of an `incomplete` result of impact `serious` or `critical` not excepted; message `<impact>: <selector>` |
| `outside-root` | `<story-id>/<theme>` | an element child of `<body>` that is neither `#storybook-root`, a harness node nor a non-rendered element (message names its tag) |
| `closed-shadow-root` | `<story-id>/<theme>` | an element of the story attaches a closed shadow root (axe not run) |
| `pointer-target` | `<story-id>/<theme>` | as for `visual` (axe not run) |
| `empty` | `<story-id>/<theme>` | the story root renders no content (research.md R-08; axe not run) |
| `render-failed` | `<story-id>/<theme>` | the story module throws, its render throws, or its id is missing (axe not run) |
| `render-timeout` | `<story-id>/<theme>` | no render signal within 15 s (axe not run) |
| `stale-exception` | `storybook/a11y-exceptions.json#<index>` | an honoured exception entry matches no node |
| `unrecorded-exception` | `storybook/a11y-exceptions.json#<index>` | the entry's `plan` file is missing or its Complexity Tracking holds no row with the entry's story, theme, rule, selector and sunset (the entry is not honoured) |

Notes (stderr): `note: <story-id>/<theme>: <rule-id>: <impact>: <selector>` for moderate and minor violations;
`… incomplete …` for moderate and minor incomplete results; `… excepted (<reason>)` for an honoured exception.

Exit 2: no browser; `axe-core` not found; `storybook/a11y-exceptions.json` not a list of complete entries; the
Storybook build failed.

## The registry

`gates/gates.json` and the FR-020 list of `gates/lib/registry.ts` gain `storybook-build`, `visual` and `axe`; `ci.yml`
gains the jobs `storybook-build` ("Storybook build"), `visual` ("Visual regression") and `axe` ("Accessibility"). The
`visual` job uploads `storybook/.visual/` with `actions/upload-artifact` (pinned by SHA) when it fails. The `plants`
job runs `pnpm run gate:plants` with `OCELLE_VISUAL_ENGINE=both`; the registry check fails when that job's steps
contain `--skip-container` (research.md R-07). That CI compares docker with podman does not rest on the workflow text:
the gate requires both engines whenever `CI` or `GITHUB_ACTIONS` is `true` (research.md R-06). Root `package.json`
gains the scripts `gate:storybook-build`, `gate:visual`, `gate:axe` and `visual:update`.
