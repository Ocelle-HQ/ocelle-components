import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { generate, iconNames, normalise, serialise, writeManifest } from "../../scripts/manifest.ts";
import type { Manifest } from "../../scripts/manifest.ts";

// The custom-elements manifest generator (005 FR-007, US1 scenario 11; research.md R-06; reviews/phase-2/spike.md § 2;
// T017, T054), in process: the analyzer's `create` API with its Lit plugin over packages/elements/src/ocelle-*.ts, then the
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

  it("orders the modules by path, whatever order the analyzer read them in", () => {
    const module = (path: string): Json => ({ kind: "javascript-module", path, declarations: [], exports: [] });
    const out = normalise({ ...raw, modules: [module("src/ocelle-zeta.ts"), module("src/ocelle-alpha.ts"), module("src/ocelle-mid.ts")] }, []);
    expect((out.modules as Json[]).map((each) => each.path)).toEqual(["src/ocelle-alpha.ts", "src/ocelle-mid.ts", "src/ocelle-zeta.ts"]);
  });

  it("orders the modules by code point, not by locale: upper case before lower case, '-' before '.' (phase 2 review R1-06)", () => {
    const module = (path: string): Json => ({ kind: "javascript-module", path, declarations: [], exports: [] });
    const paths = ["src/ocelle-b.ts", "src/ocelle-icon.ts", "src/ocelle-B.ts", "src/ocelle-icon-row.ts", "src/ocelle-a.ts"];
    const out = normalise({ ...raw, modules: paths.map(module) }, []);
    expect((out.modules as Json[]).map((each) => each.path)).toEqual(["src/ocelle-B.ts", "src/ocelle-a.ts", "src/ocelle-b.ts", "src/ocelle-icon-row.ts", "src/ocelle-icon.ts"]);
  });

  it("keeps two modules with the same path in the order the analyzer gave them", () => {
    const module = (path: string, name: string): Json => ({ kind: "javascript-module", path, declarations: [{ kind: "function", name }], exports: [] });
    const out = normalise({ ...raw, modules: [module("src/ocelle-x.ts", "first"), module("src/ocelle-a.ts", "other"), module("src/ocelle-x.ts", "second")] }, []);
    expect((out.modules as Json[]).map((each) => [each.path, (each.declarations as Json[])[0]?.name])).toEqual([
      ["src/ocelle-a.ts", "other"],
      ["src/ocelle-x.ts", "first"],
      ["src/ocelle-x.ts", "second"],
    ]);
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

describe("normalise(raw, names): what is not an element, and members that are not public", () => {
  it("drops entries that are not objects and leaves declarations that are not custom elements as they are", () => {
    const helper = { kind: "function", name: "helper", members: [{ kind: "field", name: "x" }] };
    const junk: Manifest = { ...raw, modules: [null, "module", [], { path: "src/helper.ts", declarations: [null, 3, [], helper] }, ...(raw.modules as unknown[])] };
    const out = normalise(junk, []);
    expect((out.modules as Json[]).map((module) => module.path)).toEqual(["src/helper.ts", "src/ocelle-x.ts"]);
    expect(nth(out.modules, 0, "module").declarations).toEqual([helper]);
  });

  it("drops protected members with the attributes of dropped members, and keeps an observed attribute that is not a member's", () => {
    const changed = structuredClone(raw);
    const element = declaration(changed);
    (element.members as Json[]).push({ kind: "field", name: "cache", privacy: "protected", description: "A cache." });
    (element.attributes as Json[]).push({ name: "cache", fieldName: "cache", description: "A cache." }, { name: "tone", description: "An observed attribute." });
    const out = declaration(normalise(changed, []));
    expect({ members: (out.members as Json[]).map((member) => member.name), attributes: (out.attributes as Json[]).map((attribute) => attribute.name) }).toEqual({
      members: ["name", "label"],
      attributes: ["name", "label", "tone"],
    });
  });
});

describe("iconNames(text of src/icons.ts)", () => {
  it.each([
    { label: "a union, after other statements", text: 'export type Other = "x" | "y";\nexport type IconName = "close" | "menu";\n', names: ["close", "menu"] },
    { label: "one name", text: 'export type IconName = "close";\n', names: ["close"] },
    { label: "a member that is not a string literal, skipped", text: 'export type IconName = "close" | Other | 3 | "menu";\n', names: ["close", "menu"] },
    { label: "no IconName alias", text: 'export type Other = "close";\nexport const icons = {};\n', names: [] },
  ])("reads $label", ({ text, names }) => {
    expect(iconNames(text)).toEqual(names);
  });
});

const made: string[] = [];
afterEach(() => {
  for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/** A temporary repository root with `files` at their paths. */
function root(files: Readonly<Record<string, string>>): string {
  const dir = mkdtempSync(join(tmpdir(), "ocelle-manifest-"));
  made.push(dir);
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), text);
  }
  return dir;
}

const element = (tag: string): string =>
  `import { LitElement } from "lit";\n\n/**\n * An element.\n *\n * @tagname ${tag}\n */\nexport class E extends LitElement {\n  static override properties = { name: {} };\n\n  /**\n   * A name.\n   *\n   * @default undefined\n   */\n  declare name: IconName | undefined;\n}\n`;

describe("generate(root) on other element sources", () => {
  it("reads every src/ocelle-*.ts, its modules in path order, and nothing else of src/", async () => {
    const dir = root({
      "packages/elements/src/ocelle-zeta.ts": element("ocelle-zeta"),
      "packages/elements/src/ocelle-alpha.ts": element("ocelle-alpha"),
      "packages/elements/src/helper.ts": element("ocelle-helper"),
      "packages/elements/src/ocelle-alpha.test.js": element("ocelle-test"),
    });
    const modules = (await generate(dir)).modules as Json[];
    expect(modules.map((module) => module.path)).toEqual(["src/ocelle-alpha.ts", "src/ocelle-zeta.ts"]);
  });

  it("leaves IconName unexpanded without src/icons.ts", async () => {
    const dir = root({ "packages/elements/src/ocelle-alpha.ts": element("ocelle-alpha") });
    expect(nth(declaration(await generate(dir)).members, 0, "member").type).toEqual({ text: "IconName | undefined" });
  });
});

describe("writeManifest(root)", () => {
  it("writes packages/elements/custom-elements.json from the root's element source, as serialise(generate(root))", async () => {
    const dir = root({});
    cpSync(join(repo, "packages/elements/src"), join(dir, "packages/elements/src"), { recursive: true });
    await writeManifest(dir);
    expect(readFileSync(join(dir, "packages/elements/custom-elements.json"), "utf8")).toBe(serialise(await generate(dir)));
    expect(readFileSync(join(dir, "packages/elements/custom-elements.json"), "utf8")).toContain('"tagName": "ocelle-icon"');
  });
});

describe("serialise(manifest)", () => {
  it("writes JSON with two-space indentation and one trailing newline", () => {
    expect(serialise({ b: [1], a: "x" })).toBe('{\n  "b": [\n    1\n  ],\n  "a": "x"\n}\n');
  });
});

/**
 * The type of `name`: the union of exactly the thirteen names of the set, in the order of spec US2 scenario 1, or
 * undefined (US2-1, FR-018).
 */
const unionOfTheSet =
  '"chevron-start" | "chevron-end" | "chevron-up" | "chevron-down" | "arrow-start" | "arrow-end" | "menu" | "close" | "folder" | "file" | "search" | "table" | "copy" | undefined';

describe("generate(root) on the repository's element source", () => {
  it("declares ocelle-icon with its tag name, class, name (the union of the thirteen names) and label with types, defaults and attributes, name reflected and label not, and no slot, event, part or CSS property (US1 scenario 11, US2 scenario 1)", async () => {
    const manifest = await generate(repo);
    const modules = manifest.modules as { path: string; declarations: Record<string, unknown>[] }[];
    expect(manifest.schemaVersion).toBe("1.0.0");
    expect(modules.map((module) => module.path)).toEqual(["src/ocelle-brand-mark.ts", "src/ocelle-card.ts", "src/ocelle-context-sidebar.ts", "src/ocelle-empty-state.ts", "src/ocelle-fact.ts", "src/ocelle-facts.ts", "src/ocelle-icon.ts", "src/ocelle-page-header.ts", "src/ocelle-personal-rail.ts", "src/ocelle-progress.ts", "src/ocelle-section-header.ts"]);
    const [icon] = modules.find((module) => module.path === "src/ocelle-icon.ts")?.declarations ?? [];
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
      { kind: "field", name: "name", privacy: "public", type: { text: unionOfTheSet }, default: "undefined", attribute: "name", reflects: true, described: true },
      { kind: "field", name: "label", privacy: "public", type: { text: "string | undefined" }, default: "undefined", attribute: "label", described: true },
    ]);
    const attributes = (icon?.attributes as Record<string, unknown>[]).map(({ description, ...rest }) => ({ ...rest, described: typeof description === "string" && description !== "" }));
    expect(attributes).toEqual([
      { name: "name", fieldName: "name", type: { text: unionOfTheSet }, default: "undefined", described: true },
      { name: "label", fieldName: "label", type: { text: "string | undefined" }, default: "undefined", described: true },
    ]);
  });

  it('declares ocelle-brand-mark with its tag name, class, ground ("chrome" | undefined) and tone ("mono" | undefined), reflected, and label (string | undefined), not reflected, each with the default undefined, and no slot, event, part or CSS property (US4 scenario 12)', async () => {
    const manifest = await generate(repo);
    const modules = manifest.modules as { path: string; declarations: Record<string, unknown>[] }[];
    const [mark] = modules.find((module) => module.path === "src/ocelle-brand-mark.ts")?.declarations ?? [];
    expect(mark).toMatchObject({
      kind: "class",
      name: "OcelleBrandMark",
      tagName: "ocelle-brand-mark",
      customElement: true,
      slots: [],
      events: [],
      cssParts: [],
      cssProperties: [],
    });
    const described = (list: unknown): Record<string, unknown>[] =>
      ((list ?? []) as Record<string, unknown>[]).map(({ description, ...rest }) => ({ ...rest, described: typeof description === "string" && description !== "" }));
    expect(described(mark?.members)).toEqual([
      { kind: "field", name: "ground", privacy: "public", type: { text: '"chrome" | undefined' }, default: "undefined", attribute: "ground", reflects: true, described: true },
      { kind: "field", name: "tone", privacy: "public", type: { text: '"mono" | undefined' }, default: "undefined", attribute: "tone", reflects: true, described: true },
      { kind: "field", name: "label", privacy: "public", type: { text: "string | undefined" }, default: "undefined", attribute: "label", described: true },
    ]);
    expect(described(mark?.attributes)).toEqual([
      { name: "ground", fieldName: "ground", type: { text: '"chrome" | undefined' }, default: "undefined", described: true },
      { name: "tone", fieldName: "tone", type: { text: '"mono" | undefined' }, default: "undefined", described: true },
      { name: "label", fieldName: "label", type: { text: "string | undefined" }, default: "undefined", described: true },
    ]);
  });

  // 011 (FR-006, FR-007, FR-034; contracts/elements-package.md § Elements; T015): the section header and the card, each
  // with its reflected variant properties, typed and defaulting to not set, its slots, and empty event, part and CSS
  // property lists.
  const described = (list: unknown): Record<string, unknown>[] =>
    ((list ?? []) as Record<string, unknown>[]).map(({ description, ...rest }) => ({ ...rest, described: typeof description === "string" && description !== "" }));

  it('declares ocelle-section-header with its tag name and class, size ("regular" | "compact" | undefined) and variant ("default" | "eyebrow" | undefined), reflected, each with the default undefined, the slots heading, eyebrow, description and actions, and no event, part or CSS property (FR-034)', async () => {
    const modules = (await generate(repo)).modules as { path: string; declarations: Record<string, unknown>[] }[];
    const [header] = modules.find((module) => module.path === "src/ocelle-section-header.ts")?.declarations ?? [];
    expect(header).toMatchObject({ kind: "class", name: "OcelleSectionHeader", tagName: "ocelle-section-header", customElement: true, events: [], cssParts: [], cssProperties: [] });
    expect(described(header?.members)).toEqual([
      { kind: "field", name: "size", privacy: "public", type: { text: '"regular" | "compact" | undefined' }, default: "undefined", attribute: "size", reflects: true, described: true },
      { kind: "field", name: "variant", privacy: "public", type: { text: '"default" | "eyebrow" | undefined' }, default: "undefined", attribute: "variant", reflects: true, described: true },
    ]);
    expect(described(header?.attributes)).toEqual([
      { name: "size", fieldName: "size", type: { text: '"regular" | "compact" | undefined' }, default: "undefined", described: true },
      { name: "variant", fieldName: "variant", type: { text: '"default" | "eyebrow" | undefined' }, default: "undefined", described: true },
    ]);
    expect(described(header?.slots)).toEqual(["heading", "eyebrow", "description", "actions"].map((name) => ({ name, described: true })));
  });

  it('declares ocelle-page-header with its tag name and class, size ("regular" | "compact" | undefined), reflected, with the default undefined, the slots heading, eyebrow, description and actions, and no event, part or CSS property (011 FR-019, FR-034; T027)', async () => {
    const modules = (await generate(repo)).modules as { path: string; declarations: Record<string, unknown>[] }[];
    const [header] = modules.find((module) => module.path === "src/ocelle-page-header.ts")?.declarations ?? [];
    expect(header).toMatchObject({ kind: "class", name: "OcellePageHeader", tagName: "ocelle-page-header", customElement: true, events: [], cssParts: [], cssProperties: [] });
    expect(described(header?.members)).toEqual([
      { kind: "field", name: "size", privacy: "public", type: { text: '"regular" | "compact" | undefined' }, default: "undefined", attribute: "size", reflects: true, described: true },
    ]);
    expect(described(header?.attributes)).toEqual([{ name: "size", fieldName: "size", type: { text: '"regular" | "compact" | undefined' }, default: "undefined", described: true }]);
    expect(described(header?.slots)).toEqual(["heading", "eyebrow", "description", "actions"].map((name) => ({ name, described: true })));
  });

  it('declares ocelle-card with its tag name and class, density ("regular" | "compact" | undefined) and inset (boolean | undefined), reflected, each with the default undefined, the slots header and the default slot, and no event, part or CSS property (FR-034)', async () => {
    const modules = (await generate(repo)).modules as { path: string; declarations: Record<string, unknown>[] }[];
    const [card] = modules.find((module) => module.path === "src/ocelle-card.ts")?.declarations ?? [];
    expect(card).toMatchObject({ kind: "class", name: "OcelleCard", tagName: "ocelle-card", customElement: true, events: [], cssParts: [], cssProperties: [] });
    expect(described(card?.members)).toEqual([
      { kind: "field", name: "density", privacy: "public", type: { text: '"regular" | "compact" | undefined' }, default: "undefined", attribute: "density", reflects: true, described: true },
      { kind: "field", name: "inset", privacy: "public", type: { text: "boolean | undefined" }, default: "undefined", attribute: "inset", reflects: true, described: true },
    ]);
    expect(described(card?.attributes)).toEqual([
      { name: "density", fieldName: "density", type: { text: '"regular" | "compact" | undefined' }, default: "undefined", described: true },
      { name: "inset", fieldName: "inset", type: { text: "boolean | undefined" }, default: "undefined", described: true },
    ]);
    expect(described(card?.slots)).toEqual([
      { name: "header", described: true },
      { name: "", described: true },
    ]);
  });

  it("declares ocelle-context-sidebar with its tag name and class, label (string | undefined), not reflected, with the default undefined, the slots head, the default slot and footer, no event, part or CSS property, and no member for its internals key (011 FR-020, FR-021, FR-034; research.md R-11; T034)", async () => {
    const modules = (await generate(repo)).modules as { path: string; declarations: Record<string, unknown>[] }[];
    const [sidebar] = modules.find((module) => module.path === "src/ocelle-context-sidebar.ts")?.declarations ?? [];
    expect(sidebar).toMatchObject({ kind: "class", name: "OcelleContextSidebar", tagName: "ocelle-context-sidebar", customElement: true, events: [], cssParts: [], cssProperties: [] });
    const members = described(sidebar?.members);
    expect({
      members,
      internals: members.filter((member) => JSON.stringify(member).toLowerCase().includes("internals")),
    }).toEqual({
      members: [{ kind: "field", name: "label", privacy: "public", type: { text: "string | undefined" }, default: "undefined", attribute: "label", described: true }],
      internals: [],
    });
    expect(described(sidebar?.attributes)).toEqual([{ name: "label", fieldName: "label", type: { text: "string | undefined" }, default: "undefined", described: true }]);
    expect(described(sidebar?.slots)).toEqual(["head", "", "footer"].map((name) => ({ name, described: true })));
  });

  it("declares ocelle-personal-rail with its tag name and class, label (string | undefined), not reflected, and orientation (\"vertical\" | \"horizontal\" | undefined), reflected, each with the default undefined, the default slot and bottom, no event, part or CSS property, and no member for its internals key (011 FR-024 to FR-026, FR-034; research.md R-11; T042)", async () => {
    const modules = (await generate(repo)).modules as { path: string; declarations: Record<string, unknown>[] }[];
    const [rail] = modules.find((module) => module.path === "src/ocelle-personal-rail.ts")?.declarations ?? [];
    expect(rail).toMatchObject({ kind: "class", name: "OcellePersonalRail", tagName: "ocelle-personal-rail", customElement: true, events: [], cssParts: [], cssProperties: [] });
    const members = described(rail?.members);
    expect({
      members,
      internals: members.filter((member) => JSON.stringify(member).toLowerCase().includes("internals")),
    }).toEqual({
      members: [
        { kind: "field", name: "label", privacy: "public", type: { text: "string | undefined" }, default: "undefined", attribute: "label", described: true },
        { kind: "field", name: "orientation", privacy: "public", type: { text: '"vertical" | "horizontal" | undefined' }, default: "undefined", attribute: "orientation", reflects: true, described: true },
      ],
      internals: [],
    });
    expect(described(rail?.attributes)).toEqual([
      { name: "label", fieldName: "label", type: { text: "string | undefined" }, default: "undefined", described: true },
      { name: "orientation", fieldName: "orientation", type: { text: '"vertical" | "horizontal" | undefined' }, default: "undefined", described: true },
    ]);
    expect(described(rail?.slots)).toEqual(["", "bottom"].map((name) => ({ name, described: true })));
  });

  // 013 (T017; contracts/elements.md § `ocelle-facts`, § `ocelle-fact`): every list stated, every member described.
  it('declares ocelle-facts with density ("compact" | undefined) and layout ("columns" | "stacked" | "grid" | undefined), reflected, its default slot, the parts list, label and value, and its three CSS properties, each described', async () => {
    const manifest = await generate(repo);
    const modules = manifest.modules as { path: string; declarations: Record<string, unknown>[] }[];
    const [facts] = modules.find((module) => module.path === "src/ocelle-facts.ts")?.declarations ?? [];
    const named = (list: unknown): unknown => ((list ?? []) as Record<string, unknown>[]).map(({ name, description }) => ({ name, described: typeof description === "string" && description !== "" }));
    const described = (list: unknown): Record<string, unknown>[] =>
      ((list ?? []) as Record<string, unknown>[]).map(({ description, ...rest }) => ({ ...rest, described: typeof description === "string" && description !== "" }));
    expect({ kind: facts?.kind, name: facts?.name, tagName: facts?.tagName, customElement: facts?.customElement, events: facts?.events }).toEqual({ kind: "class", name: "OcelleFacts", tagName: "ocelle-facts", customElement: true, events: [] });
    expect(described(facts?.members)).toEqual([
      { kind: "field", name: "density", privacy: "public", type: { text: '"compact" | undefined' }, default: "undefined", attribute: "density", reflects: true, described: true },
      { kind: "field", name: "layout", privacy: "public", type: { text: '"columns" | "stacked" | "grid" | undefined' }, default: "undefined", attribute: "layout", reflects: true, described: true },
    ]);
    expect({ slots: named(facts?.slots), parts: named(facts?.cssParts), properties: named(facts?.cssProperties) }).toEqual({
      slots: [{ name: "", described: true }],
      parts: [{ name: "list", described: true }, { name: "label", described: true }, { name: "value", described: true }],
      properties: [{ name: "--ocelle-facts-stack-below", described: true }, { name: "--ocelle-facts-value-size", described: true }, { name: "--ocelle-facts-value-line-height", described: true }],
    });
  });

  // 013 (T030; contracts/elements.md § `ocelle-empty-state`): every list stated, every member described.
  it('declares ocelle-empty-state with variant ("panel" | undefined), reflected, the slots visual, eyebrow, heading, default and actions, the part body, and no event or CSS property, each described', async () => {
    const manifest = await generate(repo);
    const modules = manifest.modules as { path: string; declarations: Record<string, unknown>[] }[];
    const [state] = modules.find((module) => module.path === "src/ocelle-empty-state.ts")?.declarations ?? [];
    const named = (list: unknown): unknown => ((list ?? []) as Record<string, unknown>[]).map(({ name, description }) => ({ name, described: typeof description === "string" && description !== "" }));
    const described = (list: unknown): Record<string, unknown>[] =>
      ((list ?? []) as Record<string, unknown>[]).map(({ description, ...rest }) => ({ ...rest, described: typeof description === "string" && description !== "" }));
    expect({ kind: state?.kind, name: state?.name, tagName: state?.tagName, customElement: state?.customElement, events: state?.events }).toEqual({ kind: "class", name: "OcelleEmptyState", tagName: "ocelle-empty-state", customElement: true, events: [] });
    expect(described(state?.members)).toEqual([
      { kind: "field", name: "variant", privacy: "public", type: { text: '"panel" | undefined' }, default: "undefined", attribute: "variant", reflects: true, described: true },
    ]);
    expect(described(state?.attributes)).toEqual([{ name: "variant", fieldName: "variant", type: { text: '"panel" | undefined' }, default: "undefined", described: true }]);
    expect({ slots: named(state?.slots), parts: named(state?.cssParts), properties: state?.cssProperties }).toEqual({
      slots: [
        { name: "visual", described: true },
        { name: "eyebrow", described: true },
        { name: "heading", described: true },
        { name: "", described: true },
        { name: "actions", described: true },
      ],
      parts: [{ name: "body", described: true }],
      properties: [],
    });
  });

  // 013 phase 3 (T048; contracts/elements.md § `ocelle-progress`): every list stated, every member described; the host
  // `aria-label` is observed, not declared (README § Element conventions).
  it('declares ocelle-progress with value and max (number | undefined), valueText, label, showLabel, size ("compact" | undefined, reflected) and ground ("tinted" | undefined, reflected), no slot, the parts track, fill, label and value-text, and no event or CSS property, each described', async () => {
    const manifest = await generate(repo);
    const modules = manifest.modules as { path: string; declarations: Record<string, unknown>[] }[];
    const [bar] = modules.find((module) => module.path === "src/ocelle-progress.ts")?.declarations ?? [];
    const named = (list: unknown): unknown => ((list ?? []) as Record<string, unknown>[]).map(({ name, description }) => ({ name, described: typeof description === "string" && description !== "" }));
    const described = (list: unknown): Record<string, unknown>[] =>
      ((list ?? []) as Record<string, unknown>[]).map(({ description, ...rest }) => ({ ...rest, described: typeof description === "string" && description !== "" }));
    const field = (name: string, type: string, attribute: string, reflects = false): Record<string, unknown> => ({
      kind: "field",
      name,
      privacy: "public",
      type: { text: type },
      default: "undefined",
      attribute,
      ...(reflects ? { reflects: true } : {}),
      described: true,
    });
    const attribute = (name: string, fieldName: string, type: string): Record<string, unknown> => ({ name, fieldName, type: { text: type }, default: "undefined", described: true });
    expect({ kind: bar?.kind, name: bar?.name, tagName: bar?.tagName, customElement: bar?.customElement, events: bar?.events }).toEqual({ kind: "class", name: "OcelleProgress", tagName: "ocelle-progress", customElement: true, events: [] });
    expect(described(bar?.members)).toEqual([
      field("value", "number | undefined", "value"),
      field("max", "number | undefined", "max"),
      field("valueText", "string | undefined", "value-text"),
      field("label", "string | undefined", "label"),
      field("showLabel", "boolean | undefined", "show-label"),
      field("size", '"compact" | undefined', "size", true),
      field("ground", '"tinted" | undefined', "ground", true),
    ]);
    expect(described(bar?.attributes)).toEqual([
      attribute("value", "value", "number | undefined"),
      attribute("max", "max", "number | undefined"),
      attribute("value-text", "valueText", "string | undefined"),
      attribute("label", "label", "string | undefined"),
      attribute("show-label", "showLabel", "boolean | undefined"),
      attribute("size", "size", '"compact" | undefined'),
      attribute("ground", "ground", '"tinted" | undefined'),
    ]);
    expect({ slots: bar?.slots, parts: named(bar?.cssParts), properties: bar?.cssProperties, ariaLabel: JSON.stringify(bar).includes('"aria-label"') }).toEqual({
      slots: [],
      parts: [
        { name: "track", described: true },
        { name: "fill", described: true },
        { name: "label", described: true },
        { name: "value-text", described: true },
      ],
      properties: [],
      ariaLabel: false,
    });
  });

  it("declares ocelle-fact with label (string | undefined) and wrap (\"anywhere\" | undefined), reflected, its default slot, the part label and the two value hooks, each described", async () => {
    const manifest = await generate(repo);
    const modules = manifest.modules as { path: string; declarations: Record<string, unknown>[] }[];
    const [fact] = modules.find((module) => module.path === "src/ocelle-fact.ts")?.declarations ?? [];
    const named = (list: unknown): unknown => ((list ?? []) as Record<string, unknown>[]).map(({ name, description }) => ({ name, described: typeof description === "string" && description !== "" }));
    const described = (list: unknown): Record<string, unknown>[] =>
      ((list ?? []) as Record<string, unknown>[]).map(({ description, ...rest }) => ({ ...rest, described: typeof description === "string" && description !== "" }));
    expect({ name: fact?.name, tagName: fact?.tagName, events: fact?.events }).toEqual({ name: "OcelleFact", tagName: "ocelle-fact", events: [] });
    expect(described(fact?.members)).toEqual([
      { kind: "field", name: "label", privacy: "public", type: { text: "string | undefined" }, default: "undefined", attribute: "label", reflects: true, described: true },
      { kind: "field", name: "wrap", privacy: "public", type: { text: '"anywhere" | undefined' }, default: "undefined", attribute: "wrap", reflects: true, described: true },
    ]);
    expect({ slots: named(fact?.slots), parts: named(fact?.cssParts), properties: named(fact?.cssProperties) }).toEqual({
      slots: [{ name: "", described: true }],
      parts: [{ name: "label", described: true }],
      properties: [{ name: "--ocelle-facts-value-size", described: true }, { name: "--ocelle-facts-value-line-height", described: true }],
    });
  });

  it("rejects a root without an element module, naming the directory", async () => {
    await expect(generate(fileURLToPath(new URL(".", import.meta.url)))).rejects.toThrow(/packages\/elements\/src/);
  });
});
