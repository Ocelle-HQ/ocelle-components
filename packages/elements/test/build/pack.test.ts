import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { buildPackage, elements, run } from "./package-build.ts";

// The packed file list (005 FR-029, FR-030; research.md R-15, T016a; analysis L9): after the package's build, `pnpm
// pack --dry-run --json` lists the licence of the package, Lit's notice and licence text that the browser build's
// banner points to, the manifest and the browser build's file, and `NOTICE` with the trademark note (FR-030; phase 5,
// T055); and since 012 (tasks.md T020) `dist/ocelle-button.js`, and (T053) `dist/ocelle-action-row.js`; since 018 (tasks.md
// T016) `dist/ocelle-status-indicator.js`.
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
    expect(packed).toContain("dist/ocelle-context-sidebar.js");
    expect(packed).toContain("dist/ocelle-personal-rail.js");
    expect(packed).toContain("dist/ocelle-button.js");
    expect(packed).toContain("dist/ocelle-action-row.js");
  });

  // 018 tasks.md T016: the status indicator's entry point is packed, and package.json maps it.
  it("lists dist/ocelle-status-indicator.js and dist/status.js, and the packed package.json maps ./ocelle-status-indicator.js to dist/ocelle-status-indicator.js", async () => {
    const manifest = JSON.parse(await readFile(join(elements, "package.json"), "utf8")) as { exports?: Record<string, string> };
    expect({ indicator: packed.includes("dist/ocelle-status-indicator.js"), status: packed.includes("dist/status.js"), entry: manifest.exports?.["./ocelle-status-indicator.js"] }).toEqual({
      indicator: true,
      status: true,
      entry: "./dist/ocelle-status-indicator.js",
    });
  });

  // 008 tasks.md T019: the dialog's entry point is packed, and package.json maps it.
  it("lists dist/ocelle-dialog.js and dist/overlay.js, and the packed package.json maps ./ocelle-dialog.js to dist/ocelle-dialog.js", async () => {
    const manifest = JSON.parse(await readFile(join(elements, "package.json"), "utf8")) as { exports?: Record<string, string> };
    expect({ dialog: packed.includes("dist/ocelle-dialog.js"), base: packed.includes("dist/overlay.js"), entry: manifest.exports?.["./ocelle-dialog.js"] }).toEqual({ dialog: true, base: true, entry: "./dist/ocelle-dialog.js" });
  });

  // 008 tasks.md T032: the drawer's entry point is packed, and package.json maps it.
  it("lists dist/ocelle-drawer.js, and the packed package.json maps ./ocelle-drawer.js to dist/ocelle-drawer.js", async () => {
    const manifest = JSON.parse(await readFile(join(elements, "package.json"), "utf8")) as { exports?: Record<string, string> };
    expect({ drawer: packed.includes("dist/ocelle-drawer.js"), entry: manifest.exports?.["./ocelle-drawer.js"] }).toEqual({ drawer: true, entry: "./dist/ocelle-drawer.js" });
  });

  // 008 tasks.md T043: the tooltip's entry point is packed, and package.json maps it.
  it("lists dist/ocelle-tooltip.js, and the packed package.json maps ./ocelle-tooltip.js to dist/ocelle-tooltip.js", async () => {
    const manifest = JSON.parse(await readFile(join(elements, "package.json"), "utf8")) as { exports?: Record<string, string> };
    expect({ tooltip: packed.includes("dist/ocelle-tooltip.js"), entry: manifest.exports?.["./ocelle-tooltip.js"] }).toEqual({ tooltip: true, entry: "./dist/ocelle-tooltip.js" });
  });
});
