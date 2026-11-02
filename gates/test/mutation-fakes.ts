// Test doubles for the in-process tests of the mutation gate (gates/bin/mutation.ts): a git that answers the gate's
// two calls the way git does for one known base commit, a Stryker that mutates exactly the `mutate` entries it is
// given, and captured output. The tests assert the gate's exit code and output, never the doubles.
import type { MutationTools, ToolRun } from "../bin/mutation.ts";
import type { Context, Io } from "../lib/cli.ts";
import type { StrykerRun } from "../lib/mutation/report.ts";

export const root = "/work/repo";
export const base = "4ac76fd7fb68ba7c8f15b4bc4177e64b518d56c8";

/** FR-028's package source TypeScript and gate source as pathspecs (research.md R-08 step 2). */
export const scope = [
  ":(glob)packages/*/**/*.ts",
  ":(glob)gates/bin/**/*.ts",
  ":(glob)gates/lib/**/*.ts",
  ":(glob)gates/eslint/**/*.ts",
  ":(glob)gates/stylelint/**/*.ts",
  ":(exclude,glob)**/*.test.ts",
  ":(exclude,glob)**/*.spec.ts",
  ":(exclude,glob)**/test/**",
  ":(exclude,glob)**/*.stories.ts",
  ":(exclude,glob)**/*.d.ts",
  ":(exclude,glob)packages/*/dist/**",
];

export function context(args: readonly string[]): Context {
  return { root, toolCwd: root, args };
}

export interface Captured {
  readonly io: Io;
  readonly out: string[];
  readonly err: string[];
}

export function capture(): Captured {
  const out: string[] = [];
  const err: string[] = [];
  const io: Io = { cwd: root, env: {}, out: (line) => out.push(line), err: (line) => err.push(line) };
  return { io, out, err };
}

function ran(exitCode: number, stdout: string, stderr = ""): Promise<ToolRun> {
  return Promise.resolve({ exitCode, stdout, stderr });
}

/**
 * git with one commit, `base`: `rev-parse --verify --quiet <base>^{commit}` prints it, any other revision exits 1
 * silently (as git does with --quiet); `diff --unified=0 --no-color --no-ext-diff <base> -- <scope>` prints `diff`;
 * any other call fails as an unknown git invocation would.
 */
export function fakeGit(diff: string, diffFailure?: string): MutationTools["git"] {
  return (args) => {
    const call = args.join(" ");
    if (call === `rev-parse --verify --quiet ${base}^{commit}`) return ran(0, `${base}\n`);
    if (args[0] === "rev-parse" && args.length === 4 && args[1] === "--verify" && args[2] === "--quiet") return ran(1, "");
    if (call === ["diff", "--unified=0", "--no-color", "--no-ext-diff", base, "--", ...scope].join(" ")) {
      return diffFailure === undefined ? ran(0, diff) : ran(128, "", diffFailure);
    }
    return ran(129, "", `fatal: unexpected git call: git ${call}`);
  };
}

/** Repository files by path; any other path cannot be read. */
export function fakeRead(files: Readonly<Record<string, string>>): MutationTools["read"] {
  return (path) => Promise.resolve(files[path]);
}

/** A Stryker that must not run: the gate decided without it. */
export const noStryker: MutationTools["stryker"] = () => Promise.reject(new Error("Stryker must not run here"));

/**
 * A Stryker that mutates exactly the `mutate` entries `path:start-end` it is given: one mutant at the first line of
 * each entry, with the status `statusOf(path)`, in a JSON report like Stryker's.
 */
export function fakeStryker(statusOf: (path: string) => string): MutationTools["stryker"] {
  return (mutate) => {
    const files: Record<string, { mutants: object[] }> = {};
    mutate.forEach((entry, index) => {
      const match = /^(.*):(\d+)-(\d+)$/.exec(entry);
      if (match === null) throw new Error(`not a mutate range: ${entry}`);
      const [, path = "", start = "0"] = match;
      const line = Number(start);
      const file = (files[path] ??= { mutants: [] });
      file.mutants.push({
        id: String(index),
        mutatorName: "ConditionalExpression",
        replacement: "true",
        status: statusOf(path),
        location: { start: { line, column: 3 }, end: { line, column: 9 } },
      });
    });
    const run: StrykerRun = { report: JSON.stringify({ schemaVersion: "1.0", files }), exitCode: 0, output: "" };
    return Promise.resolve(run);
  };
}

/** A `git diff --unified=0` of new files, each with `lines` added lines. */
export function newFilesDiff(files: Readonly<Record<string, number>>): string {
  return Object.entries(files)
    .map(([path, lines]) =>
      [
        `diff --git a/${path} b/${path}`,
        "new file mode 100644",
        "index 0000000..1111111",
        "--- /dev/null",
        `+++ b/${path}`,
        `@@ -0,0 +1,${String(lines)} @@`,
        ...Array.from({ length: lines }, (_, i) => `+export const v${String(i)} = ${String(i)};`),
      ].join("\n"),
    )
    .join("\n")
    .concat("\n");
}
