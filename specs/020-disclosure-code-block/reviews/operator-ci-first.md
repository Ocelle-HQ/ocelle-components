# Operator decision: CI-first and path redaction (2026-11-20, human:jeroennouwsdev)

Relayed by the orchestrator session as a standing operator decision (the repository is public, CI minutes are free)
and confirmed by the operator in this session ("Confirm both"):

- **CI-first.** Locally each phase runs only the fast gates (typecheck, lint, style-lint, test-lint, manifest,
  config-copies, csp, prefix, signoff), `pnpm run gate:plants -- --affected <phase base>`, and the browser and visual
  tests the phase changes. Multi-hour full local plants, full visual and full mutation runs are left to CI's required
  checks, which decide before any merge. Each phase review records what ran locally and what is left to CI.
- **No sandbox paths** (`/root/…`, `/home/user/…`) in new committed logs or records: they are redacted to a
  placeholder (op 023, #60, cleans the existing ones on `main`).

Effect on tasks.md: T013, T033 and T041's local gate lists are read with this decision; their heavy gates are CI's.
