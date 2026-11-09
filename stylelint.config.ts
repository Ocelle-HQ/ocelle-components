// Style lint (FR-024, research.md R-07): the styles of package source that FR-024 covers, checked by the local plugin
// ocelle/token-only. gates/bin/style-lint.ts lints packages/elements/**/*.ts (style templates, through postcss-lit),
// packages/elements/**/*.css and packages/styles/**/*.css; the plants, the gate-test fixtures, built output and test
// code (stories included) are ignored. An empty input passes; the style-lint plants prove the file collection. Since
// 003 (FR-002, research.md R-07) packages/styles/**/*.css gets the rule's `lineHeight: "token"` option: a line height
// there must be an `--ocelle-line-height-*` token (or a CSS-wide keyword), and a `font` shorthand there must state
// one; element styles keep 002's unitless line height.
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
  overrides: [
    { files: ["packages/elements/**/*.ts"], customSyntax: "postcss-lit" },
    { files: ["packages/styles/**/*.css"], rules: { "ocelle/token-only": [true, { lineHeight: "token" }] } },
  ],
};

export default config;
