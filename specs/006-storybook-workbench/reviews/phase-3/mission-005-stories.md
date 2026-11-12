# Phase 3: mission 005's stories (plan decision 29; T046q to T046s)

The merge of origin/main `476602e` (`39763c7`) brought 9 stories, taking the repository from 12 stories (24
story-themes) to 21 (42).

## T046q: baselines

`6417b18`, 18 files, 275,736 bytes; see tdd-exempt.md. `gate:visual` matches all 42, and `visual:update` leaves no
diff.

## T046r: tests naming the repository's stories (`47300eb`)

Expectation updates, none red. The merge and T046q already made each new value true, since the counts come from the
merged stories, not from code. All 48 tests in the three files passed against the tree with T046q.

- `gates/test/integration/storybook-build.test.ts`: `built 21 stories`.
- `gates/test/integration/visual.test.ts`:
  - `42 captures match` (and its title);
  - `2 findings in 42 story-themes`;
  - 42 baselines before an unchanged `visual:update`.
- `gates/test/integration/plant-repo.test.ts`: 42 repository baselines.

Not changed, because they read recorded fixtures, not the repository: `storybook-build.test.ts`,
`storybook-index.test.ts` (the spike's 12-story index) and the hand-written runs of `plants.test.ts`. No test reads
the real `plant.json` files, so the plants below are checked by `gate:plants` only.

## T046s: plants

`grep` over `gates/plants/` for the 12 story ids, `12 stories`, `24 captures` and `24 story-themes` found:
- `visual/fail-token-changed`: an exact list of the repository's story-themes. Measured again, below.
- `visual/fail-one-pixel`, `visual/fail-missing-baseline`, `visual/fail-same-pixels-other-bytes`: each names one
  story (`tokens--colour`) and no list or count. Unchanged.
- `storybook-build/pass-repository` names no count. Unchanged.

The plant run found one more:
- `storybook-build/fail-empty-index` replaced the repository's two story files with story-less ones. The new
  `icon.stories.ts` and `brand-mark.stories.ts` made its built index non-empty, so the gate passed (`not-caught`).
  Its tree now replaces those two files as well, and it is caught again.

**fail-token-changed, measured as T004 measured.** The plant's root (`color-ink` changed in light) was captured in
the pinned container (docker, `--engine auto`) and compared byte for byte with the repository's baselines, which were
made without the change. Result: `visual: 20 findings in 42 story-themes`, all `differs`, all light:
- the twelve the spike listed;
- eight of the nine new light story-themes:
  - `elements-ocelle-brand-mark--main-ground`
  - `elements-ocelle-brand-mark--mono`
  - `elements-ocelle-brand-mark--labelled`
  - `elements-ocelle-icon--close`
  - `elements-ocelle-icon--labelled`
  - `elements-ocelle-icon--unknown-name`
  - `elements-ocelle-icon--set`
  - `elements-ocelle-icon--set-right-to-left`

`elements-ocelle-brand-mark--chrome/light` and every dark story-theme are unchanged. The plant lists those twenty,
and its `why` says so.

## Checks (T046s), one at a time

| Check | Result | Time |
|---|---|---|
| `pnpm test` | 2987 tests passed | 296 s |
| typecheck, lint, test-lint | pass | |
| `gate:storybook-build` | `built 21 stories` | 2 s |
| `gate:visual -- --engine auto` | 42 match | 55 s |
| `visual:update -- --engine auto` | 0 files written | 57 s |

The plant run with `OCELLE_VISUAL_ENGINE=auto` at `size` 8:

| Step | Plants | Time | Result |
|---|---|---|---|
| `--plan` | | 1 s | `[1,2,3,4,5,6,7]` |
| shard 1 (before the fail-empty-index fix) | 232 | 268 s | exit 1, the fail-empty-index line |
| shard 1 (after the fix) | 232 | 272 s | every plant as expected |
| shard 2 | 8 | 191 s | as expected |
| shards 3 to 7 | 8 each | 447 to 480 s each | as expected |
| `--verdict` | 280 | 1 s | `plants: 280 plants of 16 gates and the registry judged, every plant as expected` |

At 21 stories the 8-plant shards take 447 to 480 s here, against 304 to 320 s at 12 stories.
