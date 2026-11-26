# Phase 3 spike (T052)

Run on 2026-11-22 in this container (Linux x64, Node 22.23.4, HeadlessChrome 156.0.8078.4 from Playwright 1.64.1's
`/opt/pw-browsers`, axe-core 4.14.0 from the root `node_modules`), base cd1d73c. Scratch files only, in the session
scratchpad (`<scratchpad>/spike/spike.ts`, `standin.js` and `plant.ts`): a Node script that drives Playwright's
Chromium on pages built with `page.setContent`, holding the token stylesheet generated from
`packages/tokens/src/source.ts` (its `@font-face` rules removed) and `packages/styles/src/base.css`, at a 1280 × 800
viewport and a device pixel ratio of 1 unless stated. The AX tree is read through CDP (`Accessibility.getFullAXTree`,
ignored nodes and `InlineTextBox` nodes skipped), and axe is run in the page with the `axe` gate's own selection (every
rule axe enables or tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` or `wcag22aa`, less `experimental` and the
harness-document rules of `gates/lib/axe-rules.ts`). Nothing of them is committed.

The stand-ins are plain custom elements written to contracts/ocelle-evidence-chain.md, contracts/ocelle-evidence-step.md
and research R-08, R-09 and R-12: the step with `<span part="content"><slot></slot></span>`, `:host { display:
inline-block }`, `:host([hidden]) { display: none }` and the `wrap="anywhere"` rule; the chain with `slotAssignment:
"manual"`, `<ol role="list" part="list" aria-label>` as a wrapping flex row (`row-gap: --ocelle-space-3`, no column
gap) and per visible step a `<li role="listitem">` (`min-block-size: --ocelle-size-step`, `padding-inline-end:
--ocelle-space-5`, `column-gap: --ocelle-space-2`; class `chip` and `align-items: center` for a chip) holding a
`<span class="marker" aria-hidden="true">` with the ordinal (default steps only), a `<span class="connector"
aria-hidden="true">` absolutely placed in the trailing padding (`--ocelle-space-1` from the step and from the padding's
end, at `calc(--ocelle-size-step / 2 - --ocelle-border-width / 2)` from the `<li>`'s block start, hidden by
`li[data-line-end] > .connector`) and the slot; the chip box drawn by `::slotted(ocelle-evidence-step[variant="chip"])`
outside the `@media not (forced-colors: active)` block, its colours inside it; the forced-colours rule of the contract;
a `MutationObserver` on the child list and the steps' `hidden`, `aria-hidden` and `variant`; one `ResizeObserver` on
the `<ol>` and every `<li>` whose callback, and each render, set `data-line-end` on each `<li>` whose next `<li>`
starts lower, and on the last; the name as `resolveName` gives it.

**Outcome: one stop-and-ask point reached.** Every line-end, geometry, tree, forced-colours and right-to-left
expectation of research holds (§§ 1 to 4), and axe judges the chain's explicit roles by `aria-required-children` and
`aria-required-parent`, as phase 2 measured on the timeline (§ 5; no contradiction of spike Q2 (a)). One result meets
the stop plan.md § Complexity Tracking names:

1. **The sunset check is clean for the chain (§ 6).** axe-core 4.14.0 reports nothing on a chain named by a non-blank
   host `aria-label`, nor on a blank one; Chromium shows the host as a `generic` node of the same name beside the
   `list`, as on the timeline, the data table and 009's lane.

Two figures of R-12 and the contract differ from what Chromium renders (§ 2); every bound they serve holds. They are
put as Question 2. The phase stops here: no scaffold, no red commit. The questions are at the end.

## 1. Line ends (R-12, FR-034; Q-T5 (b))

The chain `label="Evidence"` with six steps, "Spec", "Plan", "Tasks" (chip), "Red commit", "Green commit" (chip),
"Review". Per `<li>`: its block start (px from the first line), `data-line-end` (1 set), the connector shown (1, its
computed `display` not `none`); and whether every `<li>`, connector and step box lies inside the chain's inline edges,
and the page's scroll width.

| Case | Block starts | `data-line-end` | Connector shown | Inside | Scroll width |
|---|---|---|---|---|---|
| fresh load, 1280 px viewport | 0,0,0,0,0,0 | 000001 | 111110 | yes | 1280 |
| fresh load, 600 px viewport | 0,0,0,0,0,0 | 000001 | 111110 | yes | 600 |
| fresh load, 320 px viewport | 0,0,0,34,34,69 | 001011 | 110100 | yes | 320 |
| fresh load, a 200 px container (#517's column) | 0,0,34,34,69,103 | 010111 | 101000 | yes | 1280 (the viewport) |
| one page resized 1280 → 600 | 0,0,0,0,0,0 | 000001 | 111110 | yes | 600 |
| then → 320 | 0,0,0,34,34,69 | 001011 | 110100 | yes | 320 |
| then → 200 (viewport) | 0,0,34,34,69,103 | 010111 | 101000 | yes | 200 |
| then → 1280 | 0,0,0,0,0,0 | 000001 | 111110 | yes | 1280 |
| then → 320, step 1's text set to "Specification approved by the operator" | 0,34,34,34,69,69 | 100101 | 011010 | yes | 320 |
| then a seventh step "Merged" appended | 0,34,34,34,69,69,69 | 1001001 | 0110110 | yes | 320 |
| then the seventh step `hidden` | 0,34,34,34,69,69 | 100101 | 011010 | yes | 320 |
| then every step's font size 18 px (a late web font's stand-in: the steps widen with no change the observer filters) | 0,62,62,102,102,143 | 101011 | 010100 | yes | 320 |
| fresh load at 320 px of that final state | 0,62,62,102,102,143 | 101011 | 010100 | yes | 320 |
| fresh load, 320 px, `dir="rtl"` on a wrapper | 0,0,0,34,34,69 | 001011 | 110100 | yes | 320 |

The line ends follow the current layout only: each state reached by resizing and changes equals the fresh load of the
same state. A connector is shown on every `<li>` but a line's last, and none is shown past a line end, so none crosses
to the next line. The line pitch is 34.4 px (`--ocelle-size-step` 22.4 + `--ocelle-space-3` 12). No `error` event
(window, capture phase) and no `console.error` call over the whole run; the `ResizeObserver` callback ran ten times.

**The observer plant (R-12, PLAN-TESTABILITY-1-007).** With the callback also writing `padding-inline-end: 0` on a
line-end `<li>` (`plant.ts`, the same page resized 1280 → 600 → 320 → 1280), Chromium dispatches three window `error`
events "ResizeObserver loop completed with undelivered notifications."; the unplanted stand-in dispatches none. So the
in-process no-loop test can fail.

## 2. Marker, ordinal and chip geometry (R-12, FR-031, FR-033, FR-035; SPEC-3-03)

Probe-resolved tokens: `--ocelle-size-step` 22.4 px, `--ocelle-ring-step` 1.5 px as a padding, **1 px as a border
width** (the probe's `border-top-width`), `--ocelle-radius-2` 4 px. The same figures at a device pixel ratio of 2.

| Check | DPR 1 | DPR 2 |
|---|---|---|
| marker box | 22.390625 × 22.390625, `border-radius: 50%` | the same |
| marker computed border width | `1px` | `1px` |
| ordinal 20 in a twenty-step chain: its text box | 15.56 × 15.00, inside the marker's padding box | the same |
| marker 20 `scrollWidth`/`clientWidth`, `scrollHeight`/`clientHeight` | 20/20, 20/20 | the same |
| ordinal type | 12 px (`xs`), line height 13.8 px (`tight`), `tabular-nums`, the sans stack | the same |
| twenty steps at 1280 px | two lines | the same |
| chip: block size | 19.390625 px (17.4 px line + 2 × 1 px border), below 22.4 | the same |
| chip: border, radius, padding block / inline | `1px`, `4px`, `0px` / `8px` | the same |
| chip and default step content font size | 12 px (`xs`) and 14 px (`sm`) | the same |
| centre line (mixed row of § 1): each connector's centre less the marker centre | −0.008 px (each of five) | the same |
| each chip's centre less the marker centre | 0.000 px (both) | the same |
| each default step's first-line centre less the marker centre | 0.002 px (each of four) | the same |
| `<li>` block sizes | 22.390625 each | the same |

Chromium floors border widths: `--ocelle-ring-step`'s 1.5 px computes to `1px` as a border at both ratios, as phase 2
measured for the dot (`reviews/phase-2/spike.md` § 5). The ring is still drawn (a 1 px ring), and the ordinal's inner box
is 20.39 px, not R-12's 19.4. The chip is 19.39 px tall, not the contract's 20.4; it stays below `--ocelle-size-step`
(US3-4). Question 2.

The default step's first line is centred on the marker by `margin-block-start: calc((var(--ocelle-size-step) - 1lh) /
2)` on `::slotted(ocelle-evidence-step:not([variant="chip"]))` (1lh is the step's own 20.3 px line): R-12's "the `1lh`
wrapper again" does not fit here, because the marker (22.4 px) is taller than the content's line, unlike the
timeline's dot. No shadow node is added for it.

## 3. Forced colours (R-12, PLAN-A11Y-SECURITY-1-001)

`emulateMedia({ forcedColors: "active" })`: the marker's border `rgb(0, 0, 0)` (`CanvasText`, the probe's) `1px`, its
ordinal colour `rgb(0, 0, 0)`; the connector's `border-top` `rgb(0, 0, 0)` `1px`, background transparent; the chip's
border `rgb(0, 0, 0)` `1px` with its box rule outside the variant block, its text `rgb(0, 0, 0)`; a default step's text
`rgb(0, 0, 0)`.

## 4. Right to left, outside a chain, empty and hidden (FR-034, FR-030, FR-025, FR-001)

- `dir="rtl"` at 320 px (§ 1's last row): the first `<li>`'s right edge is the chain's (320), the lines fill towards the
  left (the `<li>` right edges 320, 236, 157 on the first line), each marker is right of its step and each connector
  left of it.
- A standalone `ocelle-evidence-step` and a standalone chip step (`variant="chip"`) in a paragraph: `display:
  inline-block`, no border, no padding, the paragraph's 16 px, `part="content"` present.
- An empty `ocelle-evidence-chain label="Nothing"`: a bare `generic`, no `list` node. A chain with `hidden`: no node.
  The standalone step: `generic` > `generic` > `StaticText "Alone"`.

## 5. The AX tree and axe's rules on the explicit roles (R-08, R-11; US3-1; phase 2 spike Q2 (a))

The unignored tree below `main` for `label="Evidence"` and the six steps of § 1:

```text
generic
  list "Evidence"
    listitem
      generic
        StaticText "Spec"
    listitem
      generic
        StaticText "Plan"
    listitem
      generic
        StaticText "Tasks"
    listitem
      generic
        StaticText "Red commit"
    listitem
      generic
        StaticText "Green commit"
    listitem
      generic
        StaticText "Review"
```

No node for a marker, an ordinal or a connector; each `listitem`'s text is the step's content only, chips included.

| axe (gate selection) | With the explicit roles | Roles removed (test-only) |
|---|---|---|
| violations, incomplete | none, none | none, none |
| `list`, `listitem` | **inapplicable**, **inapplicable** | pass (1 node), pass (6) |
| `aria-required-children` (the `list`), `aria-required-parent` (each `listitem`) | pass (1), pass (6) | inapplicable, inapplicable |
| `aria-allowed-role` | pass (7) | inapplicable |
| `aria-allowed-attr`, `aria-prohibited-attr` | pass, pass | pass, pass |

The same as phase 2 on the timeline: US3-1 names `aria-required-children` and `aria-required-parent`, as Q2 (a) and
R-08 already say for the chain. No contradiction.

## 6. A host `aria-label` on the chain (R-09, the sunset check)

| Case | Tree below `main` | axe (gate selection) |
|---|---|---|
| `label="Evidence"` only | `generic` > `list "Evidence"` > 6 `listitem` | no violation, no incomplete |
| `aria-label="Proof"`, `label="Evidence"` | `generic "Proof"` > `list "Proof"` > 6 `listitem` | no violation, no incomplete; `aria-prohibited-attr` passes (2 nodes) |
| `aria-label="  "`, `label="Evidence"` | `generic` (unnamed) > `list "Evidence"` > 6 `listitem` | no violation, no incomplete |
| `aria-label=""`, `label="Evidence"` | `generic` (unnamed) > `list "Evidence"` > 6 `listitem` | no violation, no incomplete |

The non-blank host `aria-label` names the list over `label`, and Chromium shows the host as a `generic` node of the
same name, as on the timeline (`reviews/phase-2/spike.md` § 2), the data table (`reviews/phase-1/spike.md` § 2) and
009's lane; axe reports neither. A blank one counts as absent. So the Complexity Tracking row's sunset is met for the
chain, its last element (Question 1).

## Questions for the operator

**Question 1. The sunset check is clean for the chain (§ 6).** axe-core 4.14.0, with the `axe` gate's selection,
reports nothing on a chain named by a non-blank host `aria-label`, nor on a blank one. plan.md § Complexity Tracking
makes this a stop. The chain is the row's last element, so any answer but (c) removes the row.

- (a) Phase 3 adds one story, "named by a host `aria-label`" (`aria-label="Proof"` beside `label="Evidence"`): 13 chain
  stories and 26 baselines (`visual:update` must print `(26 added, 0 changed, 0 removed)`); the mission 47 stories and
  94 baselines; T061, T068 and T069 change accordingly; the Complexity Tracking row is dropped.
- (b) **Recommended**, as phase 1's and phase 2's Q1 (b): phase 3 adds two stories, the non-blank and the blank host
  `aria-label` (`aria-label="Proof"` and `aria-label="  "`, each beside `label="Evidence"`; the second list named
  "Evidence"): 14 chain stories and 28 baselines (`(28 added, 0 changed, 0 removed)`), the mission 48 stories and 96
  baselines; T061, T068 and T069 change accordingly (in T061 the blank story's list is named "Evidence"); the row is
  dropped. US3-10's browser bodies stay.
- (c) The row stays as it is for the chain: no story for the state, US3-10's browser bodies are the evidence, this
  result recorded in the row.

**Question 2. Two figures of R-12 and the contract differ from the render (§ 2).** Chromium floors
`--ocelle-ring-step` (1.5 px) to a 1 px border at device pixel ratios 1 and 2. So the chip is 19.39 px tall, not the
"20.4 px" of contracts/ocelle-evidence-chain.md § Behaviour and R-12, and the marker's inner box is 20.39 px, not R-12's
"22.4 − 2 × 1.5 = 19.4 px". Every bound holds: the chip is below `--ocelle-size-step`, and "20" fits the inner box.

- (a) **Recommended.** The planner corrects the two figures in R-12 and the contract in a documentation commit (the
  chip's sum written as the 17.4 px line plus two `--ocelle-ring-step` borders as Chromium draws them, 1 px each:
  19.4 px; the inner box 20.4 px), with no other change. The red bodies compare the ring's and the chip outline's
  border width with the probe's `--ocelle-ring-step` read as a border width, not as a padding, and assert the chip's
  block size below `--ocelle-size-step`, never an exact figure.
- (b) No document change: the bodies are written as in (a) and this spike's § 2 is the record.
- (c) No document change, and the bodies compare the border widths with `--ocelle-ring-step` read as a padding (1.5
  px) within 0.5 px: the 1 px ring passes at the tolerance's edge, so a plant that halves the ring would not be seen.

## Facts for the red bodies (no decision needed)

- Lengths compare with the probe-resolved token within 0.5 px (the marker lays out at 22.390625 px). Border widths
  compare with the probe's `border-top-width` set to the token (1 px for `--ocelle-ring-step`), so a body sees the same
  floor as the element.
- The line pitch at 320 px is 34.4 px; the six steps of § 1 take three lines at 320 px and four in a 200 px container.
- Each `listitem` holds a `generic` node for the step's host, so the item texts are read from `StaticText` at any
  depth (R-11, as on the timeline).
- The ordinal's text box (15.56 × 15.00 px) is measured with a `Range` over the marker's contents; it is taller than
  the 13.8 px line height but inside the 20.39 px padding box.
- A width change of the steps alone (a later web font), with no attribute or child change, re-decides the line ends
  through the `<li>` observer.
