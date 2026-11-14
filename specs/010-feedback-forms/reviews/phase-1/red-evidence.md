# Phase 1 red evidence (T005a)

Constitution VIII asks that the final tests of a unit, run against the code from before the unit, fail. In phase 1
the phase's new code (`test/live-reading.ts`, `test/live.ts`, the driver files, `test/in-process.ts`,
`test/browser/serve.ts`) is itself under the test pathspec, so no scaffold can hold it and `tdd-check.sh` check 2
overlays it onto the base (tasks.md, Tests). This file records the evidence the check cannot give.

## (1) The final test files against the red commit's stubs

- Red commit: `306bd2ba88881ab6d035a6544eb6e8f16f7e06d8` (`reviews/phase-1/red-commits`, `phase` line).
- Final commit: `8217e41` (green, T003 to T005).
- Run: `git worktree add --detach <tmp> 306bd2b`; in it `git checkout 8217e41 --` the phase's test files proper and
  nothing else: every `*.test.ts` file the phase added or changed, `packages/elements/test/live-rules.ts`, and every
  file under `packages/elements/test/fixtures/` and `packages/elements/test/browser/fixtures/` the phase added or
  changed (25 files, listed below), so `test/live-reading.ts`, `test/live.ts`, the driver files,
  `test/in-process.ts`, `test/browser/serve.ts` and `vitest.config.ts` stayed as the red commit has them (the T001d
  stubs; no command registration); `pnpm run setup:offline && pnpm test`; worktree removed.
- None of the 25 files changed between the red commit and the final commit: green added no assertion and changed
  no test (the overlay left the worktree clean).
- Output: `reviews/phase-1/check-final-tests-on-stubs.log`. **Exit code 1**, "90 of 3197 tests failed": the 85
  tests of T001 to T001c, each on an assertion, and the 5 visual-gate tests of
  `gates/test/integration/visual.test.ts` (lines 115, 126, 239, 251, 271), which fail in this container because it
  has no docker, as they do at the phase base and on green.
- Every test of T001 to T001c fails there; none passes. The four `Error: promise resolved "[]" instead of rejecting`
  lines and the two `expected [Function] to throw error matching …` lines are assertion failures of `rejects.toThrow`
  and `toThrow` (the stub's `stop` resolves with no snapshot; the stub's reading returns `""`), not setup errors.

The overlaid files:

- `packages/elements/test/browser/driver.test.ts`
- `packages/elements/test/browser/fixtures/capture-loop.html`
- `packages/elements/test/browser/fixtures/capture-loop.js`
- `packages/elements/test/browser/fixtures/interactive.html`
- `packages/elements/test/browser/fixtures/interactive.js`
- `packages/elements/test/browser/fixtures/live-document.html`
- `packages/elements/test/browser/fixtures/live-regions.js`
- `packages/elements/test/browser/fixtures/live.html`
- `packages/elements/test/browser/live-capture.test.ts`
- `packages/elements/test/browser/plants.test.ts`
- `packages/elements/test/driver.test.ts`
- `packages/elements/test/fixtures/ax/ignored.ts`
- `packages/elements/test/fixtures/ax/img.ts`
- `packages/elements/test/fixtures/ax/inline-text-boxes.ts`
- `packages/elements/test/fixtures/ax/link.ts`
- `packages/elements/test/fixtures/ax/nested.ts`
- `packages/elements/test/fixtures/ax/static-text.ts`
- `packages/elements/test/fixtures/ax/whitespace.ts`
- `packages/elements/test/fixtures/live-loop.ts`
- `packages/elements/test/fixtures/live-regions.ts`
- `packages/elements/test/fixtures/reading-plants.ts`
- `packages/elements/test/live-capture.test.ts`
- `packages/elements/test/live-rules.ts`
- `packages/elements/test/live.test.ts`
- `packages/elements/test/plants.test.ts`

The failing tests, per test file (85):

### `packages/elements/test/browser/driver.test.ts` (20 failing)

| Test | Assertion message (as logged, cut at 160 characters) |
|---|---|
| the driver steps on the strict-CSP fixture pages insert with innerHTML puts the markup into the container, the element constructed connected: true | `AssertionError: expected { seen: { html: '', …(3) }, …(1) } to deeply equal { seen: { …(4) }, recorded: { …(4) } }` |
| the driver steps on the strict-CSP fixture pages insert with template puts the markup into the container, the element constructed connected: true | `AssertionError: expected { seen: { html: '', …(3) }, …(1) } to deeply equal { seen: { …(4) }, recorded: { …(4) } }` |
| the driver steps on the strict-CSP fixture pages insert with domparser puts the markup into the container, the element constructed connected: true | `AssertionError: expected { seen: { html: '', …(3) }, …(1) } to deeply equal { seen: { …(4) }, recorded: { …(4) } }` |
| the driver steps on the strict-CSP fixture pages insert with createElement puts the markup into the container, the element constructed connected: false | `AssertionError: expected { seen: { html: '', …(3) }, …(1) } to deeply equal { seen: { …(4) }, recorded: { …(4) } }` |
| the driver steps on the strict-CSP fixture pages laterTask() returns after a message posted before it and a rendering update | `AssertionError: expected { before: [ 'message' ], …(1) } to deeply equal { Object (before, recorded) }` |
| the driver steps on the strict-CSP fixture pages insertInteractive(containerId, markup) inserts from a DOMContentLoaded handler under startDocument, the element defined by the browser build | `AssertionError: expected { inserted: undefined, …(2) } to deeply equal { inserted: { …(5) }, …(2) }` |
| the driver steps on the strict-CSP fixture pages after(ms) returns no earlier than ms after the previous step's end, with the gap measured in the page | `AssertionError: expected { atLeast: false, matches: true, …(1) } to deeply equal { atLeast: true, matches: true, …(1) }` |
| the driver steps on the strict-CSP fixture pages the W in force is Chromium's: 300 ms loaded, 700 ms loading | `AssertionError: expected { Object (W, recorded) } to deeply equal { …(2) }` |
| the driver steps on the strict-CSP fixture pages hostRole(id) reads the role of a host in the final snapshot of the last capture | `AssertionError: expected { roles: [ 'none', 'none' ], …(1) } to deeply equal { roles: [ 'alert', 'status' ], …(1) }` |
| the driver steps on the strict-CSP fixture pages forms formData(formId) returns the form's entries | `AssertionError: expected { data: [], recorded: { …(4) } } to deeply equal { data: [ …(2) ], recorded: { …(4) } }` |
| the driver steps on the strict-CSP fixture pages forms submit(formId) submits through the form's submitter and returns the request body the server received | `AssertionError: expected { submitted: null, url: true, …(1) } to deeply equal { Object (submitted, url, ...) }` |
| the driver steps on the strict-CSP fixture pages forms submit(formId) returns null when no request arrives (a required field empty) | `AssertionError: expected { empty: null, filled: null, …(1) } to deeply equal { empty: null, …(2) }` |
| the driver steps on the strict-CSP fixture pages forms after a key step, submit(formId) takes that step's submission, or null when it made none | `AssertionError: expected { one: null, two: null, …(1) } to deeply equal { …(3) }` |
| the driver steps on the strict-CSP fixture pages forms reset(formId) resets the form | `AssertionError: expected { value: 'Fix lane', …(1) } to deeply equal { value: 'draft', recorded: { …(4) } }` |
| the driver steps on the strict-CSP fixture pages forms type(id, text) focuses the control and types the text key by key | `AssertionError: expected { seen: { value: '', …(2) }, …(1) } to deeply equal { seen: { …(3) }, recorded: { …(4) } }` |
| the driver steps on the strict-CSP fixture pages forms press(id, key) focuses the element and presses the key | `AssertionError: expected { seen: { keys: [], …(2) }, …(1) } to deeply equal { seen: { …(3) }, recorded: { …(4) } }` |
| the driver steps on the strict-CSP fixture pages forms blur() moves focus away from the focused element, through shadow roots | `AssertionError: expected { focused: 'f', seen: { …(2) }, …(1) } to deeply equal { focused: 'f', seen: { …(2) }, …(1) }` |
| the driver steps on the strict-CSP fixture pages forms click(id, at) clicks at that point of the element's box | `AssertionError: expected { points: [], recorded: { …(4) } } to deeply equal { points: [ { x: 150, y: 30 } ], …(1) }` |
| the driver steps on the strict-CSP fixture pages forms focusPath() lists the focused element through shadow roots | `AssertionError: expected { empty: [], field: [], …(1) } to deeply equal { empty: [], field: [ …(2) ], …(1) }` |
| the driver steps on the strict-CSP fixture pages forms navigateAwayAndBack() on a no-store route shows the page again from the network and returns pageshow.persisted | `AssertionError: expected { Object (status, cacheControl) } to deeply equal { status: 200, …(1) }` |

### `packages/elements/test/browser/live-capture.test.ts` (8 failing)

| Test | Assertion message (as logged, cut at 160 characters) |
|---|---|
| liveCapture on the strict-CSP fixture pages observes the container's subtree: a region added and written W later counts one under both rules; a region outside is not read | `AssertionError: expected { paused: false, lifecycle: false } to deeply equal { paused: true, lifecycle: true }` |
| liveCapture on the strict-CSP fixture pages observes the shadow roots in the container when it is armed: a text set and cleared within a task is seen at a mutation pause | `AssertionError: expected { paused: false, …(3) } to deeply equal { Object (paused, lifecycle, ...) }` |
| liveCapture on the strict-CSP fixture pages observes shadow roots attached after it is armed, nested ones included (the attachShadow patch) | `AssertionError: expected { paused: false, …(2) } to deeply equal { paused: true, …(2) }` |
| liveCapture on the strict-CSP fixture pages takes snapshots with at, frame, lifecycle, loaded, regions and hosts; lifecycle snapshots count the rendering updates | `AssertionError: expected 0 to be greater than or equal to 3` |
| liveCapture on the strict-CSP fixture pages startDocument(url) sees the document from its first node: the region parsed late is absent from the first snapshot and appears holding its text | `AssertionError: expected { first: [ 'no snapshot' ], …(3) } to deeply equal { first: [], loading: true, …(2) }` |
| liveCapture on the strict-CSP fixture pages stop() waits the quiet window (700 + 700 + 350 ms) after the last mutation, then two rendering updates | `AssertionError: expected { waited: false, bounded: false, …(2) } to deeply equal { waited: true, bounded: true, …(2) }` |
| liveCapture on the strict-CSP fixture pages stop({ atLeast }) first waits until atLeast has passed since the capture started | `AssertionError: expected { waited: false, bounded: false, …(1) } to deeply equal { waited: true, bounded: true, …(1) }` |
| liveCapture on the strict-CSP fixture pages a capture over an element that mutates in a loop ends with "capture exceeded …", not a timeout | `Error: promise resolved "[]" instead of rejecting` |

### `packages/elements/test/browser/plants.test.ts` (1 failing)

| Test | Assertion message (as logged, cut at 160 characters) |
|---|---|
| plants (elements-browser project) capture bounds: an element that mutates its own attribu… turns a capture over the container (fixture p… red | `Error: promise resolved "[]" instead of rejecting` |

### `packages/elements/test/driver.test.ts` (24 failing)

| Test | Assertion message (as logged, cut at 160 characters) |
|---|---|
| insert(containerId, markup, how) innerHTML puts the markup into the container, the element constructed connected: true | `AssertionError: expected { html: '', upgraded: false, …(2) } to deeply equal { …(4) }` |
| insert(containerId, markup, how) template puts the markup into the container, the element constructed connected: true | `AssertionError: expected { html: '', upgraded: false, …(2) } to deeply equal { …(4) }` |
| insert(containerId, markup, how) domparser puts the markup into the container, the element constructed connected: true | `AssertionError: expected { html: '', upgraded: false, …(2) } to deeply equal { …(4) }` |
| insert(containerId, markup, how) createElement puts the markup into the container, the element constructed connected: false | `AssertionError: expected { html: '', upgraded: false, …(2) } to deeply equal { …(4) }` |
| laterTask() returns after a message posted before it and a rendering update, so a removal and an insertion are in different tasks | `AssertionError: expected [ 'insert' ] to deeply equal [ 'frame', 'message' ]` |
| registerFirstLoad(containerId, markup, base) mounts the markup with a fresh tag, arms the capture, then defines the tag so the registration upgrades the elements | `AssertionError: expected { fresh: false, …(2) } to deeply equal { Object (fresh, names, ...) }` |
| registerFirstLoad(containerId, markup, base) takes a new tag each time | `AssertionError: expected { defined: [ false, false ], …(1) } to deeply equal { Object (defined, same) }` |
| readyState(value) makes document.readyState read the value until the next mount, and the capture reads it too | `AssertionError: expected { Object (during, loaded, ...) } to deeply equal { during: 'loading', …(2) }` |
| readyState(value) null gives the real value back | `AssertionError: expected [ 'complete', 'complete' ] to deeply equal [ 'interactive', 'complete' ]` |
| insertInteractive(containerId, markup) arms the capture, then inserts while readyState is interactive with the element defined, and returns the insertion's time | `AssertionError: expected { readyState: undefined, …(2) } to deeply equal { readyState: 'interactive', …(2) }` |
| after(ms) and the W in force returns no earlier than ms after the previous step's end, with the gap it achieved in page milliseconds | `AssertionError: expected 0 to be greater than or equal to 100` |
| after(ms) and the W in force measures from the end of the step before it, not from its own call | `AssertionError: expected 0 to be greater than or equal to 100` |
| after(ms) and the W in force the W in force is 2 × D of the in-process timing constant, a D of at least two rendering updates and under Chromium's 150 ms | `AssertionError: expected 0 to be greater than or equal to 34` |
| hostRole(id) reads the role of a host in the final snapshot of the last capture | `AssertionError: expected [ 'none', 'none' ] to deeply equal [ 'alert', 'status' ]` |
| forms formData(formId) returns the form's entries | `AssertionError: expected [] to deeply equal [ Array(2) ]` |
| forms submit(formId) submits through the form's submitter and returns the entries with the submitter's | `AssertionError: expected null to deeply equal [ [ 'title', 'draft' ], …(2) ]` |
| forms submit(formId) returns null when no submit event fires (a required field empty) | `AssertionError: expected { empty: null, filled: null } to deeply equal { empty: null, …(1) }` |
| forms after a key step, submit(formId) takes that step's submission, or null when it made none | `AssertionError: expected { one: null, two: null } to deeply equal { …(2) }` |
| forms reset(formId) resets the form | `AssertionError: expected 'Fix lane' to be 'draft' // Object.is equality` |
| forms type(id, text) focuses the control and types the text key by key | `AssertionError: expected { value: '', inputs: +0, focused: '' } to deeply equal { value: 'Fix {lane}', …(2) }` |
| forms press(id, key) focuses the element and presses the key | `AssertionError: expected { keys: [], value: 'ab', focused: '' } to deeply equal { keys: [ 'End', 'Backspace' ], …(2) }` |
| forms blur() moves focus away from the focused element, through shadow roots | `AssertionError: expected { focused: 'f', blurred: [], …(1) } to deeply equal { focused: 'f', …(2) }` |
| forms click(id, at) clicks at that point of the element's box | `AssertionError: expected [] to deeply equal [ { x: 150, y: 30 } ]` |
| forms focusPath() lists the focused element through shadow roots | `AssertionError: expected { empty: [], field: [] } to deeply equal { empty: [], field: [ …(2) ] }` |

### `packages/elements/test/live-capture.test.ts` (7 failing)

| Test | Assertion message (as logged, cut at 160 characters) |
|---|---|
| liveCapture in process observes the container's subtree: a region added and written W later counts one under both rules; a region outside is not read | `AssertionError: expected { paused: [], lifecycle: [] } to deeply equal { paused: ArrayContaining{…}, …(1) }` |
| liveCapture in process observes the shadow roots in the container when it is armed: a text set and cleared within a task is seen at a mutation pause | `AssertionError: expected { paused: [], lifecycle: [] } to deeply equal { …(2) }` |
| liveCapture in process observes shadow roots attached after it is armed, nested ones included (the attachShadow patch) | `AssertionError: expected [] to include 'Saved'` |
| liveCapture in process takes snapshots with at, frame, lifecycle, loaded, regions and hosts; lifecycle snapshots count the rendering updates | `AssertionError: expected 0 to be greater than or equal to 3` |
| liveCapture in process stop() waits the quiet window (the largest W + the minimum hold + the largest D) after the last mutation, then two rendering updates | `AssertionError: expected NaN to be greater than or equal to 0` |
| liveCapture in process stop({ atLeast }) first waits until atLeast has passed since the capture started | `AssertionError: expected NaN to be greater than or equal to 500` |
| liveCapture in process a capture over an element that mutates in a loop ends with "capture exceeded …", not a timeout | `Error: promise resolved "[]" instead of rejecting` |

### `packages/elements/test/live.test.ts` (21 failing)

| Test | Assertion message (as logged, cut at 160 characters) |
|---|---|
| the live-region reading (regionText, announcements) StaticText taken | `AssertionError: expected [Function] to not throw an error but 'AssertionError: expected \'\' to be \…' was thrown` |
| the live-region reading (regionText, announcements) an img's name taken and its descendants… | `AssertionError: expected [Function] to not throw an error but 'AssertionError: expected \'\' to be \…' was thrown` |
| the live-region reading (regionText, announcements) a link's own name skipped and its Stati… | `AssertionError: expected [Function] to not throw an error but 'AssertionError: expected \'\' to be \…' was thrown` |
| the live-region reading (regionText, announcements) inline text boxes skipped | `AssertionError: expected [Function] to not throw an error but 'AssertionError: expected \'\' to be \…' was thrown` |
| the live-region reading (regionText, announcements) an ignored subtree contributes nothing | `AssertionError: expected [Function] to not throw an error but 'AssertionError: expected \'\' to be \…' was thrown` |
| the live-region reading (regionText, announcements) whitespace collapsed and trimmed, each … | `AssertionError: expected [Function] to not throw an error but 'AssertionError: expected \'\' to be \…' was thrown` |
| the live-region reading (regionText, announcements) a nested region's text is in its own an… | `AssertionError: expected [Function] to not throw an error but 'AssertionError: expected [ \'\', \'\'…' was thrown` |
| the live-region reading (regionText, announcements) a state set and cleared in one task is … | `AssertionError: expected [Function] to not throw an error but 'AssertionError: expected { Object (fl…' was thrown` |
| the live-region reading (regionText, announcements) a state cleared in the first animation … | `AssertionError: expected [Function] to not throw an error but 'AssertionError: expected { frame: { s…' was thrown` |
| the live-region reading (regionText, announcements) a state shorter than D is rendered but … | `AssertionError: expected [Function] to not throw an error but 'AssertionError: expected { short: { s…' was thrown` |
| the live-region reading (regionText, announcements) D is 350 ms while the page loads and th… | `AssertionError: expected [Function] to not throw an error but 'AssertionError: expected { loading: […' was thrown` |
| the live-region reading (regionText, announcements) a region whose text never changes count… | `AssertionError: expected [Function] to not throw an error but 'AssertionError: expected { still: { s…' was thrown` |
| the live-region reading (regionText, announcements) a region that appears holding text coun… | `AssertionError: expected [Function] to not throw an error but 'AssertionError: expected { Object (ap…' was thrown` |
| the live-region reading (regionText, announcements) a nested region pair whose texts both c… | `AssertionError: expected [Function] to not throw an error but 'AssertionError: expected { settled: […' was thrown` |
| expectAnnouncements asserts the expected list under both rules: a list only one rule gives fails, either way | `AssertionError: expected [Function] to throw an error` |
| expectAnnouncements passes when both rules give the expected list | `AssertionError: expected [Function] to throw an error` |
| expectAnnouncements fails on twice | `AssertionError: expected [Function] to throw an error` |
| expectAnnouncements fails on another text | `AssertionError: expected [Function] to throw an error` |
| expectAnnouncements fails on another politeness | `AssertionError: expected [Function] to throw an error` |
| expectAnnouncements fails on another host | `AssertionError: expected [Function] to throw an error` |
| expectAnnouncements uses the delays it is given for the settled rule | `AssertionError: expected [Function] to throw an error` |

### `packages/elements/test/plants.test.ts` (4 failing)

| Test | Assertion message (as logged, cut at 160 characters) |
|---|---|
| plants (elements project) oracle reading: takes a link's own name turns a link's own name skipped and its Stati… red | `Error: expected [Function] to throw error matching /expected 'Open Report link the report…/ but got 'expected \'\' to be \'Open the report…'` |
| plants (elements project) oracle reading: visits an img's descendants turns an img's name taken and its descendants… red | `Error: expected [Function] to throw error matching /expected 'Disk full Star inner now' t…/ but got 'expected \'\' to be \'Disk full Star …'` |
| plants (elements project) oracle reading: ignores the keeping rule turns a state set and cleared in one task is … red | `Error: promise rejected "AssertionError: expected { Object (flicke… { …(4) }" instead of resolving` |
| plants (elements project) capture bounds: an element that mutates its own attribu… turns a capture over the container (in proces… red | `Error: promise resolved "[]" instead of rejecting` |

## (2) How `tdd-check.sh` reads in phase 1

Open: this part is written after `tdd-check.sh` has run and before the review, since it reads that run's
`check-final-tests-on-base.log` and exit code (tasks.md T005a; analysis I11). It has not run yet.
