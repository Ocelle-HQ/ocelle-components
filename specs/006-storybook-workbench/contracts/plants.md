# Contract: plants of the three gates, and the plant changes

Every plant is a `repo-tree` plant under `gates/plants/<gate-id>/<name>/` (`plant.json` plus `tree/`), per
`specs/001-repository-foundation/contracts/plants.md`. Expected findings are exact. A plant root holds the extended
configuration set, the Storybook workspace included, and the `storybook/node_modules` link (research.md R-16). Story
files in a plant's `tree/` replace or add to `storybook/stories/`; a plant that needs fewer stories replaces the story
files it keeps and removes none of the configuration set. Where a plant's exact findings depend on the existing stories
(`fail-token-changed`), the phase 1 spike lists them.

## `storybook-build`

| Plant | Expect | Findings or cause |
|---|---|---|
| `fail-syntax-error` | fail | `storybook/stories/broken.stories.ts`: `build-error` |
| `fail-unresolved-import` | fail | `storybook/stories/missing.stories.ts`: `build-error` |
| `fail-not-csf` | fail | `storybook/stories/nodefault.stories.ts`: `index-error` (no default export) |
| `fail-empty-index` | fail | `storybook/dist/index.json`: `empty-index` (a stories glob that matches files with no story export) |
| `pass-repository` | pass | the repository's stories |
| `pass-type-error-only` | pass | a story with a type error that is valid syntax (the `typecheck` gate's) |
| `error-missing-dependencies` | error | `unlinked: ["storybook/node_modules"]`; cause `storybook is not installed; run pnpm install` (FR-017's missing dependencies) |
| `error-no-build-script` | error | cause `storybook/package.json has no build script` |

## `visual`

| Plant | Expect | Findings or cause |
|---|---|---|
| `fail-token-changed` | fail | a `delta.json` token change of `color-ink` (light): `differs` on every story-theme that shows it (listed exactly by the phase 1 spike) |
| `fail-one-pixel` | fail | one baseline of one story-theme with one pixel changed (a valid normalised PNG): exactly one `differs` at that story-theme (SC-006) |
| `fail-missing-baseline` | fail | one baseline removed: `missing-baseline` |
| `fail-stray-baseline` | fail | `storybook/baselines/gone--story.light.png`: `stray-baseline` |
| `fail-same-pixels-other-bytes` | fail | one baseline re-encoded at another deflate level: `differs` |
| `fail-below-fold` | fail | a story whose root is 2000 px tall, with its baselines; the tree changes only an element below y = 800: `differs` on both themes (FR-012) |
| `fail-overflow-changed` | fail | the story of `pass-overflow-and-popover` with its baselines; the tree changes only the overflowing child: `differs` on both themes (FR-012) |
| `fail-random` | fail | a story with `Math.random()` in its markup: `nondeterministic` on both themes |
| `fail-other-font` | fail | a story whose text uses `font-family: serif`: `font` on both themes |
| `fail-font-not-loaded` | fail | a story whose text uses an `@font-face` whose source is a path not in `dist`, so the face ends in `error`: `font` on both themes |
| `fail-network` | fail | a story with an `<img>` from `https://example.com/`: `network` on both themes |
| `fail-same-origin-fetch` | fail | a story that calls `fetch("/api/items")`: `io` on both themes |
| `fail-local-storage` | fail | a story that calls `localStorage.setItem`: `io` on both themes |
| `fail-closed-shadow-root` | fail | a story whose element attaches a closed shadow root: `closed-shadow-root` on both themes |
| `fail-throws-on-load` | fail | a story module that throws when loaded: `render-failed` on both themes |
| `fail-render-throws` | fail | a story whose render function throws: `render-failed` on both themes |
| `fail-hover-style-changed` | fail | the `pass-hover-and-press` stories with their baselines; the tree changes only the `:hover` rule: `differs` on both themes of the hovered story |
| `fail-pointer-target-missing` | fail | a story whose `pointer.hover` selector matches no element: `pointer-target` on both themes |
| `pass-repository` | pass | the repository's stories and baselines (Storybook's own unused Nunito Sans faces declared, not findings) |
| `pass-unused-face` | pass | a story that declares a second `@font-face` it does not use, with its baselines |
| `pass-animation-and-caret` | pass | a story with a running CSS animation and a focused text field, with its baselines (control: research.md R-04) |
| `pass-second-render` | pass | a story that shows a coloured block on any render after the first in a page, with baselines made by single-story-theme requests (research.md R-11) |
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
| `fail-throws-on-load` | fail | `render-failed` on both themes |
| `fail-render-throws` | fail | a story whose render function throws: `render-failed` on both themes |
| `fail-stale-exception` | fail | `storybook/a11y-exceptions.json#0`: `stale-exception` (entry and plan row present, no matching node) |
| `fail-unrecorded-exception` | fail | an entry whose `plan` file holds no matching Complexity Tracking row: `storybook/a11y-exceptions.json#0`: `unrecorded-exception`, and the node's own finding |
| `fail-excepted-second-node` | fail | the `pass-excepted` story with a second node of the excepted rule: one finding for the second node only |
| `pass-repository` | pass | the repository's stories (the harness-document rules not run) |
| `pass-minor-only` | pass | a story whose only violation is of minor or moderate impact |
| `pass-excepted` | pass | a story with a serious violation, its exception entry (with `selector`) and a plan file in `tree/` whose Complexity Tracking holds the row |
| `pass-excepted-incomplete` | pass | the `fail-incomplete` story with an exception entry for `color-contrast-incomplete` and its plan row |
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

## Plant runner changes

- `plant.json` gains the optional key `engine` (`both`, `host`, `missing`), valid only for plants of the `visual`
  gate; the runner substitutes `{engine}` with it, else with `$OCELLE_VISUAL_ENGINE`, else `both`; `missing` is
  substituted as `ocelle-no-such-engine`. `engine` on another gate's plant makes the plant invalid.
- `plant.json` gains the optional key `unlinked`, a list whose only allowed value is `"storybook/node_modules"`, valid
  only for plants of `storybook-build`, `visual` and `axe`: the plant root then has no `storybook/node_modules` link
  (research.md R-16). Any other value or gate makes the plant invalid.
- The plants of `storybook-build`, `visual` and `axe` run one at a time, after the other plants (research.md R-07).
- `--skip-container`, and the engine probe with `plants: not run (no container engine): <plant>` and exit 2
  (research.md R-07).
