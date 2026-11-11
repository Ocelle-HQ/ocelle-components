# Phase 3 notes for the review

Implementer's notes on phase 3 (User Story 2, the icon set): what the orchestrator asked to carry, where the work
departs from the letter of tasks.md and why, and what is left open. The measurement of T031 is in `spike.md`, the
plant runs and gate runs of T040 in `plants.md`, the exemption of US2-5's notices half in `tdd-exempt.md`.

## Carried into the phase

- **Phase 2 review R1-03.** The driver gained `pixels` and `dir` (and `elements` and `geometry`, below); `Shape` has
  the line, polyline, path, rect and circle kinds, each used by a drawing (`spike.md` § The drawings); US1-6 reads its
  label on `search`, and now also asserts that `search` draws its expected drawing. The two phase 2 equivalent-mutant
  records on `mirror: false` are removed, since `ocelle-icon` reads the flag now.
- **Phase 2 review R1-06.** `normalise` orders modules by code point. Test first: `node/manifest.test.ts` "orders the
  modules by code point, not by locale" (upper case before lower case, `-` before `.`) was red in `654ac79`.
- **Analysis L13.** `xlink:href` is in T032's forbidden list in tasks.md (`11c2a96`) and in the check
  (`scenarios/icon-set.ts`: any attribute named `href` or ending in `:href`).

## Departures from tasks.md, with the reason

- **Driver methods beyond `pixels` and `dir`.** `elements(id)` (every element of the shadow root with every attribute
  by qualified name) is what the forbidden-content check of US2-3 reads; `drawing(id)` sees only the `svg`'s
  children. `geometry(id)` (each shape's `getBBox()`) is the painted-area measure of US2-2, read from the rendered
  DOM rather than computed from the expected table, so it checks the unit and not the test's own data.
- **Pixels in process.** The in-process driver captures with Vitest's own `page.screenshot({ element, save: false })`
  and decodes in the page (`DecompressionStream`), so no new browser command and no change to `vitest.config.ts` was
  needed; the fixture driver captures with Playwright's element screenshot (`caret: "initial"`, `animations: "allow"`,
  so Playwright adds no style to the strict-CSP page; the fixture pages stay `clean`) and decodes with `node:zlib`.
  One decoder, `test/pixels.ts`, serves both.
- **The svg of a mirroring icon carries `class="mirror"`.** R-08 names the class. The red table expected no class on
  any `svg`; `expectedDrawing()` now expects it on the four inline-direction icons (stricter; recorded in the body of
  `c7cdc00`).
- **Stories.** Besides the grid of T038 (`Set`), a second grid `Set, right to left` shows the mirroring state; both are
  in T035a's story test.
- **`.vitest/`** (Vitest browser mode's failure-screenshot attachments, written by in-process runs with failing tests)
  is added to `.gitignore` beside `__screenshots__/`.
- **The manifest plants' copies.** Seven plants under `gates/plants/manifest/` commit their own `custom-elements.json`;
  the union change made them stale, so they were regenerated (`7a725e2`). Any later change to the manifest's
  surface needs the same.
- **Mutation fixes after green.** `251cb05` and `c228503` (tests added, then the source simplified; `plants.md`
  § Gate runs). One equivalent record remains, in `token-only.ts`.

## Red evidence to read with care

- At red, the per-name scenarios of `menu` and `close` (`US2-2, US2-3, US1-2, US1-7: menu …` and `… close …`, in both
  harnesses) pass: both were drawn in phase 2. They are there because T032 asks for every check per name of the
  thirteen; every other per-name scenario and every set-wide scenario failed with an assertion.
- The red failures are all assertion failures (`red-phase.log`): undrawn names, the two-name manifest union, the
  locale order, missing README and CHANGELOG statements, the missing `Set` stories (the preview finds no story:
  `theme: undefined`), and the `scale` values the lint reported raw or let pass.
- The `token-only` guards that held before the change (`scale: 2`, `1.5`, keywords, other properties) each share
  their test with `scale: -1 1` passing, so every one of those tests was red.
