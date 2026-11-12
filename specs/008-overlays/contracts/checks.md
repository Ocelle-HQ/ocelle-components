# Contract: checks for the overlays

No new gate. The existing gates cover this feature as follows.

| Gate | What it proves here |
|---|---|
| `typecheck`, `lint`, `test-lint` | As for every element. |
| `style-lint` (`token-only`) | The three elements' `css` templates use only tokens, `var()`/`calc()`, `%`, keywords and system colours (forced colours). No new allowance is planned. |
| `unit-tests` | `elements` (in process, mutated) and `elements-browser` (strict-CSP fixture, built browser build) run the shared scenarios. `tokens` tests cover the three new tokens. |
| `mutation` | Changed lines in `packages/elements/src/**` (elements-only config) and `packages/tokens/src/source.ts` (default config). Timeout and CompileError mutants are report lines (007). R-15 aims for zero Timeouts. |
| `csp` | Built output: no inline style, `style` attribute or string timers. FR-047's run-time "no `style` attribute" is proven by the scenarios (`styleAttributes()`), since the `csp` gate cannot see CSSOM writes. |
| `prefix` | No `sk-` names, no monospace. |
| `contrast` | No new colour pairs: the bubble uses `color-chrome-ink` on `color-chrome`, already checked. |
| `brand-rules` | Rule (f) is unchanged: `tooltip-delay` is not zeroed under reduced motion (R-09). |
| `manifest` | The three new entries are generated and committed. `no-description` covers every new member. |
| `storybook-build`, `visual`, `axe` (from #10) | The stories of data-model § Stories, with baselines in light and dark and axe clean. **Recheck when #10 lands** (research R-16). |

## Test matrix (FR-043, SC-001, SPEC-1-09, SPEC-1-11, SPEC-2-04)

Each row runs in process and on the strict-CSP fixture. After each row, FR-047's counts are asserted: 0 `style`
attributes and 0 added `<style>` elements.

| Element | Paths |
|---|---|
| dialog | open → initial focus (autofocus / first focusable / close control); Tab and Shift+Tab cycle; Escape × {veto, no veto, veto then Escape twice}; close control by click, Enter and Space × {veto, no veto}; backdrop click (nothing); host close; form `method="dialog"` (reason `host`); opener inside a shadow root; opener removed (body); nested dialog over drawer; removal while open; rapid toggle; reduced motion on and off |
| drawer | the dialog's rows with `ocelle-drawer-` events, plus backdrop click × {veto, no veto} and press inside, release outside; `side` × `dir`; `ground`; `heading-hidden`; UA reset; forced colours; long body scroll |
| tooltip | hover with delay (not before, within bound); delay 0; keyboard focus shows at once; click focus does not show; late `:focus-visible` does not show; hoverable gap; leave hides; Escape hides and stays dismissed; Escape inside dialog then dialog close; touch; empty `text`; `disabled`; trigger removed; two tooltips; each placement; flip; cross-axis clamp; clipped and transformed containers; `describes` on and off (AX tree); reduced motion; forced colours |
