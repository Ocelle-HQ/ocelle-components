// Stylelint plugin ocelle/token-only (FR-024, research.md R-07): every declaration value in the covered styles is
// parsed with postcss-value-parser, and each word, string, number, function and var() fallback is classified against
// FR-024's allow-list. A value with no raw part is token-only; each declaration with raw parts is reported once.
// Since 002 (FR-010, research.md R-09, contracts/gates.md § `style-lint`) every var() reference to an --ocelle-* name
// that is neither a token nor an element custom property the custom-elements manifest declares (exact name) is
// reported too, once per name and declaration, also inside calc() and as a fallback. The lists are the rule's
// secondary options when given (unit tests), else read once per run under the working directory, the gate's --root.
// Since 003 (FR-002, research.md R-07) the secondary option `lineHeight: "token"`, set for packages/styles/**/*.css
// in stylelint.config.ts, makes a line height (in `line-height`, or after the `/` of `font`) pass only as one
// var(--ocelle-line-height-*) reference without a fallback or as a CSS-wide keyword, and a `font` value with no
// top-level `/` raw unless it is a CSS-wide keyword alone (it resets line-height to normal; scope amended by the
// operator round of 2026-11-09, phase 2 round 2, O2-01); it is read apart from the token lists. Since 005 (research.md
// R-03, R-08) `scale` takes only the bare numbers -1 and 1, and any function in its value is raw; and (R-03, R-10) the
// unit `lh` passes only as `1lh`, as the whole value or, inside `calc()`, once per expression as an operand of `+` or
// `-` in an expression that references an `--ocelle-*` token, a group that holds only `1lh` counting as that `1lh`
// (OP4-01); and (R-03, R-09) `aspect-ratio` takes only the bare number 1 as its whole value. Since 013 (research.md R-10)
// `grid-template-columns` takes the tracks `fit-content(<percentage>)` and `minmax(0, <flex>)`, nothing else nested;
// and since 013 phase 3 (R-10) `transform` takes `translateX(<percentage>)`, in a rule or in `@keyframes`, and
// `animation-iteration-count` a bare positive integer, one per comma-separated item.
import stylelint from "stylelint";
import type { Rule } from "stylelint";
import valueParser from "postcss-value-parser";
import type { Node } from "postcss-value-parser";
import { checkLists, loadLists } from "./token-lists.ts";
import type { TokenLists } from "./token-lists.ts";

export const ruleName = "ocelle/token-only";

/** Properties that take unitless numbers (FR-024). */
const unitless = new Set(["line-height", "flex", "flex-grow", "flex-shrink", "z-index", "opacity", "order"]);
/** The CSS-wide keywords, the only identifiers a font value may hold. */
const cssWide = new Set(["inherit", "initial", "unset", "revert", "revert-layer"]);
/** Operators inside calc(). */
const operators = new Set(["+", "-", "*", "/"]);
/** The CSS Color 4 named colours, lower case; `transparent` and `currentColor` are keywords, not named colours. */
const namedColours = new Set(
  (
    "aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood " +
    "cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray " +
    "darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen " +
    "darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue " +
    "firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew " +
    "hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan " +
    "lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray " +
    "lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue " +
    "mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred " +
    "midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid " +
    "palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple " +
    "rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue " +
    "slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white " +
    "whitesmoke yellow yellowgreen"
  ).split(" "),
);

function isFont(property: string): boolean {
  return property === "font" || property === "font-family";
}

/** Whether one word of a value is allowed: a number by its unit and property, else an identifier or a hex colour. */
function wordAllowed(word: string, property: string, inCalc: boolean): boolean {
  if (inCalc && operators.has(word)) return true;
  const number = valueParser.unit(word);
  if (number !== false) {
    const unit = number.unit.toLowerCase();
    if (unit === "%" || unit === "fr") return true;
    if (unit !== "") return false;
    return Number(number.number) === 0 || inCalc || unitless.has(property);
  }
  if (word.startsWith("#")) return false;
  const identifier = word.toLowerCase();
  if (isFont(property)) return cssWide.has(identifier);
  return !namedColours.has(identifier);
}

/** Whether a word is a length in the unit `lh`, whatever its number. */
function isLh(word: string): boolean {
  const number = valueParser.unit(word);
  return number !== false && number.unit.toLowerCase() === "lh";
}

/** Whether a word is exactly one line box, `1lh` (005 research.md R-03). */
function isOneLine(word: string): boolean {
  const number = valueParser.unit(word);
  return number !== false && number.unit.toLowerCase() === "lh" && Number(number.number) === 1;
}

/** Whether a node is a calc() operator that adds or subtracts. */
function isSum(node: Node | undefined): boolean {
  return node?.type === "word" && (node.value === "+" || node.value === "-");
}

/** The operands of a group: its nodes but spaces and comments. */
function operandsOf(group: readonly Node[]): Node[] {
  return group.filter((node) => node.type !== "space" && node.type !== "comment");
}

/**
 * The `1lh` a calc() expression admits (005 research.md R-03; PLAN-FRESH-3-002 (a)): its one `lh` length, when the
 * expression holds exactly one (nested groups and calc() included), that length is `1lh`, each operator beside it in
 * its group adds or subtracts, and the expression references an `--ocelle-*` token; none otherwise. A group that holds
 * nothing but that `1lh` (`(1lh)`, `calc(1lh)`, at any depth) is that `1lh`, so its neighbours are read in the
 * enclosing group instead, outward while the group holds the one operand (OP4-01, landing round 1 L1-02). Any function
 * is climbed, not only a group or calc(): a `1lh` inside another function is never classified on its own (var() keeps
 * no fallback there, any other function is raw whole), so what it admits makes no difference.
 */
function admittedLine(calc: valueParser.FunctionNode): Node | undefined {
  const lengths: { readonly node: Node; readonly group: readonly Node[] }[] = [];
  const tokens: Node[] = [];
  // Each nested function's nodes, with that function and the group it sits in; the expression's own nodes have none.
  const holders = new Map<readonly Node[], { readonly node: Node; readonly group: readonly Node[] }>();
  const walk = (group: readonly Node[]): void => {
    for (const node of group) {
      if (node.type === "word" && isLh(node.value)) lengths.push({ node, group });
      if (node.type !== "function") continue;
      if (node.value.toLowerCase() === "var" && node.nodes[0]?.value.startsWith("--ocelle-") === true) tokens.push(node);
      holders.set(node.nodes, { node, group });
      walk(node.nodes);
    }
  };
  walk(calc.nodes);
  const [only] = lengths;
  if (lengths.length !== 1 || only === undefined || tokens.length === 0 || !isOneLine(only.node.value)) return undefined;
  let { node: subject, group } = only;
  for (let up = holders.get(group); up !== undefined && operandsOf(group).length === 1; up = holders.get(group)) {
    ({ node: subject, group } = up);
  }
  const operands = operandsOf(group);
  const at = operands.findIndex((node) => node === subject);
  const [before, after] = [operands[at - 1], operands[at + 1]];
  return (before === undefined || isSum(before)) && (after === undefined || isSum(after)) ? only.node : undefined;
}

/**
 * Whether a function is a grid track that 013's allowance admits in `grid-template-columns` (research.md R-10,
 * PLAN-CORRECTNESS-1-001 (a)): `fit-content(<percentage>)`, one percentage argument, or `minmax(0, <flex>)`, the
 * number 0 and one `fr` length. Nothing nested, no other argument, no other function (`repeat()` stays raw).
 */
function gridTrack(node: valueParser.FunctionNode): boolean {
  const name = node.value.toLowerCase();
  const args = node.nodes.filter((child) => child.type !== "space" && child.type !== "comment");
  const unit = (child: Node | undefined): string | undefined => {
    if (child?.type !== "word") return undefined;
    const number = valueParser.unit(child.value);
    return number === false ? undefined : number.unit.toLowerCase();
  };
  if (name === "fit-content") return args.length === 1 && unit(args[0]) === "%";
  if (name !== "minmax" || args.length !== 3) return false;
  const [min, comma, max] = args;
  return min?.type === "word" && min.value === "0" && comma?.type === "div" && comma.value === "," && unit(max) === "fr";
}

/**
 * Whether a function is the translate 013's sweep allowance admits in `transform` (research.md R-10, PLAN-CORRECTNESS-1-001
 * (a)): `translateX(<percentage>)`, one percentage argument, nothing nested; any other translate stays raw.
 */
function percentageTranslate(node: valueParser.FunctionNode): boolean {
  const args = node.nodes.filter((child) => child.type !== "space" && child.type !== "comment");
  const [only] = args;
  if (node.value.toLowerCase() !== "translatex" || args.length !== 1 || only?.type !== "word") return false;
  const number = valueParser.unit(only.value);
  return number !== false && number.unit === "%";
}

/**
 * The raw parts of a function: a var() fallback and calc() operands are checked; in `grid-template-columns` (outside
 * calc()) the two grid tracks of gridTrack() pass, and in `transform` (outside calc()) `translateX(<percentage>)` (013
 * R-10); any other function is raw. `line`
 * is the `1lh` the enclosing calc() expression admits; an outermost calc() works out its own.
 */
function functionRaw(node: valueParser.FunctionNode, property: string, inCalc: boolean, line: Node | undefined): string[] {
  const name = node.value.toLowerCase();
  if (name === "var") {
    const comma = node.nodes.findIndex((child) => child.type === "div" && child.value === ",");
    return comma === -1 ? [] : classify(node.nodes.slice(comma + 1), property, inCalc);
  }
  if (name === "calc" || (name === "" && inCalc)) return classify(node.nodes, property, true, inCalc ? line : admittedLine(node));
  if (property === "grid-template-columns" && !inCalc && gridTrack(node)) return [];
  if (property === "transform" && !inCalc && percentageTranslate(node)) return [];
  return [valueParser.stringify(node)];
}

function classify(nodes: readonly Node[], property: string, inCalc: boolean, line?: Node): string[] {
  const raw: string[] = [];
  for (const node of nodes) {
    if (node.type === "word") {
      if (node !== line && !wordAllowed(node.value, property, inCalc)) raw.push(node.value);
    } else if (node.type === "string") {
      if (isFont(property)) raw.push(valueParser.stringify(node));
    } else if (node.type === "function") {
      raw.push(...functionRaw(node, property, inCalc, line));
    } else if (node.type === "unicode-range") {
      raw.push(node.value);
    }
  }
  return raw;
}

/** The value check's options: with `lineHeight: "token"`, a line height must be a token or a CSS-wide keyword. */
export interface RawOptions {
  readonly lineHeight?: "token";
}

/**
 * Whether one node is a line height the `lineHeight: "token"` option allows: a CSS-wide keyword, or a var() whose one
 * argument is a name starting with `--ocelle-line-height-` (case-sensitive); another token is not a line height.
 */
function tokenLineHeight(node: Node): boolean {
  if (node.type === "word") return cssWide.has(node.value.toLowerCase());
  if (node.type !== "function" || node.value.toLowerCase() !== "var" || node.nodes.length !== 1) return false;
  const [name] = node.nodes;
  return name?.type === "word" && name.value.startsWith("--ocelle-line-height-");
}

/**
 * The raw values of a `font` value under the option: with a top-level `/`, its line height (the part after it) by
 * tokenLineHeight() and every other part by 002's checks; without one, the trimmed value as one entry (it resets
 * line-height to normal), unless the value is a CSS-wide keyword alone.
 */
function fontRaw(value: string, nodes: readonly Node[]): string[] {
  const at = nodes.findIndex((node) => node.type === "div" && node.value === "/") + 1;
  if (at === 0) return cssWide.has(value.trim().toLowerCase()) ? [] : [value.trim()];
  return nodes.flatMap((node, index) => {
    if (index !== at) return classify([node], "font", false);
    return tokenLineHeight(node) ? [] : [valueParser.stringify(node)];
  });
}

/** The numbers `scale` takes (005 research.md R-03, PLAN-TESTABILITY-1-011 (a)): a flip or no flip, never a factor. */
const scaleNumbers = new Set([-1, 1]);

/**
 * The raw values of a `scale` value (005 research.md R-03, R-08; PLAN-FRESH-3-002 (a)): the whole value is checked, so
 * each word is a keyword or the bare number -1 or 1, and any function (calc(), var() or another) is raw.
 */
function scaleRaw(nodes: readonly Node[]): string[] {
  return nodes.flatMap((node) => {
    if (node.type === "function") return [valueParser.stringify(node)];
    // A space, a string or a comment is no number, so it is classified as for any property.
    const number = valueParser.unit(node.value);
    // Stryker disable next-line StringLiteral,BooleanLiteral: equivalent, what reaches here is no number, and classify() reads the property only for font values and unitless numbers and inCalc only for numbers and the operator words, which it allows outside calc() too as identifiers
    if (number === false) return classify([node], "scale", false);
    return number.unit === "" && scaleNumbers.has(Number(number.number)) ? [] : [node.value];
  });
}

/**
 * The raw values of an `aspect-ratio` value (005 research.md R-03, R-09; PLAN-FRESH-1-006 (a), PLAN-FRESH-3-002 (a)):
 * the whole value is checked, so it passes as the bare number 1 alone ("as wide as high"); any other number, a number
 * beside another part (`1 / 1`, `auto 1`) and any function (calc(), var() or another) are raw. Keywords stay allowed.
 */
function aspectRatioRaw(nodes: readonly Node[]): string[] {
  const parts = nodes.filter((node) => node.type !== "space");
  const [only] = parts;
  if (parts.length === 1 && only?.type === "word" && only.value === "1") return [];
  return parts.flatMap((node) => {
    if (node.type === "function") return [valueParser.stringify(node)];
    // Any number (in a word, or a string that reads as one) beside or instead of the bare 1.
    if (valueParser.unit(node.value) !== false) return [node.value];
    // A `/` divider, a keyword, a colour, a string or a comment: classified as for any property.
    // Stryker disable next-line StringLiteral,BooleanLiteral: equivalent, what reaches here is no number, and classify() reads the property only for font values and unitless numbers and inCalc only for numbers and the operator words, which it allows outside calc() too as identifiers
    return classify([node], "aspect-ratio", false);
  });
}

/** A positive integer as written: digits only, no leading zero, no sign, no fraction or exponent. */
const positiveInteger = /^[1-9]\d*$/;

/**
 * The raw values of an `animation-iteration-count` value (013 research.md R-10, PLAN-A11Y-SECURITY-1-001 (a)): in each
 * comma-separated item, its one unitless number passes when it is a bare positive integer; an item with more than one
 * unitless number, a fraction, a sign or an exponent is raw, and every other part is classified as for any property.
 */
function iterationCountRaw(nodes: readonly Node[]): string[] {
  const items: Node[][] = [[]];
  for (const node of nodes) {
    if (node.type === "div" && node.value === ",") items.push([]);
    else items[items.length - 1]?.push(node);
  }
  return items.flatMap((item) => {
    const counts = item.filter((node) => node.type === "word" && valueParser.unit(node.value) !== false && (valueParser.unit(node.value) as valueParser.Dimension).unit === "");
    const [count] = counts;
    const allowed = counts.length === 1 && count !== undefined && positiveInteger.test(count.value) ? count : undefined;
    return item.flatMap((node) => (node === allowed ? [] : classify([node], "animation-iteration-count", false)));
  });
}

/** The raw values (FR-024) in one declaration's value, in source order; empty when the value is token-only. */
export function rawValues(property: string, value: string, options: RawOptions = {}): string[] {
  const name = property.toLowerCase();
  const nodes = valueParser(value).nodes;
  if (name === "scale") return scaleRaw(nodes);
  if (name === "aspect-ratio") return aspectRatioRaw(nodes);
  if (name === "animation-iteration-count") return iterationCountRaw(nodes);
  if (options.lineHeight === "token" && name === "line-height") {
    const [only] = nodes;
    return nodes.length === 1 && only !== undefined && tokenLineHeight(only) ? [] : [value.trim()];
  }
  if (options.lineHeight === "token" && name === "font") return fontRaw(value, nodes);
  // One line box as the whole value (the slot wrapper's `block-size: 1lh`, 005 research.md R-10).
  const [only] = nodes;
  return classify(nodes, name, false, nodes.length === 1 && only?.type === "word" && isOneLine(only.value) ? only : undefined);
}

/** The --ocelle-* names a value references with var(), each once, in order; nested ones and fallbacks included. */
export function referencedTokens(value: string): string[] {
  const found: string[] = [];
  valueParser(value).walk((node) => {
    if (node.type !== "function" || node.value.toLowerCase() !== "var") return;
    const [first] = node.nodes;
    if (first?.type === "word" && first.value.startsWith("--ocelle-") && !found.includes(first.value)) found.push(first.value);
  });
  return found;
}

const messages = stylelint.utils.ruleMessages(ruleName, {
  raw: (property: string, values: string) => `${property}: raw ${values}; use a --ocelle-* token (FR-024)`,
  unknown: (name: string) => `unknown token ${name}`,
});

/** The lists read under each root, once per run. */
const loaded = new Map<string, Promise<TokenLists>>();

function listsUnder(root: string): Promise<TokenLists> {
  const cached = loaded.get(root);
  if (cached !== undefined) return cached;
  const lists = loadLists(root);
  // Stryker disable next-line CallExpression: equivalent, without the cache each file loads the same lists from the same root again, so the warnings are the same; the cache only saves the reads
  loaded.set(root, lists);
  return lists;
}

function isText(value: unknown): boolean {
  return typeof value === "string";
}

/** The lists the secondary options give, checked for a clash; undefined when they give neither list. */
function optionLists(secondary: unknown): TokenLists | undefined {
  if (typeof secondary !== "object" || secondary === null) return undefined;
  const options = secondary as { tokens?: readonly string[]; elementProperties?: readonly string[] };
  if (options.tokens === undefined && options.elementProperties === undefined) return undefined;
  // Stryker disable next-line ArrayDeclaration: equivalent, an entry of an absent list is only compared with --ocelle-* var() names and with the other list's custom property names, and the mutant's entry "Stryker was here" is neither
  const lists = { tokens: options.tokens ?? [], elementProperties: options.elementProperties ?? [] };
  checkLists(lists);
  return lists;
}

const rule: Rule = (primary, secondary) => async (root, result) => {
  const valid = stylelint.utils.validateOptions(
    result,
    ruleName,
    { actual: primary, possible: [true] },
    { actual: secondary, possible: { tokens: [isText], elementProperties: [isText], lineHeight: ["token"] }, optional: true },
  );
  if (!valid) return;
  const lists = optionLists(secondary) ?? (await listsUnder(process.cwd()));
  const known = new Set([...lists.tokens, ...lists.elementProperties]);
  const options: RawOptions = (secondary as { lineHeight?: unknown } | null | undefined)?.lineHeight === "token" ? { lineHeight: "token" } : {};
  root.walkDecls((declaration) => {
    const raw = rawValues(declaration.prop, declaration.value, options);
    if (raw.length > 0) stylelint.utils.report({ ruleName, result, node: declaration, message: messages.raw(declaration.prop, raw.join(", ")) });
    for (const name of referencedTokens(declaration.value)) {
      if (!known.has(name)) stylelint.utils.report({ ruleName, result, node: declaration, message: messages.unknown(name) });
    }
  });
};
rule.ruleName = ruleName;
rule.messages = messages;

export default stylelint.createPlugin(ruleName, rule);
