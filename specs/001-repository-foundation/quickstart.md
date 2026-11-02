# Quickstart: validating the repository foundation (001)

Prerequisites: Node 26.13.0 and pnpm 12.16.1 (from `.node-version` and `packageManager`), git.

1. **Install (online, once per machine)**: `pnpm run setup:online` → succeeds; `git status` shows no change (US1-1).
2. **Offline setup in a fresh worktree**: `git worktree add /tmp/wt HEAD && cd /tmp/wt && pnpm run setup:offline`
   with the network off → succeeds, no change (US1-2). Empty the browser cache path and repeat → exits non-zero naming
   `pnpm run setup:online` (US1-3).
3. **Tests**: `pnpm test` → exit 0, all four projects reported (US1-4); `PLAYWRIGHT_BROWSERS_PATH=/nonexistent pnpm
   test` → exit 2 naming `pnpm run setup:online` (US1-9).
4. **Every gate**: `pnpm run gate:<id>` for each id in contracts/gate-cli.md → exit 0 on the clean tree.
5. **Plants**: `pnpm run gate:plants` → exit 0, reporting every gate with its fail and pass plants caught or accepted
   (SC-002, SC-004). Temporarily break a gate (for example empty its rule list) → the plant job exits non-zero naming
   that gate.
6. **Mutation**: `OCELLE_MUTATION_BASE=HEAD pnpm run gate:mutation` → "nothing to mutate", exit 0 (US2-5).
7. **Story workflow**: on a demo phase, `.specify/extensions/story/scripts/tdd-check.sh <N>` → `status: pass`, never
   `unavailable` (SC-003); `gates/bin/config-copies.ts` → exit 0.
8. **Governance**: `pnpm test` includes `gates/test/governance.test.ts` (SC-006); read `SECURITY.md` and
   `.github/CODEOWNERS`.
9. **CI**: open a pull request touching only a Markdown file → all twelve checks green; the cold run's install plus
   tests stay under 5 minutes (SC-001, timed once).
