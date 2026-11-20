# The #470, #517 and #533 issue texts against the operator's answers (2026-11-20)

- **Source:** the bodies of spec-kitty/spec-kitty-design #470, #517 and #533, fetched on 2026-11-20 and supplied by the
  operator (IQ-25; `reviews/phase-1/inventory-decisions.md`, `reviews/phase-2-inventory-decisions.md`), recorded
  verbatim in `sources/issue-470.md`, `sources/issue-517.md` and `sources/issue-533.md`.
- **Compared with:** spec, plan, research and contracts at 227c8cb; `reviews/spec/operator-gate.md`;
  `reviews/plan/operator-gate.md` (decision 1, Q-A, Q-B, Q-C, Q-E, Q-G); `reviews/recheck-decisions.md` (Q1 to Q6);
  every `reviews/phase-1/*decisions*.md`; `reviews/phase-2-inventory-decisions.md`; the open phase 3 questions IQ-18
  to IQ-24 and IQ-27 (`reviews/phase-1/inventory-questions.md`); the run's standing constraints (mission 013's
  conventions, no monospace) and the constitution.
- **Verdicts:** *agrees* (no change needed), *adds* (something with no conflict; applied, or asked where it grows
  scope), *contradicts* (an answer or a rule in force says otherwise; nothing changed, a question below), *bears*
  (evidence for a question still open; nothing decided, carried to that question's round).
- **Changed in this step:** the three `sources/issue-*.md` files (new); two citation fixes in `sources/`; the
  sources references in spec, plan, research and tasks. No requirement, contract, test or count changes.

## #533, the data table (phase 1, approved and folded)

| # | Point in #533 | In force | Verdict |
|---|---|---|---|
| 533-1 | Cells in the mono face | Constitution II "No monospace anywhere"; 013's conventions; FR-005 (`font-sans`, `figures`); plan § Constitution Check II | **Contradicts**: Q-T1 |
| 533-2 | Cell text in the body colour, not the brightest foreground | FR-005 `--ocelle-color-ink-soft` (dark `#CFC9BE`, below `ink` `#EDE9E1`) | Agrees |
| 533-3 | A compact density: cell size and padding | FR-005; R-06 (`font-size-sm`, `line-height-compact`, `space-1` / `space-2`) | Agrees |
| 533-4 | Headers as small tracked uppercase eyebrows, reusing the eyebrow style with a tracking token | FR-006; recheck Q1 (a) (011's four eyebrow tokens); IQ-7 (a); spike Q2 (a) (upper case kept) | Agrees |
| 533-5 | Header size: the extra-small text step | `--ocelle-font-size-eyebrow` = `font-size-xs` (FR-006, R-06) | Agrees |
| 533-6 | Header tracking 0.06em (the prototype's header figure; 0.08em elsewhere) | `--ocelle-tracking-eyebrow` = 0.08em (recheck Q1 (a); FR-006; FR-040: no new eyebrow token) | **Contradicts** in the figure: Q-T2 |
| 533-7 | Header colour: the subtle foreground | `--ocelle-color-eyebrow`, which is `ink-muted`, the quietest text ink with a text-contrast declaration (recheck Q1 (a)); no subtler text ink exists | Agrees (same role) |
| 533-8 | Headers in the mono face | as 533-1 | **Contradicts**: Q-T1 |
| 533-9 | Header padding `--sk-space-3` | R-06: headers take the body cells' padding (`space-1` block, `space-2` inline); approved at the plan gate, built in phase 1 | **Contradicts** if the library's step is Ocelle's 12 px (the spec-kitty space scale is not recorded here): Q-T3 |
| 533-10 | The library draws headers "in the cell style" (rc.10, the line #533 was written against) | The 1.0.0 / `develop` clone draws them medium and muted (`sources/spec-kitty-design-inventory.md` § 1); IQ-7 (a) maps the library's header look to the eyebrows whichever it is | Agrees (no bearing; rc.10 may differ from the clone, as IQ-1 (a) allows) |
| 533-11 | A table of machine values: lane names, counts, identifiers | FR-005 tabular figures; FR-007 `wrap="anywhere"`; IQ-3 numeric cell | Agrees |
| 533-12 | Related issues #509 and #497 (eyebrow typography), #519 (prose tables) | Not cited by #13 for this mission; #519 is recorded in 003's sources; the eyebrow is 011's | Agrees (nothing to apply) |
| 533-13 | The consumer: kitty-mission-ui's Drift screen (MOES-Media/kitty-mission-ui#10), local exception E-37, sunsets on #533 | The spec's Consumers line (kitty-mission-ui replaces `.sk-data-table`) | Agrees |

## #517, the evidence chain (phase 3, not started)

| # | Point in #517 | In force | Verdict |
|---|---|---|---|
| 517-1 | Let the chain wrap onto further lines when space runs out | FR-034 (wraps by the chain's own inline size); IQ-21 open, recommendation (a) | Agrees; **bears** on IQ-21: the ask is wrapping, not the library's viewport stack, so it supports (a) over (c) |
| 517-2 | Keep it an ordered list | FR-030, FR-032 (ordered list semantics) | Agrees |
| 517-3 | Decorative connectors hidden from assistive technology | FR-032 | Agrees |
| 517-4 | It overflows in a narrow column "around 200px" | FR-034's container rule (any width); measured at 1280, 600 and 320 px (US3, FR-053) | **Adds** a narrower width; not applied because it grows phase 3's tests: Q-T5 |
| 517-5 | An optional compact step style | FR-035 (`variant="chip"`, unset by default) | Agrees |
| 517-6 | A single chip per step, without the stacked label | FR-035 (no marker or ordinal; the content only) | Agrees |
| 517-7 | The chip is pill-shaped | FR-035 (`--ocelle-radius-2`, never `--ocelle-radius-pill`); constitution II (one radius; the pill radius for state pills only); US3-4 | **Contradicts**: Q-T4 |
| 517-8 | The chip's fill: not stated | Q-A (a), outline only, no fill | Agrees (no conflict) |
| 517-9 | The stand-in uses `sk-pill-tag` items and is replaced when the chain's own step ships | FR-035 (the chip reads nothing of #7's pill tag; "the chip is the chain's own") | Agrees |
| 517-10 | The stand-in's arrows are hidden | FR-032 (connectors hidden); IQ-22 open, recommendation (a), a plain connector | **Bears** on IQ-22: the consumer draws arrows today; that is evidence for (b), not a reason to drop (a) |
| 517-11 | The consumer: kitty-mission-ui's Work Package detail screen (mission-ui#5) | The spec's Consumers line; IQ-27 open, recommendation (a) | Agrees; **bears** on IQ-27: a kitty-mission-ui screen shows the chain independently of #470's family list, which answers the "at all" half of (b) and supports (a) |
| 517-12 | Each library step stacks its label over its value, and in a wide placement the label duplicates the value | IQ-19 open, recommendation (a), free content in the step | **Bears** on IQ-19: the reporter finds the valued label-and-value stage redundant, against (b) |
| 517-13 | The stand-in is a native ordered list in the consumer's markup | IQ-18 open, recommendation (a), slotted steps (Q3 (a)) | **Bears** on IQ-18: markup-first, so it supports (a) |
| 517-14 | The library's chain is one non-wrapping row with fixed 40px connectors | `sources/spec-kitty-design-inventory.md` § 3 (one row, a fixed-width connector) | Agrees |
| 517-15 | Tone, empty state, parts | IQ-20, IQ-23, IQ-24 open | No bearing |

## #470, the Desktop V2 hand-off (phases 2 and 3)

| # | Point in #470 | In force | Verdict |
|---|---|---|---|
| 470-1 | The title | As recorded (`sources/spec-kitty-design-inventory.md`, 013's and 009's sources) | Agrees |
| 470-2 | The 22 families: data-table and event-timeline among them, evidence-chain not | `sources/issue-470-handoff-background.md` (22 families, no chain); IQ-27's premise | Agrees with both. **Adds** a correction: `sources/spec-kitty-design-inventory.md` said #470 "lists data-table, event-timeline and evidence-chain", read from the epic's scope line in 009's sources, which names evidence-chain only after "plus". **Applied** (dated correction in that file) |
| 470-3 | The event history is a Desktop V2 primitive | Spec US2 "a Desktop V2 primitive (#470)"; spec summary | Agrees |
| 470-4 | The approved prototype is composition evidence only; its code and data must not be copied | Constitution VI; 009's sources; the background file | Agrees |
| 470-5 | What the hand-off records (source SHA, path, content hash, licence, state coverage, accessibility and visual evidence) | The background file | Agrees (no bearing on this mission's elements) |
| 470-6 | Neutral selected navigation and the file and presence tree stay Desktop compositions | The background file | No bearing |
| 470-7 | Exclusions: Tauri behaviour, Desktop screens, routes or typed data, an npm runtime dependency, a file-tree component, promotion to `main` | The library's hand-off scope, not how kitty-mission-ui consumes this library; IQ-28 (a) | No bearing |
| 470-8 | Acceptance: lint, test, build, Storybook, axe, visual, export, and a drift check on the consumer contract | #7's checklist and this mission's gates cover the analogous checks for its own elements | No bearing |
| 470-9 | Comment of 2026-09-28: the Stage B hand-off artifact was delivered by PR #489, merged into `develop` at `a6518cd` | The background file said Stage B was still to come; `a6518cd` is the commit the re-inventory read | **Adds**: **applied** (dated note in the background file: the frozen artifact read there is the delivered one) |
| 470-10 | The comment: artifact delivery, not acceptance; native closeout held; consumer compatibility (K1/K2) a separate decision; the issue stays open | The background file ("no compatibility acceptance is claimed"); IQ-28 (a), kitty-mission-ui replaces the families | Agrees |
| 470-11 | The timeline's required states (compact, narrow) | Not in the body: they are the contract's (background file); IQ-26 = IQ-8 (a) and IQ-9 (a) | Agrees (no bearing beyond the contract already recorded) |
| 470-12 | The event's time position, marked-up times, an empty slotted time, actor, summary, verification label, marker, linked event, degraded and unavailable forms | Q-C (a), Q-E ("Yes: named time slot"), Q-G (a), IQ-10 to IQ-17 (a) | Agrees: #470's body states nothing on any of them. The "(#470)" labels on Q-C and Q-E name the issue the question was asked for, not a requirement it states; no change |
| 470-13 | Target branch `train/elements-first`, accepted input ref `173774a` | The clone read `main` 19fb6a2 and `develop` a6518cd (IQ-1 (a)) | No bearing (the library's train, not a variant source) |

## Other answers in force

| Answer | Verdict |
|---|---|
| Spec gate (approve); plan gate decision 1 (R-03, the track's inline size) | No text bears on them |
| Recheck Q2 to Q6 (per-instance sheet, history folds, citations, pre-upgrade rule placement, the end-fade line) | No text bears on them |
| Phase 1 IQ-1 to IQ-7, Q-I1 to Q-I7, spike, spike 2, stop, round 1 and mutation decisions | No text bears on them beyond 533-4 to 533-10 above (IQ-7, recheck Q1, spike Q2) |
| Phase 2 IQ-8 to IQ-17, IQ-26, IQ-28 | Agree (470-10 to 470-12) |
| Mission 013's conventions (manual slot assignment, `wrap="anywhere"`, undefined defaults, no `class=` API, no monospace) | Agree, except the mono face of 533-1 and 533-8 (Q-T1) |

## Questions for the operator

Nothing below is applied. Q-T1 to Q-T3 touch phase 1, which is approved and folded; Q-T4 and Q-T5 are phase 3's and
can be asked with IQ-18 to IQ-24 and IQ-27.

**Q-T1. #533 sets table cells and headers in a mono face.** Constitution II says no monospace anywhere, and 013's
conventions, FR-005 and phase 1's built rules use Schibsted Grotesk with `--ocelle-figures`.

- (a) No change. The cells and headers stay in the sans face with tabular figures; the README's mapping row maps the
  prototype's mono cells and headers to them.
- (b) Allow a mono face for table cells. This needs a constitution amendment through its own process, outside this
  mission, and reverses 013's convention and phase 1's rules.

**Recommendation: (a).** The constitution's rule is not negotiable in a mission, and tabular figures already line up
the machine values #533 is about.

**Q-T2. #533's header tracking is 0.06em; 011's eyebrow tracking, used by recheck Q1 (a), is 0.08em.** #533 asks
for the eyebrow style with a tracking token, and notes the prototype uses 0.06em in headers and 0.08em elsewhere.

- (a) No change. Recheck Q1 (a) stands: the headers use `--ocelle-tracking-eyebrow` (0.08em). The README's header
  mapping row notes the prototype's 0.06em.
- (b) Add a table-header tracking token at 0.06em. This reopens recheck Q1 (a), FR-006 and FR-040 ("adds no eyebrow
  token"), and changes phase 1's rules, tests and 38 baselines, after the fold.
- (c) A later issue for 011's owner: whether the eyebrow tracking should differ for table headers. This mission keeps
  (a) meanwhile.

**Recommendation: (a).** #533's own ask, "reuse the eyebrow style with a tracking token", is what recheck Q1 does.
The difference is 0.24 px a letter at 12 px, and one eyebrow across headers and tables is 011's design.

**Q-T3. #533's designed headers have `--sk-space-3` padding; R-06 gives headers the body cells' padding (4 px block,
8 px inline).** The spec-kitty space scale is not recorded here, so the figure is unconfirmed. If it is 12 px, as
Ocelle's `space-3`, the prototype's headers are padded more than this mission's.

- (a) No change. Headers keep the cells' padding, so each header's text starts on its column's text line. The
  README's header mapping row notes the difference.
- (b) Header cells take `--ocelle-space-3` inline padding (and the block padding the planner names). R-06,
  `contracts/styles-data-table.md`, phase 1's styles tests and its baselines change, after the fold.
- (c) The operator first confirms the figure of the spec-kitty step from kitty-mission-ui, and the question comes
  back only if it differs from the cells' padding.

**Recommendation: (a).** A header padded unlike its column's cells puts the header text off the cell text's line,
and #533's ask is about face, size, colour and tracking, not padding.

**Q-T4. #517 asks for a pill-shaped chip; FR-035 and constitution II require `--ocelle-radius-2`.** Constitution II
keeps the pill radius for state pills only, and US3-4 asserts the chip is not pill-rounded. Q-A (a), no fill, is not
affected: #517 says nothing about a fill.

- (a) No change. The chip keeps `--ocelle-radius-2`; the README's chain mapping row maps the pill-shaped chip to it.
- (b) A pill-rounded chip. This needs a constitution amendment through its own process, outside this mission, and
  changes FR-035, US3-4 and the phase 3 plan.

**Recommendation: (a).** The one-radius rule is the constitution's, and a pill-rounded chip would read as one of the
state pills the rule keeps that radius for.

**Q-T5. #517 names a column of about 200 px.** FR-034 already requires the chain to wrap within its container at any
width; the scenarios measure 1280, 600 and 320 px (US3-3, FR-053).

- (a) No change. The 320 px reflow width (FR-053) stays the narrowest measured width.
- (b) US3-3 also runs in a 200 px container, as one more body in phase 3's red commit. No story or baseline is
  added, so the counts stay as they are.

**Recommendation: (b).** It is the consumer's named width, it costs one body, and it checks FR-034's rule, not
something new.

## Bearing on the open phase 3 questions (nothing decided)

To be quoted when IQ-18 to IQ-24 and IQ-27 are asked: 517-13 (IQ-18, supports (a)), 517-12 (IQ-19, against (b)),
517-1 (IQ-21, supports (a)), 517-10 (IQ-22, the consumer's stand-in draws arrows), 517-11 (IQ-27, a kitty-mission-ui
screen shows the chain, supports (a)). Nothing in the three texts bears on IQ-20, IQ-23 or IQ-24.

## Operator decisions (2026-11-20, multiple choice)

| Question | Decision |
|---|---|
| Q-T1, the mono face | (a) No change: cells and headers stay in the sans face with tabular figures, and the README's mapping row maps the prototype's mono cells and headers to them. |
| Q-T2, 0.06em header tracking | (a) No change: recheck Q1 (a) stands (`--ocelle-tracking-eyebrow`), and the README's header mapping row notes the prototype's 0.06em. |
| Q-T3, header padding | (a) No change: headers keep the cells' padding, and the README's header mapping row notes the difference. |
| Q-T4, the pill-shaped chip | (a) No change: the chip keeps `--ocelle-radius-2`, and the README's chain mapping row maps the pill-shaped chip to it. |
| Q-T5, a column of about 200 px | (b) US3-3 also runs in a 200 px container, as one more body in phase 3's red commit. No story or baseline is added. |
