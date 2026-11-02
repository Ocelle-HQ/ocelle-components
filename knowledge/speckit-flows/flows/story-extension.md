---
type: Spec Kit Extension
title: story extension
description: Commands, scripts and configuration behind the per-phase implement, check, review and fix loop
resource: /tooling/speckit/extensions/story/extension.yml
tags: [spec-kit, extension]
version: 1.2.0
generated: { by: claude-code/agent, at: 2026-11-02T14:00:00Z }
status: draft
---

# Commands

| Command | Writes | Changes code |
|---|---|---|
| `/speckit-story-implement N` | red commit, green commit, `red-phase.log` | yes |
| `/speckit-story-review N` | `reviews/phase-N/round-K.md` with the evidence | no |
| `/speckit-story-fix N` | `round-K-fixes.md`, optional `fix-K` red commit | yes |

# Scripts

`units.sh`, `base.sh`, `red.sh`, `tdd-check.sh`, `verdict.sh`, `accept.sh` take the phase as a number and refuse anything else. `summary.sh` writes the feature's run summary into this bundle (`knowledge_dir`).

# Configuration

`story-config.yml`: `test_command`, `setup_command`, `test_pathspec`, `mutation_command`, `knowledge_dir`. Empty until the project has a test runner (ocelle-components issue #4).

# Review record

Everything lands in `specs/<feature>/reviews/phase-N/` and is committed: `base.sha`, `red-commits`, `red-*.log`, `tdd-check.json`, `check-*.log`, `round-K.md`, `round-K-fixes.md`, `tdd-exempt.md`, `operator-accepted.md`.
