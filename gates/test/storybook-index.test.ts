import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseIndex } from "../lib/storybook-index.ts";

// The built Storybook index (data-model.md § Story): entries of type `story` in index order, `docs` entries ignored;
// an index without `entries`, or an entry without `id` or `type`, cannot be read ("could not run"). The recorded
// indexes are the phase 1 spike's builds (reviews/phase-1/spike.md § 1): the repository's 12 stories, and the empty
// index of a build whose stories glob matched no file.
const fixture = (name: string): string => readFileSync(new URL(`fixtures/storybook-build/${name}/index.json`, import.meta.url), "utf8");

describe("parseIndex", () => {
  it("reads the 12 stories of the repository's built index, in index order", () => {
    expect(parseIndex(fixture("ok")).map((story) => story.id)).toEqual([
      "base-styles--base-page",
      "base-styles--compact-screen",
      "base-styles--prose-document",
      "base-styles--identifier-wrap",
      "tokens--colour",
      "tokens--type",
      "tokens--space",
      "tokens--shape",
      "tokens--size",
      "tokens--shell",
      "tokens--elevation",
      "tokens--motion",
    ]);
  });

  it("keeps each story's id, title, name and import path", () => {
    expect(parseIndex(fixture("ok"))[0]).toEqual({
      id: "base-styles--base-page",
      title: "Base styles",
      name: "Base page",
      importPath: "./stories/base.stories.ts",
    });
  });

  it("reads no story from the empty index", () => {
    expect(parseIndex(fixture("empty-index"))).toEqual([]);
  });

  it("ignores docs entries and keeps the stories around them in order", () => {
    const text = JSON.stringify({
      v: 5,
      entries: {
        "b--one": { type: "story", id: "b--one", title: "B", name: "One", importPath: "./stories/b.stories.ts" },
        "a--docs": { type: "docs", id: "a--docs", title: "A", name: "Docs", importPath: "./stories/a.stories.ts" },
        "a--two": { type: "story", id: "a--two", title: "A", name: "Two", importPath: "./stories/a.stories.ts" },
      },
    });
    expect(parseIndex(text)).toEqual([
      { id: "b--one", title: "B", name: "One", importPath: "./stories/b.stories.ts" },
      { id: "a--two", title: "A", name: "Two", importPath: "./stories/a.stories.ts" },
    ]);
  });

  it("reads only docs entries as no story", () => {
    const text = JSON.stringify({ v: 5, entries: { "a--docs": { type: "docs", id: "a--docs" } } });
    expect(parseIndex(text)).toEqual([]);
  });

  it("reads a missing title, name or import path as empty text", () => {
    const text = JSON.stringify({ v: 5, entries: { "a--b": { type: "story", id: "a--b" } } });
    expect(parseIndex(text)).toEqual([{ id: "a--b", title: "", name: "", importPath: "" }]);
  });

  it.each([
    { name: "text that is not JSON", text: "{", problem: /^storybook\/dist\/index\.json is not valid JSON \(.+\)$/ },
    { name: "an index that is not an object", text: "[]", problem: /^storybook\/dist\/index\.json has no entries$/ },
    { name: "an index without entries", text: '{"v":5}', problem: /^storybook\/dist\/index\.json has no entries$/ },
    { name: "entries that are a list", text: '{"v":5,"entries":[]}', problem: /^storybook\/dist\/index\.json has no entries$/ },
    { name: "entries that are null", text: '{"v":5,"entries":null}', problem: /^storybook\/dist\/index\.json has no entries$/ },
    { name: "an entry that is not an object", text: '{"entries":{"a--b":1}}', problem: /^storybook\/dist\/index\.json: entry a--b has no id$/ },
    { name: "an entry without id", text: '{"entries":{"a--b":{"type":"story"}}}', problem: /^storybook\/dist\/index\.json: entry a--b has no id$/ },
    { name: "an entry with an empty id", text: '{"entries":{"a--b":{"type":"story","id":""}}}', problem: /^storybook\/dist\/index\.json: entry a--b has no id$/ },
    { name: "an entry without type", text: '{"entries":{"a--b":{"id":"a--b"}}}', problem: /^storybook\/dist\/index\.json: entry a--b has no type$/ },
    { name: "an entry with a type that is not text", text: '{"entries":{"a--b":{"id":"a--b","type":1}}}', problem: /^storybook\/dist\/index\.json: entry a--b has no type$/ },
    {
      name: "a docs entry without id after a story",
      text: '{"entries":{"a--b":{"id":"a--b","type":"story"},"a--d":{"type":"docs"}}}',
      problem: /^storybook\/dist\/index\.json: entry a--d has no id$/,
    },
  ])("cannot read $name", ({ text, problem }) => {
    expect(() => parseIndex(text)).toThrow(problem);
  });

  it("keeps the JSON error as the cause", () => {
    expect(() => parseIndex("{")).toThrow(expect.objectContaining({ cause: expect.any(SyntaxError) }) as Error);
  });
});
