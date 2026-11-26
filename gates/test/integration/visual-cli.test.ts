import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { env, gate, root, run, timeout } from "./visual-fixture.ts";
import { cleanUp, repo, runGate, tempDir } from "./workspace.ts";

afterEach(cleanUp);

describe("visual gate (gates/bin/visual.ts)", () => {
  it(
    "exits 2 for the host engine, naming the capture's refusal (FR-009, US2 scenario 7)",
    async () => {
      const ran = await gate(await root(), ["--engine", "host"]);
      expect({ code: ran.code, stdout: ran.stdout, lines: ran.stderr.length }).toEqual({ code: 2, stdout: [], lines: 1 });
      expect(ran.stderr[0]).toMatch(/^visual: could not run: not the pinned container: (?:node|pin): /);
    },
    timeout,
  );

  it(
    "exits 2 naming a missing engine, and in CI refuses a single engine (research.md R-06)",
    async () => {
      const at = await root();
      expect(await gate(at, ["--engine", "ocelle-no-such-engine"])).toEqual({ code: 2, stdout: [], stderr: ["visual: could not run: no container engine: ocelle-no-such-engine not found"] });
      expect(await gate(at, ["--engine", "docker"], { CI: "true" })).toEqual({ code: 2, stdout: [], stderr: ["visual: could not run: in CI the visual gate runs under both docker and podman"] });
    },
    timeout,
  );
});

// CI run 43056264356 (PR #24): the CI step runs `pnpm run gate:visual -- --engine both`, and pnpm passes the "--" on
// to the script. The gate and the baseline command run through pnpm take their options after it.
describe("visual gate and baseline command through pnpm run", () => {
  /** `pnpm run <script> -- <args>` in the repository. */
  function pnpmRun(script: string, args: readonly string[]): Promise<{ code: number | null; stdout: string; stderr: string }> {
    return run("pnpm", ["--silent", "run", script, "--", ...args], repo, env());
  }

  it(
    "reads the options after the -- that pnpm run passes on",
    async () => {
      const at = await root();
      const gateRun = await pnpmRun("gate:visual", ["--root", at, "--engine", "ocelle-no-such-engine"]);
      expect({ code: gateRun.code, stdout: gateRun.stdout, cause: gateRun.stderr.split("\n")[0] }).toEqual({
        code: 2,
        stdout: "",
        cause: "visual: could not run: no container engine: ocelle-no-such-engine not found",
      });
      const updateRun = await pnpmRun("visual:update", ["--root", at, "--engine", "ocelle-no-such-engine"]);
      expect({ code: updateRun.code, cause: updateRun.stderr.split("\n")[0] }).toEqual({ code: 2, cause: "baselines: could not run: no container engine: ocelle-no-such-engine not found" });
    },
    timeout,
  );
});

// Plan decision 21 (operator decision 2026-11-11, on CI run 43064614842): the pin check under podman reads the media
// type with skopeo, and a run under podman without skopeo exits 2 before any engine command runs. PATH holds only a
// stub podman that leaves a marker file when it is run.
describe("visual gate: skopeo for podman (plan decision 21)", () => {
  it(
    "exits 2 naming skopeo when PATH holds podman but no skopeo, and runs no podman command",
    async () => {
      const bin = tempDir("bin");
      const marker = join(tempDir("marker"), "podman-ran");
      writeFileSync(join(bin, "podman"), `#!/bin/sh\ntouch '${marker}'\n`, { mode: 0o755 });
      const ran = await runGate("gates/bin/visual.ts", ["--root", await root(), "--engine", "podman"], { cwd: tempDir("cwd"), env: { ...env(), PATH: bin } });
      expect({ ran, marker: existsSync(marker) }).toEqual({
        ran: { code: 2, stdout: [], stderr: ["visual: could not run: the pin check under podman needs skopeo: skopeo not found"] },
        marker: false,
      });
    },
    timeout,
  );
});

// Plan decision 25 (operator decision 2026-11-11, "Apply now"; contracts/gates.md § `visual`): `--remove-docker-image`
// needs docker for run 1 and podman for run 2, and is refused before any engine command. PATH holds only a stub docker
// that leaves a marker file when it is run.
describe("visual gate: --remove-docker-image (plan decision 25)", () => {
  it(
    "exits 2 naming both engines when --remove-docker-image comes with docker alone, and runs no docker command",
    async () => {
      const bin = tempDir("bin");
      const marker = join(tempDir("marker"), "docker-ran");
      writeFileSync(join(bin, "docker"), `#!/bin/sh\ntouch '${marker}'\n`, { mode: 0o755 });
      const ran = await runGate("gates/bin/visual.ts", ["--root", await root(), "--engine", "docker", "--remove-docker-image"], { cwd: tempDir("cwd"), env: { ...env(), PATH: bin } });
      expect({ ran, marker: existsSync(marker) }).toEqual({
        ran: { code: 2, stdout: [], stderr: ["visual: could not run: --remove-docker-image needs both engines (docker for run 1, podman for run 2)"] },
        marker: false,
      });
    },
    timeout,
  );
});
