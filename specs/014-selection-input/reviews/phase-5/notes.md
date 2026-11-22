# Phase 5 notes

## The T075 spike

`spike.md` records it, before the red commit. Neither stop condition of T075 holds:
- `Accessibility.nodesUpdated` delivers the emptied region before the refill under the designed timing (an animation
  frame, then a task), and only the refill under synchronous, microtask and own-frame dispatch. The tree-history read
  therefore runs in every run of US4-6, in both harnesses, beside the frame-order record (plan decision 7).
- The clipboard controls hold with no permission granted: a write with no click rejects and a write in a click's
  handler resolves. A write from the deferred request then resolves in Chromium, with `isActive` true at the dispatch.

The WebKit half of the user-activation question stays open with the console and kitty-mission-ui owners (R-07, plan
decision 1). No implementation choice of this phase depends on it: the deferred dispatch is the operator's decision
(PLAN-FRESH-2-004 (a)), and the README carries the user-activation note for hosts that copy from the page.

The spike found one detail of the recorder. `nodesUpdated` reports only nodes returned by `getChildAXNodes`, not the
root of `getPartialAXTree`. The driver's `axUpdates` already fetches the target's descendants with `getChildAXNodes`,
so US4-6 starts it on the field host, and the live region is a reported node.

## The design as built

- The shadow root holds the bordered `.field` (the text, `part="value"`, then the native `<button
  part="copy-control">` with `ocelle-icon name="copy"` in an `icon-row`) and, after it, the live region
  (`role="status"`, `aria-live="polite"`). The region is a block under the field, its text at the inline end, so the
  status sits under the Copy control. With no text it has no height, and its margin applies only while it holds text
  (`:not(:empty)`, which Chromium re-evaluates on a change of the text node's data). It is never `display: none`, so
  the region stays in the tree from first render.
- The group role is set in the constructor through a helper, `exposeAsGroup`. Written inline as
  `this.#internals.role = "group"`, the manifest analyser listed a public member `role`.
- `value` and `status` are accessors with `noAccessor` entries. A removed attribute reads `""` through
  `attributeChangedCallback`, and `copy-label` goes through Lit. The label is trimmed by a helper that also takes the
  `null` of a removed `copy-label` attribute.
- The text has no `user-select` rule. The initial `auto` already keeps it selectable, and the unprefixed property is
  not in WebKit's floor. US4-12 reads the computed `auto`.
- The control's inner corners are rounded by `radius-2` minus the border width, so its fill and the well's stay inside
  the field's rounded border without `overflow: hidden`, which would clip the Copy control's focus ring.
- No new token and no new colour pairing: every pair of R-15's copy-field row is checked in `pairs.json` already
  (`ink`, `accent-strong` and `color-focus` on `inset`, `control-border` on the main grounds). `color-focus` on `inset`
  is in the pairs check because the outline's inline-start side lies over the well.

## How the tests drive the Copy control

The driver clicks a target it can address by id, and the Copy control is in the field's shadow root. The bodies
therefore lay a 2 × 2 px probe with `pointer-events: none` over the control's centre and click the probe with `force`.
The real mouse event lands on the control beneath. When the field did not render the control, the probe lies at the
viewport's top end corner, so the click lands on nothing of the field and the body's assertions report the miss (the
red run).

The contract's US4-12 setup names "a pointer drag across the text". The driver has no drag command, so the body
selects with a real triple click on the text. That is pointer selection too. The selection is read trimmed, because a
triple click takes the line ends with it.

## Tests changed after the red commit

The green commit `55adcf3` changed no test: the red commit's bodies, expected values and pairings passed unchanged on
the green source. Two test-only commits came after it. Each made a body stricter or added one, and none removed or
loosened an assertion.

- `15a9d66`, stricter bodies from the plant run. Five named plants did not bite on their first run, because the
  bodies were weaker than their guards (`plants.md`, "Plants corrected after their first run"):
  - US4-2's 300-character command had hyphens, where a line may break without `overflow-wrap`. It is now letters and
    digits only.
  - FR-032's value now has leading and trailing whitespace runs too.
  - FR-035 now also double-clicks the Copy control (two activations within one frame) and expects two requests.
  - FR-035's removed field: a listener on the field itself records the requests too. A detached element's event never
    reaches the `document`, so the document listener alone could not see a dispatch.
  - The Edge Cases body with `value` and `status` in the markup now also writes `status` first.
  Every changed body passes on the green source in both harnesses, and each corrected plant bites.
- `eebbb4f`, two bodies from the mutation run (below): the properties' defaults, and the removal of the `status`
  attribute.

## The red run

`red-phase.log`: 106 of 3913 tests fail, every one with an `AssertionError`. The failing files are the phase's new and
changed tests: the in-process and fixture copy-field suites, the entry tests, the root exports, the build test, the
manifest and README tests, the selection pairs check, the story test, and the gate test counts.

Before the red commit, the in-process run on the scaffold showed 16 failures that were thrown errors: a missing part
or probe, raised by the driver. The bodies now observe a missing render, through `partStyle`, the probe fallback and a
`null` overflow read, so every red failure is an assertion on the missing behaviour. This changed no expected value.

## Visual baselines under docker (T083)

By the operator's decision of 2026-11-14 (`reviews/phase-2/operator-decisions.md`), the baselines were produced in
#10's pinned container under docker with `pnpm run visual:update`. It wrote 10 files: the five copy-field stories,
light and dark. No shared baseline changed or was removed, the token stories included.

No podman cross-engine check was possible in this session, because there is no podman. CI's `visual` gate, which runs
both engines, confirms the baselines at landing.

The counts that the gate tests pin moved:
- story-themes and baselines from 90 to 100: `visual.test.ts`, `plant-repo.test.ts`, `axe.test.ts` (102 with the plant
  story);
- stories from 45 to 50: `storybook-build.test.ts`.

Four light copy-field stories joined the findings of the `visual/fail-token-changed` plant and its note (48 findings):
short, wrapped long command, with a status, focused Copy control. In each, the command's text is `color-ink`. The
empty story shows no text, and its disabled icon is `color-disabled-ink`, so it is not listed. The plant run confirms
this list (`plants.md`).

The baselines were inspected:
- the short story's control sits flush at the field's end, with one `accent-strong` line before it;
- the wrapped story's command wraps onto six lines inside the 320 px field, the control as tall as the text;
- the status story shows "Copied to clipboard" under the field, at its inline end;
- the empty story's control is drawn in `disabled-ink`;
- the focused story's ring is drawn on all four sides of the control.

## The mutation gate (T084)

The first run of `pnpm run gate:mutation -- --base 75965e1` (on `15a9d66`) reported 10 findings in
`src/ocelle-copy-field.ts`. The commits after it handle them; there was no behaviour defect among them.

- **Killed by new bodies** (`eebbb4f`, both harnesses). Each mutant was applied by hand and fails the new body, and both
  bodies pass on the source:
  - the `#status` initialiser and the constructor's `copyLabel` default, read by the properties' defaults body;
  - `attributeChangedCallback`'s `status` branch (its condition and its `""` fallback, and the NoCoverage mutant on the
    fallback), read by the removal of the `status` attribute.
- **Removed by simplifying the source** (`47ce03a`, `refactor(...)`): the `value` setter requests an update with no
  property name. The template reads the private value and no update hook reads the changed properties, so the name was
  an equivalent `StringLiteral` mutant.
- **Equivalent records** (2), each a `Stryker disable next-line ObjectLiteral,BooleanLiteral` comment naming only those
  mutants, on the `value` and `status` entries of `static properties`. With `{}` or `noAccessor: false`, Lit wraps the
  class's own accessor, which only adds an update request that renders the same template. All four mutants were applied
  by hand, and every copy-field body passed (29 of 29).

The second run (on `47ce03a`), `mutation.log`, exits 0:
- 83 mutants on the changed lines of 2 files, none survived;
- 0 timeouts;
- 12 compile errors: type-checker rejections, such as `{}` for a method body that must return a value, or the
  `typeof` guard of the label helper made `true`, after which `.trim()` is called on `unknown`;
- 1 zero-mutant entry (`src/index.ts`, an export line);
- 2 equivalent records, above.

## Plants (T084)

`plants.md` records 64 plants, each applied alone to `47ce03a`, run once and reverted.
- 63 made a test fail on their run; with the review round 1 body, all 64 do.
- One did not: *the region in the Lit template*, which contracts § Pairings names for US4-5. The first record said it
  was no defect of the region's outcomes. Review round 1 (R1-01) refuted that: a clear and a same-text set in one task
  are batched by Lit, and the region is never emptied. The round-1 body *FR-041, FR-042: a clear and a set of the same
  status in one task …* now fails under the plant (`plants.md`).
- Six plants did not bite on their first run. Five bodies were made stricter (above), and one plant form was not a
  defect: a `transparent` divider is repainted by forced colours. That plant now sets the divider's width to 0.

## The gate run (T084)

The gates were run one at a time on the code of `47ce03a`, with
`OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` and `OCELLE_VISUAL_ENGINE=docker`. The
commit after it adds only these records.

| Gate | Result |
|---|---|
| typecheck, lint (311 files), test-lint (210 files), style-lint (23 files), brand-rules (7 rules), pins (5 manifests), config-copies, prefix (285 files) | exit 0, no finding |
| contrast | exit 0: 166 pairs in light, 174 in dark, 155 required per theme. The copy field adds no pair: every pair of its R-15 row is already checked |
| manifest | exit 0: 10 elements |
| signoff `--range 75965e1..HEAD` | exit 0, no finding |
| unit-tests | exit 0: 3917 tests in 163 files |
| csp | exit 0: 28 files |
| storybook-build | exit 0: 50 stories |
| visual | exit 0: 100 captures match their baselines (docker only, no cross-engine comparison; no podman in this session) |
| axe | exit 0: 100 story-theme runs, 0 serious or critical; 22 notes, all excepted (the Prose document's ten and the scrolling listbox story's twelve); no new exception |
| `mutation -- --base 75965e1` | exit 0: 83 mutants on the changed lines of 2 files, none survived; 0 timeouts, 12 compile errors, 1 zero-mutant entry, 2 equivalent records (`mutation.log`) |
| plants | exit 0: 301 plants of 17 gates and the registry, every plant as expected; this includes `visual/fail-token-changed` with the four copy-field findings and `storybook-build/fail-empty-index` with the copy-field stories' empty copy |
