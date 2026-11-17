---
review: landing
round: 2
pr: 44
verdict: approved
base: 3828d2fee8dccab6f5c2697f859e2af7247d3378
main: ce1d9c72b7f9e028565e61684465cf8df448ac1d
head: 8d02e3babb6ac665eef07d2875395696d8869a79
tdd_check: pass
reviewer: reviewer-renata
---

# Landing review, round 2 (011-layout-headers, PR #44, closes #8)

This is a check round under the landing stop rule. It checks whether the five round 1 findings (L1-01 to L1-05) are
resolved and whether their fixes regressed anything. Scope: `git diff 0de181f..HEAD` (26 commits). That covers the
operator rounds (phase 1 round 2, phase 2 round 4, phase 4 round 2, phase 5 round 2), the planner's
`round-1-tasks.md` (f7fe243), the red and fix commits of T048 to T052, the tdd re-checks, and the phase reviews that
followed (phase 1 rounds 3 and 4, phase 2 round 5, phase 4 round 3, phase 5 round 3). Main's own changes are not
reviewed here; merging main is a later step. The Sign-off failure on 3a7bc81 has a decided scripted re-sign and is
not raised here.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|

No blocking finding and no new note.

## Round 1 findings

| ID | State | Evidence |
|----|-------|----------|
| L1-01 (blocking) | **resolved** | `packages/elements/src/ocelle-card.ts:105-109`: `#headerChanged` now passes `event.currentTarget`, the card's own `header` slot that the listener is bound to. Red commit 1926756 is recorded as `fix-4` in `reviews/phase-2/red-commits`. Its log `red-fix-4.log:42-43` fails on the size sequence in both `elements` and `elements-browser`, the right reason. The new shared scenario `test/scenarios/card.ts:413-436` puts a wrapper slot into `header`, changes that slot's content, removes the header's `slot`, then restores it, and expects `compact, compact, regular, compact`. My round 1 reproduction, re-run on the rebuilt `dist/browser/ocelle-elements.js` (Chromium 1243), now ends `row compact`, `row compact`, **`row`**, `row compact`; round 1 ended `row compact` after the header left the slot. The `density` path in `updated()` is unchanged. The test was not changed after its red commit (`git diff 1926756..HEAD -- test/scenarios/card.ts` is empty). |
| L1-02 (note, fixed) | **resolved** | `packages/elements/tsconfig.json:6` sets `"stripInternal": true` for this package only. After a fresh build, no `dist/*.d.ts` contains `internalsKey`, and `naming.d.ts` exports only `accessibleName` and `expose`. The JavaScript still carries the symbol (`naming.js`, `ocelle-context-sidebar.js`), so behaviour is unchanged. The `@internal` tags sit only on the internals key (`naming.ts:38`, `ocelle-context-sidebar.ts:136`, `ocelle-personal-rail.ts:150`), so nothing else is stripped. research.md R-11 now says `@internal` only, matching the code. The new `build.test.ts:165-183` puts each "no `internalsKey`" check beside a positive declaration in one assertion. It failed in red 4da65c9 (`phase-4/red-fix-2.log:42`). |
| L1-03 (note, fixed) | **resolved** | `ocelle-context-sidebar.ts:95,103`: both section rules (`::slotted(:not([slot]):not([hidden]):not(template, script))` and the first-section `:nth-child(1 of ...)` rule) leave out `template` and `script`. The new US3-3 variant (`test/scenarios/context-sidebar.ts:387-421`) puts a template and a JSON script before, between and after two sections, and also tests a slot that holds only a template. It failed in red 4da65c9 in both drivers (`red-fix-2.log:44-45`). The probe on the rebuilt browser module gives `template` and `script` `display: none` with height 0. Part (a), where a class with `display: none !important` still draws the section, is kept on purpose. FR-022, the new Edge Case and the README (`README.md:368-370`) all state it. research.md R-09 records why `style` is not in the list (strict CSP). The README fragment is guarded in `readme.test.ts:188`. |
| L1-04 (note, fixed) | **resolved** | `README.md:530-536` adds `## Forwarded slots`: forward a slot only when it has content. `slot-state.ts` is unchanged, as the operator decided (spec Empty slot and Edge Case, research.md R-03 § Forwarded slots). The guarding fragment `readme.test.ts:76` failed in red f47c795 (`phase-1/red-fix-2.log:42`). |
| L1-05 (note, fixed) | **resolved** | `README.md:449-452`: "once they are released; no release of this package ships `ocelle-nav-item` yet". The stray line break after "expected to have." is gone. `readme.test.ts:211` makes the fragment stricter than before (the old text plus the new clause). The new raw-text test `readme.test.ts:283-285` fails if that line break comes back. Both failed in red 8ccda41 (`phase-5/red-fix-2.log:42-43`). FR-027, the FR-036 rail bullet and the Edge Case were updated to match. |

## Regression check

- Source changes since round 1 are limited to `ocelle-card.ts` (one expression and a comment),
  `ocelle-context-sidebar.ts` (two selectors and a comment) and `tsconfig.json` (`stripInternal`). No other source,
  gate or story file changed.
- Tests: no test was removed or loosened. `git diff <red>..HEAD -- packages/elements/test` shows each red commit's
  tests unchanged afterwards. The only later test edits are the next fixes' own red commits. The one replaced
  fragment (L1-05) is stricter. The new driver methods (`shadow`, `shadowAppend`, `shadowAttribute`, `shadowComputed`)
  are in the `Driver` interface and in both drivers, write no `style` attribute, and throw when their target is
  missing.
- The first-section rule now skips templates and scripts. The variant with a template before the first section checks
  that the first visible section has no divider, and the earlier hidden-section and page-reset scenarios still pass.
- Declarations: `label` stays declared on both landmark classes. Typecheck passed in CI. No package or test imports
  `internalsKey` through `dist` typings.
- tdd-check: `pass` for phases 1, 2, 4 and 5. Every red commit exited 1. The final tests fail on base and scaffold.
  The heads were re-checked after the fixes (`tdd-check.json` of each phase).

## Test quality

Each new or changed test failed in its red commit for the missing behaviour, not because of a setup error (the logs
are cited above). There is no `skip`, `only`, conditional assertion or snapshot-only assertion. The new scenarios
assert measured layout or computed style through both drivers. The mutation gate passed in CI run 43824638879. Both
changed source expressions are covered by the new scenarios: going back to `event.target`, or dropping
`:not(template, script)` from either rule, is the plant that `contracts/checks.md` records.

## Checks run

- CI run 43824638879 on d93f145: 84 of 85 jobs green. The one failure is Sign-off, on 3a7bc81 (re-sign decided, not
  a finding). `git diff --stat d93f145..HEAD` touches only review evidence and `tasks.md` ticks, so no code or test
  changed after that CI run.
- Local, with the brief's environment: `pnpm --filter @ocelle/elements run build` (exit 0). Then `vitest run` for
  the projects `elements`, `elements-node`, `elements-build` and `elements-browser`, on the card, context-sidebar and
  personal-rail scenarios (in-process and strict-CSP browser), every build test and every node test: 12 files, 418
  tests, all passed.
- A Chromium 1243 probe against the rebuilt `dist/browser/ocelle-elements.js` repeated the L1-01 reproduction and the
  L1-03 template and script measurement (scratch script, not committed).
- `gate:plants` was not re-run locally (it does not finish unsharded). CI ran its shards green at d93f145.

## Verdict

All five round 1 findings are resolved, and none of the fixes regressed anything. Landing is approved, subject to
the scripted re-sign of 3a7bc81 and the later merge of main.
