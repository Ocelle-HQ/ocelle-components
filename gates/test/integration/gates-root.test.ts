import { execFileSync } from "node:child_process";
import { cpSync, existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { baseEnv, cleanUp, repo, runGate, tempDir, workspace } from "./workspace.ts";

// `--root` on every phase 4 gate (research.md R-09): each gate entry runs with `--root <tmp>` from a different
// working directory, on a temporary repository the test builds itself from gates/test/fixtures/root/<id>/ holding
// one defect, with only the configuration files that gate reads copied in (and node_modules linked). It exits 1
// with exactly that defect's finding at its repository path; the same tree without the defect exits 0. Each case
// first asserts that every configuration file it copies exists: eslint.config.ts and stylelint.config.ts arrive
// with the green commit, so at the red commit the lint and style-lint cases fail on that assertion, and the others
// on the gate's exit code.
const timeout = 120_000;
const packages = ["tokens", "styles", "elements"];
const tsconfigs = [
  "package.json",
  "tsconfig.base.json",
  "tsconfig.json",
  ...packages.flatMap((name) => [`packages/${name}/package.json`, `packages/${name}/tsconfig.json`]),
];

interface TreeCase {
  readonly id: string;
  readonly configs: readonly string[];
  readonly defect: string;
  readonly finding: string;
  readonly summary: string;
  readonly clean: string;
}

const treeCases: readonly TreeCase[] = [
  {
    id: "typecheck",
    configs: tsconfigs,
    defect: "packages/tokens/src/defect.ts",
    finding: "packages/tokens/src/defect.ts:1: typecheck: TS7006: Parameter 'a' implicitly has an 'any' type.",
    summary: "typecheck: 1 finding in 1 file",
    clean: "typecheck: no type error in the files of tsconfig.json",
  },
  {
    id: "lint",
    configs: [...tsconfigs, "eslint.config.ts"],
    defect: "packages/tokens/src/defect.ts",
    finding:
      "packages/tokens/src/defect.ts:5: lint: @typescript-eslint/no-floating-promises: Promises must be awaited, end " +
      "with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored " +
      "with the `void` operator.",
    summary: "lint: 1 finding in 1 file",
    clean: "lint: 2 files checked, no finding",
  },
  {
    id: "style-lint",
    // The token source, its overrides and the generator: the unknown-token check reads the token list under --root.
    configs: [
      "package.json",
      "stylelint.config.ts",
      "gates/stylelint",
      "packages/tokens/src/source.ts",
      "packages/tokens/src/overrides.ts",
      "packages/tokens/src/generate.ts",
    ],
    defect: "packages/styles/src/defect.css",
    finding: "packages/styles/src/defect.css:2: style-lint: ocelle/token-only: margin: raw 4px; use a --ocelle-* token (FR-024)",
    summary: "style-lint: 1 finding in 1 file",
    clean: "style-lint: 1 file checked, no finding",
  },
  {
    id: "csp",
    configs: [],
    defect: "packages/elements/dist/defect.js",
    finding: "packages/elements/dist/defect.js:2: csp: eval: eval() runs a string as code (FR-021)",
    summary: "csp: 1 finding in 1 file",
    clean: "csp: 1 file checked, no finding",
  },
  {
    id: "prefix",
    configs: [],
    defect: "packages/elements/src/defect.ts",
    finding: "packages/elements/src/defect.ts:1: prefix: sk-name: forbidden name sk-button; use the ocelle- prefix (FR-022)",
    summary: "prefix: 1 finding in 1 file",
    clean: "prefix: 1 file checked, no finding",
  },
];

function configsExist(configs: readonly string[]): Record<string, boolean> {
  return Object.fromEntries(configs.map((file) => [file, existsSync(join(repo, file))]));
}

function allExist(configs: readonly string[]): Record<string, boolean> {
  return Object.fromEntries(configs.map((file) => [file, true]));
}

function gate(id: string, args: readonly string[]): ReturnType<typeof runGate> {
  return runGate(`gates/bin/${id}.ts`, args, { cwd: tempDir("cwd"), env: baseEnv() });
}

function output(ran: Awaited<ReturnType<typeof runGate>>): { code: number | null; stdout: string[]; stderr: string[] } {
  return { code: ran.code, stdout: ran.stdout, stderr: ran.stderr };
}

afterEach(cleanUp);

describe.each(treeCases)("$id --root <tmp>", ({ id, configs, defect, finding, summary, clean }) => {
  it(
    "exits 1 with exactly the defect's finding at its repository path",
    async () => {
      expect(configsExist(configs)).toEqual(allExist(configs));
      const root = workspace(`root/${id}/tree`, configs, true);
      expect(output(await gate(id, ["--root", root]))).toEqual({ code: 1, stdout: [finding, summary], stderr: [] });
    },
    timeout,
  );

  it(
    "exits 0 on the same tree without the defect",
    async () => {
      expect(configsExist(configs)).toEqual(allExist(configs));
      const root = workspace(`root/${id}/tree`, configs, true);
      rmSync(join(root, defect));
      expect(output(await gate(id, ["--root", root]))).toEqual({ code: 0, stdout: [clean], stderr: [] });
    },
    timeout,
  );
});

// pins: the fixture is a whole mini-workspace with no dependency whose defect is a lockfile that does not match its
// manifests; the real `pnpm install --frozen-lockfile --lockfile-only --offline` runs end to end (research.md R-14).
describe("pins --root <tmp>", () => {
  it(
    "exits 1 with exactly the lockfile finding",
    async () => {
      const root = workspace("root/pins/tree", [], false);
      expect(output(await gate("pins", ["--root", root]))).toEqual({
        code: 1,
        stdout: [
          "pnpm-lock.yaml: pins: lockfile: pnpm-lock.yaml is not up to date with the manifests; run pnpm install and commit pnpm-lock.yaml",
          "pins: 1 finding in 1 file",
        ],
        stderr: [],
      });
    },
    timeout,
  );

  it(
    "exits 0 with a matching lockfile",
    async () => {
      const root = workspace("root/pins/tree", [], false);
      cpSync(join(repo, "gates/test/fixtures/root/pins/pnpm-lock.yaml"), join(root, "pnpm-lock.yaml"));
      expect(output(await gate("pins", ["--root", root]))).toEqual({
        code: 0,
        stdout: ["pins: 3 manifests checked, no finding"],
        stderr: [],
      });
    },
    timeout,
  );
});

// signoff: git init, an empty base commit signed off by Plant Base, one commit per record of commits.txt, then
// `--range <base commit>..HEAD`; the defect is the second record, which has no sign-off.
describe("signoff --root <tmp> --range <base>..HEAD", () => {
  const records = readFileSync(join(repo, "gates/test/fixtures/root/signoff/commits.txt"), "utf8").split("\n%%\n");

  function commitRepo(count: number): { readonly root: string; readonly base: string; readonly head: string } {
    const root = tempDir("signoff");
    const git = (args: readonly string[], env: Record<string, string> = {}): string =>
      execFileSync("git", ["-c", "commit.gpgsign=false", ...args], { cwd: root, env: { ...baseEnv(), ...env }, encoding: "utf8" }).trim();
    const as = (author: string): Record<string, string> => {
      const [, name = "", email = ""] = /^(.*) <(.*)>$/.exec(author) ?? [];
      return { GIT_AUTHOR_NAME: name, GIT_AUTHOR_EMAIL: email, GIT_COMMITTER_NAME: name, GIT_COMMITTER_EMAIL: email };
    };
    git(["init", "-q", "-b", "main"]);
    git(["commit", "-q", "--allow-empty", "-m", "Plant base\n\nSigned-off-by: Plant Base <base@example.com>"], as("Plant Base <base@example.com>"));
    const base = git(["rev-parse", "HEAD"]);
    for (const record of records.slice(0, count)) {
      const [header = "", ...body] = record.split("\n\n");
      git(["commit", "-q", "--allow-empty", "-m", body.join("\n\n").trim()], as(header.replace(/^author: /, "")));
    }
    return { root, base, head: git(["rev-parse", "HEAD"]) };
  }

  it(
    "exits 1 with exactly the finding of the commit without a sign-off",
    async () => {
      const { root, base, head } = commitRepo(2);
      expect(output(await gate("signoff", ["--root", root, "--range", `${base}..HEAD`]))).toEqual({
        code: 1,
        stdout: [
          `${head}: signoff: no-signoff: no Signed-off-by line for the author Ada Example <ada@example.com>; sign off with git commit -s (FR-023)`,
          "signoff: 1 finding in 2 commits",
        ],
        stderr: [],
      });
    },
    timeout,
  );

  it(
    "exits 0 on the same records without the defect",
    async () => {
      const { root, base } = commitRepo(1);
      expect(output(await gate("signoff", ["--root", root, "--range", `${base}..HEAD`]))).toEqual({
        code: 0,
        stdout: ["signoff: 1 commit checked, no finding"],
        stderr: [],
      });
    },
    timeout,
  );
});
