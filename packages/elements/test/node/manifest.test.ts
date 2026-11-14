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

/** A base class in `file`: the properties `open` (Boolean, reflected) and `label`, each described. */
const base = (name: string): string =>
  `import { LitElement } from "lit";\n\n/** A base. */\nexport class ${name} extends LitElement {\n  static override properties = { open: { type: Boolean, reflect: true }, label: { type: String } };\n\n  /**\n   * Whether it is open.\n   *\n   * @default false\n   */\n  declare open: boolean;\n\n  /**\n   * The label.\n   *\n   * @default undefined\n   */\n  declare label: string | undefined;\n}\n`;

/** An element class `name` with the tag `tag`, a subclass of `base` imported from `module`. */
const subclass = (tag: string, name: string, base: string, module: string): string =>
  `import { ${base} } from "./${module}";\n\n/**\n * An element.\n *\n * @tagname ${tag}\n */\nexport class ${name} extends ${base} {}\n`;

describe("generate(root) on other element sources", () => {
  // 008 research.md R-01, operator decision "analyse, then drop it" (2026-11-14): this replaces the pinned rule
  // "reads every src/ocelle-*.ts, its modules in path order, and nothing else of src/" with a stricter one. The
  // generator must read src/overlay.ts too, so an element's members inherited from the overlays' internal base are
  // listed with inheritedFrom, while a base in any other file of src/ (helper.ts) is still not read, and no internal
  // module is published: the published modules are the src/ocelle-*.ts ones only, in path order (constitution VIII:
  // the reason for replacing a pinned test, recorded here).
  it("reads every src/ocelle-*.ts and src/overlay.ts, and nothing else: a base in overlay.ts gives inherited members, one in helper.ts does not; the published modules are the ocelle-* ones only, in path order", async () => {
    const dir = root({
      "packages/elements/src/ocelle-zeta.ts": element("ocelle-zeta"),
      "packages/elements/src/ocelle-alpha.ts": subclass("ocelle-alpha", "Alpha", "OcelleOverlay", "overlay.ts"),
      "packages/elements/src/ocelle-beta.ts": subclass("ocelle-beta", "Beta", "HelperBase", "helper.ts"),
      "packages/elements/src/overlay.ts": base("OcelleOverlay"),
      "packages/elements/src/helper.ts": base("HelperBase"),
      "packages/elements/src/ocelle-alpha.test.js": element("ocelle-test"),
    });
    const manifest = await generate(dir);
    const modules = manifest.modules as Json[];
    const of = (path: string): Json => declaration({ modules: modules.filter((module) => module.path === path) });
    const inherited = (entry: Json, list: "members" | "attributes"): unknown[] => ((entry[list] ?? []) as Json[]).map((each) => [each.name, each.inheritedFrom ?? null]);
    const from = { name: "OcelleOverlay", module: "src/overlay.ts" };
    expect({
      paths: modules.map((module) => module.path),
      declarations: modules.flatMap((module) => ((module.declarations ?? []) as Json[]).map((each) => each.name)),
      alpha: { members: inherited(of("src/ocelle-alpha.ts"), "members"), attributes: inherited(of("src/ocelle-alpha.ts"), "attributes") },
      beta: { members: inherited(of("src/ocelle-beta.ts"), "members"), attributes: inherited(of("src/ocelle-beta.ts"), "attributes") },
    }).toEqual({
      paths: ["src/ocelle-alpha.ts", "src/ocelle-beta.ts", "src/ocelle-zeta.ts"],
      declarations: ["Alpha", "Beta", "E"],
      alpha: { members: [["open", from], ["label", from]], attributes: [["open", from], ["label", from]] },
      beta: { members: [], attributes: [] },
    });
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
    expect(modules.map((module) => module.path)).toEqual(["src/ocelle-brand-mark.ts", "src/ocelle-dialog.ts", "src/ocelle-drawer.ts", "src/ocelle-icon.ts"]);
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

  // 008 tasks.md T018 (FR-045, SC-003; research.md R-01, operator decision "analyse, then drop it", 2026-11-14): the
  // dialog's entry lists the members it inherits from the overlays' internal base with inheritedFrom, its own JSDoc
  // lists exactly, every member described; the published manifest holds no internal base.
  it("declares ocelle-dialog with open (reflected, default false), label and closeLabel / close-label (default \"Close\") inherited from OcelleOverlay, its two events with their detail types, two slots, five parts and one CSS property, each described", async () => {
    const manifest = await generate(repo);
    const modules = manifest.modules as { path: string; declarations: Record<string, unknown>[] }[];
    const [dialog] = modules.find((module) => module.path === "src/ocelle-dialog.ts")?.declarations ?? [];
    const described = (list: unknown): Record<string, unknown>[] =>
      ((list ?? []) as Record<string, unknown>[]).map(({ description, ...rest }) => ({ ...rest, described: typeof description === "string" && description !== "" }));
    const from = { name: "OcelleOverlay", module: "src/overlay.ts" };
    expect({ kind: dialog?.kind, name: dialog?.name, tagName: dialog?.tagName, customElement: dialog?.customElement }).toEqual({ kind: "class", name: "OcelleDialog", tagName: "ocelle-dialog", customElement: true });
    expect(described(dialog?.members)).toEqual([
      { kind: "field", name: "open", privacy: "public", type: { text: "boolean" }, default: "false", attribute: "open", reflects: true, inheritedFrom: from, described: true },
      { kind: "field", name: "label", privacy: "public", type: { text: "string | undefined" }, default: "undefined", attribute: "label", inheritedFrom: from, described: true },
      { kind: "field", name: "closeLabel", privacy: "public", type: { text: "string" }, default: '"Close"', attribute: "close-label", inheritedFrom: from, described: true },
    ]);
    expect(described(dialog?.attributes)).toEqual([
      { name: "open", fieldName: "open", type: { text: "boolean" }, default: "false", inheritedFrom: from, described: true },
      { name: "label", fieldName: "label", type: { text: "string | undefined" }, default: "undefined", inheritedFrom: from, described: true },
      { name: "close-label", fieldName: "closeLabel", type: { text: "string" }, default: '"Close"', inheritedFrom: from, described: true },
    ]);
    expect(described(dialog?.events)).toEqual([
      { name: "ocelle-dialog-close-request", type: { text: 'CustomEvent<{ reason: "escape" | "close-button" }>' }, described: true },
      { name: "ocelle-dialog-close", type: { text: 'CustomEvent<{ reason: "escape" | "close-button" | "host" }>' }, described: true },
    ]);
    expect(described(dialog?.slots)).toEqual([
      { name: "", described: true },
      { name: "footer", described: true },
    ]);
    expect(described(dialog?.cssParts)).toEqual(["panel", "heading", "body", "footer", "close-button"].map((name) => ({ name, described: true })));
    expect(described(dialog?.cssProperties)).toEqual([{ name: "--ocelle-dialog-inline-size", described: true }]);
  });

  // 008 tasks.md T032 (FR-045, SC-003; research.md R-01): the drawer's entry lists its own side, ground and
  // headingHidden, then the members it inherits from the overlays' internal base with inheritedFrom, as T018 asserts for
  // the dialog; its JSDoc lists exactly, with the reason backdrop; no CSS property (no --ocelle-dialog-inline-size).
  it('declares ocelle-drawer with side ("start" | "end", default "start"), ground ("sheet" | "chrome", default "sheet") and headingHidden / heading-hidden (default false), reflected, then open, label and closeLabel inherited from OcelleOverlay, its two events with their detail types, two slots, five parts and no CSS property, each described', async () => {
    const manifest = await generate(repo);
    const modules = manifest.modules as { path: string; declarations: Record<string, unknown>[] }[];
    const [drawer] = modules.find((module) => module.path === "src/ocelle-drawer.ts")?.declarations ?? [];
    const described = (list: unknown): Record<string, unknown>[] =>
      ((list ?? []) as Record<string, unknown>[]).map(({ description, ...rest }) => ({ ...rest, described: typeof description === "string" && description !== "" }));
    const from = { name: "OcelleOverlay", module: "src/overlay.ts" };
    expect({ kind: drawer?.kind, name: drawer?.name, tagName: drawer?.tagName, customElement: drawer?.customElement }).toEqual({ kind: "class", name: "OcelleDrawer", tagName: "ocelle-drawer", customElement: true });
    expect(described(drawer?.members)).toEqual([
      { kind: "field", name: "side", privacy: "public", type: { text: '"start" | "end"' }, default: '"start"', attribute: "side", reflects: true, described: true },
      { kind: "field", name: "ground", privacy: "public", type: { text: '"sheet" | "chrome"' }, default: '"sheet"', attribute: "ground", reflects: true, described: true },
      { kind: "field", name: "headingHidden", privacy: "public", type: { text: "boolean" }, default: "false", attribute: "heading-hidden", reflects: true, described: true },
      { kind: "field", name: "open", privacy: "public", type: { text: "boolean" }, default: "false", attribute: "open", reflects: true, inheritedFrom: from, described: true },
      { kind: "field", name: "label", privacy: "public", type: { text: "string | undefined" }, default: "undefined", attribute: "label", inheritedFrom: from, described: true },
      { kind: "field", name: "closeLabel", privacy: "public", type: { text: "string" }, default: '"Close"', attribute: "close-label", inheritedFrom: from, described: true },
    ]);
    expect(described(drawer?.attributes)).toEqual([
      { name: "side", fieldName: "side", type: { text: '"start" | "end"' }, default: '"start"', described: true },
      { name: "ground", fieldName: "ground", type: { text: '"sheet" | "chrome"' }, default: '"sheet"', described: true },
      { name: "heading-hidden", fieldName: "headingHidden", type: { text: "boolean" }, default: "false", described: true },
      { name: "open", fieldName: "open", type: { text: "boolean" }, default: "false", inheritedFrom: from, described: true },
      { name: "label", fieldName: "label", type: { text: "string | undefined" }, default: "undefined", inheritedFrom: from, described: true },
      { name: "close-label", fieldName: "closeLabel", type: { text: "string" }, default: '"Close"', inheritedFrom: from, described: true },
    ]);
    expect(described(drawer?.events)).toEqual([
      { name: "ocelle-drawer-close-request", type: { text: 'CustomEvent<{ reason: "escape" | "close-button" | "backdrop" }>' }, described: true },
      { name: "ocelle-drawer-close", type: { text: 'CustomEvent<{ reason: "escape" | "close-button" | "backdrop" | "host" }>' }, described: true },
    ]);
    expect(described(drawer?.slots)).toEqual([
      { name: "", described: true },
      { name: "footer", described: true },
    ]);
    expect(described(drawer?.cssParts)).toEqual(["panel", "heading", "body", "footer", "close-button"].map((name) => ({ name, described: true })));
    expect(described(drawer?.cssProperties)).toEqual([]);
  });

  it("publishes no src/overlay.ts module and no OcelleOverlay declaration, in generate(root)'s output and in the committed custom-elements.json", async () => {
    const committed = JSON.parse(readFileSync(join(repo, "packages/elements/custom-elements.json"), "utf8")) as Json;
    const internal = (manifest: Json): unknown => {
      const modules = (manifest.modules ?? []) as Json[];
      return {
        modules: modules.map((module) => module.path).filter((path) => path === "src/overlay.ts"),
        declarations: modules.flatMap((module) => ((module.declarations ?? []) as Json[]).map((each) => each.name)).filter((name) => name === "OcelleOverlay"),
        dialog: modules.some((module) => module.path === "src/ocelle-dialog.ts"),
        drawer: modules.some((module) => module.path === "src/ocelle-drawer.ts"),
      };
    };
    expect({ generated: internal(await generate(repo)), committed: internal(committed) }).toEqual({
      generated: { modules: [], declarations: [], dialog: true, drawer: true },
      committed: { modules: [], declarations: [], dialog: true, drawer: true },
    });
  });

  it("rejects a root without an element module, naming the directory", async () => {
    await expect(generate(fileURLToPath(new URL(".", import.meta.url)))).rejects.toThrow(/packages\/elements\/src/);
  });
});
