// The YAML subset of pnpm-workspace.yaml that the pins gate reads (FR-027, research.md R-14): top-level `key: value`
// lines whose value is a scalar or a one-line flow list (`[a, b]`) or flow map (`{ a: 1 }`) of scalars, and
// top-level `key:` lines followed by a block list (`- item`) or block map (`name: value`) of scalars at one
// indentation. Scalars are quoted strings, true, false, null (`null`, `~` or nothing), numbers and plain strings.
// A `#` at the start of a line or after a space starts a comment (also inside quotes). Anything else throws naming the
// line, so the gate reports the file as unreadable (exit 2) instead of guessing. Pure, tested in process
// (gates/test/workspace-yaml.test.ts).

/** A scalar of the subset. */
type Scalar = string | number | boolean | null;

/** A value of the subset: a scalar, a list of scalars or a map of scalars. */
export type Yaml = Scalar | readonly Scalar[] | Readonly<Record<string, Scalar>>;

const keywords = new Map<string, Scalar>([
  ["true", true],
  ["false", false],
  ["null", null],
  ["~", null],
  ["", null],
]);

/** A scalar: a quoted string, a keyword, a number, or a plain string that starts with no YAML indicator. */
function scalar(text: string): Scalar {
  const value = text.trim();
  const quoted = /^(["'])(.*)\1$/.exec(value);
  if (quoted !== null) return String(quoted[2]);
  if (keywords.has(value)) return keywords.get(value) as Scalar;
  if (/^-?\d+(?:\.\d+)?$/.test(value)) return Number(value);
  if (/^[&*!|>[\]{},]/.test(value)) throw new Error(`unsupported value ${value}`);
  return value;
}

/** A `name: rest` line or flow map entry: the name as text and the text after the first colon. */
function entry(text: string): { readonly name: string; readonly rest: string } {
  const match = /^([^:]+):(.*)$/.exec(text.trim());
  if (match === null) throw new Error(`unsupported line ${text.trim()}`);
  return { name: String(scalar(String(match[1]))), rest: String(match[2]) };
}

/** The comma-separated parts of a flow collection's inside; none when it is blank. */
function parts(inside: string): string[] {
  return inside.trim() === "" ? [] : inside.split(",");
}

/** A value after `key:` on one line: a flow list, a flow map, or a scalar. */
function flow(text: string): Yaml {
  const value = text.trim();
  const list = /^\[(.*)\]$/.exec(value);
  if (list !== null) return parts(String(list[1])).map(scalar);
  const map = /^\{(.*)\}$/.exec(value);
  if (map === null) return scalar(value);
  return Object.fromEntries(parts(String(map[1])).map((part) => entry(part)).map(({ name, rest }) => [name, scalar(rest)]));
}

/** The block of a top-level `key:` line: its indentation (set by its first line) and its list or map. */
interface Block {
  readonly key: string;
  indent?: number;
  value?: Scalar[] | Record<string, Scalar>;
}

/** The top-level settings of a pnpm-workspace.yaml text; throws on anything outside the subset. */
export function parseWorkspaceYaml(text: string): Record<string, Yaml> {
  const settings: Record<string, Yaml> = {};
  let block: Block | undefined;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/(?:^|\s)#.*$/, "");
    if (line.trim() === "") continue;
    const indent = line.length - line.trimStart().length;
    if (indent === 0) {
      const { name, rest } = entry(line);
      block = rest.trim() === "" ? { key: name } : undefined;
      settings[name] = block === undefined ? flow(rest) : null;
      continue;
    }
    if (block === undefined || (block.indent ??= indent) !== indent) throw new Error(`unexpected indentation at ${line.trim()}`);
    const item = /^- (.*)$/.exec(line.trim());
    block.value ??= item === null ? {} : [];
    if (Array.isArray(block.value) !== (item !== null)) throw new Error(`a list and a map in one block at ${line.trim()}`);
    if (Array.isArray(block.value)) block.value.push(scalar(String(item?.[1])));
    else {
      const { name, rest } = entry(line);
      block.value[name] = scalar(rest);
    }
    settings[block.key] = block.value;
  }
  return settings;
}
