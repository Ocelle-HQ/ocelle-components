import { describe, expect, it } from "vitest";
import { json } from "../src/generate.ts";
import { cssName, tokenNames, tokens } from "../src/index.ts";
import { source } from "../src/source.ts";
import { excludedNames, expectedTokens } from "./expected.ts";

// The package entry (FR-009, contracts/token-package.md): the typed name list, the JSON data and cssName(). A name
// that is not a token does not typecheck (the @ts-expect-error line below fails the typecheck gate if it does), and
// cssName() also refuses it at run time.
describe("@ocelle/tokens", () => {
  it("exports tokenNames: exactly the names of Appendix A, none of A.6", () => {
    expect([...tokenNames].sort()).toEqual(expectedTokens.map((token) => token.name).sort());
    expect(tokenNames.filter((name) => excludedNames.includes(name))).toEqual([]);
  });

  it("exports tokens: the JSON export of the source", () => {
    expect(tokens).toStrictEqual(json(source));
    expect(tokens.tokens).toHaveLength(expectedTokens.length);
  });

  it("maps a token name to its custom property with cssName()", () => {
    expect([cssName("color-canvas"), cssName("gutter"), cssName("elevation-bar")]).toEqual(["--ocelle-color-canvas", "--ocelle-gutter", "--ocelle-elevation-bar"]);
  });

  it("does not accept a misspelt name, in the type checker or at run time", () => {
    expect(() =>
      // @ts-expect-error -- "color-canvs" is not a TokenName (FR-009)
      cssName("color-canvs"),
    ).toThrow(new Error("unknown token color-canvs"));
  });
});
