import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import config from "../../.storybook/main.ts";

// The configuration the phase 3 spike reached zero CSP violations with (reviews/phase-3/spike.md, step 2; FR-023,
// research.md R-10): the HTML framework over Vite, the token stories, the generated directory as the static
// directory, and the core addons whose preview code injects <style> elements turned off.
describe("main.ts", () => {
  it("uses @storybook/html-vite with the token stories and .generated/ as the static directory", () => {
    expect(config.framework).toEqual({ name: "@storybook/html-vite", options: {} });
    expect(config.stories).toEqual(["../stories/*.stories.ts"]);
    expect(config.staticDirs).toEqual(["../.generated"]);
  });

  it("turns off the core addons whose preview code injects <style> elements", () => {
    expect(config.features).toEqual({
      highlight: false,
      backgrounds: false,
      measure: false,
      outline: false,
      viewport: false,
      actions: false,
      controls: false,
      interactions: false,
    });
  });

  // research.md R-16 (specs/006-storybook-workbench): every build of a root writes Vite's cache only below that root's
  // ignored storybook/.cache/, never into the storybook/node_modules a plant root shares with the repository.
  it("sets Vite's cacheDir to storybook/.cache/vite beside this configuration, and keeps the rest of the Vite configuration", async () => {
    const viteFinal = config.viteFinal as unknown as (vite: Record<string, unknown>, options: unknown) => Promise<Record<string, unknown>> | Record<string, unknown>;
    expect(typeof viteFinal).toBe("function");
    const vite = await viteFinal({ root: "/r", cacheDir: "/r/node_modules/.vite" }, {});
    expect(vite).toEqual({ root: "/r", cacheDir: fileURLToPath(new URL("../../.cache/vite", import.meta.url)) });
  });
});
