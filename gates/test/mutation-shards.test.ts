import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { mutation } from "../bin/mutation.ts";
import type { MutationTools } from "../bin/mutation.ts";
import { changedFiles } from "../lib/mutation/ranges.ts";
import type { ChangedFile, LineRange } from "../lib/mutation/ranges.ts";
import { countCuts, formatPlan, planShards, selectFiles } from "../lib/mutation/shards.ts";
import {
  base,
  capture,
  context,
  fakeGit,
  fakeRepo,
  fakeStryker,
  mutant,
  newFilesDiff,
  reportPath,
  skippingStryker,
  strykerReport,
} from "./mutation-fakes.ts";

// CI shards (FR-013, research.md R-08): the changed files, sorted by path, become entries: a file of at most 120
// changed lines is one entry `path`, a file of more is split by line range into entries `path:start-end` of at most
// 120 changed lines (operator decision, phase 3 round 9, O9-01: plant-judge.ts alone took 9:49 of 10 minutes); the
// entries are filled greedily into shards of at most 10 entries and 250 changed lines (500 until T093, operator
// decision, phase 4 round 3), an entry never crossing a shard and two entries of one file never sharing one
// (operator decision, phase 3 round 10, O10-01). `--plan` prints them, and on stderr the number of shards and of cuts
// within files (O10-02); `--files` limits a run to one shard's entries and mutates only the changed lines inside
// them; and the base argument (`--base`, required, must resolve to a commit).
function file(path: string, lines: number): ChangedFile {
  return { path, ranges: [{ start: 1, end: lines }], lines };
}

function files(count: number, lines: number): ChangedFile[] {
  return Array.from({ length: count }, (_, i) => file(`gates/lib/f${String(i).padStart(2, "0")}.ts`, lines));
}

function ranged(path: string, ...ranges: LineRange[]): ChangedFile {
  return { path, ranges, lines: ranges.reduce((sum, range) => sum + range.end - range.start + 1, 0) };
}

// `git diff --unified=0 --no-color --no-ext-diff bdb9b70 fffb7e7 -- gates/lib/plant-judge.ts`: the file whose shard
// took 9:49 on GitHub run 41635769914 (216 changed lines, a new file, so one range).
const plantJudge = readFileSync(new URL("fixtures/git-diff/plant-judge.diff", import.meta.url), "utf8");

describe("planShards: the split within files (phase 3 round 9, O9-01)", () => {
  it("keeps a file of exactly 120 changed lines as one entry, its path", () => {
    expect(planShards([file("gates/lib/a.ts", 120)])).toEqual([{ files: ["gates/lib/a.ts"], lines: 120 }]);
  });

  it("splits a file of 121 changed lines into an entry of 120 lines and one of 1, in two shards", () => {
    expect(planShards([file("gates/lib/a.ts", 121)])).toEqual([
      { files: ["gates/lib/a.ts:1-120"], lines: 120 },
      { files: ["gates/lib/a.ts:121-121"], lines: 1 },
    ]);
  });

  it("cuts inside a changed range where the count reaches 120, each entry from its first to its last changed line", () => {
    expect(planShards([ranged("gates/lib/a.ts", { start: 5, end: 54 }, { start: 60, end: 150 })])).toEqual([
      { files: ["gates/lib/a.ts:5-129"], lines: 120 },
      { files: ["gates/lib/a.ts:130-150"], lines: 21 },
    ]);
  });

  it("starts the next entry at its first changed line when a cut falls at the end of a range", () => {
    expect(planShards([ranged("gates/lib/a.ts", { start: 1, end: 120 }, { start: 200, end: 210 })])).toEqual([
      { files: ["gates/lib/a.ts:1-120"], lines: 120 },
      { files: ["gates/lib/a.ts:200-210"], lines: 11 },
    ]);
  });

  it("splits a file of 216 changed lines across several ranges into entries of 120 and 96 lines", () => {
    const changed = ranged("gates/lib/a.ts", { start: 3, end: 40 }, { start: 50, end: 50 }, { start: 60, end: 160 }, { start: 200, end: 275 });
    expect(changed.lines).toBe(216);
    // 3-40, 50 and 60-140 are 38 + 1 + 81 = 120 changed lines; 141-160 and 200-275 are 20 + 76 = 96.
    expect(planShards([changed, file("gates/lib/b.ts", 34)])).toEqual([
      { files: ["gates/lib/a.ts:3-140"], lines: 120 },
      { files: ["gates/lib/a.ts:141-275", "gates/lib/b.ts"], lines: 130 },
    ]);
  });

  it("splits gates/lib/plant-judge.ts as changed at fffb7e7 (216 lines) into entries of 120 and 96 lines, in two shards", () => {
    expect(planShards(changedFiles(plantJudge))).toEqual([
      { files: ["gates/lib/plant-judge.ts:1-120"], lines: 120 },
      { files: ["gates/lib/plant-judge.ts:121-216"], lines: 96 },
    ]);
  });

  it("splits a file of exactly 240 changed lines into two entries of 120, and no empty third", () => {
    expect(planShards([file("gates/lib/a.ts", 240)])).toEqual([
      { files: ["gates/lib/a.ts:1-120"], lines: 120 },
      { files: ["gates/lib/a.ts:121-240"], lines: 120 },
    ]);
  });

  it("splits a file of 241 changed lines into entries of 120, 120 and 1, in three shards", () => {
    expect(planShards([file("gates/lib/a.ts", 241)])).toEqual([
      { files: ["gates/lib/a.ts:1-120"], lines: 120 },
      { files: ["gates/lib/a.ts:121-240"], lines: 120 },
      { files: ["gates/lib/a.ts:241-241"], lines: 1 },
    ]);
  });
});

describe("planShards", () => {
  it("has no shard when no file changed, and one shard for one changed file", () => {
    expect(planShards([])).toEqual([]);
    expect(planShards([file("a.ts", 3)])).toEqual([{ files: ["a.ts"], lines: 3 }]);
  });

  it("fills shards of up to 10 files, in path order", () => {
    const changed = files(12, 10).reverse();
    expect(planShards(changed)).toEqual([
      { files: files(10, 10).map((f) => f.path), lines: 100 },
      { files: ["gates/lib/f10.ts", "gates/lib/f11.ts"], lines: 20 },
    ]);
  });

  it("fills shards of up to 250 changed lines, exactly 250 included, splitting files over 120 lines", () => {
    const changed = [file("a.ts", 150), file("b.ts", 100), file("c.ts", 120), file("d.ts", 1)];
    expect(planShards(changed)).toEqual([
      { files: ["a.ts:1-120"], lines: 120 },
      { files: ["a.ts:121-150", "b.ts", "c.ts"], lines: 250 },
      { files: ["d.ts"], lines: 1 },
    ]);
  });

  it("fits a file's last entry and the next file's first entry in one shard, never two entries of one file", () => {
    expect(planShards([file("a.ts", 125), file("b.ts", 125)])).toEqual([
      { files: ["a.ts:1-120"], lines: 120 },
      { files: ["a.ts:121-125", "b.ts:1-120"], lines: 125 },
      { files: ["b.ts:121-125"], lines: 5 },
    ]);
  });

  it("splits entries of 251 changed lines together into two shards, no entry crossing a shard", () => {
    expect(planShards([file("a.ts", 120), file("b.ts", 120), file("c.ts", 11)])).toEqual([
      { files: ["a.ts", "b.ts"], lines: 240 },
      { files: ["c.ts"], lines: 11 },
    ]);
  });

  it("splits a file of 251 changed lines across shards by line range (phase 3 round 9, O9-01)", () => {
    const changed = [file("a.ts", 10), file("b.ts", 251), file("c.ts", 10)];
    expect(planShards(changed)).toEqual([
      { files: ["a.ts", "b.ts:1-120"], lines: 130 },
      { files: ["b.ts:121-240"], lines: 120 },
      { files: ["b.ts:241-251", "c.ts"], lines: 21 },
    ]);
  });

  it("splits a file of more than 250 changed lines across shards by line range (phase 3 round 9, O9-01)", () => {
    const changed = [file("a.ts", 10), file("b.ts", 700), file("c.ts", 10)];
    expect(planShards(changed)).toEqual([
      { files: ["a.ts", "b.ts:1-120"], lines: 130 },
      { files: ["b.ts:121-240"], lines: 120 },
      { files: ["b.ts:241-360"], lines: 120 },
      { files: ["b.ts:361-480"], lines: 120 },
      { files: ["b.ts:481-600"], lines: 120 },
      { files: ["b.ts:601-700", "c.ts"], lines: 110 },
    ]);
  });

  it("starts a new shard for the next entry of a file, though both would fit (phase 3 round 10, O10-01)", () => {
    expect(planShards([file("a.ts", 200)])).toEqual([
      { files: ["a.ts:1-120"], lines: 120 },
      { files: ["a.ts:121-200"], lines: 80 },
    ]);
  });

  it("starts a new shard when the next entry would make 11 entries, counting a split file's entries", () => {
    const changed = [file("gates/lib/a.ts", 130), ...files(10, 1)];
    expect(planShards(changed)).toEqual([
      { files: ["gates/lib/a.ts:1-120"], lines: 120 },
      { files: ["gates/lib/a.ts:121-130", ...files(9, 1).map((f) => f.path)], lines: 19 },
      { files: ["gates/lib/f09.ts"], lines: 1 },
    ]);
  });
});

describe("planShards: one file's entries in separate shards (phase 3 round 10, O10-01)", () => {
  // The path of an entry: the text before the last `:start-end`, or the whole entry.
  const pathOf = (entry: string): string => entry.replace(/:\d+-\d+$/, "");
  const mixed = [
    file("gates/lib/a.ts", 7),
    file("gates/lib/b.ts", 361),
    ranged("gates/lib/c.ts", { start: 4, end: 90 }, { start: 100, end: 260 }),
    file("gates/lib/d.ts", 120),
    file("gates/lib/e.ts", 121),
    ...files(12, 3),
    file("packages/tokens/src/g.ts", 249),
  ];

  it("holds no two entries of one file in any shard, within the 10-entry and 250-line bounds", () => {
    const shards = planShards(mixed);
    for (const shard of shards) {
      const paths = shard.files.map(pathOf);
      expect(new Set(paths).size).toBe(paths.length);
      expect(shard.files.length).toBeLessThanOrEqual(10);
      expect(shard.lines).toBeLessThanOrEqual(250);
    }
    expect(shards.reduce((sum, shard) => sum + shard.lines, 0)).toBe(mixed.reduce((sum, f) => sum + f.lines, 0));
  });

  it("lets an entry share a shard with other files: after a smaller file, and before the next file", () => {
    expect(planShards([file("a.ts", 30), file("b.ts", 130), file("c.ts", 40)])).toEqual([
      { files: ["a.ts", "b.ts:1-120"], lines: 150 },
      { files: ["b.ts:121-130", "c.ts"], lines: 50 },
    ]);
  });

  it("puts the recorded plant-judge.ts entries in separate shards, each beside other files", () => {
    const changed = [file("gates/lib/a.ts", 30), ...changedFiles(plantJudge), file("gates/lib/z.ts", 100)];
    expect(planShards(changed)).toEqual([
      { files: ["gates/lib/a.ts", "gates/lib/plant-judge.ts:1-120"], lines: 150 },
      { files: ["gates/lib/plant-judge.ts:121-216", "gates/lib/z.ts"], lines: 196 },
    ]);
  });
});

describe("countCuts (phase 3 round 10, O10-02)", () => {
  it("counts no cut in no shard, nor in whole files", () => {
    expect(countCuts([])).toBe(0);
    expect(countCuts(planShards([file("gates/lib/a.ts", 120), file("gates/lib/b.ts", 3)]))).toBe(0);
  });

  it("counts n - 1 cuts for a file of n entries, summed over the files", () => {
    expect(countCuts(planShards([file("gates/lib/a.ts", 121)]))).toBe(1);
    expect(countCuts(planShards([file("gates/lib/a.ts", 241), file("gates/lib/b.ts", 7), file("gates/lib/c.ts", 700)]))).toBe(2 + 5);
  });

  it("reads an entry's file as the entry less its last :start-end, so a path holding :1-2 keeps it", () => {
    const shards = planShards([file("gates/lib/x:1-2.ts", 130), file("gates/lib/x.ts", 130)]);
    expect(shards.map((shard) => shard.files)).toEqual([
      ["gates/lib/x:1-2.ts:1-120"],
      ["gates/lib/x:1-2.ts:121-130", "gates/lib/x.ts:1-120"],
      ["gates/lib/x.ts:121-130"],
    ]);
    expect(countCuts(shards)).toBe(2);
  });

  it("reads a whole entry whose path holds :start- before .ts as its own file", () => {
    expect(countCuts(planShards([file("gates/lib/x:1-2.ts", 7), file("gates/lib/x:3-4.ts", 7)]))).toBe(0);
  });
});

describe("formatPlan", () => {
  it("prints the shards as one line of JSON, each with its files comma-separated for --files", () => {
    const plan = formatPlan([
      { files: ["gates/lib/a.ts", "gates/lib/b.ts"], lines: 20 },
      { files: ["packages/tokens/src/c.ts"], lines: 3 },
    ]);
    expect(plan).toBe(
      '[{"files":"gates/lib/a.ts,gates/lib/b.ts","lines":20},{"files":"packages/tokens/src/c.ts","lines":3}]',
    );
  });

  it("prints a shard's line-range entries comma-separated in files", () => {
    expect(formatPlan(planShards([file("gates/lib/a.ts", 130), file("gates/lib/b.ts", 3)]))).toBe(
      '[{"files":"gates/lib/a.ts:1-120","lines":120},{"files":"gates/lib/a.ts:121-130,gates/lib/b.ts","lines":13}]',
    );
  });
});

describe("selectFiles", () => {
  const changed = [file("gates/lib/a.ts", 2), file("gates/lib/b.ts", 3), file("gates/lib/c.ts", 4)];

  it("selects the listed changed files, ignoring spaces and empty entries", () => {
    expect(selectFiles(changed, " gates/lib/c.ts,,gates/lib/a.ts ")).toEqual({
      files: [file("gates/lib/a.ts", 2), file("gates/lib/c.ts", 4)],
    });
  });

  it("names every listed path that is not a changed file", () => {
    expect(selectFiles(changed, "gates/lib/a.ts,gates/lib/x.ts,gates/lib/y.ts")).toEqual({
      missing: ["gates/lib/x.ts", "gates/lib/y.ts"],
    });
  });
});

describe("selectFiles: path:start-end entries (phase 3 round 9, O9-01)", () => {
  const split = ranged("gates/lib/a.ts", { start: 2, end: 4 }, { start: 8, end: 9 }, { start: 20, end: 30 });
  const changed = [split, file("gates/lib/b.ts", 3), file("gates/lib/a:b.ts", 2)];

  it("cuts the file's changed ranges to the entry's lines", () => {
    expect(selectFiles(changed, "gates/lib/a.ts:3-8")).toEqual({
      files: [ranged("gates/lib/a.ts", { start: 3, end: 4 }, { start: 8, end: 8 })],
    });
  });

  it("keeps the changed ranges an entry holds whole, and leaves out those outside it", () => {
    expect(selectFiles(changed, "gates/lib/a.ts:1-10")).toEqual({
      files: [ranged("gates/lib/a.ts", { start: 2, end: 4 }, { start: 8, end: 9 })],
    });
  });

  it("joins entries of one file into one selected file, merging adjacent ranges, in diff order", () => {
    expect(selectFiles(changed, "gates/lib/b.ts,gates/lib/a.ts:21-25,gates/lib/a.ts:2-3,gates/lib/a.ts:26-40")).toEqual({
      files: [ranged("gates/lib/a.ts", { start: 2, end: 3 }, { start: 21, end: 30 }), file("gates/lib/b.ts", 3)],
    });
  });

  it("reads the last :start-end as the range, so a path holding a colon keeps it", () => {
    expect(selectFiles(changed, "gates/lib/a:b.ts:2-2,gates/lib/a:b.ts")).toEqual({
      files: [file("gates/lib/a:b.ts", 2)],
    });
    expect(selectFiles(changed, "gates/lib/a:b.ts:2-2")).toEqual({ files: [ranged("gates/lib/a:b.ts", { start: 2, end: 2 })] });
  });

  it("takes a changed path holding .ts: whole, before reading a range suffix", () => {
    const odd = file("gates/lib/a.ts:b.ts", 2);
    expect(selectFiles([odd], "gates/lib/a.ts:b.ts")).toEqual({ files: [odd] });
  });

  it("names an entry whose path is not a changed file", () => {
    expect(selectFiles(changed, "gates/lib/a.ts:2-3,gates/lib/x.ts:1-5")).toEqual({ missing: ["gates/lib/x.ts:1-5"] });
  });

  it("names every entry whose range holds no changed line", () => {
    expect(selectFiles(changed, "gates/lib/a.ts:5-7,gates/lib/a.ts:2-2,gates/lib/a.ts:31-99")).toEqual({
      empty: ["gates/lib/a.ts:5-7", "gates/lib/a.ts:31-99"],
    });
  });

  it.each(["0-3", "5-3", "a-b", "3", "1-2-3", "-1-3", "", "1-", " 1-3"])("names the malformed range :%s", (range) => {
    expect(selectFiles(changed, `gates/lib/a.ts:2-2,gates/lib/a.ts:${range}`)).toEqual({ malformed: [`gates/lib/a.ts:${range}`] });
  });

  it("names malformed entries before missing paths, and missing paths before empty ranges", () => {
    expect(selectFiles(changed, "gates/lib/a.ts:5-7,gates/lib/x.ts,gates/lib/a.ts:0-1")).toEqual({ malformed: ["gates/lib/a.ts:0-1"] });
    expect(selectFiles(changed, "gates/lib/a.ts:5-7,gates/lib/x.ts")).toEqual({ missing: ["gates/lib/x.ts"] });
  });
});

describe("mutation gate: --plan, --files and --base", () => {
  const diff = newFilesDiff({ "gates/lib/b.ts": 3, "gates/lib/a.ts": 2 });
  const files = { "gates/lib/a.ts": "export const a = 1;\n", "gates/lib/b.ts": "export const b = 1;\n" };
  const survives = fakeStryker(() => "Survived");
  const planLine = (counts: string): string =>
    `mutation: plan: ${counts} within files (a mutant spanning a cut is mutated in no shard, see gates/README.md)`;

  async function gate(args: readonly string[], tools: MutationTools) {
    const { io, out, err } = capture();
    const code = await mutation(context(args), tools, io);
    return { code, out, err };
  }

  it("--plan prints the shards of the changed files and runs no Stryker", async () => {
    expect(await gate(["--base", base, "--plan"], { git: fakeGit(diff), ...fakeRepo(files) })).toEqual({
      code: 0,
      out: ['[{"files":"gates/lib/a.ts,gates/lib/b.ts","lines":5}]'],
      err: [planLine("1 shard, 0 cuts")],
    });
  });

  it("--plan prints no shard when nothing changed, and 0 shards and 0 cuts on stderr", async () => {
    expect(await gate(["--plan", "--base", base], { git: fakeGit(""), ...fakeRepo(files) })).toEqual({
      code: 0,
      out: ["[]"],
      err: [planLine("0 shards, 0 cuts")],
    });
  });

  it("--plan writes 1 cut in the singular, for a file split into two entries (phase 3 round 10, O10-02)", async () => {
    const split = newFilesDiff({ "gates/lib/a.ts": 130 });
    expect(await gate(["--base", base, "--plan"], { git: fakeGit(split), ...fakeRepo(files) })).toEqual({
      code: 0,
      out: ['[{"files":"gates/lib/a.ts:1-120","lines":120},{"files":"gates/lib/a.ts:121-130","lines":10}]'],
      err: [planLine("2 shards, 1 cut")],
    });
  });

  it("--plan writes the cuts of several split files summed, n - 1 for a file of n entries (phase 3 round 10, O10-02)", async () => {
    const split = newFilesDiff({ "gates/lib/a.ts": 250, "gates/lib/b.ts": 130, "gates/lib/c.ts": 5, "gates/lib/d.ts": 361 });
    expect(await gate(["--base", base, "--plan"], { git: fakeGit(split), ...fakeRepo(files) })).toEqual({
      code: 0,
      out: [
        JSON.stringify([
          { files: "gates/lib/a.ts:1-120", lines: 120 },
          { files: "gates/lib/a.ts:121-240", lines: 120 },
          { files: "gates/lib/a.ts:241-250,gates/lib/b.ts:1-120", lines: 130 },
          { files: "gates/lib/b.ts:121-130,gates/lib/c.ts,gates/lib/d.ts:1-120", lines: 135 },
          { files: "gates/lib/d.ts:121-240", lines: 120 },
          { files: "gates/lib/d.ts:241-360", lines: 120 },
          { files: "gates/lib/d.ts:361-361", lines: 1 },
        ]),
      ],
      err: [planLine("7 shards, 6 cuts")],
    });
  });

  it("mutates every changed file without --files", async () => {
    expect(await gate(["--", "--base", base], { git: fakeGit(diff), ...fakeRepo(files, survives) })).toEqual({
      code: 1,
      out: [
        "gates/lib/b.ts:1: mutation: ConditionalExpression: Survived: replaced by true",
        "gates/lib/a.ts:1: mutation: ConditionalExpression: Survived: replaced by true",
        "mutation: 2 findings in 2 changed files (2 mutants on changed lines)",
      ],
      err: [],
    });
  });

  it("--files limits the run to the listed changed files", async () => {
    const result = await gate(["--base", base, "--files", "gates/lib/a.ts"], {
      git: fakeGit(diff),
      ...fakeRepo(files, survives),
    });
    expect(result).toEqual({
      code: 1,
      out: [
        "gates/lib/a.ts:1: mutation: ConditionalExpression: Survived: replaced by true",
        "mutation: 1 finding in 1 changed file (1 mutant on changed lines)",
      ],
      err: [],
    });
  });

  it("--files naming a file with no changed line exits 2", async () => {
    expect(
      await gate(["--base", base, "--files", "gates/lib/a.ts,gates/lib/x.ts"], {
        git: fakeGit(diff),
        ...fakeRepo(files),
      }),
    ).toEqual({
      code: 2,
      out: [],
      err: [
        "mutation: could not run: --files names a file with no changed package or gate source line: gates/lib/x.ts; " +
          "run --plan for the shards",
      ],
    });
  });

  it("exits 2 when --base does not resolve to a commit", async () => {
    expect(await gate(["--base", "nope"], { git: fakeGit(diff), ...fakeRepo(files) })).toEqual({
      code: 2,
      out: [],
      err: [
        "mutation: could not run: --base nope does not resolve to a commit; pass an existing commit " +
          "(in CI, check out with fetch-depth: 0)",
      ],
    });
  });

  it("exits 2 when --base is missing", async () => {
    expect(await gate(["--plan"], { git: fakeGit(diff), ...fakeRepo(files) })).toEqual({
      code: 2,
      out: [],
      err: [
        "mutation: could not run: --base <sha> is required (the pull request's base commit, or the phase's base.sha); " +
          "usage: gate:mutation -- --base <sha> [--plan | --files <path>[:<start>-<end>][,...]]",
      ],
    });
  });

  it.each([
    { args: ["--base"], problem: "--base needs a value" },
    { args: ["--base", base, "--files"], problem: "--files needs a value" },
    { args: ["--base", base, "--files", ""], problem: "--files needs a value" },
    { args: ["--base", base, "--verbose"], problem: "unknown argument --verbose" },
  ])("exits 2 on $problem", async ({ args, problem }) => {
    expect(await gate(args, { git: fakeGit(diff), ...fakeRepo(files) })).toEqual({
      code: 2,
      out: [],
      err: [
        `mutation: could not run: ${problem}; usage: gate:mutation -- --base <sha> [--plan | --files <path>[:<start>-<end>][,...]]`,
      ],
    });
  });

  it("exits 2 with git's message when git diff fails", async () => {
    const git = fakeGit(diff, "fatal: bad object 4ac76fd7\nmore detail\n");
    expect(await gate(["--base", base], { git, ...fakeRepo(files) })).toEqual({
      code: 2,
      out: [],
      err: ["mutation: could not run: git diff failed (fatal: bad object 4ac76fd7)"],
    });
  });

  it("exits 2 with the first line of git's message after leading blank lines (added: mutation run)", async () => {
    const git = fakeGit(diff, "\n  fatal: bad revision\nmore detail\n");
    expect(await gate(["--base", base], { git, ...fakeRepo(files) })).toEqual({
      code: 2,
      out: [],
      err: ["mutation: could not run: git diff failed (fatal: bad revision)"],
    });
  });

  it("names every listed file with no changed line, comma-separated (added: mutation run)", async () => {
    expect(
      await gate(["--base", base, "--files", "gates/lib/x.ts,gates/lib/a.ts,gates/lib/y.ts"], {
        git: fakeGit(diff),
        ...fakeRepo(files),
      }),
    ).toMatchObject({
      code: 2,
      err: [
        "mutation: could not run: --files names a file with no changed package or gate source line: " +
          "gates/lib/x.ts, gates/lib/y.ts; run --plan for the shards",
      ],
    });
  });

  it("exits 2 when Stryker's report cannot be used, after nothing else is printed", async () => {
    const stryker = () => ({ exitCode: 1, stdout: "ERROR Stryker Something broke.\n", stderr: "" });
    expect(await gate(["--base", base], { git: fakeGit(diff), ...fakeRepo(files, stryker) })).toEqual({
      code: 2,
      out: [],
      err: ["mutation: could not run: Stryker wrote no report (Something broke.); run pnpm test and check stryker.config.json"],
    });
  });
});

describe("mutation gate: --plan and --files with line-range entries (phase 3 round 9, O9-01)", () => {
  // gates/lib/a.ts: lines 2 to 4, 8 and 9, and 20 to 30 changed; gates/lib/b.ts: a new file of 130 lines.
  const diff = [
    "diff --git a/gates/lib/a.ts b/gates/lib/a.ts",
    "index 1111111..2222222 100644",
    "--- a/gates/lib/a.ts",
    "+++ b/gates/lib/a.ts",
    "@@ -1,0 +2,3 @@ export const a = 1;",
    "+export const a2 = 2;",
    "+export const a3 = 3;",
    "+export const a4 = 4;",
    "@@ -5,0 +8,2 @@ export const a7 = 7;",
    "+export const a8 = 8;",
    "+export const a9 = 9;",
    "@@ -15,0 +20,11 @@ export const a19 = 19;",
    ...Array.from({ length: 11 }, (_, i) => `+export const a${String(i + 20)} = ${String(i + 20)};`),
    newFilesDiff({ "gates/lib/b.ts": 130 }),
  ].join("\n");
  const sources = { "gates/lib/a.ts": "export const a = 1;\n", "gates/lib/b.ts": "export const b = 1;\n" };

  async function gate(args: readonly string[]) {
    const { io, out, err } = capture();
    const mutated: string[] = [];
    const stryker = fakeStryker(() => "Killed");
    const tools = { git: fakeGit(diff), ...fakeRepo(sources, (mutate, tree) => (mutated.push(...mutate), stryker(mutate, tree))) };
    const code = await mutation(context(args), tools, io);
    return { code, out, err, mutated };
  }

  it("--plan splits a file of more than 120 changed lines into path:start-end entries", async () => {
    expect(await gate(["--base", base, "--plan"])).toEqual({
      code: 0,
      out: ['[{"files":"gates/lib/a.ts,gates/lib/b.ts:1-120","lines":136},{"files":"gates/lib/b.ts:121-130","lines":10}]'],
      err: ["mutation: plan: 2 shards, 1 cut within files (a mutant spanning a cut is mutated in no shard, see gates/README.md)"],
      mutated: [],
    });
  });

  it("--files with an entry path:start-end mutates only the changed lines inside it", async () => {
    expect(await gate(["--base", base, "--files", "gates/lib/a.ts:3-25"])).toEqual({
      code: 0,
      out: ["mutation: 3 mutants on the changed lines of 1 file, none survived; 0 equivalent records"],
      err: [],
      mutated: ["gates/lib/a.ts:3-4", "gates/lib/a.ts:8-9", "gates/lib/a.ts:20-25"],
    });
  });

  it("--files with one entry of a split file, and with the plan's whole files value, entries of one file joined", async () => {
    expect(await gate(["--base", base, "--files", "gates/lib/b.ts:121-130"])).toEqual({
      code: 0,
      out: ["mutation: 1 mutant on the changed lines of 1 file, none survived; 0 equivalent records"],
      err: [],
      mutated: ["gates/lib/b.ts:121-130"],
    });
    expect(await gate(["--base", base, "--files", "gates/lib/a.ts,gates/lib/b.ts:1-120,gates/lib/b.ts:121-130"])).toEqual({
      code: 0,
      out: ["mutation: 4 mutants on the changed lines of 2 files, none survived; 0 equivalent records"],
      err: [],
      mutated: ["gates/lib/a.ts:2-4", "gates/lib/a.ts:8-9", "gates/lib/a.ts:20-30", "gates/lib/b.ts:1-130"],
    });
  });

  it.each([
    {
      problem: "a malformed range",
      files: "gates/lib/a.ts:2-4,gates/lib/a.ts:9-8,gates/lib/b.ts:0-1",
      cause: "--files names a malformed range (path:start-end, 1 <= start <= end): gates/lib/a.ts:9-8, gates/lib/b.ts:0-1",
    },
    {
      problem: "a path that is not a changed file",
      files: "gates/lib/a.ts:2-4,gates/lib/x.ts:1-5",
      cause: "--files names a file with no changed package or gate source line: gates/lib/x.ts:1-5",
    },
    {
      problem: "a range with no changed line",
      files: "gates/lib/a.ts:5-7,gates/lib/b.ts:131-140",
      cause: "--files names a range with no changed line: gates/lib/a.ts:5-7, gates/lib/b.ts:131-140",
    },
  ])("exits 2 naming the entries on $problem, before Stryker runs", async ({ files, cause }) => {
    expect(await gate(["--base", base, "--files", files])).toEqual({
      code: 2,
      out: [],
      err: [`mutation: could not run: ${cause}; run --plan for the shards`],
      mutated: [],
    });
  });
});

describe("mutation gate: the report of this run, never an earlier one (review round 1, R1-01)", () => {
  const diff = newFilesDiff({ "gates/lib/a.ts": 2 });
  const files = { "gates/lib/a.ts": "export const a = 1;\nexport const b = 2;\n" };
  const killedEarlier = strykerReport({ "gates/lib/a.ts": [mutant("0", 1, "Killed"), mutant("1", 2, "Killed")] });
  const survivedEarlier = strykerReport({ "gates/lib/a.ts": [mutant("0", 1, "Survived")] });

  async function gate(tools: MutationTools) {
    const { io, out, err } = capture();
    const code = await mutation(context(["--base", base]), tools, io);
    return { code, out, err };
  }

  it("exits 2 when Stryker writes no report, even though an earlier run left one that passes", async () => {
    const writesNone = () => ({
      exitCode: 1,
      stdout: "12:00:00 (4242) INFO ProjectReader Found 1 of 9 file(s) to be mutated.\n",
      stderr: '12:00:01 (4242) ERROR Stryker Cannot find TestRunner plugin "nonexistent".\n',
    });
    expect(await gate({ git: fakeGit(diff), ...fakeRepo({ ...files, [reportPath]: killedEarlier }, writesNone) })).toEqual({
      code: 2,
      out: [],
      err: [
        'mutation: could not run: Stryker wrote no report (Cannot find TestRunner plugin "nonexistent".); ' +
          "run pnpm test and check stryker.config.json",
      ],
    });
  });

  it("names the last error of Stryker's stdout and then its stderr", async () => {
    const writesNone = () => ({
      exitCode: 1,
      stdout: "12:00:00 (4242) ERROR Stryker first on stdout\n",
      stderr: "12:00:01 (4242) ERROR Stryker last on stderr\n",
    });
    expect(await gate({ git: fakeGit(diff), ...fakeRepo(files, writesNone) })).toMatchObject({
      code: 2,
      err: ["mutation: could not run: Stryker wrote no report (last on stderr); run pnpm test and check stryker.config.json"],
    });
  });

  it("decides on the report this run wrote, over an earlier run's report", async () => {
    const tools = { git: fakeGit(diff), ...fakeRepo({ ...files, [reportPath]: survivedEarlier }, fakeStryker(() => "Killed")) };
    expect(await gate(tools)).toEqual({
      code: 0,
      out: ["mutation: 1 mutant on the changed lines of 1 file, none survived; 0 equivalent records"],
      err: [],
    });
  });
});

// Phase 3 round 12 (O12-01; tasks.md T099; research.md R-08 "Unread `mutate` entries"): a changed in-scope file
// under a folder Stryker never reads (here .next and .NUXT) gets no mutant and only Stryker's warning (the double
// logs the line of a real run, gates/test/fixtures/stryker/unread-pattern.output.txt); the gate exits 2 naming each
// such entry as Stryker logged it, in the whole-diff run and in a `--files` run alike, though every read file passes.
describe("mutation gate: a mutate entry Stryker did not read (phase 3 round 12, O12-01)", () => {
  const diff = newFilesDiff({ "gates/lib/a.ts": 2, "packages/tokens/src/.NUXT/z.ts": 3, "packages/tokens/src/.next/y.ts": 130 });
  const sources = {
    "gates/lib/a.ts": "export const a = 1;\nexport const b = 2;\n",
    "packages/tokens/src/.NUXT/z.ts": "export const z = 1;\n",
    "packages/tokens/src/.next/y.ts": "export const y = 1;\n",
  };
  const unread = (entries: string): string =>
    "mutation: could not run: Stryker did not read these mutate entries (it skips every file under a folder named " +
    `node_modules, .git, .next, .nuxt, .svelte-kit or .stryker-tmp, in any case): ${entries}; ` +
    "move the files out of such a folder";

  async function gate(args: readonly string[]) {
    const { io, out, err } = capture();
    const mutated: string[] = [];
    const stryker = skippingStryker(() => "Killed");
    const tools = { git: fakeGit(diff), ...fakeRepo(sources, (mutate, tree) => (mutated.push(...mutate), stryker(mutate, tree))) };
    const code = await mutation(context(["--base", base, ...args]), tools, io);
    return { code, out, err, mutated };
  }

  it("exits 2 in the whole-diff run, naming every unread entry, with nothing on stdout", async () => {
    expect(await gate([])).toEqual({
      code: 2,
      out: [],
      err: [unread("packages/tokens/src/.NUXT/z.ts:1-3, packages/tokens/src/.next/y.ts:1-130")],
      mutated: ["gates/lib/a.ts:1-2", "packages/tokens/src/.NUXT/z.ts:1-3", "packages/tokens/src/.next/y.ts:1-130"],
    });
  });

  it("exits 2 in a --files run whose entry is path:start-end, naming the entry as Stryker logged it", async () => {
    expect(await gate(["--files", "gates/lib/a.ts,packages/tokens/src/.next/y.ts:121-130"])).toEqual({
      code: 2,
      out: [],
      err: [unread("packages/tokens/src/.next/y.ts:121-130")],
      mutated: ["gates/lib/a.ts:1-2", "packages/tokens/src/.next/y.ts:121-130"],
    });
  });

  it("passes a --files run of read files only, beside the unread files of the diff", async () => {
    expect(await gate(["--files", "gates/lib/a.ts"])).toEqual({
      code: 0,
      out: ["mutation: 1 mutant on the changed lines of 1 file, none survived; 0 equivalent records"],
      err: [],
      mutated: ["gates/lib/a.ts:1-2"],
    });
  });
});
