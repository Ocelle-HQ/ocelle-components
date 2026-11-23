# Phase 6 plants (T066): the plants of T061 to T063, each run once

**Method.** Each element plant was applied to the source in the working tree. The in-process row and button tests then
ran once:

```
pnpm exec vitest run --project elements packages/elements/test/action-row.test.ts packages/elements/test/button.test.ts
```

That is 199 tests, all passing without a plant. The source was then restored with `git checkout`.
- Run on 2026-11-16 on cf36bbf (the phase's green commit) in Chromium 156 (`chromium-1248`).
- Every plant made the tests fail.
- The script is scratch and not committed; each row below gives the change.
- The fixture run (`test/browser/action-row.test.ts`, `test/browser/button.test.ts`) uses the same bodies on the built
  browser build. The plants were not rebuilt into it.

Test names are cut at the title's start, as the runner prints them. A count above the listed names means a body ran in
several variants (forced colours with both palettes, the restyled rules in both modes).

| Plant | Change | Result | Failing tests |
|---|---|---|---|
| bar at `inset-inline-start: 0` (decision 21) | both `.bar` offsets `0` | 6 failed, 193 passed | US5-4 current mark (light, dark); US5-4 ring, gap and bar (light and dark, ltr and rtl) |
| bar at the ring's inner edge (decision 21) | both `.bar` offsets one `--ocelle-focus-offset` less (no gap) | 6 failed, 193 passed | the same six |
| sibling colours removed (US5-7, decision 30) | the description, tags and trailing selectors dropped from the unavailable ink rules (outside and under forced colours) | 4 failed, 195 passed | US5-7 (light, dark); forced colours (both palettes) |
| wrappers without `aria-disabled` (decision 31) | the three sibling wrappers lose `aria-disabled` | 4 failed, 195 passed | decision 31's axe and wrapper check (light, dark); US5-7 (light, dark: its page's axe) |
| no host listener (decision 23) | the row registers no host guard | 11 failed, 188 passed | US5-6 (unavailable rows); US5-6 stretched; US5-6 and US5-12 under `display: block`, `display: flex; width: 100%` and `display: block; height: 90px`; US5-6 (sink); busy with unavailable; phase 5's host-guard test |
| `pressed` state in any mode (decision 32) | `ocelle-button` sets `pressed` from the moved value in either mode | 1 failed, 198 passed | US2-12 |
| activate on a modifier click (decision 13) | the row's modifier check removed | 1 failed, 198 passed | US5-2 (sink) |
| cancel not forwarded to the click (FR-033) | the row does not call `preventDefault()` on the click | 2 failed, 197 passed | US5-1 (sink), cancelled: pointer and Enter |
| unavailable row hovers (US5-7) | the default hover rule not gated on `:not([unavailable])` | 2 failed, 197 passed | US5-7 (light, dark) |
| current surface lost on hover (FR-036) | the current surface rule loses its `.control` (lower specificity than the hover) | 2 failed, 197 passed | US5-4 current mark (light, dark) |
| unavailable current loses its surface (decision 31, reading (i)) | an added rule gives an unavailable row the `sheet` surface | 2 failed, 197 passed | US5-7 (light, dark) |
| card layout ignored (FR-038) | the card grid rule keyed on `layout="card-x"` | 2 failed, 197 passed | US5-9 and US5-10 (ltr, rtl) |

## Gate plants

- `visual/fail-token-changed` gains the eight light story-themes of the phase 6 stories that show `color-ink`. Those
  are every new story except unavailable, unavailable current and chrome current, whose text is in disabled ink or
  `chrome-ink`.
  - Before the change, `OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 40` reported "not-caught: findings
    differ: unexpected …", naming exactly those eight.
  - Its result with them added is in notes.md, under the run of all 76 shards.
- The manifest plants' committed-manifest copies were regenerated from the new manifest with each plant's own defect
  reapplied (notes.md, Green notes). Their shards are in the 76-shard run.

## Fix round 4 (O7-01; tasks.md T082): mutants of the visual integration tests' time limit

**Method.** Each mutant was applied alone by hand to `gates/test/integration/visual.test.ts` (the green change of
T080 in the working tree), then the pin test ran once:

```
pnpm vitest run --project gates gates/test/visual-timeout.test.ts
```

Without a mutant it passes (3 tests). After each run the file was restored from a copy of the green file and compared
with it (identical). Run on 2026-11-19 on top of eb342bda (the fix-4 red commit). Every mutant made the test fail.

| Mutant | Change | Result | Failing assertion |
|--------|--------|--------|-------------------|
| below the floor (the operator's example) | `const timeout = 900_000;` | 1 failed, 2 passed | "is at least 1200 s and at most 1800 s": expected 900000 to be greater than or equal to 1200000 |
| above the ceiling | `const timeout = 3_600_000;` | 1 failed, 2 passed | "is at least 1200 s and at most 1800 s": expected 3600000 to be less than or equal to 1800000 |
| run id missing from the comment | the comment's `44481594952` replaced by `(the failed run)` | 1 failed, 2 passed | "gives its reason and measurements in the comment directly above it": expected '…' to contain '44481594952' |
| a second declaration | a second `const timeout = 1_200_000;` line under the first | 1 failed, 2 passed | "is declared exactly once, as a numeric literal": expected [ 30, 31 ] to have a length of 1 but got 2 |

**The plant run of the phase.** `pnpm run gate:plants -- --affected 89a1369c0e2d4ee15eb9ec2598b211fd99ba4809 --list`
prints "affected: every plant, by gates/bin/plants.ts (shared gate source)" and "317 of 317 plants selected" (the
shared gate source changed since the phase base, earlier in the phase). Fix-4 changes two test files and no gate source, plant or
gate input, so no plant can judge it differently; the 77-shard run (about 7 runner-hours of gate step on CI) was not
repeated locally. The plant gate on CI runs on the pushed head (T083).
