import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, readlinkSync, realpathSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { PNG } from "pngjs";
import { afterEach, describe, expect, it } from "vitest";
import { buildCommitRepo, buildMutationRepo, buildRepoTree } from "../../lib/plant-repo.ts";
import { baseEnv, cleanUp, repo, storybookInputs, tempDir } from "./workspace.ts";

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

// The Storybook workspace in a plant root (006 research.md R-16, contracts/plants.md): the configuration set holds the
// Storybook inputs, storybook/node_modules is linked to the real path of the repository's unless the plant lists it in
// `unlinked`, and the root's storybook/a11y-exceptions.json is [] unless the tree supplies one, the repository's
// entries (and the plan files they name) added by delta.json `exceptions: "repository"`.
describe("buildRepoTree: the Storybook workspace (006 research.md R-16)", () => {
  /** The text of a file of a built root, asserting first that the root holds it. */
  const read = (dir: string, path: string): string => {
    expect(existsSync(join(dir, path)), `${path} in ${dir}`).toBe(true);
    return readFileSync(join(dir, path), "utf8");
  };
  const exceptionsFile = "storybook/a11y-exceptions.json";

  /** Every file below `path` of `dir` (or `path` itself when it is a file), as paths relative to `dir`. */
  function filesBelow(dir: string, path: string): string[] {
    const at = join(dir, path);
    if (!lstatSync(at).isDirectory()) return [path];
    return readdirSync(at, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => relative(dir, join(entry.parentPath, entry.name)))
      .sort();
  }

  it("copies the Storybook workspace inputs unchanged, and nothing built, generated, cached or tested", async () => {
    const into = tempDir("repo-tree");
    await buildRepoTree(repo, join(fixtures, "empty-plant"), into);
    const files = storybookInputs.flatMap((path) => filesBelow(repo, path));
    expect(files.length).toBeGreaterThan(15);
    expect(files.filter((file) => !existsSync(join(into, file)) || !readFileSync(join(into, file)).equals(readFileSync(join(repo, file))))).toEqual([]);
    expect(files).toEqual(storybookInputs.flatMap((path) => filesBelow(into, path)));
  });

  it("copies nothing built, generated, cached, captured or tested of the repository's Storybook", async () => {
    const fake = tempDir("repo-tree");
    await buildRepoTree(repo, join(fixtures, "empty-plant"), fake);
    expect(read(fake, "storybook/package.json")).toBe(read(repo, "storybook/package.json"));
    const outside = ["storybook/dist", "storybook/.generated", "storybook/test", "storybook/.visual", "storybook/.cache"];
    for (const dir of outside) {
      mkdirSync(join(fake, dir), { recursive: true });
      writeFileSync(join(fake, dir, "x.txt"), "x");
    }
    const into = tempDir("repo-tree");
    await buildRepoTree(fake, join(fixtures, "empty-plant"), into);
    expect(outside.filter((dir) => existsSync(join(fake, dir, "x.txt")))).toEqual(outside);
    expect(outside.filter((dir) => existsSync(join(into, dir)))).toEqual([]);
    expect(read(into, "storybook/package.json")).toBe(read(fake, "storybook/package.json"));
  });

  it("links storybook/node_modules to the real path of the repository's, beside node_modules", async () => {
    const into = tempDir("repo-tree");
    await buildRepoTree(repo, join(fixtures, "empty-plant"), into);
    expect(existsSync(join(into, "storybook/node_modules"))).toBe(true);
    expect(lstatSync(join(into, "storybook/node_modules")).isSymbolicLink()).toBe(true);
    expect(readlinkSync(join(into, "storybook/node_modules"))).toBe(realpathSync(join(repo, "storybook/node_modules")));
    expect(readlinkSync(join(into, "node_modules"))).toBe(join(repo, "node_modules"));
  });

  it('removes only the storybook/node_modules link for unlinked ["storybook/node_modules"]', async () => {
    const into = tempDir("repo-tree");
    await buildRepoTree(repo, join(fixtures, "empty-plant"), into, { expect: "error", why: "w", cause: "c", unlinked: ["storybook/node_modules"] });
    expect(read(into, "storybook/package.json")).toBe(read(repo, "storybook/package.json"));
    expect(() => lstatSync(join(into, "storybook/node_modules"))).toThrow(expect.objectContaining({ code: "ENOENT" }) as Error);
    expect(readlinkSync(join(into, "node_modules"))).toBe(join(repo, "node_modules"));
  });

  // Every other root of this file is built from a repository without storybook/baselines (until 006 phase 3 adds the
  // baselines), so a root builds without it as well.
  it("copies storybook/baselines when the repository holds it", async () => {
    const fake = tempDir("repo-tree");
    await buildRepoTree(repo, join(fixtures, "exceptions-repo-plant"), fake);
    const into = tempDir("repo-tree");
    await buildRepoTree(fake, join(fixtures, "empty-plant"), into);
    expect(read(into, "storybook/baselines/fixture--story.light.png")).toBe("not a png, a fixture baseline\n");
    expect(readdirSync(join(into, "storybook/baselines"))).toEqual(["fixture--story.light.png"]);
  });

  it("writes storybook/a11y-exceptions.json as [] when the tree supplies none, and keeps the tree's own", async () => {
    const empty = tempDir("repo-tree");
    await buildRepoTree(repo, join(fixtures, "empty-plant"), empty);
    expect(read(empty, exceptionsFile)).toBe("[]\n");
    const own = tempDir("repo-tree");
    await buildRepoTree(repo, join(fixtures, "exceptions-tree-plant"), own);
    expect(read(own, exceptionsFile)).toBe(read(fixtures, `exceptions-tree-plant/tree/${exceptionsFile}`));
  });

  it('appends the repository\'s entries after the tree\'s own for exceptions: "repository", and copies the plan files they name', async () => {
    const fake = tempDir("repo-tree");
    await buildRepoTree(repo, join(fixtures, "exceptions-repo-plant"), fake);
    const into = tempDir("repo-tree");
    await buildRepoTree(fake, join(fixtures, "exceptions-plant"), into);
    const ownEntries = JSON.parse(read(fixtures, `exceptions-plant/tree/${exceptionsFile}`)) as unknown[];
    const repoEntries = JSON.parse(read(fake, exceptionsFile)) as unknown[];
    expect(repoEntries).toHaveLength(1);
    expect(read(into, exceptionsFile)).toBe(`${JSON.stringify([...ownEntries, ...repoEntries], null, 2)}\n`);
    expect(read(into, "specs/fixture-feature/plan.md")).toBe(read(fake, "specs/fixture-feature/plan.md"));
    const alone = tempDir("repo-tree");
    await buildRepoTree(fake, join(fixtures, "exceptions-only-plant"), alone);
    expect(read(alone, exceptionsFile)).toBe(`${JSON.stringify(repoEntries, null, 2)}\n`);
    expect(read(alone, "specs/fixture-feature/plan.md")).toBe(read(fake, "specs/fixture-feature/plan.md"));
  });

  it("does not copy the repository's entries or plan files without the key", async () => {
    const fake = tempDir("repo-tree");
    await buildRepoTree(repo, join(fixtures, "exceptions-repo-plant"), fake);
    const into = tempDir("repo-tree");
    await buildRepoTree(fake, join(fixtures, "empty-plant"), into);
    expect([read(into, exceptionsFile), existsSync(join(into, "specs/fixture-feature/plan.md"))]).toEqual(["[]\n", false]);
  });

  it("fails to build a root whose repository's exception entries name a plan file the repository does not hold", async () => {
    const fake = tempDir("repo-tree");
    await buildRepoTree(repo, join(fixtures, "exceptions-missing-plan-plant"), fake);
    await expect(buildRepoTree(fake, join(fixtures, "exceptions-only-plant"), tempDir("repo-tree"))).rejects.toThrow(
      "a11y-exceptions.json names specs/no-such-feature/plan.md, which the repository does not hold",
    );
  });
});

// 006 research.md R-11 and R-16: delta.json `baselines` edits the current repository baselines when the root is made
// (one-pixel, reencode, remove), a tree copy of a repository baseline or an edit of one the repository does not hold
// fails the build, and `baselinesOf` gives a visual fail plant's root the baselines of the pass plant it names. The
// repository here is a root built from this one with four small PNG baselines written into it.
describe("buildRepoTree: baselines (006 research.md R-11, R-16)", () => {
  /** A PNG file of a 4 × 3 image with distinct pixels, at deflate level 9. */
  function png(seed: number): Buffer {
    const image = new PNG({ width: 4, height: 3 });
    for (let at = 0; at < 12; at += 1) image.data.set([(seed + at * 20) % 256, (seed * 3 + at * 9) % 256, (at * 41) % 256, 255], at * 4);
    return PNG.sync.write(image, { colorType: 6, inputColorType: 6, bitDepth: 8, deflateLevel: 9, filterType: 4 });
  }
  const names = ["fixture--a.light.png", "fixture--a.dark.png", "fixture--b.light.png", "fixture--b.dark.png"];

  /** A repository built from this one whose storybook/baselines/ holds the four fixture baselines besides its own. */
  async function fakeRepository(): Promise<string> {
    const fake = tempDir("repo-tree");
    await buildRepoTree(repo, join(fixtures, "empty-plant"), fake);
    mkdirSync(join(fake, "storybook/baselines"), { recursive: true });
    names.forEach((name, at) => {
      writeFileSync(join(fake, "storybook/baselines", name), png(at * 50 + 7));
    });
    return fake;
  }
  const pixels = (file: string): number[] => [...PNG.sync.read(readFileSync(file)).data];

  it("applies one-pixel, reencode and remove to the repository's current baselines, and leaves the others as they are", async () => {
    const fake = await fakeRepository();
    const into = tempDir("repo-tree");
    await buildRepoTree(fake, join(fixtures, "baselines-edit-plant"), into);
    const at = (dir: string, name: string): string => join(dir, "storybook/baselines", name);
    const light = { before: pixels(at(fake, names[0] ?? "")), after: pixels(at(into, names[0] ?? "")) };
    expect(light.after.slice(0, 3)).toEqual(light.before.slice(0, 3).map((value) => 255 - value));
    expect(light.after.slice(3)).toEqual(light.before.slice(3));
    expect(pixels(at(into, "fixture--a.dark.png"))).toEqual(pixels(at(fake, "fixture--a.dark.png")));
    expect(readFileSync(at(into, "fixture--a.dark.png")).equals(readFileSync(at(fake, "fixture--a.dark.png")))).toBe(false);
    expect(existsSync(at(into, "fixture--b.light.png"))).toBe(false);
    expect(readFileSync(at(into, "fixture--b.dark.png")).equals(readFileSync(at(fake, "fixture--b.dark.png")))).toBe(true);
    expect(readdirSync(join(fake, "storybook/baselines")).filter((name) => !existsSync(at(into, name)))).toEqual(["fixture--b.light.png"]);
  });

  it("fails to build a plant whose tree/ holds a repository baseline, or whose edit names a file the repository does not hold", async () => {
    const fake = await fakeRepository();
    await expect(buildRepoTree(fake, join(fixtures, "baselines-copy-plant"), tempDir("repo-tree"))).rejects.toThrow(
      "tree/ holds storybook/baselines/fixture--a.light.png; a plant changes a repository baseline by delta.json baselines",
    );
    await expect(buildRepoTree(fake, join(fixtures, "baselines-missing-plant"), tempDir("repo-tree"))).rejects.toThrow("delta.json baselines: fixture--z.light.png is not a repository baseline");
  });

  it("gives a baselinesOf plant's root the named pass plant's baselines, under its own tree/ and none of the pass plant's other files", async () => {
    const into = tempDir("repo-tree");
    const plant = JSON.parse(readFileSync(join(fixtures, "visual-plants/fail-of/plant.json"), "utf8")) as Parameters<typeof buildRepoTree>[3];
    await buildRepoTree(repo, join(fixtures, "visual-plants/fail-of"), into, plant);
    expect(readFileSync(join(into, "storybook/baselines/own--x.light.png"), "utf8")).toBe(readFileSync(join(fixtures, "visual-plants/pass-own/tree/storybook/baselines/own--x.light.png"), "utf8"));
    expect(readFileSync(join(into, "storybook/stories/own.stories.ts"), "utf8")).toContain("<p>fail</p>");
    const without = tempDir("repo-tree");
    await buildRepoTree(repo, join(fixtures, "visual-plants/fail-of"), without);
    expect(existsSync(join(without, "storybook/baselines/own--x.light.png"))).toBe(false);
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
      expect(copiedUnchanged(into)).toEqual(allTrue);
      // 006 research.md R-16: the Storybook workspace is committed with the configuration set, its node_modules linked
      // and untracked like the root's.
      expect(baseFiles).toEqual(expect.arrayContaining(["storybook/package.json", "storybook/.storybook/main.ts", "storybook/visual/container.json", ".node-version"]));
      expect(lstatSync(join(into, "storybook/node_modules")).isSymbolicLink()).toBe(true);
      expect(baseFiles.filter((file) => file.includes("node_modules"))).toEqual([]);
    },
    timeout,
  );
});
