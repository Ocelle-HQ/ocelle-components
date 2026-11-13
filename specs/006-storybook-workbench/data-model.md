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

## Text node (font check input, research.md R-05)

| Field | Rule |
|---|---|
| families | the platform families `CSS.getPlatformFontsForNode` reports; `[]` for text not rendered (not a finding) |
| user-agent shadow | `true` when the node lies in a form control's user-agent shadow root (an input's value or placeholder, a button-type input's label) |
| computed family | the computed `font-family` of the node's parent element, or of its host control when user-agent shadow |

Every non-whitespace text node of the story area, found by CDP `DOM.getDocument({ depth: -1, pierce: true })`, open
and user-agent shadow roots included; a user-agent shadow node belongs to the story area when its host control does.

## I/O record (research.md R-14)

One entry per recorded operation or left-behind item, with its kind and name: a same-origin request (resource type
and path), a Web Storage method call or named-property get, set or delete (`localStorage` or `sessionStorage`, key),
a `document.cookie` get or set, an IndexedDB `open` or `deleteDatabase` (database), a Cache API call (cache), a
clipboard write (`write`, `writeText`, `execCommand` copy or cut), a beacon, and from `context.storageState({
indexedDB: true })` and the page's `sessionStorage` after the render each cookie, storage key and IndexedDB database
left. An entry not on Storybook's allow-list (kind and exact name) makes the capture's condition `io`.

## Baseline

`storybook/baselines/<story-id>.<theme>.png`. A file name that does not parse as `<id>.<light|dark>.png`, or whose
story-theme is not in the index, is stray. Its bytes are compared exactly with run 1's capture.

## Verdict per story-theme (visual)

Decided in this order, first match wins, one finding at most per story-theme. Steps 1 to 7 are also the order in
which one capture chooses its single status when several conditions hold in it (`captureStatus`, research.md R-05;
for example `font` over `io`):

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
any story-theme ends at steps 1 to 8; otherwise it writes the baselines of the story-themes that end at step 9
(`missing-baseline`, counted as **added**) and at step 10 (`differs`, counted as **changed**) and removes the stray
ones. Its summary line (contracts/gates.md § `visual:update`) reports `<n>` = added + changed files written, the added,
changed and removed counts, and the bytes written.

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
The browser context of each axe run has the capture's options, `contextOptions(theme)` (viewport 1280 × 800, scale
1, colour scheme, reduced motion, forced colours, locale, timezone; research.md R-08).

## Exception (`storybook/a11y-exceptions.json`)

`[{ "story": "<id>", "theme": "light|dark", "rule": "<axe rule id>[-incomplete]", "selector": "<selector>",
"reason": "…", "sunset": "…", "plan": "specs/<feature>/plan.md" }]`. Every field a non-empty string. An entry is
**honoured** only when its `plan` file exists in the root under test and that file's `## Complexity Tracking` section
holds a table row naming the same story, theme, rule and selector (each in backticks) and the sunset; otherwise it is
`unrecorded-exception` and excepts nothing. The `plan` text, as written, must name a feature plan: it matches
`^specs/[^/]+/plan\.md$` with a feature segment other than `.` and `..`; any other `plan` makes the file malformed,
"could not run" (`storybook/a11y-exceptions.json#<index>: plan must be a feature plan, specs/<feature>/plan.md`), so no file other than a plan,
which a plan review reads, can carry the row (amendment 2026-11-13, landing review L1-04, operator round
`reviews/phase-4/round-3.md` O3-01; FR-029 and the constitution's Governance name the plan's Complexity Tracking). An
honoured entry matches only the one serious or critical node of that
rule with that selector in that story-theme. An honoured entry that matched no node in a run is `stale-exception`.

`<selector>` is the node's axe target as the gate prints it (`printSelector`, research.md R-08): the shadow levels of
a target joined by ` >>> ` (`ocelle-button >>> button`), frame levels by ` >>frame>> `, each level's selector as axe
gives it. In the plan's Complexity Tracking row the selector is in backticks with each `|` written `\|`.

In a plant root the file is `[]` unless the plant's `tree/` supplies one; `delta.json` `exceptions: "repository"`,
which every `axe` plant sets, appends the repository's entries and copies the plan files they name (research.md R-16).

## Gate finding

`<location>: <gate-id>: <rule>: <message>`, per `gates/lib/findings.ts`. Locations: `<story-id>/<theme>`, a
repository-relative file path, or `storybook/a11y-exceptions.json#<index>`.

## Pointer state (story parameter)

`parameters.ocelle.pointer`: `{ "hover": "<selector>" }` or `{ "press": "<selector>" }`, exactly one key, the selector
matching exactly one element of the story area (the whole document minus Storybook's harness nodes, research.md R-08
Terms; not only the story root), whose bounding box lies wholly inside the initial 1280 × 800 viewport (`contextOptions(theme).viewport`, the
same for the capture and the axe gate) at scroll
position (0, 0) (operator decision on PLAN-FRESH-2-001, option (a)). Applied after `STORY_RENDERED` and the scroll
check (the page scrolled back to (0, 0) when a story moved it), before fonts settle, by the capture and the axe gate,
with `page.mouse` only; anything else is `pointer-target` (a target outside the viewport: `target outside the
viewport`). The screenshot is taken at scroll position (0, 0) as well (research.md R-04).

## Plant keys (new)

| Key | Values | Valid for |
|---|---|---|
| `engine` | `both`, `host`, `missing` | `visual` plants |
| `unlinked` | `["storybook/node_modules"]` | `storybook-build`, `visual` and `axe` plants |
| `baselinesOf` | the name of a `visual` pass plant holding baselines | `visual` fail plants with no `storybook/baselines/` file in their `tree/` |
| `captureAlone` | `true`: baselines only from single-story-theme requests (plant mode requires `--story`; the runner's CI artifact holds captures made alone, never the full run's; research.md R-11) | `visual` pass plants with stories of their own and no `baselinesOf` (`pass-second-render`) |

## Plant delta keys (new, `delta.json`)

| Key | Values | Effect |
|---|---|---|
| `baselines` | `[{ "file": "<story-id>.<theme>.png", "edit": "one-pixel" \| "reencode" \| "remove" }]` | applied to the current repository baseline when the root is materialised (research.md R-11) |
| `exceptions` | `"repository"` | the root's exceptions file gets the repository's entries after the tree's own, and the plan files they name; required on every `axe` plant (research.md R-16) |
