# Implementation Plan: Overlays — Dialog, Drawer and Tooltip

**Branch**: `008-overlays` (work on `claude/016-overlays`) | **Date**: 2026-11-12 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/008-overlays/spec.md` (approved at the spec gate after spec check 2,
2026-11-12, human:MOES-Media).

## Summary

Three new elements in `@ocelle/elements`, following mission 005's conventions:

- `ocelle-dialog` and `ocelle-drawer`. They share an internal base (`src/overlay.ts`) around a native `<dialog>`
  shown with `showModal()`, with the user-agent chrome reset to tokens.
  - Focus: explicit initial focus, a Tab cycle, return to the deepest opener.
  - Escape is handled on `keydown`, so a host's veto survives the platform's repeated-Escape rule (measured, R-02).
  - Events: a cancelable `…-close-request` and a `…-close` that fires once the overlay has left the top layer.
  - Motion through the Web Animations API, from the motion tokens.
  - The drawer adds `side`, `ground` and `heading-hidden` and closes on a backdrop click.
- `ocelle-tooltip`, which wraps its trigger.
  - Its bubble is a `popover="manual"` element in its own shadow root, shown in the top layer.
  - It is placed by script through a per-instance adopted stylesheet, with no `style` attribute. It flips and is
    clamped to the viewport, and is hoverable across a padded gap.
  - It shows after `--ocelle-tooltip-delay` on hover and at once on `:focus-visible` focus, and Escape dismisses it.
  - By default it is hidden from assistive technology. With `describes` it adds a same-tree description.
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
The driver gains real keyboard and pointer input, focus paths, reduced-motion emulation, event recording, top-layer
state and FR-047's style counts (R-14). `axTree` also returns description, modal and level. Timing is tested with
bounded waits only (R-15).

**Target Platform**: Chromium measured. WebKit (Kitty Desktop) unmeasured. Engine floor Chromium 120 / WebKit 17 for
the Popover API (R-10).

**Project Type**: library (web components) in a pnpm workspace.

**Performance Goals**: the bubble is re-placed at most once per animation frame while shown. One adopted shared sheet
per element class plus one placement sheet per shown tooltip.

**Constraints**: strict CSP with no exception. No `style` attribute or `<style>` element at run time (FR-047).
Token-only CSS with no new `token-only` allowance. No I/O. No ID reference across shadow roots.

**Scale/Scope**: 3 elements, 1 internal base, 1 internal focus module, 3 tokens, about 20 stories × 2 themes.

## Constitution Check

*Gate: passes before Phase 0; re-checked after Phase 1 design — passes with no exception.*

| Principle | How this plan meets it |
|---|---|
| I. Names, events, no I/O, manifest | Tags `ocelle-dialog`, `ocelle-drawer`, `ocelle-tooltip`. Events `ocelle-dialog-close-request`, `ocelle-dialog-close` and the drawer pair, all `bubbles` and `composed`, with typed `detail`. The tooltip has no events. No I/O and no console output. Every property, attribute, event, slot, part and own CSS custom property is in the generated manifest, inherited members included (R-01). |
| II. Tokens only | Static CSS only from tokens through `var()`/`calc()`, with no new lint allowance. Runtime numbers (bubble coordinates, WAAPI keyframes of `%` and opacity) are not element CSS literals (R-06, R-11). The bubble uses existing chrome colour pairs, so contrast is already checked. Only the dialog surfaces use `elevation-raised` (#5). The radius is `radius-2`. No monospace. |
| III. Accessible | Modal `<dialog>` named in one shadow root (R-08). Full keyboard model: Tab cycle, Escape, Enter and Space on the close control. The close control meets `target-min` with the focus ring. WCAG 1.4.13 holds: the bubble is dismissable, hoverable and persistent (R-11, R-12). No ID reference crosses a shadow root (R-13). Reduced motion gives 0 ms from the tokens (R-06). Forced colours: system colours and visible boundaries. axe runs on every story (R-16). |
| IV. Strict CSP | Adopted stylesheets only. The placement sheet is constructable (R-11). WAAPI sets no attribute (R-06). Timers take functions. Every scenario also runs on the strict-CSP fixture, and FR-047's counts run after each one. |
| V. Storybook and behaviour | A story per variant and state in both themes (data-model § Stories), written against #10 (R-16). Interaction tests cover every event, payload, keyboard path and focus outcome (checks § Test matrix). |
| VI. Consumers | #16's consumers: the Open project dialog, #12's personal drawer, kitty-mission-ui flyouts, #12's nav-item bubble and #7's pill-tag ellipsis (contract § consumers). Own code. |
| VII. Semver | MINOR: three elements, three entry points, three tokens. The engine floor change is recorded in the README and in the CHANGELOGs of `@ocelle/elements` and `@ocelle/tokens`. |
| VIII. Test-first | Each phase starts red. Mutation runs on the changed source. Timing tests kill by assertion, not by timeout (R-15). The driver additions are test code, not source (005 decision 16). Documentation-only items take the exemption with the reason stated. |
| Workflow | No new gate. The #10 gates are used once #10 lands. |

## Decisions the operator should see at the plan gate

1. **Engine floor WebKit 17** (operator decision at specify). Risk: Linux WebKitGTK versions are unverified (R-10).
   Phase 4's review records Kitty Desktop's WebKitGTK version.
2. **Token values** (R-09): `drawer-inline` = `shell-sidebar-width` (20rem), `tooltip-delay` = 500 ms,
   `tooltip-max-inline` = 18rem, and the dialog's default inline size `measure-reading`. The last three are library
   choices.
3. **Close order** (R-06): `open` false → exit animation → left the top layer → focus returned → `…-close`.
4. **Platform closes** (R-03): a `method="dialog"` form submit closes with reason `host`. It is not prevented.
5. **Tooltip semantics** (R-13): the painted bubble is always `aria-hidden`. `describes` adds a hidden light-DOM
   `role="tooltip"` node to the host and an `aria-describedby` id to a native trigger. This is not supported for
   custom-element triggers whose inner control takes focus. This moves FR-036's "the bubble has role tooltip" to the
   description node.
6. **Late `:focus-visible`** (R-12): only focus that arrives while matching shows the bubble.
7. **Story delay override** (R-16): tooltip stories set `--ocelle-tooltip-delay: 0ms` through a stories-layout class,
   because #10 captures within two frames of the pointer move.
8. **Heading level 2**, fixed (R-08).

## Risks

- **#10 not merged**: the story, baseline and axe tasks are written against its branch. The tasks' first step for those
  phases is R-16's recheck.
- **WebKit unmeasured**: the Popover API stacking over a modal, WAAPI on a top-layer dialog, and the `cancel` /
  `keydown` order. Only Chromium is measured, as for every element.
- **Linux webview below WebKit 17**: no bubble shows. Names are unaffected.
- **Manifest inheritance** (R-01): measured in phase 2's first task. The fallback is to extend the analyzer glob.
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
├── test/scenarios/driver.ts       # + input, focus, motion, events, top layer, style counts (R-14)
├── test/scenarios/{dialog,drawer,tooltip}.ts
├── test/{dialog,drawer,tooltip}.test.ts           # in process
├── test/browser/{dialog,drawer,tooltip}.test.ts   # strict-CSP fixture
├── test/browser/fixtures/{overlays,tooltip}.html
├── test/commands.ts               # + emulateReducedMotion; axTree with description, modal, level
├── test/exports.test.ts           # export keys
storybook/
├── stories/{dialog,drawer,tooltip}.stories.ts     # after #10 (R-16)
├── .storybook/stories-layout.css  # tooltip delay override class
└── baselines/…                    # after #10
```

**Structure Decision**: the existing workspace layout. All element code is in `packages/elements/src`, the tokens are in
`packages/tokens/src/source.ts`, and the stories are in `storybook/stories`.

## Phases (for /speckit-tasks)

1. **Setup**: driver and command additions, the fixture pages and the test delay stylesheet. These are test code.
   The red evidence comes from the first story phase.
2. **US1 dialog (P1)**: `overlay.ts`, `focusable.ts`, `ocelle-dialog.ts`, the entry point, the manifest, the README
   section and the CHANGELOG. Its stories come after the #10 recheck.
3. **US2 drawer (P2)**: `ocelle-drawer.ts`, the `drawer-inline` token, its manifest entry, README section and stories.
4. **US3 tooltip (P3)**: `ocelle-tooltip.ts`, the `tooltip-delay` and `tooltip-max-inline` tokens, README § Engines to
   WebKit 17, stories, and the record of Kitty Desktop's webview version.
5. **Polish**: the R-16 recheck closed out, the quickstart walk-through, the CHANGELOGs.

## Complexity Tracking

No constitution violation; no row.
