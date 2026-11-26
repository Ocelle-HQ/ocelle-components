---
phase: 7
round: 1
verdict: approved
base: dbc932227c3fb0912fb97bb619a1489ea9cc5e02
head: 25f5e68568754eca06e385151089d5a27a1c2063
tdd_check: pass
---

# Phase 7 review, round 1

Reviewed `git diff dbc9322..25f5e68` (red `fe1d413`, green `7a81113`, gate record `3b8f052`, red/green check
`25f5e68`); no uncommitted change. Changed: `packages/elements/README.md` (overview, `## Examples`),
`packages/elements/CHANGELOG.md` (Unreleased MINOR lead), `packages/elements/src/ocelle-link.ts` (header comment only),
`packages/elements/test/node/readme.test.ts` (new tests), `tasks.md` (T110 to T113 ticked) and the phase-7 evidence.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | packages/elements/test/node/readme.test.ts:445-446 | The host-ARIA check has a hole for the one allowed element. The pattern `<([a-z-]+)[^>]*?\saria-[a-z]+=` matches lazily, and the global scan resumes after the match. On `<ocelle-copy-field aria-label="x" aria-describedby="y">` it therefore finds only the allowed `aria-label=`, and the second attribute passes. Checked in node: that input gives `[]`, while `<p aria-hidden=` and `<ocelle-listbox … aria-label=` are both caught. The README today has nothing that falls into the hole: line 600 carries `aria-label` alone. | None required now. If the test is touched again, match each `aria-*` attribute separately, for example `/\saria-[a-z]+=/g` with a look-behind for the tag, so that the exception covers exactly one `aria-label` on `ocelle-copy-field`. |

No blocking finding.

### The questions put to this review

1. **`aria-label` on `ocelle-copy-field` (T110 "no ARIA attribute").** This is the right reading, and no operator
   decision is needed. T110's source criterion, SC-009 (spec.md:1093-1095), asks for "no local ARIA wiring". The
   contract gives the copy field exactly one way to be named: "Role `group` (internals), named by a host `aria-label`
   (unnamed without one)" (contracts/elements.md:121), and it has no `label` property. A host that follows the
   contract must write that `aria-label`. Banning it would make the copy-field example either unnamed (an
   accessibility regression) or impossible. The test keeps the exception narrow: only `aria-label`, and only on
   `<ocelle-copy-field`. It still forbids every other `aria-*` attribute or property, `role`, `tabindex` and `id`.
   README:595-597 states the reason, and `reviews/phase-7/notes.md` records it. The phase-5 README section
   (README:354) already used the same form. The test's one gap is R1-01, a note.
2. **"names the nine elements" against "eleven elements".** No defect. The overview (README:4-7) names all nine
   elements of this feature and also the two existing ones (`ocelle-icon`, `ocelle-brand-mark`). The test checks all
   eleven by name (readme.test.ts:364-367). T110 asks that the nine be named, which they are. The count "eleven" is
   accurate for the release. The CHANGELOG lead names exactly the nine elements and six events (T111).
3. **The three `plant-repo.test.ts` timeouts in the red run.** No effect on the red evidence. They are 5 s timeouts
   in `gates/test/integration/plant-repo.test.ts`, which this phase does not touch (`git diff --stat dbc9322..HEAD`
   lists no `gates/` file). The 70 phase tests failed with assertion errors on the missing README and CHANGELOG
   content (red-phase.log). `check-red-phase.log` and `check-final-tests-on-base.log` each show the 70 readme
   failures. The head run (`check-head.log`) and my own `gate:unit-tests` run pass all 4098 tests, so the timeouts
   were load, not a defect.
4. **No scaffold commit (`final_tests_on_scaffold_exit: null`).** Correct. `scaffold.sha` does not exist for
   phase 7. The phase adds no source signature: its only source change is a comment. A scaffold would have been
   empty. SKILL step 4 applies the scaffold check only when `scaffold.sha` exists.

## Test quality

- **Red evidence.** `red-commits` has `phase fe1d413`, red exit 1. The commit adds tests only
  (`readme.test.ts`, +128 lines). Every new test failed for the right reason: the overview statements were missing,
  `## Examples` was missing (`expected [] to deeply equal [ …(5) ]`, empty code blocks), and the CHANGELOG lead was
  missing. None failed on a setup error. The final tests also fail on base (`final_tests_on_base_exit: 1`).
- **No weakening.** `git diff fe1d413..HEAD -- packages/elements/test/` is empty.
- **Assertions can fail.** Each test asserts on the README or CHANGELOG text: `toContain`, `toEqual` on the
  ordered example headings, and `not.toMatch` for ResizeObserver, clipboard, `role`/`tabindex`/`id` and
  `setAttribute`. There is no conditional assertion, no skip or only, and no snapshot. The negative tests each start
  with a positive guard (`toMatch(/<ocelle-[a-z-]+[\s>]/)`), so they cannot pass on an empty block. That guard is
  why they were red at `fe1d413`. I checked the ARIA filter's ability to fail by running its regex in node on
  injected inputs. It catches a host `aria-*` on any other element and a misplaced `aria-label`. The one blind spot
  is R1-01.
- **Coverage of T110.** The overview names every element, and the existing exact test "lists exactly the entry
  points of package.json's exports" covers the entry-point table. The five SC-009 examples are each a `###`
  section in order, and each uses the element's entry point, attributes and events. The phase has no keyboard or
  event behaviour of its own.
- **Example content against the contract.** I read the five examples against contracts/elements.md and spec FR-010
  and FR-010a:
  - The listbox's `value` is `""` when nothing is selected, and activation fires on Enter and on double-click.
  - Tabs and segments pair by order. Setting `""` from an empty fragment keeps the selection, and a host set emits
    no event.
  - The link event's `detail.href` is `string | null` and cancelable, a modified activation emits nothing, and the
    link's `label` starts with its visible text (R-08).
  - The copy field uses `status`, and the host writes the clipboard.
  
  The inline `<script type="module">` blocks are documentation, as in the README sections from phases 2 to 6. They
  are not built output, so constitution IV does not apply to them.
- **Mutation.** `pnpm run gate:mutation -- --base dbc9322`, exit 0: "0 mutants on the changed lines of 1 file, none
  survived; 0 timeouts, 0 compile errors, 1 zero-mutant entry; 0 equivalent records". The zero-mutant entry is
  `ocelle-link.ts`, whose diff is a comment only, so it has nothing to mutate. It is a report, not a finding.

## Tasks

- **T110:** done (readme.test.ts:351-478).
- **T111:** done. The README overview, the entry-point table (unchanged and still exact) and `## Examples` are in
  place. The CHANGELOG lead names the MINOR change, the nine elements, the six events and the floor of Chromium 125
  and WebKit 17.4.
- **T112:** done as operator decision 1 directs (`reviews/phase-7/operator-decisions.md`, 2026-11-17). #16 merged as
  `13af7a9`. The composed `ocelle-dialog` + `ocelle-listbox` story (FR-054) and its docker baselines are deferred to
  `/ocelle-land` as a test-first landing fold. `notes.md`, the task line and the known gaps in `gates.md` record
  this. FR-054 says "before this feature lands", and the landing fold is still before the feature lands, so the
  deferral meets the requirement. `/ocelle-land` must carry it out.
- **T113:** done. `gates.md` records every gate at exit 0 and the known gaps: docker-only baselines with no podman
  cross-check, WebKit clipboard activation (R-07), the axe-core upstream report still to be filed, and the deferred
  composed story.
- **Changes outside the phase:** the only one is the `ocelle-link.ts` comment, which the phase-6 note R2-01 asked
  for.

## Constitution

- The `ocelle-` names and events are unchanged.
- The phase changes no element behaviour, style, token, story or baseline.
- The README examples follow the accessibility model: the elements write their own roles, states and associations.
- `csp`, `prefix`, `manifest` and the lint gates pass (below).

## Checks run

I ran these on HEAD `25f5e68`, one at a time, with `OCELLE_CHROMIUM_PATH` set and `OCELLE_VISUAL_ENGINE=docker`:

| Gate | Exit | Result |
|---|---|---|
| `pnpm run gate:typecheck` | 0 | no type error |
| `pnpm run gate:lint` | 0 | 320 files, no finding |
| `pnpm run gate:test-lint` | 0 | 217 files, no finding |
| `pnpm run gate:manifest` | 0 | 11 elements, no finding |
| `pnpm run gate:csp` | 0 | 30 files, no finding |
| `pnpm run gate:prefix` | 0 | 302 files, no finding |
| `pnpm run gate:unit-tests` | 0 | 4098 tests passed in 168 files |
| `pnpm run gate:signoff -- --range dbc9322..HEAD` | 0 | 4 commits, no finding |
| `pnpm run gate:mutation -- --base dbc9322` | 0 | 0 mutants, 1 zero-mutant entry (comment-only change) |

I did not rerun `gate:visual`, `gate:axe`, `gate:storybook-build`, `gate:plants`, `gate:contrast`, `gate:style-lint`,
the browser projects or the `gates` vitest project. The phase changes no story, element style, token, element code
or gate file. Its only source change is a comment, and `gate:unit-tests` covers the readme test. The implementer's
run of all of them at `7a81113` (all exit 0) is in `reviews/phase-7/gates.md`. The only commits since then are
evidence files.

## Earlier findings

This is the first round of phase 7, so there are no earlier blocking findings. The phase-6 round-2 note R2-01
(stale Meta wording in the `ocelle-link.ts` header comment) is resolved. `ocelle-link.ts:7-10` now says that a
modified activation is left to the browser: a new tab or window for Ctrl, Shift and the middle click, and the
platform's convention for Meta (phase 6 operator decision 2). This matches the README.
