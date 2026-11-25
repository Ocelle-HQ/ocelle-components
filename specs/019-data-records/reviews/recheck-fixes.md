# Fixes for the operator's decisions on the T001 recheck

- **Date:** 2026-11-17
- **Recheck:** `reviews/recheck.md` (Q1 to Q5, and Q6 in § Second pass); **decisions:** `reviews/recheck-decisions.md` (human:jeroennouwsdev):
  Q1 (a), Q2 (c), Q3 (a), Q4 (a), Q5 (b); Q6 (a).
- **Read against:** the working tree at 8ee3351 (`main` b594b7e merged): `packages/tokens/src/source.ts` 48 to 55 and
  151 to 153 (011's eyebrow tokens), `packages/tokens/contrast/pairs.json` (`color-eyebrow` rows), `ocelle-page-header.ts`
  120 to 142, `overflow-region.ts` 160 to 164 and 490 to 498 (the edge's width as the fade depth),
  `packages/elements/README.md` 1284 to 1294 and `test/node/readme.test.ts` 55 to 58 (Styles), `packages/styles/src/base.css`
  (base layer 8 to 67, prose rules 139 to 235, wrap rule 242 to 244), `packages/styles/test/source.test.ts` (31 to 54,
  195 to 212), `packages/styles/README.md` 107 to 113.
- **No source code or test was written.** `tasks.md` stays parseable by `units.sh` (same output before and after:
  phase 0 1 open of 2, phases 1 to 4 23, 26, 23 and 4 open); no task was added or removed, and T001 is left unticked
  for the implementer.

## Changes

| Q | Decision | Change | Where |
|---|---|---|---|
| all | recorded | The five decisions recorded with a pointer to this file | spec.md § Operator decisions on the T001 recheck (new block after the analysis decisions); plan.md § Summary (new bullet, the dependency paragraph rewritten for the merge at 8ee3351), § Constitution Check preamble, new § Decisions after the recheck, § Phases item 0 (recheck recorded; T001 stays for the implementer); research.md new "After the recheck" paragraph under the introduction, R-14 "Done" paragraph; tasks.md new "Recheck decisions in force" paragraph, "Waits for" rewritten (the merge has happened) |
| Q1 | (a) | Column headers use 011's four eyebrow tokens `--ocelle-font-size-eyebrow`, `--ocelle-font-weight-eyebrow` (600), `--ocelle-tracking-eyebrow`, `--ocelle-color-eyebrow`; `--ocelle-tracking-caps` dropped; Q-B (a) marked superseded | spec.md FR-006, US1 scenario 3, FR-040's last sentence, § Scope's out-of-scope item, the Q-B line of the plan-gate decisions; research.md R-06 (column-header row of the table and the paragraph after the selection order), R-13 (decision and the source contrast oracle: the header colour tied to `color-eyebrow`'s `checked` rows), Q-B entry (superseded note); plan.md § Decisions at the plan gate item 3 (superseded note), Constitution Check row II, phase 1 red's US1-3 item; contracts/styles-data-table.md block 1 column-header row; tasks.md plan-gate answers paragraph (Q-B superseded), phase 1 Independent Test, T006 US1-3, T017's column-header values; quickstart.md new "Data table, headers" check |
| Q2 | (c) | `--data-table-end-fade` is written as the unrounded `getBoundingClientRect().width` of the module's `.region-edge.end` (the fade depth from layout, as the module itself reads it for focus clearance), never as `var(--ocelle-scroller-fade-size)`; the own sheet holds px figures only and is adopted after the module's sheet; the README Styles convention amended for the count only, with the two replacement sentences given; phase 1's red changes the two pinned sentences of `packages/elements/test/node/readme.test.ts`; the end-fade body also asserts the computed `--data-table-end-fade` is a px length equal to the edge's width (empty once the fade goes); a new element plant (the token's text written) must fail that body | research.md R-07 ("A measured width" bullet, "The end fade" bullet, new "The README's Styles convention" bullet with the two sentences, the end-fade caption body); data-model.md "end fade" row (type now px, measured); contracts/ocelle-data-table.md (own sheet paragraph and the frame callback); contracts/styles-data-table.md caption row; contracts/checks.md § Element plants (new row); plan.md § Technical Context (Performance Goals), Constitution Check rows IV and VIII, § Decisions after the recheck item 2, § Project Structure (`node/readme.test.ts` changed), phase 1 red (end-fade body, the `readme.test.ts` change) and green (README Styles amendment), § Complexity Tracking note; tasks.md T007 (end-fade body), T013 (the pinned sentences), T015 (red message names both changed tests), T016 (end-fade write, sheet order), T021 (README sentences), T024 (new plant); quickstart.md "Data table, hook" |
| Q3 | (a) | Phases fold from a base at 8ee3351 or later (`base.sha` or a later remap commit), which `fold-history.sh` accepts; the merge commit stays; `/ocelle-run`'s "no merge commits on the branch" read as "no merge commit after the fold base"; `/ocelle-land` handles the PR shape. No skill or script changed | plan.md § Phases (introductory sentence), § Decisions after the recheck item 3; tasks.md new "Folds" paragraph after "Waits for", § Implementation strategy "Then" line |
| Q4 | (a) | Citations moved to the lines at 8ee3351: `base.css` prose rules 127 to 223 → 139 to 235; `table:focus-visible` 198 to 201 → 210 to 213; the prose table and caption 187 to 209 → 199 to 221; `source.test.ts` 192 to 203 → 195 to 212 (base-layer slice 31 to 53, facts entry 50, prose slice 204 to 207, last-rule assertion 209 to 212) | research.md R-06 (the prose-rule list, the override's node test, "003's existing test"), R-07 (the prose caption bound) |
| Q5 | (b) | Block 3 (the four pre-upgrade list rules) goes in `base.css`'s base layer right after 013's facts rule and before the focus rule (timeline's two, then chain's two), named in the base layer's header comment and documented beside `packages/styles/README.md` § Facts before upgrade; `source.test.ts` transcribes them in its `baseLayer` slice (later slices move with `baseLayer.length`); the last-rule assertion keeps phase 1's final form "the wrap rule, block 1, block 2" | research.md R-06 ("003's existing test" bullets for phases 1 to 3), R-08 ("Before upgrade" placement); contracts/styles-data-table.md introduction and § Block 3; contracts/ocelle-event-timeline.md and ocelle-evidence-chain.md § Before upgrade; plan.md Constitution Check row VIII, § Decisions after the recheck item 5, § Project Structure (`source.test.ts` line), phase 2 and 3 red (`source.test.ts` items) and green (placement); tasks.md T035, T043, T059, T066 |
| Q6 | (a) | The "Base-style hook (analysis I7 (a))" paragraph gave `--data-table-end-fade` as `var(--ocelle-scroller-fade-size)`; it now says the end fade's depth is the measured px inline size of `.region-edge.end`, while the end fade shows (recheck Q2 (c), second pass Q6). No other artifact carried the stale description (spec.md, plan.md, research.md, data-model.md, quickstart.md, tasks.md, contracts/styles-data-table.md and checks.md searched); T001 stays unticked for the implementer's recheck of that line | contracts/ocelle-data-table.md § Interface, "Base-style hook" paragraph (lines 32 to 34) |

## Notes

- **Left as written, on purpose.** spec.md's Input paragraph (line 16, the verbatim feature description naming
  `--ocelle-tracking-caps`); T001's own item list in tasks.md and its counterparts in plan.md § Phases item 0 and
  research R-14 (they describe the recheck's scope as planned, and T001 is the implementer's to tick); the spec's
  Assumptions sentence on the recheck, which now also says it is done; plan.md and research R-14's branch-era driver
  names, which `reviews/recheck.md` § 5 already left unchanged (checks.md has the merged names).
- **Q2's amendment covers the list of uses as well as the count.** The pinned sentence ends "…are its two uses"; with
  the data table's sheet added it would be false, so the amended sentence lists the data table's caption cap among
  the uses. The px-only, no-token-text and `CSSStyleRule.style` rules are unchanged.
- **Q3's recheck option said "recorded in `reviews/main-merge.md` by the operator".** That file is the operator's
  record and was not edited here; the decision itself is recorded in `reviews/recheck-decisions.md` and applied above.
- **Q1 changes only the column headers.** The timeline's time and the chain's ordinal stay at `--ocelle-font-size-xs`,
  `--ocelle-font-weight-medium` in `--ocelle-color-ink-muted` (R-10, R-12); they are not uppercase eyebrows.

## Questions for the operator

None. Each decision fixed its change; nothing above needed a further choice.
