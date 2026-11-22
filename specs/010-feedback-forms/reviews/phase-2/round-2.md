---
phase: 2
round: 2
verdict: changes_requested
base: 6c9400cbaa1da7d2b1ce96d496e65101942524a0
head: c8600f8
tdd_check: pass
---

# Phase 2 review, round 2

Change under review: `git diff 6c9400c..c8600f8`, with no uncommitted change. Since round 1 (`fdc0eff`) the branch has
the fix commit `91a8b41`, stop 2 and its decision (`bc16cc4`, option (a)), design change 2 (`8a123f6`), T025a red
`c3064b5` and T025b green `ccfd750`. `tdd-check.json` is `pass` (red `phase` `62378c5` exit 1, `fix-1` `c3064b5` exit
1, base exit 2, scaffold exit 2, head `ccfd750` exit 0). `c8600f8` adds only that file.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R2-01 | blocking | packages/elements/src/live.ts:134; tests: packages/elements/test/notice-rules.test.ts:236-272, packages/elements/test/announcer-rules.ts:49-55 | `pnpm run gate:mutation -- --base 6c9400c` at `c8600f8` (whole diff, 26:13) reports `live.ts:134: StringLiteral: Survived: replaced by ""`. The line is T025b's own: `live()` begins an empty state when `aria-live` goes from `off` to a politeness (research R-02 step 2 and data-model *Announce*: "its `aria-live` set from `off` to a politeness"). The mutant never calls `shown()` from `live()`. It is **not equivalent.** In a scratch copy I applied the mutant. All 359 tests of the `elements` project passed. A probe test then failed on the mutant ("expected '' to be 'B'") and passed on HEAD. The probe used the notice-rules fake clock: a notice rendered without `announce` while loading, `announce` set 20 ms after the load, then a text change, with the copy read `W` (300 ms) after the change. With the mutant, the empty state keeps its loading-era start, so the write slips to the pre-load floor. No test pins this rule. The rule case's `rendered()` builds the announcer and calls `live("polite")` at once, so construction and the `off` change share one timestamp. The two notice-rules cases make only notices that are live from the start. In process the floor never binds. mutation.md § Phase 2 stop 2 reports shard 2 (`live.ts:131-287`, which contains :134) as "none survived". That kill was not an assertion, as R1-05 warned. | Red first: add a fake-clock case that fails without the `off` rule, for example the probe above (`announce`, or a live `role`, set after the load on a notice rendered while loading, and the next change written `W` after it). Then re-run the mutation gate against the phase base (see R2-02) and record the result. |
| R2-02 | blocking | packages/elements/src/ocelle-notice.ts:213 | The same whole-diff run reports `ocelle-notice.ts:213: StringLiteral: Survived: replaced by "Stryker was here!"` on `this.getAttribute("tone") ?? ""`. I judge this mutant equivalent: for an absent `tone`, neither `""` nor `"Stryker was here!"` is in `tones`, so the getter returns `"info"` in both cases. It is the same class as R1-02. The gate exits 1 (2 findings in 7 changed files, 631 mutants), so CI fails. My round-1 run did not report this line, so its kill there was also not an assertion. Item 5: the `--base 8a123f6` shards cover T025b's lines only. They cannot stand in for the gate as CI runs it, and this run shows that. | Write the line without the fallback literal (for example `tones.includes(this.getAttribute("tone") ?? "info")` keeps the result), or add a `Stryker disable next-line StringLiteral: equivalent, ...` record with the reason. Then run `gate:mutation -- --base 6c9400c` over the whole diff, or every CI shard of `--plan` against that base, and record it in mutation.md. |
| R2-03 | note | packages/elements/test/in-process.ts:55-67; specs/010-feedback-forms/contracts/testing.md:110-116 | `withTiming()` is a second use of the setter: plants.test.ts:78 applies the shipped `announcerDefaults` for the synchronous fake-clock case and then restores the replaced timing. The call is in in-process.ts, so the guard `test/node/timing-setter.test.ts` still finds that file as its only caller, and the call does not touch `firstTimingReturn()`'s `first`. It weakens nothing. testing.md § Timing still says in-process.ts calls the setter "before each scenario with the one test constant" and does not name this use. | Optional: name `withTiming()` in § Timing. |
| R2-04 | note | tasks.md T025b; round-1-fixes.md § Follow-up | T025b asks for `gate:plants` and for `gate:mutation -- --base <phase 2 base>`. The implementer used `--base 8a123f6` and skipped `gate:plants` because no plant tree changed (`git diff fdc0eff..HEAD -- gates/` is empty). My `gate:plants` run here exited 2 after 255 plants with no finding. The gate reported "no container engine for 46 visual plants", although `docker info` answers from this shell. These are the visual plants of `gates/plants/visual/`, which this phase does not touch. | None beyond R2-02. |
| R2-05 | note | packages/elements/test/scenarios/notice.ts:122-132 | On fixture pages the new lower bound is the pre-load `W` less half the after-load `W` (550 ms), against the designed 700 ms after the first render, to allow for the capture's sampling. A wait that wrote 560 ms after the render would pass these cells. The exact bound is pinned on the fake clock (announcer-rules.ts:77, `before` "" at 699 ms and "B" at 700 ms; notice-rules.test.ts:239-251), so nothing is unpinned. | None. |

## Test quality

**Red evidence (fix-1, `c3064b5`).** red-fix-1.log has 11 of 3531 failed, each on its assertion. They are the README
item, the fake-clock rule case, the two notice-rules cases, the in-process "empty-state start" plant row, its two
fixture-page rows and four fixture-page cells. None is a setup or import error. red-fix-1-fixture.log fails 7 of 23
selected first-load cells with `settled: []` against one expected announcement, which is stop-2.md's run 0. The
commit changes tests only.

**After the red commits.**
- `git diff c3064b5..HEAD -- packages/elements/test`: only the test-lint change. `emptyStartCase` now delegates to
  `emptyStartReadings`. announcer.test.ts compares the returned readings with `emptyStartExpected` through
  `toEqual`, where it used chai's `deepEqual` before. The values are strings, or `null` from `textContent`, so the
  two assertions are equivalent. The plant row still calls `emptyStartCase` with the same message.
- `git diff 62378c5..HEAD -- packages/elements/test/scenarios/`: `pastFirstLoad` is gone. `loaded()` and
  notice-matrix.ts are byte-identical to the red commit (notice-matrix.ts has no diff), so every first-load cell
  triggers in the first task after the load in both harnesses again. The additions are stricter:
  - `writtenAfterFirstRender` (US1-11 text, US1-13 one task) is a new assertion. It adds a lower bound (R2-05) and
    removes nothing. In process it requires a gap of at least 50 ms, which the write at `W` = 100 ms meets.
  - The US1-13 hold `atLeast` grows from `2 W(loaded) + H` to `W(loading) + W(loaded) + H`. A longer capture sees more
    and keeps the same `held` and `final` checks. In process both values are equal (`timing` at in-process.ts:29 gives
    both states `D` 50).
  - The first step of "US1-13 10 ms after a write" waits `W(loading)` and checks that gap. On the fixture pages the
    write comes 650 to 690 ms after the change, so C still lands 10 to 50 ms after B's write. A write later than 700 ms
    would merge B into C and fail the cell's `[B, C]`. In process the step is unchanged.
  - `px()` and US1-15 status `settleAnnouncement` are kept from `0bdb997`, as round 1 accepted.
- Timing setter: `setAnnouncerTimingForTests` is called only from packages/elements/test/in-process.ts (lines 42 and
  61). The guard test passes in `gate:unit-tests`. announcer.test.ts and notice-rules.test.ts use the shipped timing
  without the setter. See R2-03.
- New plants: `IgnoresEmptyStart` (`waitLength()` = `waitTime()`) bites the fake-clock case and the two fixture-page
  rows. `DeafAfterFirstLoad` (round 1's plant) bites US1-11 text, US1-13 one task and SC-002 none info in process.
  Every row has an unconditional assertion, and no test uses skip, only or a snapshot.

**Mutation.** `gate:mutation -- --base 6c9400c` at `c8600f8` exits 1: 631 mutants on the changed lines, 169 compile
errors, 0 timeouts, 2 zero-mutant entries (`gates/bin/contrast.ts`, `src/index.ts`) and 2 survivors (R2-01, R2-02). I
read the 14 equivalent records listed. They are round 1's 13 plus `gates/bin/contrast.ts:116`. Their lines are
unchanged since round 1 apart from renumbering, and my judgement of round 1 stands (R1-04 still applies to `:343`).
`live.ts:29`'s rewrite has no survivor.

## Checks run

At `c8600f8`, in a scratch copy of the repository under the session scratchpad (Chromium 153 build 1243 through
`OCELLE_CHROMIUM_PATH`, one heavy job at a time). No repository file was changed.

| Check | Result |
|---|---|
| `gate:typecheck` | exit 0, "no type error in the files of tsconfig.json" |
| `gate:lint` | exit 0, "303 files checked, no finding" |
| `gate:style-lint` | exit 0, "14 files checked, no finding" |
| `gate:test-lint` | exit 0, "211 files checked, no finding" |
| `gate:csp` | exit 0, "12 files checked, no finding" |
| `gate:prefix` | exit 0, "248 files checked, no finding" |
| `gate:contrast` | exit 0, "165 pairs checked in light, 173 in dark (154 required per theme)" |
| `gate:manifest`, `gate:brand-rules`, `gate:pins`, `gate:config-copies` | exit 0, no finding |
| `gate:unit-tests` | exit 0, "3531 tests passed in 153 files", 513 s |
| fixture pages, `vitest run --project elements-browser test/browser/notice.test.ts test/browser/plants.test.ts`, 3 runs in a row | 82/82 passed in each (201 s, 199 s, 199 s). This includes the 22 first-load cells and the two "empty-state start" rows. |
| `gate:mutation -- --base 6c9400c` (whole diff) | **exit 1**, 2 findings (R2-01, R2-02), 1573 s |
| scratch: the `live.ts:134` mutant applied, `vitest run --project elements` | 359/359 passed |
| scratch: probe fake-clock test (`announce` set after the load on a notice rendered while loading) | fails on the mutant, passes on HEAD (R2-01) |
| `gate:plants` | exit 2 after 1132 s: 255 plants with no finding, 46 visual plants not run (R2-04) |

No visual or axe gate exists for this phase.

**Design change 2 against the code (item 3).** The records match the code, R2-01 aside, which is a test gap and not
a mismatch. The empty state begins where research R-02 step 2 and data-model *Announce* say it does:
- **Rendered while live (first load, insertion).** `onConnect()` calls `shown()` on every connection that is not a
  move (ocelle-notice.ts:377). The first `updated()` then calls `live()` from `off` (`syncLive`, :311; live.ts:134),
  which moves the start to after Lit's render. That is the "rendered" moment, in the same load state.
- **Shown again (reveal).** `onHidden(false)` calls `shown()` (:394).
- **`aria-live` from `off`.** live.ts:134. A region that stays `off` also resets its start, but such a region
  announces nothing, and its next politeness resets the start again.
- **Copy emptied.** `release()` calls `shown()` only when the region held text (live.ts:287). This covers the minimum
  hold's end, the hold's end and a cancel of a held copy. Every cancel path (`hidden`, removal, live stopped) is
  followed by a reveal, an insertion or `live()` from `off` before any later wait.
- **Not a start.** A change between `polite` and `assertive` does not begin one. A restart does not either, because
  `wait()` leaves `emptySince` alone. A move does not, because `onConnect` returns before `shown()`.
- **The bound.** `waitLength()` (live.ts:245-248) is `max(W(now), start + W(s) - now)`. In process the floor is at most
  `W`, so it never binds.

The R1-03 records were also amended to the code:
- data-model.md row 52 (`role change`) announces without comparing, and row 55 is removed.
- The *Alert path* says the baseline stays as it was, and mutations and `tone` changes have no pending row.
- research.md R-02 describes the `.announcer` rule with no `clip`.
- The 1750 ms sum is now right in testing.md:20 and research.md:547. The constitution checks of round 1 still hold for
  the changed lines (no I/O, tokens only, no shadow-root IDs, `ariaLive` off).

## Earlier findings

- **R1-01: resolved.** `pastFirstLoad` is removed from both harnesses. `loaded()`, the hold cell and all 15 SC-002
  cells trigger in the first task after the first load, as in `62378c5`. The in-process cells pass in
  `gate:unit-tests`, and the deaf-window plant bites three of them. On the fixture pages, US1-11 text and heading,
  US1-13 one task, 100 ms apart, 10 ms after a write and hold, the two-notices Edge case and the 15 SC-002 cells
  passed 3 of 3 runs. The element change came through stop 2, the operator's decision (a), design change 2 and red
  `c3064b5` (the `fix-1` entry), as the finding required.
- **R1-02: resolved as stated.** `liveRoleOf()` has no literal (ocelle-notice.ts:29), and the whole-diff run has no
  survivor on it. The gate as a whole still fails, on R2-01 and R2-02.
- **R1-03: resolved** by design change 2 (see the item-3 paragraph above).
- **Notes R1-04 to R1-08.** R1-04 is unchanged (optional). R1-05 recurred: two kills in the earlier runs were not
  assertions (R2-01, R2-02). R1-06 and R1-07 are unchanged. R1-08 did not recur in 4 fixture-page runs (the
  `gate:unit-tests` run and the 3 runs above).
