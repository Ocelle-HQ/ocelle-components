import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { run } from "../bin/config-copies.ts";
import type { Io } from "../lib/cli.ts";

const specify = ".specify/extensions/story/story-config.yml";
const tooling = "tooling/speckit/extensions/story/story-config.yml";

interface Outcome {
  readonly code: number;
  readonly out: string[];
  readonly err: string[];
}

async function check(fixture: string): Promise<Outcome> {
  const out: string[] = [];
  const err: string[] = [];
  // The fixture tree is the repository root; the working directory is elsewhere, so only --root can find it.
  const io: Io = { cwd: "/nonexistent-cwd", env: {}, out: (l) => out.push(l), err: (l) => err.push(l) };
  const root = fileURLToPath(new URL(`fixtures/config-copies/${fixture}`, import.meta.url));
  const code = await run(["--root", root], io);
  return { code, out, err };
}

describe("config-copies gate", () => {
  it("passes two byte-identical copies whose test_pathspec is FR-028's test code", async () => {
    const result = await check("equal");
    expect(result).toEqual({
      code: 0,
      out: [`config-copies: ${specify} and ${tooling} are identical`],
      err: [],
    });
  });

  it("fails when one setting differs, naming both copies and the first differing line", async () => {
    const result = await check("differ");
    expect(result.code).toBe(1);
    expect(result.err).toEqual([]);
    expect(result.out[0]).toBe(`${tooling}: config-copies: copies-differ: differs from ${specify} at line 12`);
    expect(result.out).toHaveLength(2);
  });

  it("fails on equal copies whose test_pathspec is not FR-028's test code, one finding per copy", async () => {
    const result = await check("pathspec");
    expect(result.code).toBe(1);
    expect(result.out.slice(0, 2)).toEqual([
      `${specify}: config-copies: test-pathspec: test_pathspec is ":(glob)**/*.test.ts", expected ` +
        `":(glob)**/*.test.ts :(glob)**/*.spec.ts :(glob)**/test/** :(glob)**/*.stories.ts"`,
      `${tooling}: config-copies: test-pathspec: test_pathspec is ":(glob)**/*.test.ts", expected ` +
        `":(glob)**/*.test.ts :(glob)**/*.spec.ts :(glob)**/test/** :(glob)**/*.stories.ts"`,
    ]);
  });

  it("cannot run when a copy is missing, naming it", async () => {
    const result = await check("missing");
    expect(result.code).toBe(2);
    expect(result.out).toEqual([]);
    expect(result.err).toHaveLength(1);
    expect(result.err[0]).toContain(tooling);
  });
});
