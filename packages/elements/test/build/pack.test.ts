import { beforeAll, describe, expect, it } from "vitest";
import { buildPackage, elements, run } from "./package-build.ts";

// The packed file list (005 FR-029, FR-030; research.md R-15, T016a; analysis L9): after the package's build, `pnpm
// pack --dry-run --json` lists the licence of the package, Lit's notice and licence text that the browser build's
// banner points to, the manifest and the browser build's file, and `NOTICE` with the trademark note (FR-030; phase 5,
// T055).
let packed: readonly string[] = [];

beforeAll(async () => {
  await buildPackage();
  const { stdout } = await run("pnpm", ["pack", "--dry-run", "--json"], { cwd: elements, maxBuffer: 16 * 1024 * 1024 });
  packed = (JSON.parse(stdout) as { files: { path: string }[] }).files.map((file) => file.path);
}, 300_000);

describe("pnpm pack of @ocelle/elements", () => {
  it("lists LICENSE, NOTICE, THIRD_PARTY_NOTICES, licenses/lit-BSD-3-Clause.txt, custom-elements.json and dist/browser/ocelle-elements.js beside package.json", () => {
    const wanted = ["LICENSE", "NOTICE", "THIRD_PARTY_NOTICES", "licenses/lit-BSD-3-Clause.txt", "custom-elements.json", "dist/browser/ocelle-elements.js", "package.json"];
    expect(wanted.filter((path) => !packed.includes(path))).toEqual([]);
    expect(packed).toContain("dist/ocelle-icon.js");
    expect(packed).toContain("dist/ocelle-brand-mark.js");
    expect(packed).toContain("dist/ocelle-card.js");
    expect(packed).toContain("dist/ocelle-section-header.js");
    expect(packed).toContain("dist/ocelle-page-header.js");
  });
});
