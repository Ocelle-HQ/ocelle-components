# Squad round 2: refute

| ID | Verdict | Kind | Decision | Reason |
|----|---------|------|----------|--------|
| PLAN-FRESH-2-001 | confirmed | fix | - | The scroller puts the default slot inside an intrinsic max-content track and exposes no styling part for that track. Wrapping the slotted choices alone therefore does not constrain their width to the visible area. Bound the slotted group from the available width outside the track in reflow mode, account for the track's focus clearance, and verify the inner scroller fits and all choices remain reachable at both reflow settings. |
