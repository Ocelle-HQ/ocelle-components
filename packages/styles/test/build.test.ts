import { execFile } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { build, buildPlan } from "../scripts/build.ts";

// The build's output step (003 research.md R-01, contracts/checks.md § Tests added): buildPlan(css) plans exactly one
// content entry, base.css with the given text unchanged; build(packageDir, outDir) reads src/base.css and writes a
// dist/base.css byte-identical to it, and the script does the same for the real package. The source-level checks
// (source.test.ts) parse buildPlan(text)[0].content, so together they cover the shipped file.
const packageDir = fileURLToPath(new URL("..", import.meta.url));
const run = promisify(execFile);
const made: string[] = [];

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "ocelle-styles-build-"));
  made.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("buildPlan()", () => {
  it.each([
    { label: "a rule", css: ":where(body) { margin: 0; }\n" },
    { label: "the empty text", css: "" },
    { label: "text that is not CSS, with a line break and no final newline", css: "not css\r\n{ }" },
  ])("plans exactly one entry, base.css with the given text unchanged, for $label", ({ css }) => {
    expect(buildPlan(css)).toEqual([{ path: "base.css", content: css }]);
  });
});

describe("build()", () => {
  it("writes dist/base.css byte-identical to src/base.css of the package it is given, and nothing else", async () => {
    const fake = tempDir();
    mkdirSync(join(fake, "src"));
    const text = ":where(body) {\n  margin: 0;\n}\n/* non-ASCII text: é, ü */\n";
    writeFileSync(join(fake, "src", "base.css"), text);
    const out = join(tempDir(), "a", "dist");
    await build(fake, out);
    expect(existsSync(out) ? readdirSync(out) : []).toEqual(["base.css"]);
    expect(readFileSync(join(out, "base.css")).equals(readFileSync(join(fake, "src", "base.css")))).toBe(true);
  });

  it("fails when the package has no src/base.css", async () => {
    await expect(build(tempDir(), join(tempDir(), "dist"))).rejects.toThrow(/base\.css/);
  });
});

describe("node scripts/build.ts <out>, the package build's second step", () => {
  it("writes the package's src/base.css byte for byte to <out>/base.css, which package.json exports as ./base.css", async () => {
    const out = join(tempDir(), "dist");
    await run(process.execPath, [join(packageDir, "scripts", "build.ts"), out], { cwd: packageDir });
    expect(existsSync(join(out, "base.css"))).toBe(true);
    expect(readFileSync(join(out, "base.css")).equals(readFileSync(join(packageDir, "src", "base.css")))).toBe(true);
    const manifest = JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8")) as Record<string, unknown>;
    expect({ exports: manifest.exports, files: manifest.files, scripts: manifest.scripts, peerDependencies: manifest.peerDependencies }).toEqual({
      exports: { ".": "./dist/index.js", "./base.css": "./dist/base.css" },
      files: ["dist", "CHANGELOG.md", "README.md"],
      scripts: { build: "tsc -p tsconfig.json && node scripts/build.ts" },
      peerDependencies: { "@ocelle/tokens": "workspace:0.0.0" },
    });
  });
});
