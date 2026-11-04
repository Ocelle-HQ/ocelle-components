// Reads a generated stylesheet back into its blocks (research.md R-02, R-06) for the node tests, with PostCSS: the
// declarations of the `@font-face` rule, of the unconditioned `:root`, of `:root:not([data-theme="light"])` under `prefers-color-scheme: dark`,
// of `:root[data-theme="dark"]`, and of `:root` under `prefers-reduced-motion: reduce`, and the outline of the
// top-level nodes in order.
import postcss from "postcss";
import type { ChildNode } from "postcss";

export interface Blocks {
  /** Each top-level node: a rule's selector, or `@media <params> { <selector> }`. */
  readonly outline: readonly string[];
  readonly fontFace: ReadonlyMap<string, string>;
  readonly root: ReadonlyMap<string, string>;
  readonly darkSystem: ReadonlyMap<string, string>;
  readonly darkAttribute: ReadonlyMap<string, string>;
  readonly reducedMotion: ReadonlyMap<string, string>;
}

function declarations(node: ChildNode | undefined): Map<string, string> {
  const found = new Map<string, string>();
  if (node?.type !== "rule" && node?.type !== "atrule") return found;
  node.each((child) => {
    if (child.type === "decl") found.set(child.prop, child.value);
  });
  return found;
}

function describe(node: ChildNode): string {
  if (node.type === "rule") return node.selector;
  if (node.type === "atrule") {
    const inner = node.nodes?.map((child) => (child.type === "rule" ? child.selector : child.type === "decl" ? child.prop : child.type)).join(", ") ?? "";
    return `@${node.name}${node.params === "" ? "" : ` ${node.params}`} { ${inner} }`;
  }
  return node.type;
}

export function blocks(text: string): Blocks {
  const parsed = postcss.parse(text);
  const nodes = parsed.nodes;
  const ruleAt = (selector: string): ChildNode | undefined => nodes.find((node) => node.type === "rule" && node.selector === selector);
  const inMedia = (params: string, selector: string): ChildNode | undefined => {
    const media = nodes.find((node) => node.type === "atrule" && node.name === "media" && node.params === params);
    return media?.type === "atrule" ? media.nodes?.find((node) => node.type === "rule" && node.selector === selector) : undefined;
  };
  return {
    outline: nodes.map(describe),
    fontFace: declarations(nodes.find((node) => node.type === "atrule" && node.name === "font-face")),
    root: declarations(ruleAt(":root")),
    darkSystem: declarations(inMedia("(prefers-color-scheme: dark)", ':root:not([data-theme="light"])')),
    darkAttribute: declarations(ruleAt(':root[data-theme="dark"]')),
    reducedMotion: declarations(inMedia("(prefers-reduced-motion: reduce)", ":root")),
  };
}

/** The outline of the `@font-face` rule of research.md R-06, which comes first. */
export const fontFaceOutline = "@font-face { font-family, src, font-weight, font-style, font-display }";

/** The outline of a stylesheet with the four blocks of research.md R-02, in order. */
export const fourBlocks: readonly string[] = [
  ":root",
  '@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }',
  ':root[data-theme="dark"]',
  "@media (prefers-reduced-motion: reduce) { :root }",
];
