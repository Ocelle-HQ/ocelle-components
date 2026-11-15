---
triage: 19
issues: [13]
decision: mission
target: "019-data-records"
in_scope: [13]
out_of_scope: [1, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 23, 27, 28, 29, 30, 35, 41]
semver: minor
spec_prompt: "Mission for the rest of #13 (triage/019-data-display-follow-on.md; triage/013-data-display.md option B), spec directory specs/019-data-records, under the split the operator picks at the triage gate (recommended option B: this mission builds ocelle-data-table, ocelle-event-timeline and ocelle-evidence-chain, and mission 020 later builds ocelle-disclosure and ocelle-code-block): in @ocelle/elements, following README § Element conventions as amended by mission 013 (slotted items by manual slot assignment with the container importing its item element, the wrap=\"anywhere\" identifier policy, undefined defaults, no class= API), no monospace, values in Schibsted Grotesk with --ocelle-figures, and mission 013's elements unchanged; (P1) ocelle-data-table, compact cells with tabular figures, --ocelle-color-ink-soft cell text and tracked uppercase eyebrow headers (#533) built from existing tokens (--ocelle-font-size-xs, --ocelle-tracking-caps from 009) unless 011 has landed its own eyebrow tokens, keeping table semantics (role table, rows, column headers, caption) for assistive technology and a narrow-column behaviour decided at clarify; (P2) ocelle-event-timeline, the Desktop V2 event history (#470) as an ordered or plain list of event items with --ocelle-size-dot markers; (P3) ocelle-evidence-chain, an ordered list that wraps onto further lines in narrow columns, connectors hidden from assistive technology, step markers at --ocelle-size-step with --ocelle-ring-step, and an optional compact chip step (#517) that does not redraw #7's pill tag; new tokens only where none fits, added to @ocelle/tokens with validation; done when #7's checklist holds for each element and item element (a story per variant and state with light and dark baselines through #10's gates on main, interaction tests for every event and payload, keyboard and screen-reader tests, axe with no serious or critical finding, manifest entries, strict-CSP check) plus a 320 px reflow test per element; settle at clarify the questions this record lists (data-table content model and overflow, item element names, timeline list kind, chip-step surface). Under option A the same prompt continues, with spec directory specs/019-data-display-rest, with (P4) ocelle-disclosure and (P5) ocelle-code-block as described in this record; under option B those two are mission 020's."
status: approved
decided_by: "human:jeroennouwsdev"
decided_at: 2026-11-15T22:33:46Z
---

# Triage 019: the rest of #13 (data table, event timeline, evidence chain, disclosure, code block)

## Issues read

**Source of the issue text.** GitHub could not be read from this session: `gh issue view` fails on GraphQL (HTTP
403), `gh api` is on the deny list in `.claude/settings.json`, and no GitHub tool was available. The text of #13 used
here is the one recorded in `triage/013-data-display.md` (on `origin/claude/013-data-display`), which the
orchestrator fetched read-only on 2026-11-13. Comments, labels or linked pull requests added to #13 after that date,
and any issue filed since, were **not** read. The operator should check #13 for later comments before approving.

- **#13** "Elements: data display — ocelle-facts, ocelle-empty-state, ocelle-progress, ocelle-data-table,
  ocelle-event-timeline, ocelle-evidence-chain, ocelle-disclosure, ocelle-code-block". Open, parent epic #1. Checklist
  items 1 and 2 (facts, empty state, progress) are mission 013's (PR #43, landing). The items this record scopes:
  3. `ocelle-data-table`: compact cells with tabular figures, ink-soft cell text, tracked uppercase eyebrow headers
     (#533).
  4. `ocelle-event-timeline`: the Desktop V2 event history (#470 primitive list), using `size-dot`.
  5. `ocelle-evidence-chain`: wraps onto further lines in narrow columns and stays an ordered list; connectors hidden
     from assistive technology; an optional compact chip step (#517); step markers use `size-step` and `ring-step`.
  6. `ocelle-disclosure`: the Desktop V2 disclosure (#470), on native `<details>` semantics or an equivalent button
     with `aria-expanded`.
  7. `ocelle-code-block`: a preformatted block on `color-inset`, sans with tabular figures; a wrap or sideways-scroll
     policy, a reading-width cap and line height `relaxed`; a scroll region that is a tab stop only while it overflows
     (#520, the `ocelle-scroller` pattern); a digest display mode in groups of four.
  8. Done when: #7's checklist for each element (stories per variant and state with light and dark baselines,
     interaction tests for every event and payload, keyboard and screen-reader tests, axe with no serious or critical
     finding, manifest entries, strict-CSP check).
- The spec-kitty-design issues #13 cites (#470, #517, #520, #533) were not read.

## Related work found

| Ref | Kind | Relation | Reason |
|---|---|---|---|
| #13 | issue (open) | in scope | This record covers checklist items 3 to 7. Under option B (below) mission 019 covers 3 to 5 and #13 stays open until mission 020 lands; under option A, 019's PR closes #13. |
| `triage/013-data-display.md` (option B, approved 2026-11-13) | triage record, on `origin/claude/013-data-display` | **parent decision** | Planned two follow-ons: `data-records` (table, timeline, chain) and `disclosure-code-block` (after #15 merges). This record revisits that split, as the operator asked. |
| Mission 013 / PR #43 / `specs/013-data-display` | mission (landing) | **blocks implementation; its conventions apply; not to change** | Builds `ocelle-facts`, `ocelle-fact`, `ocelle-empty-state`, `ocelle-progress`. Amends README § Element conventions: **Slotted items** (container renders the structure in its shadow root, assigns items by manual slot assignment, imports its item element; `ocelle-facts`/`ocelle-fact` are the first pair) and **Identifier wrap** (`wrap="anywhere"` on values only). Also: `undefined` defaults, no monospace, tabular figures, digests in facts are the consumer's text (the sheet never groups them), the busy vocabulary (FR-033), the `.sk-*` mapping table keyed by role names. Run: 4 phases, 6 rounds, 0 phases past round 3, spec 832 lines for 4 tags. |
| #15 / mission 009 / `origin/claude/015-workflow-layouts` | issue (open), built, not merged | **blocks implementation of `ocelle-code-block`; build on it** | `specs/009-workflow-layouts/contracts/overflow-region.md`: internal `OverflowRegion` controller and `overflowRegionStyles` in `src/overflow-region.ts`, with the host template `.region-frame > .region-box[data-fade] > .region-track` plus `.region-ring` and two `.region-edge`; `.region-box { border: 0 }`; `slotchange` heard on the box; role `group` by default ("the scroller's and #13's"); pure helpers `edgeState`, `clearanceScroll({ ring, box, fade, direction })`, `resolveName`; and a list of what a later element must not do (no own tabindex, role or aria-label on the box, no own arrow keys or fades, no smooth writes, `data-fade` through `ifDefined`). Horizontal overflow only (`overflow-y: hidden`). Chromium measured only; WebKit an open limitation. 009 also adds `--ocelle-tracking-caps` ("#8's eyebrow"), used with `font-size-xs` and uppercase by the flat lane title. |
| #8 / mission 011 | issue (open), designed in wave 1, not on any fetched branch | out of scope; **coordinate** | Triage 013 said 011 adds eyebrow tokens (its FR-030). With 009's `tracking-caps` and the existing `font-size-xs`, the data-table headers need no new token; if 011 lands eyebrow tokens first, the data table uses those instead. Two branches must not add the same token. |
| #7 / mission 012 | issue (open), wave 2 | out of scope; **coordinate** | Its "Done when" is #13's by reference. `ocelle-pill-tag`'s compact density is near the evidence chain's compact chip step (#517): the chain must not draw its own pill tag. Status of 012 not read this session. |
| #14 / mission 014 | issue (open), wave 2 | out of scope; **coordinate** | `ocelle-copy-field` owns copying (constitution I: no clipboard I/O in the code block). The code block's digest grouping and a copy field's should group digests the same way and copy the unbroken text. Status not read this session. |
| #17 / mission 005 / `476602e` | issue (closed), merged | done; **supplies the disclosure's icons** | `packages/elements/README.md` names `chevron-end`, `chevron-down` and `chevron-up` for the disclosure (#13); the icon slot convention applies. |
| #10 / mission 006 / `3828d2f` | issue, merged | done; applies | Storybook, `visual` (light and dark baselines) and `axe` gates are on main: the follow-on commits baselines, as 013 did. |
| #23 / mission 007, #35 / op 015 | merged | done; apply | Mutation gate strictness and the shard time limit apply to all new element source; the disclosure's toggle and any timers invite Timeout mutants. |
| #41 / op 016 | op (affected plants locally) | out of scope; applies to implementation | Likely on main by implementation time; the implementing run uses it. Not read this session. |
| #6 / mission 003 | issue (closed), merged | done; **its rules and findings apply** | Base `pre` is on `color-inset` with `pre-wrap` and no scroll; base `table` is its own scroll box; `data-ocelle-wrap="anywhere"`. `findings/frontend-missions.md`: `display:block` tables keep table semantics; `contain: inline-size` collapses in shrink-to-fit hosts; a centred caption in a scrolling table runs off-screen; wide tables lose columns in print; `pre` lines break 1.4.10 at 320 px without `pre-wrap`; `code`/`pre` default to monospace. |
| #5 / mission 002 | issue (closed), merged | done; **supplies the tokens** | `size-dot` (0.45rem), `size-step` (1.4rem), `ring-step` (1.5px), `color-inset`, `color-ink-soft`, `line-height-relaxed`, `figures`, `measure-reading`, `font-size-xs` all exist in `packages/tokens/src/source.ts`. |
| #1 | epic (open) | out of scope | Its #13 gap rows (#517, #520, #533) close when these elements exist. |
| #11 | issue (open) | out of scope; **blocked by #13** | v1.0.0 needs all eight elements of #13. |
| #9, #12, #16 | issues (open) | out of scope | #16: the disclosure is inline, no overlay (triage 008). No element of these five is named in #9 or #12. |
| #27, #28, #29, #30 | issues (open) | out of scope | Manifest source paths, gate-table count, a flaky prose test, the run-summary index conflict (#30 will touch this mission's PR, as every mission's). |
| `specs/`, `ops/`, `triage/` on main | repository | none to fold into | No feature or op covers any of the five elements. 019 is reserved for this work by the operator. |
| `.specify/memory/constitution.md` I, II, III, V, VI, VII, VIII | constitution | applies | I: no `class=` API, no clipboard. II: no monospace; digests in groups of four; tokens only. III: no ID reference across a shadow root (table caption and headers, disclosure summary to panel); host ARIA reaches the inner control (disclosure); full keyboard model; reduced motion (disclosure animation, if any). V: a story per variant and state. VII: new elements are MINOR. VIII: test-first. |
| `knowledge/speckit-flows/guards/vacuous-tests.md` | guard | applies | Slot-based timeline and chain items invite tests that pass on empty slots or unrendered roots. |

## Decision

**`mission`** (semver **MINOR**), with the size of the split a multiple-choice question for the operator.

- **Mission rule:** five new elements in `@ocelle/elements`, very likely with item elements under 013's slotted-item
  convention (a timeline event, a chain step), so new public surface: properties, slots, parts, and at least one
  event (the disclosure's toggle).
- **Open design questions** (Risks): the data table's content model, the disclosure's basis, the digest grouping.
- **Accessibility beyond a local fix:** table semantics across a shadow root, connectors hidden from assistive
  technology, a disclosure keyboard model, a conditional tab stop.
- **Several independently testable user stories** (at least five).
- **Why not the others:** not `op` (new surface, design questions); not `fold` (mission 013 is landing and its
  elements are not to change; 009 only supplies a module); not `none` (real need, #1 rows open); not
  `decision-needed` (the work scopes now; the split is a choice between scoped options).

### One mission or two

Triage 013 split the five into two follow-ons for three reasons. One no longer holds:

- **The blocker reason is gone.** It assumed the code block would wait on #15 while the others could start. The
  operator now holds all implementation until both #15 (009) and 013 are on main, and this run is design only. The
  overflow-region contract is fixed and readable, so the code block can be designed now like the rest.
- **Size still holds.** Five elements plus probably two item elements are seven tags: about 013's four tags twice
  over. 013's spec was 832 lines and 009's 960; one spec for all five would be the largest yet.
- **Risk profiles still differ.** Table, timeline and chain are static, list- and table-semantic readouts that reuse
  013's slotted-item pattern. Disclosure and code block are the only ones with a keyboard model, an event or a
  conditional tab stop, and the code block brings the digest question.

**Judgement: two missions (option B), as triage 013 planned**: governance errs toward the smaller reviewed unit, and
each half is close to the size that ran cleanly in 013 (four tags, six rounds). Option A is a reasonable choice now
that the blocker is gone, if the operator values closing #13 in one PR over smaller runs.

| Option | Missions | Pros | Cons |
|---|---|---|---|
| **A. One mission** | 019 `data-display-rest`: P1 data table, P2 event timeline, P3 evidence chain, P4 disclosure, P5 code block | One triage, spec, plan and PR; #13 closes with it; shared questions (item naming, digest grouping, overflow reuse for the table) decided once. Implementation waits for 009 anyway, so no story is blocked inside it. | Largest spec so far (about seven tags); long serial run with merge-conflict exposure to waves 1 and 2; two risk profiles in one review loop. |
| **B. Two missions, as triage 013 planned (recommended)** | 019 `data-records`: data table, event timeline, evidence chain. 020 `disclosure-code-block`: disclosure and code block, its own session later. | Each mission about 013's size; one risk profile each; 019 does not depend on the overflow-region contract unless the table adopts it; follows the approved parent decision. | Two triage-gated runs; #13 stays open until 020 lands; 020 must follow 019's README conventions (item naming). |
| **C. Two missions, regrouped by overflow** | 019: event timeline, evidence chain, disclosure. 020: data table and code block, the two wide-content elements that may both use 009's overflow region. | Puts both elements that may scroll sideways, and both depending on 009, in one mission, so the overflow reuse is designed once. | Splits the "records" family; 019 mixes static lists with the one interactive element; only worth it if clarify decides the table scrolls through the overflow region. |
| **D. Two missions, code block alone** | 019: data table, event timeline, evidence chain, disclosure. 020: code block. | Isolates the only element that needs 009 and the digest design; 020 becomes small. | 019 is nearly as large as A (six tags); the code block alone is close to op size for a mission's ceremony. |

Under B, C and D, the second mission takes number 020, gets its own triage record citing this one and #13, and runs
in a later session.

## Scope

**Issues:** in scope #13 only (items 3 to 7). All others are out of scope as listed above. Mission 013's four
elements are not changed by either mission; an amendment to README § Element conventions is allowed only where a new
pattern needs it (as 013 amended it), recorded in the spec.

**Mission 019 under the recommended option B** (`specs/019-data-records`):

1. **P1 `ocelle-data-table`.**
   - Compact cells with `--ocelle-figures`, cell text `--ocelle-color-ink-soft`, headers in tracked uppercase
     eyebrow style (`--ocelle-font-size-xs`, `--ocelle-tracking-caps`, uppercase) unless 011's eyebrow tokens are on
     main first.
   - Table semantics for assistive technology (role table, rows, column headers, caption) with no ID reference across
     a shadow root.
   - A narrow-column behaviour and print decision settled at clarify; a 320 px reflow test.
2. **P2 `ocelle-event-timeline`.** The Desktop V2 event history (#470) as a list of event items, each with a
   `--ocelle-size-dot` marker, using 013's slotted-item pattern; identifier values take the wrap policy.
3. **P3 `ocelle-evidence-chain`.** An ordered list of steps that wraps onto further lines in narrow columns and stays
   an ordered list; connectors hidden from assistive technology; step markers at `--ocelle-size-step` with
   `--ocelle-ring-step`; an optional compact chip step (#517) that does not redraw #7's pill tag.
4. **For all three:** #7's done-when checklist per element and item element; manifest entries; README sections and
   `.sk-*` mapping rows (role names only in tests); changelog entries; new tokens only where none fits.

**Mission 020 under option B** (`specs/020-disclosure-code-block`, own session):

- **`ocelle-disclosure`:** native `<details>`/`<summary>` in the shadow root or a button with `aria-expanded`; host
  ARIA reaching the inner control; a toggle event with its payload; the #17 chevrons through the icon slot
  convention; reduced motion for any animation.
- **`ocelle-code-block`:** a `pre` on `--ocelle-color-inset` in the sans with tabular figures,
  `--ocelle-line-height-relaxed`, a cap at `--ocelle-measure-reading`; a wrap or scroll policy whose scroll mode is
  009's `OverflowRegion` used exactly as its contract states (the `pre` inside `.region-track`, role `group`, the
  label through `setLabel`), with nothing reimplemented; a digest mode in groups of four; no copy control.

**Out of both:** copying (#14 and the host); eyebrow tokens if 011 owns them; vertical overflow for the code block
(the module is horizontal only and #13 asks for none); WebKit measurement (environment limit, as in 009).

## Risks and open questions

**For the operator (triage gate):**

- **Q1. The split:** (a) one mission, option A; (b) two missions as triage 013 planned, option B (recommended);
  (c) two missions regrouped by overflow, option C; (d) two missions with the code block alone, option D.

**For clarify inside the mission** (none changes the split, except where noted):

- **Data-table content model** (largest open design): (a) a slotted light-DOM `<table>` styled by `@ocelle/styles`
  rules scoped to the element (shadow CSS cannot reach a slotted table's cells); (b) the element renders the table in
  its shadow root from row and cell item elements (more tags); (c) a data property of columns and rows (no markup
  content; htmx-unfriendly); (d) a light-DOM-rendering element. The choice decides whether ID references (caption,
  headers) stay inside one root.
- **Data-table overflow:** (a) wrap cells and never scroll; (b) scroll sideways through 009's overflow region (then
  the table depends on 009 too, which favours option C); (c) the 003 base-table scroll box as is. Print behaviour
  goes with it.
- **Item element names and list kind:** for example `ocelle-timeline-event` and `ocelle-evidence-step`; whether the
  timeline is an ordered list (chronology) or a plain list.
- **Chip step surface:** (a) a `compact` variant on the step; (b) the consumer slots #7's pill tag; (c) a chain-level
  `density`.
- **Disclosure basis** (020 under B): (a) native `<details>` in the shadow root; (b) a button with `aria-expanded`
  and a region; how the summary is named without crossing a root, and whether `open` is reflected for htmx.
- **Digest mode** (020 under B): (a) spaced groups rendered in shadow DOM with the unbroken digest as the accessible
  text; (b) groups as wrapped spans with CSS gaps, copy gives the unbroken text; (c) the consumer pre-groups and the
  element only lays out. Copied text and screen-reader reading must stay the unbroken digest; align with #14.

**Risks:**

- **Implementation order.** Implementation waits for 009 and 013 on main. If 009's overflow-region contract changes
  in its last review rounds, the code block's design must be re-read against the merged module.
- **Eyebrow tokens.** 011 and 009 both touch the eyebrow look; the data table must take whichever is on main and add
  none of its own.
- **Base `pre` vs code block.** The base `pre` wraps and never scrolls (003); the element's scroll mode is a
  separate policy that must not contradict the base rule for un-upgraded content.
- **Unread updates.** #13, #7, #14 and #8 were not re-read this session (see Issues read).

## What would change this decision

- **The operator wants #13 closed in one PR:** option A, spec `specs/019-data-display-rest`.
- **Clarify decides the data table scrolls through the overflow region:** option C groups the two 009 users
  together.
- **A comment on #13 or an upstream issue (#470, #517, #533) moves an element elsewhere** (for example the chip step
  into #7's pill tag, or the disclosure into another issue): that element leaves scope and the remaining split is
  re-judged.
- **009 is abandoned or its module stays unmerged:** the code block either waits or builds on whatever replaces it;
  under B only 020 is affected.
- **011 lands eyebrow tokens with a different look** from `tracking-caps` and `font-size-xs`: the data table uses
  011's and its header spec changes, not its scope.
