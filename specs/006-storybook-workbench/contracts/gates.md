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
| Scope | the Storybook workspace's build (`storybook/`), through its own `build` script: `pnpm --config.verify-deps-before-run=false --dir storybook run build` in the root, with `CACHE_DIR=<root>/storybook/.cache` (research.md R-09; the flag keeps pnpm from re-linking the repository's `node_modules` from a plant root, operator decision on the phase 1 spike § 4) |
| Exit 0 | `storybook-build: built <n> stories` |

| Rule | Location | When |
|---|---|---|
| `build-error` | the file the build names, else `storybook/package.json` | the build fails (syntax error, import that does not resolve, any other build error) |
| `index-error` | the story file | the indexer cannot read a story file (not valid CSF) |
| `empty-index` | `storybook/dist/index.json` | the build succeeds and the index holds no entry of type `story` |

Exit 2, checked before the build in this order: `storybook/package.json` missing or without a `build` script; the
Storybook CLI not resolvable from `storybook/node_modules` ("storybook is not installed; run pnpm install"); `pnpm` not
found. After a successful build: `dist/index.json` missing or not JSON. After a failed build (amendment 2026-11-13,
landing review L1-03, operator round `reviews/phase-2/round-2.md` O2-02, choice (a); FR-001's "configuration
unreadable", the spec unchanged), checked before any finding is read from the output: a build ended by a signal
(`storybook-build: could not run: the build was ended by a signal`), and Storybook's `MainFileEvaluationError` in the
output (`storybook-build: could not run: storybook/.storybook/main.ts cannot be evaluated (<the cleaned output line
that holds MainFileEvaluationError>)`); breaking plant `error-config-unreadable` (contracts/plants.md). Before the
amendment both ended exit 1 with one `build-error` at `storybook/package.json`. The CLI check is the only signal of missing
dependencies: the build itself gives none that names them (without the flag pnpm reinstalls them and the build passes;
with it the script fails `storybook: not found`, exit 127; research.md R-09, spike § 1).

The `visual` and `axe` gates build through the same build function, so the same command and environment.

## `visual` (check "Visual regression")

| | |
|---|---|
| Command | `pnpm run gate:visual -- --engine both --remove-docker-image` (CI; in CI the gate requires both engines in any case, research.md R-06; the option: research.md R-07, operator decision 2026-11-11) |
| Plant command | `node gates/bin/visual.ts --root {root} --engine {engine}` (form `repo-tree`; `{engine}`: research.md R-06) |
| Scope | every story of the built index, in `light` and `dark`, against `storybook/baselines/` |
| Options | `--engine <docker\|podman\|both\|auto\|host\|<name>>`, default `auto` (`both` in CI) (research.md R-06); `--remove-docker-image`: after run 1 under docker, remove docker's copy of the pin (`docker image rm <image>@<digest>`) before podman's pull, valid only when the resolved engines are docker then podman (research.md R-07); not part of the plant command or of `visual:update` |
| Exit 0 | `visual: <n> captures match their baselines (<engines>)`, where `<engines>` is `docker+podman`, or `<engine> only: no cross-engine comparison` (never in CI) |

Order of a run (operator decision 2026-11-11, "Apply now"; research.md R-06, R-07; the pure function `runSteps`):
engine resolution → the skopeo check and the `--remove-docker-image` check → reference form → pin check under run 1's
engine → build (R-03) → run 1 → with `--remove-docker-image`, the removal of docker's copy → pin check under run 2's
engine, when it is another engine → run 2 → per story-theme the verdict (data-model.md § Verdict per story-theme) →
stray baselines. Each engine's pin check passes before any capture under it; the removal touches only docker's image
store, after run 1's captures are read back.

| Rule | Location | When |
|---|---|---|
| `render-failed` | `<story-id>/<theme>` | the story module throws, its render throws, or its id is missing (message names the signal) |
| `render-timeout` | `<story-id>/<theme>` | no render signal within 15 s |
| `closed-shadow-root` | `<story-id>/<theme>` | an element of the story attaches a closed shadow root (message names the host tag) |
| `pointer-target` | `<story-id>/<theme>` | the story's pointer parameter is malformed, its selector matches no element or more than one, or its target's box is not wholly inside the 1280 × 800 viewport at scroll (0, 0) (`target outside the viewport`) |
| `font` | `<story-id>/<theme>` | text, form-control text (an input's value or placeholder, a button-type input's label) included, drawn by a face other than Schibsted Grotesk, or a face that is `loading` or `error`, or a used face not `loaded` (message lists the families) |
| `network` | `<story-id>/<theme>` | the story requested anything outside `127.0.0.1` (message names the URL) |
| `io` | `<story-id>/<theme>` | same-origin fetch, xhr, websocket, eventsource or ping other than Storybook's own files, a request for a path not in `dist`, a storage operation (Web Storage by method or named property, `document.cookie`, IndexedDB, the Cache API), a clipboard write or a beacon, or a cookie, storage key or IndexedDB database left when the render ends (message names each; research.md R-14) |
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
build failed ("the Storybook build failed; run pnpm run gate:storybook-build"); `--remove-docker-image` with engines
other than docker then podman ("--remove-docker-image needs both engines (docker for run 1, podman for run 2)", before
any engine command). A pin check failure under run 2's engine comes after run 1 and is the same exit 2.

Notes (stderr): `note: docker's copy of the pinned image was not removed: <last stderr line>` when the removal fails;
the run goes on.

## `visual:update` (the baseline command, not a gate)

`pnpm run visual:update [-- --engine <…>]` (`gates/bin/baselines.ts`). Same engine resolution, pin check, build and two
runs as `visual`. Applies `updatePlan` (research.md R-11): writes nothing and exits 1 when any `render-failed`,
`render-timeout`, `closed-shadow-root`, `pointer-target`, `font`, `network`, `io` or `nondeterministic` result exists
(printed as by the gate); exit 2 as the gate. Otherwise writes every baseline that is new or whose bytes changed,
deletes stray ones, and prints `baselines: wrote <n> files (<added> added, <changed> changed, <removed> removed),
<bytes> bytes in total`, where `<added>` counts the baselines written for a story-theme that had none before
(`missing-baseline`), `<changed>` those written over an existing baseline whose bytes differ, `<n>` = `<added>` +
`<changed>`, `<removed>` the stray files deleted and `<bytes>` the total size of the `<n>` files written (operator
decision 2026-11-11).

**Plant mode (research.md R-11, PLAN-FRESH-2-002):** `pnpm run visual:update -- --plant visual/<name> [--story <id>]
[--engine <…>]`. Materialises the plant's root with `gates/lib/plant-repo.ts` as the plant job does, then the same
engine resolution, pin check, build and two runs, with requests holding only the plant's own stories (index entries
whose `importPath` is a story file of the plant's `tree/`); `--story <id>` makes one single-story-theme request per
theme for that story only, and is required for a plant with `captureAlone` (`pass-second-render`). `updatePlan` over those story-themes; writes into
`gates/plants/visual/<name>/tree/storybook/baselines/` and removes stray files there; same output line. Exit 2, besides
the gate's causes: a gate other than `visual`, no such plant, a plant with no story of its own, a plant with
`baselinesOf` (`its baselines are those of <plant>`), a `--story` that is not one of the plant's own stories, a
`captureAlone` plant without `--story` (`<plant> is captured alone: give --story <id>`).

## `axe` (check "Accessibility")

| | |
|---|---|
| Command | `pnpm run gate:axe` |
| Plant command | `node gates/bin/axe.ts --root {root}` (form `repo-tree`) |
| Scope | every story of the built index, in `light` and `dark`, each in a browser context with the capture's options (`contextOptions(theme)`: 1280 × 800, scale 1, reduced motion, research.md R-08); context the whole document minus Storybook's harness nodes; axe-core 4.14.0 with the FR-016 rule set (harness-document rules not run) |
| Exit 0 | `axe: <runs> story-theme runs, 0 serious or critical; <notes> notes (<incomplete> incomplete, <excepted> excepted)` where `<runs>` = 2 × stories |

| Rule | Location | When |
|---|---|---|
| `<axe rule id>` | `<story-id>/<theme>` | a node of a violation of impact `serious` or `critical` not excepted; message `<impact>: <selector>` (one finding per node; `<selector>` printed by `printSelector`, shadow levels joined by ` >>> `, research.md R-08) |
| `<axe rule id>-incomplete` | `<story-id>/<theme>` | a node of an `incomplete` result of impact `serious` or `critical` not excepted; message `<impact>: <selector>` |
| `outside-root` | `<story-id>/<theme>` | an element child of `<body>` that is neither `#storybook-root`, a harness node nor a non-rendered element (message names its tag) |
| `closed-shadow-root` | `<story-id>/<theme>` | an element of the story attaches a closed shadow root (axe not run) |
| `pointer-target` | `<story-id>/<theme>` | as for `visual`, the target's viewport rule included, against the viewport of the context both gates open (axe not run) |
| `empty` | `<story-id>/<theme>` | the story root renders no content (research.md R-08; axe not run) |
| `render-failed` | `<story-id>/<theme>` | the story module throws, its render throws, or its id is missing (axe not run) |
| `render-timeout` | `<story-id>/<theme>` | no render signal within 15 s (axe not run) |
| `stale-exception` | `storybook/a11y-exceptions.json#<index>` | an honoured exception entry matches no node |
| `unrecorded-exception` | `storybook/a11y-exceptions.json#<index>` | the entry's `plan` file is missing or its Complexity Tracking holds no row with the entry's story, theme, rule, selector and sunset (the entry is not honoured) |

Notes (stderr): `note: <story-id>/<theme>: <rule-id>: <impact>: <selector>` for moderate and minor violations;
`… incomplete …` for moderate and minor incomplete results; `… excepted (<reason>)` for an honoured exception.

Exit 2: no browser; `axe-core` not found; `storybook/a11y-exceptions.json` not a list of complete entries, an entry
whose `plan` is not a feature plan (`storybook/a11y-exceptions.json#<index>: plan must be a feature plan, specs/<feature>/plan.md`, amendment
2026-11-13, landing review L1-04, operator round `reviews/phase-4/round-3.md` O3-01; data-model.md § Exception)
included; the Storybook build failed.

## The registry

`gates/gates.json` and the FR-020 list of `gates/lib/registry.ts` gain `storybook-build`, `visual` and `axe`; `ci.yml`
gains the jobs `storybook-build` ("Storybook build"), `visual` ("Visual regression") and `axe` ("Accessibility"). The
`visual` job uploads `storybook/.visual/` with `actions/upload-artifact` (pinned by SHA) when it fails. After its gate
step it runs the pin record step (research.md R-02, operator decision 2026-11-11, "Add the CI step"): `skopeo
--version`, `skopeo inspect --raw docker://<image>@<digest>`, `podman image inspect <image>@<digest>` and (operator
decision 2026-11-12, "Add the tag read") `skopeo inspect --raw docker://<image>:<tag>` with the tag from
`container.json`, written to `$RUNNER_TEMP/pin-record/` and uploaded as the artifact `pin-record`; the gate's output is
unchanged by it. Its gate step
passes `--remove-docker-image` (research.md R-07). Root `package.json` gains the scripts `gate:storybook-build`,
`gate:visual`, `gate:axe` and `visual:update`.

**The plant jobs (operator decision 2026-11-11, "In phase 3 now"; research.md R-07).** The plant job is split into
three jobs, and the check the ruleset requires is still the one named "Plants":

| Job | Name | Runs | Artifacts |
|---|---|---|---|
| `plants-plan` | Plants plan | `pnpm --silent run gate:plants -- --plan`, the shard numbers as the job output `shards` | |
| `plants-shard` | Plants shard | matrix `shard: ${{ fromJSON(needs.plants-plan.outputs.shards) }}`, `fail-fast: false`; `df -h /` (the free disk before the removal, plan decision 28); the toolset removal step with `df -h /` (kept: the operator chose A', plan decision 30); `pnpm run gate:plants -- --shard "$SHARD"` with `SHARD` from the matrix and `OCELLE_VISUAL_ENGINE=both`; `df -h /` always | `plant-shard-<k>`: `storybook/.visual/plant-shards/<k>.json`, always; `plants-<k>`: `storybook/.visual/plants/` (the failing `visual` pass plants' captures in tree layout; for a `captureAlone` plant, captures made alone by single-story-theme requests, never the full run's, research.md R-11), on failure |
| `plants` | Plants | `needs: [plants-plan, plants-shard]`, `if: always()`; downloads every `plant-shard-*` artifact into `storybook/.visual/plant-shards/` (`actions/download-artifact` pinned by SHA, `merge-multiple`) and runs `pnpm run gate:plants -- --verdict storybook/.visual/plant-shards` | |

The upload and download actions are pinned by commit SHA, and the uploads include hidden files. The verdict recomputes the
partition, so that every plant was judged does not rest on the matrix (contracts/plants.md § Shards). The registry check
(run by `--verdict`, and by `gate:plants` without a mode) treats `plants-plan` and `plants-shard` as the plant job's
helper jobs, not gate jobs; it fails (`skip-container-in-ci`) when a step of any of the three plant jobs contains
`--skip-container` (research.md R-07), and (`shard-in-plant-check`) when a step of the `plants` job contains `--shard`
or `--plan`, since the required check would then judge one shard or none. That CI compares docker with podman does not
rest on the workflow text: the gate requires both engines whenever `CI` or `GITHUB_ACTIONS` is `true` (research.md R-06).

**Amendment (2026-11-15, op 016, `ops/016-plants-affected`).** The registry check also fails (`affected-in-ci`) when
a step of any of the three plant jobs, `plants-plan`, `plants-shard` or `plants`, passes `--affected`: one finding on
`ci.yml` for each such job, in that order, with the message `the <job> job passes --affected, so CI would judge only
the plants a diff selects`. `--affected <base> [--list]` is a phase's local mode of `gate:plants` (contracts/plants.md
§ Shards, amendment of the same date); in CI it would make the required check judge only the plants a diff selects.
The registry plant `fail-affected-in-plant-check` proves the rule.
