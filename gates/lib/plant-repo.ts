// Temporary repositories for plants (research.md R-10, contracts/plants.md): `repo-tree` lays a plant's `tree/` over
// the repository's configuration set (with the token source since 002, contracts/gates.md § Configuration set),
// `commit-repo` builds a git history from a plant's commits.txt on an empty signed-off base commit, and
// `mutation-repo` commits the configuration set with the plant's `base/`, then its `head/`. node_modules is linked from the repository in each. The decisions (configurationSet, packagePaths,
// carriesConfiguration, parseCommits, recordsOf, parentRecords, identityEnv, baseCommit, ignoreMissing) are pure and tested in
// process (gates/test/plant-repo.test.ts); the builders only copy files and run git with their results (the process
// boundary, tested by gates/test/integration/plant-repo.test.ts).
import { execFile } from "node:child_process";
import { cp, mkdir, readdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { promisify } from "node:util";
import type { TokenOverride } from "../../packages/tokens/src/generate.ts";
import { directoryNames, filePaths } from "./entries.ts";

/** One record of a commit plant's commits.txt. */
export interface CommitSpec {
  readonly author: string;
  readonly message: string;
  /** The record whose commit is the parent: 0 for the base commit; by default the record before it. */
  readonly parent?: number;
  /** For a merge record: the numbers of the two earlier records (0 for the base commit) it merges. */
  readonly merge?: readonly [number, number];
}

/** The root files of the configuration set (research.md R-10). */
const rootConfiguration = [
  "package.json",
  "pnpm-workspace.yaml",
  "tsconfig.base.json",
  "tsconfig.json",
  "eslint.config.ts",
  "eslint.test.config.ts",
  "stylelint.config.ts",
  "vitest.config.ts",
  "vitest.mutation.config.ts",
  "stryker.config.json",
];

/**
 * The token source, its overrides, the generator they import and the contrast pair list: repo-tree plants see the
 * real token source (002 contracts/gates.md § Configuration set; the unknown-token check of style-lint reads it).
 */
const tokenFiles = [
  "packages/tokens/src/source.ts",
  "packages/tokens/src/overrides.ts",
  "packages/tokens/src/generate.ts",
  "packages/tokens/contrast/pairs.json",
];

/** The configuration set copied into every temporary repository: these root files, plus per package dir. */
export function configurationSet(packageDirs: readonly string[]): string[] {
  return [
    ...rootConfiguration,
    ...packageDirs.flatMap((dir) => [`${dir}/package.json`, `${dir}/tsconfig.json`]),
    "gates/eslint",
    "gates/stylelint",
    ...tokenFiles,
  ];
}

/** File names that are gate configuration: tsconfig, ESLint, Stylelint, Vitest, Vite and Stryker files. */
const configurationName =
  /^(?:tsconfig.*\.json|eslint(?:\.[\w-]+)?\.config\.\w+|\.eslintrc.*|stylelint\.config\.\w+|\.stylelintrc.*|vitest(?:\.[\w-]+)?\.(?:config|workspace)\.\w+|vite(?:\.[\w-]+)?\.config\.\w+|stryker\.conf(?:ig)?\.\w+)$/;

/** The paths (relative to the plant) of the gate configuration files a plant carries. */
export function carriesConfiguration(paths: readonly string[]): string[] {
  return paths.filter((path) => configurationName.test(basename(path))).sort();
}

/** The package directories of the configuration set, by package directory name. */
export function packagePaths(names: readonly string[]): string[] {
  return names.map((name) => `packages/${name}`);
}

/** The records of a commits.txt text; throws naming the problem when a record is invalid. */
export function parseCommits(text: string): CommitSpec[] {
  const chunks = text.split(/^%%(?:\n|$)/m).filter((chunk) => chunk.trim() !== "");
  if (chunks.length === 0) throw new Error("commits.txt holds no record");
  return chunks.map((chunk, index) => {
    const number = index + 1;
    const at = `record ${String(number)}`;
    const lines = chunk.split("\n");
    const blank = lines.indexOf("");
    const head = blank === -1 ? lines : lines.slice(0, blank);
    const message = blank === -1 ? "" : lines.slice(blank + 1).join("\n").trim();
    let author: string | undefined;
    let parent: number | undefined;
    let merge: [number, number] | undefined;
    for (const line of head) {
      const header = /^([\w-]+): (.*)/.exec(line);
      if (header === null) throw new Error(`${at}: unknown header ${line}`);
      const [, key, value] = header as unknown as [string, string, string];
      if (key === "author") {
        if (!/^[^<>]+ <[^<>\s]+>$/.test(value)) throw new Error(`${at}: author must be Name <email>`);
        author = value;
      } else if (key === "parent") {
        parent = Number(value);
        if (!/^\d+$/.test(value) || parent >= number) throw new Error(`${at}: parent ${value} is not an earlier record`);
      } else if (key === "merge") {
        const [a, b, extra] = value.split(" ").map(Number);
        const earlier = (n: number | undefined): n is number => Number.isInteger(n) && Number(n) >= 0 && Number(n) < number;
        if (!earlier(a) || !earlier(b) || a === b || extra !== undefined) {
          throw new Error(`${at}: merge ${value} must name two different earlier records`);
        }
        merge = [a, b];
      } else {
        throw new Error(`${at}: unknown header ${key}`);
      }
    }
    if (author === undefined) throw new Error(`${at} has no author`);
    if (message === "") throw new Error(`${at} has no message`);
    return { author, message, ...(parent === undefined ? {} : { parent }), ...(merge === undefined ? {} : { merge }) };
  });
}

/** The records of a commit plant's commits.txt; none when the plant has no commits.txt (an empty range). */
export function recordsOf(text: string | undefined): CommitSpec[] {
  return text === undefined ? [] : parseCommits(text);
}

/** The records whose commits are a record's parents (0 is the base commit): its merge, its parent, or the one before. */
export function parentRecords(record: CommitSpec, index: number): readonly number[] {
  return record.merge ?? [record.parent ?? index];
}

/** The environment that makes `author` (a valid `Name <email>`) the author and committer of a commit. */
export function identityEnv(author: string): Record<string, string> {
  const at = author.lastIndexOf(" <");
  const name = author.slice(0, at);
  const email = author.slice(at + 2, -1);
  return { GIT_AUTHOR_NAME: name, GIT_AUTHOR_EMAIL: email, GIT_COMMITTER_NAME: name, GIT_COMMITTER_EMAIL: email };
}

/** The empty base commit of a commit plant: an invented RFC 2606 identity that signs it off (research.md R-10). */
export function baseCommit(): { readonly author: string; readonly message: string } {
  const author = "Plant Base <base@example.com>";
  return { author, message: `Plant base\n\nSigned-off-by: ${author}` };
}

/** The author of a mutation plant's two commits. */
export const mutationAuthor = "Plant Author <plant@example.com>";

/** Rethrows a file system error unless it says the file does not exist (a plant without that optional part). */
export function ignoreMissing(error: unknown): undefined {
  if ((error as { code?: unknown } | null)?.code !== "ENOENT") throw error;
  return undefined;
}

/** One pair-list change of a plant's delta.json, by key `(theme, fg, bg)` (002 contracts/gates.md § Plant deltas). */
export type PairChange =
  | { readonly key: readonly [string, string, string]; readonly set: Readonly<Record<string, unknown>> }
  | { readonly key: readonly [string, string, string]; readonly remove: true }
  | { readonly add: Readonly<Record<string, unknown>> };

/** A plant's delta.json (002 contracts/gates.md § Plant deltas). */
export interface Delta {
  readonly tokens?: readonly TokenOverride[];
  readonly pairs?: readonly PairChange[];
  /** The pair list's whole text, for a breaking plant whose input is a list that is not one (empty, unparsable). */
  readonly pairsText?: string;
  readonly generator?: "wrapped";
}

/** The delta of a delta.json text; throws naming the problem. */
export function parseDelta(text: string): Delta {
  throw new Error(`not implemented: parseDelta(${String(text.length)})`);
}

/** The problems of a plant's tree/ (paths relative to it) against its delta: files a plant changes only by delta. */
export function treeProblems(treePaths: readonly string[], delta: Delta | undefined): string[] {
  throw new Error(`not implemented: treeProblems(${String(treePaths.length)}, ${delta === undefined ? "no delta" : "a delta"})`);
}

/** Throws unless a plant's generate.ts re-exports the real generator, `./generate.real.ts`. */
export function checkWrapper(text: string): void {
  throw new Error(`not implemented: checkWrapper(${String(text.length)})`);
}

/** The pairs.json text with the changes applied by key, one entry per line; throws naming a key that matches no or two entries. */
export function applyPairChanges(text: string, changes: readonly PairChange[]): string {
  throw new Error(`not implemented: applyPairChanges(${String(text.length)}, ${String(changes.length)})`);
}

/** The text of an overrides.ts that exports the given token overrides, one per line. */
export function overridesText(tokens: readonly TokenOverride[]): string {
  throw new Error(`not implemented: overridesText(${String(tokens.length)})`);
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildCommitRepo makes an empty base commit signed off by Plant Base, then one commit per record, with real merges"
const run = promisify(execFile);

/** Runs git in `dir` with a fixed identity setup and returns its trimmed stdout. */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildCommitRepo makes an empty base commit signed off by Plant Base, then one commit per record, with real merges"
async function git(dir: string, args: readonly string[], env: Record<string, string> = {}): Promise<string> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildCommitRepo makes an empty base commit signed off by Plant Base, then one commit per record, with real merges"
  const { stdout } = await run("git", ["-c", "commit.gpgsign=false", ...args], { cwd: dir, env: { ...process.env, ...env } });
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildCommitRepo makes an empty base commit signed off by Plant Base, then one commit per record, with real merges"
  return stdout.trim();
}

/** Copies the configuration set of `repo` into `into` and links `repo`'s node_modules there. */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree copies the configuration set unchanged, lays tree/ over it at repository paths, and links node_modules"
async function copyConfiguration(repo: string, into: string): Promise<void> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree copies the configuration set unchanged, lays tree/ over it at repository paths, and links node_modules"
  const packages = packagePaths(directoryNames(await readdir(join(repo, "packages"), { withFileTypes: true })));
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree copies the configuration set unchanged, lays tree/ over it at repository paths, and links node_modules"
  for (const path of configurationSet(packages)) await cp(join(repo, path), join(into, path), { recursive: true });
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree copies the configuration set unchanged, lays tree/ over it at repository paths, and links node_modules"
  await symlink(join(repo, "node_modules"), join(into, "node_modules"), "dir");
}

/** Copies a plant's subdirectory (tree/, base/ or head/) over `into`, if the plant has one. */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree builds the configuration set alone for a plant without tree/"
async function layOver(plant: string, part: string, into: string): Promise<void> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree builds the configuration set alone for a plant without tree/"
  await cp(join(plant, part), into, { recursive: true }).catch(ignoreMissing);
}

/** Lays the configuration set of `repo` and the plant's `tree/` into `into`, and links `repo`'s node_modules. */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree copies the configuration set unchanged, lays tree/ over it at repository paths, and links node_modules"
export async function buildRepoTree(repo: string, plant: string, into: string): Promise<void> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree copies the configuration set unchanged, lays tree/ over it at repository paths, and links node_modules"
  await copyConfiguration(repo, into);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree copies the configuration set unchanged, lays tree/ over it at repository paths, and links node_modules"
  await layOver(plant, "tree", into);
}

/**
 * A git repository in `into`: an empty signed-off base commit, then one commit per record of the plant's commits.txt
 * (none when the plant has no commits.txt: HEAD is the base commit and the range base..HEAD is empty).
 */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildCommitRepo makes an empty base commit signed off by Plant Base, then one commit per record, with real merges"
export async function buildCommitRepo(plant: string, into: string): Promise<{ readonly base: string; readonly commits: readonly string[] }> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildCommitRepo makes an empty base commit signed off by Plant Base, then one commit per record, with real merges"
  const records = recordsOf(await readFile(join(plant, "commits.txt"), "utf8").catch(ignoreMissing));
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildCommitRepo makes an empty base commit signed off by Plant Base, then one commit per record, with real merges"
  await git(into, ["init", "-q", "-b", "main"]);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildCommitRepo makes an empty base commit signed off by Plant Base, then one commit per record, with real merges"
  const tree = await git(into, ["hash-object", "-t", "tree", "-w", "/dev/null"]);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildCommitRepo makes an empty base commit signed off by Plant Base, then one commit per record, with real merges"
  const { author, message } = baseCommit();
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildCommitRepo makes an empty base commit signed off by Plant Base, then one commit per record, with real merges"
  const hashes = [await git(into, ["commit-tree", tree, "-m", message], identityEnv(author))];
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildCommitRepo makes an empty base commit signed off by Plant Base, then one commit per record, with real merges"
  for (const [index, record] of records.entries()) {
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildCommitRepo makes an empty base commit signed off by Plant Base, then one commit per record, with real merges"
    const parentArgs = parentRecords(record, index).flatMap((parent) => ["-p", String(hashes[parent])]);
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildCommitRepo makes an empty base commit signed off by Plant Base, then one commit per record, with real merges"
    hashes.push(await git(into, ["commit-tree", tree, ...parentArgs, "-m", record.message], identityEnv(record.author)));
  }
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildCommitRepo makes an empty base commit signed off by Plant Base, then one commit per record, with real merges"
  await git(into, ["reset", "-q", "--hard", String(hashes.at(-1))]);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildCommitRepo makes an empty base commit signed off by Plant Base, then one commit per record, with real merges"
  return { base: String(hashes[0]), commits: hashes.slice(1) };
}

/** A git repository in `into`: the configuration set and the plant's `base/`, then a commit with its `head/`. */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildMutationRepo commits the configuration set with base/, then head/ (files only in base/ deleted), node_modules linked and untracked"
export async function buildMutationRepo(repo: string, plant: string, into: string): Promise<{ readonly base: string }> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildMutationRepo commits the configuration set with base/, then head/ (files only in base/ deleted), node_modules linked and untracked"
  const author = identityEnv(mutationAuthor);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildMutationRepo commits the configuration set with base/, then head/ (files only in base/ deleted), node_modules linked and untracked"
  await copyConfiguration(repo, into);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildMutationRepo commits the configuration set with base/, then head/ (files only in base/ deleted), node_modules linked and untracked"
  await layOver(plant, "base", into);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildMutationRepo commits the configuration set with base/, then head/ (files only in base/ deleted), node_modules linked and untracked"
  await git(into, ["init", "-q", "-b", "main"]);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildMutationRepo commits the configuration set with base/, then head/ (files only in base/ deleted), node_modules linked and untracked"
  await mkdir(join(into, ".git", "info"), { recursive: true });
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildMutationRepo commits the configuration set with base/, then head/ (files only in base/ deleted), node_modules linked and untracked"
  await writeFile(join(into, ".git", "info", "exclude"), "node_modules\nreports/\n.stryker-tmp/\n");
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildMutationRepo commits the configuration set with base/, then head/ (files only in base/ deleted), node_modules linked and untracked"
  await git(into, ["add", "-A"]);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildMutationRepo commits the configuration set with base/, then head/ (files only in base/ deleted), node_modules linked and untracked"
  await git(into, ["commit", "-q", "-m", "Plant base"], author);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildMutationRepo commits the configuration set with base/, then head/ (files only in base/ deleted), node_modules linked and untracked"
  const baseCommit = await git(into, ["rev-parse", "HEAD"]);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildMutationRepo commits the configuration set with base/, then head/ (files only in base/ deleted), node_modules linked and untracked"
  const base = join(plant, "base");
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildMutationRepo commits the configuration set with base/, then head/ (files only in base/ deleted), node_modules linked and untracked"
  for (const path of filePaths(await readdir(base, { recursive: true, withFileTypes: true }).catch(() => []), base)) await rm(join(into, path), { force: true });
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildMutationRepo commits the configuration set with base/, then head/ (files only in base/ deleted), node_modules linked and untracked"
  await layOver(plant, "head", into);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildMutationRepo commits the configuration set with base/, then head/ (files only in base/ deleted), node_modules linked and untracked"
  await git(into, ["add", "-A"]);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildMutationRepo commits the configuration set with base/, then head/ (files only in base/ deleted), node_modules linked and untracked"
  await git(into, ["commit", "-q", "--allow-empty", "-m", "Plant head"], author);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildMutationRepo commits the configuration set with base/, then head/ (files only in base/ deleted), node_modules linked and untracked"
  return { base: baseCommit };
}
