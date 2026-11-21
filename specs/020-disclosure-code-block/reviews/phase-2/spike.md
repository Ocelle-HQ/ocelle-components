# Phase 2 spike (T021)

Run on 2026-11-21 in this container (Linux x64, Node 22.23.5, headless Chromium **156.0.8078.4**, the repository's
pinned Playwright 1.64.1 browser from `PLAYWRIGHT_BROWSERS_PATH`, Lit from `packages/elements/node_modules`, the
module `packages/elements/src/overflow-region.ts` unchanged at phase 2's base). Research R-06 and R-07 were measured in
Chromium 157; this is the re-run under the repository's pinned browser that tasks.md T021 asks for, in both harnesses.
Scratch files only, nothing of them committed: a stand-in element, the page-side and node-side measure scripts, a
fixture runner and a scratch Vitest configuration, in a scratch directory at the repository root outside `packages/`
for the runs, moved out of the repository afterwards (`<tmp>/spike-020-sources`); the raw results in
`<tmp>/fx/fixture-results.json` and `<tmp>/fx/inproc-results.json`.

**Stand-in.** `x-code-block`, a Lit 3 element with R-06's structures and R-07's units: `:host { display: block;
max-inline-size: var(--ocelle-measure-reading) }`; wrap mode `.block > pre.code`, scroll mode `.block > .region-frame
> .region-box[data-fade] > .region-track > pre.code` with the ring and the two edges, through `OverflowRegion` (`box:
() => .region-box`) and `overflowRegionStyles`; `.code` with R-06's rules (`direction: ltr; unicode-bidi: isolate;
text-align: left`, `min-block-size: 1lh`, the sans, `--ocelle-figures`, `--ocelle-font-size-md`,
`--ocelle-line-height-relaxed`, `pre-wrap` and `overflow-wrap: anywhere`, `pre` in scroll mode); in digest mode the
prefix to the last `:` and groups of four code points as Lit text bindings in spans joined by `<wbr>`, with
`.digest > span:not(:last-child) { margin-inline-end: var(--ocelle-space-1) }` and `.digest > .group { white-space:
nowrap }`; R-06's `rtl` opening write in `updated` (`box.scrollTo({ left: -(box.scrollWidth - box.clientWidth),
behavior: "instant" })` when the box or the text is new and the box computes `direction: rtl`); `textContent` read in
`render()` and a `MutationObserver` on the host.

**Harnesses.**

- *Fixture:* a page served on 127.0.0.1 under the fixture's policy (`default-src 'none'; script-src 'self';
  style-src 'self'; font-src 'self'`), linking `tokens.css` from the token generator with the vendored font, and the
  stand-in bundled by Vite as a same-origin module; a fresh 1280 × 800 context, light; 002's CSP collector installed
  before navigation. **0 CSP violations, 0 console messages.**
- *In process:* a scratch Vitest browser-mode project (Playwright provider, Chromium, 1280 × 800, the test in the
  runner's iframe) with the tokens adopted without their `@font-face` rules, as `test/in-process.ts` does, so the
  fallback face of `--ocelle-font-sans` is measured (unit widths differ from the fixture's; no outcome does).
- Copy: the clipboard set to a sentinel through `navigator.clipboard.writeText` with `clipboard-read` and
  `clipboard-write` granted on the page's origin, then a triple click on the shadow `pre` (Playwright locator, three
  clicks) or `setBaseAndExtent` over spans of the `pre`, then `ControlOrMeta+C`, then `navigator.clipboard.readText()`
  on the top page. The in-process harness's `http://localhost` origin is a secure context; neither harness refused the
  permission, so R-07's `execCommand` fallback is not needed.
- AX text: 005's `axSubtree` reader (CDP `Accessibility.getFullAXTree`, tree order, from the host's node), the
  `StaticText` names joined. Snapshot: Playwright's `ariaSnapshot` of `#id >> pre.code` and of the host.

The digest is the spec's `sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08` (prefix and 16
groups); "the trimmed digest" below means it.

**Outcome: stop for the operator (tasks.md § Stop-and-ask points, T021: "R-07's copy, AX-text or break-position
measure fails under the repository's pinned browser").** Two measures fail, in both harnesses: the whole-block copy
ends with the platform newline only when content follows the block (§ 1), and the prefix breaks inside at the four
`pre` widths where it fits the line but its trailing gap does not (§ 3). The AX text, the snapshot, the run copy, the
groups' breaks, the gaps, the line starts and R-06's opening write hold. No scaffold, no red commit and no T021a run
were made. The questions are at the end.

## 1. Copy (R-07; US2-10, FR-031)

Block 200 px wide (`pre` content box 174 px), wrap and scroll mode; the sentinel was in the clipboard before each copy.

| Selection | Harness | Mode | Copied | Selection's `toString()` |
|---|---|---|---|---|
| triple click, the block last in `body` | fixture, in process | wrap, scroll | the trimmed digest, **no** `\n` | the trimmed digest |
| triple click, a `<p>` after the block | fixture, in process | wrap | the trimmed digest + `\n` | the trimmed digest |
| triple click, a `<div>` after the block | fixture | wrap | the trimmed digest + `\n` | the trimmed digest |
| triple click, a bare text node after the block | fixture | wrap | the trimmed digest + `\n` | the trimmed digest |
| triple click, a `<p>` before the block only | fixture | wrap | the trimmed digest, **no** `\n` | the trimmed digest |
| triple click, a `<p>` before and after | fixture | wrap | the trimmed digest + `\n` | the trimmed digest |
| groups 2 to 5 (`d081` to `9a2f`) by `setBaseAndExtent` | fixture, in process | wrap, scroll | `d081884c7d659a2f`, exactly | |
| prefix and group 1 by `setBaseAndExtent` | fixture, in process | wrap, scroll | `sha256:9f86`, exactly | |

Nothing is added between units in any copy; the run copy holds exactly. **The whole-block copy fails FR-031's and
US2-10's "followed by the one newline the platform adds":** under Chromium 156 the newline is added only when the
document has content after the block, and is absent when the block is the last content of the page, in both modes and
both harnesses. The copied characters before it are the trimmed digest in every case.

## 2. Accessibility text (R-07; US2-11, FR-032)

| Harness | Mode | CDP StaticText names joined, tree order | StaticText nodes | `ariaSnapshot` of `pre.code` | `ariaSnapshot` of the host |
|---|---|---|---|---|---|
| fixture | wrap | the trimmed digest | 17 | `- text: ` + the trimmed digest | the trimmed digest twice, space separated |
| fixture | scroll | the trimmed digest | 17 | `- text: ` + the trimmed digest | the same, twice |
| in process | wrap | the trimmed digest | 17 | `- text: ` + the trimmed digest | the same, twice |
| in process | scroll | the trimmed digest | 17 | `- text: ` + the trimmed digest | the same, twice |

A short host (`sha256:9f86d081`) gives `- text: sha256:9f86d081` for the `pre` and `- text: sha256:9f86d081
sha256:9f86d081` for the host in both harnesses: the host's snapshot also reads its unslotted light-DOM text, as R-07
says, so the `pre`'s snapshot tells the two apart (T023's driver test). FR-032 holds; its fallback is not needed (no
stop on this measure).

## 3. Break positions and the gap (R-07; US2-9, US2-12, FR-030, FR-033)

**The gap.** At 200 px, every adjacent pair on one line has a gap of 4 px (`--ocelle-space-1`, 0.25rem), 12 pairs on
5 lines; in scroll mode 16 pairs on one line; both harnesses. No line's first unit is off the `pre`'s content-box
inline start (within 0.5 px) at any width measured.

**The sweep.** The `pre`'s content box set to each width from 60 to 300 px by 1 px (241 widths; the measured content
width equals the set width at every one), the host's inline size set through CSSOM. The sweep strings are
contracts/checks.md's. "Prefix split where it fits": the prefix has more than one rect although its own inline size
(read at 300 px) is at most the content box.

| Digest | Harness | Groups with more than one rect | Lines' first unit off the start | Prefix split where it fits | Line count against "wider than the box" |
|---|---|---|---|---|---|
| base64url | fixture | 0 of 241 | 0 | **4: 66 to 69 px** (prefix 66 px) | 0 wrong |
| base64 | fixture | 0 of 241 | 0 | **4: 66 to 69 px** | 0 wrong |
| hex | fixture | 0 of 241 | 0 | **4: 66 to 69 px** | 0 wrong |
| base64url | in process | 0 of 241 | 0 | **4: 63 to 66 px** (prefix 62.31 px) | 0 wrong |
| base64 | in process | 0 of 241 | 0 | **4: 63 to 66 px** | 0 wrong |
| hex | in process | 0 of 241 | 0 | **4: 63 to 66 px** | 0 wrong |

**Controls** (a scratch sheet adopted after the stand-in's own):

| Control | Harness | Groups split | Prefix split where it fits |
|---|---|---|---|
| groups' `nowrap` dropped, base64url | fixture | 60 of 241 (62 to 83, 114 to 129, 222 to 243 px) | 4 |
| the same | in process | 70 of 241 (70 to 93, 119 to 141, 231 to 253 px) | 4 |
| groups' `nowrap` dropped, base64 | fixture, in process | **0 of 241** | 4 |
| the prefix's `margin-inline-end` set to 0 (`.digest > span.prefix:not(:last-child)`), hex | fixture, in process | 0 | **0** |
| the prefix `nowrap`, hex | fixture | 0 | 0 (and it never breaks, also where wider) |

At 67 px (fixture), the prefix's rects are 56 px on the first line and 10 px (the `:`) on the second; with its margin
at 0 it is one 66 px rect. So **the prefix's trailing `margin-inline-end` counts toward fitting the line:** wherever
the content box is at least the prefix's width but less than the prefix plus `--ocelle-space-1`, `overflow-wrap:
anywhere` breaks inside the prefix (before its `:`). That fails FR-033's and US2-12's "inside the prefix only where
the prefix alone is wider than the line", at 4 of 241 widths, for every digest, in both harnesses. R-07's reading that
"a trailing margin is invisible at a line's end" holds for the paint, not for the fit.

Two further readings, not failures:

- The base64 sweep string cannot tell `nowrap` from its absence: its `/` ends the group `FaO/`, where the `<wbr>`
  already is, and its `+` (`L+qg`) is no break opportunity, so without `nowrap` no group splits. Only the base64url
  string (`L-qg`) splits, at 60 (fixture) and 70 (in process) of 241 widths, against R-07's 45 of 241 in Chromium 157
  with another layout. The `nowrap` plant is named against the base64url body (contracts/checks.md § Plants), which
  bites; the base64 body guards nothing the base64url body does not.
- `ni:sha-256:` plus the base64url string: the prefix is 96 px (fixture) and 90.31 px (in process) at 300 px, where it
  is one rect; at 60 px it is wider than the line and has 2 rects (the first 56 px and 54.89 px wide), every group has
  one rect, 13 lines. The contract's wide-prefix body holds as stated.

## 4. Fonts

The `pre` and every unit compute `"Schibsted Grotesk", "Helvetica Neue", Arial, system-ui, sans-serif` (the computed
`--ocelle-font-sans`) with `font-variant-numeric: tabular-nums`, in both harnesses. The host itself computes
`"Times New Roman"` on these pages (no `base.css`, no `font-family` on `:host` in R-06): contracts/checks.md § No
monospace asserts the host's computed `font-family` too, which R-06's styles do not give where the page sets no
body font. Recorded for the planner; not a T021 measure.

## 5. R-06's `rtl` opening write (US2-8)

A scroll block 300 px wide (box 274 px) holding `cd /srv/app`, a long `docker compose …` line and `ls`, then the text
changed to `git status`, a long `pnpm exec vitest …` line and `pwd`; `rtl` and `ltr` ancestors.

| Harness | Ancestor | When | `.block` / `.region-box` / `.code` direction | `scrollLeft` (range) | `data-fade` | `mask-image` | First character of each line inside the box |
|---|---|---|---|---|---|---|---|
| fixture | `rtl` | at rest | rtl / rtl / ltr | -567 (567) | `start` | `linear-gradient(to left, rgba(0, 0, 0, 0), rgb(21, 19, 15) 32px), …` | 3 of 3 (x 990, box 985 to 1259) |
| fixture | `rtl` | after the text change | rtl / rtl / ltr | -503 (503) | `start` | the same | 3 of 3 |
| fixture | `ltr` | at rest, after the change | ltr / ltr / ltr | 0 (567, then 503); no write | `end` | `to left, transparent, …` (the end fade) | 3 of 3 |
| in process | `rtl` | at rest | rtl / rtl / ltr | -605 (606, within 1 px) | `start` | the same as the fixture's | 3 of 3 |
| in process | `rtl` | after the text change | rtl / rtl / ltr | -528 (528) | `start` | the same | 3 of 3 |
| in process | `ltr` | at rest, after the change | ltr / ltr / ltr | 0; no write | `end` | the end fade | 3 of 3 |

The position read right after the write equals the position after the settle in every `rtl` row, and the module's
`scroll` trigger set `data-fade` to `start`, the gradient transparent at the right edge under `:host(:dir(rtl))`.
`--force main.` reads `--force main.` in visual order (characters sorted by their left edge) in wrap and scroll mode
under both ancestors, both harnesses. R-06 holds (no stop on this measure).

## Questions for the operator

**Q1. The whole-block copy's newline (FR-031, US2-10).** Under Chromium 156 a triple-click copy of the block gives
the trimmed digest followed by `\n` only when content follows the block in the document; with the block last on the
page it gives the trimmed digest alone. Options:

- **(a) Fix the page in the oracle.** US2-10's body mounts a following element after the block (as the fixture page
  and the in-process mount would state), and asserts the trimmed digest plus one `\n`; FR-031 and US2-10 name the
  condition ("where content follows the block"). Measured: holds in both harnesses with a following `<p>`.
- **(b) Assert the characters, not the newline.** The body asserts that the copy, with at most one trailing `\n`
  removed, equals the trimmed digest, and that nothing else is added; FR-031 and US2-10 say "followed by at most the
  one newline the platform adds". A weaker oracle, but it holds for either page.
- **(c) Both bodies:** the block last (exactly the trimmed digest) and a block followed by content (the trimmed digest
  plus one `\n`). Both measured.

**Q2. The prefix breaks inside where it fits the line (FR-033, US2-12).** The prefix's trailing `margin-inline-end`
(the gap, R-07) counts toward fitting the line, so at content widths from the prefix's width up to the prefix plus
`--ocelle-space-1` (4 widths of 241 in each sweep) `overflow-wrap: anywhere` breaks the prefix before its `:`.
Options:

- **(a) Give the prefix `nowrap` too.** Measured: the prefix never breaks, also where it is wider than the line (it
  then overflows the line: the 96 px `ni:sha-256:` prefix would overflow a 60 px line, against WCAG 1.4.10 and the
  contract's wide-prefix body). A change to R-07 and FR-033 (no prefix break at
  all), and a reflow risk at very narrow widths.
- **(b) Move the gap off the prefix's fit.** For example the gap as a `margin-inline-start` on each group with the
  line start corrected, or as `padding` inside a wrapper; R-07 rejected `margin-inline-start` because continuation
  lines start `space-1` in, so this needs a new measure in a further spike. A change to R-07.
- **(c) Restate the oracle.** FR-033 and US2-12 read "inside the prefix only where the prefix and its gap are wider
  than the line", and the body's threshold is the prefix's width plus `--ocelle-space-1`. Measured: with that threshold the sweep
  has 0 failures in both harnesses. A spec change, no code change.

Two notes for the planner whatever the answers: the base64 sweep string does not guard the groups' `nowrap` (§ 3),
and the host's computed font family is the page's where R-06 gives `:host` none (§ 4).

The spike did not go on to T021a or the scaffold: tasks.md stops the phase at T021 on a failed measure.
