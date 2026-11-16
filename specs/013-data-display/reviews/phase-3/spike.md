# Phase 3 spike (T035): a platform oracle for `valuetext`

Run on 2026-11-15 in this container (Linux x64, Node 22.23.4, Chrome for Testing 153.0.8010.12 at
`/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` and its headless shell at
`/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell`, through
Playwright 1.64.1). Scratch scripts only, in the session scratchpad; nothing of them is committed.

**Outcome: stop-and-ask reached (tasks.md § Stop-and-ask points, T035).** No platform read exposes the value text,
for the ElementInternals bar or for any other control that sets `aria-valuetext`. US3-3 goes to the operator (R-05).
The phase stops here: no scaffold, no red commit.

## Subjects

On one page (`page.setContent`):

| Id | Markup | Value text set |
|---|---|---|
| `native` | `<progress value="7" max="12" aria-label="Native" aria-valuetext="7 of 12">` | `aria-valuetext` |
| `aria` | `<div role="progressbar" aria-label="Aria" aria-valuenow="7" aria-valuemin="0" aria-valuemax="12" aria-valuetext="7 of 12">` (light DOM) | `aria-valuetext` |
| `ei` | a custom element with `attachInternals()`: `role = "progressbar"`, `ariaLabel = "EI"`, `ariaValueMin = "0"`, `ariaValueMax = "12"`, `ariaValueNow = "7"`, `ariaValueText = "7 of 12"`, and an open shadow root holding one `<div>` (R-05's B3) | `internals.ariaValueText` |
| `ei2` | the same without `ariaValueText` | none |
| `ei3` | the same without `ariaValueNow` and `ariaValueText` (indeterminate) | none |
| `r` | `<input type="range" value="7" max="12" aria-label="R" aria-valuetext="seven">` | `aria-valuetext` |
| `sl` | `<div role="slider" aria-label="S" aria-valuenow="3" aria-valuetext="three" tabindex="0">` | `aria-valuetext` |

## Reads

| Read | `native` | `aria` | `ei` | `ei2` | `ei3` | `r` | `sl` |
|---|---|---|---|---|---|---|---|
| `locator.ariaSnapshot()` | `progressbar "Native"` | `progressbar "Aria"` | not listed (the page's snapshot lists light-DOM roles only) | | | `slider "R": "7"` | `slider "S"` |
| CDP `Accessibility.getPartialAXTree` (node, no relatives) | value 7, min 0, max 12, `valuetext ""` | value 7, min 0, max 12, `valuetext ""` | value 7, min 0, max 12, `valuetext ""` | value 7, `valuetext ""` | no value, `valuetext ""` | | |
| CDP `Accessibility.getFullAXTree` | as above | as above | as above | as above | as above | | |
| CDP `Accessibility.queryAXTree` (role `progressbar`, after `Accessibility.enable`) | as above | as above | as above | as above | as above | | |
| CDP `Accessibility.getAXNodeAndAncestors` (after `Accessibility.enable`) | | `valuetext ""` | | | | value 7, `valuetext "7"` | value 3, `valuetext ""` |
| Playwright `page.accessibility.snapshot()` | not available: removed from Playwright 1.64.1 (`page.accessibility` is undefined) | | | | | | |

The same reads with `--force-renderer-accessibility`, with `--enable-experimental-web-platform-features`, and on the
headless shell gave the same values. `Element.computedRole` and `computedName` (experimental) exist with that flag and
give the role and name only; there is no value-text accessor.

## What this shows

- Chromium's CDP reader reports a `valuetext` property on every range node, but it is empty whenever the text comes
  from `aria-valuetext`, in the light DOM as through ElementInternals. The only non-empty `valuetext` seen is a native
  range input's own computed text (`"7"`), which ignores its `aria-valuetext="seven"`.
- `ariaSnapshot()` gives a range's value only for native controls (`slider "R": "7"`, again not the
  `aria-valuetext`), never for a progressbar, and does not reach a custom element's internals role at all.
- So no platform read in this harness can tell "7 of 12 exposed" from "nothing exposed": an oracle built on any of
  them would pass against the scaffold and against the green element alike, so US3-3 has no non-vacuous oracle among
  platform reads. R-05 rules out the `internals` reflection read (constitution VIII: an assertion on the unit's own
  state is no stand-in), and tasks.md T038 binds US3-3 to this spike's oracle, so it is not weakened here.

The rest of R-05's value properties are readable: `value`, `valuemin` and `valuemax` come back from
`getPartialAXTree` and `getFullAXTree` for the ElementInternals bar, with no `value` for the indeterminate one, so the
driver addition of T037 can carry them (and `valuetext`, which reads `""` today).

## Question for the operator

US3-3 ("Given a `value-text` of "7 of 12", When the tree is read, Then the exposed value text is "7 of 12"") has no
platform oracle in Chromium 153 through Playwright 1.64.1. Options:

- **(a) Prove the wiring, not the exposure.** US3-3's body asserts what the platform shows of `value-text`: the
  visible `value-text` part reads "7 of 12" with `show-label`, is absent while indeterminate and kept when clamped
  (SPEC-2-02), and the bar's name and value are unchanged; the exposure itself is stated in the README as unverified by
  the library's tests (as axe's name gap is, R-05). The AX `valuetext` driver field stays, read `""`, with no
  assertion of the value text on it. Spec US3-3 and R-05 are amended to say so.
- **(b) A platform accessibility API outside CDP.** Read the bar through Linux AT-SPI (`--force-renderer-accessibility`
  on a headed Chromium under a virtual display and a D-Bus accessibility bus, read with a new dev dependency such as
  `pyatspi` or a Node D-Bus client), which reports Chromium's `aria-valuetext`. This adds a display server, a D-Bus
  bus and a new dependency to the test harness and CI, and a third harness besides the two FR-052 names; it is not in
  plan.md.
- **(c) Accept the `internals` reflection read for US3-3 only**, as a recorded exception to R-05's rule: the body
  reads the element's `ElementInternals.ariaValueText` through a test hook, beside the visible part. This is an
  assertion on the unit's own state, which constitution VIII names as no stand-in, so it needs the operator's
  explicit exception and a Complexity Tracking row.
