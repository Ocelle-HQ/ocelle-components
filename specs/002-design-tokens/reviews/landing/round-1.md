---
scope: landing
phase: landing
round: 1
verdict: changes_requested
base: eaf16896ec10affdca24296fc9531fcffc46a8be
head: 0fc3fe8549c26029cc2e5ef59b0cc56b536eb741
tdd_check: pass
---

# Landing review, round 1 (PR #19, mission 002-design-tokens, closes #5)

This is a fresh second opinion on the integrated diff `origin/main...HEAD` (`eaf1689...0fc3fe8`): 77 commits and
329 files, 221 of them outside `specs/` and `knowledge/`. `main` merges cleanly; the merge base is `eaf1689`. The phase
reviews (`reviews/phase-1` to `phase-6`, all approved; TDD check `pass`, phase 1 a justified `exempt`) and the run
summary `knowledge/speckit-flows/runs/002-design-tokens.md` were used as input. This review looks for what they
missed.

Known and deferred, so not raised here: Stryker generates no mutant in `source.ts` because of `as const`
(reviews/phase-3/operator-decisions.md, the follow-up op); the phase 6 mapping notes; phase 5 R1-04.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| L1-01 | blocking | gates/bin/contrast.ts:52-55; packages/tokens/src/generate.ts:155-156 (`recordProblems`, no `exempt` rule); data-model.md § Token (`exempt` "only for `color-disabled-ink` (FR-017)") | **Any token can switch off the contrast threshold for itself, and both gates pass.** The gate exempts an entry when its foreground record has `contrast.exempt === true`, whatever the token's name. `validateSource` never checks the data-model rule that only `color-disabled-ink` may carry `exempt`. The unit test pins the flag-based behaviour on a fixture token named `color-disabled` (gates/test/contrast.test.ts:32, :184), not on the name. Reproduced on a scratch root built from the repository's `source.ts`, `generate.ts` and `pairs.json`, using the `text-below-threshold` plant's delta (`color-ink-muted` light `#6B655A`, figures updated). Without `exempt`, `node gates/bin/contrast.ts --root <tmp>` exits 1 with the three `below-threshold` findings (4.2696, 4.4772, 4.2696 on inset, accent-low and hover-bg). Adding only `"exempt": true` to that token's `contrast` gives `contrast: 158 pairs checked in light, 157 in dark (149 required per theme)`, exit 0; `brand-rules` also exits 0. So a one-word change in `source.ts` ships text below 4.5:1 through both gates. That breaks FR-017 and constitution III ("text and non-text contrast is verified by an automated check"). Spec FR-016 lets a designer stop requiring a pair by changing its grounds, as a visible design change; `exempt` has no such licence. | Red test first: a `validateSource` unit test that `exempt` on any token other than `color-disabled-ink` fails validation, naming the token. Then a `contrast` breaking plant (exit 2, `source-invalid`-style) or a fail plant that marks `color-ink-muted` exempt. Then enforce the rule in `validateSource`, so that build, style-lint, `contrast` and `brand-rules` all stop on it. Rename the fixture token in gates/test/contrast.test.ts (and contrast-required.test.ts:80) to `color-disabled-ink`, or give those fixtures their own validator. Either way, the real gate must not honour the flag on another name. |
| L1-02 | blocking | specs/001-repository-foundation/contracts/ci-checks.md:12-25, :46-52 | **The CI checks contract does not have the two new gates.** The first table lists twelve checks and has no `Contrast` or `Brand rules` row. Lines 46-47 still say "the set of gate jobs (every row of the first table but Plants) equals the gate ids of `gates/gates.json`", which is now false. Lines 49-52 say the ruleset on `main` requires "the twelve check names" and that `gates/README.md` "lists the same twelve names", while gates/README.md (lines 115-130 of the head) and the ci.yml header now say fourteen. The other baselines agree: `gates/gates.json`, `fr020` in gates/lib/registry.ts, the `contrast` and `brand-rules` jobs in ci.yml, the gates/README.md table and required-check list, and the plants `gate:plants` judges (176, 13 gates and the registry). Only this contract is stale. The operator configures the ruleset from it (its line 49: "The operator configures it in the feature verification"). | Add `Contrast` (`pnpm run gate:contrast`) and `Brand rules` (`pnpm run gate:brand-rules`) rows, change "twelve" to "fourteen" in both places, and tell the operator that the ruleset on `main` must add the two check names (`Contrast`, `Brand rules`). Until it does, neither gate blocks a merge (gates/README.md § Required checks). |
| L1-03 | blocking | .claude/settings.json:40-41, :44-48 (commit 455e8b2); .claude/skills/ocelle-run/SKILL.md:55-61 | **The new push permissions let an agent push or force-push to `main` with no prompt, despite the commit's claim.** Commit 455e8b2 says "pushes to main and --force/-f stay denied". Permission rules match by prefix. `Bash(git push -u origin claude/:*)` matches `git push -u origin claude/x:main`, and `Bash(git push --force-with-lease=:*)` matches `git push --force-with-lease=main:<sha> origin HEAD:main`. None of the deny rules (`git push origin main`, `git push -u origin main`, `git push --force-with-lease origin main`, `--force`, `-f`) matches either form. The skill text says "never force-push without the operator's explicit approval". The allow rule removes the permission prompt, which was the mechanical stop for that, so the only stop left is the model following the text. This is out of the mission's scope (agent tooling, not tokens) and touches the constitution's "agents never merge". | Narrow the force-with-lease allow to feature branches (`Bash(git push --force-with-lease=claude/:*)`), so a force-push to any other ref prompts. Record, in the commit or in the landing notes, that a refspec push to `main` (`claude/x:main`) can only be stopped by the ruleset on `main`, and confirm with the operator that the ruleset blocks direct pushes. Or drop both allow rules and accept the prompt. |
| L1-04 | note | gates/bin/brand-rules.ts:191-214 (rule (f)) | Rule (f) reads the declarations inside `@media (prefers-reduced-motion: reduce)` but not their selector or their place in the cascade. A wrapped generator that changes that block's `:root {` to `.never-matches {` still gets `brand-rules: 7 rules checked`, exit 0. Reproduced on a scratch root with a wrapper over the real `generate.ts`. The real generator is pinned by packages/tokens/test/generate.test.ts:66, :107 (block order and contents), so nothing ships wrong today. The gate alone does not prove FR-007. | Optional: also require the block's rule to be `:root` and to come after the `:root` block (or check the cascade result), with a fail plant. |
| L1-05 | note | packages/tokens/README.md § Host contract; contracts/token-package.md § Host contract | The host contract states theme, `color-scheme`, CSP, font and forced colours, but not that `--ocelle-motion-fast` and `--ocelle-motion-base` become `0ms` under `prefers-reduced-motion: reduce` (only the CHANGELOG says so). That is a behaviour of the published stylesheet that a host or element author relies on: an animation timed only by these tokens disappears, so an `animationend` or `transitionend` handler may never fire. | One sentence in the README (and the contract) under a "Reduced motion" heading. |
| L1-06 | note | specs/002-design-tokens/reviews/phase-1/tdd-check.json:1 (`<repo>/…`); `<pnpm store>` (line 5) and `/tmp/claude-0/-home-user-ocelle-components/<session id>/scratchpad/pw/…` (line 34) in each of the 27 check and red logs: reviews/phase-2/{check-final-tests-on-base,check-final-tests-on-scaffold,check-head,check-red-phase,red-phase}.log, reviews/phase-3/{check-final-tests-on-base,check-final-tests-on-scaffold,check-head,check-red-fix-1,check-red-phase,red-fix-1,red-phase}.log, reviews/phase-4/{check-final-tests-on-base,check-head,check-red-phase,red-phase}.log, reviews/phase-5/{check-final-tests-on-base,check-final-tests-on-scaffold,check-head,check-red-fix-1,check-red-phase,red-fix-1,red-phase}.log, reviews/phase-6/{check-final-tests-on-base,check-head,check-red-phase,red-phase}.log | Personal-data scan of every file the diff adds or changes. These container paths are the only hits: the user name is the generic `user`/`root`, and the scratchpad path carries the agent session id. There is no personal e-mail address (only `example.com`/`example.org` fixtures and `noreply@anthropic.com`) and no token (`ghp_`, `github_pat_`, `npm_`, `sk-ant-`, `AKIA` patterns: none). The same pattern is on `main` already (001's logs, `.claude/skills/ocelle-land/SKILL.md`). The logs are red-run evidence, so rewriting them in this PR would weaken that evidence. | Follow-up: have tdd-check/red.sh write paths relative to the repository and replace `$HOME`, the pnpm store and `PLAYWRIGHT_BROWSERS_PATH` with placeholders before writing a log. That should be done before the repository goes public. |
| L1-07 | note | gates/plants/unit-tests/pass-elements-only (001, unchanged here) | The first `gate:plants` run in this container failed on this one plant: "expected exit 0 with no finding, got exit 2 (… Vitest reported errors outside tests: Failed to run the test …/packages/elements/test/x.test.ts)". A re-run with no change passed all 176. The plant is not in this diff, and the failure looks like Chromium start-up under load (Node 22 container). A flaky plant in a required check is worth watching. | None for this PR; open an issue if CI shows it too. |

## Gate boundaries and the exit contract

- **`contrast`** (gates/bin/contrast.ts). Exit 2 on: an unreadable or unparsable list, an entry outside the schema,
  more than one entry per line, an empty list, no pairs in one theme, a source or generator that does not load or
  fails `validateSource`, and any uncaught error (gates/lib/cli.ts:50-60 maps it to exit 2). Exit 1 per entry: unknown
  token, not opaque, figure mismatch (half-up at the figure's precision), unrounded `below-threshold`, excluded
  without reason, required pair excluded; then each missing required pair, keyed by kind. Exit 0 only with every pair
  computed. `--print` reads no list and exits 0. The one fail-open is L1-01. Duplicate list entries are not rejected,
  but each is computed and judged, so a duplicate cannot hide a pair.
- **`brand-rules`** (gates/bin/brand-rules.ts). It loads and validates the source and reads the list (exit 2 on
  failure). A missing or translucent token a rule needs is a finding, not a pass. (a) reads only `type` tokens, which
  is deliberate and tested (gates/test/brand-rules.test.ts:103-108). Rule (g) is case-insensitive for
  `forced-color-adjust` and for system colour names. Only rule (f) is weak (L1-04).
- **style-lint unknown token** (gates/stylelint/token-only.ts, token-lists.ts). Matching is by exact name; a misspelt
  element property is unknown. A missing manifest gives an empty list. A manifest that is not JSON or not a manifest,
  a source that does not load or fails validation, and an element property named like a token all throw, which is
  exit 2 (plant `element-property-clash`). Fallbacks and nested `var()` are read.
- **csp and prefix widening.** The Storybook inputs and `storybook/dist/*.html` are added to the scope, with
  `node_modules` excluded. A `.ts` file is parsed as TypeScript, and one that does not parse is exit 2. Markup in
  `storybook/scripts/` literals is exempt, but its dynamic-code rules are not. The narrowed static scope, which
  leaves the bundles to the run-time test, is the operator's recorded decision (gates/README.md § The Storybook
  scope).
- **mutation scope.** `scopePathspecs` and `inScope` add the same three Storybook directories and both exclude
  `*.stories.ts`. vitest.mutation.config.ts drops `tokens-browser` and `storybook-integration`, which follows the
  `gates-integration` precedent. `--plan` over the integrated diff gives 13 shards, the largest 240 lines.
- **Plant runner** (gates/lib/plant-repo.ts, plant-runner.ts). `parseDelta` is a closed schema: unknown keys,
  `pairs` together with `pairsList`, any `pairsList` other than `empty` or `not-json`, and a `generator` other than
  `wrapped` all throw. `treeProblems` forbids `source.ts` and `pairs.json` in `tree/`, and `generate.ts` without
  `wrapped`. Token overrides are proven by importing the built `source.ts`. A pair key that matches none or two
  entries throws. Keyed locations must resolve to exactly one line (or, for the stylesheet, a first line). Every such
  error fails the plant job with the plant's path, so nothing fails open.
- **Overlap.** `brand-rules` (b) and `contrast` both judge `color-link` at 4.5:1 on canvas and sheet. That is
  intended (FR-019 (b) states it), and the cost is two findings for one defect. `brand-rules` (a) and `prefix` split
  monospace between token values and font declarations, so they do not overlap.

## Design lens: `@ocelle/tokens` public surface

- **Exports.** The `exports` map in packages/tokens/package.json matches contracts/token-package.md: `.`,
  `./tokens.css`, `./tokens.json` and `./fonts/*`. `source`, `generate` and `overrides` are compiled into `dist/` as
  imports of `index.js`, but the map does not export them.
- **Typed names.** I checked the built package from a scratch consumer (`module: nodenext`, `skipLibCheck: false`,
  the package copied into `node_modules/@ocelle/tokens`). `tsc` exits 0. A `@ts-expect-error` on `"color-canvs"` as
  a `TokenName` holds, so the type is a literal union through the `.d.ts` files, which keep their `./generate.ts`
  specifiers. At run time, `import("@ocelle/tokens")` gives exactly `cssName`, `tokenNames` and `tokens`. The
  follow-up op that drops `as const` must keep this (operator decision R1-03 says so, and
  packages/tokens/test/index.test.ts:27 guards it).
- **Stylesheet.** In order: `@font-face`, `:root`, system dark under `:root:not([data-theme="light"])`,
  `:root[data-theme="dark"]`, then reduced motion. Each theme selector has specificity (0,2,0), so `data-theme` wins
  as the host contract says. Only tokens whose value differs by theme are repeated in the dark blocks. The font is
  same-origin by a relative URL with `font-display: swap`.
- **JSON export, README and CHANGELOG.** These agree with the contract. The CHANGELOG lists every token under
  "Unreleased", and a test checks this. `--ocelle-color-scheme` sits in the colour group with a keyword value, which
  the README states. The one gap is reduced motion in the host contract (L1-05).
- **Font.** The SHA-256 of `fonts/SchibstedGrotesk-wght.woff2` and of the copy in `dist/fonts/` both equal
  `SOURCE.json` (`8b77a34c…`). `THIRD_PARTY_NOTICES` names the 40-character commit and the upstream paths, and
  `OFL.txt` ships beside the font. `SOURCE.json` is kept out of `dist/` (`buildPlan`).

## Accessibility and security (package code)

- Themes follow constitution II. Reduced motion zeroes both durations and keeps the easing. The stylesheet has no
  `forced-color-adjust` and no forced-colours block. The README states the `box-shadow` caveat for forced colours.
- CSP: no inline script or style in the package output (`gate:csp` exit 0 on the build). The Storybook run-time test
  serves the build under `default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; connect-src
  'self'`, with a control. The only addition to constitution IV for hosts is `font-src`, as the spec records.
- No I/O in package source. `scripts/build.ts` is build-time only. The externaliser hashes the inline content it
  moves into same-origin files. Nothing loads from a CDN.
- Security outside the package: L1-03.

## Test quality

- **Red evidence.** Every behaviour phase has a red commit with exit 1 and its log: phase 2 `3bf7ffc`, phase 3
  `ff93cf4` and fix-1 `90fadb0`, phase 4 `add99ec`, phase 5 `06a58cb` and fix-1 `03520ef`, phase 6 `04ab5c4`. The
  final tests fail on base in every `tdd-check.json` (exit 1 or 2) and on the scaffold where there is one (exit 1).
  Phase 1 is a justified exempt (configuration only).
- **Weakened tests.** I compared each red commit's test files with HEAD and read every removed assertion. Each one
  was replaced by an equal or stricter assertion with a reason:
  - the project lists grew by `storybook` and `storybook-integration`;
  - `expectedCss` gained `@font-face` in phase 4;
  - a missing radius is now located at its record line, and the token-source case is kept as a second assertion;
  - `pairsText` was replaced by the closed `pairsList` (operator decision R1-01 (c));
  - the extra-pair fixture changed from an identical-colour pair at 1.0 to a real non-text pair at 3.45.

  No `skip`, `only`, `todo` or `fails` was added, and `gate:test-lint` passes.
- **Vacuous tests.** I read the new gate tests (contrast, contrast-required, contrast-pairs, brand-rules,
  token-source, wcag, plant-repo, plant-runner, plants-robustness, token-only) and the token tests (generate,
  validate, resolve, json, index, readme, sk-mapping, source-table, build, font, browser suites). Their assertions are
  on exact gate output, exact finding lines, or computed values. I found no conditional assertion or mock-only
  assertion. The gap L1-01 is a missing requirement test, not a vacuous test.
- **Equivalent-mutant records (R-08).** I re-checked the five boundary records: `< 4.5`, `>= 3`, `< 3`, `< threshold`
  and luminance `> 0.05` (gates/bin/brand-rules.ts:120, :152, :158, :171; gates/bin/contrast.ts:54). I computed all
  2^24 relative luminances with the formula of gates/lib/wcag.ts, asserted equal to `relativeLuminance` on a sample.
  For each luminance I tested the neighbours of the exact partner value. No pair gives a ratio of exactly 3 or exactly
  4.5, and no colour has luminance exactly 0.05. So these records hold. The `0.04045` record in gates/lib/wcag.ts:126
  holds by arithmetic (10/255 and 11/255 straddle it). The remaining records in token-only.ts, generate.ts:177 and
  externalise.ts each give a reason that holds on reading. The process and I/O boundary records each name the
  integration test that covers the line.
- **Mutation.** `pnpm run gate:mutation -- --base eaf1689` over the integrated diff: *2209 mutants on the changed
  lines of 25 files, none survived; 58 equivalent records*, exit 0 (log: `round-1-mutation.log`). As known and
  deferred, `source.ts` yields no mutant because of `as const`.

## Checks run

Environment: Node 22.23.4 (the pin is 26.13.0), pnpm from the repository, Chromium through
`PLAYWRIGHT_BROWSERS_PATH`.

| Check | Result |
|---|---|
| `pnpm -r build` | exit 0 |
| `gate:typecheck` | exit 0 |
| `gate:lint` | exit 0 |
| `gate:style-lint` | exit 0 |
| `gate:test-lint` | exit 0 |
| `gate:unit-tests` | exit 0: 1794 tests passed in 88 files |
| `gate:csp` (after build) | exit 0 |
| `gate:prefix` (after build) | exit 0 |
| `gate:config-copies` | exit 0 |
| `gate:pins` | exit 0 |
| `gate:signoff -- --range eaf1689..HEAD` | exit 0 |
| `gate:contrast` | exit 0 |
| `gate:brand-rules` | exit 0 |
| `gate:plants` | first run exit 1 (L1-07, an unchanged 001 plant); re-run exit 0: 176 plants of 13 gates and the registry, every plant as expected |
| `gate:mutation -- --base eaf1689 --plan` | 13 shards, 8 cuts |
| `gate:mutation -- --base eaf1689` | exit 0: 2209 mutants on the changed lines of 25 files, none survived; 58 equivalent records |
| L1-01 reproduction (scratch root, `exempt` on `color-ink-muted`) | `contrast` exit 0 with, exit 1 (3 findings) without; `brand-rules` exit 0 |
| L1-04 reproduction (wrapped generator, reduced-motion selector `.never-matches`) | `brand-rules` exit 0 |
| scratch consumer of the built package (`tsc`, `nodenext`, `skipLibCheck: false`) | exit 0 |

CI on the head was still running when this review was written, and no CI result was passed in.

## Earlier findings

This is the first landing round. The phase reviews' blocking findings were resolved in their own rounds; the run
summary shows 6 blocking findings over 10 rounds, all phases approved and no TDD check failing.

## Verdict

`changes_requested`: three blocking findings. L1-01 is a fail-open in the `contrast` gate (fix test-first). L1-02 is
the stale CI checks contract, and the operator must also add `Contrast` and `Brand rules` to the ruleset on `main`.
L1-03 is the push permissions, which reach `main`. L1-04 to L1-07 are notes.
