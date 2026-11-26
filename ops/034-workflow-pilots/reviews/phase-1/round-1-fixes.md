# Phase 1 fixes for round 1

| Finding | Resolution | Red evidence | Where |
|---|---|---|---|
| R1-01 | fixed | Two assertion failures for repeated identities with equal and conflicting statuses. | `gates/bin/mutation-config-shadow.ts` |
| R1-02 | fixed | Earlier failed attempt changes the total cost, and missing retry time is rejected. | `gates/bin/mutation-config-shadow.ts` and `.github/workflows/mutation-config-shadow.yml` |
| R1-03 | fixed | The real seeded mutation runs all exit 1. The split retains both survivors. | [Seeded failure parity](seeded-failure.md) |
| R1-04 | fixed | Seven assertion failures for missing, invalid, drifted or misbound tool observations. | `.github/workflows/ci.yml`, `gates/bin/evidence-reuse-shadow.ts` and the runtime tooling |
| R1-05 | fixed | A tracked snapshot removed under its still-valid descriptor requires an exact path and exit 1. | `tooling/speckit/bin/component-preflight.ts` |
| R1-06 | exact hosted verification due | All 326 affected Plants selected at the phase base. | [Plants record](plants.md) |
| R1-07 | exact hosted verification due | The normal plan selects 16 shards. Approval requires the standard complete hosted mutation result. | [Pilot readiness](pilot-readiness.md) |
| R1-08 | checkpoint note | The first benchmark uses the pinned #87 split. Reassess a live #86 mixed scope after #89. | [Implementation plan](../../plan.md) |

The joined tests-only commit `b3ab5005` produced 12 assertion failures. The canonical replay at `ca8c21aff14c58e75ccfd2f417e5a222ebf3206f` preserved the 98 original and 12 review-fix assertions. All 162 focused tests passed. Typecheck, config copies, Sign-off and Sandbox paths passed. [Replay](tdd-check.json)

Retry-inclusive sample runner time uses actual earlier job durations. The report also itemizes the common runtime pin job and availability of the comparison job's finished duration. The exact Visual job records execution before and after capture. Reuse is ineligible for a missing or inconsistent observation, including unchanged reported versions with altered executable hashes. The collector's local test used real OCI bytes and an official runner inventory with synthetic candidate and job metadata. Hosted runtime evidence and comparative performance are pending.
