# Contract: test harness additions

Test-only; ships in no package. Reasons: research R-01, R-09.

## Live-region capture

`liveCapture.start(containerId)` arms the paused-mutation recorder on the element with `containerId`, which exists
before the step (for an insertion, the container the markup goes into): it observes the container's subtree and every
open shadow root in it, and patches `Element.prototype.attachShadow` in the page so that every shadow root attached
afterwards, nested ones included, is observed from the moment it is attached. It returns when armed.
`liveCapture.startDocument(url)` (fixture pages only) enables `Debugger` and `Accessibility`, installs the same
recorder with `Page.addScriptToEvaluateOnNewDocument` and then navigates to `url`, so the recorder sees the document
from its first node; every first-load assertion on fixture pages uses it. `liveCapture.stop()` waits until no
mutation has happened for the *quiet window* and two further rendering updates have passed, takes a final snapshot
(which closes the last state at its time), removes the recorder and returns the snapshot list.
`liveCapture.stop({ atLeast: ms })` first waits until `ms` have passed since the capture started, then applies the
same rule; the hold scenario (spec User Story 1 scenario 13) uses it to see the copy emptied after `H`.

The quiet window is derived from the capture's own figures, not fixed (PLAN-FRESH-2-004): the largest `W`
(`2 × D` before load) + the minimum hold (the largest `W`) + the largest `D`, so 700 + 700 + 350 = 2100 ms at
Chromium's figures, followed by the two rendering updates. That is longer than any designed gap between two mutations
of an announcement (a trigger to the write, `W`; a write to a deferred trigger's emptying, at most `W`; R-02), so a
write that comes `W` after a pre-load trigger or a first load is seen and then stays current until the final snapshot,
for longer than `D`, and counts under both rules. In process the window is computed from the test `D` that
`test/in-process.ts` gives both the element and the capture (research R-09, PLAN-FRESH-2-003 (a)). The hold `H` is
not part of the window: emptying a copy is not an announcement.

A snapshot is `{ at: number; frame: number; lifecycle: boolean; loaded: boolean; regions: { node: string; host:
string | null; politeness: "polite" | "assertive"; text: string }[]; hosts: { host: string; role: string }[] }`: `at` is `performance.now()` in the page,
`frame` the count of rendering updates seen so far, `lifecycle` whether the snapshot was taken by the post-lifecycle
frame hook (a `requestAnimationFrame` callback posting a `MessageChannel` message) rather than at a mutation pause,
`loaded` whether `document.readyState` was `"complete"`, `node` a stable key of the region's DOM node (its backend
node id), `host` the id of the nearest `ocelle-*` host at or above it, and `text` the reading of `regionText()`.
`hosts` lists every `ocelle-*` host with an id inside the watched container, read from the same
`Accessibility.getFullAXTree` result as `regions`: `host` its id and `role` the `role` value of the host's own node in
that tree (`"none"` when the node is ignored). `announcements()` does not read `hosts`; only `hostRole(id)` does
(PLAN-FRESH-2-002).

`announcements(snapshots, rule)` is a pure function returning `{ text, politeness, node, host }[]`. Per region node it
keeps the states that satisfy `rule`, then counts by the spec's definition (a region in two consecutive kept states
whose text changed to a non-empty text). `"rendered"` keeps a state current in at least one lifecycle snapshot;
`"settled"` keeps a rendered state that stays current for at least `D` (150 ms when `loaded`, 350 ms otherwise;
Chromium `ax_object_cache_impl.cc`, research R-01; in process the test `D` of research R-09). Every announcement assertion states its expected count once and
checks it under both rules (`expectAnnouncements(snapshots, expected)` asserts both, with no condition).

Bounds: a step that pauses more than 2000 times, or runs longer than 5000 ms, fails with the assertion "capture
exceeded …", so a looping element or mutant ends as a failed test, not a Timeout (research R-09). The figures are
re-measured in T002.

`regionText(nodes, region)` and `announcements()` live in `test/live-reading.ts` and have unit tests of their own on
recorded `getFullAXTree` node lists from the T002 spike: one per reading rule (StaticText taken; `img` name taken and
its descendants not visited; a link's own name skipped and its StaticText children taken; inline text boxes skipped;
an ignored subtree contributes nothing; whitespace collapsed and trimmed), one per keeping rule (a state set and
cleared in one task, a state cleared in the first animation frame, a state shorter than `D`, each kept or not as the
rule says), and the vacuous cases: a region whose text never changes, a region that appears holding text, a nested
region pair whose texts both change (two announcements).

In process it is a set of Vitest browser commands registered in `vitest.config.ts` (as `axTree` is); on fixture pages
it is the same code over the page's CDP session. Both harnesses share `test/live.ts`.

## Driver steps

- `insert(containerId, markup, how)`, `how` one of `"innerHTML"`, `"template"` (a `<template>`'s content cloned and
  appended), `"domparser"` (a node of a `DOMParser` document adopted and appended), `"createElement"` (the elements
  built with `document.createElement` and their attributes and children set before insertion). US1 scenarios 8, 9
  and US2 scenario 20 run once per `how`.
- `laterTask()`: returns after a `MessageChannel` round trip of its own, posted after the previous step, and one
  rendering update, so a removal and an insertion separated by it are in different tasks whatever the UA's task-source
  order (research R-02); `setTimeout(0)` is not used for this.
- `registerFirstLoad(containerId, markup, base)` (in process): mounts markup that uses a fresh test-only tag, then
  calls `define(tag, class extends base {})` from `src/define.ts`, so the elements are upgraded by the registration
  (first load, research R-09). The capture is armed on the container before the call.
- `drive.readyState(value)` (in process): makes `src/live.ts`'s `readyState` read return `value` for the step
  (T002 confirms the mechanism, research R-09).
- `drive.after(ms)`: returns `ms` after the previous step's end, measured in the page, for the scenarios with
  changes in different tasks a set time apart (spec User Story 1 scenario 13: 100 ms apart, 10 ms after a write).
  Scenario bodies state these times as fractions of the `W` in force (100 ms is `W / 3` after load), so the
  in-process run with the test `D` keeps the same relation.
- Timing (in process only): `test/in-process.ts` calls `setAnnouncerTimingForTests` of `src/live.ts` before each
  scenario with the one test constant that also sets the capture's `D` (research R-09). Fixture pages never call it.
  It keeps the timing its first call in the test file returned (the shipped `announcerDefaults`) and exposes it
  read-only; `test/live-timing.test.ts` asserts that value and `announcerDefaults` against the literals
  `{ delayLoaded: 150, delayLoading: 350, hold: 5000 }`, so the shipped figures' mutants are killed in process
  (operator decision PLAN-FRESH-3-004 (a)). That test does not call the setter.
- `hostRole(id)`: the `role` of the entry with `host` equal to `id` in the `hosts` list of the last snapshot
  `liveCapture.stop()` returned (the final snapshot, taken after the quiet window), for the `alert` cells that count zero
  live-region announcements (spec FR-009, SC-002), so that a zero count there also checks that the host is an
  `alert` node.

## Forms

The driver gains `formData(formId)` (entries of `new FormData(form)`), `submit(formId)`, `reset(formId)`,
`type(id, text)`, `press(id, key)`, `blur()`, `click(id, at)` (a pointer click at a point of an element's box, for
US3 scenario 8), `focusPath()` (the active element through shadow roots). `submit(formId)` submits through the form's
own submitter, or by the key step that precedes it, and returns:

- in process: the entries of `new FormData(form, event.submitter)` recorded by a capture-phase `submit` listener on
  the form, which then calls `preventDefault()` so the test iframe does not unload, or `null` when no `submit` event
  fired;
- on fixture pages: the request body the fixture server received, or `null` when no request arrived.

Fixture pages only: `navigateAwayAndBack()` on a route served with `Cache-Control: no-store`, returning
`pageshow.persisted`.

## Twins

Every native-twin comparison (US2 scenarios 6 and 21, US3 scenarios 5 and 6, SC-003) asserts both that the element
equals its twin and that each side equals the expected outcome of this table, so that two empty or `null` sides
cannot pass (PLAN-TESTABILITY-1-006). The field's typed value is `Fix lane` and its default value `draft`.

| Combination | Expected outcome on both sides |
|---|---|
| `name="title"`, enabled, not required | form data `title=Fix lane`; `valid` true |
| no `name` | no `title` entry; `valid` true |
| `disabled`, or inside `<fieldset disabled>` | no `title` entry; `willValidate` false |
| `required`, empty value | `valueMissing` true, `valid` false; a submit returns `null` |
| `required`, value `Fix lane` | `valueMissing` false, `valid` true |
| after reset | form data `title=draft` |
| after history restore (fixture pages) | form data `title=Fix lane` |
| US2-21 form with a submit button, Enter in the field | `submit` returns `title=Fix lane` |
| US2-21 form with a submit button, `required` and empty, Enter | `submit` returns `null`; the field is focused |
| US2-21 form with no submit button and one field, Enter | `submit` returns `title=Fix lane` |
| US2-21 form with no submit button and two fields, Enter in the first | `submit` returns `null` |
| US2-21 mixed form (one native input, one `ocelle-form-input`), Enter in the `ocelle-form-input` | `submit` returns `null`, as the two-field twin (absolute only) |
| US2-21 mixed form, Enter in the native input | `submit` returns both entries (the browser's rule, no twin; README limitation) |

The select's rows follow the same pattern with its options (US3 scenarios 5 and 6), listed in its scenario body.

## Plants

Each assertion family has a planted defect that turns it red (PLAN-TESTABILITY-1-007). A plant is a test fixture under
`test/fixtures/` (an element class derived from the real one with one defect, or a planted reading function), not
shipped. `test/plants.test.ts` (the `elements` project) holds one row per plant: the plant, the scenario body it runs,
and the assertion message the run must fail with. Each row registers the plant under its own tag, runs the named
scenario body with the driver's tag mapping (the scenario's tag replaced by the plant's), and asserts that the body
rejects with that message; a plant whose scenario passes fails the row. Rows that need the document capture run in
the `elements-browser` project the same way. Each phase records the plant run's output in
`specs/010-feedback-forms/reviews/phase-<n>/plants.md`, as 005 did in `reviews/phase-4/plants.md`.

| Family | Plant | Must turn red |
|---|---|---|
| insertion announcement | announcer created already holding the text (no empty wait) | US1-8, US1-15 `status` insertion and reveal, US2-20 |
| alert path | writes the copy for a `role="alert"` host on insertion, reveal and a change to `alert` (PLAN-FRESH-2-002) | US1-15 and the SC-002 `alert` row: insertion, reveal and `status` → `alert` (count 0) |
| alert baseline | the alert path takes the baseline synchronously, at the DOM operation (PLAN-FRESH-3-002 (b)) | US1-15 `alert` cells with the text set in the same task after insertion, after reveal and after the role change (count 0) |
| alert pending tone | a `tone` change while the alert baseline is pending takes the ordinary `tone` row (round 3 verify 1) | US1-15 `alert` cell with the `tone` changed in the same task after insertion (count 0) |
| alert pending role | a change from `alert` to `status` while the alert baseline is pending leaves the marker set (round 3 verify 1) | US1-15 cells inserted, and revealed, as `alert` and changed to `status` in the same task (count 1, polite) |
| alert step after reset | the end-of-task step sets the baseline even when the marker has already been reset (round 3 verify 2) | US1-15 cells inserted, and revealed, as `alert` and changed to `status` in the same task (count 1, polite) |
| merge window | no restart: each trigger writes after its own wait | US1-13 changes in different tasks 100 ms apart (count 1) |
| minimum hold | a trigger during the hold empties the copy at once (PLAN-FRESH-2-001) | US1-13 change 10 ms after a write (the first copy counts under `"settled"`) |
| baseline re-check | writes at the end of the wait without comparing with the baseline | US1-13 `A`, `B`, `A` within the wait (count 0) |
| reveal baseline | the re-check also applies to insertion and reveal (the baseline not set to none, PLAN-FRESH-3-001) | US1-8, US1-17 and US2-22 (first loaded hidden then revealed; announced, hidden and revealed with the same text; count 1) |
| shipped timing | `announcerDefaults` with `delayLoaded: 0`; the timing in force not started from the constant | `test/live-timing.test.ts` |
| hold | empties the copy after `W` instead of `H` (PLAN-FRESH-2-005) | US1-13 hold scenario (copy settled for `H`) |
| first load, late write | writes exactly the pre-load `W` after first load under `drive.readyState("loading")` (PLAN-FRESH-2-004) | US1-10 under `registerFirstLoad`, under both rules |
| short-lived empty state | text written in a microtask after the announcer appears; text written in the first animation frame | US1-8 (`"settled"` count 0) |
| first load | the constructor's `isConnected` rule of the first draft (research R-02) | US1-8 and US2-20 for `innerHTML`, `template` and `domparser` |
| first load | announces on first load | US1-10 under `startDocument` and `registerFirstLoad`, US2-18 |
| nested region | the content wrapper also carries `aria-live` | US1-15 (two announcements) |
| host-role region | `internals.ariaLive` left unset | US1-15 (the host's node announces as well) |
| politeness | always polite | US1-9, US1-12, US1-15 `alert` |
| politeness baseline | announces on any tone change | US1-12 (`danger` → `warning`) |
| move | move flag never set | US1-11 (move), US2-20 (move) |
| later task | move flag never cleared | Edge case "removed and inserted again in a later task" |
| text baseline | compares with the last written copy before normalising | US1-11 (same text again), Edge case whitespace |
| hidden | announces while `hidden` | US1-17, US2-22 |
| error baseline | clearing does not reset the baseline; no whitespace normalisation | US2-10 |
| heading gap | the heading part not hidden when absent | US1-4, SC-004 |
| host ARIA | ignores host `aria-invalid="true"`; lets host `"false"` clear the element's own state | US2-23 |
| naming | name span visually hidden instead of `hidden`; name not recomputed on label text change | US2-1 (label text once), US2-13 (rename without focus) |
| change event | no last-committed guard | US2-3 (Enter then blur) |
| implicit submission | never submits; submits ignoring the one-field rule | US2-21 in process |
| form value | forgets `setFormValue`; reset keeps the typed value; restore ignored | US2-2, US2-4, SC-003 |
| validity | `setValidity({})` always | US2-5, US2-6, US3-5 |
| option mirroring | the option observer misses `characterData` | US3-4 |
| indicator | indicator without `pointer-events: none` | US3-8 |
| capture bounds | an element that mutates its own attribute in a loop | the bound's assertion, not a timeout |
| oracle reading | takes a link's own name; visits an `img`'s descendants; ignores the keeping rule | the named `test/live-reading.ts` unit tests |

Families without a plant (styles measured on computed tokens, forced colours, focus ring, keyboard steps of the native
controls) have no partially working element before their phase: their red-first run against the code without the
element shows they can fail, and the phase review records that run.
