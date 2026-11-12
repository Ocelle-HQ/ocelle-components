---
triage: 9
issues: [15]
decision: mission
target: "workflow-layouts"
in_scope: [15]
out_of_scope: [1, 7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 23]
semver: minor
spec_prompt: "Mission for #15 (triage/009-workflow-layouts.md), spec directory specs/009-workflow-layouts: four layout elements in @ocelle/elements plus the tokens they need in @ocelle/tokens, in priority order: (P1) ocelle-scroller, a horizontal strip that is a named focusable region (role region, a name, tabindex 0) only while it overflows, shows the token focus ring, scrolls with the arrow keys and shows an edge fade on each logical side with content off-screen, its overflow-tab-stop logic built as an internal module that #13's ocelle-code-block can reuse; (P2) ocelle-workflow-board and ocelle-workflow-lane as elements, not classes, with a lane minimum width token so five lanes fit a 1280 px window beside a context sidebar, the board scrolling inside itself (with the P1 pattern) only when narrower, a flat lane variant without nested card chrome whose small uppercase title uses the sans with tabular figures (constitution II forbids the mono #15 names), and lane titles that carry their count to assistive technology; (P3) ocelle-list-detail with a list track width token, the selected record's detail beside it, a decorative border between panes, and a collapse to one column driven by its container width and by a narrow state the host (later #12's app shell) sets, reusing the existing --ocelle-shell-inspector-width (19rem, which 002 chose over spec-kitty-design#505's 260 px) for the Pipeline inspector; done when #7's checklist holds for each element (stories per variant and state in light and dark, interaction, keyboard and screen-reader tests, axe clean, manifest entry, strict-CSP check) plus resize tests at 1280 px and at the narrow tier; settle at clarify the questions this record lists (the count's wording, the threshold and narrow-state interface shared with #8 and #12, one-column navigation, the inspector's home, the forced-colours edge cue)."
status: proposed
---

# Triage 009: Workflow and screen layouts: ocelle-workflow-board, ocelle-workflow-lane, ocelle-list-detail, ocelle-scroller (#15)

## Issues read

- **#15** "Elements: workflow and screen layouts — ocelle-workflow-board, ocelle-workflow-lane, ocelle-list-detail,
  ocelle-scroller" (open, author MOES-Media). It has no comments, labels, milestone, sub-issues or linked pull
  requests, and its parent is epic #1. I read it from the verbatim text the orchestrator fetched with its GitHub read
  tool (`scratchpad/issues-verbatim.md`, 2026-11-12). This session could not read GitHub: GraphQL is blocked, and
  `.claude/settings.json` denies `gh api`. #15 asks for:
  1. **`ocelle-workflow-board` and `ocelle-workflow-lane`** (class families in Spec Kitty today):
     - elements, not classes;
     - a lane minimum width token, so five lanes fit a 1280 px window beside a context sidebar, with the board
       scrolling inside itself only when narrower (spec-kitty-design#507);
     - a `flat` lane variant: no nested card chrome, a small uppercase mono title and a count (#506);
     - lane titles that carry their count to assistive technology.
  2. **`ocelle-list-detail`**:
     - a fixed list track (a width token) with the selected record's detail beside it and a border between the panes;
     - a collapse to one column driven by the **container** width (not the viewport) and by the app shell's narrow
       state (#530);
     - an inspector pane width token (260 px, #505) for the Pipeline inspector.
  3. **`ocelle-scroller`**: a horizontally scrolling strip that is a focusable region (`role="region"`, a name,
     `tabindex="0"`) **only while it overflows**. It shows the token focus ring, scrolls with the arrow keys, and
     shows an edge fade on each side with content off-screen, on logical sides (#514).
  4. **Done when**: the "Done when" checklist of #7, for each element, plus resize tests at 1280 px and at the narrow
     tier. #7's checklist:
     - a story per variant and state, with visual baselines in light and dark;
     - interaction tests for every emitted event and its payload;
     - keyboard and screen-reader behaviour tested, with axe reporting no serious or critical finding;
     - a custom-elements manifest entry with every public property, event, slot and part;
     - built output that passes the strict-CSP check.
- **Context from the same text:**
  - #1: the naming rules, and the gap row "#505 #506 #507 #514 #530 → #15".
  - #12: the app shell's narrow and collapsed tiers, with thresholds set by the consumer.
  - #13: `ocelle-code-block`'s "tab stop only while it overflows (… same pattern as `ocelle-scroller`)".
  - #8: the consumer sets the personal rail's tier; the page header has a "12 px mono uppercase tracked" eyebrow.
  - #16 and #9: no overlap of substance.

## Related work found

| Ref | Kind | Relation | Reason |
|---|---|---|---|
| #15 | issue (open) | in scope | This mission. |
| #1 | epic (open) | out of scope | Parent. It sets the naming rules (`ocelle-<element>-<action>` events, plain part and slot names) and the gap row that maps spec-kitty-design #505, #506, #507, #514 and #530 to #15. |
| spec-kitty-design #505, #506, #507, #514, #530 | external requirement issues | input | Requirements only (constitution VI; #1: "written from scratch, not ported"). The spec names each against the item it answers. |
| #17 / PR #26 / `specs/005-icons-brand-mark` | merged mission (`476602e`) | out of scope (done); **satisfied dependency** | It set the element conventions this mission follows (`packages/elements/README.md` § Element conventions: module and `define`, `static properties`, token-only `static styles`, `:host([hidden])`, variant rules inside `@media not (forced-colors: active)`, the generated manifest and its gate, stories, the shared scenario harness, the elements-only Stryker config). It also set the engine floor (§ Engines: Chromium 120+, WebKit 16.4+). The README maps `chevron-end` to "the end direction of scrollers", and triage 005 named "scroller edges (#15)" as an icon user. #15 asks only for an edge fade, so whether the scroller gets chevron controls is a clarify question (below). |
| #5 / `specs/002-design-tokens`, `packages/tokens/src/source.ts` | merged mission | out of scope (done); **one #15 item already met** | `--ocelle-shell-inspector-width` already exists at `19rem`, with the comment "replaces spec-kitty-design#505's 260px" (`source.ts:178`, 002 spec line 27). That was an operator decision in 002. #15's "inspector pane width token (260 px, #505)" is therefore met by an existing token. Going back to 260 px would be a token value change against that decision, so the default is to reuse it. Related tokens: `shell-sidebar-width` 20rem, `shell-rail-width` 3.25rem, `shell-collapse-sidebar` 45rem, `shell-collapse-inspector` 75rem, `gutter`, `color-panel`, `color-pane`, `color-inspector`, `color-rule` ("decorative, never a control boundary"). No lane width or list track width token exists, so this mission adds them to `@ocelle/tokens`. |
| #6 / `specs/003-base-styles` | merged mission | out of scope (done); **its measurements apply** | Its scroll-box work is the evidence base for `ocelle-scroller`. Chromium makes an overflowing box a tab stop only when it has no focusable descendant (SPEC-3-01). WebKit is thought not to do it at all (plan round 1 FRESH). A stylesheet cannot add `tabindex`, so the element is the "wrapper fork" 003 FR-017 left open. `container-type: inline-size` collapses content to 0 px in shrink-to-fit hosts (dialogs, drawers, default flex items, table cells; rounds 2 and 3). `findings/frontend-missions.md` § Layout and § Accessibility behaviour list all of these. |
| #13 | issue (open, next wave) | out of scope; **this mission blocks part of it** | `ocelle-code-block` reuses the "tab stop only while it overflows" pattern. This mission builds the overflow logic as one internal module (not public surface) and documents it in the README's conventions, so #13 imports the same behaviour and does not write it again. |
| #12 | issue (open, not started) | out of scope; **interface to agree, not blocked** | #15's list-detail collapses on "the app shell's narrow state", and the shell does not exist yet. This mission defines the input the shell (or any host) sets on `ocelle-list-detail`. #12 then drives that input. #12's "container thresholds set by the consumer (properties or tokens), not fixed px" is the same rule #15's container-driven collapse needs. |
| #8 (sibling triage 011, in design now) | issue (open) | out of scope; **coordinate** | Three overlaps. (1) `ocelle-personal-rail`'s consumer-set tier "with an exclusive bound", and this mission's container threshold, should be one convention: whichever lands first writes it into § Element conventions. (2) `ocelle-card` is the likely content of a lane. A lane slots any content and does not depend on the card element. (3) #8's page-header eyebrow ("12 px mono uppercase tracked") and #15's flat lane title are the same typographic need, and both hit the no-monospace rule. Neither blocks the other. |
| #16 (sibling triage 008), #9 (sibling triage 010) | issues (open) | out of scope | No shared surface. The drawer (#16) serves the app shell's narrow tier, not list-detail. |
| #10 / branch `origin/claude/010-storybook-workbench`, `specs/006-storybook-workbench` | mission in progress, not merged | out of scope; **coordinate** (neither blocks) | Visual baselines in a pinned container and axe on every story. If #10 merges first, this mission adds baselines through its harness. 006 FR-025 adds a contributor note; one fixed 1280 × 800 capture viewport, and per-story viewports "can be added by an element issue if a story needs one" (006 spec Assumptions). That fits #15's 1280 px resize case, and the narrow tier can be shown with a narrow container inside the story. If this mission lands first, its stories fall under 001's exception "Storybook build, visual regression and axe gates absent" (sunset: #10's merge), as 005 did (`specs/005-icons-brand-mark/plan.md:328`). axe must still run in this mission's own browser tests, because #7's checklist asks for it per element. |
| #7 | issue (open) | out of scope | Only its "Done when" checklist is used, which applies here per element. No element of #15 needs `ocelle-button`, unless the scroller gets edge controls (clarify). |
| #23 / `specs/007-mutation-gate-strictness` | merged mission (`e7d7d54`) | out of scope (done) | Element source is mutation-tested under the stricter gate (Timeout and CompileError reported, 30-line entries). It applies as is. |
| #11 | issue (open) | out of scope, **blocked by this** | Release 1.0.0 needs every recorded Kitty Desktop need met (constitution VI), and #505, #506, #507, #514 and #530 are among them. |
| #14 | issue (open) | out of scope | No overlap (copy field). |
| `specs/`, `ops/`, `triage/` | repository | nothing to fold into | `specs/001`, `002`, `003`, `005` and `007` and `ops/004` are merged. Triage 006 (#10) is on its own branch, and 008, 010 and 011 are parallel sessions for other issues. No feature or op in progress covers layouts or scrollers. |
| `.specify/memory/constitution.md` | constitution | constrains | I (`ocelle-` names, no I/O, small surface, manifest), II (tokens only, **no monospace anywhere**, `color-rule` decorative only), III (WCAG 2.2 AA in both themes and forced colours, full keyboard model, token focus ring, no ID reference across a shadow root, reduced motion), IV (strict CSP, adopted stylesheets only), V (story per variant and state, baselines), VI (consumer need named), VII (additions are MINOR), VIII (red first, non-vacuous, mutation). |
| `knowledge/speckit-flows/findings/frontend-missions.md`, `guards/vacuous-tests.md` | findings, guard | applies | Browser path and Node 22 against 26.13.0, no WebKit, one heavy job at a time. Shared-page media emulation leaks between files (005 R1-01). The tab-stop and container-collapse pitfalls are listed above. "Does not" assertions such as "not a tab stop when it fits" pass on an empty element, so each needs its positive pair and a plant. |

## Decision

**mission.** These rules apply:

- **New public surface.** It adds four elements, each with attributes or properties, slots, parts and possibly
  variants, plus at least two new tokens (lane minimum width, list track width). Constitution VII makes that MINOR,
  and the rule names new public surface as a mission.
- **More than one user story.** There are three outcomes, each testable on its own:
  1. the scroller's overflow-only region;
  2. the board and lanes;
  3. the list-detail collapse.
- **Accessibility behaviour beyond a local fix.**
  - A focusable region that appears and disappears with overflow.
  - Its name.
  - The arrow-key model.
  - The count read out with a lane title.
  - Focus and pane switching when list-detail collapses to one column.
  - Forced-colours behaviour of an edge fade.
- **Design decisions.** Listed under Risks: the count's wording, the threshold and narrow-state interface, the
  one-column behaviour, and the inspector's home.
- **More than one package.** `@ocelle/tokens` (new tokens and their contrast or brand checks), `@ocelle/elements`,
  and `storybook/`.

Why not the others:
- Not an **op**: new elements and tokens, open design questions and accessibility behaviour.
- Not a **fold**: nothing in progress covers it. #10's workbench is a harness, not a home for elements.
- Not **none**: none of the four elements exists, and three of the five spec-kitty-design gaps are open. Only #505's
  width token exists.
- Not **decision-needed**: each open question can be settled in this mission's clarify step. The two conflicts
  between #15 and the repository have defaults that earlier operator decisions already settle:
  - "mono" against constitution II: the constitution wins;
  - 260 px against 002's 19rem: 002's decision stands.

**Semver: minor.** New elements and new token names, all additions. Before 1.0.0 the surface may still change
without a major bump.

## Scope

One mission, three user stories in priority order. Each is independently testable and adds stories, baselines (or
the 001 exception), manifest entries and tests for its elements.

1. **P1 (MVP): `ocelle-scroller`.** It comes first because the board needs it, #13 reuses it, and it carries most of
   the accessibility risk.
   - **Overflow-only region.** While `scrollWidth` exceeds `clientWidth`, the host (or its inner scroll box) has
     `role="region"`, an accessible name and `tabindex="0"`. When the content fits, it has none of them. The state
     follows resizes of both the box and its content.
   - **Name.** It comes from a `label` attribute, as `ocelle-icon` and `ocelle-brand-mark` do, with no ID reference
     across the shadow root. What happens with no label while overflowing (a fallback, or a documented requirement)
     is a clarify question.
   - **Tab order.** Because the element sets `tabindex` itself, the region is a tab stop even when it holds links.
     That closes 003's SPEC-3-01 gap for this element, and it should hold in WebKit too, though WebKit cannot be
     measured here.
   - **Keyboard and focus ring.** The arrow keys scroll it. It shows the token focus ring.
   - **Edge fade.**
     - It appears on the inline-start and inline-end sides only when content is off-screen on that side, and is
       correct in `dir="rtl"`.
     - It is decorative and comes from tokens.
     - It respects reduced motion.
     - It has a defined forced-colours behaviour: a mask or gradient disappears there, so clarify whether a
       non-colour cue is needed.
   - **Reuse.** The overflow logic is an internal module that #13 reuses, documented in the README.
2. **P2: `ocelle-workflow-board` and `ocelle-workflow-lane`.**
   - **Elements.** Both are elements with slots, not class families.
   - **Lane width token.** A lane minimum width token whose value lets five lanes fit 1280 px beside a context
     sidebar. Rough arithmetic for clarify: 1280 − rail 52 − sidebar 320 − two 16 px gutters ≈ 876 px, so 5 lanes
     and 4 gaps leave about 165 px each, roughly 10rem. Without the rail it is about 176 px.
   - **Board overflow.** Narrower than that, the board scrolls inside itself with the P1 behaviour, and the page never
     scrolls sideways.
   - **`flat` lane variant.** No nested card chrome. A small uppercase tracked title in Schibsted Grotesk with tabular
     figures (constitution II), not mono, plus a visible count.
   - **Count for assistive technology.** Every lane's title carries its count.
   - **Semantics.** The semantics of board and lane (a named group or region per lane, a list of items or not) are
     settled at plan.
3. **P3: `ocelle-list-detail`.**
   - **Panes.** A list track sized by a new width token, the detail pane beside it, and a decorative border between
     the panes.
   - **Collapse to one column.**
     - It is driven by the element's container width, not the viewport.
     - The threshold is set by the consumer, following the convention shared with #8 and #12.
     - A narrow-state input that a host sets also drives it (later #12's shell).
   - **Shrink-to-fit hosts.** Container measurement must not collapse the element in shrink-to-fit hosts (003's
     `container-type` pitfall).
   - **Inspector width.** The Pipeline inspector uses `--ocelle-shell-inspector-width`. Whether list-detail gets an
     inspector pane at all is a clarify question (below).
4. **Done when**, for every element:
   - #7's checklist;
   - resize tests at 1280 px and at the narrow tier, the tier taken from the existing `shell-collapse-*` tokens or
     the convention above;
   - a 320 px reflow check where an element can be the page's content (WCAG 1.4.10), in line with #8 and #12;
   - README sections, the token documentation, and `chevron` icon use if clarify adds edge controls.

**Out of scope:**
- the app shell and its tiers (#12);
- cards, section and page headers, the context sidebar (#8);
- `ocelle-code-block` (#13), which reuses P1;
- drag and drop or keyboard moving of cards between lanes (not asked by #15; a new issue if a consumer needs it);
- a WebKit test project (environment limit, `findings/frontend-missions.md`);
- the Storybook harness itself (#10).

## Risks and open questions

Questions for the spec's clarify step, each with the default this record proposes:

1. **Count wording.** How a lane title "carries its count" is the library's first built-in announced text. The
   repository has no localisation convention, and hosts are not all English. Default: the host supplies the count as
   a number, and the full accessible text is formed from a host-supplied label or template. No English string is
   hard-coded.
2. **Threshold and narrow-state interface.** The choice is between a property or attribute (for example
   `narrow-below` and `narrow`) and an inherited custom property read by a style container query. A style query
   needs WebKit 18, above the 16.4 floor. Default: attributes or properties, written once into § Element conventions
   and agreed with sibling 011 (#8). #12 adopts it.
3. **One-column list-detail.** Which pane shows, how the user goes back to the list, and where focus goes on each
   switch. #15 says nothing about this. It may need an event (`ocelle-list-detail-<action>`) or a host-driven
   `detail-open` state. Default: host-driven state, focus moved to the shown pane's start, no built-in back control.
4. **Inspector's home.** Is the Pipeline inspector a third pane of `ocelle-list-detail`, or part of the board screen
   (the Pipeline is a board) or the app shell? Default: an optional `inspector` slot on list-detail, sized by the
   existing token. If clarify finds no consumer for it there, it moves to #12.
5. **Scroller edges.** Fade only (as #15 says), or fade plus chevron controls (as 005's icon mapping anticipates)?
   Default: fade only, plus a forced-colours cue if one is needed. Controls would add buttons and a keyboard model,
   so they become a later addition only if a consumer asks.
6. **Lane minimum width value.** The arithmetic gives about 10rem. Clarify confirms the lane content (cards, titles,
   identifiers wrapping per 003's policy) is readable at that width.

Other risks:

- **WebKit cannot be measured.** Kitty Desktop's webview is WebKit, so the scroller's tab stop, arrow keys and
  region role are proven only in Chromium. The `tabindex` the element sets makes WebKit more likely to behave, but
  it stays an open limitation, as in 005's § Engines.
- **Vacuous "does not" tests.** "Not a tab stop when it fits" and "no fade on the start side at scroll 0" pass on an
  empty element. Each needs its positive pair and a plant (`guards/vacuous-tests.md`).
- **#10's order.** If this mission merges before #10, it lands without visual baselines under 001's exception. Its
  own browser tests must still run axe, because #7's checklist asks for that per element.
- **Sibling convention clash.** If 011 (#8) and this mission each write a tier or threshold convention, the second to
  land must adopt the first. The operator may want to name the owner up front.
- **Size.** Four elements is larger than 005's two. If the plan squad finds P3's open questions heavy, P3 can be
  split out (see below).
- **Issue text from the orchestrator.** It was read as passed in, not from GitHub by this session.
- **Branch.** This record is committed on `claude/015-workflow-layouts` and is not pushed. The spec directory is
  reserved as `specs/009-workflow-layouts`.

## What would change this decision

- The operator wants the smallest mission. Then split it in two:
  - this mission: P1 scroller with P2 board and lanes, which belong together because the board scrolls with the
    scroller;
  - a later mission: `ocelle-list-detail` (P3), done together with or after #12, so the narrow-state interface is
    designed once with the shell.

  #15 would then be covered by two missions, and this record's `in_scope` would note the split.
- The operator wants #15's 260 px inspector width or a mono lane title. Each conflicts with an earlier decision (002's
  19rem, constitution II), so that becomes **decision-needed**: a token value change or a constitution amendment
  before the spec.
- #12 is started first, or sibling 011 (#8) settles the threshold convention before this spec. Then question 2
  becomes an input, not a design task, and P3 gets lighter. It stays a mission.
- A consumer needs keyboard moving of cards between lanes. That adds a drag-and-drop or move pattern, which needs its
  own design and would be split into its own issue, not added here.
