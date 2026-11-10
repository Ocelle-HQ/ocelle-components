import { cpSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { baseEnv, cleanUp, repo, runGate, tempDir } from "./workspace.ts";

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

afterEach(cleanUp);

describe("plant job (gates/bin/plants.ts)", () => {
  it(
    "plants --root <tmp> runs each plant form through its gate and judges it",
    async () => {
      const root = plantsRoot();
      const ran = await runGate("gates/bin/plants.ts", ["--root", root], { cwd: tempDir("cwd"), env: baseEnv() });
      expect({ code: ran.code, stdout: ran.stdout, stderr: ran.stderr }).toEqual({
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
          "plants: 38 problems in 6 plants",
        ],
        stderr: [],
      });
    },
    timeout,
  );
});
