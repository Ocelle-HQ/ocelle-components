# Quickstart: Data Records

A run guide that proves the feature end to end once phases 1 to 3 are in. Contracts: [contracts/](contracts/);
checks: [contracts/checks.md](contracts/checks.md).

## Prerequisites

- 009, 013 and op 016 are on `main` and merged into this branch (8ee3351), and every difference of
  `reviews/recheck.md` (T001) is answered in `reviews/recheck-decisions.md` and applied (`reviews/recheck-fixes.md`).
- `reviews/recheck.md` records whether 009's pinned-start option (research R-17) is on `main`. If it is, the caption
  is sticky through it at inset 0; if not, it scrolls with the table (Q-F, decided (b)).
- The phase 1 spike's decisions (`reviews/phase-1/operator-spike-decisions.md`) are applied
  (`reviews/phase-1/spike-fixes.md`), and so are the library inventory decisions
  (`reviews/phase-1/inventory-decisions.md`, `reviews/phase-1/inventory-fixes.md`): research R-16 holds the inventory
  (the library's variant set at `main` and `develop`), mapped in the README one row per modifier, state, structure
  role and part, with no row reading "pending inventory" (SC-001; T005, T076).
- The phase 1 second spike's decisions (`reviews/phase-1/operator-spike-2-decisions.md`, Q-1 to Q-4) are applied
  (`reviews/phase-1/spike-2-fixes.md`), and the implementer's measurement of Q-3 (c) before the red commit is recorded
  in `reviews/phase-1/spike-2.md` (§ Addendum, T082), its two contradictions answered (Q-A1 (a), no
  `scrollbar-gutter`; Q-A2 (a), the caption link checked at a partly scrolled position) and applied, and so is Q-A3
  (a), the classic-scrollbar half that guards the scrollbar-room subtraction, the RTL lift and the mask figure.
- Each phase's `reviews/phase-<N>/element-plants.md` records every element plant biting (contracts/checks.md).
- `pnpm install --offline` works (`pnpm run setup:online` after a container restart).
- For baselines: docker running (`nohup dockerd > /tmp/dockerd.log 2>&1 &`, as root), and #10's pinned container
  (`storybook/visual/container.json`).

## Validate

1. **Unit and browser tests.** Run `pnpm run gate:unit-tests`. It passes, and the data-table, timeline and chain
   bodies run in both harnesses. 009's tests of the overflow-region module, `ocelle-scroller` and
   `ocelle-workflow-board` pass with no change to their files, beside the block-axis option's own bodies (SC-007).
   The classic-scrollbar suite runs too: `pnpm exec vitest run --project elements-browser
   packages/elements/test/browser/data-table-scrollbar.test.ts` passes, its bodies asserting a block-axis scrollbar
   room above 0 (Chromium launched without `--hide-scrollbars`, as 009's `test/browser/scrollbar.test.ts`), the
   sticky caption inside the unmasked width with that room subtracted, the RTL table at its start after the bound is
   lifted and set, and the block-scrollbar mask layer as wide as the room (Q-A3 (a)).
2. **Static gates.** Run `pnpm run gate:typecheck`, `gate:lint`, `gate:style-lint`, `gate:test-lint`, `gate:csp`,
   `gate:prefix`, `gate:manifest`, `gate:contrast` and `gate:brand-rules`. All pass. The manifest lists the five
   elements with empty event lists.
3. **Storybook.** Run `pnpm run gate:storybook-build`, `gate:visual` and `gate:axe`. All pass. `visual` reports no
   change to 013's, 009's or any earlier baseline (SC-007).
4. **Plants.** Run `pnpm run gate:plants -- --affected $(cat specs/019-data-records/reviews/phase-1/base.sha)`, the
   mission's base (phase 4 changes no source, so its own base would select nothing), one heavy job at a time. It
   exits 0. The run itself goes in `reviews/phase-4/plants.md` in op 016's form (base, command, exit, verbatim output;
   tasks.md § Plants); "No plant selected" is recorded as printed. The reviewer reruns the command with `--list` and
   compares its `note: affected:` lines with the record. In phases 1 to 3 the same step runs with the phase's own
   base (T023, T049, T072).
5. **By hand, in Storybook** (`pnpm --filter storybook run dev`, or the built `storybook-static`):
   - **Data table, headers.** The column headers are small, tracked, uppercase eyebrows in 011's eyebrow tokens, as
     in the page and section headers (recheck Q1 (a)). The screen reader reads them in upper case, as drawn, which
     both READMEs state (spike Q2 (a)).
   - **Data table, overflows.** At 320 px, Tab reaches the region, a screen reader announces the "Work packages"
     group, and the arrows scroll it. At rest the caption wraps inside the box and starts at the table's edge. At
     1280 px Tab skips it.
   - **Data table, host `aria-label`.** In the two host `aria-label` stories the region is announced as the
     "Deployments" group (non-blank) and as the "Work packages" group (blank, named by `label`) (spike Q1 (b)).
   - **Data table, hook.** In the dev tools the region's track carries `--data-table-box-size`, and
     `--data-table-end-fade` while the end fade shows, both in px measured from layout (the end fade is the end
     edge's width, recheck Q2 (c)) (the base-style hook between the two packages, analysis I7 (a));
     both READMEs and CHANGELOGs name them.
   - **Data table, sticky header.** In the bounded sticky story the region is a tab stop although nothing overflows
     sideways; ArrowDown and ArrowUp scroll the rows under the pinned header, whose ground hides them and above which no
     row shows once scrolled (spike-2 Q-2 (a)), and PageDown,
     PageUp, End, Home, Space and Shift+Space scroll it as the browser does, the header staying pinned and the fade
     following (re-analysis G1 (a)). Tabbing to a
     link in a row under the header scrolls the row clear of it. The caption scrolls away (IQ-2). At rest the last
     visible rows fade out at the region's block end, below the header and clear of the scrollbar; at the end of the
     rows the fade is gone; a link tabbed to in the faded rows is scrolled clear of the fade; with forced colours
     emulated a line marks the block end instead (Q-I4). No empty band is reserved beside the rows for a scrollbar
     that is not drawn (spike-2 Q-A1 (a)); in a 320 px viewport the sticky table scrolls sideways to its last column,
     and under `dir="rtl"` to its first. In the unbounded sticky story the table shows at its full
     height, nothing scrolls in the block axis, no fade shows, no empty scrollbar gutter is reserved, and Tab skips the
     region (US1-20, re-analysis C1 (b), spike-2 Q-3 (c)).
     In the room-rule sticky story rows are below the few visible ones and the region is a tab stop, but no fade
     shows: less than twice the fade depth is left under the header (US1-26, fixes-2 Q-1 (b)).
   - **Data table, numeric column, stripes, hover.** The estimate column's figures line up at the cell's end, the
     header too (IQ-3). The striped story shows a ground on every second body row of each group (IQ-4). The hovered
     stories show the row's hover ground; in the light theme a hovered striped row looks unchanged, as the README
     notes (the operator's decision Q-I2). With forced colours emulated, a band at each row's start marks the stripes and the hovered row (IQ-5).
     With a touch device emulated in the dev tools (`hover: none`), tapping a row shows no hover ground (re-analysis
     A2 (a)).
   - **Data table, mapping.** The `@ocelle/elements` README's mapping has a row per role of the library's data table
     (R-16), the header look mapped to the eyebrow headers (IQ-7) and the advice to give an overflowing table a `label`
     that differs from its caption (IQ-6).
   - **Timeline.** The screen reader reads a list of three items, "14:02 Mission created" first, with no dot or line
     announced. In the marked-up times story each `<time slot="time">` shows above its event's text in the time's
     type and is read first, and the event that also has a `time` attribute shows only its slotted time.
   - **Chain, wrapped.** The steps wrap at 320 px with no connector at a line's end, and the ordinals read 1 to 6 on
     the visible default steps.
   - **Standalone items.** The standalone-event and standalone-step stories show their items as plain text with no
     marker, connector or ordinal, and the screen reader reads no list.
6. **Mutation.** Run `pnpm run gate:mutation -- --base $(cat specs/019-data-records/reviews/phase-1/base.sha)`, the
   mission's changed source (in phases 1 to 3, `--base` the phase's own base: T025, T051, T074). No mutant survives
   unless the review records it as equivalent.
