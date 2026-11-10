// The global setup of the elements-browser project (005 research.md R-11, T015): builds, into a per-run temporary
// directory and never into a package's dist/ (PLAN-FRESH-1-007), what the strict-CSP fixture pages load:
// - the browser build, with the package's own vite.browser.config.ts and only its output directory replaced:
//   `<dir>/dist/browser/ocelle-elements.js`;
// - for US1 scenario 10, two test-only bundles of the module build, each made the way a bundler host makes one: the
//   module build (`tsc -p packages/elements/tsconfig.json`, into `<dir>/host/module/`), and a host whose own
//   node_modules links `lit` to the package's dependency, bundled by Vite twice from two entries into
//   `<dir>/bundles/bundle-a.js` and `bundle-b.js`, each with its own copy of Lit (production build, the default
//   conditions). Each entry records the `OcelleIcon` class its copy of the module build exported on
//   `globalThis.ocelleBundles`, in load order, so the test can tell which class the registry kept.
// The directory, or the reason the builds failed, is provided to the tests, which report it: a failed build is a
// failing test of its own, and every page then lacks the scripts it loads.
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import type { TestProject } from "vitest/node";

/** What the global setup built: the directory, or the reason it could not build. */
export type Built = { readonly dir: string } | { readonly problem: string };

declare module "vitest" {
  export interface ProvidedContext {
    elementsFixture: Built;
  }
}

const elements = fileURLToPath(new URL("../..", import.meta.url));
const repo = fileURLToPath(new URL("../../../..", import.meta.url));

/** The browser build into `<dir>/dist`, with the package's configuration. */
async function browserBuild(dir: string): Promise<void> {
  await build({ configFile: join(elements, "vite.browser.config.ts"), root: elements, logLevel: "error", build: { outDir: join(dir, "dist") } });
}

/** The module build into `<dir>/host/module` and two host bundles of it into `<dir>/bundles`. */
async function moduleBundles(dir: string): Promise<void> {
  const host = join(dir, "host");
  const tsc = join(repo, "node_modules", "typescript", "bin", "tsc");
  const args = [tsc, "-p", join(elements, "tsconfig.json"), "--outDir", join(host, "module"), "--declaration", "false", "--sourceMap", "false"];
  const ran = spawnSync(process.execPath, args, { cwd: elements, encoding: "utf8" });
  if (ran.status !== 0) throw new Error(`tsc exited ${String(ran.status)}: ${ran.stdout}${ran.stderr}`);
  mkdirSync(join(host, "node_modules"), { recursive: true });
  symlinkSync(realpathSync(join(elements, "node_modules", "lit")), join(host, "node_modules", "lit"), "dir");
  for (const name of ["a", "b"]) {
    const entry = join(host, `entry-${name}.js`);
    writeFileSync(entry, 'import { OcelleIcon } from "./module/index.js";\n(globalThis.ocelleBundles ??= []).push(OcelleIcon);\n');
    await build({
      configFile: false,
      root: host,
      logLevel: "error",
      build: { outDir: join(dir, "bundles"), emptyOutDir: false, minify: false, lib: { entry, formats: ["es"], fileName: () => `bundle-${name}.js` } },
    });
  }
}

export default async function setup(project: TestProject): Promise<() => void> {
  const dir = mkdtempSync(join(tmpdir(), "ocelle-elements-fixture-"));
  try {
    await browserBuild(dir);
    await moduleBundles(dir);
    project.provide("elementsFixture", { dir });
  } catch (error) {
    project.provide("elementsFixture", { problem: error instanceof Error ? error.message : String(error) });
  }
  return () => {
    rmSync(dir, { recursive: true, force: true });
  };
}
