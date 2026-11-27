// The pack-contents gate (030 FR-004, FR-006; contracts/pack-contents-gate.md): reads gates/release/pack-manifest.json
// of the `--root` checkout and the release version (`--version`, default the version of packages/tokens/package.json);
// without `--tarballs` builds the three packages (`pnpm --filter "./packages/*" -r build`) and packs each with `pnpm
// pack --pack-destination <tmp>`, with `--tarballs <dir>` reads the `*.tgz` files of that directory as given (the
// release workflow, the plants); then reads the repository files the identical entries name, and prints the verdict of
// gates/lib/pack-contents.ts. Every line here is the process boundary, run by gates/test/integration/pack-contents.test.ts
// and the plants of gates/plants/pack-contents/.
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { main, parseArgs } from "../lib/cli.ts";
import type { Io } from "../lib/cli.ts";
import { emit } from "../lib/findings.ts";
import { parsePackManifest, verdict } from "../lib/pack-contents.ts";
import type { PackEntry, TarballFile } from "../lib/pack-contents.ts";
import { runTool } from "../lib/spawn.ts";

const manifestPath = "gates/release/pack-manifest.json";
const build = ["--filter", "./packages/*", "-r", "build"];

/** A flag's value, undefined when the flag is absent, or the cause when it has none. */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "exits 2 for --tarballs or --version without a value, for a tarballs directory that does not exist, and for a root without a tokens version"
function flag(args: readonly string[], name: string, what: string): { readonly value?: string } | string {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "exits 2 for --tarballs or --version without a value, for a tarballs directory that does not exist, and for a root without a tokens version"
  const at = args.indexOf(name);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "exits 2 for --tarballs or --version without a value, for a tarballs directory that does not exist, and for a root without a tokens version"
  if (at === -1) return {};
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "exits 2 for --tarballs or --version without a value, for a tarballs directory that does not exist, and for a root without a tokens version"
  const value = args[at + 1];
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "exits 2 for --tarballs or --version without a value, for a tarballs directory that does not exist, and for a root without a tokens version"
  return value === undefined || value === "" || value.startsWith("--") ? `${name} needs ${what}` : { value };
}

/** The release version of packages/tokens/package.json, if it names one. */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "exits 0 on the real workspace, building and packing the three packages, with one line per package at the version of packages/tokens/package.json"
async function tokensVersion(root: string): Promise<string | undefined> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "exits 0 on the real workspace, building and packing the three packages, with one line per package at the version of packages/tokens/package.json"
  const text = await readFile(join(root, "packages/tokens/package.json"), "utf8").catch(() => "{}");
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "exits 2 for --tarballs or --version without a value, for a tarballs directory that does not exist, and for a root without a tokens version"
  const version = (JSON.parse(text) as { version?: unknown }).version;
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "exits 2 for --tarballs or --version without a value, for a tarballs directory that does not exist, and for a root without a tokens version"
  return typeof version === "string" && version !== "" ? version : undefined;
}

/** Builds the packages and packs each into a new temporary directory; the directory, or the cause it could not. */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "exits 0 on the real workspace, building and packing the three packages, with one line per package at the version of packages/tokens/package.json"
async function buildAndPack(root: string, manifest: readonly PackEntry[], io: Io): Promise<{ readonly dir: string } | string> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "exits 2 naming the build on a copy of the workspace whose tokens build script exits non-zero"
  const built = await runTool("pnpm", build, root, io.env);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "exits 2 naming the build on a copy of the workspace whose tokens build script exits non-zero"
  if (built.exitCode !== 0) return `the build failed (pnpm ${build.join(" ")}, exit ${String(built.exitCode)})`;
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "exits 0 on the real workspace, building and packing the three packages, with one line per package at the version of packages/tokens/package.json"
  const dir = await mkdtemp(join(tmpdir(), "ocelle-pack-contents-"));
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "exits 0 on the real workspace, building and packing the three packages, with one line per package at the version of packages/tokens/package.json"
  for (const entry of manifest) {
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "exits 0 on the real workspace, building and packing the three packages, with one line per package at the version of packages/tokens/package.json"
    const packed = await runTool("pnpm", ["pack", "--pack-destination", dir], join(root, entry.dir), io.env);
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "exits 0 on the real workspace, building and packing the three packages, with one line per package at the version of packages/tokens/package.json"
    if (packed.exitCode !== 0) return `pnpm pack of ${entry.name} failed (exit ${String(packed.exitCode)})`;
  }
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "exits 0 on the real workspace, building and packing the three packages, with one line per package at the version of packages/tokens/package.json"
  return { dir };
}

/** The `*.tgz` files of a directory, in name order, with their bytes; or the cause the directory cannot be read. */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "with --tarballs reads the *.tgz files of the directory as given, against packages/tokens/package.json's version or --version"
async function tarballs(dir: string): Promise<TarballFile[] | string> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "with --tarballs reads the *.tgz files of the directory as given, against packages/tokens/package.json's version or --version"
  const names = await readdir(dir).catch((error: unknown) => `cannot read the tarballs directory ${dir} (${error instanceof Error ? error.message : String(error)})`);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "exits 2 for --tarballs or --version without a value, for a tarballs directory that does not exist, and for a root without a tokens version"
  if (typeof names === "string") return names;
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "with --tarballs reads the *.tgz files of the directory as given, against packages/tokens/package.json's version or --version"
  const files = names.filter((name) => name.endsWith(".tgz")).sort();
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "with --tarballs reads the *.tgz files of the directory as given, against packages/tokens/package.json's version or --version"
  return Promise.all(files.map(async (file) => ({ file, bytes: await readFile(join(dir, file)) })));
}

/** The repository files the identical entries name, by repository path; a file the root lacks is left out. */
// Stryker disable next-line all: process boundary, covered by gate:plants: gates/plants/pack-contents/fail-ofl-differs (the source of a { path, source } entry)
async function sources(root: string, manifest: readonly PackEntry[]): Promise<Map<string, Uint8Array>> {
  // Stryker disable next-line all: process boundary, covered by gate:plants: gates/plants/pack-contents/fail-ofl-differs (the source of a { path, source } entry)
  const paths = [...new Set(manifest.flatMap((entry) => entry.identical.map(({ source }) => source)))];
  // Stryker disable next-line all: process boundary, covered by gate:plants: gates/plants/pack-contents/fail-notice-differs (a root file the plant builder does not copy)
  const read = await Promise.all(paths.map(async (path) => [path, await readFile(join(root, path)).catch(() => undefined)] as const));
  // Stryker disable next-line all: process boundary, covered by gate:plants: gates/plants/pack-contents/fail-ofl-differs (the source of a { path, source } entry)
  return new Map(read.flatMap(([path, bytes]) => (bytes === undefined ? [] : [[path, bytes] as const])));
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "exits 0 on the real workspace, building and packing the three packages, with one line per package at the version of packages/tokens/package.json"
export async function run(argv: readonly string[], io: Io): Promise<number> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "exits 2 for --tarballs or --version without a value, for a tarballs directory that does not exist, and for a root without a tokens version"
  const cannot = (why: string): number => emit({ exit: 2, cause: `pack-contents: could not run: ${why}` }, io.out, io.err);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "exits 2 for --tarballs or --version without a value, for a tarballs directory that does not exist, and for a root without a tokens version"
  const { root, args } = parseArgs(argv, io.cwd);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "exits 2 for --tarballs or --version without a value, for a tarballs directory that does not exist, and for a root without a tokens version"
  const given = flag(args, "--tarballs", "a directory");
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "exits 2 for --tarballs or --version without a value, for a tarballs directory that does not exist, and for a root without a tokens version"
  if (typeof given === "string") return cannot(given);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "exits 2 for --tarballs or --version without a value, for a tarballs directory that does not exist, and for a root without a tokens version"
  const asked = flag(args, "--version", "a version");
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "exits 2 for --tarballs or --version without a value, for a tarballs directory that does not exist, and for a root without a tokens version"
  if (typeof asked === "string") return cannot(asked);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "exits 2 for a missing or invalid gates/release/pack-manifest.json, before reading any tarball"
  const text = await readFile(join(root, manifestPath), "utf8").catch(() => undefined);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "exits 2 for a missing or invalid gates/release/pack-manifest.json, before reading any tarball"
  if (text === undefined) return cannot(`${manifestPath} is missing`);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "exits 2 for a missing or invalid gates/release/pack-manifest.json, before reading any tarball"
  let manifest: PackEntry[];
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "exits 2 for a missing or invalid gates/release/pack-manifest.json, before reading any tarball"
  try {
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "exits 2 for a missing or invalid gates/release/pack-manifest.json, before reading any tarball"
    manifest = parsePackManifest(text);
  } catch (error) {
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "exits 2 for a missing or invalid gates/release/pack-manifest.json, before reading any tarball"
    return cannot(`${manifestPath} is invalid: ${error instanceof Error ? error.message : String(error)}`);
  }
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "with --tarballs reads the *.tgz files of the directory as given, against packages/tokens/package.json's version or --version"
  const version = asked.value ?? (await tokensVersion(root));
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "exits 2 for --tarballs or --version without a value, for a tarballs directory that does not exist, and for a root without a tokens version"
  if (version === undefined) return cannot("packages/tokens/package.json has no version; pass --version");
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "exits 0 on the real workspace, building and packing the three packages, with one line per package at the version of packages/tokens/package.json"
  const packed = given.value === undefined ? await buildAndPack(root, manifest, io) : { dir: resolve(io.cwd, given.value), given: true };
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "exits 2 naming the build on a copy of the workspace whose tokens build script exits non-zero"
  if (typeof packed === "string") return cannot(packed);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "exits 0 on the real workspace, building and packing the three packages, with one line per package at the version of packages/tokens/package.json"
  try {
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "with --tarballs reads the *.tgz files of the directory as given, against packages/tokens/package.json's version or --version"
    const files = await tarballs(packed.dir);
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "exits 2 for --tarballs or --version without a value, for a tarballs directory that does not exist, and for a root without a tokens version"
    if (typeof files === "string") return cannot(files);
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "with --tarballs reads the *.tgz files of the directory as given, against packages/tokens/package.json's version or --version"
    const judged = verdict({ manifest, tarballs: files, sources: await sources(root, manifest), version });
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "exits 0 on the real workspace, building and packing the three packages, with one line per package at the version of packages/tokens/package.json"
    for (const line of judged.lines) io.out(line);
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "with --tarballs reads the *.tgz files of the directory as given, against packages/tokens/package.json's version or --version"
    return emit(judged.result, io.out, io.err);
  } finally {
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "exits 0 on the real workspace, building and packing the three packages, with one line per package at the version of packages/tokens/package.json"
    if (!("given" in packed)) await rm(packed.dir, { recursive: true, force: true });
  }
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts "exits 0 on the real workspace, building and packing the three packages, with one line per package at the version of packages/tokens/package.json"
if (import.meta.main) await main(run);
