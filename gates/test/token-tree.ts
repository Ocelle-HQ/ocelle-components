// Fixture repositories for the contrast and brand-rules gate tests (002 contracts/gates.md § `contrast`,
// § `brand-rules`): a temporary root with a token source written from fixture records (one record per line, as
// source.ts writes them), its overrides.ts, the repository's own generator (or a wrapper of it, as a plant's
// `generator: "wrapped"` places it) and a pair list written one entry per line. The gates run in process on it with
// `--root`. The expected values of the tests are written in the tests, never computed by the gate code.
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Io, Run } from "../lib/cli.ts";

export const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const generator = readFileSync(join(repoRoot, "packages/tokens/src/generate.ts"), "utf8");
const made: string[] = [];

/** A fixture record or pair entry: plain JSON data. */
export type Data = Readonly<Record<string, unknown>>;

/** What a fixture root holds. `pairs` undefined: no pair list; a string: the list's text as given. */
export interface TreeSpec {
  readonly records?: readonly Data[];
  /** The whole source.ts text, instead of one written from `records`. */
  readonly sourceText?: string;
  /** The overrides list, or the whole overrides.ts text. */
  readonly overrides?: readonly Data[] | string;
  readonly pairs?: readonly Data[] | string;
  /** A wrapper placed as generate.ts, with the real generator as generate.real.ts. */
  readonly wrapper?: string;
  /** The whole generate.ts text, instead of the real generator. */
  readonly generatorText?: string;
}

/** One record as source.ts writes it: `{ name: "<name>", …rest }` on one line. */
export function recordLine(record: Data): string {
  const { name, ...rest } = record;
  const fields = JSON.stringify(rest).slice(1, -1);
  return `{ name: ${JSON.stringify(name)}${fields === "" ? "" : `, ${fields}`} }`;
}

/** A source.ts text from records: the first record on line 5, one record per line. */
export function sourceText(records: readonly Data[]): string {
  return [
    'import { applyOverrides } from "./generate.ts";',
    'import { overrides } from "./overrides.ts";',
    "",
    "export const records = [",
    ...records.map((record) => `  ${recordLine(record)},`),
    "];",
    "",
    "export const source = applyOverrides(records, overrides);",
    "",
  ].join("\n");
}

/** An overrides.ts text: the first override on line 3, one per line. */
export function overridesText(overrides: readonly Data[]): string {
  return [
    'import type { TokenOverride } from "./generate.ts";',
    "export const overrides: readonly TokenOverride[] = [",
    ...overrides.map((override) => `  ${JSON.stringify(override)},`),
    "];",
    "",
  ].join("\n");
}

/** A pairs.json text: the first entry on line 2, one entry per line. */
export function pairsText(entries: readonly Data[]): string {
  return `[\n${entries.map((entry) => `  ${JSON.stringify(entry)}`).join(",\n")}\n]\n`;
}

function write(root: string, path: string, text: string): void {
  mkdirSync(join(root, path, ".."), { recursive: true });
  writeFileSync(join(root, path), text);
}

/** A new fixture root; removed by cleanTrees(). */
export function tree(spec: TreeSpec): string {
  const root = mkdtempSync(join(tmpdir(), "ocelle-token-tree-"));
  made.push(root);
  const src = "packages/tokens/src";
  if (spec.wrapper === undefined) {
    write(root, `${src}/generate.ts`, spec.generatorText ?? generator);
  } else {
    write(root, `${src}/generate.ts`, spec.wrapper);
    write(root, `${src}/generate.real.ts`, generator);
  }
  if (spec.sourceText !== undefined || spec.records !== undefined) write(root, `${src}/source.ts`, spec.sourceText ?? sourceText(spec.records ?? []));
  const overrides = spec.overrides ?? [];
  write(root, `${src}/overrides.ts`, typeof overrides === "string" ? overrides : overridesText(overrides));
  if (spec.pairs !== undefined) write(root, "packages/tokens/contrast/pairs.json", typeof spec.pairs === "string" ? spec.pairs : pairsText(spec.pairs));
  return root;
}

export function cleanTrees(): void {
  for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true });
}

/** A gate run in process: exit code, output lines and error lines. */
export interface GateRun {
  readonly code: number;
  readonly out: readonly string[];
  readonly err: readonly string[];
}

export async function runGate(run: Run, args: readonly string[]): Promise<GateRun> {
  const out: string[] = [];
  const err: string[] = [];
  const io: Io = { cwd: repoRoot, env: {}, out: (line) => out.push(line), err: (line) => err.push(line) };
  const code = await run(args, io);
  return { code, out, err };
}

/** The 1-based line of the first line of `text` that contains `needle`; 0 when none does. */
export function lineOf(text: string, needle: string): number {
  return text.split("\n").findIndex((line) => line.includes(needle)) + 1;
}
