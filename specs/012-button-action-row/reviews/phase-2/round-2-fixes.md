# Phase 2, review round 2: fixes

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R2-01 | fixed | fix-2 dbf0ed9 (red-fix-2.log: the new test fails on its assertion, margin "0px" where "8px" is expected after text is written) | packages/elements/src/ocelle-button.ts (the text observer also observes `childList`); packages/elements/test/button.test.ts ("brings the gap back when text is written into an empty slotted element ...") |
| R2-02 | fixed (documented, not tracked): the README now says that a label forwarded through another component's shadow-root `<slot>` is read when that slot's assignment changes, not when the forwarded text changes. This is a docs change, so there is no red test. | none | packages/elements/README.md (the default slot line of `ocelle-button`) |
| R2-03 | no change: the review requires none. R1-02 stays open for the next planning touch. | none | none |

## R2-01

- **Red (fix-2, dbf0ed9, tests only).** This is an in-process test with three icon-only buttons, each with
  `label="Close"` and an empty slotted `<span>`. In the first, a text node is inserted into the span. In the second,
  the span's `textContent` is set. In the third, a text node is inserted into a `<b>` nested in the span. The test
  asserts that before the write the icon has a 0px margin and is centred within 0.5 px, that after the write each has
  the 8 px gap, and that after the text is removed again (the node removed, `textContent = ""`, the nested node
  removed) each has 0px and is centred again.
- **`red.sh 2 fix-2`:** `"recorded": true`, exit 1, 2 of 3360 failed. The first failure is the new test, on its deep
  equality: `written` was `["0px", "0px", "0px"]`. The second is
  `gates/test/integration/visual.test.ts` "captures the repository's 76 story-themes twice under docker", the same
  docker flake as in red-fix-1.log, and it is unrelated to the change. After the fix it also failed in the first
  `pnpm test`, passed when run alone (1 passed, 97 s), passed in a full `npx vitest run`, and passed in the final
  `pnpm test`.
- **Fix.** The observer options are now `{ characterData: true, childList: true, subtree: true }`. Text inserted into
  or removed from a slotted element, at any depth, triggers a reread of the flattened assignment. That reread already
  counts an element's `textContent`. A direct child added to or removed from the host also fires `slotchange`, so it
  is now read twice, which is harmless.
- **Mutation.** `gate:mutation -- --base f2b7b8a`: 4 mutants on the changed line, none survived. `childList` set to
  `false` is killed by the new test. There was 1 timeout: the options replaced by `{}`, which makes `observe()` throw
  in the constructor, as in rounds 1 and 2. There were 0 compile errors and 0 equivalent records.
- **Baselines.** None changed. `gate:visual` (docker) matches all 76 captures after the fix.

## R2-02

I chose to document this rather than track it. Tracking would mean observing the nodes of the flattened assignment
that lie outside the button and registering again on each `slotchange`. No consumer forwards a button label today,
and the review classes this as a note.

## Checks run (after the fix)

- `gate:typecheck`, `gate:lint` (279 files), `gate:style-lint` (14), `gate:test-lint` (187), `gate:prefix`,
  `gate:pins`, `gate:config-copies`, `gate:manifest` (3 elements), `gate:contrast`, `gate:brand-rules`, `gate:csp`
  and `gate:signoff -- --range 48cdc95..HEAD` all passed.
- `gate:storybook-build` (38 stories) passed.
- `gate:axe`: 76 story-theme runs, 0 serious or critical.
- `OCELLE_VISUAL_ENGINE=docker pnpm run gate:visual`: 76 captures match.
- `gate:mutation -- --base f2b7b8a`: see above.
- `gate:plants` with `OCELLE_VISUAL_ENGINE=docker`, shards 1, 2 and 3 (76 plants each) and 49 (`pass-repository`):
  every plant as expected. No story, baseline or gate changed, so I did not rerun the other shards.
- `pnpm test`: 3360 tests passed in 148 files (the final run). Two earlier full runs each had one intermittent
  integration failure that had nothing to do with the change. One was the docker visual test above. The other, in
  `npx vitest run`, was `gates/test/integration/setup-offline.test.ts` "exits 2 naming the missing package": pnpm
  reported `ERR_PNPM_NO_OFFLINE_TARBALL` without the `missing: is-number` line. Both passed in the final run.
