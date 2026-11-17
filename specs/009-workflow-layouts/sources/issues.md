# Verbatim issue text (fetched by the orchestrator via the GitHub MCP read tool, 2026-11-12)

All issues are open, author MOES-Media, no labels shown, no milestone, no linked PRs. #15 has no comments and no sub-issues; its parent is #1.

## #15 Elements: workflow and screen layouts — ocelle-workflow-board, ocelle-workflow-lane, ocelle-list-detail, ocelle-scroller

Layout primitives for the board, pipeline and list/detail screens. Each closes the spec-kitty-design gap named.

### `ocelle-workflow-board` and `ocelle-workflow-lane` (class families today)
- [ ] Elements, not classes.
- [ ] A lane minimum width token so five lanes fit a 1280 px window beside a context sidebar; the board scrolls inside itself only when narrower (#507).
- [ ] A `flat` lane variant: no nested card chrome, a small uppercase mono title and a count (#506).
- [ ] Lane titles carry their count to assistive technology.

### `ocelle-list-detail`
- [ ] A fixed list track (width token), the selected record's detail beside it, a border between panes, and a collapse to one column driven by the **container** width (not the viewport) and by the app shell's narrow state (#530).
- [ ] An inspector pane width token (260 px, #505) for the Pipeline inspector.

### `ocelle-scroller`
- [ ] A horizontally scrolling strip that is a focusable region (`role="region"`, a name, `tabindex="0"`) **only while it overflows**, shows the token focus ring, scrolls with arrow keys, and shows an edge fade on each side with content off-screen, on logical sides (#514).

### Done when
Same checklist as the actions issue, plus resize tests at 1280 px and at the narrow tier.

(`#nnn` refers to spec-kitty/spec-kitty-design issues.)

## #7 (the "actions issue") — only its "Done when" checklist, which #15 references

### Done when, for each element
- [ ] A story per variant and state, visual baselines in light and dark.
- [ ] Interaction tests assert every emitted event and its payload.
- [ ] Keyboard and screen-reader behaviour tested; axe reports no serious or critical findings.
- [ ] Custom-elements manifest lists every public property, event, slot and part.
- [ ] Built output passes the strict-CSP check.

## #1 Epic (relevant excerpts, verbatim)

Naming (decided):
- Elements: `ocelle-*` (for example `ocelle-button`). Never `sk-`.
- Tokens: `--ocelle-*` (for example `--ocelle-space-4`). Never `--sk-`.
- Events emitted by elements: `ocelle-<element>-<action>` (for example `ocelle-action-row-activate`), `bubbles` and `composed`.
- CSS parts and slots keep plain names (`part="heading"`, `slot="tags"`).

Written from scratch, not ported: nothing is ported from spec-kitty/spec-kitty-design; its open issues are used only as a requirements list. The Desktop V2 prototype is composition evidence only (spec-kitty-design#470).

Scope: Desktop V2 primitives (spec-kitty-design#470): action-row, app-shell, button, card, context-sidebar, data-table, disclosure, empty-state, event-timeline, facts, form-select, metric, nav-pill, notice, page-header, personal-rail, pill-tag, progress, segmented-choice, status-indicator, workflow-board, workflow-lane, plus section-header, form-input, breadcrumbs, copy-field, evidence-chain, prose.

Gap table row: | #505 #506 #507 #514 #530 | inspector width, flat lane, lane min width, scroller, list/detail layout | #15 workflow and layouts |

## #12 Elements: app frame and navigation — ocelle-app-shell, ocelle-top-bar, ocelle-nav-item, ocelle-nav-pill, ocelle-breadcrumbs, ocelle-skip-link (not started; relevant excerpt)

### `ocelle-app-shell`
- [ ] Layouts: rail + context sidebar + content, and a **project layout** (sidebar only, no rail) (#499).
- [ ] A **collapsed tier**: the sidebar becomes an icon column while the rail stays (#499).
- [ ] Container thresholds set by the consumer (properties or tokens), not fixed 860 / 1100 / 720 px (#499).
- [ ] A **personal drawer** pattern for the no-team-context state at narrow widths (#450), using `ocelle-drawer`.
- [ ] The content cell lets slotted content opt out of block-end and inline-end padding, so a side panel runs flush to the edges without negative margins (#512).
Done when: Same checklist as the actions issue, plus keyboard tests for every tier change and a reflow test at 320 px.

## #13 Elements: data display (in the next wave; relevant excerpt)

In Spec Kitty several of these exist only as class families, which forces `class=` into consumers. Here **every one is an element** (spec-kitty-design#523). No monospace anywhere (#5): values, ids and code use Schibsted Grotesk with tabular figures; digests are shown in groups of four.

### `ocelle-code-block`
- [ ] Preformatted block on `color-inset`, in the sans with tabular figures (no monospace), with a wrap or sideways-scroll policy, a reading-width cap, line height `relaxed`, and a scroll region that is a tab stop only while it overflows (#520, same pattern as `ocelle-scroller`).

## #16 Elements: overlays — ocelle-dialog, ocelle-drawer, ocelle-tooltip (sibling in design now as 008)

Built on native `<dialog>` with `showModal`; focus in on open, returned on close; Escape closes. The drawer serves the app shell's narrow-width personal drawer (#450) and kitty-mission-ui's flyouts. `ocelle-tooltip` meets WCAG 1.4.13. Done when: same checklist as the actions issue, plus focus-management tests.

## #9 Elements: feedback and forms — ocelle-notice, ocelle-form-input, ocelle-form-select (sibling in design now as 010)

Notice with tone/announce/role, compact size, no empty heading; form elements through ElementInternals; no ID reference crosses a shadow root (ADR-0078, D5). Done when: same checklist as the actions issue plus form-submission and screen-reader tests.

## #8 Elements: layout and headers — ocelle-card, ocelle-section-header, ocelle-page-header, ocelle-context-sidebar, ocelle-personal-rail (sibling in design now as 011)

### `ocelle-card` (4 uses): `inset`, slotted content; compact density (#516).
### `ocelle-section-header` and `ocelle-context-sidebar` (`label` names the landmark): dividers, footer, eyebrow-only mode (#497).
### `ocelle-page-header`: compact size: 24 px display title, 12 px mono uppercase tracked subtle eyebrow (#529); keeps the consumer's heading level.
### `ocelle-personal-rail`: no hard-coded 720 px flip: the consumer sets the tier (an orientation property or a container-query token), with an exclusive bound (#492); works with the personal drawer (#450).
Done when: Same checklist as the actions issue (stories and baselines in both themes, axe clean, manifest entry, strict-CSP check), plus a reflow test at 320 px with no horizontal scroll.
