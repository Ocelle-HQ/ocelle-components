---
check: 2
verdict: issues
---

# Spec check 2

Scope: `spec.md` (Draft, 2026-11-13, after the fixes for check 1) and `checklists/requirements.md`, checked against
constitution 1.3.1, `reviews/spec/check-1.md` and `check-1-fixes.md`, the tokens in `packages/tokens/src/source.ts`,
mission 005's README (`packages/elements/README.md`, "Slot convention" and "Host ARIA") and the final 006 design
(`origin/claude/010-storybook-workbench:specs/006-storybook-workbench/spec.md`). No `[NEEDS CLARIFICATION]` marker
is left. Every token the spec names exists in `source.ts` (`--ocelle-bar-width`, `--ocelle-color-current`,
`-control-border`, `-accent-strong`, `-hover-bg`, `-disabled-ink`, `--ocelle-font-size-sm`,
`--ocelle-line-height-compact`, `--ocelle-icon-size`, `--ocelle-target-min`, `--ocelle-focus-width`, `-offset`,
`--ocelle-radius-row`). The exception is the row's hover-border token, which FR-036 leaves for the plan to choose or
add.

**Earlier checks.** All six blocking findings of check 1 are fixed as `check-1-fixes.md` says:
- SPEC-1-01: the "Not activated" definition now scopes the guarantee to bubble-phase listeners. FR-003 and every
  scenario that cites it use that definition.
- SPEC-1-02: FR-006 follows the Accessible Name 1.2 order, and US2 sc9 and US4 sc4 test the case where both are set.
- SPEC-1-03: US5 sc8 is limited to the tags region.
- SPEC-1-04: FR-042 was added, and FR-018 and SC-003 were extended.
- SPEC-1-05: FR-012 and US1 sc12 now name both inline sides and a 0.5 px tolerance.
- SPEC-1-06: US4 sc10 now names its observables.

The four operator answers (SPEC-1-07 to SPEC-1-10) are recorded in the header and applied in FR-012, FR-031, FR-033,
FR-009, FR-037 and the new scenarios. Notes SPEC-1-18, SPEC-1-20 and SPEC-1-22 are still open by choice and are
handed to the plan (SPEC-2-11).

| ID | Severity | Where | Finding | Fix |
|----|----------|-------|---------|-----|
| SPEC-2-01 | blocking | spec.md SC-005 vs FR-035, US4 sc5, Edge Cases "A row with `busy` and `unavailable`" | SC-005 says "activating a disabled, busy or unavailable control produces none". On the row, `busy` does not block activation (FR-035; US4 sc5: "activation still dispatches the event"). A test written from SC-005 for a busy row fails against FR-035, and the reverse is also true. SC-005 also says "disabled" for the row, which has no `disabled`. | Scope SC-005 per element. For example: "activating a disabled or busy `ocelle-button`, or an unavailable `ocelle-action-row`, produces no `click` reaching a bubble-phase listener and no event; a busy row still produces exactly one event". |
| SPEC-2-02 | blocking | spec.md FR-033 (modifier and middle clicks) vs FR-003 / FR-039 / US5 sc6 (unavailable), US3 sc8 (busy link-mode button) | FR-033 says that in link mode a click with Ctrl, Meta or Shift held, or a middle click, "dispatches no event and the browser's default (a new tab or window) happens". FR-003 says an unavailable control "is not activated", which includes no navigation. For an unavailable link row, or a busy link-mode `ocelle-button` (which stays focusable, so its link stays live), the spec does not say whether a modifier click or a middle click opens the target. US5 sc6 and US3 sc8 test only a plain click and Enter. A plan can build either behaviour, and a test of one contradicts the other sentence. | State that "not activated" also covers modifier clicks and the middle click (no new tab or window) on an unavailable row and a busy link-mode button. This follows FR-003's "cannot be used right now". Then add those clicks to US5 sc6 and US3 sc8. If the operator wants the opposite, say so in FR-033 instead. |
| SPEC-2-03 | blocking | spec.md FR-031 (`flush`: "no border, no surface") vs FR-036, FR-042, US4 sc8 (hover border) and FR-037, US5 sc4 (current surface) | A flush row has no border and no surface. US4 sc8 and FR-036 apply to "a row" with no exception: on hover "its surface and its border change to the hover tokens", and FR-042 requires a contrast pair for the hover border. The spec does not say whether a flush row shows a hover border (and if so, whether it may shift the layout), or whether a flush row with `current` shows the `accent-low` surface of the current mark. The flush current row is the main case in US5's navigation list. The button settles the same question for `flush` explicitly ("changes its surface only", FR-019); the row does not. | For `presentation="flush"`, state what hover changes (for example "surface only, no border, as the flush button"). State that the current mark (the `accent-low` surface and the bar) is drawn on a flush row, or which part of it is. Then limit US4 sc8 and FR-042's hover-border pair to the presentations that have a border. |
| SPEC-2-04 | operator | spec.md FR-034, US4 sc3, FR-032, Key Entities "Row parts" | The row's inner control is a `button` or a `link`. Its name is the title alone (FR-034) and its description is the `description` slot. The spec does not say how the `tags` slot (status, labels) reaches an assistive technology. In a `button` the children are presentational, so tag text that is neither the name nor the description is not announced. A screen-reader user then hears less than a sighted user sees, and this is unspecified for a library that is accessible by construction (constitution III). Only the operator can decide what the row conveys. | Operator question Q1. |
| SPEC-2-05 | note | spec.md US1 sc13 vs FR-018; `source.ts` `color-ink` | FR-018 requires `flush` to meet text contrast on each main ground and each state ground. US1 sc13 tests a flush label in `--ocelle-color-ink` "on each main ground" only. `source.ts` declares `color-ink` text contrast only on `main`, so the state-ground pairs are not in the contrast check today. | Make the scenario match FR-018. The plan then adds the `color-ink` pairs on the state grounds to the contrast check, or FR-018 narrows `flush` to the main grounds. |
| SPEC-2-06 | note | spec.md FR-031 ("bordered row on a surface"), FR-042 ("on the row's surface in every state"), FR-010 ("primary (filled)") | The fill token of a `default` row and of a `primary` button is not named, so FR-042's text-contrast pairs have no ground until the plan picks one. | The plan names the surface and fill tokens, and their pairs go into the contrast check. |
| SPEC-2-07 | note | spec.md FR-009, FR-030, FR-034 (`aria-describedby`) | `aria-describedby` passthrough is part of both public interfaces, and FR-034 makes a host `aria-describedby` win over the `description` slot. No acceptance scenario covers either. SC-001 counts only scenarios, so this behaviour has no success criterion. | Add a scenario per element: the host `aria-describedby` describes the inner control, and on the row it replaces the slotted description. |
| SPEC-2-08 | note | spec.md FR-006, FR-013, Edge Cases "`aria-controls` or `aria-labelledby` naming several ids"; README "Host ARIA" | FR-006 cites both Accessible Name 1.2 and mission 005's Host ARIA rule. The two disagree on a blank host `aria-label`. Mission 005 says a blank host `aria-label` "decides alone" and leaves the element unlabelled even with a `label`. Accessible Name 1.2 skips an empty `aria-label` and falls back to the content. It is also not said what a host `aria-labelledby` whose ids are all missing falls back to. | State the outcome for a blank `aria-label` and for an `aria-labelledby` that resolves to nothing on these two elements. |
| SPEC-2-09 | note | spec.md Edge Cases "`unavailable` and `current` together" | "The unavailable look wins visually" does not say whether the current bar and the `accent-low` surface are still drawn. | Say which parts of the current mark stay. |
| SPEC-2-10 | note | spec.md FR-033, US5 sc2 | The modifier list is Ctrl, Meta and Shift. Alt-click (a download in some browsers) is not mentioned, so it dispatches the event and is cancellable by the host. | Add Alt, or state that Alt is treated as a plain click. |
| SPEC-2-11 | note | check-1 SPEC-1-18, SPEC-1-20, SPEC-1-22 | These are still open by choice: the host-side contract for passthrough attributes and axe `aria-allowed-attr` on a role-less host; script-capable schemes other than `javascript:`; and the mapping of focus, forced colours and `dir="rtl"` states onto 006's harness, which has one pointer state per story and no forced-colours capture (006 spec, line 541). | The plan's research settles each one and records the answer. |
| SPEC-2-12 | note | spec.md US2 sc3, FR-003 (disabled link) | A native `<a>` with no `href` has no `link` role in Chromium. US2 sc3 asks for "a node of role `link`" with `aria-disabled="true"` and no navigable target, so the plan has to give the role explicitly. | Plan detail. The scenario is testable as written. |

## Operator questions

**Q1 (SPEC-2-04).** How should the text in an `ocelle-action-row`'s `tags` slot reach assistive technology, given
that the row's inner control is a `button` or `link` named by its title?
- (a) The tags join the row's accessible description, after the `description` slot's text (unless the host sets
  `aria-describedby`).
- (b) The tags are not exposed. The README tells hosts to put anything a user must know into the title or the
  description, and the tags are a visual summary only.
- (c) The tags are included in the accessible name after the title (unless `label`, `aria-label` or `aria-labelledby`
  is set).
