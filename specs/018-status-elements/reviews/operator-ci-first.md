# Operator decision: CI-first local gates and path redaction

Decided by human:jeroennouwsdev, 2026-11-20 (relayed by the orchestrator session, confirmed here). The repository is
public, so CI minutes are free. For the rest of 018:

- **Local gates**: only the fast gates (typecheck, lint, style-lint, test-lint, manifest, config-copies, csp, prefix,
  signoff), `gate:plants -- --affected <base>` (recorded per `operator-plants.md` when it selects every plant), and
  the browser or visual tests the phase changes. No multi-hour full local plant or visual runs; CI's required checks
  decide the rest before any merge.
- **Logs**: new logs and records do not contain local sandbox paths (`/root/…`, `/home/user/…`); they are redacted
  to a placeholder (op 023, #60, cleans up existing ones on `main`).
