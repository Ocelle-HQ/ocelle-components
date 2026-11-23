# Implementation plan for an accessible workflow canvas

**Branch** `029-workflow-canvas` · **Date** 2026-11-23 · [Approved specification](spec.md) · [Triage](../../triage/029-workflow-canvas.md)

## Summary

Add the controlled `ocelle-workflow-canvas` primitive for Workflow Studio. It reuses the landed workflow node, projects host-supplied positions and connections onto an SVG surface, and exposes distinct selection, viewport, node-position and semantic connection requests. Native controls provide the non-drag paths and remain usable during read-only navigation where applicable. [Rendering and focus measurements](research.md) · [Consumer contract](contracts/workflow-canvas.md)

## Technical context

Use the pinned TypeScript, Lit and browser toolchain. Native SVG paths supply retained connections and HTML `foreignObject` supplies actual workflow-node and pointer targets inside the component. Use existing tokens and CSS adoption, in-process Chromium for focused proof and mutation, the built harness for strict CSP, real touch tests, and Storybook baselines. Data and persistence remain with the host. The renderer comparison exercised 12 and 96 nodes. Re-measure the shipped approach and report actual bundle delta and input response on those fixtures. Use the full required hosted checks on the final candidate.

## Constitution check

| Principle | Design check |
| --- | --- |
| Public surface and consumers | Add one interoperable element and new controlled requests as a MINOR addition. Reuse the #72 action and keep Studio policy in the host. Export and manifest entries, changelog and typed documentation describe the public inputs. |
| Brand and tokens | Use existing tokens for form controls, spacing, visible focus, target dimensions and contrast. SVG numeric placement represents input geometry. Use token-derived styles for the edges, surfaces and state cues. |
| Accessibility | Use real controls at the target token minimum in viewport pixels. Keep labels and references in their owning root. Visible actions have one sequential group entry. Named navigation and edit choices remain available independently of geometry. Check real focus, contrast, forced colors, reduced motion and touch. |
| CSP and offline | Bind validated finite coordinates as SVG geometry and use static adopted styles. The component does no I/O. The built fixture keeps the strict header, including any drag, resize, viewport or edit path. |
| Stories and test-first proof | Each behavior phase commits assertions before code, confirms named failures and proves the integrated final tests against the original state. Keep changed-source mutation, affected Plants, state stories with pinned light and dark baselines, independent reviews and the full required CI inventory. |

The design review introduces no proposed constitution exception.

## Project structure

- `packages/elements/src/ocelle-workflow-canvas.ts` owns the element, keyed nodes, render/update lifecycle, transient event dispatch and focus integration. `packages/elements/src/workflow-canvas-types.ts` defines the public data shapes and request details.
- `packages/elements/src/workflow-canvas-graph.ts` projects the ordered identities and drawable edges from host data. `packages/elements/src/workflow-canvas-navigation.ts` resolves visible traversal and recovery and tracks current reveal eligibility from primitive inputs. Neither slice imports the other. The element feeds DOM measurements and actual focus into these functions.
- `packages/elements/src/workflow-canvas-viewport.ts` handles graph-to-viewport geometry, inverse pointer deltas, fit and pan/zoom proposals. `packages/elements/src/workflow-canvas-edit.ts` handles the authoring connection session and validates it against the current authoritative connection.
- `packages/elements/test/workflow-canvas-graph.test.ts`, `packages/elements/test/workflow-canvas-navigation.test.ts` and `packages/elements/test/workflow-canvas.test.ts` run in the in-process `elements` project. Use `packages/elements/test/workflow-canvas.touch.test.ts` for real touch behavior in `elements-touch`. Both projects enter changed-source mutation. `packages/elements/test/browser/workflow-canvas.test.ts` and `packages/elements/test/browser/fixtures/workflow-canvas.html` verify the built API under strict CSP. Shared assertions or fixtures go in `packages/elements/test/scenarios/workflow-canvas.ts` only when both consumers genuinely exercise the same path.
- `storybook/stories/workflow-canvas.stories.ts` owns state fixtures and one owner generates the exact matching pairs under `storybook/baselines`. Update the actual manifest, export, README and exact inventory consumers from the phase base.

## Rendering and input boundaries

Render an SVG coordinate surface in canvas-local CSS pixels. Project node origins from the graph positions and current viewport. Use each node's screen-sized measured HTML extent to size its `foreignObject` and align edge anchors. A viewport scale changes spacing between origins. It does not scale down native control hit areas or readable text. Compute Fit from projected node extents, measured control sizes, padding and the routed bounds. Test a representative branching graph at the narrow width. Empty or temporarily unmeasurable graphs provide a predictable canvas fallback and do not write invalid geometry. Focus eligibility uses the actual rendered action and focus inset inside the viewport. Watch measurements and retire stale focus after a viewport change, resize or graph replacement.

Keep SVG paths behind the real controls and hide the decorative edge group from accessibility. Native named controls represent the step and outcome choices independently of the geometry. Preserve each #72 node's keyed instance through the render and pass only its supported selection, focus, content and state inputs. Set `.selectionTabIndex` on the node instance and call `focus({preventScroll:true})` after the actual action is ready. Inspect shadow focus and composed event paths. Handle arrows and endpoints only within the current node action group. Keep native Tab, reverse Tab and activation. Ensure a plain native click bubbling past the canvas cannot emit another application request.

The named reveal records its latest destination and focus generation before dispatch. Recheck both after the host input, layout and child update. An update which only reveals the earlier target leaves focus where it is. If both destinations are visible, only the latest target can receive the handoff. Clear a pending reveal when focus departs, including departure followed by return. If a node or an edit control is removed, save its previous focus context before rendering and use the fallback order in the spec. Honor cancellations and read-only mode using the current host properties at the point of completion.

Pointer panning starts on the map background. Dragging a node starts from a layout affordance distinct from its selection action. Pointer connection dragging starts from an outcome affordance and accepts a valid node destination. Dropping without a valid target cancels. Keep hit testing and visual guides internal. The named editor and non-drag layout/viewport controls give equivalent keyboard, click and tap operations. Feedback uses a transient gesture snapshot. Validate its current basis and consume the session before dispatch so capture loss, a synchronous host update or a duplicate release cannot publish an extra request. Clear feedback on cancellation or completion.

## Sequential delivery and file ownership

| Phase | Work and acceptance | Primary write ownership |
| --- | --- | --- |
| 1. Select and navigate | Test-free inert entry and interface scaffold, graph projection, native selection, named reveal, visible roving focus and recovery. Use a branching graph and a clipped/resized view. | The integration owner writes the shared canvas, public types, registration, fixture wiring and the phase's story and evidence. The two helper slices below can be assigned separately. |
| 2. Arrange and view | Viewport controls, Fit, pointer pan and node movement with authoritative accept or reject. Prove translated double-scale displacement, aligned edges and equivalent non-drag operation. | One owner writes `workflow-canvas-viewport.ts`, its integration in `ocelle-workflow-canvas.ts`, and the new focused cases in the shared canvas suites and story file. |
| 3. Edit named outcomes | Connect, reassign and disconnect by real mouse, keyboard and taps. Prove exact event streams, cancellation, focus, rejection and invalidation with IDs intact. | One owner writes `workflow-canvas-edit.ts`, connects the UI in `ocelle-workflow-canvas.ts`, and owns the affected tests and story changes. |
| 4. Inspect the run | Read-only edit suppression, predictable focus after a mode change, selected and invalid states, long labels, empty graph, narrow layout and reduced motion. | One owner writes the shared canvas and its state, mode and fixture coverage. Final public documentation and exact generated inventories are integrated together. |

The Phase 1 integration owner creates one test-free inert scaffold if needed. Give it stable, importable signatures for the two helpers and the empty canvas. Register the same element module in standalone and aggregate builds with compatibility changes required for an honest red rollout. Record the scaffold, then have the tests fail on the required observable behavior. Browser tests start with assertions on accessible elements, rendered relationships or request counts that can fail on the scaffold before any required pointer or keyboard driver assumes the element exists.

| Phase 1 slice | Common prerequisite | Test drafting writes | Post-red production writes |
| --- | --- | --- | --- |
| Graph projection | Public types and inert signatures committed | `packages/elements/test/workflow-canvas-graph.test.ts` | `packages/elements/src/workflow-canvas-graph.ts` |
| Visible navigation and recovery | Public types and inert signatures committed | `packages/elements/test/workflow-canvas-navigation.test.ts` | `packages/elements/src/workflow-canvas-navigation.ts` |

Each worker reads the pinned public types and implements its own slice. Its corresponding focused test directly exercises the helper and fails an assertion on the scaffold. Functionality reaches the real canvas through the integration owner's serial work, where real browser tests exercise the same contracts. Both helper slices must be proved green together before the owner depends on them. A worker needing changes in a common file or a dependency on the other helper reports it before integration and continues serially if the group no longer qualifies.

### Worktree pilot and shared files

Use the reviewed Op 028 instructions at `dce21bac` on `codex/028-within-phase-worktrees`. The task generator records exact file ownership, prerequisites and candidate `[P]` groups. The owner seeds worker checkouts and the staging checkout from the same clean pin with the local approved feature pointer and offline dependencies. The owner checks returning scopes and signoff, assembles all drafts into the canonical test-only red and records its expected failures before dispatching any production work. Repin after the red evidence. Combine scoped production commits on staging and verify their focused tests together. Promote passing work by fast-forward with its evidence and completed task IDs recorded together. Continue serially from the last verified checkpoint if dispatch or integration fails. Phase checks, independent review and the fold decision precede Phase 2.

Record the common dispatch time, worker starts and returns, first combined focused green and separate whole-phase green, all on named revisions. Report observed dispatch-to-combined-green and setup or integration overhead. Compare worker durations for context without treating their sum as a measured serial run. Retain receipt paths for the red proof and any serial fallback.

Assign all updates to `packages/elements/package.json`, `packages/elements/src/index.ts`, `packages/elements/src/browser.ts`, `packages/elements/custom-elements.json`, `packages/elements/README.md` and `packages/elements/CHANGELOG.md` to the serial integration owner. That owner also updates the actual export and manifest inventories in `packages/elements/test/exports.test.ts`, `packages/elements/test/node/manifest.test.ts`, `packages/elements/test/node/readme.test.ts` and `gates/test/manifest.test.ts`. Check exact inventory readers in the Storybook, visual, axe and Plant integration tests and the existing manifest, empty-index and changed-token Plant overlays. Preserve each fixture's original intent. Derive exact story IDs, asset paths and counts from the actual phase base and build. Each phase assigns this shared fixture and generated file work to one owner.

## Verification and evidence

- For each behavioral phase, write a signed test-only red and prove assertion-level failures before production. Record shared test consumers in `reviews/phase-N/test-scope.txt` as exact runnable file paths when helpers or fixtures change. Read the structured selections and keep the conservative fallback when coverage is uncertain. Op 025 CI-only handling is limited to its existing exact collateral inventory rules. Keep primary browser and touch cases in local red and green.
- Exercise select, move, viewport and semantic requests with an outer composed listener. Assert the complete ordered stream and payloads, plus native focus, navigation, actual graph-space proposals and unmodified source snapshots. Cover Escape, denied host updates, multiple rapid reveals, moving focus away and back, pointer interruption, authoritative connection replacement, and mode changes before the next DOM update.
- Measure positioned native controls in screen pixels from the actual action and check the visible focus indicator at narrow width, after zoom, and in forced colors. Test name and description in the accessibility tree and stable duplicate labels including repeated named outcomes. Use real touch input for the separate taps and test reduced-motion preferences independently.
- Verify the strict-CSP built fixture with root and nested shadow hosts. Assert normal consumption of same-origin bundle assets and zero unexpected requests or policy violations from input updates. Keep dynamic movement on numeric geometry attributes. Check every approved phase with its actual stories, pinned baselines, accessibility, changed-source mutation and affected Plants.
- Keep the full hosted Unit, strict mutation, Plants, visual, accessibility, manifest and CSP checks on the final candidate. Capture exact focused activation and replay timing separately from hosted elapsed time. [Verification guide](quickstart.md)
