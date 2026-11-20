# Squad round 3: refute

| ID | Verdict | Kind | Decision | Reason |
| --- | --- | --- | --- | --- |
| PLAN-FRESH-3-001 | confirmed | fix | - | The state model invalidates pending focus on any later resize, but the plan starts settlement only on effective state change. The overlay keeps closing asynchronously through its exit and dispatches close after native focus restoration, so a second observation in the same tier can cancel shell recovery without replacing it. Keep pending focus across observations that leave its effective target intact. Recompute on a superseding transition and cancel on disconnection or deliberate surviving focus. Add a browser fixture that waits for a same-tier observation during the real drawer exit, then verifies the former destination receives focus. |
