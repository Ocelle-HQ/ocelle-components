// The package build's output step (research.md R-01, R-11): after `tsc`, writes `dist/tokens.css` (css()),
// `dist/tokens.json` (json()) and copies `fonts/` to `dist/fonts/` when it exists. buildPlan() holds every decision;
// build() only reads the font directory and writes the plan.
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { TokenRecord } from "../src/generate.ts";
/* eslint-disable @typescript-eslint/no-unused-vars -- scaffold: signatures only, the green commit implements them */

/** One file of the output: its path under the output directory, and its text or the package file it copies. */
export type PlanEntry = { readonly path: string; readonly content: string } | { readonly path: string; readonly copyFrom: string };

/** The files to write for a source and the names of the files in `fonts/`. */
export function buildPlan(source: readonly TokenRecord[], fontFiles: readonly string[]): PlanEntry[] {
  return [];
}

/** Writes the output of the package in `packageDir` into `outDir`. */
export async function build(packageDir: string, outDir: string): Promise<void> {
  await Promise.resolve();
}

const packageDir = join(dirname(fileURLToPath(import.meta.url)), "..");

if (import.meta.main) await build(packageDir, resolve(process.argv[2] ?? join(packageDir, "dist")));
