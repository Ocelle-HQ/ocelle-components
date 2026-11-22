# Implementation Plan: App frame and navigation

**Branch** `024-app-frame-navigation` | **Date** 2026-11-20 | [Approved specification](spec.md)

## Summary

Add six independently importable custom elements. The shell owns layout and narrow drawer state. Keep one set of consumer navigation nodes across tiers. Build the destination and skip primitives around native interactive controls and reuse the landed drawer, icon, brand and threshold helpers.

## Technical Context

| Area | Baseline |
| --- | --- |
| Language and runtime | TypeScript 6.0.3, Lit 3.3.3, Node 26.13.0 and pnpm 12.16.1 |
| Packages | `@ocelle/elements` public surface, `@ocelle/tokens` additions for published shell thresholds and any missing semantic styles |
| Platform | Web components for Kitty Desktop's webview, Kitty Dashboard and the Ocelle console. Repository browser tests run on pinned Chromium |
| Testing | Vitest Browser Mode, Playwright keyboard and accessibility-tree assertions, Storybook light/dark baselines, axe, CSP, manifest and mutation gates |
| State | Per-instance layout, tier, drawer and focus state. Settle focus on tier and same-tier layout changes. Hosts own routes and destination data |
| Resize behavior | One settled transition per effective state change. Preserve pending focus across same-tier observations that leave its effective target intact. Recompute on superseding changes and cancel stale work on disconnect or deliberate surviving focus. Avoid width feedback from tier-dependent content |

## Constitution Check

| Principle | Design and verification |
| --- | --- |
| I. Framework-free | Elements expose documented attributes, properties, slots, parts and prefixed events. Register through existing per-element, root and browser entry points. No element I/O |
| II. Tokens and brand | Compose dark chrome in both themes. Use standard radii and token colors. Publish threshold defaults as layout tokens |
| III. Accessibility | Use native links, a named inline nav group, native buttons and modal dialog semantics. Keep ARIA references local. Test distinct landmarks, sequential drawer entry, the primary menu's minimum target size, forced colors and ownership-aware bubble dismissal |
| IV. CSP and offline | Lit adopted stylesheets, local assets and native APIs. Run the built-output integrated shell probe in the enforced-CSP `elements-browser` project and assert successful behavior with zero policy violations |
| V. Visual and interaction tests | Commit pinned baselines and test variants, emitted events and actual keyboard outcomes |
| VI. Consumer scope | Derive behavior from cited Kitty requirements and implement original Ocelle elements |
| VII. Semver | Additive manifest and token surface. Document changes per affected package |
| VIII. Test-first | Split into reviewable units, record real red runs before green, run old-code and mutation checks, and add tests before behavioral fixes. Put behavior and branch assertions in the mutation-selected Chromium source projects `elements` and `elements-touch` |

The Phase 1 contracts preserve these constraints. Changes to shared drawer, sidebar or threshold code require regression coverage of the existing callers.

## Project Structure

- Feature artifacts live in `specs/015-app-frame-navigation/`. [Research](research.md), [state model](data-model.md), [element contracts](contracts/elements.md) and [validation guide](quickstart.md) support the later task breakdown.
- New element modules belong in `packages/elements/src/`, browser tests in `packages/elements/test/`, stories and committed baselines in `storybook/`. Reuse package registration, browser entry, manifest generation and changelog conventions.
- Shell threshold and style tokens belong in `packages/tokens/` with their existing contract tests. Add only tokens needed by this mission.

## Delivery order

1. Establish the top bar and the navigation primitives with standalone stories and native key paths. Validate the inline nav pill against the Desktop V2 group with several links, one current page and a separate top-bar action.
2. Establish shell layout and drawer composition against real rail and sidebar fixtures. Keep stable destination identity and exercise grouped sidebar compaction, distinct navigation landmarks, minimum menu size, resize, focus recovery from collapsed sidebar chrome and same-tier layout switching in source browser tests before changing shared helpers.
3. Add the skip link and integrated shell validation, including a target in a different shadow root and a separately sized frame. Run the public surface and integration gates across all delivered units.
