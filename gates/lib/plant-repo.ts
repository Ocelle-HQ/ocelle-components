// Temporary repositories for plants (research.md R-10, contracts/plants.md): `repo-tree` lays a plant's `tree/` over
// the repository's configuration set, `commit-repo` builds a git history from a plant's commits.txt on an empty
// signed-off base commit, and `mutation-repo` commits the configuration set with the plant's `base/`, then its
// `head/`. node_modules is linked from the repository in each. configurationSet, carriesConfiguration and
// parseCommits are pure and tested in process; the builders only copy files and run git (the process boundary,
// tested by gates/test/integration/plant-repo.test.ts).
import { execFile } from "node:child_process";
import { cp, mkdir, readdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { promisify } from "node:util";

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

/** The configuration set copied into every temporary repository: these root files, plus per package dir. */
export function configurationSet(packageDirs: readonly string[]): string[] {
  return [
    ...rootConfiguration,
    ...packageDirs.flatMap((dir) => [`${dir}/package.json`, `${dir}/tsconfig.json`]),
    "gates/eslint",
    "gates/stylelint",
  ];
}

/** File names that are gate configuration: tsconfig, ESLint, Stylelint, Vitest, Vite and Stryker files. */
const configurationName =
  /^(?:tsconfig.*\.json|eslint(?:\.[\w-]+)?\.config\.\w+|\.eslintrc.*|stylelint\.config\.\w+|\.stylelintrc.*|vitest(?:\.[\w-]+)?\.(?:config|workspace)\.\w+|vite(?:\.[\w-]+)?\.config\.\w+|stryker\.conf(?:ig)?\.\w+)$/;

/** The paths (relative to the plant) of the gate configuration files a plant carries. */
export function carriesConfiguration(paths: readonly string[]): string[] {
  return paths.filter((path) => configurationName.test(basename(path))).sort();
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
      const [, key = "", value = ""] = /^([\w-]+): (.*)$/.exec(line) ?? [];
      if (key === "author") {
        if (!/^[^<>]+ <[^<>\s]+>$/.test(value)) throw new Error(`${at}: author must be Name <email>`);
        author = value;
      } else if (key === "parent") {
        parent = Number(value);
        if (!/^\d+$/.test(value) || parent >= number) throw new Error(`${at}: parent ${value} is not an earlier record`);
      } else if (key === "merge") {
        const [a, b, extra] = value.split(" ").map(Number);
        const earlier = (n: number | undefined): n is number => n !== undefined && Number.isInteger(n) && n >= 0 && n < number;
        if (!earlier(a) || !earlier(b) || a === b || extra !== undefined) {
          throw new Error(`${at}: merge ${value} must name two different earlier records`);
        }
        merge = [a, b];
      } else {
        throw new Error(`${at}: unknown header ${key === "" ? line : key}`);
      }
    }
    if (author === undefined) throw new Error(`${at} has no author`);
    if (message === "") throw new Error(`${at} has no message`);
    return { author, message, ...(parent === undefined ? {} : { parent }), ...(merge === undefined ? {} : { merge }) };
  });
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

/** The environment that makes `author` (`Name <email>`) the author and committer of a commit. */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildCommitRepo makes an empty base commit signed off by Plant Base, then one commit per record, with real merges"
function as(author: string): Record<string, string> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildCommitRepo makes an empty base commit signed off by Plant Base, then one commit per record, with real merges"
  const [, name = "", email = ""] = /^(.*) <(.*)>$/.exec(author) ?? [];
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildCommitRepo makes an empty base commit signed off by Plant Base, then one commit per record, with real merges"
  return { GIT_AUTHOR_NAME: name, GIT_AUTHOR_EMAIL: email, GIT_COMMITTER_NAME: name, GIT_COMMITTER_EMAIL: email };
}

/** Copies the configuration set of `repo` into `into` and links `repo`'s node_modules there. */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree copies the configuration set unchanged, lays tree/ over it at repository paths, and links node_modules"
async function copyConfiguration(repo: string, into: string): Promise<void> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree copies the configuration set unchanged, lays tree/ over it at repository paths, and links node_modules"
  const packages = (await readdir(join(repo, "packages"), { withFileTypes: true })).filter((entry) => entry.isDirectory());
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree copies the configuration set unchanged, lays tree/ over it at repository paths, and links node_modules"
  for (const path of configurationSet(packages.map((entry) => `packages/${entry.name}`))) {
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree copies the configuration set unchanged, lays tree/ over it at repository paths, and links node_modules"
    await cp(join(repo, path), join(into, path), { recursive: true });
  }
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree copies the configuration set unchanged, lays tree/ over it at repository paths, and links node_modules"
  await symlink(join(repo, "node_modules"), join(into, "node_modules"), "dir");
}

/** Copies a plant's subdirectory (tree/, base/ or head/) over `into`, if the plant has one. */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree builds the configuration set alone for a plant without tree/"
async function layOver(plant: string, part: string, into: string): Promise<void> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree builds the configuration set alone for a plant without tree/"
  await cp(join(plant, part), into, { recursive: true }).catch((error: unknown) => {
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree builds the configuration set alone for a plant without tree/"
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  });
}

/** Lays the configuration set of `repo` and the plant's `tree/` into `into`, and links `repo`'s node_modules. */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree copies the configuration set unchanged, lays tree/ over it at repository paths, and links node_modules"
export async function buildRepoTree(repo: string, plant: string, into: string): Promise<void> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree copies the configuration set unchanged, lays tree/ over it at repository paths, and links node_modules"
  await copyConfiguration(repo, into);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree copies the configuration set unchanged, lays tree/ over it at repository paths, and links node_modules"
  await layOver(plant, "tree", into);
}

const base = "Plant Base <base@example.com>";

/**
 * A git repository in `into`: an empty signed-off base commit, then one commit per record of the plant's commits.txt
 * (none when the plant has no commits.txt).
 */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildCommitRepo makes an empty base commit signed off by Plant Base, then one commit per record, with real merges"
export async function buildCommitRepo(plant: string, into: string): Promise<{ readonly base: string; readonly commits: readonly string[] }> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildCommitRepo makes an empty base commit signed off by Plant Base, then one commit per record, with real merges"
  const text = await readFile(join(plant, "commits.txt"), "utf8").catch((error: unknown) => {
    // Stryker disable next-line all: process boundary, covered by the plant job: gates/plants/signoff/error-empty-range has no commits.txt
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  });
  // A plant without commits.txt has no record: HEAD is the base commit and the range base..HEAD is empty.
  // Stryker disable next-line all: process boundary, covered by the plant job: gates/plants/signoff/error-empty-range has no commits.txt
  const records = text === undefined ? [] : parseCommits(text);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildCommitRepo makes an empty base commit signed off by Plant Base, then one commit per record, with real merges"
  await git(into, ["init", "-q", "-b", "main"]);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildCommitRepo makes an empty base commit signed off by Plant Base, then one commit per record, with real merges"
  const tree = await git(into, ["hash-object", "-t", "tree", "-w", "/dev/null"]);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildCommitRepo makes an empty base commit signed off by Plant Base, then one commit per record, with real merges"
  const hashes = [await git(into, ["commit-tree", tree, "-m", `Plant base\n\nSigned-off-by: ${base}`], as(base))];
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildCommitRepo makes an empty base commit signed off by Plant Base, then one commit per record, with real merges"
  for (const [index, record] of records.entries()) {
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildCommitRepo makes an empty base commit signed off by Plant Base, then one commit per record, with real merges"
    const parents = record.merge ?? [record.parent ?? index];
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildCommitRepo makes an empty base commit signed off by Plant Base, then one commit per record, with real merges"
    const parentArgs = parents.flatMap((parent) => ["-p", String(hashes[parent])]);
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildCommitRepo makes an empty base commit signed off by Plant Base, then one commit per record, with real merges"
    hashes.push(await git(into, ["commit-tree", tree, ...parentArgs, "-m", record.message], as(record.author)));
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
  const author = as("Plant Author <plant@example.com>");
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
  const files = (await readdir(join(plant, "base"), { recursive: true, withFileTypes: true }).catch(() => [])).filter((entry) => entry.isFile());
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildMutationRepo commits the configuration set with base/, then head/ (files only in base/ deleted), node_modules linked and untracked"
  for (const file of files) await rm(join(into, join(file.parentPath, file.name).slice(join(plant, "base").length)), { force: true });
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildMutationRepo commits the configuration set with base/, then head/ (files only in base/ deleted), node_modules linked and untracked"
  await layOver(plant, "head", into);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildMutationRepo commits the configuration set with base/, then head/ (files only in base/ deleted), node_modules linked and untracked"
  await git(into, ["add", "-A"]);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildMutationRepo commits the configuration set with base/, then head/ (files only in base/ deleted), node_modules linked and untracked"
  await git(into, ["commit", "-q", "--allow-empty", "-m", "Plant head"], author);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildMutationRepo commits the configuration set with base/, then head/ (files only in base/ deleted), node_modules linked and untracked"
  return { base: baseCommit };
}
