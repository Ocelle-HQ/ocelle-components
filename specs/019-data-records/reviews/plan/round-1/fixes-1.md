# Squad round 1: fixes 1

The 15 confirmed fixes are applied. The 12 forks are applied as the operator decided them on 2026-11-16 (refute.md,
Decision column). Duplicates are covered by the findings they duplicate.

| ID | Resolution | Where |
|----|------------|-------|
| PLAN-A11Y-SECURITY-1-001 | fixed | research.md R-10 and R-12 (Forced colours: every mark a border, `CanvasText` outside the variant block, the chip's box rule outside it); contracts/ocelle-event-timeline.md, ocelle-evidence-chain.md, ocelle-evidence-step.md (§ Forced colours); contracts/checks.md § Oracles (forced colours: a foreground system colour, never `Canvas`, with a non-empty box) and § Element plants (US2-8, US3-8 plants); plan.md Constitution Check III |
| PLAN-A11Y-SECURITY-1-002 | decided: (c) | research.md R-17 (the request to 009's owner, what it asks for, what happens once it lands) and Q-F; research.md R-07 and R-14; plan.md Summary, Primary Dependencies, Decisions 7 and 8, T001 recheck list; contracts/ocelle-data-table.md § Caption and the start fade; contracts/styles-data-table.md; quickstart.md. 009's module is not changed. What the data table does until the option exists is the operator's question below |
| PLAN-A11Y-SECURITY-1-004 | decided: (a) | research.md R-02 (Host sizing); contracts/ocelle-data-table.md § Shadow structure (`:host { min-inline-size: 0 }`, the README's Sizing line); plan.md phase 1 Red (flex-item and `1fr` grid-item bodies, README Sizing statement); contracts/checks.md (scroll-width oracle, element plant) |
| PLAN-A11Y-SECURITY-1-005 | decided: (a) | research.md R-04 (caption text skipping `[hidden]` and `[aria-hidden="true"]` subtrees, `<img alt>`, the observer's attribute filter, one body per rule); data-model.md; contracts/ocelle-data-table.md § Behaviour; plan.md phase 1 Red; contracts/checks.md (AX oracle, element plant) |
| PLAN-CORRECTNESS-1-001 | decided: (a) | research.md R-07 (`.region-box` a query container, the caption's cap, inline size containment, flat-tree lookup spike, 320 px bodies at start, middle and end); research.md R-06 caption row and override; contracts/ocelle-data-table.md; contracts/styles-data-table.md; plan.md phase 1 Spike and Red, Complexity Tracking; contracts/checks.md (geometry oracle, element plant) |
| PLAN-CORRECTNESS-1-003 | fixed | research.md R-08 and R-10 ("Has a time": `time` reflected, one shared `hasTime` predicate, `time=""` and white space set no `has-time`, the property bodies); contracts/ocelle-timeline-event.md, ocelle-event-timeline.md; data-model.md; plan.md Constitution Check I, Source Code, phase 2 Red; contracts/checks.md (element plant "`time` not reflected") |
| PLAN-CORRECTNESS-1-004 | decided: (a) | research.md R-10, R-12 and Q-D (decided: `border-radius: 50%`, no token, a mark shape under constitution II; the `radius-1` and new-token options withdrawn); plan.md Summary, Constraints, Constitution Check II, Decision 5, Complexity Tracking; contracts/ocelle-event-timeline.md, ocelle-evidence-chain.md |
| PLAN-CORRECTNESS-1-005 | fixed | research.md R-06 (003's `source.test.ts` change, in phase 1's red commit with its reason; the styles package's own test layout); plan.md Testing, Source Code, Structure Decision, Constitution Check VIII, phase 1 Red; contracts/styles-data-table.md |
| PLAN-CORRECTNESS-1-006 | fixed | research.md R-14 (both drivers' functions as on the branches, the reconciliation T001 records, 013's harness paths); plan.md Testing and T001; contracts/checks.md § Harnesses and the keyboard-helper table |
| PLAN-CORRECTNESS-1-007 | decided: (a) | contracts/checks.md § Stories (hidden event, hidden step, unnamed overflowing table, no-table data table, empty timeline, empty chain); plan.md Constitution Check V, Scale/Scope, Complexity Tracking |
| PLAN-CORRECTNESS-1-009 | fixed | research.md R-06 last-row row (`table > :is(tbody, tfoot):last-child > tr:last-child`, `<tfoot>` order stated); contracts/styles-data-table.md; plan.md phase 1 Red (two `<tbody>` and a `<tfoot>` body); contracts/checks.md element plant |
| PLAN-CORRECTNESS-1-010 | fixed | plan.md phase 1 Red (README Host ARIA statement) and Green; contracts/ocelle-data-table.md § Behaviour (Host ARIA) |
| PLAN-CORRECTNESS-1-011 | decided: (a) | research.md R-09 (`resolveName` imported from `overflow-region.ts`, no `list-name.ts`, README users list, T001); research.md R-14; plan.md Summary, Primary Dependencies, Source Code, phases 2 and 3, the closing paragraph; contracts/ocelle-event-timeline.md, ocelle-evidence-chain.md; data-model.md |
| PLAN-CORRECTNESS-1-013 | fixed | plan.md Constraints (`%` allowed) and Scale/Scope (32 stories, 12 / 9 / 11); research.md R-12 (ordinal on `--ocelle-line-height-tight`, 13.8 px) and R-15 (24, 18, 22 added); contracts/checks.md § Stories (the two caption stories merged into "overflows, named by its caption"); contracts/ocelle-evidence-chain.md (`aria-label` is observed) |
| PLAN-FRESH-1-004 | decided: (a) | research.md R-08 (Before upgrade); contracts/styles-data-table.md Block 3; contracts/ocelle-event-timeline.md, ocelle-evidence-chain.md § Before upgrade; spec.md § Edge Cases (new case); plan.md Summary, Scale/Scope, phases 2 and 3; data-model.md |
| PLAN-FRESH-1-005 | decided: (a) | research.md R-12 (One centre line: every `<li>` reserves a `--ocelle-size-step` line box, the chip centred, every connector at half `size-step`; the mixed-chips body); contracts/ocelle-evidence-chain.md; plan.md phase 3 Red; contracts/checks.md (geometry oracle, element plant) |
| PLAN-FRESH-1-006 | decided: (b) | research.md Q-E; plan.md Decision 6 and phase 2 Red (README limit statement); contracts/ocelle-timeline-event.md § Limits |
| PLAN-TESTABILITY-1-001 | decided: (b) | research.md R-08 (Connectors as elements), R-10, R-12 (`<span class="connector" aria-hidden="true">`), Alternatives; contracts/ocelle-event-timeline.md, ocelle-evidence-chain.md (shadow structure, AX tree); contracts/checks.md (AX oracle: no node, `aria-hidden` pinned; geometry on real elements) |
| PLAN-TESTABILITY-1-002 | fixed | contracts/checks.md § Bodies that the platform alone could pass (table with paired assertions and green-time plants; the red log read per body); plan.md phase steps (Red commit) and Constitution Check VIII |
| PLAN-TESTABILITY-1-003 | decided: (c) | research.md R-13 (Contrast oracles: the node checks and the rendered bodies, with their plants); contracts/checks.md § Oracles and § Element plants; plan.md Summary, Testing, Source Code, phase Red lists |
| PLAN-TESTABILITY-1-004 | fixed | contracts/checks.md § Element plants (after green, never committed, `reviews/phase-<N>/element-plants.md`, a plant that does not bite stops the phase; `plants.md` left to op 016); plan.md Testing, phase steps, Red and Green lists, Constitution Check VIII; quickstart.md |
| PLAN-TESTABILITY-1-005 | fixed | contracts/checks.md § Element plants (step-marker plant kept for US3-1 and US3-10; the timeline marker and connector changes recorded as equivalent in Chromium with the probe; a DOM `aria-hidden` assertion) |
| PLAN-TESTABILITY-1-007 | fixed | contracts/checks.md § Harnesses (the layout wait is 009's `settle`); research.md R-12 (the in-process no-loop test, its self-check, the paired line-end assertion and its plant); plan.md phase 3 Red |
| PLAN-TESTABILITY-1-008 | fixed | research.md R-06 (the override's node test selects every prose rule that can match a table part, with an asserted not-applicable list); contracts/styles-data-table.md |
| PLAN-TESTABILITY-1-009 | fixed | plan.md phase 1 Red (320 px caption bodies, `<thead>` with an empty `<tbody>`, the define-twice fixture with the five elements); plan.md Source Code (`define.test.ts`); contracts/checks.md § Bodies that the platform alone could pass |
| PLAN-TESTABILITY-1-011 | fixed | contracts/checks.md (US1-16 runs twice, `text` on the caption's text node and the caption replaced; element plant); plan.md phase 1 Red |
| PLAN-TESTABILITY-1-012 | fixed | contracts/checks.md § Oracles (US1-12, US2-9, US3-9 in geometry with inline-start edges; US2-5, US2-6, US3-6, US3-7 in the AX tree and `itemTexts`; US3-5 in geometry and scroll width) |

## A question for the operator: the caption until 009's option exists (Q-F)

Decision (c) on PLAN-A11Y-SECURITY-1-002 asks 009's owner for a module option that keeps a pinned start box out of
the start fade's mask (research.md R-17). This mission does not change 009's module, so until that option is on
`main` the data table needs an interim rule. The phase 1 caption bodies assert the same outcome under every option:
every caption line box lies inside the box's unmasked extent at 320 px, scrolled to the start, the middle and the end.

- **(a) Sticky, inset by the fade (the plan proceeds on this).** The caption sticks at `inset-inline-start:
  var(--ocelle-scroller-fade-size)` and is capped at `calc(var(--ocelle-measure-container) - 2 *
  var(--ocelle-scroller-fade-size))`, so it stays out of both fades. When 009's option lands, the inset goes to 0
  and the cap to R-07's figure, a later PATCH. The name stays in view while scrolling; the caption sits a fade depth
  (`--ocelle-space-7`) in from the box's start edge while the table is scrolled.
- **(b) Not sticky until then.** The caption scrolls with the table and is capped by R-07's rule, so it wraps inside
  the box at rest and is reached by scrolling back. It becomes sticky when the option lands, a later MINOR (a look
  change).
- **(c) Wait.** Phase 1's green waits until 009's option is on `main`. Phases 2 and 3 do not depend on phase 1 and may
  run first.

Recommendation: (a). It keeps the behaviour R-07 plans, and the later change is one inset and one cap value with the
bodies unchanged.
