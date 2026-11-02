# Research: Repository Foundation (001)

Versions read from the npm registry and nodejs.org on 2026-11-02. Every version below is pinned exactly.

## R-01 Runtime and package manager

- **Decision**: Node.js 26.13.0 (current LTS, "Lithium", released 2026-10-28) pinned in `.node-version` and
  `package.json#engines`; pnpm 12.16.1 pinned in `package.json#packageManager` and `engines`.
- **Rationale**: every tool chosen below supports Node 26 (Vitest `^22.12 || ^24 || >=26`, ESLint `>=24`,
  Stryker `>=22`, Stylelint `>=20.19`). Node 26 runs TypeScript files natively (type stripping), so gate scripts are
  TypeScript run by `node` with no build step and no extra runner dependency.
- **Alternatives**: Node 24 (older LTS; would work, but nothing needs it); a TS runner such as `tsx` (an extra
  dependency the runtime no longer needs).

## R-02 TypeScript version

- **Decision**: TypeScript 6.0.3, strict mode plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.
- **Rationale**: typescript-eslint 8.72.1 (needed for the code lint and by `@vitest/eslint-plugin`) declares
  `typescript >=4.8.4 <6.1.0`; TypeScript 7.0.2 (the native compiler) is outside it. `@vitest/eslint-plugin` needs
  `>=6.0.0`. 6.0.3 is the only line both accept.
- **Alternatives**: TypeScript 7.0.2 (rejected: unsupported by the lint stack; revisit when typescript-eslint
  supports it).

## R-03 Test runner (FR-004, FR-005)

- **Decision**: Vitest 5.1.0 with `projects`: `tokens` and `styles` (Node environment), `elements` (browser mode,
  `@vitest/browser-playwright` 5.1.0 with Playwright 1.64.1, Chromium only, headless), `gates` (Node). One root
  command, `pnpm test`, runs `gates/bin/test.ts`, which (1) checks that Playwright's Chromium executable exists and
  otherwise exits 2 naming `pnpm run setup:online` (FR-004, US1 scenario 9), then (2) runs `vitest run`. Vitest exits
  non-zero when no test file is found in the whole run, and passes a project with no test files when others have
  them; the first phase proves both red-first (US1 scenarios 5 and 10) and fixes the configuration if Vitest 5
  differs.
- **Rationale**: one runner for Node and browser tests, real Chromium for elements (constitution III and V need the
  real accessibility tree), and the tooling issue #4 named.
- **Alternatives**: Web Test Runner (second test runner later for Node code); jsdom/happy-dom (not a real browser,
  FR-005 forbids).

## R-04 Online install and offline setup (FR-008)

- **Decision**:
  - `pnpm run setup:online`: `pnpm install --frozen-lockfile`, then `pnpm exec playwright install chromium`. The
    pnpm store and Playwright's browser cache (`~/.cache/ms-playwright`, or `PLAYWRIGHT_BROWSERS_PATH`) are outside
    the repository.
  - `pnpm run setup:offline` (the story configuration's `setup_command`): `gates/bin/setup-offline.ts` runs
    `pnpm install --frozen-lockfile --offline`, translates pnpm's missing-tarball error into "missing: <package>;
    run pnpm run setup:online", then checks the Chromium executable the same way as `pnpm test`.
- **Rationale**: `--offline` makes pnpm refuse the network instead of falling back to it, which is FR-008's rule.

## R-05 Code lint (FR-020)

- **Decision**: ESLint 10.14.0 flat config (`eslint.config.ts`) with `@eslint/js` 10.0.1 recommended and
  typescript-eslint 8.72.1 `strictTypeChecked` + `stylisticTypeChecked`, over all repository TypeScript except
  `gates/plants/`. Its plant violates `@typescript-eslint/no-floating-promises`, a rule the test lint does not have.

## R-06 Test lint (FR-010)

- **Decision**: a second ESLint config (`eslint.test.config.ts`) over all test code, with `@vitest/eslint-plugin`
  1.6.28 rules `expect-expect`, `no-disabled-tests`, `no-focused-tests`, `no-conditional-expect`,
  `no-standalone-expect`, `valid-expect` (with `alwaysAwait`) and `valid-expect-in-promise`, as errors; plus a
  local rule `ocelle/no-snapshot-only` (in `gates/eslint/`) that reports a test whose only assertions are snapshot
  matchers (`toMatchSnapshot`, `toMatchInlineSnapshot`, `toMatchFileSnapshot`). No upstream rule covers that pattern.
- **Rationale**: a separate config keeps the test lint a separate named gate (FR-020) and lets its plants be run
  alone.

## R-07 Style lint (FR-024)

- **Decision**: Stylelint 17.16.0 with `postcss-lit` 1.4.1 as custom syntax for `*.ts` in
  `packages/elements/src`, and plain CSS for `*.css` in `packages/elements/src` and `packages/styles/src`. The rule is
  a local plugin `ocelle/token-only` (`gates/stylelint/token-only.ts`) that implements FR-024's allow-list exactly:
  every declaration value is parsed (postcss-value-parser, a Stylelint dependency) and each word, number, function and
  `var()` fallback is checked. Existing plugins (for example `stylelint-declaration-strict-value`) check whole values
  per property and cannot express FR-024's per-token rules (allowed unitless numbers only in five properties, `calc()`
  over tokens, raw `var()` fallbacks).
- **Risk**: Stylelint loads plugins with `import()`; Node 26 strips types for files outside `node_modules`, so a `.ts`
  plugin should load. The phase verifies it red-first; fallback is a `.js` plugin checked with `checkJs`.

## R-08 Mutation testing (FR-011 to FR-013)

- **Decision**: StrykerJS 10.1.1 (`@stryker-mutator/core`, `vitest-runner`, `typescript-checker`), driven by
  `gates/bin/mutation.ts`:
  1. Base: `--base <sha>`, else `OCELLE_MUTATION_BASE`, else in CI the merge base with `origin/$GITHUB_BASE_REF`;
     none of these: exit 2.
  2. `git diff --unified=0 <base> -- packages/*/src` (package source only, test code excluded) gives changed line
     ranges; no range: print "nothing to mutate" and exit 0 (US2 scenario 5).
  3. Stryker runs with `mutate` set to `file.ts:start-end` ranges, so only changed lines are mutated (FR-011).
  4. `thresholds.break: 100`: Stryker's score counts `Survived` and `NoCoverage` as undetected, so any survivor
     or uncovered mutant fails the run; `Killed`, `Timeout` and runtime errors pass it (FR-011's definitions).
  5. Equivalent mutants: `// Stryker disable next-line <mutator>: <reason>` next to the code; Stryker reports them
     as `Ignored` with the reason, and the wrapper prints them in a list for the review (FR-012); a disable comment
     without a reason fails the run.
- **Rationale**: line ranges give FR-011's "changed lines" precisely, so no incremental cache is needed and every
  run is cold (SC-005's "no earlier mutation result"). Issue #4's "incremental" intent is met by mutating only the
  change.
- **CI**: its own job with `timeout-minutes: 10` (FR-013).
- **Story workflow (FR-007)**: `mutation_command: "pnpm run gate:mutation"`; the story review command is changed (in
  `tooling/speckit/extensions/story/commands/speckit.story.review.md`, then reinstalled into `.specify/`) to run it
  with `OCELLE_MUTATION_BASE=$(cat <feature>/reviews/phase-N/base.sha)`.
- **Risk**: Stryker with Vitest browser mode for `@ocelle/elements` source is not needed in this feature (no element
  source exists); the first element feature verifies it.

## R-09 Gate scripts and their contract

- **Decision**: every gate is a command `pnpm run gate:<id>` backed by `gates/bin/<id>.ts` (or a tool invocation for
  typecheck, code lint, style lint, test lint and unit tests) with one contract (contracts/gate-cli.md): exit 0 pass,
  exit 1 the gate found defects (each printed as `path:line: message`), exit 2 the gate could not run. A registry
  `gates/gates.json` lists every gate: id, CI check name, command, and how its plants are presented.
- **Rationale**: exit 1 vs 2 lets the plant job tell "the gate caught the plant" from "the gate is broken", so a gate
  that crashes on its plant does not count as catching it.

## R-10 Plants and the plant job (FR-025)

- **Decision**: `gates/plants/<gate-id>/<case>/` holds one plant: its input files and `plant.json`
  (`{"expect": "fail" | "pass", "why": "..."}`). `pnpm run gate:plants` (`gates/bin/plants.ts`) runs, for every gate in
  `gates.json`, every case against the gate in plant mode (`--plant <dir>`), and fails when a `fail` case exits other
  than 1, a `pass` case exits other than 0, or a gate has no `fail` case. Plant forms per gate are in
  contracts/plants.md.
- Normal gate configurations exclude `gates/plants/**` (ESLint `ignores`, Stylelint `ignoreFiles`, Vitest `exclude`,
  `tsconfig` `exclude`, explicit roots for the scripts), so no normal gate reads a plant (FR-028, US3 scenario 8).

## R-11 Content-security check (FR-021)

- **Decision**: `gates/bin/csp.ts` scans the built output (`packages/*/dist/**/*.{js,css,html}`) with patterns for
  each construct of FR-021 (in HTML files and in template strings inside JS): `<script` (inline: no `src=`), `<style`,
  ` style=`, ` on[a-z]+=`, `eval(`, `new Function`, `Function(` called as a constructor, and `setTimeout`/`setInterval`
  whose first argument is a string literal. Packages build with `tsc` to `dist/` (no bundler yet; the elements bundle
  arrives with the first element feature).
- **Rationale**: pattern scanning is enough for compiled `tsc` output; an AST pass can replace it when a bundler
  minifies output.

## R-12 Prefix check (FR-022)

- **Decision**: `gates/bin/prefix.ts` over package source, test code and built output of the three packages. Name
  rule: `(?<![A-Za-z0-9_-])sk-` and `(?<![A-Za-z0-9_])--sk-`. Font rule: inside `font-family`/`font` declarations and
  `@font-face` `font-family` descriptors, case-insensitive match of FR-022's list.

## R-13 Sign-off check (FR-023)

- **Decision**: `gates/bin/signoff.ts` reads commit records from `git log --format=<record> <base>..<head>` (CI: the
  pull request range) or, in plant mode, from `commits.txt` in the same record format. A record carries the hash,
  parents, author `name <email>` and message. Merge commits (more than one parent) and `d08d413` are skipped; every
  other commit needs a `Signed-off-by:` trailer equal to its author.
- **Rationale**: no GitHub App and no third-party action, so the check runs the same locally, in CI and on plants.

## R-14 Install-and-pins check (FR-027)

- **Decision**: `gates/bin/pins.ts`: `pnpm install --frozen-lockfile --lockfile-only --offline` (fails when the
  lockfile does not match the manifests), a scan of every manifest's dependency fields for anything but an exact
  version, and checks that `.node-version` and `packageManager` hold exact versions. Plant mode runs the same on a
  copied mini-workspace in the plant directory.

## R-15 Configuration-copies check (FR-006)

- **Decision**: `gates/bin/config-copies.ts` compares the two story configuration files byte for byte and checks that
  their `test_pathspec` equals FR-028's test code
  (`:(glob)**/*.test.ts :(glob)**/*.spec.ts :(glob)**/test/** :(glob)**/*.stories.ts`), which the current copies
  already hold.

## R-16 CI

- **Decision**: GitHub Actions, one workflow `.github/workflows/ci.yml` on `pull_request`, one job per gate plus the
  plant job, each a separate named check (FR-020). Actions are pinned by full commit SHA. A shared setup step restores
  the pnpm store and Playwright cache and runs `pnpm run setup:online`. The mutation job has `timeout-minutes: 10`.

## R-17 Governance files (FR-030 to FR-035)

- **Decision**: `LICENSE` (Apache-2.0 text), `CONTRIBUTING.md`, `SECURITY.md`, `THIRD_PARTY_NOTICES` (no asset ships
  yet; states so) and `.github/CODEOWNERS` (`* @MOES-Media`). SC-006 is `gates/test/governance.test.ts`, a test of the
  repository's own files, run by `pnpm test`.
