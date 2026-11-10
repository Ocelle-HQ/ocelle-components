# Contract: plants of the three gates, and the plant changes

Every plant is a `repo-tree` plant under `gates/plants/<gate-id>/<name>/` (`plant.json` plus `tree/`), per
`specs/001-repository-foundation/contracts/plants.md`. Expected findings are exact. Story files in a plant's `tree/`
replace or add to `storybook/stories/`; a plant that needs fewer stories replaces the story files it keeps and removes
none of the configuration set.

## `storybook-build`

| Plant | Expect | Findings or cause |
|---|---|---|
| `fail-syntax-error` | fail | `storybook/stories/broken.stories.ts`: `build-error` |
| `fail-unresolved-import` | fail | `storybook/stories/missing.stories.ts`: `build-error` |
| `fail-not-csf` | fail | `storybook/stories/nodefault.stories.ts`: `index-error` (no default export) |
| `fail-empty-index` | fail | `storybook/dist/index.json`: `empty-index` (a stories glob that matches files with no story export) |
| `pass-repository` | pass | the repository's stories |
| `pass-type-error-only` | pass | a story with a type error that is valid syntax (the `typecheck` gate's) |
| `error-no-build-script` | error | cause `storybook/package.json has no build script` (research.md R-09, spec delta) |

## `visual`

| Plant | Expect | Findings or cause |
|---|---|---|
| `fail-token-changed` | fail | a `delta.json` token change of `color-ink` (light): `differs` on every story-theme that shows it (listed exactly after phase 3's spike) |
| `fail-missing-baseline` | fail | one baseline removed: `missing-baseline` |
| `fail-stray-baseline` | fail | `storybook/baselines/gone--story.light.png`: `stray-baseline` |
| `fail-same-pixels-other-bytes` | fail | one baseline re-encoded at another deflate level: `differs` |
| `fail-random` | fail | a story with `Math.random()` in its markup: `nondeterministic` on both themes |
| `fail-other-font` | fail | a story whose text uses `font-family: serif`: `font` on both themes |
| `fail-network` | fail | a story with an `<img>` from `https://example.com/`: `network` on both themes |
| `fail-throws-on-load` | fail | a story module that throws when loaded: `render-failed` on both themes |
| `pass-repository` | pass | the repository's stories and baselines |
| `pass-animation-and-caret` | pass | a story with a running CSS animation and a focused text field, with its baselines |
| `pass-second-render` | pass | a story that changes its markup on its second render in a page, with its baselines |
| `error-host` | error | `engine: "host"`; cause `not the pinned container` |
| `error-no-engine` | error | `engine: "missing"`; cause `no container engine: ocelle-no-such-engine not found` |
| `error-tag-pin` | error | `storybook/visual/container.json` naming a tag instead of a digest; cause `not pinned by digest` |
| `error-build-fails` | error | a story with a syntax error; cause `the Storybook build failed` |

## `axe`

| Plant | Expect | Findings or cause |
|---|---|---|
| `fail-unlabelled-button` | fail | `<id>/light` and `<id>/dark`: `button-name` (critical), one node each |
| `fail-two-low-contrast` | fail | `color-contrast` (serious) on two nodes, in each theme it fails (measured in phase 4's spike) |
| `fail-empty` | fail | an empty story: `empty` on both themes |
| `fail-no-box` | fail | a story whose root holds only `display: none` elements: `empty` on both themes |
| `fail-throws-on-load` | fail | `render-failed` on both themes |
| `fail-stale-exception` | fail | `storybook/a11y-exceptions.json#0`: `stale-exception` |
| `pass-repository` | pass | the repository's stories |
| `pass-minor-only` | pass | a story whose only violation is of minor or moderate impact |
| `pass-incomplete` | pass | a story whose only serious result is `incomplete` (text over a background image) |
| `pass-excepted` | pass | a story with a serious violation and its matching exception entry |
| `error-build-fails` | error | cause `the Storybook build failed` |
| `error-bad-exceptions` | error | an exception entry without a `reason`; cause `a11y-exceptions.json` |

## `csp` (changed, research.md R-10)

Removed: `fail-storybook-inline-script`, `fail-storybook-preview-new-function`, `fail-storybook-scripts-eval`,
`fail-storybook-story-style-attribute`, `pass-storybook-external-script`, `pass-storybook-scripts-tag-names`,
`error-storybook-unparsable-ts`. Added: `pass-storybook-out-of-scope` (an inline script in `storybook/dist/index.html`
and a `style` attribute in a story's markup; the gate passes).

## `plants` (the registry)

Added: `fail-skip-container-in-ci` (a `ci.yml` whose `plants` job passes `--skip-container`; finding on that file).

## Plant runner changes

- `plant.json` gains the optional key `engine` (`both`, `host`, `missing`), valid only for plants of the `visual`
  gate; the runner substitutes `{engine}` with it, else with `$OCELLE_VISUAL_ENGINE`, else `both`; `missing` is
  substituted as `ocelle-no-such-engine`. `engine` on another gate's plant makes the plant invalid.
- `--skip-container` (research.md R-07).
