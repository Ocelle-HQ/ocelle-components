import { describe, expect, it } from "vitest";
import { styleGlobs } from "../bin/style-lint.ts";

// The style-lint gate's scope (FR-024, FR-028, research.md R-07; phase 4 review round 1, R1-08): the globs it gives
// Stylelint are the styles FR-024 covers, the TypeScript (style templates) and stylesheets of @ocelle/elements and the
// stylesheets of @ocelle/styles, inside or outside src/. The scope decides the gate's result, so it is asserted here;
// gates/test/integration/gates-root.test.ts and the style-lint plants check what Stylelint makes of it.
describe("styleGlobs", () => {
  it("covers the TypeScript and CSS of @ocelle/elements and the CSS of @ocelle/styles, at any depth", () => {
    expect(styleGlobs).toEqual(["packages/elements/**/*.ts", "packages/elements/**/*.css", "packages/styles/**/*.css"]);
  });
});
