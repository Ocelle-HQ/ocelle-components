import { describe, expect, it } from "vitest";
import { checkCommits, logFormat, parseLog, signoff } from "../bin/signoff.ts";
import type { Context, Io } from "../lib/cli.ts";

// The sign-off gate at the edges (FR-023, research.md R-13; phase 4 review round 1, R1-08): git log records with the
// newline git puts after each record separator, records with missing fields, a sign-off line followed by more text on
// the next line, and git's error output with a leading blank line.
const hash = (c: string): string => c.repeat(40);
const ada = "Ada Example <ada@example.com>";

describe("parseLog: record edges", () => {
  it("drops only the one newline after a record separator, keeping a message's leading blank lines", () => {
    const text = `${hash("a")}\x1f\x1f${ada}\x1fA\n\x1e\n\n${hash("b")}\x1f\x1f${ada}\x1f\nB\n\x1e`;
    expect(parseLog(text)).toEqual([
      { hash: hash("a"), parents: [], author: ada, message: "A\n" },
      { hash: `\n${hash("b")}`, parents: [], author: ada, message: "\nB\n" },
    ]);
  });

  it("reads missing fields as empty", () => {
    expect(parseLog(`${hash("a")}\x1e${hash("b")}\x1f${hash("a")}\x1e`)).toEqual([
      { hash: hash("a"), parents: [], author: "", message: "" },
      { hash: hash("b"), parents: [hash("a")], author: "", message: "" },
    ]);
  });

  it("splits parents at single spaces and drops empty ones", () => {
    expect(parseLog(`${hash("a")}\x1f ${hash("b")}  ${hash("c")} \x1f${ada}\x1fm\x1e`)[0]?.parents).toEqual([hash("b"), hash("c")]);
  });
});

describe("checkCommits: a sign-off line ends at its line", () => {
  it("takes the identity up to the end of the line, not the text of the next line", () => {
    expect(checkCommits([{ hash: hash("a"), parents: [hash("0")], author: ada, message: `x\n\nSigned-off-by: ${ada}\nReviewed-by: B <b@example.com>\n` }])).toEqual([]);
  });
});

describe("signoff: git's error output", () => {
  it("names the first non-blank line of git's error output", async () => {
    const out: string[] = [];
    const err: string[] = [];
    const io: Io = { cwd: "/r", env: {}, out: (l) => out.push(l), err: (l) => err.push(l) };
    const context: Context = { root: "/r", toolCwd: "/r", args: ["--range", "a..b"] };
    const code = await signoff(context, { git: () => Promise.resolve({ exitCode: 128, stdout: "", stderr: "\n  fatal: bad revision 'a..b'\nmore\n" }) }, io);
    expect({ code, out, err }).toEqual({
      code: 2,
      out: [],
      err: ["signoff: could not run: --range a..b does not resolve (fatal: bad revision 'a..b'); pass existing commits (in CI, check out with fetch-depth: 0)"],
    });
    expect(logFormat).toBe("%H%x1f%P%x1f%an <%ae>%x1f%B%x1e");
  });
});
