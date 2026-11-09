import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

// Plants and gate-test fixtures are inputs of the gates and their tests, never tests of this repository
// (FR-028, research.md R-10): every project excludes them.
const excluded = ["**/node_modules/**", "**/dist/**", "gates/plants/**", "gates/test/fixtures/**"];

// Optional, environment-only Chromium override (research.md R-03, operator decision 2026-11-02): when
// OCELLE_CHROMIUM_PATH is set and non-empty, the elements project launches that executable; otherwise Playwright's own.
const chromiumPath = process.env.OCELLE_CHROMIUM_PATH;
const launchOptions = chromiumPath ? { executablePath: chromiumPath } : {};

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "tokens",
          environment: "node",
          include: ["packages/tokens/**/*.test.ts"],
          exclude: [...excluded, "packages/tokens/test/browser/**"],
        },
      },
      {
        // The token browser suites (research.md R-03): Node tests that drive Chromium through Playwright and serve
        // what the generator produces in each suite's beforeAll. Not mutated (vitest.mutation.config.ts).
        test: {
          name: "tokens-browser",
          environment: "node",
          include: ["packages/tokens/test/browser/**/*.test.ts"],
          exclude: excluded,
        },
      },
      {
        test: {
          name: "styles",
          environment: "node",
          include: ["packages/styles/**/*.test.ts"],
          exclude: [...excluded, "packages/styles/test/browser/**"],
        },
      },
      {
        // The base-style browser suites (003 research.md R-09): Node tests that drive Chromium through Playwright and
        // serve base.css, tokens.css and the fixture pages under the strict CSP. Not mutated (vitest.mutation.config.ts).
        test: {
          name: "styles-browser",
          environment: "node",
          include: ["packages/styles/test/browser/**/*.test.ts"],
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
            provider: playwright({ launchOptions }),
            headless: true,
            instances: [{ browser: "chromium" }],
          },
        },
      },
      {
        // The Storybook unit tests (002 research.md R-10): the scripts, the configuration and the stories' render code
        // in node, with no build; these kill the mutants of storybook/scripts/**, storybook/.storybook/** and
        // storybook/stories/** (not the story files).
        test: {
          name: "storybook",
          environment: "node",
          include: ["storybook/test/unit/**/*.test.ts"],
          exclude: excluded,
        },
      },
      {
        // The Storybook run-time test (002 research.md R-10): its global setup builds the Storybook into a per-run
        // temporary directory under a no-network preload; the test serves it under the Storybook page's CSP header
        // and drives Chromium through Playwright. Not mutated (vitest.mutation.config.ts).
        test: {
          name: "storybook-integration",
          environment: "node",
          include: ["storybook/test/integration/**/*.test.ts"],
          exclude: excluded,
          globalSetup: ["storybook/test/integration/setup.ts"],
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
