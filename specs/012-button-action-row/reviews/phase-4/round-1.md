---
phase: 4
round: 1
verdict: approved
base: 55ec4105f5ad82f7efbbab81d478b36b75ef98b3
head: 935e14105c2597d85de33dbaff4117dd127ef65c
tdd_check: pass
---

# Phase 4 review, round 1

User Story 3, busy (T041 to T049), reviewed on `git diff 55ec410..935e141` with a clean working tree.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | gates/bin/brand-rules.ts:31, packages/tokens/src/generate.ts:269 | All 8 Timeout mutants of `gate:mutation -- --base 55ec410` are on the `duration` regex: the end anchor dropped (both files), the start anchor dropped (generate.ts), `(?:\.\d)` for `(?:\.\d+)` and `(?:\.\D+)` (both files). No test gives a motion value that is fractional (`1.25ms`), prefixed or suffixed (`x120ms`, `120msx`), so no test tells these mutants from the original. They are not proven killed; they pass only because they time out. R-14 (007 clarifications, 2026-11-10) counts Timeout as killed and asks only that it is listed, so this does not block. | None for this phase. A later change could add one fixture record per shape (a fractional ms duration that must be in the block, and a non-anchored value that must not) to `gates/test/brand-rules.test.ts` and `packages/tokens/test/generate.test.ts`, so these mutants are killed instead of timing out. |
| R1-02 | note | gates/test/integration/plants-robustness.test.ts:179 | The contrast and brand-rules plant pin (35 to 36) belonged in red commit b58c55f (T042a: "any pinned brand-rules plant count in gates/test/integration/ changed first") and was missed. Operator decision (second stop-and-ask, option (a), 2026-11-15) authorised fixing it in its own commit. 08246ac changes exactly that one line (`plants: 35` to `plants: 36`, `others: 15` unchanged) and no other file. The count changes by design because of the new plant `brand-rules/f-motion-spin-missing`. | None. Recorded so the missed pin is visible. |
| R1-03 | note | storybook/baselines/ | The eight busy baselines and the two changed `tokens--motion` baselines were made only in the docker container (2443172) and checked with `gate:visual` under docker. No podman cross-engine comparison was possible here. That is expected per the operator's instruction, and CI confirms at landing. | None in this phase. CI's cross-engine run must confirm the baselines before landing. |

No blocking finding.

## Test quality

**Red evidence.** `tdd-check.json`: `pass`. Red commit b58c55f exits 1. The final tests on base 55ec410 exit 1, and on head (eabc94a, the last commit before the check record) they exit 0. The check record commit 935e141 adds only `tdd-check.json` and the three `check-*.log` files, so the head the check ran on is the reviewed code. No scaffold (`scaffold.sha` absent). `red-phase.log`: 121 of 3579 tests fail. The log has no `SyntaxError`, `Cannot find module`, `ReferenceError` or `TypeError`. Every failure is an `AssertionError` on the missing tokens, rule (f), stories or busy behaviour, or the driver's `no .spinner svg in the shadow root` (the missing spinner). So the tests fail on missing behaviour, not on setup.

**Replacements in the red commit (base..b58c55f).** Each one listed in notes.md was checked in the diff:
- `generate.test.ts`'s "exactly two" is kept on the two-duration fixture. A stricter case is added: `motion-spin`, `motion-turn`, an easing, another group's duration and a further motion duration give exactly the motion durations in source order, and a source without `motion-fast` gives only `motion-base`.
- The empty-source expectation now expects an empty block. Plan decision 29 requires that value, so the change is by design and is not a loosening.
- `values.test.ts` keeps the easing check, adds `motion-spin` and pins `motion-turn` at `360deg`.
- In `brand-rules.test.ts`, the three message-bearing rule (f) cases keep their inputs and locations under the new message, and four cases are added.
- The pinned counts (48 stories, 96 story-themes, 98 axe plant-repo runs, 229 other plants) are pinned higher.
- `manifest.test.ts` adds `busy` to the exact member lists.

**After the red commit (`git diff b58c55f..HEAD`, test pathspec).** Three files changed: `packages/elements/test/scenarios/busy.ts` (d13cb2c), `gates/test/integration/plants-robustness.test.ts` (08246ac) and `storybook/stories/button.stories.ts` (the four busy stories of T048, implementation that the red story tests asked for).

d13cb2c was checked against the operator's authorisation (option (a), 2026-11-15) line by line:
- `driver.reducedMotion("reduce")` is added before the spinner is measured in US3-7 (busy.ts:183), US3-3 (busy.ts:251), US3-4 (busy.ts:284) and the edge case "both disabled and busy" (busy.ts:425).
- US3-5 (busy.ts:324-333) measures size, side, gap and `intersect` under reduced motion. Before that it takes five reads 150 ms apart with motion allowed and expects each `intersect` with the label to be `false` (`turning`, busy.ts:338). That is an added assertion, so the test is stricter.
- "Busy look" (busy.ts:534-535) mounts inside a `.ground` with the canvas and ink rule.
- **No expected value changed.** Every `expected` block is byte-identical to b58c55f. The only change to an expected block adds the `turning` key, and the scenario name gains only "still or turning".
- US3-6 and US3-9 still read the animation with motion allowed (`ocelle-spin`, `4.8s`, `1`, `linear`, `none`, and the end pose equals the reduced pose). The motion behaviour is therefore still tested.
- The `turning` reads are not vacuous. Both harnesses start each body with motion allowed: in process, the `afterEach` `emulateForcedColors("none")` resets to `no-preference` (commands.ts:163). The fixture opens a fresh page per test. The "spinner over the label" plant fails US3-5 in both directions (plants.md).

08246ac changes the one pin only (R1-02).

**Vacuity.** Every body returns observed values compared with `toEqual` against hand-written expected values, and each ends with axe. I found no `skip`/`only`, no conditional expect, no assertion on a mock and no swallowed error. `gate:test-lint` reports no finding in 190 files. Each "does not" outcome is paired with its positive twin and has a plant. plants.md records 13 element plants, each failing between 1 and 21 tests, including the three T041 names: guard limited to unavailable, spinner over the label, `animation: none` removed. It also records the gate plants `f-motion-not-zero`, `f-motion-spin-missing` and `visual/fail-token-changed`.

**Coverage of the story.** US3-1 to US3-11 each have a body. US3-1 covers pointer, Enter, Space and `click()`. US3-2 covers focus kept and Tab/Shift+Tab order. US3-8 covers plain, Ctrl, Meta, Shift, Alt, middle click and Enter on a busy link, in shared, sink and fixture bodies. The edge cases (both disabled and busy; busy removed while the pointer is down) and decisions 9, 11, 23 and 26 are covered.

**Mutation** (`pnpm run gate:mutation -- --base 55ec410`, run by me): "115 mutants on the changed lines of 6 files, none survived; 8 timeouts, 32 compile errors, 0 zero-mutant entries; 0 equivalent records".
- The 8 timeouts are all on the duration regex (R1-01).
- The 32 compile errors are type-rejected mutants, for example `record.group === ""` (no overlap with the group union) and `true && …` (TypeScript's always-truthy check). They are reported, not blocking. The "other group's duration" path they would have exercised is still asserted directly: the `delay-other` record in generate.test.ts, and the brand-rules case "a duration of another group is neither required nor accepted".
- No Timeout on the spinner or the guard, which R-14 had expected might occur.

**Operator-flagged items.**
- *Duration-regex timeouts:* acceptable under R-14 as recorded; R1-01.
- *The two `tokens--motion` baselines:* I compared the base and head light PNGs. The only change is the two added rows `--ocelle-motion-spin 800ms` and `--ocelle-motion-turn 1turn`, between `motion-base` and `easing-standard` in source order. This is the change T045 intends. `gate:visual` matches 96 captures.
- *Manifest plant copies:* I compared each of the seven `fail-*` copies against the regenerated `packages/elements/custom-elements.json`, at base and at head. Each copy's planted difference is identical before and after, so only the `ocelle-button` entry (busy attribute and field, the class, slot and event descriptions) moved, as in the real manifest. `pass-reordered` is canonically equal (keys and arrays sorted) to the real manifest. `fail-stale-property` (an `ocelle-icon` source tree) and `pass-repository` need no copy. Every manifest plant judged "as expected" in shards 1 to 3.

## Checks run

All on 935e141, one heavy job at a time, docker running, `OCELLE_VISUAL_ENGINE=docker` where it matters:

| Check | Result |
|---|---|
| `pnpm test` | 3579 tests passed in 149 files (exit 0) |
| `gate:typecheck` | no type error |
| `gate:lint` | 283 files, no finding |
| `gate:style-lint` | 15 files, no finding |
| `gate:test-lint` | 190 files, no finding |
| `gate:config-copies`, `gate:prefix`, `gate:pins`, `gate:csp` | no finding (CSP 13 files) |
| `gate:signoff -- --range 55ec410..HEAD` | 11 commits, no finding |
| `gate:brand-rules` | 7 rules checked, 0 findings |
| `gate:manifest` | 3 elements, no finding |
| `gate:contrast` | 193 / 201 pairs (182 required per theme) |
| `gate:storybook-build` | built 48 stories |
| `gate:visual` | 96 captures match (docker only: no cross-engine comparison) |
| `gate:axe` | 96 story-theme runs, 0 serious or critical; 10 notes (10 excepted) |
| `gate:mutation -- --base 55ec410` | exit 0; see Test quality |
| `gate:plants -- --shard 1/2/3` | 77, 76, 76 plants judged, every plant as expected (includes every `brand-rules/*` and `manifest/*` plant, `f-motion-spin-missing` and `f-motion-not-zero`) |
| `gate:plants -- --shard 40` | `visual/fail-token-changed`, 1 plant judged, as expected (151.7 s) |

The other 72 plant shards were not rerun by me; notes.md records all 76 passing. This phase changes no plant in them other than the shard-40 plant above.

**Tasks.** T041 to T049 are all ticked, and the work is present:
- tokens `motion-spin` and `motion-turn` (source.ts:257-258);
- the generator block over the motion durations (generate.ts:268-294);
- rule (f) over the source (brand-rules.ts:191-218);
- the new plant and the README row;
- `spinner.ts` (inline SVG, `currentColor`, `aria-hidden`, `rotate` six turns over `motion-spin` times six, `animation: none` under reduced motion);
- `controlState` and the busy wiring in `ocelle-button.ts` (`aria-busy`, `aria-disabled`, link without `href` and with `tabindex="0"`, icon wrapper hidden, disabled wins, host guard and `#activate` on `state === "available"`);
- stories, baselines, README, CHANGELOG and the manifest.

Nothing outside the phase changed.

**Constitution and plan.**
- `ocelle-` names.
- No I/O in elements.
- Tokens only. The spinner uses `--ocelle-icon-size`, `--ocelle-space-2`, `--ocelle-motion-spin` and `--ocelle-motion-turn`.
- Rule (f) follows plan decision 29: every `motion` record whose value is an `ms` duration is required at `0ms`, read from the source, and the message names the motion durations.
- Accessibility: focus kept, `aria-busy`/`aria-disabled`, the spinner `aria-hidden`, forced colours via `currentColor`, the 4.8 s stop within WCAG 2.2.2, still under reduced motion.
- Strict CSP: `gate:csp` passes, and the SVG uses presentation attributes and no `style` attribute.
- One story and baseline per state, under axe.

## Earlier findings

None: this is round 1.
