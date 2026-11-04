import { execFile } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { build, buildPlan } from "../scripts/build.ts";
import { css, json } from "../src/generate.ts";
import { source } from "../src/source.ts";
import { fixture } from "./fixture.ts";

// The build's output step (research.md R-01, R-11): buildPlan() decides, build() writes, and the script writes exactly
// css() to tokens.css and JSON.stringify(json()) to tokens.json, and copies fonts/ when the package has it; without a
// fonts/ directory (git keeps no empty directory, so before phase 4 there is none) it skips the copy (analysis U1).
const packageDir = fileURLToPath(new URL("..", import.meta.url));
const run = promisify(execFile);
const made: string[] = [];

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "ocelle-tokens-build-"));
  made.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("buildPlan()", () => {
  it("writes tokens.css and tokens.json from the source and copies each font file", () => {
    expect(buildPlan(fixture, ["OFL.txt", "SchibstedGrotesk-wght.woff2"])).toEqual([
      { path: "tokens.css", content: css(fixture) },
      { path: "tokens.json", content: JSON.stringify(json(fixture)) },
      { path: "fonts/OFL.txt", copyFrom: "fonts/OFL.txt" },
      { path: "fonts/SchibstedGrotesk-wght.woff2", copyFrom: "fonts/SchibstedGrotesk-wght.woff2" },
    ]);
  });

  it("copies nothing without font files", () => {
    expect(buildPlan(fixture, []).map((entry) => entry.path)).toEqual(["tokens.css", "tokens.json"]);
  });
});

describe("build()", () => {
  it("writes the stylesheet and the JSON of the real source, and copies a fixture fonts/ into fonts/", async () => {
    const fake = tempDir();
    mkdirSync(join(fake, "fonts"));
    writeFileSync(join(fake, "fonts", "one.woff2"), "font bytes");
    const out = join(tempDir(), "dist");
    await build(fake, out);
    expect(existsSync(out)).toBe(true);
    expect(readdirSync(out).sort()).toEqual(["fonts", "tokens.css", "tokens.json"]);
    expect(readFileSync(join(out, "tokens.css"), "utf8")).toBe(css(source));
    expect(readFileSync(join(out, "tokens.json"), "utf8")).toBe(JSON.stringify(json(source)));
    expect(readdirSync(join(out, "fonts"))).toEqual(["one.woff2"]);
    expect(readFileSync(join(out, "fonts", "one.woff2"), "utf8")).toBe("font bytes");
  });

  it("skips the copy without error when the package has no fonts/ directory, and writes no fonts/", async () => {
    const out = join(tempDir(), "dist");
    await build(tempDir(), out);
    expect(existsSync(out)).toBe(true);
    expect(readdirSync(out).sort()).toEqual(["tokens.css", "tokens.json"]);
    expect(existsSync(join(out, "fonts"))).toBe(false);
  });
});

describe("node scripts/build.ts <out>", () => {
  it("writes exactly css() to tokens.css and JSON.stringify(json()) to tokens.json", async () => {
    const out = join(tempDir(), "dist");
    await run(process.execPath, [join(packageDir, "scripts", "build.ts"), out], { cwd: packageDir });
    expect(existsSync(join(out, "tokens.css"))).toBe(true);
    expect(readFileSync(join(out, "tokens.css"), "utf8")).toBe(css(source));
    expect(readFileSync(join(out, "tokens.json"), "utf8")).toBe(JSON.stringify(json(source)));
    expect(css(source)).toContain("--ocelle-color-canvas: #F1EEE8;");
  });
});

describe("node scripts/build.ts <out> on the package with its vendored font (phase 4, US2 scenario 1)", () => {
  it("copies fonts/SchibstedGrotesk-wght.woff2 and fonts/OFL.txt byte for byte into fonts/ of the published dist", async () => {
    const out = join(tempDir(), "dist");
    await run(process.execPath, [join(packageDir, "scripts", "build.ts"), out], { cwd: packageDir });
    const manifest = JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8")) as { files?: unknown };
    expect(manifest.files).toContain("dist");
    expect(existsSync(join(out, "fonts")) ? readdirSync(join(out, "fonts")).sort() : []).toEqual(["OFL.txt", "SchibstedGrotesk-wght.woff2"]);
    for (const file of ["OFL.txt", "SchibstedGrotesk-wght.woff2"]) {
      expect(readFileSync(join(out, "fonts", file)).equals(readFileSync(join(packageDir, "fonts", file)))).toBe(true);
    }
  });
});

describe("package.json", () => {
  it("exports the entry, the stylesheet, the JSON and the fonts, publishes dist, the changelog and the README, and builds both (R-11)", () => {
    const manifest = JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8")) as Record<string, unknown>;
    expect({ exports: manifest.exports, files: manifest.files, scripts: manifest.scripts }).toEqual({
      exports: {
        ".": "./dist/index.js",
        "./tokens.css": "./dist/tokens.css",
        "./tokens.json": "./dist/tokens.json",
        "./fonts/*": "./dist/fonts/*",
      },
      files: ["dist", "CHANGELOG.md", "README.md"],
      scripts: { build: "tsc -p tsconfig.json && node scripts/build.ts" },
    });
  });
});
