# Phase 3 notes for the review

Implementer's notes on phase 3 (Polish & Cross-Cutting Concerns: T040, T042, T041, in that order). The checks are in
`checks.md`, the affected plant run in `plants.md`, the reason for no red commit in `tdd-exempt.md`.

## No test-first commit

The phase changes documentation and records only (`tdd-exempt.md`). A red commit would have to change
`packages/elements/test/node/readme.test.ts`, and tasks.md T042 rules out a test change in this phase. So no
red commit was made and `red.sh` was not run; `tdd-exempt.md` is what `tdd-check.sh` reads for the phase.

For the review: the two new README sentences (the WebKit sentence of T040 and the late-font caveat of T042) are not
asserted by the README test. Adding them to `readme.test.ts` would be a test-only change, in a fix round or the
landing, if the reviewer or the operator wants it.

## T040: README cross-checks

- **§ Engines, floor.** No floor change. The two elements use nothing newer than the floor: `ElementInternals.states`
  and `:state(open)` (Chromium 125, WebKit 17.4, already listed), the `lh` unit (`min-block-size: 1lh`, already listed),
  the overflow-region module's mask properties (already listed), and older features (`details` and `summary`,
  `summary { list-style: none }` from Chromium 89, `overflow-wrap: anywhere`, `unicode-bidi: isolate`,
  `scrollTo({ behavior: "instant" })`, `MutationObserver`). Research records the disclosure's find-in-page reveal
  (Chromium 97+) as inside the floor already.
- **WebKit line.** The README's paragraph "WebKit is not measured for the layout elements either: …" gains a sentence
  for `ocelle-code-block`'s scroll mode: its tab stop while it overflows, its arrow keys, its focus handover when
  overflow ends, the focus move on a switch to wrap and the `rtl` opening write are untested in WebKit (research R-06
  § WebKit). It is a sentence of its own after the existing one, not a change of that sentence's list, so the README
  test's fragment for that sentence still holds verbatim (no test change, `tdd-exempt.md`).
- **WebKit marker.** T001 found that `style-lint` admits `summary::-webkit-details-marker` (`reviews/phase-1/spike.md`
  § 4) and `src/ocelle-disclosure.ts` has the rule, so the marker gets no README line.
- No spec text changed.

## T042: late-font caveat

The README's `ocelle-code-block` § Direction now says, after the opening-write sentence: "That holds once the block has
laid out in its font: the one write uses the widths of the first layout, and a font swap does not repeat it. On a page
where the sans face (`--ocelle-font-sans`) arrives after the first layout, the lines widen after the write and their
starts can end up out of view (the content stays reachable with the arrow keys), so preload the sans face for `rtl`
scroll blocks." This follows FR-021 ("That result holds once the box has laid out in its font: the one write uses the
widths of the first layout, and a font swap is not a trigger …") and contracts/elements.md's README statements.

The departure from the letter: contracts/elements.md puts "once the block has laid out in its font" inside the
opening-write sentence. The README keeps that sentence as it was and qualifies it in the next one, because the README
test asserts the existing sentence verbatim (`readme.test.ts`, the `ocelle-code-block` fragments) and T042 changes no
test. The meaning is the contract's. No element code, story or test changed.

The late font is a known gap for the ALL PHASES DONE message (operator decision): the element does not repeat the
opening write after a font swap.

## Repository-wide notes

- `gate:plants -- --affected <phase base>` selected no plant: this phase's changes (README, records under `specs/`)
  map to none. That is "no plant selected", not "plants passed"; CI's Plants check judges every plant.
