import { describe, expect, it } from "vitest";
import { carriesConfiguration, configurationSet, parseCommits } from "../lib/plant-repo.ts";

// The pure parts of gates/lib/plant-repo.ts (research.md R-10, contracts/plants.md): the configuration set copied
// into every temporary repository, the configuration a plant must not carry, and the records of commits.txt.
describe("configurationSet", () => {
  it("lists the root configuration, each package's manifest and tsconfig, and the modules the configurations import", () => {
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
