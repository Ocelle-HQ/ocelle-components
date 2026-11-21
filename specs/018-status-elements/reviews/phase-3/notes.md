# Phase 3 notes (implementer): User Story 2, `ocelle-metric`

## Commits

- `3e4c0390` scaffold: `src/ocelle-metric.ts` (the class only, no shadow content, no registration), so the red tests
  fail on their assertions, not on a missing module.
- `9a166398` red: T024 to T029 (operator decision I3: story tests, scenario bodies, node tests and pinned counts in the
  red commit).
- green: T031 to T034 (this commit; T028 and T030 change no file, below).

## T028 and T030: 011's eyebrow tokens used as merged

As amended at the phase-1 recheck (design-amendments.md A5; T001 (c) found 011 on `main` at `bea31300`), the metric
uses 011's four eyebrow tokens as merged: `--ocelle-font-size-eyebrow`, `--ocelle-font-weight-eyebrow`,
`--ocelle-tracking-eyebrow` and `--ocelle-color-eyebrow`. No token is added, so no token test changes (T028: no change
to `packages/tokens/test/expected.ts` or the pinned contrast counts) and no token source, pair list, tokens README or
tokens CHANGELOG changes (T030). FR-042's second branch applies. `gate:contrast` and `gate:brand-rules` were not run
(contracts/checks.md § Gates per phase: US2 adds no token).

## Red record

`red.sh 3 phase` on `9a166398`: `tests_only: true`, `red: true`, exit 1, **76 of 7931 tests failed**
(`red-phase.log`, the pnpm store path redacted to `<pnpm-store>`), each on the missing behaviour:

- `metric.test.ts` (16) and its fixture twin `browser/metric.test.ts` (16): the element is not defined, so the bodies
  read no parts, no tree and no find match; the forced-colours bodies read through `computed`, which rejects with
  "no `[part="label"] .eyebrow` in the shadow root" (the element renders nothing);
- `consumers.test.ts` (2): no `[part="label"]`; `entry-metric.test.ts`, `entry-root.test.ts`, `exports.test.ts`: the
  element is not defined or exported;
- node: the manifest declaration, the README section and its two rules, the entry-points table and `package.json`
  exports, the CHANGELOG names and statement; build and pack (`dist/ocelle-metric.js`, the root's import, the browser
  build's definition, the `exports` entry);
- story and gate counts: the three story ids (six story-themes), 199 stories, 398 story-themes and baselines, 400 axe
  plant runs, 22 manifest elements (`gates/test/manifest.test.ts`'s five root tests fail on the count line their
  outputs share).

## The driver addition

`findInPage(text)` (`test/find.ts`, both drivers): the browser's find in page (`window.find`, case-insensitive,
forwards, no wrap) from the start of the document until no further match, each match read through
`Selection.getComposedRanges` with every open shadow root of the page, so a match in a shadow root names the element
it lies in. It is in the red commit as test code; the find-in-page body pairs the two-match reading with a positive twin
(the label written once outside the metric adds a third match, `#prose`), so it cannot pass on an empty reading.

## Points for the review

- **The bodies mount with base.css.** The first run of the US2-1 dark body found an axe `color-contrast` violation:
  without base.css the page has no dark ground (`color-scheme` and the body's ground are base.css's), so the dark
  eyebrow colour sat on white. Every metric body therefore mounts with `base: true`, and the fixture `metric.html` links
  base.css (as `facts-base.html` does). SC-001's metric row (`scenarios/consumers.ts`) still renders with no consumer
  CSS and no base.css, and pins the value's family.
- **The element sets its own family.** R-05 says the value's family is "inherited from the base styles"; the element
  sets `font-family: var(--ocelle-font-sans)` on its `dl`, so a metric is in Schibsted Grotesk without base.css too
  (FR-023). SC-001's metric row reads the value's family on a page with no base.css.
- **The eyebrow tokens are on the `dt`.** The eyebrow's size, weight and tracking are set on the `dt` (so its line box
  is the eyebrow's, not the body's 16 px strut), and the uppercase transform and colour on the `.eyebrow` span alone,
  so the written copy keeps the label as written. The scenario reads the computed values on the `.eyebrow` span, as
  R-05 names it.
- **An empty value in `row`.** With `align-items: baseline`, an empty `dd` has no line box, so its baseline is
  synthesised from its bottom edge and the row grew taller than its twin with a value (found by the US2-5 body). The
  element adds, in `row` only, an empty zero-width `inline-block` `::before` on the `dd`, which gives it a line box and
  a baseline; it adds no text, no accessibility node and no find match (the US2-5 tree reads no text under the
  definition). `dd { min-block-size: 1lh }` stays for the stacked layout, as R-05 has it.
- **The `min-inline-size: 0` twin's row is 120 px.** checks.md § US2 bodies sets the flex row at 220 px; in the row
  layout a 220 px row shrinks a `min-inline-size: 0` metric only to about 51 px, wider than "12345", because its flex
  basis is the pair's one-line width. The twin's flex row is 120 px, so it is shrunk below its word in both layouts.
- **`label`, `displayValue` and `layout` defaults.** As in phase 2, the manifest declares `label` and `displayValue`
  `undefined` (unset; the repository's convention for reflected optional properties) where contracts/elements-status.md
  writes `""`; unset and empty render the same. `layout` is an attribute-backed accessor with default `"stack"`.
- **Find in page.** As the phase-1 spike measured, the planned hiding is kept, and the body pins two matches per label,
  `.eyebrow` and then `.written` (whose box is 0 × 0).
- **Story capture.** `fail-token-changed` gains `elements-ocelle-metric--stack/light` and `--row/light` (their values
  are text in `color-ink`); `--empty-value` shows only labels, in `color-eyebrow` (an alias of `color-ink-muted`), so
  it is not listed. These lines are not confirmed by a plant run (see `plants.md`).

## Guard plants (T034), each run once in process (`test/metric.test.ts`, `test/consumers.test.ts`), the source restored after each

| Plant | Change to `src/ocelle-metric.ts` | Result |
|---|---|---|
| `overflow-wrap: anywhere` on `dt` and `dd` (checks.md § US2) | `break-word` → `anywhere` | 1 failed: US2-7, stack (the one-word label and value broken in the flex row) |
| the row's `min-inline-size: 0` on `dt` and `dd` removed (checks.md § US2) | the `.layout-row .pair > *` rule deleted | 1 failed: US2-7, row (the 34-letter value overflows the 100 px metric) |
| `:host([hidden])` removed | the rule deleted | 1 failed: the edge-case body (the hidden host keeps its box) |
| the row's empty-value strut removed | the `.layout-row dd::before` rule deleted | 1 failed: US2-5 (the empty row metric taller than its twin) |
| the value bound as markup | `unsafeHTML(this.displayValue)` | 1 failed: US2-4 (a `b` element in the definition) |
| `aria-hidden` removed from the eyebrow | the attribute deleted | 8 failed: US2-1 structure, US2-2 (both), US2-4, US2-5, right to left, SC-001 light and dark (two texts under the term) |
| the written copy upper-cased too | `text-transform: uppercase` on `dt` instead of `.eyebrow` | 9 failed: US2-1 light and dark, US2-2 (both), US2-4, US2-5, right to left, SC-001 light and dark (the term named in capitals) |
| `layout` read as written | the getter returns the attribute | 1 failed: US2-6 (unknown values read back) |
| the written copy hidden by `visibility: hidden` | added to `.written` | 8 failed: US2-2 (both), US2-4, US2-5, find in page (one match), right to left, SC-001 light and dark (the term unnamed) |

## Gates (T034)

Node 26.13.0 (`/opt/node26/bin` first on PATH), `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`,
one heavy job at a time; per `reviews/operator-ci-first.md` only the fast gates, this phase's tests, the visual and axe
gates and mutation locally:

- `gate:typecheck`: no type error; `gate:lint`: 469 files, no finding; `gate:style-lint`: 44 files, no finding;
  `gate:test-lint`: 347 files, no finding; `gate:manifest`: 22 elements, no finding; `gate:config-copies`: identical;
  `gate:csp`: 47 files, no finding (after the elements build); `gate:prefix`: 495 files, no finding; `gate:pins`: 5
  manifests, no finding. `gate:contrast` and `gate:brand-rules` not run (no token added, T028, T030).
- `gate:storybook-build`: built 199 stories. `gate:visual` (docker): 398 captures match their baselines (docker only: no
  cross-engine comparison). `gate:axe`: 398 story-theme runs, 0 serious or critical; 10 notes (0 incomplete, 10
  excepted), the existing prose-document exceptions.
- This phase's tests and the gate tests whose pins changed, in one run: `metric.test.ts`, `browser/metric.test.ts`,
  `entry-metric.test.ts`, `entry-root.test.ts`, `exports.test.ts`, `consumers.test.ts`, every `test/node` and
  `test/build` file, `gates/test/manifest.test.ts`, `gates/test/integration/manifest.test.ts`,
  `gates/test/integration/plant-repo.test.ts` and `storybook/test/integration/elements-stories.test.ts`: 19 files,
  1427 tests passed. The axe, visual and storybook-build integration tests (which rerun those gates with the new
  pins) and the rest of `gate:unit-tests` are left to CI (`reviews/operator-ci-first.md`).
- `gate:mutation -- --base f74dec85…`: the first run found one survivor, `ocelle-metric.ts:150` `this.label ?? ""`
  with the fallback replaced by `"Stryker was here!"`: no body mounted a metric without a label. A body was added
  (scenarios/metric.ts, "US2-5, the label's twin": no label and an empty label give an empty, unnamed term and the
  value still shown, in both harnesses); with the mutant applied by hand it fails, and the second run reads 30 mutants
  on the changed lines of 2 files, none survived; 5 compile errors, 1 zero-mutant entry (`index.ts`).
- `gate:signoff`: on the commit range, after this commit.
- Plants: `--affected` selects every plant; recorded with `--list` per `reviews/operator-plants.md` (`plants.md`).

## Baselines

Written only by `OCELLE_VISUAL_ENGINE=docker pnpm run visual:update` in #10's pinned container: `baselines: wrote 6
files (6 added, 0 changed, 0 removed)`, the three metric stories in light and dark. None was hand-edited or
hand-picked; no podman cross-check (standing operator rule).
