// The source-level checks of base.css (003 research.md R-11, R-10 § Source-level guards): each takes a PostCSS root
// and returns the list of problems it finds, so the same helper runs on the shipped text (where the list must be
// empty) and on the plant strings of R-10 (where it must report). Specificity follows Selectors Level 4, computed
// with postcss-selector-parser: ids (a), classes, attributes and pseudo-classes (b), types and pseudo-elements (c);
// `:where()` adds nothing, `:is()`, `:not()` and `:has()` add their most specific argument.
import postcss from "postcss";
import type { AtRule, ChildNode, Declaration, Root, Rule } from "postcss";
import selectorParser from "postcss-selector-parser";

/** Specificity as (a, b, c). */
export type Specificity = readonly [number, number, number];

/** One style rule with the at-rule preludes around it (outermost first), its selectors and its declarations. */
export interface RuleEntry {
  readonly media: readonly string[];
  readonly selectors: readonly string[];
  readonly declarations: readonly (readonly [string, string])[];
}

const space = (text: string): string => text.replace(/\s+/g, " ").trim();

export function parse(css: string): Root {
  return postcss.parse(css);
}

function context(node: ChildNode): string[] {
  const media: string[] = [];
  for (let parent = node.parent; parent !== undefined && parent.type !== "root"; parent = parent.parent) {
    if (parent.type === "atrule") media.unshift(space(`@${(parent as AtRule).name} ${(parent as AtRule).params}`));
  }
  return media;
}

/** Every style rule of the sheet, in source order, nested ones included. */
export function rules(root: Root): RuleEntry[] {
  const found: RuleEntry[] = [];
  root.walkRules((rule: Rule) => {
    const declarations = rule.nodes.filter((node): node is Declaration => node.type === "decl").map((node) => [node.prop, space(node.value)] as const);
    found.push({ media: context(rule), selectors: rule.selectors.map(space), declarations });
  });
  return found;
}

/** Each declaration as `selector { prop: value }` text for a problem report. */
function where(declaration: Declaration): string {
  const parent = declaration.parent;
  const selector = parent?.type === "rule" ? space(parent.selector) : "";
  return space(`${[...context(declaration), selector].filter((part) => part !== "").join(" ")} { ${declaration.prop}: ${declaration.value} }`);
}

/** Motion (FR-010, US1-3): any property that is or starts with `transition` or `animation`, or is `scroll-behavior`. */
export function motionProblems(root: Root): string[] {
  const found: string[] = [];
  root.walkDecls((declaration) => {
    const property = declaration.prop.toLowerCase();
    if (property.startsWith("transition") || property.startsWith("animation") || property === "scroll-behavior") found.push(where(declaration));
  });
  return found;
}

/** FR-011: any `forced-color-adjust: none`. */
export function forcedColorAdjustProblems(root: Root): string[] {
  const found: string[] = [];
  root.walkDecls((declaration) => {
    if (declaration.prop.toLowerCase() === "forced-color-adjust" && space(declaration.value).toLowerCase() === "none") found.push(where(declaration));
  });
  return found;
}

/** FR-009: `outline: none`, `outline: 0` or `outline-style: none`, on any selector, at any depth. */
export function outlineProblems(root: Root): string[] {
  const found: string[] = [];
  root.walkDecls((declaration) => {
    const property = declaration.prop.toLowerCase();
    const words = space(declaration.value).toLowerCase().split(" ");
    if (property === "outline" && (words.includes("none") || words.includes("0"))) found.push(where(declaration));
    if (property === "outline-style" && words.includes("none")) found.push(where(declaration));
  });
  return found;
}

/** FR-001, US1-5: any `@import`, and any `url(` in a declaration or an at-rule prelude. */
export function importUrlProblems(root: Root): string[] {
  const found: string[] = [];
  root.walkAtRules((rule) => {
    if (rule.name.toLowerCase() === "import" || /url\(/i.test(rule.params)) found.push(space(`@${rule.name} ${rule.params}`));
  });
  root.walkDecls((declaration) => {
    if (/url\(/i.test(declaration.value)) found.push(where(declaration));
  });
  return found;
}

function selectorNodes(selector: string): selectorParser.Selector[] {
  return selectorParser().astSync(selector).nodes;
}

/** FR-005, US1-8: every selector that contains a class, at any depth (inside `:not()` and `:where()` too). */
export function classProblems(root: Root): string[] {
  const found: string[] = [];
  root.walkRules((rule) => {
    for (const selector of rule.selectors) {
      const classes: string[] = [];
      selectorParser((tree) => {
        tree.walkClasses((node) => {
          classes.push(node.value);
        });
      }).processSync(selector);
      if (classes.length > 0) found.push(space(selector));
    }
  });
  return found;
}

const legacyPseudoElements = new Set([":before", ":after", ":first-line", ":first-letter"]);
const add = (x: Specificity, y: Specificity): Specificity => [x[0] + y[0], x[1] + y[1], x[2] + y[2]];
const compare = (x: Specificity, y: Specificity): number => x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
const highest = (list: readonly Specificity[]): Specificity => list.reduce((best, each) => (compare(each, best) > 0 ? each : best), [0, 0, 0]);

function ofNodes(nodes: readonly selectorParser.Node[]): Specificity {
  let total: Specificity = [0, 0, 0];
  for (const node of nodes) {
    if (node.type === "id") total = add(total, [1, 0, 0]);
    else if (node.type === "class" || node.type === "attribute") total = add(total, [0, 1, 0]);
    else if (node.type === "tag") total = add(total, [0, 0, 1]);
    else if (node.type === "pseudo") {
      const name = node.value.toLowerCase();
      if (name.startsWith("::") || legacyPseudoElements.has(name)) total = add(total, [0, 0, 1]);
      else if (name === ":where") continue;
      else if (name === ":is" || name === ":not" || name === ":has" || name === ":matches") total = add(total, highest(node.nodes.map((argument) => ofNodes(argument.nodes))));
      else total = add(total, [0, 1, 0]);
    }
  }
  return total;
}

/** The specificity of one complex selector (no selector list). */
export function specificity(selector: string): Specificity {
  return highest(selectorNodes(selector).map((each) => ofNodes(each.nodes)));
}

/** FR-025, US1-8: a selector with a `data-ocelle-*` attribute has (0,1,1) or lower, any other (0,0,1) or lower. */
export function specificityProblems(root: Root): string[] {
  const found: string[] = [];
  root.walkRules((rule) => {
    for (const selector of rule.selectors) {
      const hook = /\[\s*data-ocelle-/i.test(selector);
      const value = specificity(selector);
      if (compare(value, hook ? [0, 1, 1] : [0, 0, 1]) > 0) found.push(`${space(selector)} (${value.join(",")})`);
    }
  });
  return found;
}

/** Every selector of the sheet, each once, in source order. */
export function selectors(root: Root): string[] {
  return [...new Set(rules(root).flatMap((rule) => rule.selectors))];
}
