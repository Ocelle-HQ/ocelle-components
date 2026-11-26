import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { manifestFindings, run } from "../bin/manifest.ts";
import type { Io } from "../lib/cli.ts";
import type { Finding } from "../lib/findings.ts";
import { parsePlant } from "../lib/plant-judge.ts";

// The manifest gate (005 FR-009, US1 scenario 12; research.md R-06; contracts/checks.md § New gate `manifest`; T018):
// it generates the manifest from packages/elements/src/ocelle-*.ts under --root (packages/elements/scripts/manifest.ts)
// and compares it with the committed packages/elements/custom-elements.json, key order aside. Exit 1: one `stale`
// finding per differing member of an element, named `<element>.<kind>.<name>`, an element in one manifest only, or one
// whole-file `stale` finding for a difference it cannot attribute; one `no-description` finding per public member of
// the six kinds (property, attribute, event, slot, CSS part, CSS custom property) without a non-empty description, at
// the element's module. Exit 2: the committed manifest missing or not JSON, or no element source to analyse. The
// temporary roots hold the repository's element source and committed manifest, changed as each case says.
const repo = fileURLToPath(new URL("../..", import.meta.url));
const manifestPath = "packages/elements/custom-elements.json";
const manifestPlants = "gates/plants/manifest";
const fullManifestOverlays = [
  "fail-lost-attribute",
  "fail-undescribed-attribute",
  "fail-undescribed-css-part",
  "fail-undescribed-css-property",
  "fail-undescribed-event",
  "fail-undescribed-property",
  "fail-undescribed-slot",
  "pass-reordered",
];
const iconSource = "packages/elements/src/ocelle-icon.ts";
const remedy = "regenerate it with pnpm --filter @ocelle/elements run manifest";
const made: string[] = [];

afterEach(() => {
  for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true });
});

function capture(): { readonly io: Io; readonly out: string[]; readonly err: string[] } {
  const out: string[] = [];
  const err: string[] = [];
  return { io: { cwd: repo, env: {}, out: (line) => out.push(line), err: (line) => err.push(line) }, out, err };
}

async function gate(root: string): Promise<{ readonly code: number; readonly out: readonly string[]; readonly err: readonly string[] }> {
  const { io, out, err } = capture();
  const code = await run(["--root", root], io);
  return { code, out, err };
}

/** A temporary root with the repository's element source and committed manifest, `changes` written over them (null removes). */
function root(changes: Readonly<Record<string, string | null>> = {}): string {
  const dir = mkdtempSync(join(tmpdir(), "ocelle-manifest-gate-"));
  made.push(dir);
  cpSync(join(repo, "packages/elements/src"), join(dir, "packages/elements/src"), { recursive: true });
  if (existsSync(join(repo, manifestPath))) cpSync(join(repo, manifestPath), join(dir, manifestPath));
  for (const [path, text] of Object.entries(changes)) {
    if (text === null) rmSync(join(dir, path), { recursive: true, force: true });
    else {
      mkdirSync(dirname(join(dir, path)), { recursive: true });
      writeFileSync(join(dir, path), text);
    }
  }
  return dir;
}

type Json = Record<string, unknown>;
const committed = (): Json => (existsSync(join(repo, manifestPath)) ? (JSON.parse(readFileSync(join(repo, manifestPath), "utf8")) as Json) : { modules: [{ path: "src/ocelle-icon.ts", declarations: [{}] }] });

/** The first element declaration of a manifest. */
function element(manifest: Json): Json {
  const found = ((manifest.modules as Json[] | undefined)?.[0]?.declarations as Json[] | undefined)?.[0];
  if (found === undefined) throw new Error("the manifest has no element declaration");
  return found;
}

/** The `ocelle-icon` declaration of a manifest (since 005 phase 5 the manifest declares `ocelle-brand-mark` first). */
function iconOf(manifest: Json): Json {
  const found = ((manifest.modules as Json[] | undefined)?.find((module) => module.path === "src/ocelle-icon.ts")?.declarations as Json[] | undefined)?.[0];
  if (found === undefined) throw new Error("the manifest has no ocelle-icon declaration");
  return found;
}

/** The same JSON with the keys of every object in reverse order. */
function reversed(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(reversed);
  if (typeof value !== "object" || value === null) return value;
  return Object.fromEntries(Object.entries(value).reverse().map(([key, each]) => [key, reversed(each)]));
}

function stale(message: string): Finding {
  return { location: { path: manifestPath }, gate: "manifest", rule: "stale", message };
}

describe("manifest gate on a root", () => {
  it("exits 0 on the repository: the committed manifest matches the source and every member is described", async () => {
    expect(await gate(repo)).toEqual({ code: 0, out: ["manifest: 49 elements checked, no finding"], err: [] });
  });

  it("exits 0 when the committed manifest only orders its keys differently (pass-reordered)", async () => {
    const dir = root({ [manifestPath]: `${JSON.stringify(reversed(committed()), null, 2)}\n` });
    expect(await gate(dir)).toEqual({ code: 0, out: ["manifest: 49 elements checked, no finding"], err: [] });
  });

  it("reports the label attribute lost from the committed manifest as one stale finding naming ocelle-icon and the attribute (fail-lost-attribute)", async () => {
    const manifest = committed();
    const icon = iconOf(manifest);
    icon.attributes = (icon.attributes as Json[]).filter((attribute) => attribute.name !== "label");
    const dir = root({ [manifestPath]: `${JSON.stringify(manifest, null, 2)}\n` });
    expect(await gate(dir)).toEqual({
      code: 1,
      out: [`${manifestPath}: manifest: stale: ocelle-icon.attribute.label differs from the generated manifest`, `manifest: 1 finding; ${remedy}`],
      err: [],
    });
  });

  it("reports a property added in source without regenerating as stale findings for the property and its attribute (fail-stale-property)", async () => {
    const text = readFileSync(join(repo, iconSource), "utf8");
    const added = text
      .replace("static override properties = {", "static override properties = {\n    tone: { type: String },")
      .replace("declare label: string | undefined;", "declare label: string | undefined;\n\n  /**\n   * A tone.\n   *\n   * @default undefined\n   */\n  declare tone: string | undefined;");
    expect(added).not.toBe(text);
    expect(await gate(root({ [iconSource]: added }))).toEqual({
      code: 1,
      out: [
        `${manifestPath}: manifest: stale: ocelle-icon.attribute.tone differs from the generated manifest`,
        `${manifestPath}: manifest: stale: ocelle-icon.property.tone differs from the generated manifest`,
        `manifest: 2 findings; ${remedy}`,
      ],
      err: [],
    });
  });

  it("reports a difference outside every element as one whole-file stale finding", async () => {
    const dir = root({ [manifestPath]: `${JSON.stringify({ ...committed(), readme: "changed" }, null, 2)}\n` });
    expect(await gate(dir)).toEqual({
      code: 1,
      out: [`${manifestPath}: manifest: stale: the committed manifest differs from the generated manifest`, `manifest: 1 finding; ${remedy}`],
      err: [],
    });
  });

  it.each([
    { label: "the committed manifest is missing (break-missing)", changes: { [manifestPath]: null }, cause: `manifest: could not run: ${manifestPath} is missing` },
    { label: "the committed manifest is not JSON (break-not-json)", changes: { [manifestPath]: "{\n" }, cause: `manifest: could not run: ${manifestPath} is not JSON` },
    { label: "there is no element source to analyse", changes: { "packages/elements/src": null }, cause: "manifest: could not run: no element module packages/elements/src/ocelle-*.ts" },
  ])("exits 2 when $label", async ({ changes, cause }) => {
    const ran = await gate(root(changes));
    expect({ code: ran.code, out: ran.out, err: ran.err.map((line) => line.slice(0, cause.length)) }).toEqual({ code: 2, out: [], err: [cause] });
  });
});

describe("manifest Plant overlays", () => {
  it.each(fullManifestOverlays)("reports only the intended raw manifest findings for %s", async (name) => {
    const plant = join(repo, manifestPlants, name);
    const { spec, findings } = manifestPlant(plant);
    const into = root();
    cpSync(join(plant, "tree"), into, { recursive: true });
    const ran = await gate(into);
    expect({ code: ran.code, findings: ran.out.slice(0, -1), err: ran.err }).toEqual({
      code: spec.expect === "pass" ? 0 : 1, findings, err: [],
    });
  });
});

function manifestPlant(plant: string) {
  const spec = parsePlant(readFileSync(join(plant, "plant.json"), "utf8"));
  if (typeof spec === "string") throw new Error(spec);
  const findings = (spec.findings ?? []).map(({ location, rule, message }) => `${location}: manifest: ${rule}: ${message ?? ""}`);
  return { spec, findings };
}

function rootWithManifestPlants(): string {
  const into = root();
  cpSync(join(repo, manifestPlants), join(into, manifestPlants), { recursive: true });
  return into;
}

async function manifestPreflight(root: string) {
  const { io, out, err } = capture();
  const entry = new URL("../../tooling/speckit/bin/component-preflight.ts", import.meta.url);
  if (!existsSync(entry)) return { code: 0, receipt: { overlays: [] }, err };
  const preflight = (await import(entry.href)) as { readonly run: typeof run };
  const code = await preflight.run(["manifest", "--root", root], io);
  const receipt: unknown = JSON.parse(out.join("\n") || "null");
  return { code, receipt, err };
}

describe("component preflight manifest overlays", () => {
  it("checks all current full manifest overlays and discovers a newly added full overlay", async () => {
    const into = rootWithManifestPlants();
    const newOverlay = "pass-new-full-overlay";
    cpSync(join(into, manifestPlants, "pass-reordered"), join(into, manifestPlants, newOverlay), { recursive: true });

    const overlays = [...fullManifestOverlays, newOverlay].sort().map((name) => {
      const plant = `${manifestPlants}/${name}`;
      const { spec, findings } = manifestPlant(join(into, plant));
      const locations = new Set([manifestPath, ...(spec.findings ?? []).map(({ location }) => location)]);
      return {
        descriptor: `${plant}/plant.json`,
        fixturePaths: [...locations].sort().map((path) => `${plant}/tree/${path}`),
        findings,
        unexpectedFindings: [],
        missingFindings: [],
      };
    });
    expect(await manifestPreflight(into)).toEqual({ code: 0, receipt: { overlays }, err: [] });
  }, 60_000);

  it("reports the exact additional stale finding and the manifest snapshot to update", async () => {
    const into = rootWithManifestPlants();
    const plant = `${manifestPlants}/fail-lost-attribute`;
    const snapshot = `${plant}/tree/${manifestPath}`;
    const manifest = JSON.parse(readFileSync(join(into, snapshot), "utf8")) as Json;
    const icon = iconOf(manifest);
    icon.attributes = (icon.attributes as Json[]).filter((attribute) => attribute.name !== "name");
    writeFileSync(join(into, snapshot), `${JSON.stringify(manifest, null, 2)}\n`);

    const ran = await manifestPreflight(into);
    const staleName = `${manifestPath}: manifest: stale: ocelle-icon.attribute.name differs from the generated manifest`;
    expect(ran).toMatchObject({
      code: 1,
      receipt: { overlays: expect.arrayContaining([{
        descriptor: `${plant}/plant.json`, fixturePaths: [snapshot],
        findings: [...manifestPlant(join(into, plant)).findings, staleName],
        unexpectedFindings: [staleName],
        missingFindings: [],
      }]) as unknown },
    });
    expect(ran.err.join("\n")).toContain(snapshot);
  }, 60_000);

  it("reports the exact finding and fixture path for a module lost from a full overlay", async () => {
    const into = rootWithManifestPlants();
    const plant = `${manifestPlants}/fail-undescribed-attribute`;
    const module = `${plant}/tree/packages/elements/src/ocelle-plant.ts`;
    rmSync(join(into, module));

    const ran = await manifestPreflight(into);
    const staleModule = `${manifestPath}: manifest: stale: ocelle-plant is not in the generated manifest`;
    expect(ran).toMatchObject({
      code: 1,
      receipt: { overlays: expect.arrayContaining([{
        descriptor: `${plant}/plant.json`, fixturePaths: [`${plant}/tree/${manifestPath}`],
        findings: [staleModule],
        unexpectedFindings: [staleModule],
        missingFindings: manifestPlant(join(into, plant)).findings,
      }]) as unknown },
    });
    expect(ran.err.join("\n")).toContain(module);
  }, 60_000);
});

describe("manifestFindings(committed, generated)", () => {
  const described = (name: string): Json => ({ name, description: `The ${name}.` });
  const undescribed = (name: string): Json => ({ name });
  function manifest(of: (name: string) => Json): Json {
    return {
      schemaVersion: "1.0.0",
      readme: "",
      modules: [
        {
          kind: "javascript-module",
          path: "src/ocelle-plant.ts",
          declarations: [
            {
              kind: "class",
              name: "OcellePlant",
              tagName: "ocelle-plant",
              customElement: true,
              members: [{ kind: "field", privacy: "public", ...of("tone") }],
              attributes: [{ fieldName: "tone", ...of("tone") }],
              events: [of("ocelle-plant-change")],
              slots: [of("icon")],
              cssParts: [of("drawing")],
              cssProperties: [of("--ocelle-plant-gap")],
            },
          ],
          exports: [],
        },
      ],
    };
  }

  it("reports one no-description finding at the element's module per undescribed public member of each of the six kinds, and none when each is described", () => {
    const at = (message: string): Finding => ({ location: { path: "packages/elements/src/ocelle-plant.ts" }, gate: "manifest", rule: "no-description", message });
    expect({ undescribed: manifestFindings(manifest(undescribed), manifest(undescribed)), described: manifestFindings(manifest(described), manifest(described)) }).toEqual({
      undescribed: [
        at("ocelle-plant.attribute.tone has no description"),
        at("ocelle-plant.css-part.drawing has no description"),
        at("ocelle-plant.css-property.--ocelle-plant-gap has no description"),
        at("ocelle-plant.event.ocelle-plant-change has no description"),
        at("ocelle-plant.property.tone has no description"),
        at("ocelle-plant.slot.icon has no description"),
      ],
      described: [],
    });
  });

  it("counts a blank description as none, and a private member not at all", () => {
    const generated = manifest(described);
    const plant = element(generated);
    plant.slots = [{ name: "icon", description: "  " }];
    plant.members = [{ kind: "field", name: "tone", privacy: "public", description: "The tone." }, { kind: "field", name: "#internals", privacy: "private" }];
    expect(manifestFindings(generated, generated)).toEqual([
      { location: { path: "packages/elements/src/ocelle-plant.ts" }, gate: "manifest", rule: "no-description", message: "ocelle-plant.slot.icon has no description" },
    ]);
  });

  it("names each differing member of each kind, and an element that only one manifest declares", () => {
    const generated = manifest(described);
    const old = manifest(described);
    const plant = element(old);
    plant.events = [];
    plant.cssProperties = [{ name: "--ocelle-plant-gap", description: "Another." }];
    const extra = structuredClone(element(generated));
    extra.tagName = "ocelle-extra";
    ((generated.modules as Json[])[0]?.declarations as Json[]).push(extra);
    expect(manifestFindings(old, generated)).toEqual([
      stale("ocelle-extra is not in the committed manifest"),
      stale("ocelle-plant.css-property.--ocelle-plant-gap differs from the generated manifest"),
      stale("ocelle-plant.event.ocelle-plant-change differs from the generated manifest"),
    ]);
  });

  it("reads only custom-element declarations of object entries: other entries and declarations are not elements", () => {
    const generated = manifest(described);
    element(generated).members = ["tone", 3, [], null, { kind: "field", privacy: "public", name: "tone", description: "The tone." }, { kind: "field", privacy: "protected", name: "cache" }];
    (generated.modules as unknown[]).unshift(null, "module", [], { path: "src/helper.ts", declarations: [null, 3, [], { kind: "function", name: "helper", members: [{ kind: "field", name: "x" }] }] });
    expect(manifestFindings(generated, generated)).toEqual([]);
  });

  it("names an element that only the committed manifest declares", () => {
    const old = manifest(described);
    const extra = structuredClone(element(old));
    extra.tagName = "ocelle-gone";
    ((old.modules as Json[])[0]?.declarations as Json[]).push(extra);
    expect(manifestFindings(old, manifest(described))).toEqual([stale("ocelle-gone is not in the generated manifest")]);
  });

  it("names an element without a tag name by its class name", () => {
    const generated = manifest(undescribed);
    const plant = element(generated);
    delete plant.tagName;
    for (const key of ["members", "attributes", "events", "cssParts", "cssProperties"]) plant[key] = [];
    expect(manifestFindings(generated, generated)).toEqual([
      { location: { path: "packages/elements/src/ocelle-plant.ts" }, gate: "manifest", rule: "no-description", message: "OcellePlant.slot.icon has no description" },
    ]);
  });

  it("finds nothing when the two manifests are equal but for key order", () => {
    const generated = manifest(described);
    expect([manifestFindings(reversed(generated), generated), manifestFindings(manifest(described), { ...generated, readme: "x" }).length]).toEqual([[], 1]);
  });
});

describe("component preflight findings and input errors", () => {
  it("compares exact raw findings and counts repeated findings separately", async () => {
    const entry = new URL("../lib/component-preflight.ts", import.meta.url);
    const first = `${manifestPath}: manifest: stale: ocelle-icon.attribute.label differs from the generated manifest`;
    const second = `${first} after property comparison`;
    let difference: unknown;
    if (existsSync(entry)) {
      const { compareOverlayFindings } = (await import(entry.href)) as {
        readonly compareOverlayFindings: (expected: readonly string[], actual: readonly string[]) => unknown;
      };
      difference = compareOverlayFindings([first, first, second], [first, second, second]);
    }
    expect(difference).toEqual({ unexpectedFindings: [second], missingFindings: [first] });
  });

  it("fails closed and names the snapshot when a valid overlay contains malformed manifest JSON", async () => {
    const into = rootWithManifestPlants();
    const snapshot = `${manifestPlants}/fail-lost-attribute/tree/${manifestPath}`;
    writeFileSync(join(into, snapshot), "{\n");

    const entry = new URL("../../tooling/speckit/bin/component-preflight.ts", import.meta.url);
    const { runTool } = await import("../lib/spawn.ts");
    const ran = existsSync(entry)
      ? await runTool(process.execPath, [fileURLToPath(entry), "manifest", "--root", into], repo, process.env)
      : { exitCode: 0, stdout: "", stderr: "" };
    expect(ran.exitCode).toBe(2);
    expect(ran.stdout).toBe("");
    expect(ran.stderr).toContain(`${snapshot}: manifest: could not run: ${manifestPath} is not JSON`);
  }, 60_000);

  it("rejects deletion of a tracked manifest overlay snapshot against the pinned base", async () => {
    const into = root();
    for (const name of ["fail-lost-attribute", "fail-stale-property", "pass-reordered"]) {
      const plant = `${manifestPlants}/${name}`;
      cpSync(join(repo, plant), join(into, plant), { recursive: true });
    }

    const { execFileSync } = await import("node:child_process");
    const git = (...args: readonly string[]): string => execFileSync("git", [
      "-c", "user.name=Plant Fixture", "-c", "user.email=plant@example.invalid", ...args,
    ], { cwd: into, encoding: "utf8" });
    git("init", "-q", "--object-format=sha1");
    git("add", "--", manifestPlants);
    git("commit", "-q", "--no-gpg-sign", "-m", "Record manifest Plants");
    const base = git("rev-parse", "HEAD").trim();

    const snapshot = `${manifestPlants}/fail-lost-attribute/tree/${manifestPath}`;
    git("rm", "-q", "--", snapshot);
    git("commit", "-q", "--no-gpg-sign", "-m", "Remove the snapshot and retain its descriptor");

    const entry = new URL("../../tooling/speckit/bin/component-preflight.ts", import.meta.url);
    const { runTool } = await import("../lib/spawn.ts");
    const ran = existsSync(entry)
      ? await runTool(process.execPath, [fileURLToPath(entry), "manifest", "--root", into, "--base", base], repo, process.env)
      : { exitCode: 0, stdout: "", stderr: "" };
    expect(ran.exitCode).toBe(1);
    expect(ran.stderr).toContain(`${snapshot}:`);
  }, 60_000);
});
