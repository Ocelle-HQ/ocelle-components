---
phase: 5
round: 2
verdict: approved
base: 4e8728e483683935a884cb24b9299926f1adc0bb
head: 02097a9245fe8cdee62b14c851a4e44fb404c6a6
tdd_check: pass
---

# Phase 5 review, round 2

This round reviews fix 1: the red commit `22a403aa`, the fix `cc7b71e3`, and `02097a92`, which carries the R1-03
comment per operator decision (a). I read them against round 1, `round-1-fixes.md` and `operator-decisions.md`
(Q-P5-1 (a), R1-02, R1-03 (a), R1-04). The rest of the phase is unchanged since round 1 and stands as judged there.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R2-01 | note | packages/elements/test/scenarios/pill-tag-interactive.ts:1044 | **"FR-035, no mode change" was added green in the fix commit, not in a red commit.** This is sound. It covers behaviour that was already correct: a static pill given an `href` that is not a link stays static. Its purpose is to kill the mutant `if (previous === next) return;` → `false` at `ocelle-pill-tag.ts:522`. Before the fix, that mutant was killed only through the R1-01 defect. `mutation-fix-1.log` run 1 shows the survivor and run 2 shows it killed, so the body can fail. It asserts observable host attributes, mirrors and the rendered root. | None. |
| R2-02 | note | packages/elements/src/ocelle-pill-tag.ts:498 | **The disable comment was extended after the last recorded mutation run.** `02097a92` changes only the reason text after the colon. The directive (`Stryker disable next-line ConditionalExpression:`) and its mutator name are unchanged, so the record is unaffected. I started a one-line confirming run, but it did not finish within 10 minutes. I stopped it and removed its sandbox. | None. CI's mutation run confirms it. |

There is no blocking finding.

## Test quality

- **Red evidence, fix 1.** In `red-commits`, `fix-1 22a403aa` has exit 1 (`tdd-check.json`, `check-red-fix-1.log`).
  - The red commit changes test files only. It adds the shared body "US4-10, focus before the first render" and adds
    `module.js` to the fixture page's allowed list.
  - Exactly two of 8243 tests fail: that body, in process and on the fixture. Both failures are assertions.
  - I confirmed the reason myself. I put the source of `22a403aa` (before the fix) in the working tree, ran the
    in-process body, and restored the file with `git checkout`. All four cases moved focus into the pill:
    - `s1`: `path` was `s1[a]`, with `inner: "a"`.
    - `s2` and `n2`: `path` was `[button]`, with `inner: "button"`.
    - `n1`: `path` was `n2[button]`, because `n2` was made in the same module and took focus.
  
  That is the missing behaviour of R1-01, not a setup error.
- **The `module.js` allowance.** This is not a loosening. The body's `driver.module()` loads a same-origin module
  that the fixture serves as `/module.js`, and personal-rail.test.ts allows it the same way. Every other part of the
  page check still runs:
  - CSP violations;
  - failed requests;
  - console messages;
  - requests outside the list.

  The amended first red run (`e30f1895`) also failed an unrelated `dialog.test.ts` timing body. The recorded run of
  `22a403aa` does not, and it is the one `tdd-check.sh` used.
- **Weakening.** `git diff 22a403aa..HEAD -- packages/elements/test` adds only the 15-line "no mode change" body.
  No assertion, case or expected value was changed or removed. There are no `skip`/`only` calls and no conditional
  expects (test-lint is clean).
- **Coverage of R1-01.** The body covers the four cases round 1 asked for, both directions each:
  - static → button → link;
  - static → link → button;
  - created → link;
  - created → button.

  It reads the focus path, the pill's focused inner element and the rendered control. It runs on both harnesses, and
  the fixture also asserts a clean console. That clean console is what exposed the second defect (`#control()` read
  `this.renderRoot` before Lit attached the shadow root). The fix covers that defect.
- **Mutation.** I rely on `mutation-fix-1.log` (`--files ocelle-pill-tag.ts:495-540`).
  - Run 2 had 48 mutants and no survivor.
  - The 2 timeouts and 13 compile errors are reports. Among the compile errors are the `?.` and `?? null` mutants of
    the two fixed lines, which strict TypeScript rejects.
  - There is one equivalent record, at line 498. I accepted it in round 1, and it is unchanged apart from the
    comment (R2-02).

## Checks run

Node 26 first on PATH, with `OCELLE_CHROMIUM_PATH` set. Per `reviews/operator-ci-first.md`, I ran the fast gates and
this phase's browser and visual tests.

| Check | Result |
|---|---|
| `gate:typecheck` | no type error |
| `gate:lint` | 478 files, no finding |
| `gate:style-lint` | 45 files, no finding |
| `gate:test-lint` | 355 files, no finding |
| `gate:manifest` | 23 elements, no finding |
| `gate:config-copies` | identical |
| `gate:csp` | 48 files, no finding |
| `gate:prefix` | 507 files, no finding |
| `gate:pins` | 5 manifests, no finding |
| `gate:contrast` | 207 pairs light, 215 dark |
| `gate:brand-rules` | 7 rules checked |
| `gate:signoff -- --range 4e8728e4..HEAD` | 12 commits, no finding |
| vitest `elements`: pill-tag-interactive, pill-tag, control, button, action-row | 5 files, 359 passed |
| vitest `elements-browser`: browser/pill-tag-interactive, pill-tag, button, action-row | 4 files, 279 passed |
| `gate:storybook-build` | built 213 stories |
| `gate:visual -- --engine docker` (`docker info`: 29.9.2) | 426 captures match their baselines |
| `gate:plants -- --affected 4e8728e4… --list` | exit 0; 116 selected; the `note: affected:` lines are identical to `plants.md` |
| `gate:mutation` | relied on `mutation-fix-1.log` (see Test quality); one confirming run not finished (R2-02) |
| R1-01 red reason (the pre-fix source in the working tree, then restored) | 1 of 1 failed: focus moved into each pill |

The full `pnpm test` at head is in `check-head.log`, from tdd-check: 8245 tests passed in 249 files.

**Plants.** `plants.md` records:
- base `4e8728e4…`, equal to `base.sha`;
- exit 0;
- 116 of 317 plants judged, every one as expected.

The selection matches my `--list` run line for line. The plants were run on the working tree holding the R1-01 fix.
Since then, only the comment of `02097a92` has changed, and the selection is the same. I did not judge them again.

**Tasks.** T045 to T055 are ticked. T055 now records the 116 plants. T056 and T059 now carry the items deferred
from phase 5 (tasks.md:289, 295). No file outside the phase changed in fix 1 apart from tasks.md and this phase's
review records. `ocelle-button` and `ocelle-action-row` have no diff since base (source and tests).

**Constitution.**
- III: the fix restores FR-035 (d) and WCAG 3.2.1. A switch moves focus only when focus was on the inner control.
  The change at `ocelle-pill-tag.ts:526` gives the same result as the old comparison whenever a control exists.
- VIII: the R1-01 fix came with a red test first.

**Plan.** R-08 is still followed: the refocus is queued, and it is still noted in `attributeChangedCallback`. Fix 1
changes no structure.

## Earlier findings

- **R1-01 (blocking): resolved.** `#modeChanged()` (`ocelle-pill-tag.ts:525-526`) now sets the refocus flag only
  when this holds: `this.#control()?.matches(":focus") === true`. With no rendered control the flag is false, so the
  pill no longer takes focus. `#control()` (`:538-540`) now returns `this.shadowRoot?.querySelector(...) ?? null`,
  which closes the second defect: a switch before the first connection no longer throws. The red test
  (`fix-1 22a403aa`) failed for the right reason (my probe above) and passes at head in both harnesses.
- **R1-02 (note): resolved.** The operator decided the 116 should be run. They were, and `plants.md` records them
  (see Checks).
- **R1-03 (note): resolved by operator decision (a).** Stryker 10.1.1 disables by mutator and line only, so the
  implementer's account holds. The disable is kept, and its comment (`ocelle-pill-tag.ts:498`) now says it also
  covers the killed `false` mutant. US4-12 and the line's `EqualityOperator` mutant still cover that behaviour.
- **R1-04 (note): resolved.** T056 and T059 name four items:
  - the tooltip half of § US4-10;
  - its plant "the refocus in `updated()` (not queued)";
  - the `min-inline-size: 0` chain;
  - `overflow-wrap: anywhere`.
