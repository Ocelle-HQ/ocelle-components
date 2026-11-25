---
phase: 3
round: 1
verdict: changes_requested
base: 5cd17445bbe9cad02200548885d1e15ddfbc946a
head: 760f2ec592040dfdd11c3921d51f2911066f73f2
tdd_check: pass
---

# Phase 3 review, round 1

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | `packages/elements/src/ocelle-workflow-node.ts:100` | The slotted status rule overrides a host child's native `[hidden]` styling. On the exact built candidate, `<span slot="status" hidden>Hidden draft status</span>` had `display: block` and a visible rectangle. Its text also appeared in the native button's computed accessible description. A plain hidden span in the same page had `display: none` and zero rectangles. The component must honor the host's visibility decision for optional status. | Add a red-first regression for the host-supplied status being hidden, revealed and hidden again. Assert both its rendered visibility and the button's actual computed description at each step, preserving the built-in description and host context. Preserve native hidden styling in the slot rule. |

## Test quality

- The test-only red `ef5acce09c4e715ddc20e973003be87673937a4a` reached four distinct missing-slot assertions. Final tests reproduced them on the phase base, and the candidate passed the four focused files. The unchanged repeat reused all three stages in 1.291 seconds with the same selected identities. The added token-sheet setup is scoped to the inspection tests and retains the red assertions. [Replay report](tdd-check.json)
- Both inspection suites exercise the actual named slot, the computed name and description, and status addition, replacement, text edits, emptying and removal. They retain pointer, Enter and Space selection, verify passive clicks request no selection, and compare the host's original step and outcomes. Separate probes rejected a renamed slot and a slot moved into the button. The current cases omit a host child with native `hidden` state. [Implementation evidence](implementation.md)
- The deferred axe and visual integration changes update exact aggregate counts. The existing manifest overlays retain their planted faults and key order. The one additional token Plant difference matches the new light inspection capture, and its dark capture matches the baseline.

## Checks run

- The strict-CSP Chromium probe reproduced R1-01 on the exact candidate. Restricting the slotted CSS rule in the scratch browser to visible children restored `display: none` and removed the hidden status text from the description. Revealing the same child restored the status text and display. Hiding it again removed both. The built-in description and external host description remained present throughout, with no CSP, network or console findings.
- The synthetic hosted merge `11c2dedac45549219667bfdf0e5b336b7e754646` and this head have identical trees. Required Unit tests and their deferred-file artifacts, visual, accessibility, strict mutation and Plants results still need to be verified for the corrected candidate. T013 remains open.

## Earlier findings

This is the first recorded Phase 3 review.
