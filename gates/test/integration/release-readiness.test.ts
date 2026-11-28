import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { readGapInputs, scanHistory } from "../../bin/release-readiness.ts";
import { gapRowFindings, parseGapRows, parseGapTable } from "../../lib/gap-rows.ts";
import { baseEnv, cleanUp, repo, runGate, tempDir } from "./workspace.ts";

// 030 US2 (T023; FR-010, FR-011, FR-014; research.md R-07, R-08, PLAN-FRESH-2-004 (a); contracts/release-readiness-gate.md):
// the gap check with the committed gates/release/gap-rows.json against the inputs of commit 183b20f (the pre-018 main),
// the history scan of this repository's own HEAD, the gate on the branch, and the CLI's exit 2 causes. The two
// history-reading tests first assert a full clone in which 183b20f resolves, and fail (never skip) otherwise; CI checks
// out the unit-test shards with fetch-depth: 0 for them. No line of this file holds a credential-shaped value (FR-045).
const timeout = 120_000;
const before018 = "183b20f";
const script = "gates/bin/release-readiness.ts";

afterEach(cleanUp);

function git(dir: string, args: readonly string[]): string {
  return execFileSync("git", ["-c", "commit.gpgsign=false", ...args], { cwd: dir, env: baseEnv(), encoding: "utf8", maxBuffer: 1 << 28 }).trim();
}

/** A repository file's text, or "" while it does not exist, so each assertion reports what is missing. */
function read(path: string): string {
  return existsSync(join(repo, path)) ? readFileSync(join(repo, path), "utf8") : "";
}

/** The full-history precondition of R-07 and R-08: not a shallow clone, and 183b20f resolves to a commit. */
function history(): { readonly shallow: string; readonly old: string } {
  const old = spawnSync("git", ["cat-file", "-t", before018], { cwd: repo, encoding: "utf8" });
  return { shallow: git(repo, ["rev-parse", "--is-shallow-repository"]), old: old.status === 0 ? old.stdout.trim() : `${before018} does not resolve: ${old.stderr.trim()}` };
}

describe("the gap check against commit 183b20f, the main before mission 018 (research.md R-07)", () => {
  it(
    "reports exactly rows 6, 10 and 15 unmet, each naming the mission 018 element it expected, and every other row met",
    async () => {
      expect(history()).toEqual({ shallow: "false", old: "commit" });
      const into = tempDir("readiness-183b20f");
      const archive = execFileSync("git", ["archive", before018, "--", "packages/elements/custom-elements.json", "packages/tokens/src/source.ts", "packages/styles/src", ":(glob)specs/*/verification.md"], { cwd: repo, maxBuffer: 1 << 28 });
      execFileSync("tar", ["-x", "-C", into], { input: archive });
      const inputs = await readGapInputs(into);
      const { findings, met } = gapRowFindings(parseGapRows(read("gates/release/gap-rows.json")), parseGapTable(read("specs/030-release-v1/sources/issue-1-gap-table.md")), inputs);
      const unmet = findings.map(({ rule, message }) => ({ rule, row: /^row (\d+) /.exec(message)?.[1], message }));
      expect({ rows: unmet.map(({ rule, row }) => `${rule} ${String(row)}`), met }).toEqual({
        rows: ["gap-row-unmet 6", "gap-row-unmet 10", "gap-row-unmet 15"],
        met: 14,
      });
      expect(unmet.map(({ message }) => message)).toEqual([
        expect.stringMatching(/^row 6 \(#498 #510 #517 #520 #523 #533 #280\): missing .*element ocelle-status-indicator/),
        expect.stringMatching(/^row 10 \(#509\): missing .*element ocelle-metric/),
        expect.stringMatching(/^row 15 \(#524 #526\): missing .*element ocelle-pill-tag/),
      ]);
    },
    timeout,
  );
});

describe("the history scan of this repository's own HEAD (research.md R-08, FR-045)", () => {
  it(
    "reads every commit reachable from HEAD and finds no hit",
    async () => {
      expect(history()).toEqual({ shallow: "false", old: "commit" });
      const { commits, hits } = await scanHistory(repo);
      expect({ commits, hits }).toEqual({ commits: Number(git(repo, ["rev-list", "--count", "HEAD"])), hits: [] });
    },
    timeout,
  );
});

describe("pnpm run gate:release-readiness on the branch (FR-014)", () => {
  it(
    "exits 0 with ready (17/17 rows, 0 secrets, version <v>), <v> the version of packages/tokens/package.json",
    () => {
      const version = (JSON.parse(read("packages/tokens/package.json")) as { version: string }).version;
      const ran = spawnSync("pnpm", ["run", "--silent", "gate:release-readiness"], { cwd: repo, env: baseEnv(), encoding: "utf8", maxBuffer: 1 << 26 });
      expect({ code: ran.status, last: ran.stdout.trim().split("\n").at(-1), stderr: ran.stderr.trim() }).toEqual({
        code: 0,
        last: `release-readiness: ready (17/17 rows, 0 secrets, version ${version})`,
        stderr: "",
      });
    },
    timeout,
  );
});

/** A new git repository with one commit of the given files, and a second commit, so a depth-1 clone is shallow. */
function smallRepo(files: Readonly<Record<string, string>>): string {
  const dir = tempDir("readiness-small");
  git(dir, ["init", "-q", "-b", "main"]);
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), text);
  }
  const identity = ["-c", "user.name=Plant Base", "-c", "user.email=base@example.com"];
  git(dir, [...identity, "add", "-A"]);
  git(dir, [...identity, "commit", "-q", "--allow-empty", "-m", "one"]);
  git(dir, [...identity, "commit", "-q", "--allow-empty", "-m", "two"]);
  return dir;
}

describe("gates/bin/release-readiness.ts: exit 2 (contracts/release-readiness-gate.md)", () => {
  it(
    "exits 2 for a shallow clone: the history scan needs the whole history",
    async () => {
      const source = smallRepo({ "a.txt": "a\n" });
      const shallow = tempDir("readiness-shallow");
      git(shallow, ["clone", "-q", "--depth", "1", `file://${source}`, "."]);
      const ran = await runGate(script, ["--root", shallow], { cwd: repo, env: baseEnv() });
      expect({ code: ran.code, stdout: ran.stdout, stderr: ran.stderr }).toEqual({
        code: 2,
        stdout: [],
        stderr: ["release-readiness: could not run: the clone is shallow; the history scan needs the whole history (check out with fetch-depth: 0)"],
      });
    },
    timeout,
  );

  it(
    "exits 2 for a root that is not the top of a git work tree",
    async () => {
      const outside = tempDir("readiness-outside");
      const ran = await runGate(script, ["--root", outside], { cwd: repo, env: baseEnv() });
      expect({ code: ran.code, stderr: ran.stderr }).toEqual({ code: 2, stderr: ["release-readiness: could not run: the root is not the top of a git work tree"] });
    },
    timeout,
  );

  it(
    "exits 2 naming a missing gap-rows.json, and an invalid one with its problem",
    async () => {
      const missing = smallRepo({ "a.txt": "a\n" });
      const invalid = smallRepo({ "gates/release/gap-rows.json": "{}\n" });
      const [absent, broken] = await Promise.all([missing, invalid].map((root) => runGate(script, ["--root", root], { cwd: repo, env: baseEnv() })));
      expect({ absent: [absent?.code, absent?.stderr], broken: [broken?.code, broken?.stderr] }).toEqual({
        absent: [2, ["release-readiness: could not run: gates/release/gap-rows.json is missing"]],
        broken: [2, ["release-readiness: could not run: gates/release/gap-rows.json is invalid: gap-rows.json is not a list of rows"]],
      });
    },
    timeout,
  );

  it(
    "exits 2 for --tag without a value",
    async () => {
      const ran = await runGate(script, ["--root", repo, "--tag"], { cwd: repo, env: baseEnv() });
      expect({ code: ran.code, stderr: ran.stderr }).toEqual({ code: 2, stderr: ["release-readiness: could not run: --tag needs a tag"] });
    },
    timeout,
  );
});
