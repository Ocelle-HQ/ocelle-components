# Operator decisions during implementation (011)

Recorded by the orchestrator; each is the operator's answer (human:jeroennouwsdev) to a multiple-choice question.

1. **2026-11-13, flex-column containers** (raised by phase 1's spike fixes, `reviews/phase-1/spike-fixes.md`):
   "Measure in phase 4". Before the US3 red commit, phase 4's implementer measures `ocelle-context-sidebar` with
   `align-self: start` in a flex-column container. If it shrinks to its content's inline size, the README states
   that the container sets the sidebar's inline size (or a stretch rule is proposed), and any change to a scenario
   goes to the operator before the red commit.
2. **2026-11-14, no container engine in this environment**: "Baselines at landing". Phases 2 to 5 write their
   stories and every other test, but their visual baselines (T023, T031, T039, T046, baselines part) and the
   `visual` gate are left open as a recorded known gap. They are produced from CI's captures at `/ocelle-land`,
   once the pull request exists (#10 FR-005: CI's captures are committed when a local capture and CI's disagree).
   Each phase's red/green check failing only on the five container-engine tests of
   `gates/test/integration/visual.test.ts` goes to the operator as an accept, as phase 1 did
   (`reviews/phase-1/operator-accepted.md`).
3. **2026-11-14, token and element baselines across a merge of main** (standing rule relayed by the orchestrator):
   "Apply it at landing". A baseline PNG that conflicts in a merge of main is left out, the merge is finished, and
   the gap is recorded. The token stories' baselines (`tokens--colour`, `tokens--type`, which list the eyebrow
   tokens) and the new elements' baselines are regenerated from CI's captures at `/ocelle-land`, under decision 2.
4. **2026-11-14, a container engine after all** (the operator's final baseline rule, relayed by the orchestrator,
   session_01NUfZSc26YwQLeow31d6R6X): "Adopt new rule". It supersedes decisions 2 and 3. `dockerd` runs in these
   sessions once started as root (`nohup dockerd > <log> 2>&1 &`; docker 29.9.2 answers here; podman is absent).
   From phase 2 on (and anything phase 1 needs), baselines are made in #10's pinned container as #10 designed
   (`pnpm run visual:update`) and checked with `pnpm run gate:visual`; the record states that no cross-engine
   (podman) comparison was possible, and CI confirms the baselines at landing. When a merge of main conflicts on a
   baseline PNG, neither side is taken: the merge is finished, the affected baselines are regenerated in the pinned
   container and committed in the merge. The five container-engine tests of `gates/test/integration/visual.test.ts`
   are re-run with the engine and are expected to pass.
5. **2026-11-14, research.md R-04 after phase 2** (phase 2 reviews R1-04, R2-03, R3-02): "Planner amends R-04".
   Before phase 3, the planner corrects R-04 (and R-07 where it repeats it) to the section header as built: the
   actions wrapper keeps `flex: 0 1 auto` (FR-004 at 320 px), and the actions take `margin-inline-start: auto` when
   the empty heading column is hidden (FR-005, FR-010). No requirement changes.
6. **2026-11-14, the sidebar in a flex-column container** (decision 1's measurement, phase 4,
   `reviews/phase-4/flex-column-probe.log`): with `align-self: start` the sidebar fills a block or grid container
   but takes its content's inline size in a flex column (95 of 800 px); a page rule `align-self: stretch` on the host
   gives the full inline size; block size and the footer at the block end hold everywhere, and no US3 scenario
   changes. "README statement": `align-self: start` stays. The planner adds one statement to FR-036's README list
   for the sidebar, with its assertion in T035: in a flex column or flex row the container or the page sets the
   sidebar's inline size (an `inline-size`, a `flex` value, a grid track, or `align-self: stretch` on the host).
   No scenario is added.
7. **2026-11-14, clarification of decision 6** (the probe, `reviews/phase-4/flex-column-probe.log`): "Tighten the
   wording". `align-self: stretch` on the host widens the sidebar only in a flex column; in a flex row it acts on
   the block axis and the sidebar keeps its content's inline size. FR-036 and T035 state it so: in a flex row or a
   flex column the container sets the sidebar's inline size (an `inline-size`, a `flex` value, a grid track); in a
   flex column `align-self: stretch` on the host also gives it the container's inline size.
8. **2026-11-15, standing approval of the history folds** (relayed by the orchestrator,
   session_01NUfZSc26YwQLeow31d6R6X, and confirmed by the operator: "the folds are approved from here on"). From
   phase 4 on, once a phase's review is approved, the fold with `fold-history.sh`, the archive ref of the pre-fold
   history and the force-push-with-lease of `claude/008-layout-headers` go ahead without a gate. Every other gate
   still goes to the operator.
9. **2026-11-15, main is merged at landing, not during the run** (the operator's decision in the orchestrator's
   session, session_01NUfZSc26YwQLeow31d6R6X, which withdrew its request to merge op 015's ce1d9c72; confirmed here:
   "Merge at landing"). It replaces the earlier relayed rule to merge main whenever it moves. 011 does not merge
   `main` during its run; `/ocelle-land` merges it, with decision 4's baseline handling (a conflicting baseline PNG
   is regenerated in the pinned container in the merge) and the other resolutions already agreed.
10. **2026-11-15, the red Sign-off check at landing** (PR #44, CI run 43764641711,
    https://github.com/Ocelle-HQ/ocelle-components/actions/runs/43764641711/job/132966885442): "Accept the red
    check". Commit 3a7bc81 ("docs(plan): squad round 3 — 4 confirmed, 2 forks", a planning commit) has no
    Signed-off-by line, so `gate:signoff` over the PR range reports 1 finding in 65 commits. It lies before 767c097,
    the merge of main (#10) that is phase 1's base, and `fold-history.sh` cannot fold across a merge commit; a
    scripted rewrite of the earlier history would break the landing rule that only the fold script rewrites. The
    history is kept, the check is recorded as a PR defect the operator accepted, and the squash commit on main carries
    its own sign-off. An earlier choice, "Refold from PR base", was withdrawn when the fold script refused the merge.
11. **2026-11-16, Sign-off is re-established by a scripted re-sign** (supersedes decision 10). The orchestrator
    (session_01NUfZSc26YwQLeow31d6R6X) relayed that Sign-off is a required check in the ruleset on `main`, so the red
    check cannot be accepted; the operator chose "Scripted rebuild". `reviews/landing/resign-history.sh` rebuilds
    `3828d2f..HEAD` (the PR base) with `git commit-tree`, oldest first: every commit keeps its tree, author,
    committer, dates and message, and the merge 767c097 keeps its outside parent. Only 3a7bc81 gains a
    `Signed-off-by` line for its author. The script verifies trees, identities, dates, messages and the commit
    count, keeps the old head as `refs/ocelle/prefold/resign/<branch>`, remaps `base.sha`, `scaffold.sha` and
    `red-commits` and appends the old -> new map to `reviews/history-map.txt`, as `fold-history.sh` does. It runs
    after the landing fold and before `main` is merged; the pre-re-sign head is kept on the remote as an archive
    ref. The rule that only `fold-history.sh` rewrites a mission branch stands, with this one approved exception.
12. **2026-11-16, the re-sign is redone with commit signatures kept** (the operator's decision in the orchestrator's
    session, session_01NUfZSc26YwQLeow31d6R6X, after mission 008 found the flaw; confirmed here: "Redo with signing
    kept"). The first run of decision 11's script rebuilt every commit with signing switched off, so of the branch's
    commits 73 of 97 carried an SSH signature before it and 3 of 76 after it (head 285ae9d, kept on the remote as
    `archive/claude/008-layout-headers-resign-unsigned`). The script now signs every rebuilt commit
    (`commit-tree -S`) and fails if one lacks a `gpgsig` header, and it excludes `origin/main` from every revision
    list so commits of main that came in through a merge are never rebuilt. The landing fold and the re-sign are
    redone from 567e476 (`archive/claude/008-layout-headers-pre-resign`), the merge parent 3828d2f is kept, and the
    remap, `gate:signoff` and the red/green check of every phase are re-run before the force-push with lease, which
    the operator approved.
13. **2026-11-16, the Plants shard times at landing are accepted** ("Accept, same follow-up op"). On CI run
    https://github.com/Ocelle-HQ/ocelle-components/actions/runs/43943196107 (head `cd80093`, all 78 jobs green), 14 of
    the 28 Plants shard jobs took longer than mission 006's 570 s stop-and-ask limit: shards 6 to 19, from 696 s to
    907 s. Nothing failed, because the shard jobs have no timeout. It is the growth that mission 013's landing
    accepted, with its follow-up op that re-splits the plants shards and bounds the cleanup step; this pull request
    changes no shard. `verification.md` item 2 records it.
