# Phase 3 plants (T040): the plants of T031 to T033, each run once

Each plant was applied to the source in the working tree, the in-process tests were run once and the source restored
with `git checkout`: for an element plant `pnpm exec vitest run --project elements packages/elements/test/button.test.ts
packages/elements/test/control.test.ts` (131 tests, all passing without a plant), for a manifest or README plant
`pnpm exec vitest run --project elements-node packages/elements/test/node/manifest.test.ts
packages/elements/test/node/readme.test.ts` (210 tests, all passing without a plant). The table is the run on e1887f7,
the phase's last source commit; every plant made the tests fail. The same plants were run first on 7c72352 (the first
green commit), where every one bit except the last row (below). Run on 2026-11-15 in Chromium 156 (`chromium-1248`). The
script is scratch, not committed; each row gives the change.

| Plant (tasks.md name first) | Change | Result | Failing tests (first ones, as Vitest abbreviates them) |
|---|---|---|---|
| no mirror (US2-13, decision 19) | `MovedAttributes` writes no mirror | 22 failed, 109 passed (131) | moves every listed attribute present in markup parsed before the element is upgraded…; moves aria-expanded set later…; …; US2-13, copies…; US2-13, morph… |
| mirror not restored (US2-13 morph, decision 24) | a removed or changed mirror is not written back | 2 failed, 129 passed (131) | writes the mirror once per set (its own write ignored, no loop), restores a mirror removed or overwritten…; US2-13, morph: a morph that applies the… |
| `title` not moved (US2-14, decision 22) | `title` dropped from the moved list | 5 failed, 126 passed (131) | moves every listed attribute present in markup parsed before the element is upgraded…; moves title set later…; names the inner control from the first source present…; US2-7…; US2-14… |
| activate on a modifier click (US2-1, decision 26) | the link-mode modifier check removed | 2 failed, 129 passed (131) | dispatches ocelle-button-activate for a Ctrl, Meta, Shift or Alt click in button mode, and none for the same clicks in link mode; US2-1 (sink), modifier and middle click… |
| link mode drops the variant rules (FR-002, US1-11) | the inner `<a>` loses the class `control` | 14 failed, 117 passed (131) | Edge case, href values…; FR-002, US1-11 link half (light)…; SC-006, decision 28 (light)…; FR-002, US1-11 link half (dark)…; US1-11 link half, forced colours… |
| a README snippet that differs (decision 28, T033) | the README's breadcrumb item without `aria-current` | 1 failed, 209 passed (210) | gives the three consumer compositions in its ocelle-button section, the markup scenarios/link.ts renders (SC-006) |
| cancel not forwarded to the click (US2-1 cancel, decision 26) | a cancelled activate event leaves the click alone | 5 failed, 126 passed (131) | US1-18, a pointer click…; US1-18, Enter…; US1-18, Space…; US2-1 (sink), cancelled, a pointer clic…; US2-1 (sink), cancelled, Enter on the f… |
| `aria-current="false"` applied (US2-5) | the off value passed through | 5 failed, 126 passed (131) | applies the off values…; sets the custom states from the moved values…; US2-5 and the aria-current edge case…; US2-10… |
| `aria-pressed` applied in link mode (US2-11) | the `<a>` gets `aria-pressed` | 2 failed, 129 passed (131) | US2-7: with every passthrough attribute…; US2-11: aria-haspopup="menu" with aria-… |
| `javascript:` by string prefix (FR-002, R-02) | `href.startsWith("javascript:")` instead of the parser | 1 failed, 130 passed (131) | decides each row of the table: the inner control and its href, with no error logged |
| no `noopener` (FR-021) | `target="_blank"` gives no `rel` | 2 failed, 129 passed (131) | target="_blank" and no rel: rel="noopen…; US2-2: target, rel and download set on … |
| the normaliser drops a declared standard attribute (R-15, T033) | `declared(attribute) \|\|` removed | 2 failed, 208 passed (210) | keeps a standard attribute the element declares with a description, and drops one it observes without declaring; declares ocelle-button with its tag name… |
| references not resolved at connection (FR-005, R-04) | `#resolve()` and `requestUpdate()` removed from `connectedCallback` | 2 failed, 129 passed (131) | resolves the ids again when the element is connected: set while disconnected, related once connected; resolves the ids again at every connection… |

The last plant did not bite on 7c72352 (`#resolve()` removed there: 0 failed, 127 passed): the first connection also
resolved the references through the mirrors' read-back, so no test showed `connectedCallback`'s own resolution. A test
for a later connection (an element moved from the document into a shadow root) was written and failed on 7c72352 (the
element resolved in the new tree but rendered the old relation); 5cd582f makes it pass by requesting an update at each
connection. e1887f7 then removed the read-back's own resolution (an equivalent mutant), so both connection tests now
fail under the plant. The new test also fails on the phase's base (no references at all).

The fixture run (test/browser/button.test.ts) shares the same bodies on the built browser build; the plants were not
rebuilt into it. The fixture navigation bodies (`linkNavigationScenarios`) have no in-process twin and were not
planted; their in-process counterparts (`linkSinkScenarios`) are the planted ones above.

## Gate plants

`visual/fail-token-changed` gains the five light story-themes of this phase's stories that show `color-ink` (link,
link-new-tab, expanded, current, pressed; link-disabled shows only the disabled ink), measured by running its shard
(`OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 40`: before, "not-caught: findings differ: unexpected" the
five; after, "shard 40 of 76: 1 plant judged, every plant as expected", 138.7 s). `fail-empty-index` needs nothing new
(phase 2 gave its tree `button.stories.ts`). The manifest plants' committed-manifest copies carry the new
`ocelle-button` entry (7c72352).
