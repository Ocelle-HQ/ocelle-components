---
scope: landing
phase: landing
round: 1
verdict: changes_requested
base: 1b8b0b2b91fc969bb7499b64b509b06a09dbf24d
head: 5388795
tdd_check: pass
---

# Landing review, round 1 (PR #64, op 022-focus-trap-details-icon-name, #57)

This is a fresh review of the integrated diff `origin/main...HEAD` (`1b8b0b2...5388795`). HEAD merges main's mission
014 (selection and input). The package change is `focusable.ts` (`rendered()` now also needs `checkVisibility()`),
`ocelle-button.ts` (an `aria-hidden` icon wrapper, an icon `slotchange` listener, and the label-wrapper relation in
`updated()`), a comment in `icon-slot.ts`, README and CHANGELOG text, and the tests in `test/scenarios/{dialog,drawer,
button}.ts`, `test/button.test.ts` and `test/fixtures/shadow-controls.ts`. I read the phase review
(`reviews/phase-1/round-1.md`) as input and re-derived each boundary myself. Where I probed behaviour, I used temporary
rows that I reverted before writing this review.

The button half is correct in every naming combination the README promises, and it adds no public surface. The focus
half fixes the reported case but not the whole promise its docs make. A closed `<details>` whose hidden content holds
opaque content still lets Tab leave the modal (L1-01).

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| L1-01 | blocking | packages/elements/src/focusable.ts:116-120; packages/elements/README.md:488-489; packages/elements/CHANGELOG.md:271-273 | The fix applies `checkVisibility()` only to stops. An opaque candidate (`isOpaque`: a custom element whose `shadowRoot` reads null) is pushed without any rendering check, so one inside a closed `<details>` is still the cycle's last candidate. `overlay.ts:727` then treats it as opaque content and lets Tab run natively. The engine skips the hidden content, and focus lands on the page body: the defect of #57. I measured two temporary rows in `detailsRows` (in process, Chromium, merged tree). Content `b1` + `<details><summary id="s">More</summary>X</details>`, Tab from the summary. X = `<ocelle-test-closed id="xc">` (closed shadow root) gave the path `body dlg[button] b1 s body`. X = `<x-probe><a href="#x">L</a></x-probe>` (a light-DOM custom element around a link, a common markup pattern) gave the same path. The expected path was `dlg[button] b1 s dlg[button] b1`. The README now says without condition "The content of a closed `<details>`, apart from its summary, is not rendered, so it is no stop". The CHANGELOG says "a link or other focusable element inside a closed `<details>` is no longer counted as a Tab stop, so Tab from the summary ... wraps". The second probe is exactly a link inside a closed `<details>`, and focus still escapes the modal. This is not a regression (main behaves the same), but the docs this op adds promise more than the code does, and the gap fails open (focus leaves a modal dialog). | Choose one, with the operator: (a) extend the fix so that an opaque candidate in a subtree the engine skips is no candidate, and add these two rows (dialog, drawer inherits) as red rows first. Note that `checkVisibility()` on the opaque host itself is wrong for a `display: contents` host, which has no box but is legitimate, so the test needs care, e.g. on the nearest flat-tree ancestor with a box. Or (b) scope README :488-489 and the CHANGELOG entry to the elements the walk sees as stops, name the opaque-content case as a known limitation, and open a follow-up issue. |
| L1-02 | note | packages/elements/src/ocelle-option.ts:163, ocelle-tab.ts:166, ocelle-segment.ts:268; packages/elements/README.md:1558-1559, :1626, :1692-1693 | Overlap with main. Mission 014, merged here, brings three more controls on the slot convention. Their icon wrappers have no `aria-hidden`, and the README says of each that "the icon adds nothing to the [option's / tab's / segment's] name". Phase 1 measured that this holds for an `ocelle-icon` but not for a bare `<svg><title>` in Chromium 156 (`ocelle-button`, `ocelle-action-row`). These three are very likely the same gap, but I did not measure them. The op's new Slot convention sentence (README:2097-2098) and the `icon-slot.ts` comment now make the guarantee depend on each control keeping its icon out of its name, which is accurate. So this op makes nothing worse. | Add these three controls to the `ocelle-action-row` follow-up issue (phase-1 decision 2), and measure them there. Consider a shared helper on the slot convention for the hide-and-relate step, rather than four copies. |
| L1-03 | note | packages/elements/README.md:1067-1068, :1315 | Carried from R1-04. "A slotted icon is decorative and adds nothing to the button's name" has no condition. But an icon-only button with no `label` and nothing on the host is still named from the svg's `<title>` in Chromium 156 (spec.md § Edge Cases). The same bullet tells hosts to name such a button with `label`, so this is a host-mistake case. | Optional: add "in a labelled button" or similar when the README is next touched. |
| L1-04 | note | packages/elements/src/focusable.ts:58-60 | The equivalent-mutant record is honest: `>= 0`/`true` are equivalent, because `checkVisibility()` is false for an element with no box, and per CSSOM that is the only element with empty client rects. But the disable comment also hides the non-equivalent `<= 0`/`false` mutants of the line, and Stryker cannot disable single replacements. The `getClientRects()` test is now redundant except as a cheap short-circuit. | Optional: drop the redundant test. Then nothing needs disabling, at the cost of one style read per non-box candidate. |
| L1-05 | note | ops/022-focus-trap-details-icon-name/reviews/phase-1/red-widen.log:1, red-slot.log:1; reviews/history-map.txt | The red runs for scenario 7's link-mode row and scenarios 9/10 name the test-only commits `f5b0bdf` and `3f86a0c`. The phase fold squashed both into `55b77a6`, and `history-map.txt` maps only `d820f00` and `8da12aa`. Those SHAs resolve only through the local ref `refs/ocelle/prefold/phase-1/...`, which is not on origin, so after landing they cannot be resolved. The red claim itself still stands: `check-final-tests-on-base.log` shows each of these rows failing against base with HEAD's tests (18 failures, all op rows). | Optional: a line in `notes.md` or `history-map.txt` saying that these two commits were folded into `55b77a6`. |
| L1-06 | note | ops/022-focus-trap-details-icon-name/spec.md:131 | Carried from R1-01. SC-001 still lists scenario 2 (Shift+Tab to the summary) as red on main, but it passes there. | Optional docs touch. |

## Boundaries checked

- **`rendered()` and its two callers** (`focusable.ts:121` stops, `:154` scrollers). `checkVisibility()` with no
  options is false for no box and for a `content-visibility: hidden` flat-tree ancestor. It is not false for
  `content-visibility: auto` off-screen content (that needs `contentVisibilityAuto`), so long dialog bodies are not
  regressed. The method ships from Chromium 105 and WebKit 17.4. The release's engine floor is Chromium 135 and WebKit
  17.4 (CHANGELOG § Unreleased), so it never throws there. An `<iframe>` or a media element with `controls` in a
  closed `<details>` goes through `rendered()`, so it is covered. The opaque branch (`:116`) does not use it (L1-01).
  `ocelle-tooltip` imports only `deepActive`, so it is unaffected. The focus-trap rows (dialog, drawer inherited)
  pass on the merged tree.
- **`ocelle-button` naming.** Precedence is unchanged. Resolved host `aria-labelledby` wins (`#labelledBy` returns
  `found`; pinned by `link.ts:553`, which has an icon). Host `aria-label` and a non-blank `label` give `#name()`, so
  there is no relation (pinned in both modes). With an icon and nothing on the host, the inner control is labelled by
  `.label` of its own render root, so no ID crosses a shadow root. Whitespace-only `label` counts as none. With host
  `aria-labelledby` IDs that all miss, `#resolved` is empty, so the fallback order applies as before. With no icon,
  the relation is `null`, so the name comes from the content as before, and no existing row changes. Busy state: the
  spinner svg is `aria-hidden`, so nothing changes. Both modes share `content` and `updated()`.
- **slotchange.** `#readIcon` reads `assignedElements({ flatten: true })` on every `slotchange` of the icon slot, then
  `requestUpdate()`. A forwarded empty slot counts as no icon (pinned by `forwardedIconScenarios`). An icon moved in
  after render (scenario 9) or out (scenario 10) is followed. Before the first `slotchange`, the name can include the
  title for one frame; nothing reads it there.
- **Public surface.** `custom-elements.json` is unchanged in `origin/main...HEAD`. The new members are `#` private,
  and there is no new attribute, event, slot, part, token or export. The seam (a slot listener that sets a private
  flag, and a relation in `updated()`) follows the pattern `ocelle-action-row` uses (`#readSlots`).
- **Accessibility and security.** The relation is element reflection within one shadow root. There is no inline
  style, no network use and no new sink. `aria-hidden` on the wrapper also hides a slotted `ocelle-icon label="..."`,
  which the slot convention already forbids ("never given a `label`").
- **ocelle-action-row** is unchanged in the diff, as decided (phase-1 decision 2). Its gap is recorded in `notes.md`.
- **CHANGELOG and README beside main's entries.** `### Fixed` follows main's `### Added` under one `## Unreleased`,
  with no duplicate heading. The button entry matches the behaviour, including the one-character-label limitation.
  The dialog entry overstates it (L1-01).

## Test quality

- **Red evidence.** `tdd-check.json`: `pass`. The red commit `65626eb` (the folded `d820f00`) changes only
  `test/scenarios/{button,dialog,drawer}.ts` and exits 1. The final tests on base exit 1, and HEAD exits 0.
  `check-final-tests-on-base.log` fails exactly the 18 op rows, each on the missing behaviour (`body` in the Tab path,
  the `image` node, the name `Folder Open`), not on setup. The green commit `55b77a6` also adds tests. These are the
  two mutation pins and the folded test-only commits behind `red-widen.log` and `red-slot.log` (see L1-05). All are
  additions, with no removed assertion.
- **Weakening.** `git diff 65626eb..HEAD -- packages/elements/test` adds lines and extends two header comments and one
  import. No row is loosened, skipped or deleted.
- **Assertions.** Every new row compares a fixed expected object with `toEqual`: the role and name, the filtered
  `image`/`Folder` nodes, and serious or critical axe results. There are no conditional assertions, no snapshots and
  no mocks.
- **Coverage gap.** No row covers opaque content inside a closed `<details>` (L1-01).
- **Mutation.** Phase 1 recorded 43 mutants on the changed lines, none surviving, and one equivalent record (L1-04).
  My own `gate:mutation -- --base 1b8b0b2` on the merged tree exited 2: "Stryker wrote no report (There were failed
  tests in the initial test run.)". Another Stryker run was active in the same checkout at the same time, and the
  targeted suites below pass, so I count my run as inconclusive, not as a finding. CI's Mutation testing check
  decides it.

## Checks run

Under operator decision 9 (CI-first), on the merged tree:

- `vitest --project elements` on `button.test.ts` (all 124 rows in process): pass.
- `button`, `dialog` and `drawer` filtered to `op 022`: 24 passed.
- Two temporary probe rows in `test/scenarios/dialog.ts` (L1-01): both failed as described, then reverted. The
  working tree is clean.
- `gate:mutation`: inconclusive (above).
- Fast gates (typecheck, lint, style-lint, test-lint, manifest, config-copies, csp, prefix, signoff) were reported
  green by the caller. I did not rerun them. CI has not reported yet.

## Earlier findings

There is no earlier landing round. Phase-1 round-1 had no blocking finding; its notes R1-01 and R1-04 are still open
(L1-06, L1-03).
