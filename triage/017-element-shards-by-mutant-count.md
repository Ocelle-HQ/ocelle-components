---
triage: 017
issues: [42]
decision: decision-needed
target: "ops/017-element-shards-by-mutant-count (only if the operator answers Q0 with go; otherwise ->)"
in_scope: [42]
out_of_scope: [1, 9, 15, 16, 8, 23, 35, 41, 11]
semver: none
spec_prompt: "If Q0 is go: op for #42 (triage/017-element-shards-by-mutant-count.md): redo test-first, from main, the element-source shard rule prototyped on claude/009-feedback-forms (971c431, 0d99aa5, 5c2ef49, 9a91a92, 253292f; reverted in 14538fa): changed lines under packages/elements/src/ are cut into entries and shards by counted mutant weight (cap, weight and syntax rule as the operator picks in Q2), other files keep 007 FR-014's 30-line rule, with the dependency choice of Q3, the amendments of Q1, a CI cost check per Q4 and the merge order of Q5; ci.yml and op 015's 45-minute limit unchanged; whole-diff gate:mutation over the change."
status: approved
decided_by: "human:jeroennouwsdev"
decided_at: 2026-11-15T17:42:20Z
---

# Triage 017: cut element-source mutation shards by mutant count (#42)

## Issues read

- **#42.** This session could not read GitHub. `gh issue view` is refused (the proxy has no GraphQL), and `gh api`
  and a plain REST read were denied by the session's permissions. I did not try other ways round. So this record has
  not read the body, comments, labels, milestone, parent or linked PRs of #42. It rests on the operator's brief and on
  the prototype commits on `origin/claude/009-feedback-forms` (fetched at `14538fa`, SHAs below). **The operator should check
  #42's text against this record before deciding.**
- **The operator's brief:**
  - The change was split out of mission 010 (#9) for its own review.
  - The prototype is unreviewed and had no whole-diff mutation run. Its evidence and tests may be reused, but the
    change is to be redone test-first.
  - "No work" is a valid outcome if op 015's 45-minute limit already makes the change unnecessary.
- **What the prototype is** (mission 010 phase 3, `specs/010-feedback-forms/reviews/phase-3/` on the branch):
  - **Why it started.** Stop 1 (`stop-1.md`): T041, a rule local to mission 010, ran every shard holding
    `src/form-control.ts` alone, and any shard over 7:00 (420 s) on this container was a stop. Under main's 30-line
    rule the plan had 29 shards. Shard 2 took 569.4 s and shard 3 took 534.6 s. By estimate (217 s fixed + 14 s a
    mutant), shards 14, 18 and 19 would take 623 to 749 s, over the old 10-minute CI limit.
  - **Design change 1** (T041a, `ef06f21`, `0d99aa5`; operator decisions `decision-stop-1.md` (b) and
    `decision-design-change-1.md`). Changed element files are cut into entries and shards of at most 10 mutants,
    counted at plan time by `@stryker-mutator/instrumenter` 10.1.1, pinned exactly. It is a new direct dev
    dependency, already in the lockfile through `@stryker-mutator/core`. Each cut falls at the boundary the fewest
    mutants span. Element source never shares a shard with other files. Re-plan: 63 shards. Stop 2 (`stop-2.md`):
    shards made only of static mutants took 435.6 to 448.4 s, at about 25 s per static mutant against 2 to 6 s for
    the others.
  - **Design change 2** (T041b, `9a91a92`, `253292f`; `decision-stop-2.md` (a)). A syntactic "probably static" rule,
    parsed with the pinned `typescript` 6.0.3, weights such a mutant as 5. The parts of the rule: a static member or
    block, a class property's initialiser, or top-level code outside any function. Re-plan: 90 shards, **81 of them
    element source**, against about 27 under the 29-shard 30-line plan. Checked against run 4's report: all 70
    static mutants caught, 8 flagged in error. The worst estimated shard is 277 s on this container.
  - **The split** (`decision-split-shard-change.md`, `2a2be74`; revert `14538fa`). The operator moved T041a and
    T041b out of 010. That decision says the shards over 7:00 are a known gap, that "with op 015, CI's 45-minute
    limit for element shards covers them", and that T041 finishes without the 7:00 rule. So the rule that drove the
    prototype no longer binds 010.
  - **Size of the prototype gate change** (`git diff 666bb70 253292f`): `gates/lib/mutation/shards.ts` +161,
    `gates/bin/mutation.ts` +71, `gates/test/mutation-shards.test.ts` +568, `gates/test/mutation-fakes.ts` +29,
    `gates/README.md` +19, and `package.json` and `pnpm-lock.yaml`, one dependency.

- **Where the prototype lives** (checked 2026-11-15 with `git ls-remote`; coordinator note):
  - `claude/009-feedback-forms` head: **`14538fa02e30b43fe2161076b4e44efecd3e91e0`**, the revert. The
    coordinator named the head as `2a2be749`. That is `2a2be74193a6bf41b05b18898a5ad1b58560aab7`, the split decision
    and the revert's parent. The revert was on the remote when I read it.
  - The gate change's commits (#42's prototype):
    - base before the change: `666bb7066febee06dae09a2d551ace2a97e5a560`;
    - T041a red: `971c431ad1a5eb401c033e77d02f6ae853bfa9c3`;
    - T041a green: `0d99aa591cea4bfdbd173b2f5c364128cfb743a5`;
    - T041b red: `5c2ef495c594fdb43dbf4edf154042da91b87b90`;
    - T041b green: `9a91a9210a220dae757d170fcc399163b85aac1e`;
    - T041b extra case: `253292f9b09711892c0a733e55b61161ffbf9df4`;
    - revert: `14538fa`.
  - The design and evidence records: `ef06f21`, `668f399`, `999e903`, `318d25c`, `cca520c`. The operator decisions:
    `47d952f`, `666bb70`, `2be256d`, `2a2be74`.
  - **Mission 010's phase 3 fold will rewrite this branch.** `archive/claude/009-feedback-forms-prefold-phase-3` is
    meant to keep the original SHAs, but it **does not exist yet** (`git ls-remote` returns nothing for it). Any
    reuse at implementation time must first check that the archive ref exists and contains every SHA above, for
    example with `git merge-base --is-ancestor <sha> origin/archive/claude/009-feedback-forms-prefold-phase-3`. If
    it does not, stop and ask the operator before using them.

## Related work found

| Ref | Kind | Relation | Reason |
|---|---|---|---|
| #42 | issue | in scope (if Q0 is go) | This record. Text not read (see above). |
| #9, mission 010 (`origin/claude/009-feedback-forms`) | mission in progress | out of scope; source of the prototype | The gate change is already off its branch (`14538fa`), and its T041 finishes without the 7:00 rule. A **fold** back into 010 is excluded by the operator's split decision. 010's phases 4 and 5 add suites, so its elements dry run, the fixed cost of every element shard, keeps growing. That is relevant to Q0. |
| `ops/015-mutation-shard-timeout`, #35 (merged `ce1d9c7`) | op, merged | **interacts** (Q5); may make this unnecessary (Q0) | `ci.yml:90`: element shards now get 45 minutes, every other shard 10. The CI measurement (`measurement/README.md`, run 43674498025, 008's branch, 30-line plan): 37 element shards, worst W = 1082 s (18 m 02 s), zero-mutant element shards 430 to 456 s. So an element shard's fixed cost on CI is about 7 to 7.5 minutes. N = 45 came from 1.5 × W with a floor of 45. A mutant-count rule does not touch `ci.yml` or op 015's pinned test (`gates/test/ci-workflow.test.ts`). It also removes op 015's unmeasured case, a mixed shard (`overlay.ts:781-798` with `tokens/src/source.ts`) that runs both Stryker configurations, because element source no longer shares a shard. |
| Op 016, #41 (`origin/claude/041-plants-affected`, only `triage/016-plants-affected.md` so far) | op in progress | **interacts** (Q5) | It adds `gate:plants --affected <base>`, edits `gates/lib/plant-runner.ts`, `gates/bin/plants.ts`, the registry and one paragraph of `gates/README.md` § plants. It may reuse `gates/lib/mutation/ranges.ts` (`changedFiles`). This op edits `gates/lib/mutation/shards.ts`, `gates/bin/mutation.ts` and the mutation part of `gates/README.md`. Overlap: the README, possibly `gates/lib/mutation/` if 016 moves `changedFiles`, and the plant run. `package.json` is in the plant configuration set (`gates/lib/plant-repo.ts`), so a new dependency makes 016's selector fall back to the full plant set. |
| `specs/001-repository-foundation/spec.md` FR-013 (`:287`), SC-005 (`:530-550`), `contracts/gate-cli.md`, `contracts/ci-checks.md` | spec, merged | **amended** if Q0 is go (Q1) | FR-013 defines an entry by changed lines ("up to 10 entries and up to 250 changed lines", entry at most 60, then 30), as operator decisions of 2026-11-03 and 2026-11-05. Mutant-count entries break the line bound: 010's design-1 plan has `src/form-control.ts:57-235`, 179 lines, as one entry. |
| `specs/007-mutation-gate-strictness` FR-014, FR-015 (merged `e7d7d54`), #23 | mission, merged | **amended** if Q0 is go (Q1) | FR-014 decided "30-line entries, all files" (operator, 2026-11-11). The rule here makes element source the exception. FR-015 is the model for recording it: a dated amendment that keeps the earlier text readable, in 001 FR-013, SC-005, `contracts/gate-cli.md` and `gates/README.md`. 007 had rejected a mutant bound in favour of faster kills (`findings/frontend-missions.md:55-60`). |
| `.specify/memory/constitution.md` § Technology, Licence and Supply Chain (`:153`); `gate:pins` (`gates/README.md:33`) | constitution, gate | applies (Q3) | Every dependency pinned exactly, lockfile committed. The instrumenter is Apache-2.0 and already locked at 10.1.1 (`pnpm-lock.yaml:1361, 4049`) as a dependency of `@stryker-mutator/core`. As a direct dependency it must stay in lockstep with core, the checker and the runner (`package.json:37-39`) at every Stryker upgrade, and it brings no install script. Not a third-party asset under `THIRD_PARTY_NOTICES`. |
| #16 (008, `claude/016-overlays`), #15 (009, `claude/015-workflow-layouts`), #8 (011), missions 012 to 014 | element missions in progress | out of scope; **consumers** | Each element mission's PR is planned by whatever rule is on main when it opens. None of the fetched branches (008's `claude/016-overlays`, `claude/008-layout-headers`) touches `gates/lib/mutation/` or `gates/bin/mutation.ts`. If this op lands mid-flight, a PR's shard count changes between its runs, by about 3 times by 010's figures. I did not identify the issue numbers of 012 to 014. |
| `knowledge/speckit-flows/findings/frontend-missions.md:55-60, :168-170` | findings | applies | "The next lever is a bound on mutants per shard" (002), resolved in 007 without one. Mixing both Stryker configurations in one shard runs Stryker twice. CI runners are 1.5 to 3.4 times slower than the sandbox. |
| #1 | epic (open) | out of scope | Parent epic. Whether #42 is its sub-issue was not read. |
| #11 | issue (open) | out of scope | Release. No published surface changes. |
| `triage/001` to `007`, `015`; `ops/004`, `ops/015` | earlier records | none to fold into | All merged. Triage 008 to 014 belong to missions in progress, none of which owns the planner. |

I could not search GitHub, so other open issues or PRs on mutation sharding may exist. The operator should check
that before deciding.

## Decision

**decision-needed.** Whether this work should exist at all now depends on a cost judgement the operator has not
made. The answer to it also decides which earlier operator decisions get amended. Both are the operator's to make,
not mine.

- **The driver has gone.** The prototype was built to meet T041's 7:00, a local rule of mission 010, and the old
  10-minute CI limit. The split decision drops the 7:00 rule from 010 and says op 015's 45 minutes covers the long
  shards. What is left to justify the change is whether a 30-line element shard can pass 45 minutes on CI, now or
  as the elements suite grows.
- **The evidence points both ways.**
  - **For "no work" now:** the worst CI element shard measured was 18 m 02 s. 010's worst sandbox estimate, 749 s
    from the stop-1 model, which overestimates covered mutants (`stop-2.md`), is about 19 to 42 minutes at 1.5 to
    3.4 times. That is under 45.
  - **For the change:** that upper end leaves about 6 % margin. The fixed cost, about 7 to 7.5 CI minutes per element
    shard, grows with every element mission merged into main and with 010's phases 4 and 5. A dense or static-heavy
    30-line entry has no bound at all under the line rule.
- **If the operator says go, it is an op, not a mission.**
  - It is tooling, semver `none`, with no element, attribute, event, slot, part or token.
  - It is one story: element shards are sized by expected cost.
  - The design is already worked out and was approved twice inside 010 (`decision-design-change-1.md`,
    `decision-stop-2.md`). What remains are bounded choices (Q1 to Q5).
  - It fits one phase: red tests from the prototype, the rule, one dependency, amendments, a re-plan and timings.
- **Why the other decisions do not fit:**
  - Not **op** now: an op needs "no open design question", and Q0 and Q1 are open. They are not details for approval
    time, because one of their answers is no work.
  - Not **mission**: none of the mission triggers applies, as listed above. If the operator widens the rule beyond
    element source, or asks for a cheaper dry run instead, see *What would change this decision*.
  - Not **fold**: 010 is excluded by the split decision, and no other feature owns the planner.
  - Not **none** by itself: nothing on main bounds an element shard by its cost. Whether 45 minutes is enough is the
    operator's judgement, so I give it as option Q0 B and do not decide it here.

## Scope

If Q0 is go: **in scope, #42 only.** The op takes the design-change-1 and design-change-2 rule, with the operator's
Q2 parameters, and redoes it from main, test-first:

1. **Red first.** First check the archive ref as described under *Issues read*. Then reuse the prototype's 31 new cases in `gates/test/mutation-shards.test.ts` and its fakes as the
   starting set (`971c431`, `5c2ef49`, `253292f`). Re-read them against main, which has op 015 but not 010. Commit
   them failing on main. No hand-written green before the red commit.
2. **Plant reading.** The prototype found that no plant is required. Re-check this against the plant rules
   (constitution "Gates are proven, too"), since the `--plan` output of an element diff changes. If 016 has landed,
   run `gate:plants -- --affected` (Q5). It will select the full set because `package.json` changes.
3. **Green.**
   - `gates/lib/mutation/shards.ts` and `gates/bin/mutation.ts` (`place`, `probablyStatic`).
   - The dependency per Q3.
   - The `--plan` JSON, `--files` and `ci.yml` unchanged.
   - Element source never shares a shard with other files.
   - Other files keep 007 FR-014's 30-line rule.
4. **Whole-diff `gate:mutation`** over the op's own gate change. This was the prototype's gap.
5. **Measurement per Q4,** and records: the Q1 amendments, the `gates/README.md` mutation rows, and a
   `knowledge/speckit-flows/log.md` entry with the shard-count and runner-minute cost.

**Out of scope:**
- `ci.yml` and op 015's 45-minute and 10-minute limits.
- Stryker configurations, per-mutant limits and test suites.
- A cheaper elements dry run (op 015's open candidate).
- The 30-line rule for files other than element source.
- Mission 010's own records, which stay as history on its branch.

## Risks and open questions

**Q0. Is the work needed at all, given op 015's 45-minute limit?** This is the gate for everything below.
- **A. No work (`none`).** Close #42 as covered by op 015 (`ce1d9c7`), and record the unbounded dense or static
  entry as an accepted risk in `gates/README.md` or `log.md`. Revisit when a CI element shard passes a stated
  threshold, for example 30 minutes, which is two thirds of 45.
- **B. Measure first, then decide.** Run 010's branch, or 010 merged with 008's, on a draft PR under main's 30-line
  plan, as op 015 Q2 A did. Go only if the worst element shard is over the threshold, for example 30 minutes.
  This costs one CI run.
- **C. Go now (op 017)**, on the grounds that the element suite only grows and a shard's cost should be bounded by
  construction rather than by a job limit.
- **D. Go, but only as a cap on outliers.** Keep 30-line entries for element source and additionally cut any 30-line
  entry whose counted weight exceeds a high cap, for example 40. This yields far fewer extra shards than C.

**Q1 (a). Amending earlier operator decisions: 001 FR-013 and SC-005, and 007 FR-014.**
- **A. Amend in place,** FR-015 style. Dated amendments in 001 FR-013 and SC-005, 007 FR-014 and
  `contracts/gate-cli.md`, keeping the earlier text readable: element-source entries are bounded by counted mutant
  weight, not by 30 lines. This is recommended if Q0 is C or D.
- **B. Leave the line bound standing as the outer bound,** and add the mutant cap within it (no entry over 30 lines
  and no entry over the cap). Only the shard-filling text is amended. Shards become smaller still and more numerous,
  but FR-014's "30-line entries, all files" stays literally true.
- **C. Treat the old decisions as superseded** by a new decision record under `ops/017-…/reviews/`, with a pointer
  from 001 and 007 only. This is lighter, but it splits the rule's history across records.

**Q2. The rule's parameters**, kept from the prototype or changed now that 7:00 no longer binds.
- **A.** Keep cap 10, static weight 5, and the three-part syntax rule as approved.
- **B.** Derive the cap from the CI limit, for example the largest weight whose estimate is at most 45 × 2/3
  minutes on CI. This makes far fewer shards.
- **C.** Drop the static weighting, keeping only design change 1 with a larger cap. This is simpler, and costs one
  missed edge.

**Q3 (b). The new pinned dependency under the supply-chain rules.**
- **A. Direct dev dependency `@stryker-mutator/instrumenter` 10.1.1, pinned exactly,** as approved inside 010
  (`decision-design-change-1.md`). Add a check, for example in `gate:pins` or a unit test, that it equals
  `@stryker-mutator/core`'s version, so a Stryker upgrade cannot leave the count drifting from the mutants Stryker
  places.
- **B. Same as A, without the lockstep check.** It relies on review at each Stryker upgrade.
- **C. No new dependency.** Count with the pinned `typescript` 6.0.3 parser by an approximation of Stryker's mutators.
  There is no new supply-chain entry, but the count can differ from Stryker's, and a mutant spanning a cut is lost.
- **D. No new dependency.** Use a shorter line span for element source, for example 10 lines. This was the option
  not taken in `decision-design-change-1.md`, and it does not bound a dense line (up to 12 mutants on one line,
  010 R-09).

**Q4 (c). Does going from about 27 to about 81 element shards cost more CI time than it saves?** 81 is the figure
for 010's phase-3 diff (90 shards in all).
- **Runner minutes:** each element shard pays the elements dry run, about 7 to 7.5 minutes on CI by op 015's
  zero-mutant shards. About 54 extra element shards add about 6.5 runner-hours to one run of that diff, before
  mutants. The mutant work itself does not grow.
- **Wall time:** it only improves if the account's concurrent-job limit (not read here) runs most of the 81 jobs at
  once. Otherwise queueing can make the check slower than a few long shards.
- **Matrix size:** GitHub caps one matrix at 256 jobs. A late-phase element mission's whole-diff PR could approach
  that, and the planner would then need a fallback.
- Options:
  - **A. Accept the cost,** and record shard counts and runner minutes per element PR in `log.md`.
  - **B. Require a CI measurement before landing:** one draft-PR run of 010's diff under both rules, comparing
    total runner minutes, wall time and the worst shard. The op lands only if wall time does not get worse.
  - **C. Bound the count:** the planner merges element entries while the estimate stays under a target, for example
    15 CI minutes, so shards approach the limit instead of the minimum. This is a different filling rule and needs
    its own design.
  - **D. Prefer Q0 D,** the outlier cap, which avoids most of the extra shards.

**Q5 (d). Interaction with op 015 (`ce1d9c7`) and op 016 (#41, in progress).**
- **Op 015:** nothing in `ci.yml` or its pinned test changes. But op 015's N = 45 rests on a 30-line-plan
  measurement. A mutant-count plan makes element shards shorter, so 45 becomes generous rather than tight. It also
  removes op 015's unmeasured mixed shard.
- **Op 016:** it edits `gates/README.md` (plants section) and the plant runner, and may touch
  `gates/lib/mutation/ranges.ts`.
- Options:
  - **A. Land after 016,** and rebase onto it. Use `gate:plants --affected`, which falls back to the full set because
    of `package.json`. This avoids a README conflict in two in-flight tooling ops. It is recommended if Q0 is C or D.
  - **B. Land in parallel,** each adding its own README paragraph and changing no shared line. The second to merge
    resolves the conflict.
  - **C. Also revisit op 015's N after this lands,** as a follow-up measurement, so 45 is lowered if element shards
    are now short. This reopens op 015's Q3 decision.

**Other risks.**
- **Element missions in flight.** A mid-flight change of the planner changes their PRs' shard plans. Their whole-diff
  local `gate:mutation` is unaffected, because `--files` and `--base` are unchanged.
- **The 7:00 container threshold.** It came from mission 010's tasks, not from any CI rule. Whether a sandbox
  threshold should survive into the op at all is part of Q2 and Q4.

## What would change this decision

- If #42's own text, which was not read here, already records the operator's answer to Q0, the decision becomes
  **op** (`ops/017-element-shards-by-mutant-count`) or **none** at once.
- If a CI run (Q0 B) shows an element shard over about 30 minutes, the answer is go and the decision is **op**. If
  the worst stays near op 015's 18 minutes, the answer is **none**.
- If the operator wants the rule for all files (amending 007 FR-014 wholesale), or a count-bounded filling rule
  (Q4 C), or a cheaper elements dry run in its place, it is a design question across the gate. Then it is a
  **mission**.
- If the operator decides that 010 should carry the change after all, it is a **fold** into `specs/010-feedback-forms`.
  That reverses `decision-split-shard-change.md`.
