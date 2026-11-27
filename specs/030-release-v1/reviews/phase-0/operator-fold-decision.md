# Operator decision on folding phase 0, 030-release-v1

- **Date:** 2026-11-27
- **Decided by:** human:jeroennouwsdev
- **Context:** phase 0 approved in review round 2. `tooling/speckit/bin/fold-history.sh` refuses a range with merge
  commits, and phase 0 is the merge of `main` (`e0dc73f1`) the operator required before the first red commit; its
  12 first-parent commits are records only.
- **Decision:** keep phase 0 unfolded (no force-push). Later phases fold from their own `base.sha`, which lies after
  the merge, so their ranges hold no merge commit.
