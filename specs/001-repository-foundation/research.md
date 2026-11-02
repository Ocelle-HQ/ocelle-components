# Research: Repository Foundation (001)

Versions read from the npm registry and nodejs.org on 2026-11-02. Every version below is pinned exactly. Plan squad
round 1 re-pinned every registry package published less than 7 days before 2026-11-02 (R-04).

## R-01 Runtime and package manager

- **Decision**: Node.js 26.13.0 (current LTS, "Lithium", released 2026-10-28) pinned in `.node-version` and
  `package.json#engines`; pnpm 12.16.1 pinned in `package.json#packageManager` and `engines`. Node and pnpm are
  toolchain pins, not registry dependencies, so pnpm's release-age setting (R-04) does not govern them.
- **Rationale**: every tool chosen below supports Node 26 (Vitest `^22.12 || ^24 || >=26`, ESLint `>=24`,
  Stryker `>=22`, Stylelint `>=20.19`, Vite `>=22.12`). Node 26 runs TypeScript files natively by type stripping
  (`process.features.typescript` is `strip`), so gate scripts are TypeScript run by `node` with no build step. Type
  stripping does not support enums, namespaces, parameter properties or extensionless relative imports; R-02's
  compiler options make tsc reject what Node cannot run.
- **Alternatives**: Node 24 (older LTS; would work, but nothing needs it); a TS runner such as `tsx` (an extra
  dependency the runtime no longer needs).

## R-02 TypeScript version and compiler options

- **Decision**: TypeScript 6.0.3. `tsconfig.base.json` sets `strict`, `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `erasableSyntaxOnly` (rejects enums, namespaces and parameter properties, TS1294),
  `verbatimModuleSyntax` (type-only imports are written `import type`, so stripping leaves no dangling import),
  `module: nodenext`, `allowImportingTsExtensions` and `rewriteRelativeImportExtensions`. Relative imports carry the
  `.ts` extension, which Node needs when it runs the file and which tsc rewrites to `.js` when a package builds to
  `dist/`. An extensionless relative import is a type error under `nodenext` (TS2835). tsc also accepts `./x.js` for
  `x.ts`, which Node cannot run from source, so the code lint rejects relative `.js` import specifiers in repository
  TypeScript (`no-restricted-imports` pattern, R-05). The root `tsconfig.json` (typecheck gate) sets `noEmit`; each
  package's `tsconfig.json` extends the base and sets `rootDir: src` and `outDir: dist` (TypeScript 6 requires an
  explicit `rootDir` when emitting, TS5011).
- **Rationale**: typescript-eslint 8.72.0 (needed for the code lint and by `@vitest/eslint-plugin`) declares
  `typescript >=4.8.4 <6.1.0`; TypeScript 7.0.2 (the native compiler) is outside it. `@vitest/eslint-plugin` needs
  `>=6.0.0`. 6.0.3 is the only line both accept. Probed with tsc 6.0.3 on 2026-11-02: with these options a package
  builds `import { a } from "./a.ts"` to `"./a.js"` (exit 0), an enum fails with TS1294 and an extensionless import
  with TS2835.
- **Alternatives**: TypeScript 7.0.2 (rejected: unsupported by the lint stack; revisit when typescript-eslint
  supports it); a separate build tsconfig per package without `.ts` imports (rejected: gate scripts run from source
  need the extension anyway).

## R-03 Test runner (FR-004, FR-005)

- **Decision**: Vitest 5.0.5 with `projects`: `tokens` and `styles` (Node environment), `elements` (browser mode,
  `@vitest/browser-playwright` 5.0.5 with Playwright 1.64.1, Chromium only, headless), `gates` (Node). Vite 8.3.5 is
  pinned in the root devDependencies: it is a required peer of Vitest (`^6.4.0 || ^7.0.0 || ^8.0.0`) and would
  otherwise be auto-installed at an unpinned version. One root command, `pnpm test`, runs `gates/bin/test.ts`, which
  (1) checks that Playwright's Chromium executable exists and otherwise exits 2 naming `pnpm run setup:online`
  (FR-004, US1 scenario 9), then (2) runs `vitest run --reporter json` and classifies the report (contracts/gate-cli.md).
  Phase 1 wires `pnpm test` plainly to `vitest run`; phase 2's green commit rewires it to `gates/bin/test.ts`.
- **Test seam** (plan squad round 2): `test.ts` takes `--root <dir>` (the workspace whose tests it runs; default the
  repository root) and reads the browser path from `PLAYWRIGHT_BROWSERS_PATH`, like `setup-offline.ts` (R-04). Its
  tests in `gates/test/` build a temporary workspace from a fixture tree under `gates/test/fixtures/` (package
  directories with test files), copy the repository's `vitest.config.ts` into it unchanged, link `node_modules` from
  the workspace, and run `test.ts --root <tmp>`. Fixtures are excluded from the repository's own Vitest run (R-10),
  so the tests never recurse into the repository suite, and they exercise the repository's configuration.
- **Which US1 scenarios are `test.ts` behaviour** (red first in phase 2, each assertion false at the phase base where
  `pnpm test` is plain `vitest run`): scenario 9 (browser missing: exit 2, a message naming
  `pnpm run setup:online`, no test skipped); scenario 5 in the gate contract's form (exit 1 and one finding line per
  failed test, rule = the test's full name, which plain Vitest does not print); FR-004's "no test file at all" as
  exit 2 with "no test file found" (a broken file pattern is "could not run"; plain Vitest exits 1); a test file that
  fails to load as exit 2. **Which hold through Vitest at the phase 1 base** and are therefore not claimed red first:
  scenario 4 (all packages' tests run, exit 0) and scenario 10 (a project with no test file beside one with passing
  tests exits 0). They are proven by the unit-tests plants, whose pass plants each hold a passing test in one project
  only, so the other projects are empty (contracts/plants.md), and by quickstart step 3 on the repository.
- **Chromium evidence (US1 scenario 6)**: `packages/elements/test/chromium.test.ts` is a passing sample test that
  asserts something only real Chromium gives: `navigator.userAgentData.brands` includes `Chromium` (absent under
  jsdom, happy-dom, Firefox and WebKit). TypeScript 6.0.3's `lib.dom.d.ts` declares neither `userAgentData` nor
  `NavigatorUAData` (probed, plan squad round 2), so the test declares a minimal local type,
  `interface NavigatorUAData { readonly brands: readonly { readonly brand: string; readonly version: string }[] }`,
  and reads `navigator` through it (`(navigator as Navigator & { readonly userAgentData?: NavigatorUAData })`), with
  no `any` and no lint disable, so the strict typecheck and `strictTypeChecked` lint both pass. The unit-tests
  Chromium plant (contracts/plants.md) is the same assertion in the same typed form with a wrong expected brand, and
  its expected finding names that test and a message containing `Chromium`, so a plant run that fails for any other
  reason (Chromium not starting, a Node environment) does not count as caught.
- **Rationale**: one runner for Node and browser tests, real Chromium for elements (constitution III and V need the
  real accessibility tree), and the tooling issue #4 named. Vitest 5.1.0 was published on the day of planning and
  is outside the release-age window (R-04); 5.0.5 (2026-10-15) is the newest release outside it.
- **Alternatives**: Web Test Runner (second test runner later for Node code); jsdom/happy-dom (not a real browser,
  FR-005 forbids).

## R-04 Online install, offline setup and supply-chain policy (FR-008, FR-027)

- **Decision**:
  - `pnpm run setup:online`: `pnpm install --frozen-lockfile`, then `pnpm exec playwright install chromium`. The
    pnpm store and Playwright's browser cache (`~/.cache/ms-playwright`, or `PLAYWRIGHT_BROWSERS_PATH`) are outside
    the repository.
  - `pnpm run setup:offline` (the story configuration's `setup_command`): in phase 1 a plain
    `pnpm install --frozen-lockfile --offline`; from phase 2 `gates/bin/setup-offline.ts`, which runs that command,
    translates pnpm's missing-tarball error into "missing: <package>; run pnpm run setup:online", then checks the
    Chromium executable the same way as `pnpm test`, and exits 2 on either failure.
  - **Test seam**: `setup-offline.ts` takes the pnpm store directory (pnpm's `store-dir` setting, from the
    environment) and `PLAYWRIGHT_BROWSERS_PATH` from its environment and passes the environment on to pnpm. Its
    tests run it against an empty temporary store and an empty temporary browser path, with the registry setting
    pointed at a local TCP socket the test opens, and assert exit 2, a message naming the missing package (or
    Chromium) and `pnpm run setup:online`, and zero connections to that socket (FR-008 "never falls back to the
    network"). A test against a store filled by a fixture lockfile with no dependencies asserts exit 0.
  - **Supply-chain policy** (operator decision, plan squad round 1): `pnpm-workspace.yaml` sets
    `minimumReleaseAge: 10080` (7 days, in minutes) with `minimumReleaseAgeStrict: true` and no
    `minimumReleaseAgeExclude`, and `allowBuilds: {}`, an explicit, empty allow-list of dependencies that may run
    install scripts (no dependency runs one; Playwright's browser download is the explicit `playwright install` step,
    not a lifecycle script). Every registry package in plan.md was published at least 7 days before 2026-11-02;
    re-pinned for this: Vitest and @vitest/browser-playwright 5.1.0 → 5.0.5, ESLint 10.14.0 → 10.13.0,
    typescript-eslint 8.72.1 → 8.72.0, @types/node 26.6.6 → 26.6.5. The pins gate enforces both settings (R-14).
    Adding an entry to `allowBuilds` needs a change to the pins gate, so it is reviewed as a gate change. Phase 1
    verifies that pnpm 12.16.1 reads both settings (these names appear in pnpm 12.16.1's own workspace state); if a
    name differs, the phase uses pnpm 12.16.1's name for the same policy and records it here.
- **Rationale**: `--offline` makes pnpm refuse the network instead of falling back to it, which is FR-008's rule.
  Exact pins and a lockfile freeze whatever was resolved, including a release a few hours old; the release-age
  window is when compromised releases are usually found and withdrawn, and every CI job installs dependencies.
- **Alternatives**: exact pins and the lockfile with pnpm's default build-script blocking and no cooldown (fork
  option (b), not chosen).

## R-05 Code lint (FR-020)

- **Decision**: ESLint 10.13.0 flat config (`eslint.config.ts`) with `@eslint/js` 10.0.1 recommended and
  typescript-eslint 8.72.0 `strictTypeChecked` + `stylisticTypeChecked`, over all repository TypeScript except
  `gates/plants/` and `gates/test/fixtures/`, plus `no-restricted-imports` rejecting relative `.js` specifiers (R-02).
  Its plant violates `@typescript-eslint/no-floating-promises`, a rule the test lint does not have. The type-aware
  rules use typescript-eslint's project service, which resolves each file through the nearest `tsconfig.json`; a
  lint plant carries its own `tsconfig.json` under the plant configuration rule (it extends the root
  `tsconfig.json` and sets only `include` and `exclude`, R-10), so the project service resolves the plant file
  through it with the repository's compiler options and no parser option changes in plant mode. ESLint loads a
  `.ts` config through jiti unless the `unstable_native_nodejs_ts_config` flag is passed, and jiti is only an
  optional peer of ESLint, so jiti 2.7.0 is pinned in the root devDependencies. The stable jiti path is preferred
  over an `unstable_` flag.

## R-06 Test lint (FR-010)

- **Decision**: a second ESLint config (`eslint.test.config.ts`, loaded through jiti like R-05) over all test code
  except `gates/test/fixtures/`, with `@vitest/eslint-plugin` 1.6.28 rules `expect-expect`, `no-disabled-tests`,
  `no-focused-tests`, `no-conditional-expect`, `no-standalone-expect`, `valid-expect` (with `alwaysAwait`) and
  `valid-expect-in-promise`, as errors; plus a local rule `ocelle/no-snapshot-only` (in `gates/eslint/`) that
  reports a test whose only assertions are snapshot matchers (`toMatchSnapshot`, `toMatchInlineSnapshot`,
  `toMatchFileSnapshot`). No upstream rule covers that pattern. None of these rules needs type information, so the
  test-lint config uses the typescript-eslint parser without the project service and its plants carry no
  `tsconfig.json`; if phase 3 finds a rule that needs types, the test-lint plants carry the same plant
  `tsconfig.json` as the lint plants (R-05, R-10).
- **Rationale**: a separate config keeps the test lint a separate named gate (FR-020) and lets its plants be run
  alone.

## R-07 Style lint (FR-024)

- **Decision**: Stylelint 17.16.0 with `postcss-lit` 1.4.1 as custom syntax for `*.ts` in `packages/elements/`, and
  plain CSS for `*.css` in `packages/elements/` and `packages/styles/`, limited to package source as FR-028 defines
  it: `ignoreFiles` holds `gates/plants/**`, `gates/test/fixtures/**`, `packages/*/dist/**` and the test-code globs
  (`**/*.test.ts`, `**/*.spec.ts`, `**/test/**`, `**/*.stories.ts`). `allowEmptyInput` is on, because this feature
  ships no stylesheet. A wrong or stale glob cannot hide behind it: the style-lint plants are repo-tree plants run
  in normal mode (R-10), so a glob that misses `packages/elements/src/*.ts` or the `.css` files makes the fail plants
  pass and the plant job fail (US3 scenario 9). The rule is a local plugin `ocelle/token-only`
  (`gates/stylelint/token-only.ts`) that implements FR-024's allow-list exactly: every declaration value is parsed
  with postcss-value-parser 4.2.0, and each word, string, number, function and `var()` fallback is classified:
  - **allowed**: `0`; percentages; unitless numbers in `line-height`, `flex`, `flex-grow`, `flex-shrink`,
    `z-index`, `opacity` and `order`; `fr` lengths; `var()` references (their fallbacks are checked); `calc()` whose
    operands are allowed values; keywords; strings; author-defined and dashed identifiers;
  - **keyword**: any identifier that is not a named colour and is not in a `font` or `font-family` value. Named
    colours are a fixed list in the plugin (the CSS Color 4 named colours; `transparent` and `currentColor` are
    keywords, and system colours such as `Canvas` are keywords);
  - **strings and identifiers**: strings are allowed except in `font` and `font-family` values; author-defined and
    dashed identifiers (for example `animation-name: fade`, `anchor-name: --tip`, `position-anchor: --tip`,
    `grid-area: main`, `container-name: card`, `view-transition-name: x`, `counter-reset: item`) are identifiers and
    fall under the keyword rule;
  - **font values**: in `font` and `font-family` only the CSS-wide keywords (`inherit`, `initial`, `unset`, `revert`,
    `revert-layer`) and `var()` are allowed; every other identifier or string is a raw font family;
  - **rejected**: everything else, including every length with a unit, every time, angle and resolution, hex
    colours, colour functions (`rgb()`, `hsl()`, ...), named colours, raw font families, numbers outside the
    unitless properties (so numeric `font-weight` and `aspect-ratio` values), raw `var()` fallbacks and raw `calc()`
    operands.
  The plugin and postcss-lit resolve `postcss-value-parser` and `postcss` (the peer of postcss-lit, 8.5.31) from the
  root manifest, where both are exact devDependencies; nothing relies on a transitive dependency or on hoisting.
  Existing plugins (for example `stylelint-declaration-strict-value`) check whole values per property and cannot
  express FR-024's per-token rules.
- **Risk**: Stylelint loads plugins with `import()`; Node 26 strips types for files outside `node_modules`, so a `.ts`
  plugin should load. Phase 4 verifies it red-first; fallback is a `.js` plugin checked with `checkJs`.

## R-08 Mutation testing (FR-011 to FR-013)

- **Decision**: StrykerJS 10.1.1 (`@stryker-mutator/core`, `vitest-runner`, `typescript-checker`), driven by
  `gates/bin/mutation.ts`:
  1. Base: `--base <sha>` (required; CI passes the pull request's base commit, the story review passes the phase's
     base commit). Missing or unresolvable: exit 2.
  2. `git diff --unified=0 <base> -- <scope>` gives changed line ranges, where `<scope>` is FR-028's package source
     TypeScript and gate source, written as pathspecs:
     `:(glob)packages/*/**/*.ts :(glob)gates/bin/**/*.ts :(glob)gates/lib/**/*.ts :(glob)gates/eslint/**/*.ts
     :(glob)gates/stylelint/**/*.ts` minus `:(exclude,glob)**/*.test.ts :(exclude,glob)**/*.spec.ts
     :(exclude,glob)**/test/** :(exclude,glob)**/*.stories.ts :(exclude,glob)**/*.d.ts
     :(exclude,glob)packages/*/dist/**`. No range: print "nothing to mutate" and exit 0 (US2 scenario 5).
  3. Stryker runs with `mutate` set to `file.ts:start-end` ranges, so only changed lines are mutated (FR-011).
     `--files <path>[,<path>...]` limits the run to those changed files (a CI shard); without it every changed file
     is mutated (the story review's local run).
  4. The wrapper decides from Stryker's JSON report (`reporters` includes `json`), not from Stryker's exit code or
     `thresholds.break` (a crash and a low score both exit 1): any `Survived` or `NoCoverage` mutant on a changed
     line is a finding (exit 1); `Killed`, `Timeout`, `RuntimeError` and `CompileError` pass (FR-011's definitions);
     no report, or a report from a failed dry run, is exit 2.
  5. Equivalent mutants: `// Stryker disable next-line <mutator[,mutator]|all>: <reason>` directly above the code;
     Stryker reports them as `Ignored` with the reason, and the wrapper prints each as a record line (path, line,
     mutator, reason) for the review (FR-012). In the changed files the wrapper rejects, as findings, a next-line
     comment without a reason and every other disable form (`// Stryker disable <...>` without `next-line`, which
     disables until a `// Stryker restore`, including `// Stryker disable all`), since only the next-line form is
     "next to the mutated code".
- **Gate source is in scope** (operator decision, plan squad round 1): gate tests in `gates/test/` import the gate's
  exported functions and run them in-process in the `gates` Vitest project, which the Stryker vitest-runner reaches.
  Each `gates/bin/<id>.ts` is a thin entry that calls an exported `run(argv, io)` returning the exit code; only its
  `import.meta.main` guard line behaves differently only when the file runs as a script. A child-process test per
  entry covers that line; Stryker cannot see a child process, so a mutant of the guard that survives may be recorded
  as equivalent with a next-line record and its reason (FR-012), which the review sees in the report.
- **Rationale**: line ranges give FR-011's "changed lines" precisely, so no incremental cache is needed and every
  run is cold (SC-005's "no earlier mutation result"). Issue #4's "incremental" intent is met by mutating only the
  change.
- **CI, sharded** (operator decision, plan squad round 2; spec FR-013/SC-005 amended): three jobs, all with checkout
  `fetch-depth: 0` and `--base ${{ github.event.pull_request.base.sha }}` (contracts/ci-checks.md). The merge ref
  minus that commit is exactly the pull request's change.
  1. `mutation-plan` runs `pnpm run gate:mutation -- --base <sha> --plan`, which prints the shards as JSON and sets
     them as the job output (exit 2 on an unresolvable base). Split: the changed files of step 2, sorted by path,
     are filled greedily into shards; the next file starts a new shard when adding it would exceed 10 files or 500
     changed lines; a file with more than 500 changed lines is a shard on its own (FR-013 expects such a change to
     be split). No changed file: zero shards.
  2. `mutation-shard`, a matrix over the shards (skipped when there are none), each shard a job with
     `timeout-minutes: 10` that runs `pnpm run gate:mutation -- --base <sha> --files <the shard's files>`. A timeout
     ends the job as a failure.
  3. `mutation`, the check named **Mutation testing**, `needs` both and runs `if: always()`; it passes only when
     `mutation-plan` succeeded and either `mutation-shard` succeeded or it was skipped because the plan had zero
     shards. A failed, cancelled or timed-out shard, or a failed plan, fails it. This is the check the ruleset
     requires (plan.md § Verification); the helper jobs are not required by name, since the matrix names vary.
  The split (`--plan`) and `--files` are wrapper behaviour, tested red first in phase 3 by gate tests on fixture
  repositories. No gate source file of this feature has more than 500 lines, so this feature's own pull request
  splits into shards within the bound; SC-005 is measured on one full shard (quickstart step 11).
- **Story workflow (FR-007)**: `mutation_command: "pnpm run gate:mutation"`; the story review command is changed to
  read `FEATURE_DIR/reviews/phase-<N>/base.sha` and run `pnpm run gate:mutation -- --base <sha>`, a command the
  `.claude/settings.json` allowlist (`Bash(pnpm run:*)`) covers in unattended runs. No environment variable is used.
  The source is `tooling/speckit/extensions/story/commands/speckit.story.review.md`; the reinstall
  (`specify extension remove story && specify extension add --dev tooling/speckit/extensions/story`,
  tooling/speckit/README.md) updates `.specify/extensions/story/commands/speckit.story.review.md`,
  `.specify/extensions/story/.specify-dev/agent-commands/claude/speckit-story-review/SKILL.md` and
  `.claude/skills/speckit-story-review/SKILL.md`, the copy the reviewer follows.
- **Risk**: Stryker with Vitest browser mode for `@ocelle/elements` source is not needed in this feature (no element
  source exists); the first element feature verifies it.

## R-09 Gate scripts and their contract

- **Decision**: every gate is a command `pnpm run gate:<id>` backed by `gates/bin/<id>.ts` (or a wrapped tool
  invocation for typecheck, code lint, style lint, test lint and unit tests) with one contract
  (contracts/gate-cli.md): exit 0 pass, exit 1 the gate found defects (each printed as a finding in the one format
  of data-model.md § Finding), exit 2 the gate could not run. Every entry catches any exception at the top and exits
  2, so an uncaught error (which Node reports as exit 1) never reaches the plant job as "caught". A registry
  `gates/gates.json` lists every gate: id, CI check name, command, and how its plants are presented.
- **Classification from structured output** (operator decision, plan squad round 1): tool exit codes cannot tell
  findings from breakage (tsc exits 2 on a type error and 1 on a missing project; Stylelint's lint problem is 2 and
  its fatal error 1; Stryker and Vitest exit 1 both on findings and on crashes), so each wrapper reads the tool's
  structured output (contracts/gate-cli.md table) and exits 1 only when that output holds findings.
- **Rationale**: exit 1 vs 2, together with the expected findings of each plant (R-10), lets the plant job tell "the
  gate caught the plant" from "the gate is broken".

## R-10 Plants and the plant job (FR-025)

- **Decision**: `gates/plants/<gate-id>/<case>/` holds one plant: its input files and `plant.json`
  (data-model.md § Plant): `expect` (`fail`, `pass` or `error`), `why`, and for `fail` plants the exact list of
  expected findings (and for a mutation pass plant the expected equivalent-mutant records). `pnpm run gate:plants`
  (`gates/bin/plants.ts`) first checks the registry (below), then runs, for every gate in `gates.json`, every case
  against the gate, and fails when: a `fail` case does not exit 1 or its findings differ from the expected list
  (as a set of location and rule, plus any message substring the plant gives); a `pass` case does not exit 0 with
  no finding (and, where given, exactly the expected records); an `error` case does not exit 2; a gate lacks a
  `fail`, a `pass` or an `error` case; or a plant has no or an invalid `plant.json`.
- **Same configuration, only the inputs swapped** (FR-025, constitution VIII): plant mode runs the gate with the
  repository's own configuration. Typecheck and lint plants carry a `tsconfig.json` with no keys other than
  `extends`, `include` and `exclude`; in a `fail` or `pass` plant its `extends` resolves to the repository's root
  `tsconfig.json`, the file the typecheck gate runs (`tsc -p tsconfig.json`), so every option the gate runs with,
  including any a pull request adds to the root file, applies to the plant (operator decision, plan squad round 2).
  `exclude` is allowed because it is inherited through `extends`: the root file excludes `gates/plants/**`, so the
  plant sets `"exclude": []` (or a narrower list) to let its own files in. The typecheck `error` plant keeps the same
  keys but its `extends` names a file that does not exist (tsc reports `TS5083`, which the wrapper classifies as
  exit 2), so the missing base is its only breaking input. The lint plant's `tsconfig.json` is what typescript-eslint's
  project service resolves the plant file through (R-05); test-lint plants carry none (R-06). ESLint and Vitest load
  the repository's configs and only lift the `gates/plants/` exclusion for the plant directory; unit-test plants run
  inside the named project of the repository's `vitest.config.ts`; style lint, prefix, CSP, sign-off and mutation
  plants run in a temporary repository with the repository's configuration files (below); mutation uses the
  repository's `stryker.config.json`. The plant job rejects (exit 1, "plant X carries gate configuration") a plant
  directory that holds a tsconfig with any key other than `extends`, `include` and `exclude` (such as
  `compilerOptions`, `files` or `references`), a `fail` or `pass` plant whose tsconfig `extends` does not resolve to
  the root `tsconfig.json`, a tsconfig in a plant of a gate other than typecheck and lint, or any ESLint, Stylelint,
  Vitest, Vite or Stryker configuration file.
- **Normal input collection for file, commit and mutation plants** (operator decisions, plan squad rounds 1 and 2):
  for sign-off and mutation (round 1), and for style lint, prefix and CSP (round 2, plant form `repo-tree`), the plant
  job builds a temporary repository from the plant and runs the gate in normal mode with `--root <tmp>` (plus
  `--range` or `--base`); `--root` changes only the repository root. Repo-tree: the plant's `tree/` directory holds
  its input files at repository paths (for example `packages/elements/src/x.ts`, `packages/elements/src/x.stories.ts`,
  `packages/styles/src/x.css`, `packages/tokens/dist/index.js`); the plant job copies the repository's gate
  configuration files (`stylelint.config.ts`, the root `package.json`, the tsconfig files) into a temporary
  directory unchanged, lays `tree/` over it, links `node_modules` from the workspace and runs the gate there. So the
  gate's own file globs, its exclusions (test code, stories, `dist/`) and the path-bound postcss-lit syntax of R-07
  are what decide which plant files it checks: a glob that misses covered files makes a fail plant pass and the
  plant job fail. Sign-off: one commit per
  record of `commits.txt` (author, message, and for a merge record a real merge of two branches), then
  `--range <first parent of the first record>..HEAD`. Mutation: a first commit with the repository's gate
  configuration (`stryker.config.json`, `vitest.config.ts`, the tsconfig files) and the plant's `base/` tree laid
  out at repository paths (for example `packages/tokens/src/x.ts` or `gates/lib/x.ts`), a second commit with the
  `head/` tree, `node_modules` linked from the workspace, then `--base <first commit>`. So base resolution, the git
  log range and the diff parsing are exercised by every such plant.
- **Registry check**: the plant job compares the gate ids in `gates.json`, the gate jobs of
  `.github/workflows/ci.yml` (all jobs except the plant job) and the FR-020 list held in `gates/lib/registry.ts`, and
  exits 1 naming each id missing from one of them ("gate X has no registry entry", "gate X has no CI job"). Its own
  plants live in `gates/plants/plants/<case>/` (a `gates.json` and `ci.yml` pair: one with a missing entry, one with
  a missing job, one matching pass plant); the plant job runs them through the same check after the gates. A gate
  is matched to its CI job by job id; a registry entry's `helperJobs` (data-model.md) names the extra jobs that serve
  it (`mutation-plan` and `mutation-shard` for `mutation`), which the check does not count as gates. The registry
  check compares files that one pull request can change together, so it does not stop a coordinated removal of a
  gate from `ci.yml`, `gates.json` and `registry.ts`; the ruleset on `main` that requires the twelve check names does
  (plan.md § Verification, operator decision, plan squad round 2), and `gates/README.md` lists that required set.
- **Gate tests and their inputs** (operator decision, plan squad round 1): gate tests in `gates/test/` read their
  inputs from `gates/test/fixtures/` and never from `gates/plants/`. Fixtures are test code by the story
  configuration's `test_pathspec` (`**/test/**`), so they arrive in red commits with the tests that use them. They
  are excluded from every normal gate like the plants: Vitest `exclude` (a fixture named `*.test.ts` is never run),
  both ESLint configs' `ignores` (so the test lint does not see a vacuous-test fixture), Stylelint `ignoreFiles`,
  `tsconfig` `exclude`, and the mutation pathspecs (test code). This is the exception FR-028 records.
- Normal gate configurations exclude `gates/plants/**` and `gates/test/fixtures/**` (ESLint `ignores`, Stylelint
  `ignoreFiles`, Vitest `exclude`, `tsconfig` `exclude`, explicit roots for the scripts), so no normal gate reads a
  plant (FR-028, US3 scenario 8).

## R-11 Content-security check (FR-021)

- **Decision** (operator decision, plan squad round 1): `gates/bin/csp.ts` checks the built output
  (`packages/*/dist/**/*.{js,css,html}`) by parsing, not by text patterns:
  - **Markup**: HTML files, and the static parts of every template literal and string literal in built JavaScript
    that contains `<`, are run through the parse5 8.0.1 HTML tokenizer. For a template literal the static parts are
    joined with a placeholder value in place of each expression, so `style=${x}` is still an attribute. The
    tokenizer finds attributes regardless of separator (space, tab, newline, `/`). Findings: a `<script>` start tag
    without a `src` attribute, any `<style>` start tag, any `style` attribute, any attribute whose name starts with
    `on`.
  - **Dynamic code**: every JavaScript file is parsed with the TypeScript 6.0.3 compiler API (`createSourceFile`,
    script kind JS; no extra dependency). Findings: a call whose callee is `eval`, a member `.eval` of `globalThis`,
    `window` or `self`, or an indirect form such as `(0, eval)(...)`; `new Function(...)` and `Function(...)` (also
    as a member of `globalThis`, `window` or `self`); `setTimeout`/`setInterval` (bare or as such a member) whose
    first argument is a string literal, a template literal or a concatenation containing one.
  - An output file that does not parse is exit 2 (the breaking plant).
  Identifiers that only contain these names (`retrieval(`, `isFunction(`, `createFunction(`) are not calls of them
  and pass. Packages build with `tsc` to `dist/` (no bundler yet; the elements bundle arrives with the first element
  feature). `javascript:` URLs are outside FR-021 and need an operator spec change to be added.
- **Rationale**: text patterns missed newline- and `/`-separated attributes and indirect eval, and flagged harmless
  identifiers; a tokenizer and a parser also hold for minified bundler output later.
- **Alternatives**: a stricter text scan (fork option (b)); a runtime check in Chromium under the constitution IV
  header (option (c)); neither chosen.

## R-12 Prefix check (FR-022)

- **Decision**: `gates/bin/prefix.ts` over package source, test code and built output of the three packages. Name
  rule, matched case-insensitively (the `i` flag; HTML lower-cases tag names, so `<SK-Button>` and
  `document.createElement('SK-BUTTON')` create an `sk-button` element): `(?<![A-Za-z0-9_-])sk-` and
  `(?<![A-Za-z0-9_])--sk-`. The boundary look-behind still keeps `task-list`, `desk-row` and `--risk-level` passing
  in any case. A fail plant holds `<SK-Button>` (contracts/plants.md). Font rule: inside `font-family`/`font` declarations and
  `@font-face` `font-family` descriptors, case-insensitive match of FR-022's list.

## R-13 Sign-off check (FR-023)

- **Decision**: `gates/bin/signoff.ts` reads commit records from `git log --format=<record> <base>..<head>` (in CI the
  pull request's base and head commits). A record carries the hash, parents, author `name <email>` and message.
  Merge commits (more than one parent) and the root commit are skipped; the root commit is exempt only by its full
  hash `d08d4133bf0034e3d1ff29cddf2b0f13ca63290a` and only when it has no parent (FR-023 exempts one commit; a
  7-hex prefix could be mined in minutes). A gate test fixture record whose hash starts with `d08d413` but differs
  from the full hash, or that has a parent, is still reported `no-signoff`. Every other commit needs a
  `Signed-off-by:` trailer equal to its author. A range that does not resolve, or that holds no commit, is exit 2. Plants are `commits.txt`
  files in the same record format, from which the plant job builds a temporary repository and runs the gate in
  normal mode (R-10). Every identity in a plant is invented and uses a reserved domain (RFC 2606, for example
  `Ada Example <ada@example.com>`), never a real name or address (FR-034).
- **Rationale**: no GitHub App and no third-party action, so the check runs the same locally, in CI and on plants.

## R-14 Install-and-pins check (FR-027)

- **Decision**: `gates/bin/pins.ts`:
  - `pnpm install --frozen-lockfile --lockfile-only --offline` (fails when the lockfile does not match the
    manifests);
  - a scan of every manifest's dependency fields: an exact version passes; a dependency on `@ocelle/tokens`,
    `@ocelle/styles` or `@ocelle/elements` passes only as `workspace:<exact version>` equal to that package's current
    `version` (bumped in lockstep; operator decision, plan squad round 1); anything else (`^`, `~`, ranges, tags,
    `workspace:*`, `workspace:^`, `workspace:~`, a `workspace:` version that differs from the package's) is a finding;
  - `.node-version` and `packageManager` hold exact versions;
  - `pnpm-workspace.yaml` sets `minimumReleaseAge` to at least 10080 with `minimumReleaseAgeStrict: true` and no
    `minimumReleaseAgeExclude` entry, and `allowBuilds` is present with no entry set to `true` and
    `dangerouslyAllowAllBuilds` is absent; a missing or loosened setting is a finding (R-04; operator decision, plan
    squad round 1);
  - hoisting stays off: `shamefullyHoist`, a non-empty `publicHoistPattern` or a `nodeLinker` other than `isolated`
    is a finding, so root files resolve only declared dependencies.
  Plant mode runs the same on a copied mini-workspace in the plant directory.

## R-15 Configuration-copies check (FR-006)

- **Decision**: `gates/bin/config-copies.ts` compares the two story configuration files byte for byte and checks that
  their `test_pathspec` equals FR-028's test code
  (`:(glob)**/*.test.ts :(glob)**/*.spec.ts :(glob)**/test/** :(glob)**/*.stories.ts`), which the current copies
  already hold.

## R-16 CI

- **Decision**: GitHub Actions, one workflow `.github/workflows/ci.yml` on `pull_request`, one job per gate plus the
  plant job, each a separate named check (FR-020). Actions are pinned by full commit SHA. The workflow sets
  top-level `permissions: contents: read` and nothing else; every `actions/checkout` step sets
  `persist-credentials: false`, so the token is not left in `.git/config` for dependency or pull-request code; no job
  references a secret. A shared setup step restores the pnpm store and Playwright cache and runs
  `pnpm run setup:online`. Mutation testing runs as a plan job, a matrix of shard jobs each with
  `timeout-minutes: 10`, and the verdict job named **Mutation testing** (R-08); the mutation jobs and the sign-off
  job check out with `fetch-depth: 0` and take their base from `github.event.pull_request.base.sha` (R-08, R-13).
- **Required checks** (operator decision, plan squad round 2): the workflow runs the pull request's own `ci.yml`, so
  only a list held outside the branch makes a gate block the merge. The operator configures a ruleset (or branch
  protection) on `main` that requires the twelve check names of contracts/ci-checks.md, as a step of the feature
  verification (plan.md § Verification); `gates/README.md` lists the same twelve names, so a change to the set is
  visible in review and is followed by a ruleset change the operator makes.
- **Rationale**: every job installs third-party dev tools and runs pull-request code; same-repository pull requests
  get the repository's default token permissions, which may be read-write.

## R-17 Governance files (FR-030 to FR-035)

- **Decision**: `LICENSE` (Apache-2.0 text), `CONTRIBUTING.md`, `SECURITY.md`, `THIRD_PARTY_NOTICES` (no asset ships
  yet; states so) and `.github/CODEOWNERS` (`* @MOES-Media`). SC-006 is `gates/test/governance.test.ts`, a test of the
  repository's own files, run by `pnpm test`.
- **Verification** (operator decision, plan squad round 1; moved to the operator, plan squad round 2): SC-006 checks
  text only, and GitHub ignores a CODEOWNERS owner that is not a user or `@org/team` with write access. Agents cannot
  push, open a pull request or call `gh api` (`.claude/settings.json` deny list; the story implement command says
  "Do not push"), so this is not part of phase 5 or its review. After the operator pushes the branch and opens the
  pull request, the operator confirms on GitHub that it reports no CODEOWNERS errors for the file on the pull request
  branch and that `@MOES-Media` is a user or team with write access to the repository, and records the result in
  `specs/001-repository-foundation/verification.md` (plan.md § Verification), together with the other GitHub-side
  checks (the twelve named checks, the required-check ruleset, the SC-001 and SC-005 timings). If the owner is not
  valid, the operator names a replacement owner, and FR-032/FR-035 are amended through the operator. FR-032's wording
  is unchanged.
