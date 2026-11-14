---
phase: 4
round: 4
verdict: approved
base: b80dd5e95b524acd408ad2c7649a43009bd4f53a
head: 9e7da81
tdd_check: pass
---

# Phase 4 review, round 4

Landing-pass round (landing stop rule, operator decision 2026-11-03). Its scope is the resolution of O3-01 (operator
round 3, label `fix-2`, tasks T081 to T085) and whether the fix regressed anything in phase 4. Phase 4 was not searched
afresh. The fix commits are `1971530` (red), `d9bf6d9` (green) and `9e7da81` (ticks, `tasks.md` only).

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|

No findings.

## Test quality

- **Red evidence.** `red-commits` has `fix-2 1971530…`. The red commit changes only test files
  (`gates/test/a11y-exceptions.test.ts` +14, `gates/test/axe-gate.test.ts` +12). `red-fix-2.log` and
  `check-red-fix-2.log` both show 11 of 3112 tests failing, and each failure is an assertion mismatch, not a load or
  setup error. The 10 cases at `a11y-exceptions.test.ts:87`, "refuses the plan %s", expected the problem and got the
  parsed entry (`expected [ { …(7) } ] to deeply equal { Object (problem) }`). The case at `axe-gate.test.ts:82` got
  exit 2 with a different cause, the injected build's, instead of the exceptions-file cause. The two "reads the
  feature plan %s" cases passed at red, which is correct: the rule must leave those plans alone.
- **Weakened tests.** `git diff 1971530..HEAD -- gates/test` is empty, so no test changed after the red commit.
- **Assertions.** Each new test asserts the exact problem or result object with `toEqual`. The gate test also asserts
  `asked.builds` is `[]`, which covers "before any build" (T082). The ten refused values are exactly T081's list. The
  three cases that leave the repository (`a11y-exceptions.test.ts:76-78`) keep their own message, unchanged.
- **Mutation.** `gate:mutation -- --base 1971530`, OCELLE_CHROMIUM_PATH unset: exit 0. There were 20 mutants on the
  changed lines of `gates/lib/a11y-exceptions.ts`, none survived. There were 0 timeouts, 4 compile errors (reports,
  lines 60 and 61) and 0 equivalent records. The run took the fix's red commit as its base because of the landing
  scope. The phase-wide mutation result is the one recorded by earlier rounds.

## Checks run

- `tdd-check.json` (uncommitted, from head `d9bf6d9`): `pass`, `problems: []`. Red commits `phase`, `fix-1` and
  `fix-2` each exit 1. The final tests exit 2 on the base (a load failure: the module did not exist yet) and exit 1 on
  the scaffold. Head exits 0 with 3112 tests in 138 files. I did not re-run it. The only commit after `d9bf6d9` is
  `9e7da81`, which changes only the five checkboxes of T081 to T085 in `tasks.md`, so the result holds for HEAD. Most
  of the diff in the regenerated logs is timing, temp paths and the Chromium path that setup reports. The scaffold log
  also lists the new fix-2 cases and tests added by later rounds, all failing against the scaffold as expected.
- `pnpm test` (OCELLE_CHROMIUM_PATH set): exit 0, 3112 tests passed in 138 files.
- `gate:typecheck`: exit 0. `gate:lint`: exit 0, 263 files, no finding. `gate:test-lint`: exit 0, 173 files, no
  finding.
- `gate:axe` (OCELLE_CHROMIUM_PATH set): exit 0, 42 story-theme runs, 0 serious or critical, 10 notes (0 incomplete,
  10 excepted). Every entry in `storybook/a11y-exceptions.json` names `specs/006-storybook-workbench/plan.md`.
- `gate:plants -- --plan`: 28 shards. `gate:plants -- --shard k` (OCELLE_VISUAL_ENGINE=docker), run for k = 20 to 28
  (the shards holding the 25 `axe` plants), one at a time: every shard exits 0 and every plant is as expected. Times:
  20: 3 s (includes `axe/error-exception-plan-not-a-plan`, 0.6 s, and `axe/error-bad-exceptions`, still its own
  cause); 21: 90 s; 22: 92 s; 23: 92 s; 24: 90 s; 25: 89 s; 26: 92 s; 27: 92 s; 28: 30 s. None comes near the
  570 s cap. Every existing axe plant with exceptions names `specs/plant/plan.md`, a feature plan, so the new rule
  breaks none of them.
- Leak check of the staged diff: it matches pnpm's store path, `/root/.local/share/pnpm/store/v11`, printed by
  `pnpm install` in `check-red-fix-2.log`. The context lines of the other logs match too. This is the tool's
  generic store path, not private data, and it is already committed in many review logs, including
  `red-fix-2.log` (`d9bf6d9`). It is not a finding against the phase.

## Earlier findings

- **O3-01 (blocking): resolved.**
  - `gates/lib/a11y-exceptions.ts:60-61` refuses an entry whose `plan`, as written, does not match
    `^specs/([^/]+)/plan\.md$` or whose feature segment is `.` or `..`. It gives the problem
    `<at>: plan must be a feature plan, specs/<feature>/plan.md`. The check runs after the inside-the-repository check
    (`:59`), as T084 requires. The header comment (`:2-3`) states the rule.
  - The landing reproduction, `plan: "storybook/notes.md"`, is now refused in the unit test, in the gate test (exit 2,
    no build) and in the new plant `gates/plants/axe/error-exception-plan-not-a-plan/`. That plant matches
    contracts/plants.md § `axe`: `exceptions: "repository"`, a `notes.md` whose Complexity Tracking row names the
    entry, `expect: "error"` and the contracted cause. It passes in shard 20.
  - The `axe` row of `gates/README.md` lists the plant among the breaking plants and states the `specs/<feature>/plan.md`
    rule. data-model.md § Exception, contracts/gates.md § `axe` and contracts/plants.md carry the 2026-11-13 amendment.
  - T081 to T085 are ticked, and each one's work is present.
