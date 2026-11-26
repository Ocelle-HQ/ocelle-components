import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { estimateTestSeconds, planTestShards, validTestPlan, verifyTestShards } from "../lib/test-evidence.ts";

const revision = "a".repeat(40);
const alpha = { project: "gates", file: "gates/test/alpha.test.ts" };
const beta = { project: "gates", file: "gates/test/beta.test.ts" };
const manifest = { revision, inventory: [alpha, beta], shards: [[alpha], [beta]] };
const passed = { name: "proves the result", state: "passed", errors: [] };
const error = { name: "Error", message: "runner failed" };
const alphaResult = { ...alpha, state: "passed", errors: [], durationMs: 0, tests: [passed] };
const betaResult = { ...beta, state: "passed", errors: [], durationMs: 1, tests: [passed] };
const firstShard = { revision, index: 0, errors: [], files: [alphaResult] };
const secondShard = { revision, index: 1, errors: [], files: [betaResult] };
const measuredFiles = [
  { project: "gates-integration", file: "gates/test/integration/visual.test.ts", seconds: 900 },
  { project: "gates-integration", file: "gates/test/integration/visual-findings.test.ts", seconds: 900 },
  { project: "gates-integration", file: "gates/test/integration/visual-cli.test.ts", seconds: 30 },
  { project: "gates-integration", file: "gates/test/integration/visual-capture.test.ts", seconds: 880 },
  { project: "gates-integration", file: "gates/test/integration/axe.test.ts", seconds: 530 },
  { project: "elements-browser", file: "packages/elements/test/browser/drawer.test.ts", seconds: 349 },
  { project: "elements (chromium)", file: "packages/elements/test/drawer.test.ts", seconds: 332 },
  { project: "elements-browser", file: "packages/elements/test/browser/dialog.test.ts", seconds: 309 },
  { project: "elements (chromium)", file: "packages/elements/test/dialog.test.ts", seconds: 293 },
  { project: "elements-browser", file: "packages/elements/test/browser/notice.test.ts", seconds: 193 },
  { project: "storybook-integration", file: "storybook/test/integration/elements-stories.test.ts", seconds: 192 },
  { project: "elements-browser", file: "packages/elements/test/browser/button.test.ts", seconds: 155 },
];

const visualCasesByFile = {
  "visual.test.ts": [
    "captures the repository's <inventory> story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)",
  ],
  "visual-findings.test.ts": [
    "keeps the capture, its diff image and run 1 in baseline layout for differs and missing-baseline, and nothing for any other story-theme (FR-005, analysis G2)",
  ],
  "visual-cli.test.ts": [
    "exits 2 for the host engine, naming the capture's refusal (FR-009, US2 scenario 7)",
    "exits 2 naming a missing engine, and in CI refuses a single engine (research.md R-06)",
    "reads the options after the -- that pnpm run passes on",
    "exits 2 naming skopeo when PATH holds podman but no skopeo, and runs no podman command",
    "exits 2 naming both engines when --remove-docker-image comes with docker alone, and runs no docker command",
  ],
  "visual-capture.test.ts": [
    "writes nothing on an unchanged tree and says so (FR-008, analysis G1)",
    "the plant mode writes a deleted baseline of a plant back with the bytes it had, and touches no other file (research.md R-11)",
    "captures a story alone byte for byte as in a full run after other stories (freshness, FR-028), and a 2000 px story 2000 px tall (FR-012)",
    "differs between two screenshots with reduced motion and animations left at Playwright's defaults, and agrees with the capture's options",
  ],
};

function visualCaseNames(source: string): string[] {
  return [...source.matchAll(/^\s*it\(\s*"([^"\n]+)"/gm)].map(([, name]) =>
    (name ?? "").replace(/repository's \d+ story-themes/, "repository's <inventory> story-themes"),
  );
}

describe("unit test shard plans", () => {
  it("keeps the eleven Visual scenarios in independently planned integration files", () => {
    const integration = new URL("./integration/", import.meta.url);
    const files = readdirSync(integration)
      .filter((name) => /^visual(?:-[a-z-]+)?\.test\.ts$/.test(name))
      .map((name) => ({ name, entry: { project: "gates-integration", file: "gates/test/integration/" + name } }));
    const cases = Object.fromEntries(files.map(({ name, entry }) => {
      const expected = measuredFiles.find((row) => row.project === entry.project && row.file === entry.file);
      const names = estimateTestSeconds(entry) === expected?.seconds
        ? visualCaseNames(readFileSync(new URL(name, integration), "utf8"))
        : [];
      return [name, names];
    }));
    expect(cases).toEqual(visualCasesByFile);

    const inventory = files.map(({ entry }) => entry);
    const planned = planTestShards(revision, inventory, 4);
    expect(planned.shards).toEqual(expect.arrayContaining(inventory.map((file) => [file])));
    expect(planned.shards).toHaveLength(inventory.length);
  });

  it.each([
    ["40 hexadecimal characters", revision],
    ["64 hexadecimal characters", "b".repeat(64)],
  ])("accepts revisions with %s", (_, sha) => {
    const result = planTestShards(sha, [alpha, beta], 2);
    expect(result).toEqual({ ...manifest, revision: sha });
    expect(validTestPlan(result, sha)).toBe(true);
  });

  it("accepts a single shard for a nonempty suite", () => {
    expect(planTestShards(revision, [alpha, beta], 1)).toEqual({ ...manifest, shards: [[alpha, beta]] });
  });

  it.each([
    ["a short revision", "a"],
    ["an almost full revision", "a".repeat(39)],
    ["a revision with a prefix", `g${revision}`],
    ["a revision with a suffix", `${revision}g`],
    ["a 40-character nonhex revision", "g".repeat(40)],
    ["a 64-character nonhex revision", "g".repeat(64)],
  ])("rejects %s before planning or verifying", (_, sha) => {
    expect(() => planTestShards(sha, [alpha, beta], 2))
      .toThrow(new Error("invalid revision, shard count, or test inventory"));
    expect(validTestPlan({ ...manifest, revision: sha }, sha)).toBe(false);
  });

  it.each([0, -1, 1.5, 3])("rejects an invalid shard count of %s", (count) => {
    expect(() => planTestShards(revision, [alpha, beta], count))
      .toThrow(new Error("invalid revision, shard count, or test inventory"));
  });

  it("rejects duplicate planned test identities", () => {
    expect(() => planTestShards(revision, [alpha, alpha], 2))
      .toThrow(new Error("invalid revision, shard count, or test inventory"));
  });

  it("rejects a mixed inventory even when only one path leaves the workspace", () => {
    const outside = { ...beta, file: "../out-of-tree.test.ts" };
    expect(() => planTestShards(revision, [alpha, outside], 1))
      .toThrow(new Error("invalid revision, shard count, or test inventory"));
  });

  it.each([
    { label: "absent project", item: { file: alpha.file } },
    { label: "non-string project", item: { ...alpha, project: { length: 1 } } },
    { label: "empty project", item: { ...alpha, project: "" } },
    { label: "absent file", item: { project: alpha.project } },
    { label: "non-string file", item: { ...alpha, file: 1 } },
    { label: "empty file", item: { ...alpha, file: "" } },
    { label: "absolute file", item: { ...alpha, file: "/gates/test/alpha.test.ts" } },
    { label: "file outside the workspace", item: { ...alpha, file: "../gates/test/alpha.test.ts" } },
    { label: "unnormalized file", item: { ...alpha, file: "gates/test/../test/alpha.test.ts" } },
    { label: "null entry", item: null },
    { label: "array entry", item: Object.assign([], alpha) },
  ])("rejects an inventory or shard containing a $label", ({ item }) => {
    expect(validTestPlan({ ...manifest, inventory: [alpha, item], shards: [[alpha, item]] }, revision)).toBe(false);
    expect(validTestPlan({ ...manifest, shards: [[alpha], [beta, item]] }, revision)).toBe(false);
  });

  it.each([
    { label: "absent plan", plan: undefined },
    { label: "an array posing as a plan", plan: Object.assign([], manifest) },
    { label: "different plan revision", plan: { ...manifest, revision: "b".repeat(40) } },
    { label: "non-array inventory", plan: { ...manifest, inventory: alpha } },
    { label: "empty inventory", plan: { ...manifest, inventory: [], shards: [[]] } },
    { label: "duplicate inventory", plan: { ...manifest, inventory: [alpha, alpha], shards: [[alpha], [alpha]] } },
    { label: "non-array shard collection", plan: { ...manifest, shards: null } },
    { label: "empty shard collection", plan: { ...manifest, inventory: [], shards: [] } },
    { label: "non-array shard assignment", plan: { ...manifest, shards: [[alpha], beta] } },
    { label: "empty shard assignment", plan: { ...manifest, shards: [[alpha, beta], []] } },
  ])("rejects $label before reading any results", ({ plan }) => {
    expect(validTestPlan(plan, revision)).toBe(false);
    expect(() => verifyTestShards(plan, undefined, revision))
      .toThrow(new Error("invalid plan inventory or revision"));
  });

  it("balances build, browser and node tests using their expected cost", () => {
    const build = { project: "elements-build", file: "packages/elements/test/build.test.ts" };
    const browser = { project: "elements (chromium)", file: "packages/elements/test/control.test.ts" };
    const integration = { project: "gates-integration", file: "gates/test/integration/runner.test.ts" };
    const stories = { project: "storybook-integration", file: "storybook/test/smoke.test.ts" };
    const node = { project: "elements-node", file: "packages/elements/test/node/manifest.test.ts" };
    const plan = planTestShards(revision, [alpha, stories, integration, browser, node, build], 2);
    expect(plan.shards).toEqual([[build, browser], [stories, integration, node, alpha]]);
  });

  it.each(measuredFiles)("uses scheduled timing for $project/$file", ({ project, file, seconds }) => {
    expect(estimateTestSeconds({ project, file })).toBe(seconds);
  });

  it.each([
    { project: "elements-build", seconds: 15 },
    { project: "storybook-integration", seconds: 15 },
    { project: "elements-browser", seconds: 10 },
    { project: "elements (chromium)", seconds: 10 },
    { project: "gates-integration", seconds: 5 },
    { project: "tokens-browser", seconds: 5 },
    { project: "elements-node", seconds: 1 },
    { project: "gates", seconds: 1 },
  ])("retains the default estimate for new files in $project", ({ project, seconds }) => {
    expect(estimateTestSeconds({ project, file: "test/new.test.ts" })).toBe(seconds);
  });

  it("distinguishes a measured project and file pair from the same file in another project", () => {
    expect(estimateTestSeconds({ project: "elements (chromium)", file: "packages/elements/test/browser/drawer.test.ts" })).toBe(10);
  });

  it("places the expensive Visual files in different shards without losing inventory", () => {
    const measured = measuredFiles.map(({ project, file }) => ({ project, file }));
    const expensive = [
      "gates/test/integration/visual.test.ts",
      "gates/test/integration/visual-findings.test.ts",
      "gates/test/integration/visual-capture.test.ts",
    ];
    const inventory = [...measured, alpha, beta];
    const planned = planTestShards(revision, inventory, 6);

    const placements = expensive.map((file) => planned.shards.findIndex((shard) => shard.some((entry) => entry.file === file)));
    expect(placements).not.toContain(-1);
    expect(new Set(placements).size).toBe(expensive.length);
    expect(planned.shards.flat()).toEqual(expect.arrayContaining(inventory));
    expect(planned.shards.flat()).toHaveLength(inventory.length);
    expect(planTestShards(revision, [...inventory].reverse(), 6)).toEqual(planned);
  });
});

describe("unit test shard reports", () => {
  it("accepts same-revision results out of order and counts every test, even at zero duration", () => {
    const reports = [{ ...secondShard, files: [{ ...betaResult, tests: [passed, { ...passed, name: "a second test" }] }] }, firstShard];
    expect(verifyTestShards(manifest, reports, revision)).toEqual({ files: 2, tests: 3 });
  });

  it.each([
    { label: "non-array report collection", reports: { firstShard, secondShard } },
    { label: "null shard record", reports: [firstShard, null] },
    { label: "empty shard revision", reports: [firstShard, { ...secondShard, revision: "" }] },
    { label: "non-string shard revision", reports: [firstShard, { ...secondShard, revision: 1 }] },
    { label: "non-number shard index", reports: [firstShard, { ...secondShard, index: "1" }] },
    { label: "non-integral shard index", reports: [firstShard, { ...secondShard, index: 1.5 }] },
    { label: "non-array shard files", reports: [firstShard, { ...secondShard, files: null }] },
    { label: "malformed shard error list", reports: [firstShard, { ...secondShard, errors: [error, { name: 1, message: error.message }] }] },
  ])("rejects a $label as malformed", ({ reports }) => {
    expect(() => verifyTestShards(manifest, reports, revision)).toThrow(new Error("malformed shard results"));
  });

  it.each([
    { label: "non-object file", badFile: null },
    { label: "missing project", badFile: { ...betaResult, project: undefined } },
    { label: "unknown file state", badFile: { ...betaResult, state: "ok" } },
    { label: "non-array file errors", badFile: { ...betaResult, errors: null } },
    { label: "file error with no message", badFile: { ...betaResult, errors: [error, { name: "Error" }] } },
    { label: "string duration", badFile: { ...betaResult, durationMs: "1" } },
    { label: "infinite duration", badFile: { ...betaResult, durationMs: Infinity } },
    { label: "negative duration", badFile: { ...betaResult, durationMs: -1 } },
    { label: "non-array tests", badFile: { ...betaResult, tests: { passed } } },
    { label: "non-object test", badFile: { ...betaResult, tests: [passed, null] } },
    { label: "non-string test name", badFile: { ...betaResult, tests: [passed, { ...passed, name: { length: 1 } }] } },
    { label: "unnamed test", badFile: { ...betaResult, tests: [passed, { ...passed, name: "" }] } },
    { label: "unknown test state", badFile: { ...betaResult, tests: [passed, { ...passed, state: "ok" }] } },
    { label: "non-array test errors", badFile: { ...betaResult, tests: [passed, { ...passed, errors: null }] } },
    { label: "non-object test error", badFile: { ...betaResult, tests: [passed, { ...passed, errors: [error, null] }] } },
  ])("rejects a $label as malformed even beside otherwise valid records", ({ badFile }) => {
    const reports = [firstShard, { ...secondShard, files: [betaResult, badFile] }];
    expect(() => verifyTestShards(manifest, reports, revision)).toThrow(new Error("malformed shard results"));
  });

  it.each([-1, 2])("rejects out-of-range shard index %s", (index) => {
    expect(() => verifyTestShards(manifest, [firstShard, { ...secondShard, index }], revision))
      .toThrow(new Error(`unknown shard index ${String(index)}`));
  });

  it("identifies missing and unexpected project/files alongside the worker error", () => {
    const incomplete = { ...secondShard, errors: [error], files: [alphaResult] };
    expect(() => verifyTestShards(manifest, [firstShard, incomplete], revision)).toThrow(
      'shard 1 inventory differs from the plan; missing: ["gates","gates/test/beta.test.ts"]; unexpected: ["gates","gates/test/alpha.test.ts"]; reported errors: Error: runner failed',
    );
  });

  it("identifies an extra copy of the same project/file", () => {
    const duplicate = { ...secondShard, files: [betaResult, betaResult] };
    expect(() => verifyTestShards(manifest, [firstShard, duplicate], revision)).toThrow(
      'shard 1 inventory differs from the plan; unexpected: ["gates","gates/test/beta.test.ts"]',
    );
  });

  it("rejects a runner error even when every file and test reports passed", () => {
    expect(() => verifyTestShards(manifest, [firstShard, { ...secondShard, errors: [error] }], revision))
      .toThrow(new Error("shard 1 reported errors: Error: runner failed"));
  });

  it.each([
    { label: "a queued file", fields: { state: "queued" }, state: "queued" },
    { label: "a pending file", fields: { state: "pending" }, state: "pending" },
    { label: "a file error", fields: { errors: [error] }, state: "passed" },
    { label: "a file with no tests", fields: { tests: [] }, state: "passed" },
    { label: "a failed test in an otherwise passed file", fields: { tests: [passed, { ...passed, state: "failed", errors: [error] }] }, state: "failed" },
    { label: "a nominally passed test with a reported error", fields: { tests: [passed, { ...passed, errors: [error] }] }, state: "passed" },
    { label: "a pending test in an otherwise passed file", fields: { tests: [passed, { ...passed, state: "pending" }] }, state: "pending" },
  ])("rejects $label during verification", ({ fields, state }) => {
    const reports = [firstShard, { ...secondShard, files: [{ ...betaResult, ...fields }] }];
    expect(() => verifyTestShards(manifest, reports, revision))
      .toThrow(new Error(`${beta.file} (${beta.project}) reported ${state}, errors, or no tests`));
  });
});
