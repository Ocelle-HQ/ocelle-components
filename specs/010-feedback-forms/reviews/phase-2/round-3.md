---
phase: 2
round: 3
verdict: approved
base: 6c9400cbaa1da7d2b1ce96d496e65101942524a0
head: 5fadc24
tdd_check: pass
---

# Phase 2 review, round 3

Change under review: `git diff 6c9400c..5fadc24`, with no uncommitted change. Since round 2 (`c8600f8`) the branch has
the round-2 review (`4781f1f`), the standing fold decision (`56cc4a8`, `reviews/decision-folds.md`, an operator record
outside the phase's code), the fix commit `31102b9`, the planner commit `17e7ec9` (R2-03) and the tdd-check commit
`5fadc24`. In code, `c8600f8..HEAD` changes only `packages/elements/src/ocelle-notice.ts` (lines 22, 213-214) and adds
one case to `packages/elements/test/notice-rules.test.ts` (:273-287). No test line was removed.

`tdd-check.json` is `pass` at `17e7ec9`: red `phase` `62378c5` exit 1, `fix-1` `c3064b5` exit 1, base exit 2,
scaffold exit 2, head exit 0, no problems. `5fadc24` adds only the check's own outputs, so the source and tests the
check ran are those of HEAD. I did not run it again.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R3-01 | note | specs/010-feedback-forms/reviews/phase-2/check-red-fix-1.log (at `5fadc24` against `c8600f8`) | The re-run red check of `c3064b5` fails 10 of 3531 tests. The earlier run failed 12, and red-fix-1.log, the recorded red, failed 11. The fake-clock cases and the README item fail in every run: announcer.test.ts:152, notice-rules.test.ts:239 and :254, and the plants.test.ts:208 row. Which fixture-page cells fail changes from run to run. This time US1-11 heading, the two-notices Edge case and SC-002 alert warning passed on the red code, and US1-13 "10 ms after a write" failed. So on the fixture pages the cells catch the missing floor only some of the time. The fake-clock cases pin the rule exactly, so the red evidence is sound and every failure is an assertion. | None. |
| R3-02 | note | packages/elements/src/live.ts:135, :209; ocelle-notice.ts:257 | Stryker's timeouts are not stable across runs. The fix run timed out on `ocelle-notice.ts:257`. My run killed that mutant and timed out on two others: `live.ts:135`, `setAttribute("aria-live", …)` to `setAttribute("", …)`, and `live.ts:209`, `-` to `+` in `minimumHold()`. I applied all three by hand. Each fails assertions on the fake clock (see Test quality), so none of them hides a survivor. The gate treats timeouts as reports, as the skill does. | None. |

No blocking finding.

## Test quality

**R2-01's new case and the red rule.** In notice-rules.test.ts:273-287, a notice is rendered without `announce`
while `readyState` is mocked `loading`. The load completes 20 ms later, `announce` is set 20 ms after that, then the
text changes. The case reads the copy at `W` - 1 and at `W` and checks the politeness, all in one unconditional
`toEqual`. I applied three mutants of `live.ts:134` in a scratch copy and ran them against notice-rules.test.ts:
- `=== "off"` to `=== ""` (R2-01's survivor): 1 failed, the new case, `{ live: 'polite', before: '', at: '' }`
  against `at: 'B'`.
- the whole `if … this.shown();` removed (`if (false)`): the same failure.
- `if (true)` (a `polite`/`assertive` change also begins an empty state): notice-rules.test.ts passes, because
  `updated()` calls `live()` on every update (ocelle-notice.ts:493). Over the whole `elements` project it fails 2 of
  360 tests on assertions: announcer.test.ts:151 "ends no earlier than W of the load state …" and the
  "empty-state start" plant row. That rule is pinned too.

The unmutated file passes 50/50.

*No `fix-2` red record is right.* R2-01 was a missing-test finding: the code already kept the rule, and round 2
showed this with a probe that passes on HEAD. speckit-story-fix step 3 says that for findings that a test is vacuous,
weak or weakened, the stronger test goes in the fix commit and "can pass at once". It saves the red commit with
`red.sh` for findings that the code behaves wrongly. A tests-only red commit here would be green at its own commit,
so `red.sh` could not record it. This review skill (step 5) asks for a `fix-<round>` entry only for a behavioural
fix, and `31102b9` changes no behaviour (`live.ts` is unchanged, and R2-02 below keeps behaviour). The case shows it
can fail through the mutant runs above, fix-2-mutants.log and the gate, and against base it fails with the rest of
the final tests (`final_tests_on_base_exit` 2). `red-commits` rightly keeps only `phase` and `fix-1`.

**R2-02 keeps behaviour.** `get tone()` changed from `includes(value ?? "")` with a cast to
`tones.find((tone) => tone === value) ?? "info"`, with `tones` typed `readonly NoticeTone[]`
(ocelle-notice.ts:22, :213-214). For a value in `tones`, both return that same string. For null, `""`, or any other
string (case and whitespace variants included), both return `"info"`. I checked old against new on 13 values: null,
`""`, the five tones, `INFO`, ` info`, `bogus`, `Stryker was here!`, `undefined` and `null`. There was no difference.
`typecheck` passes, and the setter (`reflect("tone", value, this.tone)`) reads the same `current`. Every mutant of the
line is killed by the tone cases (fix-2-mutants.log) and by my gate run. No equivalent record was needed or added.

**The `ocelle-notice.ts:257` timeout.** `value !== attribute` to `===` in `reflect()`, applied by hand: 3 of 50 fail
in notice-rules.test.ts on assertions. They are "tone, size and announce set their attributes" (`tone: null` against
`'danger'`), "writes no attribute for the default …" and "that leaves the text as it is does not restart a running
wait" (`live: 'polite'` against `'assertive'`). This matches fix-2-mutants.log. My gate run reports this mutant
killed. It is not a survivor.

**My run's two timeouts (R3-02)**, applied by hand against notice-rules.test.ts and announcer.test.ts:
- `live.ts:135` `setAttribute("", …)`: 21 of 69 fail, with `InvalidCharacterError` and `live: 'off'` against
  `'polite'`/`'assertive'` assertions.
- `live.ts:209` `+`: 6 of 69 fail on the minimum-hold assertions, for example "empties the copy at the trigger once
  it has been current for exactly W".

**After the red commits.** `git diff c8600f8..HEAD -- packages gates tooling` removes no test line. The only test
change is the added case. Round 2's analysis of `c3064b5..c8600f8` and `62378c5..c8600f8` stands. No test uses
skip, only, a snapshot or a conditional assertion.

**Mutation.** `pnpm run gate:mutation -- --base 6c9400c` at `5fadc24`, run over the whole diff as CI runs it:
**exit 0**. The result line is "634 mutants on the changed lines of 7 files, none survived; 2 timeouts, 174 compile
errors, 2 zero-mutant entries; 14 equivalent records", in 25:02. The zero-mutant entries are `gates/bin/contrast.ts`
and `src/index.ts`. The 14 equivalent records are the same as in mutation-fix-2.log, and I judged them in rounds 1
and 2. R1-04's optional wording point still applies to `ocelle-notice.ts:343`. This agrees with the fix run
(mutation-fix-2.log) apart from which mutants timed out.

## Checks run

At `5fadc24`, in a scratch copy of the repository under the session scratchpad (Chromium 153 build 1243 through
`OCELLE_CHROMIUM_PATH`, one heavy job at a time). Each hand-applied mutant was reverted, and no repository file was
changed.

| Check | Result |
|---|---|
| `gate:unit-tests` | exit 0, "3532 tests passed in 153 files", 8:00. This includes the fixture-page notice and plant suites. |
| `gate:typecheck` | exit 0, "no type error in the files of tsconfig.json" |
| `gate:lint` | exit 0, "303 files checked, no finding" |
| `gate:style-lint` | exit 0, "14 files checked, no finding" |
| `gate:test-lint` | exit 0, "211 files checked, no finding" |
| `gate:csp` | exit 0, "12 files checked, no finding" |
| `gate:prefix` | exit 0, "248 files checked, no finding" |
| `gate:contrast` | exit 0, "165 pairs checked in light, 173 in dark (154 required per theme)" |
| `gate:manifest` | exit 0, "3 elements checked, no finding" |
| `gate:brand-rules` | exit 0, "7 rules checked" |
| `gate:pins` | exit 0, "5 manifests checked, no finding" |
| `gate:config-copies` | exit 0, the two story-config copies are identical |
| `gate:mutation -- --base 6c9400c` (whole diff) | **exit 0**, none survived, 2 timeouts (R3-02), 25:02 |
| `gate:plants` with `OCELLE_VISUAL_ENGINE=docker` | The full run reached its 1 h background limit after judging 289 plants with no finding: every non-visual timed plant, all 48 visual plants (about 60 s each in the container) and 20 axe plants. I then ran the rest as CI shards (`--plan`: 28 shards). Shards 1 to 3 (all 228 non-visual, non-axe plants, the 7 registry plants included) and shards 26 to 28 (the last 5 axe plants) each exit 0 with "every plant as expected". So all 301 plants were judged as expected. |
| scratch: `live.ts:134` mutants `""`, `if (false)`, `if (true)`; `ocelle-notice.ts:257` `===`; `live.ts:135` `""`; `live.ts:209` `+` | each fails on assertions (Test quality) |
| scratch: old vs new `tone` getter on 13 values | identical |

No visual or axe gate exists for this phase's stories.

**Tasks, constitution, plan.** Every task of `## Phase 2:` in tasks.md is ticked, and round 2 confirmed the work. This
round adds no task. The changed lines keep the constitution checks of rounds 1 and 2: no I/O, no network, tokens
only, no shadow-root IDs and `ariaLive` off. The planner's R2-03 text (contracts/testing.md § Timing, research.md
R-09 and the design-change-2.md addendum) describes `withTiming()` as test/in-process.ts:55-67 implements it. It
sets `next`, runs `run` synchronously and restores in a `finally`. Its one use is the plant row, and the
timing-setter guard test passes in `gate:unit-tests`.

## Earlier findings

Round 2:
- **R2-01: resolved.** The new case (notice-rules.test.ts:273-287) kills the `live.ts:134` StringLiteral mutant on an
  assertion, as I reproduced. My whole-diff gate run has no survivor on the line. The lack of a `fix-2` red record is
  right for a missing-test finding (Test quality). mutation.md § Phase 2 stop 2 now corrects shard 2's "none
  survived".
- **R2-02: resolved.** The fallback literal is gone, behaviour is unchanged, the line has no survivor, and the whole
  diff gate exits 0 (in the fix run and in mine). The result is recorded in mutation.md § Review round 2.
- **R2-03 (note): done** by `17e7ec9`.
- **R2-04 (note): resolved.** Round 2's exit 2 came from the missing `OCELLE_VISUAL_ENGINE`. With it set, all 301
  plants are as expected (Checks run).
- **R2-05 (note):** unchanged, nothing asked.

Round 1: R1-01, R1-02 and R1-03 stay resolved (round 2), and nothing since touches them. R1-04 is unchanged
(optional). R1-05's concern is answered for this round: I checked every timeout, and every mutant of the lines this
round changed, by hand on the fake clock. R1-06 and R1-07 are unchanged. R1-08 did not recur in this round's
`gate:unit-tests` run.
