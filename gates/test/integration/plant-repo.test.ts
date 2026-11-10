import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, readFileSync, readlinkSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildCommitRepo, buildMutationRepo, buildRepoTree } from "../../lib/plant-repo.ts";
import { baseEnv, cleanUp, repo, tempDir } from "./workspace.ts";

// gates/lib/plant-repo.ts builds the temporary repositories of the plant job (research.md R-10, contracts/plants.md)
// from plants under gates/test/fixtures/plant-repo/: a repo-tree with the configuration set and node_modules linked,
// a commit-repo on an empty signed-off base commit with an RFC 2606 identity, and a mutation-repo from base/ and head/.
const fixtures = join(repo, "gates/test/fixtures/plant-repo");
const configuration = [
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
  "packages/tokens/package.json",
  "packages/tokens/tsconfig.json",
  "packages/styles/package.json",
  "packages/styles/tsconfig.json",
  "packages/elements/package.json",
  "packages/elements/tsconfig.json",
  "gates/eslint/no-snapshot-only.ts",
  "gates/eslint/unchecked-expect.ts",
  "gates/stylelint/token-only.ts",
  "gates/stylelint/token-lists.ts",
  // The token source, its overrides, the generator (with the modules they import) and the pair list, so repo-tree
  // plants see the real token source (002 contracts/gates.md § Configuration set, research.md R-09).
  "packages/tokens/src/source.ts",
  "packages/tokens/src/overrides.ts",
  "packages/tokens/src/generate.ts",
  "packages/tokens/contrast/pairs.json",
  // The element source the manifest gate and the element plants read (005 research.md R-12).
  "packages/elements/src/index.ts",
];

/**
 * The element files of the configuration set that may be absent until the manifest generator lands (005 research.md
 * R-12): each is in the temporary repository unchanged when the repository has it, and absent when it does not.
 */
const mayBeAbsent = ["packages/elements/scripts/manifest.ts", "packages/elements/custom-elements-manifest.config.mjs", "packages/elements/custom-elements.json"];

function copiedOrAbsent(dir: string): Record<string, boolean> {
  return Object.fromEntries(
    mayBeAbsent.map((file) => [
      file,
      existsSync(join(repo, file)) ? existsSync(join(dir, file)) && readFileSync(join(dir, file), "utf8") === readFileSync(join(repo, file), "utf8") : !existsSync(join(dir, file)),
    ]),
  );
}

/** Each package's own node_modules in the repository, which the temporary repository links (005 research.md R-12). */
const packageModules = ["packages/tokens", "packages/styles", "packages/elements"].map((dir) => `${dir}/node_modules`).filter((path) => existsSync(join(repo, path)));

function linkedModules(dir: string): Record<string, string | false> {
  return Object.fromEntries(packageModules.map((path) => [path, lstatSync(join(dir, path), { throwIfNoEntry: false })?.isSymbolicLink() === true && readlinkSync(join(dir, path))]));
}

const allLinked = Object.fromEntries(packageModules.map((path) => [path, join(repo, path)]));

function git(dir: string, args: readonly string[]): string {
  return execFileSync("git", args, { cwd: dir, env: baseEnv(), encoding: "utf8" }).trim();
}

/** For each configuration file: whether the temporary repository holds it unchanged. */
function copiedUnchanged(dir: string): Record<string, boolean> {
  return Object.fromEntries(
    configuration.map((file) => [
      file,
      existsSync(join(dir, file)) && readFileSync(join(dir, file), "utf8") === readFileSync(join(repo, file), "utf8"),
    ]),
  );
}

const allTrue = Object.fromEntries(configuration.map((file) => [file, true]));
const timeout = 60_000;

afterEach(cleanUp);

describe("buildRepoTree", () => {
  it("copies the configuration set unchanged, lays tree/ over it at repository paths, and links node_modules", async () => {
    const into = tempDir("repo-tree");
    await buildRepoTree(repo, join(fixtures, "tree-plant"), into);
    expect(copiedUnchanged(into)).toEqual(allTrue);
    expect(readFileSync(join(into, "packages/tokens/src/x.ts"), "utf8")).toBe("export const x = 1;\n");
    expect(readFileSync(join(into, "gates/lib/y.ts"), "utf8")).toBe("export const y = 2;\n");
    expect(lstatSync(join(into, "node_modules")).isSymbolicLink()).toBe(true);
    expect(readlinkSync(join(into, "node_modules"))).toBe(join(repo, "node_modules"));
    expect(packageModules).toContain("packages/styles/node_modules");
    expect(linkedModules(into)).toEqual(allLinked);
    expect(copiedOrAbsent(into)).toEqual(Object.fromEntries(mayBeAbsent.map((file) => [file, true])));
    expect(existsSync(join(into, "packages/tokens/src/index.ts"))).toBe(false);
    expect(existsSync(join(into, "tree"))).toBe(false);
  });

  it("holds the token source, its overrides, the generator and the pair list in a built plant root (002 contracts/gates.md § Configuration set)", async () => {
    const into = tempDir("repo-tree");
    await buildRepoTree(repo, join(fixtures, "empty-plant"), into);
    const files = ["packages/tokens/src/source.ts", "packages/tokens/src/overrides.ts", "packages/tokens/src/generate.ts", "packages/tokens/contrast/pairs.json"];
    expect(Object.fromEntries(files.map((file) => [file, existsSync(join(into, file)) && readFileSync(join(into, file), "utf8") === readFileSync(join(repo, file), "utf8")]))).toEqual(
      Object.fromEntries(files.map((file) => [file, true])),
    );
  });

  it("builds the configuration set alone for a plant without tree/", async () => {
    const into = tempDir("repo-tree");
    await buildRepoTree(repo, join(fixtures, "empty-plant"), into);
    expect(copiedUnchanged(into)).toEqual(allTrue);
    expect(existsSync(join(into, "plant.json"))).toBe(false);
  });
});

describe("buildRepoTree: plant deltas (002 contracts/gates.md § Configuration set, *Plant deltas*)", () => {
  const read = (dir: string, path: string): string => readFileSync(join(dir, path), "utf8");
  const pairsPath = "packages/tokens/contrast/pairs.json";

  it("writes the delta's token overrides as overrides.ts and applies its pair changes by key, one entry per line", async () => {
    const into = tempDir("repo-tree");
    await buildRepoTree(repo, join(fixtures, "delta-plant"), into);
    expect(read(into, "packages/tokens/src/overrides.ts")).toBe(
      [
        "// Token overrides written by the plant runner from the plant's delta.json (002 contracts/gates.md § Plant deltas).",
        'import type { TokenOverride } from "./generate.ts";',
        "",
        "export const overrides: readonly TokenOverride[] = [",
        '  {"token":"color-ink-muted","light":"#6B655A"},',
        '  {"add":{"name":"radius-4","group":"shape","value":"4px"}},',
        '  {"remove":"size-dot"},',
        "];",
        "",
      ].join("\n"),
    );
    type Entry = Record<string, string>;
    const real = JSON.parse(read(repo, pairsPath)) as Entry[];
    const is = (e: Entry, theme: string, fg: string, bg: string): boolean => e.theme === theme && e.fg === fg && e.bg === bg;
    const expected = [
      ...real.filter((e) => !is(e, "dark", "color-ink", "color-sheet")).map((e) => (is(e, "light", "color-ink-muted", "color-inset") ? { ...e, figure: "4.27" } : e)),
      { theme: "light", fg: "color-ink", bg: "color-overlay", kind: "text", figure: "1", status: "checked", source: "computed" },
    ];
    expect(real.length).toBeGreaterThan(300);
    const written = read(into, pairsPath);
    expect(JSON.parse(written)).toEqual(expected);
    expect(written.split("\n")).toHaveLength(expected.length + 3);
    expect(read(into, "packages/tokens/src/source.ts")).toBe(read(repo, "packages/tokens/src/source.ts"));
  });

  it("moves the real generator to generate.real.ts and places the plant's wrapper for generator wrapped (and not without a delta)", async () => {
    const into = tempDir("repo-tree");
    await buildRepoTree(repo, join(fixtures, "wrapped-plant"), into);
    expect(read(into, "packages/tokens/src/generate.real.ts")).toBe(read(repo, "packages/tokens/src/generate.ts"));
    expect(read(into, "packages/tokens/src/generate.ts")).toBe(read(fixtures, "wrapped-plant/tree/packages/tokens/src/generate.ts"));
    const plain = tempDir("repo-tree");
    await buildRepoTree(repo, join(fixtures, "tree-plant"), plain);
    expect(existsSync(join(plain, "packages/tokens/src/generate.real.ts"))).toBe(false);
    expect(read(plain, "packages/tokens/src/overrides.ts")).toBe(read(repo, "packages/tokens/src/overrides.ts"));
  });

  // pairsList is closed (operator decision R1-01 (c), contracts/gates.md § Configuration set): "empty" and "not-json"
  // each write one fixed text over the whole pair list.
  it('writes pairsList "empty" as exactly "[]\\n", an empty JSON list', async () => {
    const into = tempDir("repo-tree");
    await buildRepoTree(repo, join(fixtures, "empty-list-plant"), into);
    const written = read(into, pairsPath);
    expect(written).toBe("[]\n");
    expect(JSON.parse(written)).toEqual([]);
  });

  it('writes pairsList "not-json" as exactly the fixed cut-off text, which does not parse as JSON', async () => {
    const into = tempDir("repo-tree");
    await buildRepoTree(repo, join(fixtures, "text-plant"), into);
    const written = read(into, pairsPath);
    expect(written).toBe('[\n  {"theme":"light",\n');
    expect(() => JSON.parse(written) as unknown).toThrow(SyntaxError);
  });

  it.each([
    { plant: "bad-token-plant", problem: "delta.json tokens: token override names an unknown token color-nope" },
    { plant: "bad-pair-plant", problem: "delta.json pairs: key light/color-nope/color-canvas matches no entry" },
    { plant: "bad-wrapper-plant", problem: 'packages/tokens/src/generate.ts of a wrapped generator must re-export the real one: export * from "./generate.real.ts"' },
    { plant: "forbidden-plant", problem: "tree/ holds packages/tokens/contrast/pairs.json; a plant changes the pair list by delta.json pairs" },
    { plant: "invalid-delta-plant", problem: "delta.json is not valid JSON" },
  ])("fails to build $plant, naming the key or file", async ({ plant, problem }) => {
    await expect(buildRepoTree(repo, join(fixtures, plant), tempDir("repo-tree"))).rejects.toThrow(problem);
  });
});

describe("buildCommitRepo", () => {
  it(
    "makes an empty base commit signed off by Plant Base, then one commit per record, with real merges",
    async () => {
      const into = tempDir("commit-repo");
      const { base, commits } = await buildCommitRepo(join(fixtures, "commit-plant"), into);
      expect({ base: /^[0-9a-f]{40}$/.test(base), commits: commits.length, git: existsSync(join(into, ".git")) }).toEqual({
        base: true,
        commits: 3,
        git: true,
      });
      expect(git(into, ["log", "-1", "--format=%P|%an <%ae>|%B", base])).toBe(
        "|Plant Base <base@example.com>|Plant base\n\nSigned-off-by: Plant Base <base@example.com>",
      );
      expect(git(into, ["ls-tree", "-r", "--name-only", base])).toBe("");
      expect(commits).toHaveLength(3);
      const [first, second, merge] = commits;
      expect(git(into, ["log", "-1", "--format=%P|%an <%ae>|%B", String(first)])).toBe(
        `${base}|Ada Example <ada@example.com>|Add the first change\n\nSigned-off-by: Ada Example <ada@example.com>`,
      );
      expect(git(into, ["log", "-1", "--format=%P|%an <%ae>|%B", String(second)])).toBe(
        `${base}|Bob Example <bob@example.org>|Add a change on a side branch`,
      );
      expect(git(into, ["log", "-1", "--format=%P|%an <%ae>|%B", String(merge)])).toBe(
        `${String(first)} ${String(second)}|Ada Example <ada@example.com>|Merge the side branch`,
      );
      expect(git(into, ["rev-parse", "HEAD"])).toBe(merge);
      expect(git(into, ["rev-list", "--count", `${base}..HEAD`])).toBe("3");
    },
    timeout,
  );
});

describe("buildMutationRepo", () => {
  it(
    "commits the configuration set with base/, then head/ (files only in base/ deleted), node_modules linked and untracked",
    async () => {
      const into = tempDir("mutation-repo");
      const { base } = await buildMutationRepo(repo, join(fixtures, "mutation-plant"), into);
      expect({ base: /^[0-9a-f]{40}$/.test(base), git: existsSync(join(into, ".git")) }).toEqual({ base: true, git: true });
      expect(git(into, ["rev-parse", "HEAD~1"])).toBe(base);
      expect(git(into, ["rev-list", "--count", "HEAD"])).toBe("2");
      const baseFiles = git(into, ["ls-tree", "-r", "--name-only", base]).split("\n");
      expect(baseFiles).toEqual(expect.arrayContaining([...configuration, "packages/tokens/src/x.ts", "packages/tokens/src/gone.ts"]));
      expect(baseFiles).not.toContain("node_modules");
      expect(git(into, ["diff", "--name-status", base, "HEAD"])).toBe(
        "D\tpackages/tokens/src/gone.ts\nM\tpackages/tokens/src/x.ts",
      );
      expect(git(into, ["status", "--porcelain"])).toBe("");
      expect(lstatSync(join(into, "node_modules")).isSymbolicLink()).toBe(true);
      expect(linkedModules(into)).toEqual(allLinked);
      expect(baseFiles.filter((path) => path.split("/").includes("node_modules"))).toEqual([]);
      expect(copiedUnchanged(into)).toEqual(allTrue);
    },
    timeout,
  );
});
