# Contract: gate commands

Every gate runs as `pnpm run gate:<id>` from the repository root and follows one contract.

| Exit | Meaning | Output |
|---|---|---|
| 0 | the gate checked its files and found nothing | a one-line summary (files checked) |
| 1 | the gate found defects | one finding per line, `<path>:<line>: <gate-id>: <message>`, then a summary |
| 2 | the gate could not run (missing tool, browser, base commit, unreadable input) | one line naming the cause and the command that fixes it |

Plant mode: `pnpm run gate:<id> -- --plant <dir>` checks only the plant's inputs (contracts/plants.md) and follows
the same exit codes. A gate MUST NOT read `gates/plants/` outside plant mode.

| id | Check (CI) | Command (normal) | Checks |
|---|---|---|---|
| `typecheck` | Typecheck | `tsc -p tsconfig.json --noEmit` | repository TypeScript |
| `lint` | Code lint | `eslint --config eslint.config.ts .` | repository TypeScript |
| `style-lint` | Style lint | `stylelint` per `stylelint.config.ts` | FR-024 styles |
| `unit-tests` | Unit tests | `pnpm test` (`gates/bin/test.ts`) | every test file |
| `test-lint` | Test lint | `eslint --config eslint.test.config.ts` | all test code |
| `mutation` | Mutation testing | `gates/bin/mutation.ts [--base <sha>]` | changed package source lines |
| `csp` | Content security | `gates/bin/csp.ts` (after `pnpm -r build`) | built output |
| `prefix` | Prefix | `gates/bin/prefix.ts` | packages: source, test code, built output |
| `config-copies` | Story config copies | `gates/bin/config-copies.ts` | the two copies of FR-006 |
| `pins` | Install and pins | `gates/bin/pins.ts` | manifests, lockfile, version pins |
| `signoff` | Sign-off | `gates/bin/signoff.ts --range <base>..<head>` | commits in the pull request |
| `plants` | Plants | `gates/bin/plants.ts` | `gates/plants/` only |

Tool-backed gates (`typecheck`, `lint`, `style-lint`, `test-lint`, `unit-tests`) are wrapped by `gates/lib` so their
exit codes follow the table (tool errors in configuration map to 2, findings to 1).
