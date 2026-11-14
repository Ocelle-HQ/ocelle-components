# Phase 1 spike (T002): the capture prototype in both harnesses

Run on 2026-11-14 in this container, after the red commit `306bd2b` and before green. Chromium 153.0.8010.12
(Playwright's build 1243, through `OCELLE_CHROMIUM_PATH`), Node 22, both harnesses. The prototype is the capture as
drafted for T004 (`packages/elements/test/live.ts`: the recorder, the CDP reading, the browser commands; the driver
steps of T005), in the working tree. It was run by the phase's own red tests and by spike test files that were not
committed (`packages/elements/test/spike-live.test.ts`, `spike-live-b.test.ts`,
`packages/elements/test/browser/spike-browser.test.ts`), with an uncommitted draft `packages/elements/src/live.ts`
(the announcer of R-02). The draft and the spike tests were removed and the index reset afterwards; nothing of them
is committed.

**No stop condition of tasks.md § Stop-and-ask was hit.** One defect of the drafted capture was found and fixed
before green (§ Nested evaluation); one figure of the contract does not match its own formula (§ Quiet window).

## Outcomes

| Item (T002) | In process (`elements`, test `D` = 50 ms) | Fixture pages (`elements-browser`, Chromium's figures) | Stop? |
|---|---|---|---|
| The capture runs | yes: `debugger` pauses and the frame hook run in the Vitest browser-mode iframe; 56 phase tests pass | yes, after the fix of § Nested evaluation; 29 phase tests pass, three runs in a row | no |
| A region written `W` after it appears | counts one under both rules (`live-capture.test.ts`, spike) | counts one under both rules (`browser/live-capture.test.ts`, spike: `{ settled: ["Saved"], rendered: ["Saved"] }`) | no |
| Written in a microtask after it appears | `{ settled: [], rendered: [] }` | `{ settled: [], rendered: [] }` | no |
| Written in the first animation frame after it appears | `{ settled: [], rendered: [] }` | `{ settled: [], rendered: [] }` | no |
| `internals.ariaLive = "off"` on a `role="alert"` host | the host's node is no live region node (no region with host `a`); `hostRole("a")` is `alert`; a plain `<div role="alert">` beside it is an `assertive` region | the same | no |
| `registerFirstLoad` reaches the first-load path | the spike host is constructed inside the `customElements.define` call (`constructedInRegistration: true`), takes the first-load path and announces nothing | not used on fixture pages | no |
| `drive.readyState("loading")` reaches it | the draft `readyState()` of `src/live.ts` reads `"loading"` through the getter spy on the document, the host takes the first-load path and announces nothing, and every snapshot has `loaded: false`; with the real `"complete"` the same insertion announces once | not used on fixture pages | no |
| `insertInteractive` on a fixture page | — | the `DOMContentLoaded` handler of `fixtures/interactive.js` runs with `readyState` `"interactive"`, `ocelle-icon` defined by the browser build and upgraded on insertion; the capture of `startDocument` sees the host only after the insertion | no |
| `drive.after` overshoot at the test `W` (100 ms), 50 runs of `after(W / 3)` | largest 4.3 ms, mean 2.0 ms; below `2W/3` = 66.7 ms | — | no |
| The timing setter | the draft setter's first call returned `{ delayLoaded: 150, delayLoading: 350, hold: 5000 }`; with the constant of `test/in-process.ts` in force the spike host wrote its copy `W` = 100 ms after the insertion (not 300 ms), and the capture's `"settled"` rule used the same `D` (`delays` of `test/in-process.ts` is derived from that constant) | — | no |
| One `src/live.ts` module instance per test file | two spike files each set the timing without restoring it; each file's first setter call still returned the shipped defaults, with the files run in parallel, one at a time and shuffled | — | no |
| Node lists re-recorded with the capture | — | see § Node lists: no field the reading uses differs | no |
| One 30-line `src/live.ts` shard | 105.9 s wall-clock (see § Timing) | — | no (under 420 s) |

Mutants that stay unreachable in process: none found for the first-load condition. Both of its operands are driven
in process: the registration flag by `registerFirstLoad`, the `"loading"` read by `drive.readyState` (the spy
replaces the document's getter, so the body of `src/live.ts`'s `readyState()` still runs). What only the fixture
pages exercise is a real parser-inserted element under `"loading"`, which `startDocument` covers (US1-10).

## Nested evaluation (a defect of the drafted capture, fixed for T004)

With the three fixture-page files running in parallel, the capture-bounds cell of `browser/plants.test.ts` failed:
its capture resolved with 113 snapshots instead of failing with "capture exceeded …". In-page counters showed that
the looping element had never been upgraded: `customElements.get("ocelle-test-loop")` was defined, the element was
in the document, `:defined` was false, `customElements.upgrade()` did nothing and no error was reported. The
driver's `insert` had run while the page was paused at the recorder's `debugger` (the recorder's pending pause
record was set inside the insertion): the DevTools protocol runs an evaluation that arrives during a pause at once,
nested in the paused stack, and Chromium then does not upgrade a custom element that the evaluation inserts, and the
paused recorder cannot pause again for the mutations it makes. Under load the page is paused for a large share of
the time (one pause per rendering update while a capture is armed), so any `page.evaluate` of a driver step or of a
test can land in a pause.

Fix in `test/live.ts` (`runInTasks`): `fixtureCapture(page)` wraps the page's `evaluate` so that the function first
checks, in the page, whether the recorder holds a pause and, if so, waits for a timer task, which runs only after the
test side has resumed; the function then runs at the top of a task of its own. The in-process harness is not
affected: its steps run in the page's own code, never through the protocol. After the fix the three files passed
three runs in a row in parallel, and the whole `elements-browser` project passed apart from the spike's own first
comparison of the node lists, which compared ids (§ Node lists).

## Quiet window

`contracts/testing.md` § Live-region capture defines the quiet window as "the largest `W` (`2 × D` before load) + the
minimum hold (the largest `W`) + the largest `D`" and then states "so 700 + 700 + 350 = 2100 ms". The sum of those
three figures is 1750 ms. The capture implements the formula (1750 ms at Chromium's figures, 250 ms at the test `D`),
and the tests assert it (`browser/live-capture.test.ts` states 700 + 700 + 350). R-09's cost figure ("about 2.4 s
per announcing cell") was derived from 2100 ms. This is recorded for the operator; it is not a stop condition, and
the formula's figure is still longer than every designed gap between two mutations of an announcement (at most `W`).

## Node lists (analysis I6)

Each planted markup of T001's lists was loaded again as a document (`page.route` serving the same
`<!doctype html><html lang="en"><body><main id="c">…</main></body></html>`), the drafted `Capture` was started with
`startDocument` and stopped, and the `Accessibility.getFullAXTree` result of its final snapshot was compared with the
committed list, node by node in tree order. The committed lists were not changed.

| List | Nodes (committed, re-recorded) | Fields the reading uses (tree structure through `childIds`, `ignored`, `role`, `name`, the `live` property) | Other differences |
|---|---|---|---|
| static-text | 11, 11 | equal | ids; the root's `url` property |
| img | 15, 15 | equal | ids; the root's `url` |
| link | 10, 10 | equal | ids; the root's and the link's `url` |
| inline-text-boxes | 7, 7 | equal | ids; the root's `url` |
| ignored | 14, 14 | equal | ids, also inside the button's `describedby` and the hidden node's `ignoredReasons`; the root's `url` |
| whitespace | 15, 15 | equal | ids; the root's `url` |
| nested | 10, 10 | equal | ids; the root's `url` |

"ids" are `nodeId`, `parentId`, `childIds`, `backendDOMNodeId` and `frameId`: per-document numbers, renumbered in the
new document. The reading uses `nodeId` and `childIds` only to link a node to its children, and the linked trees are
equal node for node, so no field the reading uses differs. The `url` property is the page's address (`about:blank`
when recorded with `setContent`, the routed address here); the reading does not use it.

## Bounds

- The hold scenario at the real `H` on a fixture page (a region written `W` after the capture starts, emptied 5000 ms
  later, `stop({ atLeast: 5500 })`): 429 pauses (425 lifecycle, 4 mutation), 7.1 s from the step to `stop`'s return;
  the copy was current for 4984 ms between its first and last snapshot. The pause bound (2000) is far off; the time
  bound counts from `stop`'s call, or from the end of `atLeast`, so this capture ends about 1.8 s after its bound
  starts. The bounds stay at 2000 pauses and 5000 ms.
- The looping element ends as "capture exceeded 5000 ms" in both harnesses (about two pauses per rendering update, so the
  time bound comes first), well inside the files' 30 s and 60 s test timeouts.

## Timing

- Test `D` = 50 ms for both load states (`W` = 100 ms), test `H` = 500 ms: at least two rendering updates (33.4 ms at
  60 Hz), below Chromium's 150 ms, and the overshoot above is far below `2W/3`. The in-process quiet window is
  100 + 100 + 50 = 250 ms plus two rendering updates.
- `elements` dry run (`stryker run stryker.elements.config.json --dryRunOnly`, perTest coverage, with the phase's
  tests and the spike files): "Ran 166 tests in 41 seconds", 66 s wall-clock with Stryker's start.
- One 30-line entry of the draft `src/live.ts`, `packages/elements/src/live.ts:58-87` (the trigger with its restart,
  the minimum hold, the wait, the write, the baseline re-check and the hold; 33 mutants on the changed lines, 9 of
  them compile errors), run alone as `pnpm run gate:mutation -- --base 1fa6203 --files packages/elements/src/live.ts:58-87`
  after `git add --intent-to-add`: **105.9 s** wall-clock from the command's start to its exit, under the 420 s stop
  and the 10-minute limit. This is a draft's figure: the draft announcer is shorter than T020's, and the spike test
  drives it with four cells. T025 and T041 time the real shards.
- The fixture-page suite at the real figures (the whole `elements-browser` project, with the phase's tests and the
  spike file): 43 s wall-clock (Vitest's duration 42.9 s).
