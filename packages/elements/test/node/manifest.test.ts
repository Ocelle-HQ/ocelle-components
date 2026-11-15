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

/** An internal base class in src/base-control.ts: a reflected property, a getter, a method, a focus() override and observed standard attributes. */
const baseControl = `import { LitElement } from "lit";

/** A base. */
export class BaseControl extends LitElement {
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

/** An element derived from BaseControl, with a property of its own. */
const derived = `import { BaseControl } from "./base-control.ts";

/**
 * An alpha.
 *
 * @tagname ocelle-alpha
 */
export class Alpha extends BaseControl {
  static override properties = { label: {} };

  /**
   * The label.
   *
   * @default undefined
   */
  declare label: string | undefined;
}
`;

describe("generate(root) on an element derived from an internal base class (specs/010-feedback-forms FR-034, #27; PLAN-CORRECTNESS-1-004; T030)", () => {
  it("folds the base's public members and attributes into the element's entry, focus() included, and adds no module, superclass or inheritedFrom naming the base's source", async () => {
    const dir = root({ "packages/elements/src/base-control.ts": baseControl, "packages/elements/src/ocelle-alpha.ts": derived });
    const manifest = await generate(dir);
    const element = declaration(manifest);
    const focus = (element.members as Json[] | undefined)?.find((member) => member.name === "focus");
    expect({
      paths: (manifest.modules as Json[]).map((module) => module.path),
      members: ((element.members ?? []) as Json[]).map((member) => member.name),
      attributes: ((element.attributes ?? []) as Json[]).map((attribute) => attribute.name),
      focus: { kind: focus?.kind, parameters: focus?.parameters, described: typeof focus?.description === "string" && focus.description !== "" },
      superclass: element.superclass,
      mentions: JSON.stringify(manifest).includes("base-control"),
    }).toEqual({
      paths: ["src/ocelle-alpha.ts"],
      members: ["label", "name", "form", "checkValidity", "focus"],
      attributes: ["label", "name"],
      focus: { kind: "method", parameters: [{ name: "options", optional: true, type: { text: "FocusOptions" } }], described: true },
      superclass: { name: "LitElement", package: "lit" },
      mentions: false,
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

describe("generate(root) on the repository's element source", () => {
  it("declares ocelle-icon with its tag name, class, name (the union of the thirteen names) and label with types, defaults and attributes, name reflected and label not, and no slot, event, part or CSS property (US1 scenario 11, US2 scenario 1)", async () => {
    const manifest = await generate(repo);
    const modules = manifest.modules as { path: string; declarations: Record<string, unknown>[] }[];
    expect(manifest.schemaVersion).toBe("1.0.0");
    expect(modules.map((module) => module.path)).toEqual(["src/ocelle-brand-mark.ts", "src/ocelle-form-input.ts", "src/ocelle-icon.ts", "src/ocelle-notice.ts"]);
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
        described: described(each.description),
      });
    };
    const field = (name: string, type: string, value: string, attribute?: string, reflects?: boolean): Json => defined({ kind: "field", name, type, default: value, attribute, reflects, described: true });
    const getter = (name: string, type: string): Json => ({ kind: "field", name, type, readonly: true, described: true });
    const method = (name: string, returns: string, parameters?: string[]): Json => defined({ kind: "method", name, returns, parameters, described: true });
    const types = '"text" | "email" | "url" | "tel" | "search" | "password" | "number"';
    const optional = (name: string, attribute: string, type = "string | undefined"): Json => field(name, type, "undefined", attribute, true);
    const members = [
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
    const attribute = (each: Json): Json => defined({ name: each.name, fieldName: each.fieldName, type: (each.type as { text?: string } | undefined)?.text, default: each.default, described: described(each.description) });
    const attributes = [
      ...members.filter((each) => each.attribute !== undefined).map((each) => ({ name: each.attribute, fieldName: each.name, type: each.type, default: each.default, described: true })),
      { name: "value", type: "string", default: '""', described: true },
    ];
    const valueAttribute = ((entry?.attributes ?? []) as Json[]).find((each) => each.name === "value");
    expect(entry).toMatchObject({ kind: "class", name: "OcelleFormInput", tagName: "ocelle-form-input", customElement: true, slots: [], cssProperties: [], superclass: { name: "LitElement", package: "lit" } });
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

  it("rejects a root without an element module, naming the directory", async () => {
    await expect(generate(fileURLToPath(new URL(".", import.meta.url)))).rejects.toThrow(/packages\/elements\/src/);
  });
});
