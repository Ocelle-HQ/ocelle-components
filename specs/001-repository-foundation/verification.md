# Verification: 001-repository-foundation

The operator's GitHub-side checks (plan.md § Verification, quickstart steps 11 to 13). The orchestrator drafted
this file from CI evidence on 2026-11-03. An item is done only when it is marked **done** and its evidence is
filled in. The operator signs it off at the end.

Pull request: https://github.com/Ocelle-HQ/ocelle-components/pull/18 (base `main` at `bdb9b70`).

## 1. CODEOWNERS (FR-035, R-17)

- **GitHub accepts the file:** `gh api "repos/Ocelle-HQ/ocelle-components/codeowners/errors?ref=claude/kitty-ui-speckit-decouple-x3prkx"`
  returned `{"errors":[]}` on 2026-11-03.
- **`@MOES-Media` has write access:** not checked yet. The agent proxy refuses the collaborator API. CI runs on
  this pull request list `MOES-Media` as the actor, which suggests write access but does not prove it.
  Operator: confirm and record it here.

Status: **open** (write access to confirm).

## 2. The twelve checks green (US3 scenario 1)

Run https://github.com/Ocelle-HQ/ocelle-components/actions/runs/41619235381 (head `9140fac`): conclusion success.
These twelve checks of contracts/ci-checks.md are green:

1. Typecheck
2. Code lint
3. Style lint
4. Unit tests
5. Test lint
6. Mutation testing
7. Content security
8. Prefix
9. Story config copies
10. Install and pins
11. Sign-off
12. Plants

The helper jobs `Mutation plan` and the 18 `Mutation shard` jobs are green too.

Status: **done** for `9140fac`. Re-confirm on the final head before merge.

## 3. Required checks on `main` (operator decision, plan squad round 2)

A ruleset (or branch protection) on `main` must require the twelve check names above, matching `gates/README.md`.
On 2026-11-03, `gh api repos/Ocelle-HQ/ocelle-components/rulesets` returned `[]`: no ruleset exists yet.

Status: **open**. Operator: create the ruleset and record its name or link here.

## 4. Timings

### SC-001: cold install plus the full test run, under 5 minutes

These runs start cold:

- `.github/actions/setup` only restores caches, and only `cache.yml` on `main` saves them.
- `main` (`bdb9b70`) has no `cache.yml` yet, so no cache exists.
- The job logs show Playwright downloading Chromium.

Unit tests job https://github.com/Ocelle-HQ/ocelle-components/actions/runs/41619235381/job/125860387008:

| Step | Time |
|---|---|
| Setup (Node, pnpm, online install, browsers) | 29 s |
| `pnpm run gate:unit-tests` | 123 s |
| Whole job | 151 s |

That is about 2.5 minutes against the 5-minute bound.

Status: **done**, from CI evidence. Operator: confirm that this measurement stands for SC-001, or time quickstart
step 11 after the merge.

### SC-005: every mutation shard under its 10-minute limit

The SC-005 measurement is run https://github.com/Ocelle-HQ/ocelle-components/actions/runs/41613884529 (head
`e985ed3`). It ran 18 shards, all of which finished. The longest took 8:01: `gates/lib/pins-rules.ts` alone, 137
changed lines. The operator accepted this at the feature gate (phase 4 round 4 note R4-01).

A later run, 41619235381 (head `9140fac`), also passed. Its longest shard was `gates/lib/plant-judge.ts`, 198
lines, at 8:49. That file did not change between the two runs, so the difference is runner variance. The margin is
about 1 minute, so a cancelled shard is to be investigated (R-08).

Status: **done** (operator decision R4-01).

## After the merge

- [ ] `cache.yml` ran on `main` and saved the pnpm store and the Playwright cache.
- [ ] The next pull request restores both caches (quickstart step 12).

## Sign-off

Operator: _pending_
