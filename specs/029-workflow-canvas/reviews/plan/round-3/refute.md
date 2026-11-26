# Squad round 3: refute

| ID | Verdict | Kind | Decision | Reason |
| --- | --- | --- | --- | --- |
| PLAN-FRESH-3-001 | confirmed | fix | - | The plan refreshes eligibility on render, resize, viewport updates and enclosing scroll. Its live handoff check only runs for programmatic focus. I reran the strict-CSP probe on pinned Chromium 156. Moving the pane changed the action's right edge from 200 to −250 CSS pixels and the intersection ratio from 1 to 0. Resize and scroll observations remained unchanged, and native Tab focused the hidden action. In a second run, feeding the intersection signal into inert state skipped that action, then restored the same action to Tab when the pane returned. This closes a missing trigger for the existing eligibility rule. It requires no product choice. Retain live eligibility checks before handoff and selection forwarding, and cover both directions of the host-only move. |
