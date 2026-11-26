import { spawn } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { parsePlant } from "../../lib/plant-judge.ts";
import { buildRepoTree } from "../../lib/plant-repo.ts";
import { baseEnv, repo, runGate, tempDir } from "./workspace.ts";
import type { Ran } from "./workspace.ts";

// The visual gate and the baseline command end to end (FR-003 to FR-012, FR-026 to FR-028; US2 scenarios 1, 2, 6, 7,
// 8, 10 and 15; contracts/gates.md § `visual`, § `visual:update`; contracts/container.md; research.md R-04, R-11), on
// plant roots built by gates/lib/plant-repo.ts. The container runs need docker (started in the sandbox, present on the
// CI runner) and the pinned image; with no engine they fail with the gate's exit 2, never skip. Every run of a gate
// here has CI and GITHUB_ACTIONS removed from its environment (the CI rule has its own test) and no
// OCELLE_VISUAL_ENGINE, so the engine is `auto`, docker here. The animation control drives the host browser
// (OCELLE_CHROMIUM_PATH locally) on the plant story pass-animation-and-caret.
// The time limit is shared by the Visual integration suites. The whole-repository capture grows with every story: it took 519 s at
// 171 stories (landing round 1 R1-06), and at 194 stories (388 story-themes) it timed out at the 600 s limit on CI run
// 44481594952, where run 44298568583 had passed it. 1200 s is twice the limit that failed (012
// reviews/phase-6/round-7.md O7-01, operator 2026-11-19); gates/test/visual-timeout.test.ts pins it. The growth itself
// stays with the plant-design triage follow-up (012 plan decision 15, R1-06, R1-09).
export const timeout = 1_200_000;
const empty = join(repo, "gates/test/fixtures/plant-repo/empty-plant");
export const plantsDir = join(repo, "gates/plants/visual");
export const docker = "only: no cross-engine comparison)";

/** This process's environment without Vitest's variables, CI, GITHUB_ACTIONS and OCELLE_VISUAL_ENGINE. */
export function env(extra: Record<string, string> = {}): Record<string, string> {
  const removed = new Set(["CI", "GITHUB_ACTIONS", "OCELLE_VISUAL_ENGINE"]);
  return { ...Object.fromEntries(Object.entries(baseEnv()).filter(([key]) => !removed.has(key))), ...extra };
}

export function gate(root: string, args: readonly string[] = [], extra: Record<string, string> = {}): Promise<Ran> {
  return runGate("gates/bin/visual.ts", ["--root", root, ...args], { cwd: tempDir("cwd"), env: env(extra) });
}

/** A plant root of the repository's configuration set (its stories and baselines), with a plant's tree/ when named. */
export async function root(plant?: string): Promise<string> {
  const into = tempDir("visual");
  if (plant === undefined) {
    await buildRepoTree(repo, empty, into);
    return into;
  }
  const parsed = parsePlant(readFileSync(join(plantsDir, plant, "plant.json"), "utf8"));
  await buildRepoTree(repo, join(plantsDir, plant), into, typeof parsed === "string" ? undefined : parsed);
  return into;
}

/** Every file below a directory, as sorted paths relative to it, with its bytes. */
export function files(dir: string): Map<string, Buffer> {
  const found = new Map<string, Buffer>();
  if (!existsSync(dir)) return found;
  for (const entry of readdirSync(dir, { recursive: true, withFileTypes: true })) {
    if (entry.isFile()) found.set(relative(dir, join(entry.parentPath, entry.name)), readFileSync(join(entry.parentPath, entry.name)));
  }
  return new Map([...found].sort(([a], [b]) => a.localeCompare(b)));
}

/** Runs a command and collects its exit code and output. */
export function run(command: string, args: readonly string[], cwd: string, environment: Record<string, string | undefined>): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env: environment });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
    child.stderr.on("data", (d: Buffer) => (stderr += d.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}
