# #470 hand-off material on spec-kitty-design `develop` (background)

Recorded on 2026-11-18 from the read-only clone at `<home>/spec-kitty/spec-kitty-design`, line `develop`, commit
`a6518cd` (2026-09-28), on the operator's decision IQ-25 (`reviews/phase-1/inventory-decisions.md`). **Background
only**: this is the library's record of its own work on #470, not #470's issue body, which the operator supplies
(IQ-25, "I'll paste them") and which is recorded verbatim beside this file when it comes (recorded on 2026-11-20 as `sources/issue-470.md`). Constitution VI: statements
and role names in this file's own words; no code, markup, style rule, data or asset is copied. `sk-` names are the
library's roles, never names in this library.

## What was read

| Path on `develop` | What it is |
|---|---|
| `docs/architecture/validation/issue-470-desktop-v2-handoff-stage-a/` (`evidence.md`, `axe-story-results.json`, `visual-mapping-results.json`) | The gate evidence of #470's Stage A, second work package (dated 2026-09-28) |
| `kitty-specs/desktop-v2-immutable-handoff-develop-01M3JSCM/` (spec, plan, research, data model, tasks, analysis report, acceptance and issue matrices, meta, status, work-package reviews) | The library's mission for #470's Stage A, accepted on 2026-09-28 |
| `contracts/desktop-v2/source-contract.json`, `contracts/desktop-v2/wp01-evidence.md` | The Desktop V2 source contract and its first work package's evidence |
| `handoffs/desktop-v2/6f4cfdda…/` (`artifact/manifest.json`, the payload, `reports/`) | A frozen hand-off artifact of source commit `6f4cfdda` |

## Statements

- **#470's title**, as this repository already records it: "Desktop V2 application-primitives consumer contract and
  immutable train handoff".
- **The purpose.** The library gives the offline Kitty Desktop consumer a machine-checked contract for 22 existing
  primitive families, and tooling to export and verify an immutable snapshot of their source from `develop`. The
  contract describes each family's current source form, public entry, assets, licence, independently required states,
  and the story, visual test and baseline for each state.
- **The 22 families**: action row, app shell, button, card, context sidebar, data table, disclosure, empty state,
  event timeline, facts, form select, metric, nav pill, notice, page header, personal rail, pill tag, progress,
  segmented choice, status indicator, workflow board, workflow lane. **The evidence chain is not among them.**
- **Source forms.** The data table and the event timeline are declared styles-only (styles and static markup, no
  element export); the metric and the pill tag are element-backed.
- **Required states for this mission's families** (independent of the story inventory; a deleted story does not drop
  a state):
  - data table: default (dark), light mode, responsive narrow, hover (a body row hovered), focus (the scroller
    focused), sticky header; active and disabled not applicable;
  - event timeline: default (dark), light mode, responsive narrow, compact; hover, focus, active and disabled not
    applicable (the timeline is display-only and has no focusable family control);
  - metric: default (dark), light mode, responsive narrow, compact; hover, focus, active and disabled not applicable.
- **The approved prototype** is composition evidence only: neither its code nor its data is source material.
- **The consumer boundary.** Neutral selected navigation is a Desktop composition of existing tokens, and the artifact
  file and presence tree stays a Desktop domain adapter: no generic primitive carries Desktop application structure,
  Tauri behaviour, screens, routes or typed application data.
- **The hand-off.** Stage A (the contract, and a deterministic exporter and offline verifier) is done. #470 stays open
  until a later Stage B selects a stable `develop` source commit, repeats the gates there and commits the immutable
  artifact. The frozen artifact on `develop` is from source commit `6f4cfdda`; its consumer-compatibility report
  states that no compatibility acceptance is claimed yet.
  **Added on 2026-11-20 from #470's comment of 2026-09-28** (`sources/issue-470.md`): the Stage B hand-off artifact
  was delivered by PR #489, merged into `develop` at `a6518cd`, the commit read here, so the frozen artifact above is
  the delivered one. The comment calls this artifact delivery, not acceptance: native closeout is still held, the
  consumer compatibility (K1/K2) is a separate decision, and #470 stays open.
- **Rights.** The library's own files are MIT; one font's full token stylesheet cannot be redistributed while its
  terms are unresolved, so the hand-off ships a scoped token derivative. (No bearing here: this library vendors only
  Schibsted Grotesk, constitution IV.)
- **Gates of Stage A**: lint, tests, build, Storybook, axe (810 stories, no WCAG 2.1 AA violation), visual (all 110
  Desktop V2 required states) and export, all passing at the tested source commit.

## What bears on this mission

| Point | Bears on | Where it goes |
|---|---|---|
| The timeline's compact form is a required Desktop V2 state; the narrow form is the timeline's responsive state | the timeline's density and measure (IQ-8, IQ-9) | IQ-26, phase 2 |
| The evidence chain is not a Desktop V2 family; the metric and the pill tag are | the chain's consumer and its stage content (IQ-18, IQ-19, IQ-20; spec US3 and FR-035's #517 basis) | IQ-27, phase 3 |
| Kitty Desktop receives a frozen copy of the library's own styles-only data table and event timeline | the consumer need behind phases 2 and 3 (constitution VI; the spec's Consumers line) | IQ-28, phases 2 and 3 |
| The data table's required states (row hover, scroller focus, sticky header) and its token closure (muted and card surfaces, medium weight in the muted foreground for headers) | phase 1's data table | Nothing new: IQ-2 to IQ-7 are decided (`reviews/phase-1/inventory-decisions.md`); the header look is IQ-7 (a), mapped in the README |
| The event history's time position, actor, or marked-up times | Q-C, Q-E, IQ-11, IQ-12 | Nothing: the hand-off material states no requirement on them beyond the timeline exemplars of `sources/spec-kitty-design-inventory.md` § 2 |
| The headers (#533) | FR-006, IQ-7 | Nothing: the material does not cite #533 and states no header requirement |

Nothing in it is decided here; the questions are in `reviews/phase-1/inventory-questions.md`.
