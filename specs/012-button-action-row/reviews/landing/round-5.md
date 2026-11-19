---
phase: landing
round: 5
verdict: changes_requested
base: b594b7e98bb5480aad9cc8dcf0bd3f7f378f920f
head: e676357f970a8d838b4cc0e3f11c45a607cc018b
tdd_check: pass
---

# Landing review, round 5

This is a check-only round under the landing stop rule (`.claude/skills/ocelle-land/SKILL.md`, step 6, "Stop rule").
Round 4 approved head e981439. This round checks only that the folds since then regressed nothing. It does not search
afresh.

`git log e9814390..HEAD` lists 25 commits. Leaving out docs and review records, they are:

- **Phase 2 fix round 4** (operator rounds 5 and 6, O3-01 and O6-01). Red fix-4 is 19921596 and red fix-5 is
  082fcd50. Green is f379592c, and R7-02's comment move is 571a8ed5. The CSS change is
  `.icon-row:not(.bare) > .label { align-self: baseline; }` in `packages/elements/src/icon-slot.ts:42-44`. The fold
  also adds the README and CHANGELOG lines, their pin tests, two scenarios in `test/scenarios/button.ts`, one in
  `test/scenarios/slot.ts`, and 10 regenerated `ocelle-button` baselines.
- **Phase 6 fix-4** (O7-01). Red is eb342bda and green is 644c6820. `gates/test/integration/visual.test.ts` changes
  `const timeout` from 600_000 to 1_200_000 and adds a reason comment. The pin test
  `gates/test/visual-timeout.test.ts` is new.

origin/main (b594b7e) is an ancestor of HEAD.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R5-01 | blocking | `.specify/extensions/story/scripts/verdict.sh` 2 and 6; `units.sh`; `reviews/phase-2/plants.md:44-55`; `reviews/phase-6/notes.md` (T083) | I found no regression in the code. The folds are still not settled, though, and the landing skill's own precondition (step 3: every phase `verdict.sh` approved or accepted, `units.sh` prints `[]`) fails on HEAD. **Reproduction:** `verdict.sh 2` and `verdict.sh 6` both print `"verdict":"changes_requested"` (round 7 each). `units.sh` prints phase 6 with `"open":1` (T083, the CI record on the pushed head) and phase 2 with round 7 changes_requested. The operator's R7-01 decision (`phase-2/plants.md` § Operator decision) makes the CI Plants run on the pushed head the full plants evidence for f379592c's 10 moved baselines. It also says "Then a short phase 2 round 8 and landing checks", and its run link is still `_to be added after the push_`. Nothing has been pushed since CI run 44481594952, which failed the visual integration test at 600 s. So no CI run covers the 1200 s limit, the moved baselines or the plants. An untracked `reviews/phase-2/round-8.md` (verdict approved, head e676357f) appeared in the working tree while I was reviewing. It is not committed, so I do not count it. | Push the head. Record the CI run (all fourteen required checks, Plants on all shards, the visual integration test passing under 1200 s) in `phase-6/ci-run.md` (T083) and the run link in `phase-2/plants.md`. Commit the phase 2 round 8 approval and get a phase 6 round 8 approval, so that `verdict.sh` says approved for every phase and `units.sh` prints `[]`. Then run a check-only landing round 6 on those records. It needs no fresh code review: the code-level checks below found nothing. |
| R5-02 | note (follow-up) | `reviews/phase-{1,2,3,4,5}/*.log`, line 5 | 20 committed evidence logs still contain the host's pnpm store path (redacted here; found with a `git grep` for host home-directory paths). This is not a regression. At e981439 there were 27 such logs, and phase 2's regenerated check logs dropped 7 of them. No line added since e981439 adds a `/root/` or `/home/<user>` path, an email other than the `noreply@anthropic.com` trailer, or a key. Phase 6 redacted its own copy (R5-02 of phase 6), so these could get the same `<pnpm store>` redaction at the history fold. | Offer as a follow-up, or redact in the fold. Not required for this round. |

## Earlier findings

| ID | Status | Evidence |
|----|--------|----------|
| R3-01 (blocking) | **resolved, still** | `tasks.md` T073 to T077 remain `- [X]`. The only open box is T083, under R5-01. |
| R2-03 (note) | **carried** | Unchanged; still for the follow-up issue. |

## Lenses on the folds

**Correctness and fail-closed behaviour of the changed gate test.** `gates/test/visual-timeout.test.ts` reads
`integration/visual.test.ts` as text and requires exactly one `const timeout = <literal>;`, with a value from
1_200_000 to 1_800_000 and the cited figures in the comment directly above it. It fails closed in each case. If the
declaration is missing, `declarations()` is empty, `lines[-1]` becomes `""`, the value is `NaN` and the range
assertion fails. The comment test then sees an empty run. I mutated `visual.test.ts` in place five ways and restored
it each time (`git diff --quiet HEAD -- gates packages` was clean afterwards):

- 1_199_999: 1 failed.
- 1_800_001: 1 failed.
- `let` instead of `const`: 3 failed.
- A second `const timeout = 600_000;`: 1 failed.
- The run ID removed from the comment: 1 failed.

All 11 `timeout` uses in the file still reference the constant (lines 128 to 331). `axe.test.ts` and
`plants-robustness.test.ts` keep 600 s, as the operator's "visual only" answer says. The CI shard limit
(`ci.yml:90`, 45 or 10 minutes) is per shard and was not changed. Whether the visual shard fits under it with 1200 s
per test is for the pushed CI run to show (R5-01). The local figure in `phase-6/notes.md` is 509 s for the capture
test.

**Accessibility and visual effect of the CSS change.** The rule changes only `align-self` on `.label`, a direct child
of a `.icon-row` without `bare`. That affects neither the accessibility tree nor the name. `ocelle-button.ts:504`
sets `bare` exactly when `#labelled` is false, so icon-only buttons (default, compact, busy) keep their earlier box.
The new scenario checks this against a native `<button>`'s svg, and its plant (the unscoped rule) is recorded.
`ocelle-action-row` uses `iconSlotStyles` but renders no `.icon-row`/`.label` pair (`ocelle-action-row.ts:647`), so it
is unaffected. That matches the absence of action-row baselines among the 10 that moved. The phase 2 notes record
`gate:axe` under docker on f379592c: 388 story-themes, no serious or critical violation.

**Public surface.** The README text (lines 1304-1308, 1330-1333) and the CHANGELOG line under Unreleased › Changed
match the code:

- the label wrapper's markup;
- `bare` as a convention modifier;
- labelled rows only;
- icon-only controls unchanged;
- action rows not mentioned as moved.

The CHANGELOG's figure, "4.6 to 6.2 px", is the measured offset before the fix, and `icon-slot.ts:12-13` gives the same
figure. The README and CHANGELOG pin tests pass (689 tests across the two node test files).

**Test quality.**

- **Phase 2.** `tdd-check.json` passes with head f379592c. Red fix-4 has 9 failures, red fix-5 has 11, and HEAD
  passes. All the failures are assertion failures on the new statements and scenarios. Phase 2 round 7 R7-03 already
  noted that the scaffold and base sub-checks exit 2 from a setup failure, which is the known overlay follow-up.
- **Phase 6.** `tdd-check.json` passes with head 644c6820. `red-fix-4.log` fails the pin test's range and comment
  assertions for the right reason (600000 < 1200000; the comment lacks `44481594952`). The single-declaration test
  passes at red, and its plant is in `phase-6/plants.md`.
- **Vacuous tests.** The pin test's mutants above all fail, and the icon-only scenario's plant fails, so neither is
  vacuous.
- **Later commits.** Since 644c6820 only `tdd-check`/docs commits follow, so both checks still stand for HEAD.

**Rule 8 privacy.** See R5-02. Nothing was added since e981439.

## Checks run

| Command | Result |
|---------|--------|
| `git diff --stat e9814390..HEAD -- . ':!specs'` | 21 files: the 2 gate test files, the elements src/tests/docs, the tokens CHANGELOG, the run summary, 10 PNGs |
| `pnpm vitest run --project gates gates/test/visual-timeout.test.ts` | 3 passed; five mutants each fail (above) |
| `pnpm vitest run --project elements …/test/button.test.ts …/test/slot.test.ts` | 160 passed |
| `pnpm vitest run …/test/node/readme.test.ts …/test/node/changelog.test.ts` | 689 passed |
| `pnpm run gate:typecheck` | no type error |
| `pnpm run gate:lint` | 447 files, no finding |
| `pnpm run gate:signoff -- --range origin/main..HEAD` | 132 commits, no finding |
| `verdict.sh 1`…`6`, `units.sh` | phases 2 and 6 changes_requested; phase 6 T083 open (R5-01) |
| `git diff e9814390..HEAD` privacy grep | no host path, email or key added |

Not run here: the browser-fixture harness, `gate:visual`, `gate:axe`, `gate:plants` and the visual integration test.
CI on the pushed head is the evidence for those (R5-01).

verdict: changes_requested

_Orchestrator note: R5-02 was folded in 4460373d (the 20 logs now read `<pnpm store>`), and the path quoted in this finding was redacted under rule 8._
