---
scope: landing
round: 2
verdict: approved
base: 3828d2fee8dccab6f5c2697f859e2af7247d3378
head: 57764c6
tdd_check: pass
---

# Landing review, round 2: PR #47 (mission 008-overlays, issue #16)

This round follows the landing stop rule. It does not search the branch afresh. It checks two things:

- whether round 1's findings are resolved;
- whether the changes since round 1 (`b1698e2..57764c6`) regress anything.

A new finding blocks only if it breaks a requirement and comes with a reproduction or a red check.

Since `b1698e2`, three files changed under `packages/`, `gates/`, `storybook/` and the root configurations:

- `packages/elements/src/overlay.ts`, the T058 and T059 fix;
- `packages/elements/test/scenarios/dialog.ts`, the T058 and T059 rows plus two mutation-guard rows;
- `packages/elements/test/scenarios/tooltip.ts`, the T060 row.

Everything else is under `specs/008-overlays/`: the spec, research and checks text for L1-01 and L1-03, the tasks, the
operator decisions, and review evidence.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| L2-01 | note | `origin/main` 23ba5c5; vitest.config.ts; packages/elements/test/commands.ts:247 (branch) against :215 (main) | **Main has moved since round 1, and round 1's merge analysis is now out of date.** Round 1 analysed the merge with `origin/main` at `c4c0af4` (op 016). The local `origin/main` is now `23ba5c5` (Mission 013, #43, fetched 2026-11-16 09:10 UTC). `git merge-tree --write-tree HEAD origin/main` reports **26 conflicting files**, where `c4c0af4` gave one. The conflicts include `vitest.config.ts`, `packages/elements/test/commands.ts`, `commands.test.ts`, `in-process.ts`, `scenarios/driver.ts`, `browser/driver.ts`, `src/index.ts`, `package.json`, `custom-elements.json`, the README, the CHANGELOG, `stories-layout.css`, the gate integration count tests and `gates/plants/visual/fail-token-changed/plant.json`. One of them is a semantic clash, not just text: both sides add a browser command named `emulateReducedMotion` with different signatures. Main's is `(mode: "reduce" \| "no-preference")`, used by 013's `progress.test.ts` and `in-process.ts`. The branch's is `(on: boolean)`, used by 008's `in-process.ts` and `commands.test.ts`. Three statements in round 1's "merge" section no longer hold: "main does not touch `vitest.config.ts`", "Main adds no story, baseline or element", and the stated figures of 44 stories, 88 story-themes and 5 elements. The standing merge rules only cover `stryker.elements.config.json`, `vitest-config.test.ts` and baseline PNGs. L1-02's decision still applies as recorded: main's `vitest-config.test.ts` is unchanged since op 015. But the branch's version passes on the merge only if the resolved `vitest.config.ts` keeps `elements-touch` and the branch's mutation configurations. No requirement of the branch is broken, and the merge is `/ocelle-land`'s work, so this is not blocking. | Before `/ocelle-land`, the orchestrator puts the new conflict set to the operator. That covers the `emulateReducedMotion` signature (one command, one signature, with both missions' callers adapted) and the figures of the merged stories, elements and baselines. The merge commit then runs every merge gate of the constitution (L1-05). |
| L2-02 | note | PR #47 body | L1-04 (the PR body names all six Tokens baselines, and says they are docker-only captures that CI's captures replace) is PR-body work. I cannot check it from here, because this role does not read or touch GitHub. With 013 merged, main's own baselines can also take part in the "regenerate any conflicting baseline PNG" rule. | The orchestrator confirms the PR body before it asks for the merge. |

There is no blocking finding.

## Test quality

- **TDD check.**
  - Phase 2: `tdd-check.json` is `pass` at `da97557`, with `fix-2 4a864bf` exit 1. `36918fb` only re-records the
    check's logs. This covers the only source change since round 1.
  - Phase 5: `exempt`. The new exemption line for T060 is justified: it is a test-only rescale of a row the unchanged
    code already meets, and the break checks `break-checks/r2-01-b{1,2,3}-*.log` are its evidence. Phase 5 round 3
    confirmed this.
- **No weakening.** I read `git diff b1698e2..HEAD -- packages/elements/test`.
  - In `dialog.ts`, the rows of round 1 are untouched, apart from one stricter row ("Rapid toggle": `atReopen: 0`
    added and nothing removed).
  - The new rows are additive. Each of them:
    - asserts events, `open`, the top layer, `:modal` and focus without conditions;
    - pairs its reduced-motion half with a motion-on half.
  - The `settled` stand-in op runs its commands in the continuation of the element's `updateComplete`. That is the
    host pattern of L1-01.
  - In `tooltip.ts`, the "Escape, then a brief hover" row now uses a 1000 ms delay of its own, with a 1500 ms wait
    and `never(f, 0)`. It also adds a check that the frames reach the wait (`toWait`), and it is judged only on runs
    whose leave came before the delay. That is no looser than the 100 ms bound it replaces, and it matches the
    earlier R-12 rows.
- **Mutation.** Phase 2 round 3 re-ran `overlay.ts` over the changed ranges from `--base 6788697`: no survivor and no
  timeout. The four `Stryker disable` records it lists are on lines the fix did not change, and their reasons still
  hold. I did not re-run mutation here; this round runs targeted checks only.

## Checks run

These ran at `57764c6` in `/home/user/ocelle-components`. The environment had `OCELLE_CHROMIUM_PATH` pointing at
chromium-1243, the given `PLAYWRIGHT_BROWSERS_PATH`, and `OCELLE_VISUAL_ENGINE=auto`, with `CI` and `GITHUB_ACTIONS`
unset.

| Check | Result |
|-------|--------|
| `gate:typecheck` | no type error |
| `gate:lint` | 300 files, no finding |
| `gate:test-lint` | 204 files, no finding |
| `gate:csp` | 16 files, no finding |
| `gate:manifest` | 5 elements, no finding |
| `gate:prefix` | 248 files, no finding |
| `vitest run gates/test/vitest-config.test.ts` (the branch's version) | 10 of 10 passed |
| `vitest run --project elements --project elements-browser`, dialog and drawer, in process and fixture, filtered to the T058/T059 rows, "Moved while open", the removal rows, "Rapid toggle" and "Platform close during a 1 000 ms entry" | 4 files, 126 passed, none failed |
| `vitest run --project elements --project elements-browser`, tooltip, in process and fixture, filtered to "Escape" (includes the T060 row) | 2 files, 18 passed, none failed |
| `git merge-tree --write-tree HEAD origin/main` (23ba5c5), and the same against `c4c0af4` | 26 conflicting files against 23ba5c5, 1 against `c4c0af4` (L2-01) |

I did not run the full `pnpm test`, visual, axe, plants or the mutation gate (targeted checks only). Phase 2 round 3
ran `--project elements --project elements-browser` in full (1997 of 1997) and a full `pnpm test`. That run had three
motion-timing failures, which passed when run alone. Phase 5 round 3 had one similar failure. Neither phase linked them
to the fixes, and they stay the orchestrator's watch item for the landing runs.

## Earlier findings

- **L1-01 (blocking): resolved.**
  - `overlay.ts` makes the no-motion end of a close cancellable:
    - a per-close token `#pending` (:273, :561-567);
    - `#stop()` (:547-551) clears the token and cancels the animation;
    - `#stop()` is called by `disconnectedCallback` (:321), `#reopen` (:420), `#begin` (:479) and both platform-close
      branches (:673, :677);
    - `#begin`'s end also requires `!this.open` (:484-486), which covers a host `open = true` whose update has not run
      yet.
  - `#leave` (:513-518) now removes only this overlay, so `splice(-1, 1)` on the overlay beneath can no longer happen.
  - The removal, reopen and stacked rows were red at `4a864bf` (`red-fix-2.log`) and pass at HEAD in my run.
  - Phase 2 round 3 also confirmed the landing probe's sibling shape at HEAD (R3-01 there).
  - The spec, research and checks text now state the behaviour: FR-022, the edge case "Removed or reopened while
    closing, with no motion", R-05a, R-06, and `contracts/checks.md`.
- **L1-02 (blocking): resolved by an operator decision, still to be applied.**
  - `reviews/operator-standing-decisions.md` § "Merge resolution for gates/test/vitest-config.test.ts (2026-11-16,
    landing #47)" records the answer "Take the branch's version", with the reason. It replaces the 2026-11-15 rule
    for this file only.
  - The branch's version is unchanged since round 1 and passes 10 of 10.
  - The merge has not happened. With main now at 23ba5c5, the condition in L2-01 applies: the resolved
    `vitest.config.ts` must keep `elements-touch`.
- **L1-03 (note): resolved.**
  - `connectedCallback` (:309-314) requests an update, so `updated()` makes the show it could not make while the
    overlay was out of the document. `open` is not reset.
  - FR-004 and the new edge case "Opened, then moved before it is shown" state this.
  - The later-task rows were red at `4a864bf` and pass. The same-task variant and "Moved while open" pass.
- **L1-04 (note): carried** to the PR body, as L2-02.
- **L1-05 (note): carried.** CI and the merge gates still judge the merge commit. That merge commit now also includes
  Mission 013 (L2-01).

### Regression check of the changes since round 1

- **`overlay.ts`.** I read the full diff.
  - The `connectedCallback` addition only requests an update. `updated()` acts only on an `open` and state pair that
    needs it. So re-inserting a closed overlay with `open` false, or a shown one, changes nothing. "Moved while open"
    passes.
  - `#stop()` replaces the earlier pair `#animation?.cancel(); #animation = undefined` at each call site, and also
    clears the token.
  - The entry's no-motion end (opening → shown) can now be cancelled by `#stop()` too. Every caller of `#stop()`
    moves the state away from `opening` anyway, so no shown overlay is left in `opening`.
  - The `#leave` filter keeps the stack order.
  - No public surface, event, style or token changed.
- **Tooltip T060.** Only the row and the comment on `longDelay` changed. `ocelle-tooltip.ts` is unchanged. The row
  passes in both harnesses.
