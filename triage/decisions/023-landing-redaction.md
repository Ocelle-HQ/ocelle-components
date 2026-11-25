# Operator decision: op 023, redaction at landing (2026-11-20)

Raised by the orchestrator session: branches in flight (missions 018, 019, 020, op 022 / #57, #54) carry sandbox
paths in reviewer-written records, which the run rules forbid a mission to edit, so the `sandbox-paths` gate fails
them at landing.

Choice: **a sanctioned redaction step.** `/ocelle-land` runs this op's redaction script
(`tooling/speckit/bin/redact-sandbox-paths.sh`) on the merged tree as a commit of its own. A check proves that the
commit's diff only replaces matched prefixes with the three placeholders (`<pnpm store>`, `<repo>`, `<home>/`), and
that commit does not count as editing a review, verdict or check file.

Not chosen: exempting `reviews/` from the gate; redacting on each mission branch before landing.

Source: the operator (jeroennouwsdev), answered at a gate of the /ocelle-run session for #60.
