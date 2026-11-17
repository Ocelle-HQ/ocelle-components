---
phase: 2
round: 3
verdict: approved
base: 296e02d1606eb51b2a2f7caa4ac8a1e5cc73ac0d
head: 42c31d5a7639f257f724dd45f5a10b747b700118
tdd_check: pass
---

# Phase 2 review, round 3

Scope: the whole phase, `git diff 296e02d..42c31d5`. The working tree was clean. Since round 2 there are four commits:
`026917a` (operator decision 4 in `reviews/operator-decisions-implementation.md`, which supersedes decisions 2 and 3),
`540f43f` (fix-2 red, one line of `gates/test/integration/plant-repo.test.ts`), `2a6f41f` (the fix: 24 added and 4
changed baselines, the `visual/fail-token-changed` plant, T023 ticked, the red log and `round-2-fixes.md`) and
`42c31d5` (the red/green check outputs). Round 1 and round 2 reviewed the element, token, story and test code of the
phase, and none of it changed after `338f4e5`. I reran every check at HEAD, with docker as the container engine.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R3-01 | note | commits 1b9cc98, 671196d | Carried over from R2-02. `gate:signoff -- --range 296e02d..HEAD` reports "2 findings in 14 commits", and both are on these two orchestrator commits. The four commits since round 2 are signed off. | Orchestrator, as already tracked: check that the commits are signed off after the phase fold. |
| R3-02 | note | specs/011-layout-headers/research.md R-04 vs packages/elements/src/ocelle-section-header.ts:8-12, 89-91, 183, 188 | Carried over from R2-03, unchanged. | Planner, as already tracked: amend R-04 before phase 3 reuses it for the page header (R-07). |
| R3-03 | note | storybook/baselines/ (28 files) | Under decision 4, the baselines are made and checked under docker only. podman is absent, so there was no cross-engine comparison. `round-2-fixes.md` records this, as the decision requires. | None here. CI confirms the baselines under both engines at landing. |

### The baselines: the right set

`git diff --name-status 296e02d..HEAD -- storybook/baselines` shows 24 `A` and 4 `M`, and nothing else:

- **Added:** the six `elements-ocelle-section-header--{compact,empty-heading,eyebrow-variant,filled,heading-only,long-heading}`
  and the six `elements-ocelle-card--{compact,inset,inset-compact,nested,no-header,regular}`, each in light and dark.
  These are exactly the twelve story-themes T023 added in `storybook/stories/section-header.stories.ts` and
  `card.stories.ts`.
- **Changed:** `tokens--colour` and `tokens--type`, in light and dark.

No phase 1 baseline and no other story's baseline changed. `storybook/baselines/` holds 66 files, which is 33 stories
× 2 themes (`gate:storybook-build`: 33 stories). `gate:visual -- --engine docker` at HEAD reports "66 captures match
their baselines", so no story-theme lacks a baseline or has a stale one.

### The baselines match the elements as implemented

I opened `card--nested.light`, `card--no-header.dark`, `section-header--filled.dark`, `--empty-heading.light`,
`--eyebrow-variant.light` and `tokens--type.light`, and compared each with its story's markup:

- **`card--nested.light`.** An outer card with a border and radius, and the header row (eyebrow, heading, actions at
  the inline end). Inside it is an inset compact card, with the inset ground, a smaller heading and tighter padding.
- **`card--no-header.dark`.** The two body paragraphs only, and no space above them for the empty header (R-08,
  FR-008 trims).
- **`section-header--filled.dark`.** The eyebrow, then the heading, then the description in the muted ink, with the
  actions at the inline end.
- **`section-header--empty-heading.light`.** The eyebrow and the description, with the actions at the inline end.
  There is no gap where the heading would be.
- **`section-header--eyebrow-variant.light`.** "RECENT" is drawn as the eyebrow, with the actions on the same line
  and the list below. The variant is drawn as specified.
- **`tokens--type.light`.** It differs from the base only at the end, where three rows are added:
  `font-size-eyebrow 0.75rem`, `font-weight-eyebrow 600` and `tracking-eyebrow 0.08em`.

The old and new `tokens--colour.light` first differ at row 501, the 46 px row added for
`--ocelle-color-eyebrow #5E584F` (after `color-ink-muted`). I checked this from a crop of the new PNG. Below that row,
the remaining small differences are in the text column only, from the shifted sub-pixel row position. Each of these
values matches the records added to `packages/tokens/src/source.ts`.

### The plant change is justified

`visual/fail-token-changed` changes light `color-ink`, and it lists every story-theme whose capture then differs.
The new stories show `color-ink`, so their differences are expected. The plant adds the eleven new light story-themes
and leaves out `section-header--empty-heading`. That story has no heading. Its eyebrow and description use the muted
ink, and its buttons are UA-styled, so it does not show `color-ink`, as the PNG confirms. No dark line was added. The
`why` text gives 31 locations, and the file holds 31. The plant judge compares the exact findings. My full
`gate:plants` run with docker, with the 48 visual plants included, reports "301 plants of 17 gates and the registry
judged, every plant as expected". So the pinned container measures this set of eleven, no more and no fewer. This is
a recorded expectation that new stories extend, as the plant's own `why` and research.md R-07 require. It is not a
loosening.

### The count test change is not a weakening

`540f43f` changes one assertion, `plant-repo.test.ts:225`, from `toHaveLength(42)` to `toHaveLength(66)`. The test
still checks the exact number of files in the repository, so its strength is unchanged. It also still checks that the
copied tree is exactly the repository's files plus the fixture, and that every byte is the same. The count follows the
new content of the repository, and `visual.test.ts:239` (`expect(before.size).toBe(66)`) pins the same number. The
change was committed before the baselines: `red-fix-2.log` shows it failing for the right reason at `540f43f`
("expected [ …(42) ] to have a length of 66 but got 42"). It is the `fix-2` entry in `red-commits`.
`git diff 540f43f..HEAD` changes no test file.

## Test quality

- **Red evidence.** `tdd-check.json` (written at `2a6f41f`): `status: pass`, `problems: []`. The `phase`, `fix-1` and
  `fix-2` red commits exit 1, the final tests exit 2 on the base and 1 on the scaffold, and they exit 0 at the head.
  `fix-2` fails in 4 tests, and all 4 are about the missing baselines:
  - `plant-repo.test.ts:218`;
  - `visual.test.ts:115` and `:126`, on the 28 `missing-baseline` and `differs` findings;
  - `visual.test.ts:239`, `expected 42 to be 66`.

  No setup error. HEAD `42c31d5` adds only the check outputs, so the check stands for HEAD, and my `pnpm test` at HEAD
  agrees.
- **No weakening.** No test changed after its red commit apart from the counts discussed above. The fix-1 and phase
  tests are unchanged since round 2.
- **Assertions and lint.** `gate:test-lint` is clean (189 files). There is no `skip`, `only`, conditional assertion
  or snapshot-only assertion, as round 2 found.
- **Mutation.** `pnpm run gate:mutation -- --base 296e02d`: "147 mutants on the changed lines of 6 files, none
  survived; 0 timeouts, 43 compile errors, 2 zero-mutant entries; 2 equivalent records". This is the same result as
  round 2, and the two equivalent records are the ones accepted in round 1.

## Checks run

All at `42c31d5`, with `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`, docker 29.9.2 and
`OCELLE_VISUAL_ENGINE=docker`.

| Check | Result |
|---|---|
| `pnpm test` | pass: 3304 tests passed in 149 files, the five container-engine tests of `visual.test.ts` among them |
| `gate:visual -- --engine docker` | pass: 66 captures match their baselines (docker only: no cross-engine comparison) |
| `gate:plants` (full, with the visual plants) | pass: 301 plants, every plant as expected |
| `gate:mutation -- --base 296e02d` | pass: 147 mutants, none survived |
| `gate:typecheck` | pass |
| `gate:lint` | pass (283 files) |
| `gate:style-lint` | pass (16 files) |
| `gate:test-lint` | pass (189 files) |
| `gate:prefix` | pass (245 files) |
| `gate:contrast` | pass: 169 light / 177 dark / 158 required |
| `gate:brand-rules` | pass (7 rules) |
| `gate:manifest` | pass (4 elements) |
| `gate:csp` | pass (21 files) |
| `gate:pins`, `gate:config-copies` | pass |
| `gate:storybook-build` | pass (33 stories) |
| `gate:axe` | pass: 66 story-theme runs, 0 serious or critical |
| `gate:signoff -- --range 296e02d..HEAD` | 2 findings in 14 commits, on the orchestrator commits 1b9cc98 and 671196d only (R3-01) |

## Earlier findings

- **R2-01 (blocking): resolved.** Operator decision 4 (`026917a`) supersedes decisions 2 and 3, and it requires the
  baselines to be made in the pinned container. They were made there, and I checked above that they are the right
  set. `tdd-check.json` is `pass`. The five container-engine tests of `visual.test.ts`, at lines 115, 126, 239, 251 and
  271, pass at HEAD with the engine, as decision 4 expects. This fix adds baselines and changes no behaviour. Its
  count test changed test-first: `fix-2` `540f43f` is in `red-commits` and failed for the right reason.
- R2-02 and R2-03 were notes, and they are carried over as R3-01 and R3-02. R2-04 (note) is superseded: T023's
  baselines are in, and T023 is ticked (`tasks.md:121`).
