---
phase: 1
round: 1
verdict: changes_requested
base: 30e513065d010f5c6ffcb81db0e0b83e79cacc0f
head: b3f8d5606e1fe7cda5bd51e2e16b6a2d1ba48e43
tdd_check: pass
---

# Phase 1 review, round 1

Scope: `git diff 30e5130..b3f8d56` (no uncommitted change), User Story 1, `ocelle-facts` and `ocelle-fact`, tasks
T001 to T021a. Operator decisions applied: I3, `operator-decisions.md` ("Try dockerd first"),
`operator-spike-decisions.md` ("(a) Defer + 2-frame wait", "Widen the margin"), `operator-plant-decisions.md`
(T021 plant decision (b) "Add test, keep R-03").

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | specs/013-data-display/contracts/checks.md:343; specs/013-data-display/tasks.md:294 | The operator's decision (b) redefines the "value column never widened" plant as "the value track `1fr` and the `<dd>`'s `min-inline-size: 0` removed", guarded by the new unbroken-value body (operator-plant-decisions.md; plants.md § Resolution). The CSS-only behaviours table still names the old plant and the old guard: "value column never widened \| US1-3 \| plant: `minmax(0, 1fr)` replaced by `1fr`", and T021 step 1 lists the same plant. plants.md proves that plant does not bite (all 53 bodies pass). So the contract, which future plant runs follow, names a plant that is known to pass and a body that does not guard it. The redefinition is recorded only in the phase's review notes. | Update the row at checks.md:343 to the redefined plant (`1fr` on the value tracks plus the `<dd>`'s `min-inline-size: 0` removed), with the unbroken-value body (600 px, a 64-character value without `wrap`) as its body, and record the two single-rule changes as equivalent (each rule alone keeps the column, as plants.md measured). Align T021 step 1's plant list in tasks.md:294. Documentation only, so no red commit is needed. |
| R1-02 | note | packages/elements/src/ocelle-facts.ts:198, 238, 243, 247, 276, 308 | `// Stryker disable next-line <Mutator>` turns off every mutant of that mutator on the line, not just the equivalent one. I ran the gate on a scratch copy with all 16 records removed (`--files` on the two element files): exactly 18 mutants survived, and each one is a direction a record calls equivalent. By statement line at HEAD: 199 `false`; 221 to 233 the cleanup; 239 and 241 `true`; three `true` on 244; 248 `true`; 253 `true`; 277 `false`; 279; 309's `size >= threshold` → `true`; and ocelle-fact.ts:84 `true`. The other directions on those lines were all **killed**: 199 `true`, 244's four `false`, 248 `false` and `{}`, 253 `false`, 277 `true`, and on 309 the whole condition as `true`/`false`, `\|\|` and the boundary mutants. So no record hides a survivor, but the committed gate run never executes those killable mutants. | None for this phase. If Stryker records are added later, a comment that names the equivalent direction (as these do) is the minimum. |
| R1-03 | note | packages/elements/src/ocelle-facts.ts:219-232 | The disconnection cleanup is recorded as equivalent: DOM-unobservable, which the stripped run confirms (the BlockStatement mutant survives all 3429 tests). Without it, a removed sheet would stay referenced by the `window` `resize` listener. That is resource retention, not behaviour, and the code does remove the listener. | None. |
| R1-04 | note | packages/elements/test/scenarios/facts.ts (US1-19 and FR-011 bodies) | Spec US1-19 says "the link keeps its own tab stop", and FR-011 says the element adds no tab stop. Neither body presses Tab. Both read the link as an AX `link` node and place its box inside the value box or cell. That matches the plan: contracts/checks.md § "Bodies that the platform alone could pass" marks the link's tab stop as a light-DOM outcome, and the `pressTab()`/`focused()` driver additions are scheduled for phase 2 (checks.md § Driver additions). | None for this phase. Phase 2 could add a Tab read to the facts link body once `pressTab()` exists. |
| R1-05 | note | storybook/baselines/elements-ocelle-facts--stacked.{light,dark}.png, ...--stacked-wide.{light,dark}.png | The "Stacked (300 px)" and "Stacked in a wide host" baselines are byte-identical (same md5 in both themes). Both stories are in R-08's list, and stacked content narrower than 300 px captures the same way. So the visual gate cannot tell the two stories apart. Behaviour (forced `stacked` in a wide host) is covered by US1-11's `block` sheet. | None required. |
| R1-06 | note | specs/013-data-display/research.md:249 | R-02 still says the hook is "set by default in `:host`". The element reads `var(--ocelle-facts-stack-below, calc(var(--ocelle-space-10) * 6))` on the probe instead (ocelle-facts.ts `.probe`), for the reason in notes.md: a `:host` declaration would beat a value set on an ancestor. contracts/elements.md:41 and data-model.md:37 (default 24rem from tokens, fallback for a percentage, 0 or an invalid value) are met, and the README states it. | Optional: bring R-02's sentence in line when R1-01's documentation fix is made. |
| R1-07 | note | gates/plants/visual/fail-token-changed/plant.json:3 | In `why`, "the twelve the phase 1 spike listed the eight of mission 005's stories" is missing its separator ("listed, the eight"). | Optional. |

## Test quality

- **TDD check.** `tdd-check.json`: `pass`, base 30e5130, one red record `phase` (935ac40, exit 1). Final tests on
  the base exit 2 and on the scaffold exit 1, HEAD exit 0, no problems. `head` in the JSON is 1f8c1cd. The only later
  commit, b3f8d56, adds that JSON and its logs.
- **Red evidence.** `red-phase.log` holds 300 `AssertionError` failures and no import, syntax or setup error. Spot
  checks: the styles hooks and pre-upgrade bodies, the build test's shipped tracks, the facts bodies. The tests that
  pass at red are the ones notes.md lists: the driver additions' own tests, plus the exports and container imports
  the scaffold already provides. This matches contracts/checks.md § Scaffold and § Driver additions.
- **Scaffold (b244f4b).** Touches only `ocelle-facts.ts`, `ocelle-fact.ts`, `index.ts` and `package.json`: declared
  properties, `define`, `@tagname`, a `render()` returning `nothing` or empty, and no test file. The final tests
  fail against it (exit 1, `check-final-tests-on-scaffold.log`). The constitution VIII exemption for the scaffold
  holds, since nothing in it can fail a test.
- **Nothing weakened after red.** `git diff 935ac40..HEAD` on the test pathspec contains only insertions (209 lines,
  0 deletions):
  - the stories (green, per R-08);
  - 4 stricter `token-only` cases (comments inside the allowed functions, and `max(0, 1fr)` and `minmax(0 / 1fr)` as raw);
  - the in-process reconnection test;
  - seven facts bodies: the unbroken value, a standalone fact without a label, aria-hidden/lang/dir after render,
    the content box, the threshold boundaries 383/384/767/768, a moved sheet's hook, and a plant-tree story copy.
  These later bodies test behaviour the green source already had, so they could not be red. Their non-vacuity is
  shown another way: the unbroken-value body fails under the redefined plant (plants.md), and the others kill named
  mutants (the stripped mutation run above: only the 16 recorded directions survive). The operator's decision
  mentioned a `fix-1` red commit "before any change that makes it pass". No such change was needed, so leaving out a
  red record is consistent with Principle VIII and with tdd-check.
- **Assertions.** Each in-process test and each fixture test asserts one `toEqual` against a hand-written `expected`.
  The fixture harness also asserts the page's CSP/request/console record (`clean`) in the same assertion. Every
  "does not" outcome is paired in its body: no overflow with `inside`, no pairs with one added, no loop error with a
  synthetic `ErrorEvent` the recorder sees, unpainted with a painted sibling, and the stacked/columns pairs. I found
  no `skip`/`only`, no conditional assertion, no snapshot, no swallowed error; `gate:test-lint` agrees. The
  `throw new Error("no sheet")` guards in the reconnection test fail the test rather than skip it.
- **Coverage of the story.** US1 scenarios 1 to 19 each have a named body. The extra bodies of contracts/checks.md
  are all present: no pairs, long label, dynamic, hidden, lang/dir, RTL, 640 px, standalone wrap, move in/out,
  non-fact child, the seven shrink-to-fit hosts, resize, hook fallbacks and probe overflow, valid hooks, hook change,
  compact region, unset attributes, the grid extras, the unobserved changes for two columns and grid. The no-loop-error
  test (T006a) runs in process. The element emits no event and has no keyboard model (FR-011); the tab-stop clause
  is R1-04.
- **Plants.** plants.md records each plant of T021 step 1 and T021a once. Every plant bites except the
  `minmax(0, 1fr)` → `1fr` plant, which went to the operator. Under decision (b) the redefined plant bites (the
  unbroken-value body fails, 52 pass). The contract does not yet reflect this (R1-01).
- **Mutation.** `pnpm run gate:mutation -- --base 30e5130` (this review, 5 min 57 s): `mutation: 300 mutants on the
  changed lines of 4 files, none survived; 0 timeouts, 66 compile errors, 1 zero-mutant entry; 16 equivalent
  records`. The 66 compile errors are TypeScript strict rejections (for example `hook !== undefined && hook > 0 ||
  Number.isFinite(hook)`, `slots[at].assign`), and the zero-mutant entry is `src/index.ts` (exports only); both are
  reports, not findings. I read each of the 16 records:
  - ocelle-facts.ts:198, the frame-coalescing guard → `false`: extra frames each run the idempotent pass.
  - 220 to 232, the disconnection cleanup (block, `super`, both `disconnect()`s, `cancelAnimationFrame`, the
    listener's event name): only affects a sheet out of the document; reconnection renders and measures again.
    `super.disconnectedCallback()` only reaches reactive controllers and `setConnected` on async directives, of which
    the element has none.
  - 238 and 240, the `render`/`measure` initial values → `true`: a render always measures in `updated()`, and the
    observer never delivers an empty record list.
  - 243 and 247, a record or `render` → `true`: rendering re-creates the same pairs and then measures.
  - 252, `measure` → `true`: an extra idempotent pass.
  - 276 and 278, re-observing an already observed probe only queues another initial callback.
  - 308, `cols-2`'s `size >= threshold` → `true`: below T `cols-1` is also set, and its rule comes later at the same
    specificity, so the layout is one column either way.
  - ocelle-fact.ts:83, the initial `#inSheet` → `true`: `connectedCallback` sets it before the first render, which is
    its only reader.

  The stripped run (R1-02) confirms each of these survives every test, and that every non-equivalent mutant on the
  same lines is killed. The reasons hold, and no record is a disguised survivor.

## Checks run

All on HEAD b3f8d56 in this container with `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`,
and `OCELLE_VISUAL_ENGINE=docker` for the visual, axe and plants gates.

| Check | Result |
|---|---|
| `pnpm test` | `unit-tests: 3429 tests passed in 145 files` (7 min 46 s) |
| `gate:typecheck` | `typecheck: no type error in the files of tsconfig.json` |
| `gate:lint` | `lint: 281 files checked, no finding` |
| `gate:style-lint` | `style-lint: 14 files checked, no finding` |
| `gate:test-lint` | `test-lint: 189 files checked, no finding` |
| `gate:manifest` | `manifest: 4 elements checked, no finding` |
| `gate:prefix` | `prefix: 221 files checked, no finding` |
| `gate:csp` | `csp: 12 files checked, no finding` |
| `gate:contrast` | `contrast: 160 pairs checked in light, 168 in dark (149 required per theme)` |
| `gate:storybook-build` | `storybook-build: built 43 stories` |
| `gate:visual` | `visual: 86 captures match their baselines (docker only: no cross-engine comparison)` |
| `gate:axe` | `axe: 86 story-theme runs, 0 serious or critical; 10 notes (0 incomplete, 10 excepted)` (the 10 are the existing base-styles prose-document exceptions; no `a11y-exceptions.json` entry added) |
| `gate:mutation -- --base 30e5130` | as above, exit 0 |
| `gate:plants` (full, all shards) | `plants: 304 plants of 17 gates and the registry judged, every plant as expected` (97 min 58 s, `OCELLE_VISUAL_ENGINE=docker`) |

On the implementer's partial plant re-run: I ran `gate:plants` in full on HEAD myself (above), so the question of
running only shards 1 to 3 and 16 after the last source change no longer applies. (That change was the Stryker
comments and the `else if` split in `#mutated`.)

The visual gate is docker-only here, with no podman cross-engine comparison. Per `operator-decisions.md` and
`storybook/README.md` § Baselines, CI's "Visual regression" captures are the record. The 44 committed baselines are
twice the 22 facts stories, and `gate:visual` matches all 86 captures.

Plant fixture edits under `gates/plants/**`, judged against the repository:
- Each of the eight `manifest` plant trees gained exactly the two facts declarations of
  `packages/elements/custom-elements.json` (the added lines are identical for the seven `fail-*` trees).
  `pass-reordered` carries them reordered, as that plant requires.
- The two `style-lint` element-property plant manifests declare the three facts hooks the source references.
- The three new style-lint plants (`pass-grid-fit-content`, `fail-fit-content-length`, `fail-minmax-auto`) are
  exactly the ones research R-10 names.
- `storybook-build/fail-empty-index` also empties the facts story file.
- `visual/fail-token-changed` lists the 22 light facts story-themes, as its `why` asks a later story to do.

None of these weakens a plant: each keeps the plant's defect and only brings its tree up to the repository.

Constitution:
- **I.** `ocelle-` names, no event, no I/O. The copy oracle is in the driver, not the element.
- **II.** Tokens only (`gate:style-lint`, with R-10's recorded allowance), and no monospace (US1-5 asserts it).
- **III.** No ID references, forced colours (US1-8), axe clean, contrast unchanged.
- **IV.** Adopted styles only, `gate:csp` clean, and the fixture bodies assert no outside request.
- **V.** 22 stories with light and dark baselines. `ocelle-fact` alone has no story, per the plan's Complexity
  Tracking row (R-08).
- **VII.** CHANGELOG entries in `@ocelle/elements` and `@ocelle/styles`.
- **VIII.** As above.

Plan: the file layout and decisions match plan.md and research R-01 to R-03, R-07, R-10 and R-11. notes.md lists the
departures, and each is justified and keeps or strengthens the contract:
- the extra driver readers;
- no new Vitest command;
- `copy` returning the pasted `text/plain`, which is the same oracle measured where the event's own `clipboardData` is
  empty;
- the hook as a `var()` fallback (R1-06);
- the styles test file name;
- the stacked gaps.

## Earlier findings

None: this is round 1.
