# Phase 3: what is exempt from the red step (T039)

Constitution VIII lets a unit with no behaviour skip the red step if its review states why no test could fail for
it. In phase 3 one statement takes the exemption; every other task of the phase was red first in `654ac79`
(`red-phase.log`).

## US2-5, second half: "`THIRD_PARTY_NOTICES` lists no icon set" (FR-029)

- What it says: no third-party icon set is added to `THIRD_PARTY_NOTICES`, because every icon is the project's own
  drawing.
- Why no test can fail for it: it states that something is absent, and it was already absent before this phase:
  `THIRD_PARTY_NOTICES` lists the Schibsted Grotesk font and Lit, and no icon set was ever added. A test that
  `THIRD_PARTY_NOTICES` names no icon set passes on the base commit, the scaffold and the head alike, so it could not
  be seen failing for the missing behaviour. The spec says so itself (spec § User Scenarios, the paragraph after the
  pairing table).
- What is tested instead: US2-5's first half, the README's licence sentence ("Every icon is the project's own
  drawing, under Apache-2.0; no third-party icon set is used, so `THIRD_PARTY_NOTICES` lists none"), is in
  `packages/elements/test/node/readme.test.ts` and was red in `654ac79`. The drawings themselves are checked against
  the hand-written expected table (`test/icons-expected.ts`), which is the evidence that they are this library's own
  shapes rather than a copied set.
