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
});
