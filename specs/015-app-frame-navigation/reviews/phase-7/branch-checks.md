# Phase 7 branch verification

The [Phase 6 hosted run](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/44990366919) passed all 140 jobs on `793f19b`. Phase 7 changes package docs, documentation assertions and verification records. Final-head hosted results are pending publication. The pull request CI jobs below control landing.

| Gate | Command | Controlling pull-request check |
| --- | --- | --- |
| `typecheck` | `pnpm run gate:typecheck` | Typecheck |
| `lint` | `pnpm run gate:lint` | Code lint |
| `style-lint` | `pnpm run gate:style-lint` | Style lint |
| `unit-tests` | `pnpm run gate:unit-tests` | Unit tests |
| `test-lint` | `pnpm run gate:test-lint` | Test lint |
| `mutation` | `pnpm run gate:mutation -- --base <sha>` | Mutation testing. Use the PR base supplied by the workflow and the aggregate mutation verdict. |
| `csp` | `pnpm run gate:csp` | Content security. Build all packages before the gate. The local built shell probe also passed. |
| `prefix` | `pnpm run gate:prefix` | Prefix. Build the workspace before the gate. |
| `config-copies` | `pnpm run gate:config-copies` | Story config copies |
| `pins` | `pnpm run gate:pins` | Install and pins |
| `signoff` | `pnpm run gate:signoff -- --range <base>..<head>` | Sign-off. Use the full pull-request commit range. |
| `contrast` | `pnpm run gate:contrast` | Contrast |
| `brand-rules` | `pnpm run gate:brand-rules` | Brand rules |
| `manifest` | `pnpm run gate:manifest` | Custom-elements manifest |
| `storybook-build` | `pnpm run gate:storybook-build` | Storybook build |
| `visual` | `pnpm run gate:visual -- --engine both --remove-docker-image` | Visual regression. Use the committed pin with Docker and Podman on CI. |
| `axe` | `pnpm run gate:axe` | Accessibility |
| `plants` | `pnpm run gate:plants -- --verdict storybook/.visual/plant-shards` | Plants. Aggregate all hosted plant shards. |

## Local checks

- Under enforced CSP, the built shell resized its frame across tiers, opened the drawer by keyboard, focused the projected destination, dismissed the drawer back to the menu, and skipped to main. The next Tab reached the first content action. The console, CSP, failed-request and outside-request recorders were empty.
- Both package documentation suites passed all 1,013 assertions.
- The TDD checker returned `exempt` for the documentation, documentation assertions and evidence scope. Phase 6 keeps the runtime red and green evidence.
- The 600 pinned visual baselines already cover every story in light and dark. Phase 7 keeps the story inventory, baseline pixels and browser pins from Phase 6.
- The repository Typecheck, Test lint, Install and pins, and Story config copies commands passed locally.
