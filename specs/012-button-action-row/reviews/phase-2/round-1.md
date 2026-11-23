---
phase: 2
round: 1
verdict: changes_requested
base: 48cdc9584ab93373eff1544378e118f20eded10e
head: 1986d74
tdd_check: pass
---

# Phase 2 review, round 1

Scope: `git diff 48cdc95..1986d74` (User Story 1, `ocelle-button`, T014 to T029). Scaffold a361c3b, red fa5ef5c, green
and fixes ecf9b96, 306307d, 4d5eb50, 2cd1264, 5fb5287, 4945abb, 6a74b3b, 9caad44, 8b3c4ed, tdd-check outputs 1986d74.
The work tree was clean throughout. Read: spec.md (with "Operator decisions at phase 2"), plan.md, research.md R-08 and
R-09, tasks.md Phase 2, the constitution, and this directory's notes.md, spike.md, plants.md and logs.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | packages/elements/src/icon-slot.ts:56 (the slotted icon's `margin-inline-end`), packages/elements/src/ocelle-button.ts:297; storybook/baselines/elements-ocelle-button--icon-only.{light,dark}.png | An icon-only button keeps the slot convention's 8 px gap after its icon though there is no label. The inner control centres the icon row, so the icon itself sits 4 px towards the inline start of the button's centre, and the button is 8 px wider than its padding and icon need. This is visible in the committed icon-only baselines: in the light capture both the default and the compact button show the close glyph clearly off centre (left of centre in ltr). The notes call it "not in the plan; left as it is". No requirement asks for it, plan R-09 intends the content centred in the control ("a flex box that centres the slot convention's icon-row"), and an icon-only button (close, menu, copy) is a common consumer case that #12 and #14 will meet. Committing baselines locks in a look nobody chose (constitution V: Storybook is the visual source of truth). | Test first: add a red test (fix-1) to `test/scenarios/button.ts` that asserts, for an icon-only button in `default` and `compact` size, in ltr and rtl, that the icon's centre equals the inner control's inline centre within 0.5 px (and, for `flush`, that US1-12's start alignment still holds). Then remove the gap when the default slot has no content, for example by tracking the default slot's assigned content on `slotchange` and dropping the icon's end margin, without changing the icon-and-label case of US1-8. Regenerate the two icon-only baselines (and any other that changes) only through `visual:update` in the pinned container. Alternatively, if the operator wants the current look, record the operator decision in spec.md and the README, and say so in the fix note. |
| R1-02 | note | packages/elements/src/ocelle-button.ts:78 | The default size sets `line-height: var(--ocelle-line-height-normal)`, which neither plan R-09 nor FR-011 names (they give only the compact scale's line height). The choice is sound: R-09 sets the default font size explicitly (`--ocelle-font-size-md`), and pairing it with `line-height-normal` is the regular scale of `base.css` (`[data-ocelle-density="regular"]`), so a default button in a compact-density region keeps a consistent text scale instead of inheriting 1.5; it is a token and the README's token list names it (README.md:216). But no test asserts it (US1-6 asserts the compact line height only, test/scenarios/button.ts:526-533), and Stryker does not mutate CSS in `css` templates, so nothing would catch its removal. | Record the default line height in plan R-09 at the next planning touch, and assert the default size's computed `line-height` beside the compact one in US1-6. |
| R1-03 | note | packages/elements/test/scenarios/button.ts:136-139 | The doc comment of `flushHoverUnchanged` lists `hover-bg`, light `inset` and `chrome-hover`, but not the dark `neutral-bg` ground that the operator added at phase 2 and the constant itself (line 141) contains. | Add dark `neutral-bg` to the comment with the next change to this file. |
| R1-04 | note | packages/elements/test/button.test.ts:25-60 (9caad44) | The two reflection tests were added after the green commit, when the mutation run found the reflection of `variant`, `size`, `flush`, `ground` and `disabled` unasserted. They are additions, not a change to a red test, they assert observable attributes and properties, and the tdd-check proves both fail against the scaffold (check-final-tests-on-scaffold.log:270-271). Acceptable; recorded because the red step should have covered T025's reflection. | None. |
| R1-05 | note | specs/012-button-action-row/reviews/phase-2/notes.md "Further points" | The host's unnamed `generic` accessibility node: settled by the operator at phase 2 (spec.md:130-133). US1-1 now pins the full node list `[generic "", button "Save"]` and the meaningful list `[button "Save"]` (test/scenarios/button.ts:421-446), so a named host node fails both. Nothing to change. | None. |

## Test quality

- **tdd-check.json**: `pass`, no problems; red commit fa5ef5c exit 1, final tests on the scaffold exit 1, on the base
  exit 2 (no test file at the base), at its head 8b3c4ed exit 0. HEAD 1986d74 only adds the check's own outputs, so the
  check is current.
- **Scaffold.** a361c3b adds only `packages/elements/src/ocelle-button.ts` with an empty `class OcelleButton extends
  LitElement {}`: no render, no properties, no registration, no test file. tdd-check ran the final tests against it:
  248 of 3348 failed (check-final-tests-on-scaffold.log), including the post-red additions (the reflection tests at
  lines 270-271, contrast-required at 214-216, the manifest counts at 101 and 218-222).
- **Red.** fa5ef5c changes only test files and the phase's specs directory. red-phase.log: 243 of 3346 failed. The
  failures are the missing behaviour: assertion differences (`expected { click: +0, activate: +0 … } to deeply equal {
  click: 1, activate: 1 … }`, the token lists of 114 vs 118 colours, the missing `ocelle-button.js` in the build), and
  the shared helpers' own messages for an element with no shadow content ("no #b with an inner control", "no
  [part="control"] in the shadow root", "axState: #b has no shadow root"), which is the scaffold's missing render, not
  a setup error. No syntax, import or module-resolution error appears in the log.
- **After red (`git diff fa5ef5c..HEAD` on the test paths).** Nothing was skipped, deleted or loosened:
  - `gates/test/contrast-required.test.ts`: the hand-written required set gains six row groups (+33 triples per theme,
    149 to 182; 298 to 364). I checked each against research.md R-08: `color-ink` +6 (state grounds, `active-bg`),
    `color-hover-border` +15 (9 main, 5 state, `active-bg`), `color-on-accent` +1, `color-chrome-ink` +1,
    `color-disabled-ink` +2, `color-accent-strong` +8 (six main grounds and two chrome grounds); `color-ink-soft`'s +5
    belongs to the row (phase 5). Stricter: every new row is pinned by hand.
  - `gates/test/manifest.test.ts` (2), `gates/test/integration/manifest.test.ts` (1): "3 elements checked", and
    `gates/test/integration/axe.test.ts`: 78 story-theme runs (76 + the unlabelled plant's 2). Pinned counts changed by
    design, still exact.
  - `packages/elements/test/build/build.test.ts:46`: the red filter lacked `ocelle-button.js` while the expected list
    (line 52) named it, so the test could never pass. Adding it to the filter makes the test demand the file; the
    expectation is unchanged. Stricter, not weaker.
  - `packages/elements/test/button.test.ts`: two reflection tests added (R1-04).
- **Plants changed after red** (5fb5287, 4945abb): `contrast/exempt-disabled-ink` gains its two chrome-ground figures;
  I recomputed them from the WCAG formula (#8A8276 on #15130F 4.89, on #211D18 4.42), and the plant still expects
  `pass` with an exempt pair (its `why` now notes the 4.89 ground). The eight manifest plant trees gain only the
  `ocelle-button` module, identical to the committed manifest's (checked by parsing: equal module in each; the planted
  defects of the other modules untouched; `pass-reordered` keeps its reordered keys). `visual/fail-token-changed`
  (4d5eb50) gains fourteen light button story-themes; I ran its shard and it passes as expected (see Checks).
- **Assertions.** Every scenario returns observable values and compares them with hand-written expectations
  (token values through the hand-written table, 44 and 24 px by hand, R-08's state tables transcribed); each "does
  not" shares its body with its positive twin (US1-3 with the enabled twin, US1-15 and US1-17 with the centre click,
  US1-19 with click and activate counts). No conditional assertion, `skip`, `only` or snapshot; `gate:test-lint`
  passes. Each acceptance scenario US1-1 to US1-19, the long-label, unknown-value and empty-name edge cases, and every
  activation path (pointer, Enter, Space, `click()`) has a body.
- **Plants of T015 to T018** (plants.md): thirteen plants, each failing at least one test (1 to 18 failures of 102).
- **Harness additions** (fa5ef5c): the driver's `callClick(id)` calls the element's own `click()` in the page
  (page-side.ts `clickElement`, throwing when the id is missing), and `click` gains a `position` passed to Playwright's
  `position`. Both are needed by US1-2, US1-3, US1-15 and US1-17 and both have self-tests in
  `test/scenarios/harness.ts` that compare against known native results (a 20 px button inside a 100 px box; an
  enabled native button gets one untrusted click, a disabled one none). They passed in the red commit because the code
  they test is test code of the same commit, which is fine.
- **Test host** (`test/fixtures/test-host.ts`): the `description` and `tags` slots are test code, placed after the
  trailing wrapper; they let T015 prove the scoped `::slotted` rule on the row's future slots. Its plant (unscoped
  `::slotted(*)`) fails both T015 tests.
- **Mutation.** `pnpm run gate:mutation -- --base 48cdc95` (my run): 134 mutants on the changed lines of 5 files, none
  survived; 0 timeouts, 48 compile errors (token-source literals the typed records reject), 2 zero-mutant entries
  (`icon-slot.ts`, `index.ts`: CSS and re-exports only), 1 equivalent record: ocelle-button.ts:48, `label: { type:
  String }` replaced by `{}`. Equivalent: Lit's default property options are the String type's (attribute `label`,
  the default converter, no reflection), so the mutant behaves identically. Accepted.

## Checks run

All on HEAD 1986d74, one at a time:

- `gate:typecheck`, `gate:lint` (279 files), `gate:style-lint` (14), `gate:test-lint` (187), `gate:prefix` (296),
  `gate:pins`, `gate:config-copies`, `gate:manifest` (3 elements), `gate:contrast` (193 pairs light, 201 dark, 182
  required per theme), `gate:brand-rules` (7 rules), `gate:signoff -- --range 48cdc95..HEAD` (12 commits),
  `gate:storybook-build` (38 stories), `gate:csp` (12 files): all pass.
- `OCELLE_VISUAL_ENGINE=docker pnpm run gate:visual`: 76 captures match their baselines (docker only: no
  cross-engine comparison). Per the operator's baseline rule there is no podman check here; CI confirms the
  baselines at landing. The 34 button baselines and the two `tokens--colour` captures were written by `visual:update`
  in #10's pinned container per notes.md; the `tokens--colour` change is expected (1919 to 2105 px high, the four new
  colour tokens `chrome-active`, `accent-hover`, `hover-border`, `active-bg` listed with their values, viewed).
- `gate:axe`: 76 story-theme runs, 0 serious or critical; 10 excepted notes.
- `pnpm test`: 3348 tests passed in 148 files (8 min).
- `gate:mutation -- --base 48cdc95`: see above.
- `gate:plants`, shard by shard with `OCELLE_VISUAL_ENGINE=docker`: all 76 shards (`--shard 1`
  to `--shard 76`, one at a time), every plant as expected in each; the slowest shard took 123 s (shard 40,
  `visual/fail-token-changed`), well under the operator's 10-minute stop rule. Shard 1 judged the contrast and
  manifest plants changed in 5fb5287 and 4945abb.

## Earlier findings

None: this is the first round.
