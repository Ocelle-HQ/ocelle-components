// The content-security gate (FR-021, research.md R-11): the packages' built output (`packages/<name>/dist/**` with
// `.js`, `.css` or `.html`) is checked by parsing, not by text patterns. HTML files, and the static text of every
// string and template literal with a `<` in built JavaScript, go through the parse5 tokenizer: an inline `<script>`
// (no `src`), a `<style>` element, a `style` attribute and an `on*` attribute are findings. Built JavaScript is parsed
// with the TypeScript compiler API: `eval` (also `(0, eval)` and as a member of globalThis, window or self),
// `new Function`, `Function()` and `setTimeout`/`setInterval` with a string argument are findings. A JavaScript file
// that does not parse is exit 2. CSS files are read and counted; no FR-021 construct can occur in them.
//
// 002 (FR-023) had widened the scope to this repository's Storybook inputs and the HTML entries of its build output.
// Since 006 (FR-020, research.md R-10; operator decision Q1 (a)) the Storybook is not a CSP target and the scope is
// the packages' built output again, with no exception: no file below `storybook/` is read.
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { Tokenizer, TokenizerMode } from "parse5";
import type { Token } from "parse5";
import ts from "typescript";
import { main, parseArgs } from "../lib/cli.ts";
import type { Io } from "../lib/cli.ts";
import { filePaths } from "../lib/entries.ts";
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
  // Stryker disable next-line BooleanLiteral: equivalent, a start tag is emitted at its ">" whether or not the chunk is the last, and a tag left open at the end is dropped either way (no element), so no finding depends on the flag
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

/** Where one static part of a template starts: in the joined text, and in the source. */
interface PartStart {
  readonly joined: number;
  readonly source: number;
}

/**
 * The static parts of a template literal as written (raw, so offsets match the source), joined with one placeholder
 * character per expression, each with its start in the joined text and in the source (after its "`" or "}").
 */
export function templateParts(node: ts.TemplateExpression | ts.NoSubstitutionTemplateLiteral, file: ts.SourceFile): { text: string; starts: PartStart[] } {
  const literals: (ts.TemplateLiteralLikeNode & ts.Node)[] = ts.isNoSubstitutionTemplateLiteral(node)
    ? [node]
    : [node.head, ...node.templateSpans.map((span) => span.literal)];
  const parts = literals.map((literal) => ({ text: literal.rawText ?? literal.text, source: literal.getStart(file) + 1 }));
  let joined = 0;
  const starts = parts.map((part) => {
    const start = { joined, source: part.source };
    joined += part.text.length + 1;
    return start;
  });
  return { text: parts.map((part) => part.text).join("x"), starts };
}

/** The source offset of an offset in the joined text: in the last part that starts at or before it (the first starts at 0). */
export function sourceOffset(starts: readonly PartStart[], offset: number): number {
  let source = 0;
  for (const start of starts) if (start.joined <= offset) source = start.source + offset - start.joined;
  return source;
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
  const source = ts.createSourceFile(file.path, file.text, ts.ScriptTarget.Latest, undefined, ts.ScriptKind.JS);
  if (syntax !== undefined) {
    const line = source.getLineAndCharacterOfPosition(syntax.start ?? 0).line + 1;
    // Stryker disable next-line StringLiteral: equivalent, the parser's syntax diagnostics are single messages, not chains, so the separator is never used
    const message = ts.flattenDiagnosticMessageText(syntax.messageText, " ");
    return { cause: `${file.path}:${String(line)} does not parse (${message})` };
  }
  const found: Finding[] = [];
  const lineOf = (position: number): number => source.getLineAndCharacterOfPosition(position).line + 1;
  const visit = (node: ts.Node): void => {
    const dynamic = dynamicCode(node, file.path, lineOf(node.getStart(source)));
    if (dynamic !== undefined) found.push(dynamic);
    // Stryker disable next-line StringLiteral: equivalent, a string without "<" holds no tag, so scanning it finds nothing; the check only skips the work
    if (ts.isStringLiteral(node) && node.text.includes("<")) {
      found.push(...scanMarkup(file.path, node.text, lineOf(node.getStart(source))));
    }
    // Stryker disable next-line StringLiteral: equivalent, a template without "<" holds no tag, so scanning it finds nothing; the check only skips the work
    if ((ts.isTemplateExpression(node) || ts.isNoSubstitutionTemplateLiteral(node)) && node.getText(source).includes("<")) {
      const { text, starts } = templateParts(node, source);
      found.push(...markupFindings(file.path, text, (offset) => lineOf(sourceOffset(starts, offset))));
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

/** The built output files the gate checks, by repository path, sorted. */
export function selectOutput(paths: readonly string[]): string[] {
  return paths.filter((path) => isBuiltOutput(path)).sort();
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "csp --root <tmp> exits 1 with exactly the defect's finding at its repository path"
export async function run(argv: readonly string[], io: Io): Promise<number> {
  const context = parseArgs(argv, io.cwd);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "csp --root <tmp> exits 1 with exactly the defect's finding at its repository path"
  const entries = await readdir(join(context.root, "packages"), { recursive: true, withFileTypes: true }).catch(() => []);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "csp --root <tmp> exits 1 with exactly the defect's finding at its repository path"
  const selected = selectOutput(filePaths(entries, context.root));
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "csp --root <tmp> exits 1 with exactly the defect's finding at its repository path"
  const files = await Promise.all(selected.map(async (path) => ({ path, text: await readFile(join(context.root, path), "utf8") })));
  return emit(checkOutput(files), io.out, io.err);
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "csp --root <tmp> exits 1 with exactly the defect's finding at its repository path"
if (import.meta.main) await main(run);
