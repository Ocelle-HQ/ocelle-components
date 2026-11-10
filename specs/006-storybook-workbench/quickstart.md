# Quickstart: validating the Storybook workbench

Prerequisites: `pnpm install --frozen-lockfile` (the Storybook gates need no package build); a browser for axe
(`pnpm exec playwright install chromium`, or `OCELLE_CHROMIUM_PATH` pointing at a Chromium); docker or podman for the
visual gate, with about 1 GB to pull and 3.6 GB of disk per engine for the pinned image. In this sandbox: start the
docker daemon first (`dockerd > "$SCRATCH/dockerd.log" 2>&1 &`, then wait until `docker info` succeeds), set
`OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` for the host-browser tests, and leave `CI`
and `GITHUB_ACTIONS` unset (with either set to `true`, the visual gate requires both docker and podman).

## 1. Storybook build (US1)

```sh
pnpm run gate:storybook-build        # exit 0: "storybook-build: built 12 stories"
```

Break a story's syntax: exit 1, one `build-error` finding naming the file. Restore it.

## 2. Visual regression (US2)

```sh
pnpm run gate:visual                 # exit 0: "visual: 24 captures match their baselines (docker only: no cross-engine comparison)"
pnpm run visual:update               # rewrites storybook/baselines/; git diff is empty on an unchanged tree
```

Change a token value in `packages/tokens/src/source.ts`, rerun: exit 1 with `differs` findings, images in
`storybook/.visual/` and the new captures in baseline layout in `storybook/.visual/baselines/`. Delete one baseline:
`missing-baseline`. Revert.

`pnpm run gate:visual -- --engine host` exits 2 "not the pinned container: …". In CI the job runs `--engine both`, and
the gate requires both engines there in any case. When CI reports `differs` or `missing-baseline` on a tree whose local
run passes, take the files of the job artifact's `baselines/` folder and commit them (CI is the producer of record).

## 3. Accessibility (US3)

```sh
pnpm run gate:axe                    # exit 0: "axe: 24 story-theme runs, 0 serious or critical; …"
```

Add a story with `<button></button>`: exit 1 with `button-name` findings for both themes. Remove it.

## 4. CSP retarget and documentation (US4)

```sh
pnpm --filter "./packages/*" -r build && pnpm run gate:csp   # packages only
pnpm -r build && pnpm run gate:prefix                         # still covers storybook/dist/*.html
pnpm test                                                     # includes the render test and the contributor-note test
```

## 5. Plants

```sh
OCELLE_VISUAL_ENGINE=auto pnpm run gate:plants                # locally (docker only)
pnpm run gate:plants -- --skip-container                      # without an engine: partial, names each skipped plant
```

Without an engine and without `--skip-container`, the plant job runs no `visual` plant that needs one, prints
`plants: not run (no container engine): <plant>` for each and exits 2. In CI the Plants job runs every plant with
`OCELLE_VISUAL_ENGINE=both`.

A change that moves a plant story's pixels (a token value, `base.css`, the pin) regenerates the `visual` pass plants'
own baselines:

```sh
pnpm run visual:update -- --plant visual/pass-unused-face                    # writes tree/storybook/baselines/ of that plant
pnpm run visual:update -- --plant visual/pass-second-render --story <id>     # single-story-theme requests (required: captureAlone)
```

When CI's Plants job fails on such a plant, its artifact holds the captures at
`gates/plants/visual/<name>/tree/storybook/baselines/`; commit them at those paths. For `pass-second-render` the artifact
holds captures made alone (never the full run's); when the job prints `captured alone matches the baseline; the full
run differs (freshness)`, there is nothing to commit: freshness is broken and the capture code needs fixing.
