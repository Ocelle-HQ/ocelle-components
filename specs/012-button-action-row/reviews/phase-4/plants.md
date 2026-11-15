# Phase 4 plants (T049): the plants of T041 to T045a, each run once

Each element plant was applied to the source in the working tree, the in-process tests were run once
(`pnpm exec vitest run --project elements packages/elements/test/button.test.ts packages/elements/test/control.test.ts`,
157 tests, all passing without a plant) and the source restored with `git checkout`. Run on 2026-11-15 on 2443172 (the
phase's last element source commit; the bodies of d13cb2c) in Chromium 156 (`chromium-1248`). Every plant made the
tests fail. The script is scratch, not committed; each row gives the change. The fixture run (test/browser/button.test.ts)
shares the same bodies on the built browser build; the plants were not rebuilt into it, and its fixture navigation body
has the in-process sink body as its planted twin.

| Plant (tasks.md name first) | Change | Result | Failing tests (first ones) |
|---|---|---|---|
| guard limited to unavailable (T041) | host guard's `available()` is `state !== "unavailable"` (no disabled check) | 3 failed, 154 passed (157) | stops every click while the control is not available…; US2-3…; US2-3 (sink)… |
| guard limited to disabled | host guard's `available()` is `!this.disabled` (no busy check) | 11 failed, 146 passed | US3-1 (all four activations); US3-8; busy removed while the pointer is down; … |
| activate event while busy (decision 26) | `#activate` checks `disabled` only | 11 failed, 146 passed | US3-1 (all four); US3-8; busy removed while the pointer is down; … |
| spinner over the label (T041) | `.spinner { position: absolute; }` | 4 failed, 153 passed | US3-4 (ltr, rtl); US3-5 (ltr, rtl) |
| `animation: none` rule removed (T041) | the reduced-motion rule of `spinner.ts` removed | 1 failed, 156 passed | US3-6 |
| `.icon-slot[hidden]` rule removed (R-07) | the rule removed from `icon-slot.ts` | 21 failed, 136 passed | US1-8; US1-7/US1-8 icon-only; … US3-4 |
| host restored to `inline-block` (US3-10) | `:host { display: inline-block }` | 2 failed, 155 passed | US1-15; US3-10 |
| no host listener (US3-11, decision 23) | `guardHost` adds no listener | 20 failed, 137 passed | the host-guard tests of control.test.ts; US1-17; … US3-1; US3-11 |
| no `aria-busy` (FR-015) | the inner control gets no `aria-busy` | 5 failed, 152 passed | US3-2; US3-3; US3-8; both disabled and busy; the busy property's reflection |
| busy link keeps its `href` (decision 9) | link availability is `!disabled` | 1 failed, 156 passed | US3-8 |
| busy link without `tabindex` (decision 9) | no `tabindex="0"` | 2 failed, 155 passed | US3-2; US3-8 |
| spinner not `aria-hidden` (FR-017) | `aria-hidden` dropped from the drawing | 2 failed, 155 passed | US3-3; US3-8 |
| disabled busy shows the spinner (edge case) | the busy look follows `busy`, not the state | 1 failed, 156 passed | both disabled and busy |

## Gate plants

- `brand-rules/f-motion-not-zero` (kept unchanged) and `brand-rules/f-motion-spin-missing` (new, T045a): each judged in
  the plant job's other-plant shards, "every plant as expected", that is each gives exactly its one `reduced-motion`
  finding (see notes.md § Gate runs for the shard lines).
- `visual/fail-token-changed` gains the four light story-themes of the busy stories, which show `color-ink` (busy,
  busy-with-icon, busy-link, busy-compact): its shard, `OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 40`,
  "shard 40 of 76: 1 plant judged, every plant as expected", 160.0 s.
- `fail-empty-index` needs nothing new (phase 2 gave its tree `button.stories.ts`).
- The manifest plants' committed-manifest copies carry the new `busy` member and attribute (4ceaefc).
