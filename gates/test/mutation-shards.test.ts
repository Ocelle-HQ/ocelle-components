import { describe, expect, it } from "vitest";
import { mutation } from "../bin/mutation.ts";
import type { MutationTools } from "../bin/mutation.ts";
import type { ChangedFile } from "../lib/mutation/ranges.ts";
import { formatPlan, planShards, selectFiles } from "../lib/mutation/shards.ts";
import { base, capture, context, fakeGit, fakeRepo, fakeStryker, mutant, newFilesDiff, reportPath, strykerReport } from "./mutation-fakes.ts";

// CI shards (FR-013, research.md R-08): changed files sorted by path, filled greedily into shards of at most 10 files
// and 250 changed lines (500 until T093, operator decision, phase 4 round 3), a file over 250 lines alone; `--plan` prints them, `--files` limits a run to one shard; and
// the base argument (`--base`, required, must resolve to a commit).
function file(path: string, lines: number): ChangedFile {
  return { path, ranges: [{ start: 1, end: lines }], lines };
}

function files(count: number, lines: number): ChangedFile[] {
  return Array.from({ length: count }, (_, i) => file(`gates/lib/f${String(i).padStart(2, "0")}.ts`, lines));
}

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

  it("fills shards of up to 250 changed lines, exactly 250 included", () => {
    const changed = [file("a.ts", 150), file("b.ts", 100), file("c.ts", 1), file("d.ts", 249), file("e.ts", 1)];
    expect(planShards(changed)).toEqual([
      { files: ["a.ts", "b.ts"], lines: 250 },
      { files: ["c.ts", "d.ts"], lines: 250 },
      { files: ["e.ts"], lines: 1 },
    ]);
  });

  it("fits two files of exactly 250 changed lines together in one shard", () => {
    expect(planShards([file("a.ts", 125), file("b.ts", 125)])).toEqual([{ files: ["a.ts", "b.ts"], lines: 250 }]);
  });

  it("splits two files of 251 changed lines together into two shards", () => {
    expect(planShards([file("a.ts", 200), file("b.ts", 51)])).toEqual([
      { files: ["a.ts"], lines: 200 },
      { files: ["b.ts"], lines: 51 },
    ]);
  });

  it("gives a file of 251 changed lines a shard of its own", () => {
    const changed = [file("a.ts", 10), file("b.ts", 251), file("c.ts", 10)];
    expect(planShards(changed)).toEqual([
      { files: ["a.ts"], lines: 10 },
      { files: ["b.ts"], lines: 251 },
      { files: ["c.ts"], lines: 10 },
    ]);
  });

  it("gives a file of more than 250 changed lines a shard of its own", () => {
    const changed = [file("a.ts", 10), file("b.ts", 700), file("c.ts", 10)];
    expect(planShards(changed)).toEqual([
      { files: ["a.ts"], lines: 10 },
      { files: ["b.ts"], lines: 700 },
      { files: ["c.ts"], lines: 10 },
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
          "usage: gate:mutation -- --base <sha> [--plan | --files <path>[,<path>...]]",
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
        `mutation: could not run: ${problem}; usage: gate:mutation -- --base <sha> [--plan | --files <path>[,<path>...]]`,
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
