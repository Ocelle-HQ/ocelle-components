# Phase 5 plants (T084)

Each named plant of User Story 4 was applied alone to the implementation at `47ce03a`, run once against the test file
named and then reverted. The plants come from contracts/elements.md § Pairings (the copy-field rows), research.md R-07,
R-11, R-15 and R-16, and the plants named beside each body of `packages/elements/test/scenarios/copy-field.ts`. The
runner checked after each plant that the source file was the same byte for byte as before it.

The runs used `pnpm exec vitest run --project <project> <file> -t <scenario>` with `OCELLE_CHROMIUM_PATH` set. A failing
test name is cut at 110 characters. Every plant in the table made at least one test fail. The Lit-template row was
run again in review round 1, against the whole file with the new body (below).

## The region in the Lit template (corrected in review round 1, R1-01)

*The region in the Lit template* is one of the two plants contracts § Pairings names for "repeated status does not
mutate the region" (US4-5). The plant renders the region's text from `status` in the Lit template, with an update
requested on each set, instead of the element's own text node.

- **First record, withdrawn.** On its first runs the plant made no copy-field body fail, and this file said it was no
  defect of any outcome the spec states for the region. Review round 1 (R1-01) refuted that. When the field clears
  `status` (FR-042) and the host sets the same text in the same task, with no microtask checkpoint between them, Lit
  batches the two sets into one update. Its text binding then skips the unchanged value, so the region is never
  emptied. FR-041 says a text set after a clear goes into the empty region again, and R-07 writes the region outside
  Lit for exactly this reason. No body had a clear and a set in one task: in every clearing body they were in
  different tasks, or a microtask checkpoint fell between them (the clear inside a real click's listener).
- **The body now.** *FR-041, FR-042: a clear and a set of the same status in one task …* (review round 1) runs in both
  harnesses. It clears in two ways, each followed by the same-text set in one page script: a `value` change, and the
  host's own `status = ""`. A MutationObserver with `characterDataOldValue` must record the text going from the old
  text to empty and from empty to the text again. A repeated set in a later task beside it must mutate nothing (US4-5).
  The body passes on the source.
- **The plant now.** Run against the whole in-process file on the source of `47ce03a` with the new body, the plant
  makes exactly that body fail: 1 failed, 29 passed of 30. The row is in the table below. The pairing's other plant,
  *the region's text written unconditionally*, still makes US4-5 fail. The contract row is unchanged.

## Plants corrected after their first run

Six plants did not bite on their first run (on `55adcf3`). None was a guard that cannot fail: five bodies were weaker
than their guard and were made stricter in `15a9d66`, and one plant form was not a defect. Every corrected plant bites
in the table below.

- *No `overflow-wrap: anywhere`* (US4-2). The 300-character command had hyphens, where a line may break anyway. The
  command is now letters and digits only.
- *The text trimmed* (FR-032). The value had whitespace runs only inside it. It now has leading and trailing runs too.
- *One request for two activations* (FR-035). The two clicks came a frame apart, after the first request. The body
  now also double-clicks the control, two activations within one frame.
- *No `isConnected` check* (FR-035). A detached element's event never reaches a `document` listener, so the dispatch
  was invisible. A listener on the field itself now records the requests too.
- *Clearing `status` on every `value` set* (Edge Cases). With `value` written before `status` in the markup, the first
  render's clear came before the status was read. The body now also writes `status` first.
- *The divider dropped in forced colours* (US4-11), first as a `transparent` border colour. Forced colours repaint
  that border in a system colour, so the line stayed: this form is not a defect. The plant now sets the divider's width
  to 0 in forced colours, and it bites.

## The plants run in process (`elements`, the element source)

| Plant | Where | Test file | Failing tests |
|---|---|---|---|
| a monospace family on the text | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | US4-1: the text is drawn in Schibsted Grotesk with tabular figures on color-inset, the field is a group holdin (1 failed, 28 skipped (29)) |
| no tabular figures | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | US4-1: the text is drawn in Schibsted Grotesk with tabular figures on color-inset, the field is a group holdin (1 failed, 28 skipped (29)) |
| the well in another token (sheet) | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | US4-1: the text is drawn in Schibsted Grotesk with tabular figures on color-inset, the field is a group holdin (1 failed, 28 skipped (29)) |
| the icon labelled (an image node in the tree) | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | US4-1: the text is drawn in Schibsted Grotesk with tabular figures on color-inset, the field is a group holdin (1 failed, 28 skipped (29)) |
| the icon missing | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | US4-1: the text is drawn in Schibsted Grotesk with tabular figures on color-inset, the field is a group holdin (1 failed, 28 skipped (29)) |
| the control unnamed (no aria-label on the button) | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | US4-1: the text is drawn in Schibsted Grotesk with tabular figures on color-inset, the field is a group holdin (1 failed, 28 skipped (29)) |
| white-space: nowrap on the text | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | US4-2: in light, a 300-character command with no space at a 320 px viewport wraps onto several lines inside th; US4-2: in dark, a 300-character command with no space at a 320 px viewport wraps onto several lines inside the (2 failed, 27 skipped (29)) |
| white-space: pre on the text | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | US4-2: in light, a 300-character command with no space at a 320 px viewport wraps onto several lines inside th; US4-2: in dark, a 300-character command with no space at a 320 px viewport wraps onto several lines inside the (2 failed, 27 skipped (29)) |
| no overflow-wrap: anywhere on the text | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | US4-2: in light, a 300-character command with no space at a 320 px viewport wraps onto several lines inside th; US4-2: in dark, a 300-character command with no space at a 320 px viewport wraps onto several lines inside the (2 failed, 27 skipped (29)) |
| the field at a fixed inline size | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | US4-2: in light, a 300-character command with no space at a 320 px viewport wraps onto several lines inside th; US4-2: in dark, a 300-character command with no space at a 320 px viewport wraps onto several lines inside the (2 failed, 27 skipped (29)) |
| white-space: normal on the text (runs collapsed) | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | FR-032: the text keeps its whitespace runs as written, leading and trailing ones included, and the request car (1 failed, 28 skipped (29)) |
| the text trimmed | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | FR-032: the text keeps its whitespace runs as written, leading and trailing ones included, and the request car (1 failed, 28 skipped (29)) |
| a navigator.clipboard.writeText call in the click handler | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | US4-3: a click on the Copy control emits exactly one ocelle-copy-field-request with detail { text } the value  (1 failed, 28 skipped (29)) |
| a document.execCommand("copy") call in the click handler | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | US4-3: a click on the Copy control emits exactly one ocelle-copy-field-request with detail { text } the value  (1 failed, 28 skipped (29)) |
| two requests per click | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | US4-3: a click on the Copy control emits exactly one ocelle-copy-field-request with detail { text } the value  (1 failed, 28 skipped (29)) |
| the request without composed | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | US4-3: a click on the Copy control emits exactly one ocelle-copy-field-request with detail { text } the value  (1 failed, 28 skipped (29)) |
| preventDefault() on every keydown of the field | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | US4-4: Tab reaches the Copy control after the button before the field; Enter emits one request and Space anoth (1 failed, 28 skipped (29)) |
| the region's text written unconditionally (a repeated set mutates it) | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | US4-5: the region is present and empty from first render; a listener that sets status to Copied to clipboard o (1 failed, 28 skipped (29)) |
| the region in the Lit template (rendered from status); run in review round 1 on the whole file | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | FR-041, FR-042: a clear and a set of the same status in one task, with no microtask checkpoint between them, empt (1 failed, 29 passed (30)) |
| the status shown outside the region (the text node in the field) | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | US4-5: the region is present and empty from first render; a listener that sets status to Copied to clipboard o (1 failed, 28 skipped (29)) |
| synchronous dispatch | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | US4-6: with a status shown and a synchronous host listener that sets the same text again, an activation clears (1 failed, 28 skipped (29)) |
| dispatch in a microtask | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | US4-6: with a status shown and a synchronous host listener that sets the same text again, an activation clears (1 failed, 28 skipped (29)) |
| dispatch inside the element's own requestAnimationFrame callback | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | US4-6: with a status shown and a synchronous host listener that sets the same text again, an activation clears (1 failed, 28 skipped (29)) |
| the status not cleared before the request | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | US4-6: with a status shown and a synchronous host listener that sets the same text again, an activation clears (1 failed, 28 skipped (29)) |
| a success colour on a status set | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | US4-7: a failure text set by the host is shown in the live region as in scenario 5, and the field draws no col (1 failed, 28 skipped (29)) |
| a success icon on a status set | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | US4-7: a failure text set by the host is shown in the live region as in scenario 5, and the field draws no col (1 failed, 28 skipped (29)) |
| copy-label not trimmed | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | US4-8: copy-label names the Copy control, trimmed, and a later change follows; without it, blank or removed, i (1 failed, 28 skipped (29)) |
| a host aria-label forwarded to the control | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | US4-8: copy-label names the Copy control, trimmed, and a later change follows; without it, blank or removed, i (1 failed, 28 skipped (29)) |
| the control unnamed with a blank copy-label | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | US4-8: copy-label names the Copy control, trimmed, and a later change follows; without it, blank or removed, i (1 failed, 28 skipped (29)) |
| the label read once at first render | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | US4-8: copy-label names the Copy control, trimmed, and a later change follows; without it, blank or removed, i (1 failed, 28 skipped (29)) |
| the divider in control-border | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | US4-9: the Copy control is at least 44 px in both dimensions, flush against the text with no gap and one 1 px  (1 failed, 28 skipped (29)) |
| two lines between the text and the control (the text's own end border) | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | US4-9: the Copy control is at least 44 px in both dimensions, flush against the text with no gap and one 1 px  (1 failed, 28 skipped (29)) |
| a gap between the text and the control | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | US4-9: the Copy control is at least 44 px in both dimensions, flush against the text with no gap and one 1 px  (1 failed, 28 skipped (29)) |
| no minimum size on the control | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | US4-9: the Copy control is at least 44 px in both dimensions, flush against the text with no gap and one 1 px  (1 failed, 28 skipped (29)) |
| the control outside the field's border | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | US4-9: the Copy control is at least 44 px in both dimensions, flush against the text with no gap and one 1 px  (1 failed, 28 skipped (29)) |
| the focus ring as a box-shadow | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | US4-9: the keyboard-focused Copy control shows the token focus ring, a 3 px color-focus outline 2 px out, draw (1 failed, 28 skipped (29)) |
| the ring in another token | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | US4-9: the keyboard-focused Copy control shows the token focus ring, a 3 px color-focus outline 2 px out, draw (1 failed, 28 skipped (29)) |
| no ring on keyboard focus | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | US4-9: the keyboard-focused Copy control shows the token focus ring, a 3 px color-focus outline 2 px out, draw (1 failed, 28 skipped (29)) |
| the well in another token (pane) | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | R-15: in dark the well is color-inset, the control color-sheet with its accent-strong divider and the outer li (1 failed, 28 skipped (29)) |
| the control's fill in another token (canvas) | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | R-15: in dark the well is color-inset, the control color-sheet with its accent-strong divider and the outer li (1 failed, 28 skipped (29)) |
| ignoring disabled (the control enabled with an empty value) | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | US4-10: with value empty, or missing, the Copy control is exposed as disabled and a click on it emits nothing; (1 failed, 28 skipped (29)) |
| forced-color-adjust: none on the field with the token lines kept | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | US4-11: in forced colours the field's outer boundary and the line between the text and the Copy control are dr (1 failed, 28 skipped (29)) |
| the divider dropped in forced colours (its width 0) | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | US4-11: in forced colours the field's outer boundary and the line between the text and the Copy control are dr (1 failed, 28 skipped (29)) |
| the icon in a token colour | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | US4-11: in forced colours the field's outer boundary and the line between the text and the Copy control are dr (1 failed, 28 skipped (29)) |
| the ring in a token colour | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | US4-11: in forced colours the field's outer boundary and the line between the text and the Copy control are dr (1 failed, 28 skipped (29)) |
| user-select: none on the text | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | US4-12: a triple click with the pointer on the text selects it as ordinary text (the selection, trimmed of the (1 failed, 28 skipped (29)) |
| the request's text read at dispatch | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | FR-035: each activation emits one request with the value at the moment of activation: a host that changes valu (1 failed, 28 skipped (29)) |
| one request for two activations (a pending request swallows the next) | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | FR-035: each activation emits one request with the value at the moment of activation: a host that changes valu (1 failed, 28 skipped (29)) |
| no isConnected check before the dispatch | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | FR-035: a field removed from the page in the activation's task emits no request, neither to the document nor t (1 failed, 28 skipped (29)) |
| a blank status shown | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | Edge Cases: a status set with no request is shown in the live region like any status and emits nothing; a blan (1 failed, 28 skipped (29)) |
| the field emitting on a status set | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | Edge Cases: a status set with no request is shown in the live region like any status and emits nothing; a blan (1 failed, 28 skipped (29)) |
| the status not shown when set with no request (written only while a request is pending) | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | Edge Cases: a status set with no request is shown in the live region like any status and emits nothing; a blan (1 failed, 28 skipped (29)) |
| clearing status on every value set (the first render's included) | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | Edge Cases: with value and status both in the markup, in either order, the status is shown at first render; a  (1 failed, 28 skipped (29)) |
| not clearing status on a later value change | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | Edge Cases: with value and status both in the markup, in either order, the status is shown at first render; a  (1 failed, 28 skipped (29)) |
| clearing status on a set of the same value | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | Edge Cases: with value and status both in the markup, in either order, the status is shown at first render; a  (1 failed, 28 skipped (29)) |
| reflecting status | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | Edge Cases: a status attribute written in the markup is not reflected: after a request clears status the prope (1 failed, 28 skipped (29)) |
| reflecting copyLabel | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | the value and copyLabel properties are not reflected: property sets show the text and name the control and lea (1 failed, 28 skipped (29)) |
| reflecting value | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | the value and copyLabel properties are not reflected: property sets show the text and name the control and lea (1 failed, 28 skipped (29)) |
| a display rule on :host that overrides :host([hidden]) | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | Edge Cases: host hidden removes the copy field, no box and no node; without it the field has a box and its nod (1 failed, 28 skipped (29)) |
| a transition on the control's paint | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | Edge Cases, motion: the Copy control and the text declare no transition or animation, beside the focus ring th (1 failed, 28 skipped (29)) |
| the text dimmed with the disabled control | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | the disabled Copy control is drawn in color-disabled-ink while the text keeps color-ink, beside the enabled co (1 failed, 28 skipped (29)) |
| the internals in a private field (not under the symbol axe reads) | `packages/elements/src/ocelle-copy-field.ts` | `copy-field.test.ts` (elements) | R-01: axe-core reads the group role the field keeps in its internals: no violation and no incomplete of the AR (1 failed, 28 skipped (29)) |
| define without the already-defined check | `packages/elements/src/define.ts` | `copy-field.test.ts` (elements) | Edge Cases, two copies of the package: a second definition of ocelle-copy-field and ocelle-icon throws nothing (1 failed, 28 skipped (29)) |
| the copy field's module not importing the icon's module | `packages/elements/src/ocelle-copy-field.ts` | `entry-ocelle-copy-field.test.ts` (elements) | defines ocelle-copy-field as OcelleCopyField and ocelle-icon, and not ocelle-listbox, ocelle-tabs, ocelle-segm; gives a working control: the field is a group holding its text and the Copy button, and the copy icon is drawn (2 failed (2)) |

## The visual plant `fail-token-changed`

Its findings list gained the four light copy-field stories that show `color-ink`: short, wrapped long command, with a
status, focused Copy control. The empty story is not listed. It shows no text, and its disabled icon is
`color-disabled-ink`. `gate:plants` judges the plant as expected with this list (`notes.md`, the gate run).
