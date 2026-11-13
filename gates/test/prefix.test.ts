import { describe, expect, it } from "vitest";
import { checkPackages, isCovered, monospaceFamilies, scanText } from "../bin/prefix.ts";
import type { Finding } from "../lib/findings.ts";

// The prefix gate's decision (FR-022, research.md R-12): `sk-` and `--sk-` names at a name boundary,
// case-insensitive, and FR-022's monospace families in font declarations, in package source, test code and built
// output of the three packages only. This file is gate test code outside the packages, so it may name them.
const path = "packages/elements/src/x.ts";

function at(line: number, rule: string, message: string): Finding {
  return { location: { path, line }, gate: "prefix", rule, message };
}

const name = (found: string): string => `forbidden name ${found}; use the ocelle- prefix (FR-022)`;
const mono = (family: string): string => `monospace font family ${family} in a font declaration (FR-022)`;

describe("scanText: names", () => {
  it.each([
    { text: "<sk-button></sk-button>", found: "sk-button" },
    { text: "<SK-Button>", found: "SK-Button" },
    { text: 'document.createElement("sk-select");', found: "sk-select" },
    { text: 'this.dispatchEvent(new CustomEvent("sk-select-change"));', found: "sk-select-change" },
    { text: "  --sk-color: red;", found: "--sk-color" },
    { text: "color: var(--SK-Color);", found: "--SK-Color" },
    { text: "sk-", found: "sk-" },
    { text: "a.sk-row { }", found: "sk-row" },
  ])("finds $found in $text", ({ text, found }) => {
    expect(scanText(path, `const a = 1;\n${text}\n`)).toEqual([at(2, "sk-name", name(found))]);
  });

  it("names every forbidden name of a line in one finding", () => {
    expect(scanText(path, "<sk-a><sk-b>")).toEqual([at(1, "sk-name", name("sk-a, sk-b"))]);
  });

  it.each([
    "task-list",
    "desk-row",
    "--risk-level",
    "mask-image",
    "_sk-x",
    "1sk-x",
    "a-sk-b",
    "x--sk-y",
    "ask",
  ])("finds nothing in %s (only the control name on the next line)", (text) => {
    expect(scanText(path, `${text}\nsk-control`)).toEqual([at(2, "sk-name", name("sk-control"))]);
  });
});

describe("scanText: monospace", () => {
  it.each([
    { text: "font-family: monospace;", family: "monospace" },
    { text: "  font-family: ui-monospace, sans-serif;", family: "ui-monospace" },
    { text: "font: 12px Menlo, sans-serif;", family: "Menlo" },
    { text: "font-family: Monaco", family: "Monaco" },
    { text: "FONT-FAMILY: Consolas;", family: "Consolas" },
    { text: 'font-family: "Courier New";', family: "Courier New" },
    { text: "font-family: Courier;", family: "Courier" },
    { text: "font-family: SFMono-Regular;", family: "SFMono-Regular" },
    { text: "font-family: 'SF Mono';", family: "SF Mono" },
    { text: "font-family: Liberation Mono;", family: "Liberation Mono" },
    { text: "font-family: DejaVu Sans Mono;", family: "DejaVu Sans Mono" },
    { text: "font-family: Lucida Console;", family: "Lucida Console" },
    { text: "font-family: Roboto Mono;", family: "Roboto Mono" },
    { text: "font-family: Source Code Pro;", family: "Source Code Pro" },
    { text: "font-family: Fira Code;", family: "Fira Code" },
    { text: "font-family: Fira Mono;", family: "Fira Mono" },
    { text: "font-family: JetBrains Mono;", family: "JetBrains Mono" },
    { text: "font-family: Cascadia Code;", family: "Cascadia Code" },
    { text: "font-family: Cascadia Mono;", family: "Cascadia Mono" },
    { text: "@font-face { font-family: 'jetbrains mono'; src: url(x.woff2); }", family: "jetbrains mono" },
    { text: "a { font-size: 1rem; font-family: MONOSPACE }", family: "MONOSPACE" },
    { text: "font-family:monospace", family: "monospace" },
  ])("finds $family in $text", ({ text, family }) => {
    expect(scanText(path, `const a = 1;\n${text}\n`)).toEqual([at(2, "monospace", mono(family))]);
  });

  it.each([
    "font-family: var(--ocelle-font);",
    "font-family: 'Schibsted Grotesk', sans-serif;",
    "font-family: Monospaced Sans;",
    "/* monospace */ color: red;",
    'const fontFamily = "monospace";',
    "font-size: 12px; color: monospace;",
    "font-family: Arial; content: 'Menlo';",
    "x-font-family: monospace;",
  ])("finds nothing in %s (only the control family on the next line)", (text) => {
    expect(scanText(path, `${text}\nfont-family: monospace;`)).toEqual([at(2, "monospace", mono("monospace"))]);
  });

  it("reports a name and a monospace family on the same line as two findings", () => {
    expect(scanText(path, ":host { --sk-x: 1; font-family: monospace; }")).toEqual([
      at(1, "sk-name", name("--sk-x")),
      at(1, "monospace", mono("monospace")),
    ]);
  });
});

// A font declaration across lines (006 research.md R-10, plan decision 5): the declaration runs to its terminating `;`
// or `}` over line breaks, and its finding is at the line where it starts, so Storybook's multi-line vendor stack
// (`font-family:` on one line, `monospace` on a later one) has no blind spot in the HTML the gate reads.
describe("scanText: a font declaration across lines (006 R-10)", () => {
  it("finds a font-family whose value ends in monospace on the next line, as one finding at the line where it starts", () => {
    expect(scanText(path, "a {\n  font-family: ui-sans-serif,\n    monospace;\n}\n")).toEqual([at(2, "monospace", mono("monospace"))]);
  });

  it("names every family of a declaration over three lines in one finding at its first line", () => {
    const text = "<style>\n  code {\n    font-family:\n      ui-monospace, Menlo, Monaco,\n      monospace;\n  }\n</style>\n";
    expect(scanText(path, text)).toEqual([at(3, "monospace", mono("ui-monospace, Menlo, Monaco, monospace"))]);
  });

  it("ends a declaration at its } as at its ;, and reports a later declaration at its own line", () => {
    const text = "a { font-family: Arial\n} b { color: monospace;\nfont: 12px\nMenlo }\n";
    expect(scanText(path, text)).toEqual([at(3, "monospace", mono("Menlo"))]);
  });

  it("finds nothing past the ; that ends a declaration (only the control on the last line)", () => {
    expect(scanText(path, "font-family: Arial;\nmonospace\nfont-family: monospace;")).toEqual([at(3, "monospace", mono("monospace"))]);
  });

  it("keeps sk- names per line beside a declaration across lines", () => {
    expect(scanText(path, "a { font-family: x,\n--sk-y,\nmonospace; }")).toEqual([at(1, "monospace", mono("monospace")), at(2, "sk-name", name("--sk-y"))]);
  });
});

describe("isCovered", () => {
  it("selects the text files of the three packages, without installed dependencies, Markdown, binaries and maps", () => {
    const paths = [
      "packages/elements/src/x.ts",
      "packages/tokens/test/x.test.ts",
      "packages/elements/src/x.stories.ts",
      "packages/elements/dist/index.js",
      "packages/elements/dist/index.d.ts",
      "packages/styles/x.css",
      "packages/styles/src/page.html",
      "packages/tokens/package.json",
      "packages/tokens/src/icon.svg",
      "packages/tokens/src/x.mjs",
      "packages/tokens/src/x.cjs",
      "packages/tokens/src/x.mts",
      "packages/tokens/src/x.cts",
      "packages/elements/node_modules/x/index.js",
      "packages/elements/src/node_modules/x.js",
      "packages/tokens/README.md",
      "packages/tokens/src/font.woff2",
      "packages/elements/dist/index.js.map",
      "packages/x.ts",
      "gates/x.ts",
      "gates/plants/prefix/a/tree/packages/elements/src/x.ts",
      "xpackages/a/x.ts",
    ];
    expect(paths.filter((file) => isCovered(file))).toEqual(paths.slice(0, 13));
  });
});

describe("checkPackages", () => {
  const encode = (text: string): Uint8Array => new TextEncoder().encode(text);

  it("exits 0 naming the number of covered files checked", () => {
    const files = [
      { path: "packages/tokens/src/index.ts", bytes: encode("export {};\n") },
      { path: "packages/tokens/README.md", bytes: encode("sk-button\n") },
      { path: "packages/elements/dist/index.js", bytes: encode("export {};\n") },
    ];
    expect(checkPackages(files)).toEqual({ exit: 0, summary: "prefix: 2 files checked, no finding" });
  });

  it("exits 1 with the findings of covered files only", () => {
    const files = [
      { path, bytes: encode("const a = 1;\nconst t = 'sk-button';\n") },
      { path: "gates/x.ts", bytes: encode("sk-button\n") },
      { path: "packages/styles/src/x.css", bytes: encode("a { font-family: Menlo; }\n") },
    ];
    expect(checkPackages(files)).toEqual({
      exit: 1,
      findings: [
        at(2, "sk-name", name("sk-button")),
        { location: { path: "packages/styles/src/x.css", line: 1 }, gate: "prefix", rule: "monospace", message: mono("Menlo") },
      ],
      summary: "prefix: 2 findings in 2 files",
    });
  });

  it("exits 2 naming a covered file that is not valid UTF-8", () => {
    const files = [
      { path: "packages/tokens/src/a.ts", bytes: encode("export {};\n") },
      { path: "packages/tokens/src/b.ts", bytes: new Uint8Array([0x61, 0xff, 0xfe, 0x0a]) },
    ];
    expect(checkPackages(files)).toEqual({
      exit: 2,
      cause: "prefix: could not run: packages/tokens/src/b.ts is not valid UTF-8; fix or remove the file",
    });
  });

  it("does not read an uncovered file that is not valid UTF-8", () => {
    const files = [{ path: "packages/tokens/src/font.woff2", bytes: new Uint8Array([0xff, 0xfe]) }];
    expect(checkPackages(files)).toEqual({ exit: 0, summary: "prefix: 0 files checked, no finding" });
  });
});

// The widened scope (002 FR-023; contracts/gates.md § `csp`, `prefix`): the Storybook workspace's own source
// (`.storybook/`, `stories/`, `scripts/`, `test/` and its other files), its generated stylesheets and the top-level
// HTML entries of its build output; not installed packages and not the bundles under storybook/dist/.
describe("isCovered: the Storybook workspace (002 FR-023)", () => {
  it("selects the Storybook source, tests, generated stylesheets and top-level HTML entries, not installed packages, bundles, binaries or Markdown", () => {
    const inScope = [
      "storybook/.storybook/main.ts",
      "storybook/.storybook/preview-head.html",
      "storybook/.storybook/preview.css",
      "storybook/stories/tokens.stories.ts",
      "storybook/stories/render.ts",
      "storybook/scripts/swatches.ts",
      "storybook/test/unit/theme.test.ts",
      "storybook/test/integration/csp.test.ts",
      "storybook/package.json",
      "storybook/.generated/swatches.css",
      "storybook/.generated/tokens.css",
      "storybook/dist/index.html",
      "storybook/dist/iframe.html",
    ];
    const outOfScope = [
      "storybook/node_modules/storybook/dist/x.js",
      "storybook/stories/node_modules/x.js",
      "storybook/dist/assets/iframe-BZdWAMwh.js",
      "storybook/dist/assets/iframe-DMn9nMwa.css",
      "storybook/dist/sb-manager/runtime.js",
      "storybook/dist/sb-addons/storybook-1/manager-bundle.js",
      "storybook/dist/inline-0123456789abcdef.css",
      "storybook/dist/index.json",
      "storybook/dist/sub/x.html",
      "storybook/.generated/fonts/SchibstedGrotesk-wght.woff2",
      "storybook/README.md",
      "xstorybook/stories/x.ts",
      "gates/plants/prefix/a/tree/storybook/stories/x.ts",
    ];
    expect([...inScope, ...outOfScope].filter((file) => isCovered(file))).toEqual(inScope);
  });
});

describe("monospaceFamilies", () => {
  it("lists FR-022's monospace families, which the Storybook run-time check also uses", () => {
    expect([...monospaceFamilies].sort()).toEqual(
      [
        "monospace",
        "ui-monospace",
        "Menlo",
        "Monaco",
        "Consolas",
        "Courier",
        "Courier New",
        "SF Mono",
        "SFMono-Regular",
        "Liberation Mono",
        "DejaVu Sans Mono",
        "Lucida Console",
        "Roboto Mono",
        "Source Code Pro",
        "Fira Code",
        "Fira Mono",
        "JetBrains Mono",
        "Cascadia Code",
        "Cascadia Mono",
      ].sort(),
    );
  });

  it("are the families scanText reports in a font declaration", () => {
    for (const family of monospaceFamilies) {
      expect(scanText(path, `a { font-family: ${family}; }`)).toEqual([at(1, "monospace", mono(family))]);
    }
  });
});
