# Phase 2 phase-end gates and mutation shards (T025)

## Phase-end gates at `1ed4d04` (2026-11-14, this container, 4 CPUs, Chromium 153 build 1243)

| Gate | Result |
|---|---|
| `gate:unit-tests` | exit 0, "3456 tests passed in 152 files" in each of two runs (9:01 and 9:05 wall-clock; the probe of stop-1.md's follow-up among them) |
| `gate:typecheck` | exit 0, "no type error in the files of tsconfig.json" |
| `gate:lint` | exit 0, "300 files checked, no finding" |
| `gate:style-lint` | exit 0, "14 files checked, no finding" |
| `gate:test-lint` | exit 0, "208 files checked, no finding" |
| `gate:csp` | exit 0, "12 files checked, no finding" |
| `gate:prefix` | exit 0, "245 files checked, no finding" |
| `gate:contrast` | exit 0, "165 pairs checked in light, 173 in dark (154 required per theme)" |
| `gate:manifest` | exit 0, "3 elements checked, no finding"; `pnpm --filter @ocelle/elements run manifest` regenerates `custom-elements.json` with no diff |
| `gate:plants` (`OCELLE_VISUAL_ENGINE=docker`) | exit 0, "plants: 301 plants of 17 gates and the registry judged, every plant as expected", 64:44 wall-clock; the manifest plants each as expected (`break-missing`, `break-not-json`, `pass-reordered`, `pass-repository` and the eight `fail-*`) |
| `gate:mutation` | **exit 1** in 21 of 24 shards (run 1, below); exit 0 in every shard after the fixes (§ final) |

## Phase-end gates at `ccb2f06` (after the mutation fixes)

| Gate | Result |
|---|---|
| `gate:unit-tests` | exit 0, "3521 tests passed in 153 files", 8:01 wall-clock |
| `gate:typecheck`, `gate:lint`, `gate:style-lint`, `gate:test-lint`, `gate:csp`, `gate:prefix`, `gate:contrast`, `gate:manifest` | exit 0: "no type error", "302 files checked, no finding", "14 files checked, no finding", "210 files checked, no finding", "12 files checked, no finding", "247 files checked, no finding", "165 pairs checked in light, 173 in dark (154 required per theme)", "3 elements checked, no finding"; `custom-elements.json` regenerates unchanged |
| `gate:mutation` | exit 0 in each of the 25 planned shards (§ final) |

## `gate:mutation`, run 1 (at `1ed4d04`)

`pnpm run gate:mutation -- --base 6c9400c --plan`: "24 shards, 23 cuts within files". Each shard run alone as
`pnpm run gate:mutation -- --base 6c9400c --files <entries>`, one after the other, timed as T002 timed its shard
(wall-clock from the command's start to its exit, in this container). Shards 1 to 9 hold a `packages/elements/src/live.ts`
entry.

| Shard | Entries | Wall-clock | Result |
|---|---|---|---|
| 1 | `gates/bin/contrast.ts,packages/elements/scripts/manifest.ts,packages/elements/src/define.ts,packages/elements/src/index.ts,packages/elements/src/live.ts:1-30` | 415.3 s (6:55.3) | exit 1 |
| 2 | `packages/elements/src/live.ts:31-60` | 216.7 s (3:36.7) | exit 0 |
| 3 | `packages/elements/src/live.ts:61-90` | 331.6 s (5:31.6) | exit 1 |
| 4 | `packages/elements/src/live.ts:91-120` | 347.8 s (5:47.8) | exit 1 |
| 5 | `packages/elements/src/live.ts:121-150` | 397.7 s (6:37.7) | exit 1 |
| 6 | `packages/elements/src/live.ts:151-180` | 365.0 s (6:05.0) | exit 1 |
| 7 | `packages/elements/src/live.ts:181-210` | 321.0 s (5:21.0) | exit 1 |
| 8 | `packages/elements/src/live.ts:211-240` | 333.4 s (5:33.4) | exit 1 |
| 9 | `packages/elements/src/live.ts:241-255,packages/elements/src/ocelle-notice.ts:1-30` | 374.6 s (6:14.6) | exit 1 |
| 10 | `packages/elements/src/ocelle-notice.ts:31-60` | 315.7 s (5:15.7) | exit 1 |
| 11 | `packages/elements/src/ocelle-notice.ts:61-90` | 416.5 s (6:56.5) | exit 1 |
| 12 | `packages/elements/src/ocelle-notice.ts:91-120` | 182.1 s (3:02.1) | exit 0 |
| 13 | `packages/elements/src/ocelle-notice.ts:121-150` | 181.4 s (3:01.4) | exit 0 |
| 14 | `packages/elements/src/ocelle-notice.ts:151-180` | 205.1 s (3:25.1) | exit 0 |
| 15 | `packages/elements/src/ocelle-notice.ts:181-210` | 327.1 s (5:27.1) | exit 1 |
| 16 | `packages/elements/src/ocelle-notice.ts:211-240` | 309.7 s (5:09.7) | exit 1 |
| 17 | `packages/elements/src/ocelle-notice.ts:241-270` | 284.5 s (4:44.5) | exit 0 |
| 18 | `packages/elements/src/ocelle-notice.ts:271-300` | 336.9 s (5:36.9) | exit 1 |
| 19 | `packages/elements/src/ocelle-notice.ts:301-330` | 333.9 s (5:33.9) | exit 1 |
| 20 | `packages/elements/src/ocelle-notice.ts:331-360` | 446.5 s (7:26.5) | exit 1 |
| 21 | `packages/elements/src/ocelle-notice.ts:361-390` | 333.9 s (5:33.9) | exit 1 |
| 22 | `packages/elements/src/ocelle-notice.ts:391-420` | 376.4 s (6:16.4) | exit 1 |
| 23 | `packages/elements/src/ocelle-notice.ts:421-450` | 270.1 s (4:30.1) | exit 1 |
| 24 | `packages/elements/src/ocelle-notice.ts:451-480,packages/tokens/src/source.ts` | 411.3 s (6:51.3) | exit 1 |

The largest `src/live.ts` shard is shard 1, 415.3 s (6:55.3), under the 420 s stop; no `src/live.ts` shard is over 7:00.
Shard 20 (`ocelle-notice.ts:331-360`, no `src/live.ts` entry) took 446.5 s (7:26.5): over 7:00 but not a stop under
tasks.md (the stop names shards that hold a `src/live.ts` entry), and under the CI job's 10-minute limit.

Run 1's mutants on the changed lines: 632, of them 165 compile errors, 3 timeouts, **108 survived and 20 without
coverage** (score 72.6 % of the 467 valid mutants; the gate needs 100 %). The survivors are in `define.ts` (1),
`live.ts` (29) and `ocelle-notice.ts` (98, the no-coverage ones among them). Most are guards that the end-of-wait
re-check or the region's `aria-live="off"` backs up, so the scenarios' counts do not see them, and rules no in-process
test reaches (the property setters, the text of an `img`, a comment or a hidden child, `alert()` while waiting).

## The survivors fixed (runs 2 to 7)

Each survivor was read in Stryker's own report (the mutant, not only the line; a diagnostic `stryker run` with the
clear-text reporter where the gate's line was not enough) and either killed by a test, removed as redundant code that
changed no behaviour, or recorded as equivalent with its reason. Each added test was checked to fail on the mutants it
targets (a local mutant-by-mutant run of the test file). No test written before was changed. The commits:

| Commit | What |
|---|---|
| `1b5cb85` | after run 1: `test/announcer.test.ts` (the `Announcer` under fake timers at the shipped timing), `test/notice-rules.test.ts` (the notice's rules one at a time under fake timers, read on its region), `registering()` in `test/define.test.ts`; redundant code removed (`clearBaseline()`, the `waitNext` resets, the alert path's baseline reset on insertion, `onContent()`'s pending check, `leaveAlert()`'s comparison, two `syncLive()` calls), equivalent records |
| `f57394d` | after run 2 (shards 1 to 12): `releaseHeld()`'s `stop()` killed; `end()`'s `stop()` recorded; size's `noAccessor` killed; the property options one per line, so each record names one mutant |
| `752027d` | after run 3 (shards 6 to 25): `characterData`, `headingPresent()`'s join, the size reaching `onAnnounce()`, `trigger(false)` on a politeness changed back, the alert path's `alert()` on a held copy killed; `onRole()`'s `before === "alert"` removed; `super.updated()` recorded |
| `f5fdc92` | after run 4 (shards 15, 18, 20, 22 to 25): `old === value`, `before === after`, `onContent()`'s `sameText()` killed; `onRole()`'s `after !== null` for a silent notice removed |
| `4bcdc17` | after the sweep at `f5fdc92` (run 5): `super.disconnectedCallback()` recorded; the move's `moving = false` removed; a moved copy staying past the minimum hold |
| `30572ae` | after run 6 (shards 20 to 25): `super.attributeChangedCallback()` recorded (it survives deterministically; the earlier runs that killed it most likely did so through a timing failure) |
| `ccb2f06` | after run 7 (shards 20 to 25): the first load's `takeBaseline()` killed |

## `gate:mutation`, final (each shard on the source it has at `ccb2f06`)

`pnpm run gate:mutation -- --base 6c9400c --plan` at `ccb2f06`: "25 shards, 24 cuts within files". Each shard was run
alone as `pnpm run gate:mutation -- --base 6c9400c --files <entries>`, timed as T002 timed its shard (wall-clock from
the command's start to its exit, in this container, one shard at a time). Shards 1 to 19 ran at `f5fdc92` and their
lines are unchanged since (only tests were added after it); shards 20 and 22 to 25 at `30572ae`, shard 21 at
`ccb2f06` (the commits after them change no line of theirs). **Shards 1 to 9 hold a `packages/elements/src/live.ts`
entry**; `live.ts` is unchanged since `f57394d`.

| Shard | Entries | At | Wall-clock | Result |
|---|---|---|---|---|
| 1 | `gates/bin/contrast.ts,packages/elements/scripts/manifest.ts,packages/elements/src/define.ts,packages/elements/src/index.ts,packages/elements/src/live.ts:1-30` | `f5fdc92` | 406.7 s (6:46.7) | exit 0: 13 mutants on the changed lines of 5 files, none survived; 0 timeouts, 1 compile error, 3 zero-mutant entries; 1 equivalent record |
| 2 | `packages/elements/src/live.ts:31-60` | `f5fdc92` | 210.3 s (3:30.3) | exit 0: 6 mutants on the changed lines of 1 file, none survived; 0 timeouts, 5 compile errors, 0 zero-mutant entries; 0 equivalent records |
| 3 | `packages/elements/src/live.ts:61-90` | `f5fdc92` | 311.2 s (5:11.2) | exit 0: 10 mutants on the changed lines of 1 file, none survived; 0 timeouts, 2 compile errors, 0 zero-mutant entries; 1 equivalent record |
| 4 | `packages/elements/src/live.ts:91-120` | `f5fdc92` | 336.9 s (5:36.9) | exit 0: 28 mutants on the changed lines of 1 file, none survived; 0 timeouts, 10 compile errors, 0 zero-mutant entries; 0 equivalent records |
| 5 | `packages/elements/src/live.ts:121-150` | `f5fdc92` | 393.7 s (6:33.7) | exit 0: 33 mutants on the changed lines of 1 file, none survived; 0 timeouts, 11 compile errors, 0 zero-mutant entries; 0 equivalent records |
| 6 | `packages/elements/src/live.ts:151-180` | `f5fdc92` | 333.3 s (5:33.3) | exit 0: 24 mutants on the changed lines of 1 file, none survived; 0 timeouts, 8 compile errors, 0 zero-mutant entries; 0 equivalent records |
| 7 | `packages/elements/src/live.ts:181-210` | `f5fdc92` | 311.0 s (5:11.0) | exit 0: 16 mutants on the changed lines of 1 file, none survived; 0 timeouts, 4 compile errors, 0 zero-mutant entries; 1 equivalent record |
| 8 | `packages/elements/src/live.ts:211-240` | `f5fdc92` | 301.8 s (5:01.8) | exit 0: 25 mutants on the changed lines of 1 file, none survived; 0 timeouts, 9 compile errors, 0 zero-mutant entries; 1 equivalent record |
| 9 | `packages/elements/src/live.ts:241-251,packages/elements/src/ocelle-notice.ts:1-30` | `f5fdc92` | 311.6 s (5:11.6) | exit 0: 26 mutants on the changed lines of 2 files, none survived; 0 timeouts, 10 compile errors, 0 zero-mutant entries; 0 equivalent records **Corrected (review round 1, R1-02):** this "none survived" was not an assertion. The `StringLiteral` mutant of `ocelle-notice.ts:29` (`role ?? ""` replaced by `"Stryker was here!"`) is equivalent: a null role then reads `"stryker"`, which is neither `alert` nor `status`. No test can kill it, so its kill in this run was a timing kill. It survived in the review's whole-diff run (exit 1). See § Review round 1 for the rewritten line and the re-run. |
| 10 | `packages/elements/src/ocelle-notice.ts:31-60` | `f5fdc92` | 264.8 s (4:24.8) | exit 0: 54 mutants on the changed lines of 1 file, none survived; 0 timeouts, 19 compile errors, 0 zero-mutant entries; 0 equivalent records |
| 11 | `packages/elements/src/ocelle-notice.ts:61-90` | `f5fdc92` | 253.7 s (4:13.7) | exit 0: 16 mutants on the changed lines of 1 file, none survived; 0 timeouts, 1 compile error, 0 zero-mutant entries; 7 equivalent records |
| 12 | `packages/elements/src/ocelle-notice.ts:91-120` | `f5fdc92` | 172.9 s (2:52.9) | exit 0: 0 mutants on the changed lines of 1 file, none survived; 0 timeouts, 0 compile errors, 1 zero-mutant entry; 0 equivalent records |
| 13 | `packages/elements/src/ocelle-notice.ts:121-150` | `f5fdc92` | 173.1 s (2:53.1) | exit 0: 0 mutants on the changed lines of 1 file, none survived; 0 timeouts, 0 compile errors, 1 zero-mutant entry; 0 equivalent records |
| 14 | `packages/elements/src/ocelle-notice.ts:151-180` | `f5fdc92` | 173.9 s (2:53.9) | exit 0: 0 mutants on the changed lines of 1 file, none survived; 0 timeouts, 0 compile errors, 1 zero-mutant entry; 0 equivalent records |
| 15 | `packages/elements/src/ocelle-notice.ts:181-210` | `f5fdc92` | 317.2 s (5:17.2) | exit 0: 12 mutants on the changed lines of 1 file, none survived; 0 timeouts, 2 compile errors, 0 zero-mutant entries; 0 equivalent records |
| 16 | `packages/elements/src/ocelle-notice.ts:211-240` | `f5fdc92` | 281.1 s (4:41.1) | exit 0: 17 mutants on the changed lines of 1 file, none survived; 0 timeouts, 6 compile errors, 0 zero-mutant entries; 0 equivalent records |
| 17 | `packages/elements/src/ocelle-notice.ts:241-270` | `f5fdc92` | 291.4 s (4:51.4) | exit 0: 28 mutants on the changed lines of 1 file, none survived; 0 timeouts, 12 compile errors, 0 zero-mutant entries; 0 equivalent records |
| 18 | `packages/elements/src/ocelle-notice.ts:271-300` | `f5fdc92` | 395.1 s (6:35.1) | exit 0: 62 mutants on the changed lines of 1 file, none survived; 0 timeouts, 20 compile errors, 0 zero-mutant entries; 0 equivalent records |
| 19 | `packages/elements/src/ocelle-notice.ts:301-330` | `f5fdc92` | 259.4 s (4:19.4) | exit 0: 16 mutants on the changed lines of 1 file, none survived; 0 timeouts, 6 compile errors, 0 zero-mutant entries; 0 equivalent records |
| 20 | `packages/elements/src/ocelle-notice.ts:331-360` | `30572ae` | 372.0 s (6:12.0) | exit 0: 47 mutants on the changed lines of 1 file, none survived; 0 timeouts, 7 compile errors, 0 zero-mutant entries; 2 equivalent records |
| 21 | `packages/elements/src/ocelle-notice.ts:361-390` | `ccb2f06` | 334.9 s (5:34.9) | exit 0: 40 mutants on the changed lines of 1 file, none survived; 0 timeouts, 4 compile errors, 0 zero-mutant entries; 0 equivalent records |
| 22 | `packages/elements/src/ocelle-notice.ts:391-420` | `30572ae` | 309.5 s (5:09.5) | exit 0: 52 mutants on the changed lines of 1 file, none survived; 0 timeouts, 6 compile errors, 0 zero-mutant entries; 0 equivalent records |
| 23 | `packages/elements/src/ocelle-notice.ts:421-450` | `30572ae` | 224.1 s (3:44.1) | exit 0: 31 mutants on the changed lines of 1 file, none survived; 0 timeouts, 4 compile errors, 0 zero-mutant entries; 0 equivalent records |
| 24 | `packages/elements/src/ocelle-notice.ts:451-480` | `30572ae` | 199.1 s (3:19.1) | exit 0: 13 mutants on the changed lines of 1 file, none survived; 0 timeouts, 2 compile errors, 0 zero-mutant entries; 0 equivalent records |
| 25 | `packages/elements/src/ocelle-notice.ts:481-508,packages/tokens/src/source.ts` | `30572ae` | 308.2 s (5:08.2) | exit 0: 28 mutants on the changed lines of 2 files, none survived; 0 timeouts, 11 compile errors, 0 zero-mutant entries; 1 equivalent record |

**Result: every shard exit 0** (but see the shard 9 correction: one of its kills was a timing kill of an equivalent mutant). 597 mutants on the changed lines: 160 compile errors, 0 timeouts, 0 survived, 0
without coverage: **mutation score 100 % of the 437 valid mutants**, with 14 equivalent records (13 new: three in
`live.ts`, ten in `ocelle-notice.ts`; and the earlier `gates/bin/contrast.ts:116` record).

**The `src/live.ts` shard timings** (shards 1 to 9, final source): 406.7, 210.3, 311.2, 336.9, 393.7, 333.3, 311.0,
301.8 and 311.6 s; the largest is shard 1, **406.7 s (6:46.7), under the 420 s stop**. Over every run of this phase the
largest `src/live.ts` shard took 415.3 s (run 1, shard 1); none was over 7:00, so no stop. Two `ocelle-notice.ts`
shards, which hold no `src/live.ts` entry, came close to or over it in earlier runs: 446.5 s (run 1, shard 20), 418.0 s
(run 3, shard 11) and 417.5 s (run 4, shard 20); in the final sweep the largest of them is 395.1 s (shard 18). All are
under the CI job's 10-minute limit.

## Open, for the reviewer

- **Timing failures under Stryker.** In run 3, shard 23's dry run failed once ("Stryker wrote no report (There were
  failed tests in the initial test run.)", exit 2, 85 s); it passed in each later run. Several mutants were reported
  killed in one run and survived in a later one with their lines unchanged (for example `super.attributeChangedCallback()`
  and the first load's `takeBaseline()`): the in-process timing cells can fail under Stryker's load, which kills a
  mutant without an assertion on it. The rule tests added here run on a fake clock and are not affected; the
  scenarios and plants keep their real timing (T002's `D`, unchanged).
- `gate:plants` ran at `1ed4d04`, before these fixes; they change no file of a plant tree and no manifest
  (`custom-elements.json` regenerates unchanged), so it was not run again.

## Review round 1 (R1-02): `ocelle-notice.ts:29` without the literal

`liveRoleOf()` read the role as `(role ?? "").trim()...`. Its `StringLiteral` mutant was equivalent, and a review
whole-diff run at `fdc0eff` showed it surviving. The line is now `role?.trim().split(/\s/)[0]?.toLowerCase()`, with
the same result: a null role gives `undefined`, which is neither `alert` nor `status`, so `liveRoleOf` returns null.
The line has no string literal and needs no equivalent record. Its `role.trim` mutant (the optional chaining
removed) is a compile error under strict null checks.

Shard 9 re-run on the fixed source (2026-11-15, this container, one job at a time), as
`pnpm run gate:mutation -- --base 6c9400c --files packages/elements/src/live.ts:241-251,packages/elements/src/ocelle-notice.ts:1-30`
(the shard's entries in `--plan` are unchanged):

| Shard | Entries | Wall-clock | Result |
|---|---|---|---|
| 9 | `packages/elements/src/live.ts:241-251,packages/elements/src/ocelle-notice.ts:1-30` | 298.0 s (4:58.0) | exit 0: 25 mutants on the changed lines of 2 files, none survived; 0 timeouts, 11 compile errors, 0 zero-mutant entries; 0 equivalent records |

This fix changes no other source line. The test changes of round 1 (scenarios/notice.ts, plants.test.ts,
fixtures/notice-plants.ts) are not mutated.
