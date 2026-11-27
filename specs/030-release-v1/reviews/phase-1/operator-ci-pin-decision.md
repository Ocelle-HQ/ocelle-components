# Operator decision: ci.yml blob pin in evidence-reuse-observe (030)

Asked by the run, answered by the operator (multiple choice), 2026-11-27.

**Situation.** `tooling/speckit/bin/evidence-reuse-observe.ts` pins the blob hash of `.github/workflows/ci.yml` for its
audit. Adding the Pack contents job (T019) breaks the pin and `integration/evidence-reuse-observe.test.ts`. US2 and
US3 change `ci.yml` again.

**Options asked:** re-pin per phase / report only and leave the pin failing.

**Decision: re-pin per phase.** Each phase that changes `ci.yml` re-pins the hash in its green commit with a comment.
The reviewer checks that only the intended jobs changed: the visual job, the shared setup and the runtime recorder stay
unchanged. Phase 1 re-pins `6eb0ec30…` to `0b807c71…`. The pin is also reported to the orchestrator as repo-wide
friction.
