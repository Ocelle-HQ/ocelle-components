---
phase: 3
round: 2
verdict: approved
base: cd1d73c8d5c390e674480268fb9953c770b10bfc
head: a8a9d8d700673cfc2d1eaa0f5621a7f0e5bb70b8
tdd_check: pass
---

# Phase 3 review, round 2

Scope: `git diff cd1d73c..a8a9d8d`. What is new since round 1 (6a6042f) is the operator's decision record 91298a9,
the withdrawal f572910, the red commit f2ec02e, the fix commit 7c697ab and the tdd-check record a8a9d8d. The tree was
clean. The decisions in force are those of round 1, plus `operator-round-1-decisions.md`. The operator's CI-first rule
applies.

What changed since round 1:

- Source: `ocelle-evidence-chain.ts` and `ocelle-event-timeline.ts` only. Each element's `connectedCallback` now
  requests an update (chain :193, timeline :150). The chain keeps its size observer across a disconnection again
  (:196-204). Comments and equivalence reasons were re-worded.
- Tests: three shared bodies in f2ec02e (`scenarios/evidence-chain.ts`, `scenarios/event-timeline.ts`). No test file
  changed after f2ec02e (`git diff f2ec02e..HEAD -- packages/elements/test storybook` is empty).
- Documents: `contracts/ocelle-evidence-step.md`, `research.md` R-12, `mutation.md`, `plants.md`,
  `round-1-fixes.md`, `red-commits`, `red-fix-1.log`, and the tdd-check records.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R2-01 | note | packages/elements/src/ocelle-evidence-chain.ts:196-204; packages/elements/test/scenarios/evidence-chain.ts:514 | **At HEAD, the kept size observer of R1-03 is redundant, and no test pins it.** Since R1-01's fix, every connection renders, and `updated()` observes the `<ol>` and every `<li>` again, so a moved chain decides its line ends either way. I put `this.#sizes.disconnect();` back into `disconnectedCallback` at HEAD, and all 27 in-process chain tests passed, the moved-chain body among them. `mutation.md` § Review round 1 says the same thing ("that body no longer depends on the call alone"). The red history is still real: at f2ec02e neither fix is present, and `round-1-fixes.md` records that the kept observer alone made the body pass. The comment at :196-197 is true, but it reads as if the kept observer were the only reason. No mutant can reach a line that is absent, so this is no mutation finding. | None. Optional: next time the file is touched, say in the comment that the render on connection also re-observes. |
| R2-02 | note | reviews/phase-3/mutation.md § Review round 1 | **The fix round's mutation run used `--base 5e7f6df` (phase 2's base) and `--files` instead of the phase base. I accept that deviation.** For the three files named, it mutates a superset of the phase's changed lines. It is needed to judge the timeline's `#mutations.disconnect()` record, because line 158, which that record covers, is unchanged since `cd1d73c`. The only phase-3 source file missing from `--files` is `index.ts`, which carries no mutant and did not change in this round. My own run on the phase base, as the skill asks, exits 0 (Test quality). | None. |

No blocking finding.

## Test quality

- **Red evidence (fix-1).** `red-commits` has `fix-1 f2ec02e`. f2ec02e changes only `scenarios/evidence-chain.ts` and
  `scenarios/event-timeline.ts`, both under the test pathspec. `red-fix-1.log` shows exit 1 and
  `8 of 7773 tests failed`. Six of these failures are the three new bodies, each failing in both harnesses with an
  `AssertionError` on its value: the chain re-attach (R1-01), the moved chain (R1-03) and the timeline re-attach
  (R1-11). The other two are load timeouts in gate integration tests that this round does not touch.
  `check-red-fix-1.log`, the tdd-check's own run of the red commit, shows only the six expected failures. Neither log
  has a syntax, import, reference or type error, and neither has a sandbox path.
- **R1-03's red history is real.** f572910 changes only `ocelle-evidence-chain.ts` and `scenarios/evidence-chain.ts`.
  In the source, it puts `this.#sizes.disconnect()` back and removes the kept-observer comment and its
  `BlockStatement` record, so `disconnectedCallback` is again as at 95086aa (`git diff 95086aa f572910` shows only
  5fa191c's other changes, which stay). In the test file, it removes the moved-chain body and its doc line. f2ec02e
  restores that body unchanged: `git diff 5fa191c f2ec02e` on the scenario file shows only the doc comment and the
  two new bodies. At f2ec02e the moved-chain body fails in both harnesses (above), and at 7c697ab it passes.
- **tdd-check.** `pass`, with `red_commits` `phase` (exit 1) and `fix-1` (exit 1). Against the final tests, the base
  exits 2 and the scaffold exits 1; the head exits 0, with `7773 tests passed in 241 files`. The record's head is
  7c697ab. a8a9d8d adds only the check records.
- **Weakened tests.** Nothing changed after f2ec02e. Since the phase's red commit e82e535, the test files only gained
  bodies.
- **Vacuous assertions.** The new bodies return their whole observed state, and both harnesses compare it with
  `toEqual`. The fixture harness also checks the console and CSP record. Each body checks the appended or hidden state
  with its positive counterpart: the new step's box and the hidden step's missing box. `gate:test-lint` is clean.
- **The bodies fail without the fix.** In process, I removed the two `connectedCallback` `requestUpdate()` calls (chain
  :193, timeline :150). The two re-attach bodies failed, and every other body passed. I also wrote an independent
  probe as a scratch test, deleted afterwards. A chain had a chip step turned into a default step and its last step
  removed while detached. A timeline had an event's `time` set and its last event removed while detached. At HEAD
  both elements show the change: 3 items, ordinals 1 to 3 and the line end on the last item; and 2 items with
  `has-time next-has-time` and `has-time`. Without the calls, both fail.
- **Mutation.** I ran `pnpm run gate:mutation -- --base cd1d73c8d5c390e674480268fb9953c770b10bfc` at HEAD: **exit 0**,
  `mutation: 100 mutants on the changed lines of 4 files, none survived; 2 timeouts, 15 compile errors, 1 zero-mutant
  entry; 6 equivalent records`. The run kills the chain's and the timeline's new `requestUpdate()` mutants. I read the
  six records:
  - The chain's `ObjectLiteral` (:50), `super.disconnectedCallback()` (:200) and `aria-label` guard `true` variant
    (:208) are unchanged and were accepted in round 1.
  - The chain's `#mutations.disconnect()` (:202) and the timeline's (:157) are re-derived (R1-02, R1-11). **I accept
    both.** With a render on connection, a mutation observer kept across a disconnection only adds renders while the
    element is detached. Those renders read the same children as the render requested on reconnection, which decides
    what is shown, and `observe()` on reconnection replaces the options. I checked this in process. With
    `#mutations.disconnect()` removed from both elements, all 64 bodies pass: the chain's and the timeline's, the two
    re-attach bodies, and my two probes. Round 1's reproduction no longer tells this mutant apart, as the record
    says.
  - The chain's `BlockStatement` (:198) rests on the two call records below it. I accept it. The timeline's
    `BlockStatement` (:153) is unchanged from phase 2 and rests on the same reasoning, so it holds too.

  The timeouts are `connectedCallback`'s body and its `observe()`, as in round 1. The compile errors are reports. The
  fix round's own run used phase 2's base, which I accept in R2-02.

## Checks run

On HEAD, one heavy job at a time, under the operator's CI-first rule:

| Check | Result |
|---|---|
| `gate:typecheck` | exit 0, `typecheck: no type error in the files of tsconfig.json` |
| `gate:lint` | exit 0, `lint: 458 files checked, no finding` |
| `gate:style-lint` | exit 0, `style-lint: 43 files checked, no finding` |
| `gate:test-lint` | exit 0, `test-lint: 337 files checked, no finding` |
| `gate:manifest` | exit 0, `manifest: 23 elements checked, no finding` |
| `gate:config-copies` | exit 0 |
| `gate:csp` | exit 0, `csp: 41 files checked, no finding` |
| `gate:prefix` | exit 0, `prefix: 477 files checked, no finding` |
| `gate:signoff -- --range cd1d73c..HEAD` | `signoff: 14 commits checked, no finding` |
| `gate:plants -- --affected cd1d73c… --list` | exit 0; `note: affected: every plant, by packages/elements/package.json (not mapped)`, `315 of 315 plants selected`; matches `plants.md`, whose base is `base.sha` and whose recorded exits are 0 |
| `gate:mutation -- --base cd1d73c…` | exit 0 (Test quality) |
| `vitest --project elements --project elements-browser`: the chain and timeline tests in both harnesses | 4 files, 123 passed |
| In-process probes (scratch, removed; source restored with `git checkout`) | without the connection renders: the re-attach bodies and my probes fail; without `#mutations.disconnect()`: all 64 pass; with `#sizes.disconnect()` put back: all 27 chain tests pass (R2-01) |

Under the operator's rule, CI decides the full unit suite, `gate:storybook-build`, `gate:visual`, `gate:axe`,
`gate:contrast`, `gate:brand-rules` and the full plant run. The tdd-check's head run covered the full suite on the
final source, with 7773 passing. The fix record reports `gate:axe` as unchanged and `visual:update` under the pinned
container as `0 added, 0 changed, 0 removed`. The source change cannot move the first paint: the connection render
on first connection merges into the first update.

**Phase 2 (approved and folded).** The timeline change adds one call and re-words one record's reason and the header
comment (`ocelle-event-timeline.ts:8-9`, :149-150, :157). Every timeline body passes in both harnesses, the phase 2
bodies among them, and no phase 2 test changed. The timeline is in the same unreleased CHANGELOG entry as before, so
this fix needs no new entry.

**Tasks, constitution, plan.** `tasks.md`, `spec.md` and `plan.md` did not change in this round, and every task of
Phase 3 is still ticked. The new code does no I/O, uses no new name, style or ID reference, and changes no public
surface (manifest clean). R-12 now states that the 0.5 px tolerance is the tests' oracle, and the step contract lists
`display: block`. The fix makes the elements meet FR-025 after a detached change.

## Earlier findings

| ID | Status | Evidence |
|----|--------|----------|
| R1-01 (blocking) | resolved | `ocelle-evidence-chain.ts:193` requests an update on connection. The red body ("re-attach (R1-01, FR-025) …", `scenarios/evidence-chain.ts:531`) failed at f2ec02e in both harnesses and passes at HEAD. Round 1's reproduction (a seventh step appended while detached) is this body's first half. My independent probe (variant change and removal while detached) passes at HEAD and fails without the call. |
| R1-02 (blocking) | resolved | Both records were re-derived (:198, :202). My phase-base mutation run exits 0, and the probe with the call removed passes every body (Test quality). |
| R1-03 (blocking) | resolved | The operator chose to redo it test-first. f572910 withdraws only the fix and its body. f2ec02e restores the body unchanged, red in both harnesses. 7c697ab re-applies the fix. `red-commits` has `fix-1`. See R2-01 on the fix being redundant now. |
| R1-04 (note) | fixed | The `updated()` comment (:243-246) and `mutation.md` rows 233 and 239 now say that re-observing does not deliver again, with the reason round 1 gave. Removed `<li>`s are still not unobserved. That was optional, and the reason is recorded. |
| R1-05 (note) | fixed | The `[part="content"]` row of `contracts/ocelle-evidence-step.md` lists `display: block` with its axe `bgOverlap` reason. |
| R1-06 (note) | fixed | `research.md` R-12 § Line ends says the element compares exactly and the 0.5 px is the tests' oracle. |
| R1-07 to R1-10 (notes) | no change required | as in round 1 |
| R1-11 (note; operator: fix now) | resolved | `ocelle-event-timeline.ts:150` requests an update on connection. The red body ("re-attach (R1-11, FR-025) …", `scenarios/event-timeline.ts:722`) failed at f2ec02e in both harnesses and passes at HEAD. The matching record (:157) is re-derived and accepted. |
