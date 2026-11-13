# Analysis fixes 2: 011-layout-headers

Resolves `analysis-report.md` (head 064caa0; 0 critical, 0 high, 0 medium, 6 low). Operator instruction of 2026-11-13
(human:jeroennouwsdev): "fix the tasks and make sure everything is in place to start when #10 lands"; all six low
findings. Task IDs are stable; no task is added, removed or renumbered. No source or test file is changed here.

| ID | Resolution | Where |
|---|---|---|
| B1 | fixed: T042's manifest clause now reads "`label` not reflected; `orientation` reflected with type `"vertical" \| "horizontal" \| undefined`", as T034 does for the sidebar, matching FR-006, contracts/elements-package.md and data-model.md. | tasks.md T042 |
| E5 | fixed: T041 adds FR-006's empty-value case for the rail beside US4-8's invalid value: rails with `orientation=""` and `orientation="sideways"` laid out vertically as with no `orientation`, each keeping the value the page wrote, in the same test as an `orientation="horizontal"` twin laid out as US4-3's row. The empty-or-invalid pairing-plant row now names the rail's `orientation` (with `orientation=""` beside `"sideways"`) and its plant, the row layout keyed on `:host(:not([orientation="vertical"]))`. T041's upgrade case now names its plant row too. No spec scenario was added: the case tests FR-006 as written. | tasks.md T041; contracts/checks.md § Pairing plants (empty-or-invalid row) |
| F8 | fixed (drop `[P]` and say why): `[P]` is removed from T016a, T028a, T035a and T043a. Parallel Opportunities says they edit files their phase's other red tasks also edit (`exports.test.ts`, `entry-root.test.ts`, `readme.test.ts`, `manifest.test.ts`, `build.test.ts`, `pack.test.ts`; T014–T016, T027–T028, T034–T035, T042–T043) and are written together with those tasks in the same red commit. | tasks.md T016a, T028a, T035a, T043a, § Parallel Opportunities |
| F9 | fixed: Dependencies says phase 4 needs phase 1 and phase 2 (`ocelle-section-header` for US3-3's section variants), and the phase-2 line says phase 2 adds the section header phase 4 uses. This states what the spec already implies (the sidebar "uses section headers for its sections"); the run order (2, 3, 4, 5) is unchanged. plan.md states no phase-4 dependency to correct. | tasks.md § Dependencies |
| F10 | fixed: T028, T035 and T043 each assert in their red commit that the `@ocelle/elements` CHANGELOG names the element and its entry point as a MINOR addition, as T016 does, so the CHANGELOG entries their green tasks (T031, T039, T046) write have a failing test first (FR-036). | tasks.md T028, T035, T043 |
| F11 | fixed: the four pinned-list tasks cite "E1 of `reviews/analysis/fixes-1.md`" instead of "E1 of the analysis"; T016a's anchor commit reads "the first analysis's head (`5bb0e04`)". | tasks.md T016a, T028a, T035a, T043a |

Open questions for the operator: none. Every fix states or tests what the spec already requires; none needs a product
decision. Implementation still starts with T001, once #10 is on `main` and merged into the branch.
