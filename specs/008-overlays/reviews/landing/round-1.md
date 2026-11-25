---
scope: landing
round: 1
verdict: changes_requested
base: 3828d2fee8dccab6f5c2697f859e2af7247d3378
head: 225e7241041021b9e290636625a715b2fc1d7df6
tdd_check: pass
---

# Landing review, round 1: PR #47 (mission 008-overlays, issue #16)

This is a fresh second opinion on the integrated diff `git diff origin/main...225e724`. The merge base is `3828d2f`
and `origin/main` is `c4c0af4`, which adds op 015 (`ce1d9c7`) and op 016 (`c4c0af4`). I read the trial merge `d5e47ff`
(local only, in the `land47` worktree) to see how the branch combines with them. I ran nothing in that worktree and
changed nothing there.

Inputs:

- the five phase reviews (`reviews/phase-1/round-1.md`, `round-2.md`, and `phase-2` to `phase-5/round-1.md`, all
  approved);
- the phase notes;
- `reviews/operator-standing-decisions.md`;
- the PR body's known gaps as the brief gives them.

I used the story reviews as input, not as a substitute: each claim below I checked myself on `225e724` or `d5e47ff`.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| L1-01 | blocking | packages/elements/src/overlay.ts:541-548, :483-491, :506-511, :307-319 | **A closing overlay that is removed under reduced motion still dispatches its `…-close`, and corrupts the overlay stack.** Without motion (`prefers-reduced-motion: reduce`, or a zero or absent `--ocelle-motion-base`), `#animate` schedules the end of the close as `this.updateComplete.then(done)` (:547). Nothing cancels it. The code's own invariant is "every change of state during the exit cancels its animation" (:475-476), but here there is no animation to cancel. When the host closes through `open = false`, `#begin` runs inside `updated()`, so a host continuation on the same `updateComplete` runs before `done`. The plain host pattern `el.open = false; await el.updateComplete; el.remove();` then goes: `disconnectedCallback` (state `closing`) closes silently and leaves the stack, and then `done` → `#finish` runs a second time. That second run (1) dispatches `ocelle-dialog-close` (or `ocelle-drawer-close`) with reason `host` on the removed element, which breaks FR-022 ("Removing an open (or closing) overlay … MUST dispatch no event"), R-05a ("A close in progress ends the same way, without its `…-close`") and README:220-221. (2) It calls `#leave` again. There `stack.indexOf(this)` is -1, and `stack.splice(-1, 1)` (:508) removes the **last other overlay** from the stack, against the comment at :507. I reproduced this in Chromium with a scratch bundle of `src/` (probe outside the repo). Dialog `d1` is open, `d2` is opened over it, then `d2.open = false; await d2.updateComplete; d2.remove()`. Under `reducedMotion: "reduce"`, `d2 close host connected=false` is dispatched. Then `d3` is opened over `d1`, and one Escape with focus on the body closes **`d1`, the overlay beneath**, while `d3` stays open (FR-023). That happens because `d1`, dropped from the stack, keeps its document listener and acts first. With motion on (`--ocelle-motion-base: 200ms`), the same steps give no event, and the Escape closes `d3`, as specified. The same callback, which nothing cancels, also completes a close that a host `open = true` in that window should cancel (R-06). No scenario row covers removal or reopening while `closing` under reduced motion. The removal rows (`test/scenarios/dialog.ts`:1655-1690, :2254) remove an open overlay, or remove it in the close-request listener before `#begin`. This affects both overlays, and reduced-motion users are the population exposed. | Fix it test first. Add a red row, for the dialog and the drawer: under reduced motion, `open = false`, then the host's `await updateComplete`, then `remove()`. It must give no event, and in the nested variant the next Escape must act on the top overlay. A reopen variant must give no close event. Then make the no-motion end of a close cancellable, like the animation. For example, record a token per close that `#reopen`, `disconnectedCallback` and the platform-close path clear, and run `#finish` only for the current close. Also make `#leave` do nothing when the overlay is not on the stack. Run the mutation shards of `overlay.ts` again. |
| L1-02 | blocking | trial merge d5e47ff: gates/test/vitest-config.test.ts:47, :69 (main's version); vitest.config.ts:121; vitest.mutation.elements.config.ts:9 | **The agreed conflict resolution, "take main's `gates/test/vitest-config.test.ts`", breaks the unit-tests gate after the merge.** Main's version still pins the projects as they were before 008: `notMutated` without `elements-touch` (:47), and `keptElements` equal to `["elements"]` (:69). The merged configurations come unchanged from the branch, because main does not touch `vitest.config.ts` or either mutation config. So those configurations hold `elements-touch`: in the projects, excluded from `vitest.mutation.config.ts`, and kept by `vitest.mutation.elements.config.ts`. I evaluated main's two expressions against the merged configuration modules (a script outside the repo). `all − kept` is `[…, "elements", "elements-touch", …]` against the expected seven names, and `keptElements` is `["elements", "elements-touch"]` against `["elements"]`. So both tests fail. The resolution also drops the branch's two R-14 tests (`225e724`:120-153): "put an in-process touch test in elements-touch only …" and "run elements and elements-touch in browser mode at 1280 × 800 …". Without them, no test proves where `*.touch.test.ts` files run or that `elements-touch` has `hasTouch`. The branch's version already contains everything op 015 added: `dryRunTimeoutMinutes: 30` (:82) and `not.toContain("dryRunTimeoutMinutes")` (:85). It passes on `225e724` (10 of 10, run by me), and its configurations are the merged ones. The two sides differ only in the comment above the Stryker test. | Resolve the conflict to the branch's version, keeping main's comment text if wanted. This departs from the standing decision of 2026-11-15, so the operator confirms it. Then run the gates of the merge commit again. |
| L1-03 | note | packages/elements/src/overlay.ts:386-388, :366-370 | **Moved in the same task as `open = true`, before the first show, the overlay keeps `open` true but is not shown.** If the host sets `open = true` and the element is removed before Lit's update (for example a morph or a portal in the same task), `disconnectedCallback` returns at :311 (state `closed`), and the pending update's `#show` returns at :388 without resetting `open`. Re-inserted, the element reflects `open` but its panel is neither open nor `:modal`. A second `open = true` changes nothing, because it is no property change. I reproduced it in Chromium: `open=true attr=true panel.open=false modal=false` after the move, and the same after `open = true` again. This conflicts with FR-004 ("single source of truth for being shown") and with the edge case "Moved while open" ("closed after the move, with `open` false … the host sets `open` again to show it"). The window is narrower than L1-01's. | Recommended with L1-01, test first: a show that cannot happen because the host is disconnected sets `open` to false, or the show runs again on connection. |
| L1-04 | note | storybook/baselines/tokens--{shell,size,motion}.{light,dark}.png | Constitution V: "Baselines change only in a pull request whose description says why." **Six** Tokens baselines changed. Phase 3 changed `tokens--shell` ×2 (`--ocelle-drawer-inline`), and phase 4 changed `tokens--size` ×2 and `tokens--motion` ×2 (`--ocelle-tooltip-max-inline`, `--ocelle-tooltip-delay`). Phase-4 R1-04 names only "the four". The 46 new element baselines and these six were captured in docker only. | The PR body names all six and why, and says the captures are docker only and CI's captures win. |
| L1-05 | note | PR #47 checks | No CI has run, because the PR conflicts with main. The merge gates that only CI judges here are still open: the mission-wide mutation run (60 shards, 59 cuts from `--base 3828d2f`, quickstart step 6), the full plants, visual under both engines, and the DCO check. The hand checks and WebKit are known gaps by the operator's decision. This verdict assumes all of them pass on the merge commit. Under op 016, `gate:plants -- --affected 3828d2f` would judge the **full set**, because the diff touches shared gate source (`gates/lib/story-page.ts`, `storybook-serve.ts` and `visual-host.ts`, comment lines only). So `--affected` saves nothing for this PR, and op 016's known limit (element source and tokens reach plants outside the selection) does not apply. | None beyond running CI on the merge commit. |

There are two blocking findings.

## Test quality

- **TDD check.** `tdd-check.json`:
  - phases 1 to 4: `pass`;
  - phases 2 to 4: the final tests also fail on their scaffold commits (exit 1). The exit 2 on base is the missing
    module, so the scaffold run is the proof, as each phase review says;
  - phase 5: `exempt`, and justified. Its only source change is comment text (Stryker makes no mutant of it), and its
    test changes tighten rows against unchanged source, with break-check logs.
- **Red commits.** `c51d6a6`, `acbcd6d`, `0f427ea`, `af4edf9` and `294a51d` change only test and story files and the
  phase's `base.sha` / `scaffold.sha`. Phase 3's large deletion in `test/scenarios/dialog.ts` is the shared-scenario
  rewrite for both overlays. Phase-3 round 1 checked that `git diff <red>..HEAD` over the test pathspec only adds. I
  found nothing that contradicts it.
- **Lint.** `gate:test-lint` reports 204 files and no finding. That covers `skip`, `only`, conditional assertions and
  tests without an assertion.
- **Coverage gap.** L1-01 is a gap in the scenario matrix: R-05a's "a close in progress ends the same way" has rows
  only with motion on, and no row for a removal or reopen while `closing` under reduced motion. That is why the
  defect passed five green phases and a mutation run.
- **Equivalent-mutant records (007 R-08).** I read every `Stryker disable` record in `overlay.ts`, `ocelle-tooltip.ts`
  and `ocelle-drawer.ts` (none in `ocelle-dialog.ts`). Each names its reason and its notes file. I re-derived four of
  them from the code: `still` at :80, the `#ownCloses` check at :642, the toggle `oldState` test at :673, and the
  tooltip's `shown === this` at :307. Each holds as stated. The records at :500 and :642 rest on "the queued event is
  ignored by the next check or the state". That stays true with L1-01's fix only if the fix keeps `#closeOwn`'s
  counting. The re-run of the shards after the fix will show it.
- **Gate changes.** The changes in `gates/` are comment-only count updates in `Stryker disable` lines: `gates/bin/axe.ts`,
  `gates/bin/visual.ts`, `gates/lib/story-page.ts`, `storybook-serve.ts`, `visual-host.ts` and `gates/visual/capture.ts`.
  I checked that each diff has no other changed line. The rest is:
  - expected-count updates in the integration tests: 21 → 44 stories, 42 → 88 story-themes (90 with the plant story),
    2 → 5 elements;
  - the `fail-token-changed` expectation, +21 light story-themes. The `why` text accounts for them: 20 + 8 dialog + 4
    sheet-ground drawer + 9 tooltip = 41.

  No gate's exit 0/1/2 logic changed, so the fail-closed boundaries are those of main.

## Checks run

At `225e724` in `<repo>`, with `OCELLE_CHROMIUM_PATH` and `OCELLE_VISUAL_ENGINE=auto` set and
`CI` / `GITHUB_ACTIONS` unset:

| Check | Result |
|-------|--------|
| `gate:typecheck` | no type error |
| `gate:lint` | 300 files, no finding |
| `gate:style-lint` | 18 files, no finding |
| `gate:test-lint` | 204 files, no finding |
| `gate:manifest` | 5 elements, no finding |
| `gate:prefix` | 248 files, no finding |
| `gate:brand-rules` | 7 rules |
| `gate:contrast` | 160 pairs in light, 168 in dark |
| `gate:csp` | 16 files, no finding |
| `vitest run gates/test/vitest-config.test.ts` (the branch's version) | 10 of 10 passed |

Probes, all outside the repository (a scratch `esbuild` bundle of `packages/elements/src/`, Playwright with the
Chromium above):

- L1-01, under reduce and under motion on;
- L1-03;
- L1-02: evaluating main's two assertions against the merged configuration modules.

I did not run `pnpm test`, for three reasons:

- `225e724` differs from the phase-5 review head `31489e6` only in comments (`bubble.ts`, `ocelle-tooltip.ts`:138-141)
  and records;
- phase 5 recorded 5067 of 5067 passing;
- the gate checks running in the worktree use the same machine, and the timing rows are load-sensitive.

I did not run visual, axe, plants or the mutation gate either: they belong to the worktree's gate run and CI (L1-05).

### Public surface (design lens)

- **Entry points.** `package.json` gains `./ocelle-dialog.js`, `./ocelle-drawer.js` and `./ocelle-tooltip.js`.
  `index.ts` exports the three classes and not `OcelleOverlay`. The dialog and drawer modules define their element and
  `ocelle-icon`, and the tooltip module defines only its own element. `bubble.ts` is the only coupling, with no import
  between the overlays and the tooltip.
- **Events.** The four events are `ocelle-<element>-close-request` (cancelable) and `ocelle-<element>-close`, each with
  `{ reason }`, bubbling and composed (constitution I).
- **Tokens.** Three are added: `--ocelle-tooltip-max-inline` (size), `--ocelle-drawer-inline` (shell, referencing
  `--ocelle-shell-sidebar-width`) and `--ocelle-tooltip-delay` (motion, deliberately not zeroed under reduced motion).
  Both CHANGELOGs name them. Element CSS uses tokens only. The only literals are the forced-colours system colours and
  the structural `0`, `auto`, `100%`.
- **Engine floor.** It is raised to Chromium 120 / WebKit 17 for the Popover API (README:453-463). `closedBy`
  (Chromium 134) is read defensively (`overlay.ts`:63-70). The other features used (`:modal`, `ToggleEvent`, `dvh`,
  `translate`) are within the floor.
- **Accessibility.** The heading and `aria-labelledby` share one shadow root (R-08). The tooltip's description span
  and the trigger's `aria-describedby` are both light-DOM children of the host, with an id unique in the trigger's
  root (`ocelle-tooltip.ts`:404-432). The bubble is `aria-hidden`. The close control is `--ocelle-target-min` square
  with the token focus ring.
- **Security.** Text goes through Lit text bindings, never markup. Placement uses a constructable sheet of numeric
  coordinates, never a `style` attribute. There is no I/O.

### The merge with op 015 and op 016

- **Conflict.** The one conflict is L1-02.
- **`stryker.elements.config.json`.** Both sides add the same `dryRunTimeoutMinutes: 30`, which merges cleanly to one
  line. Op 015's 45-minute CI shard limit for `packages/elements/src/` entries covers this mission's source.
- **Stories and baselines.** Main adds no story, baseline or element. After the merge the figures are unchanged: 44
  stories, 88 story-themes, 90 with the plant story, and 5 elements. No baseline conflicts, so none needs to be
  regenerated.
- **Plants.** The branch adds no plant case. It changes only `visual/fail-token-changed`, which is in op 016's
  `repositoryContentPlants`. So op 016's pin of the `visual`, `axe`, `manifest`, `contrast` and `brand-rules` cases
  needs no new entry. The plant count is main's.
- **Op 016's phase plant step.** Op 016 adds a plant step to the phase workflow (`plants_command`, `plants.md`). It
  came after this mission's phases, so no 008 phase has a `plants.md`. That is no regression; the full set in CI
  judges this PR.
- **New test project.** `elements-touch` is run by `pnpm test` (the unit-tests gate) and needs no `gates.json`,
  `registry.ts`, `ci.yml` or `contracts/ci-checks.md` entry. It adds no gate, check or CI job. Its two configuration
  tests are what L1-02 would drop.

## Earlier findings

There is no earlier landing round. These notes from the phase reviews were carried to land:

- **Phase-5 R1-01** (the `bubble.ts` and `ocelle-tooltip.ts` comments on pending delays): **resolved**.
  `bubble.ts`:2-8 and `ocelle-tooltip.ts`:138-141 now say that another tooltip's pending delay ends only by its
  trigger's `pointerout` or the tooltip's removal, and not by `focusout` while hovered. That matches `#onFocusout`
  (:287-290) and `#onPointerout` (:272-277).
- **Phase-5 R1-02 to R1-04**: optional, and still open as the PR body says. They are test wording and evidence-keeping
  notes with no behavioural gap.
- **Phase-4 R1-04** (the PR text on Tokens baselines; the recount at land): the recount is done above and matches. The
  PR text is L1-04, which corrects "four" to six.
