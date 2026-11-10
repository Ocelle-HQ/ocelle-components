# Data model: Storybook workbench

Sources: spec.md Key Entities; research.md; contracts/.

## Story (from `storybook/dist/index.json`)

| Field | Rule |
|---|---|
| `id` | Storybook's story id, `[a-z0-9-]+--[a-z0-9-]+`; unique in the index |
| `title`, `name` | as Storybook gives them; used in messages only |
| `type` | `story` entries are stories; `docs` entries are ignored |

Parsed by `gates/lib/storybook-index.ts`: an index whose `entries` is missing, or an entry without `id` or `type`, is
"could not run" (exit 2). The story list is in index order; the gates report counts from it.

## Story-theme

`(story id, theme)`, theme ∈ {`light`, `dark`}. Written `<story-id>/<theme>` as a finding location. Every story has
exactly two.

## Capture

| Field | Rule |
|---|---|
| story-theme | as above |
| run | 1 or 2 |
| engine | `docker` or `podman` (the engine of that run) |
| status | `captured`, `render-failed`, `render-timeout`, `closed-shadow-root`, `pointer-target`, `font`, `network`, `io` (contracts/container.md) |
| bytes | the normalised PNG, present only when `captured` |

## Baseline

`storybook/baselines/<story-id>.<theme>.png`. A file name that does not parse as `<id>.<light|dark>.png`, or whose
story-theme is not in the index, is stray. Its bytes are compared exactly with run 1's capture.

## Verdict per story-theme (visual)

Decided in this order, first match wins, one finding at most per story-theme:

1. either run `render-failed` → `render-failed`
2. either run `render-timeout` → `render-timeout`
3. either run `closed-shadow-root` → `closed-shadow-root`
4. either run `pointer-target` → `pointer-target`
5. either run `font` → `font`
6. either run `network` → `network`
7. either run `io` → `io`
8. run 1 bytes ≠ run 2 bytes → `nondeterministic`
9. no baseline → `missing-baseline`
10. run 1 bytes ≠ baseline bytes → `differs`
11. otherwise: match

Then one `stray-baseline` finding per stray file. The baseline command's `updatePlan` refuses (writes nothing) when
any story-theme ends at steps 1 to 8; otherwise it writes the changed baselines and removes the stray ones.

## Pin (`storybook/visual/container.json`)

Fields and rules in contracts/container.md. States: **valid** (digest form `sha256:<64 hex>` of an image manifest,
platform `linux/amd64`, `node` = `.node-version`, `browser` = `chromium_headless_shell-<revision>` of Playwright's
`chromium-headless-shell` entry) or **invalid** (exit 2 naming the field). The pulled image matches the pin when its
`RepoDigests` lists `<image>@<digest>` and it is `linux`/`amd64`; its `.Id` is not compared.

## axe result per story-theme

| Kind | Effect |
|---|---|
| violation, impact `serious` or `critical`, node not excepted | finding `<rule>`, one per node |
| incomplete, impact `serious` or `critical`, node not excepted | finding `<rule>-incomplete`, one per node |
| either of the above, node excepted by an honoured entry | note `excepted` |
| violation, impact `moderate` or `minor` | note |
| incomplete, impact `moderate` or `minor` | note `incomplete` |
| element child of `<body>` outside the root and the harness | finding `outside-root`, one per element |
| closed shadow root attached | finding `closed-shadow-root` (axe not run) |
| pointer parameter wrong | finding `pointer-target` (axe not run) |
| empty root | finding `empty` (axe not run) |
| render failure | finding `render-failed` (axe not run) |
| no render signal within 15 s | finding `render-timeout` (axe not run) |

The context is the whole document minus Storybook's harness nodes; the harness-document rules (FR-016) are not run.

## Exception (`storybook/a11y-exceptions.json`)

`[{ "story": "<id>", "theme": "light|dark", "rule": "<axe rule id>[-incomplete]", "selector": "<selector>",
"reason": "…", "sunset": "…", "plan": "specs/<feature>/plan.md" }]`. Every field a non-empty string. An entry is
**honoured** only when its `plan` file exists in the root under test and that file's `## Complexity Tracking` section
holds a table row naming the same story, theme, rule and selector (each in backticks) and the sunset; otherwise it is
`unrecorded-exception` and excepts nothing. An honoured entry matches only the one serious or critical node of that
rule with that selector in that story-theme. An honoured entry that matched no node in a run is `stale-exception`.

## Gate finding

`<location>: <gate-id>: <rule>: <message>`, per `gates/lib/findings.ts`. Locations: `<story-id>/<theme>`, a
repository-relative file path, or `storybook/a11y-exceptions.json#<index>`.

## Pointer state (story parameter)

`parameters.ocelle.pointer`: `{ "hover": "<selector>" }` or `{ "press": "<selector>" }`, exactly one key, the selector
matching exactly one element of the story area (the whole document minus Storybook's harness nodes, research.md R-08
Terms; not only the story root). Applied after `STORY_RENDERED`, before fonts settle, by the capture and
the axe gate; anything else is `pointer-target`.

## Plant keys (new)

| Key | Values | Valid for |
|---|---|---|
| `engine` | `both`, `host`, `missing` | `visual` plants |
| `unlinked` | `["storybook/node_modules"]` | `storybook-build`, `visual` and `axe` plants |
