# Gates of phase 3 (T071)

Run on 2026-11-22 on the green tree (one heavy job at a time, `OCELLE_VISUAL_ENGINE=docker`; podman is absent), under
the operator's CI-first rule (`reviews/operator-ci-first-decision.md`): the fast gates, the affected plants
(`plants.md`), the browser and visual tests this phase changes, and `gate:axe`, whose integration test pins the story
count this phase changes. `gate:unit-tests` (the whole suite), `gate:storybook-build`, `gate:visual`,
`gate:contrast` and `gate:brand-rules` are left to CI's required checks; `gate:signoff` runs on the phase's commits.

| Gate | Exit | Summary line |
|---|---|---|
| `gate:typecheck` | 0 | `typecheck: no type error in the files of tsconfig.json` |
| `gate:lint` | 0 | `lint: 458 files checked, no finding` |
| `gate:style-lint` | 0 | `style-lint: 43 files checked, no finding` |
| `gate:test-lint` | 0 | `test-lint: 337 files checked, no finding` |
| `gate:manifest` | 0 | `manifest: 23 elements checked, no finding` |
| `gate:config-copies` | 0 | `config-copies: .specify/extensions/story/story-config.yml and tooling/speckit/extensions/story/story-config.yml are identical` |
| `gate:csp` | 0 | `csp: 41 files checked, no finding` |
| `gate:prefix` | 0 | `prefix: 477 files checked, no finding` |
| `gate:axe` | 0 | `axe: 382 story-theme runs, 0 serious or critical; 84 notes (0 incomplete, 84 excepted)` |

The fourteen chain stories add no axe note (the 84 are 006's ten and phase 1's 74). The first scoped plant run found
`color-contrast-incomplete` (`bgOverlap`) on the long-step story in both themes: axe reads the gap between the two
line boxes of an inline `part="content"` span as an overlap (a two-line step only; one and three lines were clean).
The step's content part is now a block inside its inline-block host (`packages/elements/src/ocelle-evidence-step.ts`),
which renders the same pixels (`visual:update` after the change: `(0 added, 0 changed, 0 removed)`), and the run above
is after it. The `visual:update` line of T069 (#10's pinned container under docker):

```text
baselines: wrote 28 files (28 added, 0 changed, 0 removed), 513240 bytes in total
```

## Tests run locally for what this phase changes

| Run | Result |
|---|---|
| `vitest run --project elements` on `evidence-chain.test.ts`, the two chain entry tests, `entry-root`, `define` and `exports` | 39 passed |
| `vitest run --project elements-browser packages/elements/test/browser/evidence-chain.test.ts` | 23 passed |
| `vitest run --project elements-node packages/elements/test/node` | 749 passed |
| `vitest run --project elements-build packages/elements/test/build/build.test.ts` | 28 passed |
| `vitest run --project styles --project styles-browser packages/styles` | 216 passed |
| `vitest run --project storybook-integration storybook/test/integration/elements-stories.test.ts -t evidence-chain` | 60 passed |
| `vitest run --project gates gates/test/manifest.test.ts`, `--project gates-integration gates/test/integration/manifest.test.ts` | 15 and 1 passed |

## Pinned counts the phase moves (gates/test)

The gates' tests pin the repository's element and story counts; they follow the two elements and fourteen stories
(phase 3 spike Q1 (b)): manifest 21 to 23 elements, storybook-build 177 to 191 stories, visual, axe and the plant
tree's baselines 354 to 382 story-themes, and the axe plant run of the unlabelled-button fixture 356 to 384. They
changed in the red commit with the other tests. The axe count was checked by the `gate:axe` run above; the
storybook-build, visual and plant-tree counts follow from the 14 stories and 28 baselines and are judged by CI.

## Red run

`red.sh 3 phase` on e82e535: `"tests_only": true`, `"red": true`, `unit-tests: 178 of 7765 tests failed` (log
`red-phase.log`, the pnpm store path redacted). Every new body fails on an `AssertionError` for the missing
behaviour: the 23 shared bodies in both harnesses and the no-loop test, the entry, define, root and build bodies, the
node bodies (manifest, records-pairs, chain-no-pill, 41 README statements and rows), the styles bodies (block 3's two
chain rules, their header comment and the README and CHANGELOG lines), the 59 story bodies (the stories are written at
green) and the gates' pinned counts. `exports.test.ts` passes at red: the scaffold already exports the two classes.
