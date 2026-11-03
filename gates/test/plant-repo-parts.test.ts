import { describe, expect, it } from "vitest";
import {
  baseCommit,
  carriesConfiguration,
  identityEnv,
  ignoreMissing,
  mutationAuthor,
  packagePaths,
  parentRecords,
  parseCommits,
  recordsOf,
} from "../lib/plant-repo.ts";

// The decisions of the plant repositories (research.md R-10; phase 4 review round 1, R1-07 and R1-09): which file
// names are gate configuration, how commits.txt is read (separators, headers, authors, parents, merges), which
// records a commit's parents are, the identity a commit is made with, the base commit, and which file system errors
// mean "this optional part of the plant is absent".
describe("carriesConfiguration: names at the edges of each pattern", () => {
  it.each([
    "tsconfig.json",
    "tsconfig.build.json",
    "eslint.config.ts",
    "eslint.test.config.mjs",
    "eslint.my-x.config.js",
    ".eslintrc",
    ".eslintrc.json",
    "stylelint.config.ts",
    ".stylelintrc",
    "vitest.config.ts",
    "vitest.ab.config.ts",
    "vitest.my-x.workspace.ts",
    "vite.config.ts",
    "vite.ab.config.ts",
    "vite.my-x.config.mjs",
    "stryker.conf.js",
    "stryker.config.json",
  ])("names %s", (name) => {
    expect(carriesConfiguration([`tree/a/${name}`])).toEqual([`tree/a/${name}`]);
  });

  it.each([
    "mytsconfig.json",
    "tsconfig.json.bak",
    "tsconfig.jsonc",
    "my.eslint.config.ts",
    "eslint.config.ts.orig",
    "xstylelint.config.ts",
    "vitest.config.ts~",
    "avite.config.ts",
    "vite..config.ts",
    "vite.a b.config.ts",
    "stryker.conf",
    "stryker.config",
    "eslint.config",
    "x.eslintrc",
    "plant.json",
  ])("does not name %s", (name) => {
    expect(carriesConfiguration([`tree/a/${name}`])).toEqual([]);
  });
});

describe("parseCommits: separators and headers", () => {
  const record = (message: string): string => `author: A <a@example.com>\n\n${message}\n`;

  it("splits records only at a line that is %% alone, also at the end of the text, and skips blank records", () => {
    const text = `${record("one %% two")}%%\n\n%%\n${record("three\n%%x")}%%`;
    expect(parseCommits(text)).toEqual([
      { author: "A <a@example.com>", message: "one %% two" },
      { author: "A <a@example.com>", message: "three\n%%x" },
    ]);
  });

  it("names a record without a blank line after its headers as having no message", () => {
    expect(() => parseCommits("author: A <a@example.com>")).toThrow("record 1 has no message");
  });

  it.each([
    { line: "  author: A <a@example.com>", problem: "record 1: unknown header   author: A <a@example.com>" },
    { line: "garbage", problem: "record 1: unknown header garbage" },
    { line: "author:A <a@example.com>", problem: "record 1: unknown header author:A <a@example.com>" },
    { line: "author: <x> A <a@example.com>", problem: "record 1: author must be Name <email>" },
    { line: "author: A <a@example.com> x", problem: "record 1: author must be Name <email>" },
    { line: "author: A <a b@example.com>", problem: "record 1: author must be Name <email>" },
    { line: "parent: 0x", problem: "record 1: parent 0x is not an earlier record" },
    { line: "parent: x0", problem: "record 1: parent x0 is not an earlier record" },
    { line: "merge: 1.5 0", problem: "record 1: merge 1.5 0 must name two different earlier records" },
    { line: "merge: 0 -1", problem: "record 1: merge 0 -1 must name two different earlier records" },
    { line: "merge: 0 1 2", problem: "record 1: merge 0 1 2 must name two different earlier records" },
  ])("rejects the header $line", ({ line, problem }) => {
    expect(() => parseCommits(`${line}\n\nm\n`)).toThrow(problem);
  });

  it("reads a parent with leading zeros and a merge of the base commit", () => {
    const text = `${record("one")}%%\nauthor: B <b@example.com>\nparent: 01\n\ntwo\n%%\nauthor: B <b@example.com>\nmerge: 0 2\n\nthree\n`;
    expect(parseCommits(text)).toEqual([
      { author: "A <a@example.com>", message: "one" },
      { author: "B <b@example.com>", message: "two", parent: 1 },
      { author: "B <b@example.com>", message: "three", merge: [0, 2] },
    ]);
  });

  it("reads an author with a name of several words and a hyphenated header name as unknown", () => {
    expect(parseCommits("author: Ada Lovelace-Byron <a.l@example.co.uk>\n\nm\n")).toEqual([{ author: "Ada Lovelace-Byron <a.l@example.co.uk>", message: "m" }]);
    expect(() => parseCommits("author: A <a@example.com>\nco-author: B <b@example.com>\n\nm\n")).toThrow("record 1: unknown header co-author");
  });
});

describe("recordsOf", () => {
  it("is no record for a plant without commits.txt, and the parsed records otherwise", () => {
    expect([recordsOf(undefined), recordsOf("author: A <a@example.com>\n\nm\n")]).toEqual([[], [{ author: "A <a@example.com>", message: "m" }]]);
  });

  it("rejects an empty commits.txt", () => {
    expect(() => recordsOf("")).toThrow("commits.txt holds no record");
  });
});

describe("parentRecords", () => {
  it("is a merge's two records, a record's parent, or the record before it (0 is the base commit)", () => {
    const author = "A <a@example.com>";
    expect([
      parentRecords({ author, message: "m" }, 0),
      parentRecords({ author, message: "m" }, 3),
      parentRecords({ author, message: "m", parent: 0 }, 3),
      parentRecords({ author, message: "m", parent: 2 }, 3),
      parentRecords({ author, message: "m", merge: [1, 2] }, 3),
    ]).toEqual([[0], [3], [0], [2], [1, 2]]);
  });
});

describe("identityEnv", () => {
  it("makes the name and e-mail of `Name <email>` the author and the committer", () => {
    expect(identityEnv("Ada Lovelace <ada@example.com>")).toEqual({
      GIT_AUTHOR_NAME: "Ada Lovelace",
      GIT_AUTHOR_EMAIL: "ada@example.com",
      GIT_COMMITTER_NAME: "Ada Lovelace",
      GIT_COMMITTER_EMAIL: "ada@example.com",
    });
  });

  it("splits at the last ` <`", () => {
    expect(identityEnv("A <b> <c@example.com>")).toEqual({
      GIT_AUTHOR_NAME: "A <b>",
      GIT_AUTHOR_EMAIL: "c@example.com",
      GIT_COMMITTER_NAME: "A <b>",
      GIT_COMMITTER_EMAIL: "c@example.com",
    });
  });
});

describe("baseCommit and mutationAuthor", () => {
  it("is an empty base commit signed off by its invented RFC 2606 author (FR-034)", () => {
    expect(baseCommit()).toEqual({ author: "Plant Base <base@example.com>", message: "Plant base\n\nSigned-off-by: Plant Base <base@example.com>" });
  });

  it("names an invented RFC 2606 author for mutation plants (FR-034)", () => {
    expect(mutationAuthor).toBe("Plant Author <plant@example.com>");
  });
});

describe("packagePaths", () => {
  it("is each package directory below packages/", () => {
    expect([packagePaths(["tokens", "elements"]), packagePaths([])]).toEqual([["packages/tokens", "packages/elements"], []]);
  });
});

describe("ignoreMissing", () => {
  it("turns a read of a file that does not exist into undefined", async () => {
    const missing = Promise.reject(Object.assign(new Error("no such file"), { code: "ENOENT" }));
    await expect(missing.catch(ignoreMissing)).resolves.toBeUndefined();
  });

  it("rethrows any other error, and anything thrown that is not an error", () => {
    const denied = Object.assign(new Error("permission denied"), { code: "EACCES" });
    expect(() => {
      ignoreMissing(denied);
    }).toThrow(denied);
    expect(() => {
      ignoreMissing(new Error("plain"));
    }).toThrow("plain");
    expect(() => {
      ignoreMissing(null);
    }).toThrow();
    expect(() => {
      ignoreMissing("ENOENT");
    }).toThrow();
  });
});
