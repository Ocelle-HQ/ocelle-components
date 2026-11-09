import { parseFragment } from "parse5";
import type { DefaultTreeAdapterMap } from "parse5";
import { describe, expect, it } from "vitest";
import { expectedTokens, inTheme } from "../../../packages/tokens/test/expected.ts";
import type { Group } from "../../../packages/tokens/test/expected.ts";
import * as stories from "../../stories/tokens.stories.ts";

// The token stories (FR-023, US1 scenario 11; research.md R-10; T035): one story per token group of FR-001's
// canonical list, each rendering every token of its group, name and value for the theme of the story's globals, as
// a <dl> of <dt> name and <dd> value; opaque colour tokens carry a swatch, coloured by class from the swatch
// stylesheet, and no element has a style attribute. Expected names and values come from Appendix A (expected.ts),
// not from the token source. The markup is parsed with parse5 into a DOM fixture.
type Node = DefaultTreeAdapterMap["childNode"];
type Element = DefaultTreeAdapterMap["element"];

const groups: readonly (readonly [string, Group])[] = [
  ["Colour", "colour"],
  ["Type", "type"],
  ["Space", "space"],
  ["Shape", "shape"],
  ["Size", "size"],
  ["Shell", "shell"],
  ["Elevation", "elevation"],
  ["Motion", "motion"],
];

interface Story {
  readonly render: (args: object, context: { readonly globals: Readonly<Record<string, unknown>> }) => unknown;
}

function story(name: string): Story {
  const found = (stories as unknown as Record<string, Story | undefined>)[name];
  if (found === undefined) throw new Error(`tokens.stories.ts has no story ${name}`);
  return found;
}

function elements(nodes: readonly Node[]): Element[] {
  return nodes.flatMap((node) => ("tagName" in node ? [node, ...elements(node.childNodes)] : []));
}

function text(node: Node): string {
  if (node.nodeName === "#text") return (node as DefaultTreeAdapterMap["textNode"]).value;
  return "childNodes" in node ? node.childNodes.map(text).join("") : "";
}

function attr(element: Element, name: string): string | undefined {
  return element.attrs.find((each) => each.name === name)?.value;
}

function rendered(name: string, globals: Readonly<Record<string, unknown>>): Element[] {
  const markup = story(name).render({}, { globals });
  expect(typeof markup).toBe("string");
  return elements(parseFragment(String(markup)).childNodes);
}

/** The (name, value) rows of a rendered story: each <dt> with the <dd> after it. */
function rows(all: readonly Element[]): [string, string][] {
  const terms = all.filter((element) => element.tagName === "dt");
  return terms.map((term) => {
    const siblings = term.parentNode?.childNodes ?? [];
    const next = siblings.slice(siblings.indexOf(term) + 1).find((node) => "tagName" in node);
    expect(next && "tagName" in next ? next.tagName : undefined).toBe("dd");
    return [text(term).trim(), next === undefined ? "" : text(next).trim()];
  });
}

describe("tokens.stories.ts", () => {
  it("has the title Tokens and exactly one story per group, in FR-001's order, each rendering a list", () => {
    expect(stories.default).toEqual({ title: "Tokens" });
    expect(Object.keys(stories).filter((key) => key !== "default")).toEqual(groups.map(([name]) => name));
    expect(groups.map(([name]) => rendered(name, { theme: "light" }).filter((element) => element.tagName === "dl").length)).toEqual(groups.map(() => 1));
  });

  for (const [name, group] of groups) {
    for (const theme of ["light", "dark"] as const) {
      it(`${name} in ${theme} lists exactly the ${group} tokens of Appendix A, name and ${theme} value, in order`, () => {
        const expected = expectedTokens.filter((token) => token.group === group).map((token) => [`--ocelle-${token.name}`, inTheme(token.resolved, theme)]);
        expect(expected.length).toBeGreaterThan(0);
        expect(rows(rendered(name, { theme }))).toEqual(expected);
      });
    }

    it(`${name} renders the light values when the theme global is missing or unknown`, () => {
      const light = expectedTokens.filter((token) => token.group === group).map((token) => [`--ocelle-${token.name}`, inTheme(token.resolved, "light")]);
      expect(rows(rendered(name, {}))).toEqual(light);
      expect(rows(rendered(name, { theme: "sepia" }))).toEqual(light);
    });

    it(`${name} sets no style attribute on any element, in either theme`, () => {
      for (const theme of ["light", "dark"]) {
        const all = rendered(name, { theme });
        expect(all.length).toBeGreaterThan(0);
        expect(all.filter((element) => attr(element, "style") !== undefined)).toEqual([]);
      }
    });
  }

  it("gives every opaque colour token one swatch by class and data-token, and color-scheme and color-overlay none", () => {
    const swatches = rendered("Colour", { theme: "light" }).filter((element) => attr(element, "class") === "ocelle-swatch");
    const opaque = expectedTokens.filter((token) => token.group === "colour" && token.name !== "color-scheme" && token.name !== "color-overlay").map((token) => token.name);
    expect(swatches.map((element) => attr(element, "data-token"))).toEqual(opaque);
    expect(swatches.map((element) => text(element))).toEqual(opaque.map(() => ""));
  });

  it("draws no swatch outside the colour story, whose list it renders", () => {
    for (const [name] of groups.slice(1)) {
      const all = rendered(name, { theme: "dark" });
      expect(all.filter((element) => element.tagName === "dt").length).toBeGreaterThan(0);
      expect(all.filter((element) => attr(element, "class") === "ocelle-swatch")).toEqual([]);
    }
  });
});
