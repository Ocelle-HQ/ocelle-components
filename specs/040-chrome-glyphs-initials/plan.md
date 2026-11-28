# Implementation Plan: Shared Chrome Glyphs and Initials Trigger

**Branch**: `040-chrome-glyphs-initials` | **Date**: 2026-11-28 | **Spec**: [spec.md](spec.md)

## Summary

Deliver the two stories as independent test-first phases. Extend the existing icon catalog with five additive names. Add an optional initials presentation to the existing button, reusing its action, naming and focus behavior. The [approved triage](../../triage/040-chrome-glyphs-initials.md) classifies the additions as MINOR.

## Technical Context

Use TypeScript and Lit 3 in `@ocelle/elements`, with the repository's pinned Node, pnpm, Chromium and Storybook tools. The feature adds no runtime dependency, persisted data or network operations. Verify through the existing Chromium projects and strict-CSP fixtures, with the existing in-process project used for element Mutation. Capture Storybook with both pinned engines. Use the existing rail and button tokens for layout and all visual values.

## Constitution Check

The additions use existing element entry points and namespaces. Draw the glyphs independently using the established local SVG grammar. Paint the initials circle as a decorative SVG shape inside the existing button with token spacing, fill and text. The control keeps its existing corner radius, so the state-pill radius rule still applies. Preserve native button behavior, host-owned actions, naming, focus indicators and forced-colour support. Sanitize no HTML because caller text is interpolated only as text. Static Lit templates and adopted styles keep the built output strict-CSP compatible. Verify both phases with runnable tests-only red evidence, green, final old-source replay and scoped Mutation. Update the public manifest, package docs and changelog. The [contract](contracts/chrome-controls.md) passes the same checks after design. No exception is needed.

## Phase 1 — Shared chrome glyphs

Add `inbox`, `history`, `settings`, `notifications` and `appearance` to the exported `IconName` union and the existing table in `packages/elements/src/icons.ts`. Draw original glyphs within the existing 24-unit grid and its safe drawing bounds. The five names use the shared stroke and size, respect inherited foreground, and keep their orientation in RTL. Preserve all 13 existing names, four mirrored drawings and the blank reservation for unknown names. Update any description of the supported names in `ocelle-icon.ts` and package documentation.

Update the independent geometry expectations in `packages/elements/test/icons-expected.ts` and the exact-set, geometry, currentColor, stroke and RTL coverage in `test/scenarios/icon-set.ts`. Exercise the scenarios through the runnable `test/icon-set.test.ts` and `test/browser/icon-set.test.ts` files. Demonstrate the five individually in `storybook/stories/icon.stories.ts` on existing, explicitly named chrome `ocelle-button` controls. The fixture uses the existing button state and the decorative icon slot. Verify actual rendered glyphs, exact role/name, focus and one trusted keyboard activation per gesture in the button scenarios and the built same-origin fixture. Include normal light, dark and forced-colours palettes, 320 CSS px viewport and 200% root text on the action fixture. Red must fail on the missing drawing or catalog entry after successful setup, with an existing glyph as the positive control. Use markup strings for new names so red compiles on the existing union.

Keep and expand the existing LTR and RTL gallery stories. Plan story IDs under `elements-ocelle-icon`: `set`, `set-right-to-left`, `inbox-action`, `history-action`, `settings-action`, `notifications-action` and `appearance-action`. Capture each in light and dark using the IDs confirmed in the built index.

## Phase 2 — Initials trigger

Add optional reflected string `initials` to `packages/elements/src/ocelle-button.ts` according to the [contract](contracts/chrome-controls.md). A valid value opts into the centered mark in native button mode when the default slot has no non-whitespace label and the icon slot has no assigned elements. Keep the existing slot nodes mounted so ordinary slot changes and naming still work. Retain the inner native control and all public events. A busy trigger temporarily displays its existing spinner at the same target size. Disabled buttons are inactive and the initials are distinguished with the disabled palette. Ordinary buttons, links, and content slotted into an otherwise configured button follow their existing rendering paths.

In light and dark, assert that the computed HTML initials text color equals the resolved --ocelle-color-on-accent and the computed SVG circle fill equals the resolved --ocelle-color-accent. Run `pnpm run gate:contrast` for this declared text/background pair. Check system colours separately in forced colours.

Use an independent accessible button name, with existing precedence. Render the mark as decorative. Use the existing avatar size token and font-size, weight and colour tokens, with an SVG plate behind the HTML text. Forced colours use a system-colour fill, text and visibly distinct stroke. Keep the focus indicator around the entire native target on the normal-size chrome button. Preserve the existing compact sizing contract if the host requests that size. Use full-size chrome controls in the rail evidence.

Add focused standalone and rail cases through `packages/elements/test/scenarios/button.ts` and `test/scenarios/personal-rail.ts`, their in-process and browser test entry files and their built external fixtures. Compare the treated rail to the same layout with a standard token-sized flush chrome button as the bottom reference. At each measured root size compare the initials and ordinary flush controls at that same size and verify the width and height of both native targets against the resolved --ocelle-target-min (2.75rem, giving 44 CSS px at a 16 px root and 88 CSS px at a 32 px root). Measure the primary and Settings positions, divider, inter-item gap, both axes of the native target and outline visibility. Use a Settings control whose label and behavior work with the original glyph set, so the phase is independently testable. Include an existing horizontal fixture regression. In standalone and vertical rail specimens, check 320 CSS px separately and together with 200% root text, with the fixture's actual computed text size verified. Test a single initial and a wide two-letter value without clipping, live updates/removal, slot coexistence, link behavior, exact accessible name and decorative mark, Enter and Space, disabled/busy and strict CSP. Capture the standalone `elements-ocelle-button--initials-trigger` story and the composed `elements-ocelle-personal-rail--initials-trigger` story in both themes. Also capture `elements-ocelle-button--initials-trigger-busy` and `elements-ocelle-button--initials-trigger-disabled` from `storybook/stories/button.stories.ts`. The busy story shows the replacement spinner and the disabled story shows the disabled plate and text. Include both IDs in the built index and Axe inventory and commit these pinned baselines:

- `storybook/baselines/elements-ocelle-button--initials-trigger-busy.light.png`
- `storybook/baselines/elements-ocelle-button--initials-trigger-busy.dark.png`
- `storybook/baselines/elements-ocelle-button--initials-trigger-disabled.light.png`
- `storybook/baselines/elements-ocelle-button--initials-trigger-disabled.dark.png`

Test the following inputs (JavaScript string escapes denote actual characters), asserting the exact text without normalization for every accepted case. Update the same mounted host from an accepted input to each rejected input and assert that the plate and initials disappear, ordinary rendering returns and the independent action name persists.

| Input | Rendered initials or ordinary presentation |
| --- | --- |
| `"W"`, `"WW"` | `"W"`, `"WW"` respectively |
| `"  e\u0301W  "` | `"e\u0301W"` (two graphemes) |
| `"👩‍💻"` | `"👩‍💻"` (one joined grapheme) |
| `"   "`, `"ABC"`, `"A B"` | ordinary |
| `"\u200B"`, `"\u2060"`, `"A\u200B"` | ordinary because at least one cluster is entirely default-ignorable |

The standalone fixture and example do not implement account content or popup behavior.

## Shared outputs and phase evidence

Each phase owns its tests, sources, stories and baseline paths. Its integration task owns the package manifest, documentation, changelog and any affected full manifest Plant snapshots or descriptors. Identify exact existing manifest overlay paths and expected findings with `node tooling/speckit/bin/component-preflight.ts manifest --base <full-phase-base-sha>`. Compare with the regenerated manifest and preserve the seeded findings and clean reordered fixture. Each phase has one owner for built-index, Visual and Axe inventories and expected Plant results. Update the empty-index Plant's stub inventory if story modules change, and propagate only measured changes to the token-change Plant. Compare exact current baseline paths and inventories before updating them.

For red, declare the changed runnable consumers and add tests-only coverage before source or story changes. Use old-source failure at the intended assertion and preserve unchanged green and final replay. Tie scoped Mutation to the exact green candidate. Hold the same evidence through phase folding and through integration against current main. The [verification guide](quickstart.md) describes the checks.

## Project Structure

- `packages/elements/src/{icons,ocelle-icon,ocelle-button}.ts`
- `packages/elements/test/{icon-set,button,personal-rail}.test.ts` and corresponding scenarios, browser entry points and external fixtures
- `storybook/stories/{icon,button,personal-rail}.stories.ts` and `storybook/baselines/`
- `packages/elements/{README.md,CHANGELOG.md,custom-elements.json}` and affected artifacts in `gates/{test/integration,plants}/`
