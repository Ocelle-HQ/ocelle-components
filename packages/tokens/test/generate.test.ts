import { describe, expect, it } from "vitest";
import { css, json, names } from "../src/generate.ts";
import { fixture, withRecord } from "./fixture.ts";
import { blocks, fontFaceOutline, fourBlocks } from "./stylesheet.ts";

// css() on fixture sources (research.md R-02, R-03, R-12; FR-002, FR-005, FR-006, FR-007): the four blocks in order,
// light and theme-independent values in the unconditioned :root, dark values only under the two dark selectors,
// reduced motion setting exactly motion-fast and motion-base to 0ms, derived tokens by reference; and first, the
// @font-face of research.md R-06 (US2, FR-012), whose one source is a relative URL into the package (US2 scenario 5).
const fontFace = `@font-face {
  font-family: "Schibsted Grotesk";
  src: url("./fonts/SchibstedGrotesk-wght.woff2") format("woff2");
  font-weight: 400 900;
  font-style: normal;
  font-display: swap;
}

`;

const expectedCss = `${fontFace}:root {
  --ocelle-color-ground: #FFFFFF;
  --ocelle-color-ink: #111111;
  --ocelle-color-same: #777777;
  --ocelle-color-focus: var(--ocelle-color-ink);
  --ocelle-color-scheme: light;
  --ocelle-color-overlay: rgb(0 0 0 / 0.5);
  --ocelle-space-4: 1rem;
  --ocelle-gutter: var(--ocelle-space-4);
  --ocelle-dialog-max: calc(100vw - 2 * var(--ocelle-gutter));
  --ocelle-elevation-raised: 0 2px 4px rgb(0 0 0 / 0.1);
  --ocelle-motion-fast: 120ms;
  --ocelle-motion-base: 200ms;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --ocelle-color-ground: #000000;
    --ocelle-color-ink: #EEEEEE;
    --ocelle-color-scheme: dark;
    --ocelle-color-overlay: rgb(0 0 0 / 0.65);
    --ocelle-elevation-raised: 0 0 0 1px var(--ocelle-color-ink);
  }
}

:root[data-theme="dark"] {
  --ocelle-color-ground: #000000;
  --ocelle-color-ink: #EEEEEE;
  --ocelle-color-scheme: dark;
  --ocelle-color-overlay: rgb(0 0 0 / 0.65);
  --ocelle-elevation-raised: 0 0 0 1px var(--ocelle-color-ink);
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --ocelle-motion-fast: 0ms;
    --ocelle-motion-base: 0ms;
  }
}
`;

describe("css()", () => {
  it("writes the fixture as the @font-face of R-06 and the four blocks of research.md R-02, exactly", () => {
    expect(css(fixture)).toBe(expectedCss);
  });

  it("puts the blocks in the order: @font-face, :root, system dark unless data-theme=light, data-theme=dark, reduced motion", () => {
    expect(blocks(css(fixture)).outline).toEqual([fontFaceOutline, ...fourBlocks]);
  });

  it("starts with exactly the @font-face of research.md R-06 (FR-012)", () => {
    expect(css(fixture).startsWith(fontFace)).toBe(true);
    expect(css([]).startsWith(fontFace)).toBe(true);
    expect([...blocks(css(fixture)).fontFace.entries()]).toEqual([
      ["font-family", '"Schibsted Grotesk"'],
      ["src", 'url("./fonts/SchibstedGrotesk-wght.woff2") format("woff2")'],
      ["font-weight", "400 900"],
      ["font-style", "normal"],
      ["font-display", "swap"],
    ]);
  });

  it("has exactly one url(), relative into the package's fonts/, and no absolute URL anywhere (US2 scenario 5)", () => {
    const text = css(fixture);
    expect([...text.matchAll(/url\(([^)]*)\)/g)].map((match) => match[1])).toEqual(['"./fonts/SchibstedGrotesk-wght.woff2"']);
    expect(text).not.toMatch(/[a-z][a-z0-9+.-]*:\/\//i);
    expect(text).not.toMatch(/url\(\s*["']?(?:\/|[a-z][a-z0-9+.-]*:)/i);
  });

  it("puts light values only in the unconditioned :root, and dark values only in the two dark blocks (FR-006, no preference)", () => {
    const sheet = blocks(css(fixture));
    expect(sheet.root.get("--ocelle-color-ink")).toBe("#111111");
    expect([...sheet.darkSystem.values(), ...sheet.darkAttribute.values()]).not.toContain("#111111");
    expect(sheet.darkSystem.get("--ocelle-color-ink")).toBe("#EEEEEE");
    expect(sheet.darkAttribute.get("--ocelle-color-ink")).toBe("#EEEEEE");
    expect([...sheet.root.values()]).not.toContain("#EEEEEE");
  });

  it("emits color-scheme as the keyword light in :root and dark in both dark blocks", () => {
    const sheet = blocks(css(fixture));
    expect([sheet.root.get("--ocelle-color-scheme"), sheet.darkSystem.get("--ocelle-color-scheme"), sheet.darkAttribute.get("--ocelle-color-scheme")]).toEqual([
      "light",
      "dark",
      "dark",
    ]);
  });

  it("sets exactly --ocelle-motion-fast and --ocelle-motion-base to 0ms under prefers-reduced-motion: reduce (FR-007)", () => {
    expect([...blocks(css(fixture)).reducedMotion.entries()]).toEqual([
      ["--ocelle-motion-fast", "0ms"],
      ["--ocelle-motion-base", "0ms"],
    ]);
  });

  it("declares a derived token as var() of its source, alone or inside a larger value (FR-002)", () => {
    const sheet = blocks(css(fixture));
    expect({
      focus: sheet.root.get("--ocelle-color-focus"),
      gutter: sheet.root.get("--ocelle-gutter"),
      dialog: sheet.root.get("--ocelle-dialog-max"),
      raisedDark: sheet.darkAttribute.get("--ocelle-elevation-raised"),
    }).toEqual({
      focus: "var(--ocelle-color-ink)",
      gutter: "var(--ocelle-space-4)",
      dialog: "calc(100vw - 2 * var(--ocelle-gutter))",
      raisedDark: "0 0 0 1px var(--ocelle-color-ink)",
    });
  });

  it("keeps the reference in the stylesheet and follows the change in the JSON when the source token changes (edge case: derived token)", () => {
    const changed = withRecord("space-4", { name: "space-4", group: "space", value: "2rem" });
    const recoloured = withRecord("color-ink", { name: "color-ink", group: "colour", value: { light: "#222222", dark: "#DDDDDD" } });
    const gutter = (source: typeof fixture): unknown => json(source).tokens.find((token) => token.name === "--ocelle-gutter");
    const focus = (source: typeof fixture): unknown => json(source).tokens.find((token) => token.name === "--ocelle-color-focus");
    expect(blocks(css(changed)).root.get("--ocelle-gutter")).toBe("var(--ocelle-space-4)");
    expect(blocks(css(changed)).root.get("--ocelle-space-4")).toBe("2rem");
    expect(gutter(fixture)).toEqual({ name: "--ocelle-gutter", group: "space", value: "1rem", ref: ["--ocelle-space-4"] });
    expect(gutter(changed)).toEqual({ name: "--ocelle-gutter", group: "space", value: "2rem", ref: ["--ocelle-space-4"] });
    expect(blocks(css(recoloured)).root.get("--ocelle-color-focus")).toBe("var(--ocelle-color-ink)");
    expect(focus(recoloured)).toEqual({
      name: "--ocelle-color-focus",
      group: "colour",
      light: "#222222",
      dark: "#DDDDDD",
      ref: { light: ["--ocelle-color-ink"], dark: ["--ocelle-color-ink"] },
    });
  });

  it("writes an empty source as the @font-face and empty blocks, with the reduced-motion block", () => {
    expect(css([])).toBe(
      fontFace +
        ":root {\n}\n\n@media (prefers-color-scheme: dark) {\n  :root:not([data-theme=\"light\"]) {\n  }\n}\n\n:root[data-theme=\"dark\"] {\n}\n\n" +
        "@media (prefers-reduced-motion: reduce) {\n  :root {\n    --ocelle-motion-fast: 0ms;\n    --ocelle-motion-base: 0ms;\n  }\n}\n",
    );
  });
});

describe("names()", () => {
  it("lists the token names without prefix, in source order", () => {
    expect(names(fixture)).toEqual([
      "color-ground",
      "color-ink",
      "color-same",
      "color-focus",
      "color-scheme",
      "color-overlay",
      "space-4",
      "gutter",
      "dialog-max",
      "elevation-raised",
      "motion-fast",
      "motion-base",
    ]);
  });
});
