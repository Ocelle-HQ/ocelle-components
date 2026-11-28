# Initials trigger verification

The official tests-only commit was `bf1c0e77600f3344b24ee063dc1758fb88677eb9`, based on `303f034669a010d5f73a596d1d4906767dc53d90`. The red runner recorded 25 failures at intended assertion lines. The separate tests-only Unicode correction `d93001b5bdd5e70dc87b939c55c75ecfcf9c4dea` recorded four more intended failures against the initial green. On the corrected source and assets at `4a4fe0d8df740d0747819af99c0a4a12ada6272b`, all 29 behavioral cases and ten existing horizontal-rail regression cases passed. The six selected files exercised source Chromium, built strict-CSP fixtures, the generated public manifest and built Storybook.

```sh
pnpm exec vitest run packages/elements/test/{,browser/}{button,personal-rail}.test.ts packages/elements/test/node/manifest.test.ts storybook/test/integration/elements-stories.test.ts -t 'Unicode whitespace boundaries|Initials|initials trigger stories|declares ocelle-button with|US4-3|US4-9'
```

| Check | Observed result |
| --- | --- |
| Typecheck | No type errors |
| Production lint | 763 files, no findings |
| Test lint | 581 files, no findings |
| Style lint | 88 files, no findings |
| Contrast | 207 pairs in light and 215 in dark |
| Generated manifest | 52 elements, no findings |
| Manifest preflight | Eight overlays with all seeded findings intact, the reordered case clean, and no missing snapshots |
| Strict CSP | 93 built files, no findings |
| Storybook build | 431 stories, including the standalone, busy, disabled and personal-rail initials examples |
| Scoped Axe | Eight light and dark story-theme runs, zero serious or critical results, zero notes, incomplete results or exceptions |

The additional built-story keyboard probe at 320 CSS px and a measured 32 px root exercised the four stories in light, dark and forced colours. The native targets measured 88 × 88 CSS px. The enabled standalone and rail triggers each sent one host intent per Enter and Space. Busy and disabled sent none. The fixture stayed within the viewport. Run the following from the repository root and compare its 12 observations with `story-keyboard.json`.

```sh
pnpm run gate:storybook-build
node specs/040-chrome-glyphs-initials/reviews/phase-2/story-keyboard.mjs
```

Two local pinned Docker passes on the initial green’s product, story and baseline blobs reproduced the eight stored images. The corrected candidate then reproduced all eight committed PNG digests in both pinned Docker and Podman at tested merge `a837ffdd0e44f0886b25ba1174dd9dc6ea329af2`. The pin, revision and eight digests are in `visual-capture.json`. [Hosted scoped capture](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46112115759)

An additional pair of pinned Docker captures applying the visual Plant’s exact light `color-ink` delta (`#5A1E1E`) reproduced all eight, so the existing expected-finding list held. The empty-index Plant already stubs both affected story modules.

## Unicode boundary probes

The inputs `A\uFE0F` and `\u034F\u0301` are each a single extended grapheme cluster. Removing either boundary anchor from the whole-cluster default-ignorable test produced the corresponding rejection and failed both source and built Chromium consumers. Both consumers passed with the anchored check.

On the corrected candidate, separate detached-worktree experiments removed the start and end anchors from the Unicode whitespace match in turn. Each partial match incorrectly accepted an internally separated value. Both source and strict-CSP Chromium consumers failed the existing exact-text/fallback assertion in each experiment. The production expression consumes the entire value and accepts padding on both sides in one match.

## Final replay and hosted inventory

The seeded Axe fixture adds one story in two themes. Candidate `66da4da78d73cc2d94e6748f188ad4e59fe04a0b` corrected its expected summary to 864 story-theme runs and retained the two critical unlabelled-button findings and 132 exception notes. The production, stories and baselines match the Unicode-corrected source candidate. The manifest preflight repeated on this final candidate and yielded the same eight overlay results.

The structured TDD check passed on this exact head. It reproduced all 25 original red assertions on the phase base and all four correction assertions on the source before the fix. The eight selected local green suites passed. The four deferred integration suites listed below passed in the required hosted Unit run on tested merge `2f08c51b6c7aefb205c301685f248c21fa3923cd`. [Hosted Unit aggregate](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46112847765/job/140887087675)

| Deferred suite | Hosted shard | Passed cases |
| --- | ---: | ---: |
| `gates/test/integration/axe.test.ts` | 3 | 4 |
| `gates/test/integration/visual-capture.test.ts` | 2 | 4 |
| `gates/test/integration/visual-findings.test.ts` | 0 | 1 |
| `gates/test/integration/visual.test.ts` | 1 | 1 |
