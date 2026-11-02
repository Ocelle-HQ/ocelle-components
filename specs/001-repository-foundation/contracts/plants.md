# Contract: plants

Layout: `gates/plants/<gate-id>/<case>/plant.json` plus inputs. `plant.json` (data-model.md § Plant):
`{"expect": "fail"|"pass"|"error", "why": "...", "findings": [...], "records": [...]}`; `findings` is required for a
`fail` plant and lists exactly the findings the gate must report (location and rule, optionally a message
substring).

Plant mode runs the repository's own gate configuration and swaps only the inputs. A plant directory carries no
compiler, lint, test or Stryker options: only typecheck and lint plants carry a `tsconfig.json`, which has no keys
other than `extends`, `include` and `exclude` (no `compilerOptions`, `files`, `references` or any other key), and in
a `fail` or `pass` plant its `extends` resolves to the repository's root `tsconfig.json`, the file the typecheck gate
runs, so any option a pull request adds there applies to the plant too; `exclude` (usually `[]`) overrides the root
file's inherited `exclude` of `gates/plants/**`. Only an `error` plant's `extends` may name a file that does not
exist, because that missing base is its breaking input (it adds no option). The lint plant's `tsconfig.json` is the
project typescript-eslint's project service resolves the plant file through (research.md R-05). ESLint and Vitest
load the repository's configs and only lift the `gates/plants/` exclusion for the plant directory; unit-test plants
run inside the named project of the repository's `vitest.config.ts`; `repo-tree`, `commit-repo` and `mutation-repo`
plants run in a temporary repository with the repository's configuration files copied in unchanged, the gate in
normal mode with `--root` (research.md R-10); mutation uses the repository's `stryker.config.json`. The plant job
rejects a plant that carries its own configuration.

`repo-tree` (style lint, prefix, CSP; operator decision, plan squad round 2): the plant's `tree/` holds its input
files at repository paths; the plant job copies the repository's configuration into a temporary directory, lays
`tree/` over it, links `node_modules` and runs `pnpm run gate:<id> -- --root <tmp>` in normal mode, so the gate's
own file collection (globs, exclusions, the path-bound postcss-lit syntax) decides what it checks. Finding
locations are repository paths below `tree/`.

Every gate has at least one `fail`, one `pass` and one `error` (breaking) plant.

| Gate | Plant form | Fail plants (FR-025) | Pass plants | Breaking plants (exit 2) |
|---|---|---|---|---|
| typecheck | `files`: a `.ts` file and a tsconfig with only `extends` (the root `tsconfig.json`), `include` and `exclude` | implicit `any` (`TS7006`) | a clean strict file | a tsconfig with only `extends`, `include` and `exclude` whose `extends` names a file that does not exist (tsc `TS5083`, a TS5xxx diagnostic, so exit 2 per contracts/gate-cli.md) |
| lint | `files`: a `.ts` file and the same plant tsconfig as typecheck (the project service resolves the file through it) | floating promise | a clean file | a file that does not parse |
| unit-tests | `test-files` with a project name; each runs in that project of `vitest.config.ts` | a failing test in `tokens` (Node), in `styles` (Node) and in `elements` (Chromium); the Chromium plant: asserts, through the locally declared `NavigatorUAData` type of research.md R-03, that `navigator.userAgentData.brands` contains a brand that does not exist, expected finding naming that test with a message containing `Chromium` (research.md R-03) | a passing test per project, each alone in its plant, so the other projects have no test file (US1 scenario 10) | a test file that throws while loading; a case with no test file (exit 2, "no test file found") |
| test-lint | `test-files` | one per FR-010 pattern (7) | a test with one real assertion | a file that does not parse |
| mutation | `mutation-repo`: `base/` and `head/` trees at repository paths; the plant job builds a temporary repository and runs the gate with `--root` and `--base` | covered line not checked; changed line no test runs; a next-line record without a reason; `// Stryker disable all` in changed code; a survivor in gate source (`gates/lib/`) | a change fully checked; a survivor with a reasoned next-line record, whose `records` list the record (path, line, mutator, reason); a change only to a colocated `*.test.ts` | a `--base` that does not resolve in the temporary repository |
| style-lint | `repo-tree`: files at `packages/elements/src/` (`.ts`, `.css`, `.stories.ts`) and `packages/styles/src/` (`.css`) | raw literal in a `css` template in `packages/elements/src/*.ts`; raw literal in a `.css` file of `packages/elements/src/` and of `packages/styles/src/`; one per FR-024 reject class: `2rem`, `150ms`, `#fff`, `rgb(0 0 0)`, `color: red`, `font-family: Inter`, `font-weight: 600`, `width: 2`, `var(--ocelle-x, 4px)`, `calc(var(--a) + 4px)` | `var(--ocelle-x)`, `0`, `100%`, `Canvas`, `1fr`, `calc(var(--a) * 2)`, `line-height: 1.5`, `content: ""`, `anchor-name: --tip`, `var(--ocelle-x, Canvas)`, a raw `4px` in `packages/elements/src/x.stories.ts` (not covered); a raw `4px` in `packages/elements/test/x.test.ts` (test code, not covered); a raw `4px` in `packages/tokens/src/x.css` (token definitions, not covered) | a stylesheet that does not parse |
| prefix | `repo-tree`: files in package source, test code and `dist/` of the packages | `<sk-button>` in package source, `<SK-Button>` (the name rule is case-insensitive, research.md R-12), `--sk-color` in test code, `sk-select` event in `dist/`, `monospace`, `Menlo` | `task-list`, `desk-row`, `--risk-level`; an `sk-` name in a file outside the packages (`gates/x.ts`, not covered) | an unreadable (invalid UTF-8) file |
| pins | `workspace`: package.json(s), lockfile, `.node-version`, `pnpm-workspace.yaml` | lockfile out of date; a `^` range; `workspace:^`; `minimumReleaseAge` missing; `minimumReleaseAge: 1440`; an `allowBuilds` entry set to `true` | a matching mini-workspace with `workspace:0.0.0` on a sibling at version 0.0.0 and the policy settings | a `package.json` that is not valid JSON |
| csp | `repo-tree`: files at `packages/*/dist/` (tracked in the plant; the root `.gitignore`'s `packages/*/dist/` matches only root paths) | one per FR-021 construct (9); a `style` attribute after a newline in a template; `<svg/onload=...>`; indirect `(0, eval)(s)` | `<script src=...>` external module, `setTimeout(fn, 0)`, `retrieval(x)`, `isFunction(x)`; an inline script in `packages/elements/src/x.ts` (source, not built output) | a `.js` file that does not parse |
| config-copies | `config-pair`: `a.yml`, `b.yml` | one setting differs | two equal copies | `b.yml` missing |
| signoff | `commit-repo`: `commits.txt` in the record format; the plant job builds a temporary repository and runs the gate with `--root` and `--range` | no trailer; trailer not matching author | agent author signing off itself; unsigned merge commit | an empty range |
| plants (registry) | `gates.json` and `ci.yml` pair under `gates/plants/plants/<case>/` | a gate without a registry entry; a gate without a CI job | a matching pair | - |

Identities in plants (sign-off records, and any author in a plant) are invented names on reserved domains (RFC 2606,
for example `Ada Example <ada@example.com>`), never a real person's name or address (FR-034).

The plant job fails when: the registry check fails; a gate has no `fail`, `pass` or `error` plant; a `fail` plant's
gate does not exit 1 with exactly the expected findings; a `pass` plant's gate does not exit 0 with no finding (and
the expected records); an `error` plant's gate does not exit 2; a plant has no or an invalid `plant.json`; a plant
carries gate configuration (a tsconfig in a plant of a gate other than typecheck and lint, a tsconfig key other than
`extends`, `include` and `exclude`, a `fail` or `pass` plant's `extends` that does not resolve to the root
`tsconfig.json`, or any ESLint, Stylelint, Vitest, Vite or Stryker configuration file).
