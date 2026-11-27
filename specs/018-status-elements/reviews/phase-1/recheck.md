# Phase 1 recheck (T001)

Read on 2026-11-19 by the implementer at `4f44aa1d` (branch `claude/007-status-elements`, the merge of `origin/main`
`4911fd0b` into this branch, the phase's `base.sha`). Every fact below was read at that commit unless another is named.

**Outcome: stop-and-ask.** T001 finds four differences between this feature's plan and `main` as merged (§ Questions
for the operator, Q1 to Q4). Under T001 ("Any interface difference: stop-and-ask"), R-01 and the operator's brief of
2026-11-19 ("Record any interface difference and stop-and-ask as T001 says"), the phase stops here: T002 (spikes) and
the harness step (T003 to T010) have not started, and nothing in the repository's source or tests has changed.

## (a) Merges

| Work | Merge commit on `main` | On this branch |
|---|---|---|
| Mission 012 (button and action row, #50) | `4911fd0b971d1fa4fd0c629a0e95fe4d7a416c38` | yes, by `4f44aa1d` (ancestor checked) |
| Mission 008 (overlays, #47) | `13af7a91c590507787dc0a687e4956170ddafe02` | yes (ancestor checked) |
| Op 016 (affected plants, #45) | `c4c0af45d0742f7e2c7c037788646256c21cf789` | yes (ancestor checked) |
| Mission 011 (layout and headers, #44) | `bea3130004bb7342d40ddd6ac5caeb3f6f929014` | yes |
| Mission 009 (workflow and layouts, #46), mission 013 (data display, #43) | `b594b7e9`, `23ba5c57` | yes |

## (b) Facts marked recheck in research.md

### 012's `packages/elements/src/control.ts` (R-01, R-07, R-08): as planned

- `linkHref(href: string | null | undefined, base: string): string | undefined` (36-45).
- `type ControlState = "available" | "unavailable" | "disabled"`, `controlState(disabled: boolean, unavailable:
  boolean): ControlState` (48-54).
- `mirrorOf(name: string): string` → `data-ocelle-moved-${name}` (57-59).
- `class MovedAttributes(host: HTMLElement, names: readonly string[], changed: (name: string) => void)` (67-122):
  `static observed(names)` (81-83), `handle(name, value: string | null)` (86-94: a listed name stores a non-null
  value, a mirror is restored when it differs from the held value), `connected()` (97-104, guarded by the private
  `#upgraded` flag: reads back, once, the mirror of each name not yet held), `get(name)` (107-109), private `#store`
  (111-121: a blank value clears and removes the mirror, else stores and writes the mirror; the host attribute is
  removed and `changed` called).
- `resolveIds(host: Element, value: string | undefined): Element[]` (128-136).
- `guardHost(host: HTMLElement, control: () => Element | null, available: () => boolean): void` (142-151), three
  parameters, no `active` yet (phase 5 adds it, R-08).
- `controlStyles` (157-195): `.control:focus-visible` ring with the outline longhands, `a.control { text-decoration-line:
  none }`, forced colours `.control` `ButtonText`, `a.control` `LinkText` on `Canvas`, `.control:hover, .control:active`
  `Highlight` border, `.control:focus-visible` `Highlight` ring, `.control:disabled` `GrayText`. No pressed rule, as
  R-07 states.

### `ocelle-button` (R-01, R-07)

- Activate dispatch inline, `ocelle-button.ts` 480-485 (`#activate`): returns unless available; in link mode returns
  when Ctrl, Meta, Shift or Alt is held; dispatches `ocelle-button-activate` `{ bubbles, composed, cancelable, detail:
  {} }`; `preventDefault()` on the click when cancelled. As planned.
- Custom states toggled inline on `ElementInternals.states` in `updated()`, 516-532 (`expanded`, `pressed`, `current`).
  **Changed since the plan**: `pressed` is now set in button mode only (`ocelle-button.ts` 525-526, 012 plan decision
  32, a finding routed from this mission). The pill's own rule (plan decision 12, FR-031, US4-10) now matches
  `ocelle-button`; plan decision 12's triage note to mission 012 is moot (already done). No change for this feature.
- `shadowRootOptions` with `delegatesFocus: true` (109); host `display: inline-grid` (134); forced-colours disabled
  rule `color: GrayText; border-color: GrayText` (301-304). `label` is `{ type: String }`, not reflected (116-117).

### 012's README § Control conventions and manifest normaliser (R-15): as planned

- README § Control conventions (`packages/elements/README.md` 961-1042), rules 1 to 7, unchanged from what the plan
  reads; rule 1 still says "attached with `delegatesFocus`", which the pill departs from by plan (R-07).
- `packages/elements/scripts/manifest.ts` 81-95: an attribute declared with a description (JSDoc `@attr`) is kept even
  when it is a standard attribute (012 R-15), so the moved attributes and their `data-ocelle-moved-*` mirrors are
  declared as `ocelle-button` declares them.

### 008's `ocelle-tooltip` (R-01, R-08, R-09): as planned

- `packages/elements/src/ocelle-tooltip.ts`; entry `@ocelle/elements/ocelle-tooltip.js`.
- Properties (54-60): `text` (`String`, not reflected, default `""`), `placement` (reflected, `"top" | "bottom" |
  "start" | "end"`, default `"top"`), `disabled` (Boolean, reflected), `describes` (Boolean, reflected).
- Default slot = the trigger (the first assigned element); slot `description` (the tooltip's own); part `bubble`
  (`popover="manual"`, `aria-hidden="true"`); `:host { display: contents }` (63-65).
- Focus: `#onFocusin` (280-284) shows only when focus arrives on the trigger matching `:focus-visible`; `#show` (303)
  refuses while `disabled` or `text === ""`; `updated()` hides on `disabled` or an empty text; `#onSlotchange`
  (387-396) hides the bubble and resets the hover and focus state for a new trigger. So enabling a tooltip whose
  trigger already has focus shows nothing until focus re-enters, by code reading; T002 measures it (R-09).
- Tokens: `tooltip-delay` (`500ms`, group `motion`, `delay: true`, exempt from reduced motion), `tooltip-max-inline`,
  `drawer-inline`. Test delay `packages/elements/test/fixtures/tooltip-delay.css`: `300ms`.

### The test driver as merged (R-01, R-11): one interface, reconciled

`packages/elements/test/scenarios/driver.ts` (686 lines) holds 005's, 012's, 009's, 008's, 011's and 013's methods in
one `Driver`; 008's same-named methods were renamed at the merge (operator decision C2). The methods this plan uses,
with their merged signatures:

| Plan's name (R-01, R-11) | Merged method |
|---|---|
| 012 `press(key, modifiers?)`, `click(id, options?: ClickOptions)`, `hover(id, options?)` | as planned; `ClickOptions` has `inner`, `modifiers`, `button`, `position` (a point from the top-left corner) |
| 012 `events(id, types)` / `takeEvents()` | as planned |
| 008 `press(key, { shift? })`, `click(id, inner?, options?)`, `hover(id \| null, inner?)` | renamed `inputPress`, `inputClick`, `inputHover` |
| 008 `record` / `recorded`, `topLayer()`, `focusVisible(id, inner?)`, `focusPath()` | as planned |
| 008 `animations(id, inner?)` (`AnimationRecord`: duration, easing, playState, keyframes) | renamed `ownAnimations(id, inner?)` |
| 012 `reducedMotion(mode)`, 008 `reducedMotion(on)` | 013's `reducedMotion(mode: ReducedMotion)` |
| (none in the plan) | 013's `animations(id): Running[]` (kind, part, property, playState, endTime, currentTime of the host and every shadow element), `frames(n)`, `layout(id)` (a settle that reads a `dl`'s box), `text(id, value)`, `replace`, `changeAttributes`, `property`, `textOf`; 009's `clickAt(target, point)`, `focusTarget`, `settle()`; 011's `textData(id, index, data)`, `size(id, inline, block)`, `move` |

Against contracts/checks.md § Test harness, as merged:

| Row | State on `main` |
|---|---|
| 1 animation record: identity, `iterations`, `endTime`, `currentTime`, `playState` | partial: `animations(id)` gives `endTime`, `currentTime`, `playState`; no identity, no `iterations` (to add) |
| 2 `seek(id, inner, ms)` | missing (to add) |
| 3 `editText(id, data)` | **exists** as 013's `text(id, value)` (sets the first text node child's data, a `characterData` change) and 011's `textData(id, index, data)` |
| 4 tooltip shown state | **exists**: `topLayer()` reads `:popover-open` elements in every shadow root the probe saw attached (the probe hooks `attachShadow`), nested ones included |
| 5 `focusVisible` / `focusPath` through nested shadow roots | **exists**: the pill's control is in the pill's own shadow root (the tooltip's trigger is its light-DOM child there), so `focusVisible(pill, ".control")` and `focusPath()` reach it |
| 6 click at a point | **exists**: `click(id, { position })` and `clickAt(target, point)` |
| 7 `settleLayout()` | missing (013's `layout(id)` reads a `dl` only; to add) |
| 8 fractional overflow measure | missing (to add) |

Rows 3 to 6 need no new method; their self-tests as T004 to T006 word them would pass before any change, so they
cannot be part of a red commit (Q4).

### Rule (f) of `gates/bin/brand-rules.ts` and the token validator (R-04, R-10): **differs** (Q1)

- 012's generalisation as amended at its phase 4 round 2 (operator, 2026-11-17, O2-01, O2-02): rule (f) requires every
  motion token whose value is a literal `<number>ms` duration, except a `-delay` token with `delay: true`, at `0ms`
  under reduced motion (`brand-rules.ts` 206-217), and **reports any other motion value that is not an angle or an
  easing function** (`notDuration`, 37; "fail closed", 213).
- `packages/tokens/src/generate.ts` `validateSource()` 180-183 refuses the same: "value … of group motion is not a
  literal `<number>ms` duration, an angle or an easing function".
- So the planned `motion-pulse-count` (group `motion`, value `3`, R-04, R-10, FR-041) is refused by the generator and
  reported by rule (f). R-04 states the opposite ("the validator accepts (no per-group syntax rule, `generate.ts`
  133-168) and rule (f) skips (not a duration)"). `motion-pulse` (`1600ms`) joins rule (f) as planned.
- `tooltip-delay` exemption as merged: `delay: true` on a motion token named `-delay` (source.ts 284-286). As planned.
- Element source, for reference: 013 phase 3 extended `gate:style-lint` (`gates/stylelint/token-only.ts` 18-19) so
  that `animation-iteration-count` takes a bare positive integer; 012's spinner uses `calc(var(--ocelle-motion-spin) *
  6)` as one longer iteration, not an iteration count.

### Other token facts: as planned

- `color-disabled-ink` on `color-disabled-bg`: declared, `exempt: true` (source.ts 132-139).
- `color-<status>` text on `[...main, color-<status>-bg]` (142-155); `color-accent-strong` non-text on main, state and
  chrome grounds (96-101): no new contrast rows (R-06, R-07).
- No 24 px target token (`target-min` 2.75rem only, 211): `target-small` is needed (R-07, R-10).
- No `line-height-snug`; `line-height-compact` (1.5) exists and is not the planned 1.2.
- `size-dot` 0.45rem (213); `radius-pill` 999px "state pills only" (203); `bar-width` 3px, `focus-width` 3px,
  `focus-offset` 2px; `figures` `tabular-nums`.

### The slot convention (R-06, plan decision 15): **differs** (Q2)

012 plan decision 33 (operator, 2026-11-18, amended at its round 6) changed 005's convention as merged
(`packages/elements/src/icon-slot.ts` 1-31, 35-75; README § Slot convention):
- the label wrapper is part of the convention, `<span class="label">` holding the default slot, and a row with no
  label carries the modifier class `bare`;
- `iconSlotStyles` gains `.icon-row:not(.bare) > .label { align-self: baseline; }`, so a labelled row's baseline, and
  its host's, is the label's first line, with no position inside the row moved;
- `.icon-row { align-items: baseline }`, which is plan decision 15's override, was measured by 012 and rejected there
  because it "moves the items inside the row" (012 plan.md decision 33).

This feature's R-06 renders the pill's text in `<span class="text">` and overrides the row with `.icon-row {
align-items: baseline } .icon-slot { align-self: flex-start }`. As merged, a pill that renders its text in
`.label` (with `bare` when it has no text) gets the baseline from the convention itself, and the override would no
longer be needed; kept as planned, it is the rule 012 rejected for its own row.

### Engine floor (R-14): as planned

`packages/elements/README.md` § Engines (1538-): Chromium 135+, WebKit 17.4+. No feature of this plan is newer.

## (c) Mission 011

On `main` (`bea31300`) and on this branch. Its four eyebrow tokens are in `source.ts` as 011's R-12 has them
(`color-eyebrow` = `var(--ocelle-color-ink-muted)`, text on main, 54-60; `font-size-eyebrow` = `var(--ocelle-font-size-xs)`,
`font-weight-eyebrow` = `var(--ocelle-font-weight-strong)`, `tracking-eyebrow` = `0.08em`, 181-183). T028 and T030
are therefore not done (their "only if 011 is not on `main`" branch is false), and phase 3 adds no token.

## (d) Plant split count and story total: **stop-and-ask** (Q3, plan decision 9)

- `gates/lib/plant-runner.ts`: `shardSize` 1 (279), `otherShardSize` 80 (286). gates/README.md 52-71: the split count
  of size 1 is **76 stories**, already exceeded: the repository holds **194 stories** (`gates/test/integration/
  storybook-build.test.ts` 55 pins "built 194 stories"; 194 named story exports in `storybook/stories/`), in 77
  shards; CI run 44298568583 measured a plant step of at most 524 s and a shard job wall time of at most 692 s, 29
  shards over 570 s.
- "The triage record for a plant design whose shard time does not grow with the story count is pending (operator,
  2026-11-17, 012 phase 6 round 2 O2-01: offered as a follow-up issue)" (gates/README.md 70-71). No such triage
  record is in `triage/` and no op has landed.
- This feature adds 21 stories (215 in all). Plan decision 9: "if no plant design that does not grow with the story
  count has landed by T001, the run stops and asks."

## (e) This task list against op 016 as merged: matches, no correction

- `pnpm run gate:plants -- --affected <base>` and `--list` work as gates/README.md 81-102 states. Run at `4f44aa1d`
  with no change but this directory: `pnpm run gate:plants -- --affected 4f44aa1d74626db76a4baab534d1bd168dc2aae0
  --list` printed `plants: affected since 4f44aa1d74626db76a4baab534d1bd168dc2aae0: 0 of 317 plants selected, none
  judged (--list)`, exit 0 (specs/** selects nothing).
- `plants_command: "pnpm run gate:plants"` in `.specify/extensions/story/story-config.yml`.
- The `plants.md` form in `.specify/extensions/story/commands/speckit.story.implement.md` step 9 (`# Plants of phase
  <N>`, `- base:`, `- command:`, `- exit:`, the output verbatim in one text block, "no plant selected" as printed) is
  the one tasks.md § Plants per phase and every phase-end task (T010, T023, T034, T044, T055, T062, T065) name; the
  story skill in `.claude/skills/speckit-story-implement/SKILL.md` has the same text.
- Pinned story-count tests exist as tasks.md names them: `gates/test/integration/{storybook-build,visual,axe,
  plant-repo}.test.ts`; the plants `visual/fail-token-changed` and `storybook-build/fail-empty-index` exist.
- Noted from 012's landing: the visual integration test's limit is 1200 s (`gates/test/integration/visual.test.ts`
  28); it changes no task here.

## (f) Chromium for `OCELLE_CHROMIUM_PATH`

- The pinned Playwright (`playwright-core` 1.64.1) expects Chromium revision 1248 (156.0.8078.4); it is not installed
  and the CDN is blocked here.
- Installed: `/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` (alias `/opt/pw-browsers/chromium`), "Google
  Chrome for Testing 153.0.8010.12". Every browser run of this feature sets
  `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`.
- Node: the container has Node 22.23.4 only (`/opt/node22`, `/usr/local/bin/node`); Node 26.13.0, which tasks.md's
  Environment section requires for gates, is not installed here (knowledge/speckit-flows/findings/frontend-missions.md
  § Node version mismatch). The `--list` run above ran on Node 22.

## Questions for the operator

**Q1. `motion-pulse-count` cannot be a motion token as merged.** The generator refuses a unitless value in group
`motion` and rule (f) reports it (§ Rule (f) above), so FR-041's and R-10's `motion-pulse-count` (`3`) cannot be
added as planned. Options:
- (a) No count token: the ring writes `animation-iteration-count: 3` (a bare positive integer, which 013's
  `token-only` rule allows), and the 4.8 s bound is held by `motion-pulse` and that literal; FR-041, R-04 and R-10
  lose the token (a spec and plan amendment).
- (b) One duration token for the whole run, as 012's spinner does: `motion-pulse` 1600ms with
  `animation-iteration-count: 3` literal, or a token for the run's total; the same amendment as (a).
- (c) Extend 012's validator and rule (f) to accept a unitless count in group `motion` (gate source and token
  generator change, with its own red tests and plants; a change to a merged interface this plan says it does not
  touch).
- (d) Put the count in another group (none fits: `colour`, `type`, `space`, `shape`, `size`, `shell`, `elevation`,
  `motion`).

**Q2. The pill's baseline under 012's decision 33.** Options:
- (a) Follow the convention as merged: the pill renders its text in `<span class="label">` and puts `bare` on a row
  with no text; plan decision 15's override is dropped; the § US3 and § US4 baseline bodies stay and now measure the
  convention's rule (R-06, R-07, plan decision 15 and the contract amended).
- (b) Keep plan decision 15 as written (`.text`, `.icon-row { align-items: baseline }`), the rule 012 rejected for
  its own row.

**Q3. Plant split count (plan decision 9).** 194 stories on `main` against a split count of 76, with the design
triage still pending; this feature adds 21 (215). Proceed with 21 stories, change the story plan, or wait for the
plant design?

**Q4. Harness rows that exist on `main`.** Rows 3 to 6 of contracts/checks.md § Test harness exist as merged
(§ The test driver above), so self-tests for them cannot fail before the change and cannot go in phase 1's red
commit. Options:
- (a) Amend T003 to T009: phase 1 adds only rows 1, 2, 7 and 8 (identity and `iterations` on the animation record,
  `seek`, `settleLayout`, the fractional overflow measure) with red self-tests; rows 3 to 6 are recorded as merged
  methods (`text`/`textData`, `topLayer`, `focusVisible`/`focusPath`, `click` with `position`/`clickAt`), used as they
  are by the scenarios, with no new self-test (the phase-2 to phase-6 scenarios' own negatives are paired with
  positives as checks.md requires).
- (b) As (a), and rows 3 to 6 also get self-tests on stand-ins, committed with the green step (not red), recorded as
  regression tests of existing methods.
