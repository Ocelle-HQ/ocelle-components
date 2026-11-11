---
type: Finding
title: Frontend missions - where effort is wasted and the pitfalls the squad keeps finding
description: Running list from missions 002 (tokens) and 003 (base styles), to make frontend missions more efficient through the environment and a frontend profile or lens
tags: [frontend, css, browser, environment, profiles, efficiency]
generated: { by: claude-code/agent, at: 2026-11-09T12:00:00Z }
status: open
---

# Why this exists

Asked for by the operator on 2026-11-09, during the mission 003 plan squad. The aim is to track what would make
frontend missions more efficient, meaning less rework, fewer rounds and fewer agent runs spent finding the same
things. The list is used to tune the general setup and to build a specialised frontend profile that knows these
pitfalls up front. Each entry names where it was found. New entries are added as missions run.

# Efficiency signals (where effort went to rework)

- **003 spec checks**: 3 checks with 10, 2 and 1 blocking findings. Most of them were browser facts (`rem` rescaling
  under a compact root, colour-only links, grid track behaviour, tab stops in scroll boxes) that a pitfall list given
  to the spec author would have prevented.
- **003 squad round 1**: 43 findings from four lenses. 14 of them were duplicates of others, so the same thing was
  found two or three times. The four lenses, the refuter and the verifier each wrote their own Playwright probe
  scripts to measure the same CSS.
- **003 squad round 1, fixes**: one fix needed a second pass, because the planted defect it named did not break
  anything once measured.
- **003 squad round 2**: 4 findings, all caused by round-1 fixes that had not been measured in hosts beyond the
  fixtures (shrink-to-fit containers, CSP of a new fixture, shadow DOM).
- **003 squad rounds 2 and 3**: 7 more findings, each from measuring a round's own fixes in new contexts (dialog,
  print, right-to-left text). The browser facts behind them are now in the list below.
- **002 phases 3 to 5 and the landing pass**: repeated failed runs and extra rounds. The causes were a missing browser
  path, Node 22 against 26, and parallel heavy jobs.

# Environment and setup (cost time on every frontend mission)

- **Node version mismatch.** The container runs Node 22, while CI and `.node-version` pin 26.13.0. A test that pinned
  Node's `EISDIR` message passed in every local run of 002 and failed on CI. It also stopped every mutation shard in
  Stryker's initial run (PR #19 landing). Fix: install the pinned Node in the environment's setup script, or fail
  the flow scripts when `node --version` differs from `.node-version`.
- **Browser path.**
  - The Playwright CDN is blocked here, and the installed Chromium build (1243) is not the one the pinned Playwright
    expects (1248).
  - Every role needs `PLAYWRIGHT_BROWSERS_PATH` pointing at an alias in the scratchpad, or `OCELLE_CHROMIUM_PATH`.
    Profiles forgot it again and again: a mutation run then exits 2 in Stryker's initial run, and a red run fails in
    setup. This happened in 002 phases 3 to 5 and in the 003 lenses.
  - Fix: set the variable in the environment (non-secret env var) or in a setup script, so no prompt has to carry it.
- **No WebKit.** Kitty Desktop's webview is WebKit on macOS and Linux, but only Chromium is installed and the proxy
  refuses the WebKit download. Keyboard and accessibility-tree behaviour can only be measured in Chromium (003 round
  1 fork A11Y-SECURITY-1-002). Fix: allow the Playwright WebKit download host, or vendor a WebKit build. Then add a
  WebKit project for the browser suites.
- **Memory.** A mutation run together with `gate:plants` was killed by the kernel for lack of memory (002 landing).
  Fix: profiles run one heavy job at a time. A `heavy` wrapper or a lock file would enforce it.
- **Container restarts.** Three restarts across 002 and 003 lost work in progress (a phase fix, a review, a mutation
  timing). Fix: profiles commit each step as soon as it is written. The orchestrator pushes after every step.
- **Mutation shard time.** One dense 120-line entry of `generate.ts` held 264 mutants and took 670 s, over the
  10-minute CI limit. Entries are now 60 lines. CI runners are 1.5 to 3.4 times slower than this sandbox. Fix: the
  next lever is a bound on mutants per shard.
  - *Resolved in 007 (2026-11-11), sandbox half.* Not by a mutant bound. Measured on `source.ts` (every line
    changed), concurrency 8 with the checker on:
    - **Lever 1:** the token tests now run first (`tokens-source-table`, then `tokens`, then the rest) in
      `vitest.mutation.config.ts` only. Every Timeout is now Killed, by `source-table.test.ts` after 4 to 10 tests.
      `121-180` went from 537.27 s (46 Timeout) to 283.22 s. The 60-line entries still took 170.54 s to 283.22 s,
      and three were over the 176 s bound.
    - **Lever 2** (concurrency) did not help. On `121-180`: 4 gave 358.77 s, 8 gave 283.22 s, 12 gave 316.27 s.
    - **Lever 3** (operator, FR-014): 001 FR-013's entry bound went from 60 to 30 changed lines for every file,
      with a dated amendment of 001 FR-013 and SC-005. The eight 30-line entries took 73.96 s to 182.52 s, with 0
      Timeout and 0 Survived. `91-120` (177.68 s) and `151-180` (182.52 s) missed 176 s once. Their one re-run
      was within it (171.53 s, 170.49 s), with no mutant changing status.
    - **Cost:** 70 cuts within files instead of 27.
    - The time is mostly the TypeScript checker's queue: with the checker off, the entries take 54 s to 66 s.
    - The CI half (480 s per `gate:mutation` step) is measured at landing.
- **`scope-check.sh` exits 0 on `ok: false`.** `scope-check.sh … && git push` does not stop a push. Fix: exit 1 on
  `ok: false`.

# Browser and CSS pitfalls (found by measuring, each cost a squad or review round)

## Selectors and the cascade

- `:where()` cannot contain pseudo-elements: `:where(*, *::before)` silently drops the pseudo-elements. Write
  `:where(*)::before`. (003 CORRECTNESS-1-001)
- Attribute selectors in presence form (`[data-x]`) match any value, including `"false"`. Use exact values when
  "other values have no effect" is promised. (003 CORRECTNESS-1-002)
- Page rules beat a shadow tree's `:host` rules whatever their specificity, so a base stylesheet changes every
  element's host box (box-sizing, outline-offset). (003 FRESH-2-004)
- `revert` rolls back the whole author origin, presentational hints included, so it makes a poor plant.
  `revert-layer` reproduces "the rule is missing". (003 CORRECTNESS-1-009)
- Setting `font-size` on `<html>` rescales every `rem` token (`--ocelle-target-min` 44 px becomes 38.5 px). Never
  set the root size from a hook. (003 SPEC-1-01)

## Values and custom properties

- The `outline` shorthand containing `var()` is invalid at computed-value time when a variable is missing, so the
  whole declaration becomes `outline-style: none`. Use longhands. (003 SPEC-2-12)
- `<canvas>` `width`/`height` attributes set its natural size, not a presentational hint, so `block-size` tricks do
  not change its ratio. (003 CORRECTNESS-1-009)
- A `font` shorthand resets every longhand it does not name, so `font: <size> <family>` without `/` sets
  `line-height: normal`. A token-only lint rule for line heights must check the shorthand too, and accept only
  line-height tokens, not any `--ocelle-*` name. (003 landing L1-01, phase 2 round 2)

## Layout

- `1fr` is `minmax(auto, 1fr)`, so a long unbroken token widens its column. `minmax(0, 1fr)` hides the problem
  before any fix. (003 SPEC-2-01)
- A wide `display: block; overflow-x: auto` table still widens a grid or flex column around its container.
  `contain: inline-size` stops that, but makes the table collapse (to 0 px) in shrink-to-fit hosts such as
  `<dialog>`, popovers, floats and default flex items. (003 A11Y-SECURITY-1-001, FRESH-2-001)
- A caption centred across a scrolling table's full width is off-screen. Even `text-align: start` runs off when the
  caption is longer than the box. (003 A11Y-SECURITY-1-005, FRESH-2-002)
- Long inline code, bare URLs and `pre` lines break WCAG 1.4.10 at 320 px unless they have
  `overflow-wrap: anywhere` and `pre-wrap`. (003 SPEC-1-09, SPEC-2-02)

## Accessibility behaviour (Chromium)

- An overflowing scroll box is a tab stop only when it has no focusable descendant. With a link inside, Tab lands
  on the link, and the arrow keys scroll the box from there. A stylesheet cannot add `tabindex`. WebKit differs.
  (003 SPEC-3-01)
- `display: block` on a `<table>` keeps role `table`, its rows, column headers and cells, and the caption as its
  name. The accessibility tree has no property linking a cell to its header, so assert on structure. (003 round 1)
- In forced colours Chromium forces `outline-color` anyway. An `outline-color: Highlight` rule is only measurable
  inside a region with `forced-color-adjust: none`. (003 TESTABILITY-1-006)
- A full-width focusable element at the viewport edge shows only the top and bottom of an outset focus ring. Use an
  inset ring. (003 A11Y-SECURITY-1-003)
- Link colour against body text is below 3:1 here, so links need an underline (WCAG 1.4.1). (003 SPEC-1-08)
- Browsers render `code`, `pre`, `kbd` and `samp` in monospace by default, which breaks the no-monospace brand rule
  page-wide. (003 SPEC-2-03)

- `Range.getClientRects()` returns one rectangle per text-direction run, not per line: under `dir="rtl"` a closing
  full stop gets its own rectangle. Merge rectangles with the same `top` into line boxes before any edge check. (003
  FRESH-3-001)
- A caption capped with `max-inline-size` still passes "inside the box" when it is centred or not sticky; each
  declaration needs its own check and plant. (003 FRESH-3-001)
- Wide tables in a screen scroll box lose columns when printed (8 of 12 on A4). Decide print up front. (003 FRESH-3-002)
- State layout constraints by their cause ("not sized from its content"), not as a closed list of layouts: every
  list the squad wrote missed cases (drawers, non-modal dialogs, table cells, start-aligned items). (003 FRESH-3-003)

## CSP

- Under `default-src 'none'`, a test image needs `img-src` and a font needs `font-src`. Every request type a fixture
  makes must be in the header, or the zero-violation checks fail for the wrong reason. (003 FRESH-2-003)
- Storybook's manager cannot run under the strict CSP, so ship `--preview-only`. Telemetry must be off. (002 phase 3)

# Testing pitfalls

- "Does not" assertions pass against an empty file, so they cannot go red alone. Pair each with the positive
  assertion it guards, and prove it with a planted defect. (003 SPEC-1-03, TESTABILITY-1-001)
- A plant must be measured, not assumed: several planned plants did not make their guard fail in Chromium
  (`overflow-x: scroll` on a fitting table, `list-style: none` for list semantics, `revert`). (003 round 1)
- Never pin platform error texts (Node messages): assert codes and build the message from the cause. (002 landing)
- Stryker does not mutate inside `[…] as const`, so source data written that way is never mutation-tested. (002
  phase 3, #20)
- A browser test cannot tell a token from a literal in computed style, so a lint rule must enforce token use.
  (003 SPEC-1-06)

# Candidates for a frontend profile or lens

- **A `browser` lens for the plan squad.** It measures every CSS and accessibility claim in a real browser before
  the refute step, with the pitfalls above as its checklist. In 003, round 1 used four lenses and round 2 still
  found 4 problems. Most were browser facts a probe settles in minutes.
- **A frontend section in `implementer-ivan` and `reviewer-renata`.** It would cover the browser path, the pinned
  Node, one heavy job at a time, measured plants, paired guards and the selector, outline and CSP pitfalls.
- **A probe kit in the repository.** A shared Playwright probe harness (serve a page under a given CSP, read
  computed styles, the accessibility tree and focus order). Each lens and refuter wrote its own scratch scripts for
  this in 003.
- **Spec template additions for frontend features.** Stating the browsers and engines up front (WebKit hosts), the
  CSP of every fixture, the shrink-to-fit hosts and the shadow-DOM interaction, so the spec checks do not have to
  find them.
