import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, realpathSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { baseEnv, cleanUp, releaseInputs, repo, runGate, storybookInputs, tempDir } from "./workspace.ts";

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
  // The release inputs of the configuration set (030 research.md R-17).
  ...releaseInputs,
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
          ...missing("sandbox-paths", []),
          // 030: the pack-contents gate, a gate of the registry whose plants this root does not hold.
          ...missing("pack-contents", []),
          // 030 US2: the release-readiness gate, likewise.
          ...missing("release-readiness", []),
          "plants: 56 problems in 6 plants",
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
  // of plantsRoot() six shards at the repository's size 1 (012 research.md R-13; it was 3, plan decision 30): shard 1
  // its other plants, shards 2 to 6 one visual plant each.
  it(
    "--verdict on an empty directory exits 2 naming every shard of the repository's plan",
    async () => {
      const root = plantsRoot();
      for (let index = 1; index <= 5; index += 1) write(join(root, `gates/plants/visual/case-${String(index)}/tree/x.txt`), "x");
      const ran = await runGate("gates/bin/plants.ts", ["--root", root, "--verdict", tempDir("reports")], { cwd: tempDir("cwd"), env: baseEnv() });
      expect({ code: ran.code, stderr: ran.stderr }).toEqual({
        code: 2,
        stderr: [1, 2, 3, 4, 5, 6].map((k) => `plants: could not run: shard ${String(k)} of 6 reported no result`),
      });
    },
    timeout,
  );

  // Op 016 (spec.md OR-003, scenarios 6 and 8): the changed paths come from git in the root, against the base given.
  // plantsRoot() is committed as it is, then one plant's plant.json changes in the working tree: only that plant is
  // judged, after the registry check and the structural checks of the whole set (the other gates' missing plants).
  it(
    "--affected HEAD judges only the plant whose plant.json changed since HEAD, and names HEAD in its summary",
    async () => {
      const root = plantsRoot();
      const git = (...args: string[]): void => {
        execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.invalid", "-c", "commit.gpgsign=false", ...args], { cwd: root, env: baseEnv(), stdio: "ignore" });
      };
      git("init", "-q");
      git("add", "-A");
      git("commit", "-q", "-m", "plants root");
      const plant = "gates/plants/config-copies/pass-equal-copies/plant.json";
      write(join(root, plant), JSON.stringify({ expect: "pass", why: "Fixture: two equal story configuration copies, changed since HEAD." }));
      const ran = await runGate("gates/bin/plants.ts", ["--root", root, "--affected", "HEAD"], { cwd: tempDir("cwd"), env: baseEnv() });
      expect({ code: ran.code, stdout: ran.stdout, stderr: ran.stderr.map(timeless) }).toEqual({
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
          ...missing("sandbox-paths", []),
          // 030: the pack-contents gate, a gate of the registry whose plants this root does not hold.
          ...missing("pack-contents", []),
          // 030 US2: the release-readiness gate, likewise.
          ...missing("release-readiness", []),
          "plants: 56 problems in 1 plant (affected since HEAD; not the Plants check)",
        ],
        stderr: [`note: affected: config-copies/pass-equal-copies, by ${plant}`, "note: plant time: config-copies/pass-equal-copies: <s> s"],
      });
      const unresolved = await runGate("gates/bin/plants.ts", ["--root", root, "--affected", "no-such-ref"], { cwd: tempDir("cwd"), env: baseEnv() });
      expect(unresolved).toEqual({ code: 2, stdout: [], stderr: ["plants: could not run: --affected no-such-ref does not resolve to a commit; pass the phase's base.sha"] });
    },
    timeout,
  );

  // Op 016 (spec.md Edge Cases, OR-003; phase 1 review round 1, R1-01): untracked files that are not ignored count as
  // changed, ignored ones do not. plantsRoot() is committed with a .gitignore, then two plants each get a new untracked
  // file (two, so the NUL split of git's list matters) and a third gets an ignored one: only the two are judged.
  it(
    "--affected HEAD judges the plants that hold an untracked file that is not ignored, and not the plant that holds an ignored one",
    async () => {
      const root = plantsRoot();
      const git = (...args: string[]): void => {
        execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.invalid", "-c", "commit.gpgsign=false", ...args], { cwd: root, env: baseEnv(), stdio: "ignore" });
      };
      write(join(root, ".gitignore"), "*.ignored\n");
      git("init", "-q");
      git("add", "-A");
      git("commit", "-q", "-m", "plants root");
      const untracked = ["gates/plants/mutation/error-unresolvable-base/notes.txt", "gates/plants/signoff/fail-no-trailer/notes.txt"];
      for (const path of untracked) write(join(root, path), "An untracked file, not ignored.\n");
      write(join(root, "gates/plants/pins/error-invalid-json/scratch.ignored"), "An ignored file.\n");
      const ran = await runGate("gates/bin/plants.ts", ["--root", root, "--affected", "HEAD"], { cwd: tempDir("cwd"), env: baseEnv() });
      expect({ code: ran.code, stdout: ran.stdout, notes: ran.stderr.filter((line) => !line.startsWith("note: plant time: ")), times: times(ran.stderr) }).toEqual({
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
          ...missing("sandbox-paths", []),
          // 030: the pack-contents gate, a gate of the registry whose plants this root does not hold.
          ...missing("pack-contents", []),
          // 030 US2: the release-readiness gate, likewise.
          ...missing("release-readiness", []),
          "plants: 56 problems in 2 plants (affected since HEAD; not the Plants check)",
        ],
        notes: [`note: affected: mutation/error-unresolvable-base, by ${String(untracked[0])}`, `note: affected: signoff/fail-no-trailer, by ${String(untracked[1])}`],
        times: ["note: plant time: mutation/error-unresolvable-base: <s> s", "note: plant time: signoff/fail-no-trailer: <s> s"],
      });
    },
    timeout,
  );

  // Op 016, operator round 3 of phase 1 (O3-02; spec.md OR-009 and scenario 16): the base resolves, but git diff fails.
  // A junk GIT_INDEX_FILE leaves rev-parse working and makes git diff (and git ls-files) exit 128, so the job must exit
  // 2 naming git's first stderr line, not judge an empty selection and exit 0. The line names the index file in most
  // git versions, so the match leaves that part open.
  it(
    "--affected HEAD exits 2 naming git's first stderr line when git diff fails, and judges no plant",
    async () => {
      const root = plantsRoot();
      const git = (...args: string[]): void => {
        execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.invalid", "-c", "commit.gpgsign=false", ...args], { cwd: root, env: baseEnv(), stdio: "ignore" });
      };
      git("init", "-q");
      git("add", "-A");
      git("commit", "-q", "-m", "plants root");
      const junk = join(tempDir("index"), "junk-index");
      writeFileSync(junk, "not an index\n");
      const ran = await runGate("gates/bin/plants.ts", ["--root", root, "--affected", "HEAD"], { cwd: tempDir("cwd"), env: { ...baseEnv(), GIT_INDEX_FILE: junk } });
      expect(ran).toEqual({
        code: 2,
        stdout: [],
        stderr: [expect.stringMatching(/^plants: could not run: git failed \(fatal: (?:.+: )?index file smaller than expected\)$/)],
      });
    },
    timeout,
  );
});
