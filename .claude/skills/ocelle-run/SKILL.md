---
name: ocelle-run
description: Run the ocelle-components development flow interactively - triage, then a mission (spec check, plan squad, tasks, analysis) or an op, then test-first implementation by user story with review rounds - delegating every role to its agent profile and taking every loop decision from the flow's scripts. Use when the operator asks to work on issues, start a mission or op, or continue one ("/ocelle-run #4", "/ocelle-run resume").
argument-hint: "<issue numbers> | resume"
user-invocable: true
---

# /ocelle-run

You are the **orchestrator** of the ocelle-components flow in this interactive session. It is the same flow as the
Spec Kit workflows `ocelle-triage`, `ocelle-sdd` and `ocelle-implement` (see `tooling/speckit/README.md`), with
the same commands, scripts and records, but each role runs as a subagent and the gates are questions to the
operator here.

## Input

```text
$ARGUMENTS
```

Issue numbers start new work at step 1. `resume` continues existing work (see "Resume").

## Rules you never break

1. **Delegate every role.** You run `/speckit-specify`, `/speckit-plan` and `/speckit-tasks` yourself (they may need
   the operator), the scripts, and the gates. Everything else goes to its agent profile with the Agent tool:

   | Role | Profile | Scope role for the check |
   |---|---|---|
   | triage | `triage-tara` | `triage` |
   | spec check, analysis after tasks | `analyst-anouk` | `spec-check`, `analyze` |
   | spec fix, squad fix, op setup | `planner-pim` | `planner` |
   | lens (one call per lens) | `lens-lotte` | `lens` |
   | refute | `refuter-rik` | `refute` |
   | verify | `verifier-vera` | `verify` |
   | implement, fix after review | `implementer-ivan` | `implement` |
   | review | `reviewer-renata` | `review` |

   Give each subagent only what its procedure needs (the phase number, the lens name, operator answers). Never
   pass it your own opinion of the outcome: independence is the point.
2. **Before each delegation**, make sure `git status --porcelain` is empty (stop and ask the operator if not) and
   note `BASE=$(git rev-parse HEAD)`. **After it**, run
   `tooling/speckit/bin/scope-check.sh <scope role> $BASE`. If `ok` is false, delegate the same step once more,
   telling the profile which files were outside its role and that it must undo them; if it is still false, stop
   and ask the operator.
3. **Loop decisions come from scripts**, never from your judgement: the JSON of `spec-status.sh`, `status.sh`
   (squad), `analysis-status.sh`, `units.sh`, `tdd-check.sh`, `verdict.sh` and the triage `status.sh`. If a script
   fails or its JSON is not what this skill expects, stop and tell the operator.
4. **Caps:** three spec checks; three squad rounds; three fix → verify passes per squad batch and three review
   rounds per story batch; five batches at most. Count them from the record files, not from memory.
5. **Gates are the operator's.** Ask with AskUserQuestion, with exactly the options named below, a summary that
   stands on its own, and the record path. Every question to the operator is multiple choice (AskUserQuestion
   always offers "Other" for a free answer): turn an open question from a profile into 2-4 concrete options. Never answer a gate yourself, never skip one, never treat silence as
   approval.
6. **Push the feature branch after each step**, so no work is lost: when a step's commits are in (a profile's,
   yours or a script's) and `git status --porcelain` is empty, run `git push -u origin <feature branch>`. Never push
   to `main`, never force-push without the operator's explicit approval, and never push with uncommitted or
   in-progress work from a running profile. Pull-request CI runs only on `pull_request`, so a branch push starts no
   CI. Profiles do not push; only you do. Beyond pushing, never touch GitHub (no comments, labels, state changes or
   pull requests). Never edit a review, verdict or check file a profile wrote. The only records you write yourself
   are the operator's decisions (named below), each committed alone.

Script locations: `S=.specify/extensions/story/scripts`, `Q=.specify/extensions/squad/scripts`,
`T=.specify/extensions/triage/scripts`.

## 1. Triage

1. Delegate to `triage-tara` with the issue numbers. Scope check `triage`.
2. Run `$T/status.sh`. A `decision` of `missing` or `invalid`: stop.
3. **Gate "triage"**: show decision, target, issues in and out of scope, semver and the record path. Options:
   `approve`, `reject`. Then run `$T/decide.sh approved` or `$T/decide.sh rejected` (it records your answer's
   source, the operator, in the record and commits it). Rejected: stop.
4. Route on `decision`: `mission` → 2; `op` → 3; `fold` → tell the operator which feature's spec must grow (from
   the record) and stop; `none` or `decision-needed` → report and stop.

## 2. Mission

1. **Specify.** Run `/speckit-specify` with the record's `spec_prompt`. Then run `$T/link.sh`: it writes
   `<feature dir>/triage.ref` and commits it. Code commits are blocked by the repository's hook until this link
   points at an approved record. If `link.sh` fails, stop.
2. **Spec check**, up to three checks:
   - delegate "spec check" to `analyst-anouk`; scope `spec-check`; run `$Q/spec-status.sh`;
   - if the check has operator questions, ask them now (see rule 5), before the next spec fix, so the answers go
     into that fix and are covered by a check within the cap;
   - if `blocking > 0` or there were answers, and fewer than three checks exist: delegate "spec fix" to
     `planner-pim` with the answers; scope `planner`; check again.
   - **Gate "spec"**: show verdict, blocking count and any questions still open (ask those too). If the cap is
     reached with blocking findings left, the options are `approve after a final fix` (one more spec fix, no
     further check; the plan squad reads the spec next), `approve as is`, `reject`; otherwise `approve`,
     `reject`. Reject: stop.
3. **Plan.** Run `/speckit-plan` with the spec prompt.
4. **Plan squad**, rounds while the last round confirmed something and the operator did not accept, three at most:
   1. `$Q/round.sh` opens the round and lists its lenses.
   2. Delegate one `lens-lotte` call per lens **in a single message, in parallel** (`lens=<name>`). When all are back,
      scope `lens`.
   3. Delegate "refute" to `refuter-rik`; scope `refute`; run `$Q/status.sh`.
   4. **Gate "forks"** while `undecided > 0`: for each undecided fork in `refute.md`, show its options from the
      Reason column and ask the operator to choose. Write each chosen letter into that row's Decision column and
      commit `refute.md` alone (`docs(plan): operator fork decisions, squad round <R>`).
   5. If `confirmed > 0`, batches of up to three passes: delegate "squad fix" to `planner-pim` (scope `planner`),
      then "verify" to `verifier-vera` (scope `verify`), then `$Q/status.sh`; stop the passes when
      `unresolved == 0`. After a batch with `unresolved > 0`: **gate "squad batch"**, options `more-rounds`,
      `accept`, `reject`; accept runs `$Q/accept.sh` and commits its file; after five batches only `accept`,
      `reject`.
5. **Gate "plan"**: show the squad rounds and their results. Options: `approve`, `reject`.
6. **Tasks.** Run `/speckit-tasks`. Delegate "analysis after tasks" to `analyst-anouk`; scope `analyze`; run
   `$Q/analysis-status.sh`. **Gate "tasks"**: show `present`, the counts per severity and the coverage; say that
   critical findings must be resolved first. Options: `approve`, `reject`.
7. Implement: step 4.

## 3. Op

1. Delegate "op setup" to `planner-pim`. Scope `planner`. If it reports that the work is a mission, stop and tell
   the operator.
2. **Gate "op"**: show `ops/NNN-slug/op.md` and the tasks. Options: `approve`, `reject`.
3. Implement: step 4.

## 4. Implement, by user story

Run `$S/units.sh`. For each unit, in order:

1. Delegate "implement phase N" to `implementer-ivan`. Scope `implement`.
2. Batches of up to three rounds, five batches at most:
   - `$S/tdd-check.sh N` (it writes `tdd-check.json`; do not interpret it beyond reporting it);
   - delegate "review phase N" to `reviewer-renata`; scope `review`; run `$S/verdict.sh N`;
   - `changes_requested`: delegate "fix phase N" to `implementer-ivan` (scope `implement`) and start the next round;
     `approved`: fold the phase (step 3), then the next unit.
   - After a batch without approval: **gate "phase N"**, options `more-rounds`, `accept`, `reject`; accept runs
     `$S/accept.sh N` and folds the phase (step 3); after five batches only `accept`, `reject`.
3. **Fold the phase** once it is approved or accepted (operator decision 2026-11-04: fold during development, not at
   landing), so the branch carries a few commits per phase rather than every step:
   1. Clean tree; no merge commits on the branch (never merge `main` during a run; `/ocelle-land` does that).
   2. `FB` = the latest fold's remap commit (`git log -1 --format=%H --grep='remap evidence SHAs after the history
      fold'`), or the phase's `reviews/phase-N/base.sha` when there is none. Note `OLD=$(git rev-parse HEAD)`.
   3. `tooling/speckit/bin/fold-history.sh $FB <feature-dir> phase-N`. It keeps the base, the scaffold and its
      parent, each red commit and its parent, folds every other commit forward, verifies every tree, remaps
      `base.sha`, `scaffold.sha` and `red-commits`, appends to `reviews/history-map.txt` and commits
      `chore(phase-N)`. Not ok: report its problems and stop; HEAD is back on `OLD`.
   4. `$S/tdd-check.sh N` must report `pass` on the new SHAs; commit its outputs alone
      (`chore(phase-N): red/green check after the fold`).
   5. **Gate "fold phase N"**: show the commit counts (before → after) and ask, multiple choice, for the force-push:
      `git push origin $OLD:refs/heads/archive/<branch>-prefold-phase-N`, then
      `git push --force-with-lease=<branch>:$OLD origin <branch>`; or keep the history unfolded (`git reset --hard
      $OLD`, recorded as the operator's decision). Never force-push without that answer. The archive branch keeps the
      SHAs the review files name; never delete it.
4. When every unit is done: `$S/summary.sh --commit`. **Gate "feature"**: show the summary path and its totals.
   Options: `approve`, `reject`.

## Resume

Work out where the flow stands from the records, in this order, and ask the operator to confirm before continuing:
the latest triage record and its status; `.specify/feature.json` and whether the feature is in `specs/` or `ops/`;
`triage.ref`; the spec checks (`$Q/spec-status.sh`); whether `plan.md` exists; the squad (`$Q/status.sh`, any
`operator-accepted.md`); whether `tasks.md` and `analysis-report.md` exist; `$S/units.sh`. Continue at the first
step that is not complete.

## After a run

Tell the operator the outcome and where the records are. List what the run taught: what misbehaved (a profile
strayed, a script gave something unexpected, a gate was unclear) and what worked. These are notes for the
retrospective, which `/ocelle-land` runs before the hand-off (its step 4.2), once CI has had its say. When the
operator asks for the diary entries at once, write them as that step describes and the landing pass only adds what
landing found. Do not write run metrics by hand; `summary.sh` does that.
