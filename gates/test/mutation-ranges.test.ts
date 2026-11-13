import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { mutation } from "../bin/mutation.ts";
import { changedFiles, inScope, mutateSpecs, scopePathspecs, unusableMutatePaths } from "../lib/mutation/ranges.ts";
import { base, capture, context, fakeGit, fakeRepo, fakeStryker, newFilesDiff, noStryker, scope } from "./mutation-fakes.ts";

// Changed line ranges over FR-028's package source and gate source, from recorded `git diff --unified=0` output
// (gates/test/fixtures/git-diff/), and "nothing to mutate" when no such line changed (US2 scenario 5, FR-011).
const mixed = readFileSync(new URL("fixtures/git-diff/mixed.diff", import.meta.url), "utf8");

describe("scopePathspecs", () => {
  it("are FR-028's package source TypeScript and gate source, as the pathspecs of research.md R-08", () => {
    expect(scopePathspecs).toEqual(scope);
  });
});

describe("inScope", () => {
  it("takes package source and gate source TypeScript only", () => {
    const paths = [
      "gates/bin/mutation.ts",
      "gates/lib/mutation/ranges.ts",
      "gates/eslint/no-snapshot-only.ts",
      "gates/stylelint/token-only.ts",
      "packages/elements/src/button.ts",
      "packages/tokens/vite.config.ts",
      "packages/tokens/src/test.ts",
      "packages/tokens/src/contest/a.ts",
      "gates/bin/mutation.test.ts",
      "gates/lib/a.spec.ts",
      "gates/lib/test/helper.ts",
      "packages/tokens/test/helper.ts",
      "packages/elements/src/button.stories.ts",
      "packages/elements/src/types.d.ts",
      "packages/tokens/dist/index.ts",
      "packages/index.ts",
      "gates/gates.ts",
      "gates/test/integration/workspace.ts",
      "gates/test/fixtures/a/b.ts",
      "gates/plants/mutation/a/head/gates/lib/a.ts",
      "gates/binx/a.ts",
      "xgates/bin/a.ts",
      "xpackages/tokens/src/a.ts",
      "gates/bin/a.js",
      "packages/styles/src/base.css",
      "packages/tokens/src/a.tsx",
      "vitest.config.ts",
      "tooling/speckit/a.ts",
    ];
    expect(paths.filter((path) => inScope(path))).toEqual([
      "gates/bin/mutation.ts",
      "gates/lib/mutation/ranges.ts",
      "gates/eslint/no-snapshot-only.ts",
      "gates/stylelint/token-only.ts",
      "packages/elements/src/button.ts",
      "packages/tokens/vite.config.ts",
      "packages/tokens/src/test.ts",
      "packages/tokens/src/contest/a.ts",
    ]);
  });
});

describe("inScope: the Storybook scripts, configuration and story render code (002 contracts/gates.md § Mutation)", () => {
  // storybook/stories/ joined in phase 3 review round 1 (R1-02): render.ts holds the stories' render code, which
  // scripts/swatches.ts imports too; the story files themselves stay out (*.stories.ts).
  it("takes storybook/scripts/, storybook/.storybook/ and storybook/stories/ TypeScript but not story files, and no other Storybook file", () => {
    const paths = [
      "storybook/scripts/swatches.ts",
      "storybook/scripts/externalise.ts",
      "storybook/scripts/sub/a.ts",
      "storybook/.storybook/main.ts",
      "storybook/.storybook/manager.ts",
      "storybook/.storybook/preview.ts",
      "storybook/stories/render.ts",
      "storybook/stories/sub/a.ts",
      "storybook/stories/tokens.stories.ts",
      "storybook/stories/a.test.ts",
      "storybook/stories/a.d.ts",
      "storybook/stories/a.js",
      "storybook/storiesx/a.ts",
      "storybook/test/unit/swatches.test.ts",
      "storybook/test/integration/setup.ts",
      "storybook/scripts/a.test.ts",
      "storybook/scripts/test/helper.ts",
      "storybook/.storybook/a.stories.ts",
      "storybook/.storybook/a.d.ts",
      "storybook/scripts/a.js",
      "storybook/.storybook/preview-head.html",
      "storybook/.generated/a.ts",
      "storybook/dist/a.ts",
      "storybook/a.ts",
      "storybook/scriptsx/a.ts",
      "xstorybook/scripts/a.ts",
    ];
    expect(paths.filter((path) => inScope(path))).toEqual(paths.slice(0, 8));
  });
});

// 006 FR-019 and research.md R-12: the capture that runs inside the container, gates/visual/capture.ts, is gate source
// like gates/bin/ and gates/lib/, so a change to its wiring is mutation-tested (its process-boundary lines then need
// their Stryker comments).
describe("inScope: the capture of the visual gate (006 FR-019)", () => {
  it("takes gates/visual/ TypeScript, the capture among it, but not its tests, stories or declarations", () => {
    const paths = [
      "gates/visual/capture.ts",
      "gates/visual/sub/a.ts",
      "gates/visual/capture.test.ts",
      "gates/visual/test/helper.ts",
      "gates/visual/a.stories.ts",
      "gates/visual/a.d.ts",
      "gates/visual/a.js",
      "gates/visualx/a.ts",
      "xgates/visual/a.ts",
    ];
    expect(paths.filter((path) => inScope(path))).toEqual(["gates/visual/capture.ts", "gates/visual/sub/a.ts"]);
  });

  it("lists gates/visual/ among the pathspecs, right after gates/lib/", () => {
    expect(scopePathspecs.slice(2, 4)).toEqual([":(glob)gates/lib/**/*.ts", ":(glob)gates/visual/**/*.ts"]);
  });
});

describe("changedFiles", () => {
  it("gives the added and modified lines of package and gate source, leaving out test code, stories and the rest", () => {
    expect(changedFiles(mixed)).toEqual([
      { path: "gates/eslint/rule.ts", ranges: [{ start: 1, end: 1 }], lines: 1 },
      { path: "gates/lib/mutation/new.ts", ranges: [{ start: 1, end: 2 }], lines: 2 },
      { path: "gates/stylelint/token-only.ts", ranges: [{ start: 1, end: 1 }], lines: 1 },
      {
        path: "packages/tokens/src/index.ts",
        ranges: [
          { start: 2, end: 2 },
          { start: 7, end: 9 },
        ],
        lines: 4,
      },
    ]);
  });

  it("reads a hunk without a count as one line, skips pure deletions, and takes paths from file headers only", () => {
    const diff = [
      "diff --git a/gates/bin/x.ts b/gates/bin/x.ts",
      "index 1111111..2222222 100644",
      "--- a/gates/bin/x.ts",
      "+++ b/gates/bin/x.ts",
      "@@ -4 +4 @@ export const a = 1;",
      "-old",
      "+new",
      "@@ -10,0 +11,3 @@ export const b = 2;",
      "+a",
      "+b",
      "+c",
      "@@ -20,2 +23,0 @@ export const c = 3;",
      "-x",
      "-y",
      "diff --git a/packages/elements/src/button.ts b/packages/elements/src/button.ts",
      "new file mode 100644",
      "index 0000000..3333333",
      "--- /dev/null",
      "+++ b/packages/elements/src/button.ts",
      "@@ -0,0 +1,2 @@",
      "+++ b/gates/lib/evil.ts",
      "+export {};",
      "@@ -0,0 +5 @@",
      "+export const d = 4;",
      "\\ No newline at end of file",
      "",
    ].join("\n");
    expect(changedFiles(diff)).toEqual([
      {
        path: "gates/bin/x.ts",
        ranges: [
          { start: 4, end: 4 },
          { start: 11, end: 13 },
        ],
        lines: 4,
      },
      {
        path: "packages/elements/src/button.ts",
        ranges: [
          { start: 1, end: 2 },
          { start: 5, end: 5 },
        ],
        lines: 3,
      },
    ]);
  });
});

describe("changedFiles and inScope (added: mutation run)", () => {
  it("reads counts of 10 and more, ignores hunk-like text in added lines and lines before the first file header", () => {
    const diff = [
      "+++ b/gates/lib/before-any-header.ts",
      "@@ -0,0 +1 @@",
      "+export const early = 1;",
      "diff --git a/gates/lib/y.ts b/gates/lib/y.ts",
      "index 1111111..2222222 100644",
      "--- a/gates/lib/y.ts",
      "+++ b/gates/lib/y.ts",
      "@@ -30,15 +40,2 @@ export const a = 1;",
      '+const hunk = "@@ -1 +90 @@";',
      "+export const b = 2;",
      "@@ -50,0 +56,12 @@ export const c = 3;",
      ...Array.from({ length: 12 }, (_, i) => `+export const d${String(i)} = ${String(i)};`),
      "",
    ].join("\n");
    expect(changedFiles(diff)).toEqual([
      {
        path: "gates/lib/y.ts",
        ranges: [
          { start: 40, end: 41 },
          { start: 56, end: 67 },
        ],
        lines: 14,
      },
    ]);
  });

  it("keeps gate source whose path only contains a package's dist directory further down", () => {
    expect(inScope("gates/lib/packages/tokens/dist/a.ts")).toBe(true);
    expect(inScope("packages/tokens/dist/a.ts")).toBe(false);
  });
});

describe("mutateSpecs", () => {
  it("gives one Stryker mutate entry path:start-end per changed range", () => {
    expect(
      mutateSpecs([
        {
          path: "gates/lib/a.ts",
          ranges: [
            { start: 2, end: 2 },
            { start: 7, end: 9 },
          ],
          lines: 4,
        },
        { path: "packages/tokens/src/b.ts", ranges: [{ start: 1, end: 3 }], lines: 3 },
      ]),
    ).toEqual(["gates/lib/a.ts:2-2", "gates/lib/a.ts:7-9", "packages/tokens/src/b.ts:1-3"]);
  });
});

describe("mutation gate: nothing to mutate (US2 scenario 5)", () => {
  it("exits 0 without running Stryker when no package or gate source line changed", async () => {
    const onlyTestsAndDocs = mixed
      .split(/(?=^diff --git )/m)
      .filter((part) => /^diff --git a\/(docs|packages\/tokens\/test|gates\/lib\/cli\.ts)/.test(part))
      .join("");
    const { io, out, err } = capture();
    const code = await mutation(context(["--base", base]), { git: fakeGit(onlyTestsAndDocs), ...fakeRepo({}) }, io);
    expect({ code, out, err }).toEqual({
      code: 0,
      out: [`mutation: nothing to mutate: no package or gate source line changed since ${base}`],
      err: [],
    });
  });
});

// Phase 3 round 7 (operator round from the PR #18 landing review, O7-01 and O7-02; tasks.md T095). git writes
// `+++ b/<path>` followed by a tab for a path with a space, and `+++ "b/<escaped>"` (C quoting, octal byte escapes)
// for a path with a non-ASCII or special character; gates/test/fixtures/git-diff/quoted-paths.diff is
// `git diff --unified=0 --no-color --no-ext-diff HEAD --` recorded from a scratch repository (git 2.43.0) with such
// files, and mnemonic-prefix.diff the same diff under `diff.mnemonicPrefix=true` (`+++ w/<path>`), a header the gate
// cannot read. A changed path that Stryker cannot take verbatim as a `mutate` input (minimatch reads `*?[]{}!`, a
// backslash and the extglobs `+(` and `@(`; a comma splits `--mutate`) is exit 2 before Stryker runs.
const quoted = readFileSync(new URL("fixtures/git-diff/quoted-paths.diff", import.meta.url), "utf8");
const mnemonic = readFileSync(new URL("fixtures/git-diff/mnemonic-prefix.diff", import.meta.url), "utf8");
const space = "packages/tokens/src/a b.ts";
const accent = "packages/tokens/src/é.ts";
const both = "packages/tokens/src/é b.ts";
const ok = "packages/tokens/src/ok.ts";

/** The parts of a recorded diff whose `diff --git` line contains `name`, in diff order. */
function parts(diff: string, ...names: string[]): string {
  return diff
    .split(/(?=^diff --git )/m)
    .filter((part) => names.some((name) => part.split("\n")[0]?.includes(name)))
    .join("");
}

const headerHint = "the gate reads +++ b/<path>, a C-quoted \"b/<path>\" or /dev/null (check diff.noprefix and diff.mnemonicPrefix)";

function headerCause(header: string): string {
  return `mutation: could not run: git diff wrote a file header the gate cannot read: ${JSON.stringify(header)}; ${headerHint}`;
}

/** The kinds of path Stryker cannot take verbatim, as the cause names them (line terminators: phase 3 round 8, R8-01). */
const unusableKinds =
  "a glob metacharacter *?[]{}!, a comma, a backslash, an extglob +( @( or a line terminator \\n \\r U+2028 U+2029";

function pathsCause(paths: readonly string[]): string {
  return (
    "mutation: could not run: Stryker cannot take these changed paths as mutate input " +
    `(${unusableKinds}): ${paths.map((path) => JSON.stringify(path)).join(", ")}; rename them`
  );
}

describe("changedFiles: the headers git writes (phase 3 round 7, O7-01)", () => {
  it("reads a tab-suffixed header (a path with a space) as the path without the tab, with its ranges", () => {
    expect(changedFiles(parts(quoted, "a b.ts"))).toEqual([{ path: space, ranges: [{ start: 1, end: 1 }], lines: 1 }]);
  });

  it("reads a quoted header with octal escapes (a non-ASCII path) as the UTF-8 path, with its ranges", () => {
    expect(changedFiles(parts(quoted, "\\303\\251.ts"))).toEqual([{ path: accent, ranges: [{ start: 1, end: 2 }], lines: 2 }]);
  });

  it("reads all files of a diff holding a tab-suffixed, a quoted, a quoted and tab-suffixed, and a plain header", () => {
    expect(changedFiles(quoted)).toEqual([
      { path: space, ranges: [{ start: 1, end: 1 }], lines: 1 },
      { path: ok, ranges: [{ start: 1, end: 2 }], lines: 2 },
      { path: both, ranges: [{ start: 1, end: 1 }], lines: 1 },
      { path: accent, ranges: [{ start: 1, end: 2 }], lines: 2 },
    ]);
  });

  it("decodes every C escape git writes in a quoted header", () => {
    const diff = [
      'diff --git "a/gates/lib/q.ts" "b/gates/lib/q.ts"',
      '+++ "b/gates/lib/q\\"\\\\\\a\\b\\t\\n\\v\\f\\r\\101\\060\\177.ts"',
      "@@ -0,0 +1 @@",
      "+export const q = 1;",
      "",
    ].join("\n");
    expect(changedFiles(diff)).toEqual([
      { path: 'gates/lib/q"\\\u0007\b\t\n\u000b\f\rA0\u007f.ts', ranges: [{ start: 1, end: 1 }], lines: 1 },
    ]);
  });

  it("reads a deletion's +++ /dev/null as no file", () => {
    const diff = ["diff --git a/gates/lib/gone.ts b/gates/lib/gone.ts", "+++ /dev/null", "@@ -1 +0,0 @@", "-old", ""].join("\n");
    expect(changedFiles(diff)).toEqual([]);
  });

  it.each([
    { name: "a mnemonic prefix", header: "+++ w/gates/lib/a.ts" },
    { name: "no prefix", header: "+++ gates/lib/a.ts" },
    { name: "a quoted mnemonic prefix", header: '+++ "w/gates/lib/a.ts"' },
    { name: "an unterminated quote", header: '+++ "b/gates/lib/a.ts' },
    { name: "a quote ending in an escape", header: '+++ "b/gates/lib/a.ts\\"' },
    { name: "an unknown escape", header: '+++ "b/gates/lib/a\\q.ts"' },
    { name: "a short octal escape", header: '+++ "b/gates/lib/a\\1.ts"' },
    { name: "an octal escape over 377", header: '+++ "b/gates/lib/a\\400.ts"' },
    { name: "bytes that are not UTF-8", header: '+++ "b/gates/lib/a\\377.ts"' },
    { name: "text after the closing quote", header: '+++ "b/gates/lib/a.ts"x' },
    { name: "text after /dev/null", header: "+++ /dev/nullx" },
    { name: "an empty name", header: "+++ " },
  ])("fails naming the header on $name", ({ header }) => {
    const diff = ["diff --git a/gates/lib/a.ts b/gates/lib/a.ts", header, "@@ -0,0 +1 @@", "+export {};", ""].join("\n");
    expect(() => changedFiles(diff)).toThrow(`git diff wrote a file header the gate cannot read: ${JSON.stringify(header)}`);
  });

  it("takes a path with any character git writes into scope, a newline included", () => {
    expect(inScope("gates/lib/a\nb.ts")).toBe(true);
    expect(inScope("gates/lib/a.ts\n")).toBe(false);
  });
});

describe("mutation gate: diff headers and mutate inputs (phase 3 round 7, O7-01 and O7-02)", () => {
  const sources = {
    [space]: "export const space = 1;\n",
    [ok]: "export const ok = 2;\nexport const more = 3;\n",
    [both]: "export const both = 1;\n",
    [accent]: "export const accent = 1;\nexport const two = 2;\n",
  };

  async function gate(args: readonly string[], diff: string, files: Readonly<Record<string, string>> = {}, killed = false) {
    const { io, out, err } = capture();
    const mutated: string[] = [];
    const stryker = fakeStryker(() => "Killed");
    const code = await mutation(
      context(args),
      { git: fakeGit(diff), ...fakeRepo(files, killed ? (mutate, tree) => (mutated.push(...mutate), stryker(mutate, tree)) : noStryker) },
      io,
    );
    return { code, out, err, mutated };
  }

  it("mutates the files of tab-suffixed and quoted headers in a normal run", async () => {
    expect(await gate(["--base", base], quoted, sources, true)).toEqual({
      code: 0,
      out: ["mutation: 4 mutants on the changed lines of 4 files, none survived; 0 timeouts, 0 compile errors, 0 zero-mutant entries; 0 equivalent records"],
      err: [],
      mutated: [`${space}:1-1`, `${ok}:1-2`, `${both}:1-1`, `${accent}:1-2`],
    });
  });

  it("plans the files of tab-suffixed and quoted headers", async () => {
    expect(await gate(["--base", base, "--plan"], quoted)).toEqual({
      code: 0,
      out: [JSON.stringify([{ files: [space, both, accent, ok].join(","), lines: 6 }])],
      err: ["mutation: plan: 1 shard, 0 cuts within files (a mutant spanning a cut is mutated in no shard, see gates/README.md)"],
      mutated: [],
    });
  });

  it("--files selects the file of a quoted header", async () => {
    expect(await gate(["--base", base, "--files", accent], quoted, sources, true)).toEqual({
      code: 0,
      out: ["mutation: 1 mutant on the changed lines of 1 file, none survived; 0 timeouts, 0 compile errors, 0 zero-mutant entries; 0 equivalent records"],
      err: [],
      mutated: [`${accent}:1-2`],
    });
  });

  it.each([
    { mode: "a normal run", args: ["--base", base] },
    { mode: "--plan", args: ["--base", base, "--plan"] },
    { mode: "--files", args: ["--base", base, "--files", ok] },
  ])(
    "exits 2 naming a header it cannot read, before Stryker runs ($mode)",
    async ({ args }) => {
      expect(await gate(args, mnemonic, sources, true)).toEqual({
        code: 2,
        out: [],
        err: [headerCause("+++ w/packages/tokens/src/a b.ts\t")],
        mutated: [],
      });
    },
  );

  it.each(["*", "?", "[", "]", "{", "}", "!", ",", "+(", "@("])(
    "exits 2 naming a changed path holding %j, before Stryker runs",
    async (part) => {
      const path = part.endsWith("(") ? `gates/lib/a${part}b).ts` : `gates/lib/a${part}b.ts`;
      expect(await gate(["--base", base], newFilesDiff({ [path]: 1 }), { [path]: "export {};\n" }, true)).toEqual({
        code: 2,
        out: [],
        err: [pathsCause([path])],
        mutated: [],
      });
    },
  );

  it("exits 2 naming a changed path holding a backslash (a quoted header), before Stryker runs", async () => {
    const diff = ['diff --git "a/gates/lib/a\\\\b.ts" "b/gates/lib/a\\\\b.ts"', '+++ "b/gates/lib/a\\\\b.ts"', "@@ -0,0 +1 @@", "+export {};", ""];
    expect(await gate(["--base", base], diff.join("\n"), { "gates/lib/a\\b.ts": "export {};\n" }, true)).toEqual({
      code: 2,
      out: [],
      err: [pathsCause(["gates/lib/a\\b.ts"])],
      mutated: [],
    });
  });

  it.each([
    { mode: "a normal run", args: ["--base", base] },
    { mode: "--plan", args: ["--base", base, "--plan"] },
    { mode: "--files", args: ["--base", base, "--files", "gates/lib/ok.ts"] },
  ])(
    "names every such path in one cause line, in diff order ($mode)",
    async ({ args }) => {
      const diff = newFilesDiff({ "gates/lib/a*.ts": 1, "gates/lib/ok.ts": 1, "gates/lib/b,c.ts": 2 });
      const files = { "gates/lib/a*.ts": "export {};\n", "gates/lib/ok.ts": "export {};\n", "gates/lib/b,c.ts": "export {};\n" };
      expect(await gate(args, diff, files, true)).toEqual({
        code: 2,
        out: [],
        err: [pathsCause(["gates/lib/a*.ts", "gates/lib/b,c.ts"])],
        mutated: [],
      });
    },
  );

  it.each(["+", "@", "(", " ", "#", ":", "é"])("runs Stryker on a changed path holding %j alone", async (part) => {
    const path = `gates/lib/a${part}b.ts`;
    expect(await gate(["--base", base], newFilesDiff({ [path]: 1 }), { [path]: "export {};\n" }, true)).toEqual({
      code: 0,
      out: ["mutation: 1 mutant on the changed lines of 1 file, none survived; 0 timeouts, 0 compile errors, 0 zero-mutant entries; 0 equivalent records"],
      err: [],
      mutated: [`${path}:1-1`],
    });
  });
});

// Phase 3 round 8 (R8-01; tasks.md T097): Stryker 10.1.1 splits a `mutate` entry with MUTATION_RANGE_REGEX, which has
// no `s` flag and no `^` anchor, so of a path holding a line terminator it takes only the text after the last one and
// mutates nothing in the file. gates/test/fixtures/git-diff/line-terminators.diff is
// `git diff --cached --unified=0 --no-color --no-ext-diff HEAD --` recorded from a scratch repository (git 2.43.0) with
// new files whose names hold `\n`, `\r`, U+2028 and U+2029, beside ok.ts. Each such path is exit 2 before Stryker
// runs, in every mode; the cause names the path as JSON, with U+2028 and U+2029 escaped so the cause stays one line.
const terminators = readFileSync(new URL("fixtures/git-diff/line-terminators.diff", import.meta.url), "utf8");
const lf = "packages/tokens/src/a\nb.ts";
const cr = "packages/tokens/src/a\rb.ts";
const ls = "packages/tokens/src/a\u2028b.ts";
const ps = "packages/tokens/src/a\u2029b.ts";
const terminated = [
  { name: "\\n", header: "a\\nb.ts", path: lf, named: '"packages/tokens/src/a\\nb.ts"' },
  { name: "\\r", header: "a\\rb.ts", path: cr, named: '"packages/tokens/src/a\\rb.ts"' },
  { name: "U+2028", header: "a\\342\\200\\250b.ts", path: ls, named: '"packages/tokens/src/a\\u2028b.ts"' },
  { name: "U+2029", header: "a\\342\\200\\251b.ts", path: ps, named: '"packages/tokens/src/a\\u2029b.ts"' },
];

describe("changedFiles and unusableMutatePaths: line terminators in paths (phase 3 round 8, R8-01)", () => {
  it("reads every file of the recorded diff, the paths holding a line terminator in scope", () => {
    expect(changedFiles(terminators)).toEqual([
      { path: lf, ranges: [{ start: 1, end: 1 }], lines: 1 },
      { path: cr, ranges: [{ start: 1, end: 2 }], lines: 2 },
      { path: ls, ranges: [{ start: 1, end: 1 }], lines: 1 },
      { path: ps, ranges: [{ start: 1, end: 1 }], lines: 1 },
      { path: ok, ranges: [{ start: 1, end: 1 }], lines: 1 },
    ]);
  });

  it("names every path holding \\n, \\r, U+2028 or U+2029 as unusable, in diff order", () => {
    expect(unusableMutatePaths(changedFiles(terminators))).toEqual([lf, cr, ls, ps]);
  });
});

describe("mutation gate: a changed path holding a line terminator (phase 3 round 8, R8-01)", () => {
  const sources = {
    [lf]: "export const lf = 1;\n",
    [cr]: "export const cr = 1;\nexport const two = 2;\n",
    [ls]: "export const ls = 1;\n",
    [ps]: "export const ps = 1;\n",
    [ok]: "export const ok = 1;\n",
  };
  const modes = [
    { mode: "a normal run", args: ["--base", base] },
    { mode: "--plan", args: ["--base", base, "--plan"] },
    { mode: "--files", args: ["--base", base, "--files", ok] },
  ];
  const cases = terminated.flatMap((terminator) => modes.map((mode) => ({ ...terminator, ...mode })));

  it.each(cases)("exits 2 naming the path holding $name, before Stryker runs ($mode)", async ({ header, args, named }) => {
    const { io, out, err } = capture();
    const mutated: string[] = [];
    const stryker = fakeStryker(() => "Killed");
    const code = await mutation(
      context(args),
      { git: fakeGit(parts(terminators, header, "ok.ts")), ...fakeRepo(sources, (mutate, tree) => (mutated.push(...mutate), stryker(mutate, tree))) },
      io,
    );
    expect({ code, out, err, mutated }).toEqual({
      code: 2,
      out: [],
      err: [`mutation: could not run: Stryker cannot take these changed paths as mutate input (${unusableKinds}): ${named}; rename them`],
      mutated: [],
    });
  });

  it("names all four paths in one cause line, in diff order", async () => {
    const { io, out, err } = capture();
    const mutated: string[] = [];
    const stryker = fakeStryker(() => "Killed");
    const tools = { git: fakeGit(terminators), ...fakeRepo(sources, (mutate, tree) => (mutated.push(...mutate), stryker(mutate, tree))) };
    const code = await mutation(context(["--base", base]), tools, io);
    expect({ code, out, err, mutated }).toEqual({
      code: 2,
      out: [],
      mutated: [],
      err: [
        `mutation: could not run: Stryker cannot take these changed paths as mutate input (${unusableKinds}): ` +
          `${terminated.map((terminator) => terminator.named).join(", ")}; rename them`,
      ],
    });
  });
});
