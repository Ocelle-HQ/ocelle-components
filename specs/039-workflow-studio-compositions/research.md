# Workflow Studio Composition Research

## R-01 — Use the canvas request model directly

The shipped canvas names selected nodes, viewport, layout and connections independently. It emits `ocelle-workflow-node-select` with `nodeId`, and canvas viewport, position and connection requests with their typed values. Accept or reject in one fixture host after recording the actual request. Render only the authoritative state. Reusing native canvas controls for step, move and connection fields keeps keyboard and tap paths on the implementation consumers actually use. [Canvas contract](../029-workflow-canvas/contracts/workflow-canvas.md)

## R-02 — Return focus through real host actions

The existing canvas recovers focus by keyed, visible graph order after removing a focused node. It does not offer an API to focus a node by ID from an unrelated inspector. Use the canvas behavior for its own removals and use real host-owned selection, Step and Add step actions where the host was responsible for focus. Keep Add step operable in the empty narrow route. Use the form-select’s public focus method after revealing the narrow drawer. The host controls the responsive specimen and lifecycle without using shadow DOM internals. [Responsive patterns](../009-workflow-layouts/spec.md) · [Canvas focus contract](../029-workflow-canvas/spec.md)

## R-03 — Keep the editable interview draft until an accepted save

The native form and existing textarea expose a real FormData field, change the error state without clearing its value, and leave retry usable. Retain the field instance and normalize observed browser textarea newlines through its public contract. After success commit one fictional event. Render the recorded facts and timeline with the shipped elements so the distinct actors, action and evidence are visibly attributable. [Textarea](../026-form-textarea/spec.md) · [Timeline](../019-data-records/contracts/ocelle-event-timeline.md)

## R-04 — Scope each pin to the reviewed instance

The #75 completed comparison recipe already uses shared facts, a notice and readable digests. Carry a stable instance ID into the comparison and keep the offered version immutable. Store reviewer and accepted pin in each placed instance. Reuse the composition pattern while keeping its existing Storybook IDs and host fixtures independent. [Comparison recommendation](../031-change-list-discovery/recommendation.md)

## R-05 — Exercise the same hosts in two build environments

The pane action footer uses an external host, ordinary Storybook build tests and a separately compiled strict package fixture. Existing default Mutation retains the in-process Storybook browser project. Reuse the same host under each test harness rather than proving only a stubbable wrapper. The built Storybook bootstrap has a distinct policy. Its recipe markup and requests receive their own checks. The package fixture uses an externally bundled host and the actual built element registrations. [Strict fixture precedent](../../packages/elements/test/browser/pane-action-footer.test.ts) · [Host and Mutation guidance](../../tooling/speckit/README.md)

## R-06 — Pin capture and no assumptions about inventory arithmetic

The triage's original base and the later main have different Storybook and Plant inventories. The scoped repository capture is available only on refs containing #107's command. Use the mode supported by the actual candidate. For the older pin, use its full pinned comparison and capture, then adopt only the measured new results. Preserve unrelated PNGs and reconcile expected quantities after main integration. [Scoped capture workflow](https://github.com/Ocelle-HQ/ocelle-components/blob/b67940a47436a0cc97df09596743fe69c4b24ba0/.github/workflows/visual-capture.yml)
