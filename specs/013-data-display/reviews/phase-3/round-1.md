---
phase: 3
round: 1
verdict: changes_requested
base: 389b5d44afb3ecd84a1b191a9e0f356640fe837d
head: e36862fd4522c9868a2154e3960835480942a5ae
tdd_check: pass
---

# Phase 3 review, round 1

Scope: `git diff 389b5d4..e36862f` (User Story 3, `ocelle-progress`). Apart from this file there is no uncommitted
change. The commits are:

- 4dfc98b: base
- 1f8250e, e7b823b, ce95346: spike, operator decisions, and the design amended to match
- e4589b3: scaffold
- 30449fe: harness
- e7c38e3: red
- ff9a9ac: green
- eea75c8, 88bcb5d: baselines, plants, ticks
- e1a527f: bodies for mutation survivors
- 75d38e1: refactor and records
- dc66baf: gate notes
- 24285b5: operator fold decision, history only
- e36862f: TDD-check outputs

These operator decisions bind this review:

- I3;
- `reviews/phase-3/operator-spike-decisions.md`: US3-3 option (a), and the key `Symbol.for("ocelle.progress.sweepStart")`;
- the decision blocks of spec.md and plan.md.

I judged `notes.md`, `plants.md` and `spike.md` against the artifacts. I did not take them on trust.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | packages/elements/test/scenarios/progress.ts:169-182 (US3-2); spec.md:379-381; contracts/checks.md:18-19 | US3-2's Then clause includes "No event is emitted (the element has no user intent to report)". contracts/checks.md § Scenario bodies gives exactly this as an example of a paired "does not" outcome: "no event emitted (US3-2) is paired with the value changing". The US3-2 body checks the exposed value, the 75 % fill and `animations()`, but nothing observes events. The driver has no event reader (scenarios/driver.ts). No other body checks the clause either. The only related checks are the manifest test's `events: []` (test/node/manifest.test.ts, the `ocelle-progress` declaration) and the README sentence, and both are documentation, not behaviour. An `ocelle-progress-change` dispatched on a value change would pass every test. So one clause of an acceptance scenario has no test (Principle VIII; skill step 4, "each acceptance scenario ... has a test"). | In US3-2's body (both harnesses), record every event dispatched from the host and its shadow root while `value` changes from 7 to 9, and assert the list is empty in the same body as the 9 / 75 % read. One way: a driver reader that wraps `EventTarget.prototype.dispatchEvent` on the page for the duration of the change, with its own driver body that shows it catches a dispatched `CustomEvent`. This adds a missing assertion; it does not fix behaviour. Record it in a fix note. It cannot be red against green code, and nothing else in the red record needs to change. |
| R1-02 | note | packages/elements/src/ocelle-progress.ts:322-323 | The `Stryker disable` record on the `ariaValueText` line says "not observable", and it is not an equivalence. The `ConditionalExpression` and `EqualityOperator` mutants change what assistive technology would get: a value text exposed while indeterminate, or never exposed. The record is honest, though, and it stands. The operator's decision (a) accepts that value-text exposure is not verified. It rejected (c), the test hook that reads `ElementInternals.ariaValueText`, which was the only way to kill these mutants. My own CDP read agrees with the spike: `valuetext` is `""` for every internals progressbar. The README (§ `ocelle-progress`, **Values**) and readme.test.ts state the gap. The record's "proven in render()" is only partly true, because render()'s rule (line 343) is separate code from the internals line. The other mutants on the line (`??` → `&&`) are compile errors. | None for this phase. Accepted under operator decision (a). The operator may want to know that decision (a) also leaves this line without mutation coverage. |
| R1-03 | note | packages/elements/src/ocelle-progress.ts:304-305 | The reason for the `ConditionalExpression` record is inaccurate: "no bar opens another between two callbacks of one frame". A foreign `requestAnimationFrame` callback can do exactly that, since the microtask checkpoint after it runs Lit's update. I ran a scratch Playwright run on the browser build (no repository file touched): bars A and B are removed in one task, with a page rAF callback registered between the two removals that inserts bar D. In that frame A's callback deletes E1, the page callback opens E2 for D, and in the mutant B's callback deletes E2. The mutant is still equivalent in effect. D's mark animation is new, so its `animationstart` in the next frame re-joins and opens a record. A bar F inserted 1 s later then shares D's sweep in both builds (original D/F `currentTime` 1033/1033 ms, mutant 1017/1017 ms). The only difference is a one-frame shift of D's start. | Optional: reword the reason, e.g. "a record opened between two callbacks of one frame belongs to a bar whose new mark animation re-joins at its `animationstart` in the next frame, so the shared start moves by at most one frame". |
| R1-04 | note | packages/elements/src/ocelle-progress.ts:282 | The `CallExpression` record on `super.disconnectedCallback()` repeats phase 2's incomplete reason (phase 2 round 1, R1-01). `LitElement.disconnectedCallback` (lit-element 4.2.2) also calls `__childPart.setConnected(false)`. The template has only `class` and `@animationstart` bindings and no directive, so the mutant is still equivalent. | Optional: as phase 2 R1-01. |
| R1-05 | note | packages/elements/src/ocelle-progress.ts:151-154; research.md:923; packages/elements/test/scenarios/progress.ts:586-608 | Compact `flex-wrap: nowrap` where research R-06 says `wrap`. I accept the departure. The spec's edge case (spec.md:484) is "Long progress label **beside** a compact bar". With R-06's `wrap`, a label longer than the row takes a flex line of its own and the bar drops below it, so the label is not beside the bar. FR-035 also says the compact row holds the label, bar and value text. The track's `min-inline-size` keeps `--ocelle-measure-cell`, and the T052 plant bites (plants.md). Two gaps remain. (1) research.md R-06 (:923) still says `wrap`, and nothing amends it. (2) The compact long-label body does not read "beside". With `wrap` restored, its three reads still pass: the track spans the row (≥ cell), the label wraps, and the scroll width is 320. US3-9 uses a short label, so it passes too. Nothing pins the choice the edge case depends on. | Optional now, before Phase 4: amend research.md R-06's compact row to `nowrap`, with the reason, in a documentation commit. Add to the long-label body the long label's and track's block overlap (`overlaps(label, track).block === true`), so a revert to `wrap` fails it. |
| R1-06 | note | 30449fe (vitest.config.ts) | The harness commit between scaffold and red registers only the `emulateReducedMotion` browser command. It adds no element behaviour, and its lazy import of `test/commands.ts` resolves the function only when it is called, and nothing calls it before e7c38e3. It is needed so that red fails for the right reason. Compare `check-final-tests-on-scaffold.log`, run with the scaffold's config, where the reduced-motion bodies and the `commands.test.ts` `afterEach` fail with `TypeError: commands.emulateReducedMotion is not a function`, with `red-phase.log`, which has 0 TypeErrors: every failure is an `AssertionError`. It does not weaken the red evidence, and the scaffold check still fails (exit 1). It belongs to T037's "the `emulateReducedMotion` command" step, which needs the config registration that the red commit's test pathspec cannot carry. tasks.md does not name the step. | None. Optional: name the config registration in T037 for later phases. |
| R1-07 | note | packages/elements/test/scenarios/driver.ts:218-245; test/animations.ts; contracts/checks.md § Driver additions | The test-only additions are `textOf`, `rendered`, `changeAttributes` and `property` (`property` added after green in e1a527f). Also, `animations()` returns `currentTime` and `setProperty` takes number, boolean and null. None of these is in contracts/checks.md § Driver additions. Each is test-only, implemented the same way in both drivers, and needed by a named body: US3-3 and SPEC-2-02 read the value-text part, the fallback-text body, the one-episode body, US3-6's `null`, and the first-loop guards. Each has its own driver body (driver-additions.ts:333-365). The widened `setProperty` changes no existing caller. Accepted, as in phase 2 R1-02. | Optional: list them in contracts/checks.md § Driver additions in a documentation pass. |
| R1-08 | note | 75d38e1 (packages/elements/src/ocelle-progress.ts:275-315) | The simplification keeps every observable behaviour I could test or derive. There are two side effects. (1) `#leave()` now runs on every determinate update: `updated()` → `#leave()` → `episode()` opens an empty record when there is none and schedules a frame that deletes it, so there is one rAF per value change. (2) `#started` lost its `isConnected && indeterminate` guard. It relies on only the indeterminate mark animating. That holds unless a page listener for the same `animationstart` batch makes the bar determinate first, a contrived case. Neither is reachable by a spec scenario. All tests pass before and after (`pnpm test` at HEAD), and the four plants the refactor touched were re-run (notes.md). | None. |

One blocking finding (R1-01).

## Test quality

- **TDD check.** `tdd-check.json` reports `pass` with no problems:
  - red record `phase` e7c38e3 exits 1;
  - final tests exit 2 on the base and 1 on the scaffold;
  - HEAD exits 0.

  The base exit 2 is "no test file found", as for every earlier phase base. The scaffold run is the evidence that
  counts: 227 of 3790 tests fail, the TypeErrors of R1-06 among them. The JSON names head 24285b5. The only later
  commit, e36862f, adds just those outputs, so I did not re-run the check.
- **Scaffold (e4589b3).** It adds only signatures:
  - `src/ocelle-progress.ts` with `define`, `@tagname`, the seven properties of contracts/elements.md (each `| undefined`,
    `@default undefined`) and an empty `render()`;
  - the exports.

  There is no test file and no behaviour.
- **Red evidence (`red-phase.log`).** 200 of 3766 tests fail, every failure an `AssertionError`, with 0 TypeError,
  SyntaxError, ReferenceError or unknown-command failures. Every progress body fails in both harnesses, as do US2-7 with
  the real bar, the entry, root, build, pairing, manifest, readme and token-only tests, the story tests and the pinned
  gate counts. The story tests fail on `theme: undefined`, because the story is absent at red. That is the missing
  stories, which land in green under I3. The tests that pass at red are the harness's own bodies, the scaffold's
  exports, and naming checks on stories that hold no bar, each paired. None is a progress scenario body. I3 holds: the
  story-test extension is in the red commit.
- **Weakening.** `git diff e7c38e3..HEAD` on every test path is insertions only:
  - progress.ts +112 lines (eight bodies);
  - progress.test.ts +23 (the out-of-document body);
  - token-only.test.ts +9;
  - the `property` reader and its body.

  Nothing was deleted, skipped, loosened or edited. The bodies added after green (e1a527f) fail on the scaffold in
  both harnesses (`check-final-tests-on-scaffold.log`), as phase 2 R1-04 accepted. The `property` driver body is the
  exception: it tests the harness and passes there, by design.
- **Vacuity.** I read every added or changed test:
  - Each body returns one observation compared with `toEqual` against values written from tokens: `source.ts`,
    `tokenColour`, platform system colours.
  - The guards fail when a read is missing: `track.width === 0` gives a −1 mark, and `?? -1` / `?? 0` fall back to
    failing values.
  - No assertion is conditional, and there is no `skip`/`only`, no snapshot and no mocked unit. test-lint passes.
  - Every "does not" outcome is paired with a positive read:
    - no animation with the 75 % fill;
    - no value text while indeterminate with the label shown and the determinate twin;
    - no tab stop with the Tab sequence and the named bar;
    - fallback text absent with the named progressbar.
  - The story test's `waitForSelector(...).catch(() => undefined)` (elements-stories.test.ts:515, the existing
    pattern at :76 and :245) is followed by `present: true`. It does not swallow the failure the test reports.
- **Coverage of the story.**
  - US3-1 to US3-15 each have a body in both harnesses, except US3-2's "no event" clause (R1-01).
  - US3-3 is proven as decision (a) requires: the visible part plus the AX name and value, with no internals read.
  - The bodies tasks.md T038/T038a lists are present: SPEC-2-02 ×2, value removed, one episode, right-to-left ×2, the
    320 px sweep, the compact long label, no tab stop, unset attributes, fallback text, inline placement.
  - The element has no keyboard model and no event.
  - The 15 plants of T052/T052a are recorded as biting (plants.md). Each names a body that I checked can observe the
    planted change.
- **Mutation.** I ran `pnpm run gate:mutation -- --base 389b5d4` myself: `mutation: 247 mutants on the changed lines
  of 3 files, none survived; 0 timeouts, 79 compile errors, 1 zero-mutant entry; 5 equivalent records`. These are the
  records:
  - token-only.ts:286, the `classify()` property name: equivalent. Neither the name nor `""` is in `unitless`, is a
    font, or is `grid-template-columns`/`transform`.
  - progress.ts:51, `ariaValueMin "0"` → `""`: equivalent. I checked over CDP: an internals progressbar with
    `ariaValueMin` `"0"`, `""` or unset reports `valuemin` 0.
  - progress.ts:282: equivalent, with an incomplete reason (R1-04).
  - progress.ts:304: equivalent in effect, with an inaccurate reason (R1-03).
  - progress.ts:322: not an equivalence. Accepted under decision (a) (R1-02).

  Three compile errors fall on behaviour lines: TS1313, an empty `if` body, at :278, :305 and :328. Each line's
  behaviour has a body or plant that fails without it:
  - :278, the re-shown/moved-while-hidden body;
  - :305, the "episode never ends" plant and US3-15;
  - :328, the "after the window, a bar inserted shows the still mark at once" body.

  I reasoned these out and did not run them. Per #23 they are report lines, not findings.

## Checks run

On HEAD e36862f, with `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` and
`OCELLE_VISUAL_ENGINE=docker`:

| Gate | Result |
|------|--------|
| `gate:typecheck` | no type error |
| `gate:lint` | 296 files, no finding |
| `pnpm test` | 3790 tests passed in 152 files |
| `gate:manifest` | 6 elements, no finding |
| `gate:style-lint` | 16 files, no finding |
| `gate:prefix` | 267 files, no finding |
| `gate:test-lint` | 202 files, no finding |
| `gate:contrast` | 160 light / 168 dark pairs (149 required per theme), unchanged |
| `gate:brand-rules` | 7 rules checked |
| `gate:config-copies` | identical |
| `gate:pins` | 5 manifests, no finding |
| `gate:signoff -- --range 389b5d4..HEAD` | 15 commits, no finding |
| `gate:csp` (after the package build) | 14 files, no finding |
| `gate:storybook-build` | 61 stories |
| `gate:visual` | 122 captures match their baselines (docker only, no cross-engine comparison) |
| `gate:axe` | 122 story-theme runs, 0 serious or critical; 10 notes, all excepted, none new |
| `gate:mutation -- --base 389b5d4` | as above |
| `gate:plants`, shards 1, 2, 3 and 16 of 28 | 79, 78, 78 and 3 plants judged, every plant as expected |

The four plant shards hold every plant this phase added or changed:

- the eight `manifest` plant trees and the other manifest plants;
- `storybook-build/fail-empty-index`;
- the four new `style-lint` sweep plants;
- `visual/fail-token-changed`.

I did not run the other 24 shards. They hold no plant this phase changed, and the implementer's full 28-shard verdict
is in notes.md.

Spot checks I made beyond the gates:

- the browser build's episode code matches the source;
- the CDP `valuetext`/`valuemin` reads;
- the R1-03 interleaving on the browser build.

All ran in scratch scripts outside the repository.

## Earlier findings

There is no earlier round for phase 3. Phase 2 round 1 R1-03 handed one item to this phase: US2-7 with a real bar, and
the `::slotted(ocelle-progress)` plant. It is resolved:

- US2-7 (packages/elements/test/scenarios/empty-state.ts:311-341) now slots a real `ocelle-progress`.
- It asserts the bar's inline size against the column and a probe of `--ocelle-measure-reading`, at a 400 px column
  (column narrower) and a 1200 px column (measure narrower), with the AX order "progressbar Loading" first.
- plants.md records that removing the `::slotted(ocelle-progress)` rule makes US2-7 fail while the other 19 empty-state
  bodies pass.
- The phase 2 stand-in `.fill` rule is gone.
