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

/** The stories of an index.json text, in index order; throws naming the problem when the index cannot be read. */
export function parseIndex(text: string): IndexStory[] {
  throw new Error(`not implemented (storybook-index, phase 2): ${String(text.length)}`);
}
