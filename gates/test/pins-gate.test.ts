import { describe, expect, it } from "vitest";
import { checkFiles, pins } from "../bin/pins.ts";
import type { PinsTools } from "../bin/pins.ts";
import type { Context, Io } from "../lib/cli.ts";

// The pins gate on workspaces in memory (FR-027, research.md R-14; phase 4 review round 1, R1-03): how it finds the
// workspace packages from pnpm-workspace.yaml's `packages`, which manifest is the root, where it runs pnpm, how it
// counts files in its summary, and its arguments. pnpm is a double that answers with a recorded result.
const policy = "minimumReleaseAge: 10080\nminimumReleaseAgeStrict: true\nallowBuilds: {}\n";
const rootManifest = JSON.stringify({ name: "w", private: true, packageManager: "pnpm@12.16.1" });
const success = JSON.stringify({ level: "info", message: "done" });
const outdated = JSON.stringify({ level: "error", code: "ERR_PNPM_OUTDATED_LOCKFILE", message: "outdated" });

function manifest(name: string, dependencies: Record<string, string> = {}): string {
  return JSON.stringify({ name, version: "1.0.0", dependencies });
}

function gate(files: Record<string, string>, args: readonly string[], pnpm: { stdout?: string; stderr?: string; exit?: number } = {}) {
  const out: string[] = [];
  const err: string[] = [];
  const calls: string[] = [];
  const reads: string[] = [];
  const tools: PinsTools = {
    read: (path) => {
      reads.push(path);
      return Promise.resolve(files[path]);
    },
    dirs: (path) => {
      const below = Object.keys(files).filter((file) => file.startsWith(`${path}/`)).map((file) => file.slice(path.length + 1));
      return Promise.resolve([...new Set(below.filter((file) => file.includes("/")).map((file) => String(file.split("/")[0])))].reverse());
    },
    pnpm: (pnpmArgs) => {
      calls.push(pnpmArgs.join(" "));
      return Promise.resolve({ exitCode: pnpm.exit ?? 0, stdout: pnpm.stdout ?? success, stderr: pnpm.stderr ?? "" });
    },
  };
  const io: Io = { cwd: "/w", env: {}, out: (line) => out.push(line), err: (line) => err.push(line) };
  const context: Context = { root: "/w", toolCwd: "/w", args };
  return { done: pins(context, tools, io), out, err, calls, reads };
}

const workspace = (packages: string): Record<string, string> => ({
  "package.json": rootManifest,
  ".node-version": "26.13.0\n",
  "pnpm-workspace.yaml": `packages: ${packages}\n${policy}`,
});

describe("pins: the workspace packages", () => {
  it("lists `<dir>/*` packages and literal package directories, sorted, and skips a directory without package.json", async () => {
    const files = {
      ...workspace("['packages/*', 'tools/cli', 'missing', 'tools/*x']"),
      "packages/b/package.json": manifest("b", { x: "^1" }),
      "packages/a/package.json": manifest("a", { y: "~1" }),
      "packages/empty/README.md": "x",
      "tools/cli/package.json": manifest("cli", { z: "*" }),
    };
    const ran = gate(files, []);
    expect({ code: await ran.done, out: ran.out, err: ran.err }).toEqual({
      code: 1,
      out: [
        'packages/a/package.json: pins: range: dependencies.y is "~1", not an exact version',
        'packages/b/package.json: pins: range: dependencies.x is "^1", not an exact version',
        'tools/cli/package.json: pins: range: dependencies.z is "*", not an exact version',
        "pins: 3 findings in 3 files",
      ],
      err: [],
    });
    expect(ran.reads.filter((path) => path.endsWith("package.json"))).toEqual([
      "package.json",
      "missing/package.json",
      "packages/a/package.json",
      "packages/b/package.json",
      "packages/empty/package.json",
      "tools/*x/package.json",
      "tools/cli/package.json",
    ]);
  });

  it("reads only the root manifest when `packages` is missing or not a list", async () => {
    for (const packages of ["", "packages/*"]) {
      const files = { ...workspace("x"), "pnpm-workspace.yaml": `${packages === "" ? "" : `packages: ${packages}\n`}${policy}`, "packages/a/package.json": manifest("a", { y: "~1" }) };
      const ran = gate(files, []);
      expect({ code: await ran.done, out: ran.out }).toEqual({ code: 0, out: ["pins: 1 manifest checked, no finding"] });
      expect(ran.reads.filter((path) => path.endsWith("package.json"))).toEqual(["package.json"]);
    }
  });

  it("counts the files of its findings: two in one file and one in another are three findings in two files", async () => {
    const files = { ...workspace("['packages/*']"), "packages/a/package.json": manifest("a", { x: "^1", y: "~1" }) };
    const ran = gate(files, [], { exit: 1, stdout: outdated });
    expect({ code: await ran.done, summary: ran.out.at(-1), lines: ran.out.length }).toEqual({ code: 1, summary: "pins: 3 findings in 2 files", lines: 4 });
  });

  it("reads pnpm's error record from its stderr as well", async () => {
    const ran = gate(workspace("[]"), [], { exit: 1, stdout: "", stderr: outdated });
    expect({ code: await ran.done, out: ran.out }).toEqual({
      code: 1,
      out: [
        "pnpm-lock.yaml: pins: lockfile: pnpm-lock.yaml is not up to date with the manifests; run pnpm install and commit pnpm-lock.yaml",
        "pins: 1 finding in 1 file",
      ],
    });
  });
});

describe("pins: --plant", () => {
  it("runs pnpm in the workspace root without --dir when the plant is the root itself", async () => {
    const ran = gate(workspace("[]"), ["--plant", "."]);
    expect({ code: await ran.done, calls: ran.calls }).toEqual({ code: 0, calls: ["install --frozen-lockfile --lockfile-only --offline --reporter=ndjson"] });
  });

  it("reads the plant's files below the plant directory and runs pnpm there", async () => {
    const files = Object.fromEntries(Object.entries(workspace("[]")).map(([path, text]) => [`plants/p/${path}`, text]));
    const ran = gate(files, ["--plant", "plants/p"]);
    expect({ code: await ran.done, out: ran.out, calls: ran.calls }).toEqual({
      code: 0,
      out: ["pins: 1 manifest checked, no finding"],
      calls: ["--dir /w/plants/p install --frozen-lockfile --lockfile-only --offline --reporter=ndjson"],
    });
  });

  it("exits 2 on an empty --plant value", async () => {
    const ran = gate(workspace("[]"), ["--plant", ""]);
    expect({ code: await ran.done, err: ran.err, calls: ran.calls }).toEqual({
      code: 2,
      err: ["pins: could not run: --plant needs a directory; usage: gate:pins [-- --plant <dir>]"],
      calls: [],
    });
  });

  it("exits 2 naming the line of a pnpm-workspace.yaml it cannot read, before running pnpm", async () => {
    const ran = gate({ ...workspace("[]"), "pnpm-workspace.yaml": "packages:\n  - a\n   - b\n" }, []);
    expect({ code: await ran.done, err: ran.err, calls: ran.calls }).toEqual({
      code: 2,
      err: ["pins: could not run: pnpm-workspace.yaml cannot be read (unexpected indentation at - b); fix the file"],
      calls: [],
    });
  });
});

describe("checkFiles: the root manifest", () => {
  it("checks the root manifest's pins only on package.json, and reports them missing when there is no root manifest", () => {
    const result = checkFiles({ manifests: [{ path: "packages/a/package.json", text: manifest("a") }], workspaceYaml: policy, nodeVersion: "26.13.0" });
    expect(result).toEqual({
      findings: [
        {
          location: { path: "package.json" },
          gate: "pins",
          rule: "package-manager",
          message: "packageManager is missing; pin pnpm exactly (pnpm@<major>.<minor>.<patch>)",
        },
      ],
    });
  });

  it("does not count the root manifest as a workspace package", () => {
    const root = JSON.stringify({ name: "a", version: "2.0.0", packageManager: "pnpm@12.16.1" });
    const result = checkFiles({
      manifests: [
        { path: "package.json", text: root },
        { path: "packages/b/package.json", text: manifest("b", { a: "2.0.0" }) },
      ],
      workspaceYaml: policy,
      nodeVersion: "26.13.0",
    });
    expect(result).toEqual({ findings: [] });
  });

  it("names the manifest and the parser's message when a manifest is not valid JSON", () => {
    const result = checkFiles({ manifests: [{ path: "package.json", text: "{" }], workspaceYaml: policy, nodeVersion: "26.13.0" });
    expect(result).toEqual({ cause: `package.json is not valid JSON (${jsonError("{")}); fix the file` });
  });
});

function jsonError(text: string): string {
  try {
    JSON.parse(text);
    return "";
  } catch (error) {
    return (error as Error).message;
  }
}
