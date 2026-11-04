# Phase 2 review round 1: fixes

Review: `round-1.md` (changes_requested, 3 blocking findings, 4 notes). All three blocking findings are mutation
survivors and uncovered mutants: they say the tests are weak, not that the code behaves wrongly. Every new test passed
against the code at `1ac5bef` (174 tests in the four changed test files, run before any source edit), so there is no
red commit for this round and no `fix-1` line in `red-commits`. As the fix procedure asks for a weak-test finding, the
stronger tests are in the fix commit; each one is shown able to fail by the mutant it kills
(`round-1-mutation.log`, `gate:mutation -- --base 98c1dcd` on the fixed tree), and the automatic check runs the final
tests against the code from before the phase. No test was weakened, skipped or deleted.

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R1-01 | fixed | none: weak tests, strengthened in the fix commit (code unchanged) | `gates/test/token-only.test.ts`: new `describe("manifestProperties()")` asserts every reason exactly (top level null, list, string; schemaVersion absent or not text; modules not a list; a module null or a list; declarations not a list; a declaration null or a list; cssProperties not a list; an entry null, nameless or with a non-text name) and the names in order, skipping modules without declarations and declarations without cssProperties. `loadLists()` gains: the read error (manifest path is a directory: exact message with `EISDIR`, `cause.code`), the JSON error's `cause` (a `SyntaxError`), an exact schema message with its reason, the two load failures (source exports no list; generator exports no `validateSource`) with exact messages and `cause.message`, and the validation error as `cause`. `gates/stylelint/token-lists.ts` is unchanged. |
| R1-02 | fixed | none: weak tests, strengthened in the fix commit | Tests: `packages/tokens/test/validate.test.ts` (a ref naming a reference twice; a ref lacking one of several references, naming them all; a per-theme ref naming unknown tokens in both themes; a cycle not through the token that reaches it; a cycle reached through a later reference after one that ends; a duplicate name whose second record would loop; a color-scheme right in light and wrong in dark; contrast on a colour and a ground opaque in one theme only), `resolve.test.ts` (the exact cycle error of `resolve()`, which also kills line 106), `overrides.test.ts` (an override that sets only the value keeps `ref` and `contrast`). Source, `packages/tokens/src/generate.ts`: line 111's `ref.length === new Set(ref).size` is removed as redundant (a true equivalent: `found` holds each name once, so a ref of the same length holding every found name has no duplicate; the doc comment says so); line 168 takes the edges as `themes.flatMap((theme) => references(valueIn(record, theme)))` instead of joining both values with `" "`, the same names without the separator literal whose `""` mutant survived; line 174's `?? []` is recorded `Stryker disable next-line ArrayDeclaration` as equivalent (walk() only gets names of `edges`). |
| R1-03 | fixed | none: weak tests, strengthened in the fix commit | `gates/test/token-only.test.ts`: `referencedTokens()` unit cases (a bare word `var`, `VAR(`, other functions, a bare `--ocelle-` word, nesting and fallbacks, a non-`--ocelle-` var), the rule with only `tokens` and with only `elementProperties` (the `??` branches), a bare `var` word through the rule, and `[true, null]` as no options (line 128). `gates/stylelint/token-only.ts`: two records with reasons, line 118 `loaded.set` (`CallExpression`: the cache only saves reads; without it each file loads the same lists from the same root) and line 130's `?? []` (`ArrayDeclaration`: a default entry `"Stryker was here"` is never a `--ocelle-*` var() name nor a custom property name of the other list). |
| R1-04 | no change (note) | - | Accepted by the review. |
| R1-05 | no change (note) | - | For later phases. |
| R1-06 | no change (note) | - | Nothing to do. |
| R1-07 | fixed | - | `gate:mutation -- --base 98c1dcd` run before hand-off; result in `round-1-mutation.log`. |

## Checks run

`pnpm test` (1440 tests, 67 files), `gate:typecheck`, `gate:lint`, `gate:test-lint`, `gate:style-lint`,
`gate:config-copies`, `gate:pins`: all exit 0. `gate:mutation -- --base 98c1dcd`: exit 0, 657 mutants on the changed
lines of 8 files, none survived, 14 equivalent records (11 accepted in build.ts, 3 new); see `round-1-mutation.log`.
Browser tests ran with `PLAYWRIGHT_BROWSERS_PATH` on the scratchpad `pw` alias (phase 1 R1-02).
