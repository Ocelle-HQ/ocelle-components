// The content-security gate (FR-021, research.md R-11): the packages' built output (`packages/<name>/dist/**` with
// `.js`, `.css` or `.html`) is checked by parsing, not by text patterns. HTML files, and the static text of every
// string and template literal with a `<` in built JavaScript, go through the parse5 tokenizer: an inline `<script>`
// (no `src`), a `<style>` element, a `style` attribute and an `on*` attribute are findings. Built JavaScript is parsed
// with the TypeScript compiler API: `eval` (also `(0, eval)` and as a member of globalThis, window or self),
// `new Function`, `Function()` and `setTimeout`/`setInterval` with a string argument are findings. A JavaScript file
// that does not parse is exit 2. CSS files are read and counted; no FR-021 construct can occur in them.
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { Tokenizer, TokenizerMode } from "parse5";
import type { Token } from "parse5";
import ts from "typescript";
import { main, parseArgs } from "../lib/cli.ts";
import type { Io } from "../lib/cli.ts";
import { emit, plural } from "../lib/findings.ts";
import type { Finding, GateResult } from "../lib/findings.ts";

/** One file of built output: its repository path and text. */
export interface OutputFile {
  readonly path: string;
  readonly text: string;
}

/** A script's findings, or the cause when it does not parse. */
export type ScriptScan = { readonly findings: readonly Finding[] } | { readonly cause: string };

const gate = "csp";
const globals = new Set(["globalThis", "window", "self"]);
const timers = new Set(["setTimeout", "setInterval"]);
/** Tags whose content the HTML parser reads as text, and the tokenizer state it switches to (as parse5's parser does). */
const textModes = new Map([
  ["script", TokenizerMode.SCRIPT_DATA],
  ["style", TokenizerMode.RAWTEXT],
  ["textarea", TokenizerMode.RCDATA],
  ["title", TokenizerMode.RCDATA],
]);

/** Whether a repository path is built output the gate checks: `packages/<name>/dist/**` with `.js`, `.css` or `.html`. */
export function isBuiltOutput(path: string): boolean {
  return /^packages\/[^/]+\/dist\/.+\.(?:js|css|html)$/.test(path);
}

function finding(path: string, line: number, rule: string, message: string): Finding {
  return { location: { path, line }, gate, rule, message };
}

/** The line of an offset in a text, counted from `first`. */
function lineAt(text: string, offset: number, first: number): number {
  return first + (text.slice(0, offset).match(/\n/g)?.length ?? 0);
}

/** The findings of one start tag; offsets are into the markup. */
function tagFindings(tag: Token.TagToken, at: (offset: number) => number, path: string): Finding[] {
  const found: Finding[] = [];
  const start = at(tag.location?.startOffset ?? 0);
  if (tag.tagName === "script" && !tag.attrs.some((attr) => attr.name === "src")) {
    found.push(finding(path, start, "inline-script", "inline <script> element without src (FR-021)"));
  }
  if (tag.tagName === "style") found.push(finding(path, start, "style-element", "<style> element (FR-021)"));
  for (const attr of tag.attrs) {
    const line = at(tag.location?.attrs?.[attr.name]?.startOffset ?? 0);
    if (attr.name === "style") {
      found.push(finding(path, line, "style-attribute", `style attribute on <${tag.tagName}> (FR-021)`));
    } else if (attr.name.startsWith("on")) {
      found.push(finding(path, line, "event-handler", `event handler attribute ${attr.name} on <${tag.tagName}> (FR-021)`));
    }
  }
  return found;
}

/** Findings in markup whose offsets map to lines through `at`. */
function markupFindings(path: string, markup: string, at: (offset: number) => number): Finding[] {
  const found: Finding[] = [];
  const ignore = (): void => undefined;
  const tokenizer: Tokenizer = new Tokenizer(
    { sourceCodeLocationInfo: true },
    {
      onStartTag: (tag) => {
        found.push(...tagFindings(tag, at, path));
        const mode = textModes.get(tag.tagName);
        if (mode !== undefined) tokenizer.state = mode;
      },
      onComment: ignore,
      onDoctype: ignore,
      onEndTag: ignore,
      onEof: ignore,
      onCharacter: ignore,
      onNullCharacter: ignore,
      onWhitespaceCharacter: ignore,
    },
  );
  tokenizer.write(markup, true);
  return found;
}

/** Findings in HTML markup (a file, or the static text of a string in a script) starting at `line`. */
export function scanMarkup(path: string, markup: string, line: number): Finding[] {
  return markupFindings(path, markup, (offset) => lineAt(markup, offset, line));
}

/** The callee of a call with parentheses and comma expressions taken off: `(0, eval)` is `eval`. */
function bareCallee(expression: ts.Expression): ts.Expression {
  if (ts.isParenthesizedExpression(expression)) return bareCallee(expression.expression);
  if (ts.isBinaryExpression(expression) && expression.operatorToken.kind === ts.SyntaxKind.CommaToken) {
    return bareCallee(expression.right);
  }
  return expression;
}

/** The global a callee names: an identifier, or a member of globalThis, window or self (by dot or string key). */
function globalName(expression: ts.Expression): string | undefined {
  const callee = bareCallee(expression);
  if (ts.isIdentifier(callee)) return callee.text;
  if (ts.isPropertyAccessExpression(callee)) {
    return ts.isIdentifier(callee.expression) && globals.has(callee.expression.text) ? callee.name.text : undefined;
  }
  if (ts.isElementAccessExpression(callee) && ts.isStringLiteralLike(callee.argumentExpression)) {
    return ts.isIdentifier(callee.expression) && globals.has(callee.expression.text) ? callee.argumentExpression.text : undefined;
  }
  return undefined;
}

/** Whether an argument is or contains a string: a string or template literal, or a concatenation with one. */
function isStringy(expression: ts.Expression): boolean {
  const bare = bareCallee(expression);
  if (ts.isStringLiteralLike(bare) || ts.isTemplateExpression(bare)) return true;
  return ts.isBinaryExpression(bare) && bare.operatorToken.kind === ts.SyntaxKind.PlusToken && (isStringy(bare.left) || isStringy(bare.right));
}

/** The static parts of a template literal, each with its source start, joined with a placeholder per expression. */
function templateParts(node: ts.TemplateExpression | ts.NoSubstitutionTemplateLiteral, file: ts.SourceFile): { text: string; starts: { joined: number; source: number }[] } {
  const literals: (ts.TemplateLiteralLikeNode & ts.Node)[] = ts.isNoSubstitutionTemplateLiteral(node)
    ? [node]
    : [node.head, ...node.templateSpans.map((span) => span.literal)];
  let text = "";
  const starts: { joined: number; source: number }[] = [];
  literals.forEach((literal, index) => {
    if (index > 0) text += "x";
    starts.push({ joined: text.length, source: literal.getStart(file) + 1 });
    text += literal.rawText ?? literal.text;
  });
  return { text, starts };
}

function dynamicCode(node: ts.Node, path: string, line: number): Finding | undefined {
  if (ts.isNewExpression(node) && globalName(node.expression) === "Function") {
    return finding(path, line, "new-function", "new Function() builds code from a string (FR-021)");
  }
  if (!ts.isCallExpression(node)) return undefined;
  const name = globalName(node.expression);
  if (name === "eval") return finding(path, line, "eval", "eval() runs a string as code (FR-021)");
  if (name === "Function") return finding(path, line, "function-call", "Function() builds code from a string (FR-021)");
  const first = node.arguments[0];
  if (name !== undefined && timers.has(name) && first !== undefined && isStringy(first)) {
    return finding(path, line, "string-timer", `${name}() with a string argument runs it as code (FR-021)`);
  }
  return undefined;
}

/** Findings in a built JavaScript file: dynamic code, and markup in its string and template literals. */
export function scanScript(file: OutputFile): ScriptScan {
  const diagnostics = ts.transpileModule(file.text, { fileName: file.path, reportDiagnostics: true }).diagnostics ?? [];
  const syntax = diagnostics[0];
  const source = ts.createSourceFile(file.path, file.text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  if (syntax !== undefined) {
    const line = source.getLineAndCharacterOfPosition(syntax.start ?? 0).line + 1;
    return { cause: `${file.path}:${String(line)} does not parse (${ts.flattenDiagnosticMessageText(syntax.messageText, " ")})` };
  }
  const found: Finding[] = [];
  const lineOf = (position: number): number => source.getLineAndCharacterOfPosition(position).line + 1;
  const visit = (node: ts.Node): void => {
    const dynamic = dynamicCode(node, file.path, lineOf(node.getStart(source)));
    if (dynamic !== undefined) found.push(dynamic);
    if (ts.isStringLiteral(node) && node.text.includes("<")) {
      found.push(...scanMarkup(file.path, node.text, lineOf(node.getStart(source))));
    }
    if ((ts.isTemplateExpression(node) || ts.isNoSubstitutionTemplateLiteral(node)) && node.getText(source).includes("<")) {
      const { text, starts } = templateParts(node, source);
      const at = (offset: number): number => {
        const part = starts.findLast((start) => start.joined <= offset) ?? { joined: 0, source: 0 };
        return lineOf(part.source + offset - part.joined);
      };
      found.push(...markupFindings(file.path, text, at));
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return { findings: found };
}

/** The gate's verdict on the built output files. */
export function checkOutput(files: readonly OutputFile[]): GateResult {
  const findings: Finding[] = [];
  let withFindings = 0;
  for (const file of files) {
    let found: readonly Finding[] = [];
    if (file.path.endsWith(".html")) found = scanMarkup(file.path, file.text, 1);
    if (file.path.endsWith(".js")) {
      const scan = scanScript(file);
      if ("cause" in scan) return { exit: 2, cause: `${gate}: could not run: ${scan.cause}; fix the build output` };
      found = scan.findings;
    }
    if (found.length > 0) withFindings += 1;
    findings.push(...found);
  }
  if (findings.length > 0) {
    return { exit: 1, findings, summary: `${gate}: ${plural(findings.length, "finding")} in ${plural(withFindings, "file")}` };
  }
  return { exit: 0, summary: `${gate}: ${plural(files.length, "file")} checked, no finding` };
}

/** Every file below a directory, as absolute paths; none when it does not exist. */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "csp --root <tmp> exits 1 with exactly the defect's finding at its repository path"
async function filesBelow(dir: string): Promise<string[]> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "csp --root <tmp> exits 1 with exactly the defect's finding at its repository path"
  const entries = await readdir(dir, { recursive: true, withFileTypes: true }).catch(() => []);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "csp --root <tmp> exits 1 with exactly the defect's finding at its repository path"
  return entries.filter((entry) => entry.isFile()).map((entry) => join(entry.parentPath, entry.name));
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "csp --root <tmp> exits 1 with exactly the defect's finding at its repository path"
export async function run(argv: readonly string[], io: Io): Promise<number> {
  const context = parseArgs(argv, io.cwd);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "csp --root <tmp> exits 1 with exactly the defect's finding at its repository path"
  const paths = (await filesBelow(join(context.root, "packages"))).map((path) => relative(context.root, path));
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "csp --root <tmp> exits 1 with exactly the defect's finding at its repository path"
  const selected = paths.filter((path) => isBuiltOutput(path)).sort();
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "csp --root <tmp> exits 1 with exactly the defect's finding at its repository path"
  const files = await Promise.all(selected.map(async (path) => ({ path, text: await readFile(join(context.root, path), "utf8") })));
  return emit(checkOutput(files), io.out, io.err);
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "csp --root <tmp> exits 1 with exactly the defect's finding at its repository path"
if (import.meta.main) await main(run);
