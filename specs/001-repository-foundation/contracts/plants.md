# Contract: plants

Layout: `gates/plants/<gate-id>/<case>/plant.json` plus inputs. `plant.json` (data-model.md § Plant):
`{"expect": "fail"|"pass"|"error", "why": "...", "findings": [...], "records": [...]}`; `findings` is required for a
`fail` plant and lists exactly the findings the gate must report (location and rule, optionally a message
substring).

Plant mode runs the repository's own gate configuration and swaps only the inputs. A plant directory carries no
compiler, lint, test or Stryker options: a plant `tsconfig.json` has no keys other than `extends` and `include`
(no `compilerOptions`, `files`, `references` or any other key), and in a `fail` or `pass` plant its `extends`
resolves to the repository's `tsconfig.base.json`; only an `error` plant's `extends` may name a file that does not
exist, because that missing base is its breaking input (it adds no option); ESLint, Stylelint and Vitest load the repository's configs and only lift the
`gates/plants/` exclusion for the plant directory; unit-test plants run inside the named project of the repository's
`vitest.config.ts`; mutation uses the repository's `stryker.config.json`. The plant job rejects a plant that carries
its own configuration.

Every gate has at least one `fail`, one `pass` and one `error` (breaking) plant.

| Gate | Plant form | Fail plants (FR-025) | Pass plants | Breaking plants (exit 2) |
|---|---|---|---|---|
| typecheck | `files`: a `.ts` file and a tsconfig with only `extends` and `include` | implicit `any` (`TS7006`) | a clean strict file | a tsconfig with only `extends` and `include` whose `extends` names a file that does not exist (tsc `TS5083`, a TS5xxx diagnostic, so exit 2 per contracts/gate-cli.md) |
| lint | `files` | floating promise | a clean file | a file that does not parse |
| unit-tests | `test-files` with a project name; each runs in that project of `vitest.config.ts` | a failing test in `tokens` (Node), in `styles` (Node) and in `elements` (Chromium); the Chromium plant: asserts `navigator.userAgentData.brands` contains a brand that does not exist, expected finding naming that test with a message containing `Chromium` (research.md R-03) | a passing test per project | a test file that throws while loading |
| test-lint | `test-files` | one per FR-010 pattern (7) | a test with one real assertion | a file that does not parse |
| mutation | `mutation-repo`: `base/` and `head/` trees at repository paths; the plant job builds a temporary repository and runs the gate with `--root` and `--base` | covered line not checked; changed line no test runs; a next-line record without a reason; `// Stryker disable all` in changed code; a survivor in gate source (`gates/lib/`) | a change fully checked; a survivor with a reasoned next-line record, whose `records` list the record (path, line, mutator, reason); a change only to a colocated `*.test.ts` | a `--base` that does not resolve in the temporary repository |
| style-lint | `files` | raw literal in a `css` template in `.ts`; raw literal in `.css`; one per FR-024 reject class: `2rem`, `150ms`, `#fff`, `rgb(0 0 0)`, `color: red`, `font-family: Inter`, `font-weight: 600`, `width: 2`, `var(--ocelle-x, 4px)`, `calc(var(--a) + 4px)` | `var(--ocelle-x)`, `0`, `100%`, `Canvas`, `1fr`, `calc(var(--a) * 2)`, `line-height: 1.5`, `content: ""`, `anchor-name: --tip`, `var(--ocelle-x, Canvas)`, a raw `4px` in a `*.stories.ts` under `packages/elements/src` (not covered) | a stylesheet that does not parse |
| prefix | `files` | `<sk-button>`, `--sk-color`, `sk-select` event, `monospace`, `Menlo` | `task-list`, `desk-row`, `--risk-level` | an unreadable (invalid UTF-8) file |
| pins | `workspace`: package.json(s), lockfile, `.node-version`, `pnpm-workspace.yaml` | lockfile out of date; a `^` range; `workspace:^`; `minimumReleaseAge` missing; `minimumReleaseAge: 1440`; an `allowBuilds` entry set to `true` | a matching mini-workspace with `workspace:0.0.0` on a sibling at version 0.0.0 and the policy settings | a `package.json` that is not valid JSON |
| csp | `built-output`: `dist/` files | one per FR-021 construct (9); a `style` attribute after a newline in a template; `<svg/onload=...>`; indirect `(0, eval)(s)` | `<script src=...>` external module, `setTimeout(fn, 0)`, `retrieval(x)`, `isFunction(x)` | a `.js` file that does not parse |
| config-copies | `config-pair`: `a.yml`, `b.yml` | one setting differs | two equal copies | `b.yml` missing |
| signoff | `commit-repo`: `commits.txt` in the record format; the plant job builds a temporary repository and runs the gate with `--root` and `--range` | no trailer; trailer not matching author | agent author signing off itself; unsigned merge commit | an empty range |
| plants (registry) | `gates.json` and `ci.yml` pair under `gates/plants/plants/<case>/` | a gate without a registry entry; a gate without a CI job | a matching pair | - |

Identities in plants (sign-off records, and any author in a plant) are invented names on reserved domains (RFC 2606,
for example `Ada Example <ada@example.com>`), never a real person's name or address (FR-034).

The plant job fails when: the registry check fails; a gate has no `fail`, `pass` or `error` plant; a `fail` plant's
gate does not exit 1 with exactly the expected findings; a `pass` plant's gate does not exit 0 with no finding (and
the expected records); an `error` plant's gate does not exit 2; a plant has no or an invalid `plant.json`; a plant
carries gate configuration (a tsconfig key other than `extends` and `include`, a `fail` or `pass` plant's `extends`
that does not resolve to `tsconfig.base.json`, or any ESLint, Stylelint, Vitest, Vite or Stryker configuration file).
