---
type: Finding
title: The analysis was not saved
description: /speckit-analyze only prints its report, so the tasks gate asked the operator to review something that no longer existed
tags: [spec-kit, analyze]
generated: { by: claude-code/agent, at: 2026-11-02T15:00:00Z }
status: deprecated
---

# Observed

2026-11-02, while explaining the gates: `/speckit-analyze` is strictly read-only and prints its report; a workflow command step streams that output to the terminal and keeps nothing. Unless the operator watched the run, the tasks gate pointed at nothing.

# Fix

`speckit.squad.analyze` follows `/speckit-analyze` unchanged and writes `analysis-report.md` with severity counts and coverage in its frontmatter; `analysis-status.sh` feeds them to the tasks gate ([ocelle-sdd](/flows/ocelle-sdd.md) 1.2.0). The file name matches the `analysis_report` artifact kind that kitty-mission-ui already shows. Kept as `deprecated` for history.
