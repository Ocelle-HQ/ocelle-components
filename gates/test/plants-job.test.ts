import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { plants } from "../bin/plants.ts";
import type { PlantRun, PlantTools } from "../bin/plants.ts";
import type { Context, Io } from "../lib/cli.ts";

// The plant job's own decisions at the edges (FR-025, research.md R-10; phase 4 review round 1, R1-06): the order of
// gates and plants when the file system lists directories in another order, registry plants whose gates.json or
// ci.yml is missing or invalid, the location of a registry plant's findings, and directories of the registry plants
// without a plant.json. The repository is in memory and every gate does what its plant expects.
const registryText = readFileSync(new URL("fixtures/registry/gates.json", import.meta.url), "utf8");
const workflow = readFileSync(new URL("fixtures/registry/ci.yml", import.meta.url), "utf8");
const gateIds = (JSON.parse(registryText) as { id: string }[]).map((gate) => gate.id);
const fail = (location: string, rule: string): string => JSON.stringify({ expect: "fail", why: "w", findings: [{ location, rule }] });
const pass = JSON.stringify({ expect: "pass", why: "w" });
const error = JSON.stringify({ expect: "error", why: "w", cause: "could not run: x" });

function world(): Map<string, string> {
  const files = new Map<string, string>([
    ["gates/gates.json", registryText],
    [".github/workflows/ci.yml", workflow],
    ["gates/plants/plants/pass-matching/plant.json", pass],
    ["gates/plants/plants/pass-matching/gates.json", registryText],
    ["gates/plants/plants/pass-matching/ci.yml", workflow],
    ["gates/plants/plants/fail-no-entry/plant.json", fail("gates.json", "no-registry-entry")],
    ["gates/plants/plants/fail-no-entry/gates.json", JSON.stringify((JSON.parse(registryText) as { id: string }[]).filter((gate) => gate.id !== "csp"))],
    ["gates/plants/plants/fail-no-entry/ci.yml", workflow],
  ]);
  for (const id of gateIds) {
    for (const kind of ["fail", "pass", "error"]) files.set(`gates/plants/${id}/${kind}-x/plant.json`, kind === "fail" ? fail("a.ts:1", "r") : kind === "pass" ? pass : error);
  }
  return files;
}

function recorded(gateId: string, plant: string): PlantRun {
  if (plant.includes("/fail-")) return { exit: 1, stdout: [`a.ts:1: ${gateId}: r: m`], stderr: [] };
  if (plant.includes("/pass-")) return { exit: 0, stdout: [], stderr: [] };
  return { exit: 2, stdout: [], stderr: [`${gateId}: could not run: x`] };
}

async function job(files: Map<string, string>): Promise<{ code: number; out: string[] }> {
  const out: string[] = [];
  const below = (dir: string): string[] => [...files.keys()].filter((path) => path.startsWith(`${dir}/`)).map((path) => path.slice(dir.length + 1));
  const tools: PlantTools = {
    read: (path) => Promise.resolve(files.get(path)),
    dirs: (path) => Promise.resolve([...new Set(below(path).filter((p) => p.includes("/")).map((p) => String(p.split("/")[0])))].sort().reverse()),
    files: (path) => Promise.resolve(below(path)),
    runPlant: (gate, plant) => Promise.resolve(recorded(gate.id, plant)),
  };
  const io: Io = { cwd: "/r", env: {}, out: (line) => out.push(line), err: (line) => out.push(`err ${line}`) };
  const context: Context = { root: "/r", toolCwd: "/r", args: [] };
  return { code: await plants(context, tools, io), out };
}

describe("plants: order", () => {
  it("names problems by gate in registry order and by plant in name order, whatever order the directories come in", async () => {
    const files = world();
    for (const id of ["lint", "csp"]) {
      files.set(`gates/plants/${id}/fail-b/plant.json`, "{");
      files.set(`gates/plants/${id}/fail-a/plant.json`, "{");
    }
    files.set("gates/plants/zz/x/plant.json", pass);
    files.set("gates/plants/aa/x/plant.json", pass);
    const { code, out } = await job(files);
    expect({ code, out: out.map((line) => line.replace(/ \(.*\)$/, "")) }).toEqual({
      code: 1,
      out: [
        "gates/plants/aa: plants: unknown-gate: plants of aa, which has no registry entry",
        "gates/plants/zz: plants: unknown-gate: plants of zz, which has no registry entry",
        "gates/plants/lint/fail-a/plant.json: plants: invalid-plant: plant.json is not valid JSON",
        "gates/plants/lint/fail-b/plant.json: plants: invalid-plant: plant.json is not valid JSON",
        "gates/plants/csp/fail-a/plant.json: plants: invalid-plant: plant.json is not valid JSON",
        "gates/plants/csp/fail-b/plant.json: plants: invalid-plant: plant.json is not valid JSON",
        "plants: 6 problems in 51 plants",
      ],
    });
  });
});

describe("plants: registry plants", () => {
  it.each([
    { missing: "gates.json", cause: "plants: could not run: gates.json is missing" },
    { missing: "ci.yml", cause: "plants: could not run: ci.yml is missing" },
  ])("reports a registry plant without its $missing as broken", async ({ missing, cause }) => {
    const files = world();
    files.delete(`gates/plants/plants/pass-matching/${missing}`);
    expect((await job(files)).out).toEqual([
      `gates/plants/plants/pass-matching: plants: not-accepted: expected exit 0 with no finding, got exit 2 (${cause})`,
      "plants: 1 problem in 47 plants",
    ]);
  });

  it("reports a registry plant with an invalid gates.json as broken, naming the problem", async () => {
    const files = world();
    files.set("gates/plants/plants/pass-matching/gates.json", "{}");
    expect((await job(files)).out).toEqual([
      "gates/plants/plants/pass-matching: plants: not-accepted: expected exit 0 with no finding, got exit 2 (plants: could not run: gates.json is not a list of gates)",
      "plants: 1 problem in 47 plants",
    ]);
  });

  it("locates a registry plant's findings at its gates.json and ci.yml", async () => {
    const files = world();
    const withoutPins = workflow.replace(/\n {2}pins:\n(?: {4}.*\n)*/, "\n");
    files.set("gates/plants/plants/fail-no-job/plant.json", fail("ci.yml", "no-ci-job"));
    files.set("gates/plants/plants/fail-no-job/gates.json", registryText);
    files.set("gates/plants/plants/fail-no-job/ci.yml", withoutPins);
    expect(await job(files)).toEqual({ code: 0, out: ["plants: 48 plants of 15 gates and the registry judged, every plant as expected"] });
  });

  it("skips a directory of the registry plants without a plant.json, and needs a registry fail plant", async () => {
    const files = world();
    files.set("gates/plants/plants/notes/README.md", "x");
    for (const name of ["plant.json", "gates.json", "ci.yml"]) files.delete(`gates/plants/plants/fail-no-entry/${name}`);
    expect((await job(files)).out).toEqual(["gates/plants/plants: plants: missing-plant: the registry check has no fail plant", "plants: 1 problem in 46 plants"]);
  });
});
