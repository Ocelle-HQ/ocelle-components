---
triage: 015
issues: [35]
decision: op
target: "ops/015-mutation-shard-timeout"
in_scope: [35]
out_of_scope: [1, 8, 9, 11, 15, 16, 20, 23]
semver: none
spec_prompt: "Op for #35 (triage/015-mutation-shard-timeout.md): CI's mutation-shard job limit (.github/workflows/ci.yml, timeout-minutes 10, pinned by gates/test/ci-workflow.test.ts) is raised so that a shard of packages/elements/src source can finish its whole elements dry run (up to 30 minutes under stryker.elements.config.json, mission 008 R-15) plus its own mutants; the shape and value are the ones the operator picks at approval (recommended: 60 minutes for shards whose files name packages/elements/src/, 10 minutes for all other shards), confirmed by a CI measurement of the elements shards' step and job times as #35 asks; red first on the pinned workflow test, 001 FR-013 and SC-005 amended in place with the decision and its evidence, no change to shard split, entry bounds, the gate or either Stryker configuration; must land before mission 009's (#15) pull request."
status: proposed
---

# Triage 015: CI mutation shards time out on the elements dry run (#35)

## Issues read

- **#35**: not read from GitHub. This session has no GitHub access (`gh issue view` uses GraphQL, which the
  session's proxy refuses; `gh api` REST calls were denied by the permission system), and the orchestrator did
  not pass in the issue text. As in triage 007, the scope below comes from the operator's brief and from the work
  the issue refers to:
  - **Operator brief:** the work must land before the first element mission pull request (mission 009, #15). The
    shard split and entry bounds (#23's subject) are out of scope. The context is mission 008's
    `dryRunTimeoutMinutes` 30 in `stryker.elements.config.json` and its reasoning in `specs/008-overlays`.
  - **Branch name:** the working branch is `claude/035-mutation-shard-timeout`.
  - **Source of the risk:** 008 phase 3 review `R1-01` (`specs/008-overlays/reviews/phase-3/round-1.md:21` on
    `origin/claude/016-overlays`): "The `mutation-shard` job has `timeout-minutes: 10` ... Each of those shards
    repeats the whole elements dry run, whatever `--files` names. That dry run measured 5 m 31 s here ... an
    elements shard is likely to pass 10 minutes on a 4-vCPU `ubuntu-24.04` runner. Then the `mutation` job fails
    and the pull request cannot merge." It ends: "Operator: decide before the PR, either by raising the shard limit
    or by confirming with one CI run."
  - **The operator must check** that #35's body asks for this and nothing more (see *What would change this
    decision*).

## Related work found

| Ref | Kind | Relation | Reason |
|---|---|---|---|
| #35 | issue | in scope | This op. |
| `.github/workflows/ci.yml:84-104` (`mutation-shard`, `timeout-minutes: 10` at `:89`) | CI workflow (main) | **changed by this op** | Every shard job, elements or not, is cancelled at 10 minutes. The verdict job `mutation` then fails, and the ruleset requires it. |
| `gates/test/ci-workflow.test.ts:31-49` | pinned test (main) | **changed by this op, red first** | It pins the first 10 lines of the job, including `"    timeout-minutes: 10"`. |
| `specs/001-repository-foundation/spec.md` FR-013 (`:287`), SC-005 (`:515-528`); `contracts/ci-checks.md:40` | spec, contract (merged) | **amended by this op** | FR-013 sets "a job time limit of 10 minutes", and SC-005 says "each shard job's 10-minute limit (FR-013) enforces it" (operator decision, 001 plan squad round 2). Changing the limit amends an operator decision. That is allowed in an op only as a recorded amendment, like 007's amendments of the same FR. |
| `specs/008-overlays` (branch `origin/claude/016-overlays`): plan decision 25, research R-15 (`research.md:693-709`), `reviews/analysis/fixes-8.md:10`, phase 3 `notes.md:76-99`, `round-1.md` R1-01; `stryker.elements.config.json` (+`dryRunTimeoutMinutes: 30`); `gates/test/vitest-config.test.ts:75-86` | mission in progress (#16) | **input; this op blocks its PR** | Operator decision 2026-11-15: only the elements configuration raises Stryker's dry-run limit to 30 minutes; per-mutant limits and `stryker.config.json` stay at defaults. The evidence: the elements dry run runs every in-process `elements` and `elements-touch` test (about 760 browser rows) whatever `--files` names. It took 5 m 31 s and hit the 5-minute default, and the scratch gate runs took about 16 minutes each. 008 kept CI out of its design and left the 10-minute job limit as an open risk for the operator. Its `--plan` gives 12 shards, 6 with elements source, so 008's own PR hits the same limit. |
| Not a **fold** into 008 | | | 008 deliberately leaves CI out of its design ("This phase does not change CI, as the design states"). The operator needs this to land before #15's PR, whichever of 008 and 009 lands first. A fold would tie 009 to 008's landing. |
| #15 (mission 009, branch `origin/claude/015-workflow-layouts`) | element issue, mission in progress | **blocked by this op** (its PR); input | The operator names it as the first element mission PR. Its phase 4 ran each of its 17 `--plan` shards alone on the sandbox: the longest took 292 s (`specs/009-workflow-layouts/reviews/phase-4/plants.md:111-113`). The orchestrator relays that this figure excludes the dry run; `plants.md` itself does not say so. The branch has no `dryRunTimeoutMinutes`, so its own dry run fit Stryker's 5-minute default there. When 008 and 009 are both on main, the dry run holds both missions' rows, and every later element mission adds more. |
| #9, #8 (missions 010, 011) | element issues, missions in progress | out of scope; blocked by this op at their PRs | Same mechanism (008 `research.md:804` lists 009 to 011 as touching shared sources). They benefit from the op and need no change of their own. |
| #23 / PR #25 / `specs/007-mutation-gate-strictness` | mission, merged (`e7d7d54`) | out of scope (operator brief); input | It settled the shard and entry bounds (30-line entries, FR-014/FR-015) and the CI measurement of `source.ts` shards at 480 s or less under the 10-minute limit. This op does not touch the split or the bounds. For non-elements shards, keeping 10 minutes keeps 007's SC-004 meaningful as written. |
| #20 / `ops/004-token-source-mutation` | op, merged (`3a247ef`) | out of scope (done) | Its § CI risk is the history of the 10-minute limit. Nothing here changes. |
| `knowledge/speckit-flows/log.md` 2026-11-04 (CI runners 1.5 to 3.4 times slower than the sandbox), 2026-11-05 (O6-01: a 670 s shard cancelled in CI); `findings/frontend-missions.md` 006 L1-02 (a survivor shows as Timeout under CI load) | diary, finding | applies | Local times do not carry over to CI. A 5 m 31 s local dry run can take about 8 to 19 minutes on a runner, before setup and mutants. |
| `.specify/memory/constitution.md` § Mutation testing (`:133`), VIII | constitution | applies | Changed source must still be mutation-tested. A job limit that cancels the elements shards stops the gate, but raising it weakens no verdict. Per-mutant limits are not touched. |
| `triage/001` to `007`; `ops/004` | earlier records | none to fold into | All are merged. Triage 008 to 014 belong to missions in progress (operator brief), and none of them takes CI. |
| #1 | epic (open) | out of scope | Parent epic. Not known whether #35 has a parent (not read). |
| #11 | issue (open) | out of scope | Release. No published surface changes here. |

## Decision

**op.** One bounded change with a clear expected behaviour: a shard that holds `packages/elements/src` source can
finish in CI and is not cancelled. It is CI tooling, semver `none`, with no element, attribute, event, slot, part
or token, and it fits one phase. It changes one workflow line (or one expression), the pinned test red first, and
a recorded amendment of 001 FR-013 and SC-005. Its acceptance is one CI run of a pull request with elements
shards.

Why not the others:
- Not a **mission**: one story, one package (none, repository CI), no accessibility or security behaviour. The
  open point is the limit's value and whether it covers all shards. Both are bounded choices for the operator at
  approval (questions below), and the evidence sets the lower bound. They do not need a clarify and squad cycle.
  Where 007 needed a mission because its verdicts had no obvious answer, here every option is a one-line workflow
  change, easy to revert.
- Not a **fold**: see the 008 row. 008 keeps CI out of its design, and the timing constraint is independent of 008.
- Not **none**: `ci.yml:89` is still `timeout-minutes: 10` on main. The risk 008 R1-01 names is unresolved.
- Not **decision-needed**: scoping does not wait on the operator. Only the parameter does, and the record gives a
  recommended default.

## Scope

In scope (#35):
1. **Red first:** `gates/test/ci-workflow.test.ts` expects the new `timeout-minutes` line of `mutation-shard`.
   Commit the test alone with its failing run, then change `.github/workflows/ci.yml`. With the recommended shape:
   `timeout-minutes: ${{ contains(matrix.shard.files, 'packages/elements/src/') && 60 || 10 }}`. The job-level
   `timeout-minutes` accepts the `matrix` context, so the gate and the `--plan` output stay unchanged. The plan
   must confirm this against GitHub's context-availability table.
2. Amend 001 FR-013 and SC-005 in place (dated, with the operator's decision and the 008 evidence), and
   `contracts/ci-checks.md:40`. Update the comment at `ci.yml:64-65` ("at most 10 minutes each").
3. Evidence: one CI run of a pull request whose plan holds at least one elements shard. Record each shard's
   `gate:mutation` step time and job time, with the dry-run share read from Stryker's log. The op can make its own
   PR plant this, for example a changed line in `packages/elements/src`, reverted before landing, or it can use
   008's PR run, whichever comes first.
4. A `knowledge/speckit-flows/log.md` entry with the cost: every elements shard repeats the whole elements dry run.

Out of scope:
- Shard split, entry bounds, shard filling (operator brief; 001 FR-013 bounds, 007 FR-014/FR-015).
- `stryker.elements.config.json` and `stryker.config.json`: 008 owns `dryRunTimeoutMinutes`, and per-mutant limits
  stay at defaults (008 R-15, 007 FR-012).
- Making the elements dry run cheaper, for example running only the tests related to a shard's files, or one
  shared dry run across shards. That needs its own design. It is a candidate for the operator, and this record
  files no issue for it.

## Risks and open questions

- **Q1, the limit's shape** (choose one):
  - **A (recommended):** a higher limit only for shards whose `files` name `packages/elements/src/`; every other
    shard keeps 10 minutes. This keeps 001 SC-005 and 007 SC-004 as a size guard for gate and token shards.
  - **B:** one higher limit for every shard. Simplest, but a runaway gate or token shard then fails later.
  - **C:** keep 10 minutes and first confirm with one CI run (R1-01's second option). This risks blocking #15's PR
    if the run fails, and the elements dry run only grows with each element mission.
- **Sizing (sandbox figures, CI 1.5 to 3.4 times slower; relayed by the orchestrator, checked on both branches):**
  008's elements dry run took 5 m 31 s, so about 8 to 19 minutes on CI. 009's longest shard took 292 s without
  the dry run, so about 7 to 17 minutes on CI. Add about 5 minutes of setup (install, Chromium). The worst case
  today is about 40 minutes, and that is before 008's and 009's rows share one dry run.
- **Q2, the value for the raised limit** (choose one):
  - **A: 60 minutes (recommended):** about 20 minutes over today's worst case, which leaves room for the combined
    dry run of 008 and 009 and the next element missions.
  - **B: 45 minutes:** above 30 for 008's dry-run limit, plus about 10 for the shard's mutants (the old budget),
    plus about 5 for setup. That leaves only about 5 minutes over today's worst case.
  - **C: 40 minutes:** no margin at the upper CI factor.
  - **D: 30 minutes:** equal to the dry-run limit. Then a dry run that uses its full limit is cancelled by the job
    first, so 008's setting is moot in CI. Not recommended.
- **Coupling with 008:** the job limit must stay above `dryRunTimeoutMinutes` plus setup and mutant time. If 008
  changes 30 before it lands, Q2 follows. If #15 lands before 008, elements shards on main still have Stryker's
  5-minute dry-run limit. The CI limit is then harmless, but 009 may hit "Initial test run timed out!" itself.
  That is 009's or 008's concern, not this op's.
- **CI cost:** 6 of 008's 12 shards each repeat a dry run that may take 10 to 20 minutes on a runner. Wall time
  stays parallel, but runner minutes grow with each element mission. This is recorded, not solved, here.
- **CI measurement still required** (#35, as relayed): all the figures above are from the sandbox. The op is done
  only when one CI run records every elements shard's job time under the chosen limit. If the run shows that
  limit is too tight, Q2 is reopened with the measured times.
- **Evidence timing:** the op cannot prove the fix on its own PR without elements source in the diff. Scope item 3
  says how to get the evidence.
- **#35 not read:** see *Issues read*.

## What would change this decision

- If #35's body also asks for the shard split, a cheaper dry run, or a gate change (for example a per-shard limit
  emitted by `--plan`), that part needs its own design. It becomes a **mission**, or is split out under the
  operator brief.
- If the operator picks Q1 C (confirm first) and the CI run passes, the result is **none** for now, with the run
  cited.
- If the operator wants 008 to carry the CI change, so that 009 can wait on 008: **fold** into `specs/008-overlays`.
  Its plan decision 25 would gain the `ci.yml` line, the pinned test and the FR-013 amendment.
