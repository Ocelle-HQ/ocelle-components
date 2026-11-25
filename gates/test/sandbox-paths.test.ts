import { describe, expect, it } from "vitest";
import { allowedFiles, grepArgs, parseGrep, sandboxPathRule, verdict } from "../lib/sandbox-paths.ts";
import * as sandboxPaths from "../lib/sandbox-paths.ts";
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

// Operator round 4, O4-02 (plan.md *The gate*, "Binary by content"): the git options that keep every .gitattributes out
// of the scan, for the empty tree of the root's hash algorithm. Read through the module namespace, so that the test
// fails on its assertion while the export is missing.
describe("attributeFreeOptions", () => {
  it("reads no attributes file of the user and takes the attributes from the given empty tree", () => {
    const { attributeFreeOptions } = sandboxPaths as { attributeFreeOptions?: (emptyTree: string) => string[] };
    const sha1 = "4b825dc642cb6eb9a060e54bf8d69288fbee4904";
    const sha256 = "6ef19b41225c5369f1c104d45d8d85efa9b057b53b14b4b9b939dd74decc5321";
    expect({ sha1: attributeFreeOptions?.(sha1), sha256: attributeFreeOptions?.(sha256) }).toEqual({
      sha1: ["-c", "core.attributesFile=/dev/null", `--attr-source=${sha1}`],
      sha256: ["-c", "core.attributesFile=/dev/null", `--attr-source=${sha256}`],
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

  it("throws on a record that is not path, line and text, or whose line is not a line number", () => {
    const problem = "unexpected git grep output: a record without a path and a line number";
    const malformed = [
      "logs/a.log:2:text\n",
      "a.log\u00002x\u0000t\n",
      "a.log\u0000x2\u0000t\n",
      "a.log\u00000\u0000t\n",
      "a.log\u00002\n",
      // No NUL, and the record starts with a digit: it is not a path and a line number either.
      "5abc\n",
      // An empty path: a record without a path.
      "\u00002\u0000t\n",
      // A malformed record after a record whose path is a number: the parse throws, and never goes back to an earlier offset.
      "12\u00003\u0000t\nbad",
    ];
    const thrown = malformed.map((stdout) => {
      try {
        parseGrep(stdout);
        return "no error";
      } catch (error) {
        return error instanceof Error ? error.message : String(error);
      }
    });
    expect(thrown).toEqual(malformed.map(() => problem));
  });

  it("reads a record whose path is one character", () => {
    expect(parseGrep("a\u00002\u0000t\nb\u000017\u0000u\n")).toEqual([finding("a", 2), finding("b", 17)]);
  });

  it("reads a last record without its newline", () => {
    expect(parseGrep("a.log\u00002\u0000t")).toEqual([finding("a.log", 2)]);
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
      verdict({ tracked: 2, code: 128, stdout: "", stderr: "\n  \nfatal: after blank lines\n" }),
      verdict({ tracked: 2, code: 3, stdout: "", stderr: "" }),
      verdict({ tracked: 2, code: null, stdout: "", stderr: "" }),
      verdict({ tracked: 2, code: 0, stdout: "", stderr: "" }),
    ]).toEqual([
      { exit: 2, cause: "sandbox-paths: could not run: git grep failed (exit 128): fatal: bad pathspec" },
      { exit: 2, cause: "sandbox-paths: could not run: git grep failed (exit 128): fatal: after blank lines" },
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
