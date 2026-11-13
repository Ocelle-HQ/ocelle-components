# Phase 4, review round 3 (operator round, landing L1-04): fixes

Red commit `1971530` (label `fix-2`, `red-fix-2.log`: 11 of 3112 tests failed, each an assertion mismatch against the
missing check: the ten refused `plan` values parsed as an entry instead of the problem, and the gate went on to the
build, `the planted build cause`, instead of exiting 2 on the exceptions file).

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| O3-01 | fixed: after the inside-the-repository check, `parseExceptions` refuses an entry whose `plan`, as written, does not match `^specs/([^/]+)/plan\.md$` or whose feature segment is `.` or `..`, with the problem `storybook/a11y-exceptions.json#<index>: plan must be a feature plan, specs/<feature>/plan.md`. The paths that leave the repository keep their own problem. The header comment says so. New plant `gates/plants/axe/error-exception-plan-not-a-plan/` (`exceptions: "repository"`; an entry naming `storybook/notes.md`, a file whose Complexity Tracking row names the entry; `expect: "error"`). The `axe` row of `gates/README.md` lists it among the breaking plants and states the rule. | `gates/test/a11y-exceptions.test.ts` "refuses the plan %s, which is not a feature plan" (10 cases: `storybook/notes.md`, `plan.md`, `specs/plan.md`, `specs/a/b/plan.md`, `specs/a/plan.md.bak`, `specs/a/notes.md`, `./specs/a/plan.md`, `specs/./plan.md`, `specs/../plan.md`, `specs/a/../b/plan.md`), all red. "reads the feature plan %s" (`specs/006-storybook-workbench/plan.md`, `specs/a/plan.md`) passed already, as expected. `gates/test/axe-gate.test.ts` "axe: an exception entry whose plan is not a feature plan … exits 2 naming the entry before any build" (red) | `gates/lib/a11y-exceptions.ts` (`parseExceptions`), `gates/plants/axe/error-exception-plan-not-a-plan/`, `gates/README.md` |

## Checks

- `pnpm test` (OCELLE_CHROMIUM_PATH set): exit 0, 3112 tests passed in 138 files.
- `gate:typecheck`, `gate:lint`, `gate:test-lint`: exit 0, no finding.
- `gate:axe` (OCELLE_CHROMIUM_PATH set): exit 0, 42 story-theme runs, 0 serious or critical, 10 notes (0 incomplete,
  10 excepted). Every repository entry names `specs/006-storybook-workbench/plan.md`.
- `gate:mutation -- --base 1971530` (before the green commit): exit 0, 20 mutants on the changed lines of 1 file,
  none survived, 0 timeouts, 4 compile errors, 0 equivalent records.
- `gate:plants -- --plan`: `[1,…,28]`, 28 shards (27 at the landing head). There are 25 `axe` plants, in shards 20 to 28.
- `gate:plants -- --shard k` (OCELLE_VISUAL_ENGINE=docker), k = 20 to 28, one at a time: every shard exit 0, every
  plant as expected. Local times: 20: 4 s (holds the new plant, 0.6 s); 21: 90 s; 22: 89 s; 23: 92 s; 24: 89 s;
  25: 88 s; 26: 91 s; 27: 88 s; 28 (new shard, `axe/pass-second-render`): 29 s. All far below 570 s.
