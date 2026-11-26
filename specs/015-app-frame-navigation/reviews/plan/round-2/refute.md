# Squad round 2: refute

| ID | Verdict | Kind | Decision | Reason |
| --- | --- | --- | --- | --- |
| PLAN-FRESH-2-001 | confirmed | fix | - | The public `layout` input changes projected regions independently of the measured tier. The focus rules describe tier changes and losing drawer destinations, but give no explicit same-tier settlement when a layout switch hides a focused rail and sidebar destinations survive. Capture focus before changing the projection, preserve surviving focus, and recover into the newly visible destinations, with main or drawer close as appropriate. Cover fixed-width outside and inside the drawer. |
| PLAN-FRESH-2-002 | confirmed | fix | - | The collapsed contract explicitly hides the sidebar's head and footer. The landed sidebar accepts interactive slotted children there, while the current expanded-to-collapsed rule promises unconditional focus retention. Retain focus only on surviving controls and define and verify the fallback when collapse hides the current control. |
