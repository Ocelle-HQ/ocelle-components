---
type: Experiment
title: Spec Kit as the process for this repository
description: Can Spec Kit plus the story loop match Spec Kitty's implement-review discipline on a real component library
tags: [spec-kit, spec-kitty, comparison]
generated: { by: claude-code/agent, at: 2026-11-02T14:00:00Z }
status: draft
sources:
  - id: adr-0079
    resource: https://github.com/Ocelle-HQ/docs/blob/claude/kitty-ui-speckit-decouple-x3prkx/docs/adr/0079-ocelle-component-library.md
    title: ADR-0079, Ocelle component library
---

# Hypothesis

GitHub Spec Kit 1.2.5, extended with the [story extension](/flows/story-extension.md), gives this repository the same discipline Spec Kitty gives the other repositories: independent review per unit of work, test-first evidence and an operator in the loop.[^adr-0079]

# Measures

From the [run summaries](/runs/), per feature: review rounds per phase, blocking findings per round and their kinds, phases that needed a second batch, accepted phases, TDD check failures, disputed findings.

# Baseline

None yet. The first feature (the test tooling and design tokens, issues #4 and #5) is the baseline.

# Result

Open.

[^adr-0079]: ADR-0079, Ocelle component library
