import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { expect, it } from "vitest";

const guard = resolve(import.meta.dirname, "../../../tooling/speckit/bin/scope-check.sh");

it("blocks a scoped step with an out-of-scope rename or untracked path", () => {
  const root = mkdtempSync(join(tmpdir(), "ocelle-scope-fixture-"));
  const git = (...args: string[]): string => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  try {
    git("init", "--quiet");
    git("config", "user.name", "Scope Fixture");
    git("config", "user.email", "scope-fixture@example.com");
    mkdirSync(join(root, "ops"));
    writeFileSync(join(root, "existing.md"), "existing file\n");
    git("add", "existing.md");
    git("-c", "commit.gpgsign=false", "commit", "--quiet", "-m", "add a file outside planner scope");
    const base = git("rev-parse", "HEAD");
    const check = (sha: string) => spawnSync("bash", [guard, "planner", sha], { cwd: root, encoding: "utf8" });

    writeFileSync(join(root, "ops", "allowed.md"), "planner notes\n");
    const allowed = check(base);
    expect(allowed.status).toBe(0);
    expect(JSON.parse(allowed.stdout) as unknown).toEqual({ role: "planner", ok: true, outside: [] });

    git("mv", "existing.md", "ops/moved.md");
    const outsideFile = 'new "line"\n.md';
    writeFileSync(join(root, outsideFile), "out of scope\n");
    const rejected = check(base);
    expect(rejected.status).toBe(1);
    expect(JSON.parse(rejected.stdout) as unknown).toEqual({
      role: "planner", ok: false, outside: ["existing.md", outsideFile],
    });

    git("mv", "ops/moved.md", "existing.md");
    writeFileSync(join(root, "existing.md"), "forbidden intermediate edit\n");
    git("add", "existing.md");
    git("-c", "commit.gpgsign=false", "commit", "--quiet", "-m", "edit the forbidden file");
    const intermediate = git("rev-parse", "HEAD");
    writeFileSync(join(root, "existing.md"), "existing file\n");
    git("add", "existing.md");
    git("-c", "commit.gpgsign=false", "commit", "--quiet", "-m", "restore the forbidden file");
    rmSync(join(root, outsideFile));
    const restored = check(base);
    expect(restored.status).toBe(1);
    expect(JSON.parse(restored.stdout) as unknown).toEqual({ role: "planner", ok: false, outside: ["existing.md"] });

    git("checkout", "--detach", base);
    const unrelated = check(intermediate);
    expect(unrelated.status).toBe(2);
    expect(unrelated.stderr).toContain("base is not an ancestor");

    const invalid = check("bad-base");
    expect(invalid.status).toBe(2);
    expect(invalid.stdout).toBe("");
    expect(invalid.stderr).toContain("base must be a commit sha");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
