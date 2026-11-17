---
phase: 2
round: 5
verdict: approved
base: dbf9f9fbad57532469d3b48f9d8b4213af488df8
head: 1f85e5fac5c0bb72a91d035d8b1ddb4d2132b613
tdd_check: pass
---

# Phase 2 review, round 5

Scope: the whole phase, `git diff dbf9f9f..1f85e5f`. The working tree was clean at the start. Rounds 1 to 3 reviewed
the element, token, story and test code of the phase, and round 3 approved it at `42c31d5`. Round 4 was the
operator's round at landing (R4-01, landing L1-01). For this phase, the commits since then are:

- `f7fe243`: T049 and the artifact changes in `reviews/landing/round-1-tasks.md`;
- `1926756`: the fix-4 red commit, test files only;
- `f058ea9`: the fix, with `plants.md` § Review round 4 fix, `round-4-fixes.md` and the `fix-4` entry of `red-commits`;
- `f5619e9`: the tdd-check outputs at `33d7df1`;
- `cc87331`: the T049 tick.

After `33d7df1`, only `tasks.md` and files under `reviews/` changed (`git diff --stat 33d7df1..HEAD`). The other
source and test changes since `f058ea9` belong to phases 4 and 5: `ocelle-context-sidebar.ts`, `tsconfig.json`,
`README.md`, `build.test.ts`, `readme.test.ts` and `scenarios/context-sidebar.ts`. None of them touches a phase 2
file.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|

No findings. The list is empty.

## Test quality

- **Red evidence.** I re-ran `tdd-check.sh 2` at HEAD `1f85e5f`, and `tdd-check.json` reports `status: pass` with
  `problems: []`:
  - the `phase`, `fix-1`, `fix-2` and `fix-4` red commits each exit 1 and change only test files;
  - the final tests exit 2 on the base and on the scaffold;
  - the tests exit 0 at the head: `check-head.log` reports "3601 tests passed in 158 files".

  In `check-red-fix-4.log`, the run at `1926756` fails "2 of 3596 tests". These are only the new scenario "R-05
  forwarded slot (phase 2 review R4-01)", at `test/card.test.ts:23` (`elements`) and `test/browser/card.test.ts:35`
  (`elements-browser`). Each fails with an `AssertionError` on the observed states, so it is not a setup or load error.
  The fixture's `recorded` part (CSP, requests, console) is folded into the same `toEqual`. Vitest truncates the arrays
  in the message. The first two states shown are the expected `compact`, `compact`, so the failure is in the later
  states. That fits the claimed reason (`compact` where `regular` is expected after the header leaves the slot) and
  the pairing-plant record in `plants.md` § Review round 4 fix.
- **Test against the task.** The scenario is `packages/elements/test/scenarios/card.ts:413-436` and follows T049
  step by step:
  1. It mounts a wrapper whose open shadow root holds `<ocelle-card density="compact"><slot name="extra" slot="header">`.
  2. It appends a section header with `slot="header"` and an `h3` heading: compact (the positive half).
  3. It appends `<span slot="extra">` to the wrapper's light DOM, so the forwarded slot's content changes and
     `slotchange` reaches the card with the wrapper's slot as `target`: still compact.
  4. It removes the header's `slot` attribute: `regular`. The heading's computed font size is compared with
     `--ocelle-font-size-lg`, read by name through the probe.
  5. It sets the attribute back: compact.

  `expected: ["compact", "compact", "regular", "compact"]`. Each "does not stay compact" has its positive twin in
  the same assertion. The size check returns the raw value when the size is neither token, so it cannot pass by
  default.
- **No weakening.** `git diff 1926756..HEAD` shows no change to `scenarios/card.ts`, `scenarios/driver.ts`,
  `in-process.ts`, `browser/driver.ts`, `card.test.ts` or `browser/card.test.ts`. No earlier phase 2 test changed
  after its red commit.
- **Assertions and lint.** `gate:test-lint`: 207 files, no finding. There is no `skip`, `only`, conditional
  assertion or snapshot-only assertion in the new code.
- **Mutation.** `pnpm run gate:mutation -- --base dbf9f9f`: "233 mutants on the changed lines of 10 files, none
  survived; 0 timeouts, 50 compile errors, 3 zero-mutant entries; 4 equivalent records". The base predates phases 3
  to 5, so the changed lines include their source too.
  - No mutant of `ocelle-card.ts:107-109`, the fixed `#headerChanged`, survived, and none was a compile error there.
    The compile errors in `ocelle-card.ts` are at 103, 113 and 116.
  - I read the four equivalent records. Three were accepted in earlier rounds: `ocelle-section-header.ts:166`,
    `ocelle-context-sidebar.ts:43` and `ocelle-personal-rail.ts:44` (`{}` gives Lit's String defaults). The fourth,
    `gates/bin/contrast.ts:116`, is a process boundary covered by `gates/test/integration/token-gates.test.ts`. All
    four reasons hold.
  - The zero-mutant entries are `contrast.ts`, `index.ts` and `naming.ts`.

## Checks run

All at `1f85e5f`, with these settings:

- `SPECIFY_FEATURE_DIRECTORY=specs/011-layout-headers`;
- `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`;
- `OCELLE_VISUAL_ENGINE=docker` (docker 29.9.2, `docker info` ok).

| Check | Result |
|---|---|
| `tdd-check.sh 2` (clean worktrees) | pass; the head run is `pnpm test` at HEAD: 3601 tests passed in 158 files |
| `gate:mutation -- --base dbf9f9f` | pass: 233 mutants, none survived |
| `gate:typecheck` | pass |
| `gate:lint` | pass (304 files) |
| `gate:style-lint` | pass (19 files) |
| `gate:test-lint` | pass (207 files) |
| `gate:prefix` | pass (270 files) |
| `gate:csp` | pass (24 files) |
| `gate:manifest` | pass (7 elements) |
| `gate:contrast` | pass: 169 light / 177 dark, 158 required per theme |
| `gate:brand-rules` | pass (7 rules) |
| `gate:pins`, `gate:config-copies` | pass |
| `gate:signoff -- --range dbf9f9f..HEAD` | pass: 51 commits, no finding |
| `gate:storybook-build` | pass: 57 stories |
| `gate:axe` | pass: 114 story-theme runs, 0 serious or critical (10 excepted notes, all the known wide-table `elmPartiallyObscured` exceptions) |
| `gate:visual -- --engine docker` | pass: 114 captures match their baselines (docker only, no cross-engine comparison) |
| `gate:plants` | not re-run in full; see below |

**Plants.** A full `gate:plants` run does not finish within the 2-hour background limit, and I did not run the 28
shards. Instead:

- I checked `plants.md` § Review round 4 fix. The forwarded-slot pairing plant (`event.target` restored in
  `#headerChanged`) is the row of `contracts/checks.md:94`. It failed exactly the new scenario in both harnesses, and
  the same run passes 45 of 45 without the plant.
- The mutation run also kills the mutants of the fixed line.
- The implementer's full sharded run passed at `33d7df1` with 301 plants as expected. I take that from the
  implementer's record, as phase 1 round 4 did. No code, test, gate or story changed after `33d7df1`.

## Earlier findings

Round 4 (operator round) had one blocking finding.

- **R4-01 (landing L1-01): resolved.**
  - **The fix.** `packages/elements/src/ocelle-card.ts:107-109` now passes `event.currentTarget` to
    `notifyHeaders`. The listener sits on the card's own `<slot name="header" @slotchange=…>` (line 118), so
    `currentTarget` is always that slot and never a wrapper's forwarded slot. This is one of the two forms that
    T049 and research.md R-05 § Forwarded slots allow. `updated()` (line 112) keeps reading
    `slot[name="header"]`. `f058ea9` changes no other source file, and `gate:manifest` passes with the manifest
    unchanged.
  - **Red test first.** `red-commits` has `fix-4 1926756`, which is an ancestor of the fix. `tdd-check` confirms it
    changes only test files and fails (exit 1) for the reason above.
  - **Both harnesses run the same body.** `card.test.ts` and `browser/card.test.ts` both iterate `cardScenarios`, so
    the in-process run on the source and the strict-CSP fixture run on the browser build execute the same steps. The
    fixture run also asserts a clean CSP, request and console record.
  - **The four driver primitives are equivalent across harnesses.** They are declared once in
    `test/scenarios/driver.ts:199-217`, so typecheck enforces both implementations.
    - `shadow` attaches an open root and sets its `innerHTML` (`in-process.ts:297`, `browser/driver.ts:347`).
    - `shadowAppend` uses `insertAdjacentHTML("beforeend")` (`in-process.ts:301`, `browser/driver.ts:358` via
      `inShadow` at `:33`).
    - `shadowAttribute` sets the attribute, or removes it for `null` (`in-process.ts:305`, `browser/driver.ts:359`).
    - `shadowComputed` reads `getComputedStyle(...).getPropertyValue` (`in-process.ts:310`, `browser/driver.ts:360`).

    Each throws on a missing host or inner node. Each action waits for the `updateComplete` of every `ocelle-*`
    element in the shadow root plus an animation frame, then runs the harness's own `settle`. The two harnesses
    order the frame and the `updateComplete` wait slightly differently, but the scenario reads its state only after
    both waits, so the order does not change the result.
  - **CSP and constitution.** The fixture side runs through `page.evaluate`, as the existing `mount` and `append`
    primitives do (`browser/driver.ts:55-64`, `:230-237`). The page gets no inline script, and the markup the
    scenario passes (`card`, `header`, `heading`, `probe`) has no `style` attribute (`grep -c 'style='
    scenarios/card.ts` is 0). The clean `recorded` value under `default-src 'none'` confirms this for the run. They
    are test plumbing under `packages/elements/test/` only, as T049 requires ("exempt plumbing as T007"), so they add
    no I/O, network request or name to the elements. Principles I, III, IV and VIII hold.
  - **Artifacts.** The landing artifact changes listed in `reviews/landing/round-1-tasks.md` are present:
    - research.md R-05 § Forwarded slots (lines 186-192);
    - spec.md: the landing fixes summary (line 123), the new Edge Case (lines 554-556) and FR-017 (lines 697-699);
    - the pairing-plant row at `contracts/checks.md:94`;
    - `plants.md` § Review round 4 fix;
    - `round-4-fixes.md`.
  - **Tasks.** T049 is ticked (`cc87331`). Every task of `## Phase 2:` (T009-T025, T016a, T049) is ticked, and its
    work is present.
