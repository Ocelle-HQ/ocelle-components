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

// CI shards (FR-013, research.md R-08): the changed files, sorted by path, become entries: a file of at most 30
// changed lines is one entry `path`, a file of more is split by line range into entries `path:start-end` of at most
// 30 changed lines (operator decisions, phase 3 round 9, O9-01: plant-judge.ts alone took 9:49 of 10 minutes, at
// 120 lines; 002 phase 5 round 6, O6-01: a 120-line entry of generate.ts ran past 600 s, so 60; 007 spec FR-014,
// 2026-11-11, "30-line entries, all files": with the TypeScript checker on, three 60-line entries of
// packages/tokens/src/source.ts took 188 s to 283 s on the sandbox against a bound of 176 s, so 30); the
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

/** A selected file: the changed file and its `--files` entry as given (007 data-model § Entry). */
function entry(changed: ChangedFile, name: string): ChangedFile & { readonly entry: string } {
  return { ...changed, entry: name };
}

// `git diff --unified=0 --no-color --no-ext-diff bdb9b70 fffb7e7 -- gates/lib/plant-judge.ts`: the file whose shard
// took 9:49 on GitHub run 41635769914 (216 changed lines, a new file, so one range).
const plantJudge = readFileSync(new URL("fixtures/git-diff/plant-judge.diff", import.meta.url), "utf8");

describe("planShards: the split within files (phase 3 round 9, O9-01; 002 phase 5 round 6, O6-01; 007 FR-014)", () => {
  it("keeps a file of exactly 30 changed lines as one entry, its path, beside a file of 31 that is split", () => {
    expect(planShards([file("gates/lib/a.ts", 30), file("gates/lib/b.ts", 31)])).toEqual([
      { files: ["gates/lib/a.ts", "gates/lib/b.ts:1-30"], lines: 60 },
      { files: ["gates/lib/b.ts:31-31"], lines: 1 },
    ]);
  });

  it("splits a file of 31 changed lines into an entry of 30 lines and one of 1, in two shards", () => {
    expect(planShards([file("gates/lib/a.ts", 31)])).toEqual([
      { files: ["gates/lib/a.ts:1-30"], lines: 30 },
      { files: ["gates/lib/a.ts:31-31"], lines: 1 },
    ]);
  });

  it("cuts inside a changed range where the count reaches 30, each entry from its first to its last changed line", () => {
    // 5-24 and 30-39 are 20 + 10 = 30 changed lines; 40-69 are 30; 70-80 are 11.
    expect(planShards([ranged("gates/lib/a.ts", { start: 5, end: 24 }, { start: 30, end: 80 })])).toEqual([
      { files: ["gates/lib/a.ts:5-39"], lines: 30 },
      { files: ["gates/lib/a.ts:40-69"], lines: 30 },
      { files: ["gates/lib/a.ts:70-80"], lines: 11 },
    ]);
  });

  it("starts the next entry at its first changed line when a cut falls at the end of a range", () => {
    expect(planShards([ranged("gates/lib/a.ts", { start: 1, end: 30 }, { start: 200, end: 210 })])).toEqual([
      { files: ["gates/lib/a.ts:1-30"], lines: 30 },
      { files: ["gates/lib/a.ts:200-210"], lines: 11 },
    ]);
  });

  it("splits a file of 216 changed lines across several ranges into seven entries of 30 lines and one of 6", () => {
    const changed = ranged("gates/lib/a.ts", { start: 3, end: 40 }, { start: 50, end: 50 }, { start: 60, end: 160 }, { start: 200, end: 275 });
    expect(changed.lines).toBe(216);
    // 3-32 are 30 changed lines; 33-40, 50 and 60-80 are 8 + 1 + 21 = 30; 81-110 and 111-140 are 30 each; 141-160
    // and 200-209 are 20 + 10 = 30; 210-239 and 240-269 are 30 each; 270-275 are 6.
    expect(planShards([changed, file("gates/lib/b.ts", 24)])).toEqual([
      { files: ["gates/lib/a.ts:3-32"], lines: 30 },
      { files: ["gates/lib/a.ts:33-80"], lines: 30 },
      { files: ["gates/lib/a.ts:81-110"], lines: 30 },
      { files: ["gates/lib/a.ts:111-140"], lines: 30 },
      { files: ["gates/lib/a.ts:141-209"], lines: 30 },
      { files: ["gates/lib/a.ts:210-239"], lines: 30 },
      { files: ["gates/lib/a.ts:240-269"], lines: 30 },
      { files: ["gates/lib/a.ts:270-275", "gates/lib/b.ts"], lines: 30 },
    ]);
  });

  it("splits gates/lib/plant-judge.ts as changed at fffb7e7 (216 lines) into seven entries of 30 lines and one of 6, in eight shards", () => {
    expect(planShards(changedFiles(plantJudge))).toEqual([
      { files: ["gates/lib/plant-judge.ts:1-30"], lines: 30 },
      { files: ["gates/lib/plant-judge.ts:31-60"], lines: 30 },
      { files: ["gates/lib/plant-judge.ts:61-90"], lines: 30 },
      { files: ["gates/lib/plant-judge.ts:91-120"], lines: 30 },
      { files: ["gates/lib/plant-judge.ts:121-150"], lines: 30 },
      { files: ["gates/lib/plant-judge.ts:151-180"], lines: 30 },
      { files: ["gates/lib/plant-judge.ts:181-210"], lines: 30 },
      { files: ["gates/lib/plant-judge.ts:211-216"], lines: 6 },
    ]);
  });

  it("splits a file of exactly 60 changed lines into two entries of 30, and no empty third", () => {
    expect(planShards([file("gates/lib/a.ts", 60)])).toEqual([
      { files: ["gates/lib/a.ts:1-30"], lines: 30 },
      { files: ["gates/lib/a.ts:31-60"], lines: 30 },
    ]);
  });

  it("splits a file of 61 changed lines into entries of 30, 30 and 1, in three shards", () => {
    expect(planShards([file("gates/lib/a.ts", 61)])).toEqual([
      { files: ["gates/lib/a.ts:1-30"], lines: 30 },
      { files: ["gates/lib/a.ts:31-60"], lines: 30 },
      { files: ["gates/lib/a.ts:61-61"], lines: 1 },
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

  it("fills shards of up to 250 changed lines, exactly 250 included, splitting files over 30 lines", () => {
    const whole = ["b.ts", "c.ts", "d.ts", "e.ts", "f.ts", "g.ts", "h.ts", "i.ts"];
    const changed = [file("a.ts", 40), ...whole.map((path) => file(path, 30)), file("j.ts", 1)];
    expect(planShards(changed)).toEqual([
      { files: ["a.ts:1-30"], lines: 30 },
      { files: ["a.ts:31-40", ...whole], lines: 250 },
      { files: ["j.ts"], lines: 1 },
    ]);
  });

  it("fits a file's last entry and the next file's first entry in one shard, never two entries of one file", () => {
    expect(planShards([file("a.ts", 35), file("b.ts", 35)])).toEqual([
      { files: ["a.ts:1-30"], lines: 30 },
      { files: ["a.ts:31-35", "b.ts:1-30"], lines: 35 },
      { files: ["b.ts:31-35"], lines: 5 },
    ]);
  });

  it("splits entries of 251 changed lines together into two shards, no entry crossing a shard", () => {
    const whole = ["a.ts", "b.ts", "c.ts", "d.ts", "e.ts", "f.ts", "g.ts", "h.ts"];
    expect(planShards([...whole.map((path) => file(path, 30)), file("i.ts", 11)])).toEqual([
      { files: whole, lines: 240 },
      { files: ["i.ts"], lines: 11 },
    ]);
  });

  it("splits a file of 251 changed lines across shards by line range (phase 3 round 9, O9-01)", () => {
    const changed = [file("a.ts", 10), file("b.ts", 251), file("c.ts", 10)];
    // b.ts: 31-60, 61-90, ..., 211-240 are seven entries of 30 lines between its first and its last.
    const middle = Array.from({ length: 7 }, (_, i) => ({ files: [`b.ts:${String(31 + 30 * i)}-${String(60 + 30 * i)}`], lines: 30 }));
    expect(planShards(changed)).toEqual([
      { files: ["a.ts", "b.ts:1-30"], lines: 40 },
      ...middle,
      { files: ["b.ts:241-251", "c.ts"], lines: 21 },
    ]);
  });

  it("splits a file of more than 250 changed lines across shards by line range (phase 3 round 9, O9-01)", () => {
    const changed = [file("a.ts", 10), file("b.ts", 700), file("c.ts", 10)];
    // b.ts: 31-60, 61-90, ..., 661-690 are 22 entries of 30 lines between its first and its last.
    const middle = Array.from({ length: 22 }, (_, i) => ({ files: [`b.ts:${String(31 + 30 * i)}-${String(60 + 30 * i)}`], lines: 30 }));
    expect(planShards(changed)).toEqual([
      { files: ["a.ts", "b.ts:1-30"], lines: 40 },
      ...middle,
      { files: ["b.ts:691-700", "c.ts"], lines: 20 },
    ]);
  });

  it("starts a new shard for the next entry of a file, though both would fit (phase 3 round 10, O10-01)", () => {
    expect(planShards([file("a.ts", 50)])).toEqual([
      { files: ["a.ts:1-30"], lines: 30 },
      { files: ["a.ts:31-50"], lines: 20 },
    ]);
  });

  it("starts a new shard when the next entry would make 11 entries, counting a split file's entries", () => {
    const changed = [file("gates/lib/a.ts", 40), ...files(10, 1)];
    expect(planShards(changed)).toEqual([
      { files: ["gates/lib/a.ts:1-30"], lines: 30 },
      { files: ["gates/lib/a.ts:31-40", ...files(9, 1).map((f) => f.path)], lines: 19 },
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
    file("gates/lib/d.ts", 30),
    file("gates/lib/e.ts", 31),
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
    // Every file is cut into entries of 30 changed lines, the last holding the rest (O6-01; 007 FR-014).
    expect(shards.flatMap((shard) => shard.files)).toHaveLength(mixed.reduce((sum, f) => sum + Math.ceil(f.lines / 30), 0));
  });

  it("lets an entry share a shard with other files: after a smaller file, and before the next file", () => {
    expect(planShards([file("a.ts", 20), file("b.ts", 40), file("c.ts", 25)])).toEqual([
      { files: ["a.ts", "b.ts:1-30"], lines: 50 },
      { files: ["b.ts:31-40", "c.ts"], lines: 35 },
    ]);
  });

  it("puts the recorded plant-judge.ts entries in separate shards, the first and the last beside other files", () => {
    const changed = [file("gates/lib/a.ts", 20), ...changedFiles(plantJudge), file("gates/lib/z.ts", 24)];
    expect(planShards(changed)).toEqual([
      { files: ["gates/lib/a.ts", "gates/lib/plant-judge.ts:1-30"], lines: 50 },
      { files: ["gates/lib/plant-judge.ts:31-60"], lines: 30 },
      { files: ["gates/lib/plant-judge.ts:61-90"], lines: 30 },
      { files: ["gates/lib/plant-judge.ts:91-120"], lines: 30 },
      { files: ["gates/lib/plant-judge.ts:121-150"], lines: 30 },
      { files: ["gates/lib/plant-judge.ts:151-180"], lines: 30 },
      { files: ["gates/lib/plant-judge.ts:181-210"], lines: 30 },
      { files: ["gates/lib/plant-judge.ts:211-216", "gates/lib/z.ts"], lines: 30 },
    ]);
  });
});

describe("countCuts (phase 3 round 10, O10-02)", () => {
  it("counts no cut in no shard, nor in whole files", () => {
    expect(countCuts([])).toBe(0);
    expect(countCuts(planShards([file("gates/lib/a.ts", 30), file("gates/lib/b.ts", 3)]))).toBe(0);
  });

  it("counts n - 1 cuts for a file of n entries, summed over the files", () => {
    expect(countCuts(planShards([file("gates/lib/a.ts", 31)]))).toBe(1);
    expect(countCuts(planShards([file("gates/lib/a.ts", 61), file("gates/lib/b.ts", 7), file("gates/lib/c.ts", 181)]))).toBe(2 + 6);
  });

  it("reads an entry's file as the entry less its last :start-end, so a path holding :1-2 keeps it", () => {
    const shards = planShards([file("gates/lib/x:1-2.ts", 40), file("gates/lib/x.ts", 40)]);
    expect(shards.map((shard) => shard.files)).toEqual([
      ["gates/lib/x:1-2.ts:1-30"],
      ["gates/lib/x:1-2.ts:31-40", "gates/lib/x.ts:1-30"],
      ["gates/lib/x.ts:31-40"],
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
    expect(formatPlan(planShards([file("gates/lib/a.ts", 40), file("gates/lib/b.ts", 3)]))).toBe(
      '[{"files":"gates/lib/a.ts:1-30","lines":30},{"files":"gates/lib/a.ts:31-40,gates/lib/b.ts","lines":13}]',
    );
  });
});

describe("selectFiles", () => {
  const changed = [file("gates/lib/a.ts", 2), file("gates/lib/b.ts", 3), file("gates/lib/c.ts", 4)];

  it("selects the listed changed files, ignoring spaces and empty entries", () => {
    expect(selectFiles(changed, " gates/lib/c.ts,,gates/lib/a.ts ")).toEqual({
      files: [entry(file("gates/lib/a.ts", 2), "gates/lib/a.ts"), entry(file("gates/lib/c.ts", 4), "gates/lib/c.ts")],
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
      files: [entry(ranged("gates/lib/a.ts", { start: 3, end: 4 }, { start: 8, end: 8 }), "gates/lib/a.ts:3-8")],
    });
  });

  it("keeps the changed ranges an entry holds whole, and leaves out those outside it", () => {
    expect(selectFiles(changed, "gates/lib/a.ts:1-10")).toEqual({
      files: [entry(ranged("gates/lib/a.ts", { start: 2, end: 4 }, { start: 8, end: 9 }), "gates/lib/a.ts:1-10")],
    });
  });

  // 007 (operator decision PLAN-CORRECTNESS-1-005 (a)): this test replaces "joins entries of one file into one
  // selected file, merging adjacent ranges, in diff order", whose list named gates/lib/a.ts three times; such a list
  // is now exit 2 (below). The diff order of the selected files stays.
  it("selects the files of the list in diff order, each with its entry as given", () => {
    expect(selectFiles(changed, "gates/lib/b.ts, gates/lib/a.ts:21-40 ")).toEqual({
      files: [entry(ranged("gates/lib/a.ts", { start: 21, end: 30 }), "gates/lib/a.ts:21-40"), entry(file("gates/lib/b.ts", 3), "gates/lib/b.ts")],
    });
  });

  // 007: this test named gates/lib/a:b.ts twice in one list, now exit 2; each entry is read on its own instead.
  it("reads the last :start-end as the range, so a path holding a colon keeps it", () => {
    expect(selectFiles(changed, "gates/lib/a:b.ts")).toEqual({ files: [entry(file("gates/lib/a:b.ts", 2), "gates/lib/a:b.ts")] });
    expect(selectFiles(changed, "gates/lib/a:b.ts:2-2")).toEqual({
      files: [entry(ranged("gates/lib/a:b.ts", { start: 2, end: 2 }), "gates/lib/a:b.ts:2-2")],
    });
  });

  it("takes a changed path holding .ts: whole, before reading a range suffix", () => {
    const odd = file("gates/lib/a.ts:b.ts", 2);
    expect(selectFiles([odd], "gates/lib/a.ts:b.ts")).toEqual({ files: [entry(odd, "gates/lib/a.ts:b.ts")] });
  });

  it("names an entry whose path is not a changed file", () => {
    expect(selectFiles(changed, "gates/lib/a.ts:2-3,gates/lib/x.ts:1-5")).toEqual({ missing: ["gates/lib/x.ts:1-5"] });
  });

  // 007: this list named gates/lib/a.ts three times, now exit 2; the empty ranges are of different files instead.
  it("names every entry whose range holds no changed line", () => {
    expect(selectFiles(changed, "gates/lib/a.ts:5-7,gates/lib/b.ts:2-2,gates/lib/a:b.ts:3-99")).toEqual({
      empty: ["gates/lib/a.ts:5-7", "gates/lib/a:b.ts:3-99"],
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

// 007 research R-03 (operator decision, human:jeroennouwsdev, 2026-11-10, PLAN-CORRECTNESS-1-005 (a) "Reject as exit
// 2"): one selected file is one entry, so a `--files` list that names one file more than once (two entries of one
// file, a whole entry and a range of it, or one entry repeated) selects nothing; every entry of each such file is
// named as given, in list order. The check runs after the malformed check and before the missing and empty checks.
describe("selectFiles: one file named more than once (007, PLAN-CORRECTNESS-1-005 (a))", () => {
  const split = ranged("gates/lib/a.ts", { start: 2, end: 4 }, { start: 8, end: 9 }, { start: 20, end: 30 });
  const changed = [split, file("gates/lib/b.ts", 3), file("gates/lib/a:b.ts", 2)];

  it.each([
    { list: "gates/lib/a.ts:2-4,gates/lib/a.ts:20-30", repeated: ["gates/lib/a.ts:2-4", "gates/lib/a.ts:20-30"] },
    { list: "gates/lib/a.ts,gates/lib/a.ts:2-4", repeated: ["gates/lib/a.ts", "gates/lib/a.ts:2-4"] },
    { list: "gates/lib/b.ts, gates/lib/b.ts ", repeated: ["gates/lib/b.ts", "gates/lib/b.ts"] },
    { list: "gates/lib/a:b.ts:2-2,gates/lib/a:b.ts", repeated: ["gates/lib/a:b.ts:2-2", "gates/lib/a:b.ts"] },
    {
      list: "gates/lib/a.ts:2-4,gates/lib/b.ts,gates/lib/a:b.ts,gates/lib/a.ts:8-9,gates/lib/b.ts",
      repeated: ["gates/lib/a.ts:2-4", "gates/lib/b.ts", "gates/lib/a.ts:8-9", "gates/lib/b.ts"],
    },
  ])("names every entry of each file named more than once, in list order: $list", ({ list, repeated }) => {
    expect(selectFiles(changed, list)).toEqual({ repeated });
  });

  it("names malformed entries first, then repeated files, before missing paths and empty ranges", () => {
    expect(selectFiles(changed, "gates/lib/a.ts:2-4,gates/lib/a.ts:8-9,gates/lib/b.ts:0-1")).toEqual({ malformed: ["gates/lib/b.ts:0-1"] });
    expect(selectFiles(changed, "gates/lib/a.ts:2-4,gates/lib/x.ts,gates/lib/a.ts:8-9")).toEqual({
      repeated: ["gates/lib/a.ts:2-4", "gates/lib/a.ts:8-9"],
    });
    expect(selectFiles(changed, "gates/lib/x.ts,gates/lib/x.ts:1-5")).toEqual({ repeated: ["gates/lib/x.ts", "gates/lib/x.ts:1-5"] });
    expect(selectFiles(changed, "gates/lib/a.ts:5-7,gates/lib/a.ts:5-7")).toEqual({ repeated: ["gates/lib/a.ts:5-7", "gates/lib/a.ts:5-7"] });
  });

  it("selects a list that names each file once, whole or by range", () => {
    expect(selectFiles(changed, "gates/lib/a:b.ts:2-2,gates/lib/a.ts:8-9,gates/lib/b.ts")).toEqual({
      files: [
        entry(ranged("gates/lib/a.ts", { start: 8, end: 9 }), "gates/lib/a.ts:8-9"),
        entry(file("gates/lib/b.ts", 3), "gates/lib/b.ts"),
        entry(ranged("gates/lib/a:b.ts", { start: 2, end: 2 }), "gates/lib/a:b.ts:2-2"),
      ],
    });
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
    const split = newFilesDiff({ "gates/lib/a.ts": 40 });
    expect(await gate(["--base", base, "--plan"], { git: fakeGit(split), ...fakeRepo(files) })).toEqual({
      code: 0,
      out: ['[{"files":"gates/lib/a.ts:1-30","lines":30},{"files":"gates/lib/a.ts:31-40","lines":10}]'],
      err: [planLine("2 shards, 1 cut")],
    });
  });

  it("--plan writes the cuts of several split files summed, n - 1 for a file of n entries (phase 3 round 10, O10-02)", async () => {
    const split = newFilesDiff({ "gates/lib/a.ts": 65, "gates/lib/b.ts": 35, "gates/lib/c.ts": 5, "gates/lib/d.ts": 61 });
    expect(await gate(["--base", base, "--plan"], { git: fakeGit(split), ...fakeRepo(files) })).toEqual({
      code: 0,
      out: [
        JSON.stringify([
          { files: "gates/lib/a.ts:1-30", lines: 30 },
          { files: "gates/lib/a.ts:31-60", lines: 30 },
          { files: "gates/lib/a.ts:61-65,gates/lib/b.ts:1-30", lines: 35 },
          { files: "gates/lib/b.ts:31-35,gates/lib/c.ts,gates/lib/d.ts:1-30", lines: 40 },
          { files: "gates/lib/d.ts:31-60", lines: 30 },
          { files: "gates/lib/d.ts:61-61", lines: 1 },
        ]),
      ],
      err: [planLine("6 shards, 5 cuts")],
    });
  });

  it("mutates every changed file without --files", async () => {
    expect(await gate(["--", "--base", base], { git: fakeGit(diff), ...fakeRepo(files, survives) })).toEqual({
      code: 1,
      out: [
        "gates/lib/b.ts:1: mutation: ConditionalExpression: Survived: replaced by true",
        "gates/lib/a.ts:1: mutation: ConditionalExpression: Survived: replaced by true",
        "mutation: 2 findings in 2 changed files (2 mutants on changed lines; 0 timeouts, 0 compile errors, 0 zero-mutant entries)",
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
        "mutation: 1 finding in 1 changed file (1 mutant on changed lines; 0 timeouts, 0 compile errors, 0 zero-mutant entries)",
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

  it("--plan splits a file of more than 30 changed lines into path:start-end entries", async () => {
    expect(await gate(["--base", base, "--plan"])).toEqual({
      code: 0,
      out: [
        JSON.stringify([
          { files: "gates/lib/a.ts,gates/lib/b.ts:1-30", lines: 46 },
          { files: "gates/lib/b.ts:31-60", lines: 30 },
          { files: "gates/lib/b.ts:61-90", lines: 30 },
          { files: "gates/lib/b.ts:91-120", lines: 30 },
          { files: "gates/lib/b.ts:121-130", lines: 10 },
        ]),
      ],
      err: ["mutation: plan: 5 shards, 4 cuts within files (a mutant spanning a cut is mutated in no shard, see gates/README.md)"],
      mutated: [],
    });
  });

  it("--files with an entry path:start-end mutates only the changed lines inside it", async () => {
    expect(await gate(["--base", base, "--files", "gates/lib/a.ts:3-25"])).toEqual({
      code: 0,
      out: ["mutation: 3 mutants on the changed lines of 1 file, none survived; 0 timeouts, 0 compile errors, 0 zero-mutant entries; 0 equivalent records"],
      err: [],
      mutated: ["gates/lib/a.ts:3-4", "gates/lib/a.ts:8-9", "gates/lib/a.ts:20-25"],
    });
  });

  // 007 (operator decision PLAN-CORRECTNESS-1-005 (a)): the second half of this test, the plan's joined value of every
  // shard (a.ts,b.ts:1-60,b.ts:61-120,b.ts:121-130) passing, is replaced by its exit 2: two entries of one file never
  // share a shard, and one selected file is one entry, named in its report lines as given. 007 FR-014 (2026-11-11):
  // the joined value is that of the 30-line plan above (a.ts,b.ts:1-30,b.ts:31-60,b.ts:61-90,b.ts:91-120,b.ts:121-130).
  it("--files with one entry of a split file, and the plan's joined value of every shard exits 2 before Stryker runs", async () => {
    expect(await gate(["--base", base, "--files", "gates/lib/b.ts:121-130"])).toEqual({
      code: 0,
      out: ["mutation: 1 mutant on the changed lines of 1 file, none survived; 0 timeouts, 0 compile errors, 0 zero-mutant entries; 0 equivalent records"],
      err: [],
      mutated: ["gates/lib/b.ts:121-130"],
    });
    expect(
      await gate(["--base", base, "--files", "gates/lib/a.ts,gates/lib/b.ts:1-30,gates/lib/b.ts:31-60,gates/lib/b.ts:61-90,gates/lib/b.ts:91-120,gates/lib/b.ts:121-130"]),
    ).toEqual({
      code: 2,
      out: [],
      err: [
        "mutation: could not run: --files names one file more than once (two entries of one file never share a shard): " +
          "gates/lib/b.ts:1-30, gates/lib/b.ts:31-60, gates/lib/b.ts:61-90, gates/lib/b.ts:91-120, gates/lib/b.ts:121-130; run --plan for the shards",
      ],
      mutated: [],
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
    {
      problem: "two entries of one file (007)",
      files: "gates/lib/b.ts:1-60,gates/lib/a.ts,gates/lib/b.ts:61-120",
      cause: "--files names one file more than once (two entries of one file never share a shard): gates/lib/b.ts:1-60, gates/lib/b.ts:61-120",
    },
    {
      problem: "a whole entry and a range of one file (007)",
      files: "gates/lib/a.ts,gates/lib/a.ts:2-4",
      cause: "--files names one file more than once (two entries of one file never share a shard): gates/lib/a.ts, gates/lib/a.ts:2-4",
    },
    {
      problem: "a repeated entry (007)",
      files: "gates/lib/b.ts:121-130,gates/lib/b.ts:121-130",
      cause: "--files names one file more than once (two entries of one file never share a shard): gates/lib/b.ts:121-130, gates/lib/b.ts:121-130",
    },
    {
      problem: "a repeated file and a path that is not a changed file, the repeated file first (007)",
      files: "gates/lib/x.ts,gates/lib/a.ts:2-4,gates/lib/a.ts:8-9",
      cause: "--files names one file more than once (two entries of one file never share a shard): gates/lib/a.ts:2-4, gates/lib/a.ts:8-9",
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
      out: ["mutation: 1 mutant on the changed lines of 1 file, none survived; 0 timeouts, 0 compile errors, 0 zero-mutant entries; 0 equivalent records"],
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
      out: ["mutation: 1 mutant on the changed lines of 1 file, none survived; 0 timeouts, 0 compile errors, 0 zero-mutant entries; 0 equivalent records"],
      err: [],
      mutated: ["gates/lib/a.ts:1-2"],
    });
  });
});

// 007 User Story 1 (contracts/mutation-output.md; spec FR-001 to FR-006, US1 AS1 to AS6 and the edge cases): after the
// equivalent records, the gate prints the Timeout lines, then the CompileError lines, then the zero-mutant entries,
// then the findings (exit 1) and the summary, which counts all three kinds, also when zero. A zero-mutant entry is
// named by its path in a whole-diff run and by its `--files` entry as given in a shard run. Exit 2 prints none of them.
describe("mutation gate: the report of undecided mutants and zero-mutant entries (007)", () => {
  /** A Stryker double that writes this report, whatever it is asked to mutate, and records what it was asked. */
  function writing(files: Readonly<Record<string, readonly object[]>>, mutated: string[]) {
    return (mutate: readonly string[], tree: Map<string, string>) => {
      mutated.push(...mutate);
      tree.set(reportPath, strykerReport(files));
      return { exitCode: 0, stdout: "", stderr: "" };
    };
  }

  function at(id: string, line: number, status: string, mutatorName: string, replacement: string): object {
    return { id, mutatorName, replacement, status, location: { start: { line, column: 1 }, end: { line, column: 5 } } };
  }

  async function gate(args: readonly string[], diff: string, sources: Readonly<Record<string, string>>, report: Readonly<Record<string, readonly object[]>>) {
    const { io, out, err } = capture();
    const mutated: string[] = [];
    const code = await mutation(context(["--base", base, ...args]), { git: fakeGit(diff), ...fakeRepo(sources, writing(report, mutated)) }, io);
    return { code, out, err, mutated };
  }

  const a = "gates/lib/a.ts";
  const b = "gates/lib/b.ts";
  const c = "packages/tokens/src/c.ts";
  const recordedA = '// Stryker disable next-line StringLiteral: only logged\nlog("x");\nexport const a = 1;\nexport const b = 2;\n';
  const sources = { [a]: recordedA, [b]: "export type B = 1;\nexport type C = 2;\n", [c]: "export const c = {\n  a: 1,\n};\n" };

  it("prints records, timeouts, compile errors and zero-mutant entries in that order, in changed-file order, and passes (AS1 to AS3)", async () => {
    // The diff lists c.ts first, then a.ts, then b.ts; the report lists a.ts first.
    const diff = newFilesDiff({ [c]: 3, [a]: 4, [b]: 2 });
    const report = {
      [a]: [at("0", 3, "Timeout", "ConditionalExpression", "true"), at("1", 4, "CompileError", "ArrayDeclaration", "[]"), at("2", 2, "Killed", "StringLiteral", '""'), at("3", 2, "Ignored", "StringLiteral", '""')],
      [c]: [at("4", 1, "Timeout", "ObjectLiteral", "{\n  a\n}")],
    };
    expect(await gate([], diff, sources, report)).toEqual({
      code: 0,
      out: [
        "gates/lib/a.ts:1: mutation: record: StringLiteral: only logged",
        "packages/tokens/src/c.ts:1: mutation: timeout: ObjectLiteral: replaced by { a }",
        "gates/lib/a.ts:3: mutation: timeout: ConditionalExpression: replaced by true",
        "gates/lib/a.ts:4: mutation: compile-error: ArrayDeclaration: replaced by []",
        "gates/lib/b.ts: mutation: zero-mutants: no mutant on the changed lines",
        "mutation: 5 mutants on the changed lines of 3 files, none survived; 2 timeouts, 1 compile error, 1 zero-mutant entry; 1 equivalent record",
      ],
      err: [],
      mutated: ["packages/tokens/src/c.ts:1-3", "gates/lib/a.ts:1-4", "gates/lib/b.ts:1-2"],
    });
  });

  it("prints no report line when every mutant was killed, and counts zero of each (AS4)", async () => {
    const report = { [a]: [at("0", 3, "Killed", "ConditionalExpression", "true"), at("1", 4, "RuntimeError", "ArrayDeclaration", "[]")] };
    expect(await gate([], newFilesDiff({ [a]: 4 }), sources, report)).toMatchObject({
      code: 0,
      out: [
        "gates/lib/a.ts:1: mutation: record: StringLiteral: only logged",
        "mutation: 2 mutants on the changed lines of 1 file, none survived; 0 timeouts, 0 compile errors, 0 zero-mutant entries; 1 equivalent record",
      ],
    });
  });

  it("exits 1 on a survivor beside a Timeout, the Timeout a report line apart from the finding (AS5)", async () => {
    const report = { [c]: [at("0", 1, "Survived", "ObjectLiteral", "{}"), at("1", 2, "Timeout", "BooleanLiteral", "false")] };
    expect(await gate([], newFilesDiff({ [c]: 3 }), sources, report)).toEqual({
      code: 1,
      out: [
        "packages/tokens/src/c.ts:2: mutation: timeout: BooleanLiteral: replaced by false",
        "packages/tokens/src/c.ts:1: mutation: ObjectLiteral: Survived: replaced by {}",
        "mutation: 1 finding in 1 changed file (2 mutants on changed lines; 1 timeout, 0 compile errors, 0 zero-mutant entries)",
      ],
      err: [],
      mutated: ["packages/tokens/src/c.ts:1-3"],
    });
  });

  it("exits 1 with every group in order: records, timeouts, compile errors, zero-mutant entries, findings, summary", async () => {
    const report = {
      [a]: [at("0", 4, "NoCoverage", "StringLiteral", '""'), at("1", 3, "CompileError", "ArrayDeclaration", "[]"), at("2", 2, "Timeout", "StringLiteral", '""')],
      [c]: [at("3", 1, "Timeout", "ObjectLiteral", "{}"), at("4", 2, "CompileError", "BooleanLiteral", "false")],
    };
    expect(await gate([], newFilesDiff({ [a]: 4, [b]: 2, [c]: 3 }), sources, report)).toEqual({
      code: 1,
      out: [
        "gates/lib/a.ts:1: mutation: record: StringLiteral: only logged",
        'gates/lib/a.ts:2: mutation: timeout: StringLiteral: replaced by ""',
        "packages/tokens/src/c.ts:1: mutation: timeout: ObjectLiteral: replaced by {}",
        "gates/lib/a.ts:3: mutation: compile-error: ArrayDeclaration: replaced by []",
        "packages/tokens/src/c.ts:2: mutation: compile-error: BooleanLiteral: replaced by false",
        "gates/lib/b.ts: mutation: zero-mutants: no mutant on the changed lines",
        'gates/lib/a.ts:4: mutation: StringLiteral: NoCoverage: replaced by ""',
        "mutation: 1 finding in 3 changed files (5 mutants on changed lines; 2 timeouts, 2 compile errors, 1 zero-mutant entry)",
      ],
      err: [],
      mutated: ["gates/lib/a.ts:1-4", "gates/lib/b.ts:1-2", "packages/tokens/src/c.ts:1-3"],
    });
  });

  it("names a shard's zero-mutant range entry exactly as given to --files, whatever other entries of the file hold (AS6)", async () => {
    const source = "packages/tokens/src/source.ts";
    const diff = newFilesDiff({ [source]: 130 });
    const report = { [source]: [at("0", 5, "Killed", "StringLiteral", '""'), at("1", 125, "Timeout", "StringLiteral", '""')] };
    expect(await gate(["--files", `${source}:61-120`], diff, { [source]: "export const s = 1;\n" }, report)).toEqual({
      code: 0,
      out: [
        "packages/tokens/src/source.ts:61-120: mutation: zero-mutants: no mutant on the changed lines",
        "mutation: 0 mutants on the changed lines of 1 file, none survived; 0 timeouts, 0 compile errors, 1 zero-mutant entry; 0 equivalent records",
      ],
      err: [],
      mutated: ["packages/tokens/src/source.ts:61-120"],
    });
  });

  it("reports a shard's undecided mutants on its own entries only, and names a whole entry by its path (AS6)", async () => {
    const source = "packages/tokens/src/source.ts";
    const diff = newFilesDiff({ [a]: 4, [source]: 130 });
    const report = {
      [source]: [at("0", 5, "Timeout", "StringLiteral", '""'), at("1", 70, "Timeout", "StringLiteral", '""'), at("2", 60, "CompileError", "StringLiteral", '""'), at("3", 61, "CompileError", "StringLiteral", '""')],
    };
    expect(await gate(["--files", ` ${source}:1-60 ,${a}`], diff, { [a]: "export const a = 1;\n", [source]: "export const s = 1;\n" }, report)).toEqual({
      code: 0,
      out: [
        'packages/tokens/src/source.ts:5: mutation: timeout: StringLiteral: replaced by ""',
        'packages/tokens/src/source.ts:60: mutation: compile-error: StringLiteral: replaced by ""',
        "gates/lib/a.ts: mutation: zero-mutants: no mutant on the changed lines",
        "mutation: 2 mutants on the changed lines of 2 files, none survived; 1 timeout, 1 compile error, 1 zero-mutant entry; 0 equivalent records",
      ],
      err: [],
      mutated: ["gates/lib/a.ts:1-4", "packages/tokens/src/source.ts:1-60"],
    });
  });

  it("makes every entry a zero-mutant entry when Stryker found no mutant at all, and passes (spec edge case)", async () => {
    expect(await gate([], newFilesDiff({ [b]: 2, [c]: 3 }), sources, {})).toEqual({
      code: 0,
      out: [
        "gates/lib/b.ts: mutation: zero-mutants: no mutant on the changed lines",
        "packages/tokens/src/c.ts: mutation: zero-mutants: no mutant on the changed lines",
        "mutation: 0 mutants on the changed lines of 2 files, none survived; 0 timeouts, 0 compile errors, 2 zero-mutant entries; 0 equivalent records",
      ],
      err: [],
      mutated: ["gates/lib/b.ts:1-2", "packages/tokens/src/c.ts:1-3"],
    });
  });

  it("never makes a changed test file a zero-mutant entry, only the source entry beside it (spec edge case)", async () => {
    const diff = newFilesDiff({ "packages/tokens/test/c.test.ts": 3, [c]: 3, "gates/test/c.test.ts": 2 });
    expect(await gate([], diff, sources, {})).toEqual({
      code: 0,
      out: [
        "packages/tokens/src/c.ts: mutation: zero-mutants: no mutant on the changed lines",
        "mutation: 0 mutants on the changed lines of 1 file, none survived; 0 timeouts, 0 compile errors, 1 zero-mutant entry; 0 equivalent records",
      ],
      err: [],
      mutated: ["packages/tokens/src/c.ts:1-3"],
    });
  });

  it("prints no record or report line when the run could not decide (exit 2)", async () => {
    const report = { [a]: [at("0", 3, "Timeout", "ConditionalExpression", "true"), at("1", 4, "Pending", "ArrayDeclaration", "[]")] };
    expect(await gate([], newFilesDiff({ [a]: 4, [b]: 2 }), sources, report)).toEqual({
      code: 2,
      out: [],
      err: ["mutation: could not run: mutant 1 at gates/lib/a.ts:4 has status Pending; re-run the mutation gate"],
      mutated: ["gates/lib/a.ts:1-4", "gates/lib/b.ts:1-2"],
    });
  });

  it("lists every Timeout, 121 of them, without truncation", async () => {
    const source = "packages/tokens/src/source.ts";
    const report = { [source]: Array.from({ length: 121 }, (_, i) => at(String(i), i + 1, "Timeout", "StringLiteral", '""')) };
    const ran = await gate([], newFilesDiff({ [source]: 130 }), { [source]: "export const s = 1;\n" }, report);
    expect(ran.code).toBe(0);
    expect(ran.out).toEqual([
      ...Array.from({ length: 121 }, (_, i) => `packages/tokens/src/source.ts:${String(i + 1)}: mutation: timeout: StringLiteral: replaced by ""`),
      "mutation: 121 mutants on the changed lines of 1 file, none survived; 121 timeouts, 0 compile errors, 0 zero-mutant entries; 0 equivalent records",
    ]);
  });

  // Phase 2 fix round 2, O2-01 (landing L1-03; contracts/mutation-output.md, amendment 2026-11-11): a mutant for
  // which Stryker gives no replacement ends its line at `replaced by`, with no trailing space, as a finding does.
  describe("a mutant with no replacement (phase 2 round 2, O2-01)", () => {
    function bare(id: string, line: number, status: string, mutatorName: string): object {
      return { id, mutatorName, status, location: { start: { line, column: 1 }, end: { line, column: 5 } } };
    }
    const endsInWhitespace = (out: readonly string[]): readonly string[] => out.filter((line) => /\s$/.test(line));

    it("ends a timeout and a compile-error line at `replaced by`, at exit 0", async () => {
      const report = { [c]: [bare("0", 1, "Timeout", "ObjectLiteral"), bare("1", 2, "CompileError", "BooleanLiteral")] };
      const ran = await gate([], newFilesDiff({ [c]: 3 }), sources, report);
      expect(ran).toEqual({
        code: 0,
        out: [
          "packages/tokens/src/c.ts:1: mutation: timeout: ObjectLiteral: replaced by",
          "packages/tokens/src/c.ts:2: mutation: compile-error: BooleanLiteral: replaced by",
          "mutation: 2 mutants on the changed lines of 1 file, none survived; 1 timeout, 1 compile error, 0 zero-mutant entries; 0 equivalent records",
        ],
        err: [],
        mutated: ["packages/tokens/src/c.ts:1-3"],
      });
      expect(endsInWhitespace(ran.out)).toEqual([]);
    });

    it("ends the same two lines at `replaced by` at exit 1, beside a Survived finding", async () => {
      const report = {
        [c]: [bare("0", 1, "Timeout", "ObjectLiteral"), bare("1", 2, "CompileError", "BooleanLiteral"), at("2", 3, "Survived", "StringLiteral", '""')],
      };
      const ran = await gate([], newFilesDiff({ [c]: 3 }), sources, report);
      expect(ran).toEqual({
        code: 1,
        out: [
          "packages/tokens/src/c.ts:1: mutation: timeout: ObjectLiteral: replaced by",
          "packages/tokens/src/c.ts:2: mutation: compile-error: BooleanLiteral: replaced by",
          'packages/tokens/src/c.ts:3: mutation: StringLiteral: Survived: replaced by ""',
          "mutation: 1 finding in 1 changed file (3 mutants on changed lines; 1 timeout, 1 compile error, 0 zero-mutant entries)",
        ],
        err: [],
        mutated: ["packages/tokens/src/c.ts:1-3"],
      });
      expect(endsInWhitespace(ran.out)).toEqual([]);
    });

    it("keeps a Survived finding with no replacement in its form, beside a timeout and a compile-error line", async () => {
      const report = {
        [c]: [bare("0", 1, "Timeout", "ObjectLiteral"), bare("1", 2, "CompileError", "BooleanLiteral"), bare("2", 3, "Survived", "StringLiteral")],
      };
      const ran = await gate([], newFilesDiff({ [c]: 3 }), sources, report);
      expect(ran).toEqual({
        code: 1,
        out: [
          "packages/tokens/src/c.ts:1: mutation: timeout: ObjectLiteral: replaced by",
          "packages/tokens/src/c.ts:2: mutation: compile-error: BooleanLiteral: replaced by",
          "packages/tokens/src/c.ts:3: mutation: StringLiteral: Survived: replaced by",
          "mutation: 1 finding in 1 changed file (3 mutants on changed lines; 1 timeout, 1 compile error, 0 zero-mutant entries)",
        ],
        err: [],
        mutated: ["packages/tokens/src/c.ts:1-3"],
      });
      expect(endsInWhitespace(ran.out)).toEqual([]);
    });
  });
});
