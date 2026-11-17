# Phase 7 notes

## T112 — the composed `ocelle-dialog` + `ocelle-listbox` story (FR-054)

- #16 (mission 008, `ocelle-dialog`) has merged into `main` as `13af7a9`, so T112's "if #16 has merged" branch applies.
- This branch does not merge `main` mid-run (operator decision 1, `reviews/phase-7/operator-decisions.md`,
  2026-11-17, human:jeroennouwsdev): phase 7 runs without the composed story, and no story or baseline for it is
  added here.
- The composed `ocelle-dialog` + `ocelle-listbox` story (the Open project dialog), with its light and dark baselines
  captured in the pinned container under docker, is added during `/ocelle-land`, after the landing's merge of `main`,
  as a test-first landing fold: the story test red first, then the story and its baselines.

## R2-01 — the link's header comment

The header comment of `packages/elements/src/ocelle-link.ts` now states the platform's convention for Meta (phase 6
operator decision 2), as the README does: a new tab or window for Ctrl, Shift and the middle click; for Meta, a new tab
on macOS (Cmd) and the link followed in place by Chromium on Linux. Comment only, no behaviour change.

## T110 — the copy field example's `aria-label`

The README examples carry no host ARIA, with one exception the documentation test allows by name: `aria-label` on
`ocelle-copy-field`, which is that element's documented name (it has no `label` property; contracts/elements.md
§ `ocelle-copy-field`, README "Name the field with a host `aria-label`"). It names the element as a `label` would; it
is not ARIA wiring (SC-009).
