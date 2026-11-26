# Storybook

The Storybook of this repository (`@ocelle/storybook`, a private workspace, never published) is the visual source of
truth (constitution V). Its build is the preview only (`storybook build --preview-only`), and three merge gates read
it: `pnpm run gate:storybook-build`, `pnpm run gate:visual` and `pnpm run gate:axe` (`gates/README.md`). This note
tells an element issue how to add its stories so that each gets baselines in both themes and an axe run.

## Adding stories for an element

- Stories go in `storybook/stories/<name>.stories.ts`, one file per element, in Storybook's CSF format with the HTML
  renderer (`@storybook/html-vite`); the existing `icon.stories.ts` and `brand-mark.stories.ts` are examples.
- Each variant and each state of an element is one story.
- A hover or press state is declared with the pointer parameter,
  `parameters: { ocelle: { pointer: { hover: "<selector>" } } }` or `{ press: "<selector>" }`: exactly one key, its
  selector matching exactly one element the story renders. The gates apply it with the mouse after the story renders.
  The target's box must lie wholly inside the initial 1280 × 800 viewport at scroll position 0, 0; otherwise the
  visual and axe gates fail the story with `pointer-target`.
- The harness captures every story in light and in dark and runs axe on both, so a story is not written twice, once
  per theme (the theme global sets `data-theme` on the preview's `<html>`).
- Elements use open shadow roots: a closed shadow root fails the visual and axe gates with `closed-shadow-root`, since
  axe cannot audit its text.
- Elements render every surface (menus, popovers, dialogs, tooltips) inside their own host: an element a story adds
  outside the story root fails the axe gate with `outside-root`.
- An element's shadow styles set the font of its form controls (`font: inherit`), since the document's base rule does
  not reach them: text drawn in any face other than Schibsted Grotesk fails the visual gate with `font`.
- Each element package proves run-time strict CSP in its own browser tests, not in the Storybook: the Storybook is not
  served under a CSP, and the `csp` gate covers the packages' built output only. The browser test serves the element
  page with constitution IV's header and a `securitypolicyviolation` collector.

## Pane action footer recipe

Open **Recipes → Pane action footer** in Storybook to see a primary action alone, a secondary action
before the primary, a Back action before the primary, and a pane with no configured steps.

Keep each footer after its pane content in normal flow. The desktop example uses the same 72 px minimum for both
footers at default text size. Give the step indicator the remaining space at the start and place one token-spaced
action group at the end. Put the primary button last in the DOM so reading and Tab order agree. When space is tight,
the indicator compacts other labels while keeping their accessible names and displaying the current label. The
footer can grow as actions wrap, leaving room around the buttons for their focus outlines.

Listen for `ocelle-button-activate` in the host. Supply the new steps, pane content and action labels together.
The recipe updates the primary button in place when moving from Choose to Confirm, so focus stays on the
same native control. The step indicator supplies progress semantics and the host owns navigation.
A separate browser fixture mounts the same recipe with external assets under strict CSP.

## Baselines

- Baselines are committed in `storybook/baselines/`, one file per story and theme, named `<story-id>.<theme>.png`.
- One command produces them: `pnpm run visual:update`. It builds the Storybook, captures every story in light and
  dark twice in the pinned linux/amd64 container (`storybook/visual/container.json`, under docker or podman; with
  podman, skopeo too), writes every baseline that is new or changed, removes stray ones, and prints how many files it
  wrote and their size. It writes nothing when a story fails a check or its two captures differ.
- To inspect a difference, run `pnpm run gate:visual`: it keeps each differing capture and an image marking the
  differing pixels in `storybook/.visual/` (ignored), the differing pixels in magenta.
- Commit the files `pnpm run visual:update` writes in `storybook/baselines/` with the change that moved them.
- On an arm64 host the capture runs the linux/amd64 image under emulation and is slower.
- CI's captures are the record: when a local capture and CI's disagree, take the files of the `baselines/` folder of
  the "Visual regression" job's artifact `visual` and commit them in `storybook/baselines/` (and delete the stray
  files the job names).
- A pull request that changes a baseline says why in its description (constitution V).

## Plant baselines

- A change that moves a plant story's pixels (a token value, `base.css`, the pinned container) regenerates the
  `visual` pass plants' own baselines with the plant mode: `pnpm run visual:update -- --plant visual/<name>`, which
  writes them to `gates/plants/visual/<name>/tree/storybook/baselines/`.
- When a CI "Plants shard" job fails on such a plant, its artifact `plants-<k>` holds the captures at
  `gates/plants/visual/<name>/tree/storybook/baselines/`; commit them at those paths.
- `pass-second-render`'s baselines are captures made alone, one single-story-theme request per theme:
  `pnpm run visual:update -- --plant visual/pass-second-render --story <id>`, and its artifact holds captures made
  alone, never the full run's.
