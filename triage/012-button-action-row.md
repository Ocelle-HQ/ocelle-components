---
triage: 012
issues: [7]
decision: mission
target: "button-action-row"
in_scope: [7]
out_of_scope: [1, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 23]
semver: minor
spec_prompt: "Build the action controls of issue #7 (triage/012-button-action-row.md) in @ocelle/elements on mission 005's element conventions and slot convention, spec directory specs/012-button-action-row: ocelle-button (variant, size, label, disabled, busy, href rendering a link, click; ARIA passthrough of aria-expanded, aria-controls and aria-current to the inner control with no ID reference crossing a shadow root (spec-kitty-design#501); slotted icons through the icon slot (#496, #509); a compact inline padding for breadcrumb items that #12 consumes (#518); a compact text scale, a quiet bordered variant, a 44 px minimum target from --ocelle-target-min and a busy spinner that does not overlap the label and respects reduced motion (#532)) and ocelle-action-row (row-id, layout, presentation, ocelle-action-row-activate carrying the row id, aria-busy; flush presentation, compact navigation density, no zero width when shrink-wrapped (#493); route mode with aria-current page or true (#495); an unavailable state with a visual and assistive-technology cue (#504); card layout with word wrapping only in tags, a title gap, a trailing slot for the arrow-end icon (#508); hover border and surface from tokens (#525); a label property or forwarded aria-labelledby (#528)); one shared answer for link versus button, disabled versus unavailable and name passthrough that later controls (#12, #14) follow; each element meeting #7's Done-when checklist; ocelle-pill-tag, ocelle-status-indicator and ocelle-metric stay in #7 for a later status mission."
status: approved
decided_by: "human:jeroennouwsdev"
decided_at: 2026-11-13T18:29:42Z
---

# Triage 012: Action controls of #7, `ocelle-button` and `ocelle-action-row`

## Issues read

**Where the issue text came from.** This session could not read GitHub directly. `gh` fails on GraphQL with HTTP
403, and REST calls through `gh api` and `curl` were refused by the session's permission rules. On 2026-11-13 the
coordinator fetched the text through the GitHub tools and saved it as two scratchpad files, `issue-7/issue-7.md` (the
body of #7) and `issue-7/epic-1-sub-issues.md` (all 16 sub-issues of #1, with state and body). This record rests on
that text as of 2026-11-13. I did not read the spec-kitty-design issues that #7 cites (#493, #495, #496, #498, #501,
#504, #508, #509, #518, #524 to #526, #528, #532). The few quoted in `specs/005-icons-brand-mark/sources/README.md`
are the exception.

- **#7** "Elements: actions and status — ocelle-button, ocelle-pill-tag, ocelle-status-indicator, ocelle-metric,
  ocelle-action-row". It is open, author MOES-Media, created 2026-11-02, parent epic #1. It has no labels, milestone,
  comments, sub-issues or linked pull requests. The issue covers five primitives. Each starts from "what
  kitty-mission-ui uses today on the `sk-*` equivalents", and every spec-kitty-design gap it lists closes in the first
  release:
  - `ocelle-button` (37 uses): `variant`, `size`, `label`, `disabled`, `busy`, `href` (renders a link), click. Plus:
    ARIA passthrough of `aria-expanded`, `aria-controls` and `aria-current` to the inner control (#501); sized slotted
    SVG icons in an `icon` slot before the label (#496, #509); compact inline padding for breadcrumb items (#518); a
    compact text scale, a quiet bordered variant, a 44 px minimum target and a busy spinner that does not overlap the
    label (#532).
  - `ocelle-pill-tag` (32 uses): `status`, `title`, slotted content, badge use. Plus: an interactive variant with a
    native button inside and a shared ellipsis that shows the full text as a tooltip, with a focus ring (#524);
    compact density (line height 1.2, padding 4/8) and an outlined mono badge variant (#526).
  - `ocelle-status-indicator` (2 uses): `tone`. Plus: a visible marker that never pulses an empty box (#498).
  - `ocelle-metric` (2 uses): `label`, `display-value`. Plus: `layout="row"` and the eyebrow style for labels (#509).
  - `ocelle-action-row` (9 uses): `row-id`, `layout`, `presentation`, `ocelle-action-row-activate` carrying the row
    id, `aria-busy`. Plus: a flush presentation, a compact navigation density and no zero width when shrink-wrapped
    (#493); a route mode that sets `aria-current="page"` or `"true"` (#495); an unavailable or disabled state (#504);
    a card layout that wraps between words only in `tags`, with a title gap token or part and a `trailing` slot for
    an arrow (#508); hover border and surface from tokens (#525); a `label` property or a forwarded `aria-labelledby`
    (#528).
  - Done when, for each element: a story per variant and state with light and dark baselines; interaction tests for
    every emitted event and its payload; keyboard and screen-reader tests, with axe reporting no serious or critical
    findings; the manifest lists every public property, event, slot and part; built output passes the strict-CSP
    check.
- **#1** (from the sub-issue file and the excerpts in `specs/009-workflow-layouts/sources/issues.md` on
  `origin/claude/015-workflow-layouts`): events are named `ocelle-<element>-<action>` and are bubbling and composed.
  The epic's example is `ocelle-action-row-activate`. Nothing is ported from Spec Kitty. #11 ships v1.0.0 only when
  every gap row is met.

## Related work found

| Ref | Kind | Relation | Reason |
|---|---|---|---|
| #7 | issue (open) | **in scope, in part** | This mission covers `ocelle-button` and `ocelle-action-row`. `ocelle-pill-tag`, `ocelle-status-indicator` and `ocelle-metric` stay in #7 for a later status mission (Scope). #7 closes only when both missions have landed. |
| #1 | epic (open) | out of scope | Parent. Its gap rows for #493, #495, #496 (button part), #501, #504 (action-row part), #508, #518, #525, #528 and #532 close here. |
| #17 / PR #26 / `476602e`, `specs/005-icons-brand-mark` | mission, merged | done, was blocking; **conventions apply** | `packages/elements/README.md` has the element conventions (Lit 3.3.3, `define()`, token-only static styles, the browser build, the manifest gate) and the slot convention. The convention covers the `icon` and `trailing` slots, `iconSlotStyles`, row padding and the naming rule that an icon-only control names its inner control. The README already shows `<ocelle-button><ocelle-icon slot="icon" …>` "which #7 will add". The `arrow-end` icon exists for "the action row's trailing arrow (#7)". |
| #23 / PR #25 / `e7d7d54` | mission, merged | done; applies | Stricter mutation verdicts. Busy and hover timing code invites Timeout mutants. |
| #5, #6, #2 to #4, #20 | closed issues, merged | done; applies | The tokens already have `target-min` (2.75rem, "meets #532"), `line-height-compact`, `font-size-xs`/`sm`, `color-control-border`, `color-hover-bg`, `color-disabled-ink`/`-bg`, `color-accent-low`, `radius-2`, `radius-row`, `elevation-row`, `motion-fast` (0 ms under reduced motion) and `icon-size`. Rule 1 of #5 applies: a control on `accent-low` uses `accent-strong` for its border. There is no action-row hover-border or title-gap token yet. `base.css` styles element hosts and identifier wrapping (#535), which bears on #508's "wraps between words only in `tags`". |
| #12 | issue (open), wave 2 | out of scope; **blocked by this mission** (`ocelle-button`) | `ocelle-breadcrumbs` (#518) consumes the button's compact breadcrumb padding. `ocelle-top-bar`'s "menu button" and the nav item's `aria-current` will follow the link, current and name conventions set here. |
| #14 | issue (open), wave 2 (triage 014) | out of scope; **related** | `ocelle-copy-field`'s "flush Copy control" may use `ocelle-button`. `ocelle-link` (#522) is a text-styled link that emits `ocelle-link-activate`. It differs from `ocelle-button href`, which is a link styled as a button. The two must not overlap, and the spec states where each one applies. |
| #16 / `origin/claude/016-overlays`, `specs/008-overlays` | mission, design final, not merged | out of scope; **blocks the pill-tag part of #7 only** | `ocelle-tooltip` is "used by … `ocelle-pill-tag`'s ellipsis". The button and the action row need no overlay. The 008 dialog's close control is its own inner button, not `ocelle-button`, so there is no dependency either way. |
| #10 / `origin/claude/010-storybook-workbench`, `specs/006-storybook-workbench` | mission, design final, not merged | out of scope; **blocks baselines and story-level axe only** | "Each element issue adds its own stories" to the 006 harness. Behaviour, keyboard, accessibility-tree and in-test axe checks do not wait for it. If this mission lands first, its baselines fall under 001's "gates absent" exception, as 005's did (005 `plan.md` Complexity Tracking). The rebase order is the same as for 005. |
| #8 / triage 011 (`origin/claude/008-layout-headers`) | issue (open), in design | out of scope; **coordinate** | Triage 011 sends #509's eyebrow tokens to whichever of #7 and #8 lands first. This mission does not take them: the eyebrow belongs to `ocelle-metric`, in the later status mission. `ocelle-button` and `ocelle-action-row` may be slotted into cards and headers, with no dependency either way. |
| #9 / triage 010 (`origin/claude/009-feedback-forms`) | issue (open), in design | out of scope; **coordinate** | It sets the form-control convention (ElementInternals or a light-DOM control). If `ocelle-button` is to submit or reset a light-DOM form, it follows that convention (open question 2). The compact sizing convention (#509) is shared: `size="compact"` should mean the same in both. Whichever lands second aligns. |
| #13 | issue (open), wave 2 (triage 013) | out of scope | `ocelle-progress` also cites #498, the issue behind `ocelle-status-indicator`. That matters to the status mission, not to this one. No button or row is named. |
| #15 | issue (open), triage 009 | out of scope | Only #7's Done-when checklist is used there. No dependency. |
| #11 | issue (open) | out of scope; **blocked by #7** | Needs changelog entries for `@ocelle/elements` (and `@ocelle/tokens` if tokens are added), and waits for both #7 missions. |
| `specs/`, `ops/`, `triage/` | repository | nothing to fold into | `specs/005` and `007` are merged. 008 to 011 (overlays, workflow layouts, feedback and forms, layout and headers) are on their own branches and none covers a button or an action row. `ops/004` is unrelated. No earlier triage covers #7. |
| `knowledge/speckit-flows/findings/frontend-missions.md`, `guards/vacuous-tests.md`, `runs/005-icons-brand-mark.md` | knowledge | applies | Node 22 here against 26.13.0 in CI, `OCELLE_CHROMIUM_PATH`, no WebKit, one heavy job at a time. Accessibility-tree assertions must not query an empty shadow root. 005 (two elements) needed 5 phases and 11 review rounds, which is why the status elements are split out. |

## Decision

**mission.** Several mission criteria apply:

- **New public surface (MINOR).** Two new elements with their attributes, properties, an event
  (`ocelle-action-row-activate` and its payload), slots (`icon`, `trailing`, `tags` and the card parts), parts, and
  possibly new tokens (action-row hover border and surface, title gap) in `@ocelle/tokens`.
- **Design decisions.** How `href` switches the inner control to a link, and what `disabled` and `busy` mean then.
  How `aria-controls` (an ID reference) reaches the inner control when constitution III and ADR-0078 D5 forbid ID
  references across a shadow root. Disabled versus unavailable (#504). Whether a button takes part in forms. What
  activates a row and what the event carries. Route mode `aria-current` for the row against the button's passthrough.
  Name passthrough (#528).
- **More than one user story**, and **accessibility beyond a local fix**: keyboard models, busy announcement, current
  and unavailable states, and naming across shadow roots.
- **Possibly spans packages**: `@ocelle/elements` and `@ocelle/tokens`.

Why not the others:
- **op**: new public surface and open design questions rule it out.
- **fold**: nothing in progress covers a button or an action row. 005 deliberately left them to #7.
- **none**: neither element exists.
- **decision-needed**: the open questions are design questions that the spec and its check can put to the operator.
  The split below is a scoping choice this record proposes, and the operator can reverse it at approval.

**Why these two together, and the other three apart.**
- *Together.* `ocelle-button` and `ocelle-action-row` are the library's first interactive controls. They share the
  slot convention's `icon` and `trailing` slots. They also share the questions every later control inherits: link
  versus button, `aria-current`, disabled versus unavailable, and name passthrough across a shadow root. Deciding these
  once, with two real consumers proving the answer, costs less than deciding them twice. `ocelle-button` alone is also
  an independently testable outcome, and that alternative is listed below.
- *Apart.* `ocelle-pill-tag`, `ocelle-status-indicator` and `ocelle-metric` are status displays with a different
  surface. The pill tag's ellipsis tooltip is blocked by #16. The metric's eyebrow style is shared with #8's eyebrow
  tokens. Taking them out keeps this mission close to 005's size and lets #12 consume `ocelle-button` sooner.

## Scope

In scope (part of #7). Suggested user stories, in priority order:

1. **`ocelle-button` (MVP).** `variant` (including the quiet bordered variant), `size` (including the compact text
   scale and the compact breadcrumb padding #12 needs), `label`, `disabled`, click. A 44 px minimum target from
   `--ocelle-target-min`, slotted icons through the `icon` slot, and an icon-only button named on its inner control.
   The token focus ring and forced colours.
2. **Link mode and ARIA passthrough.** `href` renders a link with link semantics (and a defined meaning for
   `disabled`). `aria-expanded`, `aria-controls` and `aria-current` reach the inner control without an ID reference
   crossing a shadow root (#501).
3. **Busy.** `busy` shows a spinner that does not overlap the label or change the button's size. The busy state is
   announced and blocks activation as the spec decides. The spinner stops under reduced motion and is visible in
   forced colours (#532).
4. **`ocelle-action-row`.** `row-id`, `layout`, `presentation`, `ocelle-action-row-activate` (bubbling and composed,
   payload with the row id, from pointer and keyboard), `aria-busy`. The flush presentation, compact navigation
   density and shrink-wrap width (#493). The `label` property or a forwarded `aria-labelledby` (#528). Hover border
   and surface from tokens (#525).
5. **Row states and card layout.** Route mode with `aria-current="page"` or `"true"` (#495). An unavailable state with
   a visual and an assistive-technology cue (#504). A card layout with word wrapping only in `tags`, a title gap, and a
   `trailing` slot holding `arrow-end` (#508).

For each element: #7's Done-when checklist (stories and baselines through #10's harness when it has merged), the
manifest entries, the README section, and the `@ocelle/elements` changelog entry, plus `@ocelle/tokens` if tokens are
added.

Out of scope:
- `ocelle-pill-tag` (#524, #526), `ocelle-status-indicator` (#498) and `ocelle-metric` (#509 row layout and eyebrow).
  They stay in #7 for a later status mission, which is blocked by #16 for the pill-tag ellipsis and coordinates with
  #8 on the eyebrow tokens and with #13 on #498.
- `ocelle-breadcrumbs` (#12) itself. This mission supplies only the button's compact padding.
- `ocelle-link` (#14), the dialog's own close control (#16), and form-field elements (#9).
- The Storybook harness, visual gate and axe gate (#10).

## Risks and open questions

1. **ID references across the shadow root.** `aria-controls` names an element in the light DOM, and an attribute
   copied onto the inner `<button>` points into the wrong tree. Options include ARIA element reflection
   (`ariaControlsElements`, which may reference shadow-including ancestors), a light-DOM inner control, or a
   restricted form. The spec decides, with Chromium behaviour measured and the WebKit gap stated, since no WebKit is
   available here. #528's forwarded `aria-labelledby` has the same problem.
2. **Form participation.** An inner `<button>` in a shadow root does not submit the host page's form. Either the
   button is form-associated (and follows #9's convention), or it is documented as a non-submitting control. This is
   an operator question for the spec check.
3. **`href` plus `disabled` or `busy`.** A link has no `disabled`. The spec states whether it drops `href`, uses
   `aria-disabled`, or forbids the combination.
4. **Source issues unread.** #493, #495, #501, #504, #508, #518, #525, #528 and #532 may carry details (exact
   paddings, density values, hover colours) beyond #7's one-line summaries. The spec session reads them as
   requirements only (constitution VI).
5. **New tokens.** Hover border and surface and a title gap may need `--ocelle-*` tokens, contrast pairs and
   validation in `packages/tokens/src/source.ts`. Parallel missions (#8 eyebrow tokens, #16, #9) also edit that file,
   so whichever lands later rebases.
6. **Storybook.** #10 is not merged. Plan stories against its 006 harness and keep the baselines and story-level axe
   in a phase that can follow its merge, or record 001's exception as 005 did.
7. **Consumers waiting.** #12's breadcrumbs need the button's compact padding and #14 may need the button. Keep
   `ocelle-button` in the first phases so a partial landing would still unblock them.
8. **Environment.** Node 22 against 26.13.0, `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`,
   one heavy job at a time.

## What would change this decision

- **The operator wants the smallest mission:** `ocelle-button` alone becomes this mission, and `ocelle-action-row`
  becomes a mission of its own after it, inheriting the link, current and name conventions from it.
- **The operator wants #7 in one mission:** add the three status elements. The mission is then blocked by #16 for
  the pill-tag ellipsis and by the #8 coordination for the eyebrow tokens, and its size goes well beyond 005's.
- **#16 merges before this starts and #8 has already added the eyebrow tokens:** folding the status elements back in
  becomes cheaper. It is still a size question, not a dependency.
- **The operator settles form participation or link-mode semantics as a library-wide rule first**, for example
  through #9's convention: that question leaves this spec and becomes a precondition.
