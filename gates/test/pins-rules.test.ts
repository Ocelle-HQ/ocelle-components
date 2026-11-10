import { describe, expect, it } from "vitest";
import type { Finding } from "../lib/findings.ts";
import { dependencyFindings, lockfileVerdict, pinFindings, show, workspaceFindings } from "../lib/pins-rules.ts";

// The pins rules one at a time (FR-027, research.md R-14; phase 4 review round 1, R1-03): each version pattern with
// text before or after the version and with multi-digit parts, dependency fields that are not maps, a workspace
// package by its exact version, every list a message joins, and pnpm's ndjson log with lines that are not error records.
function finding(path: string, rule: string, message: string): Finding {
  return { location: { path }, gate: "pins", rule, message };
}

const siblings = new Map([["@ocelle/tokens", "10.20.30"]]);
const policy = { minimumReleaseAge: 10080, minimumReleaseAgeStrict: true, allowBuilds: {} };

describe("dependencyFindings", () => {
  const range = (spec: string): Finding[] => [finding("package.json", "range", `dependencies.x is "${spec}", not an exact version`)];

  it.each(["1.2.3", "10.20.30", "1.2.3-rc.1", "1.2.3-0", "1.2.3+build.5", "1.2.3-alpha-beta.1+sha.f00", "0.0.0"])("accepts the exact version %s", (spec) => {
    expect(dependencyFindings("package.json", { dependencies: { x: spec } }, siblings)).toEqual([]);
  });

  it.each(["v1.2.3", "x1.2.3", "1.2.3x", " 1.2.3", "1.2.3 ", "1.2", "1.2.3.4", "1.2.3-", "1.2.3+", "1.2.3-rc_1", "1.2.3+b_1", "^10.20.30", "a.b.c", "1..3"])(
    "reports %j as not exact",
    (spec) => {
      expect(dependencyFindings("package.json", { dependencies: { x: spec } }, siblings)).toEqual(range(spec));
    },
  );

  it("skips a dependency field that is not a map", () => {
    expect(dependencyFindings("package.json", { dependencies: "x", devDependencies: null, peerDependencies: 3 }, siblings)).toEqual([]);
  });

  it("checks every dependency field, in order", () => {
    const manifest = { peerDependencies: { d: "^1" }, optionalDependencies: { c: "~1" }, devDependencies: { b: "*" }, dependencies: { a: "latest" } };
    expect(dependencyFindings("p/package.json", manifest, siblings).map((found) => found.message)).toEqual([
      'dependencies.a is "latest", not an exact version',
      'devDependencies.b is "*", not an exact version',
      'optionalDependencies.c is "~1", not an exact version',
      'peerDependencies.d is "^1", not an exact version',
    ]);
  });

  it("accepts a workspace package as workspace:<its version>, and nothing else for it", () => {
    const check = (spec: string): Finding[] => dependencyFindings("e/package.json", { dependencies: { "@ocelle/tokens": spec } }, siblings);
    const differs = (spec: string): Finding[] => [
      finding("e/package.json", "workspace", `dependencies.@ocelle/tokens is "${spec}", but @ocelle/tokens is at 10.20.30; write "workspace:10.20.30"`),
    ];
    expect(check("workspace:10.20.30")).toEqual([]);
    expect(check("workspace:10.20.3")).toEqual(differs("workspace:10.20.3"));
    expect(check("10.20.30")).toEqual(differs("10.20.30"));
    expect(check("npm:workspace:10.20.30")).toEqual(differs("npm:workspace:10.20.30"));
    expect(check("workspace:10.20.30x")).toEqual([finding("e/package.json", "range", 'dependencies.@ocelle/tokens is "workspace:10.20.30x", not an exact version')]);
  });

  it("reports workspace: on a package outside the workspace even when its version is exact", () => {
    expect(dependencyFindings("package.json", { devDependencies: { jiti: "workspace:2.7.0" } }, siblings)).toEqual([
      finding("package.json", "workspace", 'devDependencies.jiti is "workspace:2.7.0", but jiti is not a workspace package'),
    ]);
  });
});

describe("pinFindings", () => {
  const manager = (value: string): Finding[] => [finding("package.json", "package-manager", `packageManager is "${value}", not an exact pnpm version`)];
  const node = (value: string): Finding[] => [finding(".node-version", "node-version", `.node-version is "${value}", not an exact version`)];

  it.each(["pnpm@12.16.1", "pnpm@10.20.30", "pnpm@12.16.1+sha512.abc-DEF_1.2"])("accepts packageManager %s", (value) => {
    expect(pinFindings({ packageManager: value }, "26.13.0")).toEqual([]);
  });

  it.each(["xpnpm@12.16.1", "pnpm@12.16.1x", "pnpm@12.16", "pnpm@12.16.1+", "pnpm@12.16.1+sha 1", "npm@12.16.1", "pnpm12.16.1"])("reports packageManager %s", (value) => {
    expect(pinFindings({ packageManager: value }, "26.13.0")).toEqual(manager(value));
  });

  it("shows a packageManager that is not a string as written", () => {
    expect(pinFindings({ packageManager: { pnpm: 12 } }, "26.13.0")).toEqual(manager('{"pnpm":12}'));
  });

  it.each(["26.13.0", "v26.13.0", "10.20.30", " 26.13.0\n"])("accepts .node-version %j", (value) => {
    expect(pinFindings({ packageManager: "pnpm@12.16.1" }, value)).toEqual([]);
  });

  it.each([
    ["x26.13.0", "x26.13.0"],
    ["26.13.0x", "26.13.0x"],
    ["vv26.13.0", "vv26.13.0"],
    ["26.13", "26.13"],
    ["26.13.0-rc.1", "26.13.0-rc.1"],
    ["lts/*\n", "lts/*"],
  ])(".node-version %j is not exact", (value, shown) => {
    expect(pinFindings({ packageManager: "pnpm@12.16.1" }, value)).toEqual(node(shown));
  });
});

describe("workspaceFindings", () => {
  const at = (rule: string, message: string): Finding => finding("pnpm-workspace.yaml", rule, message);

  it("accepts the policy, at and above the release age bound", () => {
    expect([workspaceFindings(policy), workspaceFindings({ ...policy, minimumReleaseAge: 20160 })]).toEqual([[], []]);
  });

  it("reports a release age one minute short, and one that is not a number", () => {
    expect(workspaceFindings({ ...policy, minimumReleaseAge: 10079 })).toEqual([at("release-age", "minimumReleaseAge is 10079, below 10080 (7 days)")]);
    expect(workspaceFindings({ ...policy, minimumReleaseAge: null })).toEqual([
      at("release-age", 'minimumReleaseAge is "null", not a number; set it to at least 10080 (7 days)'),
    ]);
  });

  it("reports minimumReleaseAgeStrict that is not true, shown as written", () => {
    expect(workspaceFindings({ ...policy, minimumReleaseAgeStrict: "true" })).toEqual([at("release-age", "minimumReleaseAgeStrict is true; set it to true")]);
    expect(workspaceFindings({ ...policy, minimumReleaseAgeStrict: [true] })).toEqual([at("release-age", "minimumReleaseAgeStrict is [true]; set it to true")]);
  });

  it("names every minimumReleaseAgeExclude entry, and accepts an empty or non-list value", () => {
    expect(workspaceFindings({ ...policy, minimumReleaseAgeExclude: ["jiti", "vite"] })).toEqual([
      at("release-age", "minimumReleaseAgeExclude lists jiti, vite; remove the exclusion"),
    ]);
    expect([workspaceFindings({ ...policy, minimumReleaseAgeExclude: [] }), workspaceFindings({ ...policy, minimumReleaseAgeExclude: "jiti" })]).toEqual([[], []]);
  });

  it("names every allowBuilds entry set to true, in a map or a list, and finds an allowBuilds that is null present", () => {
    expect(workspaceFindings({ ...policy, allowBuilds: { esbuild: true, sharp: false, swc: true } })).toEqual([
      at("allow-builds", "allowBuilds lets esbuild run install scripts; remove the entry"),
      at("allow-builds", "allowBuilds lets swc run install scripts; remove the entry"),
    ]);
    expect(workspaceFindings({ ...policy, allowBuilds: ["esbuild"] })).toEqual([at("allow-builds", "allowBuilds lets esbuild run install scripts; remove the entry")]);
    expect([workspaceFindings({ ...policy, allowBuilds: null }), workspaceFindings({ ...policy, allowBuilds: "esbuild" })]).toEqual([[], []]);
  });

  // 005 research.md R-16 (operator decision 2026-11-10): exactly rs-module-lexer@2.9.0 and fsevents@2.3.3 may be true;
  // either package without its version, at another version, any other package, and a list entry stay findings.
  it("accepts exactly the approved builds rs-module-lexer@2.9.0 and fsevents@2.3.3 set to true, beside false entries", () => {
    expect(workspaceFindings({ ...policy, allowBuilds: { "rs-module-lexer@2.9.0": true, "fsevents@2.3.3": true, esbuild: false } })).toEqual([]);
    expect(workspaceFindings({ ...policy, allowBuilds: { "rs-module-lexer@2.9.0": true, esbuild: true } })).toEqual([
      at("allow-builds", "allowBuilds lets esbuild run install scripts; remove the entry"),
    ]);
  });

  it.each(["rs-module-lexer", "fsevents", "rs-module-lexer@2.9.1", "fsevents@2.3.2", "rs-module-lexer@2.9.0 ", "@xn-sakina/rml-wasm@2.9.0", "rs-module-lexer@2.9", "fsevents@2.3.3.0"])(
    "names the allowBuilds entry %j set to true beside the approved ones",
    (name) => {
      expect(workspaceFindings({ ...policy, allowBuilds: { "rs-module-lexer@2.9.0": true, [name]: true, "fsevents@2.3.3": true } })).toEqual([
        at("allow-builds", `allowBuilds lets ${name} run install scripts; remove the entry`),
      ]);
    },
  );

  it("names an approved build in the list form, which approves no build", () => {
    expect(workspaceFindings({ ...policy, allowBuilds: ["rs-module-lexer@2.9.0", "fsevents@2.3.3"] })).toEqual([
      at("allow-builds", "allowBuilds lets rs-module-lexer@2.9.0 run install scripts; remove the entry"),
      at("allow-builds", "allowBuilds lets fsevents@2.3.3 run install scripts; remove the entry"),
    ]);
  });

  it("reports dangerouslyAllowAllBuilds set to anything", () => {
    expect(workspaceFindings({ ...policy, dangerouslyAllowAllBuilds: false })).toEqual([at("allow-builds", "dangerouslyAllowAllBuilds is set; remove it")]);
  });

  it("reports hoisting: shamefullyHoist true, every publicHoistPattern entry, any nodeLinker but isolated", () => {
    expect(workspaceFindings({ ...policy, shamefullyHoist: true, publicHoistPattern: ["*eslint*", "*types*"], nodeLinker: "pnp" })).toEqual([
      at("hoisting", "shamefullyHoist is true; remove it"),
      at("hoisting", "publicHoistPattern is not empty (*eslint*, *types*); remove it"),
      at("hoisting", "nodeLinker is pnp; use isolated"),
    ]);
    expect(workspaceFindings({ ...policy, shamefullyHoist: "true", publicHoistPattern: "*", nodeLinker: "isolated" })).toEqual([]);
  });
});

describe("show", () => {
  it("writes a scalar as text and a collection as JSON", () => {
    expect([show(1), show(null), show(true), show("x"), show([1, "a"]), show({ a: 1 })]).toEqual(["1", "null", "true", "x", '[1,"a"]', '{"a":1}']);
  });
});

describe("lockfileVerdict", () => {
  const command = "pnpm install --frozen-lockfile --lockfile-only --offline";

  it("reads the first error record, past lines that are not JSON and records of other levels", () => {
    const output = [
      "progress text",
      JSON.stringify({ level: "info", code: "ERR_PNPM_OUTDATED_LOCKFILE", message: "not this" }),
      "null",
      JSON.stringify({ level: "error", code: "ERR_PNPM_OUTDATED_LOCKFILE", message: "outdated" }),
      JSON.stringify({ level: "error", code: "ERR_OTHER", message: "later" }),
    ].join("\n");
    expect(lockfileVerdict({ exitCode: 1, output })).toEqual({
      findings: [finding("pnpm-lock.yaml", "lockfile", "pnpm-lock.yaml is not up to date with the manifests; run pnpm install and commit pnpm-lock.yaml")],
    });
  });

  it("names another error by its code and the first line of its message, trimmed", () => {
    const output = JSON.stringify({ level: "error", code: "ERR_PNPM_X", message: "  first line \r\nsecond line" });
    expect(lockfileVerdict({ exitCode: 1, output })).toEqual({ cause: `${command} failed: ERR_PNPM_X: first line; run pnpm run setup:online` });
  });

  it("finds nothing at exit 0 even when the log holds an error record", () => {
    const output = JSON.stringify({ level: "error", code: "ERR_PNPM_OUTDATED_LOCKFILE", message: "x" });
    expect(lockfileVerdict({ exitCode: 0, output })).toEqual({ findings: [] });
  });

  it("names the exit code when pnpm fails without an error record", () => {
    expect(lockfileVerdict({ exitCode: 3, output: JSON.stringify({ level: "warn", code: "W", message: "m" }) })).toEqual({
      cause: `${command} failed (exit 3); run pnpm run setup:online`,
    });
  });
});
