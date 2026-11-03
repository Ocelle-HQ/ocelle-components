// The sign-off gate (FR-023, research.md R-13): every commit of `--range <base>..<head>` needs a `Signed-off-by:`
// line (at the start of a line, key in any case) whose identity equals its author `Name <email>`. Merge commits are
// exempt, and so is the repository's unsigned root commit, by its full hash and only when it has no parent. A range
// that does not resolve or holds no commit is exit 2. `signoff()` is the decision, tested in process with a git
// double; `run()` gives it git in the `--root` repository (the process boundary, tested by
// gates/test/integration/gates-root.test.ts).
import { main, parseArgs } from "../lib/cli.ts";
import type { Context, Io } from "../lib/cli.ts";
import { emit, plural } from "../lib/findings.ts";
import type { Finding } from "../lib/findings.ts";
import { runTool } from "../lib/spawn.ts";
import type { ToolRun } from "../lib/spawn.ts";

/** One commit as `git log` describes it. */
export interface CommitRecord {
  readonly hash: string;
  readonly parents: readonly string[];
  /** `Name <email>`. */
  readonly author: string;
  readonly message: string;
}

/** The repository's unsigned root commit, the one commit FR-023 exempts (by its full hash, with no parent). */
export const rootCommit = "d08d4133bf0034e3d1ff29cddf2b0f13ca63290a";

/** The `git log --format` that parseLog reads: fields separated by US, records ended by RS. */
export const logFormat = "%H%x1f%P%x1f%an <%ae>%x1f%B%x1e";

const gate = "signoff";
const usage = "usage: gate:signoff -- --range <base>..<head>";

/** The commit records of `git log --format=<logFormat>` output. */
export function parseLog(text: string): CommitRecord[] {
  const records: CommitRecord[] = [];
  for (const chunk of text.split("\x1e")) {
    const [hash = "", parents = "", author = "", message = ""] = chunk.replace(/^\n/, "").split("\x1f");
    if (hash === "") continue;
    records.push({ hash, parents: parents.split(" ").filter((parent) => parent !== ""), author, message });
  }
  return records;
}

/** The identities of a message's `Signed-off-by:` lines, in order. */
function signers(message: string): string[] {
  return [...message.matchAll(/^signed-off-by:(.*)$/gim)].map((match) => String(match[1]).trim());
}

/** One finding per commit that needs a sign-off and has none matching its author. */
export function checkCommits(records: readonly CommitRecord[]): Finding[] {
  const findings: Finding[] = [];
  for (const record of records) {
    if (record.parents.length > 1) continue;
    if (record.hash === rootCommit && record.parents.length === 0) continue;
    const signed = signers(record.message);
    if (signed.includes(record.author)) continue;
    const [first] = signed;
    const message =
      first === undefined
        ? `no Signed-off-by line for the author ${record.author}; sign off with git commit -s (FR-023)`
        : `Signed-off-by ${first} does not match the author ${record.author} (FR-023)`;
    findings.push({ location: { commit: record.hash }, gate, rule: first === undefined ? "no-signoff" : "signoff-mismatch", message });
  }
  return findings;
}

/** The tools the sign-off gate uses, in the repository root. */
export interface SignoffTools {
  readonly git: (args: readonly string[]) => Promise<ToolRun>;
}

/** The `--range` value, or the problem with the arguments. A lone `--` (from `pnpm run ... --`) is skipped. */
function parseRange(args: readonly string[]): { readonly range: string } | { readonly problem: string } {
  let range: string | undefined;
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--") continue;
    if (arg !== "--range") return { problem: `unknown argument ${String(arg)}` };
    const value = args[i + 1];
    if (value === undefined || value === "") return { problem: "--range needs a value" };
    range = value;
    i += 1;
  }
  return range === undefined ? { problem: "--range <base>..<head> is required" } : { range };
}

export async function signoff(context: Context, tools: SignoffTools, io: Io): Promise<number> {
  const fail = (cause: string): number => emit({ exit: 2, cause: `${gate}: could not run: ${cause}` }, io.out, io.err);
  const parsed = parseRange(context.args);
  if ("problem" in parsed) return fail(`${parsed.problem}; ${usage}`);
  const { range } = parsed;
  const log = await tools.git(["log", `--format=${logFormat}`, range]);
  if (log.exitCode !== 0) {
    const detail = String(log.stderr.trim().split("\n")[0]);
    return fail(`--range ${range} does not resolve (${detail}); pass existing commits (in CI, check out with fetch-depth: 0)`);
  }
  const records = parseLog(log.stdout);
  if (records.length === 0) return fail(`--range ${range} holds no commit; pass the pull request's <base>..<head>`);
  const findings = checkCommits(records);
  if (findings.length > 0) {
    const summary = `${gate}: ${plural(findings.length, "finding")} in ${plural(records.length, "commit")}`;
    return emit({ exit: 1, findings, summary }, io.out, io.err);
  }
  return emit({ exit: 0, summary: `${gate}: ${plural(records.length, "commit")} checked, no finding` }, io.out, io.err);
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "signoff --root <tmp> --range <base>..HEAD exits 1 with exactly the finding of the commit without a sign-off"
export async function run(argv: readonly string[], io: Io): Promise<number> {
  const context = parseArgs(argv, io.cwd);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "signoff --root <tmp> --range <base>..HEAD exits 1 with exactly the finding of the commit without a sign-off"
  return signoff(context, { git: (args) => runTool("git", args, context.toolCwd, io.env) }, io);
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "signoff --root <tmp> --range <base>..HEAD exits 1 with exactly the finding of the commit without a sign-off"
if (import.meta.main) await main(run);
