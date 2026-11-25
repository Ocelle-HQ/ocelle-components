# Issue #1 (epic), gap table and "Done when" (read 2026-11-25 through the GitHub tools; 16 sub-issues, 14 closed)

## Gap checklist (spec-kitty-design issue → where it is met here)

| Upstream | Need | Met in |
|---|---|---|
| #492 | personal-rail flip bound and orientation opt-out | #8 layout and headers |
| #493 #495 #504 #508 #525 #528 | action-row: flush density, aria-current true, unavailable state, card wrapping and trailing arrow, hover tokens, accessible-name passthrough | #7 actions and status |
| #494 #499 #500 #502 #512 #450 | top bar, app-shell layouts and tiers, nav item, skip link, flush content cell, personal drawer | #12 app frame and navigation |
| #496 #504 | icon sizing and icon set, brand mark as SVG | #17 icons and brand |
| #497 | context-sidebar and section-header dividers, footer, eyebrow-only mode | #8 layout and headers |
| #498 #510 #517 #520 #523 #533 #280 | progress element, panel tokens, evidence-chain wrapping, code block, facts and empty-state elements, compact data-table, responsive facts | #13 data display |
| #501 #518 #532 | button: ARIA passthrough, compact breadcrumb padding, compact text, 44 px target, busy spinner | #7 actions and status |
| #503 | dialog, drawer, tooltip | #16 overlays |
| #505 #506 #507 #514 #530 | inspector width, flat lane, lane min width, scroller, list/detail layout | #15 workflow and layouts |
| #509 | metric row layout, eyebrow style, compact notice | #7, #9, #5 |
| #511 #521 #522 #527 #534 | joined segmented choice, tabs, inline link, listbox, request-only copy field | #14 selection and input |
| #513 | notice without empty heading block | #9 feedback and forms |
| #516 | compact card density | #8 layout and headers |
| #519 | prose rhythm, measure, element-selector tables | #6 base styles |
| #524 #526 | interactive pill, compact outlined mono badge | #7 actions and status |
| #529 | compact page-header title and eyebrow | #8 layout and headers |
| #531 #535 | compact screen type scale, mono value style, identifier wrap policy | #5 tokens, #6 base styles |

## Done when

- [ ] Every sub-issue is closed and every row of the gap table is met.
- [ ] The packages are installable without a token.
- [ ] kitty-mission-ui builds on `ocelle-*` with no `@spec-kitty/*` dependency and no remaining design-library exception (tracked in that repository).
