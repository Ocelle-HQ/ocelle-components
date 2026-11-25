# Contract: `pack-contents` gate (FR-004, FR-006)

- **Command:** `pnpm run gate:pack-contents [-- --root <dir>] [--tarballs <dir>] [--version <v>]`;
  `gates/bin/pack-contents.ts`. Check name **Pack contents**. Plant form `workspace` (the plant is a workspace tree
  with the three package directories; the gate builds and packs it).
- **Without `--tarballs`:** builds the three packages (`pnpm --filter "./packages/*" -r build`) and packs each with
  `pnpm pack --pack-destination <tmp>`. **With `--tarballs`:** reads `<dir>/*.tgz` as given (release workflow).
- **`--version`:** the expected version; default the version of `packages/tokens/package.json`.
- **Exit 0:** one line per package, `pack-contents: <name>@<version>: <n> files, <m> entry points`, then a summary.
- **Exit 1, findings** (`<package>[:<path>]: pack-contents: <rule>: <message>`): `entry-point-missing`,
  `entry-pattern-empty`, `required-missing`, `not-identical`, `private-flag`, `workspace-specifier`,
  `version-mismatch`, `peer-mismatch`, `not-allowed` (entry matches no allow pattern), `denied` (deny list:
  `**/*.test.*`, `**/*.spec.*`, `**/*.stories.*`, `**/.npmrc`, `**/.env*`, `**/*.pem`, `**/*.key`, `**/id_rsa*`,
  `**/id_ed25519*`, `**/test/**`), `sandbox-path` (op 023's rule from `gates/lib/sandbox-paths.ts`, on every text
  entry), `repository-mismatch` (packed `repository.url` or `directory` not as data-model.md says), `license-field`.
- **Exit 2, could not run:** the build fails, `pnpm pack` fails, a tarball is unreadable, `pack-manifest.json` is
  missing or invalid.
- **Plants** (`gates/plants/pack-contents/`): fail: `fail-export-missing`, `fail-license-missing`,
  `fail-ofl-missing`, `fail-notice-differs`, `fail-private`, `fail-workspace-peer` (a peer written so the packed
  manifest keeps `workspace:`), `fail-version-skew`, `fail-extra-file`, `fail-test-file`, `fail-npmrc`,
  `fail-sandbox-path`, `fail-peer-exact`, `fail-repository-directory`; pass: `pass-repository`,
  `pass-star-export` (a `./fonts/*` export with matching files); breaking: `break-build-fails`,
  `break-manifest-invalid`.
