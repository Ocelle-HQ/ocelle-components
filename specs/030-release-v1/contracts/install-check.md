# Contract: install check (FR-030 to FR-034)

`node gates/bin/install-check.ts` (not a merge gate, no `gates.json` entry; run by the release workflows and by the
operator). Logic in `gates/lib/install-check.ts`, the process boundary (npm, Chromium, the HTTP server, the
signature adapter) in `gates/bin/install-check.ts`, data only in `gates/release/`; both code files are in the
mutation gate's scope (research.md R-11).

| Option | Meaning |
|---|---|
| `--version <v>` | the version to install (registry mode) |
| `--repository <owner/repo>` | the provenance source repository expected |
| `--commit <sha>` | the provenance commit expected |
| `--workflow <path>` | the provenance workflow path expected, default `.github/workflows/release.yml` |
| `--ref <ref>` | the provenance ref expected, default `refs/tags/v<version>` |
| `--registry <url>` | default `https://registry.npmjs.org/` |
| `--from-tarballs <dir>` | rehearsal: install the tarballs instead of the registry versions; no provenance step; the peer step checks the declared peer only |
| `--rehearse` | provenance proof on real registry inputs from `gates/release/provenance-reference.json`: the pass case must pass; wrong repository, wrong commit, wrong workflow, wrong ref and the `withoutProvenance` package must each fail with `repository-mismatch`, `commit-mismatch`, `workflow-mismatch`, `ref-mismatch`, `attestation-missing`; prints expected and actual rule per case; exit 0 only if all six behave |
| `--timeout <s>` | visibility retry bound, default 600, interval 30 s |

**Environment of every child process** (allow list, research.md R-11): `PATH`; `HOME` and `TMPDIR` the temporary
directory; `npm_config_userconfig` and `npm_config_globalconfig` empty temporary files; `npm_config_cache` in the
temporary directory; `npm_config_registry` the `--registry` value; the proxy (`HTTP_PROXY`, `HTTPS_PROXY`,
`NO_PROXY`, either case) and CA (`NODE_EXTRA_CA_CERTS`, `SSL_CERT_FILE`) variables if the parent has them. No other
variable passes, in particular none matching `/^npm_config_/i` from the parent, `NODE_AUTH_TOKEN`, `NPM_TOKEN`,
`GITHUB_TOKEN`, `GH_TOKEN`. Working directory: a fresh temporary project with `{"private": true}`.

**Steps:** install (npm, `--ignore-scripts`); resolve every declared entry point of each installed package (R-05);
import `@ocelle/tokens` in Node; serve the installed `@ocelle` packages and a generated page from `127.0.0.1` with
`Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'`, load
`browser.js` + `tokens.css` + `base.css` in Chromium with every off-origin request aborted and recorded and every CSP
violation recorded, and check `ocelle-button` is defined; verify signatures (the injected adapter: `npm audit
signatures --json`) and, for each package, the SLSA provenance statement's source repository, commit, workflow path
and ref; peer step: in a second empty project install `@ocelle/elements` alone and require its installed manifest to
declare `@ocelle/tokens` at `^<version>` and `@ocelle/tokens` to be installed at a version that satisfies it.

**Output:** one line per finding `<package>[@<version>]: install-check: <rule>: <message>` with rules `not-visible`,
`install-failed`, `entry-point-unresolved`, `import-failed`, `element-undefined`, `csp-violation`,
`network-request`, `peer-unresolved`, `signature-invalid`, `attestation-missing`, `repository-mismatch`,
`commit-mismatch`, `workflow-mismatch`, `ref-mismatch`; exit 0 / 1 / 2 as the gates do.

**Tests** (`gates/test/`, offline): decode-and-compare on recorded real registry responses
(`gates/test/fixtures/install-check/`) with the injected verifier, one test per provenance rule and for
`signature-invalid`, each asserting the rule line; stub-registry tests (no `dist.attestations` advertised) for
`not-visible` (injected clock), `install-failed`, `entry-point-unresolved`, `peer-unresolved`; fixture tarballs for
`csp-violation` (inline style) and `network-request` (remote fetch); the environment allow list with a planted
upper-case per-registry auth-token variable, assembled at run time, that must not reach the child.
