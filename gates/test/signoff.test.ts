import { describe, expect, it } from "vitest";
import { checkCommits, logFormat, parseLog, rootCommit, signoff } from "../bin/signoff.ts";
import type { CommitRecord, SignoffTools } from "../bin/signoff.ts";
import type { Context, Io } from "../lib/cli.ts";
import type { Finding } from "../lib/findings.ts";
import type { ToolRun } from "../lib/spawn.ts";

// The sign-off gate's decision (FR-023, research.md R-13): every commit of the range needs a Signed-off-by line equal
// to its author; merge commits are exempt, and so is the repository's root commit, only by its full hash and only
// with no parent. Identities are invented, on reserved domains (FR-034).
const ada = "Ada Example <ada@example.com>";
const bob = "Bob Example <bob@example.org>";
const agent = "Agent Example <agent@example.net>";
const hash = (digit: string): string => digit.repeat(40);

function commit(fields: Partial<CommitRecord> & { readonly hash: string }): CommitRecord {
  return { parents: [hash("0")], author: ada, message: `Change\n\nSigned-off-by: ${ada}\n`, ...fields };
}

function noSignoff(sha: string, author: string): Finding {
  return {
    location: { commit: sha },
    gate: "signoff",
    rule: "no-signoff",
    message: `no Signed-off-by line for the author ${author}; sign off with git commit -s (FR-023)`,
  };
}

function mismatch(sha: string, signer: string, author: string): Finding {
  return {
    location: { commit: sha },
    gate: "signoff",
    rule: "signoff-mismatch",
    message: `Signed-off-by ${signer} does not match the author ${author} (FR-023)`,
  };
}

describe("parseLog", () => {
  it("reads git log's records: hash, parents, author and the full message", () => {
    expect(logFormat).toBe("%H%x1f%P%x1f%an <%ae>%x1f%B%x1e");
    const text =
      `${hash("a")}\x1f${hash("0")}\x1f${ada}\x1fAdd a\n\nSigned-off-by: ${ada}\n\x1e\n` +
      `${hash("b")}\x1f${hash("a")} ${hash("c")}\x1f${bob}\x1fMerge c\n\x1e\n` +
      `${hash("d")}\x1f\x1f${agent}\x1fRoot\n\x1e\n`;
    expect(parseLog(text)).toEqual([
      { hash: hash("a"), parents: [hash("0")], author: ada, message: `Add a\n\nSigned-off-by: ${ada}\n` },
      { hash: hash("b"), parents: [hash("a"), hash("c")], author: bob, message: "Merge c\n" },
      { hash: hash("d"), parents: [], author: agent, message: "Root\n" },
    ]);
  });

  it("reads no record from empty output", () => {
    expect([parseLog(""), parseLog("\n"), parseLog(`${hash("a")}\x1f\x1f${ada}\x1fm\n\x1e\n`).length]).toEqual([[], [], 1]);
  });
});

describe("checkCommits", () => {
  // Each accepted commit is checked beside a control commit without a sign-off, which alone is reported.
  const control = (): CommitRecord => commit({ hash: hash("9"), message: "Control\n" });
  const onlyControl = [noSignoff(hash("9"), ada)];

  it("passes a commit signed off by its author, among other trailers", () => {
    const message = `Change\n\nCo-Authored-By: ${bob}\nSigned-off-by: ${bob}\nSigned-off-by: ${ada}\n`;
    expect(checkCommits([commit({ hash: hash("a"), message }), control()])).toEqual(onlyControl);
  });

  it("passes an agent author that signs off itself", () => {
    expect(checkCommits([commit({ hash: hash("a"), author: agent, message: `x\n\nSigned-off-by: ${agent}` }), control()])).toEqual(onlyControl);
  });

  it("accepts the trailer key in any case and spaces around the identity", () => {
    expect(checkCommits([commit({ hash: hash("a"), message: `x\n\nsigned-off-by:   ${ada}  \n` }), control()])).toEqual(onlyControl);
  });

  it("reports a commit without a Signed-off-by line", () => {
    expect(checkCommits([commit({ hash: hash("a"), message: "Change\n" })])).toEqual([noSignoff(hash("a"), ada)]);
  });

  it("reports a commit whose Signed-off-by lines name someone else, naming the first", () => {
    const message = `Change\n\nSigned-off-by: ${bob}\nSigned-off-by: ${agent}\n`;
    expect(checkCommits([commit({ hash: hash("a"), message })])).toEqual([mismatch(hash("a"), bob, ada)]);
  });

  it("does not take a Signed-off-by mentioned inside a line as a sign-off", () => {
    expect(checkCommits([commit({ hash: hash("a"), message: `Explain the Signed-off-by: ${ada} rule\n` })])).toEqual([
      noSignoff(hash("a"), ada),
    ]);
  });

  it("does not take a matching name with another address as a sign-off", () => {
    const message = "x\n\nSigned-off-by: Ada Example <ada@example.org>\n";
    expect(checkCommits([commit({ hash: hash("a"), message })])).toEqual([
      mismatch(hash("a"), "Ada Example <ada@example.org>", ada),
    ]);
  });

  it("skips merge commits", () => {
    expect(checkCommits([commit({ hash: hash("a"), parents: [hash("b"), hash("c")], message: "Merge\n" }), control()])).toEqual(onlyControl);
  });

  it("skips the repository's root commit by its full hash when it has no parent", () => {
    expect(rootCommit).toBe("d08d4133bf0034e3d1ff29cddf2b0f13ca63290a");
    expect(checkCommits([commit({ hash: rootCommit, parents: [], message: "Initial commit\n" }), control()])).toEqual(onlyControl);
  });

  it("checks the root commit's hash when it has a parent, and another hash starting d08d413", () => {
    const other = "d08d413ffffffffffffffffffffffffffffffff0";
    const records = [
      commit({ hash: rootCommit, parents: [hash("1")], message: "x\n" }),
      commit({ hash: other, parents: [], message: "x\n" }),
      commit({ hash: hash("e"), parents: [], message: "x\n" }),
    ];
    expect(checkCommits(records)).toEqual([noSignoff(rootCommit, ada), noSignoff(other, ada), noSignoff(hash("e"), ada)]);
  });
});

describe("signoff (the gate, with a git double)", () => {
  const range = `${hash("0")}..${hash("f")}`;
  const good = `${hash("a")}\x1f${hash("0")}\x1f${ada}\x1fA\n\nSigned-off-by: ${ada}\n\x1e\n`;
  const merge = `${hash("b")}\x1f${hash("a")} ${hash("c")}\x1f${bob}\x1fMerge\n\x1e\n`;
  const bad = `${hash("c")}\x1f${hash("0")}\x1f${bob}\x1fB\n\x1e\n`;

  function run(args: readonly string[], log: ToolRun): { code: Promise<number>; out: string[]; err: string[] } {
    const out: string[] = [];
    const err: string[] = [];
    const io: Io = { cwd: "/work/repo", env: {}, out: (l) => out.push(l), err: (l) => err.push(l) };
    const context: Context = { root: "/work/repo", toolCwd: "/work/repo", args };
    const tools: SignoffTools = {
      git: (gitArgs) =>
        Promise.resolve(
          gitArgs.join(" ") === `log --format=${logFormat} ${range}`
            ? log
            : { exitCode: 128, stdout: "", stderr: `fatal: unexpected git ${gitArgs.join(" ")}\n` },
        ),
    };
    return { code: signoff(context, tools, io), out, err };
  }

  it("exits 0 naming the number of commits checked", async () => {
    const ran = run(["--", "--range", range], { exitCode: 0, stdout: good + merge, stderr: "" });
    expect({ code: await ran.code, out: ran.out, err: ran.err }).toEqual({
      code: 0,
      out: ["signoff: 2 commits checked, no finding"],
      err: [],
    });
  });

  it("exits 1 with one finding per commit, naming the commit by its full hash", async () => {
    const ran = run(["--range", range], { exitCode: 0, stdout: good + bad, stderr: "" });
    expect({ code: await ran.code, out: ran.out, err: ran.err }).toEqual({
      code: 1,
      out: [
        `${hash("c")}: signoff: no-signoff: no Signed-off-by line for the author ${bob}; sign off with git commit -s (FR-023)`,
        "signoff: 1 finding in 2 commits",
      ],
      err: [],
    });
  });

  it("exits 2 when the range does not resolve", async () => {
    const ran = run(["--range", range], { exitCode: 128, stdout: "", stderr: `fatal: bad revision '${range}'\n` });
    expect({ code: await ran.code, out: ran.out, err: ran.err }).toEqual({
      code: 2,
      out: [],
      err: [
        `signoff: could not run: --range ${range} does not resolve (fatal: bad revision '${range}'); ` +
          "pass existing commits (in CI, check out with fetch-depth: 0)",
      ],
    });
  });

  it("exits 2 when the range holds no commit", async () => {
    const ran = run(["--range", range], { exitCode: 0, stdout: "", stderr: "" });
    expect({ code: await ran.code, out: ran.out, err: ran.err }).toEqual({
      code: 2,
      out: [],
      err: [`signoff: could not run: --range ${range} holds no commit; pass the pull request's <base>..<head>`],
    });
  });

  it.each([
    { args: [], problem: "--range <base>..<head> is required" },
    { args: ["--range"], problem: "--range needs a value" },
    { args: ["--range", ""], problem: "--range needs a value" },
    { args: ["--base", "x"], problem: "unknown argument --base" },
  ])("exits 2 on the arguments $args", async ({ args, problem }) => {
    const ran = run(args, { exitCode: 0, stdout: good, stderr: "" });
    expect({ code: await ran.code, out: ran.out, err: ran.err }).toEqual({
      code: 2,
      out: [],
      err: [`signoff: could not run: ${problem}; usage: gate:signoff -- --range <base>..<head>`],
    });
  });
});
