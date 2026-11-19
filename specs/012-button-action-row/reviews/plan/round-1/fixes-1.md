# Squad round 1: fixes 1

Confirmed fixes and the operator's fork decisions (Decision column of refute.md, 2026-11-13, human:jeroennouwsdev)
applied to the spec and the design artifacts. Duplicates are covered by their primary finding.

| ID | Resolution | Where |
|----|------------|-------|
| PLAN-CORRECTNESS-1-001 | decided: (a) | spec header, FR-004, US2 Independent Test, US2-4, US2-5, US2-8, US2-9, US2-10 (new), US4-12; research R-03 (cost corrected, per-stack recipes); contracts/elements-package.md convention 4; data-model `moved`; plan decision 1 |
| PLAN-CORRECTNESS-1-002 | fixed | research R-05 (row names itself from its `[part=title]` wrapper), R-04; data-model `nameSource` and row name; spec FR-006, FR-034, US4-3; contracts convention 5, row default slot; checks.md control.test.ts (name exactly the title, plant) |
| PLAN-CORRECTNESS-1-003 | fixed | research R-09 (`justify-content: flex-start` under `flush`); spec FR-012, US1-12 (icon-only and one-character cases, both sizes, rtl) |
| PLAN-CORRECTNESS-1-004 | decided: (a) | research R-07 (`--ocelle-motion-turn`, `rotate`, rationale for `motion-spin` corrected), R-08 item 10; data-model tokens; contracts tokens; checks.md tokens tests, style-lint row; spec header, FR-017; plan decision 5, phase 4 |
| PLAN-CORRECTNESS-1-006 | decided: (a) | research R-15 (new); plan decision 17, file list (`scripts/manifest.ts`), phases 2 and 3; checks.md manifest tests and mutation scope; contracts moved attributes; spec header, FR-053 |
| PLAN-CORRECTNESS-1-007 | fixed | research R-07 (generator drives `0ms` from the motion durations; stricter replacement), R-14; plan file list, phase 4, Constitution Check VIII; checks.md tokens tests and mutation scope; data-model tokens |
| PLAN-CORRECTNESS-1-008 | fixed | spec FR-004 (empty or whitespace-only clears and falls back), FR-006 and US2-8 (005 references dropped); research R-03, R-05; data-model `moved`; contracts convention 4; checks.md README test (005's elements keep their rule) |
| PLAN-CORRECTNESS-1-009 | fixed | plan § Phases (phase 2 gives #14's copy control only; #12 needs phase 3) |
| PLAN-CORRECTNESS-1-010 | decided: (a) | research R-13 (012 waits for #10; `shardSize` 1, about 525 s per shard; CI cost); plan decision 15, phase 7, Complexity Tracking, Summary; checks.md § With #10; quickstart step 6; spec header, FR-050, Assumptions |
| PLAN-CORRECTNESS-1-011 | fixed | research R-10 (`overflow-wrap: anywhere` on title and description); spec edge case rewritten, FR-040, US4-13 (new); data-model row drawing |
| PLAN-CORRECTNESS-1-012 | fixed | research R-01 retitled, decision rewritten with `delegatesFocus: true` |
| PLAN-CORRECTNESS-1-013 | fixed | research R-07 (`.icon-slot[hidden] { display: none; }` in `controlStyles`), R-12; plan phase 2 |
| PLAN-A11Y-SECURITY-1-002 | fixed | research R-10 (size rules scoped to the icon and trailing slots in `src/icon-slot.ts`); plan file list, phase 2; checks.md `slot.test.ts` row, mutation scope; spec FR-038, US4-14 (new) |
| PLAN-A11Y-SECURITY-1-004 | decided: (a) | spec header, FR-009, US2-11 (new); research R-03; data-model button; contracts button table and example; plan decision 2 |
| PLAN-A11Y-SECURITY-1-005 | decided: (a) | research R-02 (state table), R-06 (context-menu exception dropped); data-model states; spec header, FR-003, FR-021, US3-8, US5-5; contracts convention 3; checks.md edge-case row; plan decision 9 |
| PLAN-A11Y-SECURITY-1-006 | decided: (a) | research R-12 (ring inside, `--ocelle-focus-offset-inset`), R-08 item 6; data-model tokens; contracts tokens; spec header, FR-041, FR-042, US4-9; plan decision 12, phase 5 |
| PLAN-A11Y-SECURITY-1-007 | fixed | research R-12 (bar as a positioned shadow element in the inline padding, `forced-color-adjust: none` with `Highlight`; flush hover as a dashed `Highlight` outline), R-10 (inline padding); data-model row drawing; spec US5-4 (no content moved, no `color-contrast` incomplete), FR-041 |
| PLAN-A11Y-SECURITY-1-008 | decided: (a) | research R-02 (parser, `try`, decision-table rows, `data:`/`vbscript:`); data-model `mode`; contracts convention 2; checks.md control.test.ts table and edge-case row; spec header, FR-002, edge case; plan decision 10 |
| PLAN-A11Y-SECURITY-1-009 | decided: (a) | research R-07 (one run of six turns, 4.8 s, ends on the still arc); spec header, FR-017, US3-9 (new); data-model button look; plan decision 11 |
| PLAN-A11Y-SECURITY-1-010 | fixed | research R-08 item 2 (`color-ink-soft` for description and tags, state grounds added, figures); data-model tokens; spec FR-042 |
| PLAN-A11Y-SECURITY-1-011 | fixed | research R-05 (label in name), R-13 (stories follow it); spec FR-008; contracts convention 5; checks.md README test |
| PLAN-FRESH-1-003 | fixed | research R-01, R-06 (`click()` forwards to the inner control; synthetic dispatch outside the guarantee); data-model; contracts convention 1 and method rows; spec FR-001, FR-009, FR-030, US1-2, US1-3, US3-1, US4-1, US5-6, edge case; checks.md edge-case row |
| PLAN-FRESH-1-007 | decided: (a) | research R-08 item 3 (`color-hover-border` now an alias of `color-ink`; new `color-accent-hover` and `color-active-bg` with proposed values; state table; the one documented flush exception); data-model tokens; contracts tokens; spec header, FR-019, US1-14 (new); plan decisions 5 and 6, phase 2 |
| PLAN-FRESH-1-008 | decided: (a) | research R-04 (WebKit 16.4 for element reflection per MDN browser-compat-data 8.1.9; floor WebKit 17.4 with custom states); contracts engine floor; spec header, FR-005, Assumptions; plan Technical Context, decision 3 |
| PLAN-FRESH-1-009 | decided: (a) | research R-03 (custom states `expanded`, `pressed`, `current`), R-15 (`cssStates`); data-model `states`; contracts convention 4 and button table; spec header, FR-004, FR-009, US2-12 (new); plan decision 2 |
| PLAN-TESTABILITY-1-001 | fixed | research R-11 (in-process navigation sink; link scenarios as in-process and fixture bodies), R-14; checks.md harness table and package tests; plan Testing |
| PLAN-TESTABILITY-1-002 | fixed | research R-06 (guard in every non-available state, disabled links included); data-model states; checks.md control.test.ts (plant "guard limited to unavailable") |
| PLAN-TESTABILITY-1-003 | decided: (a) | research R-08 item 4 (`ground` attribute); data-model both elements; contracts both tables; spec header, FR-009, FR-018, FR-030, FR-042, US1-5; plan decision 7 |
| PLAN-TESTABILITY-1-004 | fixed | checks.md § Edge cases and plan decisions (new table: phase, scenario file, observable; explicit `button-name`/`link-name`); spec edge case "Empty label"; plan phases |
| PLAN-TESTABILITY-1-005 | fixed | research R-11 (`hover`, `pointerDown`/`pointerUp`, `computed(..., inner)`, `tabOrder({ reverse })`); checks.md harness table and phase 1 unit tests; spec US1-3 (Shift+Tab) |
| PLAN-TESTABILITY-1-006 | fixed | research R-11 (records carry `at`, `target`, `isTrusted`, `serial`); checks.md recorder row and phase 1 test; spec US1-2, US4-1 (one dispatch, target the host at every listener) |
| PLAN-TESTABILITY-1-007 | fixed | research R-12 (forced-colours table per element and state; checks on link mode and disabled); spec US1-11; checks.md package tests |
| PLAN-TESTABILITY-1-008 | fixed | research R-11 (test-side `test/axe-rules.ts` with 006's selection, pinned by a phase 1 test, replaced in phase 7); checks.md harness and § With #10; plan file list, phase 7 |
