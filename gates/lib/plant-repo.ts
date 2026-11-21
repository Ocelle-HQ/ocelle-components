// Temporary repositories for plants (research.md R-10, contracts/plants.md): `repo-tree` lays a plant's `tree/` over
// the repository's configuration set (with the token source since 002, contracts/gates.md § Configuration set),
// `commit-repo` builds a git history from a plant's commits.txt on an empty signed-off base commit, and
// `mutation-repo` commits the configuration set with the plant's `base/`, then its `head/`, and since op 023
// `tracked-tree` commits the plant's `tree/` alone, its sandbox markers expanded (expandMarkers). node_modules is linked from
// the repository in each but a tracked-tree root. A repo-tree plant may state its change of the token source, the pair list or the generator
// in a delta.json, by key (002 contracts/gates.md § Configuration set, *Plant deltas*). Since 006 (research.md R-16)
// the configuration set holds the Storybook workspace, storybook/node_modules is linked as well (unless plant.json
// lists it in `unlinked`), and a repo-tree root gets its own storybook/a11y-exceptions.json (with the repository's
// entries and their plan files for delta.json `exceptions: "repository"`). The decisions (configurationSet,
// packagePaths, carriesConfiguration, parseCommits, recordsOf, parentRecords, identityEnv, baseCommit, ignoreMissing,
// parseDelta, treeProblems, moduleLinks, exceptionPlans, rootExceptions, checkWrapper, applyPairChanges,
// overridesText, expandMarkers) are pure and tested in process (gates/test/plant-repo.test.ts); the builders only copy and write
// files and run git with their results (the process boundary, tested by gates/test/integration/plant-repo.test.ts).
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { cp, mkdir, readdir, readFile, realpath, rename, rm, symlink, writeFile } from "node:fs/promises";
import { basename, dirname, join, posix } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import type { TokenOverride } from "../../packages/tokens/src/generate.ts";
import { directoryNames, filePaths } from "./entries.ts";
import type { Plant } from "./plant-judge.ts";
import { decode, encode } from "./png.ts";

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
  // The element mutation configuration (005 research.md R-12).
  "stryker.elements.config.json",
  "vitest.mutation.elements.config.ts",
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

/**
 * The element files the manifest gate and the element plants read (005 research.md R-12): the element source, the
 * manifest script, its analyzer configuration and the committed manifest. The last three land with the manifest
 * generator (005 phase 2) and may be absent until then.
 */
const elementFiles = ["packages/elements/src"];
const optionalElementFiles = [
  "packages/elements/scripts/manifest.ts",
  "packages/elements/custom-elements-manifest.config.mjs",
  "packages/elements/custom-elements.json",
];

/**
 * The Storybook workspace inputs (006 research.md R-16): the Node pin, the base stylesheet and the fonts the stories
 * read, and the workspace's manifest, configuration, scripts, stories, baselines and container pin; never its dist/,
 * .generated/, .visual/, .cache/, test/ or node_modules/. Its exceptions file is made per root (rootExceptions).
 */
const storybookFiles = [
  ".node-version",
  "packages/styles/src/base.css",
  "packages/tokens/fonts",
  "storybook/package.json",
  "storybook/.storybook",
  "storybook/scripts",
  "storybook/stories",
  "storybook/baselines",
  "storybook/visual/container.json",
];

/** The parts of the configuration set a repository may not hold yet: copied when present. */
const optionalConfiguration = new Set(["storybook/baselines"]);

/** The configuration set copied into every temporary repository: these root files, plus per package dir. */
export function configurationSet(packageDirs: readonly string[]): string[] {
  return [
    ...rootConfiguration,
    ...packageDirs.flatMap((dir) => [`${dir}/package.json`, `${dir}/tsconfig.json`]),
    "gates/eslint",
    "gates/stylelint",
    ...tokenFiles,
    ...elementFiles,
    ...optionalElementFiles,
    ...storybookFiles,
  ];
}

/** Whether a configuration-set entry may be absent from the repository, and is then not copied (005 research.md R-12). */
export function mayBeAbsent(path: string): boolean {
  return optionalElementFiles.includes(path) || optionalConfiguration.has(path);
}

/**
 * The node_modules directories linked into a temporary repository: the root's and each package's own, so a dependency
 * of one package only (lit, of @ocelle/elements) resolves for its source (005 research.md R-12).
 */
export function nodeModulesLinks(packageDirs: readonly string[]): string[] {
  return ["node_modules", ...packageDirs.map((dir) => `${dir}/node_modules`)];
}

/** File names that are gate configuration: tsconfig, ESLint, Stylelint, Vitest, Vite and Stryker files. */
const configurationName =
  /^(?:tsconfig.*\.json|eslint(?:\.[\w-]+)?\.config\.\w+|\.eslintrc.*|stylelint\.config\.\w+|\.stylelintrc.*|vitest(?:\.[\w-]+)*\.(?:config|workspace)\.\w+|vite(?:\.[\w-]+)?\.config\.\w+|stryker(?:\.[\w-]+)?\.conf(?:ig)?\.\w+)$/;

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

/** The closed `pairsList` part of a delta.json: which fixed text replaces the pair list. */
export type PairsList = "empty" | "not-json";

/**
 * The text each `pairsList` value writes as the pair list (002 contracts/gates.md § Configuration set): an empty JSON
 * list, or an opening `[` and one entry cut off after `"theme":"light",`, which does not parse as JSON.
 */
export const pairsListTexts: Readonly<Record<PairsList, string>> = {
  empty: "[]\n",
  "not-json": '[\n  {"theme":"light",\n',
};

/** A plant's delta.json (002 contracts/gates.md § Plant deltas). */
export interface Delta {
  readonly tokens?: readonly TokenOverride[];
  readonly pairs?: readonly PairChange[];
  /**
   * Replaces the whole pair list with one fixed text, for a breaking plant whose input is a list that cannot be checked
   * (operator decision R1-01 (c)): closed, so no plant carries a copy of the list or any other free text.
   */
  readonly pairsList?: PairsList;
  readonly generator?: "wrapped";
  /** The repository's exception entries and the plan files they name, added to the root's (006 research.md R-16). */
  readonly exceptions?: "repository";
  /** Edits of repository baselines, applied to the current files when the root is made (006 research.md R-11). */
  readonly baselines?: readonly BaselineEdit[];
  /**
   * Removes the committed custom-elements manifest, which the configuration set copies, for the manifest gate's
   * breaking plant break-missing (005 research.md R-06, R-12): closed, its one value is "absent".
   */
  readonly manifest?: "absent";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Whether a value has the shape of one token override (data-model.md § Token overrides); its names are checked on load. */
function isTokenOverride(value: unknown): boolean {
  if (!isObject(value)) return false;
  if ("add" in value) return isObject(value.add) && typeof value.add.name === "string";
  if ("remove" in value) return typeof value.remove === "string";
  return typeof value.token === "string";
}

/** Whether a value is one pair change: `{ key, set }`, `{ key, remove: true }` or `{ add }`. */
function isPairChange(value: unknown): boolean {
  if (!isObject(value)) return false;
  if ("add" in value) return isObject(value.add);
  const { key } = value;
  if (!Array.isArray(key) || key.length !== 3 || !key.every((part) => typeof part === "string")) return false;
  return "set" in value ? isObject(value.set) && !("remove" in value) : value.remove === true;
}

const deltaKeys = new Set(["tokens", "pairs", "pairsList", "generator", "manifest", "exceptions", "baselines"]);
const baselineEdits = ["one-pixel", "reencode", "remove"];

/** Whether a value is one baseline edit: exactly a non-empty `file` and a known `edit`. */
function isBaselineEdit(value: unknown): boolean {
  if (!isObject(value) || Object.keys(value).length !== 2) return false;
  return typeof value.file === "string" && value.file !== "" && baselineEdits.includes(String(value.edit));
}

/** The delta of a delta.json text; throws naming the problem. */
export function parseDelta(text: string): Delta {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    throw new Error(`delta.json is not valid JSON (${error instanceof Error ? error.message : String(error)})`, { cause: error });
  }
  if (!isObject(value)) throw new Error("delta.json is not an object");
  const unknown = Object.keys(value).find((key) => !deltaKeys.has(key));
  if (unknown !== undefined) throw new Error(`delta.json: unknown key ${unknown}`);
  const { tokens, pairs, pairsList, generator, manifest } = value;
  if (tokens !== undefined) {
    if (!Array.isArray(tokens)) throw new Error("delta.json: tokens must be a list of token overrides");
    const bad = tokens.findIndex((item) => !isTokenOverride(item));
    if (bad !== -1) throw new Error(`delta.json: tokens[${String(bad)}] is not a token override`);
  }
  if (pairs !== undefined) {
    if (!Array.isArray(pairs)) throw new Error("delta.json: pairs must be a list of pair changes");
    const bad = pairs.findIndex((item) => !isPairChange(item));
    if (bad !== -1) throw new Error(`delta.json: pairs[${String(bad)}] is not a pair change`);
  }
  if (pairsList !== undefined && pairsList !== "empty" && pairsList !== "not-json") {
    throw new Error('delta.json: pairsList must be "empty" or "not-json"');
  }
  if (pairs !== undefined && pairsList !== undefined) throw new Error("delta.json: pairs and pairsList exclude each other");
  if (generator !== undefined && generator !== "wrapped") throw new Error('delta.json: generator must be "wrapped"');
  if (manifest !== undefined && manifest !== "absent") throw new Error('delta.json: manifest must be "absent"');
  if (value.exceptions !== undefined && value.exceptions !== "repository") throw new Error('delta.json: exceptions must be "repository"');
  const { baselines } = value;
  if (baselines !== undefined) {
    if (!Array.isArray(baselines)) throw new Error("delta.json: baselines must be a list of baseline edits");
    const bad = baselines.findIndex((item) => !isBaselineEdit(item));
    if (bad !== -1) throw new Error(`delta.json: baselines[${String(bad)}] is not a baseline edit (a file and one-pixel, reencode or remove)`);
    const files = (baselines as BaselineEdit[]).map((item) => item.file);
    const twice = files.find((file, index) => files.indexOf(file) !== index);
    if (twice !== undefined) throw new Error(`delta.json: baselines lists ${twice} twice`);
  }
  return value;
}

const sourceFile = "packages/tokens/src/source.ts";
const overridesFile = "packages/tokens/src/overrides.ts";
const generatorFile = "packages/tokens/src/generate.ts";
const pairsFile = "packages/tokens/contrast/pairs.json";
// Stryker disable next-line StringLiteral: process boundary, read only by the builders; covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree: the Storybook workspace (006 research.md R-16) writes storybook/a11y-exceptions.json as [] when the tree supplies none, and keeps the tree's own"
const exceptionsFile = "storybook/a11y-exceptions.json";
const baselinesDir = "storybook/baselines";
const manifestFile = "packages/elements/custom-elements.json";

/** The problems of a plant's tree/ (paths relative to it) against its delta: files a plant changes only by delta. */
export function treeProblems(treePaths: readonly string[], delta: Delta | undefined, repositoryBaselines: readonly string[]): string[] {
  const holds = new Set(treePaths);
  const problems: string[] = [];
  if (holds.has(sourceFile)) problems.push(`tree/ holds ${sourceFile}; a plant changes the token source by delta.json tokens`);
  if (holds.has(pairsFile)) problems.push(`tree/ holds ${pairsFile}; a plant changes the pair list by delta.json pairs`);
  const wrapped = delta?.generator === "wrapped";
  if (holds.has(generatorFile) && !wrapped) problems.push(`tree/ holds ${generatorFile} without generator "wrapped" in delta.json`);
  if (!holds.has(generatorFile) && wrapped) problems.push(`delta.json sets generator "wrapped" but tree/ holds no ${generatorFile}`);
  if (holds.has(overridesFile) && delta?.tokens !== undefined) {
    problems.push(`tree/ holds ${overridesFile} and delta.json has tokens; one of them sets the overrides`);
  }
  for (const name of repositoryBaselines) {
    const path = `${baselinesDir}/${name}`;
    if (holds.has(path)) problems.push(`tree/ holds ${path}; a plant changes a repository baseline by delta.json baselines`);
  }
  for (const { file } of delta?.baselines ?? []) {
    if (!repositoryBaselines.includes(file)) problems.push(`delta.json baselines: ${file} is not a repository baseline`);
  }
  if (holds.has(manifestFile) && delta?.manifest === "absent") problems.push(`tree/ holds ${manifestFile} and delta.json removes it with manifest "absent"`);
  return problems;
}

/** The node_modules links of a plant root (paths relative to it), without the ones the plant lists as unlinked. */
export function moduleLinks(unlinked: readonly string[] | undefined): string[] {
  const links = ["node_modules", "storybook/node_modules"];
  return unlinked === undefined ? links : links.filter((link) => !unlinked.includes(link));
}

/** The entries of an a11y-exceptions.json text, or throws naming whose file it is when it is not a JSON list. */
function exceptionEntries(text: string, whose: string): unknown[] {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    throw new Error(`${whose} storybook/a11y-exceptions.json is not a JSON list`, { cause: error });
  }
  if (!Array.isArray(value)) throw new Error(`${whose} storybook/a11y-exceptions.json is not a JSON list`);
  return value;
}

/** The plan files the entries of an a11y-exceptions.json text name, each once, in order; throws naming the problem. */
export function exceptionPlans(text: string): string[] {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    throw new Error(`a11y-exceptions.json is not valid JSON (${error instanceof Error ? error.message : String(error)})`, { cause: error });
  }
  if (!Array.isArray(value)) throw new Error("a11y-exceptions.json is not a list of exception entries");
  const plans: string[] = [];
  for (const [index, entry] of (value as unknown[]).entries()) {
    const plan = isObject(entry) ? entry.plan : undefined;
    const at = `a11y-exceptions.json#${String(index)}`;
    if (typeof plan !== "string" || plan === "") throw new Error(`${at} names no plan`);
    const inside = posix.normalize(plan);
    if (posix.isAbsolute(plan) || inside === ".." || inside.startsWith("../")) throw new Error(`${at}: plan ${plan} is not a path inside the root`);
    if (!plans.includes(plan)) plans.push(plan);
  }
  return plans;
}

/**
 * The text of a plant root's storybook/a11y-exceptions.json from the tree's file (undefined: none) and, for
 * `exceptions: "repository"`, the repository's file (undefined: the key is not set): the tree's file as it is, or
 * `[]`, without the key; with it the tree's entries, then the repository's, so a plant's own `#<index>` locations do
 * not move.
 */
export function rootExceptions(tree: string | undefined, repository: string | undefined): string {
  if (repository === undefined) return tree ?? "[]\n";
  const own = tree === undefined ? [] : exceptionEntries(tree, "the plant's");
  return `${JSON.stringify([...own, ...exceptionEntries(repository, "the repository's")], null, 2)}\n`;
}

/** An edit of a repository baseline by a plant's delta.json `baselines` (006 research.md R-11). */
export interface BaselineEdit {
  readonly file: string;
  readonly edit: "one-pixel" | "reencode" | "remove";
}

/**
 * A repository baseline's bytes after a `one-pixel` edit (the RGB channels of the pixel at (0, 0) inverted, written
 * normalised) or a `reencode` (the same pixels at deflate level 1; throws when the bytes come out equal).
 */
export function editBaseline(bytes: Uint8Array, edit: "one-pixel" | "reencode"): Buffer {
  const image = decode(bytes);
  if (edit === "reencode") {
    const reencoded = encode(image, 1);
    if (reencoded.equals(Buffer.from(bytes))) throw new Error("delta.json baselines: reencode gives the baseline's own bytes");
    return reencoded;
  }
  const data = Uint8Array.from(image.data);
  for (let channel = 0; channel < 3; channel += 1) data[channel] = 255 - Number(data[channel]);
  return encode({ ...image, data });
}

/** Throws unless a plant's generate.ts re-exports the real generator, `./generate.real.ts`. */
export function checkWrapper(text: string): void {
  if (/^export \* from (["'])\.\/generate\.real\.ts\1/m.test(text)) return;
  throw new Error(`${generatorFile} of a wrapped generator must re-export the real one: export * from "./generate.real.ts"`);
}

/** A pair list's text, one entry per line (data-model.md § Contrast pair). */
function formatPairs(entries: readonly unknown[]): string {
  return entries.length === 0 ? "[]\n" : `[\n${entries.map((entry) => `  ${JSON.stringify(entry)}`).join(",\n")}\n]\n`;
}

/** The pairs.json text with the changes applied by key, one entry per line; throws naming a key that matches no or two entries. */
export function applyPairChanges(text: string, changes: readonly PairChange[]): string {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    throw new Error(`pairs.json is not valid JSON (${error instanceof Error ? error.message : String(error)})`, { cause: error });
  }
  if (!Array.isArray(value)) throw new Error("pairs.json is not a list");
  let entries = value as Record<string, unknown>[];
  for (const change of changes) {
    if ("add" in change) {
      entries = [...entries, change.add];
      continue;
    }
    const [theme, fg, bg] = change.key;
    const matches = (entry: Record<string, unknown>): boolean => entry.theme === theme && entry.fg === fg && entry.bg === bg;
    const count = entries.filter(matches).length;
    const key = change.key.join("/");
    if (count === 0) throw new Error(`delta.json pairs: key ${key} matches no entry`);
    if (count > 1) throw new Error(`delta.json pairs: key ${key} matches ${String(count)} entries`);
    entries = "set" in change ? entries.map((entry) => (matches(entry) ? { ...entry, ...change.set } : entry)) : entries.filter((entry) => !matches(entry));
  }
  return formatPairs(entries);
}

/** The text of an overrides.ts that exports the given token overrides, one per line. */
export function overridesText(tokens: readonly TokenOverride[]): string {
  return [
    "// Token overrides written by the plant runner from the plant's delta.json (002 contracts/gates.md § Plant deltas).",
    'import type { TokenOverride } from "./generate.ts";',
    "",
    "export const overrides: readonly TokenOverride[] = [",
    ...tokens.map((token) => `  ${JSON.stringify(token)},`),
    "];",
    "",
  ].join("\n");
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

/**
 * Copies the configuration set of `repo` into `into` (an entry that may be absent is skipped when it is) and links
 * `repo`'s node_modules there: the root's, each package's own that exists, and storybook/node_modules unless unlinked.
 */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree copies the configuration set unchanged, lays tree/ over it at repository paths, and links node_modules"
async function copyConfiguration(repo: string, into: string, unlinked?: readonly string[]): Promise<void> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree copies the configuration set unchanged, lays tree/ over it at repository paths, and links node_modules"
  const packages = packagePaths(directoryNames(await readdir(join(repo, "packages"), { withFileTypes: true })));
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree copies the configuration set unchanged, lays tree/ over it at repository paths, and links node_modules"
  for (const path of configurationSet(packages)) {
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree copies the configuration set unchanged, lays tree/ over it at repository paths, and links node_modules"
    const copied = cp(join(repo, path), join(into, path), { recursive: true });
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "rejects building from a repository root without %s, naming it" and "builds from a repository root without the element files that may be absent, leaving them out", and "buildRepoTree: the Storybook workspace (006 research.md R-16) copies storybook/baselines when the repository holds it"
    await (mayBeAbsent(path) ? copied.catch(ignoreMissing) : copied);
  }
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree copies the configuration set unchanged, lays tree/ over it at repository paths, and links node_modules"
  for (const path of nodeModulesLinks(packages)) {
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "links the node_modules of a package that has its own, and none for a package without"
    if (path !== "node_modules" && !existsSync(join(repo, path))) continue;
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree copies the configuration set unchanged, lays tree/ over it at repository paths, and links node_modules"
    await symlink(join(repo, path), join(into, path), "dir");
  }
  // The Storybook workspace's node_modules, by its real path, unless the plant lists it as unlinked (006 research.md R-16).
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree: the Storybook workspace (006 research.md R-16) removes only the storybook/node_modules link for unlinked ["storybook/node_modules"]"
  for (const path of moduleLinks(unlinked).filter((link) => link !== "node_modules")) {
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree: the Storybook workspace (006 research.md R-16) links storybook/node_modules to the real path of the repository's, beside node_modules"
    const target = (await realpath(join(repo, path)).catch(ignoreMissing)) ?? join(repo, path);
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree: the Storybook workspace (006 research.md R-16) links storybook/node_modules to the real path of the repository's, beside node_modules"
    await symlink(target, join(into, path), "dir");
  }
}

/** Copies a plant's subdirectory (tree/, base/ or head/) over `into`, if the plant has one. */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree builds the configuration set alone for a plant without tree/"
async function layOver(plant: string, part: string, into: string): Promise<void> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree builds the configuration set alone for a plant without tree/"
  await cp(join(plant, part), into, { recursive: true }).catch(ignoreMissing);
}

/** The plant's delta.json, if it has one, checked against its tree/ and the repository's baselines (the plant job's check of the plant's files). */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "copies the configuration set unchanged, lays tree/ over it at repository paths, and links node_modules"
async function readDelta(plant: string, repositoryBaselines: readonly string[]): Promise<Delta | undefined> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "copies the configuration set unchanged, lays tree/ over it at repository paths, and links node_modules"
  const text = await readFile(join(plant, "delta.json"), "utf8").catch(ignoreMissing);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "fails to build $plant, naming the key or file"
  const delta = text === undefined ? undefined : parseDelta(text);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "copies the configuration set unchanged, lays tree/ over it at repository paths, and links node_modules"
  const tree = join(plant, "tree");
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "copies the configuration set unchanged, lays tree/ over it at repository paths, and links node_modules"
  const problems = treeProblems(filePaths(await readdir(tree, { recursive: true, withFileTypes: true }).catch(() => []), tree), delta, repositoryBaselines);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "fails to build $plant, naming the key or file"
  if (problems.length > 0) throw new Error(problems.join("; "));
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "copies the configuration set unchanged, lays tree/ over it at repository paths, and links node_modules"
  return delta;
}

/**
 * Applies a delta's token overrides, pair changes or pair list replacement over the tree in `into`, removes the
 * committed manifest for `manifest: "absent"`, and checks a wrapper.
 */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "writes the delta's token overrides as overrides.ts and applies its pair changes by key, one entry per line"
async function applyDelta(delta: Delta, into: string): Promise<void> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts 'removes the committed manifest for manifest "absent", and keeps it without the part'
  if (delta.manifest === "absent") await rm(join(into, manifestFile), { force: true });
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "moves the real generator to generate.real.ts and places the plant's wrapper for generator wrapped (and not without a delta)"
  if (delta.generator === "wrapped") checkWrapper(await readFile(join(into, generatorFile), "utf8"));
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "writes the delta's token overrides as overrides.ts and applies its pair changes by key, one entry per line"
  if (delta.tokens !== undefined) {
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "writes the delta's token overrides as overrides.ts and applies its pair changes by key, one entry per line"
    await writeFile(join(into, overridesFile), overridesText(delta.tokens));
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "fails to build $plant, naming the key or file"
    await import(pathToFileURL(join(into, sourceFile)).href).catch((error: unknown) => {
      // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "fails to build $plant, naming the key or file"
      throw new Error(`delta.json tokens: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
    });
  }
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "writes the delta's token overrides as overrides.ts and applies its pair changes by key, one entry per line"
  if (delta.pairs !== undefined) await writeFile(join(into, pairsFile), applyPairChanges(await readFile(join(into, pairsFile), "utf8"), delta.pairs));
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts 'writes pairsList "empty" as exactly "[]\\n", an empty JSON list' and 'writes pairsList "not-json" as exactly the fixed cut-off text, which does not parse as JSON'
  if (delta.pairsList !== undefined) await writeFile(join(into, pairsFile), pairsListTexts[delta.pairsList]);
}

/** Applies one delta.json `baselines` edit to a baseline file of the root: rewritten edited, or removed. */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree: baselines (006 research.md R-11, R-16) applies one-pixel, reencode and remove to the repository's current baselines, and leaves the others as they are"
async function applyBaselineEdit(file: string, edit: BaselineEdit["edit"]): Promise<void> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree: baselines (006 research.md R-11, R-16) applies one-pixel, reencode and remove to the repository's current baselines, and leaves the others as they are"
  if (edit === "remove") return rm(file);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree: baselines (006 research.md R-11, R-16) applies one-pixel, reencode and remove to the repository's current baselines, and leaves the others as they are"
  await writeFile(file, editBaseline(await readFile(file), edit));
}

/** The repository's exception entries, for `exceptions: "repository"`, with the plan files they name copied into `into`. */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree: the Storybook workspace (006 research.md R-16) appends the repository's entries after the tree's own for exceptions: "repository", and copies the plan files they name"
async function repositoryExceptions(repo: string, into: string): Promise<string> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree: the Storybook workspace (006 research.md R-16) appends the repository's entries after the tree's own for exceptions: "repository", and copies the plan files they name"
  const text = (await readFile(join(repo, exceptionsFile), "utf8").catch(ignoreMissing)) ?? "[]";
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree: the Storybook workspace (006 research.md R-16) appends the repository's entries after the tree's own for exceptions: "repository", and copies the plan files they name"
  for (const plan of exceptionPlans(text)) {
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree: the Storybook workspace (006 research.md R-16) appends the repository's entries after the tree's own for exceptions: "repository", and copies the plan files they name"
    await cp(join(repo, plan), join(into, plan)).catch((error: unknown) => {
      // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree: the Storybook workspace (006 research.md R-16) fails to build a root whose repository's exception entries name a plan file the repository does not hold"
      if ((error as { code?: unknown } | null)?.code !== "ENOENT") throw error;
      // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree: the Storybook workspace (006 research.md R-16) fails to build a root whose repository's exception entries name a plan file the repository does not hold"
      throw new Error(`a11y-exceptions.json names ${plan}, which the repository does not hold`, { cause: error });
    });
  }
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree: the Storybook workspace (006 research.md R-16) appends the repository's entries after the tree's own for exceptions: "repository", and copies the plan files they name"
  return text;
}

/**
 * Lays the configuration set of `repo` and the plant's `tree/` into `into`, links `repo`'s node_modules and
 * storybook/node_modules (but the ones its plant.json `unlinked` lists), writes the root's storybook/a11y-exceptions.json, and
 * applies the plant's delta.json (002 contracts/gates.md § Configuration set, *Plant deltas*): for `generator:
 * "wrapped"` the real generator moves to generate.real.ts before tree/ places the wrapper; for `exceptions:
 * "repository"` the repository's plan files are copied before tree/ is laid over them, and its entries follow the
 * tree's (006 research.md R-16).
 */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "copies the configuration set unchanged, lays tree/ over it at repository paths, and links node_modules"
export async function buildRepoTree(repo: string, plant: string, into: string, spec?: Plant): Promise<void> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "copies the configuration set unchanged, lays tree/ over it at repository paths, and links node_modules"
  await copyConfiguration(repo, into, spec?.unlinked);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree: baselines (006 research.md R-11, R-16) applies one-pixel, reencode and remove to the repository's current baselines, and leaves the others as they are"
  const repositoryBaselines = await readdir(join(repo, baselinesDir)).catch(() => []);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "copies the configuration set unchanged, lays tree/ over it at repository paths, and links node_modules"
  const delta = await readDelta(plant, repositoryBaselines);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree: baselines (006 research.md R-11, R-16) applies one-pixel, reencode and remove to the repository's current baselines, and leaves the others as they are"
  for (const edit of delta?.baselines ?? []) await applyBaselineEdit(join(into, baselinesDir, edit.file), edit.edit);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree: baselines (006 research.md R-11, R-16) gives a baselinesOf plant's root the named pass plant's baselines, under its own tree/ and none of the pass plant's other files"
  if (spec?.baselinesOf !== undefined) await cp(join(dirname(plant), spec.baselinesOf, "tree", baselinesDir), join(into, baselinesDir), { recursive: true });
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree: the Storybook workspace (006 research.md R-16) appends the repository's entries after the tree's own for exceptions: "repository", and copies the plan files they name"
  const repository = delta?.exceptions === "repository" ? await repositoryExceptions(repo, into) : undefined;
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "moves the real generator to generate.real.ts and places the plant's wrapper for generator wrapped (and not without a delta)"
  if (delta?.generator === "wrapped") await rename(join(into, generatorFile), join(into, "packages/tokens/src/generate.real.ts"));
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "copies the configuration set unchanged, lays tree/ over it at repository paths, and links node_modules"
  await layOver(plant, "tree", into);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildRepoTree: the Storybook workspace (006 research.md R-16) writes storybook/a11y-exceptions.json as [] when the tree supplies none, and keeps the tree's own"
  await writeFile(join(into, exceptionsFile), rootExceptions(await readFile(join(into, exceptionsFile), "utf8").catch(ignoreMissing), repository));
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "writes the delta's token overrides as overrides.ts and applies its pair changes by key, one entry per line"
  if (delta !== undefined) await applyDelta(delta, into);
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

/** The markers of a tracked-tree plant (op 023) and the sandbox paths they stand for, built at run time. */
const sandboxMarkers: readonly (readonly [string, string])[] = [
  ["@SANDBOX_ROOT@", "/" + "root"],
  ["@SANDBOX_HOME_USER@", "/" + "home/user"],
];

/**
 * A tracked-tree plant file's bytes with every marker expanded (op 023, plan.md *Plant form*): `@SANDBOX_ROOT@` becomes
 * the root home and `@SANDBOX_HOME_USER@` the user home, byte for byte; every other byte stays, in any file.
 */
export function expandMarkers(bytes: Buffer): Buffer {
  let out = Buffer.from(bytes);
  for (const [marker, path] of sandboxMarkers) {
    const parts: Buffer[] = [];
    let at = 0;
    for (let found = out.indexOf(marker, at); found !== -1; found = out.indexOf(marker, at)) {
      parts.push(out.subarray(at, found), Buffer.from(path));
      at = found + marker.length;
    }
    out = Buffer.concat([...parts, out.subarray(at)]);
  }
  return out;
}

/**
 * A git repository in `into` (op 023, plan.md *Plant form*): the plant's `tree/` copied with its markers expanded, and,
 * if it holds a file, committed by Plant Base. No configuration set and no node_modules: the gate reads only the
 * root's tracked files. Without a `tree/`, or with an empty one, the repository tracks nothing.
 */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildTrackedTree (op 023) commits the expanded tree as Plant Base, without plant.json, configuration or node_modules, leaving a clean work tree"
export async function buildTrackedTree(plant: string, into: string): Promise<void> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildTrackedTree (op 023) commits the expanded tree as Plant Base, without plant.json, configuration or node_modules, leaving a clean work tree"
  const tree = join(plant, "tree");
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildTrackedTree (op 023) gives a git repository with no tracked file for $name"
  const paths = filePaths(await readdir(tree, { recursive: true, withFileTypes: true }).catch(ignoreMissing) ?? [], tree);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildTrackedTree (op 023) commits the expanded tree as Plant Base, without plant.json, configuration or node_modules, leaving a clean work tree"
  for (const path of paths) {
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildTrackedTree (op 023) commits the expanded tree as Plant Base, without plant.json, configuration or node_modules, leaving a clean work tree"
    await mkdir(dirname(join(into, path)), { recursive: true });
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildTrackedTree (op 023) commits the expanded tree as Plant Base, without plant.json, configuration or node_modules, leaving a clean work tree"
    await writeFile(join(into, path), expandMarkers(await readFile(join(tree, path))));
  }
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildTrackedTree (op 023) commits the expanded tree as Plant Base, without plant.json, configuration or node_modules, leaving a clean work tree"
  await git(into, ["init", "-q", "-b", "main"]);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildTrackedTree (op 023) gives a git repository with no tracked file for $name"
  if (paths.length === 0) return;
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildTrackedTree (op 023) commits the expanded tree as Plant Base, without plant.json, configuration or node_modules, leaving a clean work tree"
  await git(into, ["add", "-A"]);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plant-repo.test.ts "buildTrackedTree (op 023) commits the expanded tree as Plant Base, without plant.json, configuration or node_modules, leaving a clean work tree"
  await git(into, ["commit", "-q", "-m", "Plant base"], identityEnv(baseCommit().author));
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
