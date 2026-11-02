---
type: Workflow
title: ocelle-plan-squad
description: Adversarial review of spec and plan after the plan phase - lenses, refute, forks, fix and verify, then fresh-eyes rounds
resource: /tooling/speckit/workflows/ocelle-plan-squad/workflow.yml
tags: [spec-kit, workflow, review, adversarial]
version: 1.0.0
generated: { by: claude-code/agent, at: 2026-11-02T14:30:00Z }
status: draft
sources:
  - id: kmui-squad
    resource: https://github.com/MOES-Media/kitty-mission-ui/tree/main/kitty-specs/artifact-viewer-screen-01M47VP5/reviews
    title: The plan squad of a kitty-mission-ui mission under Spec Kitty (lens, merged, refute, forks, fixlist, verify, fresh files)
---

# Steps per round

1. `round.sh` opens `reviews/plan/round-R/`: every lens in round 1, only `fresh` later.
2. Lenses in parallel (fan-out, four at most), each a fresh session writing `lens-<name>.yaml`.
3. `speckit.squad.refute` writes `refute.md` and commits the round.
4. Forks: gate until every fork has a decision letter.
5. Batches of up to three fix → verify passes; after a batch with unresolved findings: more-rounds, accept or reject.
6. Next round while this one confirmed something (three rounds at most).

# Lineage

Modelled on the squad that kitty-mission-ui's Spec Kitty missions run after plan:[^kmui-squad] lens files, a mechanical merge, refuters, forks held for the operator, a fix list, verify rounds and repeated fresh lenses. Differences: no separate merge file (the refuter reads the lens files directly), and refute and verify are markdown tables so scripts can count them.

# Tuning knobs

| Knob | Value | Where |
|---|---|---|
| Lenses in round 1 | correctness, a11y-security, testability, fresh | `round.sh` |
| Squad rounds | 3 | `max_iterations` of `squad-rounds` |
| Fix → verify passes per batch | 3 | `max_iterations` of `passes` |
| Lens concurrency | 4 | `max_concurrency` of `lenses` |

[^kmui-squad]: kitty-mission-ui artifact-viewer-screen plan reviews
