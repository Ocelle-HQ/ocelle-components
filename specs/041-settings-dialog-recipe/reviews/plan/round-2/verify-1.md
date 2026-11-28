# Squad round 2: verify 1

| ID | Status | Reason |
|----|--------|--------|
| PLAN-FRESH-2-001 | resolved | The design uses a full-width query container outside the scroller to cap the slotted group's border box, subtracting the track's focus padding at both ends. Group and labels wrap within that cap, so their bound does not depend on the intrinsic track. The contract and quickstart require the inner scroll box to fit and every choice and focus indicator to be reachable without horizontal movement at 320 CSS px and at 200% text. |
