# Phase 1 (Setup): partly exempt from the red step

Constitution VIII, *Exemption*: a unit with no behaviour may skip the red step if its review states why no test could
fail for it. Phase 1 is only partly exempt.

## Not exempt: T001 and T002

T002 (`storybook/visual/container.json`) is checked by a test: the pin must move with `.node-version` and with the
`chromium-headless-shell` revision of the repository's `playwright-core/browsers.json`. It went red first:

- red commit `cfc043d` (`test(006-storybook-workbench): phase 1 red — container pin`), task T001, changing only
  `gates/test/container-pin.test.ts`;
- `red.sh 1 phase` reported `"tests_only": true, "red": true`; `red-phase.log` shows exactly the two new cases failing
  on their first assertion, `storybook/visual/container.json exists: expected false to be true`, and no other test of
  the suite failing (`unit-tests: 2 of 2040 tests failed`).
- The second case (a wrong `node` and a wrong `browser`) runs on a copy of the repository's pin with those two fields
  changed, not on a separate fixture file: it is then red until the pin exists, and it shows the other checks passing
  on the real values while exactly the two changed fields are reported.

## Exempt: T003 and T004

No test could fail for these, because neither changes what any code does:

- **T003**, root `package.json`, `pnpm-lock.yaml`, `.gitignore` and four entry stubs:
  - the exact devDependencies `axe-core` `4.14.0` and `pngjs` `7.0.0` are package metadata; nothing imports either
    yet (phases 3 and 4 do). `pngjs` 7.0.0 was already in the lockfile as a transitive dependency. The existing pins
    gate checks both pins (`pnpm run gate:pins`: `pins: 5 manifests checked, no finding`);
  - the scripts `gate:storybook-build`, `gate:visual`, `gate:axe` and `visual:update` point at
    `gates/bin/storybook-build.ts`, `visual.ts`, `axe.ts` and `baselines.ts`. Each is a stub whose `run()` throws
    `not implemented (<gate>, phase <n>)`, which the shared entry wrapper (`gates/lib/cli.ts` `entry`) turns into
    exit 2 with one stderr line. The stubs are replaced, red first, in phases 2 (storybook-build), 3 (visual,
    baselines) and 4 (axe). They are not in `gates/gates.json` yet, so no registry or CI check runs them;
  - `.gitignore` gains `storybook/.visual/` and `storybook/.cache/`, ignore entries for output the later phases write.
- **T004**, the spike: scratch scripts in the scratchpad only, and a record (`spike.md`) with the fixtures it kept for
  phases 2 and 3 (`gates/test/fixtures/storybook-build/`, `gates/test/fixtures/container/`). Recorded outputs are
  inputs of later red tests, not behaviour of this phase.

## Mutation note

The four entry stubs are inside the mutation scope (`gates/bin/**/*.ts`). Their only mutable code is the thrown
message and the `import.meta.main` guard; no test exercises a stub, since its phase replaces it red first. A mutation
run of this phase would therefore report survivors on stub lines that the next phases delete; they are recorded here
rather than covered by tests of a stub.
