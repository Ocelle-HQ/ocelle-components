// Inputs that identify an isolated phase replay and its browser runtime.
import type { StoryScope } from "./story-selection.ts";
import { storyEvidenceKey } from "./test-evidence.ts";
import type { Assertion, StoryEvidenceInput } from "./test-evidence.ts";

interface BrowserFile {
  readonly path: string;
  readonly size: number;
  readonly modified: number;
  readonly version: string;
}

export interface BrowserIdentity {
  readonly browser: BrowserFile;
  readonly headless?: BrowserFile;
}

export interface BrowserProbe {
  bundledChromium(): string;
  file(path: string): Omit<BrowserFile, "version"> & { readonly regular: boolean };
  version(path: string): string;
}

export interface StoryCacheCheck {
  readonly mode: StoryScope["mode"];
  readonly revision: string;
  readonly overlay?: string | undefined;
  readonly expected: readonly Assertion[];
  readonly missingModules: readonly string[];
  readonly selection: Pick<StoryScope, "changed" | "deleted" | "extra"> & {
    readonly changedLines: StoryEvidenceInput["changedLines"];
  };
}

export interface StoryCacheRuntime {
  readonly browser: BrowserIdentity | null;
  readonly environment: NodeJS.ProcessEnv;
  readonly node: string;
  readonly platform: string;
  readonly architecture: string;
  readonly pnpm: string;
  tree(revision: string): string;
  blob(revision: string, file: string): string;
  runnerFile(path: string): string;
}

function inspectBrowser(path: string, probe: BrowserProbe): BrowserFile | null {
  const { path: resolved, size, modified, regular } = probe.file(path);
  if (!regular || !Number.isFinite(size) || size <= 0 || !Number.isFinite(modified)) return null;
  const version = probe.version(resolved).trim();
  if (version === "") return null;
  return { path: resolved, size, modified, version };
}

export function browserIdentity(override: string | undefined, probe: BrowserProbe): BrowserIdentity | null {
  try {
    if (override !== undefined && override !== "") {
      const browser = inspectBrowser(override, probe);
      return browser === null ? null : { browser };
    }
    const bundled = probe.bundledChromium();
    const headlessPath = bundled.replace(
      /chromium-(\d+)\/chrome-linux64\/chrome$/,
      "chromium_headless_shell-$1/chrome-headless-shell-linux64/chrome-headless-shell",
    );
    if (headlessPath === bundled) return null;
    const browser = inspectBrowser(bundled, probe);
    const headless = inspectBrowser(headlessPath, probe);
    if (browser === null || headless === null || browser.path === headless.path) return null;
    return { browser, headless };
  } catch {
    // The clean worktree can still run a fresh proof. The current checkout does not establish a reusable browser identity.
    return null;
  }
}

const runnerPaths = [
  "gates/bin/story-evidence.ts",
  "gates/lib/story-cache.ts",
  "gates/lib/test-evidence.ts",
  "gates/lib/story-selection.ts",
  "gates/lib/vitest-run.ts",
  "gates/lib/spawn.ts",
  ".specify/extensions/story/story-config.yml",
  ".specify/extensions/story/scripts/common.sh",
  ".specify/extensions/story/scripts/red.sh",
  ".specify/extensions/story/scripts/tdd-check.sh",
];

const environmentNames = ["OCELLE_CHROMIUM_PATH", "PLAYWRIGHT_BROWSERS_PATH", "NODE_OPTIONS", "TZ", "LANG", "LC_ALL"];

export function checkKey(check: StoryCacheCheck, setup: string, runtime: StoryCacheRuntime): { key: string; reusable: boolean } {
  const overlayRevision = check.overlay;
  const overlay = overlayRevision === undefined ? null : check.selection.changed.map((file) => [file, runtime.blob(overlayRevision, file)]);
  const key = storyEvidenceKey({
    mode: check.mode,
    // Tree identity includes the committed lockfile, project setup and Vitest configuration without binding history traversal to a SHA.
    testedTree: runtime.tree(check.revision),
    overlay,
    selection: check.selection,
    expected: check.expected,
    missingModules: check.missingModules,
    setup,
    node: runtime.node,
    platform: runtime.platform,
    architecture: runtime.architecture,
    pnpm: runtime.pnpm,
    browser: runtime.browser,
    environment: environmentNames.map((name) => [name, runtime.environment[name] ?? ""]),
    runner: runnerPaths.map((path) => [path, runtime.runnerFile(path)]),
  });
  return { key, reusable: runtime.browser !== null && runtime.pnpm !== "" };
}
