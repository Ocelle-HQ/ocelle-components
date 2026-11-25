# Squad round 2: verify 1

| ID | Status | Reason |
|---|---|---|
| PLAN-FRESH-2-001 | resolved | `contracts/workflow-node.md:20–24` distinguishes editing a mounted target from replacing that target. The host inserts the replacement, removes the corresponding reference attribute, lets the node update, then reapplies the reference. `spec.md:43,76` requires updated context and preservation of the built-in title and state. `plan.md:35` and `quickstart.md:15` verify the actual button’s computed name and description after in-place edits, clearing, and reapplying the original references to same-ID replacements. The plan also assigns refresh coverage to `elements`, which Stryker runs for changed element code, while the separate `elements-browser` fixture verifies the built package under strict CSP. |

An independent pinned Chromium probe used a generic shadow button and the repository’s lookup and element-reference pattern. Editing the original targets updated both computed values without an attribute change. Replacing the targets under the same IDs removed their context until refresh. Clearing and waiting preserved the built-in title and description. Reapplying the original ID strings added the replacement text and left the old context absent. The same native button was observed throughout. Implementation and hosted checks remain delivery steps.
