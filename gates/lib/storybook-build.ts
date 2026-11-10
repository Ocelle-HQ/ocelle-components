// The Storybook build gate (FR-001, FR-002, FR-017; contracts/gates.md § `storybook-build`; research.md R-09, R-16).
import type { Io } from "./cli.ts";
import type { Finding, GateResult } from "./findings.ts";

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

/** The build command: pnpm and its arguments. */
export function buildCommand(): { readonly command: string; readonly args: readonly string[] } {
  throw new Error("not implemented (storybook-build, phase 2)");
}

/** The environment the build runs with, for the root under test. */
export function buildEnv(root: string, env: Io["env"]): Record<string, string | undefined> {
  throw new Error(`not implemented (storybook-build, phase 2): ${root} ${String(Object.keys(env).length)}`);
}

/** The cause of the CLI check that stops the gate before the build, or undefined when the build can run. */
export function cliProblem(packageJson: string | undefined, installed: boolean): string | undefined {
  throw new Error(`not implemented (storybook-build, phase 2): ${String(packageJson?.length)} ${String(installed)}`);
}

/** The findings of a failed build's output. */
export function buildFindings(run: BuildRun): Finding[] {
  throw new Error(`not implemented (storybook-build, phase 2): ${String(run.exitCode)}`);
}

/** The gate's result from the build's run and, after a successful build, the built index's text. */
export function classifyBuild(run: BuildRun, indexText: string | undefined): GateResult {
  throw new Error(`not implemented (storybook-build, phase 2): ${String(run.exitCode)} ${String(indexText?.length)}`);
}

/** The gate on the root under test: the CLI check, the build, and the verdict on its output and index. */
export function storybookBuild(root: string, env: Io["env"], tools: BuildTools): Promise<GateResult> {
  return Promise.reject(new Error(`not implemented (storybook-build, phase 2): ${root} ${String(Object.keys(env).length)} ${typeof tools}`));
}
