import { cpSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { baseEnv, cleanUp, repo, runGate, tempDir } from "./workspace.ts";

// The pins range plants are self-contained (phase 4 review round 1, R1-01): `gates/bin/pins.ts --plant <copy>` on
// gates/plants/pins/fail-caret-range and fail-tilde-range, with pnpm's cache directory pointing at a new empty
// directory (`pnpm_config_cache_dir`, the form pnpm 12 reads, research.md R-04), exits 1 with exactly the plant's
// one `range` finding. A plant whose lockfile check needs registry metadata from the cache passes or fails by machine
// state (a cold CI runner: exit 2, ERR_PNPM_NO_OFFLINE_META). This case runs the plants themselves, as the plant job
// does: a plant copy without plant.json in a temporary directory, never the plant in place.
const timeout = 60_000;

interface Expected {
  readonly expect: string;
  readonly findings: readonly { readonly location: string; readonly rule: string; readonly message: string }[];
}

afterEach(cleanUp);

describe("pins range plants on an empty pnpm cache", () => {
  it.each(["fail-caret-range", "fail-tilde-range"])(
    "pins --plant gates/plants/pins/%s exits 1 with exactly its range finding",
    async (name) => {
      const plant = join(repo, "gates/plants/pins", name);
      const expected = JSON.parse(readFileSync(join(plant, "plant.json"), "utf8")) as Expected;
      expect({ expect: expected.expect, findings: expected.findings.map((found) => `${found.location} ${found.rule}`) }).toEqual({
        expect: "fail",
        findings: ["package.json range"],
      });
      const copy = tempDir("pins-plant");
      cpSync(plant, copy, { recursive: true });
      rmSync(join(copy, "plant.json"));
      const ran = await runGate("gates/bin/pins.ts", ["--plant", copy], {
        cwd: tempDir("cwd"),
        env: { ...baseEnv(), pnpm_config_cache_dir: tempDir("pnpm-cache") },
      });
      expect({ code: ran.code, stderr: ran.stderr, lines: ran.stdout.length, summary: ran.stdout.at(-1) }).toEqual({
        code: 1,
        stderr: [],
        lines: 2,
        summary: "pins: 1 finding in 1 file",
      });
      expect(ran.stdout[0]).toMatch(/^package\.json: pins: range: devDependencies\.\S+ is "[~^]\S+", not an exact version$/);
      expect(ran.stdout[0]).toContain(expected.findings[0]?.message);
    },
    timeout,
  );
});
