---
type: Finding
title: Review evidence was left uncommitted
description: The review committed its verdict but not the check results it relied on
tags: [review]
generated: { by: claude-code/agent, at: 2026-11-02T14:00:00Z }
status: deprecated
---

# Observed

2026-11-02: the review command committed only `round-K.md`. `tdd-check.json` and the check and red logs it cites stayed in the working tree.

# Fix

Review and fix commit everything new under `reviews/phase-N/` with their own change (ocelle-components commit 95dafaf). Kept as `deprecated` for history.
