# Implementation Plan: Base Styles

**Branch**: `003-base-styles` (work on `claude/006-base-styles`) | **Date**: 2026-11-09 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-base-styles/spec.md`. The operator approved it at gate "spec" after
three checks and a final fix (`8905627`). Squad round 1 of the plan (`reviews/plan/round-1/`) changed this plan and
the spec; its fixes and the operator's seven fork decisions of 2026-11-09 are listed in `fixes-1.md` there. Squad
round 2 (`reviews/plan/round-2/`) changed them again: one fix and three fork decisions, listed in `fixes-1.md` there.

## Summary

`@ocelle/styles` ships one hand-written external stylesheet, `base.css`. It is copied from `src/` to `dist/` by a
thin build script, and every value in it is an `--ocelle-*` token. It has four families:

- **Base layer** (no hook): the reset, the body, the root `color-scheme` (the 002 hand-off), the focus ring in
  longhands, `code`/`pre`/`kbd`/`samp` in Schibsted Grotesk with tabular figures, and forced colours. It declares
  no motion.
- **Compact scale**: the `data-ocelle-density` attribute, which never changes the root font size, and the
  `data-ocelle-value` attribute.
- **Prose**: the `data-ocelle-prose` attribute, on a content container that gets its width from its context, never
  from its content. Tables become their own scroll box without a wrapper, contained (`container-type: inline-size`)
  so that they never widen a grid or flex column, with an inset focus ring and a caption that wraps inside the visible
  box, starts at its start edge and stays in view while the table scrolls. Print is out of scope: a printed wide
  table shows only the columns that fit the page.
- **Identifier wrap**: the `data-ocelle-wrap="anywhere"` attribute.

Base selectors sit entirely in `:where()`, so their specificity is (0,0,0); only the box-sizing rule's two
pseudo-element selectors are (0,0,1). Hook selectors are one attribute, matching its documented values exactly, plus
`:where()`, so (0,1,0). The file order makes prose win over compact on one element (research R-03).

Six tokens are added to `@ocelle/tokens`: `line-height-compact`, `line-height-prose`, `font-size-subhead`,
`measure-reading`, `measure-cell` and `measure-container` (`100cqi`, for the caption). `@ocelle/styles` declares an
exact peer dependency on that tokens version. The style lint is tightened for `packages/styles` so that line heights
must be tokens.

The behaviour is proven in a new `styles-browser` project: Playwright against fixture pages, served under the
strict CSP, in both themes and forced colours, with keyboard focus and the accessibility tree read through CDP. The
file's own properties are proven by source-level checks, each paired with a positive assertion, and every guard has
a planted defect or a recorded reason why none exists. Storybook gains one story per family.

## Technical Context

**Language/Version**: CSS (the stylesheet); TypeScript 6.0.3 strict on Node 26.13.0 (build script, tests).

**Primary Dependencies**:
- existing: Vitest 5.0.5, Playwright 1.64.1, PostCSS 8.5.31, postcss-value-parser 4.2.0, Stylelint 17.16.0,
  Storybook 10.6.5;
- new explicit pin: `postcss-selector-parser`, at the version already in the lockfile, as a root devDependency for
  the specificity check (research R-11).

**Storage**: files: `src/base.css`, the generated `dist/base.css`, test fixtures.

**Testing**:
- `styles` (node; in mutation runs; excludes `test/browser/**`): build, source-level, pairs and readme tests.
- `styles-browser` (node and Playwright; excluded from mutation): every browser scenario (research R-09).
- `gates`: unit tests for the `lineHeight` option of `ocelle/token-only`, and the vitest-config test.
- `tokens`: the new tokens.
- `storybook` and `storybook-integration`: the four stories.

**Target Platform**: Chromium in tests (001 FR-005). The no-wrapper keyboard model of prose tables is guaranteed only
in Chromium hosts; WebKit hosts (Kitty Desktop on macOS and Linux) add `tabindex="0"` to tables in their renderer, an
open limitation for kitty-mission-ui (research R-06). Hosts under constitution IV's CSP, plus `font-src 'self'` for
the font (as in 002).

**Project Type**: library (pnpm workspace) plus repository gates.

**Performance Goals**: none beyond CI time. The `styles-browser` suite should take under 60 s; each phase's check task records its time in the phase review. Every mutation shard
stays within the 60-line entries of the mutation gate.

**Constraints**:
- No `@import`, no `url()`.
- No class selectors, and selector specificity within the bounds of FR-025.
- Line heights only as tokens.
- No monospace.
- The root font size is never set.

**Scale/Scope**: about 48 rules in one file, 4 hooks, 6 new tokens (109 to 115), about 40 browser scenarios plus
the guard plants.

## Constitution Check

*Pre-design and post-design: PASS. No new exception is taken. The two Storybook exceptions of 002 are unchanged and
cover the new stories, because they live in the same preview. Principle VIII's mutation-testing rule is met under a
reading the operator approved after the analysis (decision 19), not under an exception.*

| Principle | How this plan meets it |
|---|---|
| I. `ocelle-` names, no `sk-` | Hook attributes are `data-ocelle-*` and tokens `--ocelle-*`. The E-23/E-37/E-39 table in the README names kitty-mission-ui's exceptions by their ids, with no `sk-` names. The Prefix gate scans `packages/styles/**` and `dist/base.css` after the build. |
| II. Tokens only, brand rules | Every value is a token under `ocelle/token-only`. Line heights must be a single token reference in `packages/styles`: numbers, percentages, `calc()` and `normal` are raw there (R-07, with fail plants, a pass plant and unit tests). There is no monospace anywhere: `code`, `pre`, `kbd` and `samp` are set page-wide (FR-026), checked by the Prefix gate and by computed style. Links use `--ocelle-color-link`. Rules use `color-rule` and `color-rule-strong` only for decorative lines, never a control boundary. The one radius is `radius-2`. |
| III. Accessible by construction | The token focus ring is on every `:focus-visible` element, survives a missing `tokens.css` (longhands, R-05) and uses `Highlight` in forced colours, tested in a host region with `forced-color-adjust: none` where the rule is observable. A focused prose table shows an inset ring, all four sides visible when flush with the viewport (WCAG 2.4.7). No motion. `--ocelle-target-min` is kept under compact on `<html>`. Prose links are underlined (WCAG 1.4.1). Code, inline code and URLs reflow (1.4.10), and tables are contained so that they do not widen a grid or flex column (1.4.10, tested in grid and flex hosts); the README and spec state that a prose container gets its width from its context, tested in a definite-width modal dialog (operator decision PLAN-FRESH-2-001 (a)); the README states that rule by its cause, sizing from content, with the shrink-to-fit boxes as examples (PLAN-FRESH-3-003). Overflowing tables are keyboard-scrollable (2.1.1) in Chromium hosts; WebKit hosts add `tabindex="0"`, documented as an open limitation (R-06). The caption wraps inside the visible box, every line box asserted (1.4.10), starts at the start edge and stays inside the visible box when the table is scrolled, under `ltr` and `rtl`, each part with a plant that bites alone (operator decision PLAN-FRESH-3-001 (a)). Print is out of scope and stated in the README (PLAN-FRESH-3-002 (b)). Table semantics, including the cell-to-header association, are tested on the accessibility tree (R-06). Every colour pairing the families create is an existing checked pair, asserted by a test (R-08); the value hook is documented as main grounds only, because `ink` on the chrome is 1.00:1. Axe stays with #10, as in 002: the four new stories have no axe run, under 001's recorded exception "Storybook build, visual regression and axe gates absent" (001 plan, Complexity Tracking), whose sunset is the merge of #10. |
| IV. Strict CSP, offline | An external stylesheet with no `@import`, `url()` or inline style; it needs no `img-src`. The media fixture `page.html` alone adds `img-src 'self'` for its local image, the directive a host needs for its own images, and keeps zero violations (operator decision PLAN-FRESH-2-003 (b), R-09). Fixtures and stories have no style attribute; their layout comes from a served fixture stylesheet and a story-only stylesheet (R-09, R-12). The browser suite asserts zero violations under the strict header, with a control violation. |
| V. Storybook | One story per family under the 002 Storybook and its CSP test (R-12). `base.css` is linked for the whole preview, so element stories and their baselines always render with it (operator decision PLAN-FRESH-2-004 (a)). Baselines and visual regression stay with #10: the four new stories have no visual baseline, under 001's recorded exception "Storybook build, visual regression and axe gates absent" (001 plan, Complexity Tracking), whose sunset is the merge of #10. |
| VI. Consumer-driven, own code | #6, spec-kitty-design #519, #531 and #535, and kitty-mission-ui's E-23, E-37 and E-39. The CSS is our own; no reset library is copied. |
| VII. Semver | `base.css`, the four hook attributes and their exact values, and six new tokens are additions: MINOR. `@ocelle/styles` names the tokens version it needs as an exact `peerDependencies` entry (`workspace:0.0.0`, R-01) and in the README. Both CHANGELOGs get entries, and the README documents the hooks, their values and their placement limits (R-14). |
| VIII. Test-first, non-vacuous | Each phase starts red, Setup's Vitest config change included (the vitest-config test changes first). The build script, the new token-only branch and `renderFamily` are mutation-tested, with unit tests that kill their mutants (R-07, R-12). "Changed source is mutation-tested" is read as the mutation gate's scope, 001 FR-028 (TypeScript), a reading the operator approved (decision 19, analysis finding C1, 2026-11-09, human:jeroennouwsdev: "(b) Approved reading (Recommended)"). It is a reading, not an exception. The CSS of `packages/styles/src/*.css` is outside that scope and is covered instead by the source-level checks, the browser tests and the named plants that prove each guard can fail (R-10, R-11): each source-level guard shares its test with a positive assertion over the same parse (R-11), and every guard is proven able to fail by a named plant, or has a recorded reason why no CSS plant exists in Chromium (list semantics, R-10). The new style-lint option has fail plants and a pass plant. |
| Workflow gates | No gate added or renamed; the registry is unchanged. |

## Decisions the operator should see at the plan gate

1. **Hook names** (R-02): `data-ocelle-density` (`compact`, `regular`), `data-ocelle-value` (empty, `ink`),
   `data-ocelle-prose`, `data-ocelle-wrap` (`anywhere`). These are public surface.
2. **Token names** (R-08): `line-height-compact`, `line-height-prose`, `font-size-subhead` (18 px; not `font-size-h2`,
   so elements can use it), `measure-reading`, `measure-cell` and `measure-container` (`100cqi`) in the shell group.
   The caption's `100cqi` is a token, not a lint exemption: FR-002 admits no literal length, so the token-only lint is
   not changed for container units (PLAN-FRESH-2-002).
3. **Specificity by `:where()` rather than `@layer`** (R-03), so any rule of the host page's own stylesheets wins
   whether or not the host uses layers (a custom element's `:host` rules do not; decision 16, R-12).
4. **Heading weights and sizes** (data-model): `h1` 30 px display weight (800); `h2` 18 px strong (600); `h3` 17 px
   strong; `h4` to `h6` 16 px strong.
5. **Table mechanism to be measured in a spike** (R-06): `display: block; overflow-x: auto; container-type: inline-size`
   on the table, with cells at a 12ch floor and a sticky, start-aligned caption capped at
   `--ocelle-measure-container` (PLAN-FRESH-2-002), each of its three parts tested by an assertion that its own
   plant fails (PLAN-FRESH-3-001 (a), R-10). If Chromium drops table semantics or ignores the floor, the phase stops and the operator decides
   on the wrapper fork of FR-017.
6. **New pin** `postcss-selector-parser` for the specificity check (R-11).

Decided by the operator at squad round 1 (2026-11-09, human:jeroennouwsdev):

7. **WebKit hosts** (PLAN-A11Y-SECURITY-1-002 (a)): the no-wrapper keyboard model is guaranteed only in Chromium
   hosts. WebKit hosts add `tabindex="0"` to tables in their renderer; an open limitation for kitty-mission-ui (spec
   Assumptions, README, R-06).
8. **Inset table ring** (PLAN-A11Y-SECURITY-1-003 (a)): a focused prose table draws its ring at
   `calc(var(--ocelle-focus-width) * -1)` (FR-017, R-06).
9. **Value hook on the main grounds only** (PLAN-A11Y-SECURITY-1-004 (a)), documented in FR-013, the README and the
   contract.
10. **Exact hook values** (PLAN-CORRECTNESS-1-002 (a)): `[data-ocelle-prose=""]`, `[data-ocelle-value=""]` and
    `[data-ocelle-value="ink"]`; `"true"` does nothing (R-02).
11. **Peer dependency** (PLAN-CORRECTNESS-1-012 (a)): `"@ocelle/tokens": "workspace:0.0.0"` in
    `packages/styles/package.json` (R-01).
12. **Prose not on `<html>`** (PLAN-FRESH-1-010 (b)): the container rule is scoped `:where(:not(html))` and the
    README says the hook goes on a content container (R-02).
13. **Forced-colours ring rule kept** (PLAN-TESTABILITY-1-006 (b)) as defence for host regions with
    `forced-color-adjust: none`, and tested there (R-05).

Decided by the operator at squad round 2 (2026-11-09, human:jeroennouwsdev):

14. **Containment kept, host width documented** (PLAN-FRESH-2-001 (a)): a prose container must not be sized from its
    content (shrink-to-fit or fit-content sizing); it gets its width from its context. The spec, README, contract
    and research state that cause and give the shrink-to-fit boxes as examples, not as a complete list: a modal or
    non-modal `<dialog>`, a popover, a fixed or absolutely positioned panel without both inline insets or a width,
    `inline-block`, a float, a `display: table-cell` box, a default item of a row flex container, and a grid or flex item aligned to
    start; a host gives such a box a definite width or stretches it (spec Edge Cases, FR-004, FR-017, README,
    contract; PLAN-FRESH-3-003). `prose-hosts.html` gains a definite-width modal dialog host, and the readme test
    asserts the cause sentence, not the list (R-06, R-14).
15. **Image CSP for the media fixture** (PLAN-FRESH-2-003 (b)): `page.html` is served under the strict CSP plus
    `img-src 'self'`, its image loads and it reports zero violations; serve.ts serves `.svg` (spec US1-5, US1-10,
    SC-001, R-09).
16. **Custom-element hosts and the Storybook preview** (PLAN-FRESH-2-004 (a)): `base.css` styles every element's
    host (`box-sizing`, and the ring on a focusable host), which the element's `:host` rules cannot override. For
    #7 to #17: elements put their focusable part inside the shadow root or use `delegatesFocus`, and do not depend
    on their host's `box-sizing`. `base.css` stays linked in the whole Storybook preview, so element stories and
    their baselines always render with it (spec Edge Cases, FR-004, Assumptions; R-12, R-14; contract).

Decided by the operator at squad round 3 (2026-11-09, human:jeroennouwsdev):

17. **Caption in view and at the start edge, tested** (PLAN-FRESH-3-001 (a)): the caption rule keeps
    `position: sticky; inset-inline-start: 0` and `text-align: start`, and both are required and tested (spec FR-017,
    US3-3, US3-9): at `scrollLeft` 0 every caption line box starts at the table's visible start edge (within 1 px),
    and after two ArrowRight presses, and at the most negative `scrollLeft` under `dir="rtl"`, every line box still
    lies inside the visible box. A line box is the `Range.getClientRects()` rects merged per line (same `top`;
    smallest left, largest right), since the browser gives one rect per text-direction run and a trailing full stop
    under `rtl` is a rect of its own (R-06). R-10 has three caption plants that each bite alone: `position: static`,
    `text-align: center` and `max-inline-size: none`; the spike records all three (R-06 step 5).
18. **Print out of scope** (PLAN-FRESH-3-002 (b)): `base.css` has no print rule. The spec Assumptions, the README
    (Markdown renderers) and the contract state that prose tables are screen scroll boxes, so a printed document
    shows only the columns that fit the page and a host that prints adds its own print rule; the readme test asserts
    the statement in phase 4 (R-14).

Decided by the operator after the analysis of the tasks (2026-11-09, human:jeroennouwsdev):

19. **Mutation scope of constitution VIII** (analysis finding C1, "(b) Approved reading (Recommended)"): VIII's
    "changed source is mutation-tested" means the mutation gate's scope, 001 FR-028 (TypeScript;
    `gates/lib/mutation/ranges.ts` `scopePathspecs`). The CSS of `packages/styles/src/*.css` is not in that scope
    and has no mutation tool in the pinned stack; it is covered instead by the source-level checks (R-11), the
    browser tests (R-09) and the named plants that prove each guard can fail (R-10, R-11). This is a reading of the
    principle, not an exception, so Complexity Tracking gains no row (Constitution Check VIII, contracts/checks.md
    § Mutation scope).

## Project Structure

### Documentation (this feature)

```text
specs/003-base-styles/
├── spec.md, plan.md, research.md, data-model.md, quickstart.md
├── contracts/styles-package.md, contracts/checks.md
├── sources/spec-kitty-design-issues.md
├── checklists/requirements.md
└── reviews/ (spec checks, squad rounds, phase reviews)
```

### Source Code (repository root)

```text
packages/styles/
├── src/base.css                 # new: the stylesheet
├── src/index.ts                 # unchanged (exports nothing)
├── scripts/build.ts             # new: buildPlan(css) + build (write dist/base.css)
├── package.json                 # build script, ./base.css export, files, peerDependencies @ocelle/tokens
├── README.md, CHANGELOG.md      # new
└── test/
    ├── sample.test.ts           # unchanged
    ├── build.test.ts, source.test.ts, pairs.test.ts, readme.test.ts   # new (styles project)
    ├── browser/serve.ts + *.test.ts                      # new (styles-browser project)
    └── fixtures/*.html, fixtures/layout.css, fixtures/media.svg, fixtures/plants/*.css     # new
packages/tokens/
├── src/source.ts                # six new records
├── test/expected.ts             # six transcribed entries (measure-container: width 1000)
├── test/browser/values.test.ts  # probe block gains container-type: inline-size (R-08), so 100cqi is 1000px, not 1280px
└── README.md, CHANGELOG.md      # new tokens; color-scheme sentence names base.css
gates/stylelint/token-only.ts    # lineHeight: "token" option (validateOptions, optionLists, value check)
gates/test/token-only.test.ts    # unit tests for the option (token-only-parts.test.ts if rawValues changes)
gates/test/vitest-config.test.ts # styles-browser excluded from mutation; owner of packages/styles/test/browser
gates/plants/style-lint/fail-styles-{literal,percent,calc,normal}-line-height/, pass-styles-line-height-token/
gates/plants/style-lint/pass-line-height/   # moved to tree/packages/elements/src/x.css, why updated
stylelint.config.ts              # override for packages/styles/**/*.css
vitest.config.ts, vitest.mutation.config.ts   # styles-browser project; styles excludes test/browser; mutation exclusion
package.json, pnpm-lock.yaml     # postcss-selector-parser pin
storybook/scripts/swatches.ts, .storybook/preview-head.html, stories/render.ts, stories/base.stories.ts, test/**
storybook/.storybook/preview.css           # narrowed to the error display
storybook/.storybook/stories-layout.css    # new: story layout only, imported by preview.ts
storybook/stories/base-content.json        # new: the stories' prose text, outside mutation scope
```

**Structure Decision**: the styles stay in `packages/styles`, the existing workspace package. There is no new
package and no new gate.

## Phases (user stories) for `/speckit-tasks`

1. **Setup**:
   - the `styles-browser` Vitest project, the `styles` project's exclusion of `packages/styles/test/browser/**`, and
     the mutation exclusion of `styles-browser`. Not exempt: `gates/test/vitest-config.test.ts` changes first and is
     shown failing (the excluded list gains `styles-browser`; `packages/styles/test/browser/*.test.ts` belong to
     `styles-browser` only), then the config (research R-09);
   - exempt, no behaviour: the `postcss-selector-parser` pin; `packages/styles/package.json` (build script, export,
     files, and the `@ocelle/tokens` peer dependency, which the pins gate checks); empty `src/base.css`; a
     `scripts/build.ts` stub.
2. **US1 Base layer** (P1):
   - **spike**: measure the table mechanism of R-06 (with `container-type: inline-size`, the host layouts, the
     definite-width dialog host, the caption's line boxes at `scrollLeft` 0 and scrolled, under `ltr` and `rtl`,
     and the AX-tree structure), the CDP accessibility tree access,
     the forced-colours ring in a `forced-color-adjust: none` region (R-05), the list-semantics plants (R-10), and that
     each plant of R-10 bites; record them;
   - `buildPlan(css)` and build with tests, and the source-level checks, each paired with its positive assertion,
     with their plants and boundary strings (R-11);
   - the line-height lint option with its unit tests, its fail plants and pass plant, and the move of
     `pass-line-height` to `packages/elements` (R-07);
   - `serve.ts` (with `page.html`'s added `img-src 'self'` and the `.svg` type), `layout.css`, `media.svg` and the
     base fixture, then the browser tests for US1 scenarios 1 to 10 with their guard plants;
   - the base layer in `base.css`;
   - the README and CHANGELOG of styles with the readme test's phase-2 statements (link order, CSP, tokens version,
     base layer, custom-element hosts, the CHANGELOG `base.css` entry), and the tokens README `color-scheme` sentence;
   - the Storybook "Base page" story, with `writeGenerated`, the preview-head link, the narrowed `preview.css`,
     `storybook/.storybook/stories-layout.css` (imported by `preview.ts`), `base-content.json` and the
     `renderFamily` cases of `render.test.ts`.
3. **US2 Compact** (P2): the token `line-height-compact` (source, expected, CHANGELOG, README); the compact and value
   rules; browser tests for US2 scenarios 1 to 3 (the undocumented-value case included), scenario 4 without its `h1`
   half, and the nested `regular` regions of FR-004 (scenario 5 needs prose, so phase 4 tests it); the "Compact screen"
   story; the readme test's density and value statements (values, the main-grounds limit of the value hook, the
   CHANGELOG attribute names), red first.
4. **US3 Prose** (P3): the tokens `line-height-prose`, `font-size-subhead`, `measure-reading`, `measure-cell` and
   `measure-container`, with the `values.test.ts` probe block made a query container first (its `width` 1000 entry
   is red against the unchanged harness, which gives 1280px; R-08); the prose rules; browser tests for US3 scenarios 1 to 12 (the grid and flex hosts, the
   definite-width dialog host, the inset ring, the long caption's line boxes (inside the box and at its start edge
   at `scrollLeft` 0, inside it when scrolled, under `ltr` and `rtl`), the `<a id>` target, the undocumented
   value and `prose-root.html` included), the `h1` half of US2 scenario 4 and the nested cases of US2 scenario 5;
   `pairs.test.ts` (R-08); the "Prose document" story; the readme test's prose
   statements (values, prose over compact, the `<html>` placement, the host-width cause sentence, tables of three or
   more columns, the WebKit limitation, print out of scope), red first.
5. **US4 Identifier wrap** (P4): the wrap rule; browser tests for US4 scenarios 1 to 4 and the FR-020 source check;
   the "Identifier wrap" story; the readme test's wrap statements and the SC-006 stand-in table, red first. US1
   scenario 6's documentation half is complete only here.

Each phase is folded after its approval (`/ocelle-run` step 4.3).

## Complexity Tracking

No new exception. 002's exceptions 1 (Storybook page CSP host additions) and 2 (narrowed static scope of the
Storybook build) apply unchanged to the four new stories. They are still reviewed when #10 extends this Storybook.
001's exception "Storybook build, visual regression and axe gates absent" (sunset when #10 merges) covers the
missing axe runs and visual baselines of the four new stories (Constitution Check III and V).

CSS outside mutation testing has no row here: the operator approved it as a reading of constitution VIII (the
mutation gate's 001 FR-028 scope), not as an exception (decision 19, Constitution Check VIII).
