# Research: Repository Foundation (001)

Versions read from the npm registry and nodejs.org on 2026-11-02. Every version below is pinned exactly. Plan squad
round 1 re-pinned every registry package published less than 7 days before 2026-11-02 (R-04).

## R-01 Runtime and package manager

- **Decision**: Node.js 26.13.0 (current LTS, "Lithium", released 2026-10-28) pinned in `.node-version` and
  `package.json#engines`; pnpm 12.16.1 pinned in `package.json#packageManager` and `engines`.
- **Toolchain exemption from the release-age window** (operator decision, plan squad round 3): Node and pnpm are
  toolchain pins, and the 7-day window of R-04 does not apply to them. Both pins are inside it and are kept
  knowingly: pnpm 12.16.1 was published on 2026-10-27 and Node 26.13.0 released on 2026-10-28, 6 and 5 days before
  pinning on 2026-11-02. pnpm's `minimumReleaseAge` setting governs only the packages pnpm installs, and the pins
  gate (R-14) checks only that `.node-version` and `packageManager` are exact, not their age.
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
  `@vitest/browser-playwright` 5.0.5 with Playwright 1.64.1, Chromium only, headless), `gates` (Node, in-process
  gate tests) and `gates-integration` (Node, `gates/test/integration/`: tests that start a real tool; Stryker does
  not run it, R-08, plan squad round 3). Vite 8.3.5 is
  pinned in the root devDependencies: it is a required peer of Vitest (`^6.4.0 || ^7.0.0 || ^8.0.0`) and would
  otherwise be auto-installed at an unpinned version. One root command, `pnpm test`, runs `gates/bin/test.ts`, which
  (1) checks that Playwright's Chromium executable exists and otherwise exits 2 naming `pnpm run setup:online`
  (FR-004, US1 scenario 9), then (2) runs `vitest run --reporter json` and classifies the report (contracts/gate-cli.md).
  Phase 1 wires `pnpm test` plainly to `vitest run`; phase 2's green commit rewires it to `gates/bin/test.ts`.
- **Test seam** (plan squad round 2): `test.ts` takes `--root <dir>` (the workspace whose tests it runs; default the
  repository root) and reads the browser path from `PLAYWRIGHT_BROWSERS_PATH`, like `setup-offline.ts` (R-04). Its
  report classification is tested in the `gates` project on recorded Vitest JSON reports; its end-to-end tests in
  `gates/test/integration/` build a temporary workspace from a fixture tree under `gates/test/fixtures/` (package
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
- **Chromium override** (operator decision, human:jeroennouwsdev, 2026-11-02, after the environment's network policy
  denied `cdn.playwright.dev`): when the environment variable `OCELLE_CHROMIUM_PATH` is set and non-empty,
  `vitest.config.ts` launches the elements project's Chromium from that executable (`launchOptions.executablePath`);
  unset or empty, Playwright's own browser is used. It exists so the tests can run on a Chromium already installed
  where Playwright's download is blocked; CI and normal machines do not set it, and `pnpm run setup:online` still
  downloads Playwright's own build wherever the network allows.
  The Chromium check of `gates/bin/test.ts` (and of `gates/bin/setup-offline.ts`, which shares it) honours the
  override (phase 2, deciding review note R1-03 of phase 1): when `OCELLE_CHROMIUM_PATH` is set and non-empty it checks
  that executable, the one the elements project will launch, and exits 2 naming it, `OCELLE_CHROMIUM_PATH` and
  `pnpm run setup:online` when it does not exist; unset or empty, it checks Playwright's own Chromium
  (`chromium.executablePath()` of the `playwright` package, which reads `PLAYWRIGHT_BROWSERS_PATH`). Red-tested in
  `gates/test/test-command.test.ts` and `gates/test/integration/test-command.test.ts`. Without the override the check
  looks at Playwright's full Chromium build, which `playwright install chromium` installs together with the headless
  shell that headless runs launch.
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
  - **Test seam**: `setup-offline.ts` takes `--root <dir>` (the workspace it installs; default the repository
    root), the pnpm store directory (pnpm's `store-dir` setting, from the environment) and `PLAYWRIGHT_BROWSERS_PATH`
    from its environment and passes the environment on to pnpm. The translation of pnpm's error text is tested in
    the `gates` project on recorded pnpm output; its `gates-integration` tests run it with `--root` on a temporary
    workspace built from a fixture (never on the repository's own `node_modules`), against an empty temporary store
    and an empty temporary browser path, with the registry setting pointed at a local TCP socket the test opens, and
    assert exit 2, a message naming the missing package (or Chromium) and `pnpm run setup:online`, and zero
    connections to that socket (FR-008 "never falls back to the network"). A test against a store filled by a fixture
    lockfile with no dependencies, with the installed browser path, asserts exit 0.
  - **pnpm 12 configuration from the environment** (verified in phase 2): pnpm 12.16.1 reads settings from
    `pnpm_config_<name>` environment variables (`pnpm_config_store_dir`, `pnpm_config_cache_dir`,
    `pnpm_config_registry`) and ignores `npm_config_store_dir`, so the test seam and the gates-integration tests set
    those. `setup-offline.ts` runs pnpm with `--reporter=ndjson` and reads its error record: an offline install
    reports a tarball missing from the store as `ERR_PNPM_NO_OFFLINE_TARBALL` and package metadata missing from the
    cache as `ERR_PNPM_NO_OFFLINE_META` (inside `ERR_PNPM_META_FETCH_FAIL`); both name the package and become
    "missing: <package>; run pnpm run setup:online".
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
  - **Amendment, 2026-11-10** (005 research.md R-16, operator decision on PLAN-A11Y-SECURITY-1-005, option (c)): the
    `allowBuilds` allow-list is no longer empty. It holds exactly `"rs-module-lexer@2.9.0": true` and
    `"fsevents@2.3.3": true` (each at its one version; the pins gate's approved list holds exactly these two keys),
    which supersedes "no dependency runs one" above and FR-027's "empty allow-list" for those two entries. The rest of
    the policy is unchanged: the release age, no other install script, and the rule that an `allowBuilds` entry needs
    a change to the pins gate.
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
  rules use typescript-eslint's project service, which resolves each file through the nearest `tsconfig.json`. Lint
  plants are `repo-tree` plants (R-10): their files sit at repository paths in a temporary repository that holds
  the repository's own tsconfig files, so the project service resolves a plant file exactly as it resolves a
  repository file, and no plant carries a `tsconfig.json` (plan squad round 3). ESLint loads a
  `.ts` config through jiti unless the `unstable_native_nodejs_ts_config` flag is passed, and jiti is only an
  optional peer of ESLint, so jiti 2.7.0 is pinned in the root devDependencies. The stable jiti path is preferred
  over an `unstable_` flag.

## R-06 Test lint (FR-010)

- **Decision**: a second ESLint config (`eslint.test.config.ts`, loaded through jiti like R-05) over all test code
  except `gates/test/fixtures/` (and Stryker's sandbox copies under `.stryker-tmp/`, from phase 4: operator
  decision, phase 3 gate, 2026-11-02, on review note R2-02: "Fix in phase 4, test-first: add .stryker-tmp/ to the
  test-lint ignores."; tasks.md T092), with `@vitest/eslint-plugin` 1.6.28 rules `expect-expect`, `no-disabled-tests`,
  `no-focused-tests`, `no-conditional-expect`, `no-standalone-expect`, `valid-expect` (with `alwaysAwait`) and
  `valid-expect-in-promise`, as errors; plus a local rule `ocelle/no-snapshot-only` (in `gates/eslint/`) that
  reports a test whose only assertions are snapshot matchers (`toMatchSnapshot`, `toMatchInlineSnapshot`,
  `toMatchFileSnapshot`). No upstream rule covers that pattern. None of these rules needs type information, so the
  test-lint config uses the typescript-eslint parser without the project service. Test-lint plants are `repo-tree`
  plants (R-10), so if phase 3 finds a rule that needs types, the copied tsconfig files serve it as they do for the
  lint plants (R-05).
- **Gate entry** (analysis 1): `gates/bin/test-lint.ts` runs ESLint with `eslint.test.config.ts` and
  `--format json` in the `--root` directory and classifies the output with `gates/lib/eslint-report.ts`
  (contracts/gate-cli.md), the same module the code lint uses in phase 4. Both are in phase 3's scaffold; the
  classification is red-tested in-process on recorded ESLint JSON and the entry's exit 0/1/2 and `--root` in
  `gates-integration`, in phase 3's red commit.
- **Rationale**: a separate config keeps the test lint a separate named gate (FR-020) and lets its plants be run
  alone.
- **Unchecked assertions** (operator decision, phase 3 gate, 2026-11-02, on review note R1-03: "Add rule now: add
  an ocelle rule for these patterns as a small extra task before phase 4, test-first."). The phase 3 review found
  that the rule set above reports none of `void p.then((v) => expect(v).toBe(2))`, an assertion in a `setTimeout`
  callback, or `try { expect(...) } catch {}`. A probe of the same config when this decision was recorded
  confirmed this and found the same for `void p.finally(...)`, `setInterval`, and a `catch (e) { console.log(e) }`
  handler. Three local rules
  close the gap, in a new module `gates/eslint/unchecked-expect.ts` next to `gates/eslint/no-snapshot-only.ts`:
  - **Assertion**, for all three rules: a call whose callee chain starts at the identifier `expect` (the
    `rootName` walk of `no-snapshot-only`: `expect(...)`, `expect(...).not.toBe(...)`, `expect.soft(...)`,
    `expect.unreachable()`). "Contains an assertion" means one occurs anywhere inside the node, nested functions
    included, unless a rule says otherwise.
  - **`ocelle/no-floating-promise-expect`** reports a `void` expression whose operand is a promise chain with an
    assertion in a callback. A promise chain is a call whose callee is a member `.then`, `.catch` or `.finally`,
    followed down through `callee.object` while that is again such a call (so `void p.then(f).catch(g)` is one
    chain); it has an assertion in a callback when a function-expression or arrow argument of any call in the chain
    contains an assertion. The rule reports the `void` expression once, at its line, with message id `floating`:
    "Assertion in a promise callback that is neither awaited nor returned; await or return the promise (FR-010)".
    A chain that is an expression statement on its own (`p.then(...)`), or assigned and never awaited, is left to
    `vitest/valid-expect-in-promise`, which already reports it; this rule does not report it, so no pattern gets two
    findings. A chain that is awaited (`await p.then(...)`), returned (`return p.then(...)`) or an arrow's
    expression body (`() => p.then(...)`) is never the operand of `void` and is not reported. An assertion in a
    `.catch` callback is also reported by `vitest/no-conditional-expect`, so the rule's fixture uses `.then`.
  - **`ocelle/no-timer-expect`** reports a call whose callee is the identifier `setTimeout` or `setInterval`, or a
    member with one of those property names (`globalThis.setTimeout`), when its first argument is a function
    expression or arrow that contains an assertion. It reports the call once, at its line, with message id `timer`:
    "Assertion in a timer callback runs outside the test's control; await the condition, then assert (FR-010)". A
    timer whose callback holds no assertion (`await new Promise((r) => setTimeout(r, 10))` followed by the
    assertion) is not reported. Only the two timers the decision names are in scope; `setImmediate` and
    `queueMicrotask` are not.
  - **`ocelle/no-swallowed-expect`** reports a `try` statement whose `block` contains an assertion and whose
    `catch` clause swallows. A `catch` clause **swallows** unless its body (the clause's block, not counting
    nested function bodies) has a `throw` statement as one of its own top-level statements (not inside an `if`, a
    loop, a nested block or a function), or contains an assertion. So `catch {}`, `catch (e) { console.log(e) }`,
    `catch (e) { if (x) throw e }` and `catch (e) { fail(e) }` (a helper call is not a `throw`) swallow, while
    `catch (e) { cleanup(); throw e }` and `catch (e) { expect(e).toBeInstanceOf(SyntaxError) }` do not. A `try`
    without a `catch` clause (`try ... finally`) is not reported. It reports the `try` statement once, at its
    line, with message id `swallowed`: "Assertion inside a try whose catch neither rethrows nor asserts; the
    failure is swallowed (FR-010)". A `catch` that asserts is still reported by `vitest/no-conditional-expect`
    (an assertion inside a `catch` is conditional), so the gate rejects it on that rule, not on this one.
  - **Files**: the rules apply to every file the test-lint config already covers (`**/*.test.ts`, `**/*.spec.ts`,
    `**/test/**/*.ts`, `**/*.stories.ts`, minus its ignores), inside and outside a test block. They need no type
    information.
  - **Wiring**: the module exports the three rules and a `plugin` object with them, as `no-snapshot-only.ts` does;
    `eslint.test.config.ts` registers one `ocelle` plugin whose `rules` are the union of both modules' rules and
    sets the three rules to `"error"`.
  - **Proof** (tasks.md T091, test-first): `RuleTester` unit tests per rule (reported cases and the look-alikes
    above), and `gates-integration` fixtures run through `gates/bin/test-lint.ts --root`, one per rule exiting 1
    with exactly that rule's one finding, plus a fixture per allowed look-alike. The three patterns have no plant of
    their own under `gates/plants/test-lint/`; the gate's plants stay those of SC-004.

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
     Header parsing (operator decision, PR #18 landing review, human:jeroennouwsdev, 2026-11-03; landing note
     L1-01, phase 3 round 7 O7-01): git writes `+++ b/<path>` followed by a tab for a path with a space, and
     `+++ "b/<escaped>"` (C-style quoting, octal byte escapes) for a path with a non-ASCII or special character.
     The parser strips the tab and decodes the quoting (octal escapes as UTF-8 bytes, `\"`, `\\` and the other C
     escapes), so such a file keeps its ranges; any other `+++` header that is not `+++ /dev/null` is exit 2 naming
     the header. `--plan` and `--files` use the same parse, so a CI shard never drops such a file.
  3. Stryker runs with `mutate` set to `file.ts:start-end` ranges, so only changed lines are mutated (FR-011).
     `--files <entry>[,<entry>...]` limits the run to those entries (a CI shard); without it every changed file
     is mutated (the story review's local run). An entry is `path` (every changed line of that file) or
     `path:start-end` (the changed lines of that file from line `start` to line `end`, both included; Stryker's own
     `mutate` range syntax), as `--plan` prints them (operator decision, phase 3 round 9, human:jeroennouwsdev,
     2026-11-03: plant-judge.ts alone took 9:49 of 10 minutes). A run with entries mutates only the changed lines
     inside them: each `mutate` range is a changed range of the file cut to the entry's lines. The range suffix is
     the text after the entry's last `.ts:` (split there without a regex, phase 3 round 12, O12-02), which must be
     `<digits>-<digits>`; an in-scope path ends in `.ts`, so it never ends in such a suffix itself. An entry whose path is not a changed in-scope file, whose range holds no changed line, or whose range
     is malformed (not `start-end` with 1 <= start <= end) is exit 2 naming the entry, as an unchanged path already
     is.
  4. The wrapper decides from Stryker's JSON report (`reporters` includes `json`), not from Stryker's exit code or
     `thresholds.break` (a crash and a low score both exit 1): any `Survived` or `NoCoverage` mutant on a changed
     line is a finding (exit 1); `Killed`, `Timeout` and `RuntimeError` are killed and pass, and `CompileError` (a
     mutant the typescript-checker rejects) is invalid, neither killed nor surviving, and passes (FR-011's
     definitions, as amended in plan squad round 3 with the operator's approval, 2026-11-02); no report, or a
     report from a failed dry run, is exit 2. Input guard (operator decision, PR #18 landing review,
     human:jeroennouwsdev, 2026-11-03: "Guard the input instead (Recommended)"; landing note L1-02, phase 3 round 7
     O7-02): Stryker 10.1.1 lists only files with mutants, and a `mutate` path holding a glob metacharacter
     (`*?[]{}!`) or a comma (which splits `--mutate`) is never instrumented, so it would silently pass; nor is a
     path holding a line terminator, since Stryker's `MUTATION_RANGE_REGEX` (no `s` flag, no `^` anchor) reads only
     the text after the last terminator as the pattern (phase 3 round 8, R8-01). Before
     Stryker runs, a changed in-scope path that Stryker cannot take as a `mutate` input (it contains a glob
     metacharacter `*?[]{}!`, a comma, or a line terminator `\n`, `\r`, U+2028 or U+2029, or otherwise cannot be
     passed verbatim) is exit 2, naming each such path
     (a file the gate could not check, contracts/gate-cli.md, not a finding). With every path passed verbatim and
     read by Stryker (see "Unread `mutate` entries" below), a changed file absent from Stryker's report counts as
     zero mutants and passes: its changed lines hold no mutable code (a type-only or comment-only change).
  5. Equivalent mutants: `// Stryker disable next-line <mutator[,mutator]|all>: <reason>` directly above the code;
     Stryker reports them as `Ignored` with the reason, and the wrapper prints each as a record line (path, line,
     mutator, reason) for the review (FR-012). In the changed files the wrapper rejects, as findings, a next-line
     comment without a reason and every other disable form (`// Stryker disable <...>` without `next-line`, which
     disables until a `// Stryker restore`, including `// Stryker disable all`), since only the next-line form is
     "next to the mutated code".
- **Unread `mutate` entries** (operator decision, phase 3 round 12, O12-01, human:jeroennouwsdev, 2026-11-03: "Fail
  on unread files (Recommended)"; landing note L2-01): Stryker 10.1.1 never reads a file under a folder named
  `node_modules`, `.git`, `.next`, `.nuxt` or `.svelte-kit` (`ALWAYS_IGNORE` in
  `core/dist/src/fs/project-reader.js`) or `.stryker-tmp` (`tempDirName`), matched in any directory and ignoring
  case. For such an entry it only logs `Glob pattern "<entry>" did not result in any files.` (a warning, printed
  whenever `mutate` is not Stryker's default, which the gate's `--mutate` never is) and goes on, so the file was
  missing from the report and passed as zero mutants; git tracks `.next/`, `.nuxt/` and `.svelte-kit/` here. The
  gate therefore exits 2 when Stryker's output (stdout and stderr, which the gate already reads for the cause of a
  missing report) holds that warning, naming each entry as logged, in the whole-diff and `--files` runs alike, before
  it classifies the report. The signal is the warning, not the report and not a list of folder names: the report
  lists only files with mutants (`toFileResults` builds it from the mutant results), so an unread file and a read
  file with no mutable code on its changed lines are both absent from it and cannot be told apart there; and a
  copy of Stryker's ignore list in the gate (the landing review's option (a)) would go stale with the next Stryker
  rule, while the warning covers any path Stryker skips. The warning prints at Stryker's default console
  `logLevel` (`info`); `stryker.config.json` sets none, and a test pins that it sets none above `warn`, so a later
  config change cannot hide it.
- **Gate source is in scope** (operator decision, plan squad round 1): gate tests in `gates/test/` import the gate's
  exported functions and run them in-process in the `gates` Vitest project, which the Stryker vitest-runner reaches.
  Each `gates/bin/<id>.ts` is a thin entry that calls an exported `run(argv, io)` returning the exit code; only its
  `import.meta.main` guard line behaves differently only when the file runs as a script.
- **Pure decision logic, tool runs apart** (operator decision, plan squad round 3; the design rule of R-09): the
  Stryker vitest-runner runs, for each mutant, the tests covering it, so a shard's time is mutants x covering-test
  time / concurrency, not a function of files and lines. Each gate's decision logic (classifying tool output, diff
  ranges, the shard split, the finding format, plant judging, the registry check) is a pure function, tested
  in-process in the `gates` project on recorded tool output under `gates/test/fixtures/` (tsc diagnostics, ESLint,
  Stylelint and Vitest JSON reports, Stryker JSON reports, `git diff --unified=0` and `git log` output, pnpm error
  text). Tests that start a real tool (tsc, ESLint, Stylelint, Vitest with Chromium, Stryker, pnpm, git, a gate as a
  child process, the plant job on plants) live in a separate Vitest project, `gates-integration`
  (`gates/test/integration/`), which `pnpm test` runs and Stryker does not: `stryker.config.json` points the
  vitest-runner at `vitest.mutation.config.ts`, which imports the project list of `vitest.config.ts` and leaves
  out `gates-integration`. Phase 3 proves that red first with a gate test on a fixture repository (in
  `gates-integration`, running `gates/bin/mutation.ts --root <tmp> --base <sha>`, which also covers `--files` and an
  unresolvable base end to end): a mutant covered only by a `gates-integration` test is reported `NoCoverage`. The adapter
  lines that only `gates-integration` tests cover are kept to three kinds (operator decision, phase 3 gate,
  2026-11-02, on review notes R1-02 and R2-01: "Reword R-08: allow records on thin adapter functions that only call
  an outside tool, if an integration test covers them."):
  1. the CLI entry (the `import.meta.main` guard);
  2. the call that spawns the tool;
  3. a thin adapter function that only calls an outside tool (git, the file system, pnpm, Vitest, ESLint, Stryker
     or a child process) and passes arguments and results through, with no branch and no computation that the
     gate's decision depends on, when a `gates-integration` test covers it.

  Each of their mutants is recorded as equivalent with a next-line record and its reason ("process boundary,
  covered by gates-integration", FR-012), which the review sees in the report. A record of the third kind also
  names the `gates-integration` case that covers it, as file and test name, for example
  `// Stryker disable next-line StringLiteral: process boundary, covered by gates-integration:
  gates/test/integration/mutation.test.ts "--files mutates only the listed file"` (one line in the source). Logic that
  decides the gate's result does not belong in such a function; it moves into the tested seam (R-09). Any other
  survivor in gate source is a finding like any other.
- **Rationale**: line ranges give FR-011's "changed lines" precisely, so no incremental cache is needed and every
  run is cold (SC-005's "no earlier mutation result"). Issue #4's "incremental" intent is met by mutating only the
  change.
- **CI, sharded** (operator decision, plan squad round 2; spec FR-013/SC-005 amended): three jobs, all with checkout
  `fetch-depth: 0` and `--base ${{ github.event.pull_request.base.sha }}` (contracts/ci-checks.md). The merge ref
  minus that commit is exactly the pull request's change.
  1. `mutation-plan` runs `pnpm run gate:mutation -- --base <sha> --plan`, which prints the shards as JSON and sets
     them as the job output (exit 2 on an unresolvable base). The JSON is one array; each shard is
     `{"files": "<entry>,<entry>,...", "lines": <changed lines>}`, its entries comma-separated as `--files` takes
     them. Split (operator decision, phase 3 round 9, human:jeroennouwsdev, 2026-11-03: plant-judge.ts alone took
     9:49 of 10 minutes): the changed files of step 2, sorted by path, become entries. A file with at most 60
     changed lines is one entry, `path`. A file with more is split by line range: its changed lines, in line order,
     are cut into consecutive chunks of 60 changed lines (the last chunk holds the rest), a cut falling inside a
     changed range where the count reaches 60; each chunk is one entry `path:start-end` from its first to its last
     changed line, so a file's entries never overlap. The entries, in that order, are filled greedily into shards;
     the next entry starts a new shard when adding it would exceed 10 entries or 250 changed lines, or when the
     current shard already holds an entry of the same file (operator decision, phase 3 round 10,
     human:jeroennouwsdev, 2026-11-03: "Chunks never share (Recommended)": "Two chunks of one file never go in the
     same shard; a chunk can still share a shard with other files."). Each entry lies whole in one shard (a range
     never crosses a shard), and since no entry exceeds 60 lines, every shard holds at most 10 entries and 250
     changed lines, and no two entries of one file, so at most 60 changed lines of one file. A file's last entry
     may still share its shard with the entries of the next files. The chunk is 60 changed lines, down from 120
     (operator decision, 2026-11-05, phase 5 round 6 of mission 002, human:jeroennouwsdev: "Smaller chunks
     (Recommended)"; the shard `packages/tokens/src/generate.ts:121-240` alone held 264 mutants and took 670 s
     locally, and was cancelled at the 10-minute limit in CI); the bounds of 10 entries and 250 changed lines per
     shard, and two entries of one file never sharing a shard, are unchanged. *Note, 2026-11-11:* the entry bound is
     now 30 changed lines for every file, by the FR-013 amendment of `spec.md` (operator decision of mission 007,
     human:jeroennouwsdev, "30-line entries, all files", `specs/007-mutation-gate-strictness/` FR-014); the 60-line
     text here is kept as it was decided. No changed file: zero shards. Besides the JSON
     on stdout, `--plan` writes one line to stderr with the number of shards and the number of cuts:
     `mutation: plan: <s> shards, <c> cuts within files (a mutant spanning a cut is mutated in no shard, see
     gates/README.md)`, with `1 shard` and `1 cut` in the singular, printed also when both are 0. A cut is the
     boundary between two consecutive entries of one file, so a file split into `n` entries has `n - 1` cuts and
     `<c>` is their sum over all files. The count goes to stderr, not into the JSON: ci.yml's `mutation-plan`
     step captures stdout whole as `shards=<stdout>` for the matrix's `fromJSON`, so the JSON stays one array of
     shards and ci.yml is unchanged, while stderr reaches the job log. The bound is 250 lines, down from 500
     (operator decision, phase 4 round 3, human:jeroennouwsdev, 2026-11-03: GitHub runner variance took a 435-line
     shard past 10 minutes); the 10-minute shard limit is unchanged.
  2. `mutation-shard`, a matrix over the shards (skipped when there are none), each shard a job with
     `timeout-minutes: 10` that runs `pnpm run gate:mutation -- --base <sha> --files <the shard's files value>`,
     passing the plan's entries unchanged. A timeout ends the job as a failure.
  3. `mutation`, the check named **Mutation testing**, `needs` both and runs `if: always()`; it passes only when
     `mutation-plan` succeeded and either `mutation-shard` succeeded or it was skipped because the plan had zero
     shards. A failed, cancelled or timed-out shard, or a failed plan, fails it. This is the check the ruleset
     requires (plan.md § Verification); the helper jobs are not required by name, since the matrix names vary.
  The split (`--plan`) and `--files` are wrapper behaviour: the split is a pure function tested in the `gates`
  project on recorded diff output, and `--files` end to end by a `gates-integration` test on a fixture repository
  (including `path:start-end` entries), both red first in phase 3 (the split within files under T097; one file's entries in separate shards and the cut count under T098). The line bound does not by itself bound time; the design rule above does, because each
  mutant runs only in-process tests. SC-005 is measured on this feature's real shards (operator decision, plan squad
  round 3): from phase 3 on, the last task of phases 3 and 4 runs `pnpm run gate:mutation -- --base <phase 1
  base.sha> --plan` and then each shard with `--files`, timed, and records the durations in
  `FEATURE_DIR/reviews/phase-<N>/mutation-shards.md`, which the phase review reads; a shard whose local run takes
  more than 10 minutes is a blocking review finding. The CI run of the feature's pull request is the measurement on
  the runner of SC-001 (quickstart step 12).
- **SC-005 measurement** (operator decision, phase 4 round 4 note R4-01, feature gate, human:jeroennouwsdev,
  2026-11-03: "Accept for now: Record this run as the SC-005 measurement, and investigate any cancelled shard if one
  happens."): SC-005 is measured on GitHub run
  https://github.com/Ocelle-HQ/ocelle-components/actions/runs/41613884529 (head `e985ed3`): 18 shards, all
  finished, the longest 8:01 (`gates/lib/pins-rules.ts` alone, 137 changed lines). Shard time follows the mutants
  per file (the TypeScript checker handles one file's mutants in sequence), not the changed lines, so a lower
  shard bound alone did not shorten a single-file shard. A shard cancelled at the 10-minute limit is a failure to
  investigate, not to re-run blindly. It recurred: GitHub run
  https://github.com/Ocelle-HQ/ocelle-components/actions/runs/41635769914 (head `fffb7e7`) took 9:49 for
  `gates/lib/plant-judge.ts` alone (216 changed lines, 353 mutants). The lever was taken (operator decision, phase
  3 round 9, human:jeroennouwsdev, 2026-11-03: plant-judge.ts alone took 9:49 of 10 minutes): a file over 120
  changed lines is split by line range across entries (step 1 of "CI, sharded" above). As first built (T097),
  the greedy fill still put a file's entries together whenever the shard had room, so the shard of
  `gates/lib/plant-judge.ts:1-120,gates/lib/plant-judge.ts:121-216` held the same 353 mutants as before
  (reviews/phase-3/round-9-fixes.md); since phase 3 round 10 (T098) two entries of one file never share a shard,
  so no shard held more than 120 changed lines of one file. Since 2026-11-05 (operator decision, phase 5 round 6 of
  mission 002: the shard `packages/tokens/src/generate.ts:121-240`, 264 mutants, took 670 s locally) the chunk is
  60 changed lines, so no shard holds more than 60 changed lines of one file (step 1 of "CI, sharded"). *Note,
  2026-11-11:* the entry bound is now 30 changed lines for every file, by the FR-013 amendment of `spec.md` (operator
  decision of mission 007, human:jeroennouwsdev, "30-line entries, all files", `specs/007-mutation-gate-strictness/`
  FR-014); the 60-line text here is kept as it was decided.
- **Cuts, an accepted limit** (operator decision, phase 3 round 10, human:jeroennouwsdev, 2026-11-03: "Accept,
  record it (Recommended)": "The lost mutants are only large blocks across a cut; the statements inside them are
  still mutated. Record the limit in research R-08 and gates/README.md, and have the plan print how many cuts it
  made."): Stryker 10.1.1 mutates a node only if it lies wholly inside one `mutate` range (`locationIncluded` in
  `@stryker-mutator/instrumenter`). A node that starts in one entry of a file and ends in the next (one that
  spans a cut) is therefore mutated in no shard; the smaller nodes inside it, within one entry, still are. Since
  two entries of one file never share a shard, every cut the plan makes is such a boundary in CI. Measured on
  `gates/bin/csp.ts` (reviews/phase-3/mutation-shards.md, round 9): 281 mutants when the file runs whole, 279
  across its entries `:1-120` and `:121-240`; the two lost are the block statements spanning lines 113-123 and
  119-121, across the cut at 120/121. The count `--plan` prints is of every cut, wherever it falls, not of the
  mutants lost (which only Stryker's instrumenter knows). `gates/README.md` states this limit, and `--plan` reports the number of cuts on stderr (step 1 of "CI,
  sharded").
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

- **Decision**: every gate is a command `pnpm run gate:<id>` backed by `gates/bin/<id>.ts` (for typecheck, code lint,
  style lint, test lint and unit tests the entry runs the tool and classifies its output; analysis 1) with one contract
  (contracts/gate-cli.md): exit 0 pass, exit 1 the gate found defects (each printed as a finding in the one format
  of data-model.md § Finding), exit 2 the gate could not run. Every entry catches any exception at the top and exits
  2, so an uncaught error (which Node reports as exit 1) never reaches the plant job as "caught". A registry
  `gates/gates.json` lists every gate: id, CI check name, command, and how its plants are presented.
- **Classification from structured output** (operator decision, plan squad round 1): tool exit codes cannot tell
  findings from breakage (tsc exits 2 on a type error and 1 on a missing project; Stylelint's lint problem is 2 and
  its fatal error 1; Stryker and Vitest exit 1 both on findings and on crashes), so each wrapper reads the tool's
  structured output (contracts/gate-cli.md table) and exits 1 only when that output holds findings.
- **Design rule** (operator decision, plan squad round 3): every gate is split into a pure decision part (parse
  and classify the tool's output, compute ranges, shards and findings, judge plants) and a thin adapter (the CLI
  entry and the call that spawns the tool or reads git, and the thin adapter functions of R-08). The decision part is tested in-process on recorded tool
  output under `gates/test/fixtures/`; the adapter is tested in the `gates-integration` Vitest project, which
  Stryker does not run (R-08). `--root <dir>` is part of every gate's adapter: it sets the repository root and the
  working directory of the tool, and changes nothing else (R-10). The entry wrapper and `--root` parsing live in
  `gates/lib/cli.ts` and are red-tested in phase 2; each gate's entry takes `--root` from its phase's scaffold on, and
  a `gates-integration` test in that phase's red commit runs the gate with `--root` on a temporary repository from a
  different working directory (analysis 1). That test builds its temporary repository itself (copy the fixture tree
  and only the configuration files that gate reads, link `node_modules`, and for sign-off `git init` and commit the records), never through
  a module of the same phase's scaffold such as `gates/lib/plant-repo.ts`, which builds nothing until green, so its
  red failure is the gate's missing behaviour and not its own setup (analysis 2). It copies only the files its gate
  reads, not the whole configuration set (R-10), because part of that set (`eslint.config.ts`, `stylelint.config.ts`)
  is created only by phase 4's green commit (analysis 3).
- **Rationale**: exit 1 vs 2, together with the expected findings of each plant (R-10), lets the plant job tell "the
  gate caught the plant" from "the gate is broken".

## R-10 Plants and the plant job (FR-025)

- **Decision**: `gates/plants/<gate-id>/<case>/` holds one plant: its input files and `plant.json`
  (data-model.md § Plant): `expect` (`fail`, `pass` or `error`), `why`, and for `fail` plants the exact list of
  expected findings (and for a mutation pass plant the expected equivalent-mutant records). `pnpm run gate:plants`
  (`gates/bin/plants.ts`) first checks the registry (below), then runs, for every gate in `gates.json`, every case
  against the gate, and fails when: a `fail` case does not exit 1 or its findings differ from the expected list
  (as a set of location and rule, plus any message substring the plant gives); a `pass` case does not exit 0 with
  no finding (and, where given, exactly the expected records); an `error` case does not exit 2, or exits 2 with no
  error-output line containing its `cause`; a gate lacks a `fail`, a `pass` or an `error` case; or a plant has no
  or an invalid `plant.json` (an `error` plant without `cause`, or a `pass` plant with `base`, is invalid). Every
  breaking plant names its expected cause, so a breakage for another reason (Stryker or Vitest missing in the
  temporary repository, say) does not count as proving the gate's "could not run" path; a pass plant may not set
  `base`, so it cannot pass vacuously on a base equal to its head (operator decision, PR #18 landing review,
  human:jeroennouwsdev, 2026-11-03; landing notes L1-04 and L1-05, phase 4 round 5 O5-01 and O5-02).
- **Same configuration, only the inputs swapped** (FR-025, constitution VIII): plant mode runs the gate with the
  repository's own configuration and swaps only the inputs. No plant carries configuration: the plant job rejects
  (exit 1, "plant X carries gate configuration") a plant that holds, anywhere in its directory (including `tree/`,
  `base/` and `head/`), a `tsconfig*.json` or any ESLint, Stylelint, Vitest, Vite or Stryker configuration file
  (plan squad round 3: the plant-tsconfig exception of round 2 is gone, since no plant needs one).
- **Normal input collection for every file, commit and mutation plant** (operator decisions, plan squad rounds 1, 2
  and 3): for sign-off and mutation (round 1), for style lint, prefix and CSP (round 2) and for typecheck, code lint,
  test lint, unit tests and config-copies (round 3), the plant job builds a temporary repository (outside the
  repository, in the system temporary directory) from the plant and runs the gate in normal mode with
  `--root <tmp>` (plus `--range` or `--base`); `--root` sets the repository root and the tool's working directory
  and changes nothing else (R-09). Only the pins plants are presented differently: a pins plant is a whole
  mini-workspace, which is the pins gate's full input (R-14).
  - **Configuration set**: the files the plant job copies into every temporary repository unchanged, from the
    working tree it runs in: the root `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `tsconfig.json`,
    `eslint.config.ts`, `eslint.test.config.ts`, `stylelint.config.ts`, `vitest.config.ts`,
    `vitest.mutation.config.ts` and `stryker.config.json`; each `packages/*/package.json` and
    `packages/*/tsconfig.json`; and the modules those configurations import (`gates/eslint/`, `gates/stylelint/`).
    `node_modules` is linked from the workspace. The copied modules are clean repository source, so they add no
    finding to any plant.
  - **Repo-tree** (`repo-tree`): the plant's `tree/` directory holds its input files at repository paths (for
    example `packages/tokens/src/x.ts`, `gates/lib/x.ts`, `packages/elements/test/x.test.ts`,
    `packages/elements/src/x.stories.ts`, `packages/styles/src/x.css`, `packages/tokens/dist/index.js`,
    `.specify/extensions/story/story-config.yml`); the plant job lays `tree/` over the configuration set and runs
    the gate there. So the gate's own file collection decides which plant files it checks: the root `tsconfig.json`
    `include` and `exclude` for typecheck, the flat configs' `files` and `ignores` for code lint and test lint (and
    the nearest `tsconfig.json` the project service resolves through, R-05), each Vitest project's `include` and
    `exclude` for unit tests, Stylelint's globs, `ignoreFiles` and the path-bound postcss-lit syntax of R-07 for
    style lint, the scripts' roots for prefix and CSP, and the two fixed paths of FR-006 for config-copies. A glob
    that misses covered files makes a fail plant pass and the plant job fail (US3 scenario 9). Each of these gates
    has, besides its basic fail plant, fail plants at paths only its normal collection reaches (contracts/plants.md):
    gate source under `gates/bin/` and `gates/lib/`, test code under `packages/*/test/` and colocated test files, an
    element test that must run in Chromium, and the two story configuration paths. Near-miss pass plants put a
    defect under `gates/test/fixtures/`, which every normal gate excludes (FR-028), so an exclusion that is lost
    shows too.
  - **Sign-off** (`commit-repo`): the plant job first makes an empty base commit (signed off by an invented RFC 2606
    identity, `Plant Base <base@example.com>`), then one commit per record of `commits.txt` (author, message, and
    for a merge record a real merge of two branches), then runs `--range <base commit>..HEAD`. The base commit gives
    the first record a parent, so the range resolves and holds exactly the records (plan squad round 3).
  - **Mutation** (`mutation-repo`): a first commit with the configuration set and the plant's `base/` tree laid out
    at repository paths (for example `packages/tokens/src/x.ts` or `gates/lib/x.ts`), a second commit with the
    `head/` tree, `node_modules` linked from the workspace, then `--base <first commit>`; mutation uses the
    repository's `stryker.config.json` and `vitest.mutation.config.ts`.
  So base resolution, the git log range and the diff parsing are exercised by every such plant.
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
  `Signed-off-by:` trailer equal to its author. A range that does not resolve, or that holds no commit, is exit 2.
  Plants are `commits.txt` files in the same record format, from which the plant job builds a temporary repository
  on an empty base commit and runs the gate in normal mode over `<base commit>..HEAD` (R-10). Every identity in a
  plant is invented and uses a reserved domain (RFC 2606, for example `Ada Example <ada@example.com>`), never a real
  name or address (FR-034).
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
  Plant mode (`--plant <dir>`) runs the same on the plant's mini-workspace; pins is the one gate whose plants are
  not `repo-tree`, since a plant is its whole input (R-10).
- **Test seam** (analysis 2, the design rule of R-08 and R-09): every rule above but the lockfile one is a pure
  function on the parsed files, and the lockfile verdict is a pure function on pnpm's output and exit code; both
  are tested in-process in the `gates` project on fixture mini-workspaces and recorded pnpm output, so Stryker never
  starts pnpm. The real `pnpm install --frozen-lockfile --lockfile-only --offline` run is tested end to end in
  `gates-integration` by phase 4's `--root` test, whose pins case is a mini-workspace with an outdated lockfile.

## R-15 Configuration-copies check (FR-006)

- **Decision**: `gates/bin/config-copies.ts` compares the two story configuration files byte for byte and checks that
  their `test_pathspec` equals FR-028's test code
  (`:(glob)**/*.test.ts :(glob)**/*.spec.ts :(glob)**/test/** :(glob)**/*.stories.ts`), which the current copies
  already hold. The two paths are fixed constants relative to the repository root, which `--root` sets; its plants
  are `repo-tree` plants that lay the two copies at those paths (R-10), so two constants that name the same file, or
  a wrong one, fail a plant.

## R-16 CI

- **Decision**: GitHub Actions, one workflow `.github/workflows/ci.yml` on `pull_request`, one job per gate plus the
  plant job, each a separate named check (FR-020). Actions are pinned by full commit SHA. The workflow sets
  top-level `permissions: contents: read` and nothing else; every `actions/checkout` step sets
  `persist-credentials: false`, so the token is not left in `.git/config` for dependency or pull-request code; no job
  references a secret. A shared setup step restores the pnpm store and Playwright cache (restore only) and runs
  `pnpm run setup:online`. Mutation testing runs as a plan job, a matrix of shard jobs each with
  `timeout-minutes: 10`, and the verdict job named **Mutation testing** (R-08); the mutation jobs and the sign-off
  job check out with `fetch-depth: 0` and take their base from `github.event.pull_request.base.sha` (R-08, R-13).
- **Cache warming** (operator decision, plan squad round 3): GitHub Actions scopes a pull request run's caches to its
  merge ref, so other pull requests can restore only caches saved on the base branch. A second workflow,
  `.github/workflows/cache.yml`, runs on `push` to `main` with top-level `permissions: contents: read`, checkout
  with `persist-credentials: false` and no secret; it runs `pnpm run setup:online` and saves the pnpm store keyed on
  the hash of `pnpm-lock.yaml` and the Playwright browser cache keyed on the pinned Playwright version. `ci.yml`
  restores these keys and never saves, so pull request code never writes a cache another run reads. It is not a
  gate and reports no required check. The feature's own pull request runs before the workflow has ever run on
  `main`, so its jobs start cold (quickstart step 12).
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
