import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { sandboxPathRule } from "../../lib/sandbox-paths.ts";
import { homeDir, rootDir } from "../sandbox-paths-table.ts";
import { baseEnv, cleanUp, repo, tempDir } from "./workspace.ts";

// tooling/speckit/bin/redact-sandbox-paths.sh (op 023, #60, FR-006; plan.md *Redaction script*, *Test approach* 5):
// through stdin and with --in-place, the store prefix becomes <pnpm store>, the checkout root <repo> (also after
// file://) when no path-name character follows it, and any other prefix that matches the rule <home>/, in that order.
// The character before the path is kept and every other byte stays. Every sandbox path is built at run time.
const script = join(repo, "tooling/speckit/bin/redact-sandbox-paths.sh");
const rule = new RegExp(sandboxPathRule);

/** Input lines and the line the script must write for each. */
const cases: readonly (readonly [string, string])[] = [
  [`Content-addressable store is at: ${rootDir}.local/share/pnpm/store/v10`, "Content-addressable store is at: <pnpm store>"],
  [`store ${rootDir}.local/share/pnpm/store/v3/files/00/abc`, "store <pnpm store>/files/00/abc"],
  [` RUN  v5.0.5 ${homeDir}ocelle-components`, " RUN  v5.0.5 <repo>"],
  [`"url": "file://${homeDir}ocelle-components/gates/lib/a.ts"`, '"url": "file://<repo>/gates/lib/a.ts"'],
  [`${homeDir}ocelle-components ${homeDir}ocelle-components:3`, "<repo> <repo>:3"],
  [`${homeDir}ocelle-components-old/x`, "<home>/ocelle-components-old/x"],
  [`(${rootDir}.cache/ms-playwright)`, "(<home>/.cache/ms-playwright)"],
  [`${rootDir}x and ${homeDir}y`, "<home>/x and <home>/y"],
  [`${rootDir}.local/share/pnpm/store`, "<home>/.local/share/pnpm/store"],
  ["/work/root/x `/root/` /home/user/… /home/runner/x", "/work/root/x `/root/` /home/user/… /home/runner/x"],
  ["plain line\twith a tab", "plain line\twith a tab"],
];
const input = cases.map(([line]) => line).join("\n");
const output = cases.map(([, line]) => line).join("\n");

function redact(args: readonly string[], stdin = ""): { code: number | null; stdout: string; stderr: string } {
  const ran = spawnSync(script, args, { input: stdin, env: baseEnv(), encoding: "utf8" });
  return { code: ran.status, stdout: ran.stdout, stderr: ran.stderr };
}

function matching(text: string): string[] {
  return text.split("\n").filter((line) => rule.test(line));
}

afterEach(cleanUp);

describe("redact-sandbox-paths.sh", () => {
  it("redacts stdin to stdout in rule order, keeps every other byte and the lines, and leaves no line that matches the rule", () => {
    const [ended, open] = [redact([], `${input}\n`), redact([], input)];
    expect({ ended, open: open.stdout, matching: matching(ended.stdout), lines: ended.stdout.split("\n").length }).toEqual({
      ended: { code: 0, stdout: `${output}\n`, stderr: "" },
      open: output,
      matching: [],
      lines: cases.length + 1,
    });
  });

  it("rewrites each file given to --in-place, a JSON file still parsing, and prints nothing", () => {
    const dir = tempDir("redact");
    const log = join(dir, "check-head.log");
    const json = join(dir, "mutation.json");
    const record = { projectRoot: `${homeDir}ocelle-components`, files: { [`file://${homeDir}ocelle-components/a.ts`]: { store: `${rootDir}.local/share/pnpm/store/v10/x` } } };
    writeFileSync(log, `${input}\n`);
    writeFileSync(json, `${JSON.stringify(record, null, 2)}\n`);
    const ran = redact(["--in-place", log, json]);
    const after = readFileSync(json, "utf8");
    expect({ ran, log: readFileSync(log, "utf8"), json: JSON.parse(after) as unknown, matching: matching(after) }).toEqual({
      ran: { code: 0, stdout: "", stderr: "" },
      log: `${output}\n`,
      json: { projectRoot: "<repo>", files: { "file://<repo>/a.ts": { store: "<pnpm store>/x" } } },
      matching: [],
    });
  });

  it("exits 2 with its usage on an unknown argument and on --in-place without a file", () => {
    const [unknown, none] = [redact(["--bogus"], input), redact(["--in-place"])];
    expect({ unknown: { code: unknown.code, stdout: unknown.stdout, usage: unknown.stderr.startsWith("usage: redact-sandbox-paths.sh") }, none: { code: none.code, usage: none.stderr.startsWith("usage: redact-sandbox-paths.sh") } }).toEqual({
      unknown: { code: 2, stdout: "", usage: true },
      none: { code: 2, usage: true },
    });
  });

  it("holds no line that matches the rule in its own source", () => {
    const source = readFileSync(script, "utf8");
    expect({ matching: matching(source), redacts: source.includes("<pnpm store>") && source.includes("<repo>") && source.includes("<home>/") }).toEqual({ matching: [], redacts: true });
  });
});
