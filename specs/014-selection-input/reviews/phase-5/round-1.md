---
phase: 5
round: 1
verdict: changes_requested
base: 75965e1d4f4051b72a9c93cde9501f03b2a86a53
head: 575d3515efab1dd0ac956d162036470c300e74cb
tdd_check: pass
---

# Phase 5 review, round 1

User Story 4, `ocelle-copy-field` (T075 to T084), `git diff 75965e1..575d351`. There were no uncommitted changes.
`575d351` adds only the red/green check's evidence on top of `edec508`, the head `tdd-check.json` names.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | `packages/elements/test/scenarios/copy-field.ts:456-491` (US4-5), `:857-879` (FR-042 Edge Cases); `reviews/phase-5/plants.md:12-30, 71`; `contracts/elements.md:181` | The contract's plant *the region in the Lit template* for "repeated status does not mutate the region" makes no test fail (`plants.md:71`). `plants.md` says this is because the plant is no defect of any outcome the spec states for the region, so the contract row is wrong under Lit 3. That is not so. FR-041 says that after a clear (FR-042), setting a text puts it in the empty region again, and FR-042 says a `value` change after first render empties the region. R-07 ("Live region written outside Lit", `research.md:372`) wants the region written synchronously for this reason. I checked it with a probe body in a throwaway worktree, not committed. The page is `value` and `status="Copied to clipboard"` in the markup. A MutationObserver watches the region (`watchRegion`). Then one page script sets `field.value = "pnpm run build"` and then `field.status = "Copied to clipboard"`. After two frames and a task, the probe reads `regionMutations` and `regionText`. On `575d351` it observes `{ mutations: ["Copied to clipboard"], region: "Copied to clipboard" }`: the region was emptied and filled again. With the plant (the `status` setter only requests an update, the template renders `${status}` into the region, no own text node) it observes `mutations: []`, and only that body fails. The other 29 in-process bodies pass. Lit batches the clear and the set into one update, and its text binding skips an unchanged value, so the region is never emptied. So the plant is a defect of FR-041/FR-042, and a body that clears and sets the status in one task catches it. The suite has no such body. In every body that clears, the clear and the set are in different tasks, or a microtask checkpoint falls between them (the clear inside a real click's listener). | Add a body (run in both harnesses) where the element clears `status` and the host sets the same text again in the same task, with no microtask checkpoint between them. Assert that the region was emptied and filled again: for example, characterData records taken with `characterDataOldValue` (`"Copied…" → ""`, `"" → "Copied…"`), or at least the recorded mutation beside its end text. A `value` change followed by the set in one script is one such setup. The same set right after `field.status = ""` from the host is another. Pair it with US4-5's no-mutation repeat. Then run *the region in the Lit template* again, record the body it fails in `plants.md`, and rewrite the "A contract plant that is not a defect of its outcome" section, which this finding refutes. Leave the contract row as it is. The body passes on the current source, so this is a test-only change and needs no red commit. Still, record in the fix note that it fails under the plant. |
| R1-02 | note | `packages/elements/test/scenarios/copy-field.ts:743-760` (US4-12); `contracts/elements.md:186`; `notes.md:49-51` | The contract's setup for US4-12 is "pointer drag across the text". The body uses a real triple click instead, and the driver has no drag command. I accept this. A triple click is real pointer selection through the same `mousedown` / selection path. Its plant, `user-select: none`, makes the test fail. The `.trim()` drops only the line-end whitespace a triple click takes, and the command has no leading or trailing whitespace, so it hides no defect. A defect that blocks only a drag, with clicks still selecting, is not plausible for this element. `notes.md` records the deviation. If the driver ever gains a drag command, switch the body to a drag to match the contract. Nothing is needed in this phase. | none |
| R1-03 | note | `reviews/phase-5/spike.md` § "What stays open"; `packages/elements/README.md` (copy-field user-activation paragraph) | The T075 spike answers the Chromium half of R-07's user-activation question soundly. Both controls hold with no grant: a write with no click rejects, and a write in the click handler resolves. A write from the deferred request then resolves, with `isActive` true for click, Enter and Space. The WebKit half stays open with the console and kitty-mission-ui owners, as R-07 and plan decision 1 record. No implementation choice of this phase depends on it: PLAN-FRESH-2-004 (a) keeps the deferred dispatch. The README tells hosts that copy from the page to check their engines' user-activation rules, and the README test checks that statement. This is not a defect of this phase. It is an open question to carry to landing. | none in this phase. Keep the question open in R-07 until the owners answer. |
| R1-04 | note | `reviews/phase-5/notes.md` § "Visual baselines under docker (T083)" | The 10 copy-field baselines were captured under docker only, and no podman cross-engine check was possible. This is accepted by the operator decision of 2026-11-14 (`reviews/phase-2/operator-decisions.md`, FR-053), `notes.md` records it as T083 asks, and CI confirms at landing. I inspected `with-status.light` and `wrapped-long-command.dark`. The control sits flush with one divider. The command wraps inside the 320 px field and the control is as tall as the text. The status shows at the inline end under the field. | none |

## Test quality

- **Red evidence.** `red-commits`: `phase 123494f`, exit 1. `red-phase.log` shows 106 of 3913 tests failing, all 106 with
  `AssertionError`. No failure is a thrown setup, import or syntax error. The failing files are the phase's new and
  changed tests: the in-process and fixture copy-field suites, the entry, root-export, build, manifest, README,
  selection-pairs and story tests, and the gate counts. `tdd-check.json` reports `pass`: the final tests fail on base
  (exit 2) and on the scaffold (exit 1) and pass on head (exit 0), with no problem listed.
- **Scaffold.** `0935add` adds signatures only: the class with `value`, `copyLabel` and a `status` accessor that does
  nothing, the `index.ts` export and the `exports` entry. It has no `define`, no render and no test file.
- **No weakening.** I read `git diff 123494f..HEAD` of the test files. Only `test/scenarios/copy-field.ts` changed
  after the red commit, and every change is stricter or an addition:
  - US4-2's command no longer contains hyphens, so only `overflow-wrap: anywhere` can wrap it.
  - FR-032's value gains leading and trailing whitespace runs.
  - FR-035 adds a double click within one frame and a listener on the field itself for the detached case.
  - The FR-042 Edge Cases body adds the `status`-first markup order.
  - Two bodies are new: the properties' defaults, and removing the `status` attribute.
  No expected value was loosened, and no assertion was removed.
- **Assertions.** Each body returns one observation that its harness compares with `toEqual` against a hand-written
  `expected`, together with zero clipboard calls. The fixture harness also requires a clean CSP, network and console
  record. I found no conditional assertion, `skip`, `only`, snapshot or mock assertion. The probe click falls back to
  a point away from the field when the control does not render, so a missing control is reported, not thrown. Every
  "does not" outcome sits in the same body as its positive pair (US4-3 no clipboard call, US4-4 Escape and a letter
  beside Enter, US4-5 no mutation on a repeat, US4-6 no request in the task or the first frame, US4-10 disabled beside
  enabled).
- **Coverage.** US4-1 to US4-12, the copy field's Edge Cases named in T077 (a proactive status, `status` not
  reflected, host `hidden`, a second definition, motion) and FR-035's per-activation and disconnect rules each have a
  body. Click, Enter and Space each produce a request, and Escape and a letter are left unhandled. The gap is R1-01.
- **Plants.** `plants.md` records 64 plants. 63 make a test fail. The one that does not is R1-01. The six plants that
  did not bite on their first run were fixed by stricter bodies, or in one case by a plant form that is a real defect.
  I re-checked one plant myself: *the region in the Lit template* (R1-01).
- **Mutation.** I ran `pnpm run gate:mutation -- --base 75965e1` and it exited 0. It found 83 mutants on the changed
  lines of 2 files, and none survived. It reported 0 timeouts, 12 compile errors (type-checker rejections such as
  `value && ""` for a `string` or `{}` for a method that must return a value), 1 zero-mutant entry (`src/index.ts`)
  and 2 equivalent records. I read both equivalent records, on the `value` and `status` entries of
  `static properties` (`ocelle-copy-field.ts:45`, `:47`). Each says that with `{}` or `noAccessor: false`, Lit wraps
  the class's own accessor, which only adds an update request. The template reads the private `#value` and never reads
  `status`, so the render is the same. I accept both as equivalent.

## Checks run

All run on `575d351` one at a time, with `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`
and `OCELLE_VISUAL_ENGINE=docker`.

| Gate | Exit | Result |
|---|---|---|
| typecheck | 0 | no type error |
| lint | 0 | 311 files, no finding |
| style-lint | 0 | 23 files, no finding |
| test-lint | 0 | 210 files, no finding |
| brand-rules | 0 | 7 rules checked |
| pins | 0 | 5 manifests, no finding |
| config-copies | 0 | identical |
| prefix | 0 | 285 files, no finding |
| contrast | 0 | 166 pairs light, 174 dark (155 required) |
| manifest | 0 | 10 elements, no finding |
| csp | 0 | 28 files, no finding |
| signoff `--range 75965e1..HEAD` | 0 | 8 commits, no finding |
| unit-tests | 0 | 3917 tests passed in 163 files |
| storybook-build | 0 | 50 stories |
| visual | 0 | 100 captures match (docker only, no cross-engine comparison; R1-04) |
| axe | 0 | 100 story-theme runs, 0 serious or critical; 22 notes, all excepted |
| mutation `-- --base 75965e1` | 0 | 83 mutants, none survived; 2 equivalent records accepted |
| plants | 0 | 301 plants of 17 gates and the registry, every plant as expected |

**Constitution and plan.**
- I. The element never touches the clipboard. The request is the only output, and the observer asserts zero calls in
  every body of both harnesses.
- II. Sans with tabular figures, no monospace (the prefix gate is clean), tokens only (style-lint and brand-rules are
  clean).
- III. The group role is set through internals, kept where axe reads it. No ID is used in the shadow root. One polite
  `role="status"` region is present from first render. Enter and Space work as on a native button. The token focus
  ring is an outline. Forced colours use `ButtonBorder`, `ButtonText` and `Highlight`.
- IV. CSP clean, with fixture bodies on the strict-CSP page.
- V. Five stories, light and dark, each with a baseline.
- VII. The manifest, README and CHANGELOG name the surface.
- `ocelle-` names: element `ocelle-copy-field`, event `ocelle-copy-field-request`.
- The structure follows R-07: an imperative text node, the request after an animation frame and then a task, the text
  captured at activation, and an `isConnected` check.
- Every Phase 5 task is ticked, and its work is present. The changes outside the element (gate counts, the visual
  plant's findings list, story layout CSS, the copy-field entries in the manifest plants' trees and the `storybook-build/fail-empty-index` tree) are the ones
  T083 and T084 name.

## Earlier findings

None: this is round 1.
