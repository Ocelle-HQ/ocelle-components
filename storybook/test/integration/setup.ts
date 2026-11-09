// The global setup of the storybook-integration project (research.md R-10, R-03: nothing reads a pre-existing
// storybook/dist/): generates the token and swatch stylesheets, builds the Storybook into a per-run temporary
// directory under the no-network preload (no-network.ts, loaded with --import through NODE_OPTIONS so the build's
// Node child processes load it too), and externalises its HTML entries, the steps of the package's build script. The
// Storybook build runs with the arguments of the build script's `storybook build` step (so its --preview-only, R1-01),
// with the output directory replaced and without --disable-telemetry.
// It also runs the preload's control, a one-line script that connects to a non-loopback address. The output
// directory and both recorded access lists are provided to the tests.
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { TestProject } from "vitest/node";
import type { NetworkAccess } from "./no-network.ts";

declare module "vitest" {
  export interface ProvidedContext {
    storybook: { readonly out: string; readonly build: readonly NetworkAccess[]; readonly control: readonly NetworkAccess[] };
  }
}

const storybook = fileURLToPath(new URL("../..", import.meta.url));
const preload = fileURLToPath(new URL("./no-network.ts", import.meta.url));
const bin = join(storybook, "node_modules", "storybook", "dist", "bin", "dispatcher.js");

function run(args: readonly string[], env: Readonly<Record<string, string>> = {}): void {
  const ran = spawnSync(process.execPath, args, { cwd: storybook, env: { ...process.env, ...env }, encoding: "utf8" });
  if (ran.status !== 0) throw new Error(`storybook-integration setup: node ${args.join(" ")} exited ${String(ran.status)}\n${ran.stdout}${ran.stderr}`);
}

/** The arguments of the package build script's `storybook build` step, without --disable-telemetry, into `out`. */
function buildArgs(out: string): string[] {
  const manifest = JSON.parse(readFileSync(join(storybook, "package.json"), "utf8")) as { readonly scripts?: Readonly<Record<string, string>> };
  const step = (manifest.scripts?.build ?? "").split(" && ").find((each) => each.startsWith("storybook build "));
  if (step === undefined) throw new Error("storybook-integration setup: the build script has no `storybook build` step");
  const args = step.split(" ").slice(1).filter((arg) => arg !== "--disable-telemetry");
  const at = args.indexOf("-o");
  if (at < 0 || at + 1 >= args.length) throw new Error("storybook-integration setup: the `storybook build` step has no -o <dir>");
  return args.map((arg, index) => (index === at + 1 ? out : arg));
}

function accesses(file: string): NetworkAccess[] {
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8").split("\n").filter((line) => line !== "").map((line) => JSON.parse(line) as NetworkAccess);
}

let temp: string | undefined;

export default function setup(project: TestProject): () => void {
  temp = mkdtempSync(join(tmpdir(), "ocelle-storybook-"));
  const out = join(temp, "dist");
  const buildLog = join(temp, "build-network.log");
  const controlLog = join(temp, "control-network.log");
  writeFileSync(buildLog, "");
  writeFileSync(controlLog, "");
  run(["scripts/swatches.ts"]);
  // Without --disable-telemetry: the build must stay offline through main.ts's core.disableTelemetry alone (the
  // build script passes the flag as well; telemetry.test.ts).
  run([bin, ...buildArgs(out)], {
    NODE_OPTIONS: `--import ${preload}`,
    OCELLE_NO_NETWORK_LOG: buildLog,
  });
  run(["scripts/externalise.ts", out]);
  run(["--import", preload, "-e", 'require("node:net").connect({ host: "192.0.2.1", port: 443 }).on("error", () => {});'], { OCELLE_NO_NETWORK_LOG: controlLog });
  project.provide("storybook", { out, build: accesses(buildLog), control: accesses(controlLog) });
  return () => {
    if (temp !== undefined) rmSync(temp, { recursive: true, force: true });
  };
}
