// The analyzer's configuration for its CLI (`cem analyze`), with the settings scripts/manifest.ts uses through the
// analyzer's API (005 research.md R-06; reviews/phase-2/spike.md § 2): the element modules src/ocelle-*.ts, the named
// internal bases, the overlays' src/overlay.ts (008 research.md R-01) and the form controls' src/form-control.ts
// (specs/010-feedback-forms FR-034, O3-01), and the Lit plugin. The CLI's own output is the raw manifest; the committed
// custom-elements.json is the one scripts/manifest.ts normalises (`pnpm --filter @ocelle/elements run manifest`), which
// drops the internal bases' modules, keeps what an element inherits from them with `inheritedFrom` (no fold), and which
// the manifest gate compares.
export default {
  globs: ["src/ocelle-*.ts", "src/overlay.ts", "src/form-control.ts"],
  litelement: true,
  packagejson: false,
};
