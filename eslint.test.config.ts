// Test lint (FR-010, research.md R-06): all test code of FR-028 (test files, files under a `test` directory, stories),
// without the plants, the gate-test fixtures, built output and Stryker's sandbox copies under .stryker-tmp/ (tasks.md
// T092). The @vitest/eslint-plugin rules reject tests without an assertion, skipped and focused tests, assertions
// inside conditionals or outside a test, and assertions that are not awaited or completed. The local plugin ocelle
// (gates/eslint/) rejects a test whose only assertions are snapshots (no-snapshot-only) and assertions nothing
// checks: in a promise callback that is neither awaited nor returned (no-floating-promise-expect), in a timer
// callback (no-timer-expect), or inside a try whose catch neither rethrows nor asserts (no-swallowed-expect). None
// needs type information, so the parser runs without the project service.
import vitest from "@vitest/eslint-plugin";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import { plugin as snapshotOnly } from "./gates/eslint/no-snapshot-only.ts";
import { plugin as uncheckedExpect } from "./gates/eslint/unchecked-expect.ts";

const ocelle = { rules: { ...snapshotOnly.rules, ...uncheckedExpect.rules } };

export default defineConfig([
  { ignores: ["gates/plants/**", "gates/test/fixtures/**", "packages/*/dist/**", ".stryker-tmp/**"] },
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
      "ocelle/no-floating-promise-expect": "error",
      "ocelle/no-timer-expect": "error",
      "ocelle/no-swallowed-expect": "error",
    },
  },
]);
