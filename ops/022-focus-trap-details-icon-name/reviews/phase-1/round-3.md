---
phase: 1
round: 3
verdict: changes_requested
base: dd69835e5500a7bf0757b43e542f8d9dc978953f
head: f0680d3
tdd_check: unavailable
---

# Phase 1 review, round 3

Scope (stop rule): the resolution of round 2's findings O2-01 to O2-06 by the `fix-2` commits (red `60ee031`, fix
`d5db6c8`, planner amendments `9aa98de`) and regressions from them; no fresh search. Main is merged into the branch at
`1b8b0b2`; main changes none of the phase's sources (`focusable.ts`, `ocelle-button.ts`, `icon-slot.ts`).

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R3-01 | blocking | ops/022-focus-trap-details-icon-name/reviews/phase-1/tdd-check.json:1 | The red/green check is stale: it describes head `39d029b` and only the `phase` red commit, not `fix-2` (`60ee031`) or HEAD. Per operator decision 10 it could not be rerun here (killed twice by container restarts), so for this round the status is `unavailable`. The phase has behaviour, so this blocks per the review procedure (step 3). The red evidence for `fix-2` itself is sound (see *Test quality*). | Run `.specify/extensions/story/scripts/tdd-check.sh 1` on the final head, as decision 10 already plans, and commit a `tdd-check.json` with `status: pass` that lists both `phase` and `fix-2`. |
| R3-02 | blocking | ops/022-focus-trap-details-icon-name/reviews/phase-1/plants.md:3-7 | The fix replaced the plants record with one whose base is the merge base `1b8b0b2`, not `base.sha` (`dd69835`). The procedure (step 5, *Plants*) makes another base a blocking finding. Reproduction: `pnpm run gate:plants -- --affected dd69835… --list` gives the single line `note: affected: every plant, by packages/elements/custom-elements-manifest.config.mjs (not mapped)`, which comes from main's change merged in. `--affected 1b8b0b2 --list` gives exactly the record's 21 `note: affected:` lines. So the record's reasoning holds: from the merge base it selects the phase's own changes. It still departs from the procedure, and no recorded operator decision allows it (decision 9 covers skipping long local runs, not a different plants base). | Either the operator records a decision that a phase with main merged in records plants from the merge base (then this record stands as it is), or the record is rerun from `base.sha` (every plant, or CI's run of them, by decision 9). |
| R3-03 | note | packages/elements/src/focusable.ts:71 | Mutation: the two mutants of `style.display === "contents"` in `hostRendered()` (`→ true`, `→ !==`) end as timeouts, not kills. That is a report the gate counts as detected, not a survivor. The `display: contents` pins and the `hidden` host row cover the line. | None. |
| R3-04 | note | packages/elements/src/focusable.ts:84 (`::details-content`) | Self-reported in `notes.md` § *Round 2*: WebKit was not measured. If `::details-content` is unsupported there, a `display: contents` opaque host that is a direct child of a closed `details` would stay a candidate in WebKit. CI's browser matrix will show it if a WebKit project runs these rows. | None in this round. A follow-up if CI or a WebKit measurement shows it. |

## Test quality

- **Red evidence (`fix-2`).** `red-commits` has `fix-2 60ee031…`. `60ee031` changes only `packages/elements/test/scenarios/dialog.ts`: 12 new rows in `detailsRows`, inherited by the drawer, and no existing row changed. `red-fix-2.log`: `33 of 9801 tests failed`. 28 of them are this round's Tab rows, 7 cycles in each of the four dialog and drawer suites (in process and strict-CSP fixture). They fail on the focus path (`AssertionError` on the observed path, no setup error): the closed-`details` rows with `ocelle-test-closed` and with `<x-probe>` (spec scenario 11), the `display: contents` hosts in a closed `details` (direct child and inside a div) and in a `content-visibility: hidden` div, and the `hidden` and `visibility: hidden` hosts. The other 5 failures are the docker-bound `gates/test/integration/visual.test.ts` rows (no daemon), which this op does not touch, as in the phase red. Pins that pass on main: scenario 12 (open `details`), both rendered `display: contents` hosts, and the Shift+Tab directions. This matches round 2's required change for O2-01.
- **Weakened tests.** `git diff 60ee031..HEAD` changes no test file. The fix commit `d5db6c8` touches only `focusable.ts`, `README.md` and op records.
- **Vacuous assertions.** The new rows use the existing `cycleRows` builder: full expected Tab and Shift+Tab paths, deep-equal on the observed path. There is no conditional, `skip` or `only`.
- **Mutation.** `pnpm run gate:mutation -- --base dd69835… --files packages/elements/src/focusable.ts` (the source the fix changed) exited 0: `48 mutants on the changed lines of 1 file, none survived; 2 timeouts, 8 compile errors, 0 zero-mutant entries; 0 equivalent records`. The `getClientRects()` disable comment and its equivalent record are gone. `notes.md` marks the record superseded. No mutant is disabled in `rendered()`, `hostRendered()`, `shows()`, `flatParent()` or the opaque branch. The compile errors (empty bodies, `??`→`&&`, `if (false)`, candidate literals) are reports. The timeouts are R3-03.

## Checks run

CI-first (operator decision 9). Run locally on `f0680d3`:

- `gate:typecheck`, `gate:lint` (562 files), `gate:style-lint`, `gate:test-lint`, `gate:config-copies`, `gate:csp`,
  `gate:prefix`, `gate:manifest` (32 elements): each exit 0, no finding. `gate:signoff -- --range 1b8b0b2..HEAD`:
  15 commits, no finding.
- `npx vitest run --project elements --project elements-browser dialog drawer button`: `Test Files 13 passed (13)`,
  `Tests 1921 passed (1921)`. No existing opaque, iframe, media, sentinel, scroller or radio row regressed.
- Mutation as above. One Stryker run only; the session reported one process killed for memory during it, and the gate
  still exited 0 with a complete summary.
- Plants: `--list` from `base.sha` and from the merge base (R3-02). No plant was judged again.
- Not run locally, left to CI on `f0680d3` (decision 10): the full suite, the visual gate, the visual plants, WebKit,
  and `tdd-check.sh 1` (R3-01). This review did not read CI's results.

## Earlier findings

Round 2 (operator round):

- **O2-01 (blocking): resolved.** The opaque branch of `walk()` (`focusable.ts:144-153`) now pushes a host only when
  `hostRendered()` holds (`:68-72`), with `shows()` (`:81-85`) and `flatParent()` (`:88-90`). It came with a red test
  (`fix-2`, `60ee031`). The landing review's reproduction is now a green row in both overlays: closed `details` with
  `ocelle-test-closed` or `<x-probe>`, Tab from the summary, expected `dlg[button] b1 s dlg[button] b1`, measured
  `body dlg[button] b1 s body` on main. README's dialog **Focus** (`packages/elements/README.md:488-489`) and the
  CHANGELOG entry are unchanged and now hold for this case. `notes.md` records why the plan's example reading (nearest
  boxed ancestor) was not enough, and that the stop condition did not fire. `overlay.ts` is unchanged.
- **O2-02 (blocking): resolved.** README **Name order** (`packages/elements/README.md:1315-1317`) scopes the promise to
  an `ocelle-button` named by its label, `label` or the host, and says an icon-only button with none of these is named
  from its content. The `readme.test.ts:484` pin stays contiguous at `:1314-1315`, and the suites pass.
- **O2-03 (blocking): resolved** by the planner in `9aa98de`. `spec.md:77` says scenario 2 passes on main, citing the
  red run, and SC-001 (`spec.md:164`) no longer lists it as red.
- **O2-04 (blocking): resolved.** `rendered()` (`focusable.ts:58-60`) is `visibility === "visible" &&
  checkVisibility()`. The `getClientRects()` test, its disable comment and its equivalent record are gone (record
  marked superseded in `notes.md`), FR-001 is amended in `9aa98de`, and the mutation gate leaves no survivor. This is
  not a behaviour change, so no red is needed.
- **O2-05 (blocking): resolved.** `notes.md` § *Round 2*, *Folded red-log commits* says that `f5b0bdf` and `3f86a0c`
  were squashed into `55b77a6` and live only on `archive/claude/057-focus-trap-icon-a11y-prefold-phase-1`. Both red-log
  sections point there, and `plan.md`'s Principle VIII row says so too.
- **O2-06 (note):** no change in this op, as decided. It stays a follow-up.

Tasks T016 to T020 are ticked and their work is present. Nothing outside the phase's files changed in the fix
commits.

Verdict: `changes_requested`, only on R3-01 (stale red/green check, already planned for retry by decision 10) and
R3-02 (plants base, which needs an operator decision or a rerun). Every round-2 finding is resolved, and the fix
caused no regression in the checks run.
