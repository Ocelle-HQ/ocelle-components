---
type: Guard
title: Review escalation
description: What happens when a phase is not approved after a batch of review rounds
tags: [review]
generated: { by: claude-code/agent, at: 2026-11-02T14:00:00Z }
status: draft
---

# Rule

After three rounds without approval the operator chooses:

- **more-rounds**: another batch of three;
- **accept**: `operator-accepted.md` records the accepted round, and reruns skip the phase until a newer review exists;
- **reject**: the run stops.

After five batches (15 rounds) only accept or reject remain.

# What to watch

- How often phases reach a second batch, and why (from the run summaries).
- Accepted phases: each is a place where the reviewer and the implementer disagreed; read them before changing the commands.
