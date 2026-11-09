# Phase 2 review round 2: fixes

Operator round from the landing review of PR #21 (O2-01 from L1-01, O2-02 from L1-03), with L1-02 folded in as T057.
Tasks T052 to T058 of `tasks.md` ("Fix round 2"); rules in research R-07 and R-01 and `contracts/checks.md`.

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| O2-01 | fixed | `test(003-base-styles): phase 2 fix-2 red — O2-01, O2-02` (d6a9328), recorded by `red.sh 2 fix-2` in `red-fix-2.log`: 14 assertion failures in `gates/test/token-only.test.ts`, no load or setup error. Case (b): `var(--ocelle-space-4)`, `var(--ocelle-line-height)`, `var(--ocelle-font-size-md)` and a non-line-height token after the `/` of `font` are raw with the option and `[]` without it. Case (a): a slash-less `font` (`var(--ocelle-font-size-md) var(--ocelle-font-sans)`, `165% …`, a lone `var()`, a `/` inside a fallback or a string) is raw as its trimmed value with the option and gives 002's result without it; `normal` and `caption` are raw both ways; the CSS-wide keywords alone pass. Plugin: the two findings at their lines with the repository lists, nothing for `font: inherit`, only the unknown token without the option. Two existing expectations replaced by stricter ones (slash-less `font`; `line-height: var(--ocelle-nope)` now raw before unknown). | `gates/stylelint/token-only.ts`: `tokenLineHeight()` accepts a one-argument `var()` naming `--ocelle-line-height-*` only; `fontRaw()` returns `[value.trim()]` for a value with no top-level `/` unless it is a CSS-wide keyword; header and doc comments. `stylelint.config.ts` header comment. Fail plants `gates/plants/style-lint/fail-styles-font-without-line-height` and `fail-styles-other-token-line-height` (one `ocelle/token-only` finding at `packages/styles/src/x.css:3` each). |
| O2-02 | fixed | None needed: the probe of T053 (working copy of `packages/styles/scripts/build.ts` with the five records removed, `gate:mutation -- --base d8dba60 --files packages/styles/scripts/build.ts`, file restored with `git checkout HEAD --`) gave 16 mutants and no survivor. `"utf8"` → `""` is a `CompileError` of the TypeScript checker; every other mutant on `build()`'s lines is killed by the existing `build.test.ts`. So `build.test.ts` is unchanged (named in the red commit's body). | `packages/styles/scripts/build.ts`: the five `Stryker disable next-line all: I/O boundary` records on `build()`'s lines dropped, the two `import.meta.main` records kept, header comment adjusted. |
| L1-02 (T057) | fixed | None: documentation only. | `gates/README.md`, the `style-lint` row: the `packages/styles` line-height clause in "Checks"; the six `packages/styles` line-height fail plants, `pass-styles-line-height-token` and the corrected "ten allowed values (nine in `styles/src`; …`pass-line-height`, in `elements/src`)" in "Plants". |

## Checks

Container Node 22 (CI pins 26.13.0), Chromium from `PLAYWRIGHT_BROWSERS_PATH`, one heavy job at a time.

| Check | Result |
|---|---|
| `pnpm -r build`, `pnpm test` | exit 0; 2037 tests passed in 96 files |
| `gate:typecheck`, `gate:lint`, `gate:test-lint`, `gate:style-lint`, `gate:prefix`, `gate:csp`, `gate:contrast`, `gate:brand-rules`, `gate:config-copies`, `gate:pins` | no finding (style-lint: 2 files) |
| `gate:plants` (alone) | 184 plants of 13 gates and the registry, every plant as expected |
| `gate:mutation -- --base d8dba60` (alone) | exit 0: 227 mutants on the changed lines of 6 files, none survived; 3 equivalent records (the two `import.meta.main` records of `build.ts` and the process-boundary record of `storybook/scripts/swatches.ts`), five fewer than the 8 before. About 145 s |
| `tdd-check.sh 2` | run after the fix commit, at its HEAD; result in `tdd-check.json` |
