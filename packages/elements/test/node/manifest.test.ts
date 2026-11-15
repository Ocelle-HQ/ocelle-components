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

describe("normalise(raw, names): standard attributes (012 research.md R-15; tasks.md T033)", () => {
  it("keeps a standard attribute the element declares with a description, and drops one it observes without declaring", () => {
    const declared = structuredClone(raw);
    (declaration(declared).attributes as Json[])[0] = { name: "aria-label", type: { text: "string" }, description: "Moved onto the inner control." };
    expect({
      declared: (declaration(normalise(declared, [])).attributes as Json[]).map((attribute) => attribute.name),
      undeclared: (declaration(normalise(raw, [])).attributes as Json[]).map((attribute) => attribute.name),
      blank: (declaration(normalise({ ...structuredClone(raw), modules: [{ ...nth(raw.modules, 0, "module"), declarations: [{ ...declaration(raw), attributes: [{ name: "aria-label", description: "" }] }] }] }, [])).attributes as Json[]).map((attribute) => attribute.name),
    }).toEqual({ declared: ["aria-label", "name", "label"], undeclared: ["name", "label"], blank: [] });
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

/** The attributes `ocelle-button` moves onto its inner control, in the order it declares them (012 FR-009). */
const moved = ["aria-expanded", "aria-controls", "aria-current", "aria-haspopup", "aria-pressed", "aria-label", "aria-labelledby", "aria-describedby", "title"];

describe("generate(root) on the repository's element source", () => {
  it("declares ocelle-icon with its tag name, class, name (the union of the thirteen names) and label with types, defaults and attributes, name reflected and label not, and no slot, event, part or CSS property (US1 scenario 11, US2 scenario 1)", async () => {
    const manifest = await generate(repo);
    const modules = manifest.modules as { path: string; declarations: Record<string, unknown>[] }[];
    expect(manifest.schemaVersion).toBe("1.0.0");
    expect(modules.map((module) => module.path)).toEqual(["src/ocelle-brand-mark.ts", "src/ocelle-button.ts", "src/ocelle-icon.ts"]);
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

  it('declares ocelle-button with its tag name, class, variant, size, flush, ground (with "chrome"), label, disabled and busy, the click() method, the default and icon slots, the part control and the event ocelle-button-activate with its detail type, each described (012 FR-009, FR-053; contracts/elements-package.md § ocelle-button)', async () => {
    const manifest = await generate(repo);
    const modules = manifest.modules as { path: string; declarations: Record<string, unknown>[] }[];
    const [button] = modules.find((module) => module.path === "src/ocelle-button.ts")?.declarations ?? [];
    expect(button).toMatchObject({ kind: "class", name: "OcelleButton", tagName: "ocelle-button", customElement: true, cssProperties: [] });
    const described = (list: unknown): Record<string, unknown>[] =>
      ((list ?? []) as Record<string, unknown>[]).map(({ description, ...rest }) => ({ ...rest, described: typeof description === "string" && description !== "" }));
    const variant = '"primary" | "secondary" | "quiet" | undefined';
    const size = '"default" | "compact" | undefined';
    const ground = '"accent-low" | "inset" | "hover-bg" | "state" | "chrome" | undefined';
    expect(described(button?.members)).toEqual([
      { kind: "field", name: "variant", privacy: "public", type: { text: variant }, default: "undefined", attribute: "variant", reflects: true, described: true },
      { kind: "field", name: "size", privacy: "public", type: { text: size }, default: "undefined", attribute: "size", reflects: true, described: true },
      { kind: "field", name: "flush", privacy: "public", type: { text: "boolean" }, default: "false", attribute: "flush", reflects: true, described: true },
      { kind: "field", name: "ground", privacy: "public", type: { text: ground }, default: "undefined", attribute: "ground", reflects: true, described: true },
      { kind: "field", name: "label", privacy: "public", type: { text: "string | undefined" }, default: "undefined", attribute: "label", described: true },
      { kind: "field", name: "disabled", privacy: "public", type: { text: "boolean" }, default: "false", attribute: "disabled", reflects: true, described: true },
      // 012 phase 4 (tasks.md T043, T048; FR-015): busy.
      { kind: "field", name: "busy", privacy: "public", type: { text: "boolean" }, default: "false", attribute: "busy", reflects: true, described: true },
      // 012 phase 3 (tasks.md T033, T037): the link properties.
      ...["href", "target", "rel", "download"].map((name) => ({ kind: "field", name, privacy: "public", type: { text: "string | undefined" }, default: "undefined", attribute: name, reflects: true, described: true })),
      { kind: "method", name: "click", return: { type: { text: "void" } }, described: true },
    ]);
    expect(described(button?.attributes)).toEqual([
      // 012 phase 3 (FR-053; research.md R-15; tasks.md T033): the moved attributes and `title`, then their mirrors, each
      // declared with `@attr` and a description, before the properties' attributes.
      ...moved.map((name) => ({ name, type: { text: "string" }, described: true })),
      ...moved.map((name) => ({ name: `data-ocelle-moved-${name}`, type: { text: "string" }, described: true })),
      { name: "variant", fieldName: "variant", type: { text: variant }, default: "undefined", described: true },
      { name: "size", fieldName: "size", type: { text: size }, default: "undefined", described: true },
      { name: "flush", fieldName: "flush", type: { text: "boolean" }, default: "false", described: true },
      { name: "ground", fieldName: "ground", type: { text: ground }, default: "undefined", described: true },
      { name: "label", fieldName: "label", type: { text: "string | undefined" }, default: "undefined", described: true },
      { name: "disabled", fieldName: "disabled", type: { text: "boolean" }, default: "false", described: true },
      { name: "busy", fieldName: "busy", type: { text: "boolean" }, default: "false", described: true },
      ...["href", "target", "rel", "download"].map((name) => ({ name, fieldName: name, type: { text: "string | undefined" }, default: "undefined", described: true })),
    ]);
    expect(described(button?.cssStates)).toEqual([
      { name: "expanded", described: true },
      { name: "pressed", described: true },
      { name: "current", described: true },
    ]);
    expect(described(button?.slots)).toEqual([
      { name: "", described: true },
      { name: "icon", described: true },
    ]);
    expect(described(button?.cssParts)).toEqual([{ name: "control", described: true }]);
    expect(described(button?.events)).toEqual([{ name: "ocelle-button-activate", type: { text: "CustomEvent<Record<string, never>>" }, described: true }]);
  });

  it("gives ocelle-button no attribute named type, name, value or form, beside its variant attribute (012 FR-022)", async () => {
    const manifest = await generate(repo);
    const modules = manifest.modules as { path: string; declarations: Record<string, unknown>[] }[];
    const [button] = modules.find((module) => module.path === "src/ocelle-button.ts")?.declarations ?? [];
    const names = ((button?.attributes ?? []) as Record<string, unknown>[]).map((attribute) => attribute.name);
    const members = ((button?.members ?? []) as Record<string, unknown>[]).map((member) => member.name);
    expect({ variant: names.includes("variant"), form: names.filter((name) => ["type", "name", "value", "form"].includes(String(name))), formMembers: members.filter((name) => ["type", "name", "value", "form"].includes(String(name))) }).toEqual({
      variant: true,
      form: [],
      formMembers: [],
    });
  });

  it("rejects a root without an element module, naming the directory", async () => {
    await expect(generate(fileURLToPath(new URL(".", import.meta.url)))).rejects.toThrow(/packages\/elements\/src/);
  });
});
