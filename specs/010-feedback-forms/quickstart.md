# Quickstart: validating Feedback and Forms

Prerequisites: the repository installed (`pnpm install`), `OCELLE_CHROMIUM_PATH` set where the frontend finding says,
and, for phase 5, #10 (mission 006) merged on `main` with podman or docker available.

1. Element behaviour, in process and on strict-CSP fixture pages:
   `pnpm run gate:unit-tests` (projects `elements` and `elements-browser`). Expected: every scenario of
   spec User Stories 1 to 3 passes; zero CSP violations (SC-001).
2. Announcements: the notice and form-control suites print the captured announcements per scenario on failure; the
   counts must equal the spec's (SC-002). The capture is described in `contracts/testing.md`.
3. Forms: the native-twin suites compare `FormData`, submissions and validity with native controls (SC-003).
4. Tokens: `pnpm run gate:contrast` passes with ink on the five state grounds added (research R-04).
5. Manifest and docs: `pnpm --filter @ocelle/elements run manifest`, then `pnpm run gate:manifest`; the README test
   in `test/node/readme.test.ts` (SC-006).
6. Built output: `pnpm --filter @ocelle/elements run build`, then `pnpm run gate:csp` and `pnpm run gate:prefix`.
7. Stories (after #10): `pnpm run gate:storybook-build`, `pnpm run visual:update` in the pinned container to produce
   baselines, then `pnpm run gate:visual` and `pnpm run gate:axe` (SC-005).
8. Mutation: `pnpm run gate:mutation` on the branch; survivors in new code are review findings (SC-007).
