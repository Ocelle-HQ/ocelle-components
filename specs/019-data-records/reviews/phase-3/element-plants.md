# Element plants of phase 3 (T073)

Each plant was applied to the green source of the working tree that became the green commit (`packages/elements/src/ocelle-evidence-chain.ts`, `packages/elements/src/ocelle-evidence-step.ts` or `packages/styles/src/base.css`), its guard bodies run, and the source restored (byte-compared with the green copy afterwards); nothing was committed. Guards: `pnpm exec vitest run <args>`; the in-process names are truncated after about 40 characters, so each `-t` pattern matches the start of the body's name. Every plant bites.

| Plant | Guard (`vitest run` arguments) | Result | Failing body | Failing assertion (first lines of the diff) |
|---|---|---|---|---|
| the step marker's `aria-hidden` removed | `--project elements packages/elements/test/evidence-chain.test.ts -t US3-1 ` | fails (bites) | US3-1 one list named Evidence, six list… | `-     "all": true,` / `+     "all": false,` / `-       "Spec",` |
| `data-line-end` never set | `--project elements packages/elements/test/evidence-chain.test.ts -t US3-2\|US3-3` | fails (bites) | US3-2 at 1280 px six steps in one row f… | `-     false,` / `+     true,` / `-     "ok",` |
| the ordinal counting only default steps | `--project elements packages/elements/test/evidence-chain.test.ts -t US3-6` | fails (bites) | US3-6 a step added, removed or hidden, … | `+       "3",` / `+       "chip",` / `-       "chip",` |
| the chip radius `radius-pill` | `--project elements packages/elements/test/evidence-chain.test.ts -t US3-4` | fails (bites) | US3-4 a chip beside default steps: no m… | `-     "pill": false,` / `-     "radius": true,` / `+     "pill": true,` |
| the chip block padding `space-1` | `--project elements packages/elements/test/evidence-chain.test.ts -t US3-4` | fails (bites) | US3-4 a chip beside default steps: no m… | `-     "shorter": true,` / `+     "shorter": false,` |
| the chip `<li>` without the reserved line box | `--project elements packages/elements/test/evidence-chain.test.ts -t mixed chips` | fails (bites) | mixed chips on one row: each connector'… | `-     true,` / `-     true,` / `+     false,` |
| the chip's box rule moved inside the variant block | `--project elements packages/elements/test/evidence-chain.test.ts -t US3-8` | fails (bites) | US3-8 light and dark: step and chip tex… | `-     "chip": true,` / `+     "chip": false,` |
| a connector drawn as a `background-color` | `--project elements packages/elements/test/evidence-chain.test.ts -t US3-8` | fails (bites) | US3-8 light and dark: step and chip tex… | `-       "rgba(0, 0, 0, 0)",` / `+       "rgb(77, 70, 58)",` / `-     "connector": true,` |
| the ring in `rule` | `--project elements packages/elements/test/evidence-chain.test.ts -t US3-8` | fails (bites) | US3-8 light and dark: step and chip tex… | `-     "ring": true,` / `+     "ring": false,` / `-     "ring": true,` |
| the chip outline in `control-border` | `--project elements packages/elements/test/evidence-chain.test.ts -t US3-8` | fails (bites) | US3-8 light and dark: step and chip tex… | `-     "chip": true,` / `+     "chip": false,` / `-     "chip": true,` |
| the line-end callback also toggling `padding-inline-end` | `--project elements packages/elements/test/evidence-chain.test.ts -t no ResizeObserver loop\|around 1280` | fails (bites) | around 1280 → 600 → 320 px and back, a step's text changed,  | `Error: layout: #c did not settle in 10 frames` (the planted padding toggle makes the line ends oscillate, so the layout wait after the first resize never settles) |
| `pill` written into the chain's styles | `--project elements-node packages/elements/test/node/chain-no-pill.test.ts` | fails (bites) | ocelle-evidence-chain.ts and ocelle-evidence-step.ts exist a | `-     false,` / `+     true,` |
| `role="list"` removed | `--project elements packages/elements/test/evidence-chain.test.ts -t US3-1 ` | fails (bites) | US3-1 one list named Evidence, six list… | `-       "list",` / `+       null,` |
| a blank host `aria-label` treated as decisive | `--project elements packages/elements/test/evidence-chain.test.ts -t US3-10` | fails (bites) | US3-10 a blank host aria-label counts a… | `-     "Evidence",` / `+     "",` / `-     "Evidence",` |
| the pre-upgrade `aria-hidden` rule removed | `--project styles-browser packages/styles/test/browser/list-items.test.ts -t evidence-step` | fails (bites) | in dark: each visible step is a block below the previous one | `-     "directly": true,` / `+     "directly": false,` / `-       "none",` |
| `:host([hidden])` removed from the chain | `--project elements packages/elements/test/evidence-chain.test.ts -t edge \(FR-001\)` | fails (bites) | edge (FR-001): a hidden chain has no bo… | `-     "ch": 0,` / `+     "ch": 28660,` / `+     "Hidden",` |
| `:host([hidden])` removed from the step | `--project elements packages/elements/test/evidence-chain.test.ts -t edge \(FR-001\)` | fails (bites) | edge (FR-001): a hidden chain has no bo… | `-     "sh": 0,` / `+     "sh": 2316,` / `+     "Hidden alone",` |

The plant "the line-end callback also toggling `padding-inline-end`" bites before the loop-error assertion is reached: with the padding toggled from the observer callback, each line end changes the `<li>`'s size, the observer fires again and the line ends never settle, so the body fails at its layout wait. The spike measured the same plant on the stand-in raising three "ResizeObserver loop completed with undelivered notifications." errors (`spike.md` § 1).

After the plant run, for the mutation run (T074), `#lineEnds()` compares each `<li>`'s block start with the next one's
by equality (`next?.[1] !== top`; items on one flex line share their block start exactly) instead of the earlier
`next > top + 0.5` tolerance, whose `>`/`>=` and `?? 0` mutants were equivalent. Plants 2 (`data-line-end` never set)
and 11 (the callback also toggling `padding-inline-end`) were applied again to that source and still bite: US3-2 and
US3-3 fail (3 bodies), and the no-loop body fails at its layout wait.

The plants ran before the step's `part="content"` became a block (`gates.md`, `plants.md`); that change touches no
planted line, and `:host([hidden])` of the step, the one step plant, is unchanged.
