# Notes of phase 1

Engine: Chromium 153.0.8010.12 (`OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`), in
process (`vitest --project elements`) and on the strict-CSP fixture (`elements-browser`). No WebKit run in this
environment.

## Red run (red commit d820f00, `red.sh 1 phase`, `red-phase.log`)

`unit-tests: 17 of 7806 tests failed`. Twelve are the op's rows, each on the missing behaviour, in process and on the
fixture:

- dialog and drawer, "a closed `<details>` last, no footer, from its summary", Tab × 5: expected
  `dlg[button] b1 s dlg[button] b1`, got `body dlg[button] b1 s body` (focus leaves the panel for the body).
- dialog and drawer, "the same, from the close control", Tab × 5: expected `b1 s dlg[button] b1 s`, got
  `b1 s body dlg[button] b1`.
- button scenario 6 (button and link mode): `image` node `Folder` present, name `Folder Open`.
- button scenario 7: `image` node `Folder` present (name already `Open project`).

The other five failures are `gates/test/integration/visual.test.ts` (visual gate and baseline command under docker).
They fail the same way without this op's change: no docker daemon runs in this environment. Not this op's.

Passing on main, as pins (in the red commit with the others):

- Shift+Tab rows of both closed-`details` cycles, in both overlays. spec.md scenario 2 was expected to fail on main; it
  does not. `#tab` wraps Shift+Tab from the first stop with `#tryFocus` over the reversed stops: focusing the hidden
  link does nothing, so the summary takes focus. Only the Tab direction escapes. No `overlay.ts` change is needed.
- The open-`details` cycle (scenario 4), the closed `details` before footer `f1` (scenario 5), and the `ocelle-icon`
  button (scenario 8).

## Icon fix: `aria-hidden="true"` on the wrapper is not enough in Chromium (blocker)

With T007 applied (`<span class="icon-slot" aria-hidden="true" ?hidden=${busy}>`), scenario 7 passes, and scenario 6's
`image` node is gone, but scenario 6 still fails on the name: the inner control (button and link mode) is named
`Folder Open`, and the subtree's button or link node is named `Folder Open`.

Probe (temporary `packages/elements/test/probe-022.test.ts`, never committed, deleted after the run): plain custom
elements with an open shadow root `<button id="c">…<slot></slot></button>`, the light-DOM content
`<svg slot="icon" viewBox="0 0 16 16"><title>Folder</title><path d="M2 2h12v12H2z"/></svg>Open`, read with
`axState(id, "#c")` and `axSubtree(id)`:

| Shadow markup around the icon slot | Inner control's name | `image` node |
|---|---|---|
| `<span><slot name="icon"></slot></span>` (main) | `Folder Open` | yes, `Folder` |
| `<span aria-hidden="true"><slot name="icon"></slot></span>` (Q1 A) | `Folder Open` | no |
| `<span><slot name="icon" aria-hidden="true"></slot></span>` | `Folder Open` | no |
| both of the above | `Folder Open` | no |
| `<span aria-hidden="true">` around the same svg written in the shadow root (not slotted) | `Open` | no |
| a native `<button><span aria-hidden="true"><svg>…</svg></span>Open</button>` in light DOM | `Open` | — |

So Chromium drops the slotted svg's node under an `aria-hidden` shadow ancestor but still adds its `<title>` to the
inner control's name from content. The operator's Q1 A fix does not meet spec.md scenario 6 (FR-003's intent) in
Chromium. Any fix that does (for example naming the inner control from its label wrapper inside the shadow root, or
computing an `aria-label`) changes more than FR-003 allows and is a design decision for the operator. T007's attribute
is applied in the working tree; the row is left red and unweakened.

## Action-row measurement (T004, op.md Acceptance 5, Q2 A)

Probe (temporary `packages/elements/test/probe-022.test.ts`, never committed, deleted after the run), on main's
`ocelle-action-row.ts`:

```html
<ocelle-action-row id="r"><svg slot="icon" viewBox="0 0 16 16"><title>Folder</title><path d="M2 2h12v12H2z"/></svg>Open project</ocelle-action-row>
<ocelle-action-row id="k" href="#x"><svg slot="icon" viewBox="0 0 16 16"><title>Folder</title><path d="M2 2h12v12H2z"/></svg>Open project</ocelle-action-row>
```

Command: `OCELLE_CHROMIUM_PATH=… npx vitest run --project elements packages/elements/test/probe-022.test.ts`, reading
`axState(id, '[part="control"]')` and `axSubtree(id)`. Raw output:

```text
{ "r": { "control": { "role": "button", "name": "Folder Open project" }, "subtree": [ { "role": "generic", "name": "" }, { "role": "generic", "name": "" }, { "role": "button", "name": "Folder Open project" }, { "role": "image", "name": "Folder" }, { "role": "StaticText", "name": "Open project" } ] },
  "k": { "control": { "role": "link", "name": "Folder Open project" }, "subtree": [ { "role": "generic", "name": "" }, { "role": "generic", "name": "" }, { "role": "link", "name": "Folder Open project" }, { "role": "image", "name": "Folder" }, { "role": "StaticText", "name": "Open project" } ] } }
```

The action row has the same gap as the button: an `image` node `Folder`, and the name `Folder Open project` in both
modes. By the table above, `aria-hidden="true"` on its icon wrapper would remove the node but not the name.
`ocelle-action-row.ts` is unchanged (FR-004).

## Run with T006 and T007 applied (working tree, not committed)

`pnpm test`: `unit-tests: 7 of 7806 tests failed`. These are button scenario 6, in process and on the fixture (name
`Folder Open`, see above), and the five docker-bound `gates/test/integration/visual.test.ts` rows from the red run.
Every other row passes, including all the dialog and drawer rows (the new `detailsRows` and the existing Tab cycle,
scroller, opaque-content and radio rows) and every other button and action-row row. `gate:typecheck`, `gate:lint`,
`gate:test-lint`: no finding.

## Mutation

Not run at this point: the phase stopped at the icon blocker before T011. See *Mutation (T013)* below.

## After the amendment (b921ab5): Chromium 156 re-measure (operator decision 6)

Engine: Playwright's pinned Chromium 156.0.8078.4 (`/opt/pw-browsers/chromium-1248`, installed by
`pnpm run setup:online`; `OCELLE_CHROMIUM_PATH` unset, so the elements projects launch Playwright's own, and
`chromium.launch().version()` reports `156.0.8078.4`). Working tree: T006 and only `aria-hidden="true"` on the icon
wrapper, no `aria-labelledby`.

Command: `npx vitest run --project elements --project elements-browser packages/elements/test/button.test.ts packages/elements/test/browser/button.test.ts`.
Result: `Tests 2 failed | 223 passed (225)`. Both failures are scenario 6 (in process and on the fixture), on the name
alone: button and link both named `Folder Open`, one node each named `Folder Open`, `images: []`, `axe: []`.
Scenario 7 (button mode) passes. So the 153 blocker holds on 156: `aria-hidden` alone does not meet scenario 6, and
the phase continued with the widened fix.

## Widened red, T007 (operator decision 5)

Test-only commit `f5b0bdf` (`test/scenarios/button.ts` only): scenario 7 in the link mode. Run in a clean worktree at
`f5b0bdf` (no source change on top), Chromium 156.0.8078.4, saved as `red-widen.log`: `Tests 6 failed | 221 passed
(227)`, exit 1. The new row fails in process and on the fixture on the missing behaviour: name already
`Open project`, role `link`, but `images` and `folder` hold `{ role: "image", name: "Folder" }`. The other four
failures are the rows of `d820f00` (scenario 6 and scenario 7 button mode, both suites). `red-commits` not changed;
`red.sh 1 phase` not rerun.

## T008 stop: the label-wrapper relation turns 14 existing button rows red (plan.md *Stop conditions*)

T008 as planned (working tree, not committed): `aria-hidden="true"` on the icon wrapper, and in `updated()` the inner
control's `ariaLabelledByElements` is the resolved host references, else `[.label]` when `#name()` is `undefined`,
else `null`.

Button suites (same command as above, Chromium 156): `Tests 14 failed | 213 passed (227)`. Scenarios 6, 7 (both
modes) and 8 pass. All 14 failures are existing rows, 7 per suite, and every one fails only on its axe field:
`["incomplete label-content-name-mismatch"]` (impact serious) where `[]` is expected:

- US1-6, US1-7 (button.ts): `<ocelle-button>S</ocelle-button>` (one-character label, default and compact).
- US1-12 × 4 (button.ts, default/compact × ltr/rtl): the sub-case "a one-character label" (`<span>P</span>`).
- US2-12 (link.ts): host rules on `:state(...)`.
- Edge case, href values (link.ts).

Reading: axe's `label-content-name-mismatch` applies only to a widget with `aria-label` or `aria-labelledby`; element
reflection makes the inner control match it, and for content that is not human-interpretable text (one character)
axe returns *incomplete*, impact serious, which `severe()` counts. The names themselves are unchanged in those rows.
The rows were not loosened.

Probe (temporary `packages/elements/test/probe-022b.test.ts`, in process, never committed, deleted after the run):
name of the inner control and every axe result, Chromium 156.

| Content of `<ocelle-button id="x">` | main | `aria-hidden` only | planned T008 | relation only when the icon slot has nodes |
|---|---|---|---|---|
| `<ocelle-icon slot="icon" name="close">` + `S` | `S`, axe `[]` | `S`, `[]` | `S`, incomplete label-content-name-mismatch (serious) | `S`, same incomplete |
| titled bare svg + `S` | `Folder S`, `[]` | `Folder S`, `[]` | `S`, same incomplete | `S`, same incomplete |
| titled bare svg only, no `label` | `Folder`, `[]` | `Folder`, violation button-name (critical) | `Folder`, violation button-name (critical) | `Folder`, same violation |
| `S` | `S`, `[]` | `S`, `[]` | `S`, same incomplete | `S`, `[]` |

Notes on the table:

- The variant in the last column (relation set only when the `icon` slot has assigned nodes, with a `slotchange`
  listener on that slot) was run against both button suites: `Tests 227 passed (227)`. It is not what FR-003 and
  plan.md *Icon name* specify, and it still gives the serious axe incomplete for an icon beside a one-character
  label (no existing row has that case), so it is only data for the operator. It is not in the working tree.
- With the planned relation, an icon-only button with no `label` still gets the name `Folder` in Chromium: an empty
  `aria-labelledby` target falls back to the control's content. spec.md § Edge Cases already leaves that name
  unguaranteed.

The working tree holds the planned T008 (not the variant). Nothing of T008 to T014 is committed. Decision for the
operator: how to meet FR-003 without the serious axe incomplete on one-character labels (for example, accept and
record it for one-character content, set the relation only when an icon is slotted, or another naming route).

## After decision 7 (3c304ff): the T008 stop measurement, kept for the record (T013)

- Chromium 156.0.8078.4, `aria-hidden="true"` on the icon wrapper alone: scenario 6 is named `Folder Open` in both
  modes (section *After the amendment (b921ab5)* above).
- The unconditional relation (`[.label]` whenever `#name()` is `undefined`): 14 existing button rows red, 7 per suite
  (US1-6/US1-7, US1-12 × 4, link.ts US2-12, the href-values edge case), each only on axe
  `incomplete label-content-name-mismatch` (serious) for one-character content (section *T008 stop* above).
- The relation only when the icon slot has assigned content (the probe): all 227 button rows green.
- An icon-only button with no `label` and nothing on the host: still named `Folder` from its content, axe
  `button-name` (critical), with every variant that hides the wrapper. spec.md § Edge Cases leaves that name
  unguaranteed; no row asserts it.

## Slot red, T008 (decisions 7 and 8)

Test-only commit `3f86a0c` (`test/scenarios/button.ts` only): scenarios 9 and 10, each one row holding the button and
the link mode. Run in a clean worktree at `3f86a0c` (`git worktree add --detach`, `pnpm install --offline`, no source
change on top), Chromium 156.0.8078.4, saved as `red-slot.log`: `Tests 8 failed | 223 passed (231)`, exit 1.

- Scenario 9 fails in process and on the fixture on the missing behaviour: after the svg moves from `slot="aside"`
  into the icon slot, button and link are named `Folder Open`, and `images` and `folder` hold
  `{ role: "image", name: "Folder" }` (and the control node `Folder Open`). No setup error.
- Scenario 10 passes on main, as the plan expects (pin: the relation goes when the icon goes).
- The other six failures are the earlier red rows (scenario 6, scenario 7 in both modes; both suites).

`red-commits` not changed; `red.sh 1 phase` not rerun.

## Green (T009 to T012, working tree)

`ocelle-button.ts`: `aria-hidden="true"` on the icon wrapper; `#readIcon` on the icon slot's `slotchange` stores
`assignedElements({ flatten: true }).length > 0` in `#iconed` and calls `requestUpdate()`; `#labelledBy` gives the
resolved host references, else `[.label]` when `#iconed` and `#name()` is `undefined`, else `null`.

Button suites (`npx vitest run --project elements --project elements-browser packages/elements/test/button.test.ts
packages/elements/test/browser/button.test.ts`, Chromium 156): `Tests 231 passed (231)`. Every existing row is
unchanged and green, including the one-character rows; scenarios 6, 7 (both modes), 9 and 10 pass.

## Docs pins (T011)

`packages/elements/test/node/readme.test.ts` pins two README sentences that plan.md asks to scope verbatim:
"The convention adds no generated content, so a control named by its visible label keeps exactly that name" and the
**Name order** item ending "and otherwise the element's content; slotted icons never contribute". A first wording
broke both pins (full `pnpm test`: 2 readme failures). The README now keeps each pinned string contiguous and scopes
it after it ("... keeps exactly that name when the control keeps a slotted icon out of it, as `ocelle-button` does";
"... slotted icons never contribute to `ocelle-button`'s name, where the content is its default slot's text"), so no
pin is changed and no promise is made for `ocelle-action-row`. readme and changelog pins: `Tests 689 passed (689)`.

## Mutation (T013)

`pnpm run gate:mutation -- --base dd69835` (Chromium 156).

First run: exit 1, 5 survivors on changed lines (42 mutants; 2 compile errors; `icon-slot.ts` zero mutants):

- `focusable.ts:58` `element.getClientRects().length > 0` replaced by `>= 0`, and by `true`. Equivalent since this
  op: CSSOM gives empty client rects only for an element with no associated box, and `checkVisibility()` returns false
  for every such element, so the first test only spares the style read. FR-001 keeps the condition, so it is recorded:
  the test is moved to its own line (`const boxed = ...`, still evaluated first) under a next-line record
  `EqualityOperator,ConditionalExpression`. The record also covers that line's `<= 0` and `false` mutants, which are
  not equivalent (they make no element rendered, so every Tab cycle row would fail); the record's reason says so. The
  whole-chain mutants (`false`, `true`, `||` before `checkVisibility()`) start on the `return` line and stay
  live; they are killed.
- `ocelle-button.ts:453` `{ flatten: true }` replaced by `{}`, and `true` by `false`. Not equivalent: an
  `ocelle-button` in another element's shadow root whose icon slot is fed only by that element's empty slot has an
  assigned element (the slot) but an empty flattened assignment. Killed by a new row: `forwardedIconScenarios`
  in `test/scenarios/button.ts` with the test-only `test-icon-forwarder` (`test/fixtures/shadow-controls.ts`), named
  `S` with axe `[]`. Under the mutant, axe gives `incomplete label-content-name-mismatch` (checked by hand). The row
  runs in process only: `button.html` on the strict-CSP fixture does not load `ocelle-test-controls.js`, and adding it
  would change the allowed requests of the other suites that visit that page.
- `ocelle-button.ts:541` `this.#name() === undefined` replaced by `true`. Row 7 does not kill it: with `label` set,
  the relation targets an empty label wrapper, and Chromium falls back to the `aria-label` (plan.md predicted row 7
  would kill it). Killed by a new row in `buttonScenarios`: the titled svg beside the text `Open` with
  `label="Open project"`, and with a host `aria-label="Open project"`, both modes, named `Open project`. Under the
  mutant all four are named `Open` (checked by hand).

Both new rows pass at the green tree. They pass on main's naming too (main has no relation), so they are pins, not red
rows. No existing row was changed.

Second run: exit 0, `43 mutants on the changed lines of 3 files, none survived; 0 timeouts, 2 compile errors, 1
zero-mutant entry; 1 equivalent record`. The two compile errors are `#labelledBy`'s body emptied (`{}`, a missing
return) and the `"aria-labelledby"` literal emptied (no such key in the reference type).

## Docker and the visual rows (T014)

The earlier full run failed the five `gates/test/integration/visual.test.ts` rows with exit 2: dockerd was not
running (no process, stale socket), although the hand-off said it was. Started per T014 (`nohup dockerd >
/tmp/dockerd.log 2>&1 &`), then `pnpm run setup:online` (exit 0). The first visual run pulled the pinned
`mcr.microsoft.com/playwright@sha256:ee15712262f0...` image. `npx vitest run gates/test/integration/visual.test.ts`:
`Tests 11 passed (11)`, so the 388 story-themes match their baselines. No baseline was made; no podman cross-check
is possible in this environment.

## Local checks under the operator's CI-first decision (given during T013/T014)

Run locally, each exit 0: `gate:typecheck`, `gate:lint`, `gate:style-lint`, `gate:test-lint`, `gate:manifest`
(`pnpm run manifest` in `packages/elements` leaves `custom-elements.json` unchanged), `gate:config-copies`,
`gate:csp`, `gate:prefix`, `gate:signoff -- --range dd69835..HEAD` (9 commits, no finding), `gate:mutation -- --base
dd69835` (above). The suites this phase changes, in process and on the strict-CSP fixture, Chromium 156: `npx vitest
run --project elements --project elements-browser` over `button`, `dialog` and `drawer` (both suites each):
`Test Files 6 passed (6)`, `Tests 1826 passed (1826)`.

Plants: `pnpm run gate:plants -- --affected dd69835` first gave exit 2 (`no container engine for 5 visual plants`):
those plants default to the engine `both`, docker and podman, and there is no podman here. Rerun as the gate's partial
job, `--skip-container`: exit 0, `16 of 317 plants judged, every plant as expected; ... partial run: 5 visual plants
not run` (`plants.md`). The skipped plants are `visual/fail-missing-baseline`, `fail-one-pixel`,
`fail-same-pixels-other-bytes`, `fail-token-changed` and `pass-repository`.

Not run locally, by the CI-first decision (CI's required checks decide them before merge):

- the full `pnpm test`. One earlier run on this working tree, before the README rewording and the two mutation pins,
  finished `7 of 7812 tests failed`: the five docker-bound visual rows (dockerd was down then) and the two readme
  pins fixed above. A second full run was stopped when the decision arrived.
- the five visual plants above (they need docker and podman; no podman cross-check is possible here), and the full
  visual gate. The visual integration file passed once under docker alone (`Tests 11 passed (11)`, above).
- no WebKit run in this environment.
