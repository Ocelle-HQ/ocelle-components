---
triage: 011
issues: [8]
decision: mission
target: "layout-headers"
in_scope: [8]
out_of_scope: [1, 7, 9, 10, 11, 12, 13, 14, 15, 16, 17, 23, 27, 28, 29, 30]
semver: minor
spec_prompt: "Build the layout and header elements of issue #8 (triage/011-layout-headers.md) in @ocelle/elements, following the element conventions of mission 005: ocelle-card (inset, slotted content, a compact density with a 1 px border, md radius, smaller padding and a tighter section header, spec-kitty-design#516), ocelle-section-header (with an eyebrow-only mode on eyebrow tokens, #497), ocelle-context-sidebar (label names the landmark; dividers between sections and a footer area, no padding or gap for empty parts, #497), ocelle-page-header (a compact size with a 24 px display title and a 12 px uppercase tracked subtle eyebrow in Schibsted Grotesk, since constitution II forbids monospace, #529; the consumer's heading level kept, no fixed h1), and ocelle-personal-rail (label names the landmark; no hard-coded 720 px flip: the consumer sets the tier through an orientation property or a consumer-set threshold with an exclusive bound, #492, an interface #12's personal drawer can drive later); add the eyebrow tokens to @ocelle/tokens if none fit; each element with stories per variant and state in light and dark, interaction, keyboard and accessibility-tree tests, manifest entries, the strict-CSP check, and a 320 px reflow test with no horizontal scroll; baselines and axe through #10's gates when they are on main; the app shell, its tiers and the personal drawer itself stay with #12 and #16."
status: proposed
---

# Triage 011: Layout and headers (#8): card, section header, page header, context sidebar, personal rail

## Issues read

**Source of the issue text.** GitHub could not be read from this session. The orchestrator fetched the issue texts
read-only through the GitHub tools on 2026-11-12 and gave them as one file
(`scratchpad/issues/issues.md`): the issue list with states, the full bodies of #8, #12 and #16, the "Done when"
checklist of #7, and the rows of the #1 gap table that concern #8. None of the issues has comments. The
spec-kitty-design issues #8 cites (#450, #492, #497, #516, #529) were not read.

- **#8** "Elements: layout and headers — ocelle-card, ocelle-section-header, ocelle-page-header,
  ocelle-context-sidebar, ocelle-personal-rail" (open, author MOES-Media, parent epic #1, no comments). Five
  structural, mostly slot-based primitives; the base interface comes from kitty-mission-ui's current use (card 4
  uses, section header 9, context sidebar 3, page header 8, personal rail 2). Checklist:
  1. `ocelle-card`: `inset`, slotted content; a compact density for dense detail screens: 1 px border, md radius,
     smaller padding, tighter section header (#516).
  2. `ocelle-section-header` and `ocelle-context-sidebar` (`label` names the landmark): dividers between sidebar
     sections and a footer area, no padding or gap for empty parts; an eyebrow-only section header mode using the
     eyebrow tokens (#497).
  3. `ocelle-page-header`: a compact size, 24 px display title and 12 px mono uppercase tracked subtle eyebrow
     (#529); keeps the consumer's heading level, no fixed `h1` inside the element.
  4. `ocelle-personal-rail` (`label` names the landmark): no hard-coded 720 px flip, the consumer sets the tier (an
     orientation property or a container-query token) with an exclusive bound (#492); works with the personal
     drawer of the app frame (#450).
  5. Done when: #7's checklist (a story per variant and state with baselines in light and dark; interaction tests on
     every event and payload; keyboard and screen-reader tests, axe with no serious or critical finding; the manifest
     lists every public property, event, slot and part; built output passes the strict-CSP check), plus a reflow
     test at 320 px with no horizontal scroll.
- **#1** gap table: #492, #497, #516 and #529 are assigned to #8; #450 (personal drawer) to #12; #509 (metric row,
  eyebrow style, compact notice) to #7, #9 and #5.

## Related work found

| Ref | Kind | Relation | Reason |
|---|---|---|---|
| #8 | issue (open) | in scope | This mission. |
| #1 | epic (open) | out of scope | Parent; its gap rows #492, #497, #516 and #529 close with this mission. |
| #17 / mission 005 / `476602e` | issue (closed), merged | done, was blocking | Set the element conventions this mission follows (module per element, `define`, `static properties`, token-only `static styles`, `:host([hidden])`, variant rules inside `@media not (forced-colors: active)`, the generated `custom-elements.json` and its `manifest` gate, stories per variant and state, scenarios run on source and build, the engine-floor list). Its README states the conventions so a later element "follows these rules without a design question". |
| #23 / mission 007 / `e7d7d54` | issue (closed), merged | done | Mutation gate strictness; applies to the new element source. |
| #5 / mission 002 | issue (closed), merged | done; **gap** | Tokens: `font-size-xs` (12 px), `font-size-xl` (24 px), `font-display`, `tracking-display`, `radius-row`, `border-width`, `color-rail` (context sidebar ground), `color-chrome` (personal rail), `shell-*` widths. There are **no eyebrow tokens** (#497 and #529 name them; #1 assigns #509's "eyebrow style" partly to #5, which closed without it) and no "md" radius name (#516). This mission adds what is missing to `packages/tokens/src/source.ts`, so it spans `@ocelle/tokens` and `@ocelle/elements`. |
| #6 / mission 003 | issue (closed), merged | applies | `base.css` styles element hosts in the light DOM and slotted headings; slotted headings in page and section headers meet its heading rules. |
| #7 | issue (open), not in design | out of scope; **coordinate** | Its "Done when" is the checklist #8 inherits. #509's eyebrow style (metric eyebrow) is assigned partly to #7: whichever of #7 and #8 lands first adds the eyebrow tokens, the other uses them. `ocelle-action-row` and `ocelle-button` may be slotted into cards and headers; no dependency either way. |
| #12 | issue (open), not in design | out of scope; **blocked by #8** (for the rail and sidebar) | `ocelle-app-shell` places `ocelle-context-sidebar` and `ocelle-personal-rail`, owns the layouts, the collapsed tier ("the sidebar becomes an icon column while the rail stays", #499), consumer-set thresholds instead of 860 / 1100 / 720 px, and the personal drawer (#450) on `ocelle-drawer`. The integration of rail and drawer is #12's (operator constraint); this mission only gives the rail a tier and orientation interface the shell can drive. If #12 needs an icon-column mode on `ocelle-context-sidebar`, #12 adds it (MINOR). |
| #16 | issue (open), in design in parallel (triage 008) | out of scope; neither blocks | `ocelle-drawer` serves #12's personal drawer; #8 does not use it. |
| #15 | issue (open), in design in parallel (triage 009) | out of scope; **coordinate** | `ocelle-list-detail` and `ocelle-workflow-*` are layout elements too; if they place cards or section headers, they consume this mission's elements, and the consumer-set threshold pattern chosen here (rail) and there (list-detail) should be one pattern. Whichever spec is checked second aligns with the first. |
| #9 | issue (open), in design in parallel (triage 010) | out of scope | Forms and notices; #509's compact notice is its own. May sit in cards; no dependency. |
| #10 / triage 006 / `specs/006-storybook-workbench` on `origin/claude/010-storybook-workbench` | issue (open), design and implementation not merged | out of scope; **soft blocker** for the baseline and axe part of "Done when" | Builds the `visual` (byte-exact baselines, light and dark, pinned container) and `axe` gates over every story; its spec says element features write stories that the harness captures. If #10 is on main before this mission lands, this mission commits the baselines its gate requires and passes axe; if not, this mission writes the stories and tests the accessibility tree in Vitest, and #10's rebase picks the stories up. |
| #13, #14 | issues (open) | out of scope | Data display and inputs may sit in cards; no dependency. |
| #11 | issue (open) | out of scope; blocked by #8 | v1.0.0 requires every gap row of #1. |
| #27 | issue (open) | out of scope; **note** | `custom-elements.json` names source files the package does not ship; this mission adds five entries to that manifest and should not widen the problem, but the fix is #27's. |
| #28, #29, #30 | issues (open) | out of scope | Registry gate counts, a flaky prose test, the run-summary index conflict (the last will affect this mission's PR, as every mission's). |
| `.specify/memory/constitution.md` II | constitution | applies; **conflicts with #8's wording** | "No monospace anywhere". #8's "12 px mono uppercase tracked subtle eyebrow" (#529) cannot be met as written: the eyebrow is set in Schibsted Grotesk, uppercase and tracked, and the spec records the deviation from #529. The constitution decides this, so it needs no operator decision. |
| `packages/elements/README.md`, "Element conventions", "Engines" | repository | applies | Each element's own hook is `--ocelle-<element>-<property>`; a feature above the engine floor raises the floor and is recorded. Container queries (`@container`, `cqi`) and range syntax for an exclusive bound must be checked against the floor (Chromium 120, WebKit 16.4). |
| `knowledge/speckit-flows/findings/frontend-missions.md` | finding | applies | Browser facts found late (grid tracks, shrink-to-fit hosts, right-to-left, forced colours, reflow) cost 003 most of its rounds; Node 22 against 26.13.0; `OCELLE_CHROMIUM_PATH`; no WebKit; one heavy job at a time. |
| `knowledge/speckit-flows/guards/vacuous-tests.md` | guard | applies | A reflow or landmark test that queries an empty slot or an unrendered shadow root passes vacuously. |
| `specs/`, `ops/`, `triage/` | repository | none to fold into | `specs/001` to `005` and `007` merged; `ops/004` merged; triage 008 to 010 run in parallel for #16, #15, #9. Nothing in progress covers #8. |

## Decision

**mission.** Several mission criteria apply:

- **New public surface (MINOR).** Five new elements, each with attributes and properties (`inset`, a density, a
  size or mode, `label`, an orientation or tier), slots (header, body, footer, sections, eyebrow, title, actions),
  possibly parts and element hooks; and new tokens in `@ocelle/tokens` (eyebrow type, possibly a compact card
  radius and padding).
- **Design decisions.** How the page and section headers keep the consumer's heading level (a slotted heading, or a
  level property mapped to `role="heading"` and `aria-level` in the shadow root, which a slotted heading avoids);
  how the rail's tier is set by the consumer with an exclusive bound (a property, a consumer-set threshold, or both;
  see Risks: a custom property cannot be read in a `@container` condition, so "a container-query token" is not
  directly possible); how sections, dividers and an empty footer are expressed in the context sidebar (one slot per
  section or slotted section elements); what the compact density is called and how it reaches a slotted section
  header; how a landmark is named from `label` across the shadow boundary; the eyebrow tokens.
- **More than one user story.** At least one per element (below).
- **Accessibility beyond a local fix.** Two landmarks named by `label`, heading levels across a shadow root, reflow
  at 320 px, forced colours for dividers and borders, and an orientation change that must not lose focus or order.
- **Spans packages.** `@ocelle/elements` and `@ocelle/tokens`.

Why not the others: not an **op** (new public surface and open design questions); not a **fold** (no feature in
progress covers it; #12 and #15 consume it rather than contain it); not **none** (none of the five elements
exists); not **decision-needed** (the conflict with constitution II is decided by the constitution, and the other
choices are design questions the spec and its check can put to the operator).

**One mission, not five.** The five elements share the eyebrow tokens, the section header is used inside the card
(the compact card's "tighter section header") and the context sidebar, and the page header shares its eyebrow; they
also share one consumer (kitty-mission-ui's detail and list screens). The personal rail is the most independent: it
is kept in because #1 assigns #492 to #8 and the operator wants its tier interface ready for #12, but it is the last
story, so it can be split out if the plan finds the mission too large (see the last section).

## Scope

In scope (#8), suggested user stories in priority order:

1. **Section header and card (MVP).** `ocelle-section-header` with title, optional eyebrow and actions, and an
   eyebrow-only mode on the eyebrow tokens; `ocelle-card` with `inset` and slotted content, and a compact density
   (1 px border, the agreed radius, smaller padding, a tighter section header inside it). The eyebrow tokens added to
   `@ocelle/tokens` (with their contrast pairs if a new colour is used; `color-ink-muted` or `color-ink-soft` may
   do).
2. **Page header.** Title, eyebrow, supporting content and actions; the default and the compact size (24 px display
   title, 12 px uppercase tracked eyebrow in Schibsted Grotesk); the consumer's heading level kept, no `h1` inside
   the element.
3. **Context sidebar.** A named landmark (`label`), sections with dividers between them, a footer area, and no
   padding or gap for an empty section or footer; on `color-rail`.
4. **Personal rail.** A named landmark (`label`) on the dark chrome; vertical and horizontal orientation set by the
   consumer, no hard-coded 720 px flip, with an exclusive bound wherever a threshold exists; an interface (property
   and documented events or none) that #12's app shell and personal drawer can drive without changing the rail.

For every element: stories per variant and state in light and dark; interaction tests for every event (if any);
keyboard and accessibility-tree tests in Chromium; manifest entries checked by the `manifest` gate; the strict-CSP
check on built output; a 320 px reflow test with no horizontal scroll; forced-colours checks for borders and
dividers; the package README and the `@ocelle/elements` and `@ocelle/tokens` changelogs. Visual baselines and axe
through #10's gates if #10 is on main when this mission lands.

Out of scope:

- `ocelle-app-shell`, its layouts and tiers, the collapsed icon-column sidebar, and the personal drawer (#12, with
  `ocelle-drawer` from #16).
- The metric eyebrow and the compact notice of #509 (#7, #9), beyond sharing the eyebrow tokens.
- The visual and axe gates themselves (#10).
- The manifest's source paths (#27).

## Risks and open questions

- **Constitution II against #529.** The eyebrow cannot be monospace. The spec states the Schibsted Grotesk eyebrow
  (uppercase, tracked, `font-size-xs`, possibly `figures`) and notes the deviation; the operator sees it at the spec
  check.
- **"Container-query token" is not possible as written.** `var()` is not allowed in a `@container` or `@media`
  condition, so a token cannot set the rail's flip point inside the element. Options for the plan: an orientation
  property the consumer (or #12's shell) sets from its own query; or the element's own container query on a fixed
  token value, which brings back a fixed bound. The issue allows the property route. The exclusive bound
  (`width < N` rather than `max-width: N`) matters only where the element or its docs keep a threshold.
- **Eyebrow tokens shared with #7.** #509 puts an eyebrow style on #7 too; if #7 starts before this lands, the two
  missions must agree on one set of tokens. Adding tokens reopens `source.ts` and the contrast pairs.
- **Heading level across the shadow root.** A heading rendered inside a shadow root with a level property works in
  the accessibility tree but not for the consumer's own CSS or outline tools; a slotted heading keeps the
  consumer's element. Tests must assert the accessibility tree, not attributes alone.
- **Landmark names.** `label` must name a landmark inside the shadow root (or the host with a role); with two
  context sidebars or rails on a page, distinct names matter for axe's `landmark-unique`.
- **Empty-part detection.** "No padding or gap for empty parts" needs `slotchange` or `:has()`-style detection;
  `:has-slotted` is above the engine floor. Whitespace-only text in a slot counts as content in some approaches; the
  spec must say what "empty" means.
- **#12 dependence.** If #12's later design needs the rail to emit events or expose a different tier model, #12
  extends the rail (MINOR) rather than reopening this mission; keep the rail's surface small.
- **#10 ordering.** Baselines and axe depend on #10's gates being on main; until then those checklist items of
  "Done when" stay open for #10's rebase.
- **Size.** Five elements plus tokens is larger than mission 005; earlier element and style missions ran many
  review rounds on browser facts. The plan should keep the personal rail separable.
- **External sources unread.** spec-kitty-design #450, #492, #497, #516 and #529 may give exact sizes (the "md"
  radius, the compact padding) the spec needs; the spec session reads them or the operator supplies them.
- **Environment.** Node 22 here against 26.13.0 in CI; browser runs need `OCELLE_CHROMIUM_PATH`; no WebKit.
- **Branch.** This record is committed on `claude/008-layout-headers`, not pushed. If approved, the feature
  directory is `specs/011-layout-headers/`.

## What would change this decision

- The plan or the operator finds the mission too large: split `ocelle-personal-rail` (story 4, #492) into its own
  mission, or fold it into #12 with the app shell, and this mission keeps stories 1 to 3.
- #7 starts first and takes the eyebrow tokens: this mission uses them and is blocked by #7 for them.
- #15's design (triage 009) settles the consumer-set threshold pattern first: the rail follows it.
- The operator wants #529's eyebrow monospace: that is a constitution change, so `decision-needed` until it is made.
- #10 does not land before this mission: the baseline and axe items move to a follow-up op after #10.
