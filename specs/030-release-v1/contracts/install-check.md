# Contract: install check (FR-030 to FR-034)

`node gates/release/install-check.ts` (not a merge gate; run by the release workflows and by the operator).

| Option | Meaning |
|---|---|
| `--version <v>` | the version to install (registry mode) |
| `--repository <owner/repo>` | the provenance source repository expected |
| `--commit <sha>` | the provenance commit expected |
| `--registry <url>` | default `https://registry.npmjs.org/` |
| `--from-tarballs <dir>` | rehearsal: install the tarballs instead of the registry versions; no provenance step |
| `--rehearse` | provenance proof against `gates/release/provenance-reference.json`: one run that must pass, one with another repository and one with another commit that must each fail; exit 0 only if all three behave |
| `--timeout <s>` | visibility retry bound, default 600, interval 30 s |

Environment of every child process: `npm_config_userconfig` and `npm_config_globalconfig` set to empty temporary
files, `NODE_AUTH_TOKEN`, `NPM_TOKEN` and `npm_config__authToken` removed; working directory a fresh temporary
project with `{"private": true}`.

Steps: install (npm, `--ignore-scripts`), resolve every declared entry point of each installed package (R-05), import
`@ocelle/tokens` in Node, load `browser.js` + `tokens.css` + `base.css` in Chromium and check `ocelle-button` is
defined, `npm audit signatures` (exit non-zero is a finding), then for each package fetch the attestations and check
the SLSA provenance statement's source repository and commit.

Output: one line per finding `<package>[@<version>]: install-check: <rule>: <message>` with rules `not-visible`,
`install-failed`, `entry-point-unresolved`, `import-failed`, `element-undefined`, `signature-invalid`,
`attestation-missing`, `repository-mismatch`, `commit-mismatch`; exit 0 / 1 / 2 as the gates do.
