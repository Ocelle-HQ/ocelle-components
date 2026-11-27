---
phase: 1
round: 3
verdict: changes_requested
base: b8f06d5c652aae2c308d0a09f3e991e800138004
head: 85356cda27b761300ae4138ea4419f1a82bd906b
tdd_check: pass
---

# Phase 1 landing findings

The independent landing review reproduced two gaps in the approved workflow contracts. The signed record has the reproductions and the integrated candidate's original checks. [Landing review](../landing/round-1.md)

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R3-01 | blocking | `base.sh` and `gates/bin/story-evidence.ts` | An older shared ancestor can be pinned even after a newer main revision was integrated. That passes while selecting a main-only test. | Require the unique current merge base between HEAD and origin/main at both pin creation and replay. Accept the latest integrated commit if origin/main moves ahead. Prove rejection of a stale pin in both commands. |
| R3-02 | blocking | `gates/lib/test-evidence.ts` | The console truncates each worker error and joins every error. A valid receipt with 1,000 errors prints about 502 kB. | Bound the total runner-error text with an omitted count and direct the reader to the full receipt. Keep inventory diagnostics and write the complete error list to the artifact. |
