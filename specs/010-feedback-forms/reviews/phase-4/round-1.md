---
phase: 4
round: 1
verdict: approved
base: 835df815b08826710d13a37be17a9baa235bd5f9
head: b6b6791
tdd_check: pass
---

# Phase 4 review, round 1

Scope: `git diff 835df81..b6b6791`, with no uncommitted change. That covers the scaffold `4c73b0a`, the red commit
`43bec71`, the green commits `5908fa7` and `e0b1c77`, the records `723b0f4` and the tdd-check `b6b6791`. I was told
that the phase 3 shard-time gap and the op 017 split are operator decisions (`reviews/phase-3/decision-*.md`), so they
are not findings here. The stub scaffold is the operator's option (a) in `decision-stop-1.md`.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | `packages/elements/test/scenarios/form-select.ts:33`, `packages/elements/README.md:342-385`, `spec.md:369-373` | Read literally, US3-7 (through US2-23) says that the inner control's node is "required" for `required`. Chromium 153 gives a size-1 native `<select>` no `required` state for `required` or for `aria-required="true"`. I measured this on its own (see Test quality). So the select cannot meet that text, and the green change to the test is justified. But the gap is only written down in the test's comment and in the `5908fa7` commit message. The README section on `ocelle-form-select` does not say that Chromium's tree does not announce the select as required, and the spec text is unchanged. | Optional, for phase 5 or the operator: record the limitation in the README's select section (next to "Not measured"). Also add a note to US3-7 that the select's required state is the native select's, so the spec and the test say the same thing. |
| R1-02 | note | `specs/010-feedback-forms/reviews/phase-4/mutation.md:4-5` | The record says "`base.sha` holds `94af87b`, the commit that records it". In fact `base.sha` holds `835df815…`, and `94af87b` is the commit that wrote it. The runs used `--base 835df81`, so the evidence holds; only the sentence is wrong. | Optional: correct the sentence. |

There are no blocking findings.

## Test quality

**Red evidence.** `tdd-check.json` is `pass`. The red commit `43bec71` failed with exit 1 (`red-phase.log`). Every
failure there is an assertion on missing select behaviour: the US3 and US3-7 cells reject with their own `US3-n` or
`US2-n` messages, and the README, CHANGELOG, exports, entry, manifest and gate-count lists fail on missing entries. No
failure is a setup or build error, because the stub scaffold now compiles. The final tests fail against the scaffold
(`check-final-tests-on-scaffold.log`, 148 assertion failures). Against the base they fail on loading
`entry-form-select.test.ts`, which is expected because the module does not exist there. `b6b6791` adds only evidence
files after the checked head `723b0f4`. The scaffold `4c73b0a` adds only `src/ocelle-form-select.ts`: an undefined
class with the four abstract members as neutral stubs and no test file, as the decision says.

**Test changes after red** (`git diff 43bec71..HEAD -- <test pathspec>`):

- **US2-23 body and the `ControlKind` fields `native` and `requiredExposed`** (`test/scenarios/form-input.ts:36-42,
  77-78, 701-751`; `form-select.ts:32-33`). This is a justified correction, not a weakening.
  - I measured it separately with Playwright on the same Chromium 153 binary. `<select required>`,
    `<select aria-required="true">` and `<select required aria-required="false">` all show as `combobox` with no
    `required` property, while `<input required>` and a `size=3` listbox do have `required: true`. So the red
    expectation `required: true` for the select's combobox could not be met by any implementation built on a native
    select.
  - The replacement is stricter. The host-node expectation for the select is now `required: false`. It is tied to the
    native twins (`twins.r` and `twins.rt`), which are mounted and read from the tree in the same run, so if Chromium
    ever exposes the state, the select cell fails and `requiredExposed` has to be revisited. On top of that, the body
    now asserts that `required` and `aria-required="true"` reach the inner control as attributes (`inner.r` and
    `inner.rt`), and since `e0b1c77` it also checks `aria-disabled` on `d` and `dt`, for both kinds.
  - The input's cell is unchanged in meaning: `inputKind.requiredExposed` is `true`, so `r` and `rt` still expect
    `required: true` as at red. The input only gains the inner-attribute and twin assertions. The reason is recorded
    in the `5908fa7` message, as Principle VIII asks.
- **`e0b1c77`, `aria-disabled` read on the inner control.** The mutant `:196 "true" → ""` cannot be seen in Chromium's
  tree, so the attribute read is the observable check that is left. Under ARIA, `aria-disabled=""` is the same as
  undefined (not disabled), so the mutant really changes behaviour for other user agents; this is a real kill, not an
  equivalent mutant. The new rule test (`form-select-rules.test.ts:102-109`) covers the `some` → `every` survivor with a
  batch that holds both a host-attribute record and an option record.
- **Fixture driver key-step reset** (`test/browser/driver.ts:573-574`; new driver test
  `test/browser/driver.test.ts:417-424`). This is a harness fix with no change to any scenario's meaning. In a
  worktree I removed the `keyed = false` line. The new driver test and "US3-7 (US2-16), SC-003 select history restore"
  then both fail (2 failed). With the line back, all three selected tests pass. The reset is sound, because the page
  shown again is a new document. The select restore row is unchanged from red.

**Source workaround for the stale disabled state** (`src/ocelle-form-select.ts:183-186`, the class `off` on the
indicator box follows `effectivelyDisabled()`). In a worktree I removed `off` from the `classMap`. Both "US3-7, US2-11
disabled" and "US3-7, US2-11 fieldset" then fail in process, and the diff shows the tree node `disabled: true` after the
select is enabled and focused. So the workaround is what makes the unchanged US2-11 body pass, and the mutation run
covers it: shard 8 has no survivor. The rule is documented at the line, needs no style and adds no platform feature
(`engine-floor.md`). I could not reproduce the Chromium behaviour with a minimal shadow-root page, but the element's
own tests show it, which is enough.

**Vacuity.** The new bodies use one `assert.deepEqual` on absolute, hand-written outcomes. The native-twin sides are
asserted against the same table, so two empty sides cannot pass. There are no conditional assertions, no `skip` or
`only` and no snapshot-only assertions, and test-lint is clean.

**Coverage.** US3-1 to US3-9, the US3-7 reuse list (scenarios 9, 10, 11, 13, 14, 15, 16, 18, 19, 20, 22 and 23, plus
FR-027, FR-002, the long-text and right-to-left cells), the edge case with no options, the ignored host `value`, the
twins (name, no name, disabled, fieldset, required, reset, `form="other"`, outside any form, history restore and
in-process restore), the event payloads and the keyboard paths (ArrowUp, ArrowDown, typed letter) all have tests.
There are 3 plant rows (US3-4, US3-5, US3-8) in `plants.md`.

**Mutation.** `mutation.md` records the whole-diff run 2 at `e0b1c77`: 154 mutants, none survived, and no equivalent
records. As instructed, I did not repeat the whole-diff run. Instead I ran shard 8 on its own (`--files
packages/elements/src/ocelle-form-select.ts:181-210`, the render template with the workaround and the ARIA
attributes). It exited 0 in 393 s with 18 mutants, none survived, 2 timeouts (`:186`) and 2 compile errors, which
matches the record. The timeouts were applied by hand in `mutation.md` and recorded as kills. The kills that depend on
timing were rechecked in `mutation-recheck.log`.

## Checks run

All at `b6b6791`, with `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`:

- `pnpm run gate:unit-tests`: exit 0, "3914 tests passed in 161 files".
- `gate:typecheck`: no type error. `gate:lint`: 320 files, no finding. `gate:style-lint`: 18 files, no finding.
  `gate:test-lint`: 224 files, no finding.
- `pnpm -r build`, then `gate:csp`: 23 files, no finding. `gate:prefix`: 289 files, no finding.
- `gate:config-copies` identical. `gate:pins`: 5 manifests. `gate:contrast`: 165 pairs in light and 173 in dark.
  `gate:brand-rules`: 7 rules. `gate:manifest`: 5 elements, no finding. `gate:signoff -- --range 835df81..HEAD`:
  9 commits, no finding.
- `gate:mutation -- --base 835df81 --files packages/elements/src/ocelle-form-select.ts:181-210`: exit 0 (above).
- Targeted worktree experiments: the `off` class removed, and the driver `keyed = false` removed (above). The worktree
  is discarded and the main tree was left unchanged.
- I did not run `gate:plants` or the whole-diff `gate:mutation`, as instructed; both are recorded green
  (`plants.md`, `mutation.md`). `gate:storybook-build`, `gate:visual` and `gate:axe` belong to phase 5.

Tasks: T049a to T057 are all ticked and their work is there. `browser.ts` registers the select through `index.ts`, and
the package's `exports` gains `./ocelle-form-select.js` in the pinned order. The changes outside the element are this
phase's own: the gate count tests (T052b) and the manifest plants' copies (T056). The constitution holds: `ocelle-`
names and the composed `ocelle-form-select-change` event, no I/O, token-only styles, shadow-root-local ID references
(`aria-labelledby`/`aria-describedby` inside the shadow root), host ARIA reaching the inner control, and a clean CSP.

## Earlier findings

This is the first round; there are no earlier findings.
