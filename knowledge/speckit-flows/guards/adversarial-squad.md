---
type: Guard
title: Adversarial plan squad
description: Stops a wrong or untestable plan before tasks are generated, by attacking it from four lenses and keeping only findings that survive refutation
tags: [review, adversarial]
generated: { by: claude-code/agent, at: 2026-11-02T14:30:00Z }
status: draft
---

# What it guards against

- A plan that does not meet the spec, or contradicts the constitution or the repository (correctness).
- Accessibility and security defects designed in before any code exists (a11y-security).
- Requirements and tests that cannot fail, which [Vacuous tests](/guards/vacuous-tests.md) would only catch later (testability).
- Whatever no lens was told to look for (fresh), including defects introduced by the fixes.

# Why refute

Lens agents over-report. The refuter re-checks each finding's evidence, so the operator sees only confirmed findings, and forks (more than one valid remedy) come to the operator instead of being decided by an agent.

# Evidence

- 2026-11-02, stubbed engine run: round 1 with four lenses, one fix and one fork; the fork gate asked again after a "decided" with no letter; fix → verify needed two passes; round 2 (fresh) found and fixed one; round 3 confirmed nothing and the squad stopped.

# What to watch

- Refuted share per lens: a lens that is mostly refuted needs a sharper prompt.
- Findings the squad missed that the story reviews found later: a lens gap.
