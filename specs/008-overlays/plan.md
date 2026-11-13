# Implementation Plan: Overlays — Dialog, Drawer and Tooltip

**Branch**: `008-overlays` (work on `claude/016-overlays`) | **Date**: 2026-11-12 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/008-overlays/spec.md` (approved at the spec gate after spec check 2,
2026-11-12, human:MOES-Media).

## Summary

Three new elements in `@ocelle/elements`, following mission 005's conventions:

- `ocelle-dialog` and `ocelle-drawer`. They share an internal base (`src/overlay.ts`) around a native `<dialog>`
  shown with `showModal()`, with the user-agent chrome reset to tokens.
  - Focus: explicit initial focus, a Tab cycle (the overflowing body is a stop), return to the deepest opener only
    while focus is still the overlay's (R-04, R-05).
  - Escape is handled on `keydown` by the topmost overlay only, so a host's veto survives the platform's
    repeated-Escape rule (measured, R-02); Escapes already handled by slotted content are left alone.
  - Events: a cancelable `…-close-request` and a `…-close` that fires once the overlay has left the top layer.
  - Motion through the Web Animations API, from the motion tokens, skipped under reduced motion.
  - Removal from the document closes the overlay with no event and sets `open` to false (operator decision, R-05a).
  - The drawer adds `side`, `ground` and `heading-hidden` and closes on a backdrop click.
- `ocelle-tooltip`, which wraps its trigger with a layout-transparent host (`display: contents`, operator decision).
  - Its bubble is a `popover="manual"` element in its own shadow root, shown in the top layer, hidden by default in
    every engine (R-10).
  - It is placed by script through a per-instance adopted stylesheet, with physical coordinates and no `style`
    attribute. It flips and is clamped to the viewport, follows its trigger frame by frame, and is hoverable across a
    padded gap.
  - It shows after `--ocelle-tooltip-delay` on hover and at once on `:focus-visible` focus, and Escape dismisses it.
    An overlay opening hides it.
  - By default it is hidden from assistive technology. With `describes` it adds a same-tree description and keeps its
    id in the trigger's `aria-describedby` across host re-renders (operator decision).
- The engine floor rises to **Chromium 120 / WebKit 17** (operator decision).
- Three tokens are added: `drawer-inline`, `tooltip-delay`, `tooltip-max-inline`.
- The stories, baselines and axe work are written against #10's design (unmerged) and **must be rechecked when #10
  lands** (R-16). Implementation waits for #10 (operator).

Every decision is in [research.md](research.md). The surface is in
[contracts/elements-overlays.md](contracts/elements-overlays.md) and the checks and test matrix are in
[contracts/checks.md](contracts/checks.md).

## Technical Context

**Language/Version**: TypeScript 6.0.3 (strict), `target` es2024; Node 26.13.0 in CI.

**Primary Dependencies**: `lit` 3.3.3 (exact, from 005). No new dependency.

**Storage**: N/A.

**Testing**: the shared scenario bodies (`test/scenarios/`) run in two harnesses, as in 005:
- `elements`: Vitest browser mode in process, mutated.
- `elements-browser`: the built browser build on strict-CSP fixture pages.
The driver gains real keyboard, pointer-path and touch input, focus paths and `:focus-visible` reads, reduced-motion
emulation, event recording with the state at dispatch, animation reads, top-layer state and FR-047's style counts as a
delta with transient writes (R-14). Each addition has a self-test in both harnesses. `axTree` also returns
description, modal and level. The in-process harness runs at 1280 × 800 with touch, like the fixture. Timing is tested
with bounded waits only, from both sides (R-15).

**Target Platform**: Chromium measured. WebKit (Kitty Desktop) unmeasured. Engine floor Chromium 120 / WebKit 17 for
the Popover API (R-10).

**Project Type**: library (web components) in a pnpm workspace.

**Performance Goals**: while a bubble is shown, one trigger-rect read per animation frame and at most one placement per
frame (only one bubble is shown at a time); the loop stops on hide. One adopted shared sheet
per element class plus one placement sheet per shown tooltip.

**Constraints**: strict CSP with no exception. No `style` attribute or `<style>` element at run time (FR-047).
Token-only CSS with no new `token-only` allowance. No I/O. No ID reference across shadow roots.

**Scale/Scope**: 3 elements, 1 internal base, 1 internal focus module, 3 tokens, about 20 stories × 2 themes.

## Constitution Check

*Gate: passes before Phase 0; re-checked after Phase 1 design — passes with no exception.*

| Principle | How this plan meets it |
|---|---|
| I. Names, events, no I/O, manifest | Tags `ocelle-dialog`, `ocelle-drawer`, `ocelle-tooltip`. Events `ocelle-dialog-close-request`, `ocelle-dialog-close` and the drawer pair, all `bubbles` and `composed`, with typed `detail`. The tooltip has no events. No I/O and no console output. Every property, attribute, event, slot, part and own CSS custom property is in the generated manifest, inherited members included, through JSDoc on each concrete class (R-01). The tooltip's unrendered slot is `description`, a plain name (R-13). The describes span is written with `textContent` (R-13). |
| II. Tokens only | Static CSS only from tokens through `var()`/`calc()`, with no new lint allowance. Runtime numbers (bubble coordinates, WAAPI keyframes of `%` and opacity) are not element CSS literals (R-06, R-11). The bubble uses existing chrome colour pairs, so contrast is already checked. Only the dialog surfaces use `elevation-raised` (#5). The radius is `radius-2`. No monospace. |
| III. Accessible | Modal `<dialog>` named in one shadow root (R-08). Full keyboard model: Tab cycle, Escape, Enter and Space on the close control. The close control meets `target-min` with the focus ring. WCAG 1.4.13 holds: the bubble is dismissable, hoverable and persistent (R-11, R-12). No ID reference crosses a shadow root (R-13). Reduced motion gives no animation, by the media query as well as the tokens (R-06). Forced colours: a `CanvasText` panel border, `Canvas` backdrop and an outline focus ring (R-09). The overflowing body is a Tab stop and keeps a minimum block size at 320 × 256 (R-04, R-18). Nested overlays act only when topmost (R-02). Host `aria-label` asserted open and closed and under axe (R-08). axe runs on every story (R-16). |
| IV. Strict CSP | Adopted stylesheets only. The placement sheet is constructable (R-11). WAAPI sets no attribute (R-06). Timers take functions. Every scenario also runs on the strict-CSP fixture, and FR-047's counts run after each one. |
| V. Storybook and behaviour | A story per variant and state in both themes (data-model § Stories), written against #10 (R-16). Interaction tests cover every event, payload, keyboard path and focus outcome (checks § Test matrix). |
| VI. Consumers | #16's consumers: the Open project dialog, #12's personal drawer, kitty-mission-ui flyouts, #12's nav-item bubble and #7's pill-tag ellipsis (contract § consumers). Own code. |
| VII. Semver | MINOR: three elements, three entry points, three tokens. The engine floor change is recorded in the README and in the CHANGELOGs of `@ocelle/elements` and `@ocelle/tokens`. |
| VIII. Test-first | Each phase starts red. Mutation runs on the changed source. Timing tests kill by assertion, not by timeout (R-15). The driver additions are test code, not source (005 decision 16). The engine-floor README change is red-tested through `test/node/readme.test.ts`, not exempt. The driver additions get self-tests that fail first (R-14). No test can pass vacuously: SC-002 is an exact focus sequence, the close order is read at dispatch, motion is read from the animations, and the tooltip's reduced-motion row tests the delay (checks § Test matrix). Documentation-only items take the exemption with the reason stated. |
| Workflow | No new gate. The #10 gates are used once #10 lands. |

## Decisions the operator should see at the plan gate

1. **Engine floor WebKit 17** (operator decision at specify). Risk: Linux WebKitGTK versions are unverified (R-10).
   Phase 4's review records Kitty Desktop's WebKitGTK version.
2. **Token values** (R-09): `drawer-inline` = `shell-sidebar-width` (20rem), `tooltip-delay` = 500 ms,
   `tooltip-max-inline` = 18rem, and the dialog's default inline size `measure-reading`. The last three are library
   choices.
3. **Close order** (R-06): `open` false → exit animation → left the top layer → focus returned → `…-close`.
4. **Platform closes** (R-02, R-03): inner `close()` and a non-cancelable `cancel` close with reason `host`. A slotted
   `method="dialog"` form does nothing to the overlay (measured); the README tells hosts to set `open = false` from
   their submit handler. A slotted widget that stops Escape's propagation can let the platform close a vetoed overlay
   on a repeated Escape, with reason `host` (stated limit).
5. **Tooltip semantics** (R-13): the painted bubble is always `aria-hidden`. `describes` adds a hidden light-DOM
   `role="tooltip"` node to the host and an `aria-describedby` id to a native trigger. This is not supported for
   custom-element triggers whose inner control takes focus. The spec now says so (FR-029, FR-036, US3-7).
6. **Late `:focus-visible`** (R-12): only focus that arrives while matching shows the bubble.
7. **Story delay override** (R-16): tooltip stories set `--ocelle-tooltip-delay: 0ms` through a stories-layout class,
   because #10 captures within two frames of the pointer move.
8. **Heading level 2**, fixed (R-08).

Settled in the squad's round 1 (9 to 13 by the operator at the forks, 14 a confirmed fix):

9. **Host `aria-label` on overlays kept** (R-08): asserted in the tree open and closed, a story under axe, and any
   limit recorded in the README § Host ARIA.
10. **Text-field triggers** (R-12): a stated limit. Tooltip triggers are buttons and links; around a text field the
    bubble shows on any focus.
11. **Tooltip host `display: contents`** (R-11): layout-transparent; everything is measured on the trigger.
12. **Disconnection while open** (R-05a): the overlay closes silently and `open` becomes false, with no event; the
    host reopens it after a move.
13. **`aria-describedby` kept** (R-13): with `describes`, a `MutationObserver` re-adds the tooltip's id when a host
    re-render drops it, and the id follows a replaced trigger.
14. **Focus return only while focus is the overlay's** (R-05): a host or follow-up dialog that moved focus keeps it.

## Risks

- **#10 not merged**: the story, baseline and axe tasks are written against its branch. The tasks' first step for those
  phases is R-16's recheck.
- **WebKit unmeasured**: the Popover API stacking over a modal, WAAPI on a top-layer dialog, and the `cancel` /
  `keydown` order. Only Chromium is measured, as for every element.
- **Linux webview below WebKit 17**: no bubble shows. The static sheet hides the bubble by default and shows it only
  through `:popover-open`, and the element does nothing when `showPopover` is absent, so nothing is painted inline and
  nothing throws (R-10). Names are unaffected.
- **Manifest inheritance** (R-01): measured in phase 2's first task. Events, slots, parts and the CSS property come
  from JSDoc on each concrete class regardless. If inherited properties are missing, the fallback changes
  `scripts/manifest.ts`'s module filter and replaces the pinned `test/node/manifest.test.ts` rule with a stricter one,
  red first.
- **Slotted widgets that stop Escape** (R-02): a vetoed overlay can then close on a repeated Escape with reason
  `host`. Stated in the README; #14's listbox should call `preventDefault()` instead.
- **Parallel siblings** (R-17): merge conflicts in shared files are resolved by merging `main`, then regenerating the
  manifest.

## Project Structure

### Documentation (this feature)

```text
specs/008-overlays/
├── plan.md, research.md, data-model.md, quickstart.md
├── contracts/elements-overlays.md, contracts/checks.md
├── probes/probe.cjs, probes/probe2.cjs   # the Chromium measurements of research R-02, R-10, R-13
├── checklists/requirements.md
├── reviews/spec/…                          # spec checks
└── tasks.md                                # /speckit-tasks
```

### Source Code (repository root)

```text
packages/tokens/
├── src/source.ts                  # + drawer-inline, tooltip-delay, tooltip-max-inline
├── test/expected.ts               # + the three rows
├── README.md, CHANGELOG.md
packages/elements/
├── src/overlay.ts                 # internal base (R-01)
├── src/focusable.ts               # internal tabbable walk (R-04)
├── src/ocelle-dialog.ts, src/ocelle-drawer.ts, src/ocelle-tooltip.ts
├── src/index.ts                   # + three exports (shared with siblings, R-17)
├── package.json                   # + three entry points
├── custom-elements.json           # regenerated
├── README.md                      # three element sections, § Engines (WebKit 17), tokens read
├── CHANGELOG.md
├── scripts/manifest.ts            # only if R-01's measurement needs the base analysed (then red test first)
├── test/scenarios/driver.ts       # + input, pointer path, touch, focus, motion, events with state, animations,
│                                  #   top layer, viewport, style counts (R-14)
├── test/scenarios/{dialog,drawer,tooltip}.ts
├── test/scenarios/harness.ts      # self-test bodies for the new driver methods (R-14)
├── test/in-process.ts             # in-process driver implementation of the additions
├── test/{dialog,drawer,tooltip,harness}.test.ts   # in process
├── test/tooltip-no-popover.test.ts                # in process, Popover API removed (R-10)
├── test/browser/driver.ts         # fixture driver implementation of the additions
├── test/browser/serve.ts          # hasTouch context
├── test/browser/{dialog,drawer,tooltip,harness}.test.ts   # strict-CSP fixture
├── test/browser/fixtures/{overlays,tooltip}.html
├── test/commands.ts               # + emulateReducedMotion, pointerPath, touchTap; axTree with description, modal, level
├── test/commands.test.ts          # + the new commands
├── test/entry-{dialog,drawer,tooltip}.test.ts     # each entry defines its tag (+ ocelle-icon for the overlays)
├── test/exports.test.ts           # export keys
├── test/node/manifest.test.ts     # + per-entry events, slots, parts, CSS property (R-01)
├── test/node/readme.test.ts       # + Engines floor WebKit 17, intro line, three element sections, tokens read
├── test/build/build.test.ts, test/build/pack.test.ts   # + the three dist files
storybook/
├── stories/{dialog,drawer,tooltip}.stories.ts     # after #10 (R-16)
├── .storybook/stories-layout.css  # tooltip delay override class
└── baselines/…                    # after #10
vitest.config.ts                   # elements project: viewport 1280 × 800, touch; new commands (R-14)
```

**Structure Decision**: the existing workspace layout. All element code is in `packages/elements/src`, the tokens are in
`packages/tokens/src/source.ts`, and the stories are in `storybook/stories`.

## Phases (for /speckit-tasks)

1. **Setup**: driver and command additions in both harnesses, the `vitest.config.ts` viewport and touch, the
   `serve.ts` touch context, the fixture pages and the test delay stylesheet (300 ms). These are test code; each new
   probe and command gets a self-test that is red against the driver as it was (R-14), and those runs are the red
   evidence for this phase.
2. **US1 dialog (P1)**: `overlay.ts`, `focusable.ts`, `ocelle-dialog.ts`, the entry point with
   `entry-dialog.test.ts`, the build and pack file lists, the manifest (R-01's measurement first, JSDoc tags, the
   manifest test), the README section with its `readme.test.ts` fragments, the README intro line, and the CHANGELOG.
   Its stories come after the #10 recheck.
3. **US2 drawer (P2)**: `ocelle-drawer.ts`, the `drawer-inline` token, its entry point and entry test, its manifest
   entry, README section with its fragments, and stories.
4. **US3 tooltip (P3)**: `ocelle-tooltip.ts`, the `tooltip-delay` and `tooltip-max-inline` tokens, its entry point and
   entry test, README § Engines to WebKit 17 with the `readme.test.ts` floor line changed red first, stories, and the
   record of Kitty Desktop's webview version.
5. **Polish**: the R-16 recheck closed out, the quickstart walk-through, the CHANGELOGs.

## Complexity Tracking

No constitution violation; no row.
