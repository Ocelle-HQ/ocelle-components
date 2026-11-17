---
phase: 2
round: 5
verdict: approved
base: 6c9400cbaa1da7d2b1ce96d496e65101942524a0
head: 07b8a3d
tdd_check: pass
---

# Phase 2 review, round 5

This round reviews the fix round for the operator round `round-4.md` (O4-01 and O4-02, which are landing notes L1-03
and L1-04 of `reviews/landing/round-1.md`). The change is `git diff 8d46b78..07b8a3d`, with no uncommitted change:
red `e3ed824` (`red.sh 2 fix-4`), green `99e2815`, tdd-check `07b8a3d`. In code it changes three files:
`packages/elements/README.md` (+3 −1), `packages/elements/src/ocelle-notice.ts` (one comment line) and
`packages/elements/test/node/readme.test.ts` (+2). It also ticks T025c and T025d in `tasks.md` and adds the evidence
files of `reviews/phase-2/`. The stop rule applies, so I checked that O4-01 and O4-02 are resolved and that nothing
regressed, and did not search afresh.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R5-01 | note | specs/010-feedback-forms/reviews/phase-2/plants.md:3-12 | The plants record uses base `8d46b78`, the red commit's parent, not `base.sha` (`6c9400c`). Read literally, step 5 makes this blocking. I judge it a note, for the same reasons as phase 4's R3-01. (1) I confirmed that `--affected 6c9400c --list` selects "309 of 309" with the single line "every plant, by gates/bin/plants.ts (shared gate source)", because the merge of `main` changed the shared gate source, and `main`'s own Plants check judged that change. (2) The phase's own source change was judged at its base by the T023 run, which is the file's previous version in history (`f307ff7`, as plants.md says). (3) The only source change of this round is a comment in `ocelle-notice.ts`, and this run covers it. `--affected 8d46b78 --list` gives exactly the 21 `note: affected:` lines of the record (diffed), and the recorded exit is 0. CI's Plants check still judges every plant. | None. |
| R5-02 | note | specs/010-feedback-forms/reviews/phase-2/red-fix-4.log:5; round-4-fixes.md:39 | The red log keeps pnpm's store path `/root/.local/share/pnpm/store/v11` as the tool printed it. This is disclosed, it is the known and accepted recurrence (phase 4 R3-02), and the log was not edited by hand. The line is pnpm's install banner, not test output. | None. |
| R5-03 | note | specs/010-feedback-forms/reviews/phase-2/round-4-fixes.md:29,34-37; tasks.md T025d | T025d names `gate:mutation -- --base <phase 2 base>`. The fix ran it against `8d46b78` (the red commit's parent, as the orchestrator asked) and says so. I ran it against the phase base myself (Test quality): exit 0, none survived. The task's requirement is therefore met by the review run. | None. |

No blocking finding.

## Test quality

- **Red evidence.** `e3ed824` changes only `packages/elements/test/node/readme.test.ts` (+2: a comment and one item in
  `fragments`). `red-fix-4.log` fails 1 of 4740 tests, and the one failure is that item:
  `readme.test.ts:420 … AssertionError: expected '# @ocelle/elements …' to contain 'The bar and the ground differ from on…'`.
  So it fails on the assertion against the README of `8d46b78`, with no setup or import error. `check-red-fix-4.log`
  (the tdd-check's independent rerun) agrees. `red-commits` has the entry `fix-4 e3ed824…`.
- **Not weakened.** `git diff e3ed824..HEAD -- packages/elements/test` is empty, and the earlier red items are
  untouched.
- **Assertion.** The item goes through the existing `it.each(fragments)` with
  `expect(readme).toContain(flat(fragment))` (`readme.test.ts:419-421`). This is a real assertion on the shipped
  README, and the red run shows that it can fail. It asserts the full sentence that L1-04 asks for: only colour, not
  at all in forced colours, so the host's text must state the tone.
- **O4-01 is not behavioural.** It changes a comment only, so no red test is needed (round-4-fixes.md says so).
- **Mutation.** `OCELLE_CHROMIUM_PATH=<chromium 1243> pnpm run gate:mutation -- --base 6c9400c --files packages/elements/src/ocelle-notice.ts`
  at `07b8a3d` exits 0 with "441 mutants on the changed lines of 1 file, none survived; 0 timeouts, 112 compile
  errors, 0 zero-mutant entries; 10 equivalent records". The 10 records are those judged in earlier rounds, except
  `:343`, which now reads as `form-control.ts:478` gives it. I checked it against the module: it imports only
  `LitElement`, `css` and `html` from `lit` (`ocelle-notice.ts:11`), and the template (`:497-500`) uses no directive.
  So the mutant stays equivalent and the reason is accurate. The fix's own run against `8d46b78`
  (`mutation-fix-4.log`) reads the same record and has 0 mutants on the changed lines, as expected for a comment.
- **tdd-check.** `tdd-check.json` is `pass` at `99e2815`: `phase` exit 1, `fix-1` exit 1, `fix-4` exit 1, base
  exit 2, scaffold exit 2, head exit 0, no problems. `07b8a3d` adds only the check's own outputs. The rerun
  `check-red-fix-1.log` now fails 11 instead of 10, because a fixture-page cell flipped. That is the run-to-run
  variance already recorded in round 3 (R3-01). The exit is still 1 with assertion failures, and it is not a
  regression of this round.

## Checks run

| Check | Result |
|-------|--------|
| `pnpm test` (with `OCELLE_CHROMIUM_PATH` set to the installed Chromium 1243, as the fix's runs did; this tree's `setup:offline` looks for 1248, which this machine lacks) | exit 0: 4740 tests passed in 174 files |
| `pnpm run gate:typecheck` | no type error |
| `pnpm run gate:lint` | 355 files, no finding |
| `pnpm run gate:test-lint` | 255 files, no finding |
| `gate:mutation -- --base 6c9400c --files packages/elements/src/ocelle-notice.ts` | exit 0, none survived (above) |
| `gate:plants -- --affected 6c9400c --list` | 309 of 309, all because of the shared gate source (R5-01) |
| `gate:plants -- --affected 8d46b78 --list` | the same 21 `note: affected:` lines as plants.md; recorded exit 0 |

I did not judge the plants again (step 5).

## Earlier findings

- **O4-01 (blocking): resolved.** `ocelle-notice.ts:343` now reads: "LitElement's disconnectedCallback() tells
  reactive controllers, which the notice has none of, and disconnects its template's async directives, which it uses
  none of (its template uses no directive)". This matches `form-control.ts:478`, and it is accurate for this module
  (Test quality). It is a comment only, and the code line below it is unchanged.
- **O4-02 (blocking): resolved, test first.** The red `e3ed824` came before the green `99e2815`. `README.md:160-165`
  drops "so the ground is never the only mark of the tone" and adds: "The bar and the ground differ from one tone to
  another only by colour, and not at all in forced colours, so the host's text must state the tone, as "Run failed" or
  "Saved." does: the look of the box alone does not tell a warning from a success." The sentence is in plain language
  and has no planning ID: no FR, T, O or L number and no spec reference; the IDs are only in the test's comment. Its
  two examples are the README's own examples (`README.md:149`, `:151`). It says what L1-04 asked: colour is the only
  difference, forced colours remove it, and the host must put the tone in the text.
- **No regression.** No test was removed or loosened, every check passes, and the mutation run over the phase's whole
  change to the notice has no survivor.
