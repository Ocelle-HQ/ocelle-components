# Contract: `pack-contents` gate (FR-004, FR-006)

- **Command:** `pnpm run gate:pack-contents [-- --root <dir>] [--tarballs <dir>] [--version <v>]`;
  `gates/bin/pack-contents.ts`. Check name **Pack contents**. Plant form `pack-tree` (research.md R-17): the plant's
  `tree/` holds small prebuilt package trees laid over the configuration set; the plant builder archives each
  package directory under `package/` with plain `tar` (no build, no `pnpm pack`) and runs the gate with
  `--root <tmp> --tarballs <tmp>/tarballs`.
- **Without `--tarballs`:** builds the three packages (`pnpm --filter "./packages/*" -r build`) and packs each with
  `pnpm pack --pack-destination <tmp>`; this path is proven by a gates-integration test on the real workspace.
  **With `--tarballs`:** reads `<dir>/*.tgz` as given (release workflow, plants).
- **`--version`:** the expected version; default the version of `packages/tokens/package.json`.
- **Exit 0:** one line per package, `pack-contents: <name>@<version>: <n> files, <m> entry points`, then a summary.
- **Exit 1, findings** (`<package>[:<path>]: pack-contents: <rule>: <message>`): `entry-point-missing`,
  `entry-pattern-empty`, `required-missing`, `not-identical` (against the root file of the same name, or the
  `source` path an `identical` entry names: `packages/tokens/fonts/OFL.txt` for `dist/fonts/OFL.txt`), `private-flag`, `workspace-specifier`,
  `version-mismatch`, `peer-mismatch`, `not-allowed` (entry matches no allow pattern), `denied` (deny list:
  `**/*.test.*`, `**/*.spec.*`, `**/*.stories.*`, `**/.npmrc`, `**/.env*`, `**/*.pem`, `**/*.key`, `**/id_rsa*`,
  `**/id_ed25519*`, `**/test/**`), `sandbox-path` (op 023's rule from `gates/lib/sandbox-paths.ts`, on every text
  entry), `repository-mismatch` (packed `repository.url` or `directory` not as data-model.md says), `license-field`.
- **Exit 2, could not run:** the build fails, `pnpm pack` fails, a tarball is unreadable, `pack-manifest.json` is
  missing or invalid.
- **Plants** (`gates/plants/pack-contents/`): fail: `fail-export-missing`, `fail-license-missing`,
  `fail-ofl-missing`, `fail-ofl-differs` (a `dist/fonts/OFL.txt` that differs from `packages/tokens/fonts/OFL.txt`
  by one byte), `fail-notice-differs`, `fail-private`, `fail-workspace-peer` (a packed manifest that keeps
  `workspace:`), `fail-version-skew`, `fail-extra-file`, `fail-test-file`, `fail-npmrc` (an `.npmrc` with no
  credential-shaped value: the `denied` rule is by name), `fail-sandbox-path`, `fail-peer-exact`,
  `fail-repository-directory`; pass: `pass-minimal` (three package trees that meet every rule),
  `pass-star-export` (a `./fonts/*` export with matching files); breaking: `break-tarball-unreadable`,
  `break-manifest-invalid`. The build path's "could not run" (a failing build) is a case of the gates-integration
  test.
