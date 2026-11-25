# Operator decision: CI-first local gating and sandbox-path redaction

Relayed on 2026-11-20 by the orchestrator session as a standing operator decision. The operator confirmed it here as multiple choice ("Confirm both"). It applies from phase 1 review round 2 to the end of mission 019.

## CI-first

The repository is now public, so CI minutes are free.

Locally, run only:
- the fast gates: typecheck, lint, style-lint, test-lint, manifest, config-copies, csp, prefix and signoff;
- `gate:plants -- --affected <base>`;
- the browser or visual tests that the phase changes.

Skip the multi-hour full local plant and visual runs. CI's required checks decide the rest before any merge.

## Path redaction

New logs do not commit local sandbox paths (`/root/…`, `/home/user/…`); each is redacted to a placeholder. Op 023 (#60) cleans up the existing paths on main and adds a check.
