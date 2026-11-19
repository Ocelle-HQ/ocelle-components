import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The time limit of the visual integration tests (012 reviews/phase-6/round-7.md O7-01, operator round of 2026-11-19;
// tasks.md T078). At 194 stories (388 story-themes) the whole-repository capture timed out at the 600 s limit on CI
// run 44481594952, so the limit was raised to 1200 s for gates/test/integration/visual.test.ts only. This test, in the
// `gates` project that runs no integration test, reads that file as text: it pins the one `const timeout` between
// 1200 s and 1800 s and requires the reason and the measurements in the comment directly above it, so that a later
// edit cannot lower the limit again without its reason.
const source = readFileSync(new URL("integration/visual.test.ts", import.meta.url), "utf8");
const lines = source.split("\n");
const constant = /^const timeout = ([0-9_]+);$/;

/** The indexes of the lines that declare `const timeout = <number>;`. */
function declarations(): number[] {
  return lines.flatMap((line, index) => (constant.test(line) ? [index] : []));
}

/** The run of `//` comment lines directly above a line, joined with spaces, the markers removed. */
function commentAbove(index: number): string {
  const run: string[] = [];
  for (let at = index - 1; at >= 0; at--) {
    const line = lines[at] ?? "";
    if (!line.startsWith("//")) break;
    run.unshift(line.replace(/^\/\/ ?/, ""));
  }
  return run.join(" ");
}

describe("the visual integration tests' time limit (012 O7-01)", () => {
  it("is declared exactly once, as a numeric literal", () => {
    expect(declarations()).toHaveLength(1);
  });

  it("is at least 1200 s and at most 1800 s", () => {
    const [index] = declarations();
    const value = Number(constant.exec(lines[index ?? -1] ?? "")?.[1]?.replaceAll("_", "") ?? Number.NaN);
    expect(value).toBeGreaterThanOrEqual(1_200_000);
    expect(value).toBeLessThanOrEqual(1_800_000);
  });

  it("gives its reason and measurements in the comment directly above it", () => {
    const [index] = declarations();
    const comment = commentAbove(index ?? 0).replace(/\s+/g, " ");
    for (const expected of ["44481594952", "600 s", "194 stories", "388 story-themes", "519 s", "171 stories", "R1-06"]) {
      expect(comment).toContain(expected);
    }
  });
});
