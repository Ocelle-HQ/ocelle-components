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
// test checks. Each test first asserts that both configuration files exist: the green commit creates them, so at the
// red commit the test fails on that assertion.
const timeout = 300_000;
const configs = ["stryker.config.json", "vitest.mutation.config.ts", "vitest.config.ts", "tsconfig.json", "tsconfig.base.json"];
const identity = ["-c", "user.name=Fixture Author", "-c", "user.email=fixture@example.com", "-c", "commit.gpgsign=false"];

function git(dir: string, args: readonly string[]): string {
  return execFileSync("git", [...identity, ...args], { cwd: dir, env: baseEnv(), encoding: "utf8" }).trim();
}

function mutationRepo(): { readonly root: string; readonly base: string } {
  const root = tempDir("mutation-repo");
  const fixture = join(repo, "gates/test/fixtures/mutation-repo");
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
      const findings = ran.stdout.slice(0, -1);
      expect(findings).toContain("gates/lib/sample.ts:7: mutation: ArithmeticOperator: NoCoverage: replaced by value / 3");
      expect(findings.filter((line) => !/^gates\/lib\/sample\.ts:[5-8]: mutation: \w+: NoCoverage: /.test(line))).toEqual([]);
      expect(ran.stdout.at(-1)).toMatch(/^mutation: \d+ findings? in 2 changed files \(\d+ mutants on changed lines\)$/);
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
      expect({ code: ran.code, stderr: ran.stderr, lines: ran.stdout.length }).toEqual({ code: 0, stderr: [], lines: 1 });
      expect(ran.stdout[0]).toMatch(
        /^mutation: \d+ mutants? on the changed lines of 1 file, none survived; 0 equivalent records$/,
      );
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
