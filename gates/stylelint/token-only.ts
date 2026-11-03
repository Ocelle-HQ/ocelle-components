// Stylelint plugin ocelle/token-only (FR-024, research.md R-07): every declaration value in the covered styles is
// parsed with postcss-value-parser, and each word, string, number, function and var() fallback is classified against
// FR-024's allow-list. A value with no raw part is token-only; each declaration with raw parts is reported once.
import stylelint from "stylelint";
import type { Rule } from "stylelint";
import valueParser from "postcss-value-parser";
import type { Node } from "postcss-value-parser";

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

const messages = stylelint.utils.ruleMessages(ruleName, {
  raw: (property: string, values: string) => `${property}: raw ${values}; use a --ocelle-* token (FR-024)`,
});

const rule: Rule = (primary) => (root, result) => {
  if (!stylelint.utils.validateOptions(result, ruleName, { actual: primary, possible: [true] })) return;
  root.walkDecls((declaration) => {
    const raw = rawValues(declaration.prop, declaration.value);
    if (raw.length === 0) return;
    stylelint.utils.report({ ruleName, result, node: declaration, message: messages.raw(declaration.prop, raw.join(", ")) });
  });
};
rule.ruleName = ruleName;
rule.messages = messages;

export default stylelint.createPlugin(ruleName, rule);
