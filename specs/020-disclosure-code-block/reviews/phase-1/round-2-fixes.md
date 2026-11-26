# Phase 1, review round 2: fixes

No red commit for this round. R2-01 is a task-record finding (an unticked task), not a behaviour defect: no source
or test changes. R2-02 is a note. `plants.md` is not replaced: no source, test or plant changed, the affected
selection is still every plant (rechecked below), and by the operator's CI-first decision the full plant run is
CI's required Plants check.

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R2-01 | fixed: T013 is ticked, with a line naming the steps left to CI under the CI-first decision (the full plant set, `gate:storybook-build`, `gate:visual` and `gate:axe` on the full Storybook, and `gate:mutation`) and where the locally run steps are recorded. | none: task record only, not behavioural | specs/020-disclosure-code-block/tasks.md:209 |
| R2-02 | deferred: note only; by the operator's CI-first decision the full plant run is CI's required Plants check, which must pass before merge. | none | specs/020-disclosure-code-block/reviews/phase-1/plants.md:5 |

## Checks run locally for the fix

- `gate:typecheck` (no type error), `gate:lint` (453 files), `gate:style-lint` (42), `gate:test-lint` (333),
  `gate:prefix` (477), `gate:config-copies` (identical), `gate:manifest` (`21 elements checked, no finding`),
  `gate:signoff -- --range c7ba57d..HEAD` (after the commit). All exited 0.
- `gate:plants -- --affected c7ba57d98f410d956c5c072302c8b34ae221dc5b --list`: `note: affected: every plant, by
  packages/elements/package.json (not mapped)`, `317 of 317 plants selected`.

Left to CI: the full plant set, `gate:storybook-build`, `gate:visual`, `gate:axe` on the full Storybook and the
mutation shards.
