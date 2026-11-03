import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { run as signoff } from "../bin/signoff.ts";
import { entry } from "../lib/cli.ts";
import type { Io } from "../lib/cli.ts";
import { runTool } from "../lib/spawn.ts";

// The spawn error path of gates/lib/spawn.ts (contracts/gate-cli.md: a missing tool is exit 2, "could not run";
// phase 3 review round 5, O5-01). A command that cannot be started starts no process, so these cases run in process
// in the `gates` project, where Stryker reaches `child.on("error", reject)` (research.md R-08). Each run gets a PATH
// holding only an empty temporary directory, so the command is missing whatever the machine has installed.
const made: string[] = [];

function emptyDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "ocelle-spawn-"));
  made.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("runTool (gates/lib/spawn.ts), a command that cannot be started", () => {
  it("rejects with the spawn error naming the command", async () => {
    const dir = emptyDir();
    await expect(runTool("ocelle-missing-tool", ["--version"], dir, { PATH: dir })).rejects.toThrow(
      "spawn ocelle-missing-tool ENOENT",
    );
  });

  it("makes the gate exit 2 with one line: could not run, naming the command (signoff without git)", async () => {
    const dir = emptyDir();
    const out: string[] = [];
    const err: string[] = [];
    const io: Io = { cwd: dir, env: { PATH: dir }, out: (l) => out.push(l), err: (l) => err.push(l) };
    const code = await entry(signoff, ["--root", dir, "--range", "HEAD~1..HEAD"], io);
    expect({ code, out, err }).toEqual({ code: 2, out: [], err: ["could not run: spawn git ENOENT"] });
  });
});
