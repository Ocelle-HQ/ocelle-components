---
phase: 3
round: 4
verdict: approved
base: 4ac76fd7fb68ba7c8f15b4bc4177e64b518d56c8
head: 68c8148f6d69ef3cb51af997935f269590c08796
tdd_check: pass
---

# Phase 3 review, round 4

Scope: the operator addendum of round 3 (tasks.md T091). The commits are stub 88a8645, red 01b9ee3 (`fix-3`), and
fix d2b491a with `round-3-fixes.md`. 68c8148 holds the tdd-check evidence. 972ddb3 is an orchestrator diary line
(`knowledge/speckit-flows/log.md`) and is not part of the fix. The rest of phase 3 was approved in round 2 and has not
changed since 8d252c4, apart from the record comments of T091 step 5.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R4-01 | note | gates/eslint/unchecked-expect.ts:26-29 | `nameOf` takes `callee.property.name` without checking `computed`. A computed member with a string-literal key (`p["then"]`, `globalThis["setTimeout"]`) has no `name` and is not reported, as the fix note says. A computed member with an identifier key does have a name, so `void p[then](() => expect(1).toBe(1))` and `globalThis[setTimeout](() => expect(1).toBe(1), 0)` are reported. I checked this with a `Linter` probe at HEAD. The fix note's statement "computed members ... are not reported" therefore holds only for literal keys. R-06 does not define computed members, and both forms are unrealistic in test code, so the interpretation is acceptable. No test pins either behaviour. | None now. If R-06 is ever amended, decide computed members one way and test both key kinds. |
| R4-02 | note | gates/lib/spawn.ts:29 | The `child.on("error", reject)` record names setup-offline.test.ts "exits 2 naming the missing package ...". That case runs `runTool` with an existing `pnpm`, so it executes (covers) the line but never fires the `error` event. A mutant that drops the listener would turn a spawn failure (ENOENT) into an uncaught `error` event: the process would exit 1 (a "finding") instead of `entry`'s exit 2. No `gates-integration` case would notice. Reworded R-08 asks only that a case *covers* a third-kind record, so the record meets the letter of the operator decision. It is a "covers", not a "kills". The implementer flagged this line. | None for this phase. Optional: a `gates-integration` case that runs `runTool` on a command that does not exist and expects a rejection. |
| R4-03 | note | gates/bin/config-copies.ts:88; gates/bin/test-lint.ts:11,14,16,18,23 | These records still read "process boundary, covered by gates-integration" without naming a case. Reworded R-08 requires a third-kind record to name its case, but T091 step 5 lists only five files and these two are not among them. As instructed, this is not blocking. | Name the covering cases when these files are next touched (for example, in phase 4 alongside T092), or have the planner add them to a task. |
| R4-04 | note | reviews/phase-3/tdd-check.json (`final_tests_on_scaffold_exit: 2`); check-final-tests-on-scaffold.log | Against scaffold a160859, the final tests now stop on a load error before any test runs: "gates/test/unchecked-expect.test.ts failed to load: Cannot find module '../eslint/unchecked-expect.ts'". The phase scaffold predates the T091 stub. In round 2 the same run exited 1 with one assertion failure per phase 3 test (the log as of 8d252c4). The scaffold condition, that the final tests fail, still holds, but this log no longer shows *why* each original phase 3 test fails. This weakens the evidence only slightly. The original phase 3 tests have not changed since round 2 (`git diff 8d252c4..HEAD` on them shows only appended T091 cases), and their per-test scaffold failures are on record in git. For the addendum, the stub 88a8645 is the scaffold: the red commit 01b9ee3 sits directly on it, and red-fix-3.log shows 11 assertion failures and no load error. So the comparison is intact for the addendum. | None. The story extension could run the scaffold comparison against the latest stub of an addendum (knowledge log 972ddb3 already proposes an addendum path). |

No blocking finding.

## Test quality

- **Red evidence (fix-3, 01b9ee3, red-fix-3.log)**: "11 of 191 tests failed". All 11 are assertion failures:
  - 7 RuleTester cases with "Should have N errors but had 0";
  - the Linter test with `expected [] to deeply equal [...]`;
  - 3 rule fixtures in `test-lint.test.ts:136`, which exit 0 where 1 is expected.

  None is a load error. The `asserting-catch` fixture and the three `pass-*` fixtures already pass at red, as the
  look-alikes should: the stub reports nothing, and `vitest/no-conditional-expect` already flags the asserting catch.
  red-commits has `fix-3 01b9ee3`.
- **Stub (88a8645)**: it adds only `gates/eslint/unchecked-expect.ts`. The three rules have empty messages and
  `create() { return {}; }`, plus the `plugin` export. It has no behaviour, no test file, and is not wired into
  `eslint.test.config.ts`.
- **Tests after red**: `git diff 01b9ee3..HEAD -- gates/test/` only appends two RuleTester blocks
  (unchecked-expect.test.ts:171-201, commented "Added in the green step to kill surviving mutants"). They test:
  - that `!` and `typeof` are not `void`;
  - that one asserting callback among several is enough;
  - that a `FunctionDeclaration` in a catch is a nested function.

  No red case or fixture changed, and the existing T035 cases and fixtures are untouched.
- **T091 coverage**: every pattern and look-alike that T091 step 2 lists is tested.
  - Reported:
    - `void p.then((v) => expect(v).toBe(2))`: :24
    - `void p.then(f).finally(...)`: :39
    - `setTimeout` with a block body: :69
    - `setInterval` with an arrow: :70
    - `globalThis.setTimeout`: :71
    - `catch {}`: :105
    - `catch (e) { console.log(e) }`: :106
    - `catch (e) { if (x) throw e }`: :107
  - Not reported:
    - `await p.then`: :25
    - `return p.then`: :30
    - `() => p.then(...)`: :32
    - a bare `p.then(...)` statement: :26
    - `await new Promise((r) => setTimeout(r, 10))` followed by the assertion: :73-74
    - `cleanup(); throw e`: :109
    - an asserting catch: :110
    - `try ... finally`: :111

  R-06's further examples are also tested: `catch (e) { fail(e) }` (:108), `void p.then(f).catch(g)` as one chain
  (:40), `expect.soft`, `expect.unreachable`, `.not`, `setImmediate`, `queueMicrotask`, a non-function or later
  timer argument, and a throw inside a nested block, a loop or a function (:119-121).

  The integration fixtures are one per rule (exit 1, exact stdout with R-06's message), `asserting-catch` (exit 1,
  exactly one `vitest/no-conditional-expect` finding), and `pass-awaited-promise`, `pass-returned-promise` and
  `pass-rethrowing-catch` (exit 0). They match T091. The only R-06 example without a test is the assigned and never
  awaited chain. That chain is not this rule's pattern, and my probe confirms the rule does not report it.
- **Rules against R-06**:
  - Assertion detection uses the `rootName` walk.
  - The floating rule's chain loop (:74-82) walks down through `callee.object` while the callee is a member call
    named `then`, `catch` or `finally`. It checks function or arrow arguments for an assertion anywhere, nested
    functions included, and reports the `void` once.
  - The timer rule checks the identifier or member property name and the first argument only.
  - The swallowed rule requires the try `block` to contain an assertion anywhere. It treats a catch as not swallowing
    only when its own top-level statements include a `ThrowStatement`, or when the catch body holds an assertion that
    is not inside a nested function (`direct`).
  - `try ... finally` returns early.
  - Message ids and messages match R-06 word for word, and the Linter test pins them.
  - `eslint.test.config.ts` registers one `ocelle` plugin with the union of both modules' rules and sets the three
    rules to `"error"`. The header comment is updated.
- **Interpretation 1 confirmed**: a nested-function assertion in a catch counts as swallowing. In R-06 the subject
  is "its body (the clause's block, not counting nested function bodies)", and that clause governs both "has a throw
  statement" and "contains an assertion". This is also R-06's own "unless a rule says otherwise" exception to the
  default "nested functions included". The cases at :122 and :195 test it.
- **Interpretation 2**: accepted, with the precision of R4-01: only literal-key computed members go unreported.
- **Vacuous assertions**: none. Every case asserts exact error lists or exact exit, stdout and stderr. There is no
  skip, only, snapshot or conditional assertion.
- **Mutation**: I ran `pnpm run gate:mutation -- --base 4ac76fd7fb68ba7c8f15b4bc4177e64b518d56c8` and it exited 0
  with "877 mutants on the changed lines of 16 files, none survived; 58 equivalent records".
  `gates/eslint/unchecked-expect.ts` has no record, so every mutant in it is killed in-process. I read every record
  without a named case:
  - test.ts:86 is the new BlockStatement record on `playwrightChromium`'s `catch`. It is equivalent: with an empty
    block the function falls through and returns `undefined`, exactly as `return undefined` does. Since the record
    covers only BlockStatement, no other mutant on the line is hidden.
  - setup-offline.ts:32, eslint-report.ts:39, mutation/report.ts:53, vitest-report.ts:59 and config-copies.ts:68
    are the empty-catch equivalents reviewed in rounds 1 and 2, unchanged.
  - config-copies.ts:88 and the five test-lint.ts records are covered by R4-03.

## O3-02 spot-check (records name a covering case)

All 9 distinct names in the 5 files match an existing `it(...)` title exactly (grep of gates/test/integration). Spot
checks:

- **test.ts `runVitest`, `run`, the `vitest` tool and the main guard** name "exits 1 naming the failing test as a
  finding (US1 scenario 5)". That case runs Vitest through the temp report file and asserts the exact finding and
  summary. It covers the lines and kills their mutants.
- **test.ts `checkChromium` and the `chromium` tool** name "exits 2 naming the override when OCELLE_CHROMIUM_PATH
  points at no executable". It asserts exit 2 and a stderr line naming the path and the variable. It covers and kills.
- **test.ts `playwrightChromium` and its `try`** name "exits 2 naming pnpm run setup:online when Chromium is missing
  ...". With `PLAYWRIGHT_BROWSERS_PATH` set to an empty directory, `executablePath()` returns a path that does not
  exist, without throwing. The `try` path is covered and the `catch` is not, which is why it is now the equivalent
  BlockStatement record. I accept that record.
- **mutation.ts `read` and `remove`** name the R1-01 case. That case plants a stale report and makes Stryker write
  none. It asserts exit 2 and "Stryker wrote no report", so the read-failure path (`.catch(() => undefined)`) and the
  removal are both killed. `git`, `stryker` and `run` name "--files mutates only the listed file", which runs git and
  Stryker end to end. That case covers them.
- **setup-offline.ts** records name the missing-package case. The `chromium` tool names the empty-browser-path case.
  Both are covered.
- **cli.ts `out`** names the "exits 0 ... one-line summary" case, which asserts stdout. **`err`** names "exits 2 when
  no test file is found", which asserts stderr. **`main`** names the "exits 0" case, which asserts the exit code.
  All three are killed.
- **spawn.ts** records name the setup-offline missing-package case, which asserts text from pnpm's output and the exit
  code. That case covers every line. `child.on("error", reject)` is covered but not killed (R4-02).

## Checks run

PATH=/opt/node26/bin, with OCELLE_CHROMIUM_PATH set to the recorded override (R-03).

- `pnpm test`: exit 0, "unit-tests: 193 tests passed in 21 files".
- `pnpm run gate:test-lint`: exit 0, "test-lint: 23 files checked, no finding".
- `pnpm run gate:config-copies`: exit 0, the copies are identical.
- `pnpm exec tsc -p tsconfig.json --noEmit`: exit 0.
- `pnpm run gate:mutation -- --base 4ac76fd...`: exit 0, as above.
- tdd-check.json: `pass`, with `problems: []` and red commits phase, fix-1 and fix-3 all exiting 1. `head_exit` is 0.
  Its `head` is d2b491a. HEAD 68c8148 adds only the evidence files, so I did not re-run the check.

Tasks: T091 is ticked and steps 1 to 5 are present as described. Every other `## Phase 3` task was already ticked in
round 2. Outside the phase, `git diff 8d252c4..HEAD` changes only spec.md, plan.md, research.md and tasks.md (the
operator decisions, 44962a0 and c517908), round-3.md, the knowledge log line (972ddb3) and the phase 3 evidence.

Constitution: VIII (test-first) is followed: the stub, red and green sequence, with only appended tests after red.
The new rules perform no I/O. No other principle applies to this gate-only change.

## Earlier findings

- **O3-01**: resolved. The three rules are implemented as R-06 defines them, test-first (stub 88a8645, red 01b9ee3,
  green d2b491a). The asserting catch yields exactly one `vitest/no-conditional-expect` finding and no
  `ocelle/no-swallowed-expect` finding: the `asserting-catch` fixture passes at HEAD. SC-004 and the plants are
  unchanged ("Examples only"): `gates/plants/` is not in the diff.
- **O3-02**: resolved. Every integration-only record in the five listed files names an existing case. The one
  uncovered record, test.ts:86, is now a correct equivalent BlockStatement record. These are comment-only changes,
  so no red test was required. R4-02 and R4-03 are notes.
