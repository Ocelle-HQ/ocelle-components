# Phase 2 plants (T030)

Each pairing plant of the spec's pairing table rows for User Story 1 was run once on 2026-11-10 (Node 22.23.4,
Chromium 1243): the planted edit applied to the element source in the working tree, the one shared scenario that
guards it run through the harness named, the observation diff kept, then the file restored with `git checkout`. No
plant is committed; the edits are below. Every plant made its guard fail, and in each case the diff is on the "does
not" half the plant targets (a node, a name, a violation, a request, a box), beside the paired positive outcome in the
same test. None failed to bite, so no stop-and-ask was needed.

| Pairing row (spec table) | Plant (edit) | Harness, scenario | Result: what the diff showed |
|---|---|---|---|
| No CSP violation and no request outside the allowed list (US1-1) | `<image href="planted.png">` appended to the drawing (`ocelle-icon.ts` `render`) | fixture (`elements-browser`), US1-1 | fails: `violations` `[{ directive: "img-src", blocked: ".../planted.png" }]`, `outside` and `failed` list `planted.png`, `console` holds Chromium's CSP error; the drawing also gains the `image` part |
| same | `style="display: block"` on the template's `svg` | fixture, US1-1 | fails: `violations` `[{ directive: "style-src-attr", blocked: "inline" }]`, one console CSP error; the drawing gains the `style` attribute |
| No node and no name for an unlabelled icon (US1-5) | internals named from the icon's `name` when unlabelled (`accessibleName(...) ?? this.name`) | in process (`elements`), US1-5 | fails: `plain` and `plainIn` each one `image "close"`, the button's name `"Dismiss close now"` instead of `"Dismiss now"` |
| same | the drawing without `aria-hidden="true"` | in process, US1-5 and US1-1 | fails: an unnamed `image` node appears; US1-1's drawing lacks the attribute |
| same | the host not hidden when unlabelled (`internals.ariaHidden = null`) | in process, US1-5 | fails: `plain` and `plainIn` each one `generic ""` node (the hazard R-13 answers) |
| Unknown names draw nothing and add nothing (US1-8) | a fallback glyph for an unknown name (`iconOf` returns `close`) | in process, US1-8 | fails: the unknown names draw the close `svg` and the labelled ones expose `image "Close"` |
| same, with a host `aria-label` | `drawable` ignored when the host has an `aria-label` | in process, US1-8 | fails: `aria-unknown` exposes `image "Close"` |
| `label` is not reflected (US1-16) | `label: { type: String, reflect: true }` | in process, US1-16 | fails: the `label` attribute reads `"Menu"` instead of absent |
| A blank host `aria-label` adds no node (US1-18) | the element stays hidden whenever the host has an `aria-label` | in process, US1-18 | fails: `aria-named` and `both` have no node instead of `image "Close"` |
| same | the element falls back to `label` when the host `aria-label` is blank | in process, US1-18 | fails: `blank-labelled` exposes an unnamed `image ""` (Chromium names it from the blank host attribute) |
| A labelled icon whose host has `aria-hidden="true"` contributes no node (US1-18) | the element removes the host's `aria-hidden` when labelled | in process, US1-18 | fails: `hidden-labelled` exposes `image "Close"`, and its `aria-hidden` attribute reads `null` |
| A labelled icon whose host has `hidden` has no box and no node (US1-19) | the `:host([hidden]) { display: none; }` rule removed | in process, US1-19 | fails: the hidden icon is `inline-block` 20 × 20 px and exposes `image "Close"` |

The fixture's control page (the first test of `test/browser/icon.test.ts`) shows, in every run, that the violation
collector records the one `style-src-attr` violation of an inline `style` attribute.

## The gate plants of T018 and T019

Run once each before `gate:plants`, through the plant runner's own builders (`buildRepoTree`, `buildMutationRepo`)
and the gate in normal mode with `--root`:

- `manifest`: `fail-stale-property` (2 stale findings, property and attribute `tone`), `fail-lost-attribute` (stale
  `ocelle-icon.attribute.label`), the six `fail-undescribed-*` (one `no-description` each, at
  `packages/elements/src/ocelle-plant.ts`), `pass-repository` and `pass-reordered` (exit 0), `break-not-json` and
  `break-missing` (exit 2 with their causes): each as its `plant.json` expects.
- `mutation`: `pass-element-source` exit 0 (1 mutant killed, 14 s); `fail-element-source-survivor` exit 1,
  `packages/elements/src/x.ts:3 StringLiteral Survived` (14 s); `fail-element-source-no-coverage` exit 1,
  `packages/elements/src/y.ts:2 StringLiteral Survived` (14 s; Stryker's browser-mode runner reports a never-loaded
  module's mutant `Survived`, not `NoCoverage`, see `notes.md`); `fail-mixed-survivors` exit 1 with both
  `gates/lib/x.ts:3` and `packages/elements/src/x.ts:3` (27 s). No shard came near 10 minutes.

## Gate runs

See the phase report for the runs of `gate:manifest`, `gate:style-lint`, `gate:csp`, `gate:prefix`, `gate:pins`,
`gate:plants` and `gate:mutation -- --base af90e30` (the phase base).
