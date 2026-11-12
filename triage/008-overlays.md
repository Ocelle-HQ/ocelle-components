---
triage: 008
issues: [16]
decision: mission
target: "overlays"
in_scope: [16]
out_of_scope: [1, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17, 23]
semver: minor
spec_prompt: "Build the overlay elements of issue #16 (triage/008-overlays.md) in @ocelle/elements, following the element conventions of mission 005 (README § Element conventions, manifest gate): a dialog (modal, on the top layer, `--ocelle-color-overlay` backdrop, sized by `--ocelle-dialog-max-inline` and `--ocelle-dialog-max-block`), a drawer (a side panel built on the same modal machinery, the surface #12's personal drawer consumes) and a tooltip (the surface #7's pill-tag ellipsis and #12's icon-only nav label bubble consume, meeting WCAG 1.4.13: dismissable with Escape, hoverable, persistent, shown on focus as well as hover); for each, its full keyboard and focus model (initial focus, focus kept inside a modal, focus returned to the opener, Escape), its accessible name and description without an ID reference crossing a shadow root, a close affordance using `ocelle-icon name=\"close\"` where it has one, `ocelle-<element>-<action>` events with their payloads and whether they are cancelable, reduced motion, forced colours, and the stacking of a tooltip inside a dialog or drawer; settle at clarify and plan which web-platform features they rest on (`<dialog>`, the Popover API, anchor positioning, `inert`, `closedby`) against the engine floor Chromium 120 / WebKit 16.4 and raise the floor only by operator decision, and add any new token (drawer width, tooltip offset or delay) to @ocelle/tokens with its own validation; a story per variant and state in light and dark with top-layer content captured per #10's FR-012 and axe clean; the consumers' own elements (#7, #12) and any other issue's popover-like surface stay in their issues."
status: proposed
---

# Triage 008: Overlays: dialog, drawer and tooltip (#16)

## Issues read

- **#16** (open). **The issue's body, comments, labels, milestone, parent and linked pull requests could not be read
  from this session**: `gh issue view` and `gh search issues` fail with HTTP 403 (GitHub GraphQL is not available
  here), the REST route `gh api repos/.../issues/16` was refused by the session's permission settings, and no GitHub
  tool is available. Nothing in this record is quoted from #16. What it says about #16 rests on these sources:
  - The operator's brief for this triage: #16 provides a **tooltip** and a **drawer** that #7 (pill-tag ellipsis
    tooltip) and #12 (personal drawer, icon-only nav label bubble) will consume. The working branch is
    `claude/016-overlays`.
  - `packages/elements/README.md` § Icons (merged with mission 005): the `close` icon's consumer need is "closing a
    **dialog or drawer** and dismissing (#16)".
  - `specs/005-icons-brand-mark/spec.md:89-90` and `research.md:296-299`: "the dialog and drawer (#16) all need
    icons"; `triage/005-icons-brand-mark.md:51`: "dialog and drawer close (#16)".
  - `packages/tokens/src/source.ts`: `color-overlay` ("dialog backdrop"), `dialog-max-inline`,
    `dialog-max-block`, `motion-fast`, `motion-base`, `easing-standard` already exist (mission 002) for these
    surfaces.
- So #16 is read here as **dialog, drawer and tooltip**, with a dismiss action. Whether it names more (a popover or
  menu, a toast, a sheet, a confirm variant), names consumer issues in spec-kitty-design, or sets acceptance criteria
  is not known. **The operator should confirm the scope against the issue before approving**; the specify step must
  read #16 in full (see *What would change this decision*).

## Related work found

| Ref | Kind | Relation | Reason |
|---|---|---|---|
| #16 | issue (open) | in scope | This mission. |
| #17 / PR #26 / `specs/005-icons-brand-mark` | mission, merged (`476602e`) | out of scope (done); **conventions apply** | Lit 3, `define()`, `static properties`, token-only `static styles`, `:host([hidden])`, forced-colours variant rule, generated `custom-elements.json` and the `manifest` gate, stories per variant and state, engine floor list (README § Element conventions, § Engines). The `close` icon exists for #16. The slot convention (`icon` / `trailing` slots, `iconSlotStyles`) applies to a close button with an icon; the naming rule (an icon-only control names its inner `<button>`, never its icon) applies to the dialog's and drawer's close control. |
| #10 / branch `origin/claude/010-storybook-workbench` / `specs/006-storybook-workbench` | mission, **not merged** | **blocks** (stories, baselines, axe only) | Its design is final. US1 scenario 15 / FR-012: a story that "opens a top-layer surface (a popover, a dialog)" is captured with that content, which overlays need. Its Out of Scope gives element stories and baselines to each element issue (#7 to #9, #12 to #17); triage 006: "An element landing before #10 would fall under 001's exception". Spec and plan of this mission can proceed now; its story, baseline and axe work should be written against #10's harness, so implementation of that phase starts after #10 merges (or merges `main` once it does). |
| #23 / PR #25 / `specs/007-mutation-gate-strictness` | mission, merged (`e7d7d54`) | out of scope (done); applies | The stricter mutation verdicts apply to this mission's changed source. Focus and timing code (open, close, hover delays) is where Timeout mutants appear; plan for kills that decide, not timeouts. |
| #7 | issue (open) | out of scope; **blocked by #16** | Consumes the tooltip for the pill-tag ellipsis. Its own elements (`ocelle-button`, `ocelle-action-row`, pill tag) stay there. If #7 is specified first, it must not hand-roll a tooltip (constitution VI). |
| #12 | issue (open) | out of scope; **blocked by #16** | Consumes the drawer (personal drawer) and the tooltip (icon-only nav label bubble). `ocelle-top-bar`, `ocelle-nav-item` and the personal rail stay there. The drawer's placement, width and chrome tokens (personal rail uses the dark chrome, constitution II) are a need #12 states, so this mission's spec reads #12 for the drawer's requirements without building #12's content. |
| #15, #9, #8 | issues (open), triaged in parallel (009, 010, 011) | out of scope; **check for overlap** | Not read from this session. #15 is the scroller (triage 005: "scroller edges (#15)"); what #8 and #9 build is not known here (a 006 plan review, `reviews/plan/round-3/lens-fresh.yaml:31`, names "#7 to #9, #12 to #16" only as a range that holds the first text-field, search or select element). If #8 or #9 has a listbox or menu popup, it is a second top-layer surface: the plan of whichever lands second must reuse this mission's dismissal and stacking rules, or the operator moves the shared part here. Triages 009 to 011 should be compared with this one before both are approved. |
| #13, #14 | issues (open) | out of scope | Disclosure and copy field: inline, not overlays. A "Copied" confirmation in #14, if it is a transient bubble, would reuse the tooltip or a status region; that is #14's decision. |
| #11 | issue (open) | out of scope; blocked by #16 | Release v1.0.0: constitution VI requires every Kitty Desktop need be met by 1.0.0; this mission adds `@ocelle/elements` (and possibly `@ocelle/tokens`) changelog entries. |
| #1 | epic (open) | out of scope | Parent epic (assumed; #16's parent could not be read). |
| `.specify/memory/constitution.md` III | constitution | applies | "tooltips meet WCAG 1.4.13"; no ID reference across a shadow root (a tooltip's `aria-describedby` from a slotted or host trigger is exactly this case); full keyboard model of the ARIA pattern (dialog: `aria-modal`, focus containment, Escape); motion respects `prefers-reduced-motion`; axe clean on every story. |
| constitution I, IV, V | constitution | applies | Events `ocelle-<element>-<action>`, bubbling and composed; no I/O; no inline style (positioning a tooltip by setting `style` on an element violates CSP `style-src 'self'`, so positioning must use adopted stylesheets, CSS anchor positioning or CSSOM property writes the CSP allows; this is a plan question); interaction tests for every event and keyboard path. |
| `packages/elements/README.md` § Engines | conventions | applies; **design question** | Floor Chromium 120 / WebKit 16.4. `<dialog>` and `inert` are within it. The Popover API needs WebKit 17, CSS anchor positioning Chromium 125 and WebKit 26, `closedby` Chromium 134. Raising the floor is a decision for the operator (Kitty Desktop's webview is WebKit). |
| `packages/styles/README.md:171-172`, `specs/003-base-styles` FR-017 | base styles (merged) | applies | Prose in a modal or non-modal `<dialog>`, a popover or a side drawer without both inline insets or a width shrinks to fit and the table becomes a tab stop. The dialog and drawer must give their content box a definite width (or document it), and a story with prose inside proves it. |
| `knowledge/speckit-flows/findings/frontend-missions.md` | findings | applies | 003's squad findings came from measuring fixes in dialogs, popovers and drawers; plan reviewers should measure in the top layer, not only in block flow. |
| `ops/004-token-source-mutation`, `specs/001` to `003`, `005`, `007` | repository | none to fold into | All merged; none in progress covers overlays. `specs/006` (unmerged) is a harness, not an element feature, and its spec excludes element stories. |

## Decision

**mission.** Several rules each require it:

- **New public surface.** New elements with attributes, properties, events, slots and possibly parts and CSS custom
  properties in the manifest (constitution VII: MINOR before and after 1.0.0), and possibly new tokens in
  `@ocelle/tokens` (a drawer width, a tooltip offset or show delay), which would **span packages**.
- **Design decisions.** Which platform features to rest on against the engine floor; how a tooltip describes a
  trigger that lives in another shadow root or in light DOM without a cross-root ID reference; how a tooltip is
  positioned under strict CSP; whether close is cancelable and what its payload is; how the drawer relates to the
  dialog (one element with a placement, or two).
- **More than one user story.** Dialog, drawer and tooltip are three independently testable outcomes.
- **Accessibility behaviour beyond a local fix.** Modal focus management, WCAG 1.4.13 and `aria-modal` are
  constitution III's non-negotiable core.

`op` does not apply (new surface and open design questions). `fold` does not apply: nothing in progress covers
overlays, and #10's spec explicitly leaves element stories to element issues. `none` does not apply: the need is
recorded by two consumer issues (#7, #12) and the README. `decision-needed` was weighed because #16's text could not
be read, but the decision does not depend on it: whatever #16 lists among overlays, it is new surface needing design.
Only the scope does, and that is settled at specify from the issue itself.

## Scope

In scope: **#16** only, as one mission, with one user story per surface in this priority:

1. **Dialog** (P1): the modal surface the others build on: top layer, `--ocelle-color-overlay` backdrop, sized by
   the existing `dialog-max-*` tokens, initial focus, focus kept inside, focus returned to the opener, Escape and an
   optional close control (`ocelle-icon name="close"`, named on its inner `<button>`), the close event, reduced motion,
   forced colours, prose inside it at a definite width.
2. **Drawer** (P2): the side panel #12's personal drawer needs, on the same machinery, start or end side under `ltr`
   and `rtl`, on the chrome or main grounds as #12 requires.
3. **Tooltip** (P3): the label and ellipsis bubble #7 and #12 need, WCAG 1.4.13 (dismiss with Escape without moving
   focus, hoverable, persistent while hovered or focused), shown on focus and hover, never the only name of a
   control, and stacking above a dialog or drawer when its trigger is inside one.

Kept together because they share the overlay rules (top layer, dismissal, Escape order when a tooltip is open inside
a dialog, event naming, motion) and because shipping the tooltip separately would leave that stacking untested. The
mission's spec may still find the tooltip needs its own design (engine floor, positioning under CSP); if so, the
operator may split it at clarify (see below).

Out of scope: the consumers' elements (#7, #12), other popup surfaces of #8, #9 or #14 unless the operator moves them
here, a toast or notification region, the Storybook harness itself (#10), and any change to the engine floor without
an operator decision.

## Risks and open questions

1. **#16 not read.** Scope beyond dialog, drawer and tooltip, any acceptance criteria and any spec-kitty-design issue
   #16 cites are unknown to this record. The operator should check #16 against *Scope* before approving; specify reads
   it in full and records its sources (as `specs/005/sources/README.md` did).
2. **Engine floor.** The cleanest tooltip uses the Popover API and anchor positioning, both above WebKit 16.4. Options:
   (a) stay on the floor: `<dialog>` for dialog and drawer, a top-layer-free tooltip positioned by script through
   CSSOM writes; (b) raise the floor to WebKit 17 for the Popover API (Kitty Desktop's webview must be checked);
   (c) use anchor positioning with a fallback. Operator decision at clarify.
3. **Cross-root description.** A tooltip that describes a trigger in another shadow root cannot use
   `aria-describedby` (constitution III). Options include the tooltip element wrapping its trigger in one shadow root,
   `ElementInternals` / ARIA element reflection (engine support to measure), or the tooltip as a light-DOM part. This
   is the mission's main design risk and decides #7's and #12's markup.
4. **Order with #10.** Stories, baselines and axe need #10's harness. If this mission's implementation reaches its
   story phase before #10 merges, either wait or land under 001's exception and add baselines after; waiting is
   recommended, since top-layer capture (006 FR-012) is exactly what overlays need tested.
5. **Overlap with #8 / #9.** A select or search with a popup listbox would be a second top-layer surface with its own
   dismissal. Compare triages 010 and 011 before approving both.
6. **Tokens.** A drawer width or tooltip delay token is new `@ocelle/tokens` surface with brand rules and contrast
   checks (mission 002's validation); the tooltip's ground and ink on both themes need a contrast entry.

## What would change this decision

- #16, once read, names only one surface, or only a fix to an existing element: still `mission` if it adds an
  element; `op` only if it adds no public surface (unlikely).
- #16 names further surfaces (popover menu, toast, confirm dialog): they join this mission if they share the dialog's
  machinery, otherwise the operator splits them out.
- The operator decides at clarify that the tooltip needs a raised engine floor or its own design round: split the
  tooltip into its own mission after the dialog and drawer; #7 and #12 are then blocked by that one for the tooltip.
- Triage 010 or 011 brings a popup surface the operator wants designed once: widen this mission to a shared overlay
  layer, or make the second mission depend on this one.
