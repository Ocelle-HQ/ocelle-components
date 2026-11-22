# Phase 2 operator round 2 fixes

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| T034 | fixed | With a 500 ms font response delay, the original strict-CSP US2-8 geometry assertion fails. Awaiting the vendored face before mount makes the same assertion pass. | `packages/elements/test/browser/code-block.test.ts` |
| T035 | fixed | `fix-2` at `089db909` records FR-020 assertion failures in the in-process and strict-CSP browser projects. The focused mutation table below records the additional guards. | `packages/elements/src/ocelle-code-block.ts`, both `code-block.test.ts` files, `packages/elements/test/scenarios/code-block.ts` |

## T034 RTL font timing

In the browser-build fixture at `789cad34`, route the vendored Schibsted Grotesk WOFF2 through a 500 ms delay. In
both runs the face starts unloaded and finishes loaded. The original `US2-8 line starts` scenario reads the
following at rest. All CSP violation, outside request, failed request and console lists are empty in both runs.

| Font at mount | Box offset | Three line starts inside | Fade | Right mask transparent | Result |
|---|---|---|---|---|---|
| Unloaded | `-591` of `664` | `[false, false, false]` | `both` | false | Geometry assertion fails |
| Loaded | `-(scrollWidth - clientWidth)` within one pixel | `[true, true, true]` | `start` | true | Same geometry assertion passes |

Both runs also observe `rtl` on the block and scroll box, `ltr` on its code and actual overflow. The fixture now
loads the face resolved from `--ocelle-font-sans`, checks that it found a font face and starts the shared scenario
after the load completes. The original US2-8, text-change, LTR and clean-fixture comparisons still apply, along
with the one-write opening and the late-font caveat in [operator-late-font.md](operator-late-font.md).

## T035 reconnect and mutation evidence

The shared FR-020 scenario detaches an overflowing named block, edits its light DOM while detached, and
reattaches the same element without changing a property or attribute. It reads the shadow copy, tab stop, role
and accessible name in all states, including a subsequent connected edit. `red.sh 2 fix-2` ran both focused
assertions against the test-only commit `089db909`, reported `tests_only`, `red` and `recorded` as `true`, and
exited 1 with two assertion failures. See [red-fix-2.log](red-fix-2.log). Reconnecting now requests a Lit update
after registering the light-DOM observer. Both observer teardowns remain active while the element is detached.

Each mutation below was applied separately in a disposable worktree. The named in-process browser assertion
failed and the source was restored after each run. The hosted report is linked in
[CI run 45039436202](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45039436202).

| Mutation or incorrect behavior | Observable in-process assertion |
|---|---|
| Reconnect refresh removed | `FR-020 reconnect` finds stale shown text and derived scroll state after reconnect. |
| Lit `disconnectedCallback` removed | `FR-020 reconnect` detects the detached scroll region being updated. |
| Light-DOM observer teardown removed | `FR-020 reconnect` detects the shadow copy changing while detached. |
| `overflow` reflection disabled, or its declaration replaced with `{}` | `FR-022 and FR-028` compares the real host attribute after both property writes. |
| `digest` reflection disabled | `FR-022 and FR-028` checks the Boolean attribute's presence and removal. |
| Focus rescued during a scroll-mode update | `FR-021 and FR-025: RTL reopening` checks that relabelling keeps focus on the scroll box and leaves the wrapper without a `tabindex`. |
| RTL opening repeats on an unrelated update | The same relabelling assertion checks that the user's offset remains `-10`. |
| RTL opening skips a replacement box displaying the same text | The reopening assertion checks the fresh box's three visible line starts, offset, fade and mask. |
| RTL opening skips changed text in the same box | `US2-8 line starts after a text change` checks the geometry after the existing box's text changes. |
| Box-identity comparison inverted | `US2-8 line starts after a text change` detects the broken opening decision. |
| Text-identity comparison inverted | `FR-021 and FR-025: RTL reopening` detects a redundant position reset after relabelling. |
| Direction guard allows the opening write in LTR | `FR-021 LTR text edits` checks that a new still-overflowing line retains a positive user offset of `40`. |

The box/text guard therefore distinguishes all three live states of the reported conditional and equality changes.
The original source's remaining changed-line findings reduce to these equivalences:

| Original mutation | Reason and resolution |
|---|---|
| `label` declaration replaced with `{}` | Lit defaults to a String attribute with reflection off. Kept the explicit type for readers and annotated only the object-literal replacement. The reflection scenario still checks that the label property updates the accessible name and leaves the host attribute as authored. |
| Initial remembered text changed from `""` | The initial remembered box was `null`. Every first real box differs from it, so short-circuit evaluation skipped that text. Removed the sentinel record and save a pair only when a scroll box exists. |
| Initial rescue flag changed or its assignment back to `false` removed | `willUpdate()` assigns the flag before every `updated()` read, including the update before the first read. Removed both redundant writes. |
| Missing overflow falls back to a different string | Both reported string literals yield a non-`scroll` policy after normalization. The optional chain now handles the missing value directly. |
| `super.updated(changed)` removed | Lit's `updated()` implementation is empty. Removed the redundant call. |
| `scrollWidth - clientWidth` changed to addition | In the RTL-only path the proposed negative sum lies at or beyond the negative scroll endpoint. The browser clamps it to the same endpoint, preserving geometry and the single write. Annotated this arithmetic mutation at the write. |
| Focusout listener gets empty options or `once: false` | After the first focusout the wrap node has no `tabindex`. No component action focuses or adds a tab stop to that retained node again, and a later rescue uses a newly rendered wrap node. Kept `once` for listener cleanup and annotated its two mutations at the options. |

## Checks

- The targeted unit command over the two code-block suites and `entry-code-block.test.ts` passed all 97 tests, including the full strict-CSP code-block file.
- Changed-file source lint and test lint passed. The typecheck, manifest (40 elements), style lint, config copies, CSP gate, prefix and range signoff passed.
- The scope comparison from the phase base is empty for `packages/elements/src/overflow-region.ts` and `specs/009-workflow-layouts/contracts/`.
- The affected Plants selection is 317 of 317. Full Plants, mutation, unit, visual and axe remain required on the integrated GitHub head under the [operator's CI-first decision](../operator-ci-first.md).
