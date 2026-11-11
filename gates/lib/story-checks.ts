// The in-page checks of a story-theme (FR-014, FR-027; research.md R-05, R-08): the story area (the whole document
// minus Storybook's harness nodes), the text nodes of the font check from the DevTools protocol's pierced document
// (user-agent shadow text of form controls attributed to its host control), the font rule, and closed shadow roots.
// Pure, tested in process (gates/test/story-checks.test.ts); gates/lib/story-page.ts only collects the data.

/** The one font face a story may draw text with (constitution II; @ocelle/tokens vendors it). */
export const allowedFamily = "Schibsted Grotesk";

/** Storybook 10.6.5's harness nodes in the preview (spike § 3): ids and classes. */
export const harness: { readonly ids: readonly string[]; readonly classes: readonly string[] } = { ids: [], classes: [] };

/** Whether an element with this id and these classes is one of Storybook's harness nodes. */
export function isHarness(id: string, classes: readonly string[]): boolean {
  throw new Error(`not implemented (story-checks, phase 3): ${id} ${String(classes.length)}`);
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

/** Every non-whitespace text node of the story area in a pierced document, in document order. */
export function storyTextNodes(document: CdpNode): StoryText[] {
  throw new Error(`not implemented (story-checks, phase 3): ${String(document.nodeId)}`);
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

/** The faces a story-theme fails the font rule for (other families, faces loading or in error, used faces not loaded). */
export function fontProblems(texts: readonly TextNode[], faces: readonly Face[]): string[] {
  throw new Error(`not implemented (story-checks, phase 3): ${String(texts.length)} ${String(faces.length)}`);
}

/** One `attachShadow` call the recorder saw. */
export interface ShadowCall {
  readonly mode: string;
  readonly host: string;
}

/** The host tags of the closed shadow roots attached, each once, in order. */
export function closedShadowHosts(calls: readonly ShadowCall[]): string[] {
  throw new Error(`not implemented (story-checks, phase 3): ${String(calls.length)}`);
}
