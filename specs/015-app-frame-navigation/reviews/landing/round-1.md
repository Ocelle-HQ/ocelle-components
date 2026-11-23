---
scope: landing
phase: landing
round: 1
verdict: changes_requested
base: 8164293787f95590f33cf793a20c35f8b8e3b1e5
head: 95c762ba16aecd379fbe0dcebf69b834083db6de
tdd_check: operator-authorized-targeted-and-hosted
---

# Landing review, round 1 (PR #65, app frame and navigation, #12)

I reviewed the integrated tree from the clean merge of branch head `95c762b` with main `8164293`. The main update includes the existing focus walker and button naming fixes. The app-frame changes deliver six elements, two threshold tokens and their public documentation and tests.

## Findings

| ID | Severity | Where | Finding | Required change |
| --- | --- | --- | --- | --- |
| L1-01 | blocking | `packages/elements/src/ocelle-app-shell.ts` (`landmark`, `hasContent`, `#region`); `specs/015-app-frame-navigation/contracts/elements.md` | A supplied navigation element with a landmark inside its shadow root receives an extra shell navigation wrapper. With `ocelle-nav-pill` in the sidebar and one destination, Chromium exposed both “Workspace” and “Project destinations.” Changing `items` to `[]` left “Workspace” exposed, and at 320 px the “Open navigation” button remained. A projected `ocelle-breadcrumbs` likewise exposed both the wrapper and its named trail. Story 1 and the region contract require preserving the supplied landmark without creating a second one, and omitting the landmark and trigger for empty regions. | Add tests against the accessibility tree for a supplied named component and its transition between populated and empty. Check the narrow trigger and projected drawer as well as the wide region. Ensure the shell notices changes in rendered landmark presence without requiring consumers to synchronize a second label or visibility flag. |
| L1-02 | blocking | `packages/elements/src/ocelle-top-bar.ts` (`render`); FR-005 | With `show-menu` and `menu-label="   "`, the native button has an empty accessible name in Chromium. The same path supplies the shell trigger. The fallback test covers an empty string only. | Test the actual accessible name for whitespace-only input, then normalize the name with the existing naming helper and preserve the usable fallback. |

## Boundaries checked

- The shell owns the top bar and drawer. Projection preserves the destination nodes when they move between inline and modal regions. The drawer uses the existing overlay, so close cancellation, modal stacking and Tab wrapping still follow its normal entry points. The new private initial-focus override only affects shell-owned drawers. The related standalone drawer and integrated focus tests passed in the merged tree.
- Per-element imports are additive, and the browser entry and custom-element manifest include the new elements. Tokens, changelogs and README cover the threshold precedence, layouts and focus API. The naming failures above occur using those public inputs.
- Native link rendering reuses `linkHref` and its existing script-scheme rejection. Skip focus uses same-root lookup or a direct element reference. The implementation adds no request or markup-injection path. The built browser test checks actual drawer entry and escape, skip focus, the next Tab and strict CSP, console and request results.
- No gate command, registry entry, workflow or exit contract changes. Fixture and expected-story-count changes preserve exact success and finding assertions. The changed app-frame modules add no equivalent-mutant suppressions.

## Test quality and checks

- I checked that the recorded red commit references in phases 2–6 resolve to tests-only changes. The archived focused replays test missing behavior and the same suites pass after implementation. The operator authorized these records with full hosted CI in place of extra local full-suite replay. The Phase 7 record describes a docs-only exemption.
- Existing tests cover native navigation landmarks and empty light-DOM wrappers. The combined cases in L1-01 are absent. L1-02 falls between the existing accessible named-trigger and empty-string fallback cases.
- I reproduced both findings on the merged tree with a standalone Chromium probe exercising the public elements. I also ran the merged diff whitespace check successfully.
- The orchestrator reported 678 passing targeted tests and green Typecheck, Code lint, Style lint, Test lint and Story config copies on the merged tree. The [Phase 6 run](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/44990366919) passed 140 jobs. At review time, the [initial Phase 7 run](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45019091840) had a runner failure before one mutation report and a green Plants aggregate. The final integrated landing commit needs green hosted CI.

## Earlier findings

This is the first landing round. Phase reviews were inputs to the independent check.
