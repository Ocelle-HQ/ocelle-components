---
op: 034
triage: triage/034-workflow-pilots.md
issues: [92]
mode_of_work: task_execution
accountable: "human:MOES-Media"
semver: none
status: started
---

# Op 034 — Verification improvements and workflow pilots

## Intent

Measure configuration isolation, make the evidence-only CI trial auditable, and surface component verification work before implementation. Deliver the tooling in one phase and exercise it on the independent #89 and #86 missions in that order.

## Acceptance

1. On the exact folded #87 source, compare one historical mixed Mutation shard with its two configuration-specific subsets. Keep every standard selector, changed line, mutant identity and verdict. Record baseline, elapsed and runner timings by configuration. A missing, incomplete, wrong-revision or mismatched receipt invalidates the trial. A seeded surviving mutant yields matching failure in both arms.
2. Publish an observational receipt on the current candidate for one audited expensive gate, initially Visual regression. A prior success qualifies only when it comes from the same repository and PR's trusted `.github/workflows/ci.yml` and all evidence-only, input, runtime and exact candidate checks pass. Require fresh current Sign-off and Sandbox paths. Reject missing, duplicate or non-green evidence. Required CI runs on both exact heads.
3. Detect a missing or stale manifest overlay and an uncovered Storybook host route before capture or landing. Report the actual fixture and test paths. Exercise the eight real manifest overlays, including the reordered pass case and exact seeded findings. Query retained default Vitest discovery for the declared focused test and require scoped Stryker evidence where a host changes.
4. After each live delivery, record elapsed time to first failure and verified green, compute, failed runs and retries, coverage and verdict parity, preflight misses and rework. Apply and reverify a supported adjustment or record why the workflow should stay as configured before the next ready ticket.

## Constitution principles touched

Principles V and VIII govern Storybook evidence and test-first development. Full protected CI, independent review and signed-off evidence govern every candidate.
