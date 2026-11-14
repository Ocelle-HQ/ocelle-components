# Phase 1 spike (T001, T001a)

Run on 2026-11-14 in this container (Linux x64, Node 22.23.4, headless Chromium 153.0.8010.12 at
`/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` through Playwright 1.64.1, Lit 3.3.3 from
`packages/elements/node_modules`, axe-core 4.14.0 from the root `node_modules`). Scratch files only, in the session
scratchpad; nothing of them is committed. The pages were served from 127.0.0.1 under the fixture's policy
(`default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'`) with `tokens.css` generated from
`packages/tokens/src/source.ts` and the vendored Schibsted Grotesk font, as `test/browser/serve.ts` does.

The stand-ins are `x-facts` and `x-fact`, built with Lit as the plan describes `ocelle-facts` and `ocelle-fact`:
`static shadowRootOptions` with `slotAssignment: "manual"`, the template rendering `<dl part="list">` with
`<dt part="label">` and `<dd part="value"><slot></slot></dd>` per visible fact (the `<div class="item">` group with
`layout="grid"`), `slot.assign()` in `updated()`, the two probes in a 0 × 0 holder, one `ResizeObserver` on the host
and both probes, one `MutationObserver` (R-01's options), a `window` `resize` listener, and the measure pass of R-02
(it removes the classes, reads the host's inline size and sets `stacked`, or `cols-2`/`cols-1` in the grid,
unconditionally). Styles as R-03 with the tokens. The layout wait is R-02's: after `updateComplete`, one read per
animation frame until two consecutive frames give the same host and `<dl>` geometry, failing after 10.

**Outcome: stop-and-ask reached (tasks.md § Stop-and-ask points, T001, third item).** A flip of the layout decided in
the `ResizeObserver` callback raises "ResizeObserver loop completed with undelivered notifications". Every other
binding check passed: FR-004 holds under Lit 3.3.3 and axe-core 4.14.0 in both structures, an empty `<dt>` stays a
term, the grid's `<div>` groups pass axe `definition-list` and `dlitem`, and the only state dependence measured is an
unobserved change of the kind FR-009 is narrowed for. The question for the operator is at the end. The phase stops
here: no scaffold, no red commit.

## 1. Structure under Lit 3.3.3 and axe-core 4.14.0 (T001 item 1, T001a item 1)

Markup: a `<main>` with an `<h1>` and one sheet of six facts: "Owner" / "Ada"; `label=""` / "Empty label value";
"Ref" with `lang="fr"` / "Bonjour"; "Hidden" with `hidden`; "Empty value" with no content; "Link" / a link.

| Check | Default structure (A5) | `layout="grid"` (`<div>` groups) |
|---|---|---|
| shadow `<dl>` element children | `dt dd dt dd dt dd dt dd dt dd` (5 pairs; the hidden fact has none) | `div[dt dd]` × 5, each group one `<dt>` then one `<dd>` |
| slot assignment | each `<dd>`'s slot holds its own fact | the same |
| `lang` on the `<dt>` | `lang="fr"` on "Ref"'s term | the same |
| Chromium AX tree (unignored) | `DescriptionList > term "Owner", definition "Ada", term (empty), definition "Empty label value", term "Ref", definition "Bonjour", term "Empty value", definition (empty), term "Link", definition > link "a link"` | identical |
| the groups in the full AX tree | n/a | each group is an `[ignored] none` node under the `DescriptionList`, holding its term and definition |
| empty `<dt>` | a `term` node with no name, kept in the tree | the same |
| empty `<dd>` | a `definition` node, kept | the same |
| axe `definition-list`, `dlitem` | pass (1 and 10 nodes), no violation, no incomplete | pass (1 and 10 nodes), no violation, no incomplete |
| axe full run | no violation, no incomplete | no violation, no incomplete |

Inside each `definition` the `x-fact` host shows as a `generic` node holding the value; Chromium keeps it, and axe
does not report it. FR-004 holds as written in both structures (PLAN-CORRECTNESS-1-014 (b), IQ-05 (b)): no stop.

## 2. The two-column measure in the hosts (T001 item 2)

Content: "Created by op" / "Ada Lovelace and Charles Babbage". In the harness's font its two-column max-content is
386.1 px and its stacked max-content 277.9 px, so it crosses the 384 px threshold (24rem at 16 px): above at 1200 and
1280 px, below in stacked form. The margin is 2.1 px; the bodies should keep this content and font, or the
implementer lengthens the value (R-02 allows it) if CI's font run differs.

Each row: loaded at a 360 px viewport, widened to 1200 px, against a fresh load at 1200 px; then a load at 1200 px
narrowed to 360 px. The "loop error" column is the synchronous pass (the class set inside the observer callback).

| Host | at 360 (measure) | widened to 1200 | fresh at 1200 | narrowed to 360 | loop error |
|---|---|---|---|---|---|
| `showModal()` dialog | stacked, 277.9 px (322) | two columns, 386.1 px | two columns, 386.1 px | stacked | yes, on the widen flip |
| popover (`popover="manual"`) | stacked, 277.9 px (346) | two columns | two columns | stacked | yes, on the widen flip |
| float | stacked, 277.9 px (360) | two columns | two columns | stacked | yes, on the fresh load and the narrow flip |
| default flex item | stacked, 277.9 px (360) | two columns | two columns | stacked | yes, on the fresh load and the narrow flip |
| flex row 600 px with a 400 px fixed sibling | stacked, 200 px | stacked, 200 px | stacked, 200 px | stacked | no flip |
| grid `auto auto` track beside a 300 px neighbour | stacked, 60 px (68.5) | two columns | two columns | stacked | yes, on the fresh load and the narrow flip |
| table cell | stacked, 277.9 px (294.7) | two columns | two columns | stacked | yes, on the fresh load and the narrow flip |

- **FR-009's bound** holds in every host: the inline size is never 0 and is at least the smaller of the offered space
  and the widest label or value (277.9 px where the host offers more; 200 px and 60 px where the host offers that).
- **Short sheet in a dialog at 1280 px** ("Owner" / "Ada Lovelace"): stacked at 105.7 px without `layout` (measure
  166.5 px); two columns at 166.5 px with `layout="columns"`. The same in every host.
- **History.** Widened and fresh loads agree in every host (with the triggers of R-02).

## 3. The `ResizeObserver` loop error (T001 item 2, T001a item 2): the stop

With the class set synchronously in the observer callback, a flip raises the loop error in the cases marked above, and
also on: the relabel and value-text flips of § 4, a flex sibling shrunk, a table column widened, a dialog reopened at
another width (twice), the late font in a flex item, the hook changed at a fixed width (§ 6, once each way), and in the
grid every flip between column counts in every host (§ 7). The error comes whenever the decided class changes the
host's box (its block size in a block container, its inline size in a shrink-to-fit host) inside the callback, since
the host is then observed again at the same depth.

Where it shows:
- **Fixture harness (Playwright):** the error is a `window` `error` event with no error object. Playwright's
  `console` and `pageerror` events record nothing, so the fixture's console check would **not** catch it; research
  R-02's "which the fixture's console check would record" is not what was measured.
- **In-process harness (Vitest browser mode 5.0.5):** `@vitest/browser`'s `error-catcher.js` turns a `window` error
  event without an error object into `console.error(new Error(message))`; not run here.
- **Consumers:** any page error monitor listening for `window` `error` sees it on each flip.

**R-02's named remedy, measured (not adopted).** With the observer callback deferring the pass to a
`requestAnimationFrame` (the other triggers unchanged), no loop error was raised in any case of this spike, and every
layout, in every host and case of §§ 2, 4 to 7, equalled the synchronous pass's. But R-02's layout wait (two equal
consecutive frames) then returns **before** the deferred pass in several cases, reading the pre-decision layout: the
flex sibling, the 300 → 290 px pass, the hook change at 450 px and 600 px (grid), the dialog reopened, and the grid
flex-sibling and dialog cases all read stale. With the wait made to poll at least 2 frames before it compares, every
result equalled the synchronous pass's (checked also at 3 and 4 frames); the wait then takes 2 frames. So adopting the
remedy also changes contracts/checks.md's layout-wait oracle (and the T003 driver task).

## 4. The round 3 cases (T001 item 3)

Each against a fresh load, in a `showModal()` dialog:

| Case | Content (fixed for the bodies) | Before | After | Fresh load |
|---|---|---|---|---|
| widen 360 → 1200 px | "Created by op" / "Ada Lovelace and Charles Babbage" | stacked (277.9 px) | two columns (386.1 px) | two columns |
| relabel at 1280 px | "Id" → "Created by operator" / "Ada Lovelace and Charles Babbage" | stacked (277.9 px, measure 307.3) | two columns (426.4 px) | two columns |
| value text in place at 1280 px (`characterData`) | label "Created by the operator on duty today"; value text "Ada" → "Ada Lovelace and Babbage" | stacked (250.6 px, measure 298) | two columns (479.7 px) | two columns |

The value-text content is chosen so the stacked size does not change (the label, 250.6 px, is the widest item before
and after), so only the `characterData` trigger can re-decide. **Extra triggers removed** (the pass only from the
observer and on `layout`): widen and relabel stay stacked at 277.9 px, and the value-text case stays stacked at
250.6 px, so the plant bites on all three. One timing note: in the plant run, a wait right after mount returned before
the observer's first decision once (the plant has no pass in `updated()`), so the plant bodies must wait for the first
decision before they act; with that, both named cases stayed stacked in every run.

## 5. Changes the pass does not observe (T001 item 4)

Each changed sheet against a fresh load of the same content in the same space (default threshold):

| Case | Changed sheet | Fresh load | Differs |
|---|---|---|---|
| fixed flex sibling 400 → 100 px (600 px row) | stacked 200 px → two columns 386.1 px | two columns | no (the host resizes) |
| grid `auto` track, neighbour removed (600 px grid) | stacked 277.9 px, stays | two columns 386.1 px | **yes** |
| table column widened to 500 px by another row | two columns, 386.1 → 500 px | two columns | no |
| dialog closed and reopened 300 → 900 px | stacked → two columns | two columns | no |
| dialog reopened 900 → 300 px | two columns → stacked | stacked | no |
| late web font (font response held, then released), dialog / flex item / 450 px block | two columns 396.2 px (fallback) → two columns 386.1 px | two columns 386.1 px | no |

The one case that differs is the grid `auto` track whose neighbour is removed: the stacked sheet's own size does not
change, so neither the host observer nor a window resize fires. This is the kind of change FR-009 is narrowed for
(PLAN-FRESH-3-001 (c)), so it does not stop the phase; it goes into research R-02 § Changes the pass does not observe,
the README and the unobserved-change bodies once the phase resumes. Not copied into research.md in this run.

## 6. Measure pass, probes, hooks, right-to-left, compact (T001 items 5 to 9)

- **300 → 290 px** (block container): stacked at 300 px, still stacked at 290 px after the wait (`grid-template-columns`
  one track).
- **Block containers:** 300 px stacked, 600 px two columns.
- **`layout="columns"` at a 320 px viewport** with a long label and the 64-character identifier with `wrap="anywhere"`:
  two columns, page scroll width 320.
- **Probes at 320 px:** `--ocelle-facts-stack-below: 24 rem` (invalid), `50%` and `0` each give probes `[0, 384]`, so
  the default probe is used: stacked. Valid `15rem` at 300 px: probes `[240, 384]`, two columns. Valid `40rem` at
  600 px: probes `[640, 384]`, stacked. Page scroll width with the probes at a 320 px viewport: 320.
- **Hook changed at a fixed 450 px width:** `15rem` → `40rem` flips two columns → stacked with no resize of the sheet,
  and back (probe observation works; each flip raised the loop error in the synchronous pass).
- **Right-to-left** (600 px, `dir="rtl"` on the sheet): labels at 548..600 px, values at 0..532 px from the sheet's
  left edge.
- **Compact-region hooks** (scratch rules setting the two hooks in `[data-ocelle-density]` rules, as T016 plans):
  in a compact region values are 14 px at 1.5; in a regular region nested in it 17 px at 1.45; `density="compact"`
  alone 17 px at 1.45 with a 4 px row gap (12 px otherwise).
- **Layout wait:** in the synchronous pass the wait returned after 1 or 2 frames in every case. Measured in the
  Playwright harness only; the in-process harness's frame count was not measured, because the wait's definition
  depends on the answer to § 3.

## 7. The grid measure (T001a item 2)

Four facts ("Owner" / "Ada Lovelace", "Created" / "2026-11-14", "Status" / "Running", "Identifier" / "abc-123"):

| Block container | Columns |
|---|---|
| 300 px | 1 |
| 600 px | 2 |
| 800 px | 4 |
| 1280 px | 4 |

In the hosts, with "Created by op" / "Ada Lovelace and Charles Babbage" and "Status" / "Running" (the US1-18
content), loaded at 360 px and widened to 1280 px, against a fresh load at 1280 px: dialog, popover, float, flex item,
table cell: one column at 277.9 px → four columns at 1159.8 px, as the fresh load (four columns, 1159.8 px, at least
2 × T = 768 px; below T at 360 px, so no lengthening is needed); the flex row with a fixed sibling stays one column at
200 px in both; the grid `auto` track goes 60 px one column → 980 px four columns, as fresh. Every flip raised the loop
error in the synchronous pass. The hook changed `15rem` → `40rem` on a 600 px grid sheet moves it from four columns
(600 ≥ 2 × 240) to one (600 < 640): both points move.

Unobserved changes for the grid, against a fresh load: the flex sibling 400 → 100 px in a 1280 px row gives four
columns 880 → 1159.8 px, as fresh; the dialog reopened 300 → 900 px gives one → four columns, as fresh; the grid
`auto` track with its neighbour removed (1000 px viewport) stays two columns at 571.9 px while a fresh load gives four
columns at 1000 px: **differs**, the same narrowing case as § 5.

## 8. A sheet as a `1fr` grid item (T001a item 3)

A one-column `1fr` grid holding a sheet with "Identifier" and the 64-character identifier, at 320 and 600 px
viewports, with and without `min-inline-size: 0` on the host:

| Viewport | Host rule | Track | Page scroll width, value without `wrap` | with `wrap="anywhere"` |
|---|---|---|---|---|
| 320 | none | 320 px | 600 | 320 |
| 320 | `min-inline-size: 0` | 320 px | 600 | 320 |
| 600 | none | 600 px | 676 | 600 |
| 600 | `min-inline-size: 0` | 600 px | 676 | 600 |

The track is never widened, with or without the consumer's rule, because the value column's minimum is 0
(`minmax(0, 1fr)` and `min-inline-size: 0` on the `<dd>` in the spike's styles): the sheet's min-content contribution
stays small. The page overflow without the policy is the unbroken value overflowing its value box (FR-009 as qualified,
"Grid limits"), and the policy removes it. The README statement of IQ-02 (a) still stands as decided; this record only
says the overflow measured comes from the value, not from the track.

## Question for the operator (stop-and-ask, T001)

A flip of the stacking or grid decision inside the `ResizeObserver` callback raises the `ResizeObserver` loop error in
almost every shrink-to-fit host and in block containers (§ 3). Options:

- **(a) Adopt R-02's remedy, and change the layout wait.** The observer callback schedules the measure pass in a
  `requestAnimationFrame`; the pass from `updated()`, the `MutationObserver` and `window` `resize` stay synchronous.
  Measured: no loop error anywhere, the same layouts as the synchronous pass in every case. Cost: after an observed
  resize the old layout shows for one frame; contracts/checks.md's layout wait (and T003's `layout` driver test) poll
  at least 2 frames before comparing, which the spike measured as enough (2, 3 and 4 frames give the same results),
  instead of returning on the first two equal frames, which it measured as too early.
- **(b) Adopt the remedy with a wait on the element's own pending frame.** As (a), but the wait also requires that no
  deferred pass is pending, read through an internal, non-public flag on the element. Exact rather than frame-counted,
  at the cost of a test-only hook in the source.
- **(c) Keep the synchronous pass and accept the error.** No visible lag, but every flip reports an error to the page's
  `window` `error` listeners (consumer error monitors), Vitest's in-process harness logs it, and the README would have
  to say so. Playwright's fixture check does not see it, so the fixture would not guard it.
- **(d) Another mechanism**, for example observing a 0-block-size inline-size sentinel instead of the host; not
  measured here, and in a shrink-to-fit host a flip still changes the observed inline size, so it is not expected to
  remove the error there.

Until the operator answers, T001 and T001a stay open (the narrowing of § 5 is also still to be copied into research
R-02), and the scaffold, red and green steps of phase 1 do not start.
