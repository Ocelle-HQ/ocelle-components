---
phase: landing
round: 1
verdict: changes_requested
base: 183b20f9148e6fa0a402b23e367328f6a8683f97
head: 7c81d94f91cd1e8732e0bb45d77a9574b589b131
tree: 504aebcf7e4e43cb7f64e37b9a6973fd36fd8d99
---

# Landing review, round 1

The integrated diff adds the controlled canvas from issue #73 to the workflow node already on main. The four phase reviews are approved. One live-input defect blocks landing.

## Findings

| ID | Severity | Where | Finding | Required change |
|---|---|---|---|---|
| L1-01 | blocking | [Named reveal admission and viewport calculation](../../../../packages/elements/src/ocelle-workflow-canvas.ts#L1419) | The Step picker's Reveal action can emit a viewport request for a removed destination or after the host takes focus while the canvas synchronously focuses Reveal. It can also compute the request using the new host viewport and old rendered bounds. An already exposed destination then produces an unnecessary request. | Revalidate the Step target and focus ownership after initiating focus. Measure from the latest rendered host inputs before requesting or handing off focus. Cover host graph or layout invalidation, partial and complete viewport replacement, and focus redirection with a native activation. Retain the established programmatic requests from a clipped or inert canvas and preserve external focus when the initiator never acquires it. |
| L1-02 | note | [Aggregate type exports](../../../../packages/elements/src/index.ts#L66) | The standalone module exports all three canvas event details. The aggregate exports the viewport detail but omits the position and connection details. The documented standalone import remains available. | Carry the two additional type re-exports through the aggregate if it can be done in the landing fold. |
| L1-03 | note | [Draft PR #94](https://github.com/Ocelle-HQ/ocelle-components/pull/94) | The draft title and description still present Phase 1 as the deliverable. | Describe the complete canvas, the reason for the approved baseline additions, the final check run, and the follow-up scope during deliverable review. |

### Independent reproduction for L1-01

I built the browser aggregate from the recorded head and served it to Chromium with the repository CSP. A branching fixture has a positioned Revise step outside the map. The test selects Revise in Step and clicks the native Reveal button with a trusted pointer. The host prevents the default mousedown focus so that the canvas's own focus call invokes the host's focus listener synchronously. The control case makes one viewport request with x = −808 and keeps focus on Reveal while acceptance is withheld.

| Host response when Reveal receives focus | Actual result |
|---|---|
| Remove Revise from the supplied graph | One request with x = −808 for the removed target |
| Apply a partial viewport with x = −400 | One request with x = −1208, combining the changed viewport with old bounds |
| Apply an already sufficient viewport with x = −900 | One request with x = −1708, followed by focus on the already exposed Revise action |
| Focus an external host button | One request with x = −808 while the external button retains focus |

The fixture recorded trusted clicks and focus events in all five cases and zero CSP, console or page errors. The Follow path already rechecks the current relation and waits for the host viewport to render. The Step path reaches the same calculation before those guards. The consumer contract requires the same reveal operation for both. It also keeps the requester focused while an actual viewport decision is pending and cancels its handoff when the operator moves focus. The established programmatic cases still require a viewport request when Reveal never acquires focus, while preserving host scroll or external focus as applicable. [Host-owned navigation contract](../../contracts/workflow-canvas.md#keyboard-touch-and-host-inspector) · [Programmatic controls](../../../../packages/elements/test/workflow-canvas.test.ts#L1549)

## Design and gate boundaries

- The canvas keeps graph, layout, viewport, selection and mode separate. It composes the workflow node's native selection button and emits the typed position, viewport and connection intentions. The source and outcome tuple stays stable across renames. Both interaction models leave changes to the host. The review also exercised trusted node activation with the host removing, unpositioning or clipping the action during capture. Each case emitted zero requests, and the live node control emitted its sole selection request.
- Keyed, native node controls, the named navigator and the relationship list preserve access to clipped steps. Positive eligibility checks the focus inset, clipping ancestor chain and the later paint order. Ineligible faces leave sequential and assistive-technology navigation. Existing round evidence covers forced colors, reduced motion, long names and the supported clipping shapes. Custom outlines and SVG clips remain within the approved follow-up. [Phase 1 review](../phase-1/round-6.md) · [Phase 2 review](../phase-2/round-2.md) · [Phase 3 review](../phase-3/round-1.md) · [Phase 4 review](../phase-4/round-1.md) · [Issue #95](https://github.com/Ocelle-HQ/ocelle-components/issues/95)
- The renderer uses Lit text bindings, browser-native SVG properties, SVG numeric geometry and adopted stylesheets. No lockfile, runtime network surface or CSP allowance changed. Nine stories supply 18 matching baseline files. All previously committed baseline files match main by bytes.
- The canonical manifest and eight manifest plant overlays add the same canvas module and preserve every previous JSON entry. The Visual and Accessibility integration suites retain their existing negative, infrastructure-error and exact-inventory assertions. Empty Storybook and changed-token plants retain their failure intent. The notice restart plant paces its intentional stale writes so paint scheduling cannot swallow the deliberately wrong announcements. Gate implementations, workflows and registries are unchanged. The local Config copies gate and whitespace check passed.

## Verification

- I compared the recorded review head with the tested candidate `fa90b9c7a32d05243a8e11f5159f05e75c37dc56`. The package, Storybook, gates and workflow files match, and current main is already an ancestor. The exact hosted run passed all 18 required checks, 11,998 Unit tests, all 71 planned mutation selectors, all 318 Plants and 784 story-theme cases each for Visual and Accessibility. The positive and negative deferred integration cases ran on the tested merge. The final published landing revision still needs its own hosted result. [Hosted run](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45644601169) · [Phase 4 review](../phase-4/round-1.md)
- All four phase replay reports pass on their recorded histories. The evidence preserves the test-only patches and named assertion failures. Phase 4's post-fold replay passed all eleven stages. The strict local Phase 4 mutation reported zero survivors and uncovered mutants. Its two timeout detections exercised replacements that indefinitely reschedule the deferred viewport check. The documented equivalent update operator assigns the same generation to the sole live reveal. [Phase 1 replay](../phase-1/tdd-check.json) · [Phase 2 replay](../phase-2/tdd-check.json) · [Phase 3 replay](../phase-3/tdd-check.json) · [Phase 4 replay](../phase-4/tdd-check.json)
- I ran the focused canvas, built Chromium, native touch, manifest and README suites on the folded head. All eight selected files and 1,562 tests passed. Those suites keep the existing controls intact but lack the native Step focus boundary in L1-01.
