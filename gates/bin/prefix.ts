// The prefix gate (FR-022, research.md R-12): in the package source, test code and built output of the three packages
// (every text file below `packages/<name>/`, without installed dependencies, Markdown, source maps and binaries), a
// name that starts with `sk-` or `--sk-` at a name boundary (case-insensitive) and a monospace font family in a font
// declaration (`font`, `font-family`, including the `@font-face` descriptor) are findings, one per line and rule.
// A declaration is matched across line breaks, up to its `;` or `}`, and reported at the line where it starts (006
// research.md R-10). A covered file that is not valid UTF-8 is exit 2. Since 002 (FR-023, research.md R-10) the scope also holds the
// Storybook workspace: its source (`.storybook/`, `stories/`, `scripts/`, `test/` and its other text files), its
// generated stylesheets (`.generated/`) and the top-level HTML entries of its build output (`dist/*.html`), not
// installed packages and not the bundles under `storybook/dist/`, which the run-time test of the Storybook covers.
// `monospaceFamilies` is exported for that test's monospace check (contracts/gates.md § Monospace in Storybook).
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { main, parseArgs } from "../lib/cli.ts";
import type { Io } from "../lib/cli.ts";
import { filePaths } from "../lib/entries.ts";
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
/** A font declaration and its value, up to its terminating `;` or `}` (or the end of the text), across line breaks. */
const fontDeclarations = /(?<![\w-])font(?:-family)?\s*:([^;{}]*)/gi;
/** FR-022's monospace families, longest first, so `Courier New` is one match and not `Courier`. */
export const monospaceFamilies: readonly string[] = [
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
const monospace = new RegExp(`(?<![\\w-])(?:${monospaceFamilies.map((family) => family.replace(/ /g, "\\s+")).join("|")})(?![\\w-])`, "gi");

/** The Storybook workspace's files outside its build output, and the top-level HTML entries of that output. */
const storybook = /^storybook\/(?!dist\/).|^storybook\/dist\/[^/]+\.html$/;

/**
 * Whether a repository path is a file the prefix check reads: package source, test code and built output, and the
 * Storybook workspace's source, generated stylesheets and HTML entries (002 FR-023).
 */
export function isCovered(path: string): boolean {
  return (/^packages\/[^/]+\/./.test(path) || storybook.test(path)) && !path.split("/").includes("node_modules") && covered.test(path);
}

/**
 * The monospace families of each line's font declarations, by the line where each declaration starts (1-based). A
 * declaration runs to its terminating `;` or `}` across line breaks (006 research.md R-10).
 */
function monospaceByLine(text: string): Map<number, string[]> {
  const byLine = new Map<number, string[]>();
  for (const declaration of text.matchAll(fontDeclarations)) {
    const families = declaration[1]?.match(monospace) ?? [];
    if (families.length === 0) continue;
    const line = (text.slice(0, declaration.index).match(/\n/g)?.length ?? 0) + 1;
    byLine.set(line, [...(byLine.get(line) ?? []), ...families]);
  }
  return byLine;
}

/** The `sk-` name and monospace findings in one file's text. */
export function scanText(path: string, text: string): Finding[] {
  const found: Finding[] = [];
  const mono = monospaceByLine(text);
  text.split("\n").forEach((content, index) => {
    const line = index + 1;
    const forbidden = content.match(names);
    if (forbidden !== null) {
      found.push({ location: { path, line }, gate, rule: "sk-name", message: `forbidden name ${[...new Set(forbidden)].join(", ")}; use the ocelle- prefix (FR-022)` });
    }
    const families = mono.get(line);
    if (families !== undefined) {
      found.push({ location: { path, line }, gate, rule: "monospace", message: `monospace font family ${[...new Set(families)].join(", ")} in a font declaration (FR-022)` });
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

/** The package files the gate reads, by repository path, sorted. */
export function selectCovered(paths: readonly string[]): string[] {
  return paths.filter((path) => isCovered(path)).sort();
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "prefix --root <tmp> exits 1 with exactly the defect's finding at its repository path"
export async function run(argv: readonly string[], io: Io): Promise<number> {
  const context = parseArgs(argv, io.cwd);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "prefix --root <tmp> exits 1 with exactly the defect's finding at its repository path"
  const entries = await readdir(join(context.root, "packages"), { recursive: true, withFileTypes: true }).catch(() => []);
  // Stryker disable next-line all: process boundary, covered by gate:plants: gates/plants/prefix/fail-storybook-monospace (a finding in storybook/.generated/ under --root)
  const storybookEntries = await readdir(join(context.root, "storybook"), { recursive: true, withFileTypes: true }).catch(() => []);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "prefix --root <tmp> exits 1 with exactly the defect's finding at its repository path"
  const selected = selectCovered(filePaths([...entries, ...storybookEntries], context.root));
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "prefix --root <tmp> exits 1 with exactly the defect's finding at its repository path"
  const files = await Promise.all(selected.map(async (path) => ({ path, bytes: await readFile(join(context.root, path)) })));
  return emit(checkPackages(files), io.out, io.err);
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "prefix --root <tmp> exits 1 with exactly the defect's finding at its repository path"
if (import.meta.main) await main(run);
