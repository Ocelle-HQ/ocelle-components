// The prefix gate (FR-022, research.md R-12): in the package source, test code and built output of the three packages
// (every text file below `packages/<name>/`, without installed dependencies, Markdown, source maps and binaries), a
// name that starts with `sk-` or `--sk-` at a name boundary (case-insensitive) and a monospace font family in a font
// declaration (`font`, `font-family`, including the `@font-face` descriptor) are findings, one per line and rule.
// A covered file that is not valid UTF-8 is exit 2.
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { main, parseArgs } from "../lib/cli.ts";
import type { Io } from "../lib/cli.ts";
import { emit, plural } from "../lib/findings.ts";
import type { Finding, GateResult } from "../lib/findings.ts";

/** One file of a package: its repository path and bytes. */
export interface PackageFile {
  readonly path: string;
  readonly bytes: Uint8Array;
}

const gate = "prefix";
/** The text files the check reads, by extension. */
const covered = /\.(?:ts|mts|cts|js|mjs|cjs|css|html|svg|json)$/;
/** `sk-` not preceded by a letter, digit, `_` or `-`, and `--sk-` not preceded by a letter, digit or `_` (R-12). */
const names = /(?<![A-Za-z0-9_-])sk-[A-Za-z0-9_-]*|(?<![A-Za-z0-9_])--sk-[A-Za-z0-9_-]*/gi;
/** A font declaration and its value, up to the end of the declaration or the line. */
const fontDeclarations = /(?<![\w-])font(?:-family)?\s*:([^;{}]*)/gi;
/** FR-022's monospace families, longest first, so `Courier New` is one match and not `Courier`. */
const families = [
  "DejaVu Sans Mono",
  "Liberation Mono",
  "Source Code Pro",
  "SFMono-Regular",
  "JetBrains Mono",
  "Cascadia Code",
  "Cascadia Mono",
  "Lucida Console",
  "ui-monospace",
  "Courier New",
  "Roboto Mono",
  "Fira Code",
  "Fira Mono",
  "monospace",
  "Consolas",
  "Courier",
  "SF Mono",
  "Monaco",
  "Menlo",
];
const monospace = new RegExp(`(?<![\\w-])(?:${families.map((family) => family.replace(/ /g, "\\s+")).join("|")})(?![\\w-])`, "gi");

/** Whether a repository path is a file the prefix check reads (package source, test code, built output). */
export function isCovered(path: string): boolean {
  return /^packages\/[^/]+\/./.test(path) && !path.split("/").includes("node_modules") && covered.test(path);
}

/** The `sk-` name and monospace findings in one file's text. */
export function scanText(path: string, text: string): Finding[] {
  const found: Finding[] = [];
  text.split("\n").forEach((content, index) => {
    const line = index + 1;
    const forbidden = content.match(names);
    if (forbidden !== null) {
      found.push({ location: { path, line }, gate, rule: "sk-name", message: `forbidden name ${[...new Set(forbidden)].join(", ")}; use the ocelle- prefix (FR-022)` });
    }
    const mono = [...content.matchAll(fontDeclarations)].flatMap((declaration) => declaration[1]?.match(monospace) ?? []);
    if (mono.length > 0) {
      found.push({ location: { path, line }, gate, rule: "monospace", message: `monospace font family ${[...new Set(mono)].join(", ")} in a font declaration (FR-022)` });
    }
  });
  return found;
}

const decoder = new TextDecoder("utf-8", { fatal: true });

/** The gate's verdict on the package files. */
export function checkPackages(files: readonly PackageFile[]): GateResult {
  const findings: Finding[] = [];
  let checked = 0;
  let withFindings = 0;
  for (const file of files) {
    if (!isCovered(file.path)) continue;
    let text: string;
    try {
      text = decoder.decode(file.bytes);
    } catch {
      return { exit: 2, cause: `${gate}: could not run: ${file.path} is not valid UTF-8; fix or remove the file` };
    }
    checked += 1;
    const found = scanText(file.path, text);
    if (found.length > 0) withFindings += 1;
    findings.push(...found);
  }
  if (findings.length > 0) {
    return { exit: 1, findings, summary: `${gate}: ${plural(findings.length, "finding")} in ${plural(withFindings, "file")}` };
  }
  return { exit: 0, summary: `${gate}: ${plural(checked, "file")} checked, no finding` };
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "prefix --root <tmp> exits 1 with exactly the defect's finding at its repository path"
export async function run(argv: readonly string[], io: Io): Promise<number> {
  const context = parseArgs(argv, io.cwd);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "prefix --root <tmp> exits 1 with exactly the defect's finding at its repository path"
  const entries = await readdir(join(context.root, "packages"), { recursive: true, withFileTypes: true }).catch(() => []);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "prefix --root <tmp> exits 1 with exactly the defect's finding at its repository path"
  const paths = entries.filter((entry) => entry.isFile()).map((entry) => relative(context.root, join(entry.parentPath, entry.name)));
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "prefix --root <tmp> exits 1 with exactly the defect's finding at its repository path"
  const selected = paths.filter((path) => isCovered(path)).sort();
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "prefix --root <tmp> exits 1 with exactly the defect's finding at its repository path"
  const files = await Promise.all(selected.map(async (path) => ({ path, bytes: await readFile(join(context.root, path)) })));
  return emit(checkPackages(files), io.out, io.err);
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "prefix --root <tmp> exits 1 with exactly the defect's finding at its repository path"
if (import.meta.main) await main(run);
