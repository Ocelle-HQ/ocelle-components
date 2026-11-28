# Implementation Plan: Workflow Studio Compositions

**Branch**: `039-workflow-studio-compositions` | **Date**: 2026-11-28 | **Spec**: [spec.md](spec.md)

## Summary

Deliver three independent, executable Storybook compositions in the issue’s order. Each uses an external fixture host with resettable fictional state. The existing package controls own rendering and native interaction. The example hosts handle graph and layout state, simulated decisions, and fixture-specific focus transitions. Keep the product-facing package surface unchanged. The approved semver impact is none. [Triage](../../triage/039-workflow-studio-compositions.md)

## Technical Context

- **Language and dependencies.** Repository-pinned TypeScript, Node, pnpm and Storybook. Use the existing generated custom element types, DOM and native form behavior. Each fixture host has no component runtime imports.
- **State.** Deterministic per-mount values. Authoring stores ordered semantic graph, layout, viewport, selection and inspection state separately. The interview fixture keeps pending form data and accepted timeline events. The catalog fixture stores separate accepted bindings and pins by instance identity. All state is in memory.
- **Runtime and tests.** Use the existing in-process `storybook-browser` project for actual host interactions and Mutation. Use built Storybook under its normal harness and the packaged elements under the strict same-origin fixture server. Test light, dark, forced colours, real keyboard and tap, a regular and a narrow layout, and reachable focus.
- **Scope and performance.** One new built example and two pinned baseline PNGs per phase. Run focused replay and scoped Mutation before review. Keep the required Visual, Axe, strict CSP, Plants and full landing CI. Use the measured inventory and runtime on each exact pin.

## Constitution Check

The component package, public manifest, exports, dependencies and release shape remain as approved. The new compositions use existing names, tokens, focus rules and appropriate native actions, with fictional local-only state. They introduce no runtime services. Their hosts and styles are external. Actual browser assertions cover reflow, focus, phases of a failed or rejected transaction, and read-only requests. Phase history retains tests-only red and unchanged green plus exact replay and required gates. The design and evidence routes below retain the same checks after research. [Constitution](../../.specify/memory/constitution.md)

## Phase 1 — Author the branching workflow

Mount one authored graph with ordered visible Publish decision and distinct initial destinations. The button-mode action-row palette adds Security review exactly once per activation, before its visible Publish decision successor. The existing list-detail layout presents the graph and inspector. The actual form-select binds a named reviewer. A visible status indicator and notice report the missing binding and any rejected edit. Use the dialog-backed drawer for the narrow inspector and expose finding activation as one named action. At both layout sizes, reveal the inspector and focus its actual enabled reviewer control through public `focus()` after its route settles.

Use the canvas controls for real keyboard and tap selection, numeric movement and named destination edits. Listen to its actual composed request events before deciding. Accepted movement updates layout, accepted wiring changes only the source/outcome connection key, and rejection exposes the requested destination with a visible notice while retaining the authoritative fixture. Deterministically compare serialized semantics before and after layout and connection operations. Switch the same graph into read-only mode. Prove exercised gestures reach their rendered targets, selection and viewport work, and the stream contains zero workflow edits.

Use the canvas’s existing keyed focus recovery when a removed canvas action owned focus. Place Publish decision next in the test graph. Use an actual host-owned named selection action for removed inspector or opener paths where the canvas cannot focus by ID via a public method. The host retains the Step chooser for remaining unrendered actions and exposes a persistent Add step control when empty. Confirm an unaffected focused action keeps focus. Observe native drawer close before the fallback decision. Use the story host’s layout state to route the active inspector and preserve the logical form and editor state.

## Phase 2 — Inspect the run and answer the planning interview

Use the same component contracts with a new immutable fictional graph, read-only mode, and independent selection and viewport. Present the recorded status and decision facts. Observe real selection and viewport requests and show target reachability before the zero-edit assertion.

Open a real named dialog. Mount a native form with the existing form textarea. Read the submitted value through FormData. Reject the first save with the control's accessible error, keeping the textarea identity and value. The first fixture exercise keeps “one hour”. A separate reset fixture exercises the two-line content and preserves the newline, subsequent edits and retry. On accepted retry, append one answer event. The event timeline presents the data owner and engineering lead, distinct actions and evidence, and the stable named plan revision. Dismissal restores focus to the real opener. Narrow state transitions keep pending text, selection and visible evidence.

## Phase 3 — Compare and accept a catalog upgrade

Use the existing version and capability comparison recipe with fictional admitted offers. Keep distinct instance records and reviewer bindings. Open the comparison with a stable instance identity and render separate current and offered versions, digests and capability changes. Preview and dismiss leave both pins intact. On an explicit accepted save, update only that instance and preserve both reviewer bindings. Use the same reachable comparison and focus return at the compact layout.

## Test-First Work and Ownership

- Keep separate implementation-story files and fixture hosts for each phase, as listed under Project Structure. Before red, pin exact `reviews/phase-N/test-scope.txt` entries and only that phase’s Storybook implementation story. Use a scaffold if needed for importable fixture modules without behavior. Prove the new runnable cases fail at behavioral assertions. At the boundary, assert actual expected built IDs, fixture mount availability and external asset presence before using them, so test setup or import failure cannot count as red.
- A single test owner per layer can work from the shared clean phase pin when paths and prerequisites are disjoint. Start the phase’s implementation after canonical tests-only red is verified on the integrated tests. Shared CSS, fixtures and any generated inventory files each have one owner. Scope every actual runnable consumer of a changed shared helper.
- Use `storybook/test/unit/browser/workflow-studio.test.ts` for the real in-process mounts. Avoid an import setup failure with the existing eager-glob discovery pattern, or prove the behavior against a scaffold. Run `node tooling/speckit/bin/component-preflight.ts host --source <exact host.ts> --test storybook/test/unit/browser/workflow-studio.test.ts --project storybook-browser` for every changed host source. Then capture exact scoped ordinary Mutation with `pnpm run gate:mutation -- --base <full-phase-base-sha> --files <host.ts>`, including the tool pins, selected ranges, outcomes and exit. Existing routing retains this project. The element-only related-file advisory selector does not apply to a fixture host.
- Use `storybook/test/integration/workflow-studio.test.ts` to reach the actual built Storybook iframe controls. Install request observation before navigation. Check the built story index, keyboard, a touch-enabled context with real tap, narrow layout, relevant forced colours, and the active focus in nested shadow roots. Confirm fixture markup contains no inline scripts, styles or handlers, and requests stay on the same origin.
- Use `packages/elements/test/browser/workflow-studio.test.ts` and its one generic external fixture. Bundle each same host with the existing temporary Vite build pattern, serve its external module and CSS along with the installed elements, and keep the strict fixture server's exact same-origin policy and request allowlist. Exercise the specified phase interaction and the clean runtime result. Run the normal package CSP gate separately. Preserve the existing Storybook preview policy.
- Guard test assertions for all real actions. Observe a delivered target event before asserting zero requests or host rejection. Pair the intended failing assertion with a positive, visible control and criterion to separate test setup from product behavior. Keep the ordinary required gates and archive each approved phase before starting the next.
- One generated-evidence owner per phase adds its measured built ID and two baseline paths, its empty-index stub, and the shared Storybook build, Axe, Visual and Plant expectation paths. Use the measured current captures and built index. Keep existing intentional failure fixtures, Axe exceptions and unrelated visual findings. Add a token-change Plant finding only when the isolated pinned result measures it. Landing reconciles actual inventories after integrating current main and records the new candidate and original phase receipts.

## Project Structure

```text
storybook/stories/
├── workflow-studio-authoring.stories.ts
├── workflow-studio-authoring.ts
├── workflow-studio-run-inspection.stories.ts
├── workflow-studio-run-inspection.ts
├── workflow-studio-catalog-upgrades.stories.ts
├── workflow-studio-catalog-upgrades.ts
└── workflow-studio.css
storybook/test/unit/browser/workflow-studio.test.ts
storybook/test/integration/workflow-studio.test.ts
packages/elements/test/browser/workflow-studio.test.ts
packages/elements/test/browser/fixtures/workflow-studio.html
```

Use Storybook titles `Workflow Studio/Authoring`, `Workflow Studio/Run inspection`, and `Workflow Studio/Catalog upgrades` with a `Journey` export. Verify the prospective IDs `workflow-studio-authoring--journey`, `workflow-studio-run-inspection--journey`, and `workflow-studio-catalog-upgrades--journey` in each actual built index before capture. Preserve the existing #75 comparison story IDs. The generic CSS and test harness begin with authoring and subsequent phases append just their cases. Reuse the repository test helpers and keep the choices and state local to each mount.
