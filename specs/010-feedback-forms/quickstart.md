# Quickstart: validating Feedback and Forms

Prerequisites: the repository installed (`pnpm install`), `OCELLE_CHROMIUM_PATH` set where the frontend finding says,
and, for phase 5, #10 (mission 006) merged on `main` with podman or docker available.

1. Element behaviour, in process and on strict-CSP fixture pages:
   `pnpm run gate:unit-tests` (projects `elements` and `elements-browser`). Expected: every scenario of
   spec User Stories 1 to 3 passes; zero CSP violations (SC-001).
2. Announcements: the notice and form-control suites print the captured announcements per scenario on failure; the
   counts must equal the spec's under both the `"settled"` and the `"rendered"` rule, including every cell of the
   table-driven SC-002 matrix in the notice suite (five tones × triggers and non-triggers × the no-role, `alert` and
   `status` rows; in the `alert` row insertion, reveal and `status` → `alert` count zero and check the host's `alert`
   role, since the platform's alert event carries them, also with the text set in the same task after the trigger). In process the announcer runs at the test `D` and `H` of
   research R-09; the fixture pages run at Chromium's figures. The capture is described in `contracts/testing.md`. `test/plants.test.ts` shows every plant red
   with its expected assertion message; the runs are recorded in `reviews/phase-<n>/plants.md`.
3. Forms: the native-twin suites compare `FormData`, submissions and validity with native controls and with the
   absolute outcomes of `contracts/testing.md` § Twins (SC-003).
4. Tokens: `pnpm run gate:contrast` passes with ink on the five state grounds added in `source.ts` and `pairs.json`,
   and the gate tests' required-set counts read 154 and 165/173/154 (research R-04).
5. Manifest and docs: `pnpm --filter @ocelle/elements run manifest`, then `pnpm run gate:manifest`; the README test
   in `test/node/readme.test.ts` (SC-006).
6. Built output: `pnpm --filter @ocelle/elements run build`, then `pnpm run gate:csp` and `pnpm run gate:prefix`.
7. Stories (after #10): `pnpm run gate:storybook-build`, `pnpm run visual:update` in the pinned container to produce
   baselines, then `pnpm run gate:visual` and `pnpm run gate:axe` (SC-005).
8. Mutation: `pnpm run gate:mutation` on the branch; survivors in new code are review findings (SC-007).
