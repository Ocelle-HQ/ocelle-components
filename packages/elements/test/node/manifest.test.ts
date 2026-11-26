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

describe("normalise(raw, names): the observed standard attributes (specs/010-feedback-forms FR-034; T022a, T030)", () => {
  it("drops aria-label, role, hidden, form, aria-invalid, aria-required, aria-disabled and aria-description, and keeps an attribute of the element's own without a field", () => {
    const changed = structuredClone(raw);
    const standard = ["role", "hidden", "form", "aria-invalid", "aria-required", "aria-disabled", "aria-description"];
    (declaration(changed).attributes as Json[]).push(...standard.map((name) => ({ name })), { name: "value", type: { text: "string" }, default: '""', description: "The default value." });
    expect((declaration(normalise(changed, [])).attributes as Json[]).map((attribute) => attribute.name)).toEqual(["name", "label", "value"]);
  });
});

// specs/010-feedback-forms operator round 3 (reviews/phase-3/round-3.md, O3-01; T041c): the fold(raw) tests of T036 are
// removed with fold itself. They pinned the rule the operator replaced at the landing of PR #49 ("Main's rule +
// FormControl"): an internal base's members are listed on the element with inheritedFrom, and its superclass is kept as
// the analyzer writes it, as mission 008 does for src/overlay.ts (constitution VIII: the reason for replacing pinned
// tests, recorded here).
describe("normalise(raw, names): what an element inherits from an internal base (specs/010-feedback-forms O3-01; T041c)", () => {
  it("keeps a member's and an attribute's inheritedFrom and the declaration's superclass as given", () => {
    const from = { name: "FormControl", module: "src/form-control.ts" };
    const changed = structuredClone(raw);
    const element = declaration(changed);
    element.superclass = { name: "FormControl", module: "/src/form-control.ts" };
    (element.members as Json[]).push({ kind: "field", name: "required", privacy: "public", type: { text: "boolean" }, description: "Required.", attribute: "required", inheritedFrom: from });
    (element.attributes as Json[]).push({ name: "required", fieldName: "required", type: { text: "boolean" }, description: "Required.", inheritedFrom: from });
    const out = declaration(normalise(changed, []));
    const inherited = (list: unknown): unknown[] => ((list ?? []) as Json[]).map((each) => [each.name, each.inheritedFrom ?? null]);
    expect({ superclass: out.superclass, members: inherited(out.members), attributes: inherited(out.attributes) }).toEqual({
      superclass: { module: "/src/form-control.ts", name: "FormControl" },
      members: [["name", null], ["label", null], ["required", { module: "src/form-control.ts", name: "FormControl" }]],
      attributes: [["name", null], ["label", null], ["required", { module: "src/form-control.ts", name: "FormControl" }]],
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

/**
 * An internal base class `name`: a reflected property, a getter, a method, a focus() override and observed standard
 * attributes.
 */
const controlBase = (name: string): string => `import { LitElement } from "lit";

/** A base. */
export class ${name} extends LitElement {
  static override properties = { name: { type: String, reflect: true } };

  /** The observed standard attributes. */
  static override get observedAttributes(): string[] {
    return [...super.observedAttributes, "aria-label", "form", "aria-invalid"];
  }

  /**
   * The name.
   *
   * @default ""
   */
  declare name: string;

  /** The owning form. */
  get form(): HTMLFormElement | null {
    return null;
  }

  /** Whether it is valid. */
  checkValidity(): boolean {
    return true;
  }

  /** Focuses the inner control. */
  override focus(options?: FocusOptions): void {
    super.focus(options);
  }

  /** A seam. */
  protected seam(): void {}
}
`;

/** An element class `name` with the tag `tag`, derived from `base` imported from `module`, with a property of its own. */
const derived = (tag: string, name: string, base: string, module: string): string => `import { ${base} } from "./${module}";

/**
 * An element.
 *
 * @tagname ${tag}
 */
export class ${name} extends ${base} {
  static override properties = { label: {} };

  /**
   * The label.
   *
   * @default undefined
   */
  declare label: string | undefined;
}
`;

// specs/010-feedback-forms operator round 3 (reviews/phase-3/round-3.md, O3-01; T041c): this replaces T030's pinned
// rule "folds the base's public members and attributes into the element's entry ... and adds no module, superclass or
// inheritedFrom naming the base's source". The operator chose mission 008's rule with src/form-control.ts as a second
// named base beside src/overlay.ts: the base's members are listed on the element with inheritedFrom, the superclass is
// kept as the analyzer writes it, the base's module is not published, and a base in any other file of src/ is not read
// (constitution VIII: the reason for replacing a pinned test, recorded here).
describe("generate(root) on an element derived from an internal base class (specs/010-feedback-forms FR-034, #27, O3-01; T030, T041c)", () => {
  it("reads src/form-control.ts by name: its public members and attributes, focus() included, are listed on the element with inheritedFrom and the superclass names it; a base in base-control.ts gives nothing; the published modules are the ocelle-* ones only", async () => {
    const dir = root({
      "packages/elements/src/form-control.ts": controlBase("FormControl"),
      "packages/elements/src/base-control.ts": controlBase("BaseControl"),
      "packages/elements/src/ocelle-alpha.ts": derived("ocelle-alpha", "Alpha", "FormControl", "form-control.ts"),
      "packages/elements/src/ocelle-beta.ts": derived("ocelle-beta", "Beta", "BaseControl", "base-control.ts"),
    });
    const manifest = await generate(dir);
    const modules = manifest.modules as Json[];
    const of = (path: string): Json => declaration({ modules: modules.filter((module) => module.path === path) });
    const inherited = (entry: Json, list: "members" | "attributes"): unknown[] => ((entry[list] ?? []) as Json[]).map((each) => [each.name, each.inheritedFrom ?? null]);
    const alpha = of("src/ocelle-alpha.ts");
    const beta = of("src/ocelle-beta.ts");
    const focus = (alpha.members as Json[] | undefined)?.find((member) => member.name === "focus");
    const from = { name: "FormControl", module: "src/form-control.ts" };
    expect({
      paths: modules.map((module) => module.path),
      declarations: modules.flatMap((module) => ((module.declarations ?? []) as Json[]).map((each) => each.name)),
      alpha: { members: inherited(alpha, "members"), attributes: inherited(alpha, "attributes"), superclass: alpha.superclass },
      focus: { kind: focus?.kind, parameters: focus?.parameters, described: typeof focus?.description === "string" && focus.description !== "" },
      beta: { members: inherited(beta, "members"), attributes: inherited(beta, "attributes") },
    }).toEqual({
      paths: ["src/ocelle-alpha.ts", "src/ocelle-beta.ts"],
      declarations: ["Alpha", "Beta"],
      alpha: {
        members: [["label", null], ["name", from], ["form", from], ["checkValidity", from], ["focus", from]],
        attributes: [["label", null], ["name", from]],
        superclass: { name: "FormControl", module: "/src/form-control.ts" },
      },
      focus: { kind: "method", parameters: [{ name: "options", optional: true, type: { text: "FocusOptions" } }], described: true },
      beta: { members: [["label", null]], attributes: [["label", null]] },
    });
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

type Described = Record<string, unknown>;

/** Whether an entry has a non-empty description. */
const hasDescription = (entry: Described): boolean => typeof entry.description === "string" && entry.description !== "";

/** Entries sorted by name. */
const byName = <T extends Described>(entries: readonly T[]): T[] => [...entries].sort((a, b) => String(a.name).localeCompare(String(b.name)));

/**
 * The element declaration of one module of the repository's manifest, projected to what contracts/elements.md states:
 * each public member's type, attribute, whether it reflects and its default, each attribute's field, each event's
 * detail type, the slot, part and CSS property names, and whether each has a description; lists sorted by name.
 */
async function declared(path: string): Promise<unknown> {
  const manifest = await generate(repo);
  const modules = manifest.modules as { path: string; declarations: Described[] }[];
  const [element] = modules.find((module) => module.path === path)?.declarations ?? [];
  if (element === undefined) return undefined;
  const list = (key: string): Described[] => byName((element[key] ?? []) as Described[]);
  return {
    name: element.name,
    tagName: element.tagName,
    members: list("members").map((member) => ({
      name: member.name,
      type: (member.type as { text?: unknown } | undefined)?.text,
      attribute: member.attribute,
      reflects: member.reflects === true,
      default: member.default,
      described: hasDescription(member),
    })),
    attributes: list("attributes").map((attribute) => ({ name: attribute.name, fieldName: attribute.fieldName, described: hasDescription(attribute) })),
    events: list("events").map((event) => ({ name: event.name, type: (event.type as { text?: unknown } | undefined)?.text, described: hasDescription(event) })),
    slots: list("slots").map((slot) => ({ name: slot.name, described: hasDescription(slot) })),
    cssParts: list("cssParts").map((part) => ({ name: part.name, described: hasDescription(part) })),
    cssProperties: list("cssProperties").map((property) => property.name),
  };
}

/** The attributes `ocelle-button` moves onto its inner control, in the order it declares them (012 FR-009). */
const moved = ["aria-expanded", "aria-controls", "aria-current", "aria-haspopup", "aria-pressed", "aria-label", "aria-labelledby", "aria-describedby", "title"];

describe("generate(root) on the repository's element source", () => {
  it("declares ocelle-icon with its tag name, class, name (the union of the thirteen names) and label with types, defaults and attributes, name reflected and label not, and no slot, event, part or CSS property (US1 scenario 11, US2 scenario 1)", async () => {
    const manifest = await generate(repo);
    const modules = manifest.modules as { path: string; declarations: Record<string, unknown>[] }[];
    expect(manifest.schemaVersion).toBe("1.0.0");
    expect(modules.map((module) => module.path)).toEqual([
      "src/ocelle-action-row.ts",
      "src/ocelle-app-shell.ts",
      "src/ocelle-brand-mark.ts",
      "src/ocelle-breadcrumbs.ts",
      "src/ocelle-button.ts",
      "src/ocelle-card.ts",
      "src/ocelle-code-block.ts",
      "src/ocelle-context-sidebar.ts",
      "src/ocelle-copy-field.ts",
      "src/ocelle-data-table.ts",
      "src/ocelle-dialog.ts",
      "src/ocelle-disclosure.ts",
      "src/ocelle-drawer.ts",
      "src/ocelle-empty-state.ts",
      "src/ocelle-event-timeline.ts",
      "src/ocelle-evidence-chain.ts",
      "src/ocelle-evidence-step.ts",
      "src/ocelle-fact.ts",
      "src/ocelle-facts.ts",
      "src/ocelle-form-input.ts",
      "src/ocelle-form-select.ts",
      "src/ocelle-form-textarea.ts",
      "src/ocelle-icon.ts",
      "src/ocelle-link.ts",
      "src/ocelle-list-detail.ts",
      "src/ocelle-listbox.ts",
      "src/ocelle-metric.ts",
      "src/ocelle-nav-item.ts",
      "src/ocelle-nav-pill.ts",
      "src/ocelle-notice.ts",
      "src/ocelle-option.ts",
      "src/ocelle-page-header.ts",
      "src/ocelle-personal-rail.ts",
      "src/ocelle-pill-tag.ts",
      "src/ocelle-progress.ts",
      "src/ocelle-scroller.ts",
      "src/ocelle-section-header.ts",
      "src/ocelle-segment.ts",
      "src/ocelle-segmented-choice.ts",
      "src/ocelle-skip-link.ts",
      "src/ocelle-status-indicator.ts",
      "src/ocelle-step-indicator.ts",
      "src/ocelle-tab-panel.ts",
      "src/ocelle-tab.ts",
      "src/ocelle-tabs.ts",
      "src/ocelle-timeline-event.ts",
      "src/ocelle-tooltip.ts",
      "src/ocelle-top-bar.ts",
      "src/ocelle-workflow-board.ts",
      "src/ocelle-workflow-canvas.ts",
      "src/ocelle-workflow-lane.ts",
      "src/ocelle-workflow-node.ts",
    ]);
    const [canvas] = modules.find((module) => module.path === "src/ocelle-workflow-canvas.ts")?.declarations ?? [];
    expect(canvas?.events).toEqual([
      { name: "ocelle-workflow-canvas-connection-request", description: "A proposed connection edit using stable step and outcome identifiers.", type: { text: "CustomEvent<WorkflowCanvasConnectionRequestDetail>" } },
      { name: "ocelle-workflow-canvas-viewport-request", description: "A proposed pan, zoom, fit or named reveal viewport.", type: { text: "CustomEvent<WorkflowCanvasViewportRequestDetail>" } },
      { name: "ocelle-workflow-canvas-position-request", description: "The requested absolute graph position of a step in author mode.", type: { text: "CustomEvent<WorkflowCanvasPositionRequestDetail>" } },
      { name: "ocelle-workflow-node-select", description: "The original bubbling request from the native node action.", type: { text: "CustomEvent<{nodeId: string}>" } },
    ]);
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

  it("declares ocelle-listbox per contracts/elements.md: value (string, not reflected, default empty) and label, the change and activate events with their { value } detail, the default slot and the list part (014 FR-055)", async () => {
    const listbox = await declared("src/ocelle-listbox.ts");
    expect(listbox).toEqual({
      name: "OcelleListbox",
      tagName: "ocelle-listbox",
      members: [
        { name: "label", type: "string | undefined", attribute: "label", reflects: false, default: "undefined", described: true },
        { name: "value", type: "string", attribute: "value", reflects: false, default: '""', described: true },
      ],
      attributes: [
        { name: "label", fieldName: "label", described: true },
        { name: "value", fieldName: "value", described: true },
      ],
      events: [
        { name: "ocelle-listbox-activate", type: "CustomEvent<{ value: string }>", described: true },
        { name: "ocelle-listbox-change", type: "CustomEvent<{ value: string }>", described: true },
      ],
      slots: [{ name: "", described: true }],
      cssParts: [{ name: "list", described: true }],
      cssProperties: [],
    });
  });

  it("declares ocelle-option per contracts/elements.md: value (string, reflected) and disabled (boolean, reflected, default false), the default and icon slots, no event, part or CSS property (014 FR-055)", async () => {
    const option = await declared("src/ocelle-option.ts");
    expect(option).toEqual({
      name: "OcelleOption",
      tagName: "ocelle-option",
      members: [
        { name: "disabled", type: "boolean", attribute: "disabled", reflects: true, default: "false", described: true },
        { name: "value", type: "string", attribute: "value", reflects: true, default: expect.any(String) as unknown, described: true },
      ],
      attributes: [
        { name: "disabled", fieldName: "disabled", described: true },
        { name: "value", fieldName: "value", described: true },
      ],
      events: [],
      slots: [
        { name: "", described: true },
        { name: "icon", described: true },
      ],
      cssParts: [],
      cssProperties: [],
    });
  });

  it("declares ocelle-tabs per contracts/elements.md: value (string, not reflected) and label, the change event with its { value } detail, the default slot and the tablist and panels parts (014 FR-055, phase 3)", async () => {
    const tabs = await declared("src/ocelle-tabs.ts");
    expect(tabs).toEqual({
      name: "OcelleTabs",
      tagName: "ocelle-tabs",
      members: [
        { name: "label", type: "string | undefined", attribute: "label", reflects: false, default: "undefined", described: true },
        { name: "value", type: "string", attribute: "value", reflects: false, default: expect.any(String) as unknown, described: true },
      ],
      attributes: [
        { name: "label", fieldName: "label", described: true },
        { name: "value", fieldName: "value", described: true },
      ],
      events: [{ name: "ocelle-tabs-change", type: "CustomEvent<{ value: string }>", described: true }],
      slots: [{ name: "", described: true }],
      cssParts: [
        { name: "panels", described: true },
        { name: "tablist", described: true },
      ],
      cssProperties: [],
    });
  });

  it("declares ocelle-tab per contracts/elements.md: value (string, reflected) and disabled (boolean, reflected, default false), the default and icon slots, no event, part or CSS property (014 FR-055, phase 3)", async () => {
    const tab = await declared("src/ocelle-tab.ts");
    expect(tab).toEqual({
      name: "OcelleTab",
      tagName: "ocelle-tab",
      members: [
        { name: "disabled", type: "boolean", attribute: "disabled", reflects: true, default: "false", described: true },
        { name: "value", type: "string", attribute: "value", reflects: true, default: expect.any(String) as unknown, described: true },
      ],
      attributes: [
        { name: "disabled", fieldName: "disabled", described: true },
        { name: "value", fieldName: "value", described: true },
      ],
      events: [],
      slots: [
        { name: "", described: true },
        { name: "icon", described: true },
      ],
      cssParts: [],
      cssProperties: [],
    });
  });

  it("declares ocelle-tab-panel per contracts/elements.md: no property, attribute, event, part or CSS property, and the default slot (014 FR-055, phase 3)", async () => {
    const panel = await declared("src/ocelle-tab-panel.ts");
    expect(panel).toEqual({ name: "OcelleTabPanel", tagName: "ocelle-tab-panel", members: [], attributes: [], events: [], slots: [{ name: "", described: true }], cssParts: [], cssProperties: [] });
  });

  it("declares ocelle-segmented-choice per contracts/elements.md: value (string, not reflected), label and joined (boolean, reflected, default false), the change event with its { value } detail, the default slot and no part (014 FR-055, phase 4)", async () => {
    const group = await declared("src/ocelle-segmented-choice.ts");
    expect(group).toEqual({
      name: "OcelleSegmentedChoice",
      tagName: "ocelle-segmented-choice",
      members: [
        { name: "joined", type: "boolean", attribute: "joined", reflects: true, default: "false", described: true },
        { name: "label", type: "string | undefined", attribute: "label", reflects: false, default: "undefined", described: true },
        { name: "value", type: "string", attribute: "value", reflects: false, default: expect.any(String) as unknown, described: true },
      ],
      attributes: [
        { name: "joined", fieldName: "joined", described: true },
        { name: "label", fieldName: "label", described: true },
        { name: "value", fieldName: "value", described: true },
      ],
      events: [{ name: "ocelle-segmented-choice-change", type: "CustomEvent<{ value: string }>", described: true }],
      slots: [{ name: "", described: true }],
      cssParts: [],
      cssProperties: [],
    });
  });

  it("declares ocelle-segment per contracts/elements.md: value (string, reflected) and disabled (boolean, reflected, default false), the default and icon slots, no event, part or CSS property, and no row state as surface (014 FR-055, phase 4)", async () => {
    const segment = await declared("src/ocelle-segment.ts");
    expect(segment).toEqual({
      name: "OcelleSegment",
      tagName: "ocelle-segment",
      members: [
        { name: "disabled", type: "boolean", attribute: "disabled", reflects: true, default: "false", described: true },
        { name: "value", type: "string", attribute: "value", reflects: true, default: expect.any(String) as unknown, described: true },
      ],
      attributes: [
        { name: "disabled", fieldName: "disabled", described: true },
        { name: "value", fieldName: "value", described: true },
      ],
      events: [],
      slots: [
        { name: "", described: true },
        { name: "icon", described: true },
      ],
      cssParts: [],
      cssProperties: [],
    });
  });

  it("declares ocelle-copy-field per contracts/elements.md: value and status (strings, not reflected, default empty) and copyLabel (attribute copy-label, not reflected, default Copy), the request event with its { text } detail, no slot, the value and copy-control parts and no CSS property (014 FR-055, phase 5)", async () => {
    const field = await declared("src/ocelle-copy-field.ts");
    expect(field).toEqual({
      name: "OcelleCopyField",
      tagName: "ocelle-copy-field",
      members: [
        { name: "copyLabel", type: "string", attribute: "copy-label", reflects: false, default: '"Copy"', described: true },
        { name: "status", type: "string", attribute: "status", reflects: false, default: '""', described: true },
        { name: "value", type: "string", attribute: "value", reflects: false, default: '""', described: true },
      ],
      attributes: [
        { name: "copy-label", fieldName: "copyLabel", described: true },
        { name: "status", fieldName: "status", described: true },
        { name: "value", fieldName: "value", described: true },
      ],
      events: [{ name: "ocelle-copy-field-request", type: "CustomEvent<{ text: string }>", described: true }],
      slots: [],
      cssParts: [
        { name: "copy-control", described: true },
        { name: "value", described: true },
      ],
      cssProperties: [],
    });
  });

  it('declares ocelle-notice with its tag name, class, tone, size and announce with the types and defaults of contracts/elements.md, all reflected, the slots heading and default, the parts heading and body, no event and no CSS property, and neither role nor hidden as an attribute (specs/010-feedback-forms FR-034; analysis I2)', async () => {
    const manifest = await generate(repo);
    const modules = manifest.modules as { path: string; declarations: Record<string, unknown>[] }[];
    const [notice] = modules.find((module) => module.path === "src/ocelle-notice.ts")?.declarations ?? [];
    const described = (list: unknown): Record<string, unknown>[] =>
      ((list ?? []) as Record<string, unknown>[]).map(({ description, ...rest }) => ({ ...rest, described: typeof description === "string" && description !== "" }));
    expect(notice).toMatchObject({ kind: "class", name: "OcelleNotice", tagName: "ocelle-notice", customElement: true, events: [], cssProperties: [] });
    expect({ slots: described(notice?.slots), parts: described(notice?.cssParts) }).toEqual({
      slots: [
        { name: "heading", described: true },
        { name: "", described: true },
      ],
      parts: [
        { name: "heading", described: true },
        { name: "body", described: true },
      ],
    });
    const tones = '"info" | "success" | "warning" | "danger" | "neutral"';
    const sizes = '"regular" | "compact"';
    expect(described(notice?.members)).toEqual([
      { kind: "field", name: "tone", privacy: "public", type: { text: tones }, default: '"info"', attribute: "tone", reflects: true, described: true },
      { kind: "field", name: "size", privacy: "public", type: { text: sizes }, default: '"regular"', attribute: "size", reflects: true, described: true },
      { kind: "field", name: "announce", privacy: "public", type: { text: "boolean" }, default: "false", attribute: "announce", reflects: true, described: true },
    ]);
    // The exact list: the observed standard attributes `role` and `hidden` are not declared (FR-034).
    expect(described(notice?.attributes)).toEqual([
      { name: "tone", fieldName: "tone", type: { text: tones }, default: '"info"', described: true },
      { name: "size", fieldName: "size", type: { text: sizes }, default: '"regular"', described: true },
      { name: "announce", fieldName: "announce", type: { text: "boolean" }, default: "false", described: true },
    ]);
  });

  it('declares ocelle-form-input with its tag name and class, the shared members of contracts/elements.md and its own, the value attribute without a field, the event ocelle-form-input-change with its detail type, the parts label, control, description and error, no slot and no CSS property, and no form, aria-*, role or hidden attribute (specs/010-feedback-forms FR-021, FR-029, FR-034; analysis G9, I15, I16, U6)', async () => {
    const manifest = await generate(repo);
    const modules = manifest.modules as { path: string; declarations: Record<string, unknown>[] }[];
    const [entry] = modules.find((module) => module.path === "src/ocelle-form-input.ts")?.declarations ?? [];
    const described = (value: unknown): boolean => typeof value === "string" && value !== "";
    const byName = (a: Json, b: Json): number => (String(a.name) < String(b.name) ? -1 : 1);
    const defined = (value: Json): Json => Object.fromEntries(Object.entries(value).filter(([, each]) => each !== undefined));
    const member = (each: Json): Json => {
      const type = each.type as { text?: string } | undefined;
      const returned = each.return as { type?: { text?: string } } | undefined;
      const parameters = each.parameters as { name: string; optional?: boolean; type?: { text?: string } }[] | undefined;
      return defined({
        kind: each.kind,
        name: each.name,
        type: type?.text,
        default: each.default,
        attribute: each.attribute,
        reflects: each.reflects,
        readonly: each.readonly,
        returns: returned?.type?.text,
        parameters: parameters?.map((parameter) => `${parameter.name}${parameter.optional === true ? "?" : ""}: ${String(parameter.type?.text)}`),
        inheritedFrom: each.inheritedFrom,
        described: described(each.description),
      });
    };
    const field = (name: string, type: string, value: string, attribute?: string, reflects?: boolean): Json => defined({ kind: "field", name, type, default: value, attribute, reflects, described: true });
    const getter = (name: string, type: string): Json => ({ kind: "field", name, type, readonly: true, described: true });
    // The members and attributes declared in src/form-control.ts are listed with inheritedFrom (operator round 3, O3-01; T041c).
    const from = { name: "FormControl", module: "src/form-control.ts" };
    const method = (name: string, returns: string, parameters?: string[]): Json => defined({ kind: "method", name, returns, parameters, described: true });
    const types = '"text" | "email" | "url" | "tel" | "search" | "password" | "number"';
    const optional = (name: string, attribute: string, type = "string | undefined"): Json => field(name, type, "undefined", attribute, true);
    const members = [
      ...[
        field("name", "string", '""', "name", true),
        field("label", "string", '""', "label", true),
        field("description", "string", '""', "description", true),
        field("error", "string", '""', "error", true),
        field("required", "boolean", "false", "required", true),
        field("disabled", "boolean", "false", "disabled", true),
        field("value", "string", '""'),
        getter("form", "HTMLFormElement | null"),
        getter("labels", "NodeList"),
        getter("validity", "ValidityState"),
        getter("validationMessage", "string"),
        getter("willValidate", "boolean"),
        method("checkValidity", "boolean"),
        method("reportValidity", "boolean"),
        method("focus", "void", ["options?: FocusOptions"]),
      ].map((each): Json => ({ ...each, inheritedFrom: from })),
      field("type", types, '"text"', "type", true),
      optional("placeholder", "placeholder"),
      optional("autocomplete", "autocomplete"),
      optional("inputMode", "inputmode"),
      optional("pattern", "pattern"),
      optional("min", "min"),
      optional("max", "max"),
      optional("step", "step"),
      optional("minLength", "minlength", "number | undefined"),
      optional("maxLength", "maxlength", "number | undefined"),
      field("readOnly", "boolean", "false", "readonly", true),
    ];
    const attribute = (each: Json): Json => defined({ name: each.name, fieldName: each.fieldName, type: (each.type as { text?: string } | undefined)?.text, default: each.default, inheritedFrom: each.inheritedFrom, described: described(each.description) });
    const attributes = [
      ...members.filter((each) => each.attribute !== undefined).map((each) => defined({ name: each.attribute, fieldName: each.name, type: each.type, default: each.default, inheritedFrom: each.inheritedFrom, described: true })),
      { name: "value", type: "string", default: '""', described: true },
    ];
    const valueAttribute = ((entry?.attributes ?? []) as Json[]).find((each) => each.name === "value");
    expect(entry).toMatchObject({ kind: "class", name: "OcelleFormInput", tagName: "ocelle-form-input", customElement: true, slots: [], cssProperties: [], superclass: { name: "FormControl", module: "/src/form-control.ts" } });
    expect({
      members: ((entry?.members ?? []) as Json[]).map(member).sort(byName),
      attributes: ((entry?.attributes ?? []) as Json[]).map(attribute).sort(byName),
      valueDescription: String(valueAttribute?.description).includes("default value") && String(valueAttribute?.description).includes("reset"),
      events: ((entry?.events ?? []) as Json[]).map((event) => ({ name: event.name, type: (event.type as { text?: string } | undefined)?.text, described: described(event.description) })),
      parts: ((entry?.cssParts ?? []) as Json[]).map((part) => ({ name: part.name, described: described(part.description) })),
    }).toEqual({
      members: [...members].sort(byName),
      attributes: [...attributes].sort(byName),
      valueDescription: true,
      events: [{ name: "ocelle-form-input-change", type: "CustomEvent<{ value: string }>", described: true }],
      parts: ["label", "control", "description", "error"].map((name) => ({ name, described: true })),
    });
  });

  it("declares the textarea's change event and read-only property in the manifest", async () => {
    const manifest = await generate(repo);
    const modules = manifest.modules as { path: string; declarations: Record<string, unknown>[] }[];
    const [entry] = modules.find((module) => module.path === "src/ocelle-form-textarea.ts")?.declarations ?? [];
    expect(entry?.events, "the textarea declares the committed-change event").toEqual([
      expect.objectContaining({ name: "ocelle-form-textarea-change", type: { text: "CustomEvent<{ value: string }>" } }),
    ]);
    expect(entry?.attributes).toContainEqual(expect.objectContaining({ name: "readonly", fieldName: "readOnly" }));
    expect(entry?.cssParts).toEqual([
      expect.objectContaining({ name: "label" }),
      expect.objectContaining({ name: "control" }),
      expect.objectContaining({ name: "description" }),
      expect.objectContaining({ name: "error" }),
    ]);
  });

  it('declares ocelle-form-select with its tag name and class, the shared members of contracts/elements.md (value a property with no attribute), none of the input\'s own members, the event ocelle-form-select-change with its detail type, the parts label, control, description and error, no slot and no CSS property, and no value, form, aria-*, role or hidden attribute (specs/010-feedback-forms FR-021, FR-034; analysis G9, I15, I16)', async () => {
    const manifest = await generate(repo);
    const modules = manifest.modules as { path: string; declarations: Record<string, unknown>[] }[];
    const [entry] = modules.find((module) => module.path === "src/ocelle-form-select.ts")?.declarations ?? [];
    const described = (value: unknown): boolean => typeof value === "string" && value !== "";
    const byName = (a: Json, b: Json): number => (String(a.name) < String(b.name) ? -1 : 1);
    const defined = (value: Json): Json => Object.fromEntries(Object.entries(value).filter(([, each]) => each !== undefined));
    const member = (each: Json): Json => {
      const type = each.type as { text?: string } | undefined;
      const returned = each.return as { type?: { text?: string } } | undefined;
      const parameters = each.parameters as { name: string; optional?: boolean; type?: { text?: string } }[] | undefined;
      return defined({
        kind: each.kind,
        name: each.name,
        type: type?.text,
        default: each.default,
        attribute: each.attribute,
        reflects: each.reflects,
        readonly: each.readonly,
        returns: returned?.type?.text,
        parameters: parameters?.map((parameter) => `${parameter.name}${parameter.optional === true ? "?" : ""}: ${String(parameter.type?.text)}`),
        inheritedFrom: each.inheritedFrom,
        described: described(each.description),
      });
    };
    const field = (name: string, type: string, value: string, attribute?: string, reflects?: boolean): Json => defined({ kind: "field", name, type, default: value, attribute, reflects, described: true });
    const getter = (name: string, type: string): Json => ({ kind: "field", name, type, readonly: true, described: true });
    // The members and attributes declared in src/form-control.ts are listed with inheritedFrom (operator round 3, O3-01; T041c).
    const from = { name: "FormControl", module: "src/form-control.ts" };
    const method = (name: string, returns: string, parameters?: string[]): Json => defined({ kind: "method", name, returns, parameters, described: true });
    // The shared members only: none of the input's own (type and the pass-through properties).
    const members = [
      ...[
        field("name", "string", '""', "name", true),
        field("label", "string", '""', "label", true),
        field("description", "string", '""', "description", true),
        field("error", "string", '""', "error", true),
        field("required", "boolean", "false", "required", true),
        field("disabled", "boolean", "false", "disabled", true),
        field("value", "string", '""'),
        getter("form", "HTMLFormElement | null"),
        getter("labels", "NodeList"),
        getter("validity", "ValidityState"),
        getter("validationMessage", "string"),
        getter("willValidate", "boolean"),
        method("checkValidity", "boolean"),
        method("reportValidity", "boolean"),
        method("focus", "void", ["options?: FocusOptions"]),
      ].map((each): Json => ({ ...each, inheritedFrom: from })),
    ];
    const attribute = (each: Json): Json => defined({ name: each.name, fieldName: each.fieldName, type: (each.type as { text?: string } | undefined)?.text, default: each.default, inheritedFrom: each.inheritedFrom, described: described(each.description) });
    // Exactly the reflected shared attributes: no value (a host value attribute is ignored), form, aria-*, role or hidden.
    const attributes = members.filter((each) => each.attribute !== undefined).map((each) => defined({ name: each.attribute, fieldName: each.name, type: each.type, default: each.default, inheritedFrom: each.inheritedFrom, described: true }));
    expect(entry).toMatchObject({ kind: "class", name: "OcelleFormSelect", tagName: "ocelle-form-select", customElement: true, superclass: { name: "FormControl", module: "/src/form-control.ts" } });
    expect({
      described: described(entry?.description),
      members: ((entry?.members ?? []) as Json[]).map(member).sort(byName),
      attributes: ((entry?.attributes ?? []) as Json[]).map(attribute).sort(byName),
      events: ((entry?.events ?? []) as Json[]).map((event) => ({ name: event.name, type: (event.type as { text?: string } | undefined)?.text, described: described(event.description) })),
      parts: ((entry?.cssParts ?? []) as Json[]).map((part) => ({ name: part.name, described: described(part.description) })),
      slots: entry?.slots,
      cssProperties: entry?.cssProperties,
    }).toEqual({
      described: true,
      members: [...members].sort(byName),
      attributes: [...attributes].sort(byName),
      events: [{ name: "ocelle-form-select-change", type: "CustomEvent<{ value: string }>", described: true }],
      parts: ["label", "control", "description", "error"].map((name) => ({ name, described: true })),
      slots: [],
      cssProperties: [],
    });
  });

  it("declares ocelle-link per contracts/elements.md: href (string, reflected, default undefined) and label (string, not reflected, default undefined), the cancelable activate event with its { href } detail, the default slot, the anchor part and no CSS property (014 FR-055, phase 6)", async () => {
    const link = await declared("src/ocelle-link.ts");
    expect(link).toEqual({
      name: "OcelleLink",
      tagName: "ocelle-link",
      members: [
        { name: "href", type: "string | undefined", attribute: "href", reflects: true, default: "undefined", described: true },
        { name: "label", type: "string | undefined", attribute: "label", reflects: false, default: "undefined", described: true },
      ],
      attributes: [
        { name: "href", fieldName: "href", described: true },
        { name: "label", fieldName: "label", described: true },
      ],
      events: [{ name: "ocelle-link-activate", type: "CustomEvent<{ href: string | null }>", described: true }],
      slots: [{ name: "", described: true }],
      cssParts: [{ name: "anchor", described: true }],
      cssProperties: [],
    });
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

  // 012 phase 5 (tasks.md T053; FR-030, FR-053; contracts/elements-package.md § ocelle-action-row): the row's
  // properties (with phase 6's current and unavailable, tasks.md T062), the moved attributes and their mirrors, the
  // slots, parts and the event with its detail type, each described.
  it('declares ocelle-action-row with its tag name, class, rowId (row-id), label, layout ("row" | "card"), presentation ("default" | "flush"), ground (with "chrome"), href, target, rel, current ("page" | "true"), unavailable and busy, the click() method, the moved aria-label, aria-labelledby, aria-describedby and title with their mirrors, the default, icon, description, tags and trailing slots, the parts control, title, description and tags, and the event ocelle-action-row-activate with its detail type, each described (012 FR-030, FR-053)', async () => {
    const manifest = await generate(repo);
    const modules = manifest.modules as { path: string; declarations: Record<string, unknown>[] }[];
    const [row] = modules.find((module) => module.path === "src/ocelle-action-row.ts")?.declarations ?? [];
    expect(row).toMatchObject({ kind: "class", name: "OcelleActionRow", tagName: "ocelle-action-row", customElement: true, cssProperties: [] });
    const described = (list: unknown): Record<string, unknown>[] =>
      ((list ?? []) as Record<string, unknown>[]).map(({ description, ...rest }) => ({ ...rest, described: typeof description === "string" && description !== "" }));
    const text = "string | undefined";
    const layout = '"row" | "card" | undefined';
    const presentation = '"default" | "flush" | undefined';
    const ground = '"accent-low" | "inset" | "hover-bg" | "state" | "chrome" | undefined';
    const rowMoved = ["aria-label", "aria-labelledby", "aria-describedby", "title"];
    expect(described(row?.members)).toEqual([
      { kind: "field", name: "rowId", privacy: "public", type: { text }, default: "undefined", attribute: "row-id", reflects: true, described: true },
      { kind: "field", name: "label", privacy: "public", type: { text }, default: "undefined", attribute: "label", described: true },
      { kind: "field", name: "layout", privacy: "public", type: { text: layout }, default: "undefined", attribute: "layout", reflects: true, described: true },
      { kind: "field", name: "presentation", privacy: "public", type: { text: presentation }, default: "undefined", attribute: "presentation", reflects: true, described: true },
      { kind: "field", name: "ground", privacy: "public", type: { text: ground }, default: "undefined", attribute: "ground", reflects: true, described: true },
      ...["href", "target", "rel"].map((name) => ({ kind: "field", name, privacy: "public", type: { text }, default: "undefined", attribute: name, reflects: true, described: true })),
      { kind: "field", name: "current", privacy: "public", type: { text: '"page" | "true" | undefined' }, default: "undefined", attribute: "current", reflects: true, described: true },
      { kind: "field", name: "unavailable", privacy: "public", type: { text: "boolean" }, default: "false", attribute: "unavailable", reflects: true, described: true },
      { kind: "field", name: "busy", privacy: "public", type: { text: "boolean" }, default: "false", attribute: "busy", reflects: true, described: true },
      { kind: "method", name: "click", return: { type: { text: "void" } }, described: true },
    ]);
    expect(described(row?.attributes)).toEqual([
      ...rowMoved.map((name) => ({ name, type: { text: "string" }, described: true })),
      ...rowMoved.map((name) => ({ name: `data-ocelle-moved-${name}`, type: { text: "string" }, described: true })),
      { name: "row-id", fieldName: "rowId", type: { text }, default: "undefined", described: true },
      { name: "label", fieldName: "label", type: { text }, default: "undefined", described: true },
      { name: "layout", fieldName: "layout", type: { text: layout }, default: "undefined", described: true },
      { name: "presentation", fieldName: "presentation", type: { text: presentation }, default: "undefined", described: true },
      { name: "ground", fieldName: "ground", type: { text: ground }, default: "undefined", described: true },
      ...["href", "target", "rel"].map((name) => ({ name, fieldName: name, type: { text }, default: "undefined", described: true })),
      { name: "current", fieldName: "current", type: { text: '"page" | "true" | undefined' }, default: "undefined", described: true },
      { name: "unavailable", fieldName: "unavailable", type: { text: "boolean" }, default: "false", described: true },
      { name: "busy", fieldName: "busy", type: { text: "boolean" }, default: "false", described: true },
    ]);
    expect(described(row?.slots)).toEqual(["", "icon", "description", "tags", "trailing"].map((name) => ({ name, described: true })));
    expect(described(row?.cssParts)).toEqual(["control", "title", "description", "tags"].map((name) => ({ name, described: true })));
    expect(described(row?.events)).toEqual([{ name: "ocelle-action-row-activate", type: { text: "CustomEvent<{ rowId: string }>" }, described: true }]);
  });

  // Plan decisions 30 and 32 (phase 5 review R1-01; tasks.md T062, T064a): the part `control` is described as the
  // row's icon-and-title control, not its surface, and the button's `pressed` state as button mode only.
  it("describes the row's part control as its icon-and-title control, not its surface, and the button's pressed state as button mode only (plan decisions 30, 32)", async () => {
    const manifest = await generate(repo);
    const declarations = (manifest.modules as { declarations: Record<string, unknown>[] }[]).flatMap((module) => module.declarations);
    const row = declarations.find((declaration) => declaration.tagName === "ocelle-action-row");
    const button = declarations.find((declaration) => declaration.tagName === "ocelle-button");
    const parts = (row?.cssParts ?? []) as { name: string; description: string }[];
    const states = (button?.cssStates ?? []) as { name: string; description: string }[];
    expect({ control: parts.find((part) => part.name === "control")?.description, pressed: states.find((state) => state.name === "pressed")?.description }).toEqual({
      control: "The row's icon-and-title control: the inner `<button>`, or the inner `<a>` in link mode. It is not the row's surface: the description, tags and trailing content are beside it, and `::part(control)` styles do not reach the row's surface or border.",
      pressed: 'While the moved `aria-pressed` is `"true"`, in button mode only: a link has no pressed state.',
    });
  });

  it("declares ocelle-scroller with its tag name, class, label (string | undefined, not reflected, described), one default slot, described, and no event, part or CSS property (009 contracts/elements.md, T018)", async () => {
    const manifest = await generate(repo);
    const modules = manifest.modules as { path: string; declarations: Record<string, unknown>[] }[];
    const [scroller] = modules.find((module) => module.path === "src/ocelle-scroller.ts")?.declarations ?? [];
    expect(scroller).toMatchObject({ kind: "class", name: "OcelleScroller", tagName: "ocelle-scroller", customElement: true, events: [], cssParts: [], cssProperties: [] });
    const described = (list: unknown): Record<string, unknown>[] =>
      ((list ?? []) as Record<string, unknown>[]).map(({ description, ...rest }) => ({ ...rest, described: typeof description === "string" && description !== "" }));
    expect(described(scroller?.members)).toEqual([{ kind: "field", name: "label", privacy: "public", type: { text: "string | undefined" }, default: "undefined", attribute: "label", described: true }]);
    expect(described(scroller?.attributes)).toEqual([{ name: "label", fieldName: "label", type: { text: "string | undefined" }, default: "undefined", described: true }]);
    expect(described(scroller?.slots)).toEqual([{ name: "", described: true }]);
  });

  it("declares ocelle-workflow-board with its tag name, class, label (string | undefined, not reflected, described), one default slot, described, and no event, part or CSS property (009 contracts/elements.md, T035)", async () => {
    const manifest = await generate(repo);
    const modules = manifest.modules as { path: string; declarations: Record<string, unknown>[] }[];
    const [board] = modules.find((module) => module.path === "src/ocelle-workflow-board.ts")?.declarations ?? [];
    expect(board).toMatchObject({ kind: "class", name: "OcelleWorkflowBoard", tagName: "ocelle-workflow-board", customElement: true, events: [], cssParts: [], cssProperties: [] });
    const described = (list: unknown): Record<string, unknown>[] =>
      ((list ?? []) as Record<string, unknown>[]).map(({ description, ...rest }) => ({ ...rest, described: typeof description === "string" && description !== "" }));
    expect(described(board?.members)).toEqual([{ kind: "field", name: "label", privacy: "public", type: { text: "string | undefined" }, default: "undefined", attribute: "label", described: true }]);
    expect(described(board?.attributes)).toEqual([{ name: "label", fieldName: "label", type: { text: "string | undefined" }, default: "undefined", described: true }]);
    expect(described(board?.slots)).toEqual([{ name: "", described: true }]);
  });

  it('declares ocelle-workflow-lane with its tag name, class, label (string | undefined), count (number | undefined), count-label / countLabel (string | undefined), not reflected, and variant ("flat" | undefined), reflected, each described with the default undefined, one default slot, described, and no event, part or CSS property (009 contracts/elements.md, T035)', async () => {
    const manifest = await generate(repo);
    const modules = manifest.modules as { path: string; declarations: Record<string, unknown>[] }[];
    const [lane] = modules.find((module) => module.path === "src/ocelle-workflow-lane.ts")?.declarations ?? [];
    expect(lane).toMatchObject({ kind: "class", name: "OcelleWorkflowLane", tagName: "ocelle-workflow-lane", customElement: true, events: [], cssParts: [], cssProperties: [] });
    const described = (list: unknown): Record<string, unknown>[] =>
      ((list ?? []) as Record<string, unknown>[]).map(({ description, ...rest }) => ({ ...rest, described: typeof description === "string" && description !== "" }));
    expect(described(lane?.members)).toEqual([
      { kind: "field", name: "label", privacy: "public", type: { text: "string | undefined" }, default: "undefined", attribute: "label", described: true },
      { kind: "field", name: "count", privacy: "public", type: { text: "number | undefined" }, default: "undefined", attribute: "count", described: true },
      { kind: "field", name: "countLabel", privacy: "public", type: { text: "string | undefined" }, default: "undefined", attribute: "count-label", described: true },
      { kind: "field", name: "variant", privacy: "public", type: { text: '"flat" | undefined' }, default: "undefined", attribute: "variant", reflects: true, described: true },
    ]);
    expect(described(lane?.attributes)).toEqual([
      { name: "label", fieldName: "label", type: { text: "string | undefined" }, default: "undefined", described: true },
      { name: "count", fieldName: "count", type: { text: "number | undefined" }, default: "undefined", described: true },
      { name: "count-label", fieldName: "countLabel", type: { text: "string | undefined" }, default: "undefined", described: true },
      { name: "variant", fieldName: "variant", type: { text: '"flat" | undefined' }, default: "undefined", described: true },
    ]);
    expect(described(lane?.slots)).toEqual([{ name: "", described: true }]);
  });

  it("declares ocelle-list-detail with its tag name, class, collapse-below / collapseBelow and inspector-below / inspectorBelow (string | undefined, not reflected, default undefined), narrow and detail-open / detailOpen (boolean, reflected, default false), the method remeasure(): void, each described, the list, default and inspector slots, described, and no event, part or CSS property (009 contracts/elements.md, FR-025, FR-030, T051)", async () => {
    const manifest = await generate(repo);
    const modules = manifest.modules as { path: string; declarations: Record<string, unknown>[] }[];
    const [listDetail] = modules.find((module) => module.path === "src/ocelle-list-detail.ts")?.declarations ?? [];
    expect(listDetail).toMatchObject({ kind: "class", name: "OcelleListDetail", tagName: "ocelle-list-detail", customElement: true, events: [], cssParts: [], cssProperties: [] });
    const described = (list: unknown): Record<string, unknown>[] =>
      ((list ?? []) as Record<string, unknown>[]).map(({ description, ...rest }) => ({ ...rest, described: typeof description === "string" && description !== "" }));
    expect(described(listDetail?.members)).toEqual([
      { kind: "field", name: "collapseBelow", privacy: "public", type: { text: "string | undefined" }, default: "undefined", attribute: "collapse-below", described: true },
      { kind: "field", name: "inspectorBelow", privacy: "public", type: { text: "string | undefined" }, default: "undefined", attribute: "inspector-below", described: true },
      { kind: "field", name: "narrow", privacy: "public", type: { text: "boolean" }, default: "false", attribute: "narrow", reflects: true, described: true },
      { kind: "field", name: "detailOpen", privacy: "public", type: { text: "boolean" }, default: "false", attribute: "detail-open", reflects: true, described: true },
      { kind: "method", name: "remeasure", privacy: "public", return: { type: { text: "void" } }, described: true },
    ]);
    expect(described(listDetail?.attributes)).toEqual([
      { name: "collapse-below", fieldName: "collapseBelow", type: { text: "string | undefined" }, default: "undefined", described: true },
      { name: "inspector-below", fieldName: "inspectorBelow", type: { text: "string | undefined" }, default: "undefined", described: true },
      { name: "narrow", fieldName: "narrow", type: { text: "boolean" }, default: "false", described: true },
      { name: "detail-open", fieldName: "detailOpen", type: { text: "boolean" }, default: "false", described: true },
    ]);
    expect(described(listDetail?.slots)).toEqual([
      { name: "list", described: true },
      { name: "", described: true },
      { name: "inspector", described: true },
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

  // 008 tasks.md T043 (FR-030, FR-045, SC-003; data-model.md § ocelle-tooltip): the tooltip's entry lists text,
  // placement (reflected), disabled (reflected) and describes (reflected) with their types and defaults, the default
  // slot and the description slot, the part bubble, and an empty events list (the tooltip dispatches none); no CSS
  // property and nothing inherited.
  it('declares ocelle-tooltip with text (default ""), placement ("top" | "bottom" | "start" | "end", default "top", reflected), disabled (default false, reflected) and describes (default false, reflected), the default and description slots, the part bubble, no event and no CSS property, each described', async () => {
    const manifest = await generate(repo);
    const modules = manifest.modules as { path: string; declarations: Record<string, unknown>[] }[];
    const [tooltip] = modules.find((module) => module.path === "src/ocelle-tooltip.ts")?.declarations ?? [];
    const described = (list: unknown): Record<string, unknown>[] =>
      ((list ?? []) as Record<string, unknown>[]).map(({ description, ...rest }) => ({ ...rest, described: typeof description === "string" && description !== "" }));
    const placement = { text: '"top" | "bottom" | "start" | "end"' };
    expect({ kind: tooltip?.kind, name: tooltip?.name, tagName: tooltip?.tagName, customElement: tooltip?.customElement }).toEqual({ kind: "class", name: "OcelleTooltip", tagName: "ocelle-tooltip", customElement: true });
    expect(described(tooltip?.members)).toEqual([
      { kind: "field", name: "text", privacy: "public", type: { text: "string" }, default: '""', attribute: "text", described: true },
      { kind: "field", name: "placement", privacy: "public", type: placement, default: '"top"', attribute: "placement", reflects: true, described: true },
      { kind: "field", name: "disabled", privacy: "public", type: { text: "boolean" }, default: "false", attribute: "disabled", reflects: true, described: true },
      { kind: "field", name: "describes", privacy: "public", type: { text: "boolean" }, default: "false", attribute: "describes", reflects: true, described: true },
    ]);
    expect(described(tooltip?.attributes)).toEqual([
      { name: "text", fieldName: "text", type: { text: "string" }, default: '""', described: true },
      { name: "placement", fieldName: "placement", type: placement, default: '"top"', described: true },
      { name: "disabled", fieldName: "disabled", type: { text: "boolean" }, default: "false", described: true },
      { name: "describes", fieldName: "describes", type: { text: "boolean" }, default: "false", described: true },
    ]);
    expect({ events: tooltip?.events, cssProperties: tooltip?.cssProperties }).toEqual({ events: [], cssProperties: [] });
    expect(described(tooltip?.slots)).toEqual([
      { name: "", described: true },
      { name: "description", described: true },
    ]);
    expect(described(tooltip?.cssParts)).toEqual([{ name: "bubble", described: true }]);
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
        tooltip: modules.some((module) => module.path === "src/ocelle-tooltip.ts"),
      };
    };
    expect({ generated: internal(await generate(repo)), committed: internal(committed) }).toEqual({
      generated: { modules: [], declarations: [], dialog: true, drawer: true, tooltip: true },
      committed: { modules: [], declarations: [], dialog: true, drawer: true, tooltip: true },
    });
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
  // 018 (tasks.md T016; contracts/elements-status.md § `ocelle-status-indicator`): `tone` (the vocabulary, default
  // "neutral", an attribute-backed accessor), `label` and `pulse` (reflected), each described; the parts dot and ring;
  // no event, method, slot, CSS property or custom state, paired with the positive presence of `tone`; the host
  // `aria-label` is not read, so it is not declared.
  it('declares ocelle-status-indicator with tone (the five values, default "neutral"), label (string | undefined) and pulse (boolean | undefined), both reflected, the parts dot and ring, and no event, method, slot, CSS property or custom state, each described', async () => {
    const manifest = await generate(repo);
    const modules = manifest.modules as { path: string; declarations: Record<string, unknown>[] }[];
    const [indicator] = modules.find((module) => module.path === "src/ocelle-status-indicator.ts")?.declarations ?? [];
    const named = (list: unknown): unknown => ((list ?? []) as Record<string, unknown>[]).map(({ name, description }) => ({ name, described: typeof description === "string" && description !== "" }));
    const described = (list: unknown): Record<string, unknown>[] =>
      ((list ?? []) as Record<string, unknown>[]).map(({ description, ...rest }) => ({ ...rest, described: typeof description === "string" && description !== "" }));
    const tone = '"info" | "success" | "warning" | "danger" | "neutral"';
    expect({ kind: indicator?.kind, name: indicator?.name, tagName: indicator?.tagName, customElement: indicator?.customElement, events: indicator?.events }).toEqual({
      kind: "class",
      name: "OcelleStatusIndicator",
      tagName: "ocelle-status-indicator",
      customElement: true,
      events: [],
    });
    expect(described(indicator?.members)).toEqual([
      { kind: "field", name: "label", privacy: "public", type: { text: "string | undefined" }, default: "undefined", attribute: "label", reflects: true, described: true },
      { kind: "field", name: "pulse", privacy: "public", type: { text: "boolean | undefined" }, default: "undefined", attribute: "pulse", reflects: true, described: true },
      { kind: "field", name: "tone", type: { text: tone }, default: '"neutral"', described: true },
    ]);
    expect(described(indicator?.attributes)).toEqual([
      { name: "tone", type: { text: tone }, described: true },
      { name: "label", fieldName: "label", type: { text: "string | undefined" }, default: "undefined", described: true },
      { name: "pulse", fieldName: "pulse", type: { text: "boolean | undefined" }, default: "undefined", described: true },
    ]);
    expect({
      slots: indicator?.slots,
      parts: named(indicator?.cssParts),
      properties: indicator?.cssProperties,
      states: indicator?.cssStates,
      methods: ((indicator?.members ?? []) as Record<string, unknown>[]).filter((member) => member.kind === "method"),
      ariaLabel: JSON.stringify(indicator).includes('"aria-label"'),
    }).toEqual({
      slots: [],
      parts: [
        { name: "dot", described: true },
        { name: "ring", described: true },
      ],
      properties: [],
      states: undefined,
      methods: [],
      ariaLabel: false,
    });
  });

  // 018 (tasks.md T027; contracts/elements-status.md § `ocelle-metric`): `label` and `displayValue` (attribute
  // `display-value`), reflected, and `layout` ("stack" | "row", default "stack", an attribute-backed accessor), each
  // described; the parts label and value; no event, method, slot, CSS property or custom state, paired with the
  // positive presence of `layout`.
  it('declares ocelle-metric with label and displayValue (string | undefined, reflected, display-value), layout ("stack" | "row", default "stack"), the parts label and value, and no event, method, slot, CSS property or custom state, each described', async () => {
    const manifest = await generate(repo);
    const modules = manifest.modules as { path: string; declarations: Record<string, unknown>[] }[];
    const [metric] = modules.find((module) => module.path === "src/ocelle-metric.ts")?.declarations ?? [];
    const named = (list: unknown): unknown => ((list ?? []) as Record<string, unknown>[]).map(({ name, description }) => ({ name, described: typeof description === "string" && description !== "" }));
    const described = (list: unknown): Record<string, unknown>[] =>
      ((list ?? []) as Record<string, unknown>[]).map(({ description, ...rest }) => ({ ...rest, described: typeof description === "string" && description !== "" }));
    const layout = '"stack" | "row"';
    expect({ kind: metric?.kind, name: metric?.name, tagName: metric?.tagName, customElement: metric?.customElement, events: metric?.events }).toEqual({
      kind: "class",
      name: "OcelleMetric",
      tagName: "ocelle-metric",
      customElement: true,
      events: [],
    });
    expect(described(metric?.members)).toEqual([
      { kind: "field", name: "label", privacy: "public", type: { text: "string | undefined" }, default: "undefined", attribute: "label", reflects: true, described: true },
      { kind: "field", name: "displayValue", privacy: "public", type: { text: "string | undefined" }, default: "undefined", attribute: "display-value", reflects: true, described: true },
      { kind: "field", name: "layout", type: { text: layout }, default: '"stack"', described: true },
    ]);
    expect(described(metric?.attributes)).toEqual([
      { name: "layout", type: { text: layout }, described: true },
      { name: "label", fieldName: "label", type: { text: "string | undefined" }, default: "undefined", described: true },
      { name: "display-value", fieldName: "displayValue", type: { text: "string | undefined" }, default: "undefined", described: true },
    ]);
    expect({
      slots: metric?.slots,
      parts: named(metric?.cssParts),
      properties: metric?.cssProperties,
      states: metric?.cssStates,
      methods: ((metric?.members ?? []) as Record<string, unknown>[]).filter((member) => member.kind === "method"),
    }).toEqual({
      slots: [],
      parts: [
        { name: "label", described: true },
        { name: "value", described: true },
      ],
      properties: [],
      states: undefined,
      methods: [],
    });
  });

  // 018 (tasks.md T038; contracts/elements-status.md § `ocelle-pill-tag`): the static members, `status` (the five
  // values, default "neutral"), `variant` ("pill" | "badge", default "pill") and `density` ("default" | "compact",
  // default "default"), attribute-backed accessors; `interactive` and `disabled` (boolean, default false) and `href`,
  // reflected; `label`, an attribute and a property, not reflected (FR-025); the default and `icon` slots; the part
  // `pill`; each described. 018 phase 5 (tasks.md T048; FR-005, SC-006): the interactive surface, each described: the
  // seven moved attributes of FR-030 in the contract's order and then their `data-ocelle-moved-*` mirrors (as 012's
  // FR-053 declares `ocelle-button`'s), after the three attribute-backed ones; the methods `focus()` and `click()`; the
  // events `click` (the native click) and `ocelle-pill-tag-activate` with its `detail` type; the custom states
  // `pressed` and `current` and no other; the part `control` after `pill`. No CSS custom property.
  it('declares ocelle-pill-tag with interactive and disabled (boolean, default false) and href (string | undefined), reflected, label (string | undefined, not reflected), status, variant and density (attribute-backed, defaults "neutral", "pill", "default"), the seven moved attributes and their mirrors, focus() and click(), the events click and ocelle-pill-tag-activate, the states pressed and current, the default and icon slots and the parts pill and control, each described', async () => {
    const manifest = await generate(repo);
    const modules = manifest.modules as { path: string; declarations: Record<string, unknown>[] }[];
    const [pill] = modules.find((module) => module.path === "src/ocelle-pill-tag.ts")?.declarations ?? [];
    const named = (list: unknown): unknown => ((list ?? []) as Record<string, unknown>[]).map(({ name, description }) => ({ name, described: typeof description === "string" && description !== "" }));
    const described = (list: unknown): Record<string, unknown>[] =>
      ((list ?? []) as Record<string, unknown>[]).map(({ description, ...rest }) => ({ ...rest, described: typeof description === "string" && description !== "" }));
    const status = '"info" | "success" | "warning" | "danger" | "neutral"';
    const variant = '"pill" | "badge"';
    const density = '"default" | "compact"';
    const pillMoved = ["aria-label", "aria-labelledby", "aria-describedby", "aria-controls", "aria-current", "aria-pressed", "title"];
    const members = (pill?.members ?? []) as Record<string, unknown>[];
    expect({ kind: pill?.kind, name: pill?.name, tagName: pill?.tagName, customElement: pill?.customElement }).toEqual({
      kind: "class",
      name: "OcellePillTag",
      tagName: "ocelle-pill-tag",
      customElement: true,
    });
    expect(described(members.filter((member) => member.kind === "field"))).toEqual([
      { kind: "field", name: "interactive", privacy: "public", type: { text: "boolean" }, default: "false", attribute: "interactive", reflects: true, described: true },
      { kind: "field", name: "href", privacy: "public", type: { text: "string | undefined" }, default: "undefined", attribute: "href", reflects: true, described: true },
      { kind: "field", name: "disabled", privacy: "public", type: { text: "boolean" }, default: "false", attribute: "disabled", reflects: true, described: true },
      { kind: "field", name: "label", privacy: "public", type: { text: "string | undefined" }, default: "undefined", attribute: "label", described: true },
      { kind: "field", name: "status", type: { text: status }, default: '"neutral"', described: true },
      { kind: "field", name: "variant", type: { text: variant }, default: '"pill"', described: true },
      { kind: "field", name: "density", type: { text: density }, default: '"default"', described: true },
    ]);
    expect(members.filter((member) => member.kind === "method").map(({ kind, name, description }) => ({ kind, name, described: typeof description === "string" && description !== "" }))).toEqual([
      { kind: "method", name: "focus", described: true },
      { kind: "method", name: "click", described: true },
    ]);
    expect(described(pill?.attributes)).toEqual([
      { name: "status", type: { text: status }, described: true },
      { name: "variant", type: { text: variant }, described: true },
      { name: "density", type: { text: density }, described: true },
      ...pillMoved.map((name) => ({ name, type: { text: "string" }, described: true })),
      ...pillMoved.map((name) => ({ name: `data-ocelle-moved-${name}`, type: { text: "string" }, described: true })),
      { name: "interactive", fieldName: "interactive", type: { text: "boolean" }, default: "false", described: true },
      { name: "href", fieldName: "href", type: { text: "string | undefined" }, default: "undefined", described: true },
      { name: "disabled", fieldName: "disabled", type: { text: "boolean" }, default: "false", described: true },
      { name: "label", fieldName: "label", type: { text: "string | undefined" }, default: "undefined", described: true },
    ]);
    expect({
      events: described(pill?.events),
      slots: named(pill?.slots),
      parts: named(pill?.cssParts),
      properties: pill?.cssProperties,
      states: named(pill?.cssStates),
    }).toEqual({
      // The analyzer lists the event the source dispatches before the one only the JSDoc names (the native click).
      events: [
        { name: "ocelle-pill-tag-activate", type: { text: "CustomEvent<Record<string, never>>" }, described: true },
        { name: "click", type: { text: "MouseEvent" }, described: true },
      ],
      slots: [
        { name: "", described: true },
        { name: "icon", described: true },
      ],
      parts: [
        { name: "pill", described: true },
        { name: "control", described: true },
      ],
      properties: [],
      states: [
        { name: "pressed", described: true },
        { name: "current", described: true },
      ],
    });
  });

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

  // 019 phase 2 (T034; contracts/ocelle-event-timeline.md, contracts/ocelle-timeline-event.md, research R-10): the two
  // timeline modules declare only their class; the event declares the default and the time slot and the time and
  // content parts; the internal timeline-time module is not in the manifest.
  it("declares ocelle-timeline-event with time (string | undefined) and wrap (\"anywhere\" | undefined), reflected, the default and time slots and the time and content parts, its module declaring only its class; ocelle-event-timeline with label (string | undefined), not reflected, the default slot and the list part; timeline-time not a module", async () => {
    const manifest = await generate(repo);
    const modules = manifest.modules as { path: string; declarations: Record<string, unknown>[]; exports?: Record<string, unknown>[] }[];
    const eventModule = modules.find((module) => module.path === "src/ocelle-timeline-event.ts");
    const timelineModule = modules.find((module) => module.path === "src/ocelle-event-timeline.ts");
    const [event] = eventModule?.declarations ?? [];
    const [timeline] = timelineModule?.declarations ?? [];
    const named = (list: unknown): unknown => ((list ?? []) as Record<string, unknown>[]).map(({ name, description }) => ({ name, described: typeof description === "string" && description !== "" }));
    const described = (list: unknown): Record<string, unknown>[] =>
      ((list ?? []) as Record<string, unknown>[]).map(({ description, ...rest }) => ({ ...rest, described: typeof description === "string" && description !== "" }));
    expect({
      declarations: [eventModule?.declarations.map((each) => each.name), timelineModule?.declarations.map((each) => each.name)],
      exported: eventModule?.exports?.map((each) => each.name),
      internal: modules.some((module) => module.path.includes("timeline-time")),
      event: { name: event?.name, tagName: event?.tagName, events: event?.events },
      timeline: { name: timeline?.name, tagName: timeline?.tagName, events: timeline?.events },
    }).toEqual({
      declarations: [["OcelleTimelineEvent"], ["OcelleEventTimeline"]],
      exported: ["OcelleTimelineEvent"],
      internal: false,
      event: { name: "OcelleTimelineEvent", tagName: "ocelle-timeline-event", events: [] },
      timeline: { name: "OcelleEventTimeline", tagName: "ocelle-event-timeline", events: [] },
    });
    expect(described(event?.members)).toEqual([
      { kind: "field", name: "time", privacy: "public", type: { text: "string | undefined" }, default: "undefined", attribute: "time", reflects: true, described: true },
      { kind: "field", name: "wrap", privacy: "public", type: { text: '"anywhere" | undefined' }, default: "undefined", attribute: "wrap", reflects: true, described: true },
    ]);
    expect(described(timeline?.members)).toEqual([{ kind: "field", name: "label", privacy: "public", type: { text: "string | undefined" }, default: "undefined", attribute: "label", described: true }]);
    expect({
      event: { slots: named(event?.slots), parts: named(event?.cssParts), properties: named(event?.cssProperties) },
      timeline: { slots: named(timeline?.slots), parts: named(timeline?.cssParts), properties: named(timeline?.cssProperties) },
    }).toEqual({
      event: { slots: [{ name: "", described: true }, { name: "time", described: true }], parts: [{ name: "time", described: true }, { name: "content", described: true }], properties: [] },
      timeline: { slots: [{ name: "", described: true }], parts: [{ name: "list", described: true }], properties: [] },
    });
  });

  // 019 phase 3 (T057, T067; contracts/ocelle-evidence-chain.md, contracts/ocelle-evidence-step.md): the two chain
  // modules declare only their class; the step declares variant and wrap, reflected, the default slot and the content
  // part; the chain declares label, not reflected, the default slot and the list part; neither has an event.
  it("declares ocelle-evidence-step with variant (\"chip\" | undefined) and wrap (\"anywhere\" | undefined), reflected, the default slot and the content part; ocelle-evidence-chain with label (string | undefined), not reflected, the default slot and the list part; each module declaring only its class, with no event", async () => {
    const manifest = await generate(repo);
    const modules = manifest.modules as { path: string; declarations: Record<string, unknown>[] }[];
    const stepModule = modules.find((module) => module.path === "src/ocelle-evidence-step.ts");
    const chainModule = modules.find((module) => module.path === "src/ocelle-evidence-chain.ts");
    const [step] = stepModule?.declarations ?? [];
    const [chain] = chainModule?.declarations ?? [];
    const named = (list: unknown): unknown => ((list ?? []) as Record<string, unknown>[]).map(({ name, description }) => ({ name, described: typeof description === "string" && description !== "" }));
    const described = (list: unknown): Record<string, unknown>[] =>
      ((list ?? []) as Record<string, unknown>[]).map(({ description, ...rest }) => ({ ...rest, described: typeof description === "string" && description !== "" }));
    expect({
      declarations: [stepModule?.declarations.map((each) => each.name), chainModule?.declarations.map((each) => each.name)],
      step: { name: step?.name, tagName: step?.tagName, events: step?.events },
      chain: { name: chain?.name, tagName: chain?.tagName, events: chain?.events },
    }).toEqual({
      declarations: [["OcelleEvidenceStep"], ["OcelleEvidenceChain"]],
      step: { name: "OcelleEvidenceStep", tagName: "ocelle-evidence-step", events: [] },
      chain: { name: "OcelleEvidenceChain", tagName: "ocelle-evidence-chain", events: [] },
    });
    expect(described(step?.members)).toEqual([
      { kind: "field", name: "variant", privacy: "public", type: { text: '"chip" | undefined' }, default: "undefined", attribute: "variant", reflects: true, described: true },
      { kind: "field", name: "wrap", privacy: "public", type: { text: '"anywhere" | undefined' }, default: "undefined", attribute: "wrap", reflects: true, described: true },
    ]);
    expect(described(chain?.members)).toEqual([{ kind: "field", name: "label", privacy: "public", type: { text: "string | undefined" }, default: "undefined", attribute: "label", described: true }]);
    expect({
      step: { slots: named(step?.slots), parts: named(step?.cssParts), properties: named(step?.cssProperties) },
      chain: { slots: named(chain?.slots), parts: named(chain?.cssParts), properties: named(chain?.cssProperties) },
    }).toEqual({
      step: { slots: [{ name: "", described: true }], parts: [{ name: "content", described: true }], properties: [] },
      chain: { slots: [{ name: "", described: true }], parts: [{ name: "list", described: true }], properties: [] },
    });
  });

  // 020 phase 1 (T007; contracts/elements.md § `ocelle-disclosure`; FR-017): every list stated, every member described;
  // the moved attributes and their mirrors, and the mapped `aria-expanded`, declared with `@attr` before the property's
  // attribute; `aria-expanded` is an attribute only, not a property; no CSS custom property.
  it("declares ocelle-disclosure with open (boolean | undefined, reflected), click() and focus(), the moved aria-label, aria-labelledby, aria-describedby and title with their four mirrors and the mapped aria-expanded, the slots summary, icon and default, the event ocelle-disclosure-toggle with its detail, the parts details, summary and panel, the state open and no CSS property, each described", async () => {
    const manifest = await generate(repo);
    const modules = manifest.modules as { path: string; declarations: Record<string, unknown>[] }[];
    const [disclosure] = modules.find((module) => module.path === "src/ocelle-disclosure.ts")?.declarations ?? [];
    const named = (list: unknown): unknown => ((list ?? []) as Record<string, unknown>[]).map(({ name, description }) => ({ name, described: typeof description === "string" && description !== "" }));
    const described = (list: unknown): Record<string, unknown>[] =>
      ((list ?? []) as Record<string, unknown>[]).map(({ description, ...rest }) => ({ ...rest, described: typeof description === "string" && description !== "" }));
    const disclosureMoved = ["aria-label", "aria-labelledby", "aria-describedby", "title"];
    expect({ kind: disclosure?.kind, name: disclosure?.name, tagName: disclosure?.tagName, customElement: disclosure?.customElement }).toEqual({ kind: "class", name: "OcelleDisclosure", tagName: "ocelle-disclosure", customElement: true });
    const members = described(disclosure?.members);
    expect(members.map(({ kind, name }) => ({ kind, name }))).toEqual([
      { kind: "field", name: "open" },
      { kind: "method", name: "click" },
      { kind: "method", name: "focus" },
    ]);
    expect(members[0]).toEqual({ kind: "field", name: "open", privacy: "public", type: { text: "boolean | undefined" }, default: "undefined", attribute: "open", reflects: true, described: true });
    expect(members.map((member) => member.described)).toEqual([true, true, true]);
    expect(described(disclosure?.attributes)).toEqual([
      ...disclosureMoved.map((name) => ({ name, type: { text: "string" }, described: true })),
      ...disclosureMoved.map((name) => ({ name: `data-ocelle-moved-${name}`, type: { text: "string" }, described: true })),
      { name: "aria-expanded", type: { text: '"true" | "false"' }, described: true },
      { name: "open", fieldName: "open", type: { text: "boolean | undefined" }, default: "undefined", described: true },
    ]);
    expect({
      slots: named(disclosure?.slots),
      parts: named(disclosure?.cssParts),
      states: named(disclosure?.cssStates),
      events: described(disclosure?.events),
      properties: disclosure?.cssProperties,
      expandedProperty: members.some((member) => member.name === "ariaExpanded" || member.attribute === "aria-expanded"),
    }).toEqual({
      slots: [
        { name: "summary", described: true },
        { name: "icon", described: true },
        { name: "", described: true },
      ],
      parts: [
        { name: "details", described: true },
        { name: "summary", described: true },
        { name: "panel", described: true },
      ],
      states: [{ name: "open", described: true }],
      events: [{ name: "ocelle-disclosure-toggle", type: { text: "CustomEvent<{ open: boolean }>" }, described: true }],
      properties: [],
      expandedProperty: false,
    });
  });

  // 020 phase 2 (T027; contracts/elements.md § `ocelle-code-block`; FR-035): every list stated, every member described;
  // `overflow` and `digest` reflected, `label` not; no slot (the description says the text is the light DOM's text
  // content), no event, the parts `block` and `code`, no CSS custom property; `aria-label` is observed, not a property.
  it("declares ocelle-code-block with overflow (string | undefined, reflected), label (string | undefined, not reflected) and digest (boolean | undefined, reflected), each described with the default undefined, no slot, no event, the parts block and code, and no CSS property", async () => {
    const manifest = await generate(repo);
    const modules = manifest.modules as { path: string; declarations: Record<string, unknown>[] }[];
    const [codeBlock] = modules.find((module) => module.path === "src/ocelle-code-block.ts")?.declarations ?? [];
    const named = (list: unknown): unknown => ((list ?? []) as Record<string, unknown>[]).map(({ name, description }) => ({ name, described: typeof description === "string" && description !== "" }));
    const described = (list: unknown): Record<string, unknown>[] =>
      ((list ?? []) as Record<string, unknown>[]).map(({ description, ...rest }) => ({ ...rest, described: typeof description === "string" && description !== "" }));
    expect({ kind: codeBlock?.kind, name: codeBlock?.name, tagName: codeBlock?.tagName, customElement: codeBlock?.customElement }).toEqual({ kind: "class", name: "OcelleCodeBlock", tagName: "ocelle-code-block", customElement: true });
    expect(typeof codeBlock?.description === "string" && codeBlock.description.includes("light-DOM text content")).toBe(true);
    expect(described(codeBlock?.members)).toEqual([
      { kind: "field", name: "overflow", privacy: "public", type: { text: "string | undefined" }, default: "undefined", attribute: "overflow", reflects: true, described: true },
      { kind: "field", name: "label", privacy: "public", type: { text: "string | undefined" }, default: "undefined", attribute: "label", described: true },
      { kind: "field", name: "digest", privacy: "public", type: { text: "boolean | undefined" }, default: "undefined", attribute: "digest", reflects: true, described: true },
    ]);
    expect(described(codeBlock?.attributes)).toEqual([
      { name: "overflow", fieldName: "overflow", type: { text: "string | undefined" }, default: "undefined", described: true },
      { name: "label", fieldName: "label", type: { text: "string | undefined" }, default: "undefined", described: true },
      { name: "digest", fieldName: "digest", type: { text: "boolean | undefined" }, default: "undefined", described: true },
    ]);
    expect({ slots: codeBlock?.slots, events: codeBlock?.events, parts: named(codeBlock?.cssParts), properties: codeBlock?.cssProperties, states: codeBlock?.cssStates ?? [] }).toEqual({
      slots: [],
      events: [],
      parts: [
        { name: "block", described: true },
        { name: "code", described: true },
      ],
      properties: [],
      states: [],
    });
  });

  it("rejects a root without an element module, naming the directory", async () => {
    await expect(generate(fileURLToPath(new URL(".", import.meta.url)))).rejects.toThrow(/packages\/elements\/src/);
  });
});
