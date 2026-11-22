---
phase: 6
round: 2
verdict: approved
base: 493142e972c437175f59b9c4c725a1fd1b47e91a
head: 238bf98
tdd_check: pass
---

# Phase 6 review, round 2

This round reviews the changes since round 1 (`6047f9e..238bf98`):
- the operator's decisions 2 to 4 (`1c8a26b`);
- the planner's amendments (`039018a`);
- the round 1 fix (`ceb441b`, `round-1-fixes.md`);
- the red/green record (`238bf98`).

The whole-phase diff `493142e..238bf98` was read in round 1. Since then no file under `packages/elements/src`,
`storybook/`, `gates/`, `packages/tokens` or `packages/styles` has changed.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R2-01 | note | packages/elements/src/ocelle-link.ts:6-7 | The module's header comment still says a modified activation "(Ctrl, Meta or Shift held, or a middle click) is the browser's own (a new tab or window)". Under operator decision 2 that is wrong for Meta. The comment is the only stale copy left: spec, research, plan, tasks, contracts, README and CHANGELOG all carry the decision. The spec's line 66 keeps the original wording, but that is the historical record of decision Q2 (a). The comment has no behaviour, and the manifest's event description does not repeat the claim. | Correct the comment the next time the file is touched (phase 7 polish at the latest), for example "is the browser's own (a new tab or window for Ctrl, Shift and the middle click; the platform's convention for Meta)". |

## Test quality

- **TDD check**: `tdd-check.json` is `pass`. Head is `ceb441b`. Exit codes: final tests on base 2, on the scaffold 1,
  at head 0. The recorded red commit is still `2794722`. `238bf98` only adds the record.
- **Skipping a fix red commit holds.** The fix skill (`speckit-story-fix` step 3) asks for a red commit only for
  findings that the code behaves wrongly. R1-01 was a spec defect over correct code: the element already emitted
  nothing and left the default alone for Meta. Its fix is a stronger test plus documentation, which step 3 puts in the
  fix commit, so a red commit is not possible here. The new assertions would pass on the old code because the code was
  right. R1-02 and R1-03 are documentation findings, and the skill exempts those from red. The fix note gives the
  reasons, and I checked the evidence it offers in place of a red commit:
  - **The Meta plant, applied by me.** I dropped `event.metaKey` from the click handler (`ocelle-link.ts:162`) and
    ran `vitest run --project elements-browser packages/elements/test/browser/link.test.ts -t "US5-13, with href"`.
    It exits 1, with 1 failed and 24 skipped. In that run, both `meta` (the Meta click) and the new `metaEnter`
    (Meta+Enter) receive an `ocelle-link-activate` with `{ href: "link-target.html" }` and a click with
    `defaultPrevented: true`, against the expected no event and `false`. The source was restored and checked with
    `cmp`.
  - **The new README fragments.** I ran `readme.test.ts` (elements-node) against the README of `039018a`. It exits 1,
    with 2 failed and 230 passed: the corrected modifier sentence and the axe two-line statement. At head both pass.
- **Tests changed since round 1.**
  - `scenarios/link.ts` (US5-13 with `href`): the body adds Meta+Enter on a fresh page and the `metaEnter`
    expectation. Nothing was removed. The Meta click keeps its assertions, and Ctrl, Shift and the middle click keep
    "no navigation in place".
  - `readme.test.ts`: the old "new tab or window" fragment is replaced by the sentence operator decision 2 requires,
    which is longer and still contains every claim of the old one except the one now known to be false for Meta. The
    axe fragment is added.
  - No test was skipped, loosened or deleted. test-lint passes.

## Earlier findings

- **R1-01 (blocking): resolved, as operator decision 2 (a) states.**
  - US5-13 (spec.md:690-697) now states only the element's part for Meta, by click and by Enter. "Does not navigate
    in place" is kept for Ctrl, Shift and the middle click.
  - FR-046 (spec.md:973-980) and FR-049 (spec.md:993-996) say the same. The decision is recorded at spec.md:146-153,
    with the declined options (b) to (d).
  - research R-08 (:459-462) and R-11 (:633-637), contracts § Pairings (:196-197), plan step 6 (:335-338) and tasks
    T093/T095 all follow the decision.
  - The fixture body adds Meta+Enter with `href` (link.ts:794-796, 812).
  - The README (:462-468) and CHANGELOG (:53-55) give the platform's convention for Meta. That is the README
    correction the decision asks for, and the documentation test checks it.
- **R1-02 (note): resolved, as operator decision 3 states.** data-model.md § Link state (:81, :85-87) lists `label`
  with the rules of FR-045 and contracts § `ocelle-link`. It also says that a host `aria-label` is not an input, in the
  same form as the tabs' sentence. The type column reads "string or `null`", where the contract and manifest say
  default `undefined`. The `href` row of the same table already uses that convention, so this is not a contradiction.
- **R1-03 (note): resolved, as operator decision 4 states.**
  - README :477-480 states the axe-core 4.14.0 two-line `color-contrast` incomplete (`bgOverlap`), its cause, and that
    it is not a contrast failure. Its "one line or three lines" matches what I measured in round 1.
  - research R-08 (:541-551) records the same, with FR-051 unchanged and no exception added.
  - notes.md records the upstream axe-core report as still to be filed. That matches the decision, which says it is
    not filed from this run.
- **Planner's amendments: consistent.** I searched spec, plan, research, contracts, data-model, quickstart, README,
  source and manifest for "new tab or window" and "new-tab". Every hit outside the historical Q2 record (spec.md:66)
  either distinguishes Meta or is the R-08 "Alternatives" paragraph, which is about losing new-tab behaviour in
  general and is still true. The one remaining stale copy is the source comment in R2-01.

## Checks run

These ran on `238bf98`, with `OCELLE_CHROMIUM_PATH` set and `OCELLE_VISUAL_ENGINE=docker`. I chose them from the
diff since `6047f9e`, which touches only the test scenarios, the documentation test, the README, the CHANGELOG and
the spec artifacts.

| Check | Exit | Result |
|---|---|---|
| `gate:typecheck` | 0 | no type error |
| `gate:lint` | 0 | 320 files, no finding |
| `gate:test-lint` | 0 | 217 files, no finding |
| `gate:prefix` | 0 | 302 files, no finding |
| `gate:brand-rules` | 0 | 7 rules |
| `gate:manifest` | 0 | 11 elements, no finding |
| `gate:signoff -- --range 493142e..HEAD` | 0 | 14 commits, no finding |
| `gate:unit-tests` | 0 | 4028 tests in 168 files (one more README fragment than round 1) |
| Meta plant, `elements-browser` US5-13 with href | 1 (expected) | 1 failed: the Meta click and the Meta+Enter both emit and prevent the default |
| `readme.test.ts` on the README of `039018a` | 1 (expected) | 2 failed of 232: the two new fragments |

These were not rerun. Their inputs are unchanged since round 1, where each exited 0 on `6047f9e`:
- `gate:mutation`: no source line changed.
- storybook-build, visual and axe: no story, source, CSS or baseline changed.
- csp: the build output is unchanged.
- contrast and style-lint: no CSS or tokens changed.
- `gate:plants`: no gate or plant changed.
- `vitest run --project elements-browser-file`: neither its test nor the source changed.
