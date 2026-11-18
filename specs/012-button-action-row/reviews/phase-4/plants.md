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

## Fix round 2 (operator round from the landing review: O2-01, O2-02; tasks.md T049f)

The two new fail plants, each judged once in its other-plant shard on the fix-2 green tree (red commit 2041399 plus
the fix), `OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard <k>`, one shard at a time. The judge compares
the findings as a multiset by location and rule, so "as expected" means exactly the one `reduced-motion` finding,
with the message given in `plant.json`.

| Plant | Planted | Expected finding | Shard | Result |
|---|---|---|---|---|
| `brand-rules/f-delay-marker-misplaced` (new) | adds `motion-pause`, `300ms`, `delay: true`; wrapped generator whose `validateSource` lets `motion-pause` through | `packages/tokens/src/overrides.ts#motion-pause`, `reduced-motion`, "motion-pause carries delay: true, which is accepted only on a motion token whose name ends in -delay" | 2 | as expected, 55.6 s |
| `brand-rules/f-motion-not-ms` (new) | adds `motion-slow`, `1s`; wrapped generator whose `validateSource` lets `motion-slow` through | `packages/tokens/src/overrides.ts#motion-slow`, `reduced-motion`, "motion-slow is 1s; a motion duration must be a literal <number>ms value" | 3 | as expected, 128.1 s |
| `brand-rules/f-motion-not-zero` (kept) | wrapped generator, `--ocelle-motion-fast: 60ms` in the block | one `reduced-motion` finding at the declaration | 1 | as expected, 51.1 s |
| `brand-rules/f-motion-spin-missing` (kept) | wrapped generator drops `--ocelle-motion-spin: 0ms` | one `reduced-motion` finding at the block | 2 | as expected, 51.2 s |

Shard lines: "plants: shard 1 of 76: 80 plants judged, every plant as expected" (142 s), "plants: shard 2 of 76: 80
plants judged, every plant as expected" (149 s), "plants: shard 3 of 76: 79 plants judged, every plant as expected"
(179 s): all 239 other plants, the brand-rules gate's 17 among them. The `visual` and `axe` shards were not rerun: the
fix changes no stylesheet the repository's source produces (`gate:brand-rules` and the tokens tests pass unchanged,
and the reduced-motion block of the real source is the same three durations).

## Operator decision on the fix-2 plants record (phase 4 round 3, R3-01)

Recorded by the orchestrator, 2026-11-18. Asked as multiple choice; the operator (human:jeroennouwsdev) answered
"Shards + CI stand (Recommended)": "Record as your decision that the shard run plus the byte-identical stylesheet
stands for this round, and that the CI Plants run on the pushed head (all 312 plants) is the full evidence, added to
plants.md with its run link."

- Local evidence for fix-2: shards 1 to 3 (all 239 non-visual plants, the two new plants included), above; the real
  token source's stylesheet is byte-identical before and after bd9aaca, so no `visual` or `axe` plant sees a change.
- `--affected 55ec410` selects all 312 plants (shared gate source) and was not run locally.
- Full evidence: the CI Plants run on the pushed head `ac2d73a` (after merging main `b594b7e`, mission 009, so 244
  non-visual plants in 4 shards: 77 shards in all). Run
  [44298568583](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/44298568583), attempt 1: every Plants
  shard, the Plants verdict and all 148 jobs passed. Longest gate step 524 s (shard 39), none over 570 s.
