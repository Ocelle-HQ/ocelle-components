import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { generate, normalise, serialise } from "../../scripts/manifest.ts";
import type { Manifest } from "../../scripts/manifest.ts";

// The custom-elements manifest generator (005 FR-007, US1 scenario 11; research.md R-06; reviews/phase-2/spike.md § 2;
// T017), in process: the analyzer's `create` API with its Lit plugin over packages/elements/src/ocelle-*.ts, then the
// normaliser, which states the four empty member lists, expands the `IconName` type to the union of the icon names,
// drops the observed `aria-label` attribute (FR-034: a standard attribute, not a member) and members and attributes
// that are not public, and sorts keys. The raw input below is the shape the spike recorded for analyzer 0.11.0.
const repo = fileURLToPath(new URL("../../../..", import.meta.url));

const raw: Manifest = {
  schemaVersion: "1.0.0",
  readme: "",
  modules: [
    {
      kind: "javascript-module",
      path: "src/ocelle-x.ts",
      declarations: [
        {
          kind: "class",
          description: "An element.",
          name: "OcelleX",
          members: [
            { kind: "field", name: "name", privacy: "public", type: { text: "IconName | undefined" }, description: "The name.", default: "undefined", attribute: "name", reflects: true },
            { kind: "field", name: "label", privacy: "public", type: { text: "string | undefined" }, description: "The label.", default: "undefined", attribute: "label" },
            { kind: "field", name: "#internals", privacy: "private", readonly: true },
          ],
          attributes: [
            { name: "aria-label" },
            { name: "name", type: { text: "IconName | undefined" }, description: "The name.", default: "undefined", fieldName: "name" },
            { name: "label", type: { text: "string | undefined" }, description: "The label.", default: "undefined", fieldName: "label" },
          ],
          superclass: { name: "LitElement", package: "lit" },
          tagName: "ocelle-x",
          customElement: true,
        },
      ],
      exports: [{ kind: "js", name: "OcelleX", declaration: { name: "OcelleX", module: "src/ocelle-x.ts" } }],
    },
  ],
};

type Json = Record<string, unknown>;

/** The `index`th entry of a list, or a thrown error naming what is missing. */
function nth(list: unknown, index: number, what: string): Json {
  const found = (list as Json[] | undefined)?.[index];
  if (found === undefined) throw new Error(`no ${what}`);
  return found;
}

/** The first element declaration of a manifest. */
function declaration(manifest: Json): Json {
  return nth(nth(manifest.modules, 0, "module").declarations, 0, "declaration");
}

/** Every object's keys, depth first, each list of keys in the order the object holds them. */
function keyOrders(value: unknown): string[][] {
  if (Array.isArray(value)) return value.flatMap(keyOrders);
  if (typeof value !== "object" || value === null) return [];
  return [Object.keys(value), ...Object.values(value).flatMap(keyOrders)];
}

const untouched = structuredClone(raw);

describe("normalise(raw, names)", () => {
  it("states empty slots, events, cssParts and cssProperties, expands IconName, drops aria-label and the private member", () => {
    expect(normalise(raw, ["close", "menu"])).toEqual({
      schemaVersion: "1.0.0",
      readme: "",
      modules: [
        {
          kind: "javascript-module",
          path: "src/ocelle-x.ts",
          declarations: [
            {
              kind: "class",
              description: "An element.",
              name: "OcelleX",
              members: [
                { kind: "field", name: "name", privacy: "public", type: { text: '"close" | "menu" | undefined' }, description: "The name.", default: "undefined", attribute: "name", reflects: true },
                { kind: "field", name: "label", privacy: "public", type: { text: "string | undefined" }, description: "The label.", default: "undefined", attribute: "label" },
              ],
              attributes: [
                { name: "name", type: { text: '"close" | "menu" | undefined' }, description: "The name.", default: "undefined", fieldName: "name" },
                { name: "label", type: { text: "string | undefined" }, description: "The label.", default: "undefined", fieldName: "label" },
              ],
              slots: [],
              events: [],
              cssParts: [],
              cssProperties: [],
              superclass: { name: "LitElement", package: "lit" },
              tagName: "ocelle-x",
              customElement: true,
            },
          ],
          exports: [{ kind: "js", name: "OcelleX", declaration: { name: "OcelleX", module: "src/ocelle-x.ts" } }],
        },
      ],
    });
  });

  it("sorts the keys of every object, and leaves lists in their order", () => {
    const orders = keyOrders(normalise(raw, ["close", "menu"]));
    expect(orders.filter((keys) => keys.join() !== [...keys].sort().join())).toEqual([]);
    expect(orders[0]).toEqual(["modules", "readme", "schemaVersion"]);
  });

  it("keeps lists that the analyzer stated, and leaves raw untouched", () => {
    const stated = structuredClone(raw);
    declaration(stated).slots = [{ name: "icon", description: "The icon." }];
    expect(declaration(normalise(stated, [])).slots).toEqual([{ description: "The icon.", name: "icon" }]);
    expect(raw).toEqual(untouched);
    expect(declaration(raw)).not.toHaveProperty("slots");
  });

  it("expands IconName only as a whole word", () => {
    const named = structuredClone(raw);
    nth(declaration(named).members, 1, "member").type = { text: "IconNames | MyIconName" };
    expect(nth(declaration(normalise(named, ["close"])).members, 1, "member").type).toEqual({ text: "IconNames | MyIconName" });
  });
});

describe("serialise(manifest)", () => {
  it("writes JSON with two-space indentation and one trailing newline", () => {
    expect(serialise({ b: [1], a: "x" })).toBe('{\n  "b": [\n    1\n  ],\n  "a": "x"\n}\n');
  });
});

describe("generate(root) on the repository's element source", () => {
  it("declares ocelle-icon with its tag name, class, name and label with types, defaults and attributes, name reflected and label not, and no slot, event, part or CSS property (US1 scenario 11)", async () => {
    const manifest = await generate(repo);
    const modules = manifest.modules as { path: string; declarations: Record<string, unknown>[] }[];
    expect(manifest.schemaVersion).toBe("1.0.0");
    expect(modules.map((module) => module.path)).toEqual(["src/ocelle-icon.ts"]);
    const [icon] = modules[0]?.declarations ?? [];
    expect(icon).toMatchObject({
      kind: "class",
      name: "OcelleIcon",
      tagName: "ocelle-icon",
      customElement: true,
      slots: [],
      events: [],
      cssParts: [],
      cssProperties: [],
    });
    const members = (icon?.members as Record<string, unknown>[]).map(({ description, ...rest }) => ({ ...rest, described: typeof description === "string" && description !== "" }));
    expect(members).toEqual([
      { kind: "field", name: "name", privacy: "public", type: { text: '"close" | "menu" | undefined' }, default: "undefined", attribute: "name", reflects: true, described: true },
      { kind: "field", name: "label", privacy: "public", type: { text: "string | undefined" }, default: "undefined", attribute: "label", described: true },
    ]);
    const attributes = (icon?.attributes as Record<string, unknown>[]).map(({ description, ...rest }) => ({ ...rest, described: typeof description === "string" && description !== "" }));
    expect(attributes).toEqual([
      { name: "name", fieldName: "name", type: { text: '"close" | "menu" | undefined' }, default: "undefined", described: true },
      { name: "label", fieldName: "label", type: { text: "string | undefined" }, default: "undefined", described: true },
    ]);
  });

  it("rejects a root without an element module, naming the directory", async () => {
    await expect(generate(fileURLToPath(new URL(".", import.meta.url)))).rejects.toThrow(/packages\/elements\/src/);
  });
});
