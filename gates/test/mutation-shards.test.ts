import { describe, expect, it } from "vitest";
import { mutation } from "../bin/mutation.ts";
import type { MutationTools } from "../bin/mutation.ts";
import type { ChangedFile } from "../lib/mutation/ranges.ts";
import { formatPlan, planShards, selectFiles } from "../lib/mutation/shards.ts";
import { base, capture, context, fakeGit, fakeRead, fakeStryker, newFilesDiff, noStryker } from "./mutation-fakes.ts";

// CI shards (FR-013, research.md R-08): changed files sorted by path, filled greedily into shards of at most 10 files
// and 500 changed lines, a file over 500 lines alone; `--plan` prints them, `--files` limits a run to one shard; and
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

  it("fills shards of up to 500 changed lines, exactly 500 included", () => {
    const changed = [file("a.ts", 300), file("b.ts", 200), file("c.ts", 1), file("d.ts", 499), file("e.ts", 1)];
    expect(planShards(changed)).toEqual([
      { files: ["a.ts", "b.ts"], lines: 500 },
      { files: ["c.ts", "d.ts"], lines: 500 },
      { files: ["e.ts"], lines: 1 },
    ]);
  });

  it("gives a file of more than 500 changed lines a shard of its own", () => {
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
  const sources = fakeRead({ "gates/lib/a.ts": "export const a = 1;\n", "gates/lib/b.ts": "export const b = 1;\n" });
  const survives: MutationTools["stryker"] = fakeStryker(() => "Survived");

  async function gate(args: readonly string[], tools: MutationTools) {
    const { io, out, err } = capture();
    const code = await mutation(context(args), tools, io);
    return { code, out, err };
  }

  it("--plan prints the shards of the changed files and runs no Stryker", async () => {
    expect(await gate(["--base", base, "--plan"], { git: fakeGit(diff), read: sources, stryker: noStryker })).toEqual({
      code: 0,
      out: ['[{"files":"gates/lib/a.ts,gates/lib/b.ts","lines":5}]'],
      err: [],
    });
  });

  it("--plan prints no shard when nothing changed", async () => {
    expect(await gate(["--plan", "--base", base], { git: fakeGit(""), read: sources, stryker: noStryker })).toEqual({
      code: 0,
      out: ["[]"],
      err: [],
    });
  });

  it("mutates every changed file without --files", async () => {
    expect(await gate(["--", "--base", base], { git: fakeGit(diff), read: sources, stryker: survives })).toEqual({
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
      read: sources,
      stryker: survives,
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
        read: sources,
        stryker: noStryker,
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
    expect(await gate(["--base", "nope"], { git: fakeGit(diff), read: sources, stryker: noStryker })).toEqual({
      code: 2,
      out: [],
      err: [
        "mutation: could not run: --base nope does not resolve to a commit; pass an existing commit " +
          "(in CI, check out with fetch-depth: 0)",
      ],
    });
  });

  it("exits 2 when --base is missing", async () => {
    expect(await gate(["--plan"], { git: fakeGit(diff), read: sources, stryker: noStryker })).toEqual({
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
    expect(await gate(args, { git: fakeGit(diff), read: sources, stryker: noStryker })).toEqual({
      code: 2,
      out: [],
      err: [
        `mutation: could not run: ${problem}; usage: gate:mutation -- --base <sha> [--plan | --files <path>[,<path>...]]`,
      ],
    });
  });

  it("exits 2 with git's message when git diff fails", async () => {
    const git = fakeGit(diff, "fatal: bad object 4ac76fd7\nmore detail\n");
    expect(await gate(["--base", base], { git, read: sources, stryker: noStryker })).toEqual({
      code: 2,
      out: [],
      err: ["mutation: could not run: git diff failed (fatal: bad object 4ac76fd7)"],
    });
  });

  it("exits 2 with the first line of git's message after leading blank lines (added: mutation run)", async () => {
    const git = fakeGit(diff, "\n  fatal: bad revision\nmore detail\n");
    expect(await gate(["--base", base], { git, read: sources, stryker: noStryker })).toEqual({
      code: 2,
      out: [],
      err: ["mutation: could not run: git diff failed (fatal: bad revision)"],
    });
  });

  it("names every listed file with no changed line, comma-separated (added: mutation run)", async () => {
    expect(
      await gate(["--base", base, "--files", "gates/lib/x.ts,gates/lib/a.ts,gates/lib/y.ts"], {
        git: fakeGit(diff),
        read: sources,
        stryker: noStryker,
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
    const stryker: MutationTools["stryker"] = () =>
      Promise.resolve({ report: undefined, exitCode: 1, output: "ERROR Stryker Something broke.\n" });
    expect(await gate(["--base", base], { git: fakeGit(diff), read: sources, stryker })).toEqual({
      code: 2,
      out: [],
      err: ["mutation: could not run: Stryker wrote no report (Something broke.); run pnpm test and check stryker.config.json"],
    });
  });
});
