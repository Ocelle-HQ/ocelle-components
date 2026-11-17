---
phase: 5
round: 1
verdict: approved
base: 2b1c1ace8da76ffd19a42dbd6c8d016cad1c9715
head: fff002c
tdd_check: pass
---

# Phase 5 review, round 1

Scope: `git diff 2b1c1ac..fff002c`. The range holds these commits:

- the scaffold `3cda650`;
- the red commit `5d556e3`;
- the green commit `86f6304`;
- the fix `9ad88a8`, which regenerates the manifest plant copies;
- `ecff66e`, which adds the check results to notes.md;
- the operator decision record `77911c5` (decision 9), which touches only `reviews/operator-decisions-implementation.md`;
- the tdd-check outputs `fff002c`.

Before I wrote this review the working tree had no uncommitted change. I read the following:

- spec.md (US4, FR-024 to FR-028, FR-036 to FR-038, Edge Cases);
- plan.md;
- tasks.md, phase 5;
- research.md (R-10, R-11);
- contracts/elements-package.md (`ocelle-personal-rail` and the note for #12);
- contracts/checks.md (pairing plants, stand-in rail items, US4-10);
- the constitution;
- operator decisions 1 to 9;
- the phase 4 review;
- every file this phase changed.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | packages/elements/src/ocelle-personal-rail.ts:101-116; research.md:382-386; reviews/phase-5/notes.md:52-73 | The template departs from R-10's horizontal declarations in two ways. (a) `align-self: flex-start` is on both horizontal groups, not only on the bottom group. (b) `flex: 0 1 auto` on the bottom group and `border-block-start: none` on the horizontal divider are left out. I judge both departures against the spec, not against R-10, and both hold. For (a), FR-025 puts the bottom group "at the inline end of the first row", and the primary items run from the first row. With R-10 as written, the primary wrapper stretches to the height that the bottom group's second line creates, and its items centre in that height. I planted R-10's version (the declaration on `.bottom` only). It fails "FR-025, a bottom group wider than half …" in both harnesses (1 in process, 1 on the fixture). For (b), the first declaration is the initial value. The second paints a 1 px corner of the same colour inside the 1 px inline-start border. I added both back, and all 56 rail tests still pass in both harnesses, so leaving them out loses nothing. research.md R-10 still describes the declarations as planned. | None for this phase. At landing, or in a later planner pass, R-10 could be brought in line with the built element, as decision 5 did for R-04. |
| R1-02 | note | specs/011-layout-headers/reviews/phase-5/red-phase.log; gates/test/manifest.test.ts:86,91; gates/test/integration/manifest.test.ts:19; gates/test/integration/storybook-build.test.ts:55; packages/elements/test/node/manifest.test.ts:250; packages/elements/test/build/pack.test.ts:26 | Six of the pinned-list edits that T043a requires pass at red: the "7 elements" counts, the 57-story count, the module paths and the packed file. The scaffold already puts the class's module in the manifest and in the module build, and the red commit already holds the story file, which counts as a test under `test_pathspec`. These edits are bookkeeping, not behaviour tests. Every behaviour test of the phase fails at red: all 28 scenarios in each harness, the manifest declaration test, the entry tests, the build tests, 25 README statements and 24 story tests. | None. |

There are no blocking findings.

## Test quality

**Red/green check.**

- `tdd-check.json` reports `pass` with no problems:
  - base exit 2;
  - scaffold exit 1;
  - head exit 0;
  - one red commit (`phase`, `5d556e3`, exit 1).
- `head` in the JSON is `77911c5`. The only later commit, `fff002c`, adds the check outputs themselves.
- The base run stops with "no test file found", as in phases 2 to 4. The meaningful run is the scaffold run.
- The scaffold `3cda650` adds only `export class OcellePersonalRail extends LitElement {}` and the regenerated manifest. It adds no definition, property, style, template or test file.

**Red evidence.**

- `red-phase.log` has 118 failures out of 3593 tests. Every failure is an `AssertionError`, with no import, load or setup error.
- `check-red-phase.log` and `check-final-tests-on-scaffold.log` list exactly the same failing tests. I compared them by name.
- All 28 rail scenarios fail in both harnesses, the fixture half of US4-7 included. Phase 4's R1-01 asked for that check, and the gap it found does not recur here.
- US4-10 fails on its first assertion, as T041 requires: "the README's ocelle-personal-rail section holds the orientation example's js code block: expected '' to contain 'matchMedia('".

**No weakening.** `git diff 5d556e3..HEAD` touches no test file under `packages/elements/test`, `storybook/test` or `gates/test`, and no story file. The only stories file the green commit adds is the storybook-build plant's copy under `gates/plants/`.

**Assertions.**

- Each scenario returns one observation, and each harness compares it with `toEqual` against an expected value written from the spec in token names.
- There is no conditional assertion, no `skip` or `only`, no snapshot and no mock.
- The `throw`s in the bodies are guards on missing nodes, so a missing node makes the test fail.
- US4-5's `kept` needs a non-empty list of identities, so a rail without a shadow root cannot pass it.
- Each "does not" is paired in the same body with the positive outcome it guards, as the header of `scenarios/personal-rail.ts` lists.

**Coverage of the story.**

| Scenario | Where it is tested |
|---|---|
| US4-1 | its own test |
| US4-2 | both themes, with and without `orientation="vertical"`; the 600 px flex-row and grid containers; the taller-than-container variant in block, flex-row and grid containers; the item colour; the focus ring on every side and inside the border box (in the base.css body, because the ring comes from base.css) |
| US4-3 | LTR and RTL |
| US4-4 | 721, 720, 719 and 320 px, for the viewport and the container |
| US4-5 | focus, document and tab order, the landmark and the nodes kept |
| US4-6 | both orientations |
| US4-7 | LTR and RTL, and with base.css |
| US4-8 and FR-006 | `""` and `"sideways"` beside a horizontal twin; the upgrade case beside the reflecting property |
| US4-9 | both forced-colours palettes |
| US4-10 | the README's code run as a same-origin module, at N and N - 1 |
| US4-11 | the tree read, the host `aria-label` kept, and the fallback to `label` after removal |

The phase also tests the token sentinel, the hidden host and the page border, and the no-event check across mount, slot, orientation and label changes. The rail has no keyboard model of its own. The tab order and the absence of an own tab stop are asserted in US4-5 and paired with the `tabindex` plant.

**The implementer's reported departures, judged against the spec and the contracts.**

- **Two declarations left out; `align-self: flex-start` on both groups.** These are sound, as R1-01 above explains, and my own plants confirm both claims.
- **Driver methods `identities(id)` and `module(code)`.**
  - Both are test plumbing in `test/browser/driver.ts:312-332` and `test/in-process.ts:270-291`, declared in `test/scenarios/driver.ts:187-198`. They add nothing to `src`.
  - `module` serves the README's code as `/module.js` from the page's origin under the fixture's own CSP header, which is what contracts/checks.md asks for US4-10 ("runs it on the fixture page through a same-origin module"). It adds `module.js` to that suite's allowed requests. Any request to that path in a body that does not call `module` has no route and would be a failed request, which `finish()` reports.
  - In process, a blob URL is used. There is no CSP there, and the fixture holds the CSP half.
  - Neither method has a test of its own, but each can make a scenario fail through a plant: `keyed` for `identities`, the README `max-width` rewrite for `module`.
- **Scenarios added before red.** Each new assertion tests something the spec, R-10 or the contracts require.
  - US4-5's node identities test R-10's "the template does not change with orientation" and T044's "template identical in both orientations". Without them, the contract's US4-5 plant (new nodes per orientation) would fail nothing, because Chromium keeps the focus.
  - The bottom group wider than half the content box tests FR-025's "up to half the rail's content inline size, beyond which its own items wrap". No other scenario reached `max-inline-size: 50%` or `justify-content: flex-end`, and each of them now fails only this scenario.
  - US4-3 in a 600 by 200 px container tests R-10's `min-block-size: auto` on the horizontal host.
  - None of them contradicts a spec outcome. All three are in the red commit and failed there.

**Plants (T047).**

- `plants.md` covers all 35 declarations of the template and every contract row that names US4, the rail or its landmark. Each plant fails at least one scenario in both harnesses.
- The CSP plant fails only on the fixture, by design: in process there is no CSP. The control plant fails nothing.
- Phase 4's R1-03 asked plants.md to name the contract row behind each substitute plant. It now has a section, "Which contract row each plant stands for", that names the row of every substitute and every addition.
- The role probe (`role-probe.log`) reads `navigation` for all three hosts on axe-core 4.14.0, and `null` with the internals in a `#private` field.
- I re-ran two plants of my own; see R1-01.

**Mutation.** `pnpm run gate:mutation -- --base 2b1c1ac` reported: "29 mutants on the changed lines of 2 files, none survived; 0 timeouts, 2 compile errors, 1 zero-mutant entry; 1 equivalent record".

- The equivalent record is `ocelle-personal-rail.ts:44`, the `label` property options. `{}` gives Lit's String defaults, the same as phase 4's sidebar. I accept it.
- The compile errors are on lines 164 and 167, and the zero-mutant entry is `src/index.ts`, which only re-exports. These are reports, not findings.
- Stryker does not mutate CSS. The 35 style plants stand in for it.

## Other checks of the phase

**Tasks.**

- T041 to T047 and T043a are all ticked, and each one's work is present.
- T045 names `src/browser.ts`, which needs no change: it imports `./index.ts` (`src/browser.ts:3`), and `build.test.ts` asserts that the browser build defines the rail.
- T043a: the pinned lists were re-listed at the base and recorded in notes.md, and each one this phase's green tasks change was changed in the red commit.
- Outside `packages/elements`, `storybook` and the phase directory, the phase changes these files:
  - the gate tests' counts, in the red commit;
  - the gate plant copies, in the green commit and in `9ad88a8`;
  - `fail-token-changed`'s reason;
  - the decision record.
  notes.md gives the reason for each.

**Constitution.**

- I: the element is named `ocelle-`, its entry point defines only that element (`entry-personal-rail.test.ts`), and it emits no event.
- II: the template reads only tokens. Its non-token values are `100%`, `50%`, `auto` and `0`. The token sentinel shows that every token it reads is followed.
- III:
  - no ID reference crosses the shadow root;
  - the landmark is held in `ElementInternals` under `internalsKey`;
  - the host `aria-label` is never written;
  - the divider is `aria-hidden`;
  - in forced colours the divider is a system colour and the horizontal layout holds;
  - the README states the `<a>` item rule (`color: inherit`, a 24 px target).
- IV: the fixture tests run under the strict CSP with zero violations, no request outside the allowed list and no style attribute. `gate:csp` passes on 24 files.
- V: there is a story for each named state and each US4-11 case, 16 baselines in light and dark, and the visual gate passes.
- VII: the CHANGELOG lists the element, its entry point and its properties as additions.
- VIII: see Test quality.

**Plan, contracts and #12.**

- The manifest declaration lists exactly two members, `label` (not reflected) and `orientation` (reflected, `"vertical" | "horizontal" | undefined`). It lists the slots default and `bottom`, has empty events, parts and CSS properties, and has no internals member. `manifest.test.ts` asserts this.
- That matches contracts/elements-package.md. The README note for #12 (`packages/elements/README.md:440`) says `orientation` and `label` are the whole interface, and the test asserts it.
- Nothing in the rail blocks #12's personal drawer:
  - orientation is pure CSS on the reflected attribute, with no media or container query (the US4-4 plants);
  - a horizontal rail is `inline-size: 100%`, whatever `align-self` is;
  - a page rule on the host's `align-self` wins;
  - the rail styles no item, so `ocelle-nav-item` keeps its own size and density;
  - no event or part has to be removed later, so anything #12 adds is MINOR.
- Phase 4's R1-04 asked for exact README layout statements per container kind. The rail's container-kind sentence (`README.md:460-464`) is FR-036's wording, and the flex-column caveat that phase 4 needed does not apply to the rail: both orientations set an explicit inline size.

**Baselines (operator decision 4).**

- The phase adds exactly 16 PNGs and changes or removes none: `storybook/baselines/elements-ocelle-personal-rail--*.{light,dark}.png`. The directory now holds 114 files, matching the 114 story-themes.
- notes.md records that they were made under docker in #10's pinned container and that no podman comparison was possible. CI confirms them at landing.
- Decision 9 (main merged only at landing) affects nothing in this phase: no merge of main is in the range.

## Checks run

All checks ran at `fff002c` with `OCELLE_CHROMIUM_PATH` set to Chromium 1243 and `OCELLE_VISUAL_ENGINE=docker` (docker 29.9.2, podman absent).

| Check | Result |
|---|---|
| `gate:typecheck` | no type error |
| `gate:lint` | 304 files, no finding |
| `gate:style-lint` | 19 files, no finding |
| `gate:test-lint` | 207 files, no finding |
| `gate:csp` | 24 files, no finding |
| `gate:prefix` | 270 files, no finding |
| `gate:pins` | 5 manifests, no finding |
| `gate:config-copies` | identical |
| `gate:contrast` | 169 pairs in light, 177 in dark (158 required) |
| `gate:brand-rules` | 7 rules checked |
| `gate:manifest` | 7 elements checked, no finding |
| `gate:storybook-build` | built 57 stories |
| `gate:axe` | 114 story-theme runs, 0 serious or critical; 10 notes (0 incomplete, 10 excepted, the Prose document's as before) |
| `gate:visual -- --engine docker` | "114 captures match their baselines (docker only: no cross-engine comparison)" |
| `gate:signoff -- --range 2b1c1ac..HEAD` | 7 commits checked, no finding |
| `pnpm test` | 3593 tests passed in 158 files |
| `gate:mutation -- --base 2b1c1ac` | 29 mutants, none survived (see Test quality) |
| `gate:plants` | every one of the 28 shards of `--plan` was run with `--shard k`, then `--verdict storybook/.visual/plant-shards`: "plants: 301 plants of 17 gates and the registry judged, every plant as expected". The shards ran in two sequential batches (1-3, 16, 20-28, 4-8, then 9-15, 17-19), each reporting "every plant as expected". The verdict mode covers the registry checks over all shard reports. |
| Two plants of my own on `src/ocelle-personal-rail.ts`, each restored afterwards | R-10's `align-self: flex-start` on the bottom group only: 1 failure per harness ("FR-025, a bottom group wider than half …"). R-10's two left-out declarations added back: 56 of 56 rail tests pass. |

## Earlier findings

This is round 1. There is no earlier round of this phase. The two phase 4 notes that were raised for this phase are addressed:

- R1-03: plants.md names the contract row of each substitute plant.
- R1-04: the rail's README statements per container kind are FR-036's and are accurate for both orientations.
