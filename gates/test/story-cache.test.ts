import { describe, expect, it } from "vitest";
import { browserIdentity, checkKey } from "../lib/story-cache.ts";
import type { BrowserIdentity, BrowserProbe, StoryCacheCheck, StoryCacheRuntime } from "../lib/story-cache.ts";

const bundled = "/browser-cache/chromium-1248/chrome-linux64/chrome";
const headless = "/browser-cache/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell";
const provided = "/browser-pin/chromium";
const browser = { path: bundled, size: 500, modified: 10, version: "Chromium 156" };
const shell = { path: headless, size: 440, modified: 30, version: "Chromium Headless 156" };
const override = { path: "/resolved/chromium", size: 600, modified: 70, version: "Chromium 155" };

function probe(details: Partial<BrowserProbe> = {}): BrowserProbe {
  return {
    bundledChromium: () => bundled,
    file: (path) => {
      if (path === bundled) return { ...browser, regular: true };
      if (path === headless) return { ...shell, regular: true };
      return { ...override, regular: true };
    },
    version: (path) => path === bundled ? ` ${browser.version}\n` : path === headless ? shell.version : override.version,
    ...details,
  };
}

describe("browser cache identity", () => {
  it.each([undefined, ""])("identifies both bundled binaries with override %s", (value) => {
    expect(browserIdentity(value, probe())).toEqual({ browser, headless: shell });
  });

  it("uses only the explicit override and fingerprints the resolved executable", () => {
    const onlyOverride = probe({
      bundledChromium: () => {
        throw new Error("bundle lookup should not run for an explicit override");
      },
      version: (path) => path === override.path ? override.version : "",
    });
    expect(browserIdentity(provided, onlyOverride)).toEqual({ browser: override });
  });

  it("refuses identity when bundled Chromium has no recognized headless path", () => {
    expect(browserIdentity(undefined, probe({ bundledChromium: () => "/browser-cache/Chromium.app/Chromium" }))).toBeNull();
  });

  it("refuses identity when the resolved headless path is an alias for full Chromium", () => {
    const alias = probe({ file: () => ({ ...browser, regular: true }) });
    expect(browserIdentity(undefined, alias)).toBeNull();
  });

  it("refuses identity when the browser discovery throws", () => {
    const absent = probe({
      bundledChromium: () => {
        throw new Error("bundle lookup unavailable");
      },
    });
    expect(browserIdentity(undefined, absent)).toBeNull();
  });

  it.each([bundled, headless])("refuses the default identity when %s cannot be inspected", (unavailable) => {
    const files = probe();
    const absent = probe({
      file: (path) => {
        if (path === unavailable) throw new Error("binary unavailable");
        return files.file(path);
      },
    });
    expect(browserIdentity(undefined, absent)).toBeNull();
  });

  it("does not substitute a bundled browser when the configured override fails to start", () => {
    const failed = probe({
      version: (path) => {
        if (path === override.path) throw new Error("binary unavailable");
        return browser.version;
      },
    });
    expect(browserIdentity(provided, failed)).toBeNull();
  });

  it("refuses a blank version for either bundled executable", () => {
    expect(browserIdentity(undefined, probe({ version: (path) => path === headless ? "  \n" : browser.version }))).toBeNull();
    expect(browserIdentity(undefined, probe({ version: (path) => path === bundled ? "  \n" : shell.version }))).toBeNull();
  });

  it.each([
    { regular: false },
    { size: 0 },
    { size: -1 },
    { size: Number.NaN },
    { modified: Number.NaN },
  ])("refuses the explicit executable when its metadata is invalid: %j", (invalid) => {
    expect(browserIdentity(provided, probe({ file: () => ({ ...override, regular: true, ...invalid }) }))).toBeNull();
  });
});

const selection = { changed: ["test/answer.test.ts", "test/helper.ts"], deleted: [], extra: [], changedLines: {} };
const phase = {
  mode: "base" as const,
  revision: "phase-base",
  overlay: "phase-test-overlay",
  expected: [],
  missingModules: [],
  selection,
};
const runtime: StoryCacheRuntime = {
  browser: { browser, headless: shell },
  environment: {},
  node: "v26.13.0",
  platform: "linux",
  architecture: "x64",
  pnpm: "12.16.1",
  tree: () => "tree-111",
  blob: (_revision, path) => `test content for ${path}`,
  runnerFile: (path) => `file content for ${path}`,
};
const setup = "pnpm run setup:offline";
const initial = () => checkKey(phase, setup, runtime);

describe("phase cache key", () => {
  it("reuses identical source trees and overlay blobs after a history fold", () => {
    const folded = { ...phase, revision: "new-base-sha", overlay: "new-overlay-sha" };
    const before = initial();
    expect(before).toMatchObject({ key: /^[a-f0-9]{64}$/, reusable: true });
    expect(checkKey(folded, setup, runtime)).toEqual(before);
  });

  it("fingerprints the tested Git tree, which includes the committed lockfile and Vitest config", () => {
    const changed = {
      ...runtime,
      tree: (revision: string) => revision === phase.revision ? "new-tree-with-lockfile-or-config" : runtime.tree(revision),
    };
    expect(checkKey(phase, setup, changed).key).not.toBe(initial().key);
  });

  it("reads overlay blobs from the declared commit and includes test support as well as runnable tests", () => {
    for (const file of selection.changed) {
      const changed: StoryCacheRuntime = {
        ...runtime,
        blob: (revision, path) => revision === phase.overlay && path === file ? "updated blob" : runtime.blob(revision, path),
      };
      expect(checkKey(phase, setup, changed).key).not.toBe(initial().key);
    }
  });

  it("does not look up overlay blobs for a check without an overlay", () => {
    const noOverlay: StoryCacheCheck = { ...phase, overlay: undefined };
    const noLookup: StoryCacheRuntime = {
      ...runtime,
      blob: () => {
        throw new Error("a HEAD key must not read an overlay blob");
      },
    };
    const outcome = checkKey(noOverlay, setup, noLookup);
    expect(outcome.reusable).toBe(true);
    expect(outcome.key).not.toBe(initial().key);
  });

  it.each([
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
  ])("invalidates replay when active runner input %s changes", (changed) => {
    const runtimeChanged: StoryCacheRuntime = {
      ...runtime,
      runnerFile: (path) => path === changed ? "edited runner input" : runtime.runnerFile(path),
    };
    expect(checkKey(phase, setup, runtimeChanged).key).not.toBe(initial().key);
  });

  it.each(["OCELLE_CHROMIUM_PATH", "PLAYWRIGHT_BROWSERS_PATH", "NODE_OPTIONS", "TZ", "LANG", "LC_ALL"])(
    "invalidates replay when environment variable %s changes",
    (name) => {
      const environment = { [name]: "different" };
      expect(checkKey(phase, setup, { ...runtime, environment }).key).not.toBe(initial().key);
    },
  );

  it("treats unset and empty environment settings alike", () => {
    const environment = { PLAYWRIGHT_BROWSERS_PATH: "" };
    expect(checkKey(phase, setup, { ...runtime, environment })).toEqual(initial());
  });

  it.each<BrowserIdentity>([
    { browser: { ...browser, version: "Chromium 157" }, headless: shell },
    { browser: { ...browser, modified: browser.modified + 1 }, headless: shell },
    { browser: { ...browser, size: browser.size + 1 }, headless: shell },
    { browser, headless: { ...shell, version: "Headless 157" } },
    { browser, headless: { ...shell, path: "/different/shell" } },
  ])("invalidates replay when the observed browser identity changes: %j", (identity) => {
    expect(checkKey(phase, setup, { ...runtime, browser: identity }).key).not.toBe(initial().key);
  });

  it.each([
    { node: "v26.14.0" },
    { platform: "darwin" },
    { architecture: "arm64" },
    { pnpm: "12.16.2" },
  ])("invalidates replay when the observed toolchain changes: %j", (changed) => {
    expect(checkKey(phase, setup, { ...runtime, ...changed }).key).not.toBe(initial().key);
  });

  it("invalidates setup, selection, expected assertions, missing modules and mode independently", () => {
    const before = initial();
    expect(checkKey(phase, setup + " --silent", runtime).key).not.toBe(before.key);
    for (const change of [
      { mode: "fix" as const },
      { selection: { ...selection, extra: ["another.test.ts"] } },
      { expected: [{ file: "test/answer.test.ts", project: "gates", test: "submits the answer" }] },
      { missingModules: ["new-element.ts"] },
    ]) {
      expect(checkKey({ ...phase, ...change }, setup, runtime).key).not.toBe(before.key);
    }
  });

  it("still labels a fresh proof without making unverifiable evidence reusable", () => {
    const missingBrowser = checkKey(phase, setup, { ...runtime, browser: null });
    const missingPnpmVersion = checkKey(phase, setup, { ...runtime, pnpm: "" });
    expect([missingBrowser.reusable, missingPnpmVersion.reusable]).toEqual([false, false]);
    expect(missingBrowser.key).toMatch(/^[a-f0-9]{64}$/);
    expect(missingPnpmVersion.key).toMatch(/^[a-f0-9]{64}$/);
    expect(missingBrowser.key).not.toBe(initial().key);
    expect(missingPnpmVersion.key).not.toBe(initial().key);
  });
});
