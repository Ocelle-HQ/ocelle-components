---
phase: 6
round: 1
verdict: approved
base: ed5d422c6db6312f69f2c82974c89c51bf34b514
head: ae86d3b08df4f178d79e30a504b131a0f37f63ef
tdd_check: pass
---

# Phase 6 review, round 1

Scope: `git diff ed5d422..ae86d3b`. Red commit 04ab5c4 adds only `packages/tokens/test/sk-mapping.test.ts`. Green
commit ae86d3b adds `specs/002-design-tokens/sk-mapping.md`, ticks T064 to T067 and commits `base.sha`,
`red-commits` and `red-phase.log`. No package source, gate or build file changed. kitty-mission-ui was read at
c994c8ea07643050a5b2d159ae6ff16da709a7da (clean checkout, no changes made). That is the commit the table records at
`sk-mapping.md:3`.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | specs/002-design-tokens/sk-mapping.md:26 | The note on `border-width-2` says it is "used for focus outlines; other borders use `--ocelle-border-width`". kitty-mission-ui also uses it as an inline-start bar on a list row (`packages/mission-ui/src/elements/sk-drift-screen/list-parts.ts:114`). In the table's own terms, that use maps to `--ocelle-bar-width`. It also appears in a `min-height` calc. Column 2 (`--ocelle-focus-width`) is right for most uses. The note is incomplete. | Optional: say that an inline-start bar uses `--ocelle-bar-width`. |
| R1-02 | note | specs/002-design-tokens/sk-mapping.md:27 | The note on `border-width-4` says "the inline-start bar of a current or selected item". Its only use is the inline-start rule of a prose block quote, drawn in the default border colour (`.../sk-artifact-screen/prose-styles.ts:96`). `--ocelle-bar-width` is a reasonable replacement, but the note describes a different use. | Optional: describe it as the quote bar. |
| R1-03 | note | specs/002-design-tokens/sk-mapping.md:37 | `mission-shell-content-padding` is declared by kitty-mission-ui itself, not by the design library (`sk-mission-shell.ts:349,353`). Its default is the space-6 step, and space-4 at the mobile tier. `--ocelle-gutter` is `var(--ocelle-space-4)` (`packages/tokens/src/source.ts:145`), so a plain swap to the gutter narrows the desktop padding. The note already names `space-4`/`space-6`, so a consumer is not misled. The row is right to be in the table, because it is an `--sk-*` name that kitty-mission-ui uses and the count of 55 depends on it. The note names only token steps, not values (VI holds). | None required. Leading with "space-6 (space-4 on narrow viewports), or the gutter" would match the current layout more closely. |
| R1-04 | note | specs/002-design-tokens/sk-mapping.md:50 | The `space-12` replacement `calc(2 * var(--ocelle-space-10))` has no basis in the table, because the table rightly reads no `--sk-*` values. Both uses are maximum widths of grid columns (`.../sk-ops-screen/ops-page-parts.ts:67`, `ops-state-parts.ts:42`), so the `--ocelle-measure-sheet` alternative is the better-grounded one. | Optional: lead with `--ocelle-measure-sheet` for column widths. |
| R1-05 | note | specs/002-design-tokens/sk-mapping.md:48-58 | `space-1..10` map to the same-numbered steps. This repository's scale is linear only up to step 6 (step 7 is 2rem, 8 is 2.5rem, 9 is 3rem, 10 is 4rem; `source.ts:141-144`). Without the library values, which VI forbids reading, the index mapping is the only role-level choice. Steps 8 and 9 are as defensible as the others. The header (`sk-mapping.md:7-8`) states "by role, not by value", which covers this. | None required. A consumer should expect visual differences in the upper steps. |
| R1-06 | note | specs/002-design-tokens/sk-mapping.md:65-66 | `text-2xl` says "merged with `--sk-text-3xl`", while `text-3xl` is `dropped` with replacement `--ocelle-font-size-2xl`. The two rows agree, but the same relation is called "merged" on one row and "dropped" on the other. | None required. |

No blocking findings.

### Points the caller asked to judge

- **Role count.** Verified independently at c994c8e:
  - The distinct `--sk-[a-z0-9-]*[a-z0-9]` names in the 192 tracked files under `packages/*/src/`, without tests and stories, number **55**. The list is identical (`diff`) to column 1 of the table.
  - The whole `packages/` tree gives the same 55, including tests, stories, `README.md` and `custom-elements.json`. So excluding tests and stories changes nothing, and the count does not depend on that choice.
  - `apps/`, `gates/`, `contracts/` and `crates/` add no name.
  - The whole repository gives **76**. The extra 21 are 7 fragments of names in prose or patterns (`--sk-`, `--sk-space-`, `--sk-border-width-`, `--sk-breakpoint-`, `--sk-layout-context-`, `--sk-leading-`, `--sk-x`) and 14 names. The 14 names occur only in `kitty-specs/` planning documents, `.kittify/` and `README.md` prose, and the test data of `scripts/stylelint-exceptions.test.mjs`. None of them is used by the shipped elements.
  - So 55 is the right reading of "the roles kitty-mission-ui uses" (FR-024), and the stop-and-ask condition was correctly not triggered.
- **mission-shell-content-padding → gutter:** acceptable. See R1-03.
- **Flagged mappings:**
  - `surface-hero` → `color-panel`: the role is the background of the shell header band, the overlays and the pipeline band, and `color-panel` is the panel ground. Sound.
  - `layout-personal-rail-width` → `shell-rail-width`: used as the first shell grid column. Sound.
  - `border-width-2` → `focus-width`: mostly `outline-width`. Sound, see R1-01.
  - `border-width-4` → `bar-width`: sound, see R1-02.
  - `on-status-recovery` → `color-info`: used as a row border colour for recovery, and the tokens have no recovery state. Sound, and the note says so.
  - `space-8`/`space-9`: see R1-05.
- **Dropped roles:**
  - `font-mono` matches the brand rule of no monospace, and the replacement is sans with `--ocelle-figures`. Its uses (prose code, refusal details, source view) are covered by the note.
  - `space-12`: see R1-04.
  - `text-3xl` goes to `font-size-2xl`, plus the display weight and tracking for its one title use (`prose-styles.ts:45`).
  - Each dropped row names a token in column 3, and the test enforces this.
- **Merged pairs:** the six pairs are symmetric, and each side names the other:
  - fg-body/fg-default
  - fg-muted/fg-subtle
  - on-status-info/on-status-recovery
  - radius-lg/radius-md
  - surface-card/surface-input
  - weight-bold/weight-semibold
- **Suffix lookup in the test.** `sk-mapping.test.ts:15` finds the table by the `-mapping.md` suffix, and `:43` requires exactly one match. A second or missing table fails the test, so the indirection keeps the `sk-` literal out of the test without loosening it. The prefix gate passes. The role-column check (`:54-60`) requires one shared prefix other than `ocelle`, not `sk` by name. This is the weakest assertion, but it is what R-13 allows.
- **Constitution VI.** The table holds role names, `--ocelle-*` token names and prose of its own. It has no value, code or asset from kitty-mission-ui. The notes refer to kitty-mission-ui's use of a role (for example, which space step a self-declared property takes) without reproducing code or values. Holds.
- **Constitution I.** The table is under `specs/`, outside the scanned packages, and is not imported or built. `gate:prefix` passes.

## Test quality

- **Red evidence.** `red-phase.log` shows all 7 tests failing on the missing table: no file, no commit header, 0 rows, and so on. None fails on a setup error. `tdd-check.json` reports `pass`, with red exit 1, the final tests on base exit 1 and head exit 0. There is no scaffold.
- **No weakening.** `git diff 04ab5c4..HEAD -- packages/tokens/test/sk-mapping.test.ts` is empty.
- **Assertions.** Every test asserts behaviour that can fail, with no conditionals, skip or only, snapshots or mocks:
  - row count and four cells per row;
  - 55 distinct roles;
  - column 2 is a token, checked against `tokenNames`, `cssName` and the JSON export, or `dropped`;
  - each dropped row names a token in column 3;
  - every `--ocelle-*` mention is a token, with a lower bound of 55 so the check cannot pass on an empty table.

  `text` falls back to `""` when no table exists, and the result is a failing assertion, not a swallowed error.
- **Acceptance scenarios.**
  - Scenario 1 (55 rows, token or dropped with replacement) is covered by `:50-73`.
  - Scenario 2 (each token is in the JSON export) is covered by `isToken`, `:30-33`.
  - Scenario 3 (the prefix gate passes) is covered by `gate:prefix` and the plant suite.
- **Mutation.** `pnpm run gate:mutation -- --base ed5d422` reported "nothing to mutate: no package or gate source line changed since ed5d422". That is expected, because the phase adds only a test and documentation.

## Checks run

All checks below were run at HEAD ae86d3b and all passed:

| Check | Result |
|-------|--------|
| `pnpm test` | 1794 tests in 88 files passed |
| `gate:typecheck` | pass |
| `gate:lint` | pass |
| `gate:test-lint` | pass |
| `gate:style-lint` | pass |
| `gate:prefix` | pass |
| `gate:csp` | pass |
| `gate:config-copies` | pass |
| `gate:pins` | pass |
| `gate:contrast` | pass |
| `gate:brand-rules` | pass |
| `gate:plants` | 176 plants, every one as expected |
| `gate:signoff -- --range ed5d422..HEAD` | 2 commits, no finding |
| `gate:mutation -- --base ed5d422` | nothing to mutate |

## Earlier findings

None. This is round 1.
