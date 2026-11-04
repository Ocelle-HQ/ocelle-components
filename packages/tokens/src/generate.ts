// The token generator (research.md R-01, R-02, R-12; data-model.md § Token, § Token overrides, § JSON export): pure
// functions of the token source, no I/O. css() is the stylesheet text, json() the JSON export, names() the name list,
// resolve() the one resolver of derived values, validateSource() the source rules, applyOverrides() the plant deltas.
/** The eight token groups of FR-001; colour and elevation are theme-dependent. */
export type Group = "colour" | "type" | "space" | "shape" | "size" | "shell" | "elevation" | "motion";

export type Theme = "light" | "dark";

/** A value per theme. */
export interface Themed<T> {
  readonly light: T;
  readonly dark: T;
}

/** A foreground colour's contrast kind and intended grounds (A.8). */
export interface Contrast {
  readonly kind: "text" | "non-text";
  readonly grounds: readonly string[];
  readonly exempt?: true;
}

/** One token of the source (data-model.md § Token). */
export interface TokenRecord {
  readonly name: string;
  readonly group: Group;
  readonly value: string | Themed<string>;
  readonly ref?: readonly string[] | Themed<readonly string[]>;
  readonly contrast?: Contrast;
}

/** One change of the token source by key (data-model.md § Token overrides). */
export type TokenOverride =
  | {
      readonly token: string;
      readonly light?: string;
      readonly dark?: string;
      readonly value?: string | Themed<string>;
      readonly ref?: readonly string[] | Themed<readonly string[]>;
      readonly contrast?: Contrast;
    }
  | { readonly add: TokenRecord }
  | { readonly remove: string };

/** One token of the JSON export: full names, resolved values (contracts/token-package.md). */
export type JsonToken = {
  readonly name: string;
  readonly group: Group;
  readonly ref?: readonly string[] | Themed<readonly string[]>;
} & ({ readonly light: string; readonly dark: string } | { readonly value: string });

/** The JSON export (`dist/tokens.json`). */
export interface TokenJson {
  readonly version: 1;
  readonly tokens: readonly JsonToken[];
}

const prefix = "--ocelle-";
const themes: readonly Theme[] = ["light", "dark"];
/** The theme-dependent groups (FR-001). */
const themedGroups: ReadonlySet<Group> = new Set(["colour", "elevation"]);
/** The tokens spec Appendix A.6 excludes (FR-003). */
const excluded: ReadonlySet<string> = new Set(["color-proto", "color-proto-bg", "font-size-ui", "font-size-body", "font-size-title", "radius-3"]);
/** The one token that may carry `contrast.exempt` (FR-017; landing L1-01). */
const exemptToken = "color-disabled-ink";
const namePattern = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
/** A token reference inside a value; the name is group 1. */
const reference = /var\(--ocelle-([a-z0-9]+(?:-[a-z0-9]+)*)\)/g;
/** A value that is exactly one token reference. */
const soleReference = /^var\(--ocelle-([a-z0-9]+(?:-[a-z0-9]+)*)\)$/;
const hex = /^#[0-9A-Fa-f]{6}$/;
const translucent = /^rgb\(\d{1,3} \d{1,3} \d{1,3} \/ (?:0|1|0?\.\d+)\)$/;

/** A record's value in a theme (its one value for a theme-independent token). */
function valueIn(record: TokenRecord, theme: Theme): string {
  return typeof record.value === "string" ? record.value : record.value[theme];
}

/** The token names a value references, each once, in order of appearance. */
function references(value: string): string[] {
  return [...new Set([...value.matchAll(reference)].map((match) => String(match[1])))];
}

function isList(ref: readonly string[] | Themed<readonly string[]>): ref is readonly string[] {
  return Array.isArray(ref);
}

/** The records by name; the first record of a name wins (a duplicate fails validation). */
function index(source: readonly TokenRecord[]): ReadonlyMap<string, TokenRecord> {
  const byName = new Map<string, TokenRecord>();
  for (const record of source) if (!byName.has(record.name)) byName.set(record.name, record);
  return byName;
}

/** The token names, in source order. */
export function names(source: readonly TokenRecord[]): string[] {
  return source.map((record) => record.name);
}

function resolveIn(byName: ReadonlyMap<string, TokenRecord>, name: string, theme: Theme, path: readonly string[]): string {
  const record = byName.get(name);
  if (record === undefined) throw new Error(`unknown token ${name}`);
  if (path.includes(name)) throw new Error(`reference cycle ${[...path, name].join(" -> ")}`);
  return valueIn(record, theme).replace(reference, (_, ref: string) => resolveIn(byName, ref, theme, [...path, name]));
}

/** A token's value in a theme with every `var(--ocelle-…)` reference replaced by its resolved value. */
export function resolve(source: readonly TokenRecord[], name: string, theme: Theme): string {
  return resolveIn(index(source), name, theme, []);
}

/**
 * The problems of one ref against the references of its value: unknown names first, then a set that differs. `found`
 * has each name once (references()), so a ref of the same length that holds every found name has no duplicate.
 */
function refProblems(at: string, ref: readonly string[], found: readonly string[], label: string, value: string): string[] {
  const same = ref.length === found.length && found.every((name) => ref.includes(name));
  return same ? [] : [`${at}: ${label} [${ref.join(", ")}] is not the set of references in the ${value} [${found.join(", ")}]`];
}

/** The problems of a colour token's value in one theme (data-model.md § Token, *Validation*). */
function colourProblems(at: string, record: TokenRecord, theme: Theme, byName: ReadonlyMap<string, TokenRecord>): string[] {
  const value = valueIn(record, theme);
  const overlay = record.name === "color-overlay";
  if (hex.test(value) || (overlay && translucent.test(value))) return [];
  const sole = soleReference.exec(value);
  if (sole === null) return [`${at}: ${theme} value ${value} is not a 6-digit hex colour${overlay ? ", rgb(… / α)" : ""} or one colour token reference`];
  const target = byName.get(String(sole[1]));
  if (target === undefined || (target.group === "colour" && target.name !== "color-scheme")) return [];
  return [`${at}: ${theme} value references ${target.name}, which is not a colour`];
}

/** The problems a record has on its own and against the names of the source (no resolution). */
function recordProblems(record: TokenRecord, byName: ReadonlyMap<string, TokenRecord>, seen: Set<string>): string[] {
  const at = `token ${record.name}`;
  const found: string[] = [];
  if (!namePattern.test(record.name)) found.push(`${at}: name is not lower-case words joined by hyphens`);
  if (seen.has(record.name)) found.push(`${at}: duplicate name`);
  seen.add(record.name);
  if (excluded.has(record.name)) found.push(`${at}: excluded token (spec Appendix A.6)`);
  const themed = themedGroups.has(record.group);
  const perTheme = typeof record.value !== "string";
  if (!themed && perTheme) found.push(`${at}: group ${record.group} is theme-independent but the value is per theme`);
  if (themed && !perTheme) found.push(`${at}: group ${record.group} is theme-dependent but the value is not per theme`);

  const { ref } = record;
  const named = ref === undefined ? [] : isList(ref) ? ref : [...ref.light, ...ref.dark];
  for (const name of new Set(named)) if (!byName.has(name)) found.push(`${at}: ref names an unknown token ${name}`);
  if (typeof record.value === "string") {
    if (ref !== undefined && !isList(ref)) found.push(`${at}: ref is per theme but the value is not`);
    else found.push(...refProblems(at, ref ?? [], references(record.value), "ref", "value"));
  } else if (ref !== undefined && isList(ref)) {
    found.push(`${at}: value is per theme but the ref is not`);
  } else {
    for (const theme of themes) found.push(...refProblems(at, ref?.[theme] ?? [], references(record.value[theme]), `${theme} ref`, `${theme} value`));
  }

  for (const ground of record.contrast?.grounds ?? []) if (!byName.has(ground)) found.push(`${at}: ground names an unknown token ${ground}`);
  if (record.contrast !== undefined && record.group !== "colour") found.push(`${at}: contrast on a token outside the colour group`);
  if (record.contrast?.exempt !== undefined && record.name !== exemptToken) found.push(`${at}: exempt is allowed only on ${exemptToken}`);
  if (record.group === "colour" && perTheme) {
    if (record.name === "color-scheme") {
      if (valueIn(record, "light") !== "light" || valueIn(record, "dark") !== "dark") found.push(`${at}: value must be light in light and dark in dark`);
    } else {
      for (const theme of themes) found.push(...colourProblems(at, record, theme, byName));
    }
  }
  return found;
}

/** For each token on a reference cycle, in source order: the cycle from it back to it. */
function cycleProblems(source: readonly TokenRecord[]): string[] {
  const edges = new Map<string, string[]>();
  for (const record of source) {
    if (!edges.has(record.name)) edges.set(record.name, themes.flatMap((theme) => references(valueIn(record, theme))));
  }
  const found: string[] = [];
  for (const start of edges.keys()) {
    const visited = new Set<string>();
    const walk = (name: string, path: readonly string[]): readonly string[] | undefined => {
      // Stryker disable next-line ArrayDeclaration: equivalent, walk() only gets a name of edges (a start, or a next that passed edges.has below), so the default never applies
      for (const next of edges.get(name) ?? []) {
        if (next === start) return [...path, next];
        if (visited.has(next) || !edges.has(next)) continue;
        visited.add(next);
        const cycle = walk(next, [...path, next]);
        if (cycle !== undefined) return cycle;
      }
      return undefined;
    };
    const cycle = walk(start, [start]);
    if (cycle !== undefined) found.push(`token ${start}: reference cycle ${cycle.join(" -> ")}`);
  }
  return found;
}

/** The opacity rules, on resolved values: contrast only on opaque colours, grounds opaque in both themes. */
function opacityProblems(source: readonly TokenRecord[]): string[] {
  const opaque = (name: string): boolean => themes.every((theme) => hex.test(resolve(source, name, theme)));
  const found: string[] = [];
  for (const record of source) {
    if (record.contrast === undefined) continue;
    const at = `token ${record.name}`;
    if (!opaque(record.name)) found.push(`${at}: contrast on a colour that is not opaque in both themes`);
    for (const ground of record.contrast.grounds) if (!opaque(ground)) found.push(`${at}: ground ${ground} is not opaque in both themes`);
  }
  return found;
}

/** Throws, naming each token and rule, when the source breaks a rule of data-model.md § Token. */
export function validateSource(source: readonly TokenRecord[]): void {
  const byName = index(source);
  const seen = new Set<string>();
  const problems = [...source.flatMap((record) => recordProblems(record, byName, seen)), ...cycleProblems(source)];
  if (problems.length === 0) problems.push(...opacityProblems(source));
  if (problems.length > 0) throw new Error(`invalid token source: ${problems.join("; ")}`);
}

/** The records with the overrides applied in order (data-model.md § Token overrides). */
export function applyOverrides(records: readonly TokenRecord[], overrides: readonly TokenOverride[]): TokenRecord[] {
  let result = [...records];
  const at = (name: string): number => result.findIndex((record) => record.name === name);
  for (const change of overrides) {
    if ("add" in change) {
      if (at(change.add.name) !== -1) throw new Error(`token override adds ${change.add.name}, which already exists`);
      result = [...result, change.add];
    } else if ("remove" in change) {
      if (at(change.remove) === -1) throw new Error(`token override removes an unknown token ${change.remove}`);
      result = result.filter((record) => record.name !== change.remove);
    } else {
      const position = at(change.token);
      const record = result[position];
      if (record === undefined) throw new Error(`token override names an unknown token ${change.token}`);
      let value = change.value ?? record.value;
      if (change.light !== undefined || change.dark !== undefined) {
        const both = typeof value === "string" ? { light: value, dark: value } : value;
        value = { light: change.light ?? both.light, dark: change.dark ?? both.dark };
      }
      const replaced: TokenRecord = {
        ...record,
        value,
        ...(change.ref === undefined ? {} : { ref: change.ref }),
        ...(change.contrast === undefined ? {} : { contrast: change.contrast }),
      };
      result = result.with(position, replaced);
    }
  }
  return result;
}

/** One declaration line of the stylesheet. */
function declaration(indent: string, name: string, value: string): string {
  return `${indent}${prefix}${name}: ${value};\n`;
}

/**
 * The brand font's face (research.md R-06, FR-012): the vendored variable font by a URL relative to the stylesheet,
 * which the build places beside it in `dist/fonts/` (constitution IV: nothing from a CDN or a font service).
 */
const fontFace =
  "@font-face {\n" +
  '  font-family: "Schibsted Grotesk";\n' +
  '  src: url("./fonts/SchibstedGrotesk-wght.woff2") format("woff2");\n' +
  "  font-weight: 400 900;\n" +
  "  font-style: normal;\n" +
  "  font-display: swap;\n" +
  "}\n\n";

/**
 * The stylesheet text (research.md R-02, R-06): the font face, light and theme-independent values, dark twice, then
 * reduced motion.
 */
export function css(source: readonly TokenRecord[]): string {
  const dark = source.filter((record) => typeof record.value !== "string" && record.value.light !== record.value.dark);
  const lines = (indent: string, theme: Theme, records: readonly TokenRecord[]): string =>
    records.map((record) => declaration(indent, record.name, valueIn(record, theme))).join("");
  return (
    fontFace +
    `:root {\n${lines("  ", "light", source)}}\n\n` +
    `@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {\n${lines("    ", "dark", dark)}  }\n}\n\n` +
    `:root[data-theme="dark"] {\n${lines("  ", "dark", dark)}}\n\n` +
    `@media (prefers-reduced-motion: reduce) {\n  :root {\n${declaration("    ", "motion-fast", "0ms")}${declaration("    ", "motion-base", "0ms")}  }\n}\n`
  );
}

/** A ref in the JSON's full-name form, in the same shape. */
function fullRef(ref: readonly string[] | Themed<readonly string[]>): readonly string[] | Themed<readonly string[]> {
  const full = (names: readonly string[]): string[] => names.map((name) => `${prefix}${name}`);
  return isList(ref) ? full(ref) : { light: full(ref.light), dark: full(ref.dark) };
}

/** The JSON export (FR-008): full names, groups, resolved values, refs in full-name form. */
export function json(source: readonly TokenRecord[]): TokenJson {
  const byName = index(source);
  const tokens = source.map((record): JsonToken => {
    const resolved = (theme: Theme): string => resolveIn(byName, record.name, theme, []);
    const values = typeof record.value === "string" ? { value: resolved("light") } : { light: resolved("light"), dark: resolved("dark") };
    return { name: `${prefix}${record.name}`, group: record.group, ...values, ...(record.ref === undefined ? {} : { ref: fullRef(record.ref) }) };
  });
  return { version: 1, tokens };
}
