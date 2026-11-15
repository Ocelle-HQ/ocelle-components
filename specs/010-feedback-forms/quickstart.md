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
   role, since the platform's alert event carries them, also with the text or the `tone` set in the same task after the trigger; inserted or revealed as `alert` and changed
   to `status` in the same task, it is announced politely once). In process the announcer runs at the test `D` and `H` of
   research R-09; the fixture pages run at Chromium's figures. The capture is described in `contracts/testing.md`. `test/plants.test.ts` and, for the rows under
   `startDocument`, `test/browser/plants.test.ts` show every plant red
   with its expected assertion message; the runs are recorded in `reviews/phase-<n>/plants.md`.
3. Forms: the native-twin suites compare `FormData`, submissions and validity with native controls and with the
   absolute outcomes of `contracts/testing.md` § Twins (SC-003).
4. Tokens: `pnpm run gate:contrast` passes with ink on the five state grounds added in `source.ts` and `pairs.json`,
   and the gate tests' figures read as research R-04's table gives them: 154 required per theme and 308 in all,
   165/173 entries (338 in all), the summary 165/173/154, and 166 for plant variant (2).
5. Manifest and docs: `pnpm --filter @ocelle/elements run manifest`, then `pnpm run gate:manifest` (no `role` or
   `hidden` attribute declared from phase 2 on; the input's `value` attribute declared, with type, default and
   description, from phase 3 on; the gate reports `3`, `4` and `5 elements checked` after phases 2, 3
   and 4, and each new entry point follows the previous element's, before `./browser.js`, as research R-11 orders
   them); the README test in `test/node/readme.test.ts` (SC-006), whose
   assertions each phase adds in its red commit, mapped item by item in `reviews/phase-5/readme-map.md`.
6. Built output: `pnpm --filter @ocelle/elements run build`, then `pnpm run gate:csp` and `pnpm run gate:prefix`.
7. Stories (after #10): `pnpm run gate:storybook-build`, `pnpm run visual:update` in the pinned container to produce
   baselines, then `pnpm run gate:visual` and `pnpm run gate:axe` (SC-005).
8. Mutation: `pnpm run gate:mutation` on the branch; survivors in new code are review findings (SC-007). At the end of
   phases 2 and 3 each planned shard holding `src/live.ts` (phase 3: or `src/form-control.ts`) is also run with
   `--files` and timed; over 7:00 is a stop (plan decision 11). Since phase 3 stop 1, `--plan` cuts element source
   (`packages/elements/src/`) into shards of at most 10 mutants, counted before Stryker runs, and every other file
   into 30-line entries as before (plan decision 11; T041a). Since phase 3 stop 2, a mutant that probably runs when
   its module loads (in a static class member, a class property's initialiser, or code outside any function) counts
   as 5 of those 10 (plan decision 11; T041b).
