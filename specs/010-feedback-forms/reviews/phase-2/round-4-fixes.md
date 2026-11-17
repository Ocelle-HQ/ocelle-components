# Phase 2 review round 4: fixes (fix-4)

Review: round-4.md (operator round, changes_requested; landing notes L1-03 and L1-04 of reviews/landing/round-1.md).
Red commit `e3ed824` (parent `8d46b78`), recorded by `red.sh 2 fix-4` as `fix-4` in `red-commits`.

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| O4-01 | fixed | none: not behavioural (the reason of an equivalent-mutant record, comment only; behaviour unchanged, the mutant stays equivalent) | packages/elements/src/ocelle-notice.ts:343 |
| O4-02 | fixed | `e3ed824`: the README item in packages/elements/test/node/readme.test.ts ("The bar and the ground differ from one tone to another only by colour, and not at all in forced colours, so the host's text must state the tone, ..."), red on its assertion against the README of `8d46b78` (red-fix-4.log: 1 of 4740 tests failed, that item, `AssertionError: expected '# @ocelle/elements ...' to contain 'The bar and the ground differ from on…'`; no setup or import error) | packages/elements/README.md (`ocelle-notice` section, the `tone` item); packages/elements/test/node/readme.test.ts |

## O4-01

The reason now reads as `src/form-control.ts:478` gives it: LitElement's `disconnectedCallback()` tells reactive
controllers, which the notice has none of, and disconnects its template's async directives, which it uses none of. The
notice's module imports no directive (`lit` only for `LitElement`, `css` and `html`), so the mutant stays equivalent.
`gate:mutation` reads the new reason as the line's record (mutation-fix-4.log).

## O4-02

The `tone` item no longer says "so the ground is never the only mark of the tone", which could be read as colour not
being the only carrier. It now says that the bar and the ground differ from one tone to another only by colour, and not
at all in forced colours, so the host's text must state the tone, with the README's own examples ("Run failed",
"Saved.").

## Checks (after the fix, working tree on `e3ed824`)

| Check | Result | Log |
|-------|--------|-----|
| `vitest run test/node/` in packages/elements | 6 files, 390 tests passed | (console) |
| `pnpm run gate:unit-tests` | exit 0: 4740 tests passed in 174 files | unit-tests-fix-4.log |
| `pnpm run gate:typecheck` | exit 0: no type error | typecheck-fix-4.log |
| `pnpm run gate:lint` | exit 0: 355 files, no finding | lint-fix-4.log |
| `pnpm run gate:test-lint` | exit 0: 255 files, no finding | test-lint-fix-4.log |
| `pnpm run gate:mutation -- --base 8d46b78 --files packages/elements/src/ocelle-notice.ts` (run after `gate:unit-tests` had finished) | exit 0: 0 mutants on the changed lines, none survived; 1 zero-mutant entry ("no mutant on the changed lines"); 1 equivalent record, the reworded `:343` | mutation-fix-4.log |
| `OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --affected 8d46b78` (skill step 5) | exit 0: 21 of 309 plants judged, every plant as expected. Against `base.sha` (`6c9400c`) the selection is every plant, since `gates/bin/plants.ts` changed after it (a first attempt was stopped); the red commit's parent is used, as phase 4's fix-2 did | plants.md |

The mutation base `8d46b78` is the red commit's parent, as the orchestrator asked, so the run covers this round's
change only; tasks.md's T025d names the phase 2 base, against which the whole module is changed (it was the phase's
earlier mutation runs, mutation.md). `reviews/phase-2/red-fix-4.log` holds pnpm's store path as the tool printed it.
