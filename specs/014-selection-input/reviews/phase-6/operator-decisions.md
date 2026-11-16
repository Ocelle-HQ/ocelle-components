# Phase 6 operator decisions

## Decision 1 — naming ocelle-link (T090 stop condition, R-08)

- Date: 2026-11-16
- Operator: human:jeroennouwsdev
- Context: the T090 spike (reviews/phase-6/spike.md) found that a host `aria-label` on `ocelle-link` exposes two named nodes in Chromium 153 under every measured form. The only one-node form that keeps the focused node a link removes the host attribute, which mission 005's rule forbids.
- Options: (a) move the host label to the anchor and remove it from the host; (b) keep R-08 and accept two named nodes; (c) name from a new `label` attribute/property, as ocelle-tabs does; (d) name from text only.
- Answer: **(c)**. `ocelle-link` gets a `label` attribute and property (not reflected, trimmed) that the element sets as the anchor's `aria-label`. The host `aria-label` is not forwarded and the element writes no host attribute. FR-045, US5-8, research R-08, contracts/elements.md, the manifest and plan decision 7 are amended to match. The constitution III exception in plan.md Complexity Tracking extends to `ocelle-link`, with the same sunset as for `ocelle-tabs`.
