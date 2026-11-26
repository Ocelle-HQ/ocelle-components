# Feature Specification: Phase replay and review handoffs

**Input**: [Issue #96](https://github.com/Ocelle-HQ/ocelle-components/issues/96), [Issue #97](https://github.com/Ocelle-HQ/ocelle-components/issues/97), [Workflow diary](../../knowledge/speckit-flows/log.md)

## User Story 1 — Maintain a phase through review

A maintainer can integrate main, diagnose broken checks and verify role and Storybook handoffs without losing evidence from the phase.

1. **Given** a test added by main and a shared test edited by both main and the phase, **when** replay verifies the integrated branch, **then** it selects the phase's assertions, proves their red and green behavior and retains the original red records.
2. **Given** an incomplete shard and a runner error, **when** the check fails, **then** the report identifies each missing or unexpected project/file pair and the runner error.
3. **Given** a role return that stages or commits a forbidden change, **when** the scope guard runs, **then** it identifies the forbidden paths and stops an action chained on success.
4. **Given** a planned Storybook story, **when** ownership and verification are recorded, **then** the story, inventory checks, baselines and affected Plants each have an owner and any no-action gesture check proves that the intended target received the gesture.

## Requirements

- **FR-001**: Verify an exact integrated-main pin, keep historical records, preserve branch changes in shared test files, and fail if an integrated replay cannot be constructed.
- **FR-002**: Preserve failed shard verdicts while exposing bounded diagnostics and their artifacts. Check the required names from the tested candidate's registry, including Plants, on the complete hosted run.
- **FR-003**: Fail closed on out-of-scope paths and Git inspection errors, including rename sources and destinations and paths that require JSON escaping.
- **FR-004**: Establish Storybook verification ownership and count dependencies while planning. A gesture tested for silence must first demonstrate correct targeting and, where relevant, native capture.
