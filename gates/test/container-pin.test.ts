// The pin test (contracts/container.md § The pin test): storybook/visual/container.json names the container the
// visual gate captures in, and it must move with the repository's Node and Playwright pins. A Node or Playwright
// upgrade fails this test until the pin is moved with it (moving the pin is a baseline change).
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repo = fileURLToPath(new URL("../../", import.meta.url));
const pinPath = join(repo, "storybook/visual/container.json");

/** The repository's Node pin, `.node-version` without its line end. */
function nodePin(): string {
  return readFileSync(join(repo, ".node-version"), "utf8").trim();
}

/** The revision of the `chromium-headless-shell` entry of the repository's `playwright-core/browsers.json`. */
function headlessShellRevision(): string {
  const fromPlaywright = createRequire(createRequire(join(repo, "package.json")).resolve("playwright/package.json"));
  const browsersPath = join(dirname(fromPlaywright.resolve("playwright-core/package.json")), "browsers.json");
  const browsers = JSON.parse(readFileSync(browsersPath, "utf8")) as {
    browsers: { name: string; revision: string }[];
  };
  const entry = browsers.browsers.find((b) => b.name === "chromium-headless-shell");
  return entry?.revision ?? "<no chromium-headless-shell entry>";
}

/**
 * The pin's checks, one problem line per failed check, in field order. The same function judges the repository's
 * pin and a copy of it with a wrong `node` and a wrong `browser`, so both checks are shown able to fail.
 */
function pinProblems(pin: Record<string, unknown>, node: string, revision: string): string[] {
  const problems: string[] = [];
  if (pin.node !== node) problems.push(`node is ${JSON.stringify(pin.node)}, expected "${node}" (.node-version)`);
  if (pin.platform !== "linux/amd64") problems.push(`platform is ${JSON.stringify(pin.platform)}, expected "linux/amd64"`);
  if (typeof pin.digest !== "string" || !/^sha256:[0-9a-f]{64}$/.test(pin.digest)) {
    problems.push(`digest is ${JSON.stringify(pin.digest)}, expected sha256:<64 hex>`);
  }
  const browser = `chromium_headless_shell-${revision}`;
  if (pin.browser !== browser) problems.push(`browser is ${JSON.stringify(pin.browser)}, expected "${browser}"`);
  return problems;
}

function readPin(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

describe("the container pin", () => {
  it("exists, and names the repository's Node, linux/amd64, a manifest digest and the headless shell build", () => {
    expect(existsSync(pinPath), "storybook/visual/container.json exists").toBe(true);
    const pin = readPin(pinPath);
    expect(pin.node).toBe(nodePin());
    expect(pin.platform).toBe("linux/amd64");
    expect(pin.digest).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(pin.browser).toBe(`chromium_headless_shell-${headlessShellRevision()}`);
    expect(pinProblems(pin, nodePin(), headlessShellRevision())).toEqual([]);
  });

  it("reports a wrong node and a wrong browser on a copy of the pin, each on its own line, and nothing else", () => {
    // The copy is the repository's pin with two fields changed, so the other checks are seen passing on real values.
    expect(existsSync(pinPath), "storybook/visual/container.json exists").toBe(true);
    const revision = headlessShellRevision();
    expect(revision).toMatch(/^\d+$/);
    const copy = { ...readPin(pinPath), node: "24.11.0", browser: "chromium-1248" };
    expect(pinProblems(copy, nodePin(), revision)).toEqual([
      `node is "24.11.0", expected "${nodePin()}" (.node-version)`,
      `browser is "chromium-1248", expected "chromium_headless_shell-${revision}"`,
    ]);
  });
});
