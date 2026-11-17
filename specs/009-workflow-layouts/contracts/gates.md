# Contract: changed gate

One gate changes in this feature: `style-lint`'s `ocelle/token-only` rule learns to classify the arguments of
`linear-gradient()` (operator decision PLAN-CORRECTNESS-1-002 (a); research.md R-05). Every other gate (`manifest`,
`csp`, `mutation`, #10's `visual` and `axe`) applies as it is. All gates follow `gates/README.md`.

## `style-lint` (`gates/stylelint/token-only.ts`, changed)

**Why.** The scroller's and the board's fades are `mask-image` gradients in element CSS. Today `functionRaw` checks
only `var()` (its fallback) and `calc()` (its operands), and reports any other function raw whole
(`gates/test/token-only.test.ts` pins `rgb(0 0 0)`), so every `linear-gradient(...)` is a finding whatever its
arguments.

**Rule.** Inside a `linear-gradient()` function (name matched ASCII case-insensitively), the arguments are classified
as at the top level of a value:

- each word through `wordAllowed`: direction keywords (`to`, `left`, `right`, `top`, `bottom`), `transparent` and `%`
  stops pass; a hex colour, a named colour, a non-zero length outside `calc()` and an angle (`45deg`) are raw;
- `var()` and `calc()` are checked as everywhere (a `var()` fallback, `calc()` operands);
- the commas between colour stops are dividers and pass;
- any other nested function (`rgb()`, `color-mix()`, a nested gradient) is raw whole.

`radial-gradient()`, `conic-gradient()`, `repeating-linear-gradient()` and every other function stay raw whole. The
`var(--ocelle-…)` name check (002 FR-010) applies inside the gradient as everywhere.

**Tests, red first** (`gates/test/token-only.test.ts`, and `token-only-parts.test.ts` if `rawValues` changes), before
the scroller's styles in phase 2:

| Property | Value | Raw |
|---|---|---|
| `mask-image` | `linear-gradient(to right, transparent, var(--ocelle-color-ink) var(--ocelle-scroller-fade-size))` | none |
| `mask-image` | `linear-gradient(to left, var(--ocelle-color-ink) calc(100% - var(--ocelle-scroller-fade-size)), transparent)` | none |
| `mask-image` | `linear-gradient(var(--ocelle-color-ink), var(--ocelle-color-ink))` | none |
| `mask-image` | `linear-gradient(to right, #000, transparent)` | `#000` |
| `mask-image` | `linear-gradient(45deg, transparent, var(--ocelle-color-ink))` | `45deg` |
| `mask-image` | `linear-gradient(to right, transparent, var(--ocelle-color-ink) 2rem)` | `2rem` |
| `mask-image` | `linear-gradient(to right, transparent, black)` | `black` |
| `mask-image` | `linear-gradient(to right, rgb(0 0 0), transparent)` | `rgb(0 0 0)` |
| `mask-image` | `radial-gradient(transparent, var(--ocelle-color-ink))` | the whole function |
| `mask-image` | `repeating-linear-gradient(transparent, var(--ocelle-color-ink))` | the whole function |

**Plants** (`gates/plants/style-lint/`, run by `gate:plants`):

- pass: `pass-linear-gradient-tokens`, an element `css` template with the first value above;
- fail: `fail-gradient-hex` (`#000`), `fail-gradient-angle` (`45deg`), `fail-gradient-length` (`2rem`) and
  `fail-radial-gradient` (the whole function), each with exactly that one `ocelle/token-only` finding.

**Records.** The `style-lint` row of `gates/README.md` names the new rule and plants (the `gates-readme` test checks
the row). `gates/stylelint/token-only.ts` is gate source, so its change is mutation-tested under
`stryker.config.json` by the tests above.
