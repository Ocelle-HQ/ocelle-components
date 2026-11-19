---
phase: 6
round: 4
verdict: changes_requested
base: ac2eebe229dc860390ba4ba1c69ff1725fe8b1fe
head: 8fd8c47
tdd_check: pass
---

# Phase 6 review, round 4

Scope: the landing fold of operator round 3 (O3-01, landing L1-01), task T115. Commits `cafa4ba` (tasks, R-15
amendment), red `ca18374`, green `96dd714`, records `857cd29`, tdd-check `8fd8c47`. I did not write this code.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R4-01 | blocking | specs/014-selection-input/reviews/phase-6/plants.md:137-149 | The gate plant record's base is `ca18374^` (`cafa4ba`), not `base.sha` (`ac2eebe`). The selection differs too. `pnpm run gate:plants -- --affected ac2eebe229dc860390ba4ba1c69ff1725fe8b1fe --list` gives `note: affected: every plant, by gates/bin/plants.ts (shared gate source)`, because the landing merge of main lies in the phase range and changes the gate source. The record judges 0 of 314. The review procedure (step 5, Plants) makes "another base" and "a different selection" blocking. T115 step 5 (tasks.md:374) told the implementer to use `--affected <fix-3 red sha>^`, so the implementer followed the task. The conflict comes from the task. Phase 7 hit the same conflict (phase 7 round 3 R3-01), and the operator settled it there with phase 7 decision 3. That decision covers phase 7's fix-2 only, and phase 6 has no matching decision. The round-scoped run itself is right: `--affected 'ca18374^' --list` selects 0 of 314, the same as the record. | Either record in `plants.md` a plant run against `base.sha` with exit 0 (`--affected ac2eebe…`, or the full `gate:plants`, which judges the same 314 plants), or record an operator decision in `reviews/phase-6/operator-decisions.md` that accepts the round-scoped base for this fold, as phase 7 decision 3 did. Under that decision the full run owed after the second merge of main (landing L1-06) would stand for phase 6 too. Keep the `ca18374^` run as supplementary evidence. |
| R4-02 | note | specs/014-selection-input/reviews/phase-6/tdd-check.json; check-final-tests-on-scaffold.log; check-final-tests-on-base.log | Against the base and the scaffold the final tests now exit 2: "unit-tests: could not run: no test file found". Before, the scaffold run exited 1 with a real failure (`c77845e`, round 2's check). Exit 2 is a collection error, not a behavioural failure, so the scaffold leg of the check is now vacuous. `notes.md` explains why correctly: since the merge, the final test set includes main's test changes, and on the pre-merge scaffold no file is collected. The fold did not cause this. The scaffold's behavioural proof stands in the earlier check, and both red commits are proven on their own (`phase` and `fix-3`, exit 1 with assertion failures). | None for this fold. Worth raising with whoever owns `tdd-check.sh`: an exit 2 "no test file found" should count as `unavailable`, not as "fails". |
| R4-03 | note | specs/014-selection-input/reviews/phase-6/notes.md (Landing fold, "The red/green check") | `tdd-check.sh 6` passed only on its third run. The first two runs each failed one mission 008 motion row, "Rapid toggle during the entry, motion on" (`browser/dialog.test.ts`, then `browser/drawer.test.ts`), with `entry: []`. Calling it a flake is credible: the row is outside this fold, it passed alone and in a full `elements-browser` run, and nothing in the fold touches dialog, drawer or motion. It is still a timing-sensitive row that can turn CI red, and it is not tracked anywhere outside this phase's notes. | Record it for mission 008 (an issue or the landing records) so that a red CI run on it is not mistaken for a T115 regression. |
| R4-04 | note | packages/elements/test/browser/link-subpixel.test.ts:30-35, 61-76; subpixel/fonts.conf:10 | The precondition depends on the platform. It needs Linux fontconfig (`/etc/fonts/fonts.conf`, `ignore_missing="no"`) and a browser that honours LCD text. On a macOS or Windows Chromium, or with `OCELLE_CHROMIUM_PATH` pointing at the `chrome-headless-shell` wrapper, it fails hard. I confirmed the wrapper case: "expected 0 to be greater than 0", with the cause named in the message. That is the intended design: it fails loudly, never passes vacuously. The project's documented environments are this container and CI, both Linux, and the message points to quickstart.md:7. | None. Mention it in quickstart if a non-Linux contributor environment is ever supported. |
| R4-05 | note | tasks.md:343 (T115) | T115 stays unticked until CI on the fold's head (`8fd8c47` or later) is green: Unit tests, every Mutation shard and the Mutation testing aggregate (L1-02). Its run id and job results go into `notes.md` "CI (to be recorded after the push)". This review cannot judge that run. | After the push, record the CI run and tick T115. |

## Test quality

**Red is genuine.** I re-ran `ca18374` in a separate scratch worktree (`vitest run --project elements-browser
packages/elements/test/browser/link-subpixel.test.ts`, chrome-linux64/chrome): 1 failed, 1 passed. The precondition
passes. The one diff hunk is `ring`, expected `[true, true]`, received `[false, true]` (the left side), at
`link-subpixel.test.ts:94`. There is no load, launch or setup error. `red-fix-3.log` agrees: 1 of 8009 tests failed, and
the only failure is this US5-7. The red commit adds test files only: the suite and `fonts.conf`.

**Precondition: false pass and false fail.**
- False pass: grayscale antialiasing of black on white gives r = g = b at every pixel, so a channel spread above 8
  cannot come from grayscale text. The sample is plain Latin text with no emoji or colour font. The threshold leaves
  room for colour-profile rounding, so a false pass would need a browser that tints grayscale text, which none does.
- False fail: I checked the cases above (R4-04). The fontconfig path is absolute, from `import.meta.url`
  (`link-subpixel.test.ts:25`), so it does not depend on the working directory. With no `OCELLE_CHROMIUM_PATH`, CI uses
  Playwright's own headless shell with `FONTCONFIG_FILE`. `notes.md` shows the precondition passing in the Playwright
  1.64.1 Docker image under exactly that launch.
- The precondition only gates; it does not stand in for US5-7. If US5-7 were found by no name, `bodies.length` is
  asserted `toBe(1)` before the `if (body === undefined) return;` guard (`:86-87`), so that test cannot pass vacuously.

**Strictness kept.** `git diff ca18374..96dd714 -- packages/elements/test/` changes only US5-7's `mount` call: it adds
`"#link { margin-inline: 0.75em; }"` through `mount`'s existing `rules` parameter (`link.ts:73`), plus comments. These
are unchanged: `expected`, `ringPixels` (`link.ts:306-318`, still 3.5 px out from each fragment's own rect),
`colourAt`, `over` and the exact string comparison. The margin moves the rects and the samples together and puts the
neighbouring glyphs 12 px away. The suite added in red was not changed after red.

**Planted wrong ring still caught.** In a scratch worktree at `8fd8c47`, under the subpixel suite:
- `outline-color: Highlight` replaced by `outline: none` in the forced-colours block (`ocelle-link.ts:92`): US5-7
  fails with `ring` `[false, false]`.
- The colour-only swap to `var(--ocelle-color-focus)`: US5-7 passes.

The source was restored, and the worktree was removed afterwards.

**Is the colour-only swap equivalent?** Yes. The swap passing while the test compares the ring pixel exactly with
`over(Highlight, Canvas)` shows that Chromium painted Highlight anyway. CSS Color Adjustment Level 1 lists
`outline-color` among the properties forced to system colours in forced-colours mode, unless `forced-color-adjust:
none`. The `forced-color-adjust: none` plant bites (plants.md row, and phase 6's original plant table). So there is no
observable difference to test, and correcting the plant comment (`link.ts:541-544`) is the right fix, not a weaker one.

**Placement and gates.** The suite sits under `packages/elements/test/browser/`, which belongs to `elements-browser`
(`vitest.config.ts:190-194`). It is excluded from the in-process `elements` project (`elementExcluded`, `:78`), and so
from Stryker's runs (`vitest.mutation.config.ts:38`; the elements mutation config covers only `elements` and
`elements-touch`). Its own launch follows the `scrollbar.test.ts` pattern and changes no shared launch, `serve.ts` or
`vitest.config.ts`. `fonts.conf` is not a test file, and test-lint checks 348 files with no finding. No gate plant is
affected (R4-01 covers the base question only).

**Deviation: the relative `FONTCONFIG_FILE`.** The explanation is sound: fontconfig resolves a relative
`FONTCONFIG_FILE` against its configuration directory, so T115 step 3's relative command loaded nothing and drew
grayscale. That is why the red-commit run "passed". The committed suite always used the absolute path, as step 1
said. The deviation affects only the manual step 3 runs, which are recorded with `$PWD/…`.

**Mutation.** Not run by me. The fold changes no source file. The phase's mutation record (`mutation.log`) stands, and
L1-02 (mutation shards red because US5-7 failed in the in-process project) is CI's check (R4-05). I confirmed that
in-process US5-7 now passes under subpixel text: `FONTCONFIG_FILE=$PWD/…/fonts.conf vitest run --project elements
packages/elements/test/link.test.ts -t US5-7` gave 1 passed, 18 skipped.

## Checks run

All with `OCELLE_VISUAL_ENGINE=docker` and, unless stated, `OCELLE_CHROMIUM_PATH=…/chromium-1243/chrome-linux64/chrome`.

| Command | Exit | Result |
|---|---|---|
| `vitest run --project elements-browser …/browser/link-subpixel.test.ts` at HEAD | 0 | 2 passed |
| same at `ca18374` (scratch worktree) | 1 | 1 failed (US5-7, `ring` left `false`), 1 passed (precondition) |
| same with `OCELLE_CHROMIUM_PATH` = the `chrome-headless-shell` wrapper | 1 | precondition fails with the cause named; US5-7 passes (grayscale) |
| `FONTCONFIG_FILE=<abs fonts.conf> vitest run --project elements …/link.test.ts -t US5-7` at HEAD | 0 | 1 passed, 18 skipped |
| plant: ring removed in forced colours, subpixel suite (scratch worktree) | 1 | US5-7 fails, `ring` `[false, false]` |
| plant: ring colour swapped for the token only, subpixel suite (scratch worktree) | 0 | 2 passed (equivalent, see above) |
| `pnpm run gate:typecheck` | 0 | no type error |
| `pnpm run gate:lint` | 0 | 476 files, no finding |
| `pnpm run gate:test-lint` | 0 | 348 files, no finding |
| `pnpm run gate:plants -- --affected ac2eebe… --list` | 0 | every plant (shared gate source changed by the merge), 314 of 314 selected: differs from the record (R4-01) |
| `pnpm run gate:plants -- --affected 'ca18374^' --list` | 0 | 0 of 314 selected, matching `plants.md` |

I did not run the full `pnpm test`, visual, axe or mutation gates, to keep this light. The implementer's `pnpm test` at
`96dd714` (8009 passed) and `tdd-check.sh 6` at `857cd29` (HEAD exit 0, 8009 passed) are recorded. `8fd8c47` adds only
review records. CI on the pushed head is the remaining check (R4-05).

**Diff of the fold.** `git diff fec463e..8fd8c47 --stat` touches only `test/browser/link-subpixel.test.ts`,
`test/browser/subpixel/fonts.conf`, `test/scenarios/link.ts` (US5-7's mount and comments), `research.md` (R-15
amendment), `tasks.md` (T115) and the phase 6 review records. There is no element source, baseline, `vitest.config.ts`
or `serve.ts` change.

**Constitution.** The fold adds no element code, no I/O and no network. The test serves its fixture from the local
server only (`recorded` must equal `clean`). The accessibility behaviour under test (Highlight ring and LinkText in
forced colours) is unchanged and still pixel-checked.

## Earlier findings

- **O3-01 (blocking, operator round 3): resolved in code and tests; CI pending.** The red is in a CI-like subpixel
  setup and fails on US5-7's assertion unchanged (verified above). The spacing is the operator's one-line change with
  its comment (`link.ts:548-551`). US5-7 passes with grayscale, subpixel and Docker launches in both harnesses
  (`notes.md` table; I re-checked subpixel in both harnesses). A planted wrong ring still fails it (verified). The
  `red-commits` file has the `fix-3 ca18374…` entry. The remaining part of O3-01, "a green CI run, including the
  mutation shards", is outstanding (R4-05).
