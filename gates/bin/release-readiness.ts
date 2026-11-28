// The release-readiness gate (030 FR-010 to FR-015; contracts/release-readiness-gate.md): on the `--root` checkout,
// which must be the top of a git work tree with the whole history (not shallow), it reads gates/release/gap-rows.json,
// the gap table, gates/release/secret-allowlist.json, the three package manifests and changelogs, the custom-elements
// manifest, the token source, the stylesheets of packages/styles/src/ and each spec's verification.md, scans every
// commit reachable from HEAD (`git log -p -m`, streamed line by line, the matched text never kept), and prints the
// verdict of gates/lib/release-readiness.ts; `--tag <v...>` also checks the tag. Exit 2 for a root outside git, a
// shallow clone, a missing or invalid input. No network, no write (FR-014). Every line here is the process boundary,
// run by gates/test/integration/release-readiness.test.ts and the plants of gates/plants/release-readiness/.
import { spawn } from "node:child_process";
import { readdir, readFile, realpath } from "node:fs/promises";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { main, parseArgs } from "../lib/cli.ts";
import type { Io } from "../lib/cli.ts";
import { emit } from "../lib/findings.ts";
import { gapRowFindings, gapRowsPath, gapTablePath, manifestElements, parseGapRows, parseGapTable, tokenNames } from "../lib/gap-rows.ts";
import type { GapInputs, GapRow, Members, TableRow } from "../lib/gap-rows.ts";
import { readiness } from "../lib/release-readiness.ts";
import type { ReleasePackage } from "../lib/release-readiness.ts";
import { logScanner, parseAllowlist, scanArgs, secretFindings } from "../lib/secret-scan.ts";
import type { AllowEntry, SecretHit } from "../lib/secret-scan.ts";
import { runTool } from "../lib/spawn.ts";

const allowlistPath = "gates/release/secret-allowlist.json";
const manifestPath = "packages/elements/custom-elements.json";
const sourcePath = "packages/tokens/src/source.ts";
const packageDirs = ["tokens", "styles", "elements"];

/** A cause of exit 2. */
class CannotRun extends Error {}

async function text(root: string, path: string): Promise<string> {
  return readFile(join(root, path), "utf8").catch(() => {
    throw new CannotRun(`${path} is missing`);
  });
}

function parsed<T>(path: string, parse: () => T): T {
  try {
    return parse();
  } catch (error) {
    throw new CannotRun(`${path} is invalid: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/** The gap inputs of a checkout: its manifest's tags, its token names, its stylesheets and its spec dirs. */
export async function readGapInputs(root: string): Promise<GapInputs> {
  const manifest = await text(root, manifestPath);
  const source = await text(root, sourcePath);
  const sheets = (await readdir(join(root, "packages/styles/src")).catch(() => [])).filter((name) => name.endsWith(".css")).sort();
  const styles = new Map(await Promise.all(sheets.map(async (name) => [name, await readFile(join(root, "packages/styles/src", name), "utf8")] as const)));
  const dirs = (await readdir(join(root, "specs"), { withFileTypes: true }).catch(() => [])).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  const specs = new Set((await Promise.all(dirs.map(async (dir) => ((await readFile(join(root, "specs", dir, "verification.md")).catch(() => undefined)) === undefined ? [] : [dir])))).flat());
  const elements: Map<string, Members> = parsed(manifestPath, () => manifestElements(manifest));
  return { elements, tokens: tokenNames(source), styles, specs };
}

/** The history scan of a checkout from its HEAD: the commits it read and the hits it found. */
export async function scanHistory(root: string): Promise<{ readonly commits: number; readonly hits: readonly SecretHit[] }> {
  const scanner = logScanner();
  const child = spawn("git", [...scanArgs], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
  let stderr = "";
  child.stderr.on("data", (chunk: Buffer) => (stderr += chunk.toString()));
  const exited = new Promise<number | null>((resolve, reject) => {
    child.on("error", reject);
    child.on("close", resolve);
  });
  for await (const line of createInterface({ input: child.stdout, crlfDelay: Infinity })) scanner.add(line);
  const code = await exited;
  if (code !== 0) throw new CannotRun(`git log failed (exit ${String(code)}): ${stderr.split("\n")[0] ?? ""}`);
  return { commits: scanner.commits(), hits: scanner.hits() };
}

/** Whether the root is the top of a git work tree. */
async function isTop(root: string, io: Io): Promise<boolean> {
  const top = await runTool("git", ["-C", root, "rev-parse", "--show-toplevel"], root, io.env).catch(() => undefined);
  if (top?.exitCode !== 0) return false;
  const [real, own] = await Promise.all([realpath(top.stdout.replace(/\n$/, "")), realpath(root)]);
  return real === own;
}

/** The --tag value, undefined when absent; throws when the flag has no value. */
function tagOf(args: readonly string[]): string | undefined {
  const at = args.indexOf("--tag");
  if (at === -1) return undefined;
  const value = args[at + 1];
  if (value === undefined || value === "" || value.startsWith("--")) throw new CannotRun("--tag needs a tag");
  return value;
}

async function releasePackage(root: string, dir: string): Promise<ReleasePackage> {
  const path = `packages/${dir}/package.json`;
  const manifestText = await text(root, path);
  const manifest = parsed(path, () => {
    const value = JSON.parse(manifestText) as unknown;
    if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("not an object");
    const { name, version } = value as Record<string, unknown>;
    if (typeof name !== "string" || typeof version !== "string" || version === "") throw new Error("it names no package name and version");
    return { name, version };
  });
  return { dir, ...manifest, changelog: await text(root, `packages/${dir}/CHANGELOG.md`) };
}

async function verdict(argv: readonly string[], io: Io): Promise<number> {
  const { root, args } = parseArgs(argv, io.cwd);
  const tag = tagOf(args);
  if (!(await isTop(root, io))) throw new CannotRun("the root is not the top of a git work tree");
  const shallow = await runTool("git", ["rev-parse", "--is-shallow-repository"], root, io.env);
  if (shallow.stdout.trim() !== "false") throw new CannotRun("the clone is shallow; the history scan needs the whole history (check out with fetch-depth: 0)");
  const rowsText = await text(root, gapRowsPath);
  const rows: GapRow[] = parsed(gapRowsPath, () => parseGapRows(rowsText));
  const tableText = await text(root, gapTablePath);
  const table: TableRow[] = parsed(gapTablePath, () => parseGapTable(tableText));
  const allowText = await text(root, allowlistPath);
  const entries: AllowEntry[] = parsed(allowlistPath, () => parseAllowlist(allowText));
  const packages = await Promise.all(packageDirs.map((dir) => releasePackage(root, dir)));
  const inputs = await readGapInputs(root);
  const gap = gapRowFindings(rows, table, inputs);
  const { hits } = await scanHistory(root);
  const secrets = secretFindings(hits, entries);
  const judged = readiness({
    packages,
    ...(tag === undefined ? {} : { tag }),
    elementTags: [...inputs.elements.keys()].sort(),
    tokens: [...inputs.tokens],
    gap: { ...gap, total: table.length },
    secrets: { findings: secrets.findings, count: secrets.secrets },
  });
  for (const line of judged.lines) io.out(line);
  return emit(judged.result, io.out, io.err);
}

export async function run(argv: readonly string[], io: Io): Promise<number> {
  try {
    return await verdict(argv, io);
  } catch (error) {
    if (!(error instanceof CannotRun)) throw error;
    return emit({ exit: 2, cause: `release-readiness: could not run: ${error.message}` }, io.out, io.err);
  }
}

if (import.meta.main) await main(run);
