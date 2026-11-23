# Phase 1 spike (T001)

Run on 2026-11-20 in this container (Linux x64, Node 22.23.5, headless Chromium **156.0.8078.4**, the repository's
pinned Playwright 1.64.1 browser at `/opt/pw-browsers/chromium-1248/chrome-linux64/chrome`, Lit from
`packages/elements/node_modules`). Research R-01, R-02 and R-08 were measured in Chromium 157.0.8103.78; this is the
re-run under the repository's pinned browser that plan § Phases and tasks.md T001 ask for. Scratch files only: a
stand-in element and the page scripts in the session scratchpad, the in-process run from a scratch directory at the
repository root outside `packages/` (removed after the run), the style-lint run on a scratch root. Nothing of them is
committed.

**Stand-in.** `x-disclosure`, a Lit 3 element with R-01's shadow tree and R-02's handler: an open shadow root without
`delegatesFocus`; `<details part="details" ?open=${open === true} @toggle>` holding
`<summary class="control" part="summary">` with `.icon-row`, an `aria-hidden="true"` `.icon-slot` wrapper around
`<slot name="icon">` (fallback a text chevron), the `.label` wrapper around `<slot name="summary">`, and
`<div class="panel" part="panel"><slot></slot></div>`; `open` `{ type: Boolean, reflect: true }`; the native `toggle`
handler syncs `open` from `details.open`, awaits `updateComplete`, and dispatches `ocelle-disclosure-toggle`
(`{ open }`, bubbles, composed) only when the state differs from the last reported one (set at `firstUpdated`); a host
`aria-label` is moved onto the summary; `focus()` and `click()` forward to the summary. The fixture-page runs serve it
bundled with Vite under the fixture's policy (`default-src 'none'; script-src 'self'; style-src 'self'; font-src
'self'`): 0 CSP violations recorded.

**Outcome: stop for the operator (tasks.md § Stop-and-ask points, T001: "Any failure stops for the operator").** Three
of the four items hold. The fourth does not: under the pinned Chromium 156 a slotted bare `<svg><title>Folder</title>`
inside the `aria-hidden="true"` icon wrapper has no node of its own, but its title is still in the summary's name
("Folder Advanced"), so US1-17's "the summary control's name is the summary text alone" and FR-005's "adding nothing
to the summary's name" fail with R-01's structure. No scaffold and no red commit were made. The question is at the end.

## 1. The summary in the CDP tree (R-01; US1-1, US1-2, US1-12, US1-17)

`Accessibility.getFullAXTree`, the summary's node found by its backend DOM node id; the fixture page.

| Case | Role | Name | `expanded` | Nodes under the summary |
|---|---|---|---|---|
| closed, slotted text summary "Advanced settings" | `DisclosureTriangle` | "Advanced settings" | false | StaticText "Advanced settings" |
| the same, `open = true` | `DisclosureTriangle` | "Advanced settings" | true | StaticText "Advanced settings" |
| host `aria-label="Show advanced settings"` moved onto the summary, summary text "Advanced" | `DisclosureTriangle` | "Show advanced settings" | false | StaticText "Advanced" |
| **slotted bare `<svg slot="icon"><title>Folder</title><rect/></svg>`, summary text "Advanced"** | `DisclosureTriangle` | **"Folder Advanced"** | false | StaticText "Advanced" (no `image` node) |

The role, the `expanded` property in both states and the moved name hold (no stop on the first T001 point). The svg's
`image` node is gone under the wrapper, as R-01 says, but its `<title>` still names the summary.

### The svg name, measured further (Chromium 156, one shadow root per case, the same light DOM)

| Shadow structure | Summary's name | `image` nodes |
|---|---|---|
| A. R-01: `<span aria-hidden="true"><slot name="icon"></slot></span>` before the label | "Folder Advanced" | none |
| B. `aria-hidden="true"` on the `<slot name="icon">` element itself | "Folder Advanced" | none |
| C. control: text "ICON" written in the shadow root inside the `aria-hidden` wrapper (no slot) | "Advanced" | none |
| D. a `<button>` in place of the `summary`, wrapper as A | "Folder Advanced" | none |
| E. wrapper as A plus `role="none"` | "Folder Advanced" | none |
| F. control: a light-DOM `details`, `<span aria-hidden="true"><svg><title>Folder</title>…</svg></span>Advanced` in the summary | "Advanced" | none |
| G. A, with the summary's `ariaLabelledByElements = [.label]` (element reference, same shadow root) | "Advanced settings" (summary text "Advanced <b>settings</b>") | none |
| H. A, with `aria-labelledby` naming an id on `.label` inside the same shadow root | "Advanced settings" | none |
| I. A, with `aria-hidden="true"` on the consumer's slotted svg itself | "Advanced" | none |
| J. A, nothing else (the control of I) | "Folder Advanced" | none |

So in Chromium 156 an `aria-hidden` ancestor in the shadow tree hides slotted content from the tree but not from the
name computed from content: hidden content written in the shadow root is left out (C), slotted content is not (A, B,
D, E). The light-DOM equivalent is left out (F). Playwright's `ariaSnapshot` of the host reads `- group: Advanced` in
both I and J, so it is not a faithful oracle for this name; the CDP tree is.

## 2. Handler order and the event count (R-02; US1-2, US1-6, US1-7)

Each row from a fresh page; the count read after every element's `updateComplete`, then two animation frames and
every element's `updateComplete` again (contracts/checks.md's wait, the driver's `settle()`); a `document` listener
counts `ocelle-disclosure-toggle`.

| Change | Native `toggle`s | `ocelle-disclosure-toggle` | Final `open` / attribute |
|---|---|---|---|
| a pointer click on the summary (closed) | `closed->open` | 1, `open: true` | true / present |
| `open = true` (closed) | `closed->open` | 1, `open: true` | true / present |
| `[true, false]` in one task (closed) | none | 0 | false / absent |
| `[false, true]` in one task (open) | none | 0 | true / present |
| `[true, false, true]` in one task (closed) | `closed->open` | 1, `open: true` | true / present |

As R-02 states: Lit renders once per task, so a property set and reset in one task leaves `details.open` as it was and
queues no native `toggle`; the US1-7 counts 0, 0 and 1 hold under the wait. (No stop.)

## 3. `#:~:text=` reveal of a closed shadow `details` (R-08; US1-10, FR-010)

A closed disclosure whose panel holds slotted text "The retention period is thirty days.", below a 3000 px spacer.

| Harness | Navigation | `open` / attribute | Events | Notes |
|---|---|---|---|---|
| fixture page (strict CSP) | Playwright `page.goto(<same page>#:~:text=retention)` (same document) | true / present | 1, `open: true` (native `closed->open`) | scrolled to 2330 |
| fixture page | `location.href = "#:~:text=retention"` from `page.evaluate` | true | 1 | |
| fixture page | `location.hash = ":~:text=retention"` from `page.evaluate` | true | 1 | |
| in process (the Vitest browser iframe, `window !== window.top`) | `location.href = "#:~:text=retention"` from the test | true / present | 1 | scrolled to 2286 |
| in process | then `#:~:text=archival` on a second closed disclosure | that one opens | +1 | |
| in process | the first closed again by `open = false`, then `#:~:text=retention` again (the same fragment) | reopens | +1 close, +1 open | a fresh fragment per call is not needed in this browser, but `findText` makes one anyway (contracts/checks.md) |

Find-in-page reveal of slotted text holds in both harnesses, so FR-010 and US1-10 stay (no stop). A script
navigation from the test frame is enough in process; no browser command is needed for `findText`.

## 4. `summary::-webkit-details-marker` under `style-lint` (R-01)

`node gates/bin/style-lint.ts --root <scratch>` on a scratch root holding the repository's `stylelint.config.ts`,
`gates/stylelint/`, `packages/tokens/` and one file `packages/elements/src/scratch-disclosure.ts` whose `css` template
has `summary { list-style: none }`, `summary::-webkit-details-marker { display: none }` and a token hover rule:
`style-lint: 1 file checked, no finding`, exit 0. Its positive control, a second file with `color: #123456`, gave
`ocelle/token-only: color: raw #123456`, exit 1. The selector is admitted, so the WebKit marker rule can be written and
T040 adds no WebKit marker line (no stop).

## Question for the operator (T001 item 1, the bare svg's title)

R-01 hides a slotted icon with an `aria-hidden="true"` wrapper and US1-17 asserts the summary's name is the summary
text alone. Under the repository's pinned Chromium 156 the wrapper removes the svg's node but its `<title>` still
names the summary ("Folder Advanced"). Options:

- **(a) Name the summary from its label wrapper by element reference.** When the host gives no `aria-labelledby` and
  no `aria-label`, the element sets the summary's `ariaLabelledByElements` to `[.label]` (the wrapper around the
  `summary` slot, in the same shadow root, so no ID crosses a root); a moved host `aria-labelledby` resolves as now,
  and a moved host `aria-label` clears the reference so `aria-label` names it. Measured: G and H give the label text
  alone, with the wrapper still hiding the svg's node. FR-006's name order holds (host `aria-labelledby`, host
  `aria-label`, the `summary` slot's text). An empty summary then has an empty name, as the Edge Case wants. A change
  to R-01 and R-03 (and data-model's name note); no change to the spec's requirements.
- **(b) Keep R-01 and make the decorative icon the consumer's job.** The README tells consumers to put
  `aria-hidden="true"` on a slotted bare svg (case I gives "Advanced"); US1-17's body slots the svg with it, and the
  name-from-title case becomes a documented limitation. A change to FR-005 and US1-17 ("a bare `<svg>` with a
  `<title>` included").
- **(c) Record it as a repository-wide limitation and drop the name clause of US1-17** for this mission, as research §
  Repository-wide notes already suspects for `ocelle-button`'s icon slot (D measures the same on a shadow `button`:
  "Folder Advanced"), for a separate op. A spec change.

The spike did not go on to the scaffold: tasks.md stops the phase at T001 on any failure.
