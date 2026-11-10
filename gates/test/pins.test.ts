import { readFileSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkFiles, lockfileVerdict, pins } from "../bin/pins.ts";
import type { PinsTools, WorkspaceFiles } from "../bin/pins.ts";
import type { Context, Io } from "../lib/cli.ts";
import type { Finding } from "../lib/findings.ts";

// The pins gate's decision (FR-027, research.md R-14, operator decision FRESH-1-008 (b)), in process: the rules as
// pure functions on the files of the mini-workspace gates/test/fixtures/pins/pass/ (one change per case), the lockfile
// verdict on recorded `pnpm install --frozen-lockfile --lockfile-only --offline --reporter=ndjson` output under
// gates/test/fixtures/pins/pnpm/, and the gate on the fixture with a pnpm double. No real tool starts.
const fixtures = fileURLToPath(new URL("fixtures/pins/", import.meta.url));
const pass = join(fixtures, "pass");

function text(path: string): string {
  return readFileSync(path, "utf8");
}

const rootManifest = JSON.parse(text(join(pass, "package.json"))) as Record<string, unknown>;
const elements = JSON.parse(text(join(pass, "packages/elements/package.json"))) as Record<string, unknown>;
const workspace = text(join(pass, "pnpm-workspace.yaml"));

/** A manifest outside the case under test with one `^` range: the control finding of every accepted case. */
const control = { path: "packages/control/package.json", text: '{ "name": "control", "version": "1.0.0", "dependencies": { "x": "^1.0.0" } }' };

function files(
  change: {
    readonly root?: Record<string, unknown>;
    readonly elements?: Record<string, unknown>;
    readonly workspaceYaml?: string | undefined;
    readonly nodeVersion?: string | undefined;
  },
  withControl = false,
): WorkspaceFiles {
  return {
    manifests: [
      { path: "package.json", text: JSON.stringify(change.root ?? rootManifest, null, 2) },
      { path: "packages/elements/package.json", text: JSON.stringify(change.elements ?? elements, null, 2) },
      { path: "packages/tokens/package.json", text: text(join(pass, "packages/tokens/package.json")) },
      ...(withControl ? [control] : []),
    ],
    workspaceYaml: "workspaceYaml" in change ? change.workspaceYaml : workspace,
    nodeVersion: "nodeVersion" in change ? change.nodeVersion : "26.13.0\n",
  };
}

function finding(path: string, rule: string, message: string): Finding {
  return { location: { path }, gate: "pins", rule, message };
}

const withDev = (spec: string): Record<string, unknown> => ({ ...rootManifest, devDependencies: { jiti: spec, typescript: "6.0.3" } });
const withTokens = (spec: string, field = "dependencies"): Record<string, unknown> => ({
  name: "@ocelle/elements",
  version: "0.0.0",
  private: true,
  [field]: { "@ocelle/tokens": spec },
});
const policy = "packages:\n  - packages/*\nminimumReleaseAge: 10080\nminimumReleaseAgeStrict: true\nallowBuilds: {}\n";

describe("checkFiles", () => {
  const onlyControl = { findings: [finding("packages/control/package.json", "range", 'dependencies.x is "^1.0.0", not an exact version')] };

  it("finds nothing in the fixture workspace (only the control manifest's range)", () => {
    expect(checkFiles(files({}, true))).toEqual(onlyControl);
  });

  it.each([
    { name: "a ^ range", change: { root: withDev("^2.7.0") }, expected: finding("package.json", "range", 'devDependencies.jiti is "^2.7.0", not an exact version') },
    { name: "a ~ range", change: { root: withDev("~2.7.0") }, expected: finding("package.json", "range", 'devDependencies.jiti is "~2.7.0", not an exact version') },
    { name: "a tag", change: { root: withDev("latest") }, expected: finding("package.json", "range", 'devDependencies.jiti is "latest", not an exact version') },
    { name: "a comparator", change: { root: withDev(">=2") }, expected: finding("package.json", "range", 'devDependencies.jiti is ">=2", not an exact version') },
    { name: "an x-range", change: { root: withDev("2.x") }, expected: finding("package.json", "range", 'devDependencies.jiti is "2.x", not an exact version') },
    { name: "a star", change: { root: withDev("*") }, expected: finding("package.json", "range", 'devDependencies.jiti is "*", not an exact version') },
    { name: "an empty version", change: { root: withDev("") }, expected: finding("package.json", "range", 'devDependencies.jiti is "", not an exact version') },
    { name: "a non-string version", change: { root: { ...rootManifest, devDependencies: { jiti: 2 } } }, expected: finding("package.json", "range", 'devDependencies.jiti is "2", not an exact version') },
    { name: "workspace:^", change: { elements: withTokens("workspace:^") }, expected: finding("packages/elements/package.json", "range", 'dependencies.@ocelle/tokens is "workspace:^", not an exact version') },
    { name: "workspace:*", change: { elements: withTokens("workspace:*") }, expected: finding("packages/elements/package.json", "range", 'dependencies.@ocelle/tokens is "workspace:*", not an exact version') },
    { name: "workspace:~", change: { elements: withTokens("workspace:~") }, expected: finding("packages/elements/package.json", "range", 'dependencies.@ocelle/tokens is "workspace:~", not an exact version') },
    { name: "a workspace: version that differs", change: { elements: withTokens("workspace:0.0.1") }, expected: finding("packages/elements/package.json", "workspace", 'dependencies.@ocelle/tokens is "workspace:0.0.1", but @ocelle/tokens is at 0.0.0; write "workspace:0.0.0"') },
    { name: "a workspace package by plain version", change: { elements: withTokens("0.0.0", "peerDependencies") }, expected: finding("packages/elements/package.json", "workspace", 'peerDependencies.@ocelle/tokens is "0.0.0", but @ocelle/tokens is at 0.0.0; write "workspace:0.0.0"') },
    { name: "workspace: on a package outside the workspace", change: { root: { ...rootManifest, optionalDependencies: { jiti: "workspace:2.7.0" } } }, expected: finding("package.json", "workspace", 'optionalDependencies.jiti is "workspace:2.7.0", but jiti is not a workspace package') },
    { name: ".node-version missing", change: { nodeVersion: undefined }, expected: finding(".node-version", "node-version", ".node-version is missing; pin the exact Node version (for example 26.13.0)") },
    { name: ".node-version not exact", change: { nodeVersion: "26\n" }, expected: finding(".node-version", "node-version", '.node-version is "26", not an exact version') },
    { name: "packageManager missing", change: { root: { name: "x", private: true } }, expected: finding("package.json", "package-manager", "packageManager is missing; pin pnpm exactly (pnpm@<major>.<minor>.<patch>)") },
    { name: "packageManager not exact", change: { root: { ...rootManifest, packageManager: "pnpm@12" } }, expected: finding("package.json", "package-manager", 'packageManager is "pnpm@12", not an exact pnpm version') },
    { name: "packageManager not pnpm", change: { root: { ...rootManifest, packageManager: "yarn@4.0.0" } }, expected: finding("package.json", "package-manager", 'packageManager is "yarn@4.0.0", not an exact pnpm version') },
    { name: "minimumReleaseAge missing", change: { workspaceYaml: policy.replace("minimumReleaseAge: 10080\n", "") }, expected: finding("pnpm-workspace.yaml", "release-age", "minimumReleaseAge is missing; set it to at least 10080 (7 days)") },
    { name: "minimumReleaseAge below 7 days", change: { workspaceYaml: policy.replace("10080", "1440") }, expected: finding("pnpm-workspace.yaml", "release-age", "minimumReleaseAge is 1440, below 10080 (7 days)") },
    { name: "minimumReleaseAge not a number", change: { workspaceYaml: policy.replace("10080", '"10080"') }, expected: finding("pnpm-workspace.yaml", "release-age", 'minimumReleaseAge is "10080", not a number; set it to at least 10080 (7 days)') },
    { name: "minimumReleaseAgeStrict missing", change: { workspaceYaml: policy.replace("minimumReleaseAgeStrict: true\n", "") }, expected: finding("pnpm-workspace.yaml", "release-age", "minimumReleaseAgeStrict is missing; set it to true") },
    { name: "minimumReleaseAgeStrict false", change: { workspaceYaml: policy.replace("Strict: true", "Strict: false") }, expected: finding("pnpm-workspace.yaml", "release-age", "minimumReleaseAgeStrict is false; set it to true") },
    { name: "a minimumReleaseAgeExclude entry", change: { workspaceYaml: `${policy}minimumReleaseAgeExclude:\n  - jiti\n` }, expected: finding("pnpm-workspace.yaml", "release-age", "minimumReleaseAgeExclude lists jiti; remove the exclusion") },
    { name: "allowBuilds missing", change: { workspaceYaml: policy.replace("allowBuilds: {}\n", "") }, expected: finding("pnpm-workspace.yaml", "allow-builds", "allowBuilds is missing; set it to {} (no dependency may run an install script)") },
    { name: "an allowBuilds entry true", change: { workspaceYaml: policy.replace("allowBuilds: {}", "allowBuilds:\n  esbuild: true\n  sharp: false") }, expected: finding("pnpm-workspace.yaml", "allow-builds", "allowBuilds lets esbuild run install scripts; remove the entry") },
    { name: "rs-module-lexer without its version (005 R-16)", change: { workspaceYaml: policy.replace("allowBuilds: {}", 'allowBuilds:\n  rs-module-lexer: true\n  "fsevents@2.3.3": true') }, expected: finding("pnpm-workspace.yaml", "allow-builds", "allowBuilds lets rs-module-lexer run install scripts; remove the entry") },
    { name: "fsevents without its version (005 R-16)", change: { workspaceYaml: policy.replace("allowBuilds: {}", 'allowBuilds:\n  "rs-module-lexer@2.9.0": true\n  fsevents: true') }, expected: finding("pnpm-workspace.yaml", "allow-builds", "allowBuilds lets fsevents run install scripts; remove the entry") },
    { name: "rs-module-lexer at another version (005 R-16)", change: { workspaceYaml: policy.replace("allowBuilds: {}", 'allowBuilds:\n  "rs-module-lexer@2.9.1": true\n  "fsevents@2.3.3": true') }, expected: finding("pnpm-workspace.yaml", "allow-builds", "allowBuilds lets rs-module-lexer@2.9.1 run install scripts; remove the entry") },
    { name: "dangerouslyAllowAllBuilds", change: { workspaceYaml: `${policy}dangerouslyAllowAllBuilds: true\n` }, expected: finding("pnpm-workspace.yaml", "allow-builds", "dangerouslyAllowAllBuilds is set; remove it") },
    { name: "shamefullyHoist", change: { workspaceYaml: `${policy}shamefullyHoist: true\n` }, expected: finding("pnpm-workspace.yaml", "hoisting", "shamefullyHoist is true; remove it") },
    { name: "a non-empty publicHoistPattern", change: { workspaceYaml: `${policy}publicHoistPattern:\n  - "*eslint*"\n` }, expected: finding("pnpm-workspace.yaml", "hoisting", "publicHoistPattern is not empty (*eslint*); remove it") },
    { name: "nodeLinker hoisted", change: { workspaceYaml: `${policy}nodeLinker: hoisted\n` }, expected: finding("pnpm-workspace.yaml", "hoisting", "nodeLinker is hoisted; use isolated") },
  ])("reports $name", ({ change, expected }) => {
    expect(checkFiles(files(change))).toEqual({ findings: [expected] });
  });

  it.each([
    { name: "an exact pre-release", change: { root: withDev("2.7.0-rc.1") } },
    { name: "an exact version with build metadata", change: { root: withDev("2.7.0+build.5") } },
    { name: "packageManager with a hash", change: { root: { ...rootManifest, packageManager: "pnpm@12.16.1+sha512.abcdef" } } },
    { name: ".node-version with a v", change: { nodeVersion: "v26.13.0" } },
    { name: "an allowBuilds entry false", change: { workspaceYaml: policy.replace("allowBuilds: {}", "allowBuilds:\n  esbuild: false") } },
    { name: "the approved builds rs-module-lexer@2.9.0 and fsevents@2.3.3 (005 R-16)", change: { workspaceYaml: policy.replace("allowBuilds: {}", 'allowBuilds:\n  esbuild: false\n  "rs-module-lexer@2.9.0": true\n  "fsevents@2.3.3": true') } },
    { name: "an empty publicHoistPattern", change: { workspaceYaml: `${policy}publicHoistPattern: []\nshamefullyHoist: false\n` } },
    { name: "nodeLinker isolated", change: { workspaceYaml: `${policy}nodeLinker: isolated\n` } },
    { name: "a quoted and commented policy", change: { workspaceYaml: "# policy\npackages: ['packages/*']\nminimumReleaseAge: 20160 # 14 days\nminimumReleaseAgeStrict: true\nallowBuilds: { }\nminimumReleaseAgeExclude: []\n" } },
  ])("accepts $name (only the control manifest's range)", ({ change }) => {
    expect(checkFiles(files(change, true))).toEqual(onlyControl);
  });

  it("reports every rule a workspace breaks, in file order", () => {
    const result = checkFiles(files({ root: { name: "x", devDependencies: { jiti: "^2" } }, nodeVersion: undefined, workspaceYaml: undefined }));
    expect(result).toEqual({
      findings: [
        finding("package.json", "range", 'devDependencies.jiti is "^2", not an exact version'),
        finding("package.json", "package-manager", "packageManager is missing; pin pnpm exactly (pnpm@<major>.<minor>.<patch>)"),
        finding(".node-version", "node-version", ".node-version is missing; pin the exact Node version (for example 26.13.0)"),
        finding("pnpm-workspace.yaml", "release-age", "minimumReleaseAge is missing; set it to at least 10080 (7 days)"),
        finding("pnpm-workspace.yaml", "release-age", "minimumReleaseAgeStrict is missing; set it to true"),
        finding("pnpm-workspace.yaml", "allow-builds", "allowBuilds is missing; set it to {} (no dependency may run an install script)"),
      ],
    });
  });

  it("returns the cause when a manifest is not valid JSON", () => {
    const broken: WorkspaceFiles = { ...files({}), manifests: [{ path: "packages/tokens/package.json", text: '{\n  "name": ' }] };
    const result = checkFiles(broken);
    expect(result).toEqual({ cause: expect.stringMatching(/^packages\/tokens\/package\.json is not valid JSON \(.+\); fix the file$/) as unknown });
  });

  it.each([
    "minimumReleaseAge: [10080\n",
    "packages:\n  - a\n   - b\n",
    "anchors: &a 1\n",
    "  indented: 1\n",
    "no colon here\n",
  ])("returns the cause when pnpm-workspace.yaml cannot be read: %j", (yaml) => {
    const result = checkFiles(files({ workspaceYaml: yaml }));
    expect(result).toEqual({ cause: expect.stringMatching(/^pnpm-workspace\.yaml cannot be read \(.+\); fix the file$/) as unknown });
  });
});

describe("lockfileVerdict", () => {
  const recorded = (name: string): string => text(join(fixtures, "pnpm", name));

  it("finds nothing when the frozen install succeeds, and reports an outdated lockfile as a finding about pnpm-lock.yaml", () => {
    const success = lockfileVerdict({ exitCode: 0, output: recorded("success.ndjson") });
    const outdated = lockfileVerdict({ exitCode: 1, output: recorded("outdated-lockfile.ndjson") });
    expect([success, outdated]).toEqual([
      { findings: [] },
      {
        findings: [
          finding("pnpm-lock.yaml", "lockfile", "pnpm-lock.yaml is not up to date with the manifests; run pnpm install and commit pnpm-lock.yaml"),
        ],
      },
    ]);
  });

  it("returns the cause of any other pnpm failure", () => {
    expect(lockfileVerdict({ exitCode: 1, output: recorded("no-offline-meta.ndjson") })).toEqual({
      cause:
        "pnpm install --frozen-lockfile --lockfile-only --offline failed: ERR_PNPM_META_FETCH_FAIL: installing dependencies: " +
        "ERR_PNPM_NO_OFFLINE_META: Failed to resolve jiti in package mirror " +
        "/cache/v12/metadata-full/https%3A+registry.npmjs.org/jiti.jsonl; run pnpm run setup:online",
    });
  });

  it.each([
    { exitCode: 1, output: "not json\n" },
    { exitCode: null, output: "" },
  ])("returns the cause when pnpm fails without an error record (exit $exitCode)", ({ exitCode, output }) => {
    expect(lockfileVerdict({ exitCode, output })).toEqual({
      cause: `pnpm install --frozen-lockfile --lockfile-only --offline failed (exit ${String(exitCode)}); run pnpm run setup:online`,
    });
  });
});

describe("pins (the gate, with a pnpm double)", () => {
  const install = "install --frozen-lockfile --lockfile-only --offline --reporter=ndjson";

  function gate(root: string, args: readonly string[], pnpmOutput: string, pnpmExit: number) {
    const out: string[] = [];
    const err: string[] = [];
    const calls: string[] = [];
    const io: Io = { cwd: root, env: {}, out: (l) => out.push(l), err: (l) => err.push(l) };
    const context: Context = { root, toolCwd: root, args };
    const tools: PinsTools = {
      read: (path) => readFile(resolve(root, path), "utf8").catch(() => undefined),
      dirs: async (path) => {
        const entries = await readdir(resolve(root, path), { withFileTypes: true }).catch(() => []);
        return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
      },
      pnpm: (pnpmArgs) => {
        calls.push(pnpmArgs.join(" "));
        return Promise.resolve({ exitCode: pnpmExit, stdout: pnpmOutput, stderr: "" });
      },
    };
    return { done: pins(context, tools, io), out, err, calls };
  }

  it("exits 0 naming the manifests checked, after one frozen lockfile-only offline install", async () => {
    const ran = gate(pass, [], text(join(fixtures, "pnpm/success.ndjson")), 0);
    expect({ code: await ran.done, out: ran.out, err: ran.err, calls: ran.calls }).toEqual({
      code: 0,
      out: ["pins: 3 manifests checked, no finding"],
      err: [],
      calls: [install],
    });
  });

  it("exits 1 on an outdated lockfile", async () => {
    const ran = gate(pass, ["--"], text(join(fixtures, "pnpm/outdated-lockfile.ndjson")), 1);
    expect({ code: await ran.done, out: ran.out, err: ran.err }).toEqual({
      code: 1,
      out: [
        "pnpm-lock.yaml: pins: lockfile: pnpm-lock.yaml is not up to date with the manifests; run pnpm install and commit pnpm-lock.yaml",
        "pins: 1 finding in 1 file",
      ],
      err: [],
    });
  });

  it("checks a plant's mini-workspace with --plant, naming its files relative to it, and runs pnpm there", async () => {
    const ran = gate(fixtures, ["--plant", pass], text(join(fixtures, "pnpm/success.ndjson")), 0);
    expect({ code: await ran.done, out: ran.out, err: ran.err, calls: ran.calls }).toEqual({
      code: 0,
      out: ["pins: 3 manifests checked, no finding"],
      err: [],
      calls: [`--dir ${pass} ${install}`],
    });
  });

  it("exits 2 on a manifest that is not valid JSON, before running pnpm", async () => {
    const ran = gate(join(fixtures, "invalid-json"), [], "", 0);
    const code = await ran.done;
    expect({ code, out: ran.out, calls: ran.calls }).toEqual({ code: 2, out: [], calls: [] });
    expect(ran.err).toEqual([expect.stringMatching(/^pins: could not run: packages\/tokens\/package\.json is not valid JSON \(.+\); fix the file$/) as unknown]);
  });

  it("exits 2 when the root has no package.json", async () => {
    const ran = gate(join(fixtures, "pnpm"), [], "", 0);
    expect({ code: await ran.done, out: ran.out, err: ran.err, calls: ran.calls }).toEqual({
      code: 2,
      out: [],
      err: ["pins: could not run: package.json is missing; run the gate in the workspace root"],
      calls: [],
    });
  });

  it("exits 2 when pnpm fails for another reason", async () => {
    const ran = gate(pass, [], text(join(fixtures, "pnpm/no-offline-meta.ndjson")), 1);
    expect({ code: await ran.done, out: ran.out }).toEqual({ code: 2, out: [] });
    expect(ran.err).toEqual([expect.stringMatching(/^pins: could not run: pnpm install .* failed: ERR_PNPM_META_FETCH_FAIL: /) as unknown]);
  });

  it.each([
    { args: ["--plant"], problem: "--plant needs a directory" },
    { args: ["--bogus"], problem: "unknown argument --bogus" },
  ])("exits 2 on the arguments $args", async ({ args, problem }) => {
    const ran = gate(pass, args, "", 0);
    expect({ code: await ran.done, out: ran.out, err: ran.err }).toEqual({
      code: 2,
      out: [],
      err: [`pins: could not run: ${problem}; usage: gate:pins [-- --plant <dir>]`],
    });
  });
});
