---
phase: 3
round: 2
verdict: changes_requested
base: e05b8c26476578de09e22abdf6334b521ff4f62e
head: 569dce48579125115958258e744d46f61ef4ccca
tdd_check: pass
---

# Phase 3 review, round 2

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R2-01 | blocking | 569dce4 (commit message trailers) | **The signoff check fails on the phase range.** `pnpm run gate:signoff -- --range e05b8c2..HEAD` exits 1: `569dce4…: signoff: no-signoff: no Signed-off-by line for the author Claude <noreply@anthropic.com>` (1 finding in 11 commits). The planner's commit `docs(002-design-tokens): R1-02 story render code in the mutation scope` has the `Co-Authored-By` and `Claude-Session` trailers but no `Signed-off-by`. Every other commit since base has one. The constitution (Governance, l. 159) requires DCO sign-off on every contribution, and FR-023's signoff gate enforces it. The content of the commit is correct (see R1-02 below); only the trailer is missing. | Give 569dce4 a `Signed-off-by` line for its author. It is unpushed, so the orchestrator can re-sign it, for example with `git rebase --signoff 569dce4^` (this review's commit is then re-applied on top, or re-made). Then re-run `gate:signoff` over `e05b8c2..HEAD`. The content does not change, so no other re-review is needed for it. |
| R2-02 | note | storybook/test/unit/render.test.ts:1-65; red-fix-1.log | The four `renderGroup` and `hasSwatch` tests pass on the code they test. They were written to kill surviving mutants of existing behaviour, so a red failure was not possible. The fix note says so. Their worth is shown by the mutation run instead: `render.ts` is now in scope, and its mutants are all killed (no survivor, no record). The scope change itself (`ranges.ts`) was red first. | None. |
| R2-03 | note | gates/README.md:30 (`csp` row); gates/plants/csp/fail-storybook-inline-script, pass-storybook-external-script | The `csp` plants still put an HTML entry at `storybook/dist/index.html`, which the build no longer produces. That is consistent: the gate's scope is `storybook/dist/*.html`, the plants are planted trees and not the build, and contracts/gates.md § Plants names them so. If #10 brings the manager back, the plants already match it. | None. |
| R2-04 | note | storybook/test/integration/setup.ts:33-42 | `buildArgs` reads the `storybook build` step from `package.json`, so the run-time test now builds exactly what the build script ships (`--preview-only` included). It splits on `" && "` and `" "`, so a quoted argument with a space would be cut. Today no argument has one, and an unexpected shape throws at setup rather than passing quietly. | None now. |

## Test quality

- **Red evidence.** `red-commits` has `fix-1 90fadb0`. `red-fix-1.log` / `check-red-fix-1.log`: exit 1, 71 of 1540 tests fail, each an `AssertionError` on missing behaviour. These are `telemetry.test.ts` (build script without `--preview-only`), `csp.test.ts` "ships the preview only" (`expected [ 'index.html', 'sb-manager', …(1) ] to deeply equal []`), `mutation-ranges.test.ts` `scopePathspecs` (12 vs 13 entries) and `inScope` (6 vs 8 paths), and the `mutation-*` gate runs. Those fail with exit 2 because `mutation-fakes.ts` gained the new pathspec, which the fake git no longer matches against the old scope. That is the missing scope, as in the phase's own red. No setup error. `tdd-check.json`: `status: pass`, `problems: []`, head exit 0, final tests on base and scaffold exit 1.
- **Weakened tests.** `git diff 90fadb0..HEAD` over the test files (`*.test.ts`, `**/test/**`, `*.stories.ts`) is empty: the fix commit touches no test. Between round 1's head and 90fadb0, the R1-01 rewrite of `csp.test.ts` replaced the synthetic `control.html` page with a `<style>` element added to a real story. It also added a zero-violation assertion before the control element, an existence check for `iframe.html` (the control for the absence check) and an exact list of the 17 HTML documents served. Each replacement is stricter, and the comment at l. 13-27 gives the reason (R1-01). The `inScope` test's expected slice grew from 6 to 8 along with five new negative paths (`a.test.ts`, `a.d.ts`, `a.js`, `storiesx/`). That is stricter too.
- **Vacuous assertions.** None. No `skip`/`only`, no conditional or snapshot-only assertion. `render.test.ts` pins whole markup strings with `toBe`. The `waitForSelector(...).catch` in `csp.test.ts:111` is the one R1-08 already accepted: the assertions after it run on every path.
- **Coverage of scenarios.** Scenario 11 as amended: build output holds no manager UI (`csp.test.ts:149-152`), only `iframe.html` is opened (`:199-201`), header, zero violations with control, no outside request, exact tokens, monospace check with control, per group in light and dark. Scenario 12: unchanged from round 1, covered. Scenario 13: `theme.test.ts`, unchanged.
- **Mutation.** `pnpm run gate:mutation -- --base e05b8c2`: exit 0, "356 mutants on the changed lines of 9 files, none survived; 13 equivalent records". The 9th file is `storybook/stories/render.ts`, with no record. The 13 records are the ones I read and accepted in round 1, at the same reasons. The round 1 survivors are killed. (1) `/[^&<>"]/g`: the exact markup with escaped `&<>"` in a value (`render.test.ts:25-32`), a name and a `data-token` (`:34-43`). (2) `record.group === "colour"` → `true`: `shell-hex` has a hex value and no swatch (`:45-47`, `:55-64`). (3) `rows.join("Stryker was here!")`: whole-string `toBe`.

## Checks run

Node 22 in this container (not the pinned 26). Chromium via `PLAYWRIGHT_BROWSERS_PATH` set to the scratchpad alias.

- `pnpm -r build`: exit 0. `storybook/dist/` holds `iframe.html`, `index.json`, the externalised `inline-*.js/css`, the token and swatch stylesheets and assets. There is no `index.html`, no `sb-manager/` and no `sb-addons/`.
- `pnpm test`: 1540 tests passed in 76 files, `storybook-integration` included.
- `gate:typecheck`: pass. `gate:lint`: 139 files, no finding. `gate:test-lint`: 85 files, no finding. `gate:style-lint`: pass. `gate:csp`: 19 files, no finding. `gate:prefix`: 71 files, no finding. `gate:config-copies`: identical. `gate:pins`: 5 manifests, no finding.
- `gate:plants`: 149 plants of 11 gates and the registry, every plant as expected.
- `gate:mutation -- --base e05b8c2`: exit 0 (above).
- `gate:signoff -- --range e05b8c2..HEAD`: **exit 1**, one finding on 569dce4 (R2-01).
- Visual regression and axe: not in this phase's scope (#10).

Tasks: T030 to T042 are ticked, and T036's amended text is met (preview-only build, absence test, `iframe.html` only, header without `frame-src`, README updated). `tasks.md` changed in the fix only by T036's tick. The planner's amendments (f15885c, 569dce4) are consistent with each other. Spec scenario 11, FR-023 Run time, SC-008, T036, plan item 11 and Constitution Check, contracts/gates.md § Monospace in Storybook *Preview only* and § Mutation, and `gates/README.md` all now say preview only and name `storybook/stories/**/*.ts` in the mutation scope. No remaining text requires the manager to be checked at run time. plan.md:107 keeps `frame-src` in the historical decision list, marked as dropped by item 11.

Constitution: I (no `sk-` names; prefix passes), II (preview monospace check with control; theme fonts tested for #10), IV (preview clean under the page header; the manager, which cannot meet it, is no longer shipped, per the operator's decision), V (one story per group, light and dark; baselines are #10's), VIII (red first for the fix; mutation clean, now including `render.ts`). Governance DCO: fails on one commit (R2-01).

## Earlier findings

- **R1-01 (blocking): resolved** against the amended text (operator decision R1-01, f15885c). The build script passes `--preview-only` (`storybook/package.json:8`). My build of HEAD has no `index.html`, `sb-manager/` or `sb-addons/`. `csp.test.ts` asserts their absence, with `iframe.html` present as the control. The integration setup builds with the build script's own arguments, so the test checks what ships. Every page opened is `iframe.html`, and the server's document list asserts it (17 entries). The violation control now runs inside the preview, after a zero-violation assertion. `gates/README.md:66-75` states the preview-only build and drops the manager bundles from the narrowed-scope list. The red was the absence test and the build-script test in 90fadb0.
- **R1-02 (blocking): resolved.** `ranges.ts:34, 43` add `storybook/stories/**/*.ts` (story files, tests and `.d.ts` excluded), red first in `mutation-ranges.test.ts`. The gate now mutates `render.ts`, and the three round 1 survivors are killed by `render.test.ts`, with no equivalent record. contracts/gates.md § Mutation, plan.md and research.md were brought in line by 569dce4 (whose missing sign-off is R2-01).
- R1-03 (note): out of scope for this phase by operator decision (follow-up op after the run). Not judged here.
