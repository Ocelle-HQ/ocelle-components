---
phase: 3
round: 1
verdict: approved
base: 4aaf9e46cf360b6ce563c5f2883d0d40bdd380b8
head: f2d2b80
tdd_check: pass
---

# Phase 3 review, round 1

User Story 2, the modal side drawer (T030 to T040). Change reviewed: `git diff 4aaf9e4..f2d2b80`, no uncommitted
change. `f2d2b80` adds only the red/green check evidence to `1d96624`, the head `tdd-check.json` names.

## Findings

No blocking finding.

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | `.github/workflows/ci.yml:89` | Open risk the operator left undecided (fixes-8.md, plan decision 25). The `mutation-shard` job has `timeout-minutes: 10`. `gate:mutation -- --base 4aaf9e4 --plan` gives 12 shards, and 6 of them hold elements source: `ocelle-drawer.ts` in five 30-line cuts, plus `overlay.ts`. Each of those shards repeats the whole elements dry run, whatever `--files` names. That dry run measured 5 m 31 s here and hit Stryker's old 5-minute default (`mutation.log` run 0). Add runner setup (install, Chromium) and the shard's own mutants, and an elements shard is likely to pass 10 minutes on a 4-vCPU `ubuntu-24.04` runner. Then the `mutation` job fails and the pull request cannot merge. This phase does not change CI, as the design states. | Operator: decide before the PR, either by raising the shard limit or by confirming with one CI run. Not a change for this phase. |
| R1-02 | note | `specs/008-overlays/tasks.md:329` (T040, last sentence); `reviews/phase-3/notes.md:141-146, 165-166` | T040 is ticked, but `gate:plants` was run only for the shards this change touches: 16 (`visual/fail-token-changed`, after the four new `differs` lines and again after the scroll-edge baselines), 19 and 27, all as expected. The full run is left to CI, and the notes say so. I did not run it either, per my instructions. | None for this phase. CI's plants job must be green before merge. |
| R1-03 | note | `storybook/baselines/tokens--shell.light.png`, `tokens--shell.dark.png` | Two existing baselines changed: the Tokens/Shell story now lists `--ocelle-drawer-inline` (T035). Constitution V: "Baselines change only in a pull request whose description says why." All baselines were made with docker only, with no cross-engine (podman) comparison, and CI's captures win. | The PR description names both files and the reason. |
| R1-04 | note | `packages/elements/test/scenarios/dialog.ts:2733` (`openInDrawer`) | The eight nested-in-drawer rows open the drawer and click `#oi` at its centre at once. They skip the bounded `settle` that the inherited drawer rows use before a pointer click. The notes measured exactly this hazard (`notes.md:44-49`: 16 inherited rows failed with a click computed during the slide). The rows pass: 5 of 5 isolated in-process runs, two full suites, and the fixture harness. But `oi` and the focus-return expectations (`focus: "oi"`) hang on the timing of the drawer's 200 ms entry. | Optional, test-only: call the drawer's `settle` (or an equivalent bounded wait for the drawer's entry) before `driver.click("oi")`. |
| R1-05 | note | `packages/elements/src/ocelle-drawer.ts:73-78` | The chrome ground sits behind `@media not (forced-colors: active)`, but no row asserts `ground="chrome"` under forced colours. The inherited forced-colours row (matrix § Drawer) uses the default ground. The matrix does not ask for the row, and Chromium forces the system colours anyway, so FR-021 holds. A row would document it for the chrome ground the personal drawer uses. | Optional: a forced-colours row with `ground="chrome"` in a later phase or follow-up. |

## Test quality

- **Red evidence.**
  - Red commit `eb71638` (`red-commits`), amended twice before green. Both amends, recorded in `notes.md:22-27`, made rows stricter. The first added drawer state and top-layer order to the two nested Tab rows, which passed vacuously at the first red. The second gave a finite fallback point so two fixture rows fail on their assertion rather than a CDP parameter error; their expected values did not change. Neither amend weakened a row.
  - The red commit changes only test, story-test and `specs/` files.
  - `red-phase.log`: 881 of 4759 failed. The failures are assertions, bounded polls that name the missing events or the missing close control, the missing token, the missing stories and the counts.
  - The scaffold `4b11736` holds signatures only: the class, the event prefix, the three `declare`d properties, no `define`, no export, no test file.
  - `tdd-check.json`: the final tests against the scaffold exit 1 by assertions (e.g. `themes.test.ts`, `values.test.ts` expecting the new token). Against the base they exit 2 ("no test file found"), the same mechanism as Phase 2, so the scaffold run is the behavioural proof. Head: exit 0.
- **Test-first fixes inside the phase.**
  - Edges: `e99f5bb`, then `7ad34c2`. `red-edges.log` has 2 red, on the two backdrop pixels next to the border box ("2 events not recorded").
  - Press record: `c35305c`, then `fae8680`. `red-press.log` has 2 red: the duplicate request after a script `click()`, and the primary press cleared by a non-primary one.
  - Dry-run limit: `426b6e3`, then `1868fb5`. `red-dry-run.log` has 1 red, on the missing `dryRunTimeoutMinutes`.
  - Each fails for the missing behaviour. None of these is a review-round fix, so `red-commits` needs no `fix-*` entry.
- **No weakening.** `git diff eb71638..HEAD` over the test pathspec contains only additions:
  - 9 edge rows and 5 press rows in `scenarios/drawer.ts`;
  - a `pointerdown` stand-in command in `scenarios/dialog.ts`;
  - `drawer.stories.ts` (the green of T038/T039);
  - in `gates/test/vitest-config.test.ts`, an added key and a stricter `not.toContain("dryRunTimeoutMinutes")` on `stryker.config.json`.
  
  No row, expectation or test was removed, skipped or loosened.
- **Refactor of `scenarios/dialog.ts` into `overlayScenarios(kind)`** (in the red commit). The dialog's 350 rows keep their names, bodies and expected values, and the 8 nested-in-drawer rows are added. `settle` exists only for the drawer. It is a bounded poll of 1 000 ms that fails with a message, and it skips closing overlays, so the "input during the exit" rows stay during the exit. The dialog has no `settle`, so its bodies are unchanged. The inherited set matches contracts/checks.md § Drawer, including C7 (synthetic `cancel`), the end sentinel, open at first render (a) and (b) in both harnesses (`drawer-upgrade.test.ts`, `overlays-upgrade.html`), and repeated Escape on a page of its own in both harnesses (`drawer-repeated-escape.test.ts`; a fresh page per fixture test). The dialog's geometry, styles, backdrop, motion, body and footer rows are excluded, as the matrix states, and the drawer's own rows replace them.
- **Assertions.**
  - Every runner asserts `toEqual` on the whole observed value, and the fixture runner also asserts that its CSP, request and console recorders are clean. No conditional assertion, `skip`, `only`, snapshot or mock assertion.
  - Tests are named by their full row names (Rules § Full test names), with no `$name`.
  - `gate:test-lint`: 196 files, no finding.
- **Coverage of the story.**
  - US2-1 to US2-7 each have rows: Placement (`side` × `dir`, unknown `side`); Backdrop (each side × veto, panel click, press/release across the edge, secondary button, during the exit, border-box edge pixels, press record); Size (uncapped 320 px, capped 288 px at 320 × 800); Ground (light, dark, unknown value); inherited US1 rows plus the Motion slide signed by side and `:dir(rtl)`, and reduced motion; heading-hidden (tree, size, close control by Tab and Enter, host `aria-label`); One-line body and Long body (including 320 × 256).
  - C4: "Backdrop click over an open drawer" is covered by 2 points × {drawer veto, none}. Each row asserts no event from either overlay, both overlays open and `:modal`, the top-layer order, focus on `inner[dialog]`, then Escape closing the dialog alone.
  - U4: corners are asserted physically for the four `side` × `dir` cases.
  - Keyboard paths: Tab and Shift+Tab cycle, Escape, Enter on the close control, ArrowDown and PageDown in the long body.
- **Mutation.** Run 4 (`mutation.log`) is the unmodified gate at `1868fb5`: 84 mutants on the changed lines, none survived, 17 compile errors, `index.ts` zero mutants, 0 equivalent records. My own spot check at HEAD reproduced it (`gate:mutation -- --base 4aaf9e4 --files packages/elements/src/ocelle-drawer.ts,packages/elements/src/overlay.ts`): exit 0, 84 mutants on the changed lines of 2 files, none survived; 0 timeouts, 17 compile errors, 0 zero-mutant entries, 0 equivalent records; 16 m 1 s.
  - I read the compile-error lines. They are `StringLiteral` mutants on literal-typed values, block mutants, and `ocelle-drawer.ts:143` `composedPath()[0] !== panel` mutated to `true`, `false` or `===`, which the null narrowing of `panel` rejects.
  - That target check is still pinned by behaviour: the C4 rows click the slotted dialog's `<dialog>` outside the drawer's border box and expect no drawer event, and they run in `dialog.test.ts`, which imports the drawer.
  - The `overlay.ts:454` (`requestClose` guard) compile errors leave the guard pinned by the "Backdrop during the exit" row: a double click gives one request.

## Checks run

At HEAD `f2d2b80`, environment as instructed (`CI` and `GITHUB_ACTIONS` unset, docker with the pinned image):

| Check | Result |
|---|---|
| `pnpm test` | exit 0, "unit-tests: 4787 tests passed in 153 files" |
| `gate:typecheck` | no type error |
| `gate:lint` | 290 files, no finding |
| `gate:style-lint` | 16 files, no finding |
| `gate:test-lint` | 196 files, no finding |
| `gate:csp` | 14 files, no finding |
| `gate:prefix` | 236 files, no finding |
| `gate:manifest` | 4 elements, no finding |
| `gate:contrast` | 160 pairs light, 168 dark |
| `gate:brand-rules` | 7 rules |
| `gate:pins` | 5 manifests, no finding |
| `gate:config-copies` | identical |
| `gate:signoff -- --range 4aaf9e4..HEAD` | 15 commits, no finding |
| `gate:storybook-build` | built 35 stories |
| `gate:visual` | 70 captures match their baselines (docker only) |
| `gate:axe` | 70 story-theme runs, 0 serious or critical; 10 notes, all the Prose document's excepted nodes |
| `gate:mutation -- --base 4aaf9e4 --files …ocelle-drawer.ts,…overlay.ts` | exit 0, no survivor (above) |
| `gate:mutation -- --base 4aaf9e4 --plan` | 12 shards, 6 of them with elements source (R1-01) |
| `vitest --project elements dialog.test.ts -t "Nested in an open ocelle-drawer"` × 5 | 8 passed each time (R1-04) |

Not run, per instructions: the full `gate:plants`.

Other things checked:
- **Visual review.** I viewed two baselines: chrome ground with heading hidden (light) and rtl start (dark). Panel edge, inner-edge corners, chrome ground, the heading hidden with the close control in place, and footer at the panel's end are as specified.
- **Gate source changes.** `gates/bin/axe.ts`, `gates/bin/visual.ts`, `gates/lib/*.ts` and `gates/visual/capture.ts` change only the Stryker comments that quote the renamed test titles (58 to 70 story-themes). No code line changed.
- **Constitution.**
  - I: `ocelle-drawer` with `ocelle-drawer-*` events, bubbling and composed; no I/O; the manifest lists the members, with `inheritedFrom` for `open`, `label` and `closeLabel`.
  - II: tokens only; the new `drawer-inline` is `var(--ocelle-shell-sidebar-width)`; chrome ground and ink for the personal-drawer use.
  - III: the dialog keyboard model is inherited; forced colours, reduced motion and axe are clean.
  - IV: CSP clean on the fixture.
  - V: six stories with baselines in light and dark.
  - VII: CHANGELOG entries in both packages.
- **Plan.** The structure matches plan.md Project Structure, decisions 24 and 25, and data-model § `ocelle-drawer`. The base's new protected `requestClose()` is the close control's open-only request, now also used by the backdrop. `PropertyDeclarations` typing lets the subclass add its properties.

## Earlier findings

None: this is round 1 of Phase 3.
