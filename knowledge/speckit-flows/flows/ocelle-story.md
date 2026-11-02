---
type: Workflow
title: ocelle-story
description: One tasks.md phase - red, green, then batches of checked review and fix rounds with operator escalation
resource: /tooling/speckit/workflows/ocelle-story/workflow.yml
tags: [spec-kit, workflow, review, tdd]
version: 1.1.0
generated: { by: claude-code/agent, at: 2026-11-02T14:00:00Z }
status: draft
---

# Steps

1. `base.sh N` records the commit the phase starts from.
2. `speckit.story.implement`: red commit (tests only, proven red by `red.sh`), then green.
3. Up to five batches; each batch is up to three rounds of:
   - `tdd-check.sh N` (no agent), see [Vacuous tests](/guards/vacuous-tests.md);
   - `speckit.story.review` (fresh agent session, changes no code);
   - `verdict.sh N`;
   - `speckit.story.fix` when changes are requested.
4. After a batch without approval: the gate in [Review escalation](/guards/review-escalation.md).

# Tuning knobs

| Knob | Value | Where |
|---|---|---|
| Rounds per batch | 3 | `max_iterations` of `rounds` |
| Batches | 5 | `max_iterations` of `batches` |
| Check timeout | 3600 s | `timeout` of `tdd-check` |

# History

- 1.1.0: TDD check before every review; batches with the more-rounds choice.
- 1.0.0: implement, then up to three review and fix rounds, then approve or reject.
