---
triage: 020
issues: [13]
decision: mission
target: "020-disclosure-code-block"
in_scope: [13]
out_of_scope: [1, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 23, 27, 28, 29, 30, 35, 41]
semver: minor
spec_prompt: "Mission for the last two elements of #13 (triage/020-disclosure-code-block.md; triage/019-data-display-follow-on.md option B, approved 2026-11-15), spec directory specs/020-disclosure-code-block: in @ocelle/elements, following README § Element conventions, § Control conventions, § Slot convention (with 012's plan decision 33: the .label wrapper and the bare modifier) and § Host ARIA as on main, no monospace, Schibsted Grotesk with --ocelle-figures, and no element of missions 013 or 019 changed; (P1) ocelle-disclosure, the Desktop V2 disclosure (#470) on native details/summary semantics in the shadow root or an equivalent button with aria-expanded, an open state settable by attribute and property that survives htmx swaps, one ocelle-disclosure-* toggle event with its payload (the native toggle event is not composed), host ARIA reaching the inner control, the chevron icons of #17 (chevron-end collapsed, chevron-down expanded) through the icon slot convention, inline with no overlay, no animation under reduced motion; (P2) ocelle-code-block, a preformatted block on --ocelle-color-inset in the sans with tabular figures, --ocelle-line-height-relaxed and a --ocelle-measure-reading cap, a wrap policy by default (003's pre-wrap, WCAG 1.4.10 at 320 px) and a sideways-scroll policy that uses 009's overflow-region module exactly as its contract states (pre inside .region-track, role group, setLabel, inline axis only; neither 019's block-axis option nor 019's R-17 mask-exclusion request is needed or built), and a digest display mode in groups of four whose copied text and screen-reader reading stay the unbroken digest, recorded as a README convention #14's copy field can reuse; no clipboard I/O, no syntax highlighting; new tokens only where none fits; done when #7's checklist holds for each element (a story per variant and state with light and dark baselines through #10's gates, interaction tests for every event and payload, keyboard and screen-reader tests, axe with no serious or critical finding, manifest entries, strict-CSP check) plus a 320 px reflow test for the code block; settle at clarify the questions this record lists (disclosure basis and whether it follows the control conventions, open-state ownership, code-block content model, default policy, digest rendering), and order the phases as the operator's answer to Q1 says."
status: proposed
---

# Triage 020: the disclosure and the code block (the rest of #13 after mission 019)

## Issues read

**Source of the issue text.** GitHub could not be read from this session: `gh issue view` and `gh search issues`
fail on GraphQL (HTTP 403), and `gh api` is denied by the session's permissions. No GitHub tool was available. The
text of #13 used here is the one recorded in `triage/013-data-display.md` (fetched read-only by the orchestrator on
2026-11-13) and repeated in `triage/019-data-display-follow-on.md`. Comments, labels or linked pull requests added to
#13 after 2026-11-13, and any issue filed since, were **not** read. The operator should check #13 for later comments
before approving.

- **#13** "Elements: data display — ocelle-facts, ocelle-empty-state, ocelle-progress, ocelle-data-table,
  ocelle-event-timeline, ocelle-evidence-chain, ocelle-disclosure, ocelle-code-block". Open, parent epic #1. Items
  1 and 2 are mission 013's (on main, `23ba5c5`); items 3 to 5 are mission 019's (in progress). This record scopes the
  two that remain:
  6. `ocelle-disclosure`: the Desktop V2 disclosure (#470), on native `<details>` semantics or an equivalent button
     with `aria-expanded`.
  7. `ocelle-code-block`: a preformatted block on `color-inset`, sans with tabular figures; a wrap or sideways-scroll
     policy, a reading-width cap and line height `relaxed`; a scroll region that is a tab stop only while it overflows
     (#520, the `ocelle-scroller` pattern); a digest display mode in groups of four.
  8. Done when: #7's checklist for each element.
- **Upstream (spec-kitty-design).** #520 was not read. For #470, mission 019 recorded background from a read-only
  clone of `develop` at `a6518cd` (`specs/019-data-records/sources/issue-470-handoff-background.md` on
  `origin/claude/013-data-display-2`): the Desktop V2 contract lists **disclosure** among its 22 primitive families,
  each with independently required states (default dark, light, responsive narrow, and hover, focus, active, disabled
  where they apply). The disclosure's own required states were not recorded there; the clone is not present in this
  session.

## Related work found

| Ref | Kind | Relation | Reason |
|---|---|---|---|
| #13 | issue (open) | in scope | Items 6 and 7. Closes when 019 and this mission have both landed (operator). |
| `triage/019-data-display-follow-on.md` (option B, approved 2026-11-15), on `origin/claude/013-data-display-2` | triage record | **parent decision** | Fixed the split: 020 `disclosure-code-block` builds these two, in its own session. Its § Scope "Mission 020 under option B" and its clarify questions (disclosure basis, digest mode) are carried here. |
| Mission 019 / `specs/019-data-records` on `origin/claude/013-data-display-2` | mission (in progress: phase 1 at its mutation stop; phases 2 to 4 to come) | **coordinate; not to change; blocks P2's implementation** (see Q1) | Builds the data table, event timeline (+ `ocelle-timeline-event`) and evidence chain (+ `ocelle-evidence-step`). It **amends 009's module**: `src/overflow-region.ts` +343 lines for an opt-in block-axis option (`blockAxis`, `blockStartBox`; `contracts/overflow-region-block-axis.md`), with a pointer line in 009's contract. For hosts that do not set the option, 009's contract stands word for word. It also edits `packages/elements/README.md`, `custom-elements.json`, `src/index.ts`, `CHANGELOG.md`, `storybook/a11y-exceptions.json` and gate plants, which this mission edits too. Its spec already names `specs/020-disclosure-code-block` and calls the code block the module's next user. |
| 019's R-17 (request to 009's owner: keep a pinned start box out of the start fade's mask) | open request | **not needed here** | The code block has no box pinned at the inline start (no sticky caption, title or line-number gutter: #13 asks for none). Its scroll mode is the plain inline case the module already serves. Needed only if clarify adds a sticky part, which this record advises against. |
| 019's block-axis option | module option (unmerged) | **not needed here** | #13 asks for no vertical scrolling. A code block taller than its container grows; the page scrolls. A capped, vertically scrolling code block would need that option and is out of scope. |
| #15 / mission 009 / `b594b7e` (PR #46) | merged | done; **supplies the overflow region** | `specs/009-workflow-layouts/contracts/overflow-region.md`: `OverflowRegion`, `overflowRegionStyles`, the `.region-*` template, role `group` default "the scroller's and #13's", and the list of what a later element must not do. Its own example is `OcelleCodeBlock` with the `<pre>` inside `.region-track`. Chromium measured only; WebKit an open limitation. |
| #7 / mission 012 / `4911fd0` (PR #50) | merged (part of #7) | done; **its conventions apply; coordinate** | `ocelle-button` and README § Control conventions (one inner control, `delegatesFocus`, host ARIA moved with `data-ocelle-moved-*` mirrors, `:state(expanded)`, name order). Plan decision 33 amends 005's slot convention (`.label` wrapper, `bare` modifier, label on the text baseline). `ocelle-button` already carries `aria-expanded`/`aria-controls`, so a consumer can compose a disclosure button today; the element must not redraw a button (constitution VI). #7's "Done when" is this mission's. #7 stays open for its other elements. |
| #17 / mission 005 / `476602e` | merged | done; **supplies the disclosure's icons** | README § Icons: `chevron-end` "the disclosure (#13)", `chevron-down` "expanding a disclosure", `chevron-up` "collapsing a disclosure"; `chevron-end` mirrors under RTL. |
| #16 / mission 008 / `13af7a9` (PR #47) | merged | out of scope; note | The disclosure is inline, no overlay (triage 008). A code block inside a dialog or drawer meets the shrink-to-fit sizing rule (README § `ocelle-scroller`, Sizing). |
| #8 / mission 011 / `bea3130` (PR #44) | merged | out of scope | Nothing of 011 is needed here. |
| #14 (`ocelle-copy-field`) | issue (open), no spec in this repository | out of scope; **coordinate** | Owns copying (constitution I: no clipboard I/O in the code block). The digest grouping decided here should be recorded once in README § Element conventions so #14 groups digests the same way and copies the unbroken text. |
| #6 / mission 003 | merged | done; **its rules apply** | `base.css` sets `code, pre, kbd, samp` to the sans with tabular figures; base `pre` is on `color-inset` with `pre-wrap` and `overflow-wrap: anywhere`, never scrolls. The element's scroll mode must not contradict that rule for un-upgraded content. |
| #5 / mission 002 | merged | done; supplies the tokens | `color-inset`, `line-height-relaxed`, `measure-reading`, `figures`, `scroller-fade-size`, focus tokens exist. |
| #10 / mission 006, #23 / mission 007, #35 / op 015, #41 / op 016 | merged | done; apply | Visual and axe gates (baselines committed by this mission), mutation strictness and shard limit (the disclosure's toggle invites Timeout mutants), affected plants locally. |
| `ocelle-facts` (013) | element on main | not to change | README: "Digests are the consumer's text: the sheet does not group or rewrite them". The code block's digest mode is the library's first grouping; facts stay as they are. |
| #1 | epic (open) | out of scope | Its #520 gap row closes with the code block. |
| #11 | issue (open) | out of scope; **blocked by #13** | v1.0.0 needs all eight elements. |
| #9, #12 | issues (open) | out of scope | Name neither element. |
| #27, #28, #29, #30 | issues (open) | out of scope | Manifest source paths, gate-table count, a flaky prose test, the run-summary index conflict (#30 will touch this PR, as every mission's). |
| `specs/`, `ops/`, `triage/` on main | repository | none to fold into | No feature or op covers either element. 019 (unmerged) explicitly excludes them. 020 is reserved for this work by the operator. |
| `.specify/memory/constitution.md` I, II, III, IV, V, VI, VII, VIII | constitution | applies | I: no `class=` API, no clipboard. II: no monospace; digests in groups of four; tokens only. III: no ID reference across a shadow root (summary to panel), host ARIA reaches the inner control, full keyboard model, reduced motion. IV: strict CSP (no `style` attribute; the module's per-instance sheet is the allowed exception). V: a story per variant and state. VI: no duplicated button logic. VII: new elements are MINOR. VIII: test-first. |
| `knowledge/speckit-flows/findings/frontend-missions.md` | finding | applies | `pre` lines break 1.4.10 at 320 px without `pre-wrap`; code and `pre` default to monospace; an overflowing box is a tab stop only without a focusable descendant, and WebKit differs; no WebKit in the environment. |
| `knowledge/speckit-flows/guards/vacuous-tests.md` | guard | applies | Tests on an empty slot or a collapsed panel pass vacuously. |

## Decision

**`mission`** (semver **MINOR**), as triage 019's option B planned.

- **Mission rule:** two new elements in `@ocelle/elements` with new public surface (properties such as `open`, a
  policy and a digest mode; slots; parts; at least one event, the disclosure's toggle).
- **Open design questions** (Risks): the disclosure's basis and its relation to the control conventions, who owns the
  open state, the code block's content model and default policy, and the digest rendering, which becomes a
  library-wide convention.
- **Accessibility beyond a local fix:** a disclosure keyboard and expanded-state model across a shadow root, a
  conditional tab stop, how a grouped digest is read and copied.
- **Two independently testable user stories**, one per element.
- **Why not the others:** not `op` (new surface and design questions); not `fold` (019 excludes both elements by its
  approved scope and is not to change; 009 only supplies a module); not `none` (real need, #1's #520 row open,
  disclosure a Desktop V2 family); not `decision-needed` (the work scopes now; Q1 is a sequencing choice between
  scoped options).

**Size.** Two elements, no item element: smaller than 013 (four tags, 832-line spec, 9 rounds). One mission; no
further split. The code block alone would be close to op size, but the digest convention and the module reuse are
design work that wants the full cycle.

## Scope

**Issues:** in scope #13 only (items 6 to 8). All others are out of scope as listed above. No element of missions
013 or 019 is changed. An amendment to README § Element conventions is allowed where a new pattern needs it (the
digest grouping), recorded in the spec.

1. **P1 `ocelle-disclosure`.**
   - Native `<details>`/`<summary>` in the shadow root, or a button with `aria-expanded` and a panel, chosen at clarify;
     no ID reference across a shadow root.
   - `open` as attribute and property, reflected, so htmx swaps and server markup keep it.
   - One `ocelle-disclosure-*` toggle event with its payload (the native `toggle` does not leave the shadow root).
   - Summary icon by the slot convention as amended by 012 decision 33: `chevron-end` collapsed, `chevron-down`
     expanded (README § Icons), mirrored under RTL.
   - Host ARIA reaching the inner control; keyboard Enter and Space; inline, no overlay; nothing animates under
     reduced motion.
2. **P2 `ocelle-code-block`.**
   - A `pre` on `--ocelle-color-inset`, sans with `--ocelle-figures`, `--ocelle-line-height-relaxed`, capped at
     `--ocelle-measure-reading`.
   - Wrap policy (003's `pre-wrap`, 1.4.10 at 320 px) and a sideways-scroll policy through 009's `OverflowRegion` used
     exactly as its contract states (`pre` in `.region-track`, role `group`, name through `label`/host `aria-label`,
     inline axis only), reimplementing nothing and setting no 019 option.
   - A digest mode in groups of four; copied text and the screen-reader reading stay the unbroken digest; the rule
     written into README § Element conventions for #14.
   - No copy control, no clipboard I/O, no syntax highlighting, no line numbers.
3. **For both:** #7's done-when per element; manifest entries; README sections and `.sk-*` mapping rows; changelog
   entries; new tokens only where none fits.

**Out:** copying (#14 and the host); vertical scrolling or a height cap for the code block (would need 019's
block-axis option); a sticky part in the code block (would need R-17's option); an exclusive accordion group (the
`details` `name` attribute) unless #470's required states name it; WebKit measurement (environment limit).

## Risks and open questions

**For the operator (triage gate):**

- **Q1. Sequencing against mission 019,** which is unmerged and changes `src/overflow-region.ts`, the README, the
  manifest, `index.ts`, the changelog and the axe exceptions:
  - (a) design now (spec, plan, tasks); start implementation only after 019 is on main. Safest, slowest.
  - (b) **(recommended)** design now; P1 (disclosure, no module dependency) is implemented on main as it is; before
    P2's red step the run merges main and stops to ask if 019 has not landed, so the code block is built against the
    module 019 leaves behind. Conflicts in shared files (README, manifest, changelog, index) are expected and
    mechanical.
  - (c) implement both now against main's module and rebase onto 019's amended module later. Fastest, but the code
    block's tests would run against a module that will change underneath them.

**For clarify inside the mission:**

- **Disclosure basis:** (a) native `<details>`/`<summary>` in the shadow root (find-in-page and native toggle come
  free; `summary` styling and marker removal vary); (b) a `<button aria-expanded>` and a panel; (c) compose an
  `ocelle-button` inside. Whether the summary follows § Control conventions (one inner control, `delegatesFocus`,
  host ARIA moved with mirrors), and whether the disclosure exposes `:state(open)`.
- **Open-state ownership:** does a user toggle reflect `open` to the host (htmx morphs then keep it), and can the
  toggle event be cancelled?
- **Code-block content model:** (a) slotted text into a shadow `<pre>` (leading newline handling differs from a
  native `pre`); (b) a slotted light-DOM `<pre>`/`<code>` styled by `@ocelle/styles`; (c) a `value` property (htmx
  unfriendly). The digest mode depends on it.
- **Default policy:** wrap by default (003's base rule and 1.4.10) with scroll opt-in, or the reverse.
- **Digest rendering** (triage 019's options): (a) spaced groups in shadow DOM with the unbroken digest as the
  accessible text; (b) group spans with CSS gaps, copy gives the unbroken text; (c) the consumer pre-groups. Copied
  text and screen-reader reading stay unbroken in every case; record the rule for #14.

**Risks:**

- **019's module change.** If 019's block-axis amendment, or a later fix in its phases 2 to 4, touches the inline-axis
  path, the code block must be re-read against the merged module (009's contract says the option-off path is
  unchanged; 019's SC-007 tests that).
- **Unread inputs.** #13's later comments, #470's disclosure required states and #520 were not read.
- **WebKit.** Kitty Desktop renders in WebKit; the conditional tab stop and `details` behaviour are measured in
  Chromium only, as in 009.

## What would change this decision

- **019 is abandoned or re-scoped** to include either element: this record is re-judged (fold or re-split).
- **A comment on #13 or #470/#520 moves an element elsewhere** (for example the disclosure into #7's controls, or
  the digest mode into #14): that element leaves scope; the remaining one might then be an op.
- **Clarify picks a capped, vertically scrolling or sticky-titled code block:** it then needs 019's block-axis option
  or R-17's mask exclusion, and depends on 019 (or 009's owner) landing it first.
- **The operator wants digest grouping decided library-wide first** (with #14): a `decision-needed` for that
  convention before this mission's clarify.
