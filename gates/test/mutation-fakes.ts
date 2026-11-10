// Test doubles for the in-process tests of the mutation gate (gates/bin/mutation.ts): a git that answers the gate's
// two calls the way git does for one known base commit, a repository of files in memory that the gate reads and
// deletes in, a Stryker that mutates exactly the `mutate` entries it is given and writes its JSON report into that
// repository (or, like Stryker 10.1.1, skips an entry under a folder it always ignores and logs the warning it logs
// for it), and captured output. The tests assert the gate's exit code and output, never the doubles.
import { readFileSync } from "node:fs";
import type { MutationTools, ToolRun } from "../bin/mutation.ts";
import type { Context, Io } from "../lib/cli.ts";

export const root = "/work/repo";
export const base = "4ac76fd7fb68ba7c8f15b4bc4177e64b518d56c8";

/** FR-028's package source TypeScript and gate source as pathspecs (research.md R-08 step 2). */
export const scope = [
  ":(glob)packages/*/**/*.ts",
  ":(glob)gates/bin/**/*.ts",
  ":(glob)gates/lib/**/*.ts",
  ":(glob)gates/eslint/**/*.ts",
  ":(glob)gates/stylelint/**/*.ts",
  ":(glob)storybook/scripts/**/*.ts",
  ":(glob)storybook/.storybook/**/*.ts",
  ":(glob)storybook/stories/**/*.ts",
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

/** Where Stryker writes its JSON report, as stryker.config.json names it (`jsonReporter.fileName`). */
export const reportPath = "reports/mutation/mutation.json";

/**
 * A Stryker run of the doubles: it may write files into the repository, and returns Stryker's exit code and output.
 * `config` is the Stryker configuration file the gate runs it with (005 research.md R-12).
 */
export type FakeStryker = (mutate: readonly string[], files: Map<string, string>, config?: string) => ToolRun;

/** A Stryker that must not run: the gate decided without it. */
export const noStryker: FakeStryker = () => {
  throw new Error("Stryker must not run here");
};

/**
 * A repository with these files by path (any other path cannot be read), in which the gate deletes files and
 * `stryker` runs.
 */
export function fakeRepo(
  files: Readonly<Record<string, string>>,
  stryker: FakeStryker = noStryker,
): Pick<MutationTools, "read" | "remove" | "stryker"> {
  const tree = new Map(Object.entries(files));
  return {
    read: (path) => Promise.resolve(tree.get(path)),
    remove: (path) => {
      tree.delete(path);
      return Promise.resolve();
    },
    stryker: (mutate, config) => Promise.resolve().then(() => stryker(mutate, tree, config)),
  };
}

/** A Stryker JSON report with these mutants by path. */
export function strykerReport(files: Readonly<Record<string, readonly object[]>>): string {
  const entries = Object.entries(files).map(([path, mutants]): [string, { mutants: readonly object[] }] => [path, { mutants }]);
  return JSON.stringify({ schemaVersion: "1.0", files: Object.fromEntries(entries) });
}

/** One mutant at `line` with this status, as Stryker reports it. */
export function mutant(id: string, line: number, status: string): object {
  return {
    id,
    mutatorName: "ConditionalExpression",
    replacement: "true",
    status,
    location: { start: { line, column: 3 }, end: { line, column: 9 } },
  };
}

/**
 * A Stryker that mutates exactly the `mutate` entries `path:start-end` it is given (any path, line terminators too): one mutant at the first line of
 * each entry, with the status `statusOf(path)`, in a JSON report like Stryker's at `reportPath`; it exits 0.
 */
export function fakeStryker(statusOf: (path: string) => string): FakeStryker {
  return (mutate, files) => {
    const mutants: Record<string, object[]> = {};
    mutate.forEach((entry, index) => {
      const match = /^(.*):(\d+)-(\d+)$/s.exec(entry);
      if (match === null) throw new Error(`not a mutate range: ${entry}`);
      const [, path = "", start = "0"] = match;
      (mutants[path] ??= []).push(mutant(String(index), Number(start), statusOf(path)));
    });
    files.set(reportPath, strykerReport(mutants));
    return { exitCode: 0, stdout: "", stderr: "" };
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

/** A fixture of gates/test/fixtures/stryker/ (recorded Stryker output and reports). */
export function strykerFixture(name: string): string {
  return readFileSync(new URL(`fixtures/stryker/${name}`, import.meta.url), "utf8");
}

/**
 * The warning line of a real Stryker 10.1.1 run (gates/test/fixtures/stryker/unread-pattern.output.txt) for a
 * `mutate` entry it did not read, with the recorded entry replaced by `entry`.
 */
export function unreadWarning(entry: string): string {
  const recorded = strykerFixture("unread-pattern.output.txt")
    .split("\n")
    .find((line) => line.includes("did not result in any files."));
  if (recorded === undefined) throw new Error("unread-pattern.output.txt holds no unread warning");
  return recorded.replace("packages/tokens/src/.next/y.ts:1-2", entry);
}

/** The folders Stryker 10.1.1 never reads a file under (`ALWAYS_IGNORE` and `tempDirName`), in any case. */
const skippedFolders = ["node_modules", ".git", ".next", ".nuxt", ".svelte-kit", ".stryker-tmp"];

/**
 * `fakeStryker`, except that, as Stryker 10.1.1 does, an entry whose path has a folder Stryker never reads gets no
 * mutant and its warning on stdout instead.
 */
export function skippingStryker(statusOf: (path: string) => string): FakeStryker {
  const stryker = fakeStryker(statusOf);
  return (mutate, files) => {
    const skipped = (entry: string): boolean =>
      entry.split("/").slice(0, -1).some((folder) => skippedFolders.includes(folder.toLowerCase()));
    stryker(mutate.filter((entry) => !skipped(entry)), files);
    const stdout = mutate.filter(skipped).map((entry) => `${unreadWarning(entry)}\n`).join("");
    return { exitCode: 0, stdout, stderr: "" };
  };
}

/** The two Stryker configurations and their JSON reports (stryker.config.json, stryker.elements.config.json; 005 R-12). */
export const strykerConfig = "stryker.config.json";
export const elementsConfig = "stryker.elements.config.json";
export const elementsReportPath = "reports/mutation/mutation-elements.json";

/**
 * A Stryker that, as the two configurations do, runs only its own tests (005 research.md R-12): under
 * stryker.elements.config.json (the elements project only) a mutant of `packages/elements/src/**` gets
 * `statusOf(path)` and any other mutant `NoCoverage`; under stryker.config.json (every in-process project but
 * elements) the other way round. Otherwise as `fakeStryker`, writing the report its configuration names.
 */
export function configuredStryker(statusOf: (path: string) => string): FakeStryker {
  return (mutate, files, config = strykerConfig) => {
    const elementsRun = config === elementsConfig;
    const mutants: Record<string, object[]> = {};
    mutate.forEach((entry, index) => {
      const match = /^(.*):(\d+)-(\d+)$/s.exec(entry);
      if (match === null) throw new Error(`not a mutate range: ${entry}`);
      const [, path = "", start = "0"] = match;
      const covered = path.startsWith("packages/elements/src/") === elementsRun;
      (mutants[path] ??= []).push(mutant(String(index), Number(start), covered ? statusOf(path) : "NoCoverage"));
    });
    files.set(elementsRun ? elementsReportPath : reportPath, strykerReport(mutants));
    return { exitCode: 0, stdout: "", stderr: "" };
  };
}
