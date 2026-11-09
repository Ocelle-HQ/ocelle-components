---
phase: 3
round: 1
verdict: approved
base: 00136e8a3b57790e5a27b2cb75be832c5d714dd3
head: 34a93bac3c31d67fd110754597e04b3c311c51cd
tdd_check: pass
---

# Phase 3 review, round 1

Scope: `git diff 00136e8..34a93ba` (scaffold d54f5b0, red 1194e1a, green 7d85d34, records 34a93ba), plus the
re-run `tdd-check.sh 3` outputs in the tree (`tdd-check.json` now names head 34a93ba, status `pass`, no problems).

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | packages/styles/test/browser/pages.ts:1-88, packages/styles/test/browser/base.test.ts:51-81 | The new shared helper holds `open`, `close`, `tabTo` and `computed`, while `base.test.ts` keeps its own copies of the same four (its `computed` also takes a pseudo-element). The copies behave the same today, but they can drift apart. The plan names only `serve.ts` as shared (plan.md:207); a second helper module does not conflict with it. | None for this phase. Moving `base.test.ts` onto `pages.ts` (with the `pseudo` parameter) in a later phase is optional. |
| R1-02 | note | packages/styles/test/browser/compact.test.ts:103, :143-149 | The browser check of the value style's family (`startsWith('"Schibsted Grotesk"')`) cannot tell the value rule from the inherited body family, because the body already has `--ocelle-font-sans`. The same holds for the 14 px size inside the compact region. The rule's exact `font-family` and `font-size` declarations are pinned by source.test.ts:54-83 and :95-97. The 14 px size outside a region (`value`, `value-ink` against their 16 px parent, compact.test.ts:150) and the figures and colour do bite in the browser. The scenario's observable result is asserted as written. | None. |

No blocking finding.

On the four items the implementer flagged:
1. **Phase 2 tests changed in the red commit.** In `storybook/test/unit/render.test.ts:121`, `{ base: {...} }` became
   `{ ...content, base: {...} }`. Only the argument's type changed: the base markup and the `[0, 1, 3]` expectation are
   unchanged. In `storybook/test/unit/stories.test.ts:122`, the exact `toEqual(["BasePage"])` became
   `toEqual(["BasePage", "CompactScreen"])`. That is still an exact list, so it is no weaker, and every other phase 2
   assertion in that test is untouched. Nothing was weakened.
2. **The story in the red commit.** `storybook/stories/base.stories.ts` matches the configured `test_pathspec`
   (`:(glob)**/*.stories.ts`, `.specify/extensions/story/story-config.yml`), which is how phase 2 handled it. Against
   the scaffold the story renders `""`, so its red failures (stories.test.ts:129, csp.test.ts:242) are assertion
   failures on missing behaviour.
3. **`pages.ts`.** It holds helpers only and no assertions. See R1-01.
4. **Tokens README.** The new "Tokens for the base styles" section (packages/tokens/README.md:44-48) names
   `--ocelle-line-height-compact`, its group and its use. That meets T028's "add it to the README" because that README
   has no per-group token list. The tokens CHANGELOG lists it in the Unreleased type group
   (packages/tokens/CHANGELOG.md:37).

Tasks: T023 to T031 are ticked (tasks.md:230-246), and each one's work is present in the commits named above. No file
outside the phase's scope changed. The scaffold also adds the Compact screen's text to `base-content.json`. That is
data, not behaviour, and it is what lets the red Storybook tests fail on their assertions.

Constitution: the hook attributes use the `data-ocelle-` prefix. Every value in the new rules is an `--ocelle-*`
token (style-lint and prefix are clean). The hook selectors are (0,1,0) with no class (source.test.ts:165-170). No
monospace is set, and the strict-CSP check passes on the built output. Under compact on `<html>`, `--ocelle-target-min`
stays at 44 px and the focus ring is unchanged (III). The value hook's main-grounds-only limit is documented
(packages/styles/README.md:92-94). The Compact screen story has no visual baseline and no axe run. Plan.md:93 and :95 record this under
001's exception, which ends when #10 merges. The pairs test for value colours is phase 4's task (T036).

Plan and data-model: base.css:61-88 (packages/styles/src) matches data-model § Compact scale rule for rule, in R-03 order after the base
layer. The R-04 root handling (`:where(:not(html))` plus `> :where(body)`) is in place. source.test.ts:95-97 asserts
this exactly.

## Test quality

- **Red evidence:** `red-phase.log` (red commit 1194e1a, not amended, `red-commits`) shows 58 of 1917 tests failing,
  each one an `AssertionError` on missing behaviour. The token is absent from the tokens, token-browser, Type story and
  CHANGELOG tests. In `font.test.ts:158` the new token reads as `''`, the expected missing-token symptom. The compact
  regions and the compact-root body measure 16px / 23.2px, and the value style is missing. The compact-scale rules are
  absent from the parse, the README and CHANGELOG statements are missing, and `renderFamily("compact")` returns `""`.
  None of the failures is a syntax, import or setup error.
- **Scaffold:** d54f5b0 adds only the `Family` union member, the `CompactContent`/`Fact` types, a stub that returns
  `""` and the story text JSON. It adds no behaviour and no test file. `tdd-check.json` shows the final tests failing
  on both the base and the scaffold (exit 1 each) and passing at HEAD (exit 0).
- **No weakening after red:** `git diff 1194e1a..HEAD` touches no test, fixture, plant or story file.
- **Assertions:** every new test asserts computed styles, rendered markup or document text, with no conditional
  assertions, skips, `only`, snapshots or mocks, and test-lint is clean. Each FR-005/R-10 guard runs together with its
  plant in the same test, and each plant's expected report is asserted exactly: density presence form, the `body`
  font size, value presence form, compact on the root (`root font size: 14px`, `target-min: 38.5px`) and the thinner
  ring.
- **Coverage:** US2 scenarios 1, 2 and 3, scenario 4 without its `h1` half, and the nested `regular` value of FR-004
  all run in light and dark. Scenario 5 and the `h1` half of scenario 4 belong to T035 (phase 4) by tasks.md:213-215.
  The phase adds no events or keyboard paths beyond the Tab-to-focus ring check in US2-4.
- **Mutation:** `pnpm run gate:mutation -- --base 00136e8` reported 14 mutants on the changed lines of 2 files
  (`packages/tokens/src/source.ts`, `storybook/stories/render.ts`), none surviving, and 0 equivalent records. The CSS
  is not mutated by Stryker. Its declarations are pinned exactly by source.test.ts, and its behaviour is checked in
  the browser with plants.

## Checks run

All checks ran by me in the container on Node 22.23.4, with Chromium from the given `PLAYWRIGHT_BROWSERS_PATH`, one at
a time:

| Check | Result |
|---|---|
| `pnpm -r build` | exit 0; `dist/base.css` identical to `src/base.css` |
| `pnpm test` | 1917 tests passed in 93 files |
| `gate:typecheck`, `gate:lint`, `gate:test-lint` | no finding |
| `gate:style-lint`, `gate:prefix`, `gate:csp` (after the build) | no finding |
| `gate:contrast`, `gate:brand-rules`, `gate:config-copies`, `gate:pins` | pass |
| `gate:mutation -- --base 00136e8` | 14 mutants, none survived, 0 equivalent records |
| `gate:plants` (alone, after mutation) | 182 plants of 13 gates and the registry, every plant as expected |
| `tdd-check.sh 3` (run by the orchestrator before this review) | `pass`, no problems |

Not run: the visual regression and axe gates do not exist yet (001's recorded exception, plan.md:93, :95).

## Earlier findings

None: this is round 1.
