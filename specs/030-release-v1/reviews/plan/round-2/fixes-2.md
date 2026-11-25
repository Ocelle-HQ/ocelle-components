# Squad round 2: fixes 2

| ID | Resolution | Where |
|----|------------|-------|
| PLAN-FRESH-2-002 | fixed | The composite action gets one input, `tag` (default empty): `release.yml`'s `prepare` passes `github.ref_name`, `release-dry-run.yml` passes nothing, and readiness runs `--tag <tag>` only when the input is set. Rule `dry-run-graph` now allows exactly three differences (`release: false`, `check-tag --no-tag`, the absent `tag` input), so the planned pair of files passes it (`pass-repository`); new plant `fail-dry-run-graph-extra-input`. Where: research.md R-10 (composite action input, `prepare` in both workflows), R-13 (`dry-run-graph`); contracts/release-workflow.md § release.yml, § release-prepare, § release-dry-run.yml, § gate; plan.md Phase 3, round-2 decisions; quickstart.md § 3. spec.md Story 3 Independent Test, scenario 7 and Key Entities "Dry-run path" now name the pull request as the only start (FR-027 and the SPEC-1-04 clarification unchanged) |
