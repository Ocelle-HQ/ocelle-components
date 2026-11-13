---
triage: 13
issues: [13]
decision: mission
target: "013-data-display"
in_scope: [13]
out_of_scope: [1, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 23, 27, 28, 29, 30]
semver: minor
spec_prompt: "Mission for #13 (triage/013-data-display.md), spec directory specs/013-data-display, under the split the operator picks at the triage gate (recommended option B: this mission builds the first three of #13's eight elements, and #13 stays open for two follow-on missions): in @ocelle/elements, following mission 005's element conventions (README § Element conventions, manifest gate), with every class family replaced by an element (spec-kitty-design#523), no monospace, and values and ids in Schibsted Grotesk with tabular figures (--ocelle-figures); (P1) ocelle-facts, a responsive label and value grid (#280) that keeps the semantics of a description list across its slots, with values at --ocelle-font-size-fact (#531) and the identifier wrap policy of 003 (data-ocelle-wrap, #535) available on values through a part or property; (P2) ocelle-empty-state, with a consumer-set heading level and a panel variant with the larger vertical rhythm and lighter heading weight of the prototype's empty and loading panels (#510); (P3) ocelle-progress, determinate, indeterminate, compact and labelled (#498), named without an ID reference crossing a shadow root, with the indeterminate motion stopped under prefers-reduced-motion, and the ochre --ocelle-color-accent fill paired with --ocelle-color-accent-strong or text in light mode (constitution II); new tokens (panel rhythm, progress track) only where no existing token fits, added to @ocelle/tokens with validation; done when #7's checklist holds for each element (a story per variant and state with light and dark baselines, interaction tests for every event and payload, keyboard and screen-reader tests, axe with no serious or critical finding, manifest entries, strict-CSP check) plus a 320 px reflow test for facts; settle at clarify the questions this record lists (facts' child structure, progress's platform basis, the panel variant's tokens). Under option A the same prompt continues with (P4) ocelle-data-table, (P5) ocelle-event-timeline, (P6) ocelle-evidence-chain, (P7) ocelle-disclosure and (P8) ocelle-code-block as described in this record."
status: approved
decided_by: "human:jeroennouwsdev"
decided_at: 2026-11-13T18:28:54Z
---

# Triage 013: Data display (#13): facts, empty state, progress, data table, event timeline, evidence chain, disclosure, code block

## Issues read

**Source of the issue text.** GitHub could not be read from this session: `gh issue view` and `gh search` fail on
GraphQL (HTTP 403), and `gh api` is on the deny list in `.claude/settings.json`. The orchestrator fetched the texts
read-only through the GitHub tools on 2026-11-13 and gave them as one file (`scratchpad/issues.md`). It holds #13 in
full, the epic #1 gap-table rows for #13, #7 (with its "Done when" checklist), #14, and the lists of all issues and
pull requests. The spec-kitty-design issues #13 cites (#280, #470, #498, #510, #517, #520, #523, #531, #533, #535)
were not read.

- **#13** "Elements: data display — ocelle-facts, ocelle-empty-state, ocelle-progress, ocelle-data-table,
  ocelle-event-timeline, ocelle-evidence-chain, ocelle-disclosure, ocelle-code-block". It is open, its parent is epic
  #1, and it has no comments, labels, milestone, sub-issues or linked pull requests. The preamble says Spec Kitty has
  several of these only as class families (`.sk-facts`, `.sk-empty-state`, `.sk-progress`, `.sk-data-table`). Here
  every one becomes an element (#523). There is no monospace: values, ids and code use Schibsted Grotesk with tabular
  figures, and digests are shown in groups of four. Checklist:
  1. `ocelle-facts` (34 class uses in kitty-mission-ui): a responsive label and value grid (#280), with the
     identifier wrap policy on values (#535), and values at `font-size-fact` with tabular figures (#531).
  2. `ocelle-empty-state` (75 uses) and `ocelle-progress` (74 uses):
     - elements, not classes (#523, #498);
     - progress is determinate, indeterminate, compact and labelled (#498), and in light mode the ochre fill is paired
       with `accent-strong` or text (#5's contrast rule);
     - a panel variant with the larger vertical rhythm and lighter heading weight of the prototype's loading and
       empty panels (#510).
  3. `ocelle-data-table`: compact cells with tabular figures, ink-soft cell text, and tracked uppercase eyebrow
     headers (#533).
  4. `ocelle-event-timeline`: the Desktop V2 event history (#470 primitive list), using `size-dot`.
  5. `ocelle-evidence-chain`:
     - wraps onto further lines in narrow columns and stays an ordered list;
     - connectors are hidden from assistive technology;
     - an optional compact chip step (#517);
     - step markers use `size-step` and `ring-step`.
  6. `ocelle-disclosure`: the Desktop V2 disclosure (#470), on native `<details>` semantics or an equivalent button
     with `aria-expanded`.
  7. `ocelle-code-block`:
     - a preformatted block on `color-inset`, in the sans with tabular figures;
     - a wrap or sideways-scroll policy, a reading-width cap and line height `relaxed`;
     - a scroll region that is a tab stop only while it overflows (#520, the same pattern as `ocelle-scroller`);
     - a digest display mode in groups of four.
  8. Done when: "Same checklist as the actions issue" (#7): for each element, a story per variant and state with
     visual baselines in light and dark; interaction tests that assert every event and its payload; keyboard and
     screen-reader behaviour tested, with axe reporting no serious or critical finding; the manifest lists every
     public property, event, slot and part; the built output passes the strict-CSP check.
- **#1** gap table:
  - #498, #510, #517, #520, #523, #533 and #280 are assigned to #13 (progress element, panel tokens, evidence-chain
    wrapping, code block, facts and empty-state elements, compact data table, responsive facts);
  - #531 and #535 (compact type scale, value style, identifier wrap policy) are assigned to #5 and #6, both closed.

## Related work found

| Ref | Kind | Relation | Reason |
|---|---|---|---|
| #13 | issue (open) | in scope | This record. Under every split option except A, a mission covers only part of #13, so #13 stays open until the last follow-on lands. |
| #1 | epic (open) | out of scope | Parent of #13. Its seven gap rows for #13 close only when all eight elements exist. #11 ties v1.0.0 to every row. |
| #5 / mission 002 | issue (closed), merged `ec0f533` | done; **supplies the tokens** | Every token #13 names exists in `packages/tokens/src/source.ts`: `font-size-fact`, `size-dot`, `size-step`, `ring-step`, `color-inset`, `color-ink-soft`, `color-accent`, `color-accent-strong`, `line-height-relaxed`, `figures`, and `measure-reading` for the reading cap. **Gaps:** there are no eyebrow tokens (needed by the data-table headers, #533), and maybe no tokens for the panel rhythm (#510, "panel tokens" in #1) or a progress track. |
| #6 / mission 003 | issue (closed), merged `64c61d9` | done; **its hooks and measurements apply** | `packages/styles/README.md`: `data-ocelle-wrap="anywhere"` is the identifier wrap policy (#535), which the elements expose through a part or property (triage 003). Base `pre` is on `color-inset`, wraps with `pre-wrap` and does not scroll. A base `table` is its own scroll box, and its header and caption rules apply. The browser facts in `findings/frontend-missions.md` § Layout and § Accessibility come from this mission. |
| #17 / mission 005 / `476602e` | issue (closed), merged | done; **its conventions apply** | Element conventions, the `manifest` gate and the engine floor (Chromium 120, WebKit 16.4). The chevron icons already name the disclosure (#13) as a consumer (`packages/elements/README.md:78-80`). |
| #23 / mission 007 / `e7d7d54` | issue (closed), merged | done; applies | Stricter mutation verdicts apply to all new element source. Indeterminate animation and toggle timing invite Timeout mutants. |
| #10 / triage 006 / `specs/006-storybook-workbench` on `origin/claude/010-storybook-workbench`, PR #24 (open, do not merge) | issue (open), designed, not merged | out of scope; **soft blocker** for the baseline and axe part of "Done when" | Builds the `visual` (byte-exact light and dark baselines, pinned container) and `axe` gates. If #10 is on main first, this mission commits the baselines; if not, it writes the stories and tests the accessibility tree in Vitest, and #10's rebase picks the stories up (the same rule as triage 011). |
| #15 / triage 009 / `specs/009-workflow-layouts` on `origin/claude/015-workflow-layouts` | issue (open), designed, not merged | out of scope; **blocks `ocelle-code-block`** | 009 builds the "tab stop only while it overflows" logic once, as an internal overflow-region module (`contracts/overflow-region.md`, FR-011). Role `group` is the default, "the scroller's and #13's", and the README documents it so #13 reuses it without new design. Building `ocelle-code-block` before 009 merges would mean writing the logic a second time (constitution VI) or depending on an unmerged branch. |
| #7 / wave 2 → 012 | issue (open), in triage in parallel | out of scope; **defines the done-when; coordinate** | Its "Done when" is #13's checklist by reference. **Overlaps:** <br>• `ocelle-status-indicator`'s "never pulses an empty box" is #498, which #13's `ocelle-progress` also cites: the two need one loading vocabulary (which element signals busy, and how). <br>• `ocelle-pill-tag`'s compact density is close to the evidence chain's "compact chip step" (#517): the chain must not draw its own pill-tag. <br>• `ocelle-metric`'s eyebrow label (#509) needs the same eyebrow tokens as the data-table headers. |
| #8 / triage 011 / `specs/011-layout-headers` on `origin/claude/008-layout-headers` | issue (open), in design in wave 1 | out of scope; **supplies the eyebrow tokens** | 011 adds the eyebrow tokens to `@ocelle/tokens` (its FR-030), uppercase and tracked in Schibsted Grotesk; triage 011 records the no-monospace decision. `ocelle-data-table`'s headers (#533) use those tokens: whichever of 011, 012 (#7) and the data-table work lands first adds them, and the others use them. Facts, empty states and tables often sit in `ocelle-card`, with no dependency. Like `ocelle-page-header`, `ocelle-empty-state` should keep the consumer's heading level. |
| #14 / wave 2 → 014 | issue (open), in triage in parallel | out of scope; **coordinate** | `ocelle-copy-field` (request-only copy, long commands wrap, #534) is near the code block's digest mode. #13 asks for no copy control on the code block, so copying stays with #14 and the host (constitution I: no clipboard I/O). If a consumer puts a digest in a copy field, both elements should group digests the same way and copy the unbroken text. |
| #9 / triage 010 | issue (open), in design in wave 1 | out of scope | Triage 010 already notes that `ocelle-notice` is a different element from #13's empty state. A loading panel (progress plus empty state) is not a notice. |
| #16 / triage 008 | issue (open), in design in wave 1 | out of scope | `ocelle-disclosure` is inline, with no overlay (triage 008). Code blocks and tables inside a dialog or drawer meet 003's shrink-to-fit finding: plan detail, not a dependency. |
| #12 | issue (open) | out of scope | No data-display element named. |
| #11 | issue (open) | out of scope; **blocked by #13** | v1.0.0 needs every gap row of #1, so it needs all eight elements and changelog entries for `@ocelle/elements` (and `@ocelle/tokens` if tokens are added). |
| #27 | issue (open) | out of scope; note | `custom-elements.json` names source files that are not shipped. This mission adds entries; the fix is #27's. |
| #28, #29, #30 | issues (open) | out of scope | Gate-table count, a flaky prose test, and the run-summary index conflict (#30 will touch this mission's PR, as it does every mission's). |
| `specs/`, `ops/`, `triage/` | repository | none to fold into | Merged: specs 001–003, 005 and 007, and op 004. Wave 1 is 008 to 011 (#16, #15, #9, #8; #10 is 006). Wave 2 is 012 (#7) and 014 (#14). No feature covers any of #13's elements. |
| `.specify/memory/constitution.md` I, II, III, V, VI, VII | constitution | applies | I: elements only, no `class=` API, and no I/O (no copy in the code block). II: tokens only, no monospace, digests in groups of four, and the ochre fill never the only mark of a state in light mode (this governs progress). III: no ID reference crosses a shadow root (progress label, facts label to value), host ARIA reaches the inner control (disclosure), and reduced motion (indeterminate progress). V: a story per variant and state. VII: new elements are MINOR, and before 1.0.0 the surface may still change. |
| `knowledge/speckit-flows/findings/frontend-missions.md` | finding | applies | Directly relevant: <br>• an overflowing box is a tab stop only without a focusable descendant, and WebKit differs (code block); <br>• `display:block` tables keep table semantics, so assert structure, not header links (data table); <br>• `1fr` widens on long identifiers, so use `minmax(0,1fr)` (facts); <br>• `pre` lines break 1.4.10 at 320 px without `pre-wrap`; <br>• `code` and `pre` default to monospace; <br>• `contain: inline-size` collapses in shrink-to-fit hosts; <br>• print loses table columns. <br>Also Node 22 against 26.13.0, `OCELLE_CHROMIUM_PATH`, no WebKit, and one heavy job at a time. |
| `knowledge/speckit-flows/guards/vacuous-tests.md` | guard | applies | Tests on empty slots or unrendered shadow roots pass vacuously. That is likely for slot-based facts, timeline and chain items. |
| `knowledge/speckit-flows/runs/005-icons-brand-mark.md` | run summary | calibrates scope | Two elements took 5 phases, 11 review rounds and an 854-line spec. 009 (four layout elements) is 960 lines. Eight elements in one spec would be about twice the largest so far. |

## Decision

**`mission`** (semver **MINOR**), with a recommended split for the operator to confirm at the triage gate.

- **Mission rule:** #13 adds eight custom elements to `@ocelle/elements`, all new public surface (properties,
  attributes, slots, parts, probably events from the disclosure). It probably also adds tokens to `@ocelle/tokens`
  (panel rhythm, a progress track, the eyebrow tokens if 011 has not landed), so it spans packages.
- **It has open design questions** (see Risks):
  - how `ocelle-facts` keeps description-list semantics across a shadow root;
  - native `<progress>` or `role="progressbar"`, and the indeterminate motion;
  - a slotted `<table>` or a data property for the data table;
  - native `<details>` or a button for the disclosure;
  - how a digest is grouped in fours while the copied text stays unbroken.
- **It touches accessibility well beyond a local fix:** progress announcements, connectors hidden from assistive
  technology, a disclosure keyboard model, a conditional tab stop.
- **It has at least eight independently testable user stories.**
- **Why not the others:**
  - not `op`: new public surface and design questions;
  - not `fold`: nothing in progress covers these elements, and 009 only supplies a module the code block reuses;
  - not `none`: the need is real (183 class uses for facts, empty state and progress alone);
  - not `decision-needed`: the work can be scoped now, and the split is a choice between scoped options, not a
    blocker.

### One mission or a split

**Judgement: split.** Recommended: **option B, three missions, with 013 taking facts, empty state and progress.**

- **Size.** One element pair (005) took 11 review rounds. Eight elements in one spec, plan, squad and phase loop would
  give the largest spec yet and a long, serial run. The frontend findings show that every new layout context costs
  review rounds.
- **A real blocker on one element.** `ocelle-code-block` depends on 009's overflow module, which is unmerged. In a
  single mission the last story would wait on #15, or the logic would be written twice.
- **The elements fall into groups with different risks and dependencies:**
  - **Readouts** (facts, empty state, progress): replace the three biggest class families (34 + 75 + 74 uses), need
    nothing unmerged, and give consumers the most value soonest.
  - **Records and sequences** (data table, event timeline, evidence chain): list and table semantics, wrapping in
    narrow columns, step markers. The data table wants 011's eyebrow tokens. The chain's chip step should line up with
    #7's pill tag (012).
  - **Interactive and overflow** (disclosure, code block): the only elements with a keyboard model or a conditional
    tab stop. The code block needs 009, and the disclosure is small.
- **Each group is an independently testable outcome** that a consumer can adopt on its own.

**Options for the operator** (pick one at the triage gate):

| Option | Missions | Pros | Cons |
|---|---|---|---|
| **A. One mission** | 013: all eight elements as P1–P8 (readouts, then records, then disclosure, then code block last) | One spec, one set of shared conventions (wrap exposure, figures, slot item pattern) decided once. #13 closes in one PR. | Largest spec so far. P8 is blocked until #15 merges, so the PR waits or ships with the code block deferred (which becomes option B or C anyway). Long serial run with merge-conflict exposure against waves 1 and 2. |
| **B. Three missions (recommended)** | 013 `data-display`: facts, empty state, progress. Follow-on 1 `data-records`: data table, event timeline, evidence chain. Follow-on 2 `disclosure-code-block`: disclosure and code block, started after #15 merges. | Smallest first mission with the highest consumer value and no unmerged dependency. Each follow-on starts when its dependencies are on main: eyebrow tokens from 011 or 012, the overflow module from 009. | Three triage-gated runs. Shared conventions (how item children are slotted, how wrap is exposed) are set in 013 and must be followed later, so 013's README must record them. |
| **C. Two missions** | 013: the seven elements that do not need #15 (readouts, records, disclosure). Follow-on: `ocelle-code-block` alone, after #15 merges. | Removes the only hard blocker and keeps one big run. The code block becomes a small mission, close to an op because the digest mode is the only open design. | 013 is still a seven-element spec, nearly as large as A, and depends softly on 011's eyebrow tokens for the data table. |
| **D. Four missions** | As B, but the disclosure is its own small mission (it has an icon dependency only, already met) and the code block waits alone for #15. | Each mission has one risk profile. The disclosure could run now, in parallel. | Most triage and review overhead. The disclosure on its own is small enough that a separate mission adds ceremony more than safety. |

Under B, C and D, the follow-on missions get their own triage records and numbers when the operator starts them. Each
cites this record and #13.

## Scope

**Issues:** in scope #13 only. Under B, C and D this mission covers part of it, so #13 is not closed by 013's PR. All
other issues are out of scope as listed in the table.

**Mission 013 under the recommended option B** (spec directory `specs/013-data-display`):

1. **P1 (MVP) `ocelle-facts`.**
   - A label and value grid that is responsive: one column on narrow containers (#280), with `minmax(0, 1fr)`
     tracks so long ids do not widen it.
   - Values at `--ocelle-font-size-fact` with `--ocelle-figures` (#531), the wrap policy exposed for identifier
     values (#535, via 003's hook), and description-list semantics preserved for assistive technology.
   - A 320 px reflow test.
2. **P2 `ocelle-empty-state`.**
   - Title, body and an actions slot, with a heading level set by the consumer.
   - A `panel` variant with the larger vertical rhythm and lighter heading weight (#510).
   - Usable as the loading panel together with P3.
3. **P3 `ocelle-progress`.**
   - Determinate (value and max), indeterminate, compact and labelled (#498).
   - Named without a cross-root ID reference.
   - The indeterminate motion stops under reduced motion.
   - In light mode the ochre fill is paired with `accent-strong` or text, and forced colours keep the fill visible.
4. **For all three:**
   - #7's done-when checklist;
   - manifest entries;
   - no `class=` API;
   - README conventions for item children and wrap exposure, so the follow-ons reuse them;
   - any new token in `@ocelle/tokens` with its validation and contrast declaration.

**Out of 013 under B:** data table, event timeline and evidence chain (follow-on 1), and disclosure and code block
(follow-on 2). Copying stays with #14 and the host. The eyebrow tokens are added by 011 (or 012), not here.

## Risks and open questions

**For the operator (triage gate):**

- **Q1. The split.** Option A, B (recommended), C or D above.

**For clarify inside the mission** (none of these changes scope):

- **Facts structure:**
  - (a) `ocelle-facts` with slotted `dt` and `dd` children;
  - (b) a child element (`ocelle-fact` with `label`), which adds a ninth element to the surface;
  - (c) a data property.

  Description-list roles across a slot need measuring in Chromium. Option (b) is common for the timeline and chain
  too, so the choice sets a library pattern.
- **Progress basis:** native `<progress>` in the shadow root, or `role="progressbar"` with
  `aria-valuenow`/`min`/`max` via `ElementInternals`. Which gives the label without crossing a root? Also, how does
  indeterminate look with reduced motion on?
- **Panel tokens:** reuse the `space-*` scale and `font-weight-*`, or add panel tokens (#1 calls #510 "panel tokens").
- **Shared loading vocabulary with #7's status indicator (#498).** Settle it with 012, whichever spec is checked
  second.

**Risks:**

- **Under A or C, the data table depends on eyebrow tokens** that 011 is adding in parallel. Two branches adding the
  same tokens would conflict.
- **The code block's digest mode:**
  - grouping by inserted spaces changes the copied text and the screen-reader reading;
  - grouping by CSS cannot be done on text runs without wrapping elements;
  - this is a design question for whichever mission builds it.
- **Base `pre` vs the code block.** The base `pre` wraps and never scrolls (003), while `ocelle-code-block` offers
  scroll as a policy. Its scroll mode must reuse 009's module, including the WebKit difference recorded there.
- **Baselines.** With #10 unmerged, the baseline and axe parts of "Done when" follow 011's rule (stories now,
  baselines when #10 lands).

## What would change this decision

- **#15 (009) merges before the operator decides:** the code block's blocker is gone, and C collapses towards A.
  Option A becomes reasonable if the operator values one PR over smaller runs.
- **The operator wants #13 closed in one PR:** option A, with the code block last and the mission's end tied to #15
  merging.
- **The upstream #498 or #517 text, once read**, shows progress or the chip step belongs with #7's status indicator or
  pill tag: those parts fold into 012, and 013 shrinks.
- **011 or 012 drops the eyebrow tokens:** whichever mission builds the data table adds them, and its scope grows to
  `@ocelle/tokens`.
- **Measurement shows description-list semantics cannot survive the shadow boundary** without a child element: facts
  gains `ocelle-fact`. Still MINOR, but one more element to record in the spec.

## Operator decision at the triage gate

- **Q1. The split:** option **B**, three missions, chosen by the operator at the triage gate (2026-11-13).
  Mission 013 builds `ocelle-facts`, `ocelle-empty-state` and `ocelle-progress`. Follow-on 1 builds the data table,
  event timeline and evidence chain. Follow-on 2 builds the disclosure and code block, after #15 merges. #13 stays
  open until the last follow-on lands.
