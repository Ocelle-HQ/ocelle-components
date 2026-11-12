import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { baseEnv, cleanUp, repo, runGate, tempDir } from "./workspace.ts";

// `gates/bin/mutation.ts --root <tmp> --base <first commit>` on a temporary git repository built from
// gates/test/fixtures/mutation-repo/ (a first commit with base/ and the repository's stryker.config.json and
// vitest.mutation.config.ts, with the configuration they load, a second commit with head/; node_modules linked), run
// from a different working directory (research.md R-08). The change adds `triple` to gates/lib/sample.ts, which only
// a test under the fixture's gates/test/integration/ runs, and `decrement` to gates/lib/other.ts, which an in-process
// test checks. The fixture gates/test/fixtures/mutation-uncovered/ changes only packages/tokens/src/y.ts, a new
// file no test imports, beside an unchanged, tested x.ts (FR-011: a mutant on a line no test runs survives). The fixture
// gates/test/fixtures/mutation-split/ adds lines 5 to 12 to gates/lib/split.ts: `untested` (lines 6 to 8), which no
// test runs, and `tested` (lines 10 to 12), which an in-process test checks (phase 3 round 9, O9-01: an entry
// `path:start-end` limits the run to the changed lines inside it). The fixture gates/test/fixtures/mutation-unread/ is
// mutation-uncovered's base with a head that adds packages/tokens/src/.next/y.ts, which Stryker 10.1.1 never reads
// (phase 3 round 12, O12-01: the gate exits 2 naming the entry, not 0 with "0 mutants"). Each test first asserts that both configuration files exist: the green commit creates them, so at the
// red commit the test fails on that assertion.
const timeout = 300_000;
const configs = ["stryker.config.json", "vitest.mutation.config.ts", "vitest.config.ts", "tsconfig.json", "tsconfig.base.json"];
const identity = ["-c", "user.name=Fixture Author", "-c", "user.email=fixture@example.com", "-c", "commit.gpgsign=false"];

function git(dir: string, args: readonly string[]): string {
  return execFileSync("git", [...identity, ...args], { cwd: dir, env: baseEnv(), encoding: "utf8" }).trim();
}

function mutationRepo(name = "mutation-repo"): { readonly root: string; readonly base: string } {
  const root = tempDir("mutation-repo");
  const fixture = join(repo, "gates/test/fixtures", name);
  cpSync(join(fixture, "base"), root, { recursive: true });
  for (const file of configs) cpSync(join(repo, file), join(root, file));
  writeFileSync(join(root, ".gitignore"), "node_modules\nreports/\n.stryker-tmp/\n");
  git(root, ["init", "-q", "-b", "main"]);
  git(root, ["add", "-A"]);
  git(root, ["commit", "-q", "-m", "base"]);
  const base = git(root, ["rev-parse", "HEAD"]);
  cpSync(join(fixture, "head"), root, { recursive: true });
  git(root, ["add", "-A"]);
  git(root, ["commit", "-q", "-m", "head"]);
  symlinkSync(join(repo, "node_modules"), join(root, "node_modules"), "dir");
  return { root, base };
}

function configsExist(): boolean[] {
  return ["stryker.config.json", "vitest.mutation.config.ts"].map((file) => existsSync(join(repo, file)));
}

afterEach(cleanUp);

describe("mutation gate (gates/bin/mutation.ts)", () => {
  it(
    "reports a mutant on a changed line that only a gates-integration test covers as a NoCoverage finding (exit 1)",
    async () => {
      expect(configsExist()).toEqual([true, true]);
      const { root, base } = mutationRepo();
      const ran = await runGate("gates/bin/mutation.ts", ["--root", root, "--base", base], {
        cwd: tempDir("cwd"),
        env: baseEnv(),
      });
      expect(ran.code).toBe(1);
      expect(ran.stderr).toEqual([]);
      // 007: the type checker rejects the BlockStatement mutant of each changed function, so each is a compile-error
      // report line, printed before the findings and not one of them.
      const reports = [
        "gates/lib/other.ts:6: mutation: compile-error: BlockStatement: replaced by {}",
        "gates/lib/sample.ts:6: mutation: compile-error: BlockStatement: replaced by {}",
      ];
      expect(ran.stdout.slice(0, reports.length)).toEqual(reports);
      const findings = ran.stdout.slice(reports.length, -1);
      expect(findings).toContain("gates/lib/sample.ts:7: mutation: ArithmeticOperator: NoCoverage: replaced by value / 3");
      expect(findings.filter((line) => !/^gates\/lib\/sample\.ts:[5-8]: mutation: \w+: NoCoverage: /.test(line))).toEqual([]);
      expect(ran.stdout.at(-1)).toMatch(/^mutation: \d+ findings? in 2 changed files \(\d+ mutants on changed lines; 0 timeouts, 2 compile errors, 0 zero-mutant entries\)$/);
    },
    timeout,
  );

  it(
    "reports a change only to source no test imports as a located NoCoverage finding (exit 1), not as could not run (review round 1, R1-10)",
    async () => {
      expect(configsExist()).toEqual([true, true]);
      const { root, base } = mutationRepo("mutation-uncovered");
      const ran = await runGate("gates/bin/mutation.ts", ["--root", root, "--base", base], {
        cwd: tempDir("cwd"),
        env: baseEnv(),
      });
      expect({ code: ran.code, stdout: ran.stdout, stderr: ran.stderr }).toEqual({
        code: 1,
        stdout: [
          'packages/tokens/src/y.ts:2: mutation: StringLiteral: NoCoverage: replaced by ""',
          "mutation: 1 finding in 1 changed file (1 mutant on changed lines; 0 timeouts, 0 compile errors, 0 zero-mutant entries)",
        ],
        stderr: [],
      });
    },
    timeout,
  );

  it(
    "exits 2 naming a changed file under a .next folder, which Stryker does not read (phase 3 round 12, O12-01)",
    async () => {
      expect(configsExist()).toEqual([true, true]);
      const { root, base } = mutationRepo("mutation-unread");
      const ran = await runGate("gates/bin/mutation.ts", ["--root", root, "--base", base], {
        cwd: tempDir("cwd"),
        env: baseEnv(),
      });
      expect({ code: ran.code, stdout: ran.stdout, stderr: ran.stderr }).toEqual({
        code: 2,
        stdout: [],
        stderr: [
          "mutation: could not run: Stryker did not read these mutate entries (it skips every file under a folder " +
            "named node_modules, .git, .next, .nuxt, .svelte-kit or .stryker-tmp, in any case): " +
            "packages/tokens/src/.next/y.ts:1-2; move the files out of such a folder",
        ],
      });
    },
    timeout,
  );

  it(
    "--files mutates only the listed file",
    async () => {
      expect(configsExist()).toEqual([true, true]);
      const { root, base } = mutationRepo();
      const ran = await runGate("gates/bin/mutation.ts", ["--root", root, "--base", base, "--files", "gates/lib/other.ts"], {
        cwd: tempDir("cwd"),
        env: baseEnv(),
      });
      expect({ code: ran.code, stderr: ran.stderr, lines: ran.stdout.length }).toEqual({ code: 0, stderr: [], lines: 2 });
      // 007: the type checker rejects the BlockStatement mutant of the changed function, a compile-error report line.
      expect(ran.stdout[0]).toBe("gates/lib/other.ts:6: mutation: compile-error: BlockStatement: replaced by {}");
      expect(ran.stdout[1]).toMatch(
        /^mutation: \d+ mutants? on the changed lines of 1 file, none survived; 0 timeouts, 1 compile error, 0 zero-mutant entries; 0 equivalent records$/,
      );
    },
    timeout,
  );

  it(
    "--files with an entry path:start-end mutates only the changed lines inside it (phase 3 round 9, O9-01)",
    async () => {
      expect(configsExist()).toEqual([true, true]);
      const { root, base } = mutationRepo("mutation-split");
      const ran = await runGate("gates/bin/mutation.ts", ["--root", root, "--base", base, "--files", "gates/lib/split.ts:10-12"], {
        cwd: tempDir("cwd"),
        env: baseEnv(),
      });
      expect({ code: ran.code, stderr: ran.stderr, lines: ran.stdout.length }).toEqual({ code: 0, stderr: [], lines: 2 });
      // 007: the type checker rejects the BlockStatement mutant of `tested`, a compile-error report line.
      expect(ran.stdout[0]).toBe("gates/lib/split.ts:10: mutation: compile-error: BlockStatement: replaced by {}");
      expect(ran.stdout[1]).toMatch(
        /^mutation: [2-9] mutants on the changed lines of 1 file, none survived; 0 timeouts, 1 compile error, 0 zero-mutant entries; 0 equivalent records$/,
      );
      const report = JSON.parse(readFileSync(join(root, "reports/mutation/mutation.json"), "utf8")) as {
        files: Record<string, { mutants: { location: { start: { line: number }; end: { line: number } } }[] }>;
      };
      const lines = (report.files["gates/lib/split.ts"]?.mutants ?? []).map((mutant) => [mutant.location.start.line, mutant.location.end.line]);
      expect(lines.length).toBeGreaterThan(1);
      expect(lines.filter(([start = 0, end = 0]) => start < 10 || end > 12)).toEqual([]);
    },
    timeout,
  );

  it(
    "deletes an earlier run's report: a Stryker run that writes none exits 2 (review round 1, R1-01)",
    async () => {
      expect(configsExist()).toEqual([true, true]);
      const { root, base } = mutationRepo();
      const reportDir = join(root, "reports", "mutation");
      mkdirSync(reportDir, { recursive: true });
      writeFileSync(join(reportDir, "mutation.json"), JSON.stringify({ schemaVersion: "1.0", files: {} }));
      const config = JSON.parse(readFileSync(join(root, "stryker.config.json"), "utf8")) as Record<string, unknown>;
      writeFileSync(join(root, "stryker.config.json"), JSON.stringify({ ...config, testRunner: "nonexistent" }));
      const ran = await runGate("gates/bin/mutation.ts", ["--root", root, "--base", base, "--files", "gates/lib/other.ts"], {
        cwd: tempDir("cwd"),
        env: baseEnv(),
      });
      expect({ code: ran.code, stdout: ran.stdout, stderr: ran.stderr.length }).toEqual({ code: 2, stdout: [], stderr: 1 });
      expect(ran.stderr[0]).toMatch(/^mutation: could not run: Stryker wrote no report \(.*"nonexistent".*\); /);
    },
    timeout,
  );

  it(
    "exits 2 when --base does not resolve",
    async () => {
      expect(configsExist()).toEqual([true, true]);
      const { root } = mutationRepo();
      const missing = "0123456789abcdef0123456789abcdef01234567";
      const ran = await runGate("gates/bin/mutation.ts", ["--root", root, "--base", missing], {
        cwd: tempDir("cwd"),
        env: baseEnv(),
      });
      expect({ code: ran.code, stdout: ran.stdout, stderr: ran.stderr }).toEqual({
        code: 2,
        stdout: [],
        stderr: [
          `mutation: could not run: --base ${missing} does not resolve to a commit; pass an existing commit ` +
            "(in CI, check out with fetch-depth: 0)",
        ],
      });
    },
    timeout,
  );
});
