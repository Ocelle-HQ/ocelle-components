// The package build's output step (003 research.md R-01): after `tsc`, writes `dist/base.css`, byte-identical to
// `src/base.css`. buildPlan() holds the decision (one content entry carrying the text, the tokens package's
// PlanEntry shape), and the source-level checks parse its content; build() only reads src/base.css and writes the
// plan, and packages/styles/test/build.test.ts runs it in process, so its mutants are killed, not recorded. Only the
// two `import.meta.main` lines below, run as `node scripts/build.ts`, are the I/O boundary that keeps a record.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** One file of the output: its path under the output directory and its text (the tokens package's content entry). */
export interface PlanEntry {
  readonly path: string;
  readonly content: string;
}

/** The files to write for the text of `src/base.css`: that text, unchanged, as `base.css`. */
export function buildPlan(css: string): PlanEntry[] {
  return [{ path: "base.css", content: css }];
}

/** Writes the output of the package in `packageDir` into `outDir`. */
export async function build(packageDir: string, outDir: string): Promise<void> {
  const css = await readFile(join(packageDir, "src", "base.css"), "utf8");
  for (const entry of buildPlan(css)) {
    const target = join(outDir, entry.path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, entry.content);
  }
}

// Stryker disable next-line all: I/O boundary, covered by packages/styles/test/build.test.ts "node scripts/build.ts <out>, the package build's second step writes the package's src/base.css byte for byte to <out>/base.css, which package.json exports as ./base.css"
const packageDir = join(dirname(fileURLToPath(import.meta.url)), "..");

// Stryker disable next-line all: I/O boundary, covered by packages/styles/test/build.test.ts "node scripts/build.ts <out>, the package build's second step writes the package's src/base.css byte for byte to <out>/base.css, which package.json exports as ./base.css"
if (import.meta.main) await build(packageDir, resolve(process.argv[2] ?? join(packageDir, "dist")));
