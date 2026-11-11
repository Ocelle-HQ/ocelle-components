// The in-page checks of a story-theme (FR-014, FR-027; research.md R-05, R-08): the story area (the whole document
// minus Storybook's harness nodes), the text nodes of the font check from the DevTools protocol's pierced document
// (user-agent shadow text of form controls attributed to its host control), the font rule, and closed shadow roots.
// Pure, tested in process (gates/test/story-checks.test.ts); gates/lib/story-page.ts only collects the data.

/** The one font face a story may draw text with (constitution II; @ocelle/tokens vendors it). */
export const allowedFamily = "Schibsted Grotesk";

/** Storybook 10.6.5's harness nodes in the preview (spike § 3): ids and classes. */
export const harness: { readonly ids: readonly string[]; readonly classes: readonly string[] } = {
  ids: ["storybook-docs", "scripts-root"],
  classes: ["sb-preparing-story", "sb-preparing-docs", "sb-nopreview", "sb-errordisplay"],
};

/** Whether an element with this id and these classes is one of Storybook's harness nodes. */
export function isHarness(id: string, classes: readonly string[]): boolean {
  return harness.ids.includes(id) || classes.some((name) => harness.classes.includes(name));
}

/** A node of the DevTools protocol's `DOM.getDocument({ depth: -1, pierce: true })`. */
export interface CdpNode {
  readonly nodeId: number;
  readonly nodeType: number;
  readonly nodeName: string;
  readonly nodeValue?: string;
  readonly attributes?: readonly string[];
  readonly children?: readonly CdpNode[];
  readonly shadowRoots?: readonly CdpNode[];
  readonly shadowRootType?: string;
  readonly contentDocument?: CdpNode;
}

/** A text node of the story area: its node, the element whose computed family it takes, and whether it is user-agent shadow text. */
export interface StoryText {
  readonly nodeId: number;
  readonly styleNodeId: number;
  readonly userAgentShadow: boolean;
}

/** Elements whose text is never drawn as story text. */
const skipped = new Set(["HEAD", "SCRIPT", "STYLE", "TEMPLATE", "NOSCRIPT"]);

/** An attribute of a DevTools element node (its attributes are a flat name, value list), empty when absent. */
function attribute(node: CdpNode, name: string): string {
  const list = node.attributes ?? [];
  for (let at = 0; at + 1 < list.length; at += 2) if (list[at] === name) return String(list[at + 1]);
  return "";
}

/** Every non-whitespace text node of the story area in a pierced document, in document order. */
export function storyTextNodes(document: CdpNode): StoryText[] {
  const found: StoryText[] = [];
  // `styled` is the element whose computed family a text node takes: its parent element, the host for text directly in
  // a shadow root, and the host control for anything in a user-agent shadow root.
  const walk = (node: CdpNode, styled: number, userAgent: boolean): void => {
    if (node.nodeType === 3) {
      if ((node.nodeValue ?? "").trim() !== "") found.push({ nodeId: node.nodeId, styleNodeId: styled, userAgentShadow: userAgent });
      return;
    }
    let element = styled;
    if (node.nodeType === 1) {
      if (skipped.has(node.nodeName) || isHarness(attribute(node, "id"), attribute(node, "class").split(/\s+/))) return;
      if (!userAgent) element = node.nodeId;
    }
    for (const root of node.shadowRoots ?? []) walk(root, element, userAgent || root.shadowRootType === "user-agent");
    for (const child of node.children ?? []) walk(child, element, userAgent);
    if (node.contentDocument !== undefined) walk(node.contentDocument, element, userAgent);
  };
  walk(document, document.nodeId, false);
  return found;
}

/** A collected text node of the font check (data-model.md § Text node). */
export interface TextNode {
  readonly families: readonly string[];
  readonly userAgentShadow: boolean;
  readonly computedFamily: string;
}

/** A face of `document.fonts`. */
export interface Face {
  readonly family: string;
  readonly status: string;
}

/** A CSS family name without its quotes. */
function unquoted(family: string): string {
  return family.trim().replace(/^(["'])(.*)\1$/, "$2");
}

/** The faces a story-theme fails the font rule for (other families, faces loading or in error, used faces not loaded). */
export function fontProblems(texts: readonly TextNode[], faces: readonly Face[]): string[] {
  const problems: string[] = [];
  const add = (problem: string): void => {
    if (!problems.includes(problem)) problems.push(problem);
  };
  for (const text of texts) for (const family of text.families) if (family !== allowedFamily) add(family);
  const used = new Set(texts.flatMap((text) => text.computedFamily.split(",").map(unquoted)));
  for (const face of faces) {
    const family = unquoted(face.family);
    if (face.status === "loading" || face.status === "error" || (used.has(family) && face.status !== "loaded")) add(`${family} (${face.status})`);
  }
  return problems;
}

/** One `attachShadow` call the recorder saw. */
export interface ShadowCall {
  readonly mode: string;
  readonly host: string;
}

/** The host tags of the closed shadow roots attached, each once, in order. */
export function closedShadowHosts(calls: readonly ShadowCall[]): string[] {
  const hosts: string[] = [];
  for (const call of calls) if (call.mode === "closed" && !hosts.includes(call.host)) hosts.push(call.host);
  return hosts;
}
