import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, realpathSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { baseEnv, cleanUp, repo, runGate, storybookInputs, tempDir } from "./workspace.ts";

// The plant job end to end (research.md R-08 kind 3, R-10; phase 4 review round 1, R1-09 and R1-11):
// `gates/bin/plants.ts --root <tmp>` from a different working directory, on a temporary repository that holds the
// repository's registry, workflow, gate scripts and configuration set (node_modules linked) and the plants of
// gates/test/fixtures/plants-root/: one plant of each plant form (repo-tree, commit-repo, workspace and mutation-repo,
// the last presenting an unresolvable --base through its plant.json `base`) and two registry plants, whose gates.json
// and ci.yml the test writes from the repository's. Every plant does what it expects, so the job's only problems are
// the plants the other gates lack.
const timeout = 120_000;
const copied = [
  "gates/gates.json",
  ".github/workflows/ci.yml",
  "gates/bin",
  "gates/lib",
  "gates/eslint",
  "gates/stylelint",
  "package.json",
  "pnpm-workspace.yaml",
  "tsconfig.base.json",
  "tsconfig.json",
  "eslint.config.ts",
  "eslint.test.config.ts",
  "stylelint.config.ts",
  "vitest.config.ts",
  "vitest.mutation.config.ts",
  "stryker.config.json",
  // The element mutation configuration of the configuration set (005 research.md R-12).
  "stryker.elements.config.json",
  "vitest.mutation.elements.config.ts",
  ...["tokens", "styles", "elements"].flatMap((name) => [`packages/${name}/package.json`, `packages/${name}/tsconfig.json`]),
  // The token files of the configuration set (002 contracts/gates.md § Configuration set).
  "packages/tokens/src/source.ts",
  "packages/tokens/src/overrides.ts",
  "packages/tokens/src/generate.ts",
  "packages/tokens/contrast/pairs.json",
  // The element source of the configuration set (005 research.md R-12).
  "packages/elements/src",
  // The Storybook workspace inputs of the configuration set (006 research.md R-16).
  ...storybookInputs,
];
const kinds = ["fail", "pass", "error"] as const;

function write(path: string, text: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
}

function plantsRoot(): string {
  const root = tempDir("plants-root");
  cpSync(join(repo, "gates/test/fixtures/plants-root"), root, { recursive: true });
  for (const path of copied) cpSync(join(repo, path), join(root, path), { recursive: true });
  symlinkSync(join(repo, "node_modules"), join(root, "node_modules"), "dir");
  symlinkSync(realpathSync(join(repo, "storybook/node_modules")), join(root, "storybook/node_modules"), "dir");
  const registryText = readFileSync(join(repo, "gates/gates.json"), "utf8");
  const workflow = readFileSync(join(repo, ".github/workflows/ci.yml"), "utf8");
  const withoutCsp = (JSON.parse(registryText) as { id: string }[]).filter((gate) => gate.id !== "csp");
  write(join(root, "gates/plants/plants/pass-matching/gates.json"), registryText);
  write(join(root, "gates/plants/plants/pass-matching/ci.yml"), workflow);
  write(join(root, "gates/plants/plants/fail-gate-without-entry/gates.json"), JSON.stringify(withoutCsp));
  write(join(root, "gates/plants/plants/fail-gate-without-entry/ci.yml"), workflow);
  return root;
}

/** The missing-plant lines of a gate that has only the plants of the kinds `present`. */
function missing(id: string, present: readonly string[]): string[] {
  return kinds.filter((kind) => !present.includes(kind)).map((kind) => `gates/plants/${id}: plants: missing-plant: gate ${id} has no ${kind} plant`);
}

/** The plants of plantsRoot() as `<gate>/<case>`, each one the job judges. */
const rootPlants = ["config-copies/pass-equal-copies", "mutation/error-unresolvable-base", "pins/error-invalid-json", "plants/fail-gate-without-entry", "plants/pass-matching", "signoff/fail-no-trailer"];

/** Plan decision 24: a stderr line of a plant's time, with its seconds written `<s>`; any other line as it is. */
function timeless(line: string): string {
  return line.replace(/^(note: plant time: [a-z0-9-]+\/[a-z0-9-]+): \d+\.\d s$/, "$1: <s> s");
}

/** The stderr lines of the plant times, sorted (plants of other gates run at once, so their order is not fixed). */
function times(stderr: readonly string[]): string[] {
  return stderr.map(timeless).filter((line) => line.startsWith("note: plant time: ")).sort();
}

afterEach(cleanUp);

describe("plant job (gates/bin/plants.ts)", () => {
  it(
    "plants --root <tmp> runs each plant form through its gate and judges it",
    async () => {
      const root = plantsRoot();
      const ran = await runGate("gates/bin/plants.ts", ["--root", root], { cwd: tempDir("cwd"), env: baseEnv() });
      expect({ code: ran.code, stdout: ran.stdout, stderr: [...ran.stderr].map(timeless).sort() }).toEqual({
        code: 1,
        stdout: [
          ...missing("typecheck", []),
          ...missing("lint", []),
          ...missing("style-lint", []),
          ...missing("unit-tests", []),
          ...missing("test-lint", []),
          ...missing("mutation", ["error"]),
          ...missing("csp", []),
          ...missing("prefix", []),
          ...missing("config-copies", ["pass"]),
          ...missing("pins", ["error"]),
          ...missing("signoff", ["fail"]),
          ...missing("contrast", []),
          ...missing("brand-rules", []),
          ...missing("manifest", []),
          ...missing("storybook-build", []),
          ...missing("visual", []),
          ...missing("axe", []),
          "plants: 47 problems in 6 plants",
        ],
        stderr: rootPlants.map((plant) => `note: plant time: ${plant}: <s> s`),
      });
    },
    timeout,
  );

  // 006 FR-018 and research.md R-07: with no container engine on PATH and no --skip-container, the job runs no visual
  // plant that needs one, names each on stderr, and exits 2 after the other plants, whatever their result.
  it(
    "exits 2 naming each visual plant it could not run when PATH holds neither docker nor podman",
    async () => {
      const root = plantsRoot();
      write(join(root, "gates/plants/visual/fail-needs-engine/plant.json"), JSON.stringify({ expect: "fail", why: "w", findings: [{ location: "a--b/light", rule: "differs" }] }));
      write(join(root, "gates/plants/visual/pass-needs-engine/plant.json"), JSON.stringify({ expect: "pass", why: "w" }));
      const bin = tempDir("bin");
      symlinkSync(execFileSync("sh", ["-c", "command -v git"], { encoding: "utf8" }).trim(), join(bin, "git"));
      symlinkSync(process.execPath, join(bin, "node"));
      const env: Record<string, string> = { ...baseEnv(), PATH: bin };
      delete env.OCELLE_VISUAL_ENGINE;
      const ran = await runGate("gates/bin/plants.ts", ["--root", root], { cwd: tempDir("cwd"), env });
      expect({ code: ran.code, times: times(ran.stderr), stderr: ran.stderr.filter((line) => !line.startsWith("note: plant time: ")) }).toEqual({
        code: 2,
        times: rootPlants.map((plant) => `note: plant time: ${plant}: <s> s`),
        stderr: [
          "plants: not run (no container engine): gates/plants/visual/fail-needs-engine",
          "plants: not run (no container engine): gates/plants/visual/pass-needs-engine",
          "plants: could not run: no container engine for 2 visual plants; start docker or podman, or run a partial job with --skip-container",
        ],
      });
    },
    timeout,
  );
  // Plan decision 23 (contracts/plants.md § Shards): the Plants check recomputes the partition, so an empty report
  // directory names every shard of the plan. Five visual plant directories (no plant.json, so none runs) give the plan
  // of plantsRoot() three shards at the repository's size 3 (plan decision 30): shard 1 its other plants, shards 2 and
  // 3 three and two visual plants.
  it(
    "--verdict on an empty directory exits 2 naming every shard of the repository's plan",
    async () => {
      const root = plantsRoot();
      for (let index = 1; index <= 5; index += 1) write(join(root, `gates/plants/visual/case-${String(index)}/tree/x.txt`), "x");
      const ran = await runGate("gates/bin/plants.ts", ["--root", root, "--verdict", tempDir("reports")], { cwd: tempDir("cwd"), env: baseEnv() });
      expect({ code: ran.code, stderr: ran.stderr }).toEqual({
        code: 2,
        stderr: [1, 2, 3].map((k) => `plants: could not run: shard ${String(k)} of 3 reported no result`),
      });
    },
    timeout,
  );
});
