import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { decideSetup } from "../bin/setup-offline.ts";
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
