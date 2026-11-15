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
(`2 × D` before load) + the minimum hold (the largest `W`) + the largest `D`, so 700 + 700 + 350 = 1750 ms at
Chromium's figures, followed by the two rendering updates. That is longer than any designed gap between two mutations
of an announcement (a trigger to the write, at most the largest `W`: `W` after the last trigger, or, when the
announcer's empty state began before the load and the trigger after it, the pre-load `W` from that state's start,
which comes before the trigger, so about 650 to 690 ms after it on Chromium; a write to a deferred trigger's
emptying, at most `W`; R-02 step 2, phase 2 stop 2 decision (a)), so a write that comes after a pre-load trigger,
after a change right after a first load, or after a first load is seen and then stays current until the final
snapshot, for longer than `D`, and counts under both rules. The empty state before the write has by then been current
for at least the `W`, so more than the `D`, of the load state in which it began, and is kept under `"settled"` too. In process the window is computed from the test `D` that
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

`regionText(nodes, region)` and `announcements()` live in `test/live-reading.ts` and have unit tests of their own,
written as cases that take the reading as a parameter in `test/live-rules.ts` and run by `test/live.test.ts`, so a
plant row can run the same case with a planted reading (§ Plants, Seams; analysis U7).
The reading rules run on `getFullAXTree` node lists in `test/fixtures/ax/`, recorded before the red commit (T001) by
a throwaway Playwright script against the pre-installed Chromium on planted regions (script not committed; each
fixture's header comment names the Chromium version and the planted markup); the T002 spike re-records them with the
capture as drafted for T004 and stops for the operator if a field the reading uses differs, and T001's lists are not
replaced or edited after the red commit (research R-09, analysis I6). The keeping rules run on hand-written snapshot
sequences. There is one test per reading rule (StaticText taken; `img` name taken and
its descendants not visited; a link's own name skipped and its StaticText children taken; inline text boxes skipped;
an ignored subtree contributes nothing; whitespace collapsed and trimmed), one per keeping rule (a state set and
cleared in one task, a state cleared in the first animation frame, a state shorter than `D`, each kept or not as the
rule says), and the vacuous cases: a region whose text never changes, a region that appears holding text, a nested
region pair whose texts both change (two announcements).

In process it is a set of Vitest browser commands registered in the repository root's `vitest.config.ts` (as
`axTree` is; analysis U5); on fixture pages
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
- `insertInteractive(containerId, markup)` (both harnesses; analysis U4): inserts `markup` into the container while
  `document.readyState` is `"interactive"`, with the element already defined, arms the capture before the insertion
  and returns the insertion's page time. In process: `liveCapture.start(containerId)`, then
  `drive.readyState("interactive")` and `insert(containerId, markup, "innerHTML")`. On fixture pages:
  `liveCapture.startDocument` of a fixture page that loads the browser build and then a same-origin module script
  whose `DOMContentLoaded` listener inserts the markup of a `<template>` in the page and records `performance.now()`
  (module scripts run before `DOMContentLoaded`, so the definition is registered first). The page and its script
  are files under `packages/elements/test/browser/fixtures/`, the directory `test/browser/serve.ts` serves
  (`:30`, `:59`), and the script is among the page's allowed requests (`serve.ts:115-122`), so the fixture run's
  "only allowed requests" assertion holds (analysis I12). A shared scenario body calls
  it once, with no harness condition; US1-8's `"interactive"` cell uses it. `registerFirstLoad` and
  `drive.readyState` stay in process only and are not called by a shared body's cell that runs on fixture pages.
- `drive.after(ms)`: returns no earlier than `ms` after the previous step's end, measured in the page, and resolves
  with the gap it achieved, in page milliseconds (`performance.now()` from the previous step's end to its own
  return), for the scenarios with changes in different tasks a set time apart (spec User Story 1 scenario 13: 100 ms
  apart, 10 ms after a write; FR-027's merge). Each such cell asserts, unconditionally, that the gap lies between its
  stated fraction of `W` and `W` (for example `W / 3` ≤ gap < `W` for the 100 ms step), so a late step fails as a
  named assertion instead of testing another case (analysis A2); T002 records the overshoot in process at the test
  `W`.
  Scenario bodies state these times as fractions of the `W` in force (100 ms is `W / 3` after load), so the
  in-process run with the test `D` keeps the same relation; the driver exposes that `W` for both load states (in
  process from the one timing constant of `test/in-process.ts`, on fixture pages from Chromium's 150 and 350 ms).
  `drive.after` has a test of its own that fails without it (T001b; analysis G6).
- Timing (in process only): `test/in-process.ts` calls `setAnnouncerTimingForTests` of `src/live.ts` before each
  scenario with the one test constant that also sets the capture's `D` (research R-09). Fixture pages never call it.
  Phase 1 (T005) adds the constant and the capture's `D`; phase 2 (T020a) adds the call, and
  `test/in-process-timing.test.ts` (T014a) checks that the capture's `D` is the constant's and that an inserted
  notice's copy is written `2 × D` of the constant after the insertion (analysis G7). The constant gives both load
  states one `D`, so in process the wait's floor from the empty state's start (R-02 step 2) never binds; a rule test
  on a fake clock with two `D` values (T025a) and the fixture-page cells cover it.
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
| `name="title"` and `form="other"`, placed inside form `main`, with form `other` elsewhere in the page (FR-020, Edge Cases) | `formData("other")` holds `title=Fix lane`; `formData("main")` has no `title` entry; `form` is the `other` form |
| `name="title"`, outside any form, with form `main` elsewhere in the page (Edge Cases) | `form` is `null`; `formData("main")` has no `title` entry; `value` reads `Fix lane`, `willValidate` true, `valid` true; with `required` and an empty value `valueMissing` true |

The select's rows follow the same pattern with its options (US3 scenarios 5 and 6), listed in its scenario body,
the `form="other"` and outside-any-form rows included (analysis G2).

## Plants

Each assertion family has a planted defect that turns it red (PLAN-TESTABILITY-1-007). A plant is a test fixture under
`packages/elements/test/fixtures/` (an element class derived from the real one with one defect, a planted reading
function, or planted timing values), not shipped. `packages/elements/test/plants.test.ts` (the `elements` project)
holds one row per plant: the plant, the scenario body it runs, and the assertion message the run must fail with. Each
row registers the plant under its own tag, runs the named scenario body with the driver's tag mapping (the scenario's
tag replaced by the plant's), and asserts that the body rejects with that message; a plant whose scenario passes fails
the row. Rows and cells whose scenario runs under `liveCapture.startDocument` (fixture pages only) are in
`packages/elements/test/browser/plants.test.ts` (the `elements-browser` project, which takes `test/browser/**`; root
`vitest.config.ts`), in the same row format (analysis U9). Its plant classes reach the fixture pages as the test host
does: `packages/elements/test/browser/global-setup.ts` bundles them, with Lit, from an entry that defines each plant
under its tag (`packages/elements/test/browser/plants-entry.ts`) into `ocelle-plants.js`. `test/browser/serve.ts`'s
built-file list serves that bundle, and only the plant rows' pages allow it. T001c starts that file with the capture-bounds row's
fixture-page cell (the looping element of `packages/elements/test/browser/fixtures/capture-loop.html` and its plain
same-origin script `capture-loop.js`); T016 adds the bundle with the first notice plant row that needs it. Each
phase records the plant run's output in `specs/010-feedback-forms/reviews/phase-<n>/plants.md`, as 005 did in
`reviews/phase-4/plants.md`.

**Seams** (analysis U7; research R-09 § Plant seams). What each kind of plant overrides, and what it imports:

| Plant kind | Families | Overrides | Imports |
|---|---|---|---|
| element class | alert path, alert baseline, alert pending role, alert step after reset, politeness, politeness baseline, hidden, nested region, host-role region, heading gap, host ARIA, naming, change event, implicit submission, form value, validity, option mirroring, indicator | a protected method of the element or of its base class (a trigger handler, the politeness, the render or the static styles, the internals setup, the name, value, validity or option step) | the element class from its `src/ocelle-*.ts` module |
| announcer | insertion announcement, merge window, minimum hold, baseline re-check, reveal baseline, hold, first load late write, empty-state start, short-lived empty state, text baseline, error baseline | the element's protected `createAnnouncer()`, returning a class derived from `Announcer` with one protected step overridden (the wait, the write, the hold, the re-check, the baseline) | `Announcer` from `src/live.ts`, and the element class |
| first load and move | first load (constructor `isConnected` rule), first load (announces on first load), move, later task | the element's protected first-load or move query, which reads `src/live.ts` and the registration flag of `src/define.ts` | the element class |
| timing values | shipped timing | no class: the row calls `checkShippedTiming(defaults, firstReturn)` of `packages/elements/test/live-timing-check.ts`, the check `test/live-timing.test.ts` runs, with `{ ...announcerDefaults, delayLoaded: 0 }` and the real first return, then with the real `announcerDefaults` and a first return other than the constant; each call must throw the check's message. Before them, the row calls the check unplanted, with the real `announcerDefaults` and the real first return, and that call must not throw, so the row fails at the scaffold and the red commit, where the constant is the neutral `{ 0, 0, 0 }` and the first return is the stub's `undefined` (analysis C5) | `announcerDefaults` from `src/live.ts` |
| planted reading | oracle reading | no class: the row runs the named case of `packages/elements/test/live-rules.ts` with a planted `{ regionText, announcements }` from `packages/elements/test/fixtures/reading-plants.ts` | `test/live-rules.ts` |
| capture | capture bounds | no class of the library: a test-only element that mutates its own attribute in a loop (`packages/elements/test/fixtures/live-loop.ts` in process; `packages/elements/test/browser/fixtures/capture-loop.html` with its plain script `capture-loop.js` on fixture pages) | nothing from `src/` |

The scaffolds give every module export these imports name (T009a: `Announcer`, `announcerDefaults`,
`setAnnouncerTimingForTests`, `OcelleNotice`; T029a: `OcelleFormInput`; T049a: `OcelleFormSelect`), so the plant
fixtures load at the scaffold and at the red commit and each row fails on its assertion, not on an import. The
protected methods' names are fixed by the red commit's plant fixtures and declared in green; a plant overriding a
method the scaffold lacks still loads, since Vitest runs the tests untyped and the typecheck gate runs at phase end.

The last column names the task that adds each row or cell (analysis G11): the capture and oracle rows are T001c's
(phase 1); the US1, SC-002 and `live-timing` cells T016's (phase 2), with notice plants, and the "empty-state start" row T025a's (phase 2, after stop 2); the US2 cells T034's (phase 3), with plant classes derived
from `ocelle-form-input`; the US3 cells T052's (phase 4), with plant classes derived from `ocelle-form-select`.

| Family | Plant | Must turn red | Added by |
|---|---|---|---|
| insertion announcement | announcer created already holding the text (no empty wait) | US1-8, US1-15 `status` insertion and reveal, US2-20 | US1 cells T016; US2-20 T034 |
| alert path | writes the copy for a `role="alert"` host on insertion, reveal and a change to `alert` (PLAN-FRESH-2-002) | US1-15 and the SC-002 `alert` row: insertion, reveal and `status` → `alert` (count 0) | T016 |
| alert baseline | the alert path takes the baseline synchronously, at the DOM operation (PLAN-FRESH-3-002 (b)) | US1-15 `alert` cells with the text set in the same task after insertion, after reveal and after the role change (count 0) | T016 |
| alert pending role | a change from `alert` to `status` while the alert baseline is pending leaves the marker set (round 3 verify 1) | US1-15 cells inserted, and revealed, as `alert` and changed to `status` in the same task (count 1, polite) | T016 |
| alert step after reset | the end-of-task step sets the baseline even when the marker has already been reset (round 3 verify 2) | US1-15 cells inserted, and revealed, as `alert` and changed to `status` in the same task (count 1, polite) | T016 |
| merge window | no restart: each trigger writes after its own wait | US1-13 changes in different tasks 100 ms apart (count 1) | T016 |
| minimum hold | a trigger during the hold empties the copy at once (PLAN-FRESH-2-001) | US1-13 change 10 ms after a write (the first copy counts under `"settled"`) | T016 |
| baseline re-check | writes at the end of the wait without comparing with the baseline | US1-13 `A`, `B`, `A` within the wait (count 0) | T016 |
| reveal baseline | the re-check also applies to insertion and reveal (the baseline not set to none, PLAN-FRESH-3-001) | US1-8, US1-17 and US2-22 (first loaded hidden then revealed; announced, hidden and revealed with the same text; count 1) | US1 cells T016; US2-22 T034 |
| shipped timing | `announcerDefaults` with `delayLoaded: 0`; the timing in force not started from the constant (planted values, Seams) | `checkShippedTiming` of `test/live-timing-check.ts`, the assertions `test/live-timing.test.ts` runs; the unplanted call with the real values must not throw (analysis C5) | T016 |
| hold | empties the copy after `W` instead of `H` (PLAN-FRESH-2-005) | US1-13 hold scenario (copy settled for `H`) | T016 |
| first load, late write | writes exactly the pre-load `W` after first load under `drive.readyState("loading")` (PLAN-FRESH-2-004) | US1-10 under `registerFirstLoad`, under both rules | T016 |
| empty-state start | the wait ignores the empty state's start: it ends `W` (now) after the last trigger only (phase 2 stop 2, decision (a)) | on fixture pages under `startDocument`, the cells that change a first-loaded notice in the first task after the load (US1-11 text, US1-13 one task; `test/browser/plants.test.ts`), and in process the fake-clock rule case with two `D` values (a trigger after the load, the empty state begun before it) | T025a |
| short-lived empty state | text written in a microtask after the announcer appears; text written in the first animation frame | US1-8 (`"settled"` count 0) | T016 |
| first load | the constructor's `isConnected` rule of the first draft (research R-02) | US1-8 and US2-20 for `innerHTML`, `template` and `domparser` | US1-8 T016; US2-20 T034 |
| first load | announces on first load | US1-10 under `startDocument` and `registerFirstLoad`, US2-18 | US1-10 T016; US2-18 T034 |
| nested region | the content wrapper also carries `aria-live` | US1-15 (two announcements) | T016 |
| host-role region | `internals.ariaLive` left unset | US1-15 (the host's node announces as well) | T016 |
| politeness | always polite | US1-9, US1-12, US1-15 `alert` | T016 |
| politeness baseline | announces on any tone change | US1-12 (`danger` → `warning`) | T016 |
| move | move flag never set | US1-11 (move), US2-20 (move) | US1-11 T016; US2-20 T034 |
| later task | move flag never cleared | Edge case "removed and inserted again in a later task" | T016 |
| text baseline | compares with the last written copy before normalising | US1-11 (same text again), Edge case whitespace | T016 |
| hidden | announces while `hidden` | US1-17, US2-22 | US1-17 T016; US2-22 T034 |
| error baseline | clearing does not reset the baseline; no whitespace normalisation | US2-10 | T034 |
| heading gap | the heading part not hidden when absent | US1-4, SC-004 | T016 |
| host ARIA | ignores host `aria-invalid="true"`; lets host `"false"` clear the element's own state | US2-23 | T034 |
| naming | name span visually hidden instead of `hidden`; name not recomputed on label text change | US2-1 (label text once), US2-13 (rename without focus) | T034 |
| change event | no last-committed guard | US2-3 (Enter then blur) | T034 |
| implicit submission | never submits; submits ignoring the one-field rule | US2-21 in process | T034 |
| form value | forgets `setFormValue`; reset keeps the typed value; restore ignored | US2-2, US2-4, SC-003 | T034 |
| validity | `setValidity({})` always | US2-5, US2-6, US3-5 | US2-5, US2-6 T034; US3-5 T052 |
| option mirroring | the option observer misses `characterData` | US3-4 | T052 |
| indicator | indicator without `pointer-events: none` | US3-8 | T052 |
| capture bounds | an element that mutates its own attribute in a loop | the bound's assertion, not a timeout | T001c |
| oracle reading | takes a link's own name; visits an `img`'s descendants; ignores the keeping rule | the named cases of `test/live-rules.ts`, which `test/live.test.ts` runs as the unit tests of `test/live-reading.ts` | T001c |

Families without a plant (styles measured on computed tokens, forced colours, focus ring, keyboard steps of the native
controls) have no partially working element before their phase: their red-first run against the code without the
element shows they can fail, and the phase review records that run.
