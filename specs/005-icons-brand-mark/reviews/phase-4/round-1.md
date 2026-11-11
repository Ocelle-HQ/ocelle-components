---
phase: 4
round: 1
verdict: changes_requested
base: aea13f48a7840be93e737c493f2ea8763cf1dd69
head: ef70d674bdcfbaea3285ede1aeb98fdc76a9c9eb
tdd_check: pass
---

# Phase 4 review, round 1

User Story 3, the slot convention for icons in controls (T041 to T049). The convention itself, the test host, the
`1lh` lint allowance and the README are as the plan describes, and every acceptance scenario has a test that went red
for the right reason. One blocking finding: the new in-process slot suite leaves the browser page in a dark colour
scheme. That makes the in-process `elements` suite depend on file order, and in this container it makes
`gate:mutation -- --base <phase base>` fail.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | `packages/elements/test/slot.test.ts:15-17`; `packages/elements/test/scenarios/slot.ts:143,155,266`; `packages/elements/test/commands.ts:137-139` | US3-8 runs forced colours with the `dark` palette, and `emulate(page, mode, palette)` sets `colorScheme: "dark"`. The reset (`forcedColors("none")` in `forced()` and the file's `afterEach`) calls `page.emulateMedia({ forcedColors: "none" })` with no `colorScheme`, so the page stays dark. In-process test files share one page, so any later file sees `prefers-color-scheme: dark` and the tokens resolve to their dark values. **Reproduced:** `npx vitest run --config vitest.mutation.elements.config.ts --no-file-parallelism --sequence.shuffle.files --sequence.seed=3 packages/elements/test/slot.test.ts packages/elements/test/icon.test.ts` runs `slot.test.ts` first. Then `icon.test.ts` US1-4 fails with stroke `rgb(237, 233, 225)` (dark ink) where `rgb(21, 19, 15)` was expected. Seeds 1, 2, 4 and 5 put the files in the other order and pass. The same shuffle over `icon-set`, `icon` and `commands` without `slot.test.ts` passes for seeds 1 to 6. **Effect on the gate:** `pnpm run gate:mutation -- --base aea13f4` exited 2 in 4 of 5 runs here: "Stryker wrote no report (There were failed tests in the initial test run.)". The captured Stryker output names the failing test as `ocelle-icon, in process (US1) > US1-4: every stroke takes the inherited…`. The one passing run ordered the files the other way. **Notes misread it:** notes.md:42 ("US3-4's colours") explains the dark ink token in process as a difference between the harnesses. It is this leak. | Make every test leave the page in its default colour scheme. For example, `emulate(page, "none")` also resets `colorScheme` (to `"light"`, as the fixture contexts in `browser/serve.ts:127` start), or the `afterEach` hooks reset it. This is test-harness behaviour, so do it test first: for example, a test in `commands.test.ts` that emulates `active`/`dark`, then `none`, and asserts `matchMedia("(prefers-color-scheme: dark)").matches === false`. It must fail now. Then rerun `gate:mutation -- --base aea13f4` and record it. Optional: correct notes.md:42 and consider whether US3-4 can use the ink tokens again. |
| R1-02 | note | `gates/plants/style-lint/{pass-one-line,pass-one-line-calc,fail-lh-*}` (commit `631f40d`) | T041 and plan § `token-only` changes ("each with unit tests … and plants …, red first") put the six `lh` plants in the red step, but they landed with the implementation. Nothing is lost: the red commit's unit tests in `gates/test/token-only.test.ts` hold the same six values and failed at red, and `gate:plants` judges every plant as expected at HEAD. | None required. In later phases, commit plants with the red tests. |
| R1-03 | note | `packages/elements/src/icon-slot.ts:42` | `color: inherit` on `::slotted(*)` is normal importance. A page rule on the slotted element beats it, and without one a slotted `svg` or `ocelle-icon` inherits the control's colour anyway. No test fails when it is removed, and Stryker cannot mutate a declaration inside a `css` template. It has no observable effect for the slotted kinds the spec names. | None required. Drop it, or keep it as documentation of intent. |
| R1-04 | note | `packages/elements/README.md` (Lint bullet); `gates/stylelint/token-only.ts:89-111` | The lint passes a factor on a parenthesised `calc()` group that holds `1lh`, such as `calc((var(--ocelle-space-1) + 1lh) * 2)`. That is inherent in the plan: the row padding itself, `calc((var(--ocelle-icon-size) - 1lh) / 2)`, divides such a group. The README states the limit and says such values are checked in review. | None. Reviewers of later elements check `lh` factors by hand. |
| R1-05 | note | `vitest.config.ts:9,14` (commit `400b527`) | The `axTree` command's new `scope` argument is forwarded in the green commit. At red, the in-process US3-11 read only the DOM-based nodes. The test still failed on its gaps, the fixture harness (which calls `axSubtree` directly) failed it for the right reason, and `vitest.config.ts` is not in `test_pathspec`, so it could not go in the red commit. | None. |

## Test quality

- **Red evidence.** `red-phase.log`: 126 of 2429 tests failed, every one an `AssertionError`: token-only 36, README 14,
  slot in process 38, slot on the fixture 38. US3-6 passes at red in both harnesses (4 tests). Its outcome is
  `ocelle-icon`'s own decorative state from phase 2. The phase's contribution is that the convention adds nothing, and
  the planted defects in `plants.md` prove it: the strut without alt text, and an icon named from `name`. That is
  acceptable under the spec's paired "does not" rule.
- **Scaffold.** `7e9c661` adds only `export const iconSlotStyles = css\`\`` (and `base.sha`): no behaviour and no test
  file. `tdd-check.json` shows the final tests fail against it (exit 1, 129 failures, all assertions) and fail against
  base (exit 2, missing module).
- **No weakening.** `git diff aef9701..HEAD -- '*test*'` only adds three token-only cases after the first mutation run:
  a comment beside `1lh`, `calc((1lh) + 0)`, and `env(--ocelle-icon-size)`. These are stricter. No test was removed,
  skipped or loosened.
- **Assertions.** Every slot scenario compares a full observation object to hand-written expectations with
  `toEqual`, and the fixture suite also asserts zero CSP violations, requests, console messages and errors. There is
  no conditional assertion, `skip`/`only` or snapshot. The `?? noLine` fallbacks produce zero rects that fail the
  expectations rather than hiding a missing node.
- **Coverage of the story.** US3-1 and US3-10 are tested at all four type and size cases, single-line and wrapped,
  with centring to 0.5 px and containment to 1/64 px, plus RTL and a narrow host. The other tests are:
  - US3-2 and US3-3: placement through the screen CTM.
  - US3-4: two colours, `ocelle-icon` and bare `svg`, sizes asserted.
  - US3-5 and US3-10: empty slot beside a filled one.
  - US3-6 and US3-11: AX subtree.
  - US3-8: light and dark palettes, enabled and disabled.
  - US3-9: host rule, token on the host, and token on the slotted element.

  Each runs without and with `base.css`, in process and on the strict-CSP fixture. US3-7 (README) is in
  `readme.test.ts` (14 statements, red). Every "does not" outcome in the spec table is paired in the same test, and
  `plants.md` records each plant biting in both harnesses.
- **Mutation.** `gate:mutation -- --base aea13f4` through the gate's own `mutation()` with the real tool calls, with
  file order not tripping R1-01: 150 mutants on the changed lines of 2 files, none survived, 0 equivalent records. By
  group:
  - `token-only.ts`: 94 killed, 55 CompileError.
  - `icon-slot.ts`: 1 killed.

  The gate as normally invoked failed 4 of 5 times on R1-01 (above).

## Checks run

Node 22, `OCELLE_CHROMIUM_PATH` set; `PLAYWRIGHT_BROWSERS_PATH` aliased for Stryker; one heavy job at a time.

| Check | Result |
|---|---|
| `gate:typecheck` | exit 0 |
| `gate:lint` | exit 0, 214 files |
| `gate:test-lint` | exit 0, 145 files |
| `gate:style-lint` | exit 0, 10 files |
| `gate:prefix` | exit 0, 191 files |
| `gate:pins`, `gate:config-copies`, `gate:manifest`, `gate:contrast`, `gate:brand-rules` | exit 0 |
| `gate:signoff -- --range aea13f4..HEAD` | exit 0, 12 commits |
| `pnpm -r build`, then `gate:csp` | exit 0, 31 files |
| `pnpm test` | exit 0, 2432 tests in 115 files (this file order) |
| `gate:mutation -- --base aea13f4` | **exit 2 in 4 of 5 runs** (R1-01); exit 0 once, 150 mutants, none survived |
| order check (R1-01) | `slot.test.ts` before `icon.test.ts` fails US1-4; without `slot.test.ts`, 6 of 6 seeds pass |

`gate:plants` was not rerun. The implementer's run (`plants.md`, exit 0, 214 plants including the six `lh` plants)
stands, and the plants were not changed after it.

## Earlier findings

None: this is the first round of phase 4. The two phase 3 notes carried over (R1-01 `byCodePoint`, R1-02 the `Set`
story export) are explained in notes.md. Neither is touched by this phase, and neither was blocking.
