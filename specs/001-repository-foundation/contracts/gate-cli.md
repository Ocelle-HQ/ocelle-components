# Contract: gate commands

Every gate runs as `pnpm run gate:<id>` from the repository root and follows one contract.

| Exit | Meaning | Output |
|---|---|---|
| 0 | the gate checked its files and found nothing | a one-line summary (files checked) |
| 1 | the gate found defects | one finding per line in the format of data-model.md § Finding (`<location>: <gate-id>: <rule>: <message>`, where `location` is `path:line`, `path` or a commit hash), then a summary |
| 2 | the gate could not run (missing tool, browser, base commit or range, unreadable or unparsable input, invalid configuration, any uncaught error) | one line naming the cause and the command that fixes it |

Every gate entry catches any exception at the top and exits 2, so Node's own exit 1 for an uncaught error never
reads as "found defects".

Plant mode: `pnpm run gate:<id> -- --plant <dir>` checks only the plant's inputs (contracts/plants.md) with the
repository's own gate configuration, and follows the same exit codes; it is used by the `files`, `test-files`,
`workspace` and `config-pair` plant forms. For the style-lint, prefix, CSP (`repo-tree`), sign-off and mutation
gates the plant job instead builds a temporary repository from the plant and runs the gate in normal mode with
`--root <tmp>` (plus `--range` or `--base`); `--root` changes only the repository root, so the gate's own file
collection is exercised. `unit-tests` (`gates/bin/test.ts`) also takes `--root <dir>`, its test seam (research.md
R-03). A gate MUST NOT read
`gates/plants/` or `gates/test/fixtures/` outside plant mode.

| id | Check (CI) | Command (normal) | Checks |
|---|---|---|---|
| `typecheck` | Typecheck | `tsc -p tsconfig.json --noEmit` | repository TypeScript |
| `lint` | Code lint | `eslint --config eslint.config.ts .` | repository TypeScript |
| `style-lint` | Style lint | `stylelint` per `stylelint.config.ts` | FR-024 styles |
| `unit-tests` | Unit tests | `pnpm test` (`gates/bin/test.ts`) | every test file |
| `test-lint` | Test lint | `eslint --config eslint.test.config.ts` | all test code |
| `mutation` | Mutation testing | `gates/bin/mutation.ts --base <sha>` (`--plan` prints the CI shards as JSON; `--files <paths>` limits a run to one shard, research.md R-08) | changed package source and gate source lines |
| `csp` | Content security | `gates/bin/csp.ts` (after `pnpm -r build`) | built output |
| `prefix` | Prefix | `gates/bin/prefix.ts` | packages: source, test code, built output |
| `config-copies` | Story config copies | `gates/bin/config-copies.ts` | the two copies of FR-006 |
| `pins` | Install and pins | `gates/bin/pins.ts` | manifests, lockfile, version pins, `pnpm-workspace.yaml` settings |
| `signoff` | Sign-off | `gates/bin/signoff.ts --range <base>..<head>` | commits in the pull request |
| `plants` | Plants | `gates/bin/plants.ts` | `gates/plants/` only, and the registry check |

## Findings versus breakage (tool-backed and Stryker-backed gates)

Tool exit codes do not separate findings from breakage, so each wrapper in `gates/lib` decides from the tool's
structured output. The tool's exit code is used only where it is unambiguous.

| Gate | Tool output read | Exit 1 (findings) | Exit 2 (could not run) |
|---|---|---|---|
| `typecheck` | tsc diagnostics (`--pretty false`), each with its `TS<code>` | diagnostics with codes outside TS5xxx and TS6xxx | any TS5xxx/TS6xxx diagnostic (configuration and options: missing project, unknown option, a base that does not resolve), or tsc not starting |
| `lint`, `test-lint` | ESLint `--format json` | messages that are not fatal | ESLint exit 2 or no JSON (configuration errors), or a fatal message (a file that does not parse) |
| `style-lint` | Stylelint `--formatter json` | warnings other than `CssSyntaxError` | Stylelint exit 1, 64 or 78, no JSON, or a `CssSyntaxError` warning |
| `unit-tests` | Vitest `--reporter json` (plus the Chromium check of `gates/bin/test.ts`) | failed tests (one finding each, rule = the test's full name) | no report, the browser missing, no test file found in the run, a test file that fails to load, or errors outside tests (unhandled errors, failed collection) |
| `mutation` | Stryker's JSON report (research.md R-08) | `Survived` or `NoCoverage` on a changed line; a disable comment other than a reasoned next-line record | no report, a failed dry run, an unresolvable `--base` |

The script gates (`csp`, `prefix`, `config-copies`, `pins`, `signoff`, `plants`) produce findings themselves and
follow the same split: an input they cannot read or parse is exit 2.
