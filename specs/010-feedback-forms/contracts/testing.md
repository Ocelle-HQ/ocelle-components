# Contract: test harness additions

Test-only; ships in no package. Reasons: research R-01, R-09.

## Live-region capture

`liveCapture.start(id)` installs the paused-mutation recorder on the element with `id` (its host, its shadow roots, its
parent) and returns when it is armed; `liveCapture.stop()` takes a final snapshot after the next two animation frames,
removes the recorder and returns the snapshot list.

A snapshot is `{ regions: { node: string; politeness: "polite" | "assertive"; text: string }[] }`, where `node` is a
stable key of the region's DOM node (its backend node id), `text` the spec's reading. `announcements(snapshots)` is a
pure function returning `{ text, politeness, node }[]` by the spec's definition (a region in two consecutive snapshots
whose text changed to a non-empty text). It has unit tests of its own, including the vacuous cases: a region whose text
never changes, a region that appears holding text, a nested region pair whose texts both change (two announcements).

In process it is a pair of Vitest browser commands registered in `vitest.config.ts` (as `axTree` is); on fixture pages
it is the same code over the page's CDP session. Both harnesses share `test/live.ts`.

## Forms

The driver gains `formData(formId)` (entries of `new FormData(form)`), `submit(formId)` (submits through the form's
own submitter and returns the request body the fixture server received, or `null` when no submission happened),
`reset(formId)`, `type(id, text)`, `press(id, key)`, `focusPath()` (the active element through shadow roots).
Fixture pages only: `navigateAwayAndBack()` on a route served with `Cache-Control: no-store`, returning
`pageshow.persisted`.

## Plants

Each new assertion family has a planted defect that turns it red, in the style of 005's plants: an element that never
withholds (US1 scenario 8 fails), one that withholds on first load (scenario 10 fails), a nested second live region
(scenario 15 fails), a form control that forgets `setFormValue` (US2 scenario 2 fails), one whose reset keeps the typed
value (scenario 4 fails). The plants are test fixtures under `test/fixtures/`, not shipped.
