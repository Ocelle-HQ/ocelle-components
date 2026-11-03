// Code lint (FR-020, research.md R-05): all repository TypeScript except the plants, the gate-test fixtures, built
// output and Stryker's sandbox copies, with @eslint/js recommended and typescript-eslint's strictTypeChecked and
// stylisticTypeChecked rule sets. The type-aware rules resolve each file through the nearest tsconfig.json (the
// project service). Relative imports name the `.ts` file Node runs (research.md R-02), never `.js`.
import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
  { ignores: ["gates/plants/**", "gates/test/fixtures/**", "packages/*/dist/**", ".stryker-tmp/**", "reports/**"] },
  {
    files: ["**/*.ts"],
    extends: [js.configs.recommended, tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
    languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } },
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^\\.{1,2}/.*\\.js$",
              message: "Import the .ts file: Node runs repository TypeScript from source (research.md R-02).",
            },
          ],
        },
      ],
    },
  },
]);
