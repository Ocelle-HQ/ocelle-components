import { describe, expect, it } from "vitest";
import { allowedFiles, grepArgs, parseGrep, sandboxPathRule, verdict } from "../lib/sandbox-paths.ts";
import { checkout, ruleTable, store } from "./sandbox-paths-table.ts";

// The sandbox-paths gate's decisions, in process (op 023, #60; plan.md *Test approach* 1): the rule of FR-001 over the
// table of acceptance check 1, the four allowed files of FR-003, the git grep arguments, the parse of `git grep -z -n`
// records into findings that never echo the matched text, and the verdict for git's exit codes and the tracked-file
// count. Every sandbox path is built at run time (gates/test/sandbox-paths-table.ts).
const message = "holds a sandbox path; redact it with tooling/speckit/bin/redact-sandbox-paths.sh --in-place";
const allowed = [
  "gates/test/capture-plan.test.ts",
  "gates/test/fixtures/pins/pnpm/outdated-lockfile.ndjson",
  "gates/test/fixtures/pins/pnpm/success.ndjson",
  "specs/001-repository-foundation/reviews/phase-4/round-1.md",
];

function finding(path: string, line: number) {
  return { location: { path, line }, gate: "sandbox-paths", rule: "sandbox-path", message };
}

describe("sandboxPathRule (FR-001)", () => {
  it("is the rule of op 023, and matches exactly the matching lines of the table", () => {
    const rule = new RegExp(sandboxPathRule);
    expect({
      rule: sandboxPathRule,
      answers: ruleTable.map(([line]) => [line, rule.test(line)]),
    }).toEqual({
      rule: "(^|[^A-Za-z0-9._~-])/(root|home/user)/[A-Za-z0-9._-]",
      answers: ruleTable.map(([line, matches]) => [line, matches]),
    });
  });
});

describe("allowedFiles (FR-003)", () => {
  it("is the four allowed files, sorted", () => {
    expect(allowedFiles).toEqual(allowed);
  });
});

describe("grepArgs", () => {
  it("searches with the rule, skips binary files, and excludes each allowed file as a literal path", () => {
    expect({ repository: grepArgs(allowedFiles), other: grepArgs(["a b/*.md", "c"]) }).toEqual({
      repository: ["--no-color", "-z", "-n", "-I", "-E", "-e", sandboxPathRule, "--", ".", ...allowed.map((path) => `:(exclude,literal)${path}`)],
      other: ["--no-color", "-z", "-n", "-I", "-E", "-e", sandboxPathRule, "--", ".", ":(exclude,literal)a b/*.md", ":(exclude,literal)c"],
    });
  });
});

describe("parseGrep", () => {
  it("reads -z records into one finding per line, for paths with a colon and a space, and echoes no matched text", () => {
    const stdout = `logs/a:b.log\u00002\u0000store ${store}\nnotes/c d.json\u000015\u0000"${checkout}": 1\n`;
    const findings = parseGrep(stdout);
    expect({
      findings,
      echoes: findings.filter((found) => found.message.includes(store) || found.message.includes(checkout) || found.message.includes("store ")),
      empty: parseGrep(""),
    }).toEqual({
      findings: [finding("logs/a:b.log", 2), finding("notes/c d.json", 15)],
      echoes: [],
      empty: [],
    });
  });

  it("throws on a record that is not path, line and text", () => {
    expect(() => parseGrep("logs/a.log:2:text\n")).toThrow("unexpected git grep output: a record without a path and a line number");
  });
});

describe("verdict", () => {
  const matches = `a.log\u00002\u0000x\na.log\u00005\u0000y\nb/c.md\u00001\u0000z\n`;

  it("maps git grep exit 1 (no match) to exit 0 with the summary", () => {
    expect([verdict({ tracked: 3, code: 1, stdout: "", stderr: "" }), verdict({ tracked: 1, code: 1, stdout: "", stderr: "" })]).toEqual([
      { exit: 0, summary: "sandbox-paths: 3 tracked files checked, none holds a sandbox path (4 allowed files)" },
      { exit: 0, summary: "sandbox-paths: 1 tracked file checked, none holds a sandbox path (4 allowed files)" },
    ]);
  });

  it("maps git grep exit 0 (matches) to exit 1 with one finding per line", () => {
    expect([verdict({ tracked: 9, code: 0, stdout: matches, stderr: "" }), verdict({ tracked: 9, code: 0, stdout: "a.log\u00002\u0000x\n", stderr: "" })]).toEqual([
      { exit: 1, findings: [finding("a.log", 2), finding("a.log", 5), finding("b/c.md", 1)], summary: "sandbox-paths: 3 sandbox paths in 2 tracked files" },
      { exit: 1, findings: [finding("a.log", 2)], summary: "sandbox-paths: 1 sandbox path in 1 tracked file" },
    ]);
  });

  it("maps any other git grep exit to exit 2 with git's first error line", () => {
    expect([
      verdict({ tracked: 2, code: 128, stdout: "", stderr: "fatal: bad pathspec\nusage: more\n" }),
      verdict({ tracked: 2, code: 3, stdout: "", stderr: "" }),
      verdict({ tracked: 2, code: null, stdout: "", stderr: "" }),
      verdict({ tracked: 2, code: 0, stdout: "", stderr: "" }),
    ]).toEqual([
      { exit: 2, cause: "sandbox-paths: could not run: git grep failed (exit 128): fatal: bad pathspec" },
      { exit: 2, cause: "sandbox-paths: could not run: git grep failed (exit 3)" },
      { exit: 2, cause: "sandbox-paths: could not run: git grep failed (ended by a signal)" },
      { exit: 2, cause: "sandbox-paths: could not run: git grep reported a match but printed no record" },
    ]);
  });

  it("maps zero tracked files to exit 2 no tracked file, whatever git grep did", () => {
    const cause = "sandbox-paths: could not run: no tracked file; the root holds no file that git tracks";
    expect([verdict({ tracked: 0, code: 1, stdout: "", stderr: "" }), verdict({ tracked: 0, code: 0, stdout: matches, stderr: "" })]).toEqual([
      { exit: 2, cause },
      { exit: 2, cause },
    ]);
  });
});
