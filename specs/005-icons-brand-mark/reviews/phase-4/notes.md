# Phase 4 notes for the review

Implementer's notes on phase 4 (User Story 3, the slot convention): what the orchestrator asked to carry, where the
work departs from the letter of tasks.md and why, and what to read with care. The plant runs and gate runs of T049 are
in `plants.md`.

## Carried into the phase

- **Phase 3 review R1-01** (`byCodePoint` returns 1 for equal strings). Not touched. Phase 4 changes nothing in
  `packages/elements/scripts/manifest.ts`, and the note asked for a test first only if the file is touched. The
  comparator is not exported, and through `normalise` the difference between 1 and 0 for equal paths is not
  observable in V8's stable sort, so the only red test would import a name that does not exist yet: a failure for
  the wrong reason, and the phase's one scaffold came before the red commit. Left for a phase that touches the
  generator.
- **Phase 3 review R1-02** (the story export `Set` shadows the global). Not renamed: the story id
  `elements-ocelle-icon--set` comes from the export name and `storybook/test/integration/elements-stories.test.ts`
  relies on it; `name` changes only the title, so a rename would change the id.
- **The manifest plants' copies.** `src/icon-slot.ts` is no element module (`ocelle-*.ts`), so the analyzer does not
  read it and `custom-elements.json` is unchanged; no plant copy needed regenerating (`gate:plants` exit 0).

## Departures from tasks.md, with the reason

- **Scaffold.** `src/icon-slot.ts` exported an empty `css` template (`7e9c661`), so the test host and the red tests
  import it and fail on their assertions.
- **Driver methods.** `rules()` (a page stylesheet, a constructed sheet adopted by the document: the CSP does not
  govern the CSSOM; US3-9's host rules), `lines()` (an inline element's client rects: the number of label lines and
  where the text starts and ends), `ownPlacement()` (a light-DOM `svg`'s drawing in its own box; US3-2, US3-3) and
  `axSubtree()` (below). The fixture driver's `mount` now also clears the page's adopted sheets, as the in-process
  `mount` already did, and its `settle` waits for `document.fonts.ready`, since the base page's font arriving between
  two measurements would move the label.
- **`axSubtree` and `vitest.config.ts`.** The DOM-based reader of phase 2 (`axNodes`) keeps the nodes of an element and
  its shadow subtree; a control's slotted label text and a `::before` strut's text are not in that DOM subtree (the
  strut's text has no DOM node at all, measured: its `StaticText` has no `backendDOMNodeId`). `axSubtree` walks the
  accessibility tree from the element's node through `childIds`, so US3-6 and US3-11 read the button's name and every
  text node under it. The in-process harness reaches it through the existing `axTree` command with a new `scope`
  argument; `vitest.config.ts`'s wrapper passed only `id`, so it forwards `scope` now (`400b527`, green: the file is not
  a test file).
- **The first line box.** Read from the test host's label element (its top, and its height divided by the number of
  lines), not from the label text's client rect: Chromium rounds the half-leading above and below the text unevenly
  (measured: a 14 px text box 1 px below the top of a 17.4 px line box, 2.39 px above its bottom), so the text rect's
  centre is not the line box's. Centring is then checked to 0.5 px against the line box as US3-1 defines it.
- **US3-4's colours.** Two plain colours set on the test host, not tokens: on the page with `base.css` the root's
  `color-scheme` comes from the tokens and follows the system scheme. (In process the ink token resolved to its dark
  value; review R1-01 found that was not a harness difference but a leak: ending forced colours left the page in the
  dark scheme of US3-8. `emulate(page, "none")` now resets the scheme to light.) The scenario is about following the
  control's colour, whatever it is.
- **US3-4 and US3-8 slot a bare `svg` beside the `ocelle-icon`** (in the `trailing` slot), with its box asserted at the
  icon size. FR-021 covers both kinds, and colour alone is inherited without the convention, so the box is what makes
  those tests able to fail.
- **The README** also states the lint's `1lh` limit (a factor on a parenthesised `calc()` group holding `1lh` passes and
  is checked in review), which R-15 lists among the conventions; the gates README's `style-lint` row names the
  allowance and the six plants.
- **`token-only` reads "1lh alone" as the whole value**: `block-size: 1lh` passes, `padding-block: 1lh 1lh` and
  `1lh var(--ocelle-space-1)` are raw. Inside `calc()`, one `lh` length per outermost expression (nested groups and
  calc() counted), it must be `1lh`, each operator beside it in its group `+` or `-`, and the expression must reference
  an `--ocelle-*` token; a fallback `1lh` in `var()` stays raw.

## Red evidence to read with care

- `red-phase.log`: 126 of 2429 tests failed, every one an `AssertionError` (token-only 36, readme 14, slot in process
  38, slot on the fixture 38).
- **US3-6 passes at red**, in both harnesses, without and with `base.css` (4 tests): its outcome, the icon-only
  control's name and the slotted icon adding nothing, is `ocelle-icon`'s own decorative state from phase 2 (FR-013),
  and the scenario's positive half (the slotted icon's drawing at the icon size, the labelled standalone twin) holds
  without the convention too. The convention's part is that it adds nothing, which its plants prove: the strut without
  alt text and the icon named from its name both make it fail (`plants.md`).
- In process at red, US3-11's `control` held only the button: `vitest.config.ts` did not yet forward the reader's
  `scope`, so the in-process harness read the DOM-based nodes. The test also failed on its gaps (no margin without the
  convention), and the fixture harness, which calls the reader directly, failed it as well.
