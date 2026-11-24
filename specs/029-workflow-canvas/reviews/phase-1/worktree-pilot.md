# Phase 1 worktree pilot

[Approved tasks](../../tasks.md) · [Verification guide](../../quickstart.md) · [Canonical red log](red-phase.log)

## Pins and returns

The local drafting pair started from the clean scaffold receipt `c2e886766b7847e8c7bcffe2e547e8aaea461980`. The owner drafted T004 on `codex/73-p1-stage-red` at `48f71ef56e2b23b3b7bd89ca73200d40046893ff` and combined all three drafts into canonical test-only red `54b4d71a3305997bc2bc3fd152162b237b8b7f89` in `codex/73-p1-canonical-red`. The four selected files produced 39 named assertion failures. The separate proof receipt `f26ed39a1352a38b8fb1a704102f02556f206c2e` was the common production pin.

| Task | Local worktree branch | Signed worker return | Exact assigned write |
| --- | --- | --- | --- |
| T002 | `codex/73-p1-draft-graph` | `ece81b525a93376504e22b3658b3faea9be40041` | `packages/elements/test/workflow-canvas-graph.test.ts` |
| T003 | `codex/73-p1-draft-navigation` | `050958f9eb5580c917e322b35f369043db55590c` | `packages/elements/test/workflow-canvas-navigation.test.ts` |
| T006 | `codex/73-p1-green-graph` | `e2761e2b3b3744024274d98b65655b642a77daf4` | `packages/elements/src/workflow-canvas-graph.ts` |
| T007 | `codex/73-p1-green-navigation` | `d8b13d79b7dbcd218fffa7a8345bed516800927f` | `packages/elements/src/workflow-canvas-navigation.ts` |

Each return came from a clean worktree and its required pin. Scope and sign-off checks passed with one matching file per worker and no overlap within either pair. The owner applied the production returns in `codex/73-p1-stage-green` as `44022310` and `8ddbad62`. The exact combined helper green revision is `8ddbad62c64d1e3abcb9dc9d9637925d0860c27b`.

## Observed timing

All times below are UTC on November 23, 2026. Activity intervals run from the worker's recorded start to its signed return.

| Worker | Start | Return | Elapsed |
| --- | --- | --- | --- |
| Graph tests | 23:47:10.684 | 23:49:48.540 | 157.856 s |
| Navigation tests | 23:47:18.853 | 23:48:47.165 | 88.312 s |
| Graph implementation | 23:57:15.533 | 23:58:06.275 | 50.742 s |
| Navigation implementation | 23:57:20.049 | 23:58:55.376 | 95.327 s |

- Offline setup for the two draft workers and their staging checkout took 1.540 s, 1.563 s and 1.616 s respectively. The batch occupied 1.665 s from first start to last finish and ended before dispatch at 23:46:50.027.
- Draft activity overlapped for 88.312 s. The owner's canonical red check ran from 23:55:28.768 to 23:55:41.854 and recorded all four project and file selections.
- Offline setup for the two production workers and their staging checkout took 1.651 s, 1.711 s and 1.551 s respectively. The batch occupied 1.727 s from first start to last finish and ended before dispatch at 23:57:00.725.
- Production activity overlapped for 46.226 s. The final worker returned at 23:58:55.376. Staging started 51.299 s later, at 23:59:46.675. The focused Unit run began at 23:59:46.764.
- First combined green arrived at 23:59:49.585. The focused check took 2.822 s and passed all 19 tests across two files. Dispatch to combined green took 168.860 s for the production pair and 779.558 s from draft dispatch, including the serial browser draft, red proof and handoffs.
- Equivalent serial elapsed time remains unmeasured. These times describe the concurrent pilot. Whole-phase green is recorded separately in T012.

```sh
pnpm run gate:unit-tests packages/elements/test/workflow-canvas-graph.test.ts packages/elements/test/workflow-canvas-navigation.test.ts
```

## Assertions carried forward to T009

The following identities come from canonical red `54b4d71a`. They depend on the serial canvas integration and its public registration. The combined helper checkpoint selected the two helper files only.

**Project** `elements-browser` · **File** `packages/elements/test/browser/workflow-canvas.test.ts`

- `workflow canvas on the built aggregate under strict CSP > renders stable steps and a branching map, emitting exact native pointer and keyboard selection requests`
- `workflow canvas on the built aggregate under strict CSP > retains focus in a nested strict-CSP host while the viewport is withheld, and reveals on host acceptance`
- `workflow canvas on the built aggregate under strict CSP > changes native focus eligibility after a host pane translates away and back without canvas inputs`

**Project** `elements (chromium)` · **File** `packages/elements/test/workflow-canvas.test.ts`

- `workflow canvas in-process selection and navigation > draws the supplied branching graph, carrying the labels and source outcomes into the existing node controls`
- `workflow canvas in-process selection and navigation > emits exactly one composed native selection on pointer, Enter and Space without changing supplied snapshots`
- `workflow canvas in-process selection and navigation > distinguishes repeated step titles through the native accessible names and named destinations`
- `workflow canvas in-process selection and navigation > drops an interrupted press across a keyed replacement and selects only on a fresh activation`
- `workflow canvas in-process selection and navigation > has one entry in each Tab direction and keeps arrows and endpoints bounded to visible actions`
- `workflow canvas in-process selection and navigation > uses the eligible survivor and then a named fallback without pulling external focus into the canvas`
- `workflow canvas in-process selection and navigation > keeps an eligible focused action through a host reorder of keyed nodes without emitting requests`
- `workflow canvas in-process selection and navigation > keeps focus on the named reveal control while the host withholds the view and hands off when accepted`
- `workflow canvas in-process selection and navigation > ignores an older reveal when only its target appears and fulfills the latest reveal from the same control`
- `workflow canvas in-process selection and navigation > cancels a pending focus handoff when focus leaves the initiating control, even after it returns there`
- `workflow canvas in-process selection and navigation > raises a covered coincident named action locally without changing the supplied view`
- `workflow canvas in-process selection and navigation > raises a covered zoom-converged named action locally without changing the supplied view`
- `workflow canvas in-process selection and navigation > waits for host-pane scrolling before handing focus to a node clipped beyond the map's own bounds`
- `workflow canvas in-process selection and navigation > blocks pre-observer focus and activation when an enclosing host repositions, then restores the same action`
- `workflow canvas in-process selection and navigation > keeps the actual native target and focus indicator at a reduced scale in light`
- `workflow canvas in-process selection and navigation > keeps the actual native target and focus indicator at a reduced scale in dark`
- `workflow canvas in-process selection and navigation > keeps the actual native target and focus indicator at a reduced scale in forced`
