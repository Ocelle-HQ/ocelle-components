---
phase: 2
round: 3
verdict: approved
base: 6788697d7c2bc365b17d5747796f34f5934b964a
head: 36918fb670721dcc25f05465697e56505479fb4c
tdd_check: pass
---

# Phase 2 review, round 3

Scope: the fixes for the operator round `round-2.md` (R2-01 = landing L1-01, R2-02 = landing L1-03; tasks T058 and
T059). Commits: red `4a864bf` (`red.sh 2 fix-2`), fix `f741f55` (`packages/elements/src/overlay.ts`), mutation-driven
test changes `23928b9`, check `36918fb` (`tdd-check.json`). Landing stop rule applied: a new finding blocks only if it
breaks a requirement and comes with a reproduction. Reviewed at `36918fb`; the branch head moved to `a4dc5cd` during the
review (phase 5 review round 3, docs under `reviews/phase-5/` only), which changes nothing here.

## Findings

No blocking finding.

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R3-01 | note | packages/elements/test/scenarios/dialog.ts:1649 | The stacked row's red failure was a stray `…-close` (reason `host`) from the removed inner overlay and focus returning to the body instead of `ob`. It was not the outer overlay acting on Escape, which T058 predicted. I re-ran it at `4a864bf`: the diff was only on `focus` and `recorded`, and the `second` part (a second Escape reaches the outer) matched even at red, so that part does not discriminate. The row still fails at red because of the defect. I wrote a scratch probe (not committed) with two sibling overlays (dialog/dialog, drawer/dialog, dialog/drawer): B is closed with no motion, removed in the host's continuation of `updateComplete`, then Escape is pressed. At `4a864bf`, A got no request or close. At HEAD, A gets exactly one request and one close with reason `escape`. So FR-023 holds at HEAD for the shape the landing probe used. | Optional: add a sibling-overlay row that pins the landing probe's shape directly. |
| R3-02 | note | packages/elements/test/browser/dialog.test.ts:36 | The fixture runner still names tests with `$name`, which is cut to 40 characters. The two R2-02 variants "Opened, then moved before it is shown, re-inserted in a later task" and "… in the same task" (dialog.ts:1783, :1785) share one name in that runner, and the red log's dialog lines are cut the same way. This was accepted as optional earlier (tasks.md Rules § Full test names, R1-02). The in-process runner and both drawer runners use full names. | Optional: `for … it(name, …)` as in `test/browser/drawer.test.ts:36`. |
| R3-03 | note | (full `pnpm test`) | My full run at HEAD had 3 of 5107 failures. All three are motion-timing rows whose code the fix did not change: dialog fixture "Focus return is conditional (c) …", drawer fixture "Motion … side=\"end\" under ltr …" (`entry: []`, so the entry had already ended before it was read), and drawer in-process "Backdrop during the exit, motion on …". Each passed 3 times out of 3 in isolation, and `--project elements --project elements-browser` then passed 1997 of 1997. This looks like the same full-suite load effect the implementer reported for the tooltip R-12 row. I have no reproduction that points at the fix, so this is a note. | None for this phase. |
| R3-04 | note | (environment) | In this container, Playwright's `browsers.json` names chromium-1248, but only chromium-1243 is installed, so `pnpm test` exits 2 ("Chromium not found"). I ran every browser check with `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`, the supported override. | None. |

## Test quality

- **Red evidence.** `red-commits` has `fix-2 4a864bf`. `red-fix-2.log` lists 20 failures: the five reduced-motion
  and later-task rows, for both elements, in both harnesses. Every one is an `AssertionError`, with no setup or
  timeout error. I re-ran the in-process dialog rows at `4a864bf`. The removal row and the reopen row each received a
  `ocelle-dialog-close` with reason `host`. The later-task R2-02 rows got `modal: false` and `topLayer: 0`, with focus
  left on the opener and no close on `open = false`. The stacked row is described in R3-01. All of these are the
  missing behaviour. The motion-on halves and the same-task variant pass at red, as T058 and T059 predicted.
- **No weakening after red.** `git diff 4a864bf..HEAD -- packages/elements/test` touches only `scenarios/dialog.ts`
  (`23928b9`, two hunks) in phase 2's tests. `scenarios/tooltip.ts` changed in `5b142cc`, which is phase 5's T060
  and outside this scope. No red row was changed.
- **The two test changes in `23928b9`:**
  - "Rapid toggle: re-open during the exit, motion on" (dialog.ts:1824) is stricter. It adds `atReopen: 0`, which
    reads the panel's animations right after the reopen. Everything it asserted before is unchanged. I removed
    `this.#stop()` in `#reopen` (overlay.ts:420): the row failed for dialog and drawer. It passes on the fix. The read
    has no condition, and under load it can only go from 1 to 0, never cause a false failure on correct code.
  - "Platform close during a 1 000 ms entry" (dialog.ts:2288) is new and asserts its precondition: `entering:
    ["running"]` proves the platform close comes during the entry. It then asserts no animation left, one close with
    reason `host`, the state `gone`, and focus on the opener. I removed `this.#stop()` in the platform-close branch
    (overlay.ts:673): the row failed for both elements. It passes on the fix and on the pre-fix source (`4a864bf`
    `overlay.ts`). So it pins behaviour that already existed and that the `#stop()` refactor must keep. It is a
    mutation guard and could not have been a red row, which is acceptable.
  - Both rows end with real assertions on observable state (top layer, animations, events, focus), with no
    conditional assertion, `skip` or `only`.
- **Coverage of the findings.** R2-01 has its removal, reopen and stacked rows, each also with motion on. R2-02 has
  the later-task row, the opened-while-out row and the same-task positive half. All six run for `ocelle-dialog` and
  `ocelle-drawer` in both harnesses. The `settled` stand-in op (dialog.ts:217) reproduces the host's
  `await el.updateComplete` continuation.
- **Mutation.** I ran `node gates/bin/mutation.ts --base 6788697 --files packages/elements/src/overlay.ts:<range>` on
  the fix's lines in three runs (`--files` takes one range per file):
  - `665-680`: 24 mutants, none survived, 8 compile errors.
  - `269-325`: 27 mutants, none survived, 6 compile errors, 2 records.
  - `415-570`: 176 mutants, none survived, 82 compile errors, 2 records.
  - No timeouts in any run. The four records are on lines the fix did not change (`:276`, `:317`, `:414`, `:507`).
    Their reasons still hold for the changed code. `:507` (`#ownCloses`) relies on the counting that T058 kept
    unchanged. In `#onClose`'s `closing` branch, a queued own close finds the overlay reopened or already closed,
    and the token and the `!this.open` check add no path that runs `#finish` twice. The implementer's own runs over
    the whole file from the phase base (`mutation.log`, final runs C and D) also show no survivor.

## Checks run

- `tdd-check.json`: `pass`, no problems. It covers `phase` (0f427ea) and `fix-2` (4a864bf). It was taken at `da97557`.
  HEAD `36918fb` only re-records the check's own evidence files (`git diff da97557 36918fb` touches only
  `reviews/phase-2/check-*.log` and `tdd-check.json`), so it is current for the code.
- `gate:typecheck`, `gate:lint` (300 files), `gate:test-lint` (204), `gate:csp` (16), `gate:manifest` (5 elements),
  `gate:prefix` (248): no finding.
- `vitest run --project elements --project elements-browser` at HEAD: 33 files, 1997 of 1997 passed. That is the
  implementer's 1993 plus the new platform-close row × 2 elements × 2 harnesses.
- Full `pnpm test` at HEAD: 5104 of 5107; the 3 failures are timing rows, see R3-03. The implementer's
  `check-fix-2-full-test.log` has 5107 of 5107, and `check-head.log` (the tdd-check's HEAD run) passed in full.
- Targeted mutants by hand (`#reopen`'s and the platform close's `#stop()`), plus the sibling probe of R3-01, in a
  scratch worktree. Nothing was committed and nothing was left in the repository.
- Constitution: the fix adds no element, event, style or network request. The no-motion path keeps R-06. Principle
  VIII holds: the fix came after a red commit with test files only, the later test changes are stricter or
  additive, and mutation is clean. Plan: the fix is confined to `overlay.ts`, as T058 and T059 require.
- Tasks: T058 and T059 are ticked and their required work is present. Every Phase 2 task is ticked.

## Earlier findings

- **R2-01 (landing L1-01): resolved.**
  - `#animate`'s no-motion end now takes a token (`#pending`, overlay.ts:273, :557-570). `#stop()` (:547-551)
    clears that token and cancels the animation. `#stop()` is used in `disconnectedCallback` (:321), `#reopen` (:420),
    `#begin` (:479) and both platform-close branches (:673, :677).
  - The close's end also requires `open` to still be false (:484-486). This covers a host `open = true` in the
    same continuation, before its update runs `#reopen`.
  - `#leave` (:513-518) now removes only this overlay, so `splice(-1, 1)` can no longer take the overlay beneath.
  - The removal, reopen and stacked rows were red at `4a864bf` and pass at HEAD. The sibling probe (R3-01) passes at
    HEAD and failed at red.
  - The mutation re-run is clean.
- **R2-02 (landing L1-03): resolved.**
  - `connectedCallback` (:309-314) calls `requestUpdate()` after Lit's own, so `updated()` makes the show it could
    not make while the overlay was out of the document. `open` is not reset.
  - The two later-task rows were red and pass at HEAD.
  - The "Moved while open" rows still pass: my scratch probe, with an open overlay removed and re-inserted in a later
    task, gave `open` false, not `:modal`, and no event.
