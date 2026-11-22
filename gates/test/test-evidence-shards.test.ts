import { describe, expect, it } from "vitest";
import { planTestShards, validTestPlan, verifyTestShards } from "../lib/test-evidence.ts";

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

describe("unit test shard plans", () => {
  it.each([
    ["40 hexadecimal characters", revision],
    ["64 hexadecimal characters", "b".repeat(64)],
  ])("accepts revisions with %s", (_, sha) => {
    const result = planTestShards(sha, [alpha, beta], 2);
    expect(result).toEqual({ ...manifest, revision: sha });
    expect(validTestPlan(result, sha)).toBe(true);
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
      .toThrowError(new Error("invalid revision, shard count, or test inventory"));
    expect(validTestPlan({ ...manifest, revision: sha }, sha)).toBe(false);
  });

  it.each([0, -1, 1.5, 3])("rejects an invalid shard count of %s", (count) => {
    expect(() => planTestShards(revision, [alpha, beta], count))
      .toThrowError(new Error("invalid revision, shard count, or test inventory"));
  });

  it("rejects duplicate planned test identities", () => {
    expect(() => planTestShards(revision, [alpha, alpha], 2))
      .toThrowError(new Error("invalid revision, shard count, or test inventory"));
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
      .toThrowError(new Error("invalid plan inventory or revision"));
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
    expect(() => verifyTestShards(manifest, reports, revision)).toThrowError(new Error("malformed shard results"));
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
    expect(() => verifyTestShards(manifest, reports, revision)).toThrowError(new Error("malformed shard results"));
  });

  it.each([-1, 2])("rejects out-of-range shard index %s", (index) => {
    expect(() => verifyTestShards(manifest, [firstShard, { ...secondShard, index }], revision))
      .toThrowError(new Error(`unknown shard index ${String(index)}`));
  });

  it("rejects a runner error even when every file and test reports passed", () => {
    expect(() => verifyTestShards(manifest, [firstShard, { ...secondShard, errors: [error] }], revision))
      .toThrowError(new Error("shard 1 reported errors"));
  });

  it.each([
    { label: "a queued file", fields: { state: "queued" }, state: "queued" },
    { label: "a pending file", fields: { state: "pending" }, state: "pending" },
    { label: "a file error", fields: { errors: [error] }, state: "passed" },
    { label: "a file with no tests", fields: { tests: [] }, state: "passed" },
    { label: "a failed test in an otherwise passed file", fields: { tests: [passed, { ...passed, state: "failed", errors: [error] }] }, state: "failed" },
    { label: "a pending test in an otherwise passed file", fields: { tests: [passed, { ...passed, state: "pending" }] }, state: "pending" },
  ])("rejects $label during verification", ({ fields, state }) => {
    const reports = [firstShard, { ...secondShard, files: [{ ...betaResult, ...fields }] }];
    expect(() => verifyTestShards(manifest, reports, revision))
      .toThrowError(new Error(`${beta.file} (${beta.project}) reported ${state}, errors, or no tests`));
  });
});
