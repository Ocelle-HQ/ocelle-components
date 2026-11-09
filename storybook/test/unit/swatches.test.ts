import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { css } from "../../../packages/tokens/src/generate.ts";
import { source } from "../../../packages/tokens/src/source.ts";
import { expectedTokens } from "../../../packages/tokens/test/expected.ts";
import { fixture } from "../../../packages/tokens/test/fixture.ts";
import { swatchRules, writeGenerated } from "../../scripts/swatches.ts";

// The Storybook pre-build step (FR-023, research.md R-10; T032): the swatch stylesheet gives each opaque colour token
// one rule by class and data attribute, never a style attribute; `color-scheme` (a keyword, shown as text) and
// `color-overlay` (translucent) get none. writeGenerated() writes the token stylesheet (css()), the swatch stylesheet
// and a copy of the fonts directory into the generated directory, and skips the fonts without error while
// packages/tokens/fonts/ does not exist yet (before phase 4; analysis U1). Since 003 (research.md R-12) it also copies
// the base stylesheet it is given (packages/styles/src/base.css in the pre-build step) to base.css, byte for byte, so
// the preview links it after tokens.css.
const rule = (name: string): string => `.ocelle-swatch[data-token="${name}"] { background: var(--ocelle-${name}) }\n`;

const dirs: string[] = [];
function temp(): string {
  const dir = mkdtempSync(join(tmpdir(), "ocelle-storybook-swatches-"));
  dirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/** A base stylesheet fixture in a temporary directory: its path. */
function baseSheet(text = ":where(body) { margin: 0; }\n"): string {
  const file = join(temp(), "base.css");
  writeFileSync(file, text);
  return file;
}

describe("swatchRules", () => {
  it("gives one rule per opaque colour token of a fixture source, derived ones included, in source order", () => {
    expect(swatchRules(fixture)).toBe(rule("color-ground") + rule("color-ink") + rule("color-same") + rule("color-focus"));
  });

  it("gives no rule for a colour token translucent in one theme only, nor for color-scheme, color-overlay or another group", () => {
    const half = { name: "color-half", group: "colour", value: { light: "#123456", dark: "rgb(0 0 0 / 0.5)" } } as const;
    const dark = { name: "color-dark", group: "colour", value: { light: "rgb(0 0 0 / 0.5)", dark: "#123456" } } as const;
    const both = { name: "color-both", group: "colour", value: { light: "#123456", dark: "#654321" } } as const;
    expect(swatchRules([...fixture, half, dark, both])).toBe(
      rule("color-ground") + rule("color-ink") + rule("color-same") + rule("color-focus") + rule("color-both"),
    );
  });

  it("gives exactly the opaque colour tokens of Appendix A for the real source", () => {
    const opaque = expectedTokens
      .filter((token) => token.group === "colour" && token.name !== "color-scheme" && token.name !== "color-overlay")
      .map((token) => rule(token.name))
      .join("");
    expect(swatchRules(source)).toBe(opaque);
  });
});

describe("writeGenerated", () => {
  it("fails, naming the file, when the base stylesheet it is given does not exist", () => {
    const missing = join(temp(), "missing", "base.css");
    expect(() => {
      writeGenerated(join(temp(), "generated"), join(temp(), "missing"), fixture, missing);
    }).toThrow(missing);
  });

  it("writes tokens.css as css() of the source and swatches.css as swatchRules(), copies the base stylesheet, and copies the fonts directory", () => {
    const fonts = temp();
    writeFileSync(join(fonts, "Face.woff2"), Buffer.from([0, 1, 2, 255]));
    writeFileSync(join(fonts, "OFL.txt"), "licence\n");
    const out = join(temp(), "generated");
    const base = baseSheet(":where(body) {\n  margin: 0;\n}\n/* é */\n");
    writeGenerated(out, fonts, fixture, base);
    expect(readdirSync(out).sort()).toEqual(["base.css", "fonts", "swatches.css", "tokens.css"]);
    expect(readFileSync(join(out, "base.css")).equals(readFileSync(base))).toBe(true);
    expect(readFileSync(join(out, "tokens.css"), "utf8")).toBe(css(fixture));
    expect(readFileSync(join(out, "swatches.css"), "utf8")).toBe(swatchRules(fixture));
    expect(readdirSync(join(out, "fonts")).sort()).toEqual(["Face.woff2", "OFL.txt"]);
    expect([...readFileSync(join(out, "fonts", "Face.woff2"))]).toEqual([0, 1, 2, 255]);
    expect(readFileSync(join(out, "fonts", "OFL.txt"), "utf8")).toBe("licence\n");
  });

  it("skips the fonts without error when the fonts directory does not exist, and writes no fonts/", () => {
    const out = join(temp(), "generated");
    writeGenerated(out, join(temp(), "missing"), fixture, baseSheet());
    expect(readdirSync(out).sort()).toEqual(["base.css", "swatches.css", "tokens.css"]);
    expect(existsSync(join(out, "fonts"))).toBe(false);
  });

  it("creates the generated directory and its missing parents (added: mutation run)", () => {
    const out = join(temp(), "a", "b", "generated");
    writeGenerated(out, join(temp(), "missing"), fixture, baseSheet());
    expect(readdirSync(out).sort()).toEqual(["base.css", "swatches.css", "tokens.css"]);
  });

  it("replaces what an earlier run left in the generated directory", () => {
    const out = temp();
    mkdirSync(join(out, "fonts"));
    writeFileSync(join(out, "fonts", "Old.woff2"), "old");
    writeFileSync(join(out, "tokens.css"), "old");
    writeFileSync(join(out, "base.css"), "old");
    writeGenerated(out, join(temp(), "missing"), fixture, baseSheet("new\n"));
    expect(readdirSync(out).sort()).toEqual(["base.css", "swatches.css", "tokens.css"]);
    expect(readFileSync(join(out, "base.css"), "utf8")).toBe("new\n");
    expect(readFileSync(join(out, "tokens.css"), "utf8")).toBe(css(fixture));
  });
});
