# Phase 3 checks (T031)

Run by the implementer on 2026-11-09 in the container (Node 22, not the pinned 26.13.0; Chromium from
`PLAYWRIGHT_BROWSERS_PATH`), one heavy job at a time, on the green commit 7d85d34.

| Check | Result |
|---|---|
| `pnpm -r build` | exit 0; `packages/styles/dist/base.css` identical to `src/base.css` (`cmp`) |
| `pnpm test` | 1917 tests passed in 93 files (`tokens`, `tokens-browser`, `styles`, `styles-browser`, `storybook`, `storybook-integration` included) |
| `gate:typecheck`, `gate:lint`, `gate:test-lint` | no finding |
| `gate:style-lint`, `gate:prefix`, `gate:csp` | no finding |
| `gate:contrast`, `gate:brand-rules`, `gate:config-copies`, `gate:pins` | pass |
| `gate:plants` (alone) | 182 plants of 13 gates and the registry judged, every plant as expected |
| `gate:mutation -- --base 00136e8` | 14 mutants on the changed lines of 2 files (`packages/tokens/src/source.ts`, `storybook/stories/render.ts`), none survived, 0 equivalent records; about 52 s |
| `tdd-check.sh 3` | `pass` (red commit 1194e1a exits 1; the final tests exit 1 on the base and on the scaffold d54f5b0; HEAD exits 0) |

**Red run** (`red-phase.log`, red commit 1194e1a, recorded by `red.sh 3 phase` and not amended): 58 of 1917 tests
failed, every one an `AssertionError` on missing behaviour: the token `line-height-compact` absent (tokens, token
browser suites, the Type story, the tokens CHANGELOG), the compact regions at 16px / 23.2px, the value style absent,
the body at 16px / 23.2px under the compact root, the compact-scale rules absent from the parse, the README and
CHANGELOG statements absent, and `renderFamily("compact")` rendering nothing (the scaffold).

**Plants** (research R-10, US2 guards): each was run against the phase 3 rules before the red commit and is asserted
in `compact.test.ts`; each makes its helper report the expected problem:
- density presence form: `density-true: 14px / 21px`, `density-true-p: 14px / 21px`;
- `body` font size: body, `main` and the text outside the region at `14px / 20.3px`;
- value presence form: `value-true: colour`;
- compact rule on `<html>`: `root font size: 14px`, `target-min: 38.5px`;
- ring under compact: `button: outline-width 1px`.

**`styles-browser` suite time**: 6.3 s for the 32 tests of `base.test.ts` and `compact.test.ts` (Vitest duration),
against the plan's 60 s goal.
