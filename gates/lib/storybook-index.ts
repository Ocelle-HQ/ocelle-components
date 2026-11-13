// The built Storybook index, storybook/dist/index.json (data-model.md § Story): the entries of type `story` in index
// order; `docs` entries are ignored. An index without `entries`, or an entry without `id` or `type`, cannot be read
// (the gate could not run). Pure, tested in process (gates/test/storybook-index.test.ts).

/** One story of the built index. */
export interface IndexStory {
  readonly id: string;
  readonly title: string;
  readonly name: string;
  readonly importPath: string;
}

const indexPath = "storybook/dist/index.json";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === "string" && value !== "";
}

/** A field of an entry as text: empty when it is missing or not text. */
function field(entry: Record<string, unknown>, key: string): string {
  const value = entry[key];
  return typeof value === "string" ? value : "";
}

/** The stories of an index.json text, in index order; throws naming the problem when the index cannot be read. */
export function parseIndex(text: string): IndexStory[] {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    throw new Error(`${indexPath} is not valid JSON (${error instanceof Error ? error.message : String(error)})`, { cause: error });
  }
  const entries = isObject(value) ? value.entries : undefined;
  if (!isObject(entries)) throw new Error(`${indexPath} has no entries`);
  const stories: IndexStory[] = [];
  for (const [key, entry] of Object.entries(entries)) {
    const fields = isObject(entry) ? entry : {};
    if (!isText(fields.id)) throw new Error(`${indexPath}: entry ${key} has no id`);
    if (!isText(fields.type)) throw new Error(`${indexPath}: entry ${key} has no type`);
    if (fields.type !== "story") continue;
    stories.push({ id: fields.id, title: field(fields, "title"), name: field(fields, "name"), importPath: field(fields, "importPath") });
  }
  return stories;
}
