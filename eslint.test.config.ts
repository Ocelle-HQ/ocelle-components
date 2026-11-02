// Test lint (FR-010, research.md R-06): all test code of FR-028 (test files, files under a `test` directory, stories),
// without the plants, the gate-test fixtures and built output. The @vitest/eslint-plugin rules reject tests without
// an assertion, skipped and focused tests, assertions inside conditionals or outside a test, and assertions that are
// not awaited or completed; the local rule ocelle/no-snapshot-only rejects a test whose only assertions are
// snapshots. None needs type information, so the parser runs without the project service.
import vitest from "@vitest/eslint-plugin";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import { plugin as ocelle } from "./gates/eslint/no-snapshot-only.ts";

export default defineConfig([
  { ignores: ["gates/plants/**", "gates/test/fixtures/**", "packages/*/dist/**"] },
  {
    files: ["**/*.test.ts", "**/*.spec.ts", "**/test/**/*.ts", "**/*.stories.ts"],
    languageOptions: { parser: tseslint.parser },
    plugins: { vitest, ocelle },
    rules: {
      "vitest/expect-expect": "error",
      "vitest/no-disabled-tests": "error",
      "vitest/no-focused-tests": "error",
      "vitest/no-conditional-expect": "error",
      "vitest/no-standalone-expect": "error",
      "vitest/valid-expect": ["error", { alwaysAwait: true }],
      "vitest/valid-expect-in-promise": "error",
      "ocelle/no-snapshot-only": "error",
    },
  },
]);
