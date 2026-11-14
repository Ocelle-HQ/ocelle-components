import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";
import type { BrowserCommand, BrowserCommandContext } from "vitest/node";

// The element tests' browser commands (005 research.md R-11; packages/elements/test/commands.ts), loaded when a command
// runs: the plant trees of the gates copy this file without the element test code (research.md R-10), so neither
// loading nor type-checking the configuration may depend on it.
interface ElementCommands {
  readonly axTree: (context: BrowserCommandContext, id: string, scope?: "element" | "subtree") => Promise<unknown>;
  readonly emulateForcedColors: (context: BrowserCommandContext, mode: "active" | "none", palette?: "light" | "dark") => Promise<void>;
}
// The live-region capture's commands (specs/010-feedback-forms contracts/testing.md § Live-region capture;
// packages/elements/test/live.ts), loaded as the element commands are, when a command runs.
interface LiveDelays {
  readonly loaded: number;
  readonly loading: number;
}
interface LiveCommands {
  readonly liveStart: (context: BrowserCommandContext, containerId: string, delays: LiveDelays) => Promise<void>;
  readonly liveStop: (context: BrowserCommandContext, options?: { readonly atLeast?: number }) => Promise<unknown>;
}
const elementCommandsUrl = new URL("./packages/elements/test/commands.ts", import.meta.url).href;
const elementCommands = async (): Promise<ElementCommands> => (await import(elementCommandsUrl)) as ElementCommands;
const axTree: BrowserCommand<[id: string, scope?: "element" | "subtree"]> = async (context, id, scope) => (await elementCommands()).axTree(context, id, scope);
const liveCommandsUrl = new URL("./packages/elements/test/live.ts", import.meta.url).href;
const liveCommands = async (): Promise<LiveCommands> => (await import(liveCommandsUrl)) as LiveCommands;
const liveStart: BrowserCommand<[containerId: string, delays: LiveDelays]> = async (context, containerId, delays) => {
  await (await liveCommands()).liveStart(context, containerId, delays);
};
const liveStop: BrowserCommand<[options?: { readonly atLeast?: number }]> = async (context, options) => (await liveCommands()).liveStop(context, options);
const emulateForcedColors: BrowserCommand<[mode: "active" | "none", palette?: "light" | "dark"]> = async (context, mode, palette) => {
  await (await elementCommands()).emulateForcedColors(context, mode, palette);
};

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
        // The in-process element tests (005 research.md R-11): browser mode, element source; mutated by
        // stryker.elements.config.json (R-12). The node, build and fixture tests run in their own projects below. The
        // axTree and emulateForcedColors commands read Chromium's accessibility tree over CDP and switch forced colours
        // for the shared scenario bodies (packages/elements/test/commands.ts). Each test file keeps its own iframe and
        // custom-element registry (isolate, the default). Its files run one at a time (specs/010-feedback-forms phase 2
        // stop 1, operator decision (b), reviews/phase-2/decision-stop-1.md): the in-process timing files (the notice
        // suites, the plants file, the capture and timing files) measure gaps in fractions of the test W = 100 ms, and
        // two pages of this project running at once overshot drive.after by more than 2W/3.
        test: {
          name: "elements",
          include: ["packages/elements/**/*.test.ts"],
          exclude: [...excluded, "packages/elements/test/node/**", "packages/elements/test/build/**", "packages/elements/test/browser/**"],
          fileParallelism: false,
          browser: {
            enabled: true,
            provider: playwright({ launchOptions }),
            headless: true,
            instances: [{ browser: "chromium" }],
            commands: { axTree, emulateForcedColors, liveStart, liveStop },
          },
        },
      },
      {
        // The element node unit tests (005 research.md R-11): the manifest generator and normaliser, the brand pairs,
        // the readme and the browser-build Vite config, in process. Mutated with the default configuration (R-12).
        test: {
          name: "elements-node",
          environment: "node",
          include: ["packages/elements/test/node/**/*.test.ts"],
          exclude: excluded,
        },
      },
      {
        // The element tests that start real tools (005 research.md R-11): tsc, vite build and pnpm pack. Not mutated
        // (vitest.mutation.config.ts). Its files run one at a time, so two package builds never write dist/ at once.
        test: {
          name: "elements-build",
          environment: "node",
          include: ["packages/elements/test/build/**/*.test.ts"],
          exclude: excluded,
          fileParallelism: false,
        },
      },
      {
        // The element fixture suites (005 research.md R-11): Node tests that drive Chromium through Playwright on the
        // strict-CSP fixture pages with the built browser build, which the global setup builds into a temporary
        // directory with the module-build bundles of US1 scenario 10. Not mutated (vitest.mutation.config.ts).
        test: {
          name: "elements-browser",
          environment: "node",
          include: ["packages/elements/test/browser/**/*.test.ts"],
          exclude: excluded,
          globalSetup: ["packages/elements/test/browser/global-setup.ts"],
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
