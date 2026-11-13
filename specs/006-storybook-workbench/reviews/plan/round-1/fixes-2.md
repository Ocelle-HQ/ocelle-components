# Squad round 1: fixes 2

The `unresolved` rows of `verify-1.md`, applied to the artifacts.

| ID | Resolution | Where |
|----|------------|-------|
| PLAN-A11Y-SECURITY-1-003 | fixed | research.md R-08 Context gains **Terms**: *story area* is the whole document minus Storybook's harness nodes (open shadow roots included), used by axe, the font walk and closed-shadow-root recorder (R-05) and the pointer selector (R-15); *story root* is `#storybook-root` and its descendants, used only by the empty and `outside-root` checks. R-08 Empty story now says "story root"; R-05 Decision and data-model.md § Pointer state point at the Terms. spec.md already uses "story root" only for FR-014's empty and outside-root checks. |
| PLAN-CORRECTNESS-1-010 | fixed | research.md R-08 Rules: `css-orientation-lock` is tagged `experimental` in axe-core 4.14.0 and is left off by the experimental rule, not kept; only `frame-focusable-content` and `frame-tested` stay. R-08 Rule tests: every document-element rule must be a harness-document rule, tagged `experimental`, or in the named list that stays (`frame-focusable-content`, `frame-tested`). FR-016 ("experimental rules are not run") is unchanged and now agrees. |
