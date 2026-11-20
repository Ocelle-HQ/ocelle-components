# Squad round 1: fixes 1

Applied the 16 confirmed fixes and the operator's 9 fork decisions from `refute.md`. Duplicates are covered by the
rows they point to and have no row here: A11Y-SECURITY-1-001 and CORRECTNESS-1-001 by FRESH-1-001, A11Y-SECURITY-1-002
by CORRECTNESS-1-002 (R-02's "a user close always starts from the summary" reworded with the refute's timing measure),
CORRECTNESS-1-009 by FRESH-1-005, FRESH-1-003 by CORRECTNESS-1-006 (its plant included), TESTABILITY-1-006 by
CORRECTNESS-1-007, TESTABILITY-1-010 by CORRECTNESS-1-005 (its oracle and plant included). No finding is disputed.

Not done here, because no confirmed finding of this round covers them: plan.md decisions 3 and 6 announce spec
wording alignments "at the first squad fix" (FR-033's never-inside-the-prefix rule against R-07's 1.4.10 break,
SPEC-2-01's FR-048 reference in Consumers, and SPEC-2-03 to -09). They stay for the operator or a later round.

| ID | Resolution | Where |
|----|------------|-------|
| PLAN-A11Y-SECURITY-1-003 | fixed | research.md R-01 (`aria-hidden="true"` on the icon wrapper, measure), Repository-wide notes (`ocelle-button` icon slot); spec.md FR-005, US1 scenario 17 (titled bare svg); data-model.md icon row; contracts/elements.md `icon` slot; contracts/checks.md US1-17 body, plant; plan.md Constitution Check III |
| PLAN-A11Y-SECURITY-1-004 | decided: (a) | research.md R-04 (`summary.control { color: CanvasText; background-color: Canvas }` in forced colours); spec.md FR-016, US1 scenario 15; contracts/elements.md host styles; contracts/checks.md forced-colours oracle, plant; plan.md Summary, Constitution Check III |
| PLAN-A11Y-SECURITY-1-005 | fixed | research.md R-05, R-07 (Lit text bindings, units by `map`, never `unsafeHTML` or `innerHTML`); data-model.md digest derivation step 6; contracts/checks.md wrap and digest markup-like text bodies; contracts/elements.md README statements |
| PLAN-CORRECTNESS-1-002 | fixed | research.md R-02 (root's retargeted active element, `this.contains(active) && active !== this`; reworded close-path sentence); spec.md FR-013, US1 scenario 19; data-model.md transitions; contracts/elements.md (internal modules: `focusable.ts` dropped), README statements; contracts/checks.md US1-19 bodies; plan.md Source Code, Constitution Check III |
| PLAN-CORRECTNESS-1-003 | decided: (a) | spec.md FR-012 (platform rule: at most one event per native `toggle`); research.md R-02 coalescing; data-model.md transitions; contracts/elements.md event row, README statements; plan.md Summary |
| PLAN-CORRECTNESS-1-004 | fixed | research.md R-07 (`.digest > .group { white-space: nowrap }`, prefix wraps, measure); spec.md US2 scenario 12 (base64url and base64, 60 to 300 px); contracts/elements.md digest rule; contracts/checks.md US2-12 body, plant; data-model.md step 6; plan.md Summary |
| PLAN-CORRECTNESS-1-005 | fixed | research.md R-06 (`.code { min-block-size: 1lh }`, oracle), R-09 Empty story; contracts/checks.md empty-block oracle, plant; contracts/elements.md host styles; data-model.md examples; plan.md Summary |
| PLAN-CORRECTNESS-1-006 | fixed | research.md R-04 (`:host { display: block }`, `:host([hidden])`); spec.md FR-003; contracts/elements.md host styles; contracts/checks.md host display body, plant; plan.md Summary |
| PLAN-CORRECTNESS-1-007 | fixed | plan.md Source Code (`gates/plants/` removed), Phases 1 and 2 (plants recorded in `reviews/phase-N/plants.md`, `plants -- --affected` removed), Constitution Check VIII; contracts/checks.md § Plants (013 practice); quickstart.md step 3 |
| PLAN-CORRECTNESS-1-008 | decided: (a) | research.md R-03 (host `aria-expanded` mapped onto `open`, removed, no mirror); spec.md FR-007, FR-017, FR-054, US1 scenario 23; data-model.md mapped ARIA row, transitions; contracts/elements.md attribute row, README statements; contracts/checks.md US1-23 bodies; plan.md Constitution Check (I, III, gate note), Decisions 2, Complexity Tracking row removed |
| PLAN-CORRECTNESS-1-010 | decided: (b) | research.md R-06 (focus handed to `.block` with a temporary `tabindex="-1"`, removed on `focusout`); spec.md FR-025, Edge Cases; data-model.md `overflow` row; contracts/elements.md `overflow` row, README statements; contracts/checks.md FR-025 focus body; plan.md Summary, Constitution Check III |
| PLAN-CORRECTNESS-1-011 | fixed | quickstart.md step 2 (`git diff --exit-code -- packages/elements/custom-elements.json`) |
| PLAN-FRESH-1-001 | decided: (a) | spec.md operator decisions (clarify 1 amendment), FR-003, FR-004, US1 scenario 22; research.md R-01 (no `delegatesFocus`, `focus(options)` override, measure), R-03 (second departure from rule 1); contracts/elements.md methods, README statements; contracts/checks.md US1-22 body, plant (`delegatesFocus` restored); plan.md Summary, Constitution Check III, Decisions 1 |
| PLAN-FRESH-1-002 | decided: (a) | research.md R-06 (`.block { direction: ltr; unicode-bidi: isolate }`), R-09 RightToLeft story; spec.md FR-021, US2 scenario 8, Edge Cases; data-model.md text row; contracts/elements.md host styles, README statements; contracts/checks.md visual-order body, plant; plan.md Summary, Constitution Check III |
| PLAN-FRESH-1-004 | fixed | contracts/checks.md § Driver additions (`copyShadow`, `copyShadowRun`, sentinel), Copy oracle; research.md R-07 copy driver; plan.md Source Code, Phase 2 red step |
| PLAN-FRESH-1-005 | fixed | research.md R-07 (`.digest > span:not(:last-child) { margin-inline-end }`, measure); spec.md FR-030, US2 scenario 12 (line starts); contracts/elements.md digest rule; contracts/checks.md break-position oracle, US2-12 body, plant; data-model.md step 6 |
| PLAN-TESTABILITY-1-001 | decided: (a) | research.md R-07 accessibility text (host snapshot includes unslotted text, shadow `pre` snapshot with equality); spec.md US2 scenario 11, FR-032; contracts/checks.md AX oracle, `ariaSnapshot(id, inner)` driver addition |
| PLAN-TESTABILITY-1-002 | decided: (b) | spec.md US2 scenario 10, FR-031, SC-004 (whole-block copy is the trimmed digest plus one `\n`; a run of groups exact); research.md R-07 copy driver; contracts/checks.md Copy oracle, `copyShadow` (triple click) and `copyShadowRun`; contracts/elements.md `digest` row |
| PLAN-TESTABILITY-1-003 | fixed | contracts/checks.md "Bodies the platform alone could pass" (US1-7a, US1-7b and every "no event" body, with summary AX `expanded` and a final toggle counted as 1) |
| PLAN-TESTABILITY-1-004 | fixed | contracts/checks.md event-count wait (`updateComplete`, then `settle()`; zero-count bodies end with a positive control); research.md R-02; spec.md US1 scenario 7 |
| PLAN-TESTABILITY-1-005 | fixed | contracts/checks.md § Driver additions (`findText`, `setProperties`, `ariaSnapshot`, with driver tests, in the red step before the element bodies); plan.md Source Code, Phases 1 and 2 red steps, Constitution Check VIII |
| PLAN-TESTABILITY-1-007 | fixed | contracts/checks.md Motion oracle (pointer toggle, positive outcome, reading one frame after), plants (200 ms on the summary and on the chevron); plan.md Constitution Check VIII |
| PLAN-TESTABILITY-1-008 | fixed | research.md R-05 observer options; spec.md US2 scenario 16; contracts/checks.md `characterData` bodies (`driver.text`, `driver.textData` in a child `<b>`) |
| PLAN-TESTABILITY-1-009 | decided: (a) | spec.md FR-029, Edge Cases (`x:ab😀cdef`); data-model.md examples; contracts/checks.md FR-029 code-point body |
| PLAN-TESTABILITY-1-011 | fixed | contracts/checks.md oracles for forced colours (CanvasText on Canvas per decision (a), Highlight ring), RTL mirror and first-line icon; plant (`ocelle-icon`'s RTL mirror rule removed) |
