# Phase 2 measurements (T013, T014)

Chromium 153.0.8010.12 (Playwright 1.64.1, `OCELLE_CHROMIUM_PATH`), 1280 × 800, in this container, 2026-11-14.
Scratch code was kept outside the repository (the session scratchpad), as T013 asks; the set-ups are described below
so they can be repeated.

## T013: does the analyzer list inherited members of a base outside `src/ocelle-*.ts`? (R-01)

Set-up: a scratch repository root with `packages/elements/src/overlay.ts` (`export class OcelleOverlay extends
LitElement` with `static properties` `open` (Boolean, reflected), `label` (String), `closeLabel` (String, attribute
`close-label`), each declared with a JSDoc description and `@default`, plus a `#` field and a `protected` field) and
`packages/elements/src/ocelle-sub.ts` (`export class OcelleSub extends OcelleOverlay {}` with `@tagname`, two `@slot`,
`@csspart`, `@cssprop` and two `@fires {CustomEvent<…>} name - description` tags). Run through the repository's own
`generate(root)` (`packages/elements/scripts/manifest.ts`).

- **Outcome with the filter as it is (`/^ocelle-[\w-]+\.ts$/`)**: the `ocelle-sub` entry has `members: []` and
  `attributes: []`. The inherited `open`, `label` and `closeLabel` are **missing**. The superclass is recorded as
  `{ "module": "/src/overlay.ts", "name": "OcelleOverlay" }`. The JSDoc lists are complete: slots `""` and `footer`,
  the part, the CSS property and both events with their `CustomEvent<{ reason: … }>` type texts and descriptions.
- **Outcome with `overlay.ts` analysed too** (the analyzer's `create` over both modules): the subclass lists `open`
  (reflects, default `false`), `label` and `closeLabel` (attribute `close-label`, default `"Close"`) with their
  descriptions and `inheritedFrom: { name: "OcelleOverlay", module: "src/overlay.ts" }`, and the matching three
  attributes. The private and protected fields are inherited too and are dropped by the normaliser as today. The base
  itself appears as a declaration of module `src/overlay.ts` with `customElement: true` and no `tagName`.
- **Decision (R-01 fallback, taken)**: widen the module filter of `scripts/manifest.ts` to `src/ocelle-*.ts` and
  `src/overlay.ts`, and replace the pinned rule of `test/node/manifest.test.ts` ("reads every `src/ocelle-*.ts` … and
  nothing else of `src/`") with the stricter "reads every `src/ocelle-*.ts` and `src/overlay.ts`, and nothing else",
  red first, inside this phase. The generated manifest then also holds the module `src/overlay.ts`.

## T014: the `focusPath()` lists of the opaque-content and positive-`tabindex` rows (R-04)

Set-up: a custom element `x-ov` with an open shadow root `<dialog><button id=close>…</button><div><slot></slot></div>
<footer><slot name=footer></slot></footer></dialog>`, shown with `showModal()`, focus on the close control, then n + 2
presses (`page.keyboard`), `focusPath()` read after each with the driver's naming (`xc[c1]`, `fr[f1]`). `x-closed` is a
custom element with a **closed** shadow root holding `c1` and `c2` (with and without `delegatesFocus`); `fr` is an
`<iframe srcdoc>` holding `f1` and `f2`. Two runs: the engine alone (no Tab handling), and a stand-in of R-04's hybrid
rule (explicit wrap at the navigation order's ends, an opaque container after the last stop making that Tab a middle
press, "Focus checked" over the candidates, R-02's body path, and a repair to the first stop when a `focusout` in the
overlay's tree has no related target and the body is focused after it).

### Native (no Tab handling)

| Case | Tab from the close control | Shift+Tab from the close control |
|---|---|---|
| (i) b1, closed host, b2 (with or without `delegatesFocus`) | `b1 xc[c1] xc[c2] b2 body close b1 xc[c1]` | `body b2 xc[c2] xc[c1] b1 close body b2` |
| (i) b1, iframe, b2 | `b1 fr[f1] fr[f2] b2 body close b1 fr[f1]` | `body b2 fr[f2] fr[f1] b1 close body b2` |
| (ii) b1, closed host last (with or without `delegatesFocus`) | `b1 xc[c1] xc[c2] body close b1 xc[c1] xc[c2]` | `body xc[c2] xc[c1] b1 close body xc[c2] xc[c1]` |
| (ii) b1, iframe last | `b1 fr[f1] fr[f2] body close b1 fr[f1] fr[f2]` | `body fr[f2] fr[f1] b1 close body fr[f2] fr[f1]` |
| tabindex (iii): b1, b2, b3 `tabindex="2"`; footer g1 `tabindex="1"`, g2 | `b3 b1 b2 g1 g2 body close b3` | `body g2 g1 b2 b1 b3 close body` |

The round 3 reference for (i), `b1 xc xc fr[f1] fr[f2] b2`, is confirmed. In (iii) the footer slot is its own focus
navigation scope, so g1's `tabindex="1"` orders it only before g2, not before the body's b3.

### Signals for focus leaving opaque content for the body

- **Closed shadow root**: leaving c2 past the end fires `focusout` on the host (retargeted), with `relatedTarget`
  null, in the overlay's shadow root (capture) and the document; the document body is focused after it. So the repair
  of R-04 applies: no extra press.
- **Slotted iframe**: leaving f2 past the end fires `blur` on the frame's window only. The parent document gets no
  `focusout`, `focusin` or `blur` on the `<iframe>` element, and its `window` `focus` comes only with the next press.
  So the engine gives the overlay **no signal**: focus stays on the body until the next press, which R-02's body path
  sends to the first stop (the stated extra press, one `body` entry).
- Note: entering a frame (b1 to f1) also fires `focusout` with `relatedTarget` null; the repair must check that the
  body is focused afterwards, not the null related target alone.

### With the hybrid rule (the lists for checks.md)

| Case | Tab, n + 2 from the close control | Shift+Tab, n + 2 from the close control |
|---|---|---|
| (i) closed host, no `delegatesFocus` (n = 5) | `b1 xc[c1] xc[c2] b2 close b1 xc[c1]` | `b2 xc[c2] xc[c1] b1 close b2 xc[c2]` |
| (i) iframe (n = 5) | `b1 fr[f1] fr[f2] b2 close b1 fr[f1]` | `b2 fr[f2] fr[f1] b1 close b2 fr[f2]` |
| (ii) closed host, no `delegatesFocus` | `b1 xc[c1] xc[c2] close b1 xc[c1] xc[c2]` (n = 4) | `b1 close b1 close` (n = 2; the closed root is skipped by the wrap) |
| (ii) closed host, `delegatesFocus` | `b1 xc[c1] xc[c2] close b1 xc[c1] xc[c2]` | `xc[c1] b1 close xc[c1] b1 close xc[c1]` |
| (ii) iframe | `b1 fr[f1] fr[f2] body close b1 fr[f1]` (one `body`, the stated extra press) | `fr fr[f2] fr[f1] b1 close fr fr[f2]` (`fr`: the frame's document focused by the wrap) |
| tabindex (iii) (n = 6) | `b3 b1 b2 g1 g2 close b3 b1` | `g2 g1 b2 b1 b3 close g2 g1` |

Every list holds its row's rules (each inner button once per cycle in native order in (i), no `body` in (i) and
(iii), at most one `body` in (ii) forward, the iframe's buttons reached from the frame in (ii) backward, the closed root
without `delegatesFocus` skipped by the reverse wrap, every button once per cycle in (iii)), **except one**:

## Stopped for the operator: (ii) backward with `delegatesFocus`

The Opaque content row says: "A host with `delegatesFocus` in (ii) backward: its inner buttons are reached." With the
mechanism R-04 decides (the wrap calls `focus()` on the opaque container, then the native moves run), `focus()` on a
delegating host focuses its **first** inner focusable, c1; the next Shift+Tab leaves the host natively for b1. The
measured list is `xc[c1] b1 close xc[c1] …`: c2 is never reached going backward. R-04's sentence that the wrap "reaches
its inner stops natively from there" holds for the iframe (the frame's document, then f2, f1) but not for a delegating
closed host. The list cannot meet the row's rule, so per T014 this is the operator's decision before checks.md is
written and before any test or code:

- **(a) Keep R-04's mechanism and narrow the row**: in (ii) backward a delegating host is entered at its first inner
  button (c1) only; its other buttons are reached going forward. The stated reverse-wrap limit (FR-008, README) is
  widened to say so. List: `xc[c1] b1 close xc[c1] b1 close xc[c1]`.
- **(b) Change the wrap mechanism**: when the cycle's last candidate in navigation order is opaque content (a closed or
  absent shadow root, an iframe, media with controls), a Shift+Tab from the first stop moves focus to a non-sequential
  `tabindex="-1"` sentinel at the end of the panel in the overlay's shadow root and lets the native move run (no
  `preventDefault()`), so the engine enters the content from its end. Measured with a stand-in (same set-up): (ii)
  closed host, with and without `delegatesFocus`, gives `xc[c2] xc[c1] b1 close xc[c2] xc[c1] b1`; (ii) iframe gives
  `fr[f2] fr[f1] b1 close fr[f2] fr[f1] b1`; (i) and (iii) are unchanged. This removes the reverse-wrap limit from
  FR-008, R-04, the README and the row, and adds the sentinel to R-04 and data-model; it is a design change, not taken
  here.

T014's commit (checks.md and this file) waits for that decision; nothing else of Phase 2 has started.
