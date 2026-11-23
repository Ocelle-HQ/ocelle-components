# Tasks: Shorter phase verification and parallel Unit tests CI

## Phase 1: Verify one change quickly and run the complete CI suite in parallel

### Tests first

- [X] T001 [US1] Add automated tests for focused red and green replay, actual assertion vs unrelated/missing/setup failures, base and scaffold proof, and resume reuse or invalidation.
- [X] T002 [US1] Add automated tests for full inventory partitioning and strict Unit tests aggregation, including duplicate, missing, skipped, failed, wrong-revision and malformed outcomes. Commit the tests alone and record assertion failures with their exact commands.

### Implementation and verification

- [X] T003 [US1] Implement focused selection, classified evidence and resumable sub-checks in the story tools. Preserve reviewer and folding compatibility and align the installed and source copies.
- [X] T004 [US1] Implement a complete Vitest shard plan, isolated execution and required Unit tests verdict. Keep the normal full-suite command and existing other required gates.
- [X] T005 [US1] Run the focused tests and applicable lint, typecheck, plant and mutation checks. Compare full and sharded runs of one revision and record their test inventory, result parity and timings before relying on the new required check.
- [X] T006 [US1] Document use at phase review and on the final merge candidate. Record what CI proved and collect the #74 pilot measurements when that mission reaches verification.
