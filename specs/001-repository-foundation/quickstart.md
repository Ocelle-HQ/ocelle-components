# Quickstart: validating the repository foundation (001)

Prerequisites: Node 26.13.0 and pnpm 12.16.1 (from `.node-version` and `packageManager`), git.

1. **Install (online, once per machine)**: `pnpm run setup:online` → succeeds; `git status --porcelain` prints
   nothing (US1-1).
2. **Offline setup in a fresh worktree**: `git worktree add /tmp/wt HEAD && cd /tmp/wt && pnpm run setup:offline`
   with the network off → succeeds, no change (US1-2). The failure cases (US1-3) are automated: the
   `setup-offline` tests run it against an empty store and browser path with the registry pointed at a local socket,
   and assert exit 2, the message and zero connections (research.md R-04).
3. **Tests**: `pnpm test` → exit 0, all five projects reported (`tokens`, `styles`, `elements`, `gates`,
   `gates-integration`), including the Chromium-only sample test (US1-4,
   US1-6); `PLAYWRIGHT_BROWSERS_PATH=/nonexistent pnpm test` → exit 2 naming `pnpm run setup:online` (US1-9).
4. **Every gate**: `pnpm run gate:<id>` for each id in contracts/gate-cli.md → exit 0 on the clean tree
   (`gate:mutation` as in step 6).
5. **Plants**: `pnpm run gate:plants` → exit 0, reporting the registry check and every gate with its fail, pass and
   breaking plants caught, accepted or reported broken (SC-002, SC-004). Temporarily break a gate (for example
   empty its rule list) → the plant job exits non-zero naming that gate and the plant whose findings differ.
6. **Mutation**: `pnpm run gate:mutation -- --base HEAD` → "nothing to mutate", exit 0 (US2-5);
   `pnpm run gate:mutation -- --base HEAD --plan` → zero shards.
7. **Clean tree**: after steps 1 to 6 and `pnpm -r build`, `git status --porcelain` prints nothing (`.gitignore`
   covers `node_modules/`, `packages/*/dist/`, Stryker and Vitest output), and the CSP plants' `dist/` files are
   still tracked (`git ls-files gates/plants/csp` lists them).
8. **Story workflow**: on phase 2, the demo phase, `.specify/extensions/story/scripts/tdd-check.sh 2` →
   `status: pass`, never `unavailable`, with `final_tests_on_scaffold_exit` non-zero (the final tests fail against
   the scaffold, not only against the base) (SC-003); phase 1 reports `exempt`; `pnpm run gate:config-copies` →
   exit 0.
9. **Governance**: `pnpm test` includes `gates/test/governance.test.ts` (SC-006); read `SECURITY.md` and
   `.github/CODEOWNERS`.

Steps 10 to 13 need a pushed branch and an open pull request, so only the operator makes them, after phase 5 is
reviewed (agents cannot push, open pull requests or call `gh api`). Each result, with its evidence, is recorded in
`specs/001-repository-foundation/verification.md` (plan.md § Verification).

10. **CODEOWNERS on GitHub (operator)**: with the file on the pull request branch, GitHub reports no CODEOWNERS
    errors (`gh api repos/Ocelle-HQ/ocelle-components/codeowners/errors?ref=<branch>` returns an empty `errors`
    list) and `@MOES-Media` is a user or `@org/team` with write access to the repository. If not, the operator
    names a replacement owner (research.md R-17).
11. **CI (operator)**: open a pull request touching only a Markdown file → all twelve checks green (US3-1); the cold
    run's install plus tests stay under 5 minutes (SC-001, timed once).
12. **Mutation bound (SC-005, operator)**: on the feature's pull request, record the duration of every
    `mutation-shard` job; each passes within its 10-minute limit on this feature's real shards (research.md R-08).
    The pull request runs before `cache.yml` has ever run on `main`, so these jobs start cold (no store or browser
    cache) and include the online setup; a cold shard within the limit meets SC-005, whose precondition is the
    caches restored. Compare with the local shard timings recorded in the phase 3 and 4 reviews
    (`reviews/phase-<N>/mutation-shards.md`). If a shard exceeds the limit only because of the cold setup, the
    operator records that in `verification.md` and decides how to proceed (for example merging `cache.yml` first in
    a separate pull request and re-running). After the merge, confirm that `cache.yml` ran on `main` and saved both
    caches, and that the next pull request's jobs restore them.
13. **Required checks (operator)**: configure a ruleset (or branch protection) on `main` that requires the twelve
    check names of contracts/ci-checks.md, the same list as `gates/README.md`; record the ruleset in
    `verification.md`.
