# Operator decisions on the library inventory (reviews/phase-1/inventory-questions.md)

- **Date:** 2026-11-18
- **Decided by:** human:jeroennouwsdev
- **Source:** the operator pointed out that spec-kitty-design is open source; a read-only clone is used (MIT), role
  names only (constitution VI).

- **IQ-1:** (a) the library's variant set is the inventory (T005, T028, T054, SC-001): one README mapping row per
  modifier, state, structure role and part, no counts. For variants newer than the 1.0.0 clone, the operator chose
  "Fetch the rc.10 tag": no release tags exist on the remote, so the newest line, `develop` (a6518cd, 2026-09-28),
  is fetched and inventoried instead of `main` (19fb6a2).
- **IQ-2, sticky header row:** add it in this mission. "Mission changes module": this mission extends 009's
  overflow-region module with an opt-in block-axis option (contract and 009's tests updated; `ocelle-scroller` and the
  workflow board unchanged); FR-008 is amended to allow exactly that change.
- **IQ-3, numeric end-aligned cell:** add it in this mission (a documented base-style cell hook).
- **IQ-4, zebra rows:** add it in this mission.
- **IQ-5, row hover:** add it in this mission.
- **IQ-6:** (a) FR-010's caption fallback stands; the README tells consumers to give an overflowing table a `label`
  that differs from its caption.
- **IQ-7:** (a) the spec's eyebrow headers stand; the README maps the library's header look to them.
- **IQ-25, the unread design issues #470, #517, #533:** "I'll paste them": the operator supplies their texts (before
  phase 2's red); the planner records them verbatim in `sources/`. The `develop` line holds #470 hand-off material
  (docs/architecture/validation/issue-470-desktop-v2-handoff-stage-a/, kitty-specs/desktop-v2-immutable-handoff-*),
  which the planner records as background.
- **IQ-8 to IQ-24 (timeline and chain):** asked before phases 2 and 3.

## Follow-up questions (reviews/phase-1/inventory-fixes.md), 2026-11-18, human:jeroennouwsdev

- **Q-I1, the pinned header row's background:** `--ocelle-color-sheet` (the default).
- **Q-I2, hover on a striped even row in light theme (inset = hover-bg):** accept it; the README notes it.
- **Q-I3, row hover:** always on (the default).
- **Q-I4, block-axis end fade:** add a fade at the block end while content is below (changes the default).
- **Q-I5, pointer in 009's contract:** add a one-line note in `specs/009-workflow-layouts/contracts/overflow-region.md`
  pointing to this mission's amendment (changes the default).
