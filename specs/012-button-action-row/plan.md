# Implementation Plan: Action Controls, `ocelle-button` and `ocelle-action-row`

**Branch**: `012-button-action-row` (work on `claude/007-actions-status`) | **Date**: 2026-11-13 | **Spec**:
[spec.md](spec.md)

**Input**: Feature specification from `specs/012-button-action-row/spec.md` (approved at the spec gate after a final
fix, 2026-11-13; one operator decision at planning added to its header and FR-004; squad rounds 1, 2 and 3's fixes
and the operator's fork decisions of 2026-11-13 applied to the spec and every design artifact, `reviews/plan/round-1/`,
`reviews/plan/round-2/`, `reviews/plan/round-3/`; feature 006 (#10) merged into this branch at 37dd501, operator
decision 2026-11-13; the analysis after `/speckit-tasks` and the operator's decision on its C1 of 2026-11-14 applied
to the spec and every design artifact, `reviews/analysis/fixes-1.md`; the operator decisions at phase 4 and phase 5
of 2026-11-15 applied the same way, decisions 29 and 30).

## Summary

The library's first interactive controls, on mission 005's element and slot conventions. `ocelle-button` renders one
native `<button type="button">` or, with an `href`, an `<a>`, in an open shadow root with `delegatesFocus`: three
variants (primary, secondary, quiet) with designed hover and active states, two sizes (default at least 44 × 44 px,
compact at least 24 × 24 px), `flush` for #12's breadcrumbs (content at the inline start), a `ground` attribute that
selects the border colour on accent-low, inset, hover-bg and state grounds and a chrome look for the top bar, a
`label`, `disabled`, and `busy` with an SVG spinner in the icon position that turns for 4.8 s and stops (and does not
move under reduced motion). Each activation that delivers a `click` also dispatches `ocelle-button-activate`
(bubbling, composed, cancelable, `detail` `{}`; decision 26). Each host is a grid container whose inner control fills it, so a stretched host has no
area outside the control, and a host listener stops any click that did not pass through the inner control, so a page
that restyles the element's `display` or size opens no bypass either.
`ocelle-action-row` renders the same kind of inner control as a row or a card, with icon, title, description, tags and
trailing slots, named by its title only: the inner control holds the icon and the title, the description, tags and
trailing content are `aria-hidden` siblings in the same layout (the description reaching assistive technology as the
accessible description), and the control's hit layer fills the host and takes every click (decision 30), and dispatches `ocelle-action-row-activate` with `{ rowId }`; it has flush
and default presentations, `current` with a bar drawn so it survives forced colours and stays apart from the focus
ring, `unavailable` and `busy`, and its focus ring is drawn inside the row. A shared internal module `control.ts` carries the control conventions later
controls follow: link versus button (by the URL parser), disabled versus unavailable (neither keeps an `href`), an
activation guard in every non-available state and a `click()` that goes through it, host ARIA and `title`
**moved** onto the inner control (operator decision at planning; removal is a no-op, so hosts bind the off value, with
per-stack recipes; the moved states reappear as custom states; each moved value is mirrored in an element-owned
`data-ocelle-moved-*` attribute so copies of the live DOM keep it, and a mirror a morphing swap removes is restored),
ID references resolved in the host's tree and related by ARIA element
reflection, and the name order of Accessible Name 1.2. The engine floor rises to Chromium 135 and WebKit 17.4. Seven
tokens are added (`color-hover-border`, `color-accent-hover`, `color-active-bg`, `color-chrome-active`, `motion-spin`,
`motion-turn`, `focus-offset-inset`) and six gain declared grounds. The element test harness gains keyboard, pointer,
hover, event, navigation-sink, AX-state, reduced-motion and axe support (`axe-core` 4.14.0 and 006's rule selection,
both on this branch since feature 006 merged). Stories, baselines and the story axe gate run on feature 006 as it is
on this branch (#10 is on `main`, 3828d2f, merged here at 37dd501): each phase that adds stories commits their
baselines and passes the `storybook-build`, `visual` and `axe` gates, and phase 1 lowers 006's plant `shardSize` to 1
before any story is added. Every decision is in
[research.md](research.md); the surface is in [contracts/elements-package.md](contracts/elements-package.md), the
checks in [contracts/checks.md](contracts/checks.md), the state in [data-model.md](data-model.md).

## Technical Context

**Language/Version**: TypeScript 6.0.3 (strict), Node 26.13.0 in CI (22 in this container).

**Primary Dependencies**: `lit` 3.3.3 (runtime, unchanged); no new dependency: `axe-core` 4.14.0 (exact, root
devDependency) came with feature 006 and is used by the element tests with 006's rule selection (R-11). Existing:
Vitest 5.0.5 with `@vitest/browser-playwright`, Playwright 1.64.1, Stryker 10.1.1, Stylelint 17.16.0,
`@custom-elements-manifest/analyzer` 0.11.0, Storybook 10.6.5.

**Storage**: N/A.

**Testing**: mission 005's shared scenario bodies run in-process (`elements`, mutated) and on strict-CSP fixture pages
with the built browser build (`elements-browser`), extended with the R-11 driver methods. Link scenarios have two
bodies: in-process against a navigation sink (so the mutated project covers link mode), and on the fixture with real
navigation and new tabs. Story tests in `storybook-integration`, written in each phase's red commit (operator decision
I3), with 006's pinned story counts; baselines and the `visual` and `axe` gates in the same phase (R-13); `red.sh`
keeps one red record per phase.

**Target Platform**: evergreen Chromium measured (153 here); engine floor Chromium 135+ (element reflection) and
WebKit 17.4+ (custom states; element reflection from 16.4), figures from MDN browser-compat-data 8.1.9 (R-04); WebKit
behaviour unmeasured (open limitation).

**Project Type**: library (web components) in a pnpm workspace.

**Performance Goals**: N/A beyond mission 005's (one adopted stylesheet per element class).

**Constraints**: strict CSP with no exception; token-only styles with no new lint allowance; no I/O; no `sk-` names;
one heavy job at a time in this container.

**Scale/Scope**: 2 elements, 2 internal modules, 1 changed internal module (`icon-slot.ts`), 7 new tokens, 6 tokens
with new grounds (76 new contrast rows, 4 of them exempt), about 51 stories (from 21 to about 72 in the repository; the first estimate, about 58, was low, operator decision at
phase 2),
1 gate constant (`shardSize`).

## Constitution Check

*Gate: passes before Phase 0 and after Phase 1 design, with no exception (Complexity Tracking).*

| Principle | How this plan meets it |
|---|---|
| I. Names, events, no I/O, small interface, manifest | Tags `ocelle-button`, `ocelle-action-row`; events `ocelle-action-row-activate` and `ocelle-button-activate`, each `bubbles` and `composed` (and `cancelable`); the button dispatches its activate event beside the native `click`, so each element's user intent goes out as an `ocelle-*` event (operator decision C1 (a), 2026-11-14, decision 26). No I/O: navigation is the native link's. Interfaces in contracts/elements-package.md; every property, attribute (the moved ARIA attributes, `title` and the element-owned `data-ocelle-moved-*` mirrors included, with descriptions, R-15), slot, part, custom state and the event's `detail` type in the manifest (FR-053). |
| II. Tokens only, brand rules | Element CSS from tokens only, no new lint allowance: the spinner's angle is the new `motion-turn` token and its factor a number inside `calc()` (R-07). `--ocelle-color-rule` never a boundary; control borders per #5 rule 1, selected by the `ground` attribute; controls on the top bar and rails use the dark chrome tokens through `ground="chrome"` (R-08 item 4a); the primary button keeps an `accent-strong` border because the ochre fill measures 2.37 to 2.98:1 on light grounds (R-08), so ochre fill is never the only mark; one radius (`radius-2` button, `radius-row` row); no monospace; `font: inherit` on inner controls. |
| III. Accessible by construction | One inner control that fills its host (on the row, the control's hit layer fills it and takes every click, its description, tags and trailing content being `aria-hidden` siblings, so the control's visible text is its title and axe's `label-content-name-mismatch` has nothing to report, decision 30), and a host guard that stops any click not passing through it, so neither a stretched host nor a page rule on the element's `display` or size leaves an area that bypasses the guard (R-01); host ARIA and `title` moved onto it, so the state appears once and axe has nothing to review on the host, and mirrored so copies of the live DOM keep it, with mirrors restored after a morphing swap (R-03); the row's description references only slotted elements with text, so an empty slotted element neither hides a moved `title` nor takes space (R-04); ID references never cross a shadow root (R-04); name order per Accessible Name 1.2, the row named by its title only (R-05), label-in-name stated (WCAG 2.5.3); keyboard: native button (Enter, Space) and link (Enter) behaviour, no composite pattern to roam; Tab and Shift+Tab tested; token focus ring on `:focus-visible`, drawn inside a row so scroll containers and adjacent rows cannot clip or cover it, with the current bar apart from it (R-12), and a documented clearance for a flush button in a clipping container; default size and every row meet `--ocelle-target-min`, compact meets 24 px (WCAG 2.5.8); the spinner runs 4.8 s and stops (WCAG 2.2.2) and does not move under reduced motion (R-07); forced colours: a system colour per element and state, the current bar and flush hover drawn so they survive (R-12); contrast rows for every pair, hover and active included, on the main, state and chrome grounds (R-08); axe in the element tests (006's rule selection, imported) and the `axe` gate on every story in the phase that adds it (R-13). |
| IV. Strict CSP, offline | Adopted stylesheets only; the spinner is inline SVG with presentation attributes; no `javascript:` URL rendered, decided by the URL parser (R-02); every scenario also runs on the strict-CSP fixture with zero violations; axe on the fixture is served same-origin. |
| V. Storybook, behaviour tests | A story per variant and state in light and dark (R-13), each with a committed baseline made in the pinned container in the phase that adds it (006 is on this branch); a focus story for each element, by programmatic focus or, failing that, `focus({ focusVisible: true })` (decision 27); interaction tests assert the `click` and both activate events with every flag, the target at every listener and one dispatch serial, from pointer, `click()` and every keyboard path (FR-051). |
| VI. Consumer-driven, own code | Needs from #7 and spec-kitty-design #493, #495, #496, #501, #504, #508, #509, #518, #525, #528, #532; consumers #12 (breadcrumb items, and its top-bar menu button with `aria-haspopup` and `ground="chrome"`, so it is not hand-rolled) and #14. Nothing copied from Spec Kitty. |
| VII. Semver | Additions only (MINOR): two elements, two entry points, an event, seven tokens, declared grounds, custom states, the mirror attributes; changelog entries in both packages (FR-055). Raising the engine floor (Chromium 135, WebKit 17.4) is documented in the README's engines section and the CHANGELOG; before 1.0.0 it needs no major bump. The `icon-slot.ts` scoping changes no output of 005's elements. |
| VIII. Test-first, non-vacuous | Each phase starts with one red commit holding its scenario bodies, harness tests, node/build tests and story test (I3), recorded by `red.sh`; each "does not" paired with a positive assertion and a measured plant; every spec edge case and plan decision has a scenario row (contracts/checks.md); clicks on `aria-disabled` controls sent with `force: true` (R-06); link mode covered in-process by the navigation sink, so its mutants are not NoCoverage; `generate.test.ts`'s "exactly two" becomes "exactly the motion durations" (except a `-delay` token marked `delay: true`, operator decision C1 as amended by phase 4 round 2, which also makes a non-`ms` motion duration or a misplaced marker a finding), recorded as a stricter replacement; element source mutated under the elements config, token, generator and manifest-script source, and in phase 4 `gates/bin/brand-rules.ts` (decision 29), under the default config, with 007's verdicts (R-14). |
| Licence and supply chain | No new dependency: `axe-core` 4.14.0 (MPL-2.0, dev only, not shipped) is already pinned by 006 and is reused by the element tests. |
| Workflow gates | No new gate; the touched gates are listed in contracts/checks.md. Phase 4 changes 002's `brand-rules` rule (f) to follow the generator (every motion duration at `0ms` under reduced motion), red first, mutated, with a new plant and the `gates/README.md` row (decision 29). Phase 1 lowers 006's plant `shardSize` to 1 before the repository reaches 006's split count of 25 stories (006's Complexity Tracking sunset), test-first; the new split count at size 1 goes to the operator at phase 1's review, with the facts that size 1 is the last lever (about 18 stories of headroom after this feature) and the Plants runner time it costs (about 11.2 runner-hours per CI run at 58 stories), and a request to open a triage record for a plant design whose shard time does not grow with the story count before the next element mission; phase 6 records a CI run with every Plants shard under 10 minutes (R-13). |

## Decisions the operator should see at the plan gate

1. **Host ARIA is moved** (operator decision at planning; R-03; round 1 fork PLAN-CORRECTNESS-1-001 (a)): the
   elements remove the listed ARIA attributes from the host and apply them to the inner control. Hosts clear with an
   empty value or the off value (`"false"`); `removeAttribute`, and a framework binding that becomes `undefined`, is a
   no-op; the README gives a recipe per stack (React, Lit, Svelte, htmx/Thymeleaf). Spec FR-004 and its header record
   it.
2. **Moved list and styling hooks** (round 1 forks PLAN-A11Y-SECURITY-1-004 (a), PLAN-FRESH-1-009 (a)): the button
   also moves `aria-haspopup` and `aria-pressed`; it exposes `:state(expanded)`, `:state(pressed)` and
   `:state(current)` for host styling (`:state(pressed)` in button mode only, decision 32).
3. **Engine floor Chromium 135 and WebKit 17.4** (R-04, round 1 fork PLAN-FRESH-1-008 (a)): element reflection
   (Chromium 135, WebKit 16.4) and custom states (Chromium 125, WebKit 17.4), from MDN browser-compat-data; no fallback.
4. **`delegatesFocus` and `click()`** (R-01, R-06): `element.focus()` focuses the inner control; `element.click()`
   clicks it, so a disabled or busy button's `click()` delivers nothing and a row's `click()` activates it.
5. **Tokens** (R-07, R-08, R-12; round 1 forks PLAN-CORRECTNESS-1-004 (a), PLAN-FRESH-1-007 (a),
   PLAN-A11Y-SECURITY-1-006 (a)): new `--ocelle-color-hover-border` (alias of `color-ink`, overridable per #525),
   `--ocelle-color-accent-hover` (proposed `#D9A23F`), `--ocelle-color-active-bg` (proposed light `#D3CCBF`, dark
   `#3A342B`), `--ocelle-color-chrome-active` (proposed `#3A342B` in both themes, decision 20),
   `--ocelle-motion-spin` (800 ms, 0 ms under reduced motion), `--ocelle-motion-turn` (`1turn`) and
   `--ocelle-focus-offset-inset` (-5 px from the two focus tokens); `color-ink`, `color-ink-soft`,
   `color-accent-strong`, `color-on-accent`, `color-chrome-ink` and `color-disabled-ink` gain declared grounds. If a
   new required pair is below threshold, the phase stops and asks (a value change to an existing token is out of
   scope). Amended at phase 4: `motion-spin` at `0ms` under reduced motion needs the change to 002's brand-rules
   rule (f) of decision 29.
6. **Hover and active** (R-08 item 3, round 2 fix PLAN-FRESH-2-004): every variant has a hover and an active look
   distinct from idle and from each other; the one exception is a flush control's hover where the fill equals the
   ground: the `hover-bg` ground in both themes, the `inset` ground in light, the `neutral-bg` ground in dark (dark
   `neutral-bg` and `hover-bg` are both `#2A261F`; operator decision at phase 2), and the `chrome-hover` ground with
   `ground="chrome"` in both themes (documented; hover carries no information). US1-14 and US4-8 list it by hand per
   theme.
7. **`ground` attribute** (R-08 item 4, round 1 fork PLAN-TESTABILITY-1-003 (a), round 2 fix PLAN-FRESH-2-007): both
   elements; selects `accent-strong` borders on `accent-low`, `inset`, `hover-bg` and the state grounds, and the
   chrome look with `chrome` (decision 20). On a container whose surface changes on hover or selection, the host sets
   the changed surface statically (`accent-strong` meets 3:1 on every main ground); README, US1-16 and a story.
8. **Primary button border** (R-08): always an `accent-strong` border (idle), because the fill alone is below 3:1 on
   light grounds.
9. **Disabled and unavailable links have no `href`** (R-02, round 1 fork PLAN-A11Y-SECURITY-1-005 (a)): an unavailable
   link (busy button, unavailable row) renders `<a role="link" tabindex="0" aria-disabled="true">`, focusable; the
   context menu, drag and the status bar offer no URL. The former README context-menu exception is dropped.
10. **Unparseable `href`** (R-02, round 1 fork PLAN-A11Y-SECURITY-1-008 (a)): button mode, no error; `data:` and
    `vbscript:` are left to the host.
11. **Spinner** (R-07, round 1 fork PLAN-A11Y-SECURITY-1-009 (a), round 2 fix PLAN-FRESH-2-008): six turns in 4.8 s,
    then the still arc (WCAG 2.2.2); the README states that an override of `--ocelle-motion-spin` keeps one turn at or
    below 833 ms.
12. **Row focus ring inside** (R-12): drawn with `--ocelle-focus-offset-inset`; the README padding note is dropped.
    The button's ring stays outside; a clipping container holding a flush button at its edge keeps `focus-offset` +
    `focus-width` of unclipped space (README flush note, contract hand-off to #12; round 2 fix PLAN-FRESH-2-009).
13. **Alt-click** on an available link row counts as a modifier click (no event; check-3 note SPEC-3-02), and so it
    does on an available link-mode button (no `ocelle-button-activate`, decision 26). Spec FR-033 and US5-2 (and
    FR-023 and US2-1) list Alt since analysis fixes 1.
14. **axe in the element tests** (R-11): `axe-core` 4.14.0 (pinned by 006) with 006's rule selection imported from
    `gates/lib/axe-rules.ts`; no test-side copy and no new dependency.
15. **Feature 006 is merged; its work is done per phase** (R-13; operator decision 2026-11-13, replacing round 1 fork
    PLAN-CORRECTNESS-1-010 (a), which it satisfies): #10 is on `main` (3828d2f) and merged here (37dd501). Each phase
    that adds stories commits their baselines (pinned container), passes the `storybook-build`, `visual` and `axe`
    gates on them, and updates 006's pinned story counts and the `fail-token-changed` and `fail-empty-index` plants.
    Phase 1 lowers `shardSize` from 3 to 1 before any story is added: 006's approved split count is 25 stories, main
    has 21, and at about 58 only size 1 keeps a `visual` shard under 10 minutes (about 550 s by 006's model; 712 s at
    size 2). The 48 `visual` and 25 `axe` plants then take 73 shards instead of 25, each with about 387 s of fixed cost.
    The split count at size 1 (76 stories by the model) goes to the operator at phase 1's review with 006's Complexity
    Tracking row. Size 1 is the last lever (round 3 fork PLAN-FRESH-3-003 (a)): `plantShards` cannot go lower and a
    size-1 shard still grows with every story, so after this feature (about 58 stories) about 18 stories of headroom
    remain, fewer than this feature adds, and the Plants job costs about 11.2 runner-hours per CI run (73 shards of
    about 550 s, plus 3 non-visual shards; about 4 runner-hours today). Phase 1 writes these facts into 006's row and
    `gates/README.md`, and phase 1's review asks the operator to open a triage record for a plant design whose shard
    time does not grow with the repository's story count, before the next element mission starts.
    **Corrected at phase 2** (operator decision 2026-11-14, "proceed and note"): phases 2 to 6 bring the repository to
    about **72 stories**, not about 58, and the story list is kept. By the same model a `visual` shard then takes about
    588 s (about 600 s at the record's slowest 1.457 s per capture), so the headroom to the split count of 76 is about
    **4 stories** (none at the slowest rate): the plant headroom is nearly gone. The Plants job costs about
    11.9 runner-hours per CI run (73 shards of about 588 s, plus 3 non-visual shards). The operator opens the triage
    record for a plant design whose shard time does not grow with the story count when this feature lands; the next
    element mission cannot add stories under the current design. Phase 6 corrects the figures in `gates/README.md` and
    006's row (T068). Checked against the merged code: nothing this design relies on differs from the branch design
    (R-13 lists what changed at 006's landing and why none of it matters here).
16. **Unavailable current row** (check-3 note SPEC-3-07; reading (i) confirmed by the operator, decision 31): the row
    keeps its current surface (`accent-low`, or `chrome-hover` with `ground="chrome"`; `Canvas` under forced colours),
    it does not drop to the idle surface; the unavailable look wins for the rest: its title, description, tags and
    trailing content take the disabled ink (`GrayText` under forced colours) and it shows no hover; the current bar
    stays drawn, in disabled ink (`GrayText` under forced colours), so the position in the list is still visible;
    `aria-current` stays.
17. **Manifest** (R-15, round 1 fork PLAN-CORRECTNESS-1-006 (a)): the moved attributes are declared with descriptions;
    the normaliser drops a standard attribute only when the element does not declare it (005's output unchanged).
18. **The inner control fills the host** (R-01, R-10, round 2 fork PLAN-FRESH-2-001 (a); for the row, restated by
    decision 30): host `display: inline-grid` (button) and `display: grid; min-inline-size: min-content` (row). On the
    button the inner control is the single stretched grid item. On the row **the control's hit layer fills the host**:
    the single stretched grid item is the shadow layout wrapper, and the inner control's hit layer (`inset: 0`
    against that wrapper) covers it. A click anywhere on a stretched host reaches the inner control (on the row, over
    the description, tags and trailing content too), so the guard and the row's activation see it; cards in a grid
    draw equal heights; a button stretched by a flex row grows tall. Plants restore `inline-block`/`block` (and, on
    the row, the layer positioned against the inner control). A page rule on the element can override the host's `display`; decision 23's host guard covers that
    case, so no guarantee rests on the grid alone.
19. **Moved values are mirrored** (R-03, round 2 fork PLAN-FRESH-2-002 (a)): one element-owned host attribute
    `data-ocelle-moved-<attribute>` per moved value, read back at upgrade, declared in the manifest (MINOR), so
    `cloneNode`, `innerHTML` round trips and htmx's history restore keep names and states.
20. **`ground="chrome"`** (R-08 item 4a, round 2 fork PLAN-FRESH-2-003 (a)): both elements; `chrome-ink` text,
    `chrome-muted` idle border (no fill, so `secondary` looks like `quiet`), `chrome-hover` hover and current surface,
    a new `--ocelle-color-chrome-active` pressed surface, `chrome-ink` hover border; the primary unchanged. Chrome
    contrast rows join `pairs.json` in phase 2. #12's top-bar menu button uses it.
21. **Current bar apart from the focus ring** (R-12, R-10, round 2 fork PLAN-FRESH-2-005 (b)): the bar is drawn 7 to
    10 px inside the row's border edge, one `focus-offset` inline-end of the ring's band (2 to 5 px), so a gap of the
    row's surface keeps the two `accent-strong` marks apart; the flush row's inline padding becomes `--ocelle-space-3`
    (from `space-2`) to hold ring, gap and bar before the content. Tests read the ring, the gap and the bar
    separately on a focused current row and the ring's four sides on a non-current row.
22. **Host `title` is moved** (R-03, round 2 fork PLAN-FRESH-2-006 (a)): on both elements, onto the inner control
    (native tooltip; description, or name when nothing else names it), mirrored and declared like the ARIA
    attributes.
23. **Host guard** (R-01, R-06, round 3 fork PLAN-FRESH-3-001 (a)): a page rule on the element outranks `:host`, so
    `display: block`, `display: flex; width: 100%` or a fixed height leaves host area outside the inner control (a
    click there reached `document` from a disabled button, measured). `control.ts` registers `click` and `auxclick`
    listeners on the host in the element's constructor that stop any event whose composed path misses the inner
    control (every state) and any event while not available. A click outside the inner control never activates the
    element; hosts may restyle `display` and size (README). Limits stated: capture-phase listeners and listeners
    added to the element before upgrade run first. The grid fill of decision 18 stays for looks. Scenarios US1-17,
    US3-11, US5-6 (restyled) and US5-12; plant: no host listener.
24. **Mirrors restored** (R-03, round 3 fork PLAN-FRESH-3-002 (a)): the element observes its `data-ocelle-moved-*`
    attributes and writes back a mirror removed or changed while it holds the value (its own writes ignored), so a
    morphing swap (htmx's idiomorph `morph`, Turbo 8 morphs), which deletes attributes the server markup lacks, keeps
    them and the next history snapshot keeps names and states. US2-13's morph case applies the attribute sync in the
    test itself; plant: mirror not restored.
25. **Empty description and tags elements** (R-04, round 3 fix PLAN-FRESH-3-004): a `description` or `tags` slot is
    empty when no assigned element has non-whitespace text; only elements with text are referenced as the description
    (`null` when none, so a moved `title` describes the row), and an empty slot's wrapper is hidden. Recomputed on
    `slotchange` and by a `MutationObserver` on the host's light children (text written into a slotted span fires no
    `slotchange`). US4-6 and US4-16 gain empty-span cases. Since decision 30 the wrappers are `aria-hidden` siblings of
    the inner control, so the referenced elements reach assistive technology only through `ariaDescribedByElements`
    (a directly referenced hidden element still gives its text, measured in the phase 5 spike), and a hidden empty
    wrapper still takes no space and adds no gap in the shared layout.
26. **The button's activate event** (operator decision C1 (a), 2026-11-14; analysis fixes 1): constitution I asks for
    user intents as `ocelle-*` CustomEvents, so besides the native `click` the button dispatches
    `new CustomEvent("ocelle-button-activate", { bubbles: true, composed: true, cancelable: true, detail: {} })` from
    the host on each `click` that passes the inner control while available, from the element's listener on the inner
    control, after the guard (R-06), so it precedes the `click` at every bubble-phase listener on the host and its
    ancestors. `preventDefault()` on it → `preventDefault()` on the originating `click` (link mode: no navigation;
    button mode: the `click` is still delivered, `defaultPrevented` true). In link mode a click with Ctrl, Meta, Shift
    or Alt held dispatches no activate event (the row's rule, decision 13); `auxclick` never does. The cancelable flag
    and the cancel path match `ocelle-action-row-activate`; `detail` is `{}` because the button carries no value and
    the target identifies it (an object, as every `ocelle-*` event's `detail` is). Spec FR-009, FR-023, FR-051,
    US1-2, US1-3, US1-15, US1-17, US1-18, US2-1, US3-1, SC-005; manifest event with its `detail` type (FR-053); plants:
    no activate event, activate event on a modifier click, cancel not forwarded to the `click`. No Complexity Tracking
    row is needed.
27. **Focus stories** (analysis fixes 1, G2): 006 has no focus parameter, so a focus story's wrapper focuses the
    element programmatically. Measured here (Chromium 153, a scratch page with no user input): a plain `focus()` on a
    `delegatesFocus` host gives the inner control `:focus-visible`, and `host.focus({ focusVisible: true })` is
    forwarded to the inner control and forces it (`focusVisible: false` suppresses it). Phase 2's spike (T014)
    measures both in 006's pinned capture. The story uses plain `focus()` when it shows the ring in the capture, and
    `focus({ focusVisible: true })` otherwise; both are story code, inside 006's mechanisms, so the button focus story
    and the row focus stories (a non-current row in phase 5, a current row in phase 6) are written either way. Only
    when neither shows the ring in the pinned capture does the phase stop and ask (an exception would then need a
    Complexity Tracking row approved by the operator).
28. **Consumer compositions** (analysis fixes 1, U1; SC-006): the README's `ocelle-button` section gives the markup of
    #12's breadcrumb item, #12's top-bar menu button and #14's copy control; phase 3's `link.ts` renders exactly that
    markup on a page with no style that targets the elements (the menu button's container takes the chrome ground) and asserts each one's role, name, states, target size and look (flush
    alignment; chrome colours), and `readme.test.ts` asserts that the README's markup is the markup the scenario
    renders (plant: a README snippet that differs). No story is added for them, so the shard headroom of decision 15
    is not spent on them.
29. **002's brand-rules rule (f) follows the generator** (operator decision at phase 4, option (a), 2026-11-15; spec
    "Operator decisions at phase 4"; R-07; `reviews/phase-4/notes.md`): feature 002's `brand-rules` gate, rule (f)
    (`gates/bin/brand-rules.ts`, the `reducedMotion` list and `reducedMotionBlock`; 002 FR-007, FR-019 (f)), accepts
    exactly `--ocelle-motion-fast` and `--ocelle-motion-base` at `0ms` in the reduced-motion block, so the generator
    of decision 5 fails it (measured on 959b366: 1 finding, `--ocelle-motion-spin: 0ms`). **This feature changes
    002's rule (f)**: the reduced-motion block must set exactly every token of group `motion` whose source value is a
    duration (`ms`) to `0ms`, except those marked as delays, the set read from the token source (`inputs.tokens`) as
    the generator reads it, not from a list of names; today `motion-fast`, `motion-base` and `motion-spin`, not
    `motion-turn`, not `easing-standard`, not `tooltip-delay`. A later duration token needs no gate edit.
    *Amended at landing* (operator decision C1, 2026-11-17, landing of PR #50; d4a56ea red, 558c560 fix; verbatim answer "(b) Delay
    opt-out"): mission 008 adds `tooltip-delay` (group `motion`, 500ms), which must keep its value under reduced
    motion. A token record may carry `delay?: true` (a delay, not motion); `motionDurations` in
    `packages/tokens/src/generate.ts` and in `gates/bin/brand-rules.ts` skip such a record, so the generator leaves it
    out of the reduced-motion block and rule (f) neither requires it there nor accepts it there. The rule is now
    "every motion duration except those marked as delays". The finding messages name the rule ("only the motion
    durations, each 0ms, belong there") instead of two names. Red first in `gates/test/brand-rules.test.ts`, in phase
    4's red commit (the existing (f) cases with the new message, a source with `motion-spin` whose block lacks it, and
    a non-duration motion token such as `motion-turn` in the block rejected); `gates/bin/brand-rules.ts` is mutated
    under the default configuration in phase 4. The plant `f-motion-not-zero` stays and still bites; a new fail plant
    `f-motion-spin-missing` (a wrapped generator that drops `--ocelle-motion-spin: 0ms;`) covers a missing
    `motion-spin`. The `gates/README.md` `brand-rules` row records the change to 002's rule (f) and lists the new
    plant. No principle is relaxed (constitution II keeps its reduced-motion rule, now for every duration that is motion; a delay-marked token is not motion, operator decision C1), so no
    Complexity Tracking row is needed.
    *Amended at landing, round 2* (operator, 2026-11-17, `reviews/phase-4/round-2.md`, on landing review R1-04; O2-01
    verbatim "Names ending in -delay (Recommended)": "The generator and rule (f) accept `delay: true` only on a motion
    token whose name ends in `-delay` (tooltip-delay today), and fail with a finding otherwise. Future delays need no
    list edit."; O2-02 verbatim "Fail on non-ms motion (Recommended)": "Rule (f) (and a generator check) reports a
    finding for any motion-group duration that isn't a literal `<number>ms`, unless it is a valid delay. That forces
    one unit and keeps every motion duration zeroable."). The rule is now: **every motion-group duration is a literal
    `<number>ms` value and is `0ms` under reduced motion, except a token whose name ends in `-delay` and that carries
    `delay: true`; anything else in the motion group is a finding.** In detail:
    - *Valid delay*: a record of group `motion` whose name ends in `-delay` and that carries `delay: true`
      (`tooltip-delay` today). It is outside the reduced-motion block and outside the `ms` check ("unless it is a
      valid delay"). A `-delay` name without the marker is an ordinary motion duration.
    - *Misplaced marker* (O2-01): `delay: true` on any other record (a name not ending in `-delay`, or a record outside
      group `motion`) is one `reduced-motion` finding of rule (f) at the record's line, and `validateSource` in
      `packages/tokens/src/generate.ts` refuses the source (its existing error path, `invalid token source: ...`).
    - *Non-durations*: a motion-group value that is a literal angle (a number with `deg`, `grad`, `rad` or `turn`, as
      `motion-turn`) or an easing function (`cubic-bezier(...)`, `steps(...)`, `linear(...)` or one of the keywords
      `linear`, `ease`, `ease-in`, `ease-out`, `ease-in-out`, `step-start`, `step-end`, as `easing-standard`) is not a
      duration and stays out of scope. The rule tells them apart by this closed list of non-duration forms, not by
      a duration pattern, so it fails closed: every other motion-group value counts as a duration.
    - *Non-`ms` duration* (O2-02): a motion-group duration that is not a literal `<number>ms` (the existing pattern
      `/^\d+(?:\.\d+)?ms$/`), for example `1s`, `var(--ocelle-motion-base)` or `calc(2 * 100ms)`, and is not a valid
      delay, is one `reduced-motion` finding of rule (f) at the record's line, and `validateSource` refuses the source
      the same way. Rule (f) no longer skips such a record silently.
    Since the gate validates the source with the root's `validateSource` before the rules run (002 contracts/gates.md),
    the repository's own generator makes such a source exit 2; rule (f)'s findings are what a generator without the
    check (or a wrapped one) meets, and its fail plants `f-delay-marker-misplaced` and `f-motion-not-ms` use a wrapped
    generator whose `validateSource` lets the record through (tasks.md T049b to T049f). Both readers (`gates/bin/brand-rules.ts`
    and `generate.ts`) keep their own copy of the classification, each unit-tested and mutated.
30. **Row content beside the inner control, and its hit layer** (operator decisions at phase 5, 2026-11-15,
    human:jeroennouwsdev, two multiple-choice answers: (b) and (c); spec "Operator decisions at phase 5"; R-01, R-04,
    R-05, R-10, R-12; the phase 5 implementer's stop-and-ask, recorded in `reviews/phase-5/notes.md`).
    *Finding*: axe-core 4.14.0 enables `label-content-name-mismatch`, tagged `cat.semantics`, `wcag21a` and `wcag253`
    and not `experimental`, so 006's rule selection runs it; R-05 had said it was experimental and never ran. A row
    whose inner control held the description and tags, named only by its title (FR-034), got one serious violation
    (13 draft tests, every row with description or tag text), against FR-052, and so would every consumer page.
    *Decision 1, option (b)*: the description, tags and trailing wrappers leave the inner control and become
    `aria-hidden="true"` shadow siblings of it; the description and tags reach assistive technology only through the
    inner control's `ariaDescribedByElements` (R-04); the inner control holds the icon and the title, so its visible
    text is its title, which is also its name (FR-034 kept), and it is named from content with no internal title
    reference (R-05; the `[part=title]` wrapper keeps its part). axe stays at 0 serious or critical findings, on
    consumers' pages too. Rejected: (a) an FR-052 exception with `a11y-exceptions.json` entries; (c) naming the row
    from all its content (reverses FR-034 and SPEC-2-04).
    *Decision 2, option (c)* (the fork the planner found: FR-032's content-sized wrap cannot stay pure CSS if the
    inner control's own box must fill the host): the inner control (icon and title) and the description, tags and
    trailing wrappers stay in one flex-wrap layout, a shadow layout wrapper that is the host's single stretched grid
    item (R-10), so FR-032 and US4-18 stay pure CSS and unchanged. An absolutely positioned shadow span inside the
    inner control, the hit layer, covers the whole host (`inset: 0` against the layout wrapper, its containing block,
    never the host, so a page rule on the host's `position` cannot spread it over the page). It takes every pointer
    click on the host, so the composed path passes through the inner control: the siblings have `pointer-events:
    none`, and the layer is painted beneath them and the title (positive stacking: the layout wrapper is `position:
    relative; z-index: 0`, a stacking context with no `isolation: isolate`, the layer is at `z-index: 0` in it, and
    the icon wrapper, the title and the sibling wrappers are at `position: relative; z-index: 1`; a layer painted
    above them would hide their text under the surface it carries, and a layer at `z-index: -1` draws axe's
    `color-contrast` incomplete, see the note of 2026-11-16), so for hit testing it sits above them. It carries the
    row's surface (`background-color: Canvas` under forced colours), border, inside focus ring and current bar (R-12).
    FR-001's fill sentence, R-01's fill measurement, decision 18 and US4-15 now say, for the row, "the control's hit
    layer fills the host";
    the restyled host's outside points are outside the layer. The card layout follows the same model (R-10).
    *Within the decision*: the siblings inherit no colour from the inner control, so the description, tags and
    trailing wrappers set their own ink, keyed on the host's reflected state and the mode (marked on the layout
    wrapper): `color-ink-soft` description and tags, `chrome-muted` with `ground="chrome"` (US4-17), disabled ink
    when unavailable (US5-7) and R-12's forced-colours text per mode and state (R-10 § Sibling ink). The ring's inline
    bands and the current bar stay inside the row's inline padding and overlap no sibling and no title box (R-10,
    R-12). The README says interactive content in the `description`, `tags` or `trailing` slot is unsupported and would
    also draw axe's `aria-hidden-focus`, and that slotted content setting its own `pointer-events` takes clicks the
    row then ignores (host guard). The phase 5 spike (T049a, new, before the red commit) measures the layer's box,
    the clicks on the siblings, the accessible description with `aria-hidden` wrappers, the ring's block bands on a
    flush row, and axe `color-contrast` for the title and sibling text over the layer (no violation, no incomplete
    result); the phase 6 spike (T060) measures the same `color-contrast` on a current row (US5-4 forbids an incomplete
    result there; FR-052 covers every page). A spike result against this is a stop-and-ask. Plants: the description
    wrapper back inside the inner control (name and axe); the layer positioned against the inner control (US4-15's
    box); siblings without `pointer-events: none` (US4-15's sibling clicks); sibling colours removed (US4-17, US5-7,
    forced colours). The public surface is unchanged: the layout wrapper and the hit layer are no parts; the part
    `control` is the inner control (icon and title), so a host's `::part(control)` styles no longer reach the row's
    surface or border (README). No principle is relaxed and no exception is recorded, so no Complexity Tracking row
    is needed.
    *Note, 2026-11-16, human:jeroennouwsdev* (operator decision at phase 5, multiple choice: accept the
    implementation and align the wording): the phase 5 spike (T049a; `reviews/phase-5/spike.md` check (5) and
    `reviews/phase-5/notes.md`) measured this decision's first wording, the hit layer at `z-index: -1` in a layout
    wrapper with `isolation: isolate` (and again with `z-index: 0` on the wrapper). axe-core 4.14.0 gave every title,
    description and tag text a serious `color-contrast` incomplete result (`bgOverlap`): its element stack puts the
    layer above the text, though Chromium paints it beneath, against FR-052 and T049a. The positive stacking stated
    above keeps the same painting and hit-testing order (the layer paints beneath the icon, the title and every
    sibling, and takes every click outside the icon and the title), and axe gives 0 results of any impact on every
    spike page; checks (1) to (4) gave the same figures with it. Under forced colours the layer sets
    `background-color: Canvas`, as `a.control` does in `controlStyles`: without it axe read the dark palette's text
    over an unknown background and reported `color-contrast`. R-01, R-10, R-12, the data model, T049a, T056, T060 and
    T064 say the same. No principle is relaxed and no exception is recorded.
    *Amended by decision 31* (phase 6, 2026-11-16): while the row is unavailable, the description, tags and trailing
    wrappers also carry `aria-disabled="true"`, so axe treats their disabled ink as part of the inactive control.
31. **Unavailable sibling wrappers and the unavailable current row** (operator decisions at phase 6, 2026-11-16,
    human:jeroennouwsdev, two multiple-choice answers: (a) and reading (i); spec "Operator decisions at phase 6";
    decisions 16 and 30; R-10, R-12; the phase 6 implementer's stop-and-ask, recorded in `reviews/phase-6/notes.md`).
    *Finding* (spike T060, `reviews/phase-6/spike.md` check (4)): axe-core 4.14.0's `color-contrast` skips text with
    `aria-disabled="true"` on it or on an ancestor in the flattened tree. The title is inside the inner control, which
    is `aria-disabled` while the row is unavailable, so axe skips it; since decision 30 the description, tags and
    trailing wrappers are siblings of that control, so axe checked their `--ocelle-color-disabled-ink` text as active
    text. That ink is below 4.5:1 on several row surfaces (light: `accent-low` 4.27, `inset` and `hover-bg` 4.07,
    `rail` 4.38, `chrome` 3.37, `chrome-hover` 3.04; dark: `accent-low` 3.75, `inset` 3.84, `hover-bg` 4.12,
    `chrome-hover` 4.39). Of 72 unavailable pages (every slot, with and without `current`, default and flush, nine
    grounds, light and dark) 52 drew one serious `color-contrast` violation on the slotted description and tags: every
    unavailable current row, every unavailable flush row off canvas and sheet, and every unavailable chrome row;
    against T060, FR-052 and T063. Plain, hovered and focused current rows gave 0 results of any impact (US5-4 holds).
    *Decision 1, option (a)*: while `unavailable` is set, the description, tags and trailing wrappers carry
    `aria-disabled="true"` (removed when it is cleared). They are already `aria-hidden` and have no accessibility
    node, so axe treats their text as part of the inactive control, as WCAG 1.4.3 and FR-042 already do. Measured by
    the implementer as a trial edit: all 72 pages give 0 axe results of any impact, with no `aria-allowed-attr`
    result; the accessibility tree, name, description, disabled state, focusability and `aria-current` of a current
    row are unchanged in button and link mode, available and unavailable. The sibling ink (R-10 § Sibling ink) and
    forced colours (R-12) are unchanged. Rejected: (b) the siblings keep their available ink while unavailable
    (changes US5-7); (c) an FR-052 exception with `a11y-exceptions.json` entries (consumers' pages would show the
    finding).
    *Decision 2, reading (i) of decision 16*: a row that is both unavailable and current keeps its current surface
    (`accent-low`, or `chrome-hover` with `ground="chrome"`), with disabled ink, a disabled-ink bar and no hover;
    reading (ii), the idle surface, is rejected. Decision 16 now states it.
    Tests: T061 gains axe on unavailable rows with description and tags (with and without `current`, default and
    flush, on canvas, `accent-low` and `ground="chrome"`, light and dark: 0 results of any impact; plant: wrappers
    without `aria-disabled`) and the unavailable current row's surface (kept, unchanged on hover); T063's unavailable
    and unavailable current stories give 0 serious or critical axe results; T064 implements both. No principle is
    relaxed and no exception is recorded, so no Complexity Tracking row is needed.
32. **`:state(pressed)` is button mode only** (operator decision at phase 6, 2026-11-16, human:jeroennouwsdev,
    multiple choice: "fix in phase 6"; a finding routed from mission 018 by the orchestrator; spec FR-004, FR-009,
    US2-12; R-03). *Finding*: FR-009 allows `aria-pressed` in button mode only and the inner `<a>` never carries it,
    but `ocelle-button` set the `pressed` custom state from the moved value in either mode, and phase 3's US2-12 test
    (T031) asserted that, so a host `:state(pressed)` rule could show a pressed look on a link that reports no
    pressed state. *Decision*: a link has no pressed state; in link mode the element never sets `pressed`, whatever
    the moved `aria-pressed` (the value stays stored and mirrored, so a switch back to button mode applies it and sets
    the state again). Mission 018's pill follows the same rule. US2-12's link-mode expectation is replaced by a
    stricter one in phase 6's red commit (constitution VIII: "a test that turns out wrong is replaced by a stricter
    one with the reason recorded"; the reason is this decision): a link-mode button with `aria-pressed="true"` does
    not match `:state(pressed)` in each step, and a button-mode one with `aria-pressed="true"` stops matching when an
    `href` switches it to link mode and matches again when the `href` is cleared. The README's custom-states sentence,
    its `readme.test.ts` line and the `@cssstate pressed` description say "in button mode". Plant: `pressed` state in
    any mode. Tasks T061a and T064a; T066 runs the plant. No principle is relaxed and no exception is recorded, so no
    Complexity Tracking row is needed.
33. **The slot convention's label sits on the text baseline** (operator decision at landing, 2026-11-18,
    human:jeroennouwsdev, multiple choice: "Fold the fix now (Recommended)"; operator round `reviews/phase-2/round-5.md`,
    finding O3-01; R-10). *Finding*: 005's convention (`iconSlotStyles` in `packages/elements/src/icon-slot.ts`, as
    012 R-10 amended it) makes `.icon-row` an `inline-flex` row with `align-items: flex-start`, so no item takes part
    in baseline alignment and the row's baseline, and with it the host's, is the first item's: the one-line-tall
    `.icon-slot` wrapper, empty or holding the icon, not the label. A one-line `ocelle-button` in a line of text sets
    its label 4.6 to 6.2 px above the text's baseline (round 5's measurement; a native `<button>` sits on it).
    *Decision* (as amended by round 6, below): the label wrapper becomes part of the convention, a
    `<span class="label">` holding the default slot between the icon and trailing wrappers (the README's example
    already renders it), and so does the `bare` modifier: a control with no label (an icon-only control) puts the
    class `bare` on its row. `iconSlotStyles` gains `.icon-row:not(.bare) > .label { align-self: baseline; }`, for
    labelled rows only. In a labelled row the label is then the row's only baseline-aligned item, so the row's
    baseline is the label's first line, and the label stays at the row's start: every position inside the control
    (the wrappers, the label, the row's padding) and the control's size are unchanged (round 5's probe: 0 px in every
    case, positions and sizes identical). `.icon-row { align-items: baseline }` also gives 0 px but moves the items
    inside the row, so it is not used. A `bare` row keeps its place: no item takes part in baseline alignment, its
    baseline stays the icon wrapper's, and its icon sits where a native `<button>` holding an svg puts it in a line of
    text. What changes in 005's convention: a control on it renders its label in `.label` and marks a row with no
    label `bare`; a labelled control's host baseline is its label's first line, an icon-only control's is unchanged;
    nothing else. `ocelle-button` already sets `bare` on a row with no label (review round 1, R1-01), and its own
    `bare` rules (the slotted icon's and the spinner's gap) stay in `ocelle-button.ts`.
    *Amendment, round 6* (operator decision, 2026-11-18, human:jeroennouwsdev, multiple choice: "Rule for labelled
    rows (Recommended)"; operator round `reviews/phase-2/round-6.md`, finding O6-01): the first form of this decision,
    `.icon-row > .label { align-self: baseline; }` for every row, moved icon-only controls off the line. Their
    `.label` is empty and zero-height, so its synthesized baseline is its top and the control hung 10.5 to 11.6 px
    below the line, where it sat 10 px above it like a native `<button>` with an svg (round 6's measurement: default
    +11.59 px, compact +10.5 px, busy +11.59 px against -10 px before and for the native button). The operator's
    answer, verbatim: "Apply the rule only to labelled rows: `.icon-row:not(.bare) > .label { align-self: baseline }`,
    and make the `bare` modifier (no label) part of the convention. Icon-only buttons stay exactly where they were,
    matching a native button. The planner amends decision 33 and adds an icon-only test case to the red (a second red
    step under fix-4), then green." The second red step is recorded under the label fix-5, because `red.sh` keeps one
    record per label and a second `fix-4` would replace the first; it is still part of fix round 4. `ocelle-action-row` does not render
    `.icon-row` (its inner control has its own flex rules, its label wrapper is `.title`, and the host is
    block-level), so the rule does not reach it; phase 2 fix-4 checks that the row's layout, scenarios and baselines
    do not change, and a change there is a stop-and-ask. 005's own documents are not edited: the convention's text is
    the `icon-slot.ts` header comment and the elements README's § Slot convention, which state it. Test-first: a
    one-line button in a line of text has its label on the text's baseline within 0.5 px (red against the current
    rule), paired in the same test with the icon wrapper's and the label's block-start being equal within 0.5 px
    (plant: `.icon-row { align-items: baseline }` in place of the label rule); and, from round 6, an icon-only button
    (default, `compact`, busy) in a line of text has its icon's centre within 0.5 px of where a native `<button>`
    holding an svg puts it (passes against the code before the rule; plant: the unscoped rule
    `.icon-row > .label { align-self: baseline; }`), with a README line for the `bare` modifier. Visual baselines that
    move are regenerated in the pinned container and listed; icon-only stories do not move. Tasks T029a to T029e and
    T029f to T029h (phase 2 fix round 4: red steps `fix-4` and `fix-5`, one green). No principle is relaxed and
    no exception is recorded, so no Complexity Tracking row is needed.

## Project Structure

### Documentation (this feature)

```text
specs/012-button-action-row/
├── spec.md, plan.md, research.md, data-model.md, quickstart.md
├── contracts/elements-package.md, contracts/checks.md
├── checklists/requirements.md
├── triage.ref
└── reviews/ (spec checks; plan squad rounds; phase reviews)
```

### Source Code (repository root)

```text
packages/elements/
├── package.json              # exports ./ocelle-button.js, ./ocelle-action-row.js
├── custom-elements.json      # regenerated
├── README.md, CHANGELOG.md   # control conventions, two elements, engines (Chromium 135, WebKit 17.4), notes
├── scripts/manifest.ts       # normaliser keeps declared standard attributes (R-15)
├── src/
│   ├── control.ts            # internal: mode, attribute move, custom states, references, name, guard, click, controlStyles
│   ├── spinner.ts            # internal: spinner template and styles
│   ├── icon-slot.ts          # size rules scoped to the icon and trailing slots (R-10)
│   ├── ocelle-button.ts
│   ├── ocelle-action-row.ts
│   └── index.ts              # re-exports both
└── test/
    ├── scenarios/{driver,button,link,busy,action-row,row-states}.ts
    ├── harness/*.test.ts     # driver method tests (phase 1; axe with gates/lib/axe-rules.ts)
    ├── {control,slot,button,action-row,entry-button,entry-action-row}.test.ts
    ├── commands.ts, in-process.ts (navigation sink)
    ├── browser/{driver,serve}.ts, browser/{button,action-row}.test.ts, browser/fixtures/{button,action-row,link-target}.html
    ├── node/{manifest,readme}.test.ts
    └── build/{build,pack}.test.ts
packages/tokens/src/{source,generate}.ts, test/{expected,generate.test}.ts, test/browser/values.test.ts,
  contrast/pairs.json, README.md, CHANGELOG.md
gates/test/{contrast-pairs,contrast}.test.ts, gates/test/integration/{plants-robustness,token-gates}.test.ts (counts)
gates/lib/plant-runner.ts (shardSize 1, phase 1), gates/test/plant-runner.test.ts, gates/README.md
gates/test/integration/{storybook-build,visual,axe,plant-repo}.test.ts (story counts, per phase)
gates/plants/visual/fail-token-changed/plant.json, gates/plants/storybook-build/fail-empty-index/tree/ (per phase)
vitest.config.ts (commands)
storybook/stories/{button,action-row}.stories.ts, storybook/test/integration/elements-stories.test.ts,
  storybook/baselines/elements-ocelle-{button,action-row}--*.{light,dark}.png (per phase)
```

**Structure Decision**: as mission 005: everything for the elements in `packages/elements`, token changes in
`packages/tokens`, gate count and shard updates in `gates/`, stories and baselines in `storybook/`.

## Phases (user stories) for `/speckit-tasks`

Every phase: one red commit (tests only: scenario bodies, harness, node/build tests, the phase's story test entries,
gate-count tests and 006's pinned story counts, the phase's rows of contracts/checks.md § Edge cases and plan
decisions) recorded by `red.sh`, then green; plants measured and recorded in `reviews/phase-N/plants.md`;
`gate:manifest`, `style-lint`, `csp`, `prefix`, `pins`, `test-lint`, `contrast` where tokens changed; where the phase
adds stories, their baselines (`visual:update` in the pinned container), `gate:storybook-build`, `gate:visual` and
`gate:axe` on the repository and the `fail-token-changed` and `fail-empty-index` plants extended (R-13); then mutation,
one at a time.

1. **Setup: test harness and shard size** (no element behaviour): the R-11 driver methods and commands in both
   harnesses (hover, pointer down and up, `computed` with `inner`, Tab and Shift+Tab orders, the recorder with `at`,
   `target`, `isTrusted` and serials, the in-process navigation sink, `axe` with 006's rule selection imported from
   `gates/lib/axe-rules.ts`) with their unit tests on plain pages (red first), fixture pages and serving (`axe.min.js`
   from the `axe-core` 006 pinned). `shardSize` lowered from 3 to 1 in `gates/lib/plant-runner.ts`, red first in the
   `plantShards` test of the repository's size, with `gates/README.md`'s approved sizes and 006's Complexity Tracking
   row (size 1; the split count at size 1, 76 stories by 006's model, for the operator's approval at this phase's
   review; size 1 the last lever, about 18 stories of headroom after this feature and about 11.2 Plants runner-hours
   per CI run at 58 stories, also in `gates/README.md`; corrected at phase 2 to about 72 stories, about 4 stories of
   headroom and about 11.9 runner-hours, decision 15). This phase's review asks the operator to open a triage record
   for a plant design whose shard time does not grow with the story count, before the next element mission
   (R-13, decision 15).
2. **US1 `ocelle-button`** (P1, MVP): `icon-slot.ts` scoping (with its `slot.test.ts` case) first; `control.ts`
   (button mode only, `delegatesFocus`, `click()` forwarding, the host guard of decision 23, `controlStyles` with the
   focus ring, forced colours per R-12's table and `.icon-slot[hidden]`), `ocelle-button.ts` (the `inline-grid` host
   filled by the inner control,
   variants with hover and active, sizes, flush at the inline start, `ground` with `chrome`, label, disabled, icon
   slot, the `ocelle-button-activate` event of decision 26 with its cancel path in button mode), the tokens `color-hover-border`, `color-accent-hover`, `color-active-bg`, `color-chrome-active` and the
   grounds for `color-ink`, `color-accent-strong`, `color-on-accent`, `color-chrome-ink` and `color-disabled-ink` with
   their contrast rows (counts first), entry point, manifest (`ground`), README (element conventions → control
   conventions 1 (with the filled host), 3 (disabled half), 5 (with label-in-name), 7; the activate event; the form note; the flush-hover
   note with its exception list; the flush clipping note; the changing-surface `ground` rule; the chrome look; a host
   may restyle `display` and size, with the host guard's limits),
   CHANGELOGs, button stories (US1 states, chrome, the changing surface, focus; a spike first measures whether a
   programmatically focused story shows `:focus-visible` with plain `focus()` and with `focus({ focusVisible: true })`,
   decision 27) with their baselines and the axe gate, US1 scenarios 1 to 19 (US1-18 the cancelled activate event,
   US1-19 the form; manifest: the activate event declared, no `type`, `name`, `value` or `form` attribute) and this
   phase's edge-case rows.
3. **US2 Link mode and ARIA passthrough** (P2): spike first (element reflection on the engine-floor claim; the move
   at upgrade and on later sets; whether analyzer 0.11.0 emits `cssStates`); `control.ts` link mode by the URL parser
   (unparseable → button), `javascript:` rule, `noopener`, disabled link without `href` and with the guard, attribute
   move with clearing and removal as a no-op, `title`, the `data-ocelle-moved-*` mirrors read back at upgrade and
   restored when removed or changed (decision 24),
   `aria-haspopup` and `aria-pressed`, custom states, references, name order; the link-mode activate event (cancel →
   no navigation; no activate event on a Ctrl, Meta, Shift or Alt click, decision 26); `scripts/manifest.ts` and the moved
   attributes and mirrors declared; README conventions 2, 4 (with the per-stack recipes, the mirrors and custom
   states), 6, the `data:`/`vbscript:` note, 005's elements keep their rule, engines floor Chromium 135 and WebKit
   17.4, the htmx row's morph sentence, the three consumer compositions of decision 28; link stories with their
   baselines and the axe gate; US2 scenarios 1 to 14
   (US2-1 with the activate event and modifier clicks, US2-13 with its morph case; in-process sink bodies and
   fixture navigation bodies), link mode's forced colours and its look equal to button mode's (FR-002, US1-11), the
   consumer compositions (SC-006) and this phase's edge-case rows.
4. **US3 Busy** (P3): the unavailable half of the guard, the unavailable link without `href` and with
   `tabindex="0"`, `spinner.ts` (six turns, 4.8 s), the `motion-spin` and `motion-turn` tokens with `generate.ts`'s
   reduced-motion block from the motion durations, except a `-delay` token later marked `delay: true` (operator decision C1; at landing, phase 4 round 2: the marker only on `-delay` names, every other motion duration a literal `ms` value, fix-2 tasks T049b to T049f) (tokens and generator tests first), 002's `brand-rules` rule (f)
   following it (decision 29: `brand-rules.test.ts` first, the plant `f-motion-spin-missing`, the README row), reduced-motion and
   forced-colours rules, the README's 833 ms note for a spin override; busy stories with their baselines and the axe
   gate; US3 scenarios 1 to 11 (US3-11 the restyled busy button; no `ocelle-button-activate` while busy, one after
   `busy` is removed) and this phase's edge-case rows.
5. **US4 `ocelle-action-row`** (P4): spike first (decision 30: the hit layer's box and the clicks on the siblings,
   the description with `aria-hidden` wrappers, the ring's block bands on a flush row, axe `color-contrast` over the
   layer); `ocelle-action-row.ts` on `control.ts` (the `grid` host with the layout wrapper as its single item, the
   inner control holding icon and title and its hit layer filling the host, the description, tags and trailing
   wrappers as `aria-hidden` siblings with `pointer-events: none` and their own ink, button mode, link mode for
   activation, `click()`), the activate event, the name from content (icon and title),
   the description from slots with text only and the slot emptiness of decision 25 (`slotchange` and a
   `MutationObserver`), `title` and the mirrors (with the morph step), flush and default presentations, row layout
   and wrap,
   `overflow-wrap: anywhere` on title and description, min-content width, minimum height, inline padding `space-3`
   in both presentations, hover with `color-hover-border`, `ground` with `chrome`, the focus ring inside with the
   `focus-offset-inset` token, `color-ink-soft` grounds (token tests and contrast rows first); entry point, manifest,
   README, CHANGELOG; row stories (with the `ground` values `accent-low`, `inset`, `hover-bg` and `state`, and a focused
   non-current row, decision 27) with their baselines and the axe gate; US4 scenarios 1 to 18 (US4-18 the row-layout
   wrap, check-3 note SPEC-3-04) and this phase's edge-case rows.
6. **US5 Row states and card** (P5): link-row activation order and `preventDefault`, modifier, Alt and middle clicks
   (sink and fixture bodies), `current` and its bar apart from the ring (R-12's method, drawn by the hit layer, with
   hover precedence, forced colours and the chrome surface; the spike measures axe `color-contrast` on a current row,
   decision 30), `unavailable` (no `href` on a link row, decision 9; the sibling wrappers `aria-disabled`, decision 31;
   with `current`, the current surface kept, decisions 16 and 31;
   a stretched unavailable row), the restyled rows (decision 23; a spike first lists by hand which outside points
   lie outside the row's hit layer per mode and page rule), card layout on decision 30's model (the same wrappers and
   hit layer), tags wrapping, title gap and part; stories
   (with `current="true"`) with their baselines and the axe gate; US5 scenarios 1 to 12 and this phase's edge-case rows. The phase's review records a CI run of the branch
   at the full story count with every Plants shard's time (each under 10 minutes) and the run's total (R-13).

**Out of this mission**: `ocelle-pill-tag` and its ellipsis tooltip moved to the later status mission with
`ocelle-status-indicator` and `ocelle-metric` (triage 012). That mission builds the tooltip part on #16's
`ocelle-tooltip` as specified in `specs/008-overlays` on `claude/016-overlays`, without redesigning it, and its
implementation of that part needs #16 merged first. Nothing in this mission depends on #16.

Phase order: 1 → 2 → 3 → 4 → 5 → 6 (each needs the previous). No phase waits for #10: it is on `main` and merged into
this branch, and every phase carries the 006 work for its own stories. A landing after phase 2 gives #14's copy
control only; #12 needs phase 3 as well (link mode and `aria-current` for its `href` crumbs).

## Complexity Tracking

No exception. The former row "No visual baselines and no axe gate run on the new `ocelle-button` and `ocelle-action-row`
stories" (constitution III, V; during phases 2 to 6, sunset "phase 7, before 012 lands", that is the merge of #10) is
closed: #10 is on `main` (3828d2f) and merged into this branch (37dd501), so each phase commits its stories'
baselines and runs the `axe` gate on them (decision 15, operator decision 2026-11-13). The shard-size condition of
006's own row ("Plant roots hold every repository story") is met in phase 1 (R-13); it is the last setting that
can meet it, so phase 1's update of that row records the headroom and runner time and phase 1's review asks the
operator for a triage record on a plant design that does not grow with the story count (decision 15,
PLAN-FRESH-3-003). At phase 2 the estimate was corrected to about 72 stories, leaving about 4 stories of headroom to
the split count of 76; the operator opens that triage record when this feature lands (decision 15). Phase 4's change
to 002's brand-rules rule (f) (decision 29) is no exception: it keeps the reduced-motion rule and extends it to every
motion duration except those marked as delays (operator decision C1, 2026-11-17: a delay is not motion; at landing,
phase 4 round 2: only a token whose name ends in `-delay` may carry the marker, and every other motion duration must
be a literal `ms` value, so the rule is stricter, not relaxed), so it has no row.
