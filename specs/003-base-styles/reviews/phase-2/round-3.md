---
phase: 2
round: 3
verdict: approved
base: d8dba6010eda61df1d65c618df6b713fb3c29640
head: 564164e
tdd_check: pass
---

# Phase 2 review, round 3

Scope: the fix-2 round for the operator round 2 findings O2-01 and O2-02 (landing notes L1-01 and L1-03) and T057
(landing note L1-02). Commits reviewed: e6c8f56 (plan), d6a9328 (red), 27fe9f2 (green), 564164e (red/green check).
The rest of phase 2 was checked only for regressions (the full checks below). I did not re-open settled decisions.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|

No findings.

## Test quality

- **Red evidence.** `red-commits` has `fix-2 d6a9328`. d6a9328 changes only `gates/test/token-only.test.ts`.
  `red-fix-2.log` (and `check-red-fix-2.log`, the same apart from timing lines) shows 14 of 2037 tests failing, all
  14 with `AssertionError` and no other error. That means missing behaviour, not a load or setup problem.
  `tdd-check.json`: `status: pass`, both red commits exit 1, the final tests exit 2 on base and 1 on the scaffold,
  head exit 0, `problems: []`.
- **No weakening.** `git diff d6a9328..HEAD -- gates/test packages/styles/test` is empty. The two expectations that
  T052 replaced are stricter:
  - `token-only.test.ts:480`: the old case expected `[[], []]` with the option for `165% …` and `calc(…) …`. The new
    case expects both values raw with the option, so it rejects more. It also adds the same two values without the
    option, which still give `[]`.
  - `token-only.test.ts:510`: the plugin case keeps every earlier warning. It adds the raw warning for
    `line-height: var(--ocelle-nope)` before the unknown-token warning.
- **Coverage of R-07 as amended.** Each rule has a test:
  - Line-height token, `token-only.test.ts:553-574`: a non-line-height token, `--ocelle-line-height` without its
    suffix, upper-case `--OCELLE-` (names are case-sensitive), a fallback, and both cases after the `/` of `font`
    are all raw. `VAR(…)`, `var(--ocelle-line-height-nope)` and the CSS-wide keywords pass.
  - Slash-less `font`, `:576-597`: a `/` inside a fallback and a `/` inside a string do not count, `normal` and
    `caption` are raw, the value is reported trimmed, and the five CSS-wide keywords (any case, with whitespace)
    pass.
  - Plugin with the repository lists, `:599-622`: the exact messages at lines 2 and 3, nothing for `font: inherit`,
    and only the unknown-token warning without the option.
  - Behaviour without the option: every case checks its without-option result in the same assertion. In the code,
    `tokenLineHeight()` and `fontRaw()` run only behind `options.lineHeight === "token"`
    (`gates/stylelint/token-only.ts:129`, `:133`). The without-option path is `classify()`, which this round left
    unchanged.
- **Rules against R-07.** The code matches R-07 as amended:
  - `tokenLineHeight()` (`token-only.ts:104-109`) compares the function name in any case, requires exactly one
    argument node, and checks the case-sensitive prefix `--ocelle-line-height-`.
  - `fontRaw()` (`:116-123`) looks only for a top-level `div` `/`. With none, it returns `[]` for a CSS-wide keyword
    alone (trimmed, lower-cased) and otherwise `[value.trim()]`.
- **Mutation.** I ran `pnpm run gate:mutation -- --base d8dba60…`. It exited 0: 227 mutants on the changed lines of
  6 files, none survived, and 3 equivalent records. These are the two `import.meta.main` records of
  `packages/styles/scripts/build.ts:31,34` and the process-boundary record of `storybook/scripts/swatches.ts:40`, and
  each names a test or suite that covers it. That is five fewer than the 8 before, as T058 requires.
  - `reports/mutation/mutation.json`, `build.ts` lines 22-28 (`build()`): BlockStatement ×2, the `"src"` and
    `"base.css"` literals, `{ recursive: true }` → `{}` and `true` → `false` are all Killed. `"utf8"` → `""` is a
    CompileError.
  - `token-only.ts`: 83 Killed, 30 CompileError, 0 Survived.
- **build.test.ts left unchanged.** This is acceptable. O2-02 asked for the test to be strengthened "where a mutant
  survives", and none survives. T053 named the `"utf8"` CompileError as the expected outcome that needs no new case.
  The TypeScript checker rejects `readFile(…, "")`, so that mutant cannot reach a test run. The red commit body names
  the probe result (16 mutants, no survivor), as T053 asks.

## Checks run

Container Node 22.23.4, Chromium from the scratchpad `PLAYWRIGHT_BROWSERS_PATH`, one heavy job at a time.

| Check | Result |
|---|---|
| `pnpm -r build && pnpm test` | exit 0; 2037 tests passed in 96 files |
| `gate:typecheck`, `gate:lint`, `gate:test-lint`, `gate:style-lint`, `gate:prefix`, `gate:csp`, `gate:contrast`, `gate:brand-rules`, `gate:config-copies`, `gate:pins` | all exit 0, no finding; style-lint checked 2 files, and `packages/styles/src/base.css` (`font: inherit` at :37, line-height tokens only) passes under the stricter rule |
| `gate:plants` (alone) | exit 0: 184 plants of 13 gates and the registry, every plant as expected |
| `gate:mutation -- --base d8dba60…` (alone) | exit 0: 227 mutants, none survived, 3 equivalent records |

## Earlier findings

- **O2-01: resolved.**
  - (a) A slash-less `font` that is not a CSS-wide keyword is now raw (`token-only.ts:118`).
  - (b) Only `var(--ocelle-line-height-*)` passes as a line height (`token-only.ts:108`), both in `line-height` and
    after the `/` of `font`.
  - The two fail plants match T056:
    - `gates/plants/style-lint/fail-styles-font-without-line-height` and `…/fail-styles-other-token-line-height`
      each hold `tree/packages/styles/src/x.css` with the declaration on line 3.
    - Each `plant.json` expects one `ocelle/token-only` finding at `packages/styles/src/x.css:3` with the trimmed
      value, and its `why` names FR-002, R-07 and O2-01.
    - `gate:plants` judges both as expected.
  - Behaviour without the option is unchanged (see Test quality).
  - The red commit shows the new tests failing first.
  - The header comments of `token-only.ts` and `stylelint.config.ts` are updated as T055 asks.
- **O2-02: resolved.**
  - The five `build()` records are gone (`packages/styles/scripts/build.ts:22-28`), the two `import.meta.main`
    records remain, and the header comment is adjusted.
  - The mutants on those lines are killed in process or are CompileErrors, with no survivor.
  - No red test was needed, because the probe found no survivor. The fix-2 red commit covers O2-01.
- **T057 (L1-02): done.** The `style-lint` row of `gates/README.md` has the `packages/styles` line-height clause. It
  lists the six fail plants and `pass-styles-line-height-token`, and corrects the pass count to "the ten allowed
  values (nine in `styles/src`; … `pass-line-height`, in `elements/src`)". I checked the count against the tree:
  nine of the pass plants named in T057 sit in `tree/packages/styles/src/x.css`, and `pass-line-height` sits in
  `tree/packages/elements/src/x.css`. No other README line changed.
- **Tasks.** T052 to T058 are ticked. In 27fe9f2 the `tasks.md` diff consists only of these ticks.
