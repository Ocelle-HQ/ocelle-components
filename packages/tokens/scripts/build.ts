// The package build's output step (research.md R-01, R-11): after `tsc`, writes `dist/tokens.css` (css()),
// `dist/tokens.json` (json()) and copies `fonts/` (without its SOURCE.json) to `dist/fonts/` when it exists; without it
// the copy is skipped. buildPlan() holds every decision and is tested in process; build() only reads the font
// directory and writes the plan (the I/O boundary, covered by packages/tokens/test/build.test.ts).
import { copyFile, mkdir, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { css, json } from "../src/generate.ts";
import type { TokenRecord } from "../src/generate.ts";
import { source } from "../src/source.ts";

/** One file of the output: its path under the output directory, and its text or the package file it copies. */
export type PlanEntry = { readonly path: string; readonly content: string } | { readonly path: string; readonly copyFrom: string };

/** The provenance record of the vendored font (research.md R-06): repository data, not published. */
const provenance = "SOURCE.json";

/**
 * The files to write for a source and the names of the files in `fonts/`: every font file is copied except the
 * provenance record, which is not part of the public surface (contracts/token-package.md § Not public).
 */
export function buildPlan(records: readonly TokenRecord[], fontFiles: readonly string[]): PlanEntry[] {
  return [
    { path: "tokens.css", content: css(records) },
    { path: "tokens.json", content: JSON.stringify(json(records)) },
    ...fontFiles.filter((file) => file !== provenance).map((file) => ({ path: `fonts/${file}`, copyFrom: `fonts/${file}` })),
  ];
}

/** The names of the files in a directory, sorted; none when it does not exist. */
async function filesIn(dir: string): Promise<string[]> {
  // Stryker disable next-line all: I/O boundary, covered by packages/tokens/test/build.test.ts "build() skips the copy without error when the package has no fonts/ directory, and writes no fonts/"
  const entries = await readdir(dir, { withFileTypes: true }).catch((error: unknown) => {
    // Stryker disable next-line all: I/O boundary, covered by packages/tokens/test/build.test.ts "build() skips the copy without error when the package has no fonts/ directory, and writes no fonts/"
    if ((error as { code?: unknown }).code === "ENOENT") return [];
    // Stryker disable next-line all: I/O boundary, covered by packages/tokens/test/build.test.ts "build() skips the copy without error when the package has no fonts/ directory, and writes no fonts/"
    throw error;
  });
  // Stryker disable next-line all: I/O boundary, covered by packages/tokens/test/build.test.ts "build() writes the stylesheet and the JSON of the real source, and copies a fixture fonts/ into fonts/"
  return entries.filter((entry) => entry.isFile()).map((entry) => entry.name).sort();
}

/** Writes the output of the package in `packageDir` into `outDir`. */
export async function build(packageDir: string, outDir: string): Promise<void> {
  // Stryker disable next-line all: I/O boundary, covered by packages/tokens/test/build.test.ts "build() writes the stylesheet and the JSON of the real source, and copies a fixture fonts/ into fonts/"
  for (const entry of buildPlan(source, await filesIn(join(packageDir, "fonts")))) {
    // Stryker disable next-line all: I/O boundary, covered by packages/tokens/test/build.test.ts "build() writes the stylesheet and the JSON of the real source, and copies a fixture fonts/ into fonts/"
    const target = join(outDir, entry.path);
    // Stryker disable next-line all: I/O boundary, covered by packages/tokens/test/build.test.ts "build() writes the stylesheet and the JSON of the real source, and copies a fixture fonts/ into fonts/"
    await mkdir(dirname(target), { recursive: true });
    // Stryker disable next-line all: I/O boundary, covered by packages/tokens/test/build.test.ts "build() writes the stylesheet and the JSON of the real source, and copies a fixture fonts/ into fonts/"
    if ("content" in entry) await writeFile(target, entry.content);
    // Stryker disable next-line all: I/O boundary, covered by packages/tokens/test/build.test.ts "build() writes the stylesheet and the JSON of the real source, and copies a fixture fonts/ into fonts/"
    else await copyFile(join(packageDir, entry.copyFrom), target);
  }
}

// Stryker disable next-line all: I/O boundary, covered by packages/tokens/test/build.test.ts "node scripts/build.ts <out> writes exactly css() to tokens.css and JSON.stringify(json()) to tokens.json"
const packageDir = join(dirname(fileURLToPath(import.meta.url)), "..");

// Stryker disable next-line all: I/O boundary, covered by packages/tokens/test/build.test.ts "node scripts/build.ts <out> writes exactly css() to tokens.css and JSON.stringify(json()) to tokens.json"
if (import.meta.main) await build(packageDir, resolve(process.argv[2] ?? join(packageDir, "dist")));
