# Squad round 2: fixes 2

Applies the unresolved row of `verify-1.md`.

| ID | Resolution | Where |
|----|------------|-------|
| PLAN-FRESH-2-002 | fixed | spec.md FR-008 *Live host role at runtime*: a change of the host role to `alert` (from `status`, or added on a notice with `announce`) is now the exception carried by the platform's alert event (FR-009), writes no copy, takes the current text and assertive politeness as baseline and counts zero live-region announcements whatever the baseline politeness; only `alert` to `status`, adding `status` and removing a live role announce with the new politeness, matching FR-009, SC-002, US1-15 and the data-model alert path row. contracts/testing.md: the snapshot gains `hosts: { host; role }[]`, read from the same `getFullAXTree` result as `regions` (not read by `announcements()`), and `hostRole(id)` reads the `hosts` entry of the final snapshot `stop()` returned; research.md R-01 records the host roles in each snapshot |
