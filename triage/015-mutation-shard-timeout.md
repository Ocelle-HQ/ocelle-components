---
triage: 015
issues: [35]
decision: op
target: "ops/015-mutation-shard-timeout"
in_scope: [35]
out_of_scope: [1, 8, 9, 11, 15, 16, 20, 23]
semver: none
spec_prompt: "Op for #35 (triage/015-mutation-shard-timeout.md): before the first element mission PR (009, #15), (1) stryker.elements.config.json gains dryRunTimeoutMinutes 30 (taken over from mission 008, stryker.config.json unchanged; red first in gates/test/vitest-config.test.ts) and (2) CI's mutation-shard timeout-minutes in .github/workflows/ci.yml (red first in gates/test/ci-workflow.test.ts) is raised for shards of packages/elements/src source to a value derived from a CI measurement of elements shards, with the shape, measurement and value rule the operator picks at approval (recommended: elements-only limit; measured on a draft PR of 008's branch plus this op's workflow; worst elements shard job time x 1.5 rounded up to 5 minutes, never below 45); 001 FR-013, SC-005 and contracts/ci-checks.md amended in place, gates/README.md updated if it states the limit; no change to shard split, entry bounds, the gate code or per-mutant limits."
status: proposed
---

# Triage 015: CI mutation shards time out on the elements dry run (#35)

## Issues read

- **#35**, "Mutation CI: shard timeout too short for @ocelle/elements PRs". Read from the verbatim body the
  coordinator relayed (fetched through the GitHub MCP). This session could not read GitHub itself: the proxy
  refuses GraphQL and `gh api` was denied. Labels, milestone, parent, comments and linked PRs were not relayed.
  - **Seen:** `ci.yml:89` gives each shard `timeout-minutes: 10`. The elements dry run takes about 5.5 minutes in
    the sandbox, and CI is 1.5 to 3.4 times slower (`log.md` 2026-11-04), so the dry run alone can pass 10 minutes.
    Stryker's own dry-run limit is too short as well: 008 added `"dryRunTimeoutMinutes": 30` on
    `claude/016-overlays`.
  - **Why now:** seven element missions (008 to 014) are in progress, and 009 (#15) is expected to open its PR
    first. If each mission raises the limits on its own branch, they all change the same two files.
  - **Scope it asks for:** raise the shard job's `timeout-minutes` to a value **measured on CI, not the sandbox**.
    Set `dryRunTimeoutMinutes` in `stryker.elements.config.json`. Test first where the constitution requires it, and
    update `gates/README.md` if it states the limit. Out of scope: the shard split and entry bounds (#23, mission
    007). "Likely an op."
  - **Landing:** before the first element mission PR. Missions pick it up by merging main, and 008 drops its own
    `dryRunTimeoutMinutes` change.
- **Operator brief:** number 015 is reserved for this work. It must land before 009's PR (#15). Shard split and entry
  bounds are out of scope.
- **Figures relayed by the orchestrator (sandbox):** 008's elements dry run took 5 m 31 s and failed at Stryker's
  5-minute default (exit 2). With `dryRunTimeoutMinutes` 30, a `--files` run over `overlay.ts` and
  `ocelle-drawer.ts` took about 16 minutes. The default configuration took 1 m 22 s. 009's 17 shards, each run
  alone, took at most 292 s, not counting the dry run. I checked both on the branches (rows below).

## Related work found

| Ref | Kind | Relation | Reason |
|---|---|---|---|
| #35 | issue | in scope | This op. |
| `.github/workflows/ci.yml:84-104` (`mutation-shard`, `timeout-minutes: 10` at `:89`) | CI workflow (main) | **changed by this op** | Every shard job, elements or not, is cancelled at 10 minutes. The verdict job `mutation` then fails, and the ruleset requires it. |
| `gates/test/ci-workflow.test.ts:31-49` | pinned test (main) | **changed by this op, red first** | It pins the first 10 lines of the job, including `"    timeout-minutes: 10"`. |
| `stryker.elements.config.json`; `gates/test/vitest-config.test.ts:71-81` (main) | config, pinned test | **changed by this op, red first** | #35 moves 008's `dryRunTimeoutMinutes: 30` here. On main the pinned test expects the elements config to equal `stryker.config.json` plus its Vitest config and report file. 008's test change (key present in the elements config, absent from `stryker.config.json`) is the form to take, red first. `stryker.config.json` stays unchanged: its dry run took 1 m 22 s. |
| `gates/README.md` | gate docs (main) | checked, likely no change | `grep` finds no `10 min`, `timeout-minutes`, `minutes` or `dryRun` in it on main. The op's plan confirms this, and if the mutation row should name the new dry-run limit, it adds it there. |
| `specs/001-repository-foundation/spec.md` FR-013 (`:287`), SC-005 (`:515-528`); `contracts/ci-checks.md:40` | spec, contract (merged) | **amended by this op** | FR-013 sets "a job time limit of 10 minutes", and SC-005 says "each shard job's 10-minute limit (FR-013) enforces it" (operator decision, 001 plan squad round 2). Changing the limit amends an operator decision. That is allowed in an op only as a recorded amendment, like 007's amendments of the same FR. |
| `specs/008-overlays` (branch `origin/claude/016-overlays`): plan decision 25, research R-15 (`research.md:693-709`), `reviews/analysis/fixes-8.md:10`, phase 3 `notes.md:76-99`, `round-1.md` R1-01; `stryker.elements.config.json` (+`dryRunTimeoutMinutes: 30`); `gates/test/vitest-config.test.ts:75-86` | mission in progress (#16) | **input; blocked by this op; must drop its own `dryRunTimeoutMinutes` change** (#35) | Operator decision 2026-11-15: only the elements configuration raises Stryker's dry-run limit to 30 minutes; per-mutant limits and `stryker.config.json` stay at defaults. The evidence: the elements dry run runs every in-process `elements` and `elements-touch` test (about 760 browser rows) whatever `--files` names. It took 5 m 31 s and hit the 5-minute default, and the scratch gate runs took about 16 minutes each. 008 kept CI out of its design and left the 10-minute job limit as an open risk for the operator. Its `--plan` gives 12 shards, 6 with elements source, so 008's own PR hits the same limit. Its `vitest-config.test.ts` hunk for this key will conflict when it merges main. 008 resolves the conflict by keeping main's key, while still adding its own `elements-touch` project to the same `describe`. |
| Not a **fold** into 008 | | | #35 itself moves the change out of 008 ("008 drops its own `dryRunTimeoutMinutes` change"). 008 deliberately leaves CI out of its design, and the change must land before #15's PR. A fold would tie 009 to 008's landing. |
| #15 (mission 009, branch `origin/claude/015-workflow-layouts`) | element issue, mission in progress | **blocked by this op** (its PR); input | The operator names it as the first element mission PR. Its phase 4 ran each of its 17 `--plan` shards alone on the sandbox: the longest took 292 s (`specs/009-workflow-layouts/reviews/phase-4/plants.md:111-113`). The orchestrator relays that this figure excludes the dry run; `plants.md` itself does not say so. The branch has no `dryRunTimeoutMinutes`, so its own dry run fit Stryker's 5-minute default there. When 008 and 009 are both on main, the dry run holds both missions' rows, and every later element mission adds more. |
| #9, #8 and the issues of missions 012 to 014 | element missions in progress (#35: 008 to 014) | out of scope; blocked by this op at their PRs | They have the same mechanism and pick up the change by merging main. None of them should change either file on its own branch (#35, "Why now"). I did not identify the issue numbers of 012 to 014. |
| #23 / PR #25 / `specs/007-mutation-gate-strictness` | mission, merged (`e7d7d54`) | out of scope (operator brief); input | It settled the shard and entry bounds (30-line entries, FR-014/FR-015) and the CI measurement of `source.ts` shards at 480 s or less under the 10-minute limit. This op does not touch the split or the bounds. For non-elements shards, keeping 10 minutes keeps 007's SC-004 meaningful as written. |
| #20 / `ops/004-token-source-mutation` | op, merged (`3a247ef`) | out of scope (done) | Its § CI risk is the history of the 10-minute limit. Nothing here changes. |
| `knowledge/speckit-flows/log.md` 2026-11-04 (CI runners 1.5 to 3.4 times slower than the sandbox), 2026-11-05 (O6-01: a 670 s shard cancelled in CI); `findings/frontend-missions.md` 006 L1-02 (a survivor shows as Timeout under CI load) | diary, finding | applies | Local times do not carry over to CI. A 5 m 31 s local dry run can take about 8 to 19 minutes on a runner, before setup and mutants. |
| `.specify/memory/constitution.md` § Mutation testing (`:133`), VIII | constitution | applies | Changed source must still be mutation-tested. A job limit that cancels the elements shards stops the gate, but raising it weakens no verdict. Per-mutant limits are not touched. |
| `triage/001` to `007`; `ops/004` | earlier records | none to fold into | All are merged. Triage 008 to 014 belong to missions in progress (operator brief), and none of them takes CI. |
| #1 | epic (open) | out of scope | Parent epic. Whether #35 has a parent was not relayed. |
| #11 | issue (open) | out of scope | Release. No published surface changes here. |

## Decision

**op**, as #35 suggests. It is one bounded change with a clear expected behaviour: a shard holding
`packages/elements/src` source finishes in CI and is not cancelled, and Stryker's dry run for elements is not cut
off at 5 minutes. It is repository tooling, semver `none`, with no element, attribute, event, slot, part or token.
It fits one phase:
- one workflow line, pinned test red first;
- one configuration key, pinned test red first;
- a recorded amendment of 001 FR-013 and SC-005;
- one CI measurement.

Why not the others:
- Not a **mission**: one story, no package surface, no accessibility or security behaviour. #35 fixes the method
  for the value (measure on CI). What stays open are bounded choices for the operator at approval (Q1 to Q3 below),
  each a one-line, revertible change. 007 needed a mission because its verdicts had no obvious answer. Here no
  verdict of the gate changes.
- Not a **fold**: see the 008 row.
- Not **none**: `ci.yml:89` is still `timeout-minutes: 10` on main, and main's `stryker.elements.config.json` has no
  `dryRunTimeoutMinutes`.
- Not **decision-needed**: scoping does not wait on the operator. The choices have recommended defaults.

## Scope

In scope (#35):
1. **Dry-run limit, red first:** `gates/test/vitest-config.test.ts` expects `dryRunTimeoutMinutes: 30` in
   `stryker.elements.config.json` and no such key in `stryker.config.json`. Commit the failing test alone, then add
   the key. The value 30 comes from 008's operator decision (R-15). The CI measurement (item 3) must show it
   holds: every elements dry run ends well under 30 minutes on CI.
2. **Shard job limit, red first:** `gates/test/ci-workflow.test.ts` expects the new `timeout-minutes` line, then
   `.github/workflows/ci.yml` changes. With Q1 A:
   `timeout-minutes: ${{ contains(matrix.shard.files, 'packages/elements/src/') && <N> || 10 }}`. The job-level
   `timeout-minutes` accepts the `matrix` context, so the gate and `--plan` stay unchanged. The plan confirms this
   against GitHub's context-availability table. Update the comment at `ci.yml:64-65`.
3. **CI measurement (#35: "measured on CI, not the sandbox"):** one CI run whose plan holds elements shards with a
   realistic elements suite. A provisional limit high enough not to cancel them is in place for that run (for
   example 90). Record each elements shard's job time and `gate:mutation` step time, and the dry-run time from
   Stryker's log. Then set N by the Q3 rule and commit it with the evidence under `ops/015-mutation-shard-timeout/`.
4. **Amendments:** 001 FR-013 and SC-005 in place (dated, with the operator's choice and the CI evidence), and
   `contracts/ci-checks.md:40`. Update `gates/README.md` only if it states a limit (on main it does not).
5. A `knowledge/speckit-flows/log.md` entry with the cost: every elements shard repeats the whole elements dry run.

Out of scope:
- Shard split, entry bounds, shard filling (#35, operator brief; 001 FR-013 bounds, 007 FR-014/FR-015).
- `stryker.config.json` and the per-mutant limits (`timeoutMS`, `timeoutFactor`): unchanged (008 R-15, 007
  FR-012).
- Making the elements dry run cheaper, for example running only a shard's related tests, or one shared dry run
  across shards. That needs its own design. It is a candidate for the operator, and this record files no issue.

## Risks and open questions

- **Q1, the shape of the shard limit** (choose one):
  - **A (recommended):** a higher limit only for shards whose `files` name `packages/elements/src/`; every other
    shard keeps 10 minutes. This keeps 001 SC-005 and 007 SC-004 as a size guard for gate and token shards.
  - **B:** one higher limit for every shard. Simplest, but a runaway gate or token shard then fails later.
- **Q2, where the CI measurement runs** (choose one):
  - **A (recommended):** a draft PR, closed unmerged, from a scratch branch: 008's branch (`claude/016-overlays`,
    the largest elements suite: about 760 rows, 6 elements shards) plus this op's provisional workflow commit.
    That measures the dry run that 008 and later missions will actually have.
  - **B:** the op's own PR, with a planted change to a line in `packages/elements/src`, reverted before landing.
    Main's elements suite holds only 005's icons, so this underestimates the dry run of every element mission.
  - **C:** 009's PR (#15), once the provisional limit is on main. This measures a real element PR, but 009's PR
    then carries the risk the op exists to remove.
- **Q3, the rule for N** (choose one):
  - **A (recommended):** the worst measured elements shard job time × 1.5, rounded up to 5 minutes, and never
    below 45 (30 for the dry-run limit + about 10 for mutants + about 5 for setup). This leaves headroom for 1.5 to
    3.4 times runner variance and the growing suite.
  - **B:** the worst measured time × 2, rounded up to 5 minutes.
  - **C:** a fixed 60 minutes, kept if the worst measured time is at most 40 minutes, else back to the operator.
- **Sandbox sizing, for orientation only:** 008's dry run, 5 m 31 s, is about 8 to 19 minutes on CI. 009's longest
  shard without the dry run, 292 s (`origin/claude/015-workflow-layouts:specs/009-workflow-layouts/reviews/phase-4/plants.md:111-113`;
  the file does not itself say whether the dry run was excluded), is about 7 to 17 minutes. Setup adds about 5. The
  worst case is about 40 minutes, and the suite grows once 008's and 009's rows share one dry run.
- **The dry-run limit against the job limit:** N must stay above 30 plus setup and mutant time. Otherwise the job
  cancels a dry run before Stryker's own limit can report it, and the key has no effect in CI.
- **CI cost:** 6 of 008's 12 shards each repeat a dry run of perhaps 10 to 20 minutes on CI. Wall time stays
  parallel, but runner minutes grow with each element mission. This is recorded, not solved, here.
- **Merge order:** if 008 merges main after this op, its `stryker.elements.config.json` and
  `vitest-config.test.ts` hunks conflict, and 008 keeps main's key (#35). If any element mission's PR opens before
  this op lands, it hits the limit (#35 "Why now").

## What would change this decision

- If the measurement shows that no limit up to an acceptable runner budget fits, for example elements shards over
  about 60 minutes, then a cheaper dry run is needed. That has its own design and becomes a **mission**. The split
  and entry bounds stay with #23's successors only if the operator reopens them.
- If the operator wants 008 to carry the change, so that 009 waits on 008: **fold** into `specs/008-overlays`.
  #35 asks for the opposite.
- If the unrelayed labels, comments or linked PRs of #35 show it is already done, the decision is **none**, citing
  that work.
