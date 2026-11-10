# Quickstart: validating the Storybook workbench

Prerequisites: `pnpm install --frozen-lockfile`; the packages built (`pnpm --filter "./packages/*" -r build`); a
browser for axe (`pnpm exec playwright install chromium`, or `OCELLE_CHROMIUM_PATH` pointing at a Chromium); docker or
podman for the visual gate. In this sandbox: start the docker daemon first (`dockerd > /tmp/dockerd.log 2>&1 &`, then
wait until `docker info` succeeds), and set
`OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` for the host-browser tests.

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

Change a token value in `packages/tokens/src/source.ts`, rebuild the packages, rerun: exit 1 with `differs` findings
and images in `storybook/.visual/`. Delete one baseline: `missing-baseline`. Revert.

`pnpm run gate:visual -- --engine host` exits 2 "not the pinned container". In CI the job runs `--engine both`.

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

In CI the Plants job runs every plant with `OCELLE_VISUAL_ENGINE=both`.
