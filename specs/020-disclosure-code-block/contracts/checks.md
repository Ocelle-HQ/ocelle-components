# Contract: the checks this feature adds or extends

No gate is added or changed. Every existing gate runs on the new source, stories and built output.

## Scenario bodies and harnesses (FR-052)

| Element | Scenario file | In-process test (mutated) | Fixture test (built browser build, strict CSP) | Fixture page |
|---|---|---|---|---|
| disclosure | `packages/elements/test/scenarios/disclosure.ts` | `test/disclosure.test.ts` | `test/browser/disclosure.test.ts` | `test/browser/fixtures/disclosure.html` |
| code block | `test/scenarios/code-block.ts` | `test/code-block.test.ts` | `test/browser/code-block.test.ts` | `test/browser/fixtures/code-block.html` |

Entry tests `test/entry-disclosure.test.ts` and `test/entry-code-block.test.ts` (importing the module defines that tag
and, for the disclosure, `ocelle-icon`; no other).

- **One body per scenario** (`US1-7a` style for the parts of US1-7), each with an assertion that can fail, plus one
  body per FR or edge case that has no scenario (SPEC-2-06): marker not shown (FR-003), a panel click does not toggle
  (FR-004), the 24 × 24 target (FR-014), the leading newline (FR-020), `overflow` value parsing (FR-022), the run-time
  switch (FR-025), host `aria-label` over `label` (FR-026), prefix only and several colons (FR-029), nested
  disclosures, the empty block, focus out of a closing panel (FR-013), `:state(open)` (FR-011).
- **"Does not" outcomes are paired** with a positive outcome in the same body (no event and the state unchanged; not
  a tab stop and the text shown; no toggle on a panel click and the click reaching a `document` listener).
- **Event counts** are read after the next task (`setTimeout(0)`) and `updateComplete` (R-02), never immediately.
- **Red per body.** Each phase has a scaffold commit (`scaffold.sh`): the module with `define`, `@tagname`, declared
  properties and an empty `render()`, its exports in `src/index.ts`, `src/browser.ts` and `package.json`; no test file.
  The red log is checked per body.

## Bodies the platform alone could pass

| Body | Outcome the platform gives anyway | Assertion only the element gives |
|---|---|---|
| US1-4 (Enter and Space) | native `summary` keys | the host attribute and the `ocelle-disclosure-toggle` count |
| US1-5 (tab into the panel) | light-DOM link order | the link is laid out below the summary inside the host and is unreachable while closed |
| US1-10 (find in page) | native reveal | `open` reflected on the host and one event |
| US2-10 (copy) | a plain text node copies unbroken | the digest is rendered as units with the gap (rects and margins asserted in the same body) |
| US2-11 (AX text) | one text node reads unbroken | the same, units asserted |
| US2-3 (wrap at 288 px) | `base.css` would wrap a light `pre` | the shadow `pre`'s computed font family is the token's sans, and the ground is `color-inset` |

## Oracles

- **Accessibility tree:** CDP `Accessibility.getFullAXTree` (role, name, `expanded`) and Playwright `ariaSnapshot`
  (one text run) in the fixture harness; in process, the driver's AX helper.
- **Copy:** Ctrl+C with clipboard permissions and `navigator.clipboard.readText()` (R-07); fallback named in R-07.
- **Find in page:** navigation to `#:~:text=` (R-08).
- **Break positions:** `getClientRects().length === 1` per group, and distinct line tops (R-07).
- **No monospace:** the computed `font-family` of the host, `.code` and every unit equals the computed
  `--ocelle-font-sans` value.
- **Motion:** no running `getAnimations()` on the element's shadow nodes after a toggle, with and without reduced
  motion; no `transition-duration` other than `0s` on the summary, panel and chevron.
- **Reflow:** page `scrollWidth === innerWidth` at 320 px.

## Plants (CSS-only behaviour Stryker does not mutate)

| Plant | Guards | Test that must fail |
|---|---|---|
| chevron box rule removed | the fallback chevron is `--ocelle-icon-size` square (R-01) | FR-005 size body |
| `list-style: none` removed | marker not shown (FR-003) | FR-003 body |
| hover background removed | hover state (FR-014) | hover body |
| `.code` `font-family` removed | no monospace in the shadow `pre` (FR-021) | US2-1 |
| `pre-wrap` replaced by `pre` in wrap mode | wrap policy (FR-023) | US2-3 |
| `max-inline-size` removed | the reading cap (FR-021) | US2-2 |
| digest gap removed | the gap (FR-030) | US2-9 |
| transparent border removed | forced-colours edge (FR-034) | US2-17 |

Plants run locally with `pnpm run gate:plants -- --affected <base>` (op 016); CI runs the full set.

## Gates touched

`manifest` (two entries), `csp` (two fixture pages), `prefix`, `style-lint`, `contrast` (no new pair: ink on inset
and on hover-bg are existing rows; the plan's squad checks it), `mutation` (op 015's shards), `storybook-build`,
`visual` (baselines), `axe`. No gate code changes.
