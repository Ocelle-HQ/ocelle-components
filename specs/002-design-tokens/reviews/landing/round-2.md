---
scope: landing
phase: landing
round: 2
verdict: approved
base: eaf16896ec10affdca24296fc9531fcffc46a8be
head: ea57c958cabcfe3265422051c94ba0d0f62ae826
tdd_check: pass
---

# Landing review, round 2 (PR #19, mission 002-design-tokens, closes #5)

Under the landing stop rule (`.claude/skills/ocelle-land/SKILL.md` § 2.6), this round checks only two things: that
the round 1 blocking findings L1-01, L1-02 and L1-03 are resolved, and that the folds since round 1 (649c433)
regressed nothing. It does not search afresh. `git log 649c433..HEAD` has 31 commits. Outside `specs/` and
`knowledge/` they change 16 files, all from these folds:

- the Node 26 EISDIR test fix, phase 2 rounds 3 to 5 (6e526ac);
- L1-01, phase 5 rounds 3 to 5 (2bf1e4b red, 3659d22);
- the mutation chunk size from 120 to 60, phase 5 rounds 6 to 8 (4aa2637, fc27170 red, 3d9d674, then documentation);
- the skill change eb374b0 (per-phase fold);
- L1-03 (f777e28).

L1-02 (e2a60a5) and the operator decisions are documentation. The operator chose to skip the history fold for this
PR (reviews/landing/operator-decisions.md, 2026-11-04), so the branch keeps every SHA the evidence names.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| L2-01 | note (follow-up) | .claude/settings.json:40-41 (allow); git `remote.<name>.push` | **The exact-match allow rules close L1-03, but git config can still redirect them.** Reproduced on scratch local repositories with git 2.43.0. After `git config remote.origin.push refs/heads/claude/kitty-ui-speckit-decouple-x3prkx:refs/heads/main`, the allowed command `git push origin claude/kitty-ui-speckit-decouple-x3prkx` updates `main` on the remote (`claude/kitty-ui-speckit-decouple-x3prkx -> main`). With a leading `+` in the mapping, it force-updates `main` to an unrelated commit (`+ aaa5b32...bbec407 ... -> main (forced update)`). git applies `remote.<name>.push` to a refspec given without `:<dst>`. This needs a prior configuration change, and this repository has none: `git config --get-regexp` shows no `remote.origin.push`. Setting it through Bash (`git config`) is not allowed, so it prompts. I did not test whether the Edit or Write tool, which `allow` grants without a path restriction, can change `.git/config` without a prompt. This breaks no requirement as the branch stands, so under the stop rule it is a follow-up, not a fold. | Follow-up, offered to the operator: have the ruleset on `main` block direct pushes and force-pushes, which stops every client-side route. Optionally add `Edit(./.git/**)` and `Write(./.git/**)` to `deny`, or make the allowed commands pass `<branch>:<branch>` explicitly (`git push origin claude/x:claude/x`), since an explicit `<dst>` ignores `remote.origin.push`. |

No blocking finding.

## Round 1 blocking findings

### L1-01: resolved

- **Rule.** `recordProblems` in packages/tokens/src/generate.ts:159 adds `token <name>: exempt is allowed only on
  color-disabled-ink` when `contrast.exempt` is set on any other token (`exemptToken`, :63-64). The check is
  `!== undefined`, so an `exempt: false` on another token is rejected too. `validateSource` is shared, so the build,
  style-lint, `contrast` and `brand-rules` all stop on such a source. Only `color-disabled-ink` carries `exempt` in
  `source.ts` (:87-92).
- **Gate.** gates/bin/contrast.ts:52 still reads the flag, but only from a source that passed `validateSource`, so the
  flag can no longer apply to another name in the real gate.
- **Test first.** Red `fix-3` (2bf1e4b, `reviews/phase-5/red-fix-3.log`) added the `validateSource` tests in
  packages/tokens/test/validate.test.ts (a fixture and the real source with `exempt` on `color-ink-muted`). It also
  renamed the fixture token in gates/test/contrast.test.ts:32 to `color-disabled-ink`. The fixture in
  contrast-required.test.ts:80 (`color-d`, `exempt`) is a pure `requiredPairs` input that never reaches
  `validateSource` or a gate. It only shows that an exempt pair is still required, so it needs no rename. Phase 5
  rounds 4 and 5 reviewed the fix, and round 5 approved it.
- **Plant.** `gates/plants/contrast/exempt-not-disabled-ink` is the round 1 reproduction: the `text-below-threshold`
  delta plus `"exempt": true` on `color-ink-muted`. It expects `error` with cause `contrast: cannot run:
  packages/tokens/src/source.ts: invalid token source: token color-ink-muted: exempt is allowed only on
  color-disabled-ink`. `gate:plants` on the head judges it as expected (see Checks run). So the reproduction that
  exited 0 in round 1 now exits 2.

### L1-02: resolved

specs/001-repository-foundation/contracts/ci-checks.md now matches the rest of the repository:

- The first table (:12-27) has 14 rows: the 12 of 001, plus `Contrast` (`pnpm run gate:contrast`) and `Brand rules`
  (`pnpm run gate:brand-rules`) before `Plants`.
- These are the 14 check-job names in .github/workflows/ci.yml (:20-192), besides the helper jobs `Mutation plan` and
  `Mutation shard`.
- The gate-job equality (:48-51) now names the verdict job `mutation`, `gates/gates.json` and `fr020`: thirteen gate
  ids.
- "fourteen" replaces "twelve" in both places (:53-55).
- A dated note (:58-61) tells the operator that the ruleset on `main` must add `Contrast` and `Brand rules`. Until
  then, neither gate blocks a merge.

`gate:plants`, which judges the registry, passes on the head. The ruleset itself is the operator's to change, and
is outside this review.

### L1-03: resolved (residual: L2-01, note)

f777e28 replaced the two prefix allow rules with two exact ones. These are `Bash(git push -u origin
claude/kitty-ui-speckit-decouple-x3prkx)` and `Bash(git push origin claude/kitty-ui-speckit-decouple-x3prkx)`, with
no `:*` and no wildcard. The current branch is that branch, which tracks `refs/heads/` of the same name.

- **Refspec pushes to `main`.** The round 1 forms, `git push -u origin claude/x:main` and `git push
  --force-with-lease=main:<sha> origin HEAD:main`, match no allow rule now, so they prompt. They are also denied
  outright by the new `Bash(git push * *:main)`, `Bash(git push * *:main *)`, the `refs/heads/main` variants and
  `Bash(git push --force-with-lease=main*)`. The deny rules come before any prompt.
- **Force-pushes.** No allow rule matches any force-push: `--force-with-lease` in any form, `--force`, `-f`, or a
  `+` refspec. Each one prompts at least, and `--force` and `-f` are denied. This matches the skills: /ocelle-run
  step 4.3 and /ocelle-land § 2.8.4 ask the operator before the force-push with lease.
- **Compound commands.** These are judged per subcommand, so a push appended after an allowed push still prompts.

So, from the repository as it is, no push and no force-push reaches `main` without a prompt. The one route left
goes through a prior change to git config (L2-01). The ruleset on `main` is the stop that covers every client-side
route.

## Folds since round 1: regressions

- **EISDIR test (6e526ac, phase 2 rounds 3 to 5).** The `loadLists` test now pins `cause.code` `EISDIR`. It also
  pins the full message as the fixed prefix plus the cause's own message (gates/test/token-only.test.ts:295-307),
  instead of Node 22's wording. The test is still exact for a given Node, and it no longer fails on Node 26's
  wording. Phase 2 round 5 approved it. No other test changed.
- **L1-01 (2bf1e4b, 3659d22).** The change is one validation line and one constant in `generate.ts`, a plant and
  the README plant list. `plants-robustness` counts the new plant (31). Phase 5 round 5 approved it with mutation.
- **Chunk size 60 (fc27170, 3d9d674; 4aa2637 and d5cc5e1 documentation).** In shards.ts only `maxEntryLines`
  changed. The 10-entry and 250-line bounds and the same-file rule are unchanged. The contract now agrees on 60
  throughout: 001 FR-013, SC-005, plan.md, research.md R-08, contracts/gate-cli.md and gates/README.md (phase 5
  round 8, approved). CI on 7fb1a86 is the integrated result: 24 shards, all passing, the slowest
  `generate.ts:121-180` in 7:47, inside the 10-minute limit that the 120-line `generate.ts:121-240` shard broke.
- **eb374b0 (skill and `fold-history.sh`).** It adds a `label` argument with a validated pattern, a
  `refs/ocelle/prefold/<label>/<branch>` ref, an appended `history-map.txt` and a `chore(<label>)` remap subject. The
  `--grep` that /ocelle-land § 2.8 uses to find the latest fold still matches it. The script passes `bash -n`. It was
  not run on this branch, because the operator skipped the fold. No package or gate code changed.
- **f777e28 (settings).** Covered under L1-03. No other permission changed.
- **Operator decisions** under reviews/phase-2/, phase-5/ and landing/ are records only.
- **Phase status.** Every phase's last review is `approved`, and every `tdd-check.json` is `pass` (phase 1 a
  justified `exempt`). Phase 5 was re-run at d5cc5e1 in round 8: red phase, fix-1, fix-3 and fix-6 each exit 1, and
  the head exits 0.

## Test quality

The only test changes since round 1 are in the three folds above, each with red evidence. These are phase 2 (CI
runs 41845918777 and 41854105381 on Node 26.13.0, the operator's decision for a wording-only test), phase 5 `fix-3`
(2bf1e4b) and phase 5 `fix-6` (fc27170). `gate:test-lint` passes, so no skip, only or conditional assertion was
added. Mutation was not run, as instructed. CI run 42000934866 on 7fb1a86 ran all 24 shards and they passed, and
nothing after 7fb1a86 changes code.

## Checks run

Node 22.23.4 (the pin is 26.13.0), at ea57c95. That is the docs-only head d5cc5e1 plus the phase 5 round 8 review
commit. Chromium came through `PLAYWRIGHT_BROWSERS_PATH`.

| Check | Result |
|---|---|
| `gate:typecheck` | exit 0: no type error |
| `gate:lint` | exit 0: 156 files, no finding |
| `gate:test-lint` | exit 0: 98 files, no finding |
| `gate:signoff -- --range eaf1689..HEAD` | exit 0: 109 commits, no finding |
| `gate:plants` | exit 0: 177 plants of 13 gates and the registry (176 of round 1 plus `exempt-not-disabled-ink`), every plant as expected |
| `tdd-check.sh 5` (phase 5 round 8) | `pass` |
| L2-01 probe (scratch bare and work repositories) | `remote.origin.push` redirects the exact allowed push onto `main`, and forces it with `+` |
| `git diff --name-only 7fb1a86..HEAD` | spec, plan and review text only |

CI, as passed in: run 42000934866 on 7fb1a86. All 39 jobs pass, including the 14 required checks and 24 mutation
shards. The slowest shard, `generate.ts:121-180`, took 7:47.

## Verdict

`approved`: L1-01, L1-02 and L1-03 are resolved, the folds since round 1 regressed nothing, every cheap gate passes on the head and CI passed on 7fb1a86. There is no blocking finding. One note, L2-01 (git config can redirect the allowed push), is a follow-up to offer the operator, together with the ruleset change of L1-02 (add `Contrast` and `Brand rules`) and a ruleset block on direct pushes to `main`.
