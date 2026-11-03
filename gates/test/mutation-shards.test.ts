import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { mutation } from "../bin/mutation.ts";
import type { MutationTools } from "../bin/mutation.ts";
import { changedFiles } from "../lib/mutation/ranges.ts";
import type { ChangedFile, LineRange } from "../lib/mutation/ranges.ts";
import { formatPlan, planShards, selectFiles } from "../lib/mutation/shards.ts";
import { base, capture, context, fakeGit, fakeRepo, fakeStryker, mutant, newFilesDiff, reportPath, strykerReport } from "./mutation-fakes.ts";

// CI shards (FR-013, research.md R-08): the changed files, sorted by path, become entries: a file of at most 120
// changed lines is one entry `path`, a file of more is split by line range into entries `path:start-end` of at most
// 120 changed lines (operator decision, phase 3 round 9, O9-01: plant-judge.ts alone took 9:49 of 10 minutes); the
// entries are filled greedily into shards of at most 10 entries and 250 changed lines (500 until T093, operator
// decision, phase 4 round 3), an entry never crossing a shard. `--plan` prints them, `--files` limits a run to one
// shard's entries and mutates only the changed lines inside them; and the base argument (`--base`, required, must
// resolve to a commit).
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

  it("splits a file of 121 changed lines into an entry of 120 lines and one of 1", () => {
    expect(planShards([file("gates/lib/a.ts", 121)])).toEqual([
      { files: ["gates/lib/a.ts:1-120", "gates/lib/a.ts:121-121"], lines: 121 },
    ]);
  });

  it("cuts inside a changed range where the count reaches 120, each entry from its first to its last changed line", () => {
    expect(planShards([ranged("gates/lib/a.ts", { start: 5, end: 54 }, { start: 60, end: 150 })])).toEqual([
      { files: ["gates/lib/a.ts:5-129", "gates/lib/a.ts:130-150"], lines: 141 },
    ]);
  });

  it("starts the next entry at its first changed line when a cut falls at the end of a range", () => {
    expect(planShards([ranged("gates/lib/a.ts", { start: 1, end: 120 }, { start: 200, end: 210 })])).toEqual([
      { files: ["gates/lib/a.ts:1-120", "gates/lib/a.ts:200-210"], lines: 131 },
    ]);
  });

  it("splits a file of 216 changed lines across several ranges into entries of 120 and 96 lines", () => {
    const changed = ranged("gates/lib/a.ts", { start: 3, end: 40 }, { start: 50, end: 50 }, { start: 60, end: 160 }, { start: 200, end: 275 });
    expect(changed.lines).toBe(216);
    // 3-40, 50 and 60-140 are 38 + 1 + 81 = 120 changed lines; 141-160 and 200-275 are 20 + 76 = 96.
    expect(planShards([changed, file("gates/lib/b.ts", 34)])).toEqual([
      { files: ["gates/lib/a.ts:3-140", "gates/lib/a.ts:141-275", "gates/lib/b.ts"], lines: 250 },
    ]);
    expect(planShards([changed, file("gates/lib/b.ts", 35)])).toEqual([
      { files: ["gates/lib/a.ts:3-140", "gates/lib/a.ts:141-275"], lines: 216 },
      { files: ["gates/lib/b.ts"], lines: 35 },
    ]);
  });

  it("splits gates/lib/plant-judge.ts as changed at fffb7e7 (216 lines) into entries of 120 and 96 lines", () => {
    expect(planShards(changedFiles(plantJudge))).toEqual([
      { files: ["gates/lib/plant-judge.ts:1-120", "gates/lib/plant-judge.ts:121-216"], lines: 216 },
    ]);
  });

  it("splits a file of 241 changed lines into entries of 120, 120 and 1", () => {
    expect(planShards([file("gates/lib/a.ts", 241)])).toEqual([
      { files: ["gates/lib/a.ts:1-120", "gates/lib/a.ts:121-240", "gates/lib/a.ts:241-241"], lines: 241 },
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
    const changed = [file("a.ts", 150), file("b.ts", 100), file("c.ts", 1), file("d.ts", 249), file("e.ts", 1)];
    expect(planShards(changed)).toEqual([
      { files: ["a.ts:1-120", "a.ts:121-150", "b.ts"], lines: 250 },
      { files: ["c.ts", "d.ts:1-120", "d.ts:121-240", "d.ts:241-249"], lines: 250 },
      { files: ["e.ts"], lines: 1 },
    ]);
  });

  it("fits two files of exactly 250 changed lines together in one shard, as four entries", () => {
    expect(planShards([file("a.ts", 125), file("b.ts", 125)])).toEqual([
      { files: ["a.ts:1-120", "a.ts:121-125", "b.ts:1-120", "b.ts:121-125"], lines: 250 },
    ]);
  });

  it("splits two files of 251 changed lines together into two shards, no entry crossing a shard", () => {
    expect(planShards([file("a.ts", 200), file("b.ts", 51)])).toEqual([
      { files: ["a.ts:1-120", "a.ts:121-200"], lines: 200 },
      { files: ["b.ts"], lines: 51 },
    ]);
  });

  it("splits a file of 251 changed lines across shards by line range (phase 3 round 9, O9-01)", () => {
    const changed = [file("a.ts", 10), file("b.ts", 251), file("c.ts", 10)];
    expect(planShards(changed)).toEqual([
      { files: ["a.ts", "b.ts:1-120", "b.ts:121-240"], lines: 250 },
      { files: ["b.ts:241-251", "c.ts"], lines: 21 },
    ]);
  });

  it("splits a file of more than 250 changed lines across shards by line range (phase 3 round 9, O9-01)", () => {
    const changed = [file("a.ts", 10), file("b.ts", 700), file("c.ts", 10)];
    expect(planShards(changed)).toEqual([
      { files: ["a.ts", "b.ts:1-120", "b.ts:121-240"], lines: 250 },
      { files: ["b.ts:241-360", "b.ts:361-480"], lines: 240 },
      { files: ["b.ts:481-600", "b.ts:601-700", "c.ts"], lines: 230 },
    ]);
  });

  it("puts entries of one file in one shard when they fit", () => {
    expect(planShards([file("a.ts", 200)])).toEqual([{ files: ["a.ts:1-120", "a.ts:121-200"], lines: 200 }]);
  });

  it("starts a new shard when the next entry would make 11 entries, counting a split file's entries", () => {
    const changed = [file("gates/lib/a.ts", 130), ...files(9, 1)];
    expect(planShards(changed)).toEqual([
      {
        files: ["gates/lib/a.ts:1-120", "gates/lib/a.ts:121-130", ...files(8, 1).map((f) => f.path)],
        lines: 138,
      },
      { files: ["gates/lib/f08.ts"], lines: 1 },
    ]);
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
      '[{"files":"gates/lib/a.ts:1-120,gates/lib/a.ts:121-130,gates/lib/b.ts","lines":133}]',
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

  async function gate(args: readonly string[], tools: MutationTools) {
    const { io, out, err } = capture();
    const code = await mutation(context(args), tools, io);
    return { code, out, err };
  }

  it("--plan prints the shards of the changed files and runs no Stryker", async () => {
    expect(await gate(["--base", base, "--plan"], { git: fakeGit(diff), ...fakeRepo(files) })).toEqual({
      code: 0,
      out: ['[{"files":"gates/lib/a.ts,gates/lib/b.ts","lines":5}]'],
      err: [],
    });
  });

  it("--plan prints no shard when nothing changed", async () => {
    expect(await gate(["--plan", "--base", base], { git: fakeGit(""), ...fakeRepo(files) })).toEqual({
      code: 0,
      out: ["[]"],
      err: [],
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
      out: ['[{"files":"gates/lib/a.ts,gates/lib/b.ts:1-120,gates/lib/b.ts:121-130","lines":146}]'],
      err: [],
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
