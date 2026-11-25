# Phase 3, review round 1: fixes

Review: `round-1.md` (changes_requested, 6a6042f). Operator decisions: `operator-round-1-decisions.md` (91298a9).
Red commit: f2ec02e (`red-commits`: `fix-1`), recorded by `red.sh 3 fix-1`, log `red-fix-1.log`.

The order is the one the operator set for R1-03 (real red history, not reconstructed):

1. f572910 withdraws only 5fa191c's kept size observer: `disconnectedCallback` disconnects `#sizes` again, as at
   95086aa, and the moved-chain body is removed. Source and that test body only, no red record.
2. f2ec02e, tests only: the moved-chain body restored unchanged, with R1-01's and R1-11's re-attach bodies.
3. The fix commit: both elements render on connection, and the chain keeps its size observer again.

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R1-01 | fixed | f2ec02e: "re-attach (R1-01, FR-025): a step appended while the chain is detached is shown once it is attached again, …" in `packages/elements/test/scenarios/evidence-chain.ts` (`evidenceChainReattachScenarios`), run by both harnesses, red in both on its assertion | `packages/elements/src/ocelle-evidence-chain.ts`: `connectedCallback` calls `this.requestUpdate()`, as `ocelle-facts.ts` does; header comment (Structure) |
| R1-02 | fixed | none: an equivalence record; the mutant is now equivalent because of R1-01's fix, and the gate decides | the chain's `#mutations.disconnect()` record and the `BlockStatement` record above it, re-derived; `mutation.md` § Review round 1 (rerun, exit 0) |
| R1-03 | fixed | f2ec02e: "a chain moved to another parent and then narrowed to 200 px wraps with each line's ends marked, as before the move (R-12)", restored after f572910 withdrew its fix, red in both harnesses | `packages/elements/src/ocelle-evidence-chain.ts`: `#sizes.disconnect()` removed from `disconnectedCallback` again, with its comment; header comment (Line ends) |
| R1-04 | fixed | none: comments and a record (no behaviour) | the `updated()` comment in `ocelle-evidence-chain.ts`; `mutation.md` run-1 rows for lines 233 and 239. Removed `<li>`s are still not unobserved (the optional change is not made: a removed `<li>` reporting 0 × 0 is one of the deliveries the line ends rely on) |
| R1-05 | fixed | none: documentation | `contracts/ocelle-evidence-step.md` § Shadow structure: `[part="content"]` lists `display: block` with its reason (axe `bgOverlap` between an inline span's line boxes) |
| R1-06 | fixed | none: documentation | `research.md` R-12 § Line ends: the element compares block starts exactly; the 0.5 px is the tests' oracle |
| R1-07 | deferred: note with no change required | none (note) | none |
| R1-08 | fixed (rerun) | none (record) | `plants.md`, replaced by this round's scoped run (same 21 plants, exit 0) |
| R1-09 | deferred: note with no change required | none (note) | none |
| R1-10 | deferred: note with no change required | none (note) | none |
| R1-11 | fixed | f2ec02e: "re-attach (R1-11, FR-025): an event appended while the timeline is detached is shown once it is attached again, …" in `packages/elements/test/scenarios/event-timeline.ts` (`eventTimelineReattachScenarios`), run by both harnesses, red in both on its assertion | `packages/elements/src/ocelle-event-timeline.ts`: `connectedCallback` calls `this.requestUpdate()`; its `#mutations.disconnect()` record re-derived; header comment (Structure) |

## The red bodies

All three make their change in one task between the element's `remove()` and `append()` (`driver.module`), so no
observer of the element sees it, and then let the page settle.

- **Chain (R1-01).** Six steps (the third and fifth chips) in a wrapper. Detached: a seventh step "Merged" appended;
  attached again. Expected: the item texts with "Merged", ordinals `1 2 chip 4 chip 6 7`, the `<li>`s assigned `s1`
  to `s7`, every `<li>`'s `data-line-end` and connector agreeing with its measured line end, `data-line-end` on the
  last item, and the new step with a box. Then, detached again, `s2` given `hidden`: six items without "Plan",
  ordinals `1 chip 3 chip 5 6`, the line ends as measured, and `s2` with no box. On f2ec02e: still six `<li>`, `s7`
  with no box and no ordinal 7.
- **Moved chain (R1-03).** 5fa191c's body, unchanged: moved from one parent to another and narrowed to 200 px, every
  line end marked. On f2ec02e: `narrow.ends` not all `ok` (the size observer was disconnected and nothing observes
  the list again).
- **Timeline (R1-11).** Three events in a wrapper; detached, a fourth event "14:50 Merged" appended; attached again:
  four items, `e1` to `e4`, the `has-time` and `next-has-time` classes, three connectors with their `space-1` gaps, and
  the new event with a box. Then `e2` hidden while detached: three items, two gaps, `e2` with no box. On f2ec02e: three
  items, `e4` with no box; after the hide, `e2` still a listitem with an empty text.

`red-fix-1.log` (exit 1, `unit-tests: 8 of 7773 tests failed`): the six expected failures, the three bodies in
`packages/elements/test/evidence-chain.test.ts`, `packages/elements/test/event-timeline.test.ts` and their two browser
twins, each an `AssertionError`. Two more are load timeouts in gate integration tests this round does not touch:
`gates/test/integration/plant-repo.test.ts:239` ("Test timed out in 5000ms") and
`gates/test/integration/visual.test.ts:115` ("Test timed out in 600000ms"), as phase 1's fix round saw. The log's pnpm
store and Chromium paths are redacted.

Before the red commit, in process: with only the kept size observer applied, the moved-chain body passed and the chain
re-attach body still failed, so the redone fix is shown to be what makes the moved-chain body pass; with the full fix,
all 123 chain and timeline bodies passed in both harnesses.

## The fix

`connectedCallback` requests an update on both elements. A change made while the element was detached reached no
observer; the render on connection reads the children as they are, assigns the slots and, on the chain, observes
the new list and items for the line ends. The chain also keeps its size observer across a disconnection again
(R1-03, the fix 5fa191c made, re-applied after its red commit). Its comment no longer says that a moved chain gets no
new render: it does now, and the kept observer is the reason given in 5fa191c (it observes only the chain's own
shadow nodes).

## Checks

Under the operator's CI-first rule; one heavy job at a time.

| Check | Result |
|---|---|
| `gate:typecheck`, `gate:lint`, `gate:style-lint`, `gate:test-lint`, `gate:manifest`, `gate:config-copies`, `gate:csp`, `gate:prefix` | each exit 0; `lint: 458 files checked`, `test-lint: 337 files checked`, `manifest: 23 elements checked`, `csp: 41 files checked`, `prefix: 477 files checked`, no finding |
| `vitest --project elements --project elements-browser`: evidence-chain and event-timeline, both harnesses, and the four entry tests | 8 files, 127 passed |
| `vitest --project elements-build` build.test.ts | 28 passed |
| `gate:mutation -- --base 5e7f6df… --files` the chain, the step and the timeline | exit 0, `174 mutants on the changed lines of 3 files, none survived; 8 timeouts, 26 compile errors, 0 zero-mutant entries; 10 equivalent records` (`mutation.md` § Review round 1) |
| `gate:axe` | exit 0, `axe: 382 story-theme runs, 0 serious or critical; 84 notes (0 incomplete, 84 excepted)` |
| `OCELLE_VISUAL_ENGINE=docker pnpm run visual:update` (#10's pinned container) | exit 0, `baselines: wrote 0 files (0 added, 0 changed, 0 removed), 0 bytes in total`: no baseline changed |
| `gate:plants -- --affected cd1d73c… --list`, then the scoped run under docker | exit 0 and exit 0, `21 of 315 plants judged, every plant as expected` (`plants.md`) |
| `red.sh 3 fix-1` on f2ec02e | `"tests_only": true, "red": true, "recorded": true`, exit code 1 |

The mutation base is phase 2's rather than phase 3's, so that the timeline's whole file is mutated and its re-derived
record judged; the chain and the step are new since either base. CI decides the full unit suite,
`gate:storybook-build`, `gate:visual`, `gate:contrast`, `gate:brand-rules` and the full plant run.
