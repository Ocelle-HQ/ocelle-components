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
| status | `captured`, `render-failed`, `font`, `network` (contracts/container.md) |
| bytes | the normalised PNG, present only when `captured` |

## Baseline

`storybook/baselines/<story-id>.<theme>.png`. A file name that does not parse as `<id>.<light|dark>.png`, or whose
story-theme is not in the index, is stray. Its bytes are compared exactly with run 1's capture.

## Verdict per story-theme (visual)

Decided in this order, first match wins, one finding at most per story-theme:

1. either run `render-failed` → `render-failed`
2. either run `font` → `font`
3. either run `network` → `network`
4. run 1 bytes ≠ run 2 bytes → `nondeterministic`
5. no baseline → `missing-baseline`
6. run 1 bytes ≠ baseline bytes → `differs`
7. otherwise: match

Then one `stray-baseline` finding per stray file.

## Pin (`storybook/visual/container.json`)

Fields and rules in contracts/container.md. States: **valid** (digest form `sha256:<64 hex>`, platform
`linux/amd64`, `node` = `.node-version`, `browser` = Playwright's expected Chromium build) or **invalid** (exit 2
naming the field).

## axe result per story-theme

| Kind | Effect |
|---|---|
| violation, impact `serious` or `critical`, node not excepted | finding, one per node |
| violation, impact `serious` or `critical`, node excepted | note `excepted` |
| violation, impact `moderate` or `minor` | note |
| incomplete, any impact | note `incomplete` |
| empty root | finding `empty` (axe not run) |
| render failure | finding `render-failed` (axe not run) |

## Exception (`storybook/a11y-exceptions.json`)

`[{ "story": "<id>", "theme": "light|dark", "rule": "<axe rule id>", "reason": "…", "sunset": "…" }]`. Every field a
non-empty string. Matches every serious or critical node of that rule in that story-theme. An entry that matched no
node in a run is `stale-exception`. Each entry has a row in plan.md's Complexity Tracking with the operator's
approval (checked at review).

## Gate finding

`<location>: <gate-id>: <rule>: <message>`, per `gates/lib/findings.ts`. Locations: `<story-id>/<theme>`, a
repository-relative file path, or `storybook/a11y-exceptions.json#<index>`.
