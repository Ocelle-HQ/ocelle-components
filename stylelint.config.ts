// Style lint (FR-024, research.md R-07): the styles of package source that FR-024 covers, checked by the local plugin
// ocelle/token-only. gates/bin/style-lint.ts lints packages/elements/**/*.ts (style templates, through postcss-lit),
// packages/elements/**/*.css and packages/styles/**/*.css; the plants, the gate-test fixtures, built output and test
// code (stories included) are ignored. This feature ships no stylesheet, so an empty input passes; the style-lint
// plants prove the file collection.
import type { Config } from "stylelint";

const config: Config = {
  plugins: ["./gates/stylelint/token-only.ts"],
  allowEmptyInput: true,
  ignoreFiles: [
    "gates/plants/**",
    "gates/test/fixtures/**",
    "packages/*/dist/**",
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/test/**",
    "**/*.stories.ts",
  ],
  rules: { "ocelle/token-only": true },
  overrides: [{ files: ["packages/elements/**/*.ts"], customSyntax: "postcss-lit" }],
};

export default config;
