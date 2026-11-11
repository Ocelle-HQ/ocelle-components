import { describe, expect, it } from "vitest";
import {
  applyPairChanges,
  carriesConfiguration,
  checkWrapper,
  configurationSet,
  exceptionPlans,
  moduleLinks,
  overridesText,
  parseCommits,
  parseDelta,
  rootExceptions,
  treeProblems,
} from "../lib/plant-repo.ts";

// The pure parts of gates/lib/plant-repo.ts (research.md R-10, contracts/plants.md): the configuration set copied
// into every temporary repository, the configuration a plant must not carry, and the records of commits.txt.
describe("configurationSet", () => {
  it("lists the root configuration, each package's manifest and tsconfig, the modules the configurations import, and the token source, its overrides, the generator and the pair list (002 contracts/gates.md § Configuration set)", () => {
    expect(configurationSet(["packages/tokens", "packages/elements"])).toEqual([
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
      "packages/elements/package.json",
      "packages/elements/tsconfig.json",
      "gates/eslint",
      "gates/stylelint",
      "packages/tokens/src/source.ts",
      "packages/tokens/src/overrides.ts",
      "packages/tokens/src/generate.ts",
      "packages/tokens/contrast/pairs.json",
      // The Storybook workspace inputs a plant root holds since 006 (research.md R-16): the Node pin, the base
      // stylesheet and the fonts the stories read, and the workspace's manifest, configuration, scripts, stories,
      // baselines and container pin; never dist/, .generated/, .visual/, .cache/, test/ or node_modules/.
      ".node-version",
      "packages/styles/src/base.css",
      "packages/tokens/fonts",
      "storybook/package.json",
      "storybook/.storybook",
      "storybook/scripts",
      "storybook/stories",
      "storybook/baselines",
      "storybook/visual/container.json",
    ]);
  });

  it("holds no built, generated, cached or installed Storybook directory, and not the exceptions file (made per root)", () => {
    const set = configurationSet([]);
    const outside = ["storybook/dist", "storybook/.generated", "storybook/.visual", "storybook/.cache", "storybook/node_modules", "storybook/test", "storybook/a11y-exceptions.json", "storybook"];
    expect(outside.filter((path) => set.includes(path))).toEqual([]);
    expect(set.filter((path) => path.startsWith("storybook/"))).toHaveLength(6);
  });
});

// The node_modules links of a plant root (research.md R-16): the root's node_modules and storybook/node_modules, the
// latter left out when the plant lists it in plant.json `unlinked` (the error-missing-dependencies plant).
describe("moduleLinks", () => {
  it("links node_modules and storybook/node_modules by default", () => {
    expect([moduleLinks(undefined), moduleLinks([])]).toEqual([
      ["node_modules", "storybook/node_modules"],
      ["node_modules", "storybook/node_modules"],
    ]);
  });

  it('leaves out only storybook/node_modules for unlinked ["storybook/node_modules"]', () => {
    expect(moduleLinks(["storybook/node_modules"])).toEqual(["node_modules"]);
  });
});

// The plan files the repository's exception entries name (research.md R-16, data-model.md § Exception): copied into an
// axe plant root with `exceptions: "repository"`, so the entries stay honoured there.
describe("exceptionPlans", () => {
  const entry = (plan: unknown, story = "a--b"): Record<string, unknown> => ({
    story,
    theme: "light",
    rule: "color-contrast-incomplete",
    selector: "td",
    reason: "r",
    sunset: "s",
    plan,
  });

  it("names no plan for no entries", () => {
    expect(exceptionPlans("[]")).toEqual([]);
  });

  it("names a plan once for two entries that name it, and each plan in the order of first naming", () => {
    const text = JSON.stringify([entry("specs/006-x/plan.md"), entry("specs/006-x/plan.md", "c--d"), entry("specs/001-y/plan.md")]);
    expect(exceptionPlans(text)).toEqual(["specs/006-x/plan.md", "specs/001-y/plan.md"]);
  });

  it.each([
    { name: "an absolute plan path", text: JSON.stringify([entry("/etc/plan.md")]), problem: /^a11y-exceptions\.json#0: plan \/etc\/plan\.md is not a path inside the root$/ },
    { name: "a plan path leaving the root", text: JSON.stringify([entry("specs/../../plan.md")]), problem: /^a11y-exceptions\.json#0: plan specs\/\.\.\/\.\.\/plan\.md is not a path inside the root$/ },
    { name: "a plan path that is the parent", text: JSON.stringify([entry("specs/x/plan.md"), entry("..")]), problem: /^a11y-exceptions\.json#1: plan \.\. is not a path inside the root$/ },
    { name: "text that is not JSON", text: "[", problem: /^a11y-exceptions\.json is not valid JSON/ },
    { name: "a file that is not a list", text: "{}", problem: /^a11y-exceptions\.json is not a list of exception entries$/ },
    { name: "an entry that is not an object", text: "[1]", problem: /^a11y-exceptions\.json#0 names no plan$/ },
    { name: "an entry without plan", text: JSON.stringify([{ story: "a--b" }]), problem: /^a11y-exceptions\.json#0 names no plan$/ },
    { name: "an entry with an empty plan", text: JSON.stringify([entry("specs/x/plan.md"), entry("")]), problem: /^a11y-exceptions\.json#1 names no plan$/ },
    { name: "an entry whose plan is not text", text: JSON.stringify([entry(3)]), problem: /^a11y-exceptions\.json#0 names no plan$/ },
  ])("fails the plant run on $name", ({ text, problem }) => {
    expect(() => exceptionPlans(text)).toThrow(problem);
  });

  it("keeps the JSON error of a file that is not JSON as the cause", () => {
    const error = (() => {
      try {
        exceptionPlans("[");
        return undefined;
      } catch (thrown) {
        return thrown as Error;
      }
    })();
    expect(error?.cause).toBeInstanceOf(SyntaxError);
  });

  it("accepts a plan path that only starts with two dots", () => {
    expect(exceptionPlans(JSON.stringify([entry("..plans/plan.md")]))).toEqual(["..plans/plan.md"]);
  });
});

// A plant root's storybook/a11y-exceptions.json (research.md R-16, data-model.md § Plant delta keys): [] unless the
// tree supplies one; with `exceptions: "repository"` the tree's entries, then the repository's, so a plant's own
// `#<index>` locations do not move.
describe("rootExceptions", () => {
  const own = { story: "p--own", theme: "dark", rule: "button-name", selector: "button", reason: "r", sunset: "s", plan: "specs/p/plan.md" };
  const repoEntry = { story: "base-styles--prose-document", theme: "light", rule: "color-contrast-incomplete", selector: "td", reason: "q", sunset: "t", plan: "specs/006/plan.md" };

  it("is an empty list when neither the tree nor the key supplies entries", () => {
    expect(rootExceptions(undefined, undefined)).toBe("[]\n");
  });

  it("keeps the tree's file byte for byte without the key", () => {
    const tree = '[ {"story":"x"} ]';
    expect(rootExceptions(tree, undefined)).toBe(tree);
  });

  it("appends the repository's entries after the tree's own, two-space JSON with a final newline", () => {
    const merged = rootExceptions(JSON.stringify([own]), JSON.stringify([repoEntry]));
    expect(merged).toBe(`${JSON.stringify([own, repoEntry], null, 2)}\n`);
  });

  it("holds the repository's entries alone when the tree supplies none", () => {
    expect(rootExceptions(undefined, JSON.stringify([repoEntry]))).toBe(`${JSON.stringify([repoEntry], null, 2)}\n`);
    expect(rootExceptions(undefined, "[]")).toBe("[]\n");
  });

  it.each([
    { name: "a tree file that is not JSON", tree: "[", repository: "[]", problem: /^the plant's storybook\/a11y-exceptions\.json is not a JSON list$/ },
    { name: "a tree file that is not a list", tree: "{}", repository: "[]", problem: /^the plant's storybook\/a11y-exceptions\.json is not a JSON list$/ },
    { name: "a repository file that is not JSON", tree: undefined, repository: "[", problem: /^the repository's storybook\/a11y-exceptions\.json is not a JSON list$/ },
    { name: "a repository file that is not a list", tree: "[]", repository: "null", problem: /^the repository's storybook\/a11y-exceptions\.json is not a JSON list$/ },
  ])("fails the plant run on $name with the key", ({ tree, repository, problem }) => {
    expect(() => rootExceptions(tree, repository)).toThrow(problem);
  });

  it("keeps the JSON error of a file that is not JSON as the cause", () => {
    const causes = [
      ["[", "[]"],
      [undefined, "["],
    ].map(([tree, repository]) => {
      try {
        rootExceptions(tree, String(repository));
        return undefined;
      } catch (thrown) {
        return (thrown as Error).cause;
      }
    });
    expect(causes.map((cause) => cause instanceof SyntaxError)).toEqual([true, true]);
  });
});

describe("carriesConfiguration", () => {
  it("names every gate configuration file a plant holds, anywhere in it", () => {
    const paths = [
      "plant.json",
      "tree/tsconfig.json",
      "tree/packages/tokens/tsconfig.build.json",
      "tree/eslint.config.ts",
      "tree/eslint.test.config.mjs",
      "tree/.eslintrc.json",
      "head/stylelint.config.js",
      "base/.stylelintrc",
      "tree/vitest.config.ts",
      "tree/vitest.mutation.config.ts",
      "tree/vite.config.mts",
      "tree/packages/elements/vitest.workspace.ts",
      "base/stryker.config.json",
      "base/stryker.conf.js",
      "tree/packages/tokens/src/x.ts",
      "tree/packages/tokens/package.json",
      "commits.txt",
      "tree/src/config.ts",
      "tree/src/tsconfig.ts",
    ];
    expect(carriesConfiguration(paths)).toEqual([
      "base/.stylelintrc",
      "base/stryker.conf.js",
      "base/stryker.config.json",
      "head/stylelint.config.js",
      "tree/.eslintrc.json",
      "tree/eslint.config.ts",
      "tree/eslint.test.config.mjs",
      "tree/packages/elements/vitest.workspace.ts",
      "tree/packages/tokens/tsconfig.build.json",
      "tree/tsconfig.json",
      "tree/vite.config.mts",
      "tree/vitest.config.ts",
      "tree/vitest.mutation.config.ts",
    ]);
  });

  it("names nothing in a plant of inputs only (only the control tsconfig)", () => {
    const inputs = ["plant.json", "tree/packages/tokens/src/x.ts", "commits.txt", "tree/packages/tokens/package.json"];
    expect(carriesConfiguration([...inputs, "tree/tsconfig.json"])).toEqual(["tree/tsconfig.json"]);
  });
});

describe("parseCommits", () => {
  it("reads the records of commits.txt: author, message, parent and merge", () => {
    const text =
      "author: Ada Example <ada@example.com>\n\nFirst\n\nSigned-off-by: Ada Example <ada@example.com>\n%%\n" +
      "author: Bob Example <bob@example.org>\nparent: 0\n\nSide\n%%\n" +
      "author: Ada Example <ada@example.com>\nmerge: 1 2\n\nMerge\n";
    expect(parseCommits(text)).toEqual([
      { author: "Ada Example <ada@example.com>", message: "First\n\nSigned-off-by: Ada Example <ada@example.com>" },
      { author: "Bob Example <bob@example.org>", message: "Side", parent: 0 },
      { author: "Ada Example <ada@example.com>", message: "Merge", merge: [1, 2] },
    ]);
  });

  it.each([
    { text: "", problem: "commits.txt holds no record" },
    { text: "\nNo header\n", problem: "record 1 has no author" },
    { text: "author: Ada <ada@example.com>\n", problem: "record 1 has no message" },
    { text: "author: Ada <ada@example.com>\n\n  \n", problem: "record 1 has no message" },
    { text: "author: Ada\n\nm\n", problem: "record 1: author must be Name <email>" },
    { text: "author: Ada <ada@example.com>\ncolour: red\n\nm\n", problem: "record 1: unknown header colour" },
    { text: "author: A <a@example.com>\n\nm\n%%\nauthor: A <a@example.com>\nparent: 2\n\nm\n", problem: "record 2: parent 2 is not an earlier record" },
    { text: "author: A <a@example.com>\nparent: x\n\nm\n", problem: "record 1: parent x is not an earlier record" },
    { text: "author: A <a@example.com>\n\nm\n%%\nauthor: A <a@example.com>\nmerge: 1 2\n\nm\n", problem: "record 2: merge 1 2 must name two different earlier records" },
    { text: "author: A <a@example.com>\n\nm\n%%\nauthor: A <a@example.com>\nmerge: 1 1\n\nm\n", problem: "record 2: merge 1 1 must name two different earlier records" },
    { text: "author: A <a@example.com>\n\nm\n%%\nauthor: A <a@example.com>\nmerge: 1\n\nm\n", problem: "record 2: merge 1 must name two different earlier records" },
    { text: "author: A <a@example.com>\nmerge: 0 0\n\nm\n", problem: "record 1: merge 0 0 must name two different earlier records" },
  ])("rejects $text", ({ text, problem }) => {
    expect(() => parseCommits(text)).toThrow(problem);
  });
});

// Plant deltas (002 contracts/gates.md § Configuration set, *Plant deltas*; data-model.md § Token overrides,
// § Contrast pair): a plant states its change of the token source, the pair list or the generator in delta.json, by
// key, never as a copy or a line-based patch. These are the pure parts; gates/test/integration/plant-repo.test.ts
// builds plants with them.
describe("parseDelta", () => {
  it("reads each part of a delta: token overrides, pair changes by key, the closed pair list replacement and the wrapped generator", () => {
    const delta = {
      tokens: [{ token: "color-ink-muted", light: "#6B655A" }, { add: { name: "radius-4", group: "shape", value: "4px" } }, { remove: "size-dot" }],
      pairs: [
        { key: ["light", "color-ink-muted", "color-inset"], set: { figure: "4.27" } },
        { key: ["dark", "color-ink", "color-sheet"], remove: true },
        { add: { theme: "light", fg: "color-ink", bg: "color-overlay", kind: "text", figure: "1", status: "checked", source: "computed" } },
      ],
      generator: "wrapped",
    };
    expect(parseDelta(JSON.stringify(delta))).toEqual(delta);
    expect(parseDelta('{"pairsList":"empty"}')).toEqual({ pairsList: "empty" });
    expect(parseDelta('{"pairsList":"not-json"}')).toEqual({ pairsList: "not-json" });
    expect(parseDelta('{"tokens":[],"pairsList":"empty","generator":"wrapped"}')).toEqual({ tokens: [], pairsList: "empty", generator: "wrapped" });
    expect(parseDelta("{}")).toEqual({});
    expect(parseDelta('{"exceptions":"repository"}')).toEqual({ exceptions: "repository" });
  });

  it.each([
    { text: "{", problem: /^delta\.json is not valid JSON/ },
    { text: "[]", problem: /^delta\.json is not an object$/ },
    { text: "null", problem: /^delta\.json is not an object$/ },
    { text: '{"tokenz":[]}', problem: /^delta\.json: unknown key tokenz$/ },
    { text: '{"tokens":{}}', problem: /^delta\.json: tokens must be a list of token overrides$/ },
    { text: '{"tokens":[{"token":1}]}', problem: /^delta\.json: tokens\[0\] is not a token override$/ },
    { text: '{"tokens":[{"add":{"group":"shape"}}]}', problem: /^delta\.json: tokens\[0\] is not a token override$/ },
    { text: '{"tokens":[{"remove":"a"},{"remove":2}]}', problem: /^delta\.json: tokens\[1\] is not a token override$/ },
    { text: '{"tokens":[3]}', problem: /^delta\.json: tokens\[0\] is not a token override$/ },
    { text: '{"pairs":"x"}', problem: /^delta\.json: pairs must be a list of pair changes$/ },
    { text: '{"pairs":[{"key":["light","a"],"set":{}}]}', problem: /^delta\.json: pairs\[0\] is not a pair change$/ },
    { text: '{"pairs":[{"key":["light","a",3],"set":{}}]}', problem: /^delta\.json: pairs\[0\] is not a pair change$/ },
    { text: '{"pairs":[{"key":["light","a","b"]}]}', problem: /^delta\.json: pairs\[0\] is not a pair change$/ },
    { text: '{"pairs":[{"key":["light","a","b"],"set":[]}]}', problem: /^delta\.json: pairs\[0\] is not a pair change$/ },
    { text: '{"pairs":[{"key":["light","a","b"],"remove":false}]}', problem: /^delta\.json: pairs\[0\] is not a pair change$/ },
    { text: '{"pairs":[{"key":["light","a","b"],"set":{},"remove":true}]}', problem: /^delta\.json: pairs\[0\] is not a pair change$/ },
    { text: '{"pairs":[{"add":"x"}]}', problem: /^delta\.json: pairs\[0\] is not a pair change$/ },
    { text: '{"pairs":[null]}', problem: /^delta\.json: pairs\[0\] is not a pair change$/ },
    // pairsList is closed (operator decision R1-01 (c)): only "empty" or "not-json", never with pairs, and the free-text
    // pairsText of round 1 is a part the contract does not name.
    { text: '{"pairsList":"[]\\n"}', problem: /^delta\.json: pairsList must be "empty" or "not-json"$/ },
    { text: '{"pairsList":"Empty"}', problem: /^delta\.json: pairsList must be "empty" or "not-json"$/ },
    { text: '{"pairsList":""}', problem: /^delta\.json: pairsList must be "empty" or "not-json"$/ },
    { text: '{"pairsList":1}', problem: /^delta\.json: pairsList must be "empty" or "not-json"$/ },
    { text: '{"pairsList":null}', problem: /^delta\.json: pairsList must be "empty" or "not-json"$/ },
    { text: '{"pairsList":["empty"]}', problem: /^delta\.json: pairsList must be "empty" or "not-json"$/ },
    { text: '{"pairs":[],"pairsList":"empty"}', problem: /^delta\.json: pairs and pairsList exclude each other$/ },
    { text: '{"pairs":[{"key":["light","a","b"],"remove":true}],"pairsList":"not-json"}', problem: /^delta\.json: pairs and pairsList exclude each other$/ },
    { text: '{"pairsText":"[]\\n"}', problem: /^delta\.json: unknown key pairsText$/ },
    { text: '{"pairsList":"empty","pairsText":"[]\\n"}', problem: /^delta\.json: unknown key pairsText$/ },
    { text: '{"generator":"real"}', problem: /^delta\.json: generator must be "wrapped"$/ },
    // exceptions is closed (research.md R-16): only "repository".
    { text: '{"exceptions":"plant"}', problem: /^delta\.json: exceptions must be "repository"$/ },
    { text: '{"exceptions":true}', problem: /^delta\.json: exceptions must be "repository"$/ },
    { text: '{"exceptions":["repository"]}', problem: /^delta\.json: exceptions must be "repository"$/ },
  ])("rejects $text", ({ text, problem }) => {
    expect(() => parseDelta(text)).toThrow(problem);
  });
});

describe("treeProblems", () => {
  const src = "packages/tokens/src";

  it("accepts a tree of other files, and none", () => {
    expect([treeProblems(["packages/elements/src/x.ts"], undefined), treeProblems([], { tokens: [] })]).toEqual([[], []]);
  });

  it("rejects the token source and the pair list in tree/, whatever the delta", () => {
    expect(treeProblems([`${src}/source.ts`, "packages/tokens/contrast/pairs.json"], { generator: "wrapped" })).toEqual([
      "tree/ holds packages/tokens/src/source.ts; a plant changes the token source by delta.json tokens",
      "tree/ holds packages/tokens/contrast/pairs.json; a plant changes the pair list by delta.json pairs",
      'delta.json sets generator "wrapped" but tree/ holds no packages/tokens/src/generate.ts',
    ]);
  });

  it("accepts generate.ts only with a wrapped generator, and needs it then", () => {
    expect(treeProblems([`${src}/generate.ts`], undefined)).toEqual(['tree/ holds packages/tokens/src/generate.ts without generator "wrapped" in delta.json']);
    expect(treeProblems([`${src}/generate.ts`], {})).toEqual(['tree/ holds packages/tokens/src/generate.ts without generator "wrapped" in delta.json']);
    expect(treeProblems([`${src}/generate.ts`], { generator: "wrapped" })).toEqual([]);
    expect(treeProblems([], { generator: "wrapped" })).toEqual(['delta.json sets generator "wrapped" but tree/ holds no packages/tokens/src/generate.ts']);
  });

  it("accepts overrides.ts only when the delta has no tokens part", () => {
    expect([treeProblems([`${src}/overrides.ts`], undefined), treeProblems([`${src}/overrides.ts`], { pairs: [] })]).toEqual([[], []]);
    expect(treeProblems([`${src}/overrides.ts`], { tokens: [] })).toEqual(["tree/ holds packages/tokens/src/overrides.ts and delta.json has tokens; one of them sets the overrides"]);
  });
});

describe("checkWrapper", () => {
  it.each([
    'export * from "./generate.real.ts";\n',
    "import x from './y.ts';\nexport * from './generate.real.ts'\nexport const a = 1;\n",
    'export * from "./generate.real.ts"; // the real generator\n',
  ])("accepts a wrapper that re-exports the real generator: %j", (text) => {
    expect(() => {
      checkWrapper(text);
    }).not.toThrow();
  });

  it.each([
    "export const css = 1;\n",
    'export * from "./generate.ts";\n',
    'export { css } from "./generate.real.ts";\n',
    '// export * from "./generate.real.ts";\n',
  ])("rejects a wrapper that does not: %j", (text) => {
    expect(() => {
      checkWrapper(text);
    }).toThrow('packages/tokens/src/generate.ts of a wrapped generator must re-export the real one: export * from "./generate.real.ts"');
  });
});

describe("applyPairChanges", () => {
  const a = { theme: "light", fg: "color-a", bg: "color-b", kind: "text", figure: "5.0", status: "checked", source: "computed" };
  const b = { ...a, theme: "dark" };
  const c = { ...a, fg: "color-c" };
  const text = `[\n  ${JSON.stringify(a)},\n  ${JSON.stringify(b)},\n  ${JSON.stringify(c)}\n]\n`;
  const list = (...entries: object[]): string => `[\n${entries.map((e) => `  ${JSON.stringify(e)}`).join(",\n")}\n]\n`;

  it("sets fields of the entry with the key, keeping its place, and writes one entry per line", () => {
    expect(applyPairChanges(text, [{ key: ["dark", "color-a", "color-b"], set: { figure: "4.27", status: "excluded", reason: "r" } }])).toBe(
      list(a, { ...b, figure: "4.27", status: "excluded", reason: "r" }, c),
    );
  });

  it("removes the entry with the key and appends an added entry, in the order of the changes", () => {
    const d = { ...a, fg: "color-d" };
    expect(applyPairChanges(text, [{ add: d }, { key: ["light", "color-a", "color-b"], remove: true }, { key: ["light", "color-d", "color-b"], set: { figure: "1" } }])).toBe(
      list(b, c, { ...d, figure: "1" }),
    );
  });

  it("writes an empty list as []", () => {
    expect(applyPairChanges(list(a), [{ key: ["light", "color-a", "color-b"], remove: true }])).toBe("[]\n");
  });

  it("returns the list rewritten one entry per line when there is no change", () => {
    expect(applyPairChanges(JSON.stringify([a, b]), [])).toBe(list(a, b));
  });

  it.each([
    { key: ["light", "color-x", "color-b"], problem: "delta.json pairs: key light/color-x/color-b matches no entry" },
    { key: ["sepia", "color-a", "color-b"], problem: "delta.json pairs: key sepia/color-a/color-b matches no entry" },
    { key: ["light", "color-a", "color-x"], problem: "delta.json pairs: key light/color-a/color-x matches no entry" },
  ])("fails naming a key that matches no entry: $key", ({ key, problem }) => {
    expect(() => applyPairChanges(text, [{ key: key as [string, string, string], remove: true }])).toThrow(problem);
    expect(() => applyPairChanges(text, [{ key: key as [string, string, string], set: {} }])).toThrow(problem);
  });

  it("fails naming a key that matches two entries", () => {
    expect(() => applyPairChanges(list(a, b, a), [{ key: ["light", "color-a", "color-b"], set: {} }])).toThrow("delta.json pairs: key light/color-a/color-b matches 2 entries");
  });

  it("keeps the JSON errors of delta.json and pairs.json as their causes", () => {
    const cause = (run: () => unknown): unknown => {
      try {
        run();
        return undefined;
      } catch (thrown) {
        return (thrown as Error).cause;
      }
    };
    expect([cause(() => parseDelta("{")), cause(() => applyPairChanges("{", []))].map((c) => c instanceof SyntaxError)).toEqual([true, true]);
  });

  it("fails on a pair list that is not a JSON list", () => {
    expect(() => applyPairChanges("{", [])).toThrow(/^pairs\.json is not valid JSON/);
    expect(() => applyPairChanges("{}", [])).toThrow("pairs.json is not a list");
  });
});

describe("overridesText", () => {
  it("writes an overrides.ts that exports the overrides, one per line from line 5", () => {
    expect(overridesText([{ token: "color-ink-muted", light: "#6B655A" }, { add: { name: "radius-4", group: "shape", value: "4px" } }])).toBe(
      [
        "// Token overrides written by the plant runner from the plant's delta.json (002 contracts/gates.md § Plant deltas).",
        'import type { TokenOverride } from "./generate.ts";',
        "",
        "export const overrides: readonly TokenOverride[] = [",
        '  {"token":"color-ink-muted","light":"#6B655A"},',
        '  {"add":{"name":"radius-4","group":"shape","value":"4px"}},',
        "];",
        "",
      ].join("\n"),
    );
  });

  it("writes an empty list", () => {
    expect(overridesText([]).split("\n").slice(3)).toEqual(["export const overrides: readonly TokenOverride[] = [", "];", ""]);
  });
});
