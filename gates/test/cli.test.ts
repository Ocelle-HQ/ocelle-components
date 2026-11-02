import { describe, expect, it } from "vitest";
import { entry, parseArgs } from "../lib/cli.ts";
import type { Io, Run } from "../lib/cli.ts";

interface Captured {
  readonly io: Io;
  readonly out: string[];
  readonly err: string[];
}

function capture(): Captured {
  const out: string[] = [];
  const err: string[] = [];
  return { io: { cwd: "/work/repo", env: {}, out: (l) => out.push(l), err: (l) => err.push(l) }, out, err };
}

describe("entry", () => {
  it("returns exit 2, not Node's exit 1, when run() throws, with one line naming the cause", async () => {
    const c = capture();
    const run: Run = () => {
      throw new Error("cannot read gates/gates.json");
    };
    const code = await entry(run, [], c.io);
    expect(code).toBe(2);
    expect(c.out).toEqual([]);
    expect(c.err).toHaveLength(1);
    expect(c.err[0]).toContain("cannot read gates/gates.json");
  });

  it("returns exit 2 with one line when an async run() rejects with a multi-line error", async () => {
    const c = capture();
    const run: Run = () => Promise.reject(new Error("spawn vitest ENOENT\n    at stack line"));
    const code = await entry(run, [], c.io);
    expect(code).toBe(2);
    expect(c.err).toHaveLength(1);
    expect(c.err[0]).toContain("spawn vitest ENOENT");
  });

  it("returns exit 2 with one line naming a thrown value that is not an Error", async () => {
    const c = capture();
    const thrown: unknown = "plain string failure";
    const run: Run = () => {
      throw thrown;
    };
    const code = await entry(run, [], c.io);
    expect(code).toBe(2);
    expect(c.err).toHaveLength(1);
    expect(c.err[0]).toContain("plain string failure");
  });

  it("returns the code run() returns for 0, 1 and 2", async () => {
    const codes = await Promise.all([0, 1, 2].map((n) => entry(() => n, [], capture().io)));
    expect(codes).toEqual([0, 1, 2]);
  });

  it("returns exit 2 with one line when run() returns a code outside the contract", async () => {
    const c = capture();
    const code = await entry(() => 7, [], c.io);
    expect(code).toBe(2);
    expect(c.err).toHaveLength(1);
    expect(c.err[0]).toContain("7");
  });

  it("passes argv and io to run()", async () => {
    const c = capture();
    let seen: readonly string[] = [];
    const code = await entry(
      (argv, io) => {
        seen = argv;
        io.out("ran");
        return 1;
      },
      ["--root", "/x", "a"],
      c.io,
    );
    expect({ code, seen, out: c.out }).toEqual({ code: 1, seen: ["--root", "/x", "a"], out: ["ran"] });
  });
});

describe("parseArgs", () => {
  it("defaults the repository root and the tool working directory to the current directory", () => {
    expect(parseArgs(["--base", "abc"], "/work/repo")).toEqual({
      root: "/work/repo",
      toolCwd: "/work/repo",
      args: ["--base", "abc"],
    });
  });

  it("sets the repository root and the tool working directory from --root <dir>", () => {
    expect(parseArgs(["--root", "/tmp/plant"], "/work/repo")).toEqual({
      root: "/tmp/plant",
      toolCwd: "/tmp/plant",
      args: [],
    });
  });

  it("resolves a relative --root against the current directory", () => {
    expect(parseArgs(["--root", "plant"], "/work/repo")).toEqual({
      root: "/work/repo/plant",
      toolCwd: "/work/repo/plant",
      args: [],
    });
  });

  it("leaves every other argument unchanged and in order", () => {
    expect(parseArgs(["--range", "a..b", "--root", "/tmp/r", "--files", "x.ts", "y.ts"], "/w").args).toEqual([
      "--range",
      "a..b",
      "--files",
      "x.ts",
      "y.ts",
    ]);
  });

  it("rejects --root without a directory", () => {
    expect(() => parseArgs(["--root"], "/w")).toThrow(/--root/);
  });
});
