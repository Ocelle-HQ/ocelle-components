import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
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

// --verify (op 023, FR-011; plan.md *Verify mode*, *Test approach* 8, acceptance check 11): a commit, or a range, passes
// only when each changed file is a modified regular file whose new content is exactly the script's redaction of its
// old content. Each case runs in a temporary git repository with an RFC 2606 identity, and asserts that no output line
// matches the rule and that the run left the work tree, the index and the tracked files as they were.
const identity = ["-c", "user.name=Verify Example", "-c", "user.email=verify@example.com", "-c", "commit.gpgsign=false"];
const logPath = "logs/check-head.log";
const jsonPath = "data/mutation.json";
const notesPath = "notes.txt";
const logLines = [`store ${rootDir}.local/share/pnpm/store/v10/files/00/abc`, ` RUN  v5.0.5 ${homeDir}ocelle-components`, `(${rootDir}.cache/ms-playwright)`, "plain line"];
const redactedLog = ["store <pnpm store>/files/00/abc", " RUN  v5.0.5 <repo>", "(<home>/.cache/ms-playwright)", "plain line"];
const summary = "redact-sandbox-paths: verify: 2 files changed, each only by the redaction";

function git(dir: string, args: readonly string[]): string {
  return execFileSync("git", [...identity, ...args], { cwd: dir, env: baseEnv(), encoding: "utf8" });
}

function put(dir: string, path: string, content: string): void {
  mkdirSync(dirname(join(dir, path)), { recursive: true });
  writeFileSync(join(dir, path), content);
}

/** A repository whose root commit holds a log and a JSON file with sandbox paths, and a plain file. */
function based(): { dir: string; base: string } {
  const dir = tempDir("verify");
  git(dir, ["init", "-q", "-b", "main"]);
  put(dir, logPath, `${logLines.join("\n")}\n`);
  put(dir, jsonPath, `${JSON.stringify({ projectRoot: `${homeDir}ocelle-components`, files: [`file://${homeDir}ocelle-components/a.ts`] }, null, 2)}\n`);
  put(dir, notesPath, "nothing to redact\n");
  git(dir, ["add", "-A"]);
  git(dir, ["commit", "-q", "-m", "base"]);
  return { dir, base: git(dir, ["rev-parse", "HEAD"]).trim() };
}

/** Applies the change to the work tree, commits everything and returns the new commit. */
function committed(dir: string, change: () => void): string {
  change();
  git(dir, ["add", "-A"]);
  git(dir, ["commit", "-q", "--allow-empty", "-m", "change"]);
  return git(dir, ["rev-parse", "HEAD"]).trim();
}

/** Runs the script's own redaction over the log and the JSON file, as the one-time run and the landing step do. */
function inPlace(dir: string): void {
  const ran = redact(["--in-place", join(dir, logPath), join(dir, jsonPath)]);
  if (ran.code !== 0) throw new Error(`--in-place failed: ${ran.stderr}`);
}

function nonEmpty(text: string): string[] {
  return text.split("\n").filter((line) => line.length > 0);
}

/** Runs `--verify` with the arguments in the repository, and the facts every case asserts. */
function verify(dir: string, args: readonly string[]): unknown {
  const files = git(dir, ["ls-files", "-s"]);
  const ran = spawnSync(script, ["--verify", ...args], { cwd: dir, env: baseEnv(), encoding: "utf8" });
  const [stdout, stderr] = [nonEmpty(ran.stdout), nonEmpty(ran.stderr)];
  return {
    exit: ran.status,
    stdout,
    stderr,
    matching: [...stdout, ...stderr].filter((line) => rule.test(line)),
    status: git(dir, ["status", "--porcelain"]),
    filesUnchanged: git(dir, ["ls-files", "-s"]) === files,
  };
}

function outcome(exit: number, stdout: readonly string[], stderr: readonly string[]): unknown {
  return { exit, stdout, stderr, matching: [], status: "", filesUnchanged: true };
}

function finding(path: string, reason: string): unknown {
  return outcome(1, [`redact-sandbox-paths: verify: ${path}: ${reason}`], []);
}

function cause(text: string): unknown {
  return outcome(2, [], [`redact-sandbox-paths: verify: ${text}`]);
}

describe("--verify", () => {
  it("passes a commit made by --in-place, given as one revision, with the summary", () => {
    const { dir } = based();
    const redacted = committed(dir, () => {
      inPlace(dir);
    });
    expect(verify(dir, [redacted])).toEqual(outcome(0, [summary], []));
  });

  it("passes the same commit given as the range <from>..<to>", () => {
    const { dir, base } = based();
    const redacted = committed(dir, () => {
      inPlace(dir);
    });
    expect(verify(dir, [`${base}..${redacted}`])).toEqual(outcome(0, [summary], []));
  });

  it("finds the log when the store path got the wrong placeholder", () => {
    const { dir } = based();
    const head = committed(dir, () => {
      inPlace(dir);
      put(dir, logPath, `${["store <repo>/files/00/abc", ...redactedLog.slice(1)].join("\n")}\n`);
    });
    expect(verify(dir, [head])).toEqual(finding(logPath, "not the redaction of its old content"));
  });

  it("finds the log when another word of it changed beside the redaction", () => {
    const { dir } = based();
    const head = committed(dir, () => {
      inPlace(dir);
      put(dir, logPath, `${[...redactedLog.slice(0, 3), "plain lane"].join("\n")}\n`);
    });
    expect(verify(dir, [head])).toEqual(finding(logPath, "not the redaction of its old content"));
  });

  it("finds the log when only one of its matching lines was redacted", () => {
    const { dir } = based();
    const head = committed(dir, () => {
      inPlace(dir);
      put(dir, logPath, `${[redactedLog[0], ...logLines.slice(1)].join("\n")}\n`);
    });
    expect(verify(dir, [head])).toEqual(finding(logPath, "not the redaction of its old content"));
  });

  it("finds a file added beside a correct redaction", () => {
    const { dir } = based();
    const head = committed(dir, () => {
      inPlace(dir);
      put(dir, "added.txt", "new\n");
    });
    expect(verify(dir, [head])).toEqual(finding("added.txt", "added"));
  });

  it("finds a file deleted beside a correct redaction", () => {
    const { dir } = based();
    const head = committed(dir, () => {
      inPlace(dir);
      rmSync(join(dir, notesPath));
    });
    expect(verify(dir, [head])).toEqual(finding(notesPath, "deleted"));
  });

  it("finds a mode change beside a correct redaction", () => {
    const { dir } = based();
    const head = committed(dir, () => {
      inPlace(dir);
      chmodSync(join(dir, notesPath), 0o755);
    });
    expect(verify(dir, [head])).toEqual(finding(notesPath, "mode changed"));
  });

  it("exits 2 on a commit that changes no file", () => {
    const { dir } = based();
    const empty = committed(dir, () => undefined);
    expect(verify(dir, [empty])).toEqual(cause(`no change in ${empty}^1..${empty}`));
  });

  it("exits 2 on a revision that does not resolve to a commit", () => {
    const { dir } = based();
    expect(verify(dir, ["no-such-revision"])).toEqual(cause("no-such-revision is not a commit"));
  });

  it("exits 2 on the root commit, which has no parent", () => {
    const { dir, base } = based();
    expect(verify(dir, [base])).toEqual(cause(`${base} has no parent`));
  });

  it("exits 2 on --verify alone", () => {
    const { dir } = based();
    expect(verify(dir, [])).toEqual(cause("takes exactly one argument, <rev> or <from>..<to>"));
  });

  it("exits 2 on --verify with two arguments", () => {
    const { dir, base } = based();
    const redacted = committed(dir, () => {
      inPlace(dir);
    });
    expect(verify(dir, [base, redacted])).toEqual(cause("takes exactly one argument, <rev> or <from>..<to>"));
  });
});
