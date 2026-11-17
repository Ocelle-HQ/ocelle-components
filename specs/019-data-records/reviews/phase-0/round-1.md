---
phase: 0
round: 1
verdict: approved
base: 8ee3351efb9f6e14023d5900ac7f4a26931c48f8
head: bf7c4f51f2e48717bf3672f9670f45a6e25973f9
tdd_check: exempt
---

# Phase 0 review, round 1

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | specs/019-data-records/reviews/phase-0/tdd-check.json:1 | `head` is 4243df2, one commit behind HEAD (bf7c4f5). The only later commit is the one that adds `tdd-check.json` itself, so the check is current for the phase's content. | None. |
| R1-02 | note | specs/019-data-records/reviews/phase-0/plants.md:30-34 | The five visual plants ran under docker only (`OCELLE_VISUAL_ENGINE=docker`, the operator's standing rule, no podman here). CI's Plants check judges the podman side. | None. |

No blocking finding.

## Test quality

- **TDD check: `exempt`.** `tdd-exempt.md` says phase 0 changes no source, test, style, story or configuration. I
  checked that against `git diff --name-only 8ee3351..HEAD`: every path is under `specs/019-data-records/`. Phase 0 is
  a document recheck (T001, T002), so nothing could be asserted as false before the phase and true after it. No test
  could fail for this phase, and the exemption holds.
- No test was added, changed, weakened or deleted. There is no red commit and no `scaffold.sha` to check.
- **Mutation:** `pnpm run gate:mutation -- --base 8ee3351` printed "nothing to mutate: no package or gate source line
  changed since 8ee3351". No surviving mutant.

## Tasks and record

- T001 and T002 are ticked (`tasks.md` 138 and 151), and their work is present:
  - `reviews/recheck.md` covers each of T001's ten items in its own section with "as planned", "as on `main`" and
    "difference".
  - Its five differences went to the operator as multiple-choice questions (Q1 to Q5). The operator answered them in
    `reviews/recheck-decisions.md`, and the planner applied them in 827b34a.
  - The second pass found Q6, which was answered (a) and applied in b282a98 and 0d57425. The third pass records no
    open difference.
  - The `contracts/checks.md` helper renames are in the T001 commit 4b97b7a, as the task requires.
  - `tdd-exempt.md` is in the same commit.
- **Spot-checked against the tree.** I compared these recheck citations with the files:
  - `overflow-region.ts`: 99-106 (options `box`, `role`, `step` only, so there is no pinned-start option), 160-172
    (`.region-edge` at `var(--ocelle-scroller-fade-size)`, `.end`), 304-311 (defaults `"group"` and 40), 490-498
    (the fade depth read as the edge's `getBoundingClientRect().width`);
  - `source.ts`: 48-57, 151-153 (011's eyebrow tokens, weight `strong`), 168, 170, 175-182, 205;
  - `--ocelle-tracking-caps`: absent from `packages/` except the comment in `source-table.test.ts` 101;
  - `fold-history.sh` 33 (refuses merge commits in `<base>..HEAD`);
  - `readme.test.ts` 55-58 (the two pinned sentences);
  - `base.css` 46-52 (the facts rule in the base layer);
  - `driver.ts` 301 (`deepActive`) and 384 (`activeElement`).

  All match the record.
- The phase changes nothing outside its scope without a reason. The changes to spec.md, plan.md, research.md,
  data-model.md, quickstart.md and the contracts, and the wording of T013, T015, T017, T021, T024, T035, T043, T059 and
  T066, are the planner's application of operator decisions Q1 to Q6. `reviews/recheck-fixes.md` lists them change by
  change, and none ticks or adds a task.
- Constitution: the phase adds no element, style, story or source, so Principles I to V do not apply to it. The
  plan's Constitution Check rows were updated for Q1, Q2 and Q5 (recheck-fixes.md), and every commit is signed off.
- Plants:
  - `plants.md` has base `8ee3351…`, which equals `base.sha`, and exit 0.
  - I ran `pnpm run gate:plants -- --affected 8ee3351… --list` and got the same 10 `note: affected:` lines as the
    record, in the same order, all by `specs/019-data-records/plan.md`. The selection is the same.

## Checks run

All checks ran on HEAD bf7c4f5 with Node 22 and `OCELLE_CHROMIUM_PATH` set to chromium-1248, one at a time.

| Check | Result |
|---|---|
| `gate:typecheck` | exit 0, no type error |
| `gate:lint` | exit 0, 419 files, no finding |
| `gate:style-lint` | exit 0, 37 files, no finding |
| `gate:test-lint` | exit 0, 304 files, no finding |
| `gate:prefix` | exit 0, 344 files, no finding |
| `gate:signoff -- --range 8ee3351..HEAD` | exit 0, 11 commits, no finding |
| `gate:pins` | exit 0 |
| `gate:config-copies` | exit 0 |
| `gate:contrast` | exit 0, 169 pairs light, 177 dark |
| `gate:brand-rules` | exit 0, 7 rules |
| `gate:manifest` | exit 0, 18 elements |
| `gate:csp` | exit 0, 35 files, no finding |
| `pnpm test` (unit and interaction) | exit 0, 7018 tests passed in 218 files |
| `gate:storybook-build` | exit 0, 143 stories |
| `gate:axe` | exit 0, 286 runs, 0 serious or critical (10 excepted notes, all existing) |
| `gate:visual` (docker) | exit 0, 286 captures match their baselines |
| `gate:mutation -- --base 8ee3351` | nothing to mutate (no source changed) |
| `gate:plants -- --affected 8ee3351 --list` | exit 0, same selection as `plants.md` |

## Earlier findings

None. This is round 1.
