# Operator decisions — op 022

Recorded by the /ocelle-run orchestrator from the operator's (jeroennouwsdev) gate answers on 2026-11-20, after the
implementer reported that phase 1's icon fix (`aria-hidden="true"` on ocelle-button's icon wrapper, Q1 A) does not
make spec scenario 6 pass in Chromium 153: a slotted bare `<svg><title>` still contributes to the inner control's
name. Evidence: `reviews/phase-1/notes.md`.

1. **Icon fix — widen.** The planner amends spec and plan so that ocelle-button's inner control is named from its
   label wrapper inside the shadow root (`aria-labelledby`), keeping `aria-hidden` on the icon wrapper. The
   implementer then continues test-first. Semver stays patch; no new public API.
2. **ocelle-action-row — report as follow-up.** It has the same gap (name `Folder Open project` in button and link
   mode). `ocelle-action-row.ts` stays unchanged in this op; the gap is reported to the orchestrator for a separate
   issue.
3. **Uncommitted green work — the profile finishes it.** The implementer's uncommitted changes are kept (stashed
   while the planner amends the artifacts, then restored) and the implementer finishes the phase on top of them and
   commits them itself.
4. **Docker — start dockerd** before the next check run (`nohup dockerd > /tmp/dockerd.log 2>&1 &`, then
   `pnpm run setup:online`), so the visual integration rows run.

## After the amendment (b921ab5)

5. **Red record for the T007 row — log only.** The link-mode scenario 7 row is run in a clean worktree at its
   test-only commit and the output saved as `reviews/phase-1/red-widen.log`; it is not appended to `red-commits`.
6. **Chromium 156 — re-measure first.** `pnpm run setup:online` installed the pinned Playwright Chromium
   156.0.8078.4; the blocker was measured on 153. The implementer re-runs scenario 6 with only `aria-hidden` on 156
   first; if it passes there, it stops and the operator is asked before `aria-labelledby` is added.

## After the T008 stop condition (f5b0bdf)

7. **Icon fix — relation only with an icon.** On Chromium 156 `aria-hidden` alone still leaves the name
   `Folder Open`. The planned relation (whenever `#name()` is undefined) turned 14 existing button rows red on axe
   `incomplete label-content-name-mismatch` for one-character content. FR-003 is amended: the inner control is named
   from `.label` by `aria-labelledby` only when the icon slot has assigned content (and no host `aria-labelledby`,
   `aria-label` or non-blank `label` names it). The icon + one-character-label axe result is recorded as a known
   limitation in spec, README and CHANGELOG. Existing rows are not loosened. The implementer then finishes test-first.
8. **Scenarios 9 and 10 — keep.** The rows the planner added in 3c304ff (icon slotted after first render; icon
   removed beside `S`) stay, in a third test-only commit logged as `reviews/phase-1/red-slot.log`.
