# Verification: 001-repository-foundation

The operator's GitHub-side checks (plan.md § Verification, quickstart steps 11 to 13). The orchestrator drafted
this file from CI evidence on 2026-11-03. An item is done only when it is marked **done** and its evidence is
filled in. The operator signs it off at the end.

Pull request: https://github.com/Ocelle-HQ/ocelle-components/pull/18 (base `main` at `bdb9b70`).

## 1. CODEOWNERS (FR-035, R-17)

- **GitHub accepts the file:** `gh api "repos/Ocelle-HQ/ocelle-components/codeowners/errors?ref=claude/kitty-ui-speckit-decouple-x3prkx"`
  returned `{"errors":[]}` on 2026-11-03.
- **`@MOES-Media` has write access:** `gh api users/MOES-Media` gives `type: User`, and
  `gh api repos/Ocelle-HQ/ocelle-components/collaborators/MOES-Media/permission` returned `permission: admin` on
  2026-11-03 (operator's session).

Status: **done**.

## 2. The twelve checks green (US3 scenario 1)

Run https://github.com/Ocelle-HQ/ocelle-components/actions/runs/41702137380 (head `27e7c22`, the folded history after
the landing pass): conclusion success, 34 of 34 jobs. These twelve checks of contracts/ci-checks.md are green:

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

The helper jobs `Mutation plan` and the 21 `Mutation shard` jobs are green too.

Re-confirmed on head `d22a647` (the verification commit): run
https://github.com/Ocelle-HQ/ocelle-components/actions/runs/41703807884, conclusion success, 34 of 34 jobs, all
twelve checks above present and green.

Status: **done** for `d22a647`. The commit that records this file's results re-runs CI; the ruleset of item 3 makes
the merge wait for its twelve checks.

## 3. Required checks on `main` (operator decision, plan squad round 2)

A ruleset (or branch protection) on `main` must require the twelve check names above, matching `gates/README.md`.
On 2026-11-03, `gh api repos/Ocelle-HQ/ocelle-components/rulesets` returned `[]`: no ruleset existed, and `main` had
no branch protection.

Created on 2026-11-03: ruleset `main-required-checks` (id 26484239,
https://github.com/Ocelle-HQ/ocelle-components/rules/26484239). It targets `refs/heads/main`, is active, and has one
rule, required status checks: the twelve names above, each bound to the GitHub Actions app (integration 15368), not
strict about the branch being up to date. `gh api repos/Ocelle-HQ/ocelle-components/rules/branches/main` reports the
twelve checks.

Status: **done**.

## 4. Timings

### SC-001: cold install plus the full test run, under 5 minutes

These runs start cold:

- `.github/actions/setup` only restores caches, and only `cache.yml` on `main` saves them.
- `main` (`bdb9b70`) has no `cache.yml` yet, so no cache exists.
- The job logs show Playwright downloading Chromium.

Unit tests job https://github.com/Ocelle-HQ/ocelle-components/actions/runs/41702137380/job/126147860082 (head `27e7c22`):

| Step | Time |
|---|---|
| Checkout | 12 s |
| Setup (Node, pnpm, online install, browsers) | 29 s |
| `pnpm run gate:unit-tests` | 151 s |
| Whole job | 197 s |

That is about 3.3 minutes against the 5-minute bound. The first measurement (run 41619235381, head `9140fac`) took
151 s for the whole job; the test count has grown since.

Status: **done**, from CI evidence. Operator: confirm that this measurement stands for SC-001, or time quickstart
step 11 after the merge.

### SC-005: every mutation shard under its 10-minute limit

The shard plan changed during the landing pass (phase 3 rounds 9 to 12): a file over 120 changed lines is cut into
chunks, no shard holds two chunks of one file, and shards stay within 10 entries and 250 lines. `--plan` against
`bdb9b70` gives 21 shards and 14 cuts. Why: under the old whole-file plan the `gates/lib/plant-judge.ts` shard took
9:49 (run 41635769914) and was cancelled after 10:04 (run 41656706363).

Slowest shards on the current plan:

| Run (head) | Slowest | Second | Third |
|---|---|---|---|
| 41671185705 (`a1c7667`) | 8:30 | 7:47 | 7:31 |
| 41690538079 (`c949938`) | 8:39 | 7:59 | 7:58 |
| 41694458359 (`eb2f5dd`) | 8:48 | | |
| 41702137380 (`27e7c22`) | 7:46 | 7:43 | 6:31 |
| 41703807884 (`d22a647`) | 8:54 | 7:44 | 7:38 |

Every shard of every run on the current plan finished. The margin is thin, at 66 s to 134 s (phase 3 notes R11-01
and R13-02). The next lever, if a shard is cancelled again, is a bound on mutants per shard; that needs a spec
amendment.

A cut can drop a mutant whose node spans it, which is an accepted limit (FR-013, research.md R-08).

Status: **done**, with the thin margin recorded as a follow-up.

## 5. Merge method and evidence home (plan.md § Verification item 5)

Squash-merge this pull request (operator decision, landing round 1 note L1-08). The squash commit carries the final
tree; the red/green evidence names commits of the branch. Keep both branches on the remote:

- `claude/kitty-ui-speckit-decouple-x3prkx` (folded, head `27e7c22`): the SHAs in `reviews/phase-N/base.sha`,
  `scaffold.sha` and `red-commits`.
- `archive/claude/kitty-ui-speckit-decouple-x3prkx-prefold` (head `37bfdb7`): the pre-fold commits that older
  review files name; `reviews/history-map.txt` maps them to the folded commits.

Status: **open** until the merge. Operator: squash, and do not delete either branch.

## After the merge

- [ ] `cache.yml` ran on `main` and saved the pnpm store and the Playwright cache.
- [ ] The next pull request restores both caches (quickstart step 12).

## Sign-off

Operator: _pending_
