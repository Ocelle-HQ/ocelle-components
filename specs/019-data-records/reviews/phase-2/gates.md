# Gates of phase 2 (T048)

Run on 2026-11-21 on the green tree (one heavy job at a time, `OCELLE_VISUAL_ENGINE=docker`; podman is absent), under
the operator's CI-first rule (`reviews/operator-ci-first-decision.md`): the fast gates, the affected plants
(`plants.md`), the browser and visual tests this phase changes, and `gate:axe`, whose integration test pins the story
count this phase changes. `gate:unit-tests` (the whole suite), `gate:storybook-build`, `gate:visual`,
`gate:contrast` and `gate:brand-rules` are left to CI's required checks; `gate:signoff` runs on the phase's commits.

| Gate | Exit | Summary line |
|---|---|---|
| `gate:typecheck` | 0 | `typecheck: no type error in the files of tsconfig.json` |
| `gate:lint` | 0 | `lint: 449 files checked, no finding` |
| `gate:style-lint` | 0 | `style-lint: 41 files checked, no finding` |
| `gate:test-lint` | 0 | `test-lint: 330 files checked, no finding` |
| `gate:manifest` | 0 | `manifest: 21 elements checked, no finding` |
| `gate:config-copies` | 0 | `config-copies: .specify/extensions/story/story-config.yml and tooling/speckit/extensions/story/story-config.yml are identical` |
| `gate:csp` | 0 | `csp: 39 files checked, no finding` |
| `gate:prefix` | 0 | `prefix: 463 files checked, no finding` |
| `gate:axe` | 0 | `axe: 354 story-theme runs, 0 serious or critical; 84 notes (0 incomplete, 84 excepted)` |

The thirteen timeline stories add no axe note (the 84 are 006's ten and phase 1's 74). The `visual:update` line of
T046 (#10's pinned container under docker):

```text
baselines: wrote 26 files (26 added, 0 changed, 0 removed), 422292 bytes in total
```

## Tests run locally for what this phase changes

| Run | Result |
|---|---|
| `vitest run --project elements packages/elements/test/event-timeline.test.ts` | 30 passed |
| `vitest run --project elements-browser packages/elements/test/browser/event-timeline.test.ts packages/elements/test/browser/driver.test.ts` | 76 passed |
| `vitest run --project elements` on the entry, root, define, exports and driver files | 59 passed |
| `vitest run --project elements-node` on `readme`, `changelog`, `records-pairs` and `manifest` | passed |
| `vitest run --project elements-build packages/elements/test/build/build.test.ts` | 26 passed |
| `vitest run --project styles --project styles-browser packages/styles` | 210 passed |
| `vitest run --project storybook-integration storybook/test/integration/elements-stories.test.ts -t event-timeline` | 56 passed |
| `vitest run --project gates gates/test/manifest.test.ts`, `--project gates-integration gates/test/integration/manifest.test.ts` | 15 and 1 passed |

## Pinned counts the phase moves (gates/test)

The gates' tests pin the repository's element and story counts; they follow the two elements and thirteen stories:
manifest 19 to 21 elements (`gates/test/manifest.test.ts`, `gates/test/integration/manifest.test.ts`),
storybook-build 164 to 177 stories, visual, axe and the plant tree's baselines 328 to 354 story-themes, and the axe
plant run of the unlabelled-button fixture 330 to 356. The axe count was checked by the `gate:axe` run above; the
storybook-build, visual and plant-tree counts follow from the 13 stories and 26 baselines and are judged by CI.

## Red run

`red.sh 2 phase` on 5a2ab3a: `"tests_only": true`, `"red": true`, `unit-tests: 191 of 7596 tests failed` (log
`red-phase.log`, the pnpm store path redacted). Every new body fails on an `AssertionError` for the missing behaviour.
Beside them, at the red commit: `gates/test/manifest.test.ts` (5) and `gates/test/integration/manifest.test.ts` (1)
fail because the scaffold's two declarations are not yet in the committed manifest (regenerated at green, T044, and
the pinned count raised), and two `gates/test/integration/plant-repo.test.ts` bodies timed out at 5 000 ms under the
full suite's load; the file passes at green when run alone (33 passed, the 354 baselines included).
