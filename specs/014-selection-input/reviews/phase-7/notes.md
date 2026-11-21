# Phase 7 notes

## T112 — the composed `ocelle-dialog` + `ocelle-listbox` story (FR-054)

- #16 (mission 008, `ocelle-dialog`) has merged into `main` as `13af7a9`, so T112's "if #16 has merged" branch applies.
- This branch does not merge `main` mid-run (operator decision 1, `reviews/phase-7/operator-decisions.md`,
  2026-11-17, human:jeroennouwsdev): phase 7 runs without the composed story, and no story or baseline for it is
  added here.
- The composed `ocelle-dialog` + `ocelle-listbox` story (the Open project dialog), with its light and dark baselines
  captured in the pinned container under docker, is added during `/ocelle-land`, after the landing's merge of `main`,
  as a test-first landing fold: the story test red first, then the story and its baselines.
- **Added as that fold (T114, operator round 2, O2-01, label fix-2).** Red `ea7eca6` (the story test) and `2b73f1f`
  (the listbox's tab stop in an open dialog, decision 2); the listbox fix `11ae954`; the story `62805ad`
  (`elements-ocelle-listbox--inside-an-open-dialog`, "Inside an open dialog"); the baselines and union counts
  `e8c3cee`. `pnpm run visual:update` in the pinned container under docker wrote 2 files (2 added, 0 changed,
  0 removed); no other baseline changed. `fail-token-changed` is 149 -> 150 findings: the composed story's light
  capture shows `color-ink` (the dialog's text and the options), confirmed by the plant's own run in the pinned
  container under docker (`gate:plants -- --affected ea7eca6^`, `plants.md`). No podman cross-engine check was
  possible here; CI confirms the baselines at landing (FR-053).

## R2-01 — the link's header comment

The header comment of `packages/elements/src/ocelle-link.ts` now states the platform's convention for Meta (phase 6
operator decision 2), as the README does: a new tab or window for Ctrl, Shift and the middle click; for Meta, a new tab
on macOS (Cmd) and the link followed in place by Chromium on Linux. Comment only, no behaviour change.

## T110 — the copy field example's `aria-label`

The README examples carry no host ARIA, with one exception the documentation test allows by name: `aria-label` on
`ocelle-copy-field`, which is that element's documented name (it has no `label` property; contracts/elements.md
§ `ocelle-copy-field`, README "Name the field with a host `aria-label`"). It names the element as a `label` would; it
is not ARIA wiring (SC-009).

## T114 — the composed story as a landing fold (O2-01; operator decisions 1 and 2)

### The first fix-2 red commit, `ea7eca6` (its `red.sh 7 fix-2` output, kept here before the re-run)

`red.sh` keeps one line per label and overwrites `red-fix-2.log`, so the proof of the first red commit is copied here
before the second red commit (step 1a) is recorded:

```
{"phase":"7","label":"fix-2","sha":"ea7eca62258e3a3c4aa206ac84ff22d41616ba5b","tests_only":true,"red":true,"recorded":true,"exit_code":1}
```

`unit-tests: 4 of 8006 tests failed`. The two story tests failed on their assertion, not on a load error
(`storybook/test/integration/elements-stories.test.ts:1328`, the composed story in light and in dark: `AssertionError:
expected { dialogs: { …(4) }, …(5) } to deeply equal { …(6) }`; the story id was not in the built Storybook, so no
dialog and no listbox were observed: `dialogs: []`, `listboxes: []`, `defined` false, `inDialog` and `onTop` false).
The other two failures of that run are not of this fold: `packages/elements/test/browser/drawer.test.ts:37` (rapid
toggle during the entry) and `packages/elements/test/driver.test.ts:298` (copy of a paragraph); the run shared the
machine with a full `gate:plants` run (classified below).

### First-open focus (found while building the story; operator decision 2)

The story built as T114 specifies put focus on the dialog's close control, not on `gamma`: 0, 500 and 2000 ms after
load the deep active element was `ocelle-dialog > button[part=close-button]`, while `gamma` already had
`tabindex="0"` and `aria-selected="true"`. A Tab then moved to `gamma`, and closing and reopening the dialog focused
`gamma`. The operator chose "Fix in listbox (Recommended)" (`operator-decisions.md`, decision 2).

The cause, as measured: the listbox already wrote its roving `tabindex` in `connectedCallback`; what came only in its
first deferred update was its shadow root's `part="list"` and `<slot>`. Until then the options are unslotted, so not
rendered and not focusable, and an `ocelle-dialog` open at insertion picks its initial focus (008 FR-007) in its own
update, before the listbox's, and falls back to the close control. The fix (`11ae954`, `ocelle-listbox.ts` only)
flushes the listbox's first update in `connectedCallback` (`performUpdate()`, which returns at once when no update is
pending). `ocelle-dialog`, `overlay.ts` and every other file of 008 or `main` are untouched. T114 step 1a's optional
second check (`tabindex="0"` synchronously after insertion) was dropped: it already passed before the fix.

### The fix-2 red set

`red.sh` keeps one line per label, so the fix-2 red set is the two test-only commits, `ea7eca6` then `2b73f1f`, and
`red-commits` names the tip:

```
{"phase":"7","label":"fix-2","sha":"2b73f1ffceebe494e78cefae3ff577d2bfc7bba4","tests_only":true,"red":true,"recorded":true,"exit_code":1}
```

`red-fix-2.log`: `unit-tests: 3 of 8007 tests failed`, all three on their assertion, none on a load error: the
composed story test in light and in dark (`elements-stories.test.ts:1328`, the story id not built) and the new
listbox test (`listbox.test.ts:97`, `active: "ocelle-dialog"` where `"gamma"` was expected).

### The two unrelated failures of the first red run

`packages/elements/test/browser/drawer.test.ts:37` and `packages/elements/test/driver.test.ts:298` failed in `ea7eca6`'s
run while a full `gate:plants` run shared the machine. Run alone (`vitest run` of both files), they pass (456 tests),
and they pass in the second red run and in the full `pnpm test` at the green tip: load flakes, not defects of this
fold.
