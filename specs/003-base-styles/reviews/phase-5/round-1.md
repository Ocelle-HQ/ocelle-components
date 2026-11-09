---
phase: 5
round: 1
verdict: changes_requested
base: 523c5ce0cb9d3444ffe9b4d4292c2996b7801fa1
head: 681a47351fb80fb0f53c42d11a668f284986846f
tdd_check: pass
---

# Phase 5 review, round 1

Scope: `git diff 523c5ce..681a473` (scaffold bb47742, red f6434c2, green c6f8403, records 681a473), plus the
re-run `tdd-check.sh 5` outputs in the tree (only `head` and timing lines changed, committed with this review).

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | packages/styles/test/readme.test.ts:24-80; packages/styles/README.md:46-48, 171-174 | This phase is meant to complete the readme test ("The readme test passes in full", tasks.md:357). R-14 says the test "checks each statement" (research.md:633-640). Two FR-004 statements that the README carries are not asserted anywhere. (a) FR-004 "what each family styles and the tokens it uses": the base layer is a family (spec Key Entities; README "Base layer"), and its token list (`Tokens it uses: --ocelle-color-scheme, ...`, README:46-48) has no fragment. Only the summary sentence (readme.test.ts:40) is asserted. The compact, prose and wrap token lists are asserted. (b) FR-004's host-width item ends "and that a host gives such a box a definite width or stretches it", and also requires the examples to be given "not as a complete list". The cause sentence is asserted (readme.test.ts:68), as plan decision 14 requires. The remedy sentence "Give such a box a definite width or stretch it" (README:173-174) and the "not a complete list" qualifier (README:171) are not asserted. Either one could be deleted from the README and every test would still pass. Every other FR-004 item and the CHANGELOG requirement were checked and are asserted (see Test quality). | Add fragments to readme.test.ts for the base layer's token sentence and for the remedy sentence, with the "not a complete list" qualifier. Assert the qualifier on its own, so that the example list itself stays unasserted, as plan decision 14 wants. |
| R1-02 | blocking | storybook/stories/base-content.json:61 (rendered by storybook/stories/render.ts:178-179) | Constitution II: "digests are shown in groups of four". The Identifier wrap story labels its 120-character hex identifier "Digest" and shows it ungrouped, in the grid and again with the value hook ("keeps tabular figures"). Storybook is the visual source of truth (constitution V), so the story shows consumers a digest presented against the brand rule. Using an unbroken hex string is sound in itself (a hyphenated slug would break at its hyphens without the hook). Only the label makes it a digest. | Label the identifier as an id rather than a digest (for example "Run id"), or show a real digest in groups of four elsewhere. Do not change the unbroken 120-character identifier. If the story text changes, update the render/stories tests to match. |
| R1-03 | note | packages/styles/test/fixtures/wrap.html:14, 18, 22, 25 | The test fixture uses the same "Digest" / "The digest of the run is" wording. This is test-only markup with no visual baseline, so it is not blocking. Aligning it with R1-02 would keep the wording consistent. | Optional. |
| R1-04 | note | packages/styles/README.md:186 | "mission slugs, ids, digests and paths". A digest shown in groups of four (constitution II) has break opportunities of its own, so it is not the identifier this hook exists for. This is harmless, but it is a weak example. | Optional: drop "digests" or qualify it. |
| R1-05 | note | packages/styles/test/browser/wrap.test.ts:96-110, 114-125, 166-185 | The implementer's 320 px / 200% zoom choice. Spec Edge Cases ("identifiers with the hook reflow without horizontal page scroll") and the US4 Independent Test are met by a per-element proof. At 1280 px, 320 px and 640 px at scale 2 (200% zoom of a 1280 px window, the convention of pages.ts:17 used since phase 4), every line box of each hooked identifier is checked. Each must lie inside its own box (cell or paragraph) and inside `window.innerWidth`, and the hooked grid's two columns must sum to 300 px. A hooked element whose line boxes all lie within the viewport cannot cause horizontal page scroll. The red run shows the check fails without the rule (lines outside the cell and paragraph). A document-level `scrollWidth` assertion is impossible on this page, because the unhooked comparison grid widens it by design (spec US4-1 needs both grids in the same test). I accept the choice. | None. |
| R1-06 | note | packages/styles/test/browser/wrap.test.ts:60 | The `clipped` check (`scrollWidth > clientWidth + 1`) is vacuous for the inline spans `prose-id` and `compact-id`: both values are 0 for an inline box. Other checks cover those spans: the line-box containment checks, plus `text-overflow` and the multi-line check. The check does bite on the block cell `hooked`, which is where the ellipsis plant applies. | None. |
| R1-07 | note | storybook/.storybook/stories-layout.css:9-14 | The story grid's literal `300px` sits outside the style-lint scope (stylelint.config.ts covers `packages/**` only). research.md R-12 (research.md:563-566) puts the 300 px grid of this story in this story-only layout sheet, so this follows the plan. It is story layout, not library styling, so constitution II's tokens-only rule for library styles is not broken. | None. |

## Test quality

- **Red evidence.** `red-phase.log` (f6434c2, not amended) shows 25 of 2005 tests failing, every one an
  `AssertionError` on missing behaviour:
  - US4-1 to US4-4 in light and dark: `overflow-wrap: normal`, the column about 1094 px against 47 px, one line;
  - the two source tests: no wrap rule in the parse;
  - ten readme/CHANGELOG tests: the fragments, hook-table row and SC-006 table absent;
  - render/stories/csp tests: the scaffold renders `""`.

  No failure is a setup, import or syntax error.
- **Weakened tests.** `git diff f6434c2..HEAD` touches no test, fixture or plant file. Only the review logs changed
  after the red commit.
- **Scaffold.** bb47742 adds the `Family` member, the `WrapContent` type, an empty `renderFamily("wrap")` branch and
  the story text data. It adds no behaviour and no test file. `tdd-check.json` shows the final tests exit 1 on the
  scaffold and on the base.
- **Vacuity.** No `skip`/`only`, no conditional assertion, no snapshot and no swallowed error. Each guard shares its
  test with its positive assertion and has a plant that is asserted to bite:
  - `wrap-ellipsis` (US4-1, absent ellipsis);
  - `wrap-all` (US4-2, opt-in; it also equalises the unhooked columns);
  - `wrap-presence` (FR-005, `"true"`);
  - `wrap-copy` (US4-3, copied text);
  - the four FR-020 plant strings and two boundary strings in `source.test.ts:286-300`.

  The copy check uses `Selection.toString()`, which does reflect rendered text changes: the `text-transform` plant
  bites.
- **Scenario coverage.** In both themes under `emulateMedia({ colorScheme })`:
  - US4-1 (wrap, column within 1 px, no ellipsis, unhooked wider, at 1280/320/200%);
  - US4-2 (hooked `anywhere`, unhooked and `"true"` `normal`);
  - US4-3 (more than one line, copied text equals source);
  - US4-4 (16/26.4 px in prose, 14/21 px in compact, plus containment at 320 px and 200%).

  SC-005 is covered by US4-1. FR-020's MUST NOT list is covered by the source test. The Storybook story is covered
  by the render, stories and csp tests (the csp test also checks the grid columns, the wrap and the value-hook
  font). There is no event or keyboard path in this family.
- **FR-004 audit (requested).** Asserted:
  - the link order and the CSP;
  - each hook's attribute and values: the hook table is now asserted exactly with four rows, and the `regular`
    reset is asserted;
  - other values, `"true"` among them, have no effect;
  - what the compact, prose and wrap families style and their tokens;
  - what the base layer styles, in summary;
  - prose over compact;
  - the tokens version, matched against package.json;
  - the main-grounds limit;
  - the content-container placement;
  - the host-width cause sentence;
  - print;
  - custom-element hosts;
  - the WebKit limitation;
  - the CHANGELOG entry naming `base.css` and exactly the four hooks, in order;
  - the SC-006 table, exactly.

  Not asserted: the base layer's token list, and the host-width remedy sentence with its "not a complete list"
  qualifier (R1-01). US1 scenario 6's own documentation items (link-first, the four hooks with values, the
  CHANGELOG) are all asserted.
- **Mutation.** `pnpm run gate:mutation -- --base 523c5ce` ran 11 mutants on the changed lines of
  `storybook/stories/render.ts`. None survived, and the command reported 0 equivalent records. `base.css` is CSS and
  is outside the mutation scope; its guards are the plants above.

## Checks run

Container Node 22.23.4 (not the pinned 26.13.0); Chromium from the given `PLAYWRIGHT_BROWSERS_PATH`; one job at a
time.

| Check | Result |
|---|---|
| `pnpm test` | 2005 tests passed in 96 files |
| `gate:typecheck` | no type error |
| `gate:lint` | 170 files, no finding |
| `gate:test-lint` | 111 files, no finding |
| `gate:style-lint` | 2 files, no finding |
| `gate:prefix` | 132 files, no finding |
| `gate:csp` | 23 files, no finding |
| `gate:contrast` | 158 pairs in light, 157 in dark |
| `gate:brand-rules` | 7 rules checked, pass |
| `gate:config-copies` | identical |
| `gate:pins` | 5 manifests, no finding |
| `gate:mutation -- --base 523c5ce` | 11 mutants, none survived, 0 equivalent records |
| `gate:plants` (alone, after mutation finished) | 182 plants of 13 gates and the registry, every plant as expected |
| `tdd-check.sh 5` (run before this review) | `pass`: red exit 1, final tests on base and scaffold exit 1, HEAD exit 0 |

Axe and visual regression are absent under 001's recorded exception (sunset #10), as in the earlier phases.

Other items checked, with no finding:
- **Tasks.** T044 to T051 are ticked and their work is present: `base.css:225-232`, the last rule, which
  `source.test.ts:201` asserts; the README and CHANGELOG; the story; `checks.md`. No file outside this phase's scope
  changed.
- **Constitution.**
  - I: `data-ocelle-wrap`; the E-ids are named with no `sk-`.
  - II: the wrap rule uses no token, only the `anywhere` keyword. The brand-rule issue in the story is R1-02.
  - III: reflow at 320 px and 200% zoom.
  - IV: 0 CSP violations in the fixture and the story.
  - V: the story is in both themes.
  - VII: CHANGELOG entry.
  - VIII: as above.
- **Plan.** The plan is followed: data-model § Rule table (one rule, last, (0,1,0)), R-10's plants, R-12's story
  sheet and R-14.

## Earlier findings

None: this is round 1 of phase 5.
