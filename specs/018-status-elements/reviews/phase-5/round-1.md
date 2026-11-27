---
phase: 5
round: 1
verdict: changes_requested
base: 4e8728e483683935a884cb24b9299926f1adc0bb
head: 2f71116053698fea6def1ad4cfca97398375a4b6
tdd_check: pass
---

# Phase 5 review, round 1

I judged the phase against contracts/checks.md as amended by operator decision Q-P5-1 (a) (`eb0ec929`). The decision
drops the corner clause of § US4-7. The target is now the control's box, at least `--ocelle-target-small` in each axis,
which clicks 1 px inside each edge midpoint prove. The other binding decisions applied are Q2 (a), Q3 and phase 4 R1-01.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | packages/elements/src/ocelle-pill-tag.ts:525 | **A pill that has not rendered its inner control yet takes focus at a button ↔ link switch.** `#modeChanged()` records the refocus as `this.shadowRoot?.activeElement === this.#control()`. When there is no inner control yet, both sides are `null`, so `#refocus` becomes true and `updated()` focuses the new `<a>`. This happens to a connected pill that is static or newly made interactive and then gets a button ↔ link switch before its first interactive render. I confirmed it with a probe that I ran and deleted (not committed), in process on the element source. Case 1: a connected static pill, focus on a `<button id="before">`, then `setAttribute("interactive", "")` and `setAttribute("href", "#x")` in one task. Case 2: `createElement` with `interactive`, `append`, then `setAttribute("href", "#x")` in the same task. Both ended with focus on the pill's inner `A` (`{ active: 'p', inner: 'A' }` and `{ active: '', inner: 'A' }`), where it should have stayed on `before`. This breaks FR-035 (d): the refocus applies only "if the inner control had focus", and "a pill that becomes interactive does not take focus". It also breaks the README statement at packages/elements/README.md:1427 and WCAG 3.2.1 (an unexpected focus move). US4-9's focus body (scenarios/pill-tag-interactive.ts:915) sets one mode attribute at a time, so it misses this case. The US4-10 body has no unrendered case either. | Record the refocus only when an inner control exists and holds focus, for example `const inner = this.#control(); this.#refocus = inner !== null && this.shadowRoot?.activeElement === inner;`. Add a red test first, in a `fix-1` red commit: a shared body (both harnesses) that runs the two cases above, both orders, and reads that focus stays where it was. |
| R1-02 | note | specs/018-status-elements/reviews/phase-5/plants.md; tasks.md T055 | **The 116 affected plants should have been run.** `--affected 4e8728e4…` selects 116 of 317 plants, all through mapped paths. `reviews/operator-plants.md` reserves the `--list`-only route for a phase whose `--affected` selects every plant through an unmapped path. A narrower selection "runs it as the tasks say", and T055 asks for "the affected plants against `reviews/phase-5/base.sha`". `reviews/operator-ci-first.md` also lists `gate:plants -- --affected <base>` among the local gates, with `--list` only for the every-plant case. Under both operator rules as written, these 116 plants should have been judged locally. The implementer ran only `--list`, citing an orchestrator rule for this phase. My `--list` run matches `plants.md` line for line, with the same base and exit 0, so none of the skill's blocking conditions for plants applies. As the orchestrator asked, I did not run the 116. | The operator decides. Unless they waive it, run `gate:plants -- --affected 4e8728e4…`, record the result in `plants.md`, and treat T055's plant part as open until then. |
| R1-03 | note | packages/elements/src/ocelle-pill-tag.ts:498 | The `Stryker disable next-line ConditionalExpression` covers both mutants of `this.#modeNow() === "static"`. The recorded survivor (`true`) is equivalent: I traced the reason given and agree with it. The disable also suppresses the `false` mutant, which the first two runs killed (it is not among the survivors). That mutant (`connected()` on a static pill) is killable: US4-12 reads `a` and `o`. The comment therefore hides one mutant that the tests kill. | Optional: keep the guard as it is, or narrow the comment to the surviving mutant if Stryker's mutant-id form is available. |
| R1-04 | note | specs/018-status-elements/tasks.md (phase 6) | The deferred items appear in notes.md only. T056/T059 do not name them: the tooltip half of § US4-10, its plant "the refocus in `updated()` (not queued)", the `min-inline-size: 0` chain of the interactive host sheet, and the disabled text's `overflow-wrap: anywhere`. Their deferral is justified: no phase-5 body can observe them, and they would be untested source (Principle VIII). The risk is that phase 6 misses them. | Phase 6 should carry these items explicitly: in its tasks, its notes or its review checklist. |

## Departures (judged)

- **The tooltip half of § US4-10 is deferred to phase 6.** Accepted. There is no `ocelle-tooltip` wrapper before T059.
  The focus and ring half is tested in both directions, for keyboard and pointer, and the refocus is queued in a
  microtask as R-08 requires. The plant "the refocus in `updated()` (not queued)" survives for the reason given, since
  there is no `slotchange` to race against. "No refocus" is killed. See R1-04.
- **The `min-inline-size: 0` chain and `overflow-wrap: anywhere` are deferred to phase 6.** Accepted. Every interactive
  pill still wraps in phase 5, so neither rule is observable. The control's own `min-inline-size` is `target-small`
  (FR-043). See R1-04.
- **The refocus is noted in `attributeChangedCallback`, not in `willUpdate`.** The reasoning is sound. A property set
  reflects in Lit's `update()`, after `willUpdate`, so the attribute callback is the earliest point that sees the old
  control in both paths. The note as written has the null-control defect in R1-01. R-08's `willUpdate` reading would
  have the same defect.
- **Test changes from going green were folded into the amended red commit.** I diffed `2f277d8f`→`3968024a`. Every
  change keeps or tightens what is asserted:
  - control.test.ts now also reads `changed`;
  - US4-1 now reads that mounting takes no focus;
  - the label body now reads the inner `aria-label` in three cases;
  - the references body now reads that an absent id writes no content attribute, and that a late id resolves on
    reconnection;
  - US4-8 "same task" now reads the moved "Old" before the change, which fixes the body that passed vacuously on the
    scaffold;
  - US4-10 now reads that a pill with no focus takes none and that a later update does not refocus;
  - US4-12 gains the host-title-wins and mirror-after-upgrade cases.

  The fixture renames ("Other name" to "Mine filter" and the others) satisfy axe's `label-content-name-mismatch`, and
  the names in each body stay distinct from each other. The manifest event order follows the analyzer, an
  equally strict `toEqual`. Nothing was weakened. Since `3968024a`, the test files have changed only in a header comment
  (`2f711160`).
- **Equivalent code was removed in green, and one mutant is recorded as equivalent.** Both removals are sound.
  `capture()`'s null check was redundant because `handle()` ignores `null`. The selective `changed` callback was
  redundant because every caller already requests an update. The equivalent record is discussed in R1-03.
- **`tokens--size` baselines.** Expected: the size list gains `--ocelle-target-small`, and `gate:visual` matches all 426
  story-themes.

## Test quality

- **Red evidence.** `tdd-check.json`: `pass`, with no problems. The red commit `3968024a` (exit 1) contains test files
  only. The final tests fail on the base (exit 1) and on the scaffold (exit 1), and pass at head (8241 tests in 249
  files). `red-phase.log` lists 217 failures, all in the files the phase changes:
  - pill-tag-interactive, in process (65) and on the fixture (62);
  - control (5);
  - readme, manifest and changelog (29);
  - the tokens suites (25), on the absent `target-small`;
  - story pins and gate pins.

  The failures are assertions, "no `.control` in the shadow root", or "outside of the viewport" on the zero-size host.
  These are missing behaviour, not syntax, import or setup errors.
- **Scaffold.** `a95d5772` adds empty `capture()`, `release()` and `adoptMirrors()` and an unread `active` parameter,
  with no behaviour and no test file.
- **Weakening.** There is none (see above). There are no `skip` or `only` calls, no conditional expects (the header says
  so, and test-lint is clean), and no snapshot-only assertions. Each body asserts observable DOM, the accessibility
  tree, computed style, events or focus, and axe runs on each page.
- **Coverage.** Each US4 acceptance scenario and each § US4 body as amended has a shared body: the event paths (pointer,
  Enter, Space, `click()`, cancel, modifiers, middle click, disabled, static) and the keyboard paths (Tab and Shift+Tab,
  Enter, Space in button mode). The missing one is the unrendered-control focus case of R1-01.
- **Control tests.** 012's existing control tests are untouched: the control.test.ts diff since base removes no line,
  so the cases are additive. `ocelle-button` and `ocelle-action-row` sources and tests have no diff
  since base.
- **Mutation.** I did not run it, under the operator's rule on its length, and I rely on the implementer's record:
  - first run: 283 mutants, 19 survivors;
  - second run: 271 mutants, 1 survivor, at `ocelle-pill-tag.ts:498` (`ConditionalExpression` replaced by `true`);
  - confirming run on those lines: no survivor, 1 equivalent record.

  I checked the equivalent record. With `true`, `adoptMirrors()` on an interactive pill writes each mirror back as its
  attribute. The interactive pill's callback moves the attribute and mirrors it at once. Removing the mirror then
  restores it, because a value is held. The held values and mirrors end as `connected()` leaves them, and nothing reads
  `MovedAttributes`' upgrade flag afterwards. The record is valid. The 68 compile errors and 2 timeouts are reports,
  not findings.

## Checks run

Node 26 first on PATH and `OCELLE_CHROMIUM_PATH` set. Per `reviews/operator-ci-first.md`: the fast gates and this
phase's browser, visual and axe tests.

| Check | Result |
|---|---|
| `gate:typecheck` | no type error |
| `gate:lint` | 478 files, no finding |
| `gate:style-lint` | 45 files, no finding |
| `gate:test-lint` | 355 files, no finding |
| `gate:manifest` | 23 elements, no finding |
| `gate:config-copies` | identical |
| `gate:csp` | 48 files, no finding |
| `gate:prefix` | 507 files, no finding |
| `gate:signoff -- --range 4e8728e4..HEAD` | 6 commits, no finding |
| `gate:pins` | 5 manifests, no finding |
| `gate:contrast` | 207 pairs light, 215 dark (196 required per theme) |
| `gate:brand-rules` | 7 rules checked |
| vitest `elements`: pill-tag-interactive, pill-tag, control, button, action-row | 5 files, 357 passed |
| vitest `elements-browser`: browser/pill-tag-interactive, pill-tag, button, action-row | 4 files, 277 passed |
| vitest `elements-node`, `tokens`, `storybook` | 27 files, 1082 passed |
| vitest `storybook-integration`: elements-stories.test.ts | 552 passed |
| `gate:storybook-build` | built 213 stories |
| `gate:visual -- --engine docker` (after `docker info`: 29.9.2) | 426 captures match their baselines |
| `gate:axe` | 426 story-theme runs, 0 serious or critical; 10 notes (the existing prose-document exceptions) |
| `gate:plants -- --affected 4e8728e4… --list` | exit 0; 116 of 317 selected, none judged; the `note: affected:` lines are identical to `plants.md`, whose base equals `base.sha` and whose recorded exit is 0 |
| `gate:mutation -- --base 4e8728e4…` | not run locally; the implementer's record is relied on (see Test quality) |
| R1-01 probe (temporary in-process test, deleted after the run) | 2 of 2 failed: focus moved to the pill's inner link |

`check-head.log` (tdd-check) records the full `pnpm test` at head: 8241 tests passed in 249 files.

**Tasks.** T045 to T055 are ticked. The work of each is present, with two caveats: the departures judged above, and
T055's plant run (R1-02). Outside the phase, the changes are:
- the pinned counts (axe, visual, storybook-build, plant-repo);
- the eight manifest plant trees and `fail-token-changed`'s `why` (T054);
- the `tokens--size` baselines;
- checks.md § US4-7, as the operator decided.

**Constitution.**
- I: `ocelle-pill-tag-activate` follows the naming rule, the element does no I/O, and the manifest describes every
  member, event, state and part.
- II: styles use tokens only (style-lint clean). The pill radius stays on every mode (SPEC-1-04, phase 4 R1-01,
  Q-P5-1 (a)). No state changes the box: the cues are inset `box-shadow`s.
- III: one native control, and the host has no role and no tab stop. References use element reflection, with no ID
  across the shadow root. The ring comes from the focus tokens. Forced colours has the `GrayText`, `Highlight` and
  `LinkText` rules. The target is at least 24 px. axe is clean on every body and story. The one defect is the focus
  behaviour of R1-01.
- IV: the strict-CSP fixture suite and `gate:csp` are clean.
- V: nine new stories, light and dark, with baselines from the pinned container.
- VII: both CHANGELOGs name the minor additions.
- VIII: see Test quality.

**Plan.**
- Decisions 6, 7, 10, 11 and 12 are followed: the looks, the additive `MovedAttributes` methods and `guardHost`
  `active`, the interactive host sheet adopted and removed in `updated()`, and `pressed` in button mode only.
- Decision 15 and Q2 (a) are followed: the `.label` wrapper and `bare`.
- 012's conventions are used as merged.

## Earlier findings

None: this is round 1.
