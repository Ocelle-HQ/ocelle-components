# Spike 013: facts description list, progress naming, container queries

- Chromium: 153.0.8010.12 (Playwright headless, `browser.version()`)
- axe-core: 4.10.2 (`npm pack` into `pkg/`, `axe.min.js` injected into the page)
- Scripts (rerun with `node <script>`): `harness.js` (CDP `Accessibility.getFullAXTree` dump + axe runner), `a-facts.js` (env `LONG=<label>` and `COLS=<grid-template-columns>` to vary), `b-progress.js`, `b-raw.js`, `c-container.js`. Raw outputs: `a-out.txt`, `b-out.txt`, `c-out.txt`.
- Custom elements are vanilla with open shadow roots. Only the DOM structure matters.
- The axe "focused" run uses the rules named per question. The "full" run is `axe.run(document)` with serious and critical violations reported.

## A. Description list from `<ocelle-facts>` / `<ocelle-fact label>`

Consumer markup (unchanged in every variant):
`<ocelle-facts><ocelle-fact label="Owner">Ada</ocelle-fact><ocelle-fact label="A considerably longer label"><span>abc-123</span></ocelle-fact></ocelle-facts>` in a 600px wrapper.
Grid: `display:grid; grid-template-columns: fit-content(50%) minmax(0,1fr)` on the list element.

| # | Structure | Chromium AX tree | axe (serious/critical) | Shared column |
|---|---|---|---|---|
| A1 | facts shadow `<dl><slot>`; fact shadow `<dt>${label}</dt><dd><slot>`; fact host inline | DescriptionList > [ignored generic per fact] > term "Owner", definition "Ada", ... (in order) | **definition-list (serious, 1)**, **dlitem (serious, 4)** | No (host inline: dt/dd are not grid items) |
| A1c | A1 + `ocelle-fact{display:contents}` | same as A1 (one more ignored node for the facts host) | definition-list, dlitem (serious) | **Yes** |
| A1s | A1 + fact `display:grid; grid-column:1/-1; grid-template-columns:subgrid` | same as A1 | definition-list, dlitem (serious) | **Yes** |
| A2a | facts shadow plain `<div>`; fact shadow `<div role=term>` + `<div role=definition><slot>`; display:contents | **no list container**: ignored wrappers > term, definition, term, definition | none | Yes |
| A2b | facts `internals.role='list'`; fact `internals.role='listitem'` + shadow role=term/definition; subgrid | list > listitem > (term, definition) x2 | none (axe ignores the internals roles; checks only the role= attributes) | Yes |
| A2c | facts `internals.role='associationlist'` (ARIA 1.3 draft); shadow role=associationlistitemkey/value | unsupported: everything is `generic` | **aria-roles (critical, 4)** | Yes |
| A3 | A1c + fact `internals.role='none'` | DescriptionList > [ignored, presentationalRole] > term, definition | definition-list, dlitem (serious): unchanged, because axe ignores internals | Yes |
| **A5** | facts `attachShadow({mode:'open', slotAssignment:'manual'})` renders `<dl>` + per child `<dt>${fact.label}</dt><dd><slot></slot></dd>`, then `slot.assign(factEl)`; fact shadow is just `<slot>`. A MutationObserver on childList/`label` rerenders | **DescriptionList > term "Owner", definition > (ignored) "Ada", term "A considerably longer label", definition > (ignored) "abc-123"**: term and definition are direct children, in source order | **none** (definition-list and dlitem **pass**) | **Yes** (dt/dd are direct grid items of the dl) |

Trimmed AX excerpts:
```
A1/A1c/A1s/A3:
DescriptionList
  [ignored] none (uninteresting | presentationalRole for A3)   <- ocelle-fact host
    term "Owner"
    definition  StaticText "Ada"
  [ignored] none
    term "A considerably longer label"
    definition  [ignored] > StaticText "abc-123"
A5:
DescriptionList
  term "Owner"
  definition  [ignored] > [ignored] > StaticText "Ada"
  term "A considerably longer label"
  definition  [ignored] > [ignored] > [ignored] > StaticText "abc-123"
```
Chromium's tree is valid for A1 (ignored generic wrappers are transparent). axe fails A1 and A3 because, in the flat tree, the `<dl>` children are `ocelle-fact` elements, not dt/dd/div, and axe does not read ElementInternals roles.

Shared column measurements (dt `x`/`w`, then dd `x`/`w`, 600px container, gap 16):
- With `fit-content(50%)` and normal labels: all dt `x=8 w=176` (the widest label); dd `x=200`. This holds for A1c, A1s, A2*, A3 and A5. A1 (inline host) breaks: x=8/w=67 and x=91/w=517, no shared column.
- With a very long label (`LONG=...`): dt `w=300` (capped at 50%) and the label wraps. This holds for every variant except A1.
- `minmax(auto, 50%)` instead of `fit-content(50%)` always gives a 300px column, even when the labels are short. So use `fit-content(50%)`.

**Recommendation for A: A5 (manual slot assignment).** It is the only structure that meets every requirement: one DescriptionList whose term and definition children are in order, no ID references, consumer content untouched (no `slot=` attributes added), axe clean with definition-list and dlitem passing, and a shared fit-content(50%) column with no display:contents or subgrid tricks. The costs are as follows. ocelle-facts owns the label rendering, reading `label` from each child. It needs a MutationObserver or a slotchange-equivalent: with manual assignment there is no `slotchange` for unassigned children, so observe `childList` and the `label` attribute. Non-`ocelle-fact` children are not rendered unless assigned. The closest alternative is A1c/A1s: the Chromium AX tree is correct, but axe reports definition-list and dlitem as serious.

## B. Progress bar naming

All three variants were tested with label, value, max, valuetext, indeterminate, a host `aria-label`, and no name.

| Case | B1 native `<progress aria-label>` in shadow | B2 shadow `<div role=progressbar aria-*>` | B3 host ElementInternals role=progressbar |
|---|---|---|---|
| determinate | progressbar "Uploading" value=30 min=0 max=100 | same | same; the host *is* the node, with 2 ignored shadow children |
| indeterminate (no value) | progressbar "Loading", no value, max=100 (`:indeterminate` matches) | progressbar "Loading", no value | progressbar "Loading", no value |
| extra host node? | host is ignored when unnamed; **with a host aria-label, a `generic "Host name"` wraps the progressbar** | same as B1 | none: one node |
| host `aria-label` + label | generic "Host name" > progressbar "Uploading" (host label does NOT override) | same | **progressbar "Host name"** (host attribute overrides internals.ariaLabel, as specified) |
| host `aria-label` only | generic "Host name" > progressbar (unnamed); axe **aria-prohibited-attr (serious)** | same, plus axe **aria-progressbar-name (serious)** | progressbar "Host name"; axe **aria-prohibited-attr (serious)**, a false positive because axe does not see the internals role |
| no name | progressbar unnamed; axe silent (aria-progressbar-name only targets `role=progressbar`) | axe **aria-progressbar-name (serious)** | unnamed; axe silent (no role attr) |
| axe, labelled cases | clean | clean (aria-progressbar-name passes) | clean, but no rules apply, so it is also untested by axe |

- valuetext: CDP's `valuetext` property was `""` for every case, including a light-DOM `<div role=progressbar aria-valuetext>` control (`b-raw.js`). This is a limitation of CDP serialization, so valuetext could not be verified this way. Use a platform AT check if it matters.
- Native `<progress>` without `value` exposes indeterminate correctly: no value, and `:indeterminate` matches. Note that it reports valuemax=1 when `max` is unset, and 100 when max is set. It can be styled with CSS only: `appearance:none` plus `::-webkit-progress-bar`/`::-webkit-progress-value` (plus `::-moz-progress-bar` for Firefox). This was not checked further.

**Recommendation for B:** use B1 (native `<progress>` in the shadow root, `aria-label` from a `label` property) when an inner node is acceptable. Use B3 only if a single node and host-level `aria-label` override are required, accepting axe false positives (aria-prohibited-attr on a host aria-label) and that axe cannot check its name. B2 adds nothing over B1. In B1 and B2, a consumer `aria-label` on the host does not name the bar and creates an extra generic node. Either document the `label` property as the API, or forward the host `aria-label` into the inner element.

## C. Container query vs shrink-to-fit

| Element | dialog showModal() | dialog width:300px | flex item (no width) | block 600 | block 300 |
|---|---|---|---|---|---|
| `:host{display:block;container-type:inline-size}` + `@container (max-width:320px)` stack | **hostW=0**, content overflows at min-content (63px), stacked | 300, stacked | **hostW=0**, stacked | 600, row | 300, stacked |
| flex-wrap row: `.l{flex:0 1 10rem}` `.v{flex:1 1 12rem}` | 255, **stacked** (multi-line flex intrinsic size = the widest item) | 300, stacked | 255, stacked | 600, row | 300, stacked |
| plain grid `fit-content(50%) minmax(0,1fr)`, no containment | 255, row | 300, row | 255, row | 600, row | 300, row (no stacking) |

- `container-type: inline-size` collapses to 0 inline size in shrink-to-fit contexts (modal dialog, default flex item), as expected.
- The flex-wrap alternative never collapses and stacks at 300px. It also stacks in a shrink-to-fit dialog, because its intrinsic width is the widest single item, and it cannot share a label column across pairs (each pair has its own flex line).
- A plain grid without containment never collapses and keeps the shared column, but it does not stack at 300px without a media or container query.

**Recommendation for C:** do not put `container-type` on the component host. Use the A5 grid (non-zero in a dialog or flex item, shared column). If narrow stacking is needed, either apply a container query against a consumer-provided container, or accept a flex-wrap per-pair layout and lose the shared column.
