#!/usr/bin/env bash
# Check one pinned worker return or a group with disjoint path assignments.
set -euo pipefail
root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd -P)
export GIT_OPTIONAL_LOCKS=0 GIT_NO_REPLACE_OBJECTS=1
exec node --input-type=module - "$root" "$@" <<'JS'
import { execFileSync, spawnSync } from "node:child_process";
import { realpathSync } from "node:fs";
import { join } from "node:path";

const [toolRoot, repository, pin, ...workerArgs] = process.argv.slice(2);

function requireThat(condition, problem) {
  if (!condition) throw new Error(problem);
}

function git(root, ...args) {
  return execFileSync("git", ["-C", root, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function worktreeRoot(directory) {
  const root = realpathSync(git(directory, "rev-parse", "--show-toplevel").trimEnd());
  requireThat(root === realpathSync(directory), "Use the worktree root directory.");
  return root;
}

function repositoryIdentity(directory) {
  return realpathSync(git(directory, "rev-parse", "--path-format=absolute", "--git-common-dir").trimEnd());
}

function workerGroups(args) {
  const groups = [[]];
  for (const arg of args) {
    if (arg === "--worker") groups.push([]);
    else groups.at(-1).push(arg);
  }
  const assigned = new Set();
  return groups.map(([directory, ...paths]) => {
    requireThat(directory && paths.length > 0, "Each worker needs a directory and exact assigned paths.");
    for (const path of paths) {
      const exact = path.split("/").every((part) => part !== "" && part !== "." && part !== "..");
      requireThat(exact, "Assign exact repository-relative paths.");
      requireThat(!assigned.has(path), `Overlapping path assignment: ${path}`);
      assigned.add(path);
    }
    return { directory, paths: new Set(paths) };
  });
}

function status(directory) {
  return git(directory, "status", "--porcelain=v1", "--untracked-files=all", "--ignore-submodules=none");
}

function checkWorker(worker, paths, base) {
  requireThat(status(worker) === "", "Worker has staged, unstaged, or untracked changes.");
  const head = git(worker, "rev-parse", "--verify", "HEAD^{commit}").trim();
  requireThat(head !== base, "Worker has no commit after the pin.");
  requireThat(git(worker, "merge-base", base, head).trim() === base, "Worker is not based on the supplied pin.");
  const range = `${base}..${head}`;
  requireThat(git(worker, "rev-list", "--merges", range) === "", "Worker range contains a merge commit.");
  const signed = spawnSync(process.execPath, [
    join(toolRoot, "gates/bin/signoff.ts"), "--root", worker, "--range", range,
  ], { stdio: "ignore" });
  requireThat(signed.status === 0, "Worker range failed the sign-off gate.");

  const touched = new Set();
  for (const commit of git(worker, "rev-list", range).trim().split("\n")) {
    // Treat a rename as a deletion and an addition so both paths must be assigned.
    const names = git(worker, "diff-tree", "--no-commit-id", "--no-renames", "--name-only", "-r", "-z", commit);
    for (const path of names.split("\0").slice(0, -1)) {
      requireThat(paths.has(path), `Worker changed an unassigned path: ${path}`);
      touched.add(path);
    }
  }
  requireThat(git(worker, "rev-parse", "--verify", "HEAD^{commit}").trim() === head && status(worker) === "",
    "Worker changed during verification.");
  return { worktree: worker, head, paths: [...touched].sort() };
}

try {
  requireThat(repository && pin && workerArgs.length >= 2,
    "Usage: worktree-return-check.sh REPO BASE WORKTREE PATH... [--worker WORKTREE PATH...]");
  const canonical = worktreeRoot(repository);
  const identity = repositoryIdentity(canonical);
  requireThat(/^[0-9a-f]{7,64}$/.test(pin), "Supply a pinned commit SHA.");
  const base = git(canonical, "rev-parse", "--verify", `${pin}^{commit}`).trim();
  const seen = new Set([canonical]);
  const returns = workerGroups(workerArgs).map(({ directory, paths }) => {
    const worker = worktreeRoot(directory);
    requireThat(repositoryIdentity(worker) === identity, "Worker belongs to a different Git repository.");
    requireThat(!seen.has(worker), "Worker must be a separate worktree and appear only once.");
    seen.add(worker);
    return checkWorker(worker, paths, base);
  });
  const receipt = returns.length === 1 ? { ok: true, base, ...returns[0] } : { ok: true, base, returns };
  process.stdout.write(JSON.stringify(receipt) + "\n");
} catch (error) {
  const problem = error.status === undefined ? error.message : "Git could not verify the supplied worktree or commit.";
  process.stdout.write(JSON.stringify({ ok: false, problem }) + "\n");
  process.exitCode = 1;
}
JS
