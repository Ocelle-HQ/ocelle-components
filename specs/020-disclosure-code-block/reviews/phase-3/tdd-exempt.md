# Phase 3: no red step (constitution VIII, Exemption)

Phase 3 (Polish & Cross-Cutting Concerns) has no behaviour. Its three tasks are documentation and records:

- T040 adds one sentence to the WebKit paragraph of `packages/elements/README.md` § Engines (`ocelle-code-block`'s
  scroll mode is untested in WebKit) and records that the engine floor does not change;
- T042 adds the late-font caveat to the README's `ocelle-code-block` § Direction (operator decision
  `reviews/phase-2/operator-late-font.md`); tasks.md T042 says "No element code, story or test changes";
- T041 runs the quickstart's checks and records them (`checks.md`), and removes an empty block from phase 2's
  `plants.md`.

No element source, story, style, token, manifest entry or gate changes, so no element, story or gate test could fail
for the phase. The README's statements are asserted by `packages/elements/test/node/readme.test.ts`; T042 forbids a
test change in this phase, so the two new README sentences get no new assertion. They are written as sentences of
their own so that every existing README assertion (the WebKit line and the `rtl` opening-write statement included)
still holds verbatim: `pnpm exec vitest run --project elements-node` passes (781 tests). Whether the two sentences
should also be asserted is noted for the review in `notes.md`.
