# Phase 1 review, round 4: fixes

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R4-01 | fixed: the connected sheet of "a sheet removed from the document keeps the classes it had at removal after a window resize, while a connected sheet re-runs the pass on the same dispatch" now has a fixed block size (`display: block; inline-size: 300px; block-size: 100px; overflow: hidden`), so clearing its `stacked` class by hand resizes neither the host nor a probe. The test now waits for layout after clearing the class and before the dispatch, and asserts `undispatched: []` (still cleared, so no `ResizeObserver` callback restored it). After the dispatch it asserts `connected: ["stacked"]`. The false comment is replaced. The pairing of T021b and contracts/checks.md § Oracles is kept | none recorded: a vacuous-test finding. The code is already right, so the stronger test passes at once. The `addEventListener` plant below shows that the connected half now bites | packages/elements/test/facts.test.ts (describe "a removed sheet stops listening") |
| R4-02 | fixed (note; doc wording only, one line each at data-model.md :66 and :82): both now read "`cols-2` below 2 × threshold, and `cols-1` as well below the threshold". The source header comment at ocelle-facts.ts:13 is left as it is, to keep this round off the source | none: docs only, no red | specs/013-data-display/data-model.md:66, :82 |
| R4-03 | not addressed (note, tooling; left alone as the brief asked) | none | none |

## Hand plants (not committed)

Run each time: `pnpm exec vitest run packages/elements/test/facts.test.ts -t "removed sheet"`. The source was
restored with `git checkout` after each plant.

1. `disconnectedCallback` body emptied: **fails**. `"removed": []`, expected `["stacked"]`.
2. The `window.removeEventListener("resize", this.#resized);` line removed: **fails**. `"removed": []`, expected
   `["stacked"]`.
3. The `removeEventListener` event name mutated to `""`: **fails**. `"removed": []`, expected `["stacked"]`.
4. The `window.addEventListener("resize", this.#resized);` line removed (ocelle-facts.ts:214, R4-01's plant):
   **fails**. `"connected": []`, expected `["stacked"]`. `"undispatched": []` matches, so the connected sheet's
   class was restored only by the dispatch.
5. Source restored: **passes**.

## Checks

All with `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` and `OCELLE_VISUAL_ENGINE=docker`
(dockerd running).

- `pnpm test`: `unit-tests: 3793 tests passed in 152 files`
- `gate:typecheck`: `typecheck: no type error in the files of tsconfig.json`
- `gate:lint`: `lint: 296 files checked, no finding`
- `gate:test-lint`: `test-lint: 202 files checked, no finding`
- `gate:style-lint`: `style-lint: 16 files checked, no finding`
- `gate:prefix`: `prefix: 252 files checked, no finding`
- `gate:mutation -- --base 30e5130 --files packages/elements/src/ocelle-facts.ts`: `mutation: 190 mutants on the changed lines of 1 file, none survived; 0 timeouts, 34 compile errors, 0 zero-mutant entries; 12 equivalent records`
- `gate:signoff -- --range 30e5130..HEAD` and `tdd-check.sh 1`: run after this commit; outputs committed separately.
