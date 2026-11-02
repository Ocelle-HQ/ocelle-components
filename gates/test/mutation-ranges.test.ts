import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { mutation } from "../bin/mutation.ts";
import { changedFiles, inScope, mutateSpecs, scopePathspecs } from "../lib/mutation/ranges.ts";
import { base, capture, context, fakeGit, fakeRead, noStryker, scope } from "./mutation-fakes.ts";

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
    const code = await mutation(context(["--base", base]), { git: fakeGit(onlyTestsAndDocs), read: fakeRead({}), stryker: noStryker }, io);
    expect({ code, out, err }).toEqual({
      code: 0,
      out: [`mutation: nothing to mutate: no package or gate source line changed since ${base}`],
      err: [],
    });
  });
});
