---
phase: 3
round: 1
verdict: approved
base: a9a46eba8daaa829db350bef920d6e46d3618a30
head: 8d39af9952b8b1959f2e75988a22e47b7b6780ae
tdd_check: pass
---

# Phase 3 review, round 1

Scope: `git diff a9a46eb..8d39af9` (scaffold `4d0dc28`, red `39df391`, green `d19a05e`, check outputs `8d39af9`). The
working tree had no uncommitted change. I judged the change against spec.md US2-1 to US2-8, FR-019 and the common
FRs (FR-001 to FR-008, FR-031), research.md R-04 and R-07 as amended in `a9a46eb` (operator decision 5), tasks.md
Phase 3 (T026 to T032), the constitution and operator decisions 4 and 5.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | packages/elements/src/ocelle-page-header.ts:102-105 vs packages/elements/src/ocelle-section-header.ts (its `display: block` group) | The page header leaves `::slotted([slot="heading"])` out of the `display: block` group. The section header keeps it there. notes.md gives the reason: the slot takes a heading element, which is already a block, so no plant could catch the declaration. The README states that rule ("slot one heading element (`h1` to `h6`)"). A page that slots an inline element as the heading (for example a `span` with `role="heading"`) would get an inline heading in the page header but a block one in the section header. FR-019 does not cover that case, and no scenario requires it. | None. Recorded so that phase 4 and 5 make the same choice on purpose. |
| R1-02 | note | specs/011-layout-headers/reviews/phase-3/notes.md § Checks at the green state | notes.md records `gate:csp` as 21 files and `gate:prefix` as 250. At HEAD I got 22 and 252. The difference matches the files `8d39af9` added after the notes were written. Both gates pass. | None. |

There are no blocking findings.

## Test quality

- **Red/green check.** `tdd-check.json` reports `pass`, with no problems. Base exit 2, scaffold exit 1, head exit 0,
  one red commit (`phase`, `39df391`, exit 1).
- **Red evidence.** In `red-phase.log`, 86 of 3379 tests fail, and every failure is an `AssertionError`. None is a
  load, import or setup error. The scaffold (`4d0dc28`) adds only the class `OcellePageHeader extends LitElement {}`
  and the regenerated manifest entry. It adds no definition, property, style, template or test file, and the final
  tests fail against it (`check-final-tests-on-scaffold.log`).
- **No weakening.** `git diff 39df391..HEAD` touches no test file in `packages/elements/test`, `storybook/test` or
  `gates/test`, so the tests at HEAD are the red commit's tests.
- **Shared scenarios.** All 18 bodies in `test/scenarios/page-header.ts` run in both harnesses: in process
  (`test/page-header.test.ts`) and on the strict-CSP fixture with the browser build
  (`test/browser/page-header.test.ts`, which also asserts a clean CSP and request log).
  - Each body returns one observation compared with `toEqual` against values written by hand from the spec. I found
    no conditional assertion, `skip`/`only`, snapshot or mock.
  - The one ternary, in the many-actions scenario (line 546), yields a value that fails the equality, so it does not
    skip the assertion.
- **Story coverage.** Every acceptance scenario has a body:
  - US2-1, with the `h2` case and no `h1` anywhere;
  - US2-2 in both themes, LTR and RTL, with `span` and `p` eyebrows and a `p` description;
  - US2-3, compact, which also checks 24 px;
  - US2-4;
  - US2-5 at 320 px, checking scroll width, clipped text, wrapping, and actions at the inline start `--ocelle-space-2`
    under the description;
  - US2-6, tab order with no added tab stop;
  - US2-7 in forced colours with both palettes, where the compact layout holds;
  - US2-8, all three headers, including that the heading-less ones expose no heading node.
- **Other required cases.** FR-006 has its empty/invalid case and its upgrade/property case, as T026 requires. There
  are also a token-sentinel body, a no-event body, a hidden-host/border-box body and a six-actions-at-320-px body.
- **The R1-02 lesson from phase 2.** The scenario at lines 418-455 uses 300 px containers. It covers actions only,
  eyebrow plus actions, heading plus actions, and description plus actions, with actions that fit on one line but not
  beside a `--ocelle-space-4` gap. Its paired plant ("the heading column never hidden", `plants.md`) fails it in both
  harnesses. The source hides the column while `heading` and `description` are both empty (ocelle-page-header.ts:165,
  170), and the actions then take `margin-inline-start: auto` (line 94), as amended R-04 and R-07 require. The lesson
  is not repeated.
- **Plants (T032).** `plants.md` covers 46 declarations and the 2 grouped selectors. Each one fails at least one
  scenario in each harness. The CSP plant fails only on the fixture, which is where the strict policy is served, so
  that is expected. All 18 pairing plants of contracts/checks.md for US2 fail their scenarios. The control run fails
  nothing. One gap found before the red commit (the `description` selector in the `display: block` group) was closed
  by adding a `span`-description twin to the sentinel scenario before red. No equivalent records.
- **Mutation.** I ran `pnpm run gate:mutation -- --base a9a46eb` myself: "29 mutants on the changed lines of 2 files,
  none survived; 0 timeouts, 3 compile errors, 1 zero-mutant entry; 0 equivalent records". The 3 compile errors are
  bodies emptied where the type needs a value. The zero-mutant entry is `src/index.ts`, whose changed line is an
  export.

## Checks run

All checks ran at `8d39af9` with `OCELLE_CHROMIUM_PATH` set to Chromium 1243 and docker 29.9.2 running; podman is
absent.

| Check | Result |
|---|---|
| `gate:typecheck` | no type error |
| `gate:lint` | 289 files, no finding |
| `gate:style-lint` | 17 files, no finding |
| `gate:test-lint` | 194 files, no finding |
| `gate:manifest` | 5 elements checked, no finding |
| `gate:csp` | 22 files, no finding |
| `gate:prefix` | 252 files, no finding |
| `gate:pins` | 5 manifests, no finding |
| `gate:config-copies` | identical |
| `gate:storybook-build` | built 38 stories |
| `gate:axe` | 76 story-theme runs, 0 serious or critical; 10 notes (0 incomplete, 10 excepted, all on the Prose document as before) |
| `gate:visual -- --engine docker` | "76 captures match their baselines (docker only: no cross-engine comparison)" |
| `gate:mutation -- --base a9a46eb` | 29 mutants, none survived (see above) |
| `gate:plants` (no `--skip-container`, `OCELLE_VISUAL_ENGINE=docker`) | "301 plants of 17 gates and the registry judged, every plant as expected" |
| `gate:signoff -- --range a9a46eb..HEAD` | 4 commits checked, no finding |
| `pnpm test` | 3379 tests passed in 152 files |

**Baselines (operator decision 4).**

- The phase adds exactly 10 PNGs and changes or removes none. They are `storybook/baselines/elements-ocelle-page-header--{heading-only,filled,compact,empty-heading,long-heading}.{light,dark}.png`, the five page-header stories in two themes. `storybook/baselines` now holds 76 files, matching the 76 story-themes.
- They were made under docker in #10's pinned container. No podman cross-check was possible, and notes.md records that, as the decision requires. CI confirms them at landing.
- `gate:visual` under docker matches all 76 captures against them.
- I inspected `filled.light`, `long-heading.dark` and `empty-heading.light` against the element as built:
  - the eyebrow sits above the heading;
  - the actions sit at the inline end with their block start at the heading's;
  - the rule runs under the band, with no ground of the header's own;
  - the 60-character heading breaks inside the band, and the actions move under the description at the inline start;
  - with an empty heading, the description sits one small gap under the eyebrow.
- The `visual/fail-token-changed` plant gains the four light page-header story-themes that show `color-ink`, and `gate:plants` judges it as expected.

**Tasks.** T026 to T032 and T028a are ticked, and their work is present:

- the scenarios, harnesses, entry, manifest, build and pack tests;
- README statements of FR-036, one assertion each, and the CHANGELOG MINOR entry;
- the pinned lists re-listed in notes.md and changed in the red commit;
- the element, its `exports` entry in the pinned place and the root export (`src/browser.ts` imports `./index.ts`, so it needs no change);
- the five stories, baselines, README section and Entry points row;
- `plants.md`.

The changes outside `packages/elements` are each given a reason in notes.md: the gate tests' pinned counts, the gate plants' manifest and storybook-build copies, the visual plant list, and the 320 px story pass strengthened with an upgrade assertion.

**Constitution and plan.**

- Naming and events: the element is `ocelle-` named and has no event, I/O, tab stop, heading or landmark. The band is a `div`, not a `<header>`.
- Tokens: the styles use tokens only. Colour rules sit inside `@media not (forced-colors: active)`, and the size and layout rules sit outside it.
- Borders and directions: the rule is a border, and every position is logical.
- No shadow-root ID references, and no `style` attribute in the template or stories.
- Variants: `size` is reflected with no initial value. Only `"compact"` matches a rule, so empty and invalid values draw regular and are kept as written.
- R-07: implemented as amended (padding, rule, `box-sizing`, no ground, the heading column's `gap`, R-04's wrap rule with `flex: 0 1 auto` on the actions, the hidden empty column and `margin-inline-start: auto`). The no-ground rule is asserted as a transparent computed `background-color` rather than declared. notes.md gives the reason, and I accept it: `background: none` is the initial value, so no plant could catch the declaration.
- FR-019: fonts, sizes, colours, gaps and padding match, and the scenarios assert each one.

## Earlier findings

None: this is round 1 of phase 3.
