# Squad round 3: fixes 2

The one unresolved row of `verify-1.md`, applied to `contracts/checks.md`, `research.md` and `spec.md`.

| ID | Resolution | Where |
|----|------------|-------|
| PLAN-FRESH-3-002 | fixed | contracts/checks.md § US3 US3-8 body (the long-word twins in the 100 px block container and grid track now assert the `.pill` box inside the host and the container, its inline size at most 100 px within 0.5 px; the 150 px row beside "Name" asserts the `.pill` box inside the host; `box-sizing: border-box` removed from the static `.pill` added to its plants, with the probed 126 px and 176 px), § US3 "stretched host" body (the `box-sizing` plant moved to US3-8, which kills it; this body keeps the `inline-size: fit-content` plant); research.md § R-06 "Stretched hosts" (the overflow without `border-box` and which body catches it); spec.md Edge Cases (the stretched-host case cites § US3 "stretched host" instead of US3-8) |

Constitution Check: no row changes. Row VIII (each plant measured and killed) now holds for the `box-sizing` plant.
