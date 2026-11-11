# Phase 5 notes for the review

Implementer's notes on phase 5 (User Story 4, the Ocelle brand mark): what the orchestrator asked to carry, where the
work departs from the letter of tasks.md and why, and what to read with care. The plant runs and gate runs of T063 are
in `plants.md`.

## Carried into the phase

- **Analysis L11.** tasks.md's T052 and research.md R-11 do not carry L11's text (T052 does not name
  `entry-icon.test.ts`'s mark half, and R-11 still says every fixture page's browser build "defines both elements"
  without "from phase 5"). Neither file was edited here: they are planning records, outside this role. What L11 asks
  of the phase was done: the plant "`ocelle-icon.ts` imports `ocelle-brand-mark.ts`" was run once against
  `entry-icon.test.ts`, which failed on its mark half (`plants.md` § Analysis L11). The test file itself is unchanged:
  its assertion was already paired and its comment already says the mark half holds from phase 5 on.
- **The manifest plants' copies.** The new element changes the generated manifest, so the eight plants under
  `gates/plants/manifest/` that commit a `custom-elements.json` gained the `ocelle-brand-mark` module exactly as
  generated (`pass-reordered` with its keys reversed), in `8630bcd`. Only insertions; each plant keeps its own
  finding (`gate:plants` exit 0). `fail-stale-property`'s copy of `src/ocelle-icon.ts` is unaffected: this phase does
  not change `ocelle-icon.ts`. `break-not-json` holds no JSON and is unchanged.
- **Phase 3 review R1-01 and R1-02** (open since phase 4, reasons in `reviews/phase-4/notes.md`). Not touched: phase
  5 changes neither `packages/elements/scripts/manifest.ts` nor `storybook/stories/icon.stories.ts`.

## Departures from tasks.md, with the reason

- **Scaffold** (`afb0ac0`): `src/ocelle-brand-mark.ts` exported `OcelleBrandMark`, a `LitElement` with an empty `css`
  template, not defined, so the red tests (and the pairing check, which reads the module's text) fail on their
  assertions. Because the analyzer reads every `src/ocelle-*.ts`, the scaffold made the committed manifest stale:
  at the scaffold and the red commit, `gates/test/manifest.test.ts` (five cases) and its integration twin (one) fail on
  the repository's own manifest. They pass again from `8630bcd`, where the manifest is regenerated. See also the last
  item below.
- **Driver method `theme()`**: sets `data-theme` on the page's root (the token stylesheet's dark theme selector), so
  US4-1 and US4-2 run in light and dark on one page; both harnesses' `mount` clear it.
- **Story file in green**: `storybook/stories/brand-mark.stories.ts` matches the test pathspec but was written in
  green (T061), as phase 3 did; the story test of the red commit failed without it. The chrome story's ground is the
  generated swatch rule for `color-chrome` (by class and `data-token`), since R-14 changes no Storybook configuration
  file and a story has no `style` attribute.
- **Two red tests corrected after red, each recorded in its commit**: US4-6's home link text had a leading space,
  which Chromium keeps in the link's name whatever the mark does (`10ae6ce`; same assertion, markup fixed); and
  `brand-pairs-check.ts`'s `styleTemplate()` matched only `css\``, while tsc writes `css \`` (`3e7928a`; the build
  test now reads the stylesheet as shipped, assertion unchanged).
- **Tests changed in green because the surface grew**: `gates/test/manifest.test.ts` and
  `gates/test/integration/manifest.test.ts` expect "2 elements checked", and the `fail-lost-attribute` case finds the
  `ocelle-icon` declaration by path (the mark's module now sorts first). These pinned counts should have changed in
  the red commit, as the contrast counts did; they were found when the green manifest was regenerated (`8630bcd`).
- **NOTICE's copyright line** reads "Copyright the ocelle-components authors": no copyright holder is named anywhere
  in the repository (LICENSE keeps the appendix placeholder), and the spec says only "their owner" for the
  trademarks. The operator may want to name the holder.
- **README test fragments** for the mark were written in red and the README then written to them; the CHANGELOG
  names the slot convention for the first time (FR-031's final list), as "In the README, the slot convention for icons
  in controls …", since it is documented surface and not an export.

## Red evidence to read with care

- `red-phase.log`: 103 of 2516 tests failed, every one an `AssertionError` (`unit-tests: 103 of 2516 tests failed`).
  Among them are the six manifest-gate cases noted above (five in `gates/test/manifest.test.ts`, one in its
  integration twin): they fail because the scaffold made the committed manifest stale, not because of a red test.
- `entry-icon.test.ts` passes at red, as before: its mark half holds while nothing imports the mark; L11's plant shows
  it bites.
- The pack test's `dist/ocelle-brand-mark.js` assertion and the build test's "imports lit" half pass at red, because
  tsc compiled the scaffold; each shares its test with an assertion that fails there (`NOTICE`; `./define.js`).
- The forced-colours scenario US4-5 reads `spotInside` from `getBBox()` of the arcs and the ellipse in user units,
  which forced colours do not change; it pairs the paint outcome with the shape being a filled ellipse inside the
  ring.
