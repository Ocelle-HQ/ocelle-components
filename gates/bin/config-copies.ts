// The configuration-copies gate (FR-006, research.md R-15): the two story configuration copies must be byte-identical
// and their test_pathspec must be FR-028's test code. Both paths are fixed, relative to the `--root` repository.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { main, parseArgs } from "../lib/cli.ts";
import type { Io } from "../lib/cli.ts";
import { emit } from "../lib/findings.ts";
import type { Finding, GateResult } from "../lib/findings.ts";

const gate = "config-copies";
const copies = [".specify/extensions/story/story-config.yml", "tooling/speckit/extensions/story/story-config.yml"] as const;
const testPathspec = ":(glob)**/*.test.ts :(glob)**/*.spec.ts :(glob)**/test/** :(glob)**/*.stories.ts";

/** The value of `key: value` on its first line, quotes removed, as the story scripts read it (common.sh). */
function setting(text: string, key: string): string | undefined {
  const line = text.split("\n").find((l) => l.startsWith(`${key}:`));
  if (line === undefined) return undefined;
  return line
    .slice(key.length + 1)
    .trim()
    .replace(/^"(.*)"$/, "$1");
}

/** The first line (1-based) where two different texts differ, counting a line one of them lacks as different. */
function firstDifferingLine(a: string, b: string): number {
  const left = a.split("\n");
  const right = b.split("\n");
  const length = Math.max(left.length, right.length);
  return Array.from({ length }, (_, i) => left[i] === right[i]).indexOf(false) + 1;
}

function compare(specify: string, tooling: string): GateResult {
  const [specifyPath, toolingPath] = copies;
  const findings: Finding[] = [];
  for (const [path, text] of [
    [specifyPath, specify],
    [toolingPath, tooling],
  ] as const) {
    const value = setting(text, "test_pathspec");
    if (value !== testPathspec) {
      const shown = value === undefined ? "missing" : `"${value}"`;
      findings.push({
        location: { path },
        gate,
        rule: "test-pathspec",
        message: `test_pathspec is ${shown}, expected "${testPathspec}"`,
      });
    }
  }
  if (specify !== tooling) {
    findings.unshift({
      location: { path: toolingPath },
      gate,
      rule: "copies-differ",
      message: `differs from ${specifyPath} at line ${String(firstDifferingLine(specify, tooling))}`,
    });
  }
  if (findings.length > 0) {
    return { exit: 1, findings, summary: `${gate}: ${String(findings.length)} finding(s) in the two copies` };
  }
  return { exit: 0, summary: `${gate}: ${specifyPath} and ${toolingPath} are identical` };
}

async function read(root: string, path: string): Promise<string | undefined> {
  try {
    return await readFile(join(root, path), "utf8");
  }
  // Stryker disable next-line BlockStatement: equivalent, an empty catch also makes the function return undefined
  catch {
    return undefined;
  }
}

export async function run(argv: readonly string[], io: Io): Promise<number> {
  const context = parseArgs(argv, io.cwd);
  const [specifyPath, toolingPath] = copies;
  const unreadable = (path: string): number => {
    const cause = `${gate}: could not run: cannot read ${path}; restore it from git (both copies must exist)`;
    return emit({ exit: 2, cause }, io.out, io.err);
  };
  const specify = await read(context.root, specifyPath);
  if (specify === undefined) return unreadable(specifyPath);
  const tooling = await read(context.root, toolingPath);
  if (tooling === undefined) return unreadable(toolingPath);
  return emit(compare(specify, tooling), io.out, io.err);
}

// Stryker disable next-line all: process boundary, covered by gates-integration
if (import.meta.main) await main(run);
