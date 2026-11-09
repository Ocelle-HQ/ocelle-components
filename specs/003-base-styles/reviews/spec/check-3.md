---
check: 3
verdict: issues
---

# Spec check 3

Inputs: `spec.md` as of `7ffad01`, `checklists/requirements.md`, `reviews/spec/check-1.md`, `check-1-fixes.md`,
`check-2.md` and `check-2-fixes.md`, `sources/spec-kitty-design-issues.md`, `triage/003-base-styles.md`, constitution
1.3.1, and the token source and style lint on the branch (`packages/tokens/src/source.ts`,
`gates/stylelint/token-only.ts`).

One claim was checked in a real browser: Playwright 1.64.1 with Chrome for Testing 153.0.8010.12
(`/usr/bin/google-chrome`), on a scratch page at 320 px. The page held a 12-column table with `display: block;
overflow-x: auto` and `min-width: 12ch` on the cells (scroll width 1202 px, client width 304 px). Tab was pressed once
from the top of the page, then ArrowRight twice:

| Table | First Tab lands on | `scrollLeft` after two ArrowRight | Accessibility tree |
|-------|--------------------|-----------------------------------|--------------------|
| plain text cells | the `table` | 80 | `table`, `rowgroup`, `row`, `columnheader` |
| one cell holds a link | the `a` in the cell, not the `table` | 80 | same |

**Earlier checks.** Both blocking findings of check 2 are fixed at the places `check-2-fixes.md` names. SPEC-2-01:
US4 scenario 1, SC-005 and the US4 Independent Test now use two `1fr` tracks, with the unhooked identifier in the same
test. SPEC-2-02: FR-016 gives inline `code` and links in prose `overflow-wrap: anywhere`, and US3 scenario 11,
SC-004, the US3 fixture and the reflow edge case cover it. The spec records the operator's answer to SPEC-2-03
(paragraph under Issues, FR-026, US1 scenario 9, edge case "Code outside prose"). The notes SPEC-2-04 to SPEC-2-13 are
handled as the fix note says. SPEC-2-13 (what the focused table exposes) is now stated in FR-017, but no scenario
tests it (SPEC-3-04).

| ID | Severity | Where | Finding | Fix |
|----|----------|-------|---------|-----|
| SPEC-3-01 | blocking | spec.md FR-017 ("When the table overflows, the scroll box MUST be a tab stop"), US3 scenario 3, Assumptions "Table scroll box without a wrapper" | The Assumption says an overflowing scroll box "becomes keyboard-focusable ... without a `tabindex`". In Chromium that holds only when the scroller has no focusable descendant (keyboard-focusable scrollers). Measured above: when one cell holds a link, Tab skips the table and lands on the link. The arrow keys still scroll the box from there, so WCAG 2.1.1 is met, but the MUST is not. A stylesheet cannot add a `tabindex`, so no CSS mechanism can make FR-017 true for a table that contains a link, and links in table cells are common in rendered Markdown. The US3 fixture does not say whether its wide table holds a link. Without one, the test passes and the requirement still fails for real documents. With one, the test cannot pass. | Restate FR-017 and US3 scenario 3 like this: an overflowing table with no focusable content is itself a tab stop and shows the focus ring. In an overflowing table with focusable content, the first focusable element in it is reachable by Tab, and the arrow keys scroll the box from that element. Add a wide table with a link in a cell to the fixture and test both cases. Correct the Assumption to match. If the operator wants the box itself to be a tab stop in every case, that takes a wrapper or a renderer-side `tabindex`, which is the wrapper fork FR-017 already names. |
| SPEC-3-02 | note | spec.md FR-005 ("one per family"), FR-004, FR-023, Key Entities, US2 | The spec uses "family" in two ways. FR-005 requires one hook per family. FR-004 and the Key Entities list four hooks (compact, value, prose, identifier wrap). FR-023 lists four families with stories (base page, compact screen, prose document, identifier wrap): the base page has no hook, and the compact story (US2) holds two hooks, compact and value. Read literally, FR-005 forbids the value hook or the hookless base layer. | Say "one attribute per hook" in FR-005, or define the families once and map each hook to one. |
| SPEC-3-03 | note | spec.md FR-024, FR-012, FR-015, Edge Cases "Nested hooks" | The spec does not say which hook wins when the prose hook and the compact hook are on the same element (`<article data-ocelle-prose data-ocelle-density="compact">`). "The nearest hooked ancestor decides" gives no answer for a tie. Its paragraphs would be 16 px / 1.65 or 14 px / 1.5, and no test fixes which. | Add a rule for the tie (for example, prose wins inside the container, or the combination is not allowed and the README says so) and a value in US2 scenario 5. Or leave the rule to the plan explicitly, with a test. |
| SPEC-3-04 | note | spec.md FR-017 last sentence, US3 scenarios 3 and 7, FR-022 | FR-017 states what a focused overflowing scroll box exposes: role `table`, and the caption's name if there is one, else no name. No acceptance scenario asserts this. US3 scenario 7 reads the tree but not the focused node, and FR-022 tests only scenarios. As written, the sentence has no test. | Add to US3 scenario 3 or 7: when the overflowing table has keyboard focus, the focused node has role `table` and an accessible name equal to its `caption`, or none if it has no caption. |
| SPEC-3-05 | note | spec.md FR-014, FR-015 ("every element in prose other than `h1` to `h4`"), US3 fixture | Markdown renderers also emit `h5`, `h6`, `img`, `strong`, `em`, `del`, nested lists and, in GitHub-flavoured Markdown (the format of the Spec Kit documents the Artifact Viewer shows), task lists with disabled checkboxes. The spec covers none of these, except `img` through the media reset of FR-007. FR-015 gives `h5` and `h6` the prose line height of 1.65, which is not a heading line height, and the size order `h1 > ... >= h4 >= text` leaves out `h5` and `h6`. #519 names only headings, lists, quotes, code, rules and tables, so these elements are not demanded. They are not excluded either. | Say what `h5` and `h6` get (for example, the `h4` rule) or that the prose family leaves them to the browser default, and say whether the fixture includes a task list. |
| SPEC-3-06 | note | spec.md FR-002 | FR-002 exempts only "keywords, `0`, unitless numbers that are not lengths and not line heights, and selectors". The reset of FR-007 needs a percentage (`max-width: 100%` on media) unless it uses `--ocelle-measure-page`. The lint accepts `%` and `fr` (`token-only.ts` line 53), so FR-002 and its enforcing gate disagree. | Add percentages to the FR-002 exemptions as the lint already allows, or require `--ocelle-measure-page` and say so. |
| SPEC-3-07 | note | spec.md FR-021, FR-004; constitution VII; triage "Scope" ("Plus: ... CHANGELOG entry") | FR-021 requires a CHANGELOG entry for the new tokens in `@ocelle/tokens`. No requirement asks for an `@ocelle/styles` CHANGELOG that names its new public surface: `base.css` and the four hooks. Constitution VII asks for one entry per package that names surface changes, and the triage record lists it in scope. | Add to FR-004 or FR-001: `@ocelle/styles` gets a CHANGELOG entry that names the stylesheet export and each hook. |
| SPEC-3-08 | note | spec.md US4 Independent Test, US4 scenario 4 | The Independent Test renders the identifier in "a header subtitle and a fact value". Those are element parts (#7 to #17), and the triage record keeps them out of this feature. No scenario uses them. US4 scenario 4 says the identifier "wraps the same way and keeps its family's other styles" but names no value to assert. | Drop the header subtitle and fact value from the Independent Test, or replace them with plain markup. In US4 scenario 4, assert computed `overflow-wrap: anywhere` and a font size and line height equal to those of the surrounding prose or compact text. |
| SPEC-3-09 | note | spec.md Edge Cases "Zoom to 200% and 320 px width", FR-026 | The edge case says "code blocks ... reflow without horizontal page scroll". FR-026 leaves the wrapping of code outside prose to the host, so a `pre` outside a prose container keeps `white-space: pre` and can scroll the page at 320 px. The edge case reads as if it covered every code block. | Say "code blocks in prose" in the edge case. |

Counts: 1 blocking, 0 operator, 8 note.
