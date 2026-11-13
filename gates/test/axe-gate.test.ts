import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { axe, axeCore } from "../bin/axe.ts";
import type { AxeTools } from "../bin/axe.ts";

// The axe gate's exit 2 for "axe-core not found" (contracts/gates.md § `axe`; phase 4 review round 1, R1-02): when
// axe-core's script cannot be resolved, or axe-core itself cannot be loaded, from the gate repository, the gate exits 2
// with `axe: could not run: axe-core not found; run pnpm install` before it builds anything; when axe-core is found,
// it goes on to the build of the root. The module lookups and the build are injected; the root is a temporary
// directory holding an empty exceptions file.
const made: string[] = [];

afterEach(() => {
  for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true });
});

function root(): string {
  const dir = mkdtempSync(join(tmpdir(), "ocelle-axe-gate-"));
  made.push(dir);
  mkdirSync(join(dir, "storybook"));
  writeFileSync(join(dir, "storybook/a11y-exceptions.json"), "[]\n");
  return dir;
}

interface Asked {
  readonly resolved: string[];
  readonly loaded: string[];
  readonly builds: unknown[][];
}

function tools(options: { readonly resolve?: boolean; readonly load?: boolean } = {}): { readonly tools: AxeTools; readonly asked: Asked } {
  const asked: Asked = { resolved: [], loaded: [], builds: [] };
  return {
    asked,
    tools: {
      resolve: (id) => {
        asked.resolved.push(id);
        if (options.resolve === false) throw new Error(`Cannot find module '${id}'`);
        return "/gate/node_modules/axe-core/axe.min.js";
      },
      load: (id) => {
        asked.loaded.push(id);
        if (options.load === false) throw new Error(`Cannot find module '${id}'`);
        return { _audit: { rules: [{ id: "button-name", tags: ["wcag2a"], enabled: true }] } };
      },
      build: (buildRoot, env) => {
        asked.builds.push([buildRoot, env]);
        return Promise.resolve({ cause: "the planted build cause" });
      },
    },
  };
}

const notFound = { exit: 2, cause: "axe: could not run: axe-core not found; run pnpm install" };

describe("axe: axe-core not found (contracts/gates.md § axe)", () => {
  it("exits 2 naming axe-core when its script cannot be resolved, before any build", async () => {
    const { tools: given, asked } = tools({ resolve: false });
    const notes: string[] = [];
    expect(await axe(root(), {}, (line) => notes.push(line), given)).toEqual(notFound);
    expect({ resolved: asked.resolved, builds: asked.builds, notes }).toEqual({ resolved: ["axe-core/axe.min.js"], builds: [], notes: [] });
  });

  it("exits 2 naming axe-core when its script resolves but axe-core cannot be loaded, before any build", async () => {
    const { tools: given, asked } = tools({ load: false });
    expect(await axe(root(), {}, () => undefined, given)).toEqual(notFound);
    expect({ loaded: asked.loaded, builds: asked.builds }).toEqual({ loaded: ["axe-core"], builds: [] });
  });

  it("goes on to build the root with its environment when axe-core is found", async () => {
    const { tools: given, asked } = tools();
    const dir = root();
    const env = { OCELLE_CHROMIUM_PATH: "/nowhere/chrome" };
    expect(await axe(dir, env, () => undefined, given)).toEqual({ exit: 2, cause: "axe: could not run: the planted build cause" });
    expect(asked).toEqual({ resolved: ["axe-core/axe.min.js"], loaded: ["axe-core"], builds: [[dir, env]] });
  });
});

describe("axeCore: axe-core's script and rule options", () => {
  it("gives the resolved script and the FR-016 rule options of the loaded metadata", () => {
    const rules = [
      { id: "button-name", tags: ["wcag2a"], enabled: true },
      { id: "no-tag-off", tags: ["best-practice"], enabled: false },
      { id: "trial", tags: ["wcag2aa", "experimental"], enabled: true },
    ];
    const given: AxeTools = { resolve: () => "/gate/axe.min.js", load: () => ({ _audit: { rules } }), build: () => Promise.resolve({ cause: "unused" }) };
    expect(axeCore(given)).toEqual({ path: "/gate/axe.min.js", rules: { "button-name": { enabled: true }, "no-tag-off": { enabled: false }, trial: { enabled: false } } });
  });

  it("is undefined when axe-core's script cannot be resolved or axe-core cannot be loaded", () => {
    expect([axeCore(tools({ resolve: false }).tools), axeCore(tools({ load: false }).tools)]).toEqual([undefined, undefined]);
  });
});
