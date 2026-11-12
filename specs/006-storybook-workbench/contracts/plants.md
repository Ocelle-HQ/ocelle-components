# Contract: plants of the three gates, and the plant changes

Every plant is a `repo-tree` plant under `gates/plants/<gate-id>/<name>/` (`plant.json` plus `tree/`), per
`specs/001-repository-foundation/contracts/plants.md`. Expected findings are exact. A plant root holds the extended
configuration set, the Storybook workspace included, and the `storybook/node_modules` link (research.md R-16). Story
files in a plant's `tree/` replace or add to `storybook/stories/`; a plant that needs fewer stories replaces the story
files it keeps and removes none of the configuration set, so every plant root holds every repository story (operator
decision on PLAN-FRESH-2-007, option (b); its cost and sunset: research.md R-07, plan Complexity Tracking). Where a
plant's exact findings depend on the existing stories (`fail-token-changed`), the phase 1 spike lists them, and a pull
request that adds a story changing them updates the list in the same change.

No plant `tree/` holds a copy of a repository baseline: a plant edits or removes one by its `delta.json` `baselines`
key, applied to the current file (research.md R-11). Pass plants with stories of their own hold those stories'
baselines, produced by `pnpm run visual:update -- --plant visual/<name>` (contracts/gates.md); fail plants that
compare against them name the pass plant in `baselinesOf`. A plant root's `storybook/a11y-exceptions.json` is `[]`
unless its `tree/` supplies one; every `axe` plant sets `delta.json` `exceptions: "repository"`, which appends the
repository's entries and copies the plan files they name (research.md R-16).

## `storybook-build`

| Plant | Expect | Findings or cause |
|---|---|---|
| `fail-syntax-error` | fail | `storybook/stories/broken.stories.ts`: `build-error` |
| `fail-unresolved-import` | fail | `storybook/stories/missing.stories.ts`: `build-error` |
| `fail-not-csf` | fail | `storybook/stories/nodefault.stories.ts`: `index-error` (no default export) |
| `fail-empty-index` | fail | `storybook/dist/index.json`: `empty-index` (a stories glob that matches files with no story export) |
| `pass-repository` | pass | the repository's stories |
| `pass-type-error-only` | pass | a story with a type error that is valid syntax (the `typecheck` gate's) |
| `error-missing-dependencies` | error | `unlinked: ["storybook/node_modules"]`; cause `storybook is not installed; run pnpm install` (FR-017's missing dependencies), given only by the gate's CLI check: the build, run with `--config.verify-deps-before-run=false`, neither reinstalls nor names them (research.md R-09) |
| `error-no-build-script` | error | cause `storybook/package.json has no build script` |

## `visual`

| Plant | Expect | Findings or cause |
|---|---|---|
| `fail-token-changed` | fail | a `delta.json` token change of `color-ink` (light): `differs` on every story-theme that shows it (listed exactly by the phase 1 spike) |
| `fail-one-pixel` | fail | `delta.json` `baselines: [{ "file": "tokens--colour.light.png", "edit": "one-pixel" }]`, applied to the current repository baseline: exactly one `differs` at `tokens--colour/light` (SC-006) |
| `fail-missing-baseline` | fail | `delta.json` `baselines: [{ "file": "tokens--colour.light.png", "edit": "remove" }]`: `missing-baseline` at `tokens--colour/light` |
| `fail-stray-baseline` | fail | `storybook/baselines/gone--story.light.png`: `stray-baseline` |
| `fail-same-pixels-other-bytes` | fail | `delta.json` `baselines: [{ "file": "tokens--colour.dark.png", "edit": "reencode" }]` (same pixels, deflate level 1): exactly one `differs` at `tokens--colour/dark` |
| `fail-below-fold` | fail | `baselinesOf: "pass-below-fold"`; the tree changes only an element below y = 800 of that story: `differs` on both themes (FR-012) |
| `fail-overflow-changed` | fail | `baselinesOf: "pass-overflow-and-popover"`; the tree changes only the overflowing child of that story: `differs` on both themes (FR-012) |
| `fail-popover-changed` | fail | `baselinesOf: "pass-overflow-and-popover"`; the tree changes only the content of that story's open top-layer `popover` (its text), nothing else: `differs` on both themes (FR-012's top layer; analysis G3) |
| `fail-random` | fail | a story with `Math.random()` in its markup: `nondeterministic` on both themes |
| `fail-other-font` | fail | a story whose text uses `font-family: serif`: `font` on both themes |
| `fail-input-system-font` | fail | a custom element whose open shadow root holds an `<input value="…">` and an `<input placeholder="…">` with no font rule (their text in user-agent shadow roots, drawn in a system face): `font` on both themes (research.md R-05) |
| `fail-font-not-loaded` | fail | a story whose text uses an `@font-face` whose source is a file in `dist` holding bytes that are not font data, so the face ends in `error` with no `io`: `font` on both themes |
| `fail-font-file-missing` | fail | a story whose text uses an `@font-face` whose source is a path not in `dist` (both `io` and `font` hold): `font` on both themes, the winner by data-model.md's order (research.md R-05) |
| `fail-network` | fail | a story with an `<img>` from `https://example.com/`: `network` on both themes |
| `fail-same-origin-fetch` | fail | a story that calls `fetch("/api/items")`: `io` on both themes |
| `fail-local-storage` | fail | a story that calls `localStorage.setItem`: `io` on both themes |
| `fail-storage-property` | fail | a story that writes `localStorage.k = "v"` (a named property, no method call): `io` on both themes (research.md R-14) |
| `fail-cookie` | fail | a story that sets `document.cookie`: `io` on both themes |
| `fail-indexeddb` | fail | a story that opens an IndexedDB database with `indexedDB.open`: `io` on both themes |
| `fail-xhr` | fail | a story that sends an `XMLHttpRequest` for `/api/items`: `io` on both themes (analysis C1) |
| `fail-websocket` | fail | a story that opens ``new WebSocket(`ws://${location.host}/socket`)``: `io` on both themes (analysis C1) |
| `fail-session-storage` | fail | a story that calls `sessionStorage.setItem`: `io` on both themes (analysis C1) |
| `fail-cache-api` | fail | a story that calls `caches.open("ocelle-plant")`: `io` on both themes (analysis C1) |
| `fail-clipboard-write` | fail | a story that calls `navigator.clipboard.writeText("ocelle")` (recorded whether the promise resolves or rejects): `io` on both themes (analysis C1) |
| `fail-exec-copy` | fail | a story that calls `document.execCommand("copy")`: `io` on both themes (analysis C1) |
| `fail-beacon` | fail | a story that calls `navigator.sendBeacon("/api/beacon")`: `io` on both themes (analysis C1) |
| `fail-storage-left-by-worker` | fail | a story whose render starts a dedicated worker from a `Blob` URL that opens the IndexedDB database `ocelle-left`, and resolves only after the worker reports it open; init scripts do not run in workers, so the recorder sees no call and only the storage-state read finds the database: `io` on both themes, its message naming `ocelle-left` as left when the render ends (R-14's backstop; analysis C1). If T040 finds the recorder records the worker's call, or the database is not in the storage state, stop and ask: the plant would not prove the backstop |
| `fail-closed-shadow-root` | fail | a story whose element attaches a closed shadow root: `closed-shadow-root` on both themes |
| `fail-throws-on-load` | fail | a story module that throws when loaded: `render-failed` on both themes |
| `fail-render-throws` | fail | a story whose render function throws: `render-failed` on both themes |
| `fail-hover-style-changed` | fail | `baselinesOf: "pass-hover-and-press"`; the `pass-hover-and-press` stories, the tree changing only the `:hover` rule: `differs` on both themes of the hovered story |
| `fail-press-style-changed` | fail | `baselinesOf: "pass-hover-and-press"`; the `pass-hover-and-press` stories, the tree changing only the `:active` rule of the pressed story: `differs` on both themes of the pressed story (FR-031; analysis G4) |
| `fail-pointer-target-missing` | fail | a story whose `pointer.hover` selector matches no element: `pointer-target` on both themes |
| `fail-pointer-target-below-fold` | fail | a 2000 px tall story whose `pointer.hover` target lies at y = 1500: `pointer-target` (`target outside the viewport`) on both themes |
| `pass-repository` | pass | the repository's stories and baselines (Storybook's own unused Nunito Sans faces declared, not findings) |
| `pass-input-font` | pass | the `fail-input-system-font` element with `font: inherit` on its inputs in its shadow styles, with its baselines |
| `pass-unused-face` | pass | a story that declares a second `@font-face` it does not use, with its baselines |
| `pass-animation-and-caret` | pass | a story with a running CSS animation and a focused text field, with its baselines (control: research.md R-04) |
| `pass-second-render` | pass | `captureAlone: true`; a story that shows a coloured block on any render after the first in a page, with baselines made only by single-story-theme requests (`--plant visual/pass-second-render --story <id>`; in CI's artifact, captures made alone, never the full run's; research.md R-11) |
| `pass-below-fold` | pass | a story whose root is 2000 px tall, with its baselines (the full-page height, FR-012) |
| `pass-focus-below-fold` | pass | a 2000 px tall story that focuses a text field at y = 1500 and holds a `position: fixed; top: 0` element, with baselines showing that element at the top of the page (the scroll reset, research.md R-04) |
| `pass-overflow-and-popover` | pass | a story with an absolutely positioned child overflowing its root and an open top-layer `popover`, with its baselines |
| `pass-hover-and-press` | pass | two stories, one with `pointer.hover`, one with `pointer.press`, with their baselines |
| `error-host` | error | `engine: "host"`; cause `not the pinned container` |
| `error-no-engine` | error | `engine: "missing"`; cause `no container engine: ocelle-no-such-engine not found` |
| `error-tag-pin` | error | `storybook/visual/container.json` naming a tag instead of a digest; cause `not pinned by digest` |
| `error-index-pin` | error | `storybook/visual/container.json` naming the tag's index digest (recorded by the phase 1 spike); cause `the pin names an index` |
| `error-build-fails` | error | a story with a syntax error; cause `the Storybook build failed` |

## `axe`

| Plant | Expect | Findings or cause |
|---|---|---|
| `fail-unlabelled-button` | fail | `<id>/light` and `<id>/dark`: `button-name` (critical), one node each |
| `fail-two-low-contrast` | fail | `color-contrast` (serious) on two nodes, in each theme it fails (measured by the phase 1 spike) |
| `fail-incomplete` | fail | a story whose only serious result is a `color-contrast` incomplete (text over a background image): `color-contrast-incomplete` on each theme it occurs in (measured by the phase 1 spike) |
| `fail-empty` | fail | an empty story: `empty` on both themes |
| `fail-no-box` | fail | a story whose root holds only `display: none` elements: `empty` on both themes |
| `fail-outside-root` | fail | a story that appends an unlabelled `<button>` to `document.body`: `outside-root` and `button-name` on both themes |
| `fail-closed-shadow-root` | fail | a story whose element attaches a closed shadow root holding an unlabelled button: `closed-shadow-root` on both themes |
| `fail-hover-reveals-unlabelled` | fail | a story with `pointer.hover` whose hover shows an unlabelled button: `button-name` on both themes |
| `fail-pointer-target-below-fold` | fail | the story of the `visual` plant of that name: `pointer-target` (`target outside the viewport`) on both themes (axe not run) |
| `fail-hover-near-fold` | fail | a story whose `pointer.hover` target lies at y = 740 to 780 (inside the 1280 × 800 viewport, outside Playwright's default 720 px one) and whose hover shows an unlabelled button: `button-name` on both themes (research.md R-08, R-15) |
| `fail-open-shadow-unlabelled` | fail | a custom element whose open shadow root holds an unlabelled `<button>`: `button-name` (critical) on both themes, selector `<host tag> >>> button` (research.md R-08) |
| `fail-throws-on-load` | fail | `render-failed` on both themes |
| `fail-render-throws` | fail | a story whose render function throws: `render-failed` on both themes |
| `fail-stale-exception` | fail | `storybook/a11y-exceptions.json#0`: `stale-exception` (entry and plan row present, no matching node) |
| `fail-unrecorded-exception` | fail | an entry whose `plan` file holds no matching Complexity Tracking row: `storybook/a11y-exceptions.json#0`: `unrecorded-exception`, and the node's own finding |
| `fail-excepted-second-node` | fail | the `pass-excepted` story with a second node of the excepted rule: one finding for the second node only |
| `pass-repository` | pass | the repository's stories, with the repository's exception entries and the plan files they name (`exceptions: "repository"`, as every axe plant: today the ten `base-styles--prose-document` `color-contrast-incomplete` entries and `specs/006-storybook-workbench/plan.md`); the harness-document rules not run |
| `pass-minor-only` | pass | a story whose only violation is of minor or moderate impact |
| `pass-excepted` | pass | a story with a serious violation, its exception entry (with `selector`) and a plan file in `tree/` whose Complexity Tracking holds the row |
| `pass-excepted-incomplete` | pass | the `fail-incomplete` story with an exception entry for `color-contrast-incomplete` and its plan row |
| `pass-excepted-shadow` | pass | the `fail-open-shadow-unlabelled` story with an exception entry per theme whose `selector` is `<host tag> >>> button`, and its plan rows |
| `pass-second-render` | pass | a story whose button loses its label on any render after the first in a page |
| `error-build-fails` | error | cause `the Storybook build failed` |
| `error-bad-exceptions` | error | an exception entry without a `reason`; cause `a11y-exceptions.json` |

## `csp` (changed, research.md R-10)

Removed: `fail-storybook-inline-script`, `fail-storybook-preview-new-function`, `fail-storybook-scripts-eval`,
`fail-storybook-story-style-attribute`, `pass-storybook-external-script`, `pass-storybook-scripts-tag-names`,
`error-storybook-unparsable-ts`. Added: `pass-storybook-out-of-scope` (an inline script in `storybook/dist/index.html`
and a `style` attribute in a story's markup; the gate passes).

## `prefix` (changed, research.md R-10)

Added: `fail-storybook-html-multiline-monospace` (a `storybook/dist/iframe.html` with an inline `<style>` whose
`font-family:` value ends in `monospace` on the next line): one finding at the line where the declaration starts.

## `plants` (the registry)

Added: `fail-skip-container-in-ci` (a `ci.yml` whose `plants` job passes `--skip-container`; finding on that file).

Added by the split of the plant job (operator decision 2026-11-11, "In phase 3 now"; research.md R-07):
`fail-skip-container-in-shard` (a `ci.yml` with the three plant jobs whose `plants-shard` job passes
`--skip-container`: `skip-container-in-ci` on that file), `fail-shard-in-plant-check` (a `ci.yml` whose `plants` job
runs `gate:plants -- --shard 1`: `shard-in-plant-check` on that file) and `pass-split-plant-jobs` (a `gates.json` and a
`ci.yml` with the three plant jobs as contracts/gates.md § The registry gives them: no finding, so `plants-plan` and
`plants-shard` are not taken for gate jobs). `fail-skip-container-in-ci` keeps its single `plants` job: the rule still
covers it.

## Plant runner changes

- `plant.json` gains the optional key `engine` (`both`, `host`, `missing`), valid only for plants of the `visual`
  gate; the runner substitutes `{engine}` with it, else with `$OCELLE_VISUAL_ENGINE`, else `both`; `missing` is
  substituted as `ocelle-no-such-engine`. `engine` on another gate's plant makes the plant invalid.
- `plant.json` gains the optional key `unlinked`, a list whose only allowed value is `"storybook/node_modules"`, valid
  only for plants of `storybook-build`, `visual` and `axe`: the plant root then has no `storybook/node_modules` link
  (research.md R-16). Any other value or gate makes the plant invalid.
- `plant.json` gains the optional key `baselinesOf`, the name of a `visual` pass plant holding baselines, valid only
  for `visual` fail plants whose own `tree/` holds no file under `storybook/baselines/` (research.md R-16).
- `plant.json` gains the optional key `captureAlone` (only `true`), valid only for `visual` pass plants with stories of
  their own and no `baselinesOf`: the plant's baselines come only from single-story-theme requests (research.md R-11,
  R-16). Any other value or plant makes the plant invalid.
- `delta.json` gains the optional keys `baselines` (a list of `{ "file", "edit" }`, edits `one-pixel`, `reencode`,
  `remove`, applied to the current repository baseline; research.md R-11) and `exceptions` (only `"repository"`;
  research.md R-16). An `axe` plant without `exceptions: "repository"` is invalid. `treeProblems` refuses a tree file
  under `storybook/baselines/` whose name the repository's `storybook/baselines/` holds.
- The plants of `storybook-build`, `visual` and `axe` run one at a time, after the other plants (research.md R-07).
- When a `visual` pass plant fails with `differs` or `missing-baseline` on story-themes of its own stories, the runner
  copies run 1's captures of those to `storybook/.visual/plants/gates/plants/visual/<name>/tree/storybook/baselines/`;
  for a `captureAlone` plant it copies none of run 1's captures but makes single-story-theme requests for those
  story-themes in the same root and engine (two runs) and copies those captures, except one equal to the committed
  baseline, for which it prints `plants: visual/<name>: <story-id>/<theme>: captured alone matches the baseline; the
  full run differs (freshness)`; CI's captures made alone are the record for that plant (research.md R-11);
  the `plants` job uploads `storybook/.visual/plants/` on failure (research.md R-11); since the split, each
  `plants-shard` job uploads its own as `plants-<k>` (contracts/gates.md § The registry).
- `--skip-container`, and the engine probe with `plants: not run (no container engine): <plant>` and exit 2
  (research.md R-07).
- **Each plant's time (operator decision 2026-11-11, "Measure first"; research.md R-07).** After judging each plant,
  in every mode, `gate:plants` prints on stderr `note: plant time: <gate>/<case>: <seconds> s` (`<gate>` `plants` for
  the registry's plants; seconds with one decimal, from the start of the plant's root to its judgement). The note is a
  pure function of the plant and the elapsed milliseconds, unit-tested; the clock is injected into `plants()`. The
  stdout lines (findings and the summary `plants: <n> plants of <g> gates and the registry judged, every plant as
  expected`) are unchanged.

## Shards (operator decision 2026-11-11, "In phase 3 now"; research.md R-07)

`gate:plants` gains three modes; without one it is unchanged (every plant in one process, the registry check first).

| Mode | Does | stdout on success | Exit 2 (besides the single run's causes) |
|---|---|---|---|
| `--plan` | computes `plantShards` on the repository's plants | the shard numbers as one JSON line, `[1,2,…,n]` | |
| `--shard <k>` | judges exactly the plants of shard `k` (no registry check, no structural check of the whole set), as the single run would (concurrency, Storybook plants one at a time, the engine probe, `--skip-container`, the captures copy), and writes the report | `plants: shard <k> of <n>: <m> plants judged, every plant as expected` (findings and `plants: <p> problems in <m> plants` as the single run, exit 1) | `k` not in `1..n` (`there is no shard <k>; the plan has <n>`) |
| `--verdict <dir>` | the registry check, the structural checks of the whole set (unknown gate, a gate without a fail, pass or breaking plant, an invalid `plant.json`), `plantShards` recomputed, and the reports in `<dir>` | the single run's summary line, `plants: <n> plants of <g> gates and the registry judged, every plant as expected`, `<n>` counting every shard's plants | a shard `1..n` with no report (`shard <k> of <n> reported no result`), a report that is not valid or names a shard outside `1..n` or an `of` other than `n`, a report whose plants are not exactly its shard's (`shard <k> judged other plants than the partition gives it: <plant>`), a report with a skipped or not-run plant (as the single run's causes) |

`--verdict` prints, as findings, the registry check's findings, the structural problems, and every problem line the
reports hold (exit 1, summary `plants: <p> problems in <n> plants`), as the single run would have printed them.

`plantShards(plants, size)` (`gates/lib/plant-runner.ts`, pure, unit-tested): shard 1 holds every plant of the gates
other than `visual` and `axe` and the registry's plants; then the `visual` plants sorted by `<case>` in consecutive
groups of at most `size`; then the `axe` plants the same way; a gate with no plants adds no shard; every plant is in
exactly one shard. `size` is 8, provisional until tasks.md T046h derives it from the measured times.

The report `storybook/.visual/plant-shards/<k>.json` (the directory is ignored with `storybook/.visual/`), written by
`--shard <k>` whatever its exit:

```json
{
  "shard": 2,
  "of": 7,
  "plants": [
    { "plant": "visual/error-host", "asExpected": true, "lines": [], "seconds": 41.7 }
  ],
  "skipped": [],
  "notRun": []
}
```

`plant` is `<gate>/<case>`; `lines` are the problem lines the single run would print for that plant; `seconds` the
time of its note. A shard that exits 2 before judging any plant writes no report, and the verdict then names it.
