---
phase: landing
round: 1
verdict: changes_requested
base: ff85ae5676ba52f5312719d5253fd938eac4aa94
head: 05c090a5019e69cb398d6b04c3f3229d9efd58dc
tree: f9ac8a89b280273f02833b816d0f1f3dd9112623
---

# Landing review, round 1

I reviewed the signed #82 integration preview against the recorded `main`. The approved mission's six red commits are reachable from the preview. Phase 0 has its approved setup exemption, and the four behavioral phases have approved verdicts and passing recorded replay. The preview has no hosted run yet.

## Findings

| ID | Severity | Where | Finding | Required change |
|---|---|---|---|---|
| L1-01 | blocking | `packages/elements/src/ocelle-timeline-event.ts:118–139` | A previously rendered event shows stale time after a slotted time changes while the timeline is detached. Reconnecting starts observing future records and leaves the child's existing shadow render in place. FR-023 requires the visible slotted time to take precedence and the attribute to reappear when that slot is removed. The container reconciles on reconnection, so its marker state can reflect newer light DOM than the event's displayed time. | Add red-first phase 2 scenarios that add and remove a slotted time while detached, then reattach and assert the rendered time and list item text agree. Reconcile the event's time slot on connection and preserve the current observer and slot behavior. |
| L1-02 | blocking | `packages/elements/src/ocelle-data-table.ts:17–30` | Caption fallback ignores `hidden` and `aria-hidden="true"` on the caption itself. It filters descendants after starting the walk inside the caption. R-04 and the data-table contract exclude hidden elements and their subtrees from the fallback. An overflowing table continues to expose a named group sourced from the hidden caption. | Add red-first phase 1 cases for toggling both attributes on the caption itself. Exclude the caption root while hidden, retain the overflow Tab stop, and preserve explicit naming precedence and restoration when the caption is shown. |

Both findings reproduced in Chromium against the exact integrated source bundled under the repository's strict CSP. In the first probe a mounted event showed `09:00`. After detaching the timeline, adding a visible `14:20` slotted time, reattaching and waiting two animation frames, it still showed `09:00`. A connected text edit then showed `14:21`. Detaching, removing that slotted node and reattaching left the time box empty. In the second probe a 600 px table in a 200 px host kept `tabindex="0"` and `aria-label="Draft inventory"` on its group after the caption's native `hidden` made its display `none`. Setting `aria-hidden="true"` on the caption also left the fallback name in place.

## Integration evidence

- The preview preserves the native slotted table and uses ordered lists for timeline and evidence-chain items. Marker and connector nodes are decorative, and the components introduce no network call, unsafe HTML binding or CSP exception. The table's overflow logic still owns the region name, Tab stop and keyboard behavior. Block-axis handling is opt-in via the sticky header.
- The package adds five complete standalone entry points and aggregate exports. I verified identical addition of the five declarations in the product manifest and all eight changed fixture manifests, with existing entries and intentional fixture differences preserved. All 96 changed baseline paths are additions. The token plant preserves all 279 prior findings and adds 43 for the new stories. The browser driver retains the existing typed operations while adding scoped accessibility, clipboard and block-scroll helpers. The empty-index fixtures shadow all three component story files without exporting stories.
- I ran a direct check of the mutation classifier against the pinned Stryker report. The shared off-mutant diagnostic returns a cannot-run verdict, and an ordinary on-mutant type error remains counted as a compile error. The changed-file classification still leaves genuine survivors as findings and preserves the 0/1/2 gate contract. The fixture and report tests cover both branches and verify the shared diagnostic is qualified by path, line and code.
- The integration handoff recorded passing typecheck, the 46-element manifest, the 374-story build, targeted axe, story checks and the focused manifest, docs and mutation fixtures. Its initial browser run passed 485 assertions while four setup suites failed at the workspace disk limit. The serial rerun and the full hosted checks remain separate from this verdict. Retain the recorded replay ancestry and rerun focused evidence for both corrections before requesting a resolution-only follow-up review.
