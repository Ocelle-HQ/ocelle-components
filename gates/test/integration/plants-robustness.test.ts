import { cpSync, readdirSync, readFileSync, realpathSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { applyOverrides, resolve } from "../../../packages/tokens/src/generate.ts";
import { records } from "../../../packages/tokens/src/source.ts";
import { contrastRatio } from "../../lib/wcag.ts";
import { baseEnv, cleanUp, releaseInputs, repo, runGate, storybookInputs, tempDir } from "./workspace.ts";

// The contrast and brand-rules plants are robust to neighbouring changes (002 contracts/gates.md § Configuration set,
// *Plant deltas* and *Keyed locations*; PLAN-FRESH-3-003): a copy of the repository's token source and pair list is
// changed in three ways, each consistent (its recorded figures updated, so the contrast gate still passes on it), and
// the plant job then runs every contrast and brand-rules plant on that copy: each still gives exactly its expected
// outcome. (1) the light value of color-ink-soft, the neighbour of the planted color-ink-muted; (2) a colour token
// inserted before color-ink-soft in the records and a checked pair inserted as the first entry of the list, so every
// planted record and entry moves down a line; (3) the light color-danger value. The job's only problems are the
// plants the other gates lack, since only these two gates' plants are copied.
const timeout = 600_000;
const sourcePath = "packages/tokens/src/source.ts";
const pairsPath = "packages/tokens/contrast/pairs.json";
const copied = [
  "gates/gates.json",
  ".github/workflows/ci.yml",
  "gates/bin",
  "gates/lib",
  "gates/eslint",
  "gates/stylelint",
  "gates/plants/contrast",
  "gates/plants/brand-rules",
  "gates/plants/plants",
  "package.json",
  "pnpm-workspace.yaml",
  "tsconfig.base.json",
  "tsconfig.json",
  "eslint.config.ts",
  "eslint.test.config.ts",
  "stylelint.config.ts",
  "vitest.config.ts",
  "vitest.mutation.config.ts",
  "stryker.config.json",
  // The element mutation configuration of the configuration set (005 research.md R-12).
  "stryker.elements.config.json",
  "vitest.mutation.elements.config.ts",
  ...["tokens", "styles", "elements"].flatMap((name) => [`packages/${name}/package.json`, `packages/${name}/tsconfig.json`]),
  "packages/tokens/src/source.ts",
  "packages/tokens/src/overrides.ts",
  "packages/tokens/src/generate.ts",
  pairsPath,
  // The element source of the configuration set (005 research.md R-12).
  "packages/elements/src",
  // The Storybook workspace inputs of the configuration set (006 research.md R-16).
  ...storybookInputs,
  // The release inputs of the configuration set (030 research.md R-17).
  ...releaseInputs,
];

interface Entry {
  theme: "light" | "dark";
  fg: string;
  bg: string;
  kind: string;
  figure: string;
  status: string;
  reason?: string;
  source: string;
}

const realPairs = JSON.parse(readFileSync(join(repo, pairsPath), "utf8")) as Entry[];
const realSource = readFileSync(join(repo, sourcePath), "utf8");

function pairsText(entries: readonly Entry[]): string {
  return `[\n${entries.map((entry) => `  ${JSON.stringify(entry)}`).join(",\n")}\n]\n`;
}

/** The pair list with every figure of a pair that names `token` recomputed after the light value of `token` changed. */
function refigured(entries: readonly Entry[], token: string, light: string): Entry[] {
  const changed = applyOverrides(records, [{ token, light }]);
  return entries.map((entry) => {
    if (entry.theme !== "light" || (entry.fg !== token && entry.bg !== token)) return entry;
    const ratio = contrastRatio(resolve(changed, entry.fg, "light"), resolve(changed, entry.bg, "light"));
    const decimals = entry.figure.split(".")[1]?.length ?? 0;
    return { ...entry, figure: ratio.toFixed(decimals) };
  });
}

/** The source text with the light value of one token replaced. */
function relit(text: string, token: string, from: string, to: string): string {
  const at = text.split("\n").findIndex((line) => line.includes(`name: "${token}"`) && line.includes(`light: "${from}"`));
  expect(at).toBeGreaterThan(0);
  return text
    .split("\n")
    .map((line, index) => (index === at ? line.replace(`light: "${from}"`, `light: "${to}"`) : line))
    .join("\n");
}

interface Variant {
  readonly name: string;
  readonly source: string;
  readonly pairs: readonly Entry[];
  readonly summary: string;
}

function variants(): Variant[] {
  const inserted = realSource.split("\n");
  const softAt = inserted.findIndex((line) => line.includes('name: "color-ink-soft"'));
  inserted.splice(softAt, 0, '  { name: "color-inserted", group: "colour", value: { light: "#123456", dark: "#654321" } },');
  const first: Entry = {
    theme: "light",
    fg: "color-ink",
    bg: "color-rule",
    kind: "text",
    figure: contrastRatio("#15130F", "#D9D3C7").toFixed(2),
    status: "checked",
    source: "computed",
  };
  return [
    {
      name: "(1) the neighbour color-ink-soft changed in light",
      source: relit(realSource, "color-ink-soft", "#3F3A33", "#403B34"),
      pairs: refigured(realPairs, "color-ink-soft", "#403B34"),
      summary: "contrast: 207 pairs checked in light, 215 in dark (196 required per theme)",
    },
    {
      name: "(2) a token inserted before color-ink-soft and a pair inserted first",
      source: inserted.join("\n"),
      pairs: [first, ...realPairs],
      summary: "contrast: 208 pairs checked in light, 215 in dark (196 required per theme)",
    },
    {
      name: "(3) the light color-danger changed",
      source: relit(realSource, "color-danger", "#A8322C", "#A5302A"),
      pairs: refigured(realPairs, "color-danger", "#A5302A"),
      summary: "contrast: 207 pairs checked in light, 215 in dark (196 required per theme)",
    },
  ];
}

/** The variant of that name. */
function named(name: string): Variant {
  const found = variants().find((v) => v.name === name);
  if (found === undefined) throw new Error(`no variant ${name}`);
  return found;
}

function changedRoot(variant: Variant): string {
  const root = tempDir("plants-robust");
  for (const path of copied) cpSync(join(repo, path), join(root, path), { recursive: true });
  symlinkSync(join(repo, "node_modules"), join(root, "node_modules"), "dir");
  symlinkSync(realpathSync(join(repo, "storybook/node_modules")), join(root, "storybook/node_modules"), "dir");
  writeFileSync(join(root, sourcePath), variant.source);
  writeFileSync(join(root, pairsPath), pairsText(variant.pairs));
  return root;
}

const otherGates = (JSON.parse(readFileSync(join(repo, "gates/gates.json"), "utf8")) as { id: string }[])
  .map((gate) => gate.id)
  .filter((id) => id !== "contrast" && id !== "brand-rules");
const missing = otherGates.flatMap((id) => ["fail", "pass", "error"].map((kind) => `gates/plants/${id}: plants: missing-plant: gate ${id} has no ${kind} plant`));
/** The plant directories of the two gates and of the registry, as `<gate>/<case>`. */
function plantNames(): string[] {
  return ["contrast", "brand-rules", "plants"].flatMap((dir) =>
    readdirSync(join(repo, "gates/plants", dir), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => `${dir}/${entry.name}`),
  );
}

/** The number of plant directories of the two gates and of the registry. */
function plantCount(): number {
  return plantNames().length;
}

/** Plan decision 24: the stderr lines of the plant times, their seconds written `<s>`, sorted. */
function times(stderr: readonly string[]): string[] {
  return stderr.map((line) => line.replace(/^(note: plant time: [a-z0-9-]+\/[a-z0-9-]+): \d+\.\d s$/, "$1: <s> s")).sort();
}

afterEach(cleanUp);

describe("contrast and brand-rules plants under neighbouring changes", () => {
  it("has the two gates' plants and the registry's", () => {
    // 030: the pack-contents gate is one other gate more (16 before).
    expect({ others: otherGates.length, plants: plantCount() }).toEqual({ others: 17, plants: 39 });
  });

  it.each([
    "(1) the neighbour color-ink-soft changed in light",
    "(2) a token inserted before color-ink-soft and a pair inserted first",
    "(3) the light color-danger changed",
  ])(
    "%s: the change is consistent, and every plant keeps its outcome",
    async (name) => {
      const variant = named(name);
      const root = changedRoot(variant);
      const gate = await runGate("gates/bin/contrast.ts", ["--root", root], { cwd: root, env: baseEnv() });
      expect({ code: gate.code, stdout: gate.stdout }).toEqual({ code: 0, stdout: [variant.summary] });
      const job = await runGate("gates/bin/plants.ts", ["--root", root], { cwd: root, env: baseEnv() });
      expect({ code: job.code, stdout: job.stdout, stderr: times(job.stderr) }).toEqual({
        code: 1,
        stdout: [...missing, `plants: ${String(missing.length)} problems in ${String(plantCount())} plants`],
        stderr: plantNames().map((plant) => `note: plant time: ${plant}: <s> s`).sort(),
      });
    },
    timeout,
  );
});
