import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

// Plants and gate-test fixtures are inputs of the gates and their tests, never tests of this repository
// (FR-028, research.md R-10): every project excludes them.
const excluded = ["**/node_modules/**", "**/dist/**", "gates/plants/**", "gates/test/fixtures/**"];

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "tokens",
          environment: "node",
          include: ["packages/tokens/**/*.test.ts"],
          exclude: excluded,
        },
      },
      {
        test: {
          name: "styles",
          environment: "node",
          include: ["packages/styles/**/*.test.ts"],
          exclude: excluded,
        },
      },
      {
        test: {
          name: "elements",
          include: ["packages/elements/**/*.test.ts"],
          exclude: excluded,
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: "chromium" }],
          },
        },
      },
      {
        test: {
          name: "gates",
          environment: "node",
          include: ["gates/**/*.test.ts"],
          exclude: [...excluded, "gates/test/integration/**"],
        },
      },
      {
        test: {
          name: "gates-integration",
          environment: "node",
          include: ["gates/test/integration/**/*.test.ts"],
          exclude: excluded,
        },
      },
    ],
  },
});
