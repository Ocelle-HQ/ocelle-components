// The analyzer's configuration for its CLI (`cem analyze`), with the settings scripts/manifest.ts uses through the
// analyzer's API (005 research.md R-06; reviews/phase-2/spike.md § 2): the element modules src/ocelle-*.ts and the Lit
// plugin. The CLI's own output is the raw manifest; the committed custom-elements.json is the one scripts/manifest.ts
// normalises (`pnpm --filter @ocelle/elements run manifest`), which the manifest gate compares.
export default {
  globs: ["src/ocelle-*.ts"],
  litelement: true,
  packagejson: false,
};
