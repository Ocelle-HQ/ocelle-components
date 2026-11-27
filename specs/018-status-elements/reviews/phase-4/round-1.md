---
phase: 4
round: 1
verdict: approved
base: 19448a1fc74c5201350ddb86e92e338f8a533303
head: 1d8b7435d9dd1aa614cd738f5bcf85c30aabcc85
tdd_check: pass
---

# Phase 4 review, round 1

User Story 3: the static `ocelle-pill-tag` and the badge. Commits under review: `ff2d9930` (scaffold), `bc22ea5b`
(red, amended once from `639b51a6`), `1d8b7435` (green). Binding: operator decision Q2 (a) (the pill uses 012's
`.label` slot convention), Q3 (21 stories), `reviews/operator-ci-first.md`, `reviews/operator-plants.md`.

## Findings

No blocking finding. The notes judge the departures that `notes.md` records, plus one point the operator should see.

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | `storybook/baselines/elements-ocelle-pill-tag--long-text-wraps.{light,dark}.png`; `src/ocelle-pill-tag.ts:84` | **A wrapped pill keeps the pill radius, so its corner glyphs sit on or outside the rounded edge.** The implementation follows both rules the spec states: SPEC-1-04 (every variant takes `--ocelle-radius-pill`) and US3-4 (exact padding). Together they make a 3- or 4-line pill a stadium shape. At 6× zoom on the baseline, the "W" of "Waiting" and the "r" of "run" in the compact badge cross its 1 px border. The "B" of "Blocked" and the descender of "pipeline" sit partly outside the filled ground. Nothing is clipped, so US3-5's "every character is visible" holds. US3-5's "inside the pill" holds for the rectangular `.pill` box the body measures, but not for the drawn shape. The implementer has no fix within the spec: a smaller radius breaks SPEC-1-04 and more padding breaks US3-4. Neither the spec nor the plan rounds considered this. | None in this phase. Ask the operator whether a wrapped pill should keep the pill radius (as now), or whether the spec should get a rule such as a smaller radius or more inline padding once a pill wraps. Any change belongs to a spec amendment, not to this phase. |
| R1-02 | note | `test/scenarios/pill-tag.ts:93` | **Icon-only pill: the body pins only the top and the size.** checks.md § US3 baseline pins the icon-only `bare` box "where T002 measured it". The body pins the spike's top (−7.09 / −7.39 px) and its height and width, but not the bottom offset. The bottom is top + height − the surrounding text's height, and that text height depends on the font. In process no font file loads, so the text is 1 px shorter. On the fixture, which serves the font, the pinned top and size fix the spike's +4.09 / +5.39 px bottom anyway. The plants the bottom stood for (`bare` never set; the dropped override) move the top to −4.00 px and are killed. | None. |
| R1-03 | note | `contracts/checks.md:80` (plant column) | **The dropped-override plant is killed through the icon-only pill, not through the wrappers' block-starts.** checks.md's reason ("the wrappers' block-starts then differ") is wrong: the phase-1 spike recorded that `.icon-slot { align-self: flex-start }` keeps them equal (`phase-1/spikes.md` § Notes for later phases). The same body still kills the plant: the icon-only top reads −4.00 px. The notes also record that the plant only bites when it is placed after `iconSlotStyles`. | Optional: correct the reason text in checks.md during polish. |
| R1-04 | note | `src/ocelle-pill-tag.ts:90-94` | **The `min-inline-size: 0` plant on `.pill` is recorded as equivalent, and I accept that.** In the static pill, `.pill` is a block box inside an `inline-block` host, not a flex or grid item. A `min-inline-size` of 0 does not lower its min-content contribution, so the host's automatic minimum in the flex row is still the word. The host-side variant of the same plant is killed by all four US3-8 bodies. | None. |
| R1-05 | note | `test/scenarios/pill-tag.ts:844` | **The static click inside a link is tested in process only.** The fixture driver has no navigation sink, and a link there really navigates. 012's `linkSinkScenarios` uses the same split. The shared static-click body (ancestor listener, `click()`, enabled and disabled, beside a `<span>` twin) runs in both harnesses. | None. |
| R1-06 | note | `src/ocelle-pill-tag.ts:293` | **Interactive and link-mode pills render nothing in phase 4.** This is consistent with analysis finding I2 and the tasks' checkpoint: phase 4 builds no interactive mode. The CHANGELOG says "the interactive modes are to come", and the README describes no interactive behaviour. The "Mode read" body pins only that such a pill does not render the static root, which stays true in phase 5. This state must not ship: phase 5 has to land before any release of this branch. | None in this phase. |
| R1-07 | note | `test/scenarios/pill-tag.ts:570` | **The seven-names body removes the names at its end.** All seven are read on the host, as set and as changed, with no mirror, no inner control and no custom state, before they are removed. The removal follows the README rule T038 asks for, and the spec's Edge Cases foresee the axe report (`aria-allowed-attr` on a role-less host). The `MovedAttributes.handle()` plant fails this body, US3-7 and SC-001's `title` row. | None. |
| R1-08 | note | `test/scenarios/consumers.ts:120` | **The SC-001 `title` row reads `generic Blocked since Monday`.** This is Chromium's own naming of a role-less host by its `title`. spec.md:745 keeps that as the browser's native behaviour, and SC-001 asks only that `title` is "kept on the host as written", which the row also asserts. | None. |
| R1-09 | note | `packages/elements/custom-elements.json` (`href`, `label` default `"undefined"`) | **The manifest declares `href` and `label` with default `undefined` where contracts/elements-status.md writes `""`.** This follows the repository's convention for optional string properties, accepted in phases 2 and 3 (round 1, R1-01 and R1-06). An unset and an empty value behave the same (the "href that is no link" body). | None. |
| R1-10 | note | `storybook/.storybook/stories-layout.css:152` | **A layout rule T043 does not name.** `[data-story="pill-narrow"]` gives the `LongTextWraps` block a width of `calc(var(--ocelle-space-10) * 2.5)`, capped at 100 %. It is token-based (style-lint clean), keyed on a `data-story` attribute as the file's header requires, and needed because stories take no `style` attribute. It is the same pattern as 013's wrappers. | None. |
| R1-11 | note | `gates/plants/visual/fail-token-changed/plant.json` | **`fail-token-changed` changes only its `why` text and has not been confirmed by a plant run.** T043 says "extended", but no pill story shows `color-ink`: each pill's text, border and icon use its status colour, and `color-neutral` (`source.ts:154`) is its own value, not an alias of `color-ink`. The findings are therefore unchanged. Under `operator-plants.md`, CI's Plants check confirms it. | None locally; CI judges it. |
| R1-12 | note | `storybook/baselines/tokens--type.{light,dark}.png` | **The `tokens--type` baselines changed because of the new token.** The new `--ocelle-line-height-snug 1.2` entry appears between `tight` and `normal`, and the image differs only by that entry. Both images were written by `visual:update` in the pinned container. My docker `gate:visual` run matches all 408 captures. | None. |

## Test quality

**Red evidence.**
- `tdd-check.json`: `status: pass` with no problems.
  - Red `bc22ea5b` exits 1 with 166 of 8054 tests failing (`check-red-phase.log`, the same as the implementer's `red-phase.log`).
  - The final tests exit 2 on base (no `pill-tag` test file exists there: "no test file found", `check-final-tests-on-base.log`), which is expected for a phase that adds new test files.
  - The final tests exit 1 on the scaffold, with 171 of 8062 failing.
  - Head exits 0 with 8062 tests passing in 247 files.
- The red commit changes only test pathspecs and `specs/`.
- The scaffold `ff2d9930` adds the empty class `OcellePillTag extends LitElement {}` and nothing else: no behaviour, no test file, no registration.

**Pill bodies on the scaffold and in the red run.**
- On the scaffold, 84 failures name a pill test file: in-process 42 of 42, fixture 41 of 41, and `entry-pill-tag` 1. So every final pill body, including the four added in green, fails there.
- In the red run, in-process 38 of 38 and fixture 37 of 37 fail.
- The failures are `AssertionError`s on the observation. The only other errors are SC-001's `no [part="pill"] in the shadow root`, which is the missing behaviour, not a setup error.
- The node, build, token and count failures listed in `notes.md` are each on missing output (manifest, README, exports, `dist`, the `line-height-snug` token, pinned counts).

**The amend of the red commit.** In the first red run (`639b51a6`), 8 in-process and 7 fixture bodies passed on the scaffold. These were the four stretched-host bodies, seven names, static click, static focus and the sink: they asserted only that nothing happens, which a never-upgraded element also satisfies. `git diff 639b51a6 bc22ea5b` touches only `test/scenarios/pill-tag.ts` (+39 −18), and every change makes a body stricter:
- each of those bodies now also asserts the upgraded static root (`rendered: staticRoot`);
- the stretched host also asserts a visible `.pill` wider than 0 and narrower than its 200 px track;
- `staticRoot` replaces two literal copies of the same list;
- the sink body's expected array moves under `navigations`, with the same three records.

No expectation was removed or loosened. The behaviour these bodies guard (nothing prevented, the ancestor takes focus, the names stay on the host) can still fail through the recorded plants: the click guard fails 2 bodies, `delegatesFocus` 1, `inline-size: fit-content` removed 4, and `MovedAttributes.handle()` 4. The red evidence is sound.

**After red.** `git diff bc22ea5b..1d8b7435` over the test pathspecs:
- `test/scenarios/pill-tag.ts` only adds four bodies (Mode read, Reflection, Attribute changes, the forwarded-slot and empty-nodes read); no existing line changed;
- `storybook/stories/pill-tag.stories.ts` and its plant-tree copy are T043's stories, not tests.

Nothing was weakened, skipped or deleted. No test uses `skip` or `only`, a conditional assertion, a snapshot or a mock. Every body returns one observation that the harness compares with a hand-written `expected` taken from `expected.ts`, the spec, or the phase-1 spike.

**Coverage.**
- US3-1 to US3-8 each have a body, US3-7 limited to its first clause (I2).
- Every § US3 body is present: static click with the sink, static focus, US3-8 ×4, stretched host ×4, baseline ×4, seven names.
- The edge cases are covered: unknown values, `label` and `disabled` inert, non-link `href`, empty and late text, forced colours in both palettes, right to left, `hidden`.
- SC-001's three pill rows run in light and dark.
- The plant table in `notes.md` names a killing body for every checks.md § US3 plant, except the one recorded equivalent (R1-04).

**Mutation.**
- The implementer's second run (`notes.md` § Gates) reads 87 mutants on the changed lines of 3 files, none surviving.
- Its one equivalent record, `ocelle-pill-tag.ts:58` (`{ type: String }` → `{}`), is truly equivalent: Lit's default property options are type String, attribute `label`, not reflected.
- The 18 survivors of the first run are each killed by a body added in green and each fail on the scaffold; I re-read the four added bodies.
- I could not rerun the gate. A background run was refused by the session's permission classifier, and both a whole-diff foreground run and the single shard `ocelle-pill-tag.ts:271-300` timed out at the 10-minute foreground limit. `reviews/operator-ci-first.md` does not list mutation among the local gates. CI's sharded mutation job (`.github/workflows/ci.yml:82-105`) judges it on the pull request.

## Checks run

Node 26 first on PATH and `OCELLE_CHROMIUM_PATH` set. Per `reviews/operator-ci-first.md`, I ran the fast gates and this phase's browser, visual and axe tests; CI decides the full suites.

| Check | Result |
|---|---|
| `gate:typecheck` | no type error |
| `gate:lint` | 475 files, no finding |
| `gate:style-lint` | 45 files, no finding |
| `gate:test-lint` | 352 files, no finding |
| `gate:manifest` | 23 elements, no finding |
| `gate:config-copies` | identical |
| `gate:prefix` | 504 files, no finding |
| `gate:pins` | 5 manifests, no finding |
| `gate:contrast` | 207 pairs in light, 215 in dark (196 required per theme) |
| `gate:brand-rules` | 7 rules checked |
| `gate:csp` | 48 files, no finding |
| `gate:signoff -- --range 19448a1f..HEAD` | 3 commits, no finding |
| vitest: `pill-tag.test.ts`, `browser/pill-tag.test.ts`, `consumers.test.ts`, `entry-pill-tag.test.ts`, `entry-root.test.ts`, `exports.test.ts`, `packages/elements/test/node`, `packages/tokens/test`, `storybook/test/integration/elements-stories.test.ts` | 29 files, 1639 tests passed |
| `gate:storybook-build` | built 204 stories |
| `gate:visual -- --engine docker` (`docker info` checked first) | 408 captures match their baselines (docker only) |
| `gate:axe` | 408 story-theme runs, 0 serious or critical; 10 notes (the existing prose-document exceptions) |
| `gate:plants -- --affected 19448a1f… --list` | exit 0; `note: affected: every plant, by packages/elements/package.json (not mapped)`; 317 of 317 selected, none judged. This is identical to `plants.md`, whose base equals `base.sha` and whose recorded exit is 0. Per `operator-plants.md`, CI judges the plants. |
| `gate:mutation -- --base 19448a1f…` | not completed locally (see Test quality); left to CI |

`check-head.log` (tdd-check) records the full `pnpm test` at head: 8062 tests passed in 247 files.

**Tasks.** T035 to T044 are ticked, and the work of each is present:
- the scenarios, both harnesses, the fixture, and the entry, root, exports and consumers tests;
- the `line-height-snug` token in `source.ts`, `expected.ts`, the tokens README and CHANGELOG;
- the element and its `index.ts` export, and the `package.json` export;
- the manifest and its eight plant-tree copies;
- the README § `ocelle-pill-tag` with the static rules, the ARIA-clearing rule and the `min-inline-size: 0` rule;
- both CHANGELOGs;
- five stories and ten baselines;
- `fail-empty-index` and `fail-token-changed` (R1-11);
- `plants.md`.

Outside the phase, the only changes are the pinned counts that the new stories and element move (axe, visual, storybook-build, plant-repo, manifest gate tests, as T039 asks), the `tokens--type` baselines (R1-12) and the layout rule (R1-10).

**Constitution.**
- I: `ocelle-pill-tag`, no event, no I/O; every public member is in the manifest.
- II: token-only styles (style-lint clean). The pill radius is used for a state pill per SPEC-1-04. Schibsted Grotesk, no monospace family. The new token has its contrast and brand gates clean.
- III: no role and no tab stop on a static pill, the text exposed as plain text, the icon decorative, no ID reference across the shadow root, forced colours keep a visible border, and axe is clean on every story and every in-process body.
- IV: the strict-CSP fixture harness and `gate:csp` are clean.
- V: five stories in light and dark, with baselines from the pinned container.
- VII: the CHANGELOGs name the minor additions in both packages.
- VIII: see Test quality.

**Plan.**
- Plan decision 5 is followed: sizes, the nested `.icon-row`, the `1lh` icon, the `inline-block` host, and `.pill:not(.control)` with `fit-content`, a 100 % cap and `border-box`.
- Decision 15 as amended (Q2 (a)) is followed: the `.label` wrapper, `bare` read on `slotchange` and through a lifetime `MutationObserver` as `ocelle-button` reads it, and no row-alignment override.
- Of 012, only `linkHref` is used; there is no `MovedAttributes`, `guardHost` or interactive mode.

## Earlier findings

None: this is the first round of phase 4.
