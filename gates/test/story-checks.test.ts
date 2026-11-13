import { describe, expect, it } from "vitest";
import { allowedFamily, closedShadowHosts, emptyRoot, fontProblems, harness, isHarness, nonRendered, outsideRoot, storyTextNodes } from "../lib/story-checks.ts";
import type { BodyChild, CdpNode, RootNode, TextNode } from "../lib/story-checks.ts";

// The in-page checks of a story-theme (FR-014, FR-027; research.md R-05, R-08): the harness nodes the phase 1 spike
// recorded in Storybook 10.6.5's preview (spike § 3), the text nodes of a pierced DevTools document (user-agent shadow
// text attributed to its host control), the font rule and closed shadow roots. Inputs are written by hand in the
// DevTools protocol's node format.

describe("harness and isHarness (spike § 3)", () => {
  it("are the preview's placeholders, error display, docs root and the HTML renderer's scripts root", () => {
    expect(harness).toEqual({ ids: ["storybook-docs", "scripts-root"], classes: ["sb-preparing-story", "sb-preparing-docs", "sb-nopreview", "sb-errordisplay"] });
    expect(isHarness("", ["sb-preparing-story", "sb-wrapper"])).toBe(true);
    expect(isHarness("", ["sb-errordisplay"])).toBe(true);
    expect(isHarness("scripts-root", [])).toBe(true);
    expect(isHarness("storybook-docs", ["x"])).toBe(true);
  });

  it("is not the story root or any other element", () => {
    expect(isHarness("storybook-root", [])).toBe(false);
    expect(isHarness("", ["sb-wrapper"])).toBe(false);
    expect(isHarness("portal", ["sb-show-main"])).toBe(false);
    expect(isHarness("", [])).toBe(false);
  });
});

let next = 0;
/** A DevTools element node with attributes, children and shadow roots. */
function element(name: string, attributes: Record<string, string> = {}, children: CdpNode[] = [], shadowRoots: CdpNode[] = []): CdpNode {
  next += 1;
  return { nodeId: next, nodeType: 1, nodeName: name.toUpperCase(), attributes: Object.entries(attributes).flat(), children, ...(shadowRoots.length > 0 ? { shadowRoots } : {}) };
}
function text(value: string): CdpNode {
  next += 1;
  return { nodeId: next, nodeType: 3, nodeName: "#text", nodeValue: value };
}
function shadow(type: string, children: CdpNode[]): CdpNode {
  next += 1;
  return { nodeId: next, nodeType: 11, nodeName: "#document-fragment", shadowRootType: type, children };
}

describe("storyTextNodes (research.md R-05)", () => {
  const hello = text("Hello");
  const paragraph = element("p", {}, [hello, text("  \n\t ")]);
  const typed = text("typed value");
  const input = element("input", { value: "typed value" }, [], [shadow("user-agent", [element("div", { id: "inner-editor" }, [typed])])]);
  const direct = text("in shadow");
  const deep = text("deep");
  const span = element("span", {}, [deep]);
  const host = element("ocelle-x", {}, [], [shadow("open", [direct, span])]);
  const portalText = text("portal text");
  const portal = element("div", { class: "portal" }, [portalText]);
  const document: CdpNode = {
    nodeId: 1000,
    nodeType: 9,
    nodeName: "#document",
    children: [
      { nodeId: 1001, nodeType: 10, nodeName: "html" },
      element("html", { lang: "en", "data-theme": "dark" }, [
        element("head", {}, [element("title", {}, [text("Storybook")]), element("style", {}, [text("p {}")])]),
        element("body", { class: "sb-main-padded sb-show-main" }, [
          element("div", { class: "sb-preparing-story sb-wrapper" }, [text("Loading")]),
          element("div", { class: "sb-errordisplay sb-wrapper" }, [element("pre", { id: "error-stack" }, [text("stack")])]),
          element("div", { id: "storybook-root" }, [paragraph, input, host]),
          element("div", { id: "storybook-docs" }, [text("docs")]),
          element("script", {}, [text("var a = 1;")]),
          element("div", { id: "scripts-root" }, [text("x")]),
          portal,
          element("style", {}, [text("p {}")]),
          element("template", {}, [text("template text")]),
          element("noscript", {}, [text("no script")]),
        ]),
      ]),
    ],
  };

  it("collects the non-whitespace text of the story area, light DOM, open and user-agent shadow roots and body-level surfaces, in document order", () => {
    expect(storyTextNodes(document)).toEqual([
      { nodeId: hello.nodeId, styleNodeId: paragraph.nodeId, userAgentShadow: false },
      { nodeId: typed.nodeId, styleNodeId: input.nodeId, userAgentShadow: true },
      { nodeId: direct.nodeId, styleNodeId: host.nodeId, userAgentShadow: false },
      { nodeId: deep.nodeId, styleNodeId: span.nodeId, userAgentShadow: false },
      { nodeId: portalText.nodeId, styleNodeId: portal.nodeId, userAgentShadow: false },
    ]);
  });

  it("collects nothing from a document of harness nodes, head, script, style, template and noscript only", () => {
    const harnessOnly: CdpNode = {
      nodeId: 2000,
      nodeType: 9,
      nodeName: "#document",
      children: [element("html", {}, [element("head", {}, [element("title", {}, [text("t")])]), element("body", {}, [element("div", { id: "storybook-docs" }, [text("d")]), element("noscript", {}, [text("n")])])])],
    };
    expect(storyTextNodes(harnessOnly)).toEqual([]);
  });
});

describe("fontProblems (FR-027, research.md R-05)", () => {
  const schibsted = '"Schibsted Grotesk", system-ui, sans-serif';
  const node = (families: string[], computedFamily = schibsted, userAgentShadow = false): TextNode => ({ families, computedFamily, userAgentShadow });
  const loaded = { family: "Schibsted Grotesk", status: "loaded" };

  it("allows Schibsted Grotesk only, exactly", () => {
    expect(allowedFamily).toBe("Schibsted Grotesk");
    expect(fontProblems([node(["Schibsted Grotesk"]), node(["Schibsted Grotesk"], schibsted, true)], [loaded])).toEqual([]);
  });

  it("names every other family once, in order: shadow-root text, a per-glyph fallback, a family that only starts with Schibsted", () => {
    expect(fontProblems([node(["DejaVu Sans"]), node(["Schibsted Grotesk", "Noto Color Emoji"]), node(["DejaVu Sans"]), node(["Schibsted Grotesk Fallback"])], [loaded])).toEqual([
      "DejaVu Sans",
      "Noto Color Emoji",
      "Schibsted Grotesk Fallback",
    ]);
  });

  it("names the system family of user-agent shadow text of a form control, and not text that is not rendered", () => {
    expect(fontProblems([node(["Liberation Sans"], "Arial", true)], [loaded])).toEqual(["Liberation Sans"]);
    expect(fontProblems([node([]), node([], "serif", true)], [loaded])).toEqual([]);
  });

  it("does not name a declared face no text uses, unloaded (Storybook's Nunito Sans)", () => {
    expect(fontProblems([node(["Schibsted Grotesk"])], [loaded, { family: "Nunito Sans", status: "unloaded" }, { family: '"Nunito Sans"', status: "unloaded" }])).toEqual([]);
  });

  it("names a used face that is loading or unloaded, and any face in error or loading, with its status", () => {
    expect(fontProblems([node(["Schibsted Grotesk"])], [{ family: "Schibsted Grotesk", status: "loading" }])).toEqual(["Schibsted Grotesk (loading)"]);
    expect(fontProblems([node(["Schibsted Grotesk"], '"Plant Face", serif')], [loaded, { family: '"Plant Face"', status: "unloaded" }])).toEqual(["Plant Face (unloaded)"]);
    expect(fontProblems([node(["Schibsted Grotesk"])], [loaded, { family: "Broken", status: "error" }, { family: "Pending", status: "loading" }])).toEqual(["Broken (error)", "Pending (loading)"]);
    expect(fontProblems([node(["Times"], "'Plant Face', serif")], [{ family: "Plant Face", status: "error" }])).toEqual(["Times", "Plant Face (error)"]);
  });

  it("takes a user-agent shadow node's family from its host control's computed family", () => {
    expect(fontProblems([node(["Schibsted Grotesk"], "Hosted, sans-serif", true)], [loaded, { family: "Hosted", status: "unloaded" }])).toEqual(["Hosted (unloaded)"]);
  });
});

describe("closedShadowHosts (research.md R-05)", () => {
  it("names the host of each closed shadow root once, in order, and no open one", () => {
    const calls = [
      { mode: "open", host: "ocelle-a" },
      { mode: "closed", host: "ocelle-b" },
      { mode: "closed", host: "ocelle-b" },
      { mode: "closed", host: "ocelle-c" },
    ];
    expect(closedShadowHosts(calls)).toEqual(["ocelle-b", "ocelle-c"]);
    expect(closedShadowHosts([{ mode: "open", host: "ocelle-a" }])).toEqual([]);
  });
});

// Edges of the collection and the font rule the mutation run found unexamined (phase 3): a text node with no value,
// an element whose id follows its class, classes split by any white space, a used family that is not first in the
// computed list, and quotes that do not enclose a whole family name.
describe("storyTextNodes and fontProblems: edges", () => {
  it("skips a text node with no value, and an element whose harness id follows another attribute", () => {
    const kept = text("kept");
    const valueless: CdpNode = { nodeId: 9001, nodeType: 3, nodeName: "#text" };
    const body = element("body", {}, [valueless, element("div", { class: "portal", id: "scripts-root" }, [text("scripts")]), element("div", { class: "x\tsb-errordisplay" }, [text("error")]), element("p", {}, [kept])]);
    const document: CdpNode = { nodeId: 9000, nodeType: 9, nodeName: "#document", children: [element("html", {}, [body])] };
    expect(storyTextNodes(document).map((found) => found.nodeId)).toEqual([kept.nodeId]);
  });

  it("finds a used face anywhere in the computed list, and unquotes only a name wholly in quotes", () => {
    const used = (computedFamily: string, family: string): string[] => fontProblems([{ families: ["Schibsted Grotesk"], userAgentShadow: false, computedFamily }], [{ family, status: "unloaded" }]);
    expect(used('"Schibsted Grotesk",   "Plant Face", serif', "Plant Face")).toEqual(["Plant Face (unloaded)"]);
    expect(used('"Plant" x, serif', "Plant x")).toEqual([]);
    expect(used('x"Plant", serif', "xPlant")).toEqual([]);
  });
});

// The empty check of the axe gate (FR-014, US3 scenario 4; research.md R-08): the story root renders no content when
// no node below it (open shadow roots included) has a client rect of non-zero width and height, an element's box or a
// non-whitespace text's line box. The root's own box is not counted: the page collects the root's child nodes.
describe("emptyRoot (research.md R-08)", () => {
  const box = (width: number, height: number): { width: number; height: number } => ({ width, height });
  const el = (rects: { width: number; height: number }[], children: RootNode[] = [], shadow?: RootNode[]): RootNode => (shadow === undefined ? { rects, children } : { rects, children, shadow });
  const txt = (text: string, rects: { width: number; height: number }[] = [box(40, 16)]): RootNode => ({ text, rects });

  it("finds an empty root empty, and whitespace-only text with no element of any size", () => {
    expect([emptyRoot([]), emptyRoot([txt("  \n\t ")]), emptyRoot([el([], [txt(" ", [box(4, 16)])])])]).toEqual([true, true, true]);
  });

  it("finds a zero-width but tall box and a zero-height but wide box empty, and a box of both sizes not empty", () => {
    expect([emptyRoot([el([box(0, 300)])]), emptyRoot([el([box(600, 0)])]), emptyRoot([el([box(0, 300), box(1, 1)])])]).toEqual([true, true, false]);
  });

  it("finds elements with no box (display: none) holding text that draws nothing empty", () => {
    expect(emptyRoot([el([], [txt("hidden", [])]), el([], [el([], [txt("deeper", [])])])])).toBe(true);
  });

  it("finds drawn text not empty, at any depth, and text only inside an open shadow root not empty", () => {
    expect([
      emptyRoot([txt("Hello")]),
      emptyRoot([el([], [el([], [txt("deep")])])]),
      emptyRoot([el([box(0, 0)], [], [txt("in the shadow root")])]),
      emptyRoot([el([box(0, 0)], [], [el([], [el([box(10, 10)])])])]),
    ]).toEqual([false, false, false, false]);
  });

  it("does not count drawn text that is whitespace, nor a shadow root that holds only that", () => {
    expect(emptyRoot([el([box(0, 0)], [], [txt(" \n ")])])).toBe(true);
  });
});

// The outside-root check (FR-014, US3 scenario 8; research.md R-08, spike § 3): every element child of <body> that is
// neither #storybook-root, a harness node nor a non-rendered element (script, style, link, template, noscript), one
// per element, by tag.
describe("nonRendered and outsideRoot (research.md R-08)", () => {
  const child = (tag: string, id = "", classes: string[] = []): BodyChild => ({ tag, id, classes });
  const preview: BodyChild[] = [
    child("div", "", ["sb-preparing-story", "sb-wrapper"]),
    child("div", "", ["sb-preparing-docs", "sb-wrapper"]),
    child("div", "", ["sb-nopreview", "sb-wrapper"]),
    child("div", "", ["sb-errordisplay", "sb-wrapper"]),
    child("div", "storybook-root"),
    child("div", "storybook-docs"),
    child("script"),
    child("div", "scripts-root"),
  ];

  it("are the five elements that render nothing", () => {
    expect(nonRendered).toEqual(["script", "style", "link", "template", "noscript"]);
  });

  it("finds nothing outside the root of Storybook's own preview body (spike § 3)", () => {
    expect(outsideRoot(preview)).toEqual([]);
  });

  it("names each other element by tag, in order, and leaves out style, link, template and noscript", () => {
    const body = [...preview, child("button"), child("style"), child("div", "portal", ["sb-wrapper"]), child("link"), child("template"), child("noscript"), child("ocelle-tooltip")];
    expect(outsideRoot(body)).toEqual(["button", "div", "ocelle-tooltip"]);
  });
});
