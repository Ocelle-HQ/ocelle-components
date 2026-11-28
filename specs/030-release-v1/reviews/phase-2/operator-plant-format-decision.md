# Operator decision: plant format additions in phase 2 (030)

Asked by the run, answered by the operator (multiple choice), 2026-11-28.

Phase 2's red commit relies on two plant-format choices that plan.md does not name:
1. A new `plant.json` key, `args`, whose items are appended to the plant command. Plants need it to pass `--tag`
   (fail-tag-mismatch, fail-unreleased-not-empty).
2. The plant judge reads a `<commit>:<path>` finding location (the release-readiness `secret` rule) as
   `commit:<n>:<path>`, because commit hashes change on every plant build.

**Options asked:** accept both / have the planner write them into plan and contracts first.

**Decision: accept both.** The green commit documents both in spec 001 `contracts/plants.md`, as part of FR-044's
amendment of that contract.
