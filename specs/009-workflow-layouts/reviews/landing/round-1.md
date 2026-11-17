---
scope: landing
phase: landing
round: 1
verdict: changes_requested
base: 3828d2fee8dccab6f5c2697f859e2af7247d3378
head: be82474
tdd_check: pass
---

# Landing review, round 1 (PR #46, mission 009-workflow-layouts, issue #15)

This is a fresh second opinion on the integrated diff `origin/main...HEAD` (`3828d2f...be82474`): 282 files, 109 of
them outside `specs/` and the baselines. `origin/main` is `ce1d9c7` (op 015, #35), one commit past the merge base; it
merges cleanly (`git merge-tree --write-tree origin/main HEAD` exit 0, as briefed). I used the phase reviews as input
(`reviews/phase-1` to `phase-5`): phases 1, 2, 3 and 5 approved, and phase 4 accepted by the operator at round 4
(`phase-4/operator-accepted.md`). R4-01 of that round, the unsigned tdd-check commit, is resolved by the fold:
`gate:signoff -- --range 3828d2f..HEAD` exits 0. Every `tdd-check.json` has `status: pass`. I did not have the
results of CI run 43791016532.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| L1-01 | blocking | packages/elements/src/list-detail-measure.ts:67-87; packages/elements/src/ocelle-list-detail.ts:217-221, :295-299, :328-331 | **A list-detail that first renders while it is not rendered (closed `<dialog>`, `display: none` ancestor, `hidden` host) measures its intrinsic sizes as 0 px and never measures them again when it is shown. In a shrink-to-fit host it then shows as a 0 px wide one-column layout.** The only pass after upgrade is the one `firstUpdated` schedules (:298). It reads `grid.getBoundingClientRect().width` in the `max` and `min` tiers (measure.ts:74, :76). For a grid with no box both are 0, so it writes `.sizer { inline-size: 0px }` and `.grid { min-inline-size: 0px }`. When the element is shown, the probe's `ResizeObserver` (:217-221) only re-chooses the tier from the border box; it schedules no pass, so the 0 px figures stay. The panes are `contain: inline-size`, so nothing else feeds the intrinsic sizes. Reproduced in Chromium on a bundle of `src/browser.ts` at HEAD, with three panes of text, a 1280 px viewport and the frames given time to settle. Visible from the start, an open `<dialog>` holding the element gives 1100 px and `three`, and an `inline-block` wrapper gives 1280 px and `three` (sizer figure 2706 px). Upgraded inside a closed `<dialog>` and then `showModal()`'d, it gives **0 px and `one`**. The same happens inside a `display: none` `inline-block` wrapper that is then shown, and inside a hidden flex item that is then shown. Each stays that way until the host calls `remeasure()`, which restores 1100 px or 1280 px and `three`. A block-level host, whose size does not depend on the intrinsic sizes, recovers by itself (1280 px, `three`). A related effect: `#remeasured` (:329) parses `getComputedStyle(probe).inlineSize`, which is `auto` for an element that is not rendered. So `remeasure()` on a hidden element sets `#measured` to `NaN`, and the tier becomes `two` (or `three`) whatever the size, until the next `ResizeObserver` delivery. FR-025 says the intrinsic sizes "do not depend on the layout it shows" and that "a shrink-to-fit host therefore gives it a size from the room available and its content alone". FR-025 and the README list the changes that go unseen (images, fonts, shadow-root content, attribute-only changes, a percentage padding), and becoming rendered is not among them. The README names a dialog as a shrink-to-fit host (README.md:483). US3-12's dialog case (test/scenarios/list-detail.ts:553) uses `<dialog open>`, so no test covers a dialog that opens after upgrade. A console dialog that holds a list-detail is the ordinary case. | Red test first, in the shared scenarios: a list-detail upgraded inside a closed `<dialog class="dialog">` that is then opened with `showModal()` must give US3-12's dialog result (1073 px, three columns, stable over ten frames). Add the `display: none` ancestor case beside it. Then the fix. One way: when a pass finds the grid without a box (`getClientRects().length === 0`), write no figures and keep the pass pending, and have the probe's `ResizeObserver` schedule a pass (for the next frame, never inside the delivery) when the element is rendered again. The `NaN` path of `#remeasured` should not overwrite `#measured` when the probe is not rendered. If the operator prefers to document this as a further known limitation (the host calls `remeasure()` after showing the element), FR-025, contracts/elements.md § Unseen changes and the README must say so. That is a spec change and the operator's decision. |
| L1-02 | blocking | packages/elements/src/overflow-region.ts:357-358 | **An equivalent-mutant record whose mutant is not equivalent and that no test kills.** The record reads: "in process the scrollbar is an overlay of 0 px, so the border box and the content box change together; the classic scrollbar case is test/browser/scrollbar.test.ts (elements-browser, not mutated)". I applied the mutant (`this.#observer.observe(box)`, the content box) in a copy of HEAD. The whole `elements-browser` project passes (10 files, 231 tests), `scrollbar.test.ts` included (4 of 4). The in-process `elements` project passes too (29 files, 435 tests). So the test the record names does not kill it. The mutant changes behaviour. The case is a board in an 876 px frame with five lanes that fit, under Chromium's classic 15 px scrollbar (`--hide-scrollbars` off, as in `scrollbar.test.ts`), where a card's inner block in the last lane grows to 600 px. With HEAD, the scrollbar that appears changes the box's border box, the observer fires, and the box becomes `tabindex="0"`, `role="region"`, scrollable by 443 px. With the mutant, the box scrolls 443 px and shows its scrollbar, but it is not a tab stop and has no role. Keyboard users cannot reach the hidden content or scroll it. This is the one case where the box's border box changes and neither its content box nor the track does (FR-014's contained lanes). Constitution VIII and 001 research.md R-08 (5) accept a record only for an equivalent mutant. The phase 2 review accepted this record on its stated reason, which does not hold. | Add an `elements-browser` test, classic scrollbar, of the case above or another where only the box's border box changes. It must fail with the mutant applied (record the plant run). Then rewrite the record so it names that test, file and test name, as the cover the in-process run cannot give. Without such a test the mutant counts as a survivor. |
| L1-03 | note | packages/elements/src/overflow-region.ts:335-341; contracts/overflow-region.md:120 | The contract says that on a new box `hostUpdated` "moves the observer and the attributes to it". The code observes the new box, but it does not unobserve the old one, take its `scroll`, `slotchange` and frame `focusout` listeners off, or remove its `tabindex`, `role` and `aria-label`. Neither of this feature's hosts ever replaces its box, so nothing in this PR reaches it. The module is the seam #13 reuses, though, and a host that renders its box conditionally would keep a stale observer and a stale tab stop on a detached node. | Before #13: make the code match the contract (unobserve the old box, clear its attributes), red first. Or narrow the contract to "a host renders its box once". |
| L1-04 | note | contracts/overflow-region.md:121 | Phase 2's R2-02 is still open: `hostDisconnected` "removes its listeners" is broader than the code, which leaves the box's `scroll` and `slotchange` listeners and the frame's `focusout` listener in place (harmless; they are re-added as the same functions). It was carried through four rounds as instructed. | Fix the wording with the L1-03 change. |
| L1-05 | note | packages/elements/src/list-detail-measure.ts:403-408 | `passCount()` and the module-level `passes` counter exist only for `test/list-detail-pass.test.ts`, but they ship in `dist/` and the browser build. They are internal, not exported from the root and not in the manifest, so they are not public surface. | Optional: none needed; or move the count behind a test-only hook. |
| L1-06 | note | CI run 43791016532; `.github/workflows/ci.yml` on `origin/main` (op 015) | `be82474` does not hold op 015 (`ce1d9c7`), so its `Mutation shard` jobs for `packages/elements/src/` entries run with the 10-minute limit, not the 45 minutes `main` now gives them. Each element shard also starts with a dry run of the in-process suite (op 015 gave it `dryRunTimeoutMinutes: 30`). A shard cancelled at 10 minutes on this run is the case op 015 fixed. Classify it as a runner limit that the merge of `main` removes, not a PR defect, after comparing its time as the landing skill says. | Merge `main` (step 2/8 of the landing) and read the shard times on the next run. |
| L1-07 | note | storybook/baselines/ (46 added, 6 changed: `tokens--shell`, `tokens--space`, `tokens--type`, light and dark) | Constitution V: "Baselines change only in a pull request whose description says why". The six changed token baselines show the six new tokens (phase 1 R1-01). I did not read PR #46 on GitHub. | Operator: confirm that PR #46's description says why the 46 baselines are added and the 6 changed. |

## Gate boundaries and the exit contract

Only one gate changes: `style-lint`'s `ocelle/token-only` rule (gates/stylelint/token-only.ts:146, :150-160). The
change only widens what passes inside `linear-gradient()`, and it fails closed everywhere I probed:

- A hex, a named colour, an angle, a raw length or a unitless number inside the gradient is raw.
- `rgb()`, `color-mix()` and a nested `linear-gradient` are raw whole.
- `radial-`, `conic-` and `repeating-linear-gradient` and the prefixed `-webkit-linear-gradient` are raw whole: the
  name match is exact after lower-casing.
- A `var()` fallback and `calc()` operands are checked as everywhere, and the unknown-token check still applies inside.
- Identifiers that are not named colours pass, as at the top level. That covers `to`, `left` and the others, system
  colours, and an interpolation hint such as `in oklch`. None of them is a colour literal.

The exit codes are untouched: `classify` returns raw parts, and the rule's reporting and the gate's 0/1/2 paths do not
change. No gate is added, removed or renamed. So `gates/gates.json`, `gates/lib/registry.ts`, `.github/workflows/ci.yml`
and 001's `contracts/ci-checks.md` need no change, and the ruleset on `main` needs none. The README's `style-lint` row
names the rule and the five plants, and `gates/test/gates-readme.test.ts` checks it. `gate:config-copies` exits 0.

Overlap with existing gates: none new. The gate-test changes (`axe`, `visual`, `manifest`, `storybook-build`,
`plant-repo`) only raise the exact pinned counts: 42 → 88 story-themes, 2 → 6 elements, 21 → 44 stories. Each is still
an exact `toEqual` or `toBe`, so none is loosened. `visual/fail-token-changed` gains the sixteen new light story-themes
that show `color-ink`. The six manifest plant trees carry the regenerated manifest (phase 4 R3-01).

## Design lens

- **The four elements.** Each follows the 005 conventions: its own module and `define`, `static properties`, the
  `:host([hidden])` rule, variant rules inside `@media not (forced-colors: active)`, an entry point, and inclusion in
  the root and the browser build (`src/index.ts`, `src/browser.ts`, `package.json` `exports`). The manifest gate
  reports 6 elements and no finding. The surface matches contracts/elements.md: `label` on three elements; `count`,
  `count-label` and the reflected `variant` on the lane; `collapse-below`, `inspector-below` and the reflected
  `narrow` and `detail-open` on list-detail; `remeasure()`. No event, part or CSS custom property.
- **The six tokens.** They are additions through `source.ts`, with their groups, values and the `ref` of
  `scroller-fade-size`. `tokens/test/source-table.test.ts` pins them and the count of 121. The tokens changelog names
  them as MINOR. None is a colour, so no contrast pair is needed.
- **The overflow-region module.** The interface the README documents (inputs, outputs, effects, lifecycle, structure,
  "must not") matches the code, except L1-03 and L1-04. For #13's reuse, the seams hold up: the role, the step, the
  `ifDefined` `data-fade` binding, the ring and edge nodes, the per-instance mask sheet, and measured figures only. The
  test-only host `ocelle-test-overflow-host` builds on it exactly as the contract writes it. L1-02 sits in this module,
  so #13 inherits whatever test closes it.
- **The container-tier convention.** It is written once in the README and once in the contract, and is consistent
  with tiers.ts: exclusive bounds, the grammar, the token default and its published fallback, `narrow`, and no
  `container-type`. `remeasure()` does what the contract says, and nothing on a detached element (R3-02). L1-01 is a
  gap in the convention itself, not just in this element: "intrinsic sizes that do not depend on the tier" also has
  to hold for an element that first renders while not rendered. #8 and #12 will copy the convention, so it should be
  fixed here.

## Accessibility and security of the package code

- **Names and IDs.** Roles and names sit on shadow nodes (the region box, the lane wrapper). No ID reference crosses
  a shadow root. A blank host `aria-label` counts as absent through `resolveName`.
- **Keyboard and focus.** The arrow-key handler acts only when the box itself is the composed target and no modifier
  is held. Focus clearance runs only on `:focus-visible`. The handover walks the flat tree, skipping disabled, `inert`
  and boxless candidates, and the frame fallback has a temporary `tabindex="-1"`. list-detail's focus move reads the
  active element from its own root (R1-02 of phase 4). I found no keyboard trap.
- **Accessibility gaps.** L1-02 is one: with classic scrollbars, a board can scroll without being a tab stop.
- **Security.** There is no I/O, no `innerHTML` in package code, no `style` attribute and no CSS text built from
  input. The per-instance sheets hold measured numbers only. `csp` checks 18 files and finds nothing.
- **Personal data.** In the lines the diff adds, the only e-mail address is the `noreply@anthropic.com` trailer, there
  is no token pattern, and no `/home/user` path appears.

## Test quality

**Red evidence.** All eight red commits (`28229c8`, `b26fd1e`, `d754c82`, `8021158`, `9135090`, `a5bdb5f`,
`7149412`, `6785b8f`) are ancestors of HEAD after the fold, and each changes only test files. The red logs show
assertion failures. Each `tdd-check.json` has `pass`, with the final tests failing against the base (exit 1 or 2) and
against the scaffold where there is one (exit 1). Phase 1's exemption is limited to its no-behaviour scaffolding, and
its token tests have red evidence.

**Weakened tests.** None found. The changed pre-existing tests are exact count pins (see above). The phase reviews
checked the post-red changes of each phase (for example phase 2's R1-04 `mask-size` case, which is not a weakening).

**Vacuity.** `gate:test-lint` exits 0. The scenario tests compare an observed record with an exact expected value.

**Mutation.** I ran `pnpm run gate:mutation -- --base 3828d2f` on the whole diff. It exits 0: 860 mutants on the
changed lines of 11 files, none survived. It also reported 2 timeouts (`ocelle-list-detail.ts:250-251`,
`connectedCallback`, as in phase 4), 258 compile errors, 1 zero-mutant entry (`src/index.ts`) and 33 equivalent
records. I read all 33. 32 hold as equivalences. The exception is L1-02's record at `overflow-region.ts:357`: it is
not an equivalence, and I proved that the test it names does not kill its mutant.

**Coverage gaps found.** L1-01 (a dialog opened after upgrade) and L1-02 (a classic scrollbar appearing with no box or
track resize).

## Checks run

On HEAD `be82474`, one at a time, `OCELLE_VISUAL_ENGINE=docker`:

| Check | Result |
|---|---|
| `gate:typecheck`, `gate:lint`, `gate:style-lint`, `gate:test-lint`, `gate:prefix`, `gate:pins`, `gate:contrast`, `gate:brand-rules`, `gate:manifest`, `gate:config-copies` | exit 0 each |
| `gate:signoff -- --range 3828d2f..HEAD` | exit 0 |
| `gate:unit-tests` | exit 0: 3773 tests passed in 163 files |
| `gate:mutation -- --base 3828d2f` | exit 0 (see Test quality) |
| `gate:csp` | exit 0: 18 files checked, no finding |
| `gate:storybook-build` | exit 0: built 44 stories |
| `gate:visual` | exit 0: 88 captures match (docker only) |
| `gate:axe` | exit 0: 88 story-theme runs, 0 serious or critical; 10 notes, all excepted |
| `gate:plants -- --shard 16` (holds `visual/fail-token-changed`) | exit 0: 3 plants judged, every plant as expected |
| `gate:plants -- --shard 1`, `2`, `3` (hold the five gradient plants) | exit 0 each: 78, 78 and 77 plants judged, every plant as expected (all of the other plants; shards 4 to 15 and 17 to 28, the other visual and axe plants, not run) |

The reproductions of L1-01 and L1-02 ran on Playwright's Chromium (1.64.1) against Vite bundles of `src/browser.ts`.
L1-02's mutant ran in a `git archive HEAD` copy. The repository's tracked files are unchanged: `git status` shows only
this file.

## Earlier findings

There is no earlier landing round. Of the phase reviews' open items: R4-01 (the unsigned commit) is resolved by the
fold (`gate:signoff` exit 0 over the whole range). R2-02 / R3-05 / R4-03 is still open (L1-04). R4-02 (a reconnected
list-detail schedules no pass) is related to L1-01 but not the same: L1-01 needs no detach, only a first pass while
not rendered. A fix for L1-01 that schedules a pass when the element becomes rendered again would likely cover R4-02's
reconnect case too.
