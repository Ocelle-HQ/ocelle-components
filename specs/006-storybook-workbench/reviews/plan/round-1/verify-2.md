# Squad round 1: verify 2

Checked against the artifacts at `44f4b2e` (spec.md, plan.md, research.md, data-model.md, contracts/), judged on the
artifacts, not on fixes-2.md. Only the rows `verify-1.md` left unresolved changed; the other 33 confirmed findings
stand as resolved in `verify-1.md` (fixes 2 touched only research.md R-05, R-08 and data-model.md § Pointer state, and
none of those edits reopens them). axe-core is not installed in this checkout; the `experimental` tag of
`css-orientation-lock` rests on verify 1's probe of axe-core 4.14.0's metadata.

| ID | Status | Reason |
|----|--------|--------|
| PLAN-A11Y-SECURITY-1-003 | resolved | research.md R-08 Context now has **Terms**: *story area* is the whole document minus the harness nodes (open shadow roots included), used by axe, the font walk and closed-shadow-root recorder (R-05) and the pointer selector (R-15); *story root* is `#storybook-root` and descendants, used only by the empty and `outside-root` checks. R-05 Decision and Closed shadow roots, R-08 Empty story ("story root ... not the story area"), R-15 and data-model.md § Pointer state follow it. Checked every use: spec.md (FR-014, US3 scenarios, Edge Cases), plan.md and gates.md `empty`/`outside-root` say "story root" only for those checks, so a body-appended surface is inside the story area for the closed-shadow and pointer checks, with no remaining contradiction. |
| PLAN-CORRECTNESS-1-010 | resolved | research.md R-08 Rules now says `css-orientation-lock` is tagged `experimental` in axe-core 4.14.0 and is left off by the experimental rule, not kept; only `frame-focusable-content` and `frame-tested` stay. Rule tests accept a document-element rule only if it is a harness-document rule, tagged `experimental`, or in the named list that stays, which agrees with FR-016 ("experimental rules are not run") and its unchanged harness-document list. No other artifact names the rule. |
