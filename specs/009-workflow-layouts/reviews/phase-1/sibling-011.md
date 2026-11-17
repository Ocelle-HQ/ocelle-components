# T002: sibling 011 (#8) on `main` (phase 1)

**Read on** 2026-11-13, `origin/main` at `3828d2f` ("Mission 006: Storybook workbench, visual regression and axe gates
(#10) (#24)"), which this branch already holds (`2427d20`). `main` was not merged again.

**Result: both absent.** This feature adds `--ocelle-tracking-caps` (`0.06em`, group `type`) and writes the
container-tier convention (FR-021, FR-034, R-16). T003 to T006 and `contracts/elements.md` stay as written; there is no
mapping to record.

## What was checked

| Item | Result | Evidence on `main` |
|---|---|---|
| Sibling 011 landed | absent | `specs/` on `main` holds 001, 002, 003, 005, 006 and 007 only; no `011-*` directory; the last three merges are missions 006, 005 and 007 |
| Uppercase letter-spacing token | absent | `packages/tokens/src/source.ts` has one letter-spacing record, `tracking-display` (`-0.03em`, display text); no `tracking-caps`, eyebrow or uppercase token. `text-transform`, `uppercase` and `eyebrow` occur nowhere in `packages/tokens/src`, `packages/styles/src` or `packages/elements/src` |
| Container-tier convention | absent | no `*-below` attribute and no tier in `packages/elements/src`; `packages/elements/README.md` documents no tier convention. The only `container-type` on `main` is 003's table container in `packages/styles/src/base.css`, which is not a tier |

## Consequence

- T003 to T006 add `tracking-caps` under that name and value.
- FR-034's convention is written by this feature (README, phase of FR-034); #8 adopts both when it lands second
  (R-16, spec Assumptions "Sibling tokens").
