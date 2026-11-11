// The Storybook build gate (FR-001, FR-002, FR-017; contracts/gates.md § `storybook-build`; research.md R-09, R-16):
// the CLI check before the build (storybook/package.json with a build script, then the Storybook CLI resolvable from
// storybook/node_modules, the only signal of missing dependencies), the workspace's own build script run through pnpm
// with its dependency check before `run` turned off (operator decision on the phase 1 spike § 4: it would re-link the
// repository's node_modules from a plant root) and Storybook's file cache below the root's storybook/.cache, and the
// verdict on the build's output and its index. Every decision is pure and tested in process on the spike's recorded
// outputs (gates/test/storybook-build.test.ts); gates/bin/storybook-build.ts only hands it the file system and pnpm.
import { join } from "node:path";
import type { Io } from "./cli.ts";
import { formatLocation, plural } from "./findings.ts";
import type { Finding, GateResult } from "./findings.ts";
import { parseIndex } from "./storybook-index.ts";

/** One run of the workspace's build script: its exit code (null when a signal ended it) and its output. */
export interface BuildRun {
  readonly exitCode: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

/** What the gate uses of the root under test (paths relative to it) and of the process that builds. */
export interface BuildTools {
  /** Reads a file; undefined when it does not exist. */
  readonly read: (path: string) => Promise<string | undefined>;
  /** Whether a file exists. */
  readonly exists: (path: string) => Promise<boolean>;
  /** Runs a command in the root with the given environment; rejects when the command cannot be started. */
  readonly run: (command: string, args: readonly string[], env: Io["env"]) => Promise<BuildRun>;
}

const gate = "storybook-build";
const manifestPath = "storybook/package.json";
const indexPath = "storybook/dist/index.json";
/** The Storybook CLI as the build script resolves it (research.md R-09, PLAN-CORRECTNESS-1-007). */
const cliPaths = ["storybook/node_modules/storybook/package.json", "storybook/node_modules/.bin/storybook"];

/** The build command: the workspace's own build script, through pnpm with its dependency check turned off. */
export function buildCommand(): { readonly command: string; readonly args: readonly string[] } {
  return { command: "pnpm", args: ["--config.verify-deps-before-run=false", "--dir", "storybook", "run", "build"] };
}

/** The environment the build runs with: Storybook's file cache below the root's storybook/.cache, the rest kept. */
export function buildEnv(root: string, env: Io["env"]): Record<string, string | undefined> {
  return { ...env, CACHE_DIR: join(root, "storybook", ".cache") };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The cause of the CLI check that stops the gate before the build, or undefined when the build can run. */
export function cliProblem(packageJson: string | undefined, installed: boolean): string | undefined {
  if (packageJson === undefined) return `${manifestPath} is missing; restore it from git`;
  let manifest: unknown;
  try {
    manifest = JSON.parse(packageJson);
  } catch {
    return `${manifestPath} is not valid JSON; fix it`;
  }
  const scripts = isObject(manifest) ? manifest.scripts : undefined;
  const build = isObject(scripts) ? scripts.build : undefined;
  if (typeof build !== "string" || build === "") return `${manifestPath} has no build script`;
  return installed ? undefined : "storybook is not installed; run pnpm install";
}

const escape = String.fromCharCode(27);
const bell = String.fromCharCode(7);
/** OSC 8 hyperlinks (`ESC]8;;<url>BEL`) and colour codes (`ESC[…m`): Rolldown writes them even to a pipe (spike § 1). */
const controls = new RegExp(`${escape}\\]8;;[^${bell}]*${bell}|${escape}\\[[0-9;]*[A-Za-z]`, "g");
/**
 * The Storybook CLI's line marks, then two spaces or the line end: the ASCII ones it draws under TERM=linux (spike § 1:
 * `|`, `!`, `x`, `o`, `T`, `•`, `—`) and the Unicode ones it draws otherwise, TERM unset on the CI runner included
 * (`│`, `┌`, `└`, `◇`, `●`, `■`, `▲`; fixtures `<case>-unicode/`).
 */
const mark = /^[|!xoT•—│┌└◇●■▲](?: {2}|$)/;
/** The indexer's `Unable to index ./stories/<file>:` (its error on the next line), relative to storybook/. */
const indexLine = /Unable to index \.\/(\S+):$/;
/** A Vite error's first line, `[<code>] <message>`. */
const viteMessage = /^\[[^\]]+\] /;
/** A Vite error's location, `╭─[ stories/<file>:<line>:<col> ]`, relative to storybook/. */
const viteLocation = /╭─\[ (\S+?):\d+:\d+ \]/;

/** The lines of a build's output without colour codes and line marks, trimmed. */
function cleanLines(text: string): string[] {
  return text
    .replace(controls, "")
    .split(/\r?\n/)
    .map((line) => line.replace(mark, "").trim());
}

/** The findings of a failed build's output: at the file the build names, else one at storybook/package.json. */
export function buildFindings(run: BuildRun): Finding[] {
  const lines = cleanLines(`${run.stdout}\n${run.stderr}`);
  const findings: Finding[] = [];
  const finding = (file: string, rule: string, message: string): Finding => ({ location: { path: `storybook/${file}` }, gate, rule, message });
  let message: string[] | undefined;
  for (const [at, line] of lines.entries()) {
    const indexed = indexLine.exec(line);
    if (indexed !== null) {
      const error = lines.slice(at + 1).find((next) => next !== "") ?? "the indexer named no error";
      findings.push(finding(String(indexed[1]), error.startsWith("SyntaxError") ? "build-error" : "index-error", error));
      continue;
    }
    const located = viteLocation.exec(line);
    if (located !== null && message !== undefined) {
      findings.push(finding(String(located[1]), "build-error", message.join(" ")));
      message = undefined;
      continue;
    }
    if (viteMessage.test(line)) message = [line];
    else if (message !== undefined && line !== "") message.push(line);
  }
  if (findings.length > 0) return findings;
  const how = run.exitCode === null ? "was ended by a signal" : `failed with exit code ${String(run.exitCode)}`;
  return [{ location: { path: manifestPath }, gate, rule: "build-error", message: `the build ${how} and named no file` }];
}

/** The gate's result from the build's run and, after a successful build, the built index's text. */
export function classifyBuild(run: BuildRun, indexText: string | undefined): GateResult {
  let findings: Finding[];
  if (run.exitCode === 0) {
    if (indexText === undefined) return { exit: 2, cause: `${gate}: could not run: the build wrote no ${indexPath}` };
    let count: number;
    try {
      count = parseIndex(indexText).length;
    } catch (error) {
      return { exit: 2, cause: `${gate}: could not run: ${error instanceof Error ? error.message : String(error)}` };
    }
    if (count > 0) return { exit: 0, summary: `${gate}: built ${String(count)} ${count === 1 ? "story" : "stories"}` };
    findings = [{ location: { path: indexPath }, gate, rule: "empty-index", message: "the built index holds no story" }];
  } else {
    findings = buildFindings(run);
  }
  const files = new Set(findings.map((found) => formatLocation(found.location))).size;
  return { exit: 1, findings, summary: `${gate}: ${plural(findings.length, "finding")} in ${plural(files, "file")}` };
}

/** The gate on the root under test: the CLI check, the build, and the verdict on its output and index. */
export async function storybookBuild(root: string, env: Io["env"], tools: BuildTools): Promise<GateResult> {
  const packageJson = await tools.read(manifestPath);
  let installed = true;
  for (const path of cliPaths) installed = (await tools.exists(path)) && installed;
  const problem = cliProblem(packageJson, installed);
  if (problem !== undefined) return { exit: 2, cause: `${gate}: could not run: ${problem}` };
  const { command, args } = buildCommand();
  let run: BuildRun;
  try {
    run = await tools.run(command, args, buildEnv(root, env));
  } catch (error) {
    return { exit: 2, cause: `${gate}: could not run: pnpm could not be started (${error instanceof Error ? error.message : String(error)}); install pnpm` };
  }
  return classifyBuild(run, run.exitCode === 0 ? await tools.read(indexPath) : undefined);
}
