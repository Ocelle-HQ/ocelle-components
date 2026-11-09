# Phase 4 checks (T043)

Run by the implementer on 2026-11-09 in the container (Node 22, not the pinned 26.13.0; Chromium from
`PLAYWRIGHT_BROWSERS_PATH`), one heavy job at a time, on the green commit 0586539.

| Check | Result |
|---|---|
| `pnpm -r build` | exit 0; `packages/styles/dist/base.css` identical to `src/base.css` (`cmp`); Storybook build completed |
| `pnpm test` | 1980 tests passed in 95 files (`tokens`, `tokens-browser`, `styles`, `styles-browser`, `storybook`, `storybook-integration` included) |
| `gate:typecheck`, `gate:lint`, `gate:test-lint` | no finding |
| `gate:style-lint`, `gate:prefix`, `gate:csp` | no finding |
| `gate:contrast`, `gate:brand-rules`, `gate:config-copies`, `gate:pins` | pass (contrast: 158 pairs in light, 157 in dark; no pair added) |
| `gate:plants` (alone) | 182 plants of 13 gates and the registry judged, every plant as expected; about 2 min 10 s |
| `gate:mutation -- --base 752a61d` | 52 mutants on the changed lines of 2 files (`packages/tokens/src/source.ts`, `storybook/stories/render.ts`), none survived, 0 equivalent records; about 82 s |
| `tdd-check.sh 4` | `pass` (red commit e88228b exits 1; the final tests exit 1 on the base and on the scaffold dd136cf; HEAD exits 0) |

**Red run** (`red-phase.log`, red commit e88228b, recorded by `red.sh 4 phase`): 96 of 1980 tests failed, every one
an `AssertionError` on missing behaviour: the five tokens absent (tokens, token browser suites, the Type and Shell
stories, the tokens CHANGELOG), the prose values absent in every scenario (the tables neither scroll boxes nor tab
stops, the paragraphs at the container width, the links in the browser's colours, the code block at `white-space:
pre`, no cell borders in forced colours), the h1 and nested-hook scales of US2-4 and US2-5, the prose rules absent from
the parse, base.css setting no link, inset or ink-soft colour (pairs.test.ts), the README and CHANGELOG statements
absent, and `renderFamily("prose")` rendering nothing (the scaffold). The red commit was amended once before this run:
the first run (b1709d9) had four browser tests per theme stop in the `tabTo` helper ("Tab never reached #wide") when a
plain table was not a tab stop; whether a table is a tab stop is the behaviour under test, so prose.test.ts now
records it with a non-throwing `reaches()` and asserts it.

**Measure of `measure-container`** (T032): with the token added but the probe block of `values.test.ts` without
`container-type: inline-size`, the probe reads `1280px` (the viewport fallback) against the expected 1000 and the
values tests fail; with it they pass.

**Plants** (research R-10, US3 guards): each was run against the phase 4 rules before the red commit and is asserted
in `prose.test.ts`; each makes its helper report the expected problem, in light and dark:

| Guard | Plant | Reported |
|---|---|---|
| prose outside its container (US3-5) | `plants/prose-page.css` | `out-p: prose line height`, `true-p: prose line height` |
| undocumented value (US3-5) | `plants/prose-presence.css` | `true-p: prose line height` |
| container rule not on `<html>` (US3-5) | `plants/prose-root.css` | `root line height: 26.4px` |
| no page scroll in the hosts (US3-3) | `plants/table-container.css` | the page scrolls sideways at 320 px |
| inset table ring (US3-3) | `plants/table-ring.css` | `wide` and `wide-plain`: ring outside the viewport |
| caption cap (US3-3, US3-9) | `plants/caption-cap.css` | a line outside the box at `scrollLeft` 0 and scrolled, under ltr and rtl |
| caption sticky offset (US3-3, US3-9) | `plants/caption-static.css` | a line outside the box only once scrolled, under ltr and rtl |
| caption start edge (US3-3, US3-9) | `plants/caption-center.css` | a line not at the start edge at `scrollLeft` 0 only, under ltr and rtl |
| table that fits (US3-3) | `plants/table-fits.css` | `fits` and `fits-dialog`: overflows, a tab stop |
| link underline (US3-6) | `plants/link-underline.css` | not underlined on hover and on focus |
| `<a id>` target (US3-6) | `plants/link-anchor.css` | not the running text's colour |
| `pre` copy (US3-8) | `plants/pre-copy.css` | copied text differs from the source |
| colour pairings (US3-6) | `color-link` on `color-chrome` in the fixture list | missing in light and in dark |

Table semantics (US3-7) have no plant: the spike measured that `display: grid`, the R-10 candidate, keeps the whole
structure (reviews/phase-2/spike.md); the test pairs the AX structure with the scroll-box positive.

**`styles-browser` suite time**: 12.4 s for the 72 tests of `base.test.ts`, `compact.test.ts` and `prose.test.ts`
(Vitest duration), against the plan's 60 s goal.
