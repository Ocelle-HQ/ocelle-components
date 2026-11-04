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
];

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
      expect(copiedUnchanged(into)).toEqual(allTrue);
    },
    timeout,
  );
});
