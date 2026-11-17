# Analysis fixes 6

Input: one operator decision taken in Phase 2 (decided by the operator, 2026-11-14; evidence
`reviews/phase-2/measure.md`, section "The repeated-Escape limit with a vetoing host", commit 2c7aff9). Only design
artifacts were changed; no source code, test or story was written, no task was renumbered and none was marked done.

| ID | Resolution | Where |
|----|------------|-------|
| Repeated Escape under a veto when slotted content stops Escape's propagation (matrix row "Escape with slotted content", veto then Escape twice) | decided: in Chromium the first vetoed cancel sequence in a page holds the veto on both presses (a plain native `<dialog>` too); every later sequence in the page gives a non-cancelable second `cancel` and the platform closes the dialog; input between the presses changes nothing. The row now runs, in the same page and before its own presses, one unasserted warm-up sequence on a stand-in native `<dialog>` (`showModal()` after a click, a button that stops Escape's propagation, `cancel` vetoed, Escape twice), then asserts: first Escape, exactly one `…-close-request` with reason `escape`, dialog open and `:modal`; second Escape with nothing between, `…-close` with reason `host` and focus on the opener. Both harnesses. The stated limit keeps "can close" and adds the platform fact that the first vetoed sequence in a page may hold the veto on a second press as well. | spec.md Operator decisions in Phase 2, Edge Cases "Repeated Escape with a veto"; research.md R-02 (`cancel`, new Measured bullet); plan.md decision 4, decision 23, Risks "Slotted widgets that stop Escape"; contracts/checks.md § Dialog "Escape with slotted content"; contracts/elements-overlays.md § Platform behaviour the README states; tasks.md T015, T019 |
