---
triage: 018
issues: [7]
decision: mission
target: "status-elements"
in_scope: [7]
out_of_scope: [1, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 23, 41]
semver: minor
spec_prompt: "Build the status elements of issue #7 that mission 012 left open (triage/018-status-elements.md), spec directory specs/018-status-elements, in @ocelle/elements on mission 005's element conventions and slot convention: ocelle-status-indicator (tone; a visible marker that never pulses an empty box, the pulse stopped under prefers-reduced-motion, state never shown by colour alone, spec-kitty-design#498), ocelle-metric (label, display-value; layout=\"row\" and the eyebrow label style on #8's eyebrow tokens as specs/011-layout-headers R-12 defines them, #509) and ocelle-pill-tag (status, title, slotted content, badge use; compact density with line height 1.2 and padding 4/8 and an outlined badge variant set in Schibsted Grotesk with tabular figures because the constitution forbids monospace, #526; an interactive variant with a native button inside that follows mission 012's control conventions FR-001 to FR-006 in specs/012-button-action-row, and a shared ellipsis that shows the full text through #16's ocelle-tooltip exactly as specs/008-overlays/contracts/elements-overlays.md § #7 and #12 specifies, with the token focus ring, #524); one status vocabulary shared with #9's notice tone; without redesigning ocelle-button, ocelle-action-row or ocelle-tooltip; each element meeting #7's Done-when checklist."
status: approved
decided_by: "human:jeroennouwsdev"
decided_at: 2026-11-15T22:34:17Z
---

# Triage 018: Status elements of #7, `ocelle-pill-tag`, `ocelle-status-indicator` and `ocelle-metric`

## Issues read

**Where the issue text came from.** This session could not read GitHub. `gh issue view` fails on GraphQL with HTTP
403, and `gh api` calls were refused by the session's permission rules. The text of #7 used here is the one triage
012 (`triage/012-button-action-row.md` on `origin/claude/007-actions-status`, approved 2026-11-13) records from the
coordinator's copy of the issue. Anything posted to #7 after 2026-11-13 is not reflected. I did not read the
spec-kitty-design issues #7 cites for these elements (#498, #509, #524, #526), apart from the summary of #498 in
`specs/013-data-display/research.md` on `origin/claude/013-data-display`.

- **#7** "Elements: actions and status — ocelle-button, ocelle-pill-tag, ocelle-status-indicator, ocelle-metric,
  ocelle-action-row". Open, parent epic #1, no labels, milestone, comments, sub-issues or linked pull requests (as of
  2026-11-13). Each element starts from "what kitty-mission-ui uses today on the `sk-*` equivalents", and every
  spec-kitty-design gap it lists closes in the first release. The three elements this record covers:
  - `ocelle-pill-tag` (32 uses): `status`, `title`, slotted content, badge use. Plus: an interactive variant with a
    native button inside, the pill look, and a shared ellipsis that shows the full text as a tooltip, with a focus
    ring (#524); compact density (line height 1.2, padding 4/8) and an outlined mono badge variant (#526).
  - `ocelle-status-indicator` (2 uses): `tone`. Plus: a visible marker that never pulses an empty box (#498).
  - `ocelle-metric` (2 uses): `label`, `display-value`. Plus: `layout="row"` and the eyebrow style for labels (#509).
  - Done when, for each element: a story per variant and state with light and dark baselines; interaction tests for
    every emitted event and its payload; keyboard and screen-reader tests, with axe reporting no serious or critical
    findings; the manifest lists every public property, event, slot and part; built output passes the strict-CSP
    check.
- `ocelle-button` and `ocelle-action-row`, the other two elements of #7, are mission 012's and are not touched here.
  #7 closes only when both missions have landed.

## Related work found

| Ref | Kind | Relation | Reason |
|---|---|---|---|
| #7 | issue (open) | **in scope, in part** | This mission covers the three status elements. The button and the action row are mission 012's. |
| Mission 012, `specs/012-button-action-row`, `triage/012-button-action-row.md` (`origin/claude/007-actions-status`, phase 5 scaffold at `5e3d44b`) | mission in implementation, not merged | out of scope; **blocks the interactive pill-tag** | 012 split these three elements out ("stay in #7 for a later status mission"). Its FR-001 to FR-006 are the **control conventions** later controls follow: one native inner control per element, link versus button (FR-002), disabled versus unavailable (FR-003), ARIA passthrough by moving attributes with `data-ocelle-moved-*` mirrors (FR-004), no ID reference across a shadow root (FR-005), and name passthrough (FR-006). The interactive pill follows them as written. It also adds `--ocelle-motion-spin`, `--ocelle-motion-turn` and changes 002's reduced-motion rule (f), which the status indicator's pulse follows. Its plan says the status mission "builds the tooltip part on #16's `ocelle-tooltip` ... without redesigning it, and its implementation of that part needs #16 merged first". |
| #16, mission 008, `specs/008-overlays` (`origin/claude/016-overlays`) | mission, design final, not merged | out of scope; **blocks the pill-tag ellipsis** | `ocelle-tooltip` (`text`, `placement`, `disabled`, `describes`; part `bubble`; `display: contents` host). Its contract gives the pill tag's use: `<ocelle-tooltip text=${this.text} ?disabled=${!this.truncated}><button class="pill">…</button></ocelle-tooltip>` inside the pill's shadow root, without `describes`, the trigger carrying its own name. Its triggers are buttons and links only (open question 1). Triage 008: #7 "must not hand-roll a tooltip". |
| #8, mission 011, `specs/011-layout-headers` (`origin/claude/008-layout-headers`, run summary written) | mission, near landing | out of scope; **supplies the eyebrow tokens** | 011's R-12 adds `font-size-eyebrow`, `font-weight-eyebrow`, `tracking-eyebrow` (0.08em) and `color-eyebrow`, uppercase in Schibsted Grotesk. Triage 011 and 012 agree that whichever of #7 and #8 lands first adds them. 011 will almost certainly land first, so the metric uses them; if it has not, this mission adds them exactly as R-12 defines them. |
| #13, mission 013, `specs/013-data-display` (`origin/claude/013-data-display`) | mission in progress | out of scope; **coordinate** | `ocelle-progress` answers #498's progress part; 013 says "the status-indicator marker is #7's". Triage 013 asks for one loading vocabulary between the two (which element signals busy, and how). The evidence chain's "compact chip step" (#517, a later #13 mission) "must not draw its own pill-tag", so that mission is **blocked by** this one. |
| #9, mission 010, `specs/010-feedback-forms` (`origin/claude/009-feedback-forms`) | mission in progress | out of scope; **coordinate** | `ocelle-notice` has `tone` with `info`, `success`, `warning`, `danger`, `neutral` on the `color-*` and `color-*-bg` tokens. The status indicator's `tone` and the pill tag's `status` should use the same values and mapping. #509's compact notice is #9's; the metric's row layout and eyebrow stay here. |
| #12 | issue (open) | out of scope | `ocelle-nav-pill` is navigation, not a status pill, and must not reuse `ocelle-pill-tag`. A nav item's count badge, if any, may use the pill tag's badge use. No dependency either way. |
| #14, mission 014 | issue (open), in design | out of scope | Selection elements; no pill, status or metric. Only #7's checklist applies there. |
| #15, mission 009 | issue (open), in design | out of scope | The flat lane has a count; if it is drawn as a badge it may use the pill tag later. No dependency. |
| #17 / PR #26 / `476602e`, `specs/005-icons-brand-mark` | mission, merged | done; **conventions apply** | Element conventions, slot convention, `naming.ts` and the manifest gate in `packages/elements/README.md`. |
| #10 / PR #24 / `3828d2f`, `specs/006-storybook-workbench` | mission, merged | done; applies | Every element adds its stories, baselines and story-level axe to the 006 harness. Nothing waits for it. |
| #23 / `e7d7d54`, op 015 / `ce1d9c7` | mission and op, merged | done; apply | Stricter mutation verdicts and the shard time limit for element source. A pulse animation and the truncation observer invite Timeout mutants. |
| #41, op 016 `ops/016-plants-affected` (`origin/claude/041-plants-affected`, approved) | op in progress | out of scope; applies when landed | `gate:plants --affected` for local phase runs, likely on main before implementation. |
| #5, #6 (merged tokens and base styles) | closed issues | done; apply | Status colours `color-{success,warning,danger,info,neutral}` and their `-bg`, `radius-pill` ("state pills only"), `space-1`/`space-2` (4/8 px), `font-size-xs`, `--ocelle-figures`. There is no line-height token at 1.2 (`tight` 1.15, `normal` 1.45, `compact` 1.5). Rule 1 of #5: a control on `accent-low` uses `accent-strong` for its border. |
| #1 | epic (open) | out of scope | Parent. Its gap rows for #498 (marker part), #509 (metric row and eyebrow), #524 and #526 close here. |
| #11 | issue (open) | out of scope; **blocked by #7** | Waits for both #7 missions; needs this mission's `@ocelle/elements` changelog entry (and `@ocelle/tokens` if a token is added). |
| `specs/`, `ops/`, `triage/` | repository | nothing to fold into | On main: specs 001 to 003 and 005 to 007, ops 004 and 015. No feature on any branch builds a pill tag, a status indicator or a metric; 012 explicitly excludes them. |
| `.specify/memory/constitution.md` II, III | constitution | applies; **decides the mono badge** | "No monospace anywhere": #526's "outlined mono badge" is set in Schibsted Grotesk with tabular figures, and the spec records the deviation (as triage 011 did for #529). "The pill radius is for state pills only." Tooltips meet WCAG 1.4.13; ARIA state on a host reaches the inner control. |
| `knowledge/speckit-flows/findings/frontend-missions.md`, `guards/vacuous-tests.md`, `runs/005-icons-brand-mark.md`, `runs/006-storybook-workbench.md` | knowledge | applies | Node 22 here against 26.13.0 in CI, `OCELLE_CHROMIUM_PATH`, no WebKit, one heavy job at a time; accessibility-tree assertions must not query an empty shadow root; Chromium accessibility pitfalls. |

## Decision

**mission.** Several mission criteria apply:

- **New public surface (MINOR).** Three new elements with attributes (`status`, `title`, `tone`, `label`,
  `display-value`, `layout`, the density and variant names), slots, parts, possibly an event for the interactive pill,
  and possibly tokens (a 1.2 line height, a pulse duration) in `@ocelle/tokens`.
- **Design decisions.** How an ellipsised static pill shows its full text when the tooltip only accepts buttons and
  links; what the interactive pill reports (native `click` like `ocelle-button`, or an `ocelle-pill-tag-*` event);
  what the status indicator is to assistive technology and how its pulse relates to #13's progress; whether the
  metric is a term and value pair or plain text; one status vocabulary across #7, #9 and #13.
- **More than one user story** (three elements, each independently testable), and **accessibility beyond a local
  fix**: a truncated label's full text, state not by colour alone, reduced motion, an interactive control's keyboard
  model and naming across a shadow root.
- **Possibly spans packages**: `@ocelle/elements` and `@ocelle/tokens`.

Why not the others:
- **op**: new public surface and open design questions rule it out.
- **fold**: 012 is the only feature on these elements' issue, and it explicitly left them out; folding them back
  would reopen a mission in phase 5 and is excluded by the operator's wave plan.
- **none**: none of the three elements exists.
- **decision-needed**: the open questions below are design questions the spec and its check put to the operator; the
  scope itself is set by the wave plan.

**Why the three together.** They are all status displays with no I/O and a small surface (2, 2 and 32 uses). They
share the status vocabulary and tone tokens, the reduced-motion rule and the eyebrow-style text. Two of them are
small, so splitting would add mission overhead without shortening the critical path. The pill tag is the large one,
and its two blocked parts (interactive, ellipsis) go in the last phases so the rest can land without waiting.

## Scope

In scope (the rest of #7). Suggested user stories, in priority order:

1. **`ocelle-status-indicator` (MVP).** `tone` on the shared status vocabulary; a marker that is always visible and
   never pulses an empty box (#498); the pulse driven by a motion token and stopped under reduced motion; visible in
   forced colours; state never by colour alone (a name or adjacent text the spec defines). No dependency.
2. **`ocelle-metric`.** `label`, `display-value` (a string shown as given, tabular figures, no formatting); the
   default stacked layout and `layout="row"`; the label in the eyebrow style on #8's eyebrow tokens (#509). A reading
   order and semantics the spec decides. Depends only on the eyebrow tokens.
3. **`ocelle-pill-tag`, static.** `status`, `title`, slotted content, badge use, the pill look on `radius-pill`;
   compact density (line height 1.2, padding 4/8) and the outlined badge variant in Schibsted Grotesk with tabular
   figures (#526). No dependency.
4. **Interactive pill tag.** A native `<button>` inside (and a link mode only if the spec keeps one), following 012's
   FR-001 to FR-006 as written; the token focus ring; a 44 px target only if the spec rules it a primary action.
   **Needs mission 012 merged** (README control conventions, shared helpers).
5. **Ellipsis with the full text (#524).** One shared truncation rule; while truncated, the full text through
   `ocelle-tooltip` exactly as 008's contract shows, the trigger keeping its own name, meeting WCAG 1.4.13.
   **Needs #16 merged.**

For each element: #7's Done-when checklist through the 006 harness, manifest entries, the README section, and the
`@ocelle/elements` changelog entry, plus `@ocelle/tokens` if tokens are added.

Out of scope:
- `ocelle-button` and `ocelle-action-row` (mission 012), `ocelle-tooltip` (#16), and any change to their interfaces.
  If this mission finds one of them insufficient, it raises it with the operator instead of changing it here.
- `ocelle-progress` (#13), the compact notice (#9), the eyebrow tokens' design (#8), `ocelle-nav-pill` (#12).

## Risks and open questions

1. **Ellipsis on a static pill.** 008's tooltip accepts buttons and links as triggers, and a static pill is not
   focusable, so keyboard and touch users would never see the full text. Options: (a) ellipsis only on the
   interactive pill, a static pill wrapping or showing its full text; (b) an ellipsised static pill becomes
   focusable (a focusable non-control, which axe and the conventions frown on); (c) the full text stays in the
   accessibility tree and the visual tooltip is pointer-only, which fails 1.4.13 and constitution III. The spec puts
   this to the operator; it must not change `ocelle-tooltip`.
2. **Interactive pill's event.** `ocelle-button` reports activation by native `click` only. The pill follows that
   unless the operator wants `ocelle-pill-tag-activate` with a payload; whether it has a pressed or toggle state
   (FR-004's `aria-pressed`) is open too.
3. **Status vocabulary.** Align `status` and `tone` with #9's notice tone (`info`, `success`, `warning`, `danger`,
   `neutral`) and settle any extra kitty-mission-ui states (for example running or blocked) against existing tokens;
   the light-mode ochre rule applies to any accent-based state.
4. **Status indicator semantics and motion.** Decorative next to text, `role="img"` with a name, or a live region;
   which tones pulse; the pulse token (012's rule (f) changes which motion tokens drop to 0 ms). One loading
   vocabulary with #13's `ocelle-progress` (triage 013).
5. **Tokens.** No token has line height 1.2; the spec either adds one with validation or accepts `line-height-tight`
   (1.15) and records the deviation. Parallel missions edit `packages/tokens/src/source.ts` and the pinned contrast
   counts, so whichever lands later rebases.
6. **Dependencies not on main.** Phases 4 and 5 cannot start their red tests until 012 and #16 have merged. If either
   slips, phases 1 to 3 can land as a partial delivery and #7 stays open.
7. **Source issues and inventory unread.** #498, #509, #524 and #526 may carry exact values; the kitty-mission-ui
   usage inventory (32, 2 and 2 uses with their modifiers) should be supplied by the operator, as for 013. The spec
   reads them as requirements only (constitution VI).
8. **Environment.** Node 22 against 26.13.0, `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`,
   no WebKit (truncation and tooltip behaviour measured in Chromium only), one heavy job at a time.

## What would change this decision

- **The operator wants the smallest mission:** the status indicator and metric become this mission, and the pill tag
  becomes its own mission after 012 and #16 merge.
- **012 or #16 changes its interface before merging:** this record's dependencies are re-read and the spec prompt
  updated; the decision stays.
- **#8 is abandoned or reworks its eyebrow tokens:** this mission defines the eyebrow tokens itself, coordinating with
  #13's data-table headers.
- **The operator settles open question 1 as "no ellipsis on static pills" before the spec:** user story 5 shrinks to
  the interactive pill, with the same decision.
