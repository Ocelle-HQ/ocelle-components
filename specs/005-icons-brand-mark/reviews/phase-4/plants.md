# Phase 4 plants and gate runs (T049)

Run on 2026-11-11 in this container (Node 22.23.4, Chromium 1243 at `OCELLE_CHROMIUM_PATH`; `PLAYWRIGHT_BROWSERS_PATH`
aliased for the plant and mutation runs), one heavy job at a time. Pairing plants: the planted edit applied to the
source in the working tree, the slot scenarios run through both harnesses (in process, `elements`,
`packages/elements/test/slot.test.ts`; strict-CSP fixture, `elements-browser`, `packages/elements/test/browser/slot.test.ts`,
whose global setup bundles the planted `icon-slot.ts` into the test host's file and the planted `ocelle-icon.ts` into
the browser build), the file restored afterwards. No pairing plant is committed. Every plant bit, in both harnesses,
on the scenarios its spec row names; no stop-and-ask was needed.

## The pairing plants of User Story 3

| Pairing row (spec table) or guard | Plant (edit) | Failing scenarios, each without and with `base.css`, in both harnesses | What fails |
|---|---|---|---|
| An empty slot adds no gap or box (US3-5); an empty `trailing` slot adds no gap or box (US3-10) | the gap applied whether or not the slot holds an icon: `.icon-slot { margin-inline-end: var(--ocelle-space-2) }` and `.icon-slot.trailing { margin-inline-end: 0; margin-inline-start: var(--ocelle-space-2) }` instead of the margins on `::slotted(*)` | US3-5; US3-10's empty/filled scenario (4 per harness) | the empty host's label starts (ends) 8 px from the button's content edge instead of 0 |
| A host size rule does not change a slotted icon's box (US3-9) | a size rule that loses to a page rule: `inline-size`, `block-size` and `max-inline-size` on `::slotted(*)` without `!important` | US3-9 (page rules `ocelle-icon, svg { inline-size: 32px }`); US3-3 with base.css (3 per harness) | the slotted `ocelle-icon` and `svg` are 32 px wide under the host rule; with base.css the 24 × 16 svg takes `block-size: auto` |
| `--ocelle-icon-size` set by a page rule on a slotted icon itself does not change its box (US3-9) | the pin removed: no `--ocelle-icon-size: inherit !important` on `::slotted(*)` | US3-9's token-on-the-slotted-icon scenario (2 per harness) | both slotted boxes 32 × 32 and outside the button's border box |
| Centring on the first line (US3-1, US3-10; R-10) | the strut: `.icon-slot` without `block-size: 1lh`, with `.icon-slot::before { content: "\200b" / ""; }` | US3-1 and US3-10 at the xs, sm/tight and 2rem cases (12 per harness) | `centred: false` where the line box is not the icon size; body type (md, normal) holds, as research R-10 measured |
| The convention adds nothing to the name a control takes from its visible label (US3-11) | the strut without empty alt text: `.icon-slot::before { content: "\200b"; }` beside `block-size: 1lh` | US3-11; US3-6 (4 per harness) | the button's name is `"​ Open project ​"` and two `StaticText` nodes of U+200B appear (US3-11); the icon-only control gains two U+200B text nodes (US3-6) |
| The icon inside the control's border box (US3-1, US3-10; PLAN-FRESH-2-002 (a)) | the `.icon-row` `padding-block` rule removed | US3-1 and US3-10 at the xs, sm/tight and 2rem cases; US3-9's host-rule scenario (14 per harness) | `inside: false` for the icon taller than the line box (and for the 2rem token on the host in US3-9) |
| An icon-only control's name is exactly the control's own, and the slotted icon adds nothing (US3-6) | an icon that exposes `role="img"` named from its `name` when unlabelled: `accessibleName(…) ?? this.name` in `ocelle-icon.ts` `updated()` | US3-6; US3-11 (4 per harness) | the slotted icon exposes an image node named `close` (US3-6) and the control's name becomes `folder Open project arrow-end` (US3-11) |

## The `token-only` plants of T041 (judged by `gate:plants`)

`pass-one-line` (`block-size: 1lh`) and `pass-one-line-calc` (`padding-block: calc((var(--ocelle-icon-size) - 1lh) /
2)`) pass; `fail-lh-multiple` (`block-size: 2lh`), `fail-lh-multiple-calc` (`padding-block: calc(var(--ocelle-icon-size)
- 2lh)`), `fail-lh-calc-factor` (`block-size: calc(1lh * 2)`) and `fail-lh-calc-twice` (`padding-block:
calc(var(--ocelle-icon-size) - 1lh - 1lh)`) each fail with one `ocelle/token-only` finding at
`packages/elements/src/x.ts:6`, as their `plant.json` expects.

## Gate runs

| Gate | Result |
|---|---|
| `gate:typecheck`, `gate:lint`, `gate:test-lint` | exit 0 (214 and 145 files, no finding) |
| `gate:style-lint` | exit 0, 10 files, no finding (`src/icon-slot.ts` included) |
| `pnpm -r build`, then `gate:csp` | exit 0, 31 files, no finding (`dist/icon-slot.js` included) |
| `gate:prefix` | exit 0, 191 files, no finding |
| `pnpm test` | exit 0, 2429 tests in 115 files |
| `gate:plants` | exit 0: 214 plants of 14 gates and the registry judged, every plant as expected (the six `lh` plants included) |
