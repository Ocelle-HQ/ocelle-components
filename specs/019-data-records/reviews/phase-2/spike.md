# Phase 2 spike (T026)

Run on 2026-11-20 in this container (Linux x64, Node 22.23.4, HeadlessChrome 156.0.8078.4 from Playwright 1.64.1's
`/opt/pw-browsers`, axe-core 4.14.0 from the root `node_modules`), base 385dfe6. Scratch files only, in the session
scratchpad (`<scratchpad>/spike/spike.mjs` and `dot.mjs`): a Node script that drives Playwright's Chromium on pages
built with `page.setContent`, holding the token stylesheet generated from `packages/tokens/src/source.ts` (its
`@font-face` rules removed) and `packages/styles/src/base.css`, at a 1280 × 800 viewport unless stated. The AX tree is
read through CDP (`Accessibility.getFullAXTree`, ignored nodes skipped), and axe is run in the page with the `axe`
gate's own selection (every rule axe enables or tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` or `wcag22aa`, less
`experimental` and the harness-document rules of `gates/lib/axe-rules.ts`). Nothing of them is committed.

The stand-ins are plain custom elements written to contracts/ocelle-event-timeline.md and
contracts/ocelle-timeline-event.md and research R-08 to R-10: the event with the platform's named slot assignment,
`part="time"` above `part="content"`, the `time` slot rendered only while `hasSlottedTime`, the attribute's text
otherwise, the `::slotted(*)` time type and the `::slotted([hidden])`, `::slotted([aria-hidden="true"])` rule; the
timeline with `slotAssignment: "manual"`, `<ol role="list" part="list" aria-label>` and per visible event `<li
role="listitem">` holding `<span class="marker-line" aria-hidden="true"><span class="marker"></span></span>`, a
`<span class="connector" aria-hidden="true">` except on the last item, and the slot; `has-time` and `next-has-time`
from `hasTime`; the name as `resolveName` gives it. 009's `ocelle-workflow-lane` came from the built browser build
(`packages/elements/dist/browser/ocelle-elements.js`).

**Outcome: three stop-and-ask points reached.** Every tree, item-text, slot, layout, connector and forced-colours
expectation of research holds (§§ 1, 3 to 6). Three results do not, or meet a stop the plan names:

1. **The sunset check is clean (§ 2).** axe-core 4.14.0 reports nothing on a timeline named by a non-blank host
   `aria-label`, nor on a blank one; Chromium exposes the host as a `generic` node of the same name beside the `list`,
   exactly as on 009's lane. plan.md § Complexity Tracking makes a clean result a stop.
2. **axe's `list` and `listitem` rules are inapplicable (§ 1).** With the explicit `role="list"` and `role="listitem"`
   that R-08 keeps for WebKit, axe-core 4.14.0 does not select the `<ol>` or the `<li>`s for those two rules; its
   `aria-required-children` and `aria-required-parent` rules select them instead and pass. US2-1 and R-08 name `list`
   and `listitem` as the rules that judge the tree.
3. **The dot drawn as `border: calc(var(--ocelle-size-dot) / 2) solid` has a hole (§ 5).** Chromium floors a border
   width to whole device pixels: 3.6 px gives 3 px each side on a 7.1875 px box, so a 1.19 px unpainted centre shows at
   a device pixel ratio of 1 and of 2.

The phase stops here: no scaffold, no red commit. The questions are at the end.

## 1. The AX tree, the item-text oracle and axe (R-08, R-11)

Markup: `<ocelle-event-timeline label="Mission history">` with three events: `time="14:02"` "Mission created";
`time="14:20"` "Plan <b>approved</b>" with a `hidden` span and an `aria-hidden="true"` span after it; and "Review
requested" with `<time slot="time" datetime="2026-11-15T14:41">14:41</time>` written after the content.

The unignored tree below `main`:

```text
generic
  list "Mission history"
    listitem
      StaticText "14:02"
      StaticText "Mission created"
    listitem
      StaticText "14:20"
      StaticText "Plan "
      StaticText "approved"
    listitem
      time
        StaticText "14:41"
      StaticText "Review requested"
```

(each `StaticText` holds its `InlineTextBox`, left out here.)

| Check | Result |
|---|---|
| one `list`, named "Mission history", three `listitem`s in source order | yes |
| `itemTexts` (each `listitem`'s `StaticText` names in tree order, joined with spaces, white space collapsed and trimmed) | `["14:02 Mission created", "14:20 Plan approved", "14:41 Review requested"]` |
| the hidden and the `aria-hidden` span's text in the item text | no |
| the slotted `<time>` written after the content | read first; Chromium adds a `time` node around its `StaticText` |
| a node for a marker wrapper, a marker or a connector | none |
| the same with the spans written without `aria-hidden` (R-11's probe) | no node either: the tree has the same 25 nodes |
| axe, full run with the gate's selection | no violation, no incomplete result |
| axe `aria-allowed-role`, `aria-allowed-attr`, `aria-prohibited-attr` | pass |
| axe `aria-required-children` (the `list`), `aria-required-parent` (each `listitem`) | pass |
| axe `list`, `listitem` | **inapplicable** |
| the same timeline with the two explicit roles removed (test-only) | `list` and `listitem` pass, `aria-required-children` and `aria-required-parent` inapplicable, the same tree |

axe-core selects `ul, ol` for `list` and `li` for `listitem` only when they carry no `role` attribute; an explicit
`role="list"` or `role="listitem"` hands them to the ARIA rules above. So with the roles R-08 keeps for WebKit,
`aria-required-children` and `aria-required-parent` are the rules that judge the list's structure (Question 2).

## 2. A host `aria-label` on the timeline against 009's lane (R-09, the sunset check)

A timeline with `label="Mission history"` and two timed events, with a host `aria-label` of "History", of two spaces
and of the empty string; and 009's `ocelle-workflow-lane label="Ready" aria-label="Ready lane"` around one paragraph.

| Case | Tree below `main` | axe (gate selection) |
|---|---|---|
| `aria-label="History"` | `generic "History"` > `list "History"` > 2 `listitem` | no violation, no incomplete; `aria-prohibited-attr` passes |
| `aria-label="  "` | `generic` (unnamed) > `list "Mission history"` > 2 `listitem` | no violation, no incomplete |
| `aria-label=""` | `generic` (unnamed) > `list "Mission history"` > 2 `listitem` | no violation, no incomplete |
| 009's lane, `aria-label="Ready lane"` | `generic "Ready lane"` > `group "Ready lane"` > `paragraph` | no violation, no incomplete |

The non-blank host `aria-label` names the list over `label`, and Chromium shows the host as a `generic` node of the
same name, as on 009's lane and as phase 1 measured for the data table (`reviews/phase-1/spike.md` § 2); axe reports
neither. A blank one counts as absent. So the Complexity Tracking row's sunset is met for the timeline (Question 1).

## 3. The `time` slot (plan gate Q-E, Q-G)

One timeline of nine events:

| Event | Item text | Slotted node |
|---|---|---|
| `time="09:00"`, content "Plan approved", `<time slot="time" datetime>14:20</time>` after it | "14:20 Plan approved" | assigned, shown above the content (its top 90.3 px, the content's 106.7 px) |
| empty `<time slot="time"></time>`, no `time` | "Empty slotted" | unassigned, no client rect, no `part="time"` |
| white-space-only slotted time, no `time` | "Blank slotted" | unassigned, no client rect, no `part="time"` |
| `hidden` slotted time "11:00", no `time` | "Hidden slotted" | unassigned, no client rect, no `part="time"` |
| `aria-hidden="true"` slotted time "12:00", no `time` | "AH slotted" | unassigned, no client rect, no `part="time"` |
| `time="10:00"` and a `hidden` slotted time | "10:00 Hidden with attribute" | unassigned; `part="time"` is "10:00" (Q-G (a)) |
| `<b slot="time">15:00</b>` | "15:00 Bold" | assigned |
| `time="16:00"` | "16:00 Attribute time" | (none) |
| `<span slot="time"> </span>` then `<time slot="time">14:20</time>` | "14:20 Two" | both assigned, no added text (analysis A1) |

The computed type of the attribute time's `part="time"`, of the slotted `<time>` and of the `<b slot="time">`:
the same in all three, `"Schibsted Grotesk", "Helvetica Neue", Arial, system-ui, sans-serif`, 12px, weight 500,
`rgb(94, 88, 79)` (`--ocelle-color-ink-muted`, light), `tabular-nums`, line height 17.4px. So
`slot[name="time"]::slotted(*)` sets the type over the `<b>`'s UA bold.

## 4. The connector geometry (R-10, PLAN-FRESH-2-004 (a))

A mixed timeline of five events: `time="14:02"`; untimed; timed by its slot; untimed with an empty slotted time; and
`time="15:00"` with a long content that wraps. The marker in a `1lh` wrapper (the time's type with `has-time`, the
content's without), the `<li>` a grid of `--ocelle-size-dot` and the item with a `--ocelle-space-3` gap, the rows
`--ocelle-space-3` apart, and the connector absolutely positioned in the marker column:

```css
.connector {
  inset-block-start: calc((var(--ocelle-font-size-sm) * var(--ocelle-line-height-normal) + var(--ocelle-size-dot)) / 2 + var(--ocelle-space-1));
  inset-block-end: calc(var(--ocelle-space-1) - var(--ocelle-space-3) - (var(--ocelle-font-size-sm) * var(--ocelle-line-height-normal) - var(--ocelle-size-dot)) / 2);
  inset-inline-start: calc((var(--ocelle-size-dot) - var(--ocelle-border-width)) / 2);
  inline-size: 0;
  border-inline-start: var(--ocelle-border-width) solid var(--ocelle-color-rule-strong);
}
```

with `--ocelle-font-size-xs` in place of `-sm` under `li.has-time` (the start) and `li.next-has-time` (the end).

| Item | Classes | Dot | Dot centre less the first line's centre | Gap at start | Gap at end | `elementFromPoint` at the dot's centre |
|---|---|---|---|---|---|---|
| 1 | `has-time` | 7.1875 × 7.1875, radius 50% | −0.013 px | 4.016 px | 4.000 px | the marker |
| 2 | `next-has-time` | the same | −0.009 px | 4.016 px | 4.000 px | the marker |
| 3 | `has-time` | the same | −0.012 px | 4.016 px | 4.000 px | the marker |
| 4 | `next-has-time` | the same | −0.009 px | 4.016 px | 4.000 px | the marker |
| 5 | `has-time` | the same | −0.012 px | (last: no connector) | | the marker |

`--ocelle-space-1` is 4 px. The figures are the same at 320 px, where the page's scroll width equals the viewport's
(320). Stylelint with `stylelint.config.ts`, run on a scratch module holding these rules (the `1lh` block size, the
`calc()` insets, `inline-size: 0`, both marker border forms of § 5), reports nothing: this form needs no new
allowance.

## 5. The marks: forced colours, right to left, and the dot's painted shape

- **Forced colours** (`emulateMedia({ forcedColors: "active" })`): the marker's and the connector's border colour is
  `CanvasText` (`rgb(0, 0, 0)`, the probe's), the marker's border width 3px a side, the connector's inline-start border
  1px; their backgrounds transparent.
- **Right to left** (`dir="rtl"` on a wrapper): the first marker's right edge is the host's (1280), and the connector
  at 1275.9 px is inside the marker column; the marks are on the right.
- **The dot's painted shape.** With `box-sizing: border-box`, a `--ocelle-size-dot` box (7.2 px, laid out at 7.1875)
  and `border: calc(var(--ocelle-size-dot) / 2) solid`, Chromium's computed border width is `3px`, not 3.6 px: it
  floors each border width to whole device pixels. The content box, 1.19 px square, is unpainted, and a screenshot of
  the dot shows a light centre, at a device pixel ratio of 1 and of 2 (`dot.mjs`; `#` dark, `+` mid, `.` light):

  ```text
  DPR 1, border on four sides   DPR 1, border-block-start only
  ...+####+...                  ...+####+...
  ..+######+..                  ..+######+..
  ..########..                  ..########..
  ..###++###..                  ..########..
  ..########..                  ..########..
  ..+######+..                  ..+######+..
  ...+####+...                  ...+####+...
  ```

  At 2× the hole is two device pixels wide. With one border side of the whole dot,
  `border-block-start: var(--ocelle-size-dot) solid var(--ocelle-color-ink-muted)` and no other side, the computed
  width is 7px on the 7.1875 px box (a 0.19 px content box), and the dot is solid at both ratios, still a border, so
  forced colours draw it in `CanvasText` (Question 3).

## 6. Outside a timeline and an empty timeline

A standalone `ocelle-timeline-event time="14:02"` "Alone" and an empty `ocelle-event-timeline label="Nothing"`: the
event is a `generic` holding `StaticText "14:02"` then `StaticText "Alone"`, with no list role; the empty timeline is a
bare `generic`, with no `list` node.

## Questions for the operator

**Question 1. The sunset check is clean for the timeline (§ 2).** axe-core 4.14.0, with the `axe` gate's selection,
reports nothing on a timeline named by a non-blank host `aria-label`, nor on a blank one; Chromium shows the host as a
`generic` node of the same name beside the `list`, as on 009's lane and on phase 1's data table. plan.md § Complexity
Tracking makes this a stop.

- (a) Phase 2 adds one story, "named by a host `aria-label`" (`aria-label="History"` beside `label="Mission
  history"`): 12 timeline stories and 24 baselines (`visual:update` must print `(24 added, 0 changed, 0 removed)`);
  the mission 45 stories and 90 baselines; T038, T045 and T046 change accordingly, and the Complexity Tracking row
  drops the timeline (the chain stays, checked by T052).
- (b) **Recommended**, as phase 1's Q1 (b) did for the data table: phase 2 adds two stories, the non-blank and the
  blank host `aria-label` (`aria-label="  "` beside `label="Mission history"`, the list named "Mission history"): 13
  timeline stories and 26 baselines (`(26 added, 0 changed, 0 removed)`), the mission 46 stories and 92 baselines; the
  row drops the timeline as in (a). US2-10's browser bodies stay.
- (c) The row stays as it is: no story for the state, the browser bodies are the evidence, this result recorded in the
  row.

**Question 2. axe's `list` and `listitem` rules do not apply to the explicit roles (§ 1).** US2-1 and R-08 name `list`
and `listitem` among the axe rules that judge the tree, but with `role="list"` and `role="listitem"` (kept for WebKit,
R-08) axe-core 4.14.0 selects neither element for them; `aria-required-children` and `aria-required-parent` judge them
instead, and pass. Element tests run no axe (the `axe` gate runs on the stories), so US2-1's axe clause is the gate's.

- (a) **Recommended.** Keep the explicit roles. US2-1's axe clause reads "`aria-required-children` and
  `aria-required-parent`, which axe applies to the explicit roles, in place of `list` and `listitem`", in spec, R-08,
  contracts/checks.md and T030, met by the `axe` gate on the timeline stories (and the same for the chain, US3-1, at
  T052); the README states it.
- (b) Keep the explicit roles and the wording: `list` and `listitem` stay named, recorded as inapplicable, with no other
  rule named.
- (c) Drop the explicit roles so axe's `list` and `listitem` rules apply (R-08's WebKit reason, spec check 1, is then
  lost: WebKit drops an unstyled list's role).

**Question 3. The dot drawn with `calc(var(--ocelle-size-dot) / 2)` borders has an unpainted centre (§ 5).** Chromium
floors border widths to whole device pixels, so the four 3.6 px sides become 3 px and a 1.19 px hole shows at 1× and 2×.

- (a) **Recommended.** Draw the dot with one border side of the dot's whole size:
  `border-block-start: var(--ocelle-size-dot) solid var(--ocelle-color-ink-muted)`, no other side, `box-sizing:
  border-box`, the `--ocelle-size-dot` box and `border-radius: 50%` kept. It is still a border (forced colours, the
  `background-color` plant unchanged). Contracts/ocelle-event-timeline.md § Marks, R-10 and checks.md's forced-colours
  oracle name the block-start side as the drawing side (width above zero, `CanvasText`).
- (b) Keep the four-side `calc(… / 2)` border as written and accept the centre (the dot reads as a small ring at 1×).
- (c) Four sides of `calc(var(--ocelle-size-dot) / 2 + 0.5px)`: the borders then exceed the box, so the dot grows to
  8 px and no longer equals `--ocelle-size-dot` (US2-2 changes).

## Facts for the red bodies (no decision needed)

- The dot measures 7.1875 px (0.45 rem laid out to 1/64 px), so US2-2's size assertion compares with the
  probe-resolved `--ocelle-size-dot` within 0.5 px, not to the exact 7.2.
- The connector's gap at its start measures 4.016 px and at its end 4.000 px (§ 4), inside the 0.5 px tolerance.
- The dot's centre is within 0.02 px of its first line's centre with the `1lh` wrapper, timed or not.
- A slotted `<time>` adds a `time` node in Chromium's tree, so the item texts are read from `StaticText` descendants at
  any depth under each `listitem`, not from its children only.
