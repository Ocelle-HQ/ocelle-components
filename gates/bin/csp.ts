// The content-security gate (FR-021, research.md R-11). Scaffold: signatures only.
import type { Io } from "../lib/cli.ts";
import type { Finding, GateResult } from "../lib/findings.ts";

/** One file of built output: its repository path and text. */
export interface OutputFile {
  readonly path: string;
  readonly text: string;
}

/** A script's findings, or the cause when it does not parse. */
export type ScriptScan = { readonly findings: readonly Finding[] } | { readonly cause: string };

/** Whether a repository path is built output the gate checks: `packages/<name>/dist/**` with `.js`, `.css` or `.html`. */
export function isBuiltOutput(_path: string): boolean {
  return false;
}

/** Findings in HTML markup (a file, or the static text of a string in a script) starting at `line`. */
export function scanMarkup(_path: string, _markup: string, _line: number): Finding[] {
  return [];
}

/** Findings in a built JavaScript file: dynamic code, and markup in its string and template literals. */
export function scanScript(_file: OutputFile): ScriptScan {
  return { findings: [] };
}

/** The gate's verdict on the built output files. */
export function checkOutput(_files: readonly OutputFile[]): GateResult {
  return { exit: 0, summary: "" };
}

export function run(_argv: readonly string[], _io: Io): Promise<number> {
  return Promise.resolve(0);
}
