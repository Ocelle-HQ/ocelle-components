import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";
import type { BrowserCommand, BrowserCommandContext } from "vitest/node";

// The element tests' browser commands (005 research.md R-11; packages/elements/test/commands.ts), loaded when a command
// runs: the plant trees of the gates copy this file without the element test code (research.md R-10), so neither
// loading nor type-checking the configuration may depend on it.
// Since 014 (research.md R-07, R-11): axStates, axUpdatesStart and axUpdatesStop, whose target is an id or a child of a
// parent with an id.
type Target = string | { readonly parent: string; readonly kind: string; readonly index: number };
// 012 (research.md R-11) adds press, hover, pointer, emulateReducedMotion, axe and axState; their argument types are
// written here, not imported, for the same reason.
type Modifier = "Alt" | "Control" | "Meta" | "Shift";
interface ClickOptions {
  readonly inner?: string;
  readonly modifiers?: readonly Modifier[];
  readonly button?: "left" | "middle" | "right";
}
type PointerAction = "hover" | "click" | "down" | "up";
interface PathStep {
  readonly x: number;
  readonly y: number;
  readonly down?: boolean;
  readonly up?: boolean;
  readonly button?: "left" | "right" | "middle";
}
type ElementTarget = string | { readonly id: string; readonly inner: string };
interface ElementCommands {
  readonly axTree: (context: BrowserCommandContext, id: string, scope?: "element" | "subtree") => Promise<unknown>;
  readonly emulateForcedColors: (context: BrowserCommandContext, mode: "active" | "none", palette?: "light" | "dark") => Promise<void>;
  readonly scrollWidth: (context: BrowserCommandContext) => Promise<unknown>;
  readonly activeElement: (context: BrowserCommandContext) => Promise<unknown>;
  readonly textBoxes: (context: BrowserCommandContext, id: string) => Promise<unknown>;
  readonly emulateReducedMotion: (context: BrowserCommandContext, mode: "reduce" | "no-preference") => Promise<void>;
  readonly pressKey: (context: BrowserCommandContext, key: string, modifiers?: readonly Modifier[]) => Promise<void>;
  readonly hover: (context: BrowserCommandContext, id: string, inner?: string) => Promise<void>;
  readonly pointerCommand: (context: BrowserCommandContext, action: PointerAction, id: string, options?: ClickOptions) => Promise<void>;
  readonly axState: (context: BrowserCommandContext, id: string, inner?: string) => Promise<unknown>;
  readonly axe: (context: BrowserCommandContext, scope?: string) => Promise<unknown>;
  readonly pointerPath: (context: BrowserCommandContext, steps: readonly PathStep[]) => Promise<void>;
  readonly touchTap: (context: BrowserCommandContext, x: number, y: number) => Promise<void>;
  readonly animationStates: (context: BrowserCommandContext, id: string) => Promise<unknown>;
  readonly seek: (context: BrowserCommandContext, id: string, inner: string | null, ms: number) => Promise<void>;
  readonly settleLayout: (context: BrowserCommandContext) => Promise<unknown>;
  readonly overflows: (context: BrowserCommandContext, target: ElementTarget) => Promise<unknown>;
  readonly axStates: (context: BrowserCommandContext, target: Target, scope?: "element" | "subtree") => Promise<unknown>;
  readonly axUpdatesStart: (context: BrowserCommandContext, target: Target) => Promise<void>;
  readonly axUpdatesStop: (context: BrowserCommandContext) => Promise<unknown>;
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
const axStates: BrowserCommand<[target: Target, scope?: "element" | "subtree"]> = async (context, target, scope) => (await elementCommands()).axStates(context, target, scope);
const axUpdatesStart: BrowserCommand<[target: Target]> = async (context, target) => {
  await (await elementCommands()).axUpdatesStart(context, target);
};
const axUpdatesStop: BrowserCommand = async (context) => (await elementCommands()).axUpdatesStop(context);

// The document readers of 011 research.md R-13: the scroll width, the deep active element and the text boxes.
const scrollWidth: BrowserCommand = async (context) => (await elementCommands()).scrollWidth(context);
const activeElement: BrowserCommand = async (context) => (await elementCommands()).activeElement(context);
const textBoxes: BrowserCommand<[id: string]> = async (context, id) => (await elementCommands()).textBoxes(context, id);
// 013 phase 3 (research.md R-08, contracts/checks.md § Driver additions): reduced motion through the same
// `page.emulateMedia` helper as forced colours, so neither clears the other; 009's overflow-region scenarios
// (research.md R-17) use it too.
const emulateReducedMotion: BrowserCommand<[mode: "reduce" | "no-preference"]> = async (context, mode) => {
  await (await elementCommands()).emulateReducedMotion(context, mode);
};
const press: BrowserCommand<[key: string, modifiers?: readonly Modifier[]]> = async (context, key, modifiers) => {
  await (await elementCommands()).pressKey(context, key, modifiers);
};
const hover: BrowserCommand<[id: string, inner?: string]> = async (context, id, inner) => {
  await (await elementCommands()).hover(context, id, inner);
};
const pointer: BrowserCommand<[action: PointerAction, id: string, options?: ClickOptions]> = async (context, action, id, options) => {
  await (await elementCommands()).pointerCommand(context, action, id, options);
};
const axState: BrowserCommand<[id: string, inner?: string]> = async (context, id, inner) => (await elementCommands()).axState(context, id, inner);
const axe: BrowserCommand<[scope?: string]> = async (context, scope) => (await elementCommands()).axe(context, scope);
// 008 research.md R-14: real pointer paths and touch taps for the overlay scenarios.
const pointerPath: BrowserCommand<[steps: readonly PathStep[]]> = async (context, steps) => {
  await (await elementCommands()).pointerPath(context, steps);
};
const touchTap: BrowserCommand<[x: number, y: number]> = async (context, x, y) => {
  await (await elementCommands()).touchTap(context, x, y);
};
// 018 (research.md R-11; contracts/checks.md § Test harness rows 1, 2, 7 and 8): the animation record with identity and
// iteration count, seeking an animation, the page-wide layout settle and the fractional overflow measure.
const animationStates: BrowserCommand<[id: string]> = async (context, id) => (await elementCommands()).animationStates(context, id);
const seek: BrowserCommand<[id: string, inner: string | null, ms: number]> = async (context, id, inner, ms) => {
  await (await elementCommands()).seek(context, id, inner, ms);
};
const settleLayout: BrowserCommand = async (context) => (await elementCommands()).settleLayout(context);
const overflows: BrowserCommand<[target: ElementTarget]> = async (context, target) => (await elementCommands()).overflows(context, target);
const elementBrowserCommands = { axTree, emulateForcedColors, scrollWidth, activeElement, textBoxes, emulateReducedMotion, press, hover, pointer, axState, axe, pointerPath, touchTap, liveStart, liveStop, axStates, axUpdatesStart, axUpdatesStop, animationStates, seek, settleLayout, overflows };

// The element browser projects run at the fixture's 1280 × 800 (008 research.md R-14), the default one as a mouse
// device and elements-touch as a touch device (`hasTouch`); both exclude the node, build and fixture suites.
const elementViewport = { width: 1280, height: 800 };

// The Chromium arguments the elements-browser-file tests launch with (014 research.md R-09): a file: document may load
// module scripts from file: URLs.
declare module "vitest" {
  export interface ProvidedContext {
    chromiumArgs: string[];
  }
}

// Plants and gate-test fixtures are inputs of the gates and their tests, never tests of this repository
// (FR-028, research.md R-10): every project excludes them.
const excluded = ["**/node_modules/**", "**/dist/**", "gates/plants/**", "gates/test/fixtures/**"];
// Since 014 (research.md R-09) the file: suite runs in elements-browser-file only.
const elementExcluded = [...excluded, "packages/elements/test/node/**", "packages/elements/test/build/**", "packages/elements/test/browser/**", "packages/elements/test/browser-file/**"];

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
        // axTree, emulateForcedColors and emulateReducedMotion commands read Chromium's accessibility tree over CDP and
        // switch forced colours and reduced motion for the shared scenario bodies (packages/elements/test/commands.ts);
        // 012's press, hover, pointer, axe and axState drive the keyboard and mouse, read one accessibility node and run
        // axe (012 research.md R-11). Each test file keeps its own iframe and custom-element registry (isolate, the
        // default). Its files run one at a time (specs/010-feedback-forms phase 2 stop 1, operator decision (b),
        // reviews/phase-2/decision-stop-1.md):
        // the in-process timing files (the notice suites, the plants file, the capture and timing files) measure gaps
        // in fractions of the test W = 100 ms, and two pages of this project running at once overshot drive.after by
        // more than 2W/3. 008 (R-14): a 1280 × 800 viewport, as on the fixture, a mouse device; the touch rows
        // (`test/*.touch.test.ts`) run in elements-touch instead; the commands also drive the real pointer.
        // Lit's directives the elements import, bundled before the run, so Vite does not find them during a test file
        // and reload it (specs/010-feedback-forms phase 3: ocelle-form-input imports class-map and live; 013:
        // ocelle-facts imports if-defined).
        optimizeDeps: { include: ["lit/directives/class-map.js", "lit/directives/if-defined.js", "lit/directives/live.js"] },
        test: {
          name: "elements",
          include: ["packages/elements/**/*.test.ts"],
          exclude: [...elementExcluded, "packages/elements/test/*.touch.test.ts"],
          fileParallelism: false,
          browser: {
            enabled: true,
            provider: playwright({ launchOptions }),
            headless: true,
            viewport: elementViewport,
            instances: [{ browser: "chromium" }],
            commands: elementBrowserCommands,
          },
        },
      },
      {
        // The in-process touch rows (008 research.md R-14): the same browser mode at 1280 × 800 in a context with
        // `hasTouch`, for `test/*.touch.test.ts` only, with the elements project's excludes, so the fixture's touch
        // files stay in elements-browser. Mutated with the elements project (vitest.mutation.elements.config.ts).
        test: {
          name: "elements-touch",
          include: ["packages/elements/test/*.touch.test.ts"],
          exclude: elementExcluded,
          browser: {
            enabled: true,
            provider: playwright({ launchOptions, contextOptions: { hasTouch: true } }),
            headless: true,
            viewport: elementViewport,
            instances: [{ browser: "chromium" }],
            commands: elementBrowserCommands,
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
        // The element file: suite (014 research.md R-09, PLAN-CORRECTNESS-1-013): User Story 5 scenario 12, a node test
        // that launches Chromium itself with `--allow-file-access-from-files` (provided here) on a file: copy of the
        // link fixture whose policy is a <meta> element. Not mutated (vitest.mutation.config.ts).
        test: {
          name: "elements-browser-file",
          environment: "node",
          include: ["packages/elements/test/browser-file/**/*.test.ts"],
          exclude: excluded,
          provide: { chromiumArgs: ["--allow-file-access-from-files"] },
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
          exclude: [...excluded, "storybook/test/unit/browser/**"],
        },
      },
      {
        // The shared recipe hosts exercise the real DOM in process, so Stryker can capture their coverage.
        test: {
          name: "storybook-browser",
          include: ["storybook/test/unit/browser/**/*.test.ts"],
          exclude: excluded,
          browser: {
            enabled: true,
            provider: playwright({ launchOptions }),
            headless: true,
            viewport: elementViewport,
            instances: [{ browser: "chromium" }],
          },
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
