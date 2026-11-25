# Phase 6 operator decisions

## Decision 1 — naming ocelle-link (T090 stop condition, R-08)

- Date: 2026-11-16
- Operator: human:jeroennouwsdev
- Context: the T090 spike (reviews/phase-6/spike.md) found that a host `aria-label` on `ocelle-link` exposes two named nodes in Chromium 153 under every measured form. The only one-node form that keeps the focused node a link removes the host attribute, which mission 005's rule forbids.
- Options: (a) move the host label to the anchor and remove it from the host; (b) keep R-08 and accept two named nodes; (c) name from a new `label` attribute/property, as ocelle-tabs does; (d) name from text only.
- Answer: **(c)**. `ocelle-link` gets a `label` attribute and property (not reflected, trimmed) that the element sets as the anchor's `aria-label`. The host `aria-label` is not forwarded and the element writes no host attribute. FR-045, US5-8, research R-08, contracts/elements.md, the manifest and plan decision 7 are amended to match. The constitution III exception in plan.md Complexity Tracking extends to `ocelle-link`, with the same sunset as for `ocelle-tabs`.

## Decision 2 — US5-13 and the Meta key (review round 1, R1-01)

- Date: 2026-11-17
- Operator: human:jeroennouwsdev
- Context: on Linux Chromium a native link follows a Meta-click (and Meta+Enter) in place, so US5-13's "does not navigate in place" cannot hold for Meta while FR-046 (default left alone) stands.
- Options: (a) for Meta the spec states only the element's part; (b) as (a) plus asserting the in-place navigation on Linux; (c) Meta a modifier on macOS only, with platform detection; (d) block the default for Meta.
- Answer: **(a)**. For Meta, US5-13 states only the element's part: no event, default untouched; what follows is the platform's behaviour. The fixture body adds Meta+Enter with `href`, and the README sentence about "a new tab or window" is corrected for Meta.

## Decision 3 — data-model.md § "Link state" (review round 1, R1-02)

- Date: 2026-11-17
- Operator: human:jeroennouwsdev
- Answer: **add it**. The planner adds the `label` row and the sentence that a host `aria-label` is not an input, as in the tabs section.

## Decision 4 — axe incomplete on a link wrapped onto two lines (review round 1, R1-03)

- Date: 2026-11-17
- Operator: human:jeroennouwsdev
- Answer: **README and record**. The link README states the limitation (axe-core 4.14.0 reports a `color-contrast` incomplete, `bgOverlap`, for slotted link text on exactly two lines; the colours pass the contrast gate). An upstream axe-core report to file is recorded in the phase notes; it is not filed from this run.

## Decision 5 — R4-01, the plant run's base for fix-3

- Date: 2026-11-19
- Operator: human:jeroennouwsdev
- Context: phase 6 review round 4 (`reviews/phase-6/round-4.md`) found R4-01 blocking. fix-3's plant run was recorded with `--affected ca18374^` (0 of 314 plants, exit 0), as T115 step 5 said. The procedure requires `base.sha` (ac2eebe), which selects all 314 plants because the landing merge ac2f991 lies in the range. This is the same conflict as phase 7's R3-01, settled by phase 7 decision 3.
- Options: same as phase 7, where one full run after the second merge of main covers this phase too; a full run on the current head now.
- Answer: **"Same as phase 7 (Recommended)"**. The round-scoped run is accepted for fix-3, and R4-01 is closed by this decision. The one full plants run against the phase base, on the head after the second merge of main and before hand-off, covers phase 6 as well as phase 7. It is recorded in `reviews/phase-6/plants.md`, `reviews/phase-7/plants.md` and the landing records.
