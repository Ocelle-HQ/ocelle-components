// Helpers for the gates-integration tests: temporary workspaces built from fixture trees, and gate runs as child
// processes. The tests never run a gate in place in gates/test/fixtures/ (research.md R-03, R-04, R-10).
import { spawn } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const repo = fileURLToPath(new URL("../../..", import.meta.url));

const made: string[] = [];

/** A new empty temporary directory, removed by cleanUp(). */
export function tempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), `ocelle-${prefix}-`));
  made.push(dir);
  return dir;
}

/**
 * A temporary workspace: the fixture tree under gates/test/fixtures/<fixture>/, the named repository files (or
 * directories) copied in unchanged at the same paths, and (when asked) node_modules linked from the repository.
 */
export function workspace(fixture: string, repoFiles: readonly string[], linkModules: boolean): string {
  const dir = tempDir("ws");
  cpSync(join(repo, "gates/test/fixtures", fixture), dir, { recursive: true });
  for (const file of repoFiles) cpSync(join(repo, file), join(dir, file), { recursive: true });
  if (linkModules) symlinkSync(join(repo, "node_modules"), join(dir, "node_modules"), "dir");
  return dir;
}

/**
 * The Storybook workspace inputs of a plant root's configuration set (006 research.md R-16), for tests that build a
 * repository root of their own for the plant job.
 */
export const storybookInputs: readonly string[] = [
  ".node-version",
  "packages/styles/src/base.css",
  "packages/tokens/fonts",
  "storybook/package.json",
  "storybook/.storybook",
  "storybook/scripts",
  "storybook/stories",
  "storybook/visual/container.json",
];

/**
 * The release inputs of a plant root's configuration set (030 research.md R-17) that the repository holds, for tests
 * that build a repository root of their own for the plant job: the workflows and the shared action, gates/release/
 * (which arrives with the pack-contents gate), the gap-table source, the root licence files and each changelog.
 */
export const releaseInputs: readonly string[] = [
  ".github/workflows",
  ".github/actions",
  "gates/release",
  "specs/030-release-v1/sources/issue-1-gap-table.md",
  "LICENSE",
  "NOTICE",
  "THIRD_PARTY_NOTICES",
  ...["tokens", "styles", "elements"].map((name) => `packages/${name}/CHANGELOG.md`),
].filter((path) => existsSync(join(repo, path)));

export function cleanUp(): void {
  for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true });
}

/** The environment of this process without the variables Vitest sets for its own workers. */
export function baseEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value === undefined || key.startsWith("VITEST") || key === "TEST" || key === "NODE_ENV") continue;
    env[key] = value;
  }
  return env;
}

export interface Ran {
  readonly code: number | null;
  readonly stdout: string[];
  readonly stderr: string[];
}

function lines(text: string): string[] {
  return text.split("\n").filter((l) => l.length > 0);
}

/** Runs a gate script of this repository with Node, as a child process. */
export function runGate(
  script: string,
  args: readonly string[],
  options: { readonly cwd: string; readonly env: Record<string, string> },
): Promise<Ran> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [join(repo, script), ...args], { cwd: options.cwd, env: options.env });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
    child.stderr.on("data", (d: Buffer) => (stderr += d.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ code, stdout: lines(stdout), stderr: lines(stderr) });
    });
  });
}
