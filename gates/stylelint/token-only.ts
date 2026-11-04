// Stylelint plugin ocelle/token-only (FR-024, research.md R-07): every declaration value in the covered styles is
// parsed with postcss-value-parser, and each word, string, number, function and var() fallback is classified against
// FR-024's allow-list. A value with no raw part is token-only; each declaration with raw parts is reported once.
// Since 002 (FR-010, research.md R-09, contracts/gates.md § `style-lint`) every var() reference to an --ocelle-* name
// that is neither a token nor an element custom property the custom-elements manifest declares (exact name) is
// reported too, once per name and declaration, also inside calc() and as a fallback. The lists are the rule's
// secondary options when given (unit tests), else read once per run under the working directory, the gate's --root.
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

/** The raw parts of a function: a var() fallback and calc() operands are checked; any other function is raw. */
function functionRaw(node: valueParser.FunctionNode, property: string, inCalc: boolean): string[] {
  const name = node.value.toLowerCase();
  if (name === "var") {
    const comma = node.nodes.findIndex((child) => child.type === "div" && child.value === ",");
    return comma === -1 ? [] : classify(node.nodes.slice(comma + 1), property, inCalc);
  }
  if (name === "calc" || (name === "" && inCalc)) return classify(node.nodes, property, true);
  return [valueParser.stringify(node)];
}

function classify(nodes: readonly Node[], property: string, inCalc: boolean): string[] {
  const raw: string[] = [];
  for (const node of nodes) {
    if (node.type === "word") {
      if (!wordAllowed(node.value, property, inCalc)) raw.push(node.value);
    } else if (node.type === "string") {
      if (isFont(property)) raw.push(valueParser.stringify(node));
    } else if (node.type === "function") {
      raw.push(...functionRaw(node, property, inCalc));
    } else if (node.type === "unicode-range") {
      raw.push(node.value);
    }
  }
  return raw;
}

/** The raw values (FR-024) in one declaration's value, in source order; empty when the value is token-only. */
export function rawValues(property: string, value: string): string[] {
  return classify(valueParser(value).nodes, property.toLowerCase(), false);
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

/** The lists the secondary options give, checked for a clash; undefined without options. */
function optionLists(secondary: unknown): TokenLists | undefined {
  if (typeof secondary !== "object" || secondary === null) return undefined;
  const options = secondary as { tokens?: readonly string[]; elementProperties?: readonly string[] };
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
    { actual: secondary, possible: { tokens: [isText], elementProperties: [isText] }, optional: true },
  );
  if (!valid) return;
  const lists = optionLists(secondary) ?? (await listsUnder(process.cwd()));
  const known = new Set([...lists.tokens, ...lists.elementProperties]);
  root.walkDecls((declaration) => {
    const raw = rawValues(declaration.prop, declaration.value);
    if (raw.length > 0) stylelint.utils.report({ ruleName, result, node: declaration, message: messages.raw(declaration.prop, raw.join(", ")) });
    for (const name of referencedTokens(declaration.value)) {
      if (!known.has(name)) stylelint.utils.report({ ruleName, result, node: declaration, message: messages.unknown(name) });
    }
  });
};
rule.ruleName = ruleName;
rule.messages = messages;

export default stylelint.createPlugin(ruleName, rule);
