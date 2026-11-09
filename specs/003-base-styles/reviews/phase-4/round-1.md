---
phase: 4
round: 1
verdict: approved
base: 752a61d6ef1fbf4c92fff20e566c3760cddceb5f
head: 881b7003255b65edff39cdb0c535cf878da11087
tdd_check: pass
---

# Phase 4 review, round 1

Scope: `git diff 752a61d..881b700` (scaffold dd136cf, red e88228b, green 0586539, records 881b700) plus the uncommitted
re-run of `tdd-check.sh 4` (timings in the four `check-*.log` files and the `head` field of `tdd-check.json` moved from
0586539 to 881b700; status and exit codes unchanged).

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | packages/styles/test/fixtures/prose.html:31-42; prose.test.ts:579-617 | Judgement call 2. T033 and US3-5 ask for "the same fixture" outside the container; the copies outside it and in the `"true"` container hold only the five elements US3-5's Then-clause names (`h1`, `h2`, `p`, `table`, `th`). The scenario's assertions are all made, both guards have their plants (`prose-page`, `prose-presence`) and they bite. The scoping of the other FR-014 elements (`a`, `code`, `pre`, `blockquote`, lists, `caption`, `hr`) is not observed outside the container in the browser; it rests on source.test.ts:89-177 and 193-196, which require every prose rule, in order and with exact declarations, to start with `[data-ocelle-prose=""]`. A full copy would make the page scroll at 320 px (an unstyled 12-column table) and blind every page-scroll assertion, so the reduction is reasoned and recorded in the test header (prose.test.ts:12-15). Accepted. | None. |
| R1-02 | note | packages/styles/test/browser/prose.test.ts:635-650 | Judgement call 3. The positive half asserts that an `h2` under `<html data-ocelle-prose="">` is 18 px / 600. This pins that the descendant rules still apply when the hook is misplaced on `<html>`. That is consistent with FR-015 and README.md:163 (only the container rule is excluded) and is what makes the two root guards non-vacuous (the stylesheet loaded and the hook matched). If a later decision makes the hook inert on `<html>`, this assertion has to change with it. | None. |
| R1-03 | note | packages/tokens/test/expected.ts:182-183 | Judgement call 1. `measure-reading` and `measure-cell` are probed as the token stream a custom property substitutes (`--probe` gives `68ch`, `12ch`). That checks the generated value, not a used length, because `ch` depends on the probe's font. The used lengths are checked where the font is known: prose.test.ts:293-308 (each `p`, `li`, `blockquote` exactly 68 × the width of "0", within 1 px) and 312-342 (114 cells ≥ 12 × "0"). I confirmed in a scratch probe that Schibsted Grotesk is loaded (`document.fonts.check` true, "0" = 9.78 px at 16 px) and that the floor assertion bites: with `min-inline-size: auto` on the cells, 36 of the 36 cells of `#wide` fall below the floor at 320 px. Accepted. | None. |
| R1-04 | note | spec.md FR-014; data-model.md § Prose; packages/styles/README.md (Prose) | FR-014 lists `thead` among the elements the prose family "MUST style", but data-model § Prose has no `thead` rule and neither base.css nor the README mentions one (header cells are styled through `th`). The phase follows the approved rule table, so this is not a phase defect. It is a spec/plan mismatch for the operator to settle (drop `thead` from FR-014, or accept that styling `th` covers it). | None in this phase. |
| R1-05 | note | storybook/stories/base-content.json:28-29 | Judgement call 4. The story text changed in green ("Read the" + `host contract` became "The rules are in" + `Read the host contract`). This is story content, not a test. In the red text the sentence ended "Read the" followed by the code path, with the link in a separate paragraph, which read wrongly. No assertion reads these strings: render.test.ts uses its own content, and the default-content test checks structure only. Nothing was weakened. | None. |

No blocking finding.

## Test quality

**Red evidence.** `red-phase.log` (red.sh on e88228b): 96 of 1980 tests failed, and each of the 96 lines is an
`AssertionError` on missing behaviour: the five tokens are absent, every US3 scenario in both themes fails, US2-4's h1
and US2-5 fail, pairs.test, the README and CHANGELOG statements and the source rule table fail, and
`renderFamily("prose")` returns `""`. No syntax, import or setup error. `tdd-check.json`: `pass`. The red commit
exits 1, the final tests exit 1 on the base and on the scaffold, and HEAD exits 0.

**The red-commit amend (b1709d9 to e88228b).** I compared the two commits (`git diff b1709d9 e88228b`). Only
prose.test.ts changed, in three places:
- `tableRingProblems` now returns `"<id>: not a tab stop"` instead of throwing in `tabTo`.
- `captionProblems` now pushes `"scrolled: the table is not a tab stop"`.
- US3-12 records `reaches(page, "wide-plain")` and asserts `expect(before).toBe(true)`.

In each place, the case that used to throw (a plain table that is not a tab stop) now fails an assertion. The expected
values (`ring: []`, `problems: []`, the exact planted-problem lists) are unchanged and still exclude the new message.
The change is therefore at least as strict as before. It also turns the old setup-style throw into an observed failure
of the behaviour under test (FR-017). No assertion was loosened.

**No change after red.** `git diff e88228b..HEAD` touches no test, fixture, plant or story file. The green and records
commits change only source, documentation, story text and evidence.

**Scaffold.** dd136cf adds only the `Family` member `"prose"`, the `ProseContent` and `ProseTable` types,
`renderFamily("prose")` returning `""`, and the story text. It adds no behaviour and no test file. The final tests fail
against it (`final_tests_on_scaffold_exit: 1`). `base.stories.ts` is in the red commit, which `test_pathspec` allows
(`**/*.stories.ts`) and matches phases 2 and 3.

**Assertions.**
- Each US3 test asserts computed styles, geometry, focus order or the AX tree, in both themes.
- No assertion sits in a conditional, and there is no `skip` or `only`.
- Problem-list helpers are asserted to be `[]` on the real stylesheet and to give an exact list on each plant.
- Every US3 guard of R-10 has its plant, and each plant file matches the R-10 table verbatim. The outcomes:
  - `prose-page`, `prose-presence`, `prose-root`;
  - `table-container`, `table-ring`, `table-fits`;
  - `caption-cap`, `caption-static`, `caption-center` (under ltr and rtl);
  - `link-underline`, `link-anchor`;
  - `pre-copy`;
  - the `color-link` on `color-chrome` list plant in pairs.test.ts.
- US3-7 has no plant, with the spike measurement cited (prose.test.ts:704-707), as R-10 allows.

**Keyboard and FR-017 against the spec.**
- Tab order at 320 px is `link`, `wide`, `wide-plain`, `cell-link`, `long-url` (prose.test.ts:495-509). The plain
  overflowing tables are tab stops. In the linked table, Tab lands on the link and not on the table. The fitting table
  is never a stop, also in the definite-width modal dialog (538-557), where `clientWidth` equals `scrollWidth`. The
  `table-fits` plant makes both fail.
- Two ArrowRight presses scroll each plain table, and the linked table while its link keeps focus. The page does not
  scroll (`scrollX` 0).
- While a plain table has focus, the AX node is `table`, named by the caption or unnamed.
- **Inset ring.** `outline-offset` is `-3px` with the token width and colour, the table is flush with the viewport
  (`clientWidth` 320), and the ring's extent lies inside the viewport on all four sides. The `table-ring` plant
  (`outline-offset: var(--ocelle-focus-offset)`) is reported for both tables.
- **Caption.**
  - The caption's line boxes are merged per line. There is more than one line.
  - At `scrollLeft` 0, every line lies inside the visible box and starts at the start edge (within 1 px).
  - Once scrolled, every line is still inside: in ltr after the two ArrowRight presses, in rtl at the most negative
    `scrollLeft`.
  - Each of the three caption plants fails exactly its own part, under both directions.
- **Hosts.** The `1fr` grid item, the `flex: 1` item beside a 60 px rail, and the nested case are each tested at 320 px
  and at 200% zoom (640 CSS px at device scale 2). The page never scrolls, and each wide table overflows its own box.
  With the `container-type: normal` plant the page scrolls.

**Acceptance coverage.**
- US3-1 to US3-12 each have a test, in light and dark, at the widths the spec names. US3-10 runs under
  `forcedColors: active`, and US3-9 under `dir="rtl"`.
- The `h1` half of US2-4 and US2-5's three nested cases are in compact.test.ts:215-243, with cells and code in the
  compact-in-prose case.
- The Prose document story is covered by render.test.ts, stories.test.ts and csp.test.ts. The story under its CSP has
  no violation, makes no request outside its origin, and has computed prose values.

**Mutation.** `pnpm run gate:mutation -- --base 752a61d`: 52 mutants on the changed lines of 2 files
(`packages/tokens/src/source.ts`, `storybook/stories/render.ts`). None survived, and there are 0 equivalent-mutant
records. base.css is not in the mutation tool's scope. Its rules are pinned exactly by source.test.ts:189-196 (order
and declarations) and behaviourally by the browser tests and plants above.

## Checks run

All checks were run by me in the container (Node 22.23.4, not the pinned 26.13.0; Chromium from the given
`PLAYWRIGHT_BROWSERS_PATH`), one heavy job at a time.

| Check | Result |
|---|---|
| `pnpm -r build` | exit 0; `packages/styles/dist/base.css` identical to `src/base.css` (`cmp`) |
| `pnpm test` | 1980 tests passed in 95 files |
| `gate:typecheck`, `gate:lint`, `gate:test-lint`, `gate:style-lint`, `gate:prefix`, `gate:csp` | no finding |
| `gate:contrast` | 158 pairs in light, 157 in dark (149 required per theme) |
| `gate:brand-rules`, `gate:config-copies`, `gate:pins` | pass |
| `gate:mutation -- --base 752a61d` | 52 mutants, none survived, 0 equivalent records |
| `gate:plants` (alone, after the mutation run) | 182 plants of 13 gates and the registry, every plant as expected |
| `tdd-check.json` (run by the orchestrator before this review, HEAD 881b700) | `pass`, no problems |
| Scratch probe (outside the repository) | the Schibsted Grotesk "0" is 9.78 px; the cell-floor assertion bites when `min-inline-size` is removed |

**Tasks.**
- T032 to T043 are all ticked, and their work is present.
- Tokens: the five records are in source.ts:122, 130 and 180-183, plus the CHANGELOG and README entries; `100cqi` is
  accepted by `validateSource`, since the tokens tests pass.
- base.css:90-223 holds the data-model § Prose rule table verbatim and in order.
- The fixtures, plants, README and CHANGELOG statements, the story and the evidence are all present.
- No change outside the phase.

**Constitution.**
- Only `ocelle-` names and the `data-ocelle-prose` hook are used, with no class.
- Tokens only: base.css and layout.css contain no literal colour, size or font.
- No monospace. Links use `--ocelle-color-link`. `--ocelle-color-rule` and `rule-strong` are decorative only.
- Every colour pairing the family creates is a checked pair in both themes.
- Logical properties are used throughout, and the rtl rendering is mirrored and tested.
- The strict CSP holds with zero violations in the fixtures and the story.
- The keyboard model of FR-017 is tested, and the README carries the WebKit limitation.
- There is a story for the family.

**Plan.** The phase follows plan decisions 5, 7, 8, 12, 14, 17 and 18, research R-06, R-08, R-10 and R-13, and
data-model § Prose. The only mismatch is the FR-014 `thead` gap of R1-04, which lies between the spec and the plan.

## Earlier findings

None: this is round 1 of phase 4.
