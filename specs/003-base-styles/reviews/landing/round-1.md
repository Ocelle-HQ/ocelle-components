---
scope: landing
phase: landing
round: 1
verdict: approved
base: ec0f533
head: a0aa4da
tdd_check: pass
---

# Landing review, round 1 (PR #21, mission 003-base-styles, closes #6)

This is a fresh second opinion on the integrated diff `origin/main...HEAD` (`ec0f533...a0aa4da`): 69 commits and
203 files. The branch is 0 commits behind `main` and merges cleanly. I used the phase reviews (`reviews/phase-1` to
`phase-5`, all approved; every `tdd-check.json` is `pass`, and phase 1 also has a `tdd-exempt.md`) and the run summary
`knowledge/speckit-flows/runs/003-base-styles.md` as input. This review looks for what they missed.

Settled, so not raised again here: plan decision 19 (base.css is proven by browser plants, not by Stryker), the
analysis C1 approved reading, and the phase 4 R1-04 spec fix.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| L1-01 | note | gates/stylelint/token-only.ts:99-110, :119-123 | **The `lineHeight: "token"` option has two narrow gaps.** (a) A `font` shorthand with no `/` passes, yet it resets `line-height` to `normal`, the value that the plant `fail-styles-normal-line-height` rejects when it is written out. Reproduced with the repository's `stylelint.config.ts` on a virtual `packages/styles/src/x.css`: `a { font: var(--ocelle-font-size-md) var(--ocelle-font-sans); }` gives no warning, while `a { line-height: normal; }` gives `line-height: raw normal`. (b) `tokenLineHeight` accepts any `var(--ocelle-*)`, so `line-height: var(--ocelle-space-4)` (a length) passes. R-07 limits the check to "the line-height part of a font shorthand (after the `/`)", so this matches the plan. base.css has neither form: its only shorthand is `font: inherit` (base.css:37). The browser suites also pin the computed line heights of the elements they read. So nothing ships wrong today. But the gate does not fully enforce FR-002's "every `line-height` in `packages/styles` MUST be a token reference". | Optional follow-up: under the option, report a `font` value that is not a CSS-wide keyword and has no `/`, and accept only `--ocelle-line-height-*` names. Add a fail plant for each. |
| L1-02 | note | gates/README.md:26 (style-lint row) | The plant summary in the style-lint row is stale. It does not mention the 003 tightening (a token-only line height in `packages/styles/**/*.css`), the four `fail-styles-*-line-height` plants or `pass-styles-line-height-token`. Its "pass: the ten allowed values" no longer holds for `styles/`, because the unitless line height plant `pass-line-height` moved to `packages/elements` in this diff. contracts/checks.md:12-13 correctly says no gate is added or renamed. Even so, the ocelle-land docs rule asks for `gates/README.md` to change "for gates and plants". gates.json, registry.ts, ci.yml and 001 ci-checks.md need no change: no check name and no command changed. | One clause in the row: "in `packages/styles/**/*.css` a line height must be a token or a CSS-wide keyword (003 FR-002)", and the new plants. |
| L1-03 | note | packages/styles/scripts/build.ts:22, :24, :26, :28, :30 | Five `Stryker disable next-line all: I/O boundary` records sit on lines that an in-process test covers. packages/styles/test/build.test.ts is in the `styles` project, which Stryker runs (vitest.mutation.config.ts), and it calls `build()` directly with a temporary package. So mutants on `join(packageDir, "src", "base.css")`, the loop and the write could be killed rather than recorded. The gate lists them as 8 equivalent records. The records follow the convention of packages/tokens/scripts/build.ts, and the behaviour is asserted byte for byte, so coverage has no gap. Only the mutation evidence is weaker than it could be. The two `import.meta.main` lines (:35, :38) are true process boundaries. | Optional: drop the records on :22-:30 and let build.test.ts kill those mutants. |
| L1-04 | note | `/tmp/claude-0/…/scratchpad/pw`, `/root/.local/share/pnpm/store` and `/home/user/…` paths in the 24 `check-*.log` and `red-phase.log` files of reviews/phase-1 to phase-5, and in reviews/plan/round-{1,2,3}/lens-fresh.yaml | I scanned every added line for personal data. These container paths are the only hits (generic `user`/`root`, plus an agent session id). The added lines have no e-mail address and no token pattern (`ghp_`, `github_pat_`, `npm_`, `sk-ant-`, `AKIA`). This is the pattern already recorded as 002 landing L1-06. Rewriting red evidence would weaken it. | None here. The 002 L1-06 follow-up (relative paths and placeholders in tdd-check and red logs) still applies. |
| L1-05 | note | .claude/skills/ocelle-land/SKILL.md:11, :227 | The diff edits this skill, but its context lines still say "the twelve CI checks" and "All twelve checks green". After 002 the required set is fourteen (Contrast, Brand rules), as gates/README.md and ci-checks.md say. The text predates this diff. | Optional: change "twelve" to "fourteen" in the next flow op. |

## Gate boundaries and the exit contract

- **style-lint and `lineHeight: "token"`.** The option is validated (`possible: { …, lineHeight: ["token"] }`).
  Any other value, or a malformed list next to it, is an invalid option. gates/lib/stylelint-report.ts:79-80 maps
  that to exit 2 (cannot run), so a mistyped config fails closed rather than switching the rule off. The rule tests
  cover this (gates/test/token-only.test.ts:531-534). `optionLists` now returns `undefined` when neither list is
  given, so a `lineHeight`-only object keeps the repository lists: a real token passes and an unknown
  `--ocelle-nope` is still reported (gates/test/token-only.test.ts:505). With the option, `line-height: 1.65`,
  `165%`, `calc(1.65)`, `normal`, a fallback (`var(--ocelle-line-height-normal, 1.5)`) and `font: …/1.5 …` are
  raw. `VAR(`, inner whitespace and upper-case CSS-wide keywords are handled. Custom property definitions are still
  checked (`--ocelle-line-height-prose: 1.65` in base.css is reported). The override is scoped to
  `packages/styles/**/*.css`, and `**/test/**` stays ignored, so the CSS plants under
  packages/styles/test/fixtures/plants are deliberately outside the lint. The gaps are in L1-01.
- **unit-tests and `styles-browser`.** `gate:unit-tests` runs every project of vitest.config.ts after the Chromium
  check (gates/bin/test.ts:63-75). So the new project runs in the gate and in the CI `Unit tests` job, with no
  registry change, which follows the `tokens-browser` precedent. `styles` excludes `packages/styles/test/browser/**`
  and `styles-browser` includes only that directory. gates/test/vitest-config.test.ts pins the ownership of both
  paths and asserts that no test file sits both in a mutated project and in an excluded one.
- **mutation.** vitest.mutation.config.ts excludes `styles-browser` with the other three projects, and two tests
  pin that (gates/test/vitest-config.test.ts, gates/test/integration/vitest-mutation-config.test.ts). The integrated
  diff plans 3 shards over token-only.ts, build.ts, tokens source.ts, preview.ts, swatches.ts and render.ts. CSS is
  out of Stryker by plan decision 19. Every CSS plant under packages/styles/test/fixtures/plants is used by a browser
  test (I checked each of the 29 names).
- **csp / prefix.** `dist/base.css` is in the static CSP scope after the build. The fixture pages are served under
  `default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'`, with `img-src 'self'` added for
  page.html only (packages/styles/test/browser/serve.ts:121-123, :181), and a violation collector watches them. The
  Prefix gate scans `packages/styles/**`: 132 files, no finding.
- **Registry.** gates.json, gates/lib/registry.ts, ci.yml and 001 contracts/ci-checks.md are unchanged, and they
  need no change: no gate, check name or command was added. `gate:plants` judges 182 plants of 13 gates and the
  registry (176 on main, plus the five new style-lint plants and the moved `pass-line-height`).
- **Overlap.** The new option and the 002 rule share one walk. A line-height literal is reported once, as raw, not
  twice. The contrast gate is not touched: the families add no pair. packages/styles/test/pairs.test.ts ties the
  colours base.css sets to a hand-made list whose every pairing is `checked` in both themes. I verified the main-ground
  pairs of `ink`, `ink-muted`, `ink-soft`, `link` and `link-hover` in pairs.json.

## Design lens: the new public surface

- **`@ocelle/styles`.** `exports` adds `./base.css` → `./dist/base.css`. `files` ships `dist`, README and CHANGELOG.
  The build writes `dist/base.css` byte-identical to `src/base.css`, and build.test.ts asserts it. The
  `peerDependencies` entry `"@ocelle/tokens": "workspace:0.0.0"` is exact, and pnpm rewrites it to `0.0.0` on
  publish. The README says the pin becomes meaningful at the first release (#11).
- **base.css.** Every base selector is in `:where()`: (0,0,0), with `::before` and `::after` at (0,0,1). Every hook
  is one attribute: (0,1,0). The hooks match exact values only, so `"true"` and other values do nothing, as the
  README table states. The stylesheet has no `@import`, no `url()`, no class and no motion. The compact and prose
  container rules are scoped `:where(:not(html))`, and on `<html>` the compact hook sets the body. So `rem` tokens and
  `--ocelle-target-min` keep their values. Prose beats compact on the same element by source order, which the README
  documents.
- **The four hooks.** The README documents each hook with its values, what it styles, the tokens it uses and its
  placement limits: value text on the main grounds only, prose on a content container sized from its context, the
  WebKit `tabindex` limitation, and print out of scope. The CHANGELOG lists `base.css` and each hook under
  "Unreleased".
- **Six tokens.** `font-size-subhead` (1.125rem), `line-height-compact` (1.5), `line-height-prose` (1.65),
  `measure-reading` (68ch), `measure-cell` (12ch) and `measure-container` (100cqi). The tokens README has a new
  "Tokens for the base styles" section, including the `100cqi` fallback to the small viewport. The CHANGELOG adds
  each token to its group under "Unreleased", and the README and CHANGELOG tests cover them. They are additions,
  so MINOR, as plan VII says.

## Accessibility and security (package code)

- **Focus.** The ring is written as longhands (`outline-style: solid` survives without tokens). Under forced colours
  it is `Highlight`, tested in a `forced-color-adjust: none` region. A focusable prose table gets an inset ring.
  Links are underlined in every state (WCAG 1.4.1). Code, URLs and identifiers wrap (1.4.10). Tables are contained
  scroll boxes, so they never widen a grid or flex column.
- **Contrast.** Every pairing the families create is an existing checked pair (pairs.test.ts:74-80). The value hook
  is limited to the main grounds in the README, because light `ink` on the chrome is 1.00:1.
- **Monospace.** base.css sets `code`, `pre`, `kbd` and `samp` to `--ocelle-font-sans` with tabular figures.
  storybook/.storybook/preview.css is narrowed to the Storybook error display, so story content is styled by
  base.css alone.
- **Storybook CSP.** The four new stories render escaped text from base-content.json, with no style attribute and
  no class (layout in stories-layout.css on `data-story` attributes). storybook/test/integration/csp.test.ts checks
  each story in both themes: the policy header, no violation, no request outside the origin, the hook's computed
  styles, and no monospace (with a monospace control that the check does detect).
- **Test server.** packages/styles/test/browser/serve.ts serves a temporary copy on 127.0.0.1 only and rejects `..`.

## Test quality

- **Red evidence.** Each phase has one red commit with exit 1: `ceb97f5`, `8398339`, `3f3046e`, `2581435` and
  `d169575`. The final tests fail on base in every phase (exit 1, or exit 2 in phase 2, before the files exist),
  and on the scaffold wherever there is one (exit 1). The phase 5 R1-06 fix to a test check has no red commit. It
  is a test-only strengthening, and fix-1-guards.log shows the check bites without the wrap rule.
- **Weakened tests.** I compared each red commit's test files with HEAD. The only removed assertions are lists
  that grew in later phases: the project list, the story names, and the document count in csp.test.ts. Each was
  replaced by a strictly larger expectation. No `skip`, `only`, `todo` or `fails` was added, and `gate:test-lint`
  passes.
- **Vacuous tests.** The new token-only tests assert exact raw lists and warning texts. The browser suites assert
  computed values, and each guard is paired with a plant that bites alone. The pairing guard carries its own plant
  (`color-link` on `color-chrome`).
- **Equivalent-mutant records.** No new equivalent record is a boundary or arithmetic claim. The 8 records in
  changed code are I/O or process boundaries, each naming its covering test (see L1-03 for five that could be
  killed).
- **Mutation.** `pnpm run gate:mutation -- --base ec0f533` exits 0: *223 mutants on the changed lines of 6 files,
  none survived; 8 equivalent records*.

## Checks run

Local environment: Node 22.23.4 (the pin is 26.13.0), Chromium through `PLAYWRIGHT_BROWSERS_PATH`, one heavy job at
a time.

| Check | Result |
|---|---|
| `pnpm -r build` | exit 0 |
| `gate:typecheck` | exit 0 |
| `gate:lint` | exit 0, 170 files |
| `gate:style-lint` | exit 0, 2 files |
| `gate:test-lint` | exit 0, 111 files |
| `gate:unit-tests` | exit 0: 2008 tests passed in 96 files |
| `gate:csp` (after build) | exit 0, 23 files |
| `gate:prefix` (after build) | exit 0, 132 files |
| `gate:config-copies` | exit 0 |
| `gate:pins` | exit 0, 5 manifests |
| `gate:signoff -- --range ec0f533..HEAD` | exit 0, 69 commits |
| `gate:contrast` | exit 0: 158 pairs in light, 157 in dark (149 required per theme) |
| `gate:brand-rules` | exit 0, 7 rules |
| `gate:plants` | exit 0: 182 plants of 13 gates and the registry, every plant as expected |
| `gate:mutation -- --base ec0f533 --plan` | 3 shards, 2 cuts |
| `gate:mutation -- --base ec0f533` | exit 0: 223 mutants, none survived; 8 equivalent records |
| L1-01 probe (stylelint API, repository config, virtual `packages/styles/src/x.css`) | slash-less `font` and `line-height: var(--ocelle-space-4)`: no warning; `line-height: normal`: reported |

**CI.** The first run of head `a0aa4da` on GitHub (pinned Node 26.13.0) is all green:
https://github.com/Ocelle-HQ/ocelle-components/actions/runs/42711071136. These checks succeeded: Install and pins,
Sign-off, Typecheck, Code lint, Style lint, Test lint, Prefix, Contrast, Brand rules, Content security, Story config
copies, Plants (3:35), Unit tests (4:13), Mutation plan, the three Mutation shards (6:04, 2:52, 3:22) and Mutation
testing.

## Earlier findings

This is the first landing round. The phase reviews' 3 blocking findings (phase 1 R1-01; phase 5 R1-01, R1-02) were
resolved in their own rounds, and the follow-up rounds approved them.

## Verdict

`approved`. There is no blocking finding, every local check and every CI check passes, and the TDD checks pass.
L1-01 to L1-05 are notes. L1-01 (two gaps in the new line-height option) and L1-02 (the stale style-lint row of
gates/README.md) are the ones worth a small follow-up.
