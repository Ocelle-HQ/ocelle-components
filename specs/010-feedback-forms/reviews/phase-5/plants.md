# Phase 5 plant run

Run on 2026-11-16 in this container (Chromium 153 build 1243 through `OCELLE_CHROMIUM_PATH`, `OCELLE_VISUAL_ENGINE=docker`,
the pinned image present), at `8a88bcd`, shard by shard (`pnpm run gate:plants -- --shard <k>` for k = 1 to 28, then
`pnpm run gate:plants -- --verdict storybook/.visual/plant-shards`); the whole output is `plants.log`.

**Verdict: exit 1, "plants: 2 problems in 301 plants".** Shards 1 and 16 exit 1; the other 26 exit 0.

| Plant | Shard | Problem |
|---|---|---|
| `storybook-build/fail-empty-index` | 1 | `not-caught: expected exit 1 with the plant's 1 finding, got exit 0` |
| `visual/fail-token-changed` | 16 | `not-caught: findings differ: unexpected <the 30 phase 5 stories>/light differs` |

Neither is a gate that stopped biting: both plants are fixtures that list the repository's stories, and the phase's
30 new stories are not in them.

- `fail-empty-index` replaces each repository story file in its `tree/storybook/stories/` with one that has a default
  export and no story (`base`, `tokens`, `icon`, `brand-mark`; the last two added by mission 005, plan decision 29). The
  phase's `notice`, `form-input` and `form-select` story files are not replaced, so the plant's built index holds 30
  stories and the gate passes.
- `fail-token-changed` changes `color-ink` in light and lists every light story-theme that shows it ("A story added
  later that shows color-ink in light adds its line here", its `why`). The gate reported exactly the 20 listed and the
  30 phase 5 light story-themes, `elements-ocelle-{notice,form-input,form-select}--*/light` (all ten of each element),
  as `differs`; no dark story-theme, no other rule.

Every other plant was judged as expected, the `visual` and `axe` pass plants among them, which capture and audit the
repository's 102 story-themes with the new baselines. The fix of both plants lies outside the files phase 5 may change
(T066), so it is a stop for the operator: `stop-2.md`.
