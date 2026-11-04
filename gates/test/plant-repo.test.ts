import { describe, expect, it } from "vitest";
import { applyPairChanges, carriesConfiguration, checkWrapper, configurationSet, overridesText, parseCommits, parseDelta, treeProblems } from "../lib/plant-repo.ts";

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
    ]);
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
  it("reads each part of a delta: token overrides, pair changes by key, the pair list text and the wrapped generator", () => {
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
    expect(parseDelta('{"pairsText":"[]\\n"}')).toEqual({ pairsText: "[]\n" });
    expect(parseDelta("{}")).toEqual({});
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
    { text: '{"pairsText":1}', problem: /^delta\.json: pairsText must be a string$/ },
    { text: '{"pairs":[],"pairsText":"[]"}', problem: /^delta\.json: pairs and pairsText exclude each other$/ },
    { text: '{"generator":"real"}', problem: /^delta\.json: generator must be "wrapped"$/ },
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
