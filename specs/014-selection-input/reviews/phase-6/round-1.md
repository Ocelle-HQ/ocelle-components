---
phase: 6
round: 1
verdict: changes_requested
base: 493142e972c437175f59b9c4c725a1fd1b47e91a
head: 6047f9e
tdd_check: pass
---

# Phase 6 review, round 1

User Story 5, `ocelle-link` (T090 to T100, T093a). Reviewed `git diff 493142e..6047f9e` (75 files); the working tree
was clean before this file.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking (operator decision) | spec.md:678-686 (US5-13); packages/elements/test/scenarios/link.ts:27-31, 787-788, 803; packages/elements/README.md:462-465 | US5-13 states, for `href` and Ctrl, **Meta (Cmd)** or Shift (click or Enter), three outcomes: no event, the default not prevented, and "the page itself does not navigate in place; the browser's own behaviour (new tab or window) is kept". On the platform the tests run on (Linux, Chromium 153) Meta is not a new-tab modifier: I measured a plain `<a href>` in the same Chromium, and a Meta click and Meta+Enter both navigate the page in place with no new page, while a Ctrl click opens a new page and stays. So with FR-046 kept (the element leaves the default alone), the third outcome cannot hold for Meta here, and the fixture body asserts only the first two for Meta (link.ts:787, 803). Its "where" is not read for Meta. The implementer's reading (FR-046 governs, and "Meta (Cmd)" means the macOS Cmd key) is plausible and matches operator decision Q2 (a) ("Ctrl/Cmd-click"). But it drops a stated acceptance outcome without a recorded decision, and the spec, the README ("keeps the browser's own behaviour, a new tab or window") and the shipped behaviour disagree on Linux and Windows. Also, US5-13 with `href` lists Meta "(click or Enter)", and Meta+Enter on the link with `href` is never exercised: the fixture body presses Ctrl+Enter and Shift+Enter only (link.ts:784-785). This is a spec defect, not an implementation defect. The element's code is right under every option below except (d). | The operator decides. Then the planner amends US5-13 (and FR-046/FR-049 and the README sentence where the option needs it), and the implementer applies the test change the option names, red first if it adds an assertion that can fail. Options: **(a) recommended**: Meta's outcome is the element's part only: no event, default not prevented, and then the platform's own behaviour (a new tab for Cmd on macOS; on Linux and Windows Chromium follows the link in place). The fixture body adds Meta+Enter with `href`, and the README says a Meta activation follows the platform's convention. **(b)**: as (a), and the fixture body also asserts the in-place navigation for Meta on Linux, so the test pins that the element does not interfere and records the platform behaviour. **(c)**: Meta counts as a modifier only where it is the platform's new-tab key (macOS), so on other platforms a Meta activation is plain: it emits and the element navigates. This changes FR-046 and needs platform detection. **(d)**: the element prevents the default of a Meta activation on non-macOS and does nothing. This contradicts FR-046's "keeps the browser's own behaviour"; I advise against it. |
| R1-02 | note | specs/014-selection-input/data-model.md:76-82 | § "Link state" does not list `label` and does not say that a host `aria-label` is not an input. The tabs section does say this (data-model.md:19-20). The spec (FR-045, US5-8), research R-08, contracts/elements.md, plan.md, the manifest and the README all carry the operator's decision consistently, and the code follows them (ocelle-link.ts:44-48, 140-144). So the gap is a stale restatement in a derived artifact, not a design gap or a defect in this phase's work. The implementer cannot fix it in their role, and the planner's edit was blocked by the permission system. | Before the feature lands (Phase 7 polish at the latest), the planner adds a `label` row (string or `null`, attribute and property, not reflected, trimmed, blank as none, set as the anchor's `aria-label`) and the sentence that a host `aria-label` on `ocelle-link` is not an input (FR-045). The operator grants that one edit. |
| R1-03 | note | storybook/.storybook/stories-layout.css:37-40; storybook/test/integration/elements-stories.test.ts:535-537; packages/elements/README.md (`ocelle-link` section) | The wrapped story is laid out on three lines because two lines give a serious axe `color-contrast` incomplete. I reproduced this on the built Storybook with axe-core 4.14.0: at 360 px the link wraps onto 2 lines and axe reports `color-contrast` incomplete, serious, `bgOverlap` on `ocelle-link >>> a[part="anchor"]`; at 240 px and 300 px (3 lines) and on one line it reports nothing. This does not sidestep FR-051. FR-050 asks for a link "wrapped across lines", which the story shows. US5-6's two-line requirement is for the focus-ring test, which does run on two lines (link.ts:513). The incomplete is axe failing to find the background (the anchor's own child is a slot, so it measures the union box, whose centre is on the paragraph), not a contrast defect: the link's colour pairs are checked by the contrast gate (R-15 row). No exception was added. But consumers also run axe: a host page whose `ocelle-link` happens to wrap onto exactly two lines will see a serious incomplete, and the README does not say so. | Before the feature lands, the README's link section states the axe-core 4.14.0 limitation (a serious `color-contrast` incomplete, `bgOverlap`, on a link wrapped onto exactly two lines, not a contrast failure; the link's colours are checked pairs). An upstream axe-core report is recorded, as phase 3 did. Tell the operator in the phase report, since it changes what consumers see in their own axe runs. |

## Test quality

- **TDD check**: `tdd-check.json` is `pass` (head `c5ba04b`; `6047f9e` only adds that record). Final tests: on base,
  exit 2; on the scaffold `1106482`, exit 1; on head, exit 0. Red commit `2794722` exits 1.
- **Red evidence** (`red-phase.log`): 124 of 4027 tests fail, each with an `AssertionError` from missing behaviour
  (navigationTarget returning null, the element undefined or rendering nothing, the manifest, README and story
  absent, and the gate counts). There is no import or setup error. The scaffold `1106482` adds signatures only
  (navigationTarget returns null, the class defines nothing), and no test file.
- **Red commit amended before `red.sh` recorded it** (flag 5): acceptable. Principle VIII binds the recorded red
  commit, and `red-commits` names `2794722`, whose run is the log above. The amendment bounded an unbounded
  `whenDefined` wait to 5 s (link-file.test.ts:77-81), so the scaffold run fails on its assertions instead of a timeout.
  This made the red failure *more* correct, and nothing was loosened.
- **Tests after red**: `git diff 2794722..HEAD` over the test pathspecs changes only the empty plant copy
  `gates/plants/storybook-build/fail-empty-index/tree/storybook/stories/link.stories.ts`, a plant tree and not a test.
  No test was weakened, skipped or deleted.
- **Vacuity**: every body compares a full observation object with `toEqual`. There is no conditional assertion, no
  `skip`/`only` and no snapshot; test-lint passes over 217 files. Each "does not" outcome is paired with its positive
  outcome in the same body, per contracts § Pairings (US5-2 Space with Enter, US5-5 with US5-4's navigation, US5-9 to
  US5-11 with a navigating link, US5-13 with a plain click, US5-14 cancelled with uncancelled, US5-8 with the text-named
  link).
- **Coverage of the story**: US5-1 to US5-14 each have a body: US5-12 on `file:` (elements-browser-file), US5-6 on two
  lines in light and dark from pixels, and US5-7 in forced colours from pixels. The Edge Cases (host `hidden`, a second
  definition, motion) have bodies too. The exception is the Meta parts of US5-13 named in R1-01. T093a: the real US2-22
  body runs in both harnesses (tabs.ts:1062-1087) and keeps the phase 3 stand-in.
- **Plants** (flag 4): 53 recorded in `plants.md`, each applied alone and every one biting, including every contract
  row of the link (the three `label`-path plants among them) and US2-22's row. Two forms were corrected after a first
  run that did not bite. I read both corrections, and they are acceptable: the first `??=` form was not a cache (it
  re-resolves while the value is `null`), and the first `:host` form only reordered rules whose specificity already
  decided. The corrected forms are the defects the names state. *Navigating on every activation* is recorded on the
  fixture, because in process it reloads the Vitest frame, which would be an error rather than an assertion. On the
  fixture it fails US5-2 and US5-3 by assertion, and in process the same decision is killed by US5-9, US5-11, US5-14
  and link-target's tests. Acceptable.
- **Mutation** (re-run by me, `pnpm run gate:mutation -- --base 493142e`, exit 0): 115 mutants on the changed lines of
  3 files, none survived; 1 timeout (ocelle-link.ts:151, `"href"` to `""`, where `setAttribute("")` throws), 27 compile
  errors, 1 zero-mutant entry (index.ts). I read both equivalent records and accept them. The first is ocelle-link.ts:46:
  `{}` gives Lit's default property options, which equal `{ type: String }` (attribute `label`, the default converter,
  not reflected), the same record as the tabs' `label`. The second is ocelle-link.ts:163: with `event.button !== 0`
  forced `false`, Chromium dispatches `click` only for the primary button (other buttons fire `auxclick`), so no
  observable change is possible on the measured engine. Forced `true` is killed by US5-3. I also read the compile-error
  list. These are real type-checker rejections (for example the narrowed `url.protocol` compared to a second literal,
  and `location.assign` of `string | null`), not hidden survivors.
- **Anchor built in the constructor** (flag 3): acceptable. The element creates the `<a part="anchor">` in a field
  initializer and constructor, attaches it to the shadow root in `createRenderRoot`, and lets Lit render nothing
  (ocelle-link.ts:116-132). That is valid for a custom element constructor: it adds no host attribute and no host
  child. It keeps the anchor in the shadow root from connection on. The reason is real and tested: `ocelle-tabs`
  measures a panel's focusables when its content arrives, and the real US2-22 body fails if the anchor arrives a
  microtask later (notes.md "The design as built"; the plant *a light-DOM selector query* bites it). Plan/R-08 say the
  element "renders" the anchor, without prescribing a Lit template. Every anchor state the template would have bound
  is written by `#refresh`/`updated` and asserted (R-08 body, US5-8, US5-11).

## Checks run

All were run by me on `6047f9e`, one at a time, with `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`
and `OCELLE_VISUAL_ENGINE=docker`.

| Check | Exit | Result |
|---|---|---|
| `gate:mutation -- --base 493142e` | 0 | 115 mutants, none survived; 1 timeout, 27 compile errors, 1 zero-mutant, 2 equivalent records |
| `gate:typecheck` | 0 | no type error |
| `gate:lint` | 0 | 320 files, no finding |
| `gate:test-lint` | 0 | 217 files, no finding |
| `gate:style-lint` | 0 | 25 files, no finding |
| `gate:brand-rules` | 0 | 7 rules |
| `gate:pins` | 0 | 5 manifests |
| `gate:config-copies` | 0 | identical |
| `gate:prefix` | 0 | 302 files |
| `gate:contrast` | 0 | 166 pairs light, 174 dark (155 required) |
| `gate:manifest` | 0 | 11 elements |
| `gate:csp` | 0 | 30 files |
| `gate:signoff -- --range 493142e..HEAD` | 0 | 9 commits, no finding |
| `gate:unit-tests` | 0 | 4027 tests in 168 files |
| `vitest run --project elements-browser-file` | 0 | 2 tests (US5-12) |
| `gate:storybook-build` | 0 | 55 stories |
| `gate:visual` | 0 | 110 captures match (docker only; no podman, CI confirms at landing per the 2026-11-14 decision) |
| `gate:axe` | 0 | 110 story-theme runs, 0 serious or critical; 22 notes, all the existing exceptions; no new exception |
| `gate:plants` | 0 | 301 plants of 17 gates and the registry, every plant as expected (rerun in full after a container restart killed the first run) |

My own measurements: (1) a plain `<a href>` in the same Chromium, where a Meta click and Meta+Enter navigate in place
and a Ctrl click opens a new page (R1-01); (2) axe-core 4.14.0 on the built wrapped story at 240, 300, 360 and
2000 px (R1-03).

Other items checked:
- Tasks: T090 to T100 and T093a are ticked, and their work is present. Outside the phase's files, the changes are the
  gate counts, the plant copies and `serve.ts`'s allowed list, each explained in notes.md.
- Constitution I: `ocelle-link-activate` bubbles, is composed and cancelable. There is no I/O; `location.assign` of an
  allowed target is the documented behaviour (plan Constitution Check I, SPEC-1-22).
- Constitution II: tokens only, and the link adds no new pair.
- Constitution III: one tab stop, the token ring per fragment, `LinkText`/`Highlight` in forced colours, no ID
  reference across a root. The host-name exception was extended to the link by the operator's decision and recorded in
  plan Complexity Tracking with a sunset.
- Constitution IV: the CSP gate, the `file:` copy with its `<meta>` policy and no violations.
- Constitution V: five stories in light and dark with baselines. I inspected the wrapped, focused-dark and hovered-light
  baselines.
- Constitution VII: the manifest declares `href` (reflected), `label`, the event, the slot and the part. The CHANGELOG
  names the surface.

## Earlier findings

None: this is round 1.
