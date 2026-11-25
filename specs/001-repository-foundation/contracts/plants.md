# Contract: plants

Layout: `gates/plants/<gate-id>/<case>/plant.json` plus inputs. `plant.json` (data-model.md § Plant):
`{"expect": "fail"|"pass"|"error", "why": "...", "findings": [...], "records": [...], "reports": [...], "cause": "...", "base": "..."}`
(`reports`: amendment 2026-11-10, mission 007, research R-02: optional on a mutation `pass` or `fail` plant, a list of
`{"location", "rule", "message"?}` with `rule` one of `timeout`, `compile-error`, `zero-mutants`, the run's report lines
the plant expects; on an `error` plant, or on a plant of any other gate, an invalid `plant.json`);
`findings` is required for a `fail` plant and lists exactly the findings the gate must report (location and rule,
optionally a message substring). `cause` is required for an `error` plant and allowed on no other (a non-empty
string): a substring of the cause line the gate must print on its error output when it exits 2, so a plant that
breaks for another reason (a tool missing in the temporary repository, say) fails the plant job instead of proving
the gate's "could not run" path; every breaking plant names the cause of the breakage it plants (operator decision,
PR #18 landing review, human:jeroennouwsdev, 2026-11-03; landing note L1-04, phase 4 round 5 O5-01). `base` is
optional on a `fail` or `error` plant and rejected on a `pass` plant (an invalid `plant.json`), since a pass plant
with a base such as the temporary repository's head would pass vacuously (operator decision, PR #18 landing review,
human:jeroennouwsdev, 2026-11-03; landing note L1-05, phase 4 round 5 O5-02). It is a non-empty string: the plant runner puts it in place of `{base}` in the
gate's plant command instead of the temporary repository's base commit; the mutation breaking plant
`error-unresolvable-base` sets `refs/heads/no-such-base` to present a `--base` that does not resolve (mutation row
below). It is an input of the gate, not gate configuration (operator decision, phase 4 round 2 note R2-02, feature
gate, human:jeroennouwsdev, 2026-11-03).

Plant mode runs the repository's own gate configuration and swaps only the inputs. A plant carries no
configuration: no `tsconfig*.json` and no ESLint, Stylelint, Vitest, Vite or Stryker configuration file anywhere in
its directory (plan squad round 3; the round 2 plant-tsconfig exception is gone). `repo-tree`, `commit-repo` and
`mutation-repo` plants run in a temporary repository that holds the configuration set of research.md R-10 (the
repository's configuration files and the modules they import, copied unchanged) with `node_modules` linked, the
gate in normal mode with `--root <tmp>`; `workspace` plants (pins) are a whole mini-workspace, run with
`--plant <dir>`. The plant job rejects a plant that carries its own configuration.

`repo-tree` (style lint, prefix, CSP, operator decision, plan squad round 2; typecheck, code lint, test lint, unit
tests and config-copies, operator decision, plan squad round 3): the plant's `tree/` holds its input files at
repository paths; the plant job lays `tree/` over the configuration set in a temporary directory and runs
`pnpm run gate:<id> -- --root <tmp>` in normal mode, so the gate's own file collection (tsconfig `include` and
`exclude`, ESLint `files` and `ignores`, Vitest project `include` and `exclude`, Stylelint globs and the path-bound
postcss-lit syntax, the scripts' roots, the fixed configuration-copy paths) decides what it checks. Finding
locations are repository paths below `tree/`. A tree without a file at some path means the temporary repository has
none there (for example no test file in a project).

`commit-repo` (sign-off): the plant job makes an empty base commit signed off by an invented RFC 2606 identity
(`Plant Base <base@example.com>`), then one commit per record of `commits.txt`, and runs the gate with
`--root <tmp> --range <base commit>..HEAD`, so the first record has a parent and the range holds exactly the
records (plan squad round 3).

`tracked-tree` (sandbox-paths; op 023, #60, 2026-11-20): the plant job copies the plant's `tree/` into an empty
directory, replaces every `@SANDBOX_ROOT@` and `@SANDBOX_HOME_USER@` in any file with the sandbox path it stands for
(built at run time, so no plant file holds a sandbox path), runs `git init`, and commits the result by
`Plant Base <base@example.com>` when it holds a file; then it runs `pnpm run gate:sandbox-paths -- --root <tmp>`. It
copies no configuration set and links no `node_modules`, since the gate reads only the root's tracked files. An empty
or missing `tree/` gives a repository that tracks no file. Placeholders such as `<pnpm store>` are not markers and are
copied as they are. Finding locations are paths below `tree/`.

Every gate has at least one `fail`, one `pass` and one `error` (breaking) plant.

| Gate | Plant form | Fail plants (FR-025) | Pass plants | Breaking plants (exit 2) |
|---|---|---|---|---|
| typecheck | `repo-tree` | implicit `any` (`TS7006`) in `packages/tokens/src/x.ts`; the same in gate source `gates/lib/x.ts` and in test code `packages/elements/test/x.test.ts` (each only reached through the root `tsconfig.json` `include`) | a clean strict file at `packages/tokens/src/x.ts`; an implicit `any` in `gates/test/fixtures/x.ts` (excluded, FR-028) | `packages/tokens/src/x.ts` with `/// <reference path="./missing.d.ts" />` (tsc `TS6053`, a TS6xxx diagnostic, so exit 2 per contracts/gate-cli.md); phase 4 confirms the code red first and otherwise picks another TS5xxx/TS6xxx input |
| lint | `repo-tree` | floating promise in `packages/tokens/src/x.ts` and in gate source `gates/bin/x.ts` (the project service resolves each through the copied tsconfig files, research.md R-05) | a clean file; a floating promise in `gates/test/fixtures/x.ts` (excluded) | a file that does not parse |
| unit-tests | `repo-tree`; `test.ts --root <tmp>` runs every project of the copied `vitest.config.ts` | a failing test at `packages/tokens/test/x.test.ts` (Node), `packages/styles/test/x.test.ts` (Node), a colocated `packages/tokens/src/x.test.ts`, `gates/test/x.test.ts` (`gates`) and `packages/elements/test/x.test.ts` (`elements`, Chromium); the Chromium plant: asserts, through the locally declared `NavigatorUAData` type of research.md R-03, that `navigator.userAgentData.brands` contains a brand that does not exist, expected finding naming that test with a message containing `Chromium` (research.md R-03), so an `elements` `include` that misses `packages/elements/test/` fails it | a passing test per project, each alone in its plant, so the other projects have no test file (US1 scenario 10); a passing test in `tokens` beside a failing `gates/test/fixtures/x.test.ts` (excluded, not run) | a test file that throws while loading; an empty `tree/` (exit 2, "no test file found") |
| test-lint | `repo-tree` | one per FR-010 pattern (7) under `packages/tokens/test/`; `expect-expect` again in a colocated `packages/elements/src/x.test.ts` and in `gates/test/x.test.ts` | a test with one real assertion; an assertion-free test in `gates/test/fixtures/x.test.ts` (excluded) | a file that does not parse |
| mutation | `mutation-repo`: `base/` and `head/` trees at repository paths; the plant job builds a temporary repository and runs the gate with `--root` and `--base` | covered line not checked; changed line no test runs; a next-line record without a reason; `// Stryker disable all` in changed code; a survivor in gate source (`gates/lib/`) | a change fully checked; a survivor with a reasoned next-line record, whose `records` list the record (path, line, mutator, reason); a change only to a colocated `*.test.ts`; a change whose only unkilled mutants the type checker rejects (`CompileError`, invalid by FR-011); amendment 2026-11-10, mission 007: that plant's `reports` list its one `compile-error` line, the fully checked change's `reports` are empty (no report line), and a type-only change (`pass-zero-mutant`) passes with its one `zero-mutants` line in `reports`, on a real Stryker run with no mutant | a `--base` that does not resolve in the temporary repository; amendment 2026-11-10, mission 007: a type-only change beside a test that fails without any mutant (`error-zero-mutant-failing-test`), so Stryker's dry run fails and the cause names it; amendment 2026-11-19, mission 019 (gate gap rule (c)): a change every one of whose mutants on its changed lines is a CompileError on one diagnostic of the unmutated file, off the mutated lines (`error-checker-failure`), its cause naming the checker failure |
| style-lint | `repo-tree`: files in the package source of `packages/elements/` (`.ts`, `.css`, `.stories.ts`) and `packages/styles/` (`.css`), inside or outside `src/` (FR-024, FR-028; research.md R-07) | raw literal in a `css` template in `packages/elements/src/*.ts`; raw literal in a `.css` file of `packages/elements/src/` and of `packages/styles/src/`; raw literal in `packages/styles/x.css` (package source outside `src/`); one per FR-024 reject class: `2rem`, `150ms`, `#fff`, `rgb(0 0 0)`, `color: red`, `font-family: Inter`, `font-weight: 600`, `width: 2`, `var(--ocelle-x, 4px)`, `calc(var(--a) + 4px)` | `var(--ocelle-x)`, `0`, `100%`, `Canvas`, `1fr`, `calc(var(--a) * 2)`, `line-height: 1.5`, `content: ""`, `anchor-name: --tip`, `var(--ocelle-x, Canvas)`, a raw `4px` in `packages/elements/src/x.stories.ts` (not covered); a raw `4px` in `packages/elements/test/x.test.ts` (test code, not covered); a raw `4px` in `packages/tokens/src/x.css` (token definitions, not covered) | a stylesheet that does not parse |
| prefix | `repo-tree`: files in package source, test code and `dist/` of the packages | `<sk-button>` in package source, `<SK-Button>` (the name rule is case-insensitive, research.md R-12), `--sk-color` in test code, `sk-select` event in `dist/`, `monospace`, `Menlo` | `task-list`, `desk-row`, `--risk-level`; an `sk-` name in a file outside the packages (`gates/x.ts`, not covered) | an unreadable (invalid UTF-8) file |
| pins | `workspace`: package.json(s), lockfile, `.node-version`, `pnpm-workspace.yaml` | lockfile out of date; a `^` range; a `~` range; `workspace:^`; `workspace:*`; `workspace:~`; `workspace:0.0.1` on a sibling at version 0.0.0 (a `workspace:` version that differs from the package's); `.node-version` missing; `.node-version` not exact (`26`); `packageManager` missing; `packageManager` not exact (`pnpm@12`); `minimumReleaseAge` missing; `minimumReleaseAge: 1440`; `minimumReleaseAgeStrict` missing; `minimumReleaseAgeStrict: false`; a `minimumReleaseAgeExclude` entry; `allowBuilds` missing; an `allowBuilds` entry set to `true`; `dangerouslyAllowAllBuilds: true`; `shamefullyHoist: true`; a non-empty `publicHoistPattern`; `nodeLinker: hoisted` (FR-027, research.md R-14) | a matching mini-workspace with `workspace:0.0.0` on a sibling at version 0.0.0 and the policy settings | a `package.json` that is not valid JSON |
| csp | `repo-tree`: files at `packages/*/dist/` (tracked in the plant; the root `.gitignore`'s `packages/*/dist/` matches only root paths) | one per FR-021 construct (9); a `style` attribute after a newline in a template; `<svg/onload=...>`; indirect `(0, eval)(s)` | `<script src=...>` external module, `setTimeout(fn, 0)`, `retrieval(x)`, `isFunction(x)`; an inline script in `packages/elements/src/x.ts` (source, not built output) | a `.js` file that does not parse |
| config-copies | `repo-tree`: the two copies at `.specify/extensions/story/story-config.yml` and `tooling/speckit/extensions/story/story-config.yml` | one setting differs; equal copies whose `test_pathspec` differs from FR-028's test code | two equal copies with FR-028's `test_pathspec` | `tooling/speckit/extensions/story/story-config.yml` missing |
| signoff | `commit-repo`: `commits.txt` in the record format; the plant job builds a temporary repository on an empty base commit and runs the gate with `--root` and `--range <base commit>..HEAD` | no trailer; trailer not matching author | agent author signing off itself; unsigned merge commit | an empty range |
| sandbox-paths | `tracked-tree`: files at any path, sandbox paths written with the markers (since op 023) | a test log with a store path on line 2 and a checkout path on line 5 (`fail-store-and-repo-root`); a Stryker report whose `projectRoot` and a `file://` URL name the checkout (`fail-file-url-in-json`); a file in the directory of two allowed files (`fail-allowed-name-elsewhere`) | the near misses of the rule and the placeholders (`pass-near-misses`); sandbox paths only in the four allowed files (`pass-allowed-files`); one only in a binary file (`pass-binary-file`) | no tracked file (`error-no-tracked-file`, cause `no tracked file`) |
| plants (registry) | `gates.json` and `ci.yml` pair under `gates/plants/plants/<case>/` | a gate without a registry entry; a gate without a CI job | a matching pair | - |

Identities in plants (sign-off records, and any author in a plant) are invented names on reserved domains (RFC 2606,
for example `Ada Example <ada@example.com>`), never a real person's name or address (FR-034).

The plant job fails when: the registry check fails; a gate has no `fail`, `pass` or `error` plant; a `fail` plant's
gate does not exit 1 with exactly the expected findings; a `pass` plant's gate does not exit 0 with no finding (and
the expected records); an `error` plant's gate does not exit 2, or exits 2 with no error-output line containing the plant's `cause`; a
plant has no or an invalid `plant.json` (including an `error` plant without `cause`, `cause` on another plant, and
`base` on a `pass` plant); amendment 2026-11-10, mission 007: a `pass` or `fail` mutation plant with `reports`
whose run's `timeout`, `compile-error` and `zero-mutants` lines do not equal `reports` as a multiset (by location and
rule, each given `message` substring in a line of its own); `records` compares only the run's `record` lines, the four
report rules are never findings of a mutation run, and `reports` on an `error` plant or on a plant of another gate is
an invalid `plant.json`; a plant
carries gate configuration (a `tsconfig*.json` or any ESLint, Stylelint, Vitest, Vite or Stryker configuration file
anywhere in its directory).
