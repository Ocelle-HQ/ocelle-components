import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { decideSetup, setupOffline } from "../bin/setup-offline.ts";
import type { SetupTools } from "../bin/setup-offline.ts";
import type { Io } from "../lib/cli.ts";
import type { ChromiumCheck } from "../bin/test.ts";

const chrome = "/home/u/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome";
const present: ChromiumCheck = { executable: chrome, problem: undefined };
const missing: ChromiumCheck = {
  executable: chrome,
  problem: `Chromium not found at ${chrome}; run pnpm run setup:online`,
};

function pnpm(name: string): string {
  return readFileSync(new URL(`fixtures/pnpm/${name}`, import.meta.url), "utf8");
}

describe("decideSetup", () => {
  it("turns a tarball missing from the store into 'missing: <package>; run pnpm run setup:online', exit 2", () => {
    const result = decideSetup({ exitCode: 1, output: pnpm("no-offline-tarball.ndjson") }, present);
    expect(result).toEqual({ exit: 2, cause: "setup: missing: is-number@7.0.0; run pnpm run setup:online" });
  });

  it("turns package metadata missing from the cache into 'missing: <package>; run pnpm run setup:online', exit 2", () => {
    const result = decideSetup({ exitCode: 1, output: pnpm("no-offline-meta.ndjson") }, present);
    expect(result).toEqual({ exit: 2, cause: "setup: missing: is-number; run pnpm run setup:online" });
  });

  it("reports any other pnpm failure as exit 2 naming pnpm's error code", () => {
    const result = decideSetup({ exitCode: 1, output: pnpm("outdated-lockfile.ndjson") }, present);
    expect(result.exit).toBe(2);
    const cause = result.exit === 2 ? result.cause : "";
    expect(cause).toContain("ERR_PNPM_OUTDATED_LOCKFILE");
    expect(cause).not.toContain("\n");
  });

  it("reports a pnpm failure without an error record as exit 2 naming its exit code", () => {
    const result = decideSetup({ exitCode: 9, output: "" }, present);
    expect(result.exit).toBe(2);
    expect(result.exit === 2 ? result.cause : "").toContain("exit 9");
  });

  it("names Chromium and pnpm run setup:online when the install succeeds but Chromium is missing, exit 2", () => {
    const result = decideSetup({ exitCode: 0, output: pnpm("success.ndjson") }, missing);
    expect(result).toEqual({ exit: 2, cause: `setup: Chromium not found at ${chrome}; run pnpm run setup:online` });
  });

  it("names the missing package first when both the store and Chromium lack something", () => {
    const result = decideSetup({ exitCode: 1, output: pnpm("no-offline-tarball.ndjson") }, missing);
    expect(result).toEqual({ exit: 2, cause: "setup: missing: is-number@7.0.0; run pnpm run setup:online" });
  });

  it("passes a successful install with Chromium present, naming the Chromium it found", () => {
    const result = decideSetup({ exitCode: 0, output: pnpm("success.ndjson") }, present);
    expect(result).toEqual({ exit: 0, summary: `setup: installed offline; Chromium at ${chrome}` });
  });
});

// Added in the phase 3 mutation catch-up of phase 2 (T049): mutants that survived the phase 2 tests.
describe("decideSetup (mutation catch-up)", () => {
  it("names pnpm's error code and the first line of its message for any other failure", () => {
    const result = decideSetup({ exitCode: 1, output: pnpm("outdated-lockfile.ndjson") }, present);
    expect(result).toEqual({
      exit: 2,
      cause:
        "setup: pnpm install --offline failed: ERR_PNPM_OUTDATED_LOCKFILE: installing dependencies: " +
        'Cannot install with "frozen-lockfile" because pnpm-lock.yaml is not up to date with package.json.',
    });
  });

  it("skips lines that are not error records: text, null, numbers, lists and other levels", () => {
    const output = `progress text\nnull\n42\n[1]\n{"level":"info","message":"x"}\n${pnpm("no-offline-tarball.ndjson")}`;
    expect(decideSetup({ exitCode: 1, output }, present)).toEqual({
      exit: 2,
      cause: "setup: missing: is-number@7.0.0; run pnpm run setup:online",
    });
  });

  it("reads an error record whose code and message are not text as empty", () => {
    const output = '{"level":"error","code":7,"message":["x"]}\n';
    expect(decideSetup({ exitCode: 1, output }, present)).toEqual({
      exit: 2,
      cause: "setup: pnpm install --offline failed: : ",
    });
  });

  it("names an unknown Chromium when the check names no executable", () => {
    expect(decideSetup({ exitCode: 0, output: "" }, { executable: undefined, problem: undefined })).toEqual({
      exit: 0,
      summary: "setup: installed offline; Chromium at (unknown)",
    });
  });
});

describe("setupOffline (mutation catch-up)", () => {
  function capture(): { io: Io; out: string[]; err: string[] } {
    const out: string[] = [];
    const err: string[] = [];
    return { io: { cwd: "/work/repo", env: {}, out: (l) => out.push(l), err: (l) => err.push(l) }, out, err };
  }

  /** pnpm that installs only when asked for the frozen, offline install with the ndjson reporter. */
  function pnpmWith(output: string, exitCode: number): SetupTools["pnpm"] {
    return (args) =>
      Promise.resolve(
        args.join(" ") === "install --frozen-lockfile --offline --reporter=ndjson"
          ? { exitCode, output }
          : { exitCode: 1, output: '{"level":"error","code":"ERR_UNEXPECTED","message":"unexpected pnpm call"}' },
      );
  }

  const noChromium: SetupTools["chromium"] = () => Promise.reject(new Error("Chromium must not be checked"));

  it("installs frozen and offline with the ndjson log, then checks Chromium", async () => {
    const c = capture();
    const tools = { pnpm: pnpmWith(pnpm("success.ndjson"), 0), chromium: () => Promise.resolve(present) };
    const code = await setupOffline(tools, c.io);
    expect({ code, out: c.out, err: c.err }).toEqual({
      code: 0,
      out: [`setup: installed offline; Chromium at ${chrome}`],
      err: [],
    });
  });

  it("reports a missing Chromium after a successful install", async () => {
    const c = capture();
    const tools = { pnpm: pnpmWith(pnpm("success.ndjson"), 0), chromium: () => Promise.resolve(missing) };
    const code = await setupOffline(tools, c.io);
    expect({ code, out: c.out, err: c.err }).toEqual({
      code: 2,
      out: [],
      err: [`setup: Chromium not found at ${chrome}; run pnpm run setup:online`],
    });
  });

  it("reports a failed install on its own, without checking Chromium", async () => {
    const c = capture();
    const tools = { pnpm: pnpmWith(pnpm("no-offline-tarball.ndjson"), 1), chromium: noChromium };
    const code = await setupOffline(tools, c.io);
    expect({ code, out: c.out, err: c.err }).toEqual({
      code: 2,
      out: [],
      err: ["setup: missing: is-number@7.0.0; run pnpm run setup:online"],
    });
  });
});
