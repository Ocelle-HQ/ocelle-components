// Plant for the unit tests: a test that fails.
import { describe, expect, it } from "vitest";

describe("planted gates-test", () => {
  it("adds wrongly", () => {
    expect(1 + 1).toBe(3);
  });
});

import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

it("the required Unit tests aggregate rejects a missing shard artifact", () => {
  const repository = dirname(realpathSync(join(process.cwd(), "node_modules")));
  const temp = mkdtempSync(join(tmpdir(), "ocelle-unit-plant-"));
  try {
    const revision = spawnSync("git", ["rev-parse", "HEAD"], { cwd: repository, encoding: "utf8" }).stdout.trim();
    const inventory = ["first", "second"].map((name) => ({ project: "gates", file: `gates/test/${name}.test.ts` }));
    const plan = join(temp, "plan.json");
    const reports = join(temp, "reports");
    writeFileSync(plan, JSON.stringify({ revision, inventory, shards: inventory.map((file) => [file]) }));
    for (const [index, file] of inventory.entries()) {
      const report = join(reports, String(index));
      mkdirSync(report, { recursive: true });
      writeFileSync(join(report, "result.json"), JSON.stringify({ revision, index, errors: [], files: [{
        ...file, state: "passed", errors: [], durationMs: 1,
        tests: [{ name: "complete", state: "passed", errors: [] }],
      }] }));
    }
    const verify = () => spawnSync(process.execPath, ["gates/bin/test-shards.ts", "verify", plan, reports], { cwd: repository, encoding: "utf8" });
    const complete = verify();
    expect(complete.status, complete.stderr).toBe(0);
    rmSync(join(reports, "1"), { recursive: true });
    const incomplete = verify();
    expect(incomplete.status, incomplete.stderr.trim()).toBe(0);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});
