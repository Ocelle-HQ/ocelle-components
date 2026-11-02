import { readdirSync, readFileSync } from "node:fs";
import { createServer } from "node:net";
import type { Server } from "node:net";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { baseEnv, cleanUp, runGate, tempDir, workspace } from "./workspace.ts";

// `gates/bin/setup-offline.ts --root <tmp>` on temporary workspaces built from gates/test/fixtures/setup-offline/,
// with an empty temporary store and cache and the registry pointed at a local TCP socket that counts connections,
// so "never falls back to the network" is observable (FR-008, research.md R-04).
const timeout = 120_000;

let server: Server;
let connections = 0;
let registry = "";

beforeEach(async () => {
  connections = 0;
  server = createServer((socket) => {
    connections += 1;
    socket.destroy();
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  registry = typeof address === "object" && address !== null ? `http://127.0.0.1:${String(address.port)}/` : "";
});

afterEach(async () => {
  await new Promise<void>((resolve) => server.close(() => { resolve(); }));
  cleanUp();
});

function offlineEnv(): Record<string, string> {
  return {
    ...baseEnv(),
    pnpm_config_store_dir: tempDir("store"),
    pnpm_config_cache_dir: tempDir("cache"),
    pnpm_config_registry: registry,
  };
}

function setupOffline(root: string, env: Record<string, string>): ReturnType<typeof runGate> {
  return runGate("gates/bin/setup-offline.ts", ["--root", root], { cwd: tempDir("cwd"), env });
}

describe("offline setup (gates/bin/setup-offline.ts)", () => {
  it(
    "exits 2 naming the missing package and pnpm run setup:online on an empty store, without the network",
    async () => {
      const root = workspace("setup-offline/with-dependency", [], false);
      const ran = await setupOffline(root, offlineEnv());
      expect(ran.code).toBe(2);
      expect(ran.stderr).toHaveLength(1);
      expect(ran.stderr[0]).toContain("missing: is-number");
      expect(ran.stderr[0]).toContain("pnpm run setup:online");
      expect(connections).toBe(0);
    },
    timeout,
  );

  it(
    "exits 2 naming Chromium and pnpm run setup:online on an empty browser path, without the network",
    async () => {
      const root = workspace("setup-offline/no-dependencies", [], false);
      const env: Record<string, string> = { ...offlineEnv(), PLAYWRIGHT_BROWSERS_PATH: tempDir("browsers") };
      delete env["OCELLE_CHROMIUM_PATH"];
      const ran = await setupOffline(root, env);
      expect(ran.code).toBe(2);
      expect(ran.stderr).toHaveLength(1);
      expect(ran.stderr[0]).toContain("Chromium");
      expect(ran.stderr[0]).toContain("pnpm run setup:online");
      expect(connections).toBe(0);
    },
    timeout,
  );

  it(
    "exits 0 with a lockfile without dependencies and the installed browser, changing no workspace file",
    async () => {
      const root = workspace("setup-offline/no-dependencies", [], false);
      const before = {
        files: readdirSync(root).sort(),
        manifest: readFileSync(join(root, "package.json"), "utf8"),
        lockfile: readFileSync(join(root, "pnpm-lock.yaml"), "utf8"),
      };
      const ran = await setupOffline(root, offlineEnv());
      expect(ran.code).toBe(0);
      expect(ran.stdout).toHaveLength(1);
      expect(ran.stdout[0]).toContain("installed offline");
      expect({
        files: readdirSync(root).filter((f) => f !== "node_modules").sort(),
        manifest: readFileSync(join(root, "package.json"), "utf8"),
        lockfile: readFileSync(join(root, "pnpm-lock.yaml"), "utf8"),
      }).toEqual(before);
      expect(connections).toBe(0);
    },
    timeout,
  );
});
