---
type: Spec Kit Extension
title: squad extension
description: Commands and scripts for the spec check and the adversarial plan squad
resource: /tooling/speckit/extensions/squad/extension.yml
tags: [spec-kit, extension]
version: 1.1.0
generated: { by: claude-code/agent, at: 2026-11-02T14:30:00Z }
status: draft
---

# Commands

| Command | Writes | Changes artifacts |
|---|---|---|
| `/speckit-squad-spec-check` | `reviews/spec/check-K.md` | no |
| `/speckit-squad-spec-fix` | `spec.md`, `check-K-fixes.md` | spec only |
| `/speckit-squad-lens lens=<name>` | `round-R/lens-<name>.yaml` (not committed) | no |
| `/speckit-squad-refute` | `round-R/refute.md`, commits the round | no |
| `/speckit-squad-fix` | spec and design artifacts, `fixes-K.md` | yes |
| `/speckit-squad-verify` | `round-R/verify-K.md` | no |
| `/speckit-squad-analyze` | `analysis-report.md` (the `/speckit-analyze` report with severity counts in frontmatter) | no |

# Scripts

`spec-status.sh`, `round.sh`, `status.sh`, `accept.sh`, `analysis-status.sh` (reads only the report's frontmatter); they read the markdown tables (first cell a `SPEC-` or `PLAN-` id).
